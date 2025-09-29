/**
 * Cache Cleanup and Expiration Service
 * Manages automatic cleanup of expired AI suggestions to prevent database bloat
 */

import { prisma } from './prisma'
import { cacheMonitor } from './cache-monitor'

export interface CleanupConfig {
  // How long suggestions remain valid (in hours)
  suggestionTtlHours: number
  
  // Maximum number of suggestions to keep per rod (keeps most recent)
  maxSuggestionsPerRod: number
  
  // How often to run cleanup (in hours)
  cleanupIntervalHours: number
  
  // Whether to log cleanup operations
  enableLogging: boolean
}

export interface CleanupStats {
  expiredSuggestions: number
  excessSuggestions: number
  totalDeleted: number
  cleanupDuration: number
  timestamp: Date
}

/**
 * Default configuration for cache cleanup
 */
const DEFAULT_CONFIG: CleanupConfig = {
  suggestionTtlHours: 24, // Suggestions expire after 24 hours
  maxSuggestionsPerRod: 50, // Keep max 50 suggestions per rod
  cleanupIntervalHours: 6, // Run cleanup every 6 hours
  enableLogging: true
}

export class CacheCleanupService {
  private static config: CleanupConfig = DEFAULT_CONFIG
  private static cleanupTimer: NodeJS.Timeout | null = null
  private static lastCleanup: Date | null = null

  /**
   * Update cleanup configuration
   */
  static configure(newConfig: Partial<CleanupConfig>): void {
    this.config = { ...this.config, ...newConfig }
    
    // Restart timer with new interval if it's running
    if (this.cleanupTimer) {
      this.stopAutoCleanup()
      this.startAutoCleanup()
    }
  }

  /**
   * Get current cleanup configuration
   */
  static getConfig(): CleanupConfig {
    return { ...this.config }
  }

