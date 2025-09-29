/**
 * Cache Performance Monitor Tests
 * Tests the cache monitoring and metrics collection functionality
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { CachePerformanceMonitor } from '../lib/cache-monitor'

describe('CachePerformanceMonitor', () => {
  let monitor: CachePerformanceMonitor

  beforeEach(() => {
    monitor = new CachePerformanceMonitor()
  })

  describe('Basic Operations', () => {
    it('should initialize with empty metrics', () => {
      const metrics = monitor.getMetrics()
      
      expect(metrics.totalRequests).toBe(0)
      expect(metrics.cacheHits).toBe(0)
      expect(metrics.cacheMisses).toBe(0)
      expect(metrics.hitRate).toBe(0)
      expect(metrics.averageResponseTime).toBe(0)
      expect(metrics.modelTypeStats.rule_based).toBe(0)
      expect(metrics.modelTypeStats.deepseek).toBe(0)
    })

    it('should record cache hits correctly', () => {
      monitor.recordCacheHit(50, 'rule_based', 'rod1', 'reading1')
      monitor.recordCacheHit(75, 'deepseek', 'rod2', 'reading2')
      
      const metrics = monitor.getMetrics()
      expect(metrics.totalRequests).toBe(2)
      expect(metrics.cacheHits).toBe(2)
      expect(metrics.cacheMisses).toBe(0)
      expect(metrics.hitRate).toBe(1.0)
      expect(metrics.averageResponseTime).toBe(62.5) // (50 + 75) / 2
      expect(metrics.modelTypeStats.rule_based).toBe(1)
      expect(metrics.modelTypeStats.deepseek).toBe(1)
    })

    it('should record cache misses correctly', () => {
      monitor.recordCacheMiss(200, 'rule_based', 'rod1', 'reading1')
      monitor.recordCacheMiss(300, 'deepseek', 'rod2', 'reading2')
      
      const metrics = monitor.getMetrics()
      expect(metrics.totalRequests).toBe(2)
      expect(metrics.cacheHits).toBe(0)
      expect(metrics.cacheMisses).toBe(2)
      expect(metrics.hitRate).toBe(0)
      expect(metrics.averageResponseTime).toBe(250) // (200 + 300) / 2
      expect(metrics.modelTypeStats.rule_based).toBe(1)
      expect(metrics.modelTypeStats.deepseek).toBe(1)
    })

    it('should calculate hit rate correctly with mixed operations', () => {
      // 3 hits, 2 misses = 60% hit rate
      monitor.recordCacheHit(50, 'rule_based', 'rod1', 'reading1')
      monitor.recordCacheHit(60, 'rule_based', 'rod1', 'reading2')
      monitor.recordCacheHit(70, 'rule_based', 'rod1', 'reading3')
      monitor.recordCacheMiss(200, 'deepseek', 'rod2', 'reading4')
      monitor.recordCacheMiss(300, 'deepseek', 'rod2', 'reading5')
      
      const metrics = monitor.getMetrics()
      expect(metrics.totalRequests).toBe(5)
      expect(metrics.cacheHits).toBe(3)
      expect(metrics.cacheMisses).toBe(2)
      expect(metrics.hitRate).toBe(0.6)
      expect(metrics.averageResponseTime).toBe(136) // (50+60+70+200+300)/5
    })
  })

  describe('Error Tracking', () => {
    it('should record AI errors', () => {
      monitor.recordAiError(500, 'OpenAI API timeout', 'rod1', 'reading1')
      monitor.recordAiError(300, 'HuggingFace permission denied', 'rod2', 'reading2')
      
      const metrics = monitor.getMetrics()
      expect(metrics.errorStats.aiErrors).toBe(2)
      expect(metrics.errorStats.cacheErrors).toBe(0)
      expect(metrics.errorStats.dbErrors).toBe(0)
      
      const events = monitor.getRecentEvents(5)
      expect(events).toHaveLength(2)
      expect(events[0].type).toBe('ai_error')
      expect(events[0].errorMessage).toBe('HuggingFace permission denied')
    })

    it('should record cache errors', () => {
      monitor.recordCacheError('Cache lookup failed', 'rod1', 'reading1')
      
      const metrics = monitor.getMetrics()
      expect(metrics.errorStats.cacheErrors).toBe(1)
      
      const events = monitor.getRecentEvents(5)
      expect(events[0].type).toBe('cache_error')
      expect(events[0].errorMessage).toBe('Cache lookup failed')
    })

    it('should record database errors', () => {
      monitor.recordDbError('Prisma connection failed', 'rod1', 'reading1')
      
      const metrics = monitor.getMetrics()
      expect(metrics.errorStats.dbErrors).toBe(1)
      
      const events = monitor.getRecentEvents(5)
      expect(events[0].type).toBe('db_error')
      expect(events[0].errorMessage).toBe('Prisma connection failed')
    })
  })

  describe('Event Management', () => {
    it('should return recent events in reverse chronological order', async () => {
      monitor.recordCacheHit(50, 'rule_based', 'rod1', 'reading1')
      // Small delay to ensure different timestamps
      await new Promise(resolve => setTimeout(resolve, 5))
      monitor.recordCacheMiss(100, 'deepseek', 'rod2', 'reading2')
      
      const events = monitor.getRecentEvents(5)
      expect(events).toHaveLength(2)
      // Most recent first
      expect(events[0].type).toBe('cache_miss')
      expect(events[1].type).toBe('cache_hit')
    })

    it('should limit events to specified count', () => {
      // Add 10 events
      for (let i = 0; i < 10; i++) {
        monitor.recordCacheHit(50, 'rule_based', `rod${i}`, `reading${i}`)
      }
      
      const events = monitor.getRecentEvents(5)
      expect(events).toHaveLength(5)
    })

    it('should handle time range queries', async () => {
      const startTime = new Date()
      monitor.recordCacheHit(50, 'rule_based', 'rod1', 'reading1')
      
      await new Promise(resolve => setTimeout(resolve, 5))
      const middleTime = new Date()
      monitor.recordCacheMiss(100, 'deepseek', 'rod2', 'reading2')
      
      await new Promise(resolve => setTimeout(resolve, 5))
      const endTime = new Date()
      
      const eventsInRange = monitor.getEventsInRange(middleTime, endTime)
      expect(eventsInRange).toHaveLength(1)
      expect(eventsInRange[0].type).toBe('cache_miss')
    })
  })

  describe('Rod-Specific Metrics', () => {
    it('should track metrics per rod', () => {
      monitor.recordCacheHit(50, 'rule_based', 'rod1', 'reading1')
      monitor.recordCacheHit(60, 'rule_based', 'rod1', 'reading2')
      monitor.recordCacheMiss(200, 'deepseek', 'rod1', 'reading3')
      
      monitor.recordCacheHit(70, 'rule_based', 'rod2', 'reading4')
      monitor.recordCacheMiss(300, 'deepseek', 'rod2', 'reading5')
      monitor.recordCacheMiss(400, 'deepseek', 'rod2', 'reading6')
      
      const rod1Metrics = monitor.getRodMetrics('rod1')
      expect(rod1Metrics.hits).toBe(2)
      expect(rod1Metrics.misses).toBe(1)
      expect(rod1Metrics.hitRate).toBeCloseTo(0.667, 2)
      
      const rod2Metrics = monitor.getRodMetrics('rod2')
      expect(rod2Metrics.hits).toBe(1)
      expect(rod2Metrics.misses).toBe(2)
      expect(rod2Metrics.hitRate).toBeCloseTo(0.333, 2)
    })

    it('should handle numeric rod IDs', () => {
      monitor.recordCacheHit(50, 'rule_based', 123, 'reading1')
      monitor.recordCacheMiss(100, 'deepseek', 123, 'reading2')
      
      const rodMetrics = monitor.getRodMetrics(123)
      expect(rodMetrics.hits).toBe(1)
      expect(rodMetrics.misses).toBe(1)
      expect(rodMetrics.hitRate).toBe(0.5)
    })
  })

  describe('Summary Reports', () => {
    it('should generate comprehensive summary report', () => {
      monitor.recordCacheHit(50, 'rule_based', 'rod1', 'reading1')
      monitor.recordCacheHit(75, 'deepseek', 'rod2', 'reading2')
      monitor.recordCacheMiss(200, 'rule_based', 'rod3', 'reading3')
      monitor.recordAiError(500, 'API timeout', 'rod4', 'reading4')
      
      const report = monitor.getSummaryReport()
      
      expect(report).toContain('Total Requests: 3')
      expect(report).toContain('Cache Hit Rate: 66.7%')
      expect(report).toContain('Rule-based: 2 requests')
      expect(report).toContain('DeepSeek AI: 1 requests')
      expect(report).toContain('AI API Errors: 1')
      expect(report).toContain('Performance Insights')
    })

    it('should provide performance insights', () => {
      // Test high hit rate insight
      for (let i = 0; i < 9; i++) {
        monitor.recordCacheHit(50, 'rule_based', `rod${i}`, `reading${i}`)
      }
      monitor.recordCacheMiss(100, 'deepseek', 'rod9', 'reading9')
      
      const report = monitor.getSummaryReport()
      expect(report).toContain('Excellent cache performance')
      expect(report).toContain('Fast response times')
    })
  })

  describe('Metrics Reset', () => {
    it('should reset all metrics and events', () => {
      monitor.recordCacheHit(50, 'rule_based', 'rod1', 'reading1')
      monitor.recordCacheMiss(100, 'deepseek', 'rod2', 'reading2')
      monitor.recordAiError(200, 'Error', 'rod3', 'reading3')
      
      expect(monitor.getMetrics().totalRequests).toBe(2)
      expect(monitor.getRecentEvents(10)).toHaveLength(3)
      
      monitor.resetMetrics()
      
      const metrics = monitor.getMetrics()
      expect(metrics.totalRequests).toBe(0)
      expect(metrics.cacheHits).toBe(0)
      expect(metrics.cacheMisses).toBe(0)
      expect(metrics.hitRate).toBe(0)
      expect(metrics.errorStats.aiErrors).toBe(0)
      expect(monitor.getRecentEvents(10)).toHaveLength(0)
      expect(metrics.lastReset).toBeInstanceOf(Date)
    })
  })
})