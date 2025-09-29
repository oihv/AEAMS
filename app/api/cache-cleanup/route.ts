/**
 * Cache Cleanup Management API
 * Provides endpoints for managing AI suggestion cache cleanup operations
 */

import { NextRequest, NextResponse } from 'next/server'
import { CacheCleanupService } from '../../../lib/cache-cleanup'

/**
 * GET /api/cache-cleanup - Get cleanup status and statistics
 */
export async function GET() {
  try {
    const [status, cacheStats] = await Promise.all([
      CacheCleanupService.getStatus(),
      CacheCleanupService.getCacheStats()
    ])

    return NextResponse.json({
      success: true,
      data: {
        ...status,
        cacheStatistics: cacheStats
      }
    })
  } catch (error) {
    console.error('Cache cleanup status error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to get cleanup status',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

/**
 * POST /api/cache-cleanup - Execute manual cleanup operations
 * Body options:
 * - action: 'cleanup' | 'start-auto' | 'stop-auto' | 'configure'
 * - config?: Partial<CleanupConfig> (for configure action)
 * - rodId?: string (for rod-specific cleanup)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, config, rodId } = body

    if (!action || typeof action !== 'string') {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing or invalid action parameter',
          validActions: ['cleanup', 'start-auto', 'stop-auto', 'configure', 'cleanup-rod']
        },
        { status: 400 }
      )
    }

    switch (action) {
      case 'cleanup': {
        // Run manual cleanup
        const stats = await CacheCleanupService.runCleanup()
        
        return NextResponse.json({
          success: true,
          action: 'cleanup',
          data: {
            message: 'Manual cleanup completed successfully',
            statistics: stats
          }
        })
      }

      case 'start-auto': {
        // Start automatic cleanup
        CacheCleanupService.startAutoCleanup()
        
        return NextResponse.json({
          success: true,
          action: 'start-auto',
          data: {
            message: 'Automatic cleanup started',
            status: CacheCleanupService.getStatus()
          }
        })
      }

      case 'stop-auto': {
        // Stop automatic cleanup
        CacheCleanupService.stopAutoCleanup()
        
        return NextResponse.json({
          success: true,
          action: 'stop-auto',
          data: {
            message: 'Automatic cleanup stopped',
            status: CacheCleanupService.getStatus()
          }
        })
      }

      case 'configure': {
        // Update cleanup configuration
        if (!config || typeof config !== 'object') {
          return NextResponse.json(
            {
              success: false,
              error: 'Missing or invalid config parameter for configure action'
            },
            { status: 400 }
          )
        }

        CacheCleanupService.configure(config)
        
        return NextResponse.json({
          success: true,
          action: 'configure',
          data: {
            message: 'Configuration updated successfully',
            newConfig: CacheCleanupService.getConfig()
          }
        })
      }

      case 'cleanup-rod': {
        // Clean up specific rod
        if (!rodId || typeof rodId !== 'string') {
          return NextResponse.json(
            {
              success: false,
              error: 'Missing or invalid rodId parameter for cleanup-rod action'
            },
            { status: 400 }
          )
        }

        const deletedCount = await CacheCleanupService.cleanupRod(rodId)
        
        return NextResponse.json({
          success: true,
          action: 'cleanup-rod',
          data: {
            message: `Rod cleanup completed`,
            rodId,
            suggestionsDeleted: deletedCount
          }
        })
      }

      default: {
        return NextResponse.json(
          {
            success: false,
            error: `Unknown action: ${action}`,
            validActions: ['cleanup', 'start-auto', 'stop-auto', 'configure', 'cleanup-rod']
          },
          { status: 400 }
        )
      }
    }

  } catch (error) {
    console.error('Cache cleanup operation error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Cache cleanup operation failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/cache-cleanup - Clear all cache entries (dangerous operation)
 * Requires confirmation parameter
 */
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json()
    const { confirm } = body

    if (confirm !== 'DELETE_ALL_CACHE') {
      return NextResponse.json(
        {
          success: false,
          error: 'This operation requires confirmation. Include "confirm": "DELETE_ALL_CACHE" in request body.'
        },
        { status: 400 }
      )
    }

    // Execute complete cache clear by configuring TTL to 0 and running cleanup
    const originalConfig = CacheCleanupService.getConfig()
    
    // Temporarily set TTL to 0 to expire everything
    CacheCleanupService.configure({ 
      suggestionTtlHours: 0,
      maxSuggestionsPerRod: 0
    })
    
    const stats = await CacheCleanupService.runCleanup()
    
    // Restore original config
    CacheCleanupService.configure(originalConfig)

    return NextResponse.json({
      success: true,
      action: 'clear-all',
      data: {
        message: 'All cache entries cleared',
        statistics: stats,
        warning: 'All AI suggestions have been permanently deleted'
      }
    })

  } catch (error) {
    console.error('Cache clear operation error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Cache clear operation failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}