  /**
   * Start automatic cleanup timer
   */
  static startAutoCleanup(): void {
    if (this.cleanupTimer) {
      this.stopAutoCleanup()
    }

    const intervalMs = this.config.cleanupIntervalHours * 60 * 60 * 1000
    
    this.cleanupTimer = setInterval(async () => {
      try {
        const stats = await this.runCleanup()
        if (this.config.enableLogging) {
          console.log(`🧹 Auto cleanup completed:`, stats)
        }
      } catch (error) {
        console.error('🧹 Auto cleanup failed:', error)
        cacheMonitor.recordCacheError(`Auto cleanup failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }, intervalMs)

    if (this.config.enableLogging) {
      console.log(`🧹 Auto cleanup started (interval: ${this.config.cleanupIntervalHours}h)`)
    }
  }

  /**
   * Stop automatic cleanup timer
   */
  static stopAutoCleanup(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer)
      this.cleanupTimer = null
      
      if (this.config.enableLogging) {
        console.log('🧹 Auto cleanup stopped')
      }
    }
  }

  /**
   * Run manual cleanup and return statistics
   */
  static async runCleanup(): Promise<CleanupStats> {
    const startTime = Date.now()
    let expiredSuggestions = 0
    let excessSuggestions = 0

    try {
      // 1. Clean expired suggestions
      const expiredCutoff = new Date(Date.now() - (this.config.suggestionTtlHours * 60 * 60 * 1000))
      
      const expiredResult = await prisma.aISuggestion.deleteMany({
        where: {
          createdAt: {
            lt: expiredCutoff
          }
        }
      })
      
      expiredSuggestions = expiredResult.count

      // 2. Clean excess suggestions per rod (keep most recent N per rod)
      if (this.config.maxSuggestionsPerRod > 0) {
        // Get all secondary rods that have more than the max allowed suggestions
        const rodCounts = await prisma.aISuggestion.groupBy({
          by: ['secondaryRodId'],
          _count: {
            id: true
          },
          having: {
            id: {
              _count: {
                gt: this.config.maxSuggestionsPerRod
              }
            }
          }
        })

        // For each rod with excess suggestions, delete the oldest ones
        for (const rodCount of rodCounts) {
          const excess = rodCount._count.id - this.config.maxSuggestionsPerRod
          
          // Find the oldest suggestions for this rod
          const oldestSuggestions = await prisma.aISuggestion.findMany({
            where: {
              secondaryRodId: rodCount.secondaryRodId
            },
            orderBy: {
              createdAt: 'asc'
            },
            take: excess,
            select: {
              id: true
            }
          })

          if (oldestSuggestions.length > 0) {
            const deleteResult = await prisma.aISuggestion.deleteMany({
              where: {
                id: {
                  in: oldestSuggestions.map(s => s.id)
                }
              }
            })
            
            excessSuggestions += deleteResult.count
          }
        }
      }

      const cleanupDuration = Date.now() - startTime
      this.lastCleanup = new Date()

      const stats: CleanupStats = {
        expiredSuggestions,
        excessSuggestions,
        totalDeleted: expiredSuggestions + excessSuggestions,
        cleanupDuration,
        timestamp: this.lastCleanup
      }

      if (this.config.enableLogging && stats.totalDeleted > 0) {
        console.log(`🧹 Cache cleanup completed: deleted ${stats.totalDeleted} suggestions (${expiredSuggestions} expired, ${excessSuggestions} excess) in ${cleanupDuration}ms`)
      }

      return stats

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      cacheMonitor.recordDbError(`Cache cleanup failed: ${errorMessage}`)
      throw error
    }
  }

  /**
   * Check if a suggestion should be considered stale
   */
  static isSuggestionStale(createdAt: Date): boolean {
    const staleThreshold = Date.now() - (this.config.suggestionTtlHours * 60 * 60 * 1000)
    return createdAt.getTime() < staleThreshold
  }

  /**
   * Get cache statistics for monitoring
   */
  static async getCacheStats(): Promise<{
    totalSuggestions: number
    suggestionsByModel: { rule_based: number; deepseek: number }
    suggestionsByAge: { fresh: number; stale: number }
    suggestionsByRod: { rodId: string; count: number }[]
    lastCleanup: Date | null
    nextCleanup: Date | null
  }> {
    const total = await prisma.aISuggestion.count()
    
    const byModel = await prisma.aISuggestion.groupBy({
      by: ['model'],
      _count: {
        id: true
      }
    })

    const modelStats = {
      rule_based: byModel.find(m => m.model === 'rule_based')?._count.id || 0,
      deepseek: byModel.find(m => m.model === 'deepseek')?._count.id || 0
    }

    const staleThreshold = new Date(Date.now() - (this.config.suggestionTtlHours * 60 * 60 * 1000))
    
    const staleCount = await prisma.aISuggestion.count({
      where: {
        createdAt: {
          lt: staleThreshold
        }
      }
    })

    const byRod = await prisma.aISuggestion.groupBy({
      by: ['secondaryRodId'],
      _count: {
        id: true
      },
      orderBy: {
        _count: {
          id: 'desc'
        }
      },
      take: 20 // Top 20 rods by suggestion count
    })

    const nextCleanup = this.cleanupTimer && this.lastCleanup 
      ? new Date(this.lastCleanup.getTime() + (this.config.cleanupIntervalHours * 60 * 60 * 1000))
      : null

    return {
      totalSuggestions: total,
      suggestionsByModel: modelStats,
      suggestionsByAge: {
        fresh: total - staleCount,
        stale: staleCount
      },
      suggestionsByRod: byRod.map(r => ({
        rodId: r.secondaryRodId,
        count: r._count.id
      })),
      lastCleanup: this.lastCleanup,
      nextCleanup
    }
  }

  /**
   * Force cleanup of a specific rod's suggestions
   */
  static async cleanupRod(secondaryRodId: string, keepCount: number = this.config.maxSuggestionsPerRod): Promise<number> {
    try {
      const totalCount = await prisma.aISuggestion.count({
        where: { secondaryRodId }
      })

      if (totalCount <= keepCount) {
        return 0 // Nothing to clean
      }

      const excessCount = totalCount - keepCount
      
      // Find oldest suggestions for this rod
      const oldestSuggestions = await prisma.aISuggestion.findMany({
        where: { secondaryRodId },
        orderBy: { createdAt: 'asc' },
        take: excessCount,
        select: { id: true }
      })

      const deleteResult = await prisma.aISuggestion.deleteMany({
        where: {
          id: {
            in: oldestSuggestions.map(s => s.id)
          }
        }
      })

      if (this.config.enableLogging && deleteResult.count > 0) {
        console.log(`🧹 Cleaned up rod ${secondaryRodId}: deleted ${deleteResult.count} old suggestions`)
      }

      return deleteResult.count

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      cacheMonitor.recordDbError(`Rod cleanup failed: ${errorMessage}`)
      throw error
    }
  }

  /**
   * Get cleanup service status
   */
  static getStatus(): {
    isAutoCleanupRunning: boolean
    config: CleanupConfig
    lastCleanup: Date | null
    nextCleanup: Date | null
  } {
    const nextCleanup = this.cleanupTimer && this.lastCleanup 
      ? new Date(this.lastCleanup.getTime() + (this.config.cleanupIntervalHours * 60 * 60 * 1000))
      : null

    return {
      isAutoCleanupRunning: this.cleanupTimer !== null,
      config: this.getConfig(),
      lastCleanup: this.lastCleanup,
      nextCleanup
    }
  }
}

// Export default configuration for testing
export { DEFAULT_CONFIG }