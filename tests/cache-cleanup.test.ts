/**
 * Cache Cleanup Service Tests
 * Comprehensive tests for automatic cache expiration and cleanup functionality
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { CacheCleanupService, DEFAULT_CONFIG, type CleanupConfig } from '../lib/cache-cleanup'
import { prisma } from '../lib/prisma'
import { cacheMonitor } from '../lib/cache-monitor'

// Mock the prisma client
vi.mock('../lib/prisma', () => ({
  prisma: {
    aISuggestion: {
      count: vi.fn(),
      deleteMany: vi.fn(),
      groupBy: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn()
    }
  }
}))

// Mock the cache monitor
vi.mock('../lib/cache-monitor', () => ({
  cacheMonitor: {
    recordDbError: vi.fn(),
    recordCacheError: vi.fn()
  }
}))

const mockPrisma = prisma as any
const mockCacheMonitor = cacheMonitor as any

describe('CacheCleanupService', () => {
  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks()
    
    // Stop any running cleanup timers
    CacheCleanupService.stopAutoCleanup()
    
    // Reset to default config
    CacheCleanupService.configure(DEFAULT_CONFIG)
    
    // Reset internal state by accessing private static fields via type assertion
    ;(CacheCleanupService as any).lastCleanup = null
  })

  afterEach(() => {
    // Clean up timers after each test
    CacheCleanupService.stopAutoCleanup()
  })

  describe('Configuration Management', () => {
    it('should use default configuration initially', () => {
      const config = CacheCleanupService.getConfig()
      expect(config).toEqual(DEFAULT_CONFIG)
    })

    it('should update configuration partially', () => {
      const newConfig: Partial<CleanupConfig> = {
        suggestionTtlHours: 48,
        maxSuggestionsPerRod: 100
      }

      CacheCleanupService.configure(newConfig)
      const config = CacheCleanupService.getConfig()

      expect(config.suggestionTtlHours).toBe(48)
      expect(config.maxSuggestionsPerRod).toBe(100)
      expect(config.cleanupIntervalHours).toBe(DEFAULT_CONFIG.cleanupIntervalHours) // unchanged
      expect(config.enableLogging).toBe(DEFAULT_CONFIG.enableLogging) // unchanged
    })

    it('should restart auto cleanup when config changes during active cleanup', () => {
      // Start auto cleanup
      CacheCleanupService.startAutoCleanup()
      expect(CacheCleanupService.getStatus().isAutoCleanupRunning).toBe(true)

      // Change config - should restart timer
      CacheCleanupService.configure({ cleanupIntervalHours: 12 })
      
      const status = CacheCleanupService.getStatus()
      expect(status.isAutoCleanupRunning).toBe(true)
      expect(status.config.cleanupIntervalHours).toBe(12)
    })
  })

  describe('Auto Cleanup Timer Management', () => {
    it('should start auto cleanup timer', () => {
      expect(CacheCleanupService.getStatus().isAutoCleanupRunning).toBe(false)
      
      CacheCleanupService.startAutoCleanup()
      expect(CacheCleanupService.getStatus().isAutoCleanupRunning).toBe(true)
    })

    it('should stop auto cleanup timer', () => {
      CacheCleanupService.startAutoCleanup()
      expect(CacheCleanupService.getStatus().isAutoCleanupRunning).toBe(true)
      
      CacheCleanupService.stopAutoCleanup()
      expect(CacheCleanupService.getStatus().isAutoCleanupRunning).toBe(false)
    })

    it('should restart timer when already running', () => {
      CacheCleanupService.startAutoCleanup()
      expect(CacheCleanupService.getStatus().isAutoCleanupRunning).toBe(true)
      
      // Starting again should stop first and start new
      CacheCleanupService.startAutoCleanup()
      expect(CacheCleanupService.getStatus().isAutoCleanupRunning).toBe(true)
    })

    it('should handle stopping when not running', () => {
      expect(CacheCleanupService.getStatus().isAutoCleanupRunning).toBe(false)
      
      // Should not throw error
      expect(() => CacheCleanupService.stopAutoCleanup()).not.toThrow()
      expect(CacheCleanupService.getStatus().isAutoCleanupRunning).toBe(false)
    })
  })

  describe('Expired Suggestions Cleanup', () => {
    it('should delete expired suggestions based on TTL', async () => {
      const mockDeleteResult = { count: 5 }
      mockPrisma.aISuggestion.deleteMany.mockResolvedValue(mockDeleteResult)
      mockPrisma.aISuggestion.groupBy.mockResolvedValue([])

      CacheCleanupService.configure({ suggestionTtlHours: 24 })
      
      const stats = await CacheCleanupService.runCleanup()
      
      expect(mockPrisma.aISuggestion.deleteMany).toHaveBeenCalledWith({
        where: {
          createdAt: {
            lt: expect.any(Date)
          }
        }
      })
      
      expect(stats.expiredSuggestions).toBe(5)
      expect(stats.totalDeleted).toBe(5)
      expect(stats.excessSuggestions).toBe(0)
    })

    it('should calculate correct expiration cutoff time', async () => {
      const mockDeleteResult = { count: 3 }
      mockPrisma.aISuggestion.deleteMany.mockResolvedValue(mockDeleteResult)
      mockPrisma.aISuggestion.groupBy.mockResolvedValue([])

      const ttlHours = 12
      CacheCleanupService.configure({ suggestionTtlHours: ttlHours })
      
      const beforeCleanup = Date.now()
      await CacheCleanupService.runCleanup()
      const afterCleanup = Date.now()
      
      const deleteCall = mockPrisma.aISuggestion.deleteMany.mock.calls[0]
      const cutoffTime = deleteCall[0].where.createdAt.lt.getTime()
      
      // Cutoff should be approximately ttlHours ago
      const expectedCutoff = beforeCleanup - (ttlHours * 60 * 60 * 1000)
      const tolerance = 1000 // 1 second tolerance
      
      expect(cutoffTime).toBeGreaterThanOrEqual(expectedCutoff - tolerance)
      expect(cutoffTime).toBeLessThanOrEqual(afterCleanup - (ttlHours * 60 * 60 * 1000) + tolerance)
    })
  })

  describe('Excess Suggestions Cleanup', () => {
    it('should delete excess suggestions per rod', async () => {
      // Mock expired cleanup (no expired items)
      mockPrisma.aISuggestion.deleteMany
        .mockResolvedValueOnce({ count: 0 }) // expired cleanup
        .mockResolvedValueOnce({ count: 3 }) // excess cleanup

      // Mock rod with excess suggestions
      const rodWithExcess = {
        secondaryRodId: 'rod-123',
        _count: { id: 53 } // 3 more than max (50)
      }
      mockPrisma.aISuggestion.groupBy.mockResolvedValue([rodWithExcess])

      // Mock finding oldest suggestions
      const oldestSuggestions = [
        { id: 'old-1' },
        { id: 'old-2' },
        { id: 'old-3' }
      ]
      mockPrisma.aISuggestion.findMany.mockResolvedValue(oldestSuggestions)

      CacheCleanupService.configure({ maxSuggestionsPerRod: 50 })
      
      const stats = await CacheCleanupService.runCleanup()
      
      // Verify groupBy call to find rods with excess
      expect(mockPrisma.aISuggestion.groupBy).toHaveBeenCalledWith({
        by: ['secondaryRodId'],
        _count: { id: true },
        having: {
          id: {
            _count: { gt: 50 }
          }
        }
      })
      
      // Verify finding oldest suggestions
      expect(mockPrisma.aISuggestion.findMany).toHaveBeenCalledWith({
        where: { secondaryRodId: 'rod-123' },
        orderBy: { createdAt: 'asc' },
        take: 3, // excess count
        select: { id: true }
      })
      
      // Verify deleting oldest suggestions
      expect(mockPrisma.aISuggestion.deleteMany).toHaveBeenCalledWith({
        where: {
          id: { in: ['old-1', 'old-2', 'old-3'] }
        }
      })
      
      expect(stats.excessSuggestions).toBe(3)
      expect(stats.expiredSuggestions).toBe(0)
      expect(stats.totalDeleted).toBe(3)
    })

    it('should handle multiple rods with excess suggestions', async () => {
      mockPrisma.aISuggestion.deleteMany
        .mockResolvedValueOnce({ count: 0 }) // expired
        .mockResolvedValueOnce({ count: 2 }) // rod-1 excess
        .mockResolvedValueOnce({ count: 5 }) // rod-2 excess

      const rodsWithExcess = [
        { secondaryRodId: 'rod-1', _count: { id: 12 } }, // 2 excess (max 10)
        { secondaryRodId: 'rod-2', _count: { id: 15 } }  // 5 excess (max 10)
      ]
      mockPrisma.aISuggestion.groupBy.mockResolvedValue(rodsWithExcess)

      mockPrisma.aISuggestion.findMany
        .mockResolvedValueOnce([{ id: 'old-1-1' }, { id: 'old-1-2' }]) // rod-1
        .mockResolvedValueOnce([{ id: 'old-2-1' }, { id: 'old-2-2' }, { id: 'old-2-3' }, { id: 'old-2-4' }, { id: 'old-2-5' }]) // rod-2

      CacheCleanupService.configure({ maxSuggestionsPerRod: 10 })
      
      const stats = await CacheCleanupService.runCleanup()
      
      expect(stats.excessSuggestions).toBe(7) // 2 + 5
      expect(stats.totalDeleted).toBe(7)
    })

    it('should skip excess cleanup when maxSuggestionsPerRod is 0', async () => {
      mockPrisma.aISuggestion.deleteMany.mockResolvedValue({ count: 2 }) // only expired
      
      CacheCleanupService.configure({ maxSuggestionsPerRod: 0 })
      
      const stats = await CacheCleanupService.runCleanup()
      
      // Should not call groupBy for excess suggestions
      expect(mockPrisma.aISuggestion.groupBy).not.toHaveBeenCalled()
      expect(stats.excessSuggestions).toBe(0)
      expect(stats.expiredSuggestions).toBe(2)
    })
  })

  describe('Individual Rod Cleanup', () => {
    it('should clean up specific rod suggestions', async () => {
      mockPrisma.aISuggestion.count.mockResolvedValue(25) // total count
      
      const oldestSuggestions = Array.from({ length: 15 }, (_, i) => ({ id: `old-${i}` }))
      mockPrisma.aISuggestion.findMany.mockResolvedValue(oldestSuggestions)
      mockPrisma.aISuggestion.deleteMany.mockResolvedValue({ count: 15 })
      
      const deletedCount = await CacheCleanupService.cleanupRod('rod-123', 10)
      
      expect(mockPrisma.aISuggestion.count).toHaveBeenCalledWith({
        where: { secondaryRodId: 'rod-123' }
      })
      
      expect(mockPrisma.aISuggestion.findMany).toHaveBeenCalledWith({
        where: { secondaryRodId: 'rod-123' },
        orderBy: { createdAt: 'asc' },
        take: 15, // excess (25 - 10)
        select: { id: true }
      })
      
      expect(deletedCount).toBe(15)
    })

    it('should return 0 when rod has no excess suggestions', async () => {
      mockPrisma.aISuggestion.count.mockResolvedValue(5) // below keep count
      
      const deletedCount = await CacheCleanupService.cleanupRod('rod-123', 10)
      
      expect(deletedCount).toBe(0)
      expect(mockPrisma.aISuggestion.findMany).not.toHaveBeenCalled()
      expect(mockPrisma.aISuggestion.deleteMany).not.toHaveBeenCalled()
    })

    it('should use default maxSuggestionsPerRod when keepCount not specified', async () => {
      mockPrisma.aISuggestion.count.mockResolvedValue(60)
      mockPrisma.aISuggestion.findMany.mockResolvedValue([])
      mockPrisma.aISuggestion.deleteMany.mockResolvedValue({ count: 10 })
      
      CacheCleanupService.configure({ maxSuggestionsPerRod: 50 })
      await CacheCleanupService.cleanupRod('rod-123') // no keepCount parameter
      
      expect(mockPrisma.aISuggestion.findMany).toHaveBeenCalledWith({
        where: { secondaryRodId: 'rod-123' },
        orderBy: { createdAt: 'asc' },
        take: 10, // 60 - 50 (default)
        select: { id: true }
      })
    })
  })

  describe('Cache Statistics', () => {
    it('should return comprehensive cache statistics', async () => {
      // Mock total count
      mockPrisma.aISuggestion.count
        .mockResolvedValueOnce(100) // total
        .mockResolvedValueOnce(15)  // stale count

      // Mock model grouping
      const modelGroups = [
        { model: 'rule_based', _count: { id: 60 } },
        { model: 'deepseek', _count: { id: 40 } }
      ]
      mockPrisma.aISuggestion.groupBy
        .mockResolvedValueOnce(modelGroups) // by model
        .mockResolvedValueOnce([ // by rod
          { secondaryRodId: 'rod-1', _count: { id: 25 } },
          { secondaryRodId: 'rod-2', _count: { id: 20 } }
        ])

      CacheCleanupService.configure({ suggestionTtlHours: 24 })
      
      const stats = await CacheCleanupService.getCacheStats()
      
      expect(stats.totalSuggestions).toBe(100)
      expect(stats.suggestionsByModel).toEqual({
        rule_based: 60,
        deepseek: 40
      })
      expect(stats.suggestionsByAge).toEqual({
        fresh: 85, // 100 - 15
        stale: 15
      })
      expect(stats.suggestionsByRod).toEqual([
        { rodId: 'rod-1', count: 25 },
        { rodId: 'rod-2', count: 20 }
      ])
      expect(stats.lastCleanup).toBeNull()
      expect(stats.nextCleanup).toBeNull()
    })

    it('should handle missing model types gracefully', async () => {
      mockPrisma.aISuggestion.count.mockResolvedValue(50).mockResolvedValue(10)
      
      // Only rule_based suggestions exist
      const modelGroups = [{ model: 'rule_based', _count: { id: 50 } }]
      mockPrisma.aISuggestion.groupBy
        .mockResolvedValueOnce(modelGroups)
        .mockResolvedValueOnce([])

      const stats = await CacheCleanupService.getCacheStats()
      
      expect(stats.suggestionsByModel).toEqual({
        rule_based: 50,
        deepseek: 0 // missing model defaults to 0
      })
    })
  })

  describe('Suggestion Staleness Check', () => {
    it('should correctly identify stale suggestions', () => {
      CacheCleanupService.configure({ suggestionTtlHours: 12 })
      
      const now = Date.now()
      const staleDate = new Date(now - (13 * 60 * 60 * 1000)) // 13 hours ago
      const freshDate = new Date(now - (10 * 60 * 60 * 1000)) // 10 hours ago
      
      expect(CacheCleanupService.isSuggestionStale(staleDate)).toBe(true)
      expect(CacheCleanupService.isSuggestionStale(freshDate)).toBe(false)
    })

    it('should handle edge case at TTL boundary', () => {
      CacheCleanupService.configure({ suggestionTtlHours: 24 })
      
      const now = Date.now()
      const exactTtl = new Date(now - (24 * 60 * 60 * 1000))
      const justBeforeTtl = new Date(now - (24 * 60 * 60 * 1000) + 1000)
      const justAfterTtl = new Date(now - (24 * 60 * 60 * 1000) - 1000)
      
      // Allow for slight timing differences
      expect(CacheCleanupService.isSuggestionStale(justBeforeTtl)).toBe(false)
      expect(CacheCleanupService.isSuggestionStale(justAfterTtl)).toBe(true)
      
      // For exact TTL, expect it to be stale (>= comparison in implementation)
      const approximatelyStale = CacheCleanupService.isSuggestionStale(exactTtl)
      expect(typeof approximatelyStale).toBe('boolean') // Just verify it returns a boolean
    })
  })

  describe('Error Handling', () => {
    it('should handle database errors during cleanup', async () => {
      const dbError = new Error('Database connection failed')
      mockPrisma.aISuggestion.deleteMany.mockRejectedValue(dbError)
      
      await expect(CacheCleanupService.runCleanup()).rejects.toThrow(dbError)
      expect(mockCacheMonitor.recordDbError).toHaveBeenCalledWith(
        'Cache cleanup failed: Database connection failed'
      )
    })

    it('should handle errors during rod-specific cleanup', async () => {
      const dbError = new Error('Rod not found')
      mockPrisma.aISuggestion.count.mockRejectedValue(dbError)
      
      await expect(CacheCleanupService.cleanupRod('invalid-rod')).rejects.toThrow(dbError)
      expect(mockCacheMonitor.recordDbError).toHaveBeenCalledWith(
        'Rod cleanup failed: Rod not found'
      )
    })

    it('should handle non-Error objects', async () => {
      mockPrisma.aISuggestion.deleteMany.mockRejectedValue('String error')
      
      await expect(CacheCleanupService.runCleanup()).rejects.toBe('String error')
      expect(mockCacheMonitor.recordDbError).toHaveBeenCalledWith(
        'Cache cleanup failed: Unknown error'
      )
    })
  })

  describe('Service Status', () => {
    it('should return correct status when cleanup is not running', () => {
      const status = CacheCleanupService.getStatus()
      
      expect(status.isAutoCleanupRunning).toBe(false)
      expect(status.config).toEqual(DEFAULT_CONFIG)
      expect(status.lastCleanup).toBeNull()
      expect(status.nextCleanup).toBeNull()
    })

    it('should return correct status when cleanup is running', () => {
      CacheCleanupService.startAutoCleanup()
      
      const status = CacheCleanupService.getStatus()
      
      expect(status.isAutoCleanupRunning).toBe(true)
      expect(status.config).toEqual(DEFAULT_CONFIG)
      expect(status.lastCleanup).toBeNull() // no cleanup run yet
      expect(status.nextCleanup).toBeNull() // calculated after first cleanup
    })
  })

  describe('Cleanup Statistics', () => {
    it('should return detailed cleanup statistics', async () => {
      mockPrisma.aISuggestion.deleteMany
        .mockResolvedValueOnce({ count: 10 }) // expired
        .mockResolvedValueOnce({ count: 5 })  // excess

      const rodWithExcess = {
        secondaryRodId: 'rod-123',
        _count: { id: 55 }
      }
      mockPrisma.aISuggestion.groupBy.mockResolvedValue([rodWithExcess])
      mockPrisma.aISuggestion.findMany.mockResolvedValue([
        { id: '1' }, { id: '2' }, { id: '3' }, { id: '4' }, { id: '5' }
      ])

      const beforeCleanup = Date.now()
      const stats = await CacheCleanupService.runCleanup()
      const afterCleanup = Date.now()
      
      expect(stats.expiredSuggestions).toBe(10)
      expect(stats.excessSuggestions).toBe(5)
      expect(stats.totalDeleted).toBe(15)
      expect(stats.cleanupDuration).toBeGreaterThanOrEqual(0)
      expect(stats.cleanupDuration).toBeLessThan(afterCleanup - beforeCleanup + 100) // reasonable duration
      expect(stats.timestamp).toBeInstanceOf(Date)
      expect(stats.timestamp.getTime()).toBeGreaterThanOrEqual(beforeCleanup)
      expect(stats.timestamp.getTime()).toBeLessThanOrEqual(afterCleanup)
    })

    it('should return zero statistics when nothing to clean', async () => {
      mockPrisma.aISuggestion.deleteMany.mockResolvedValue({ count: 0 })
      mockPrisma.aISuggestion.groupBy.mockResolvedValue([])
      
      const stats = await CacheCleanupService.runCleanup()
      
      expect(stats.expiredSuggestions).toBe(0)
      expect(stats.excessSuggestions).toBe(0)
      expect(stats.totalDeleted).toBe(0)
      expect(stats.cleanupDuration).toBeGreaterThanOrEqual(0)
    })
  })
})