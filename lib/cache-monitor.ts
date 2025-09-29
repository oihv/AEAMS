/**
 * Cache Performance Monitoring for AI Suggestions
 * Tracks cache hit rates, response times, and provides insights for optimization
 */

export interface CacheMetrics {
  totalRequests: number
  cacheHits: number
  cacheMisses: number
  hitRate: number
  averageResponseTime: number
  totalResponseTime: number
  lastReset: Date
  modelTypeStats: {
    rule_based: number
    deepseek: number
  }
  errorStats: {
    aiErrors: number
    cacheErrors: number
    dbErrors: number
  }
}

export interface PerformanceEvent {
  timestamp: Date
  type: 'cache_hit' | 'cache_miss' | 'ai_error' | 'cache_error' | 'db_error'
  responseTime?: number
  modelType?: 'rule_based' | 'deepseek'
  rodId?: string | number
  readingId?: string | number
  errorMessage?: string
}

/**
 * In-memory cache performance monitor
 * For production, consider using Redis or a proper metrics system
 */
class CachePerformanceMonitor {
  private metrics!: CacheMetrics
  private events: PerformanceEvent[] = []
  private readonly maxEvents = 1000 // Keep last 1000 events in memory

  constructor() {
    this.resetMetrics()
  }

  /**
   * Record a cache hit event
   */
  recordCacheHit(responseTime: number, modelType: 'rule_based' | 'deepseek', rodId?: string | number, readingId?: string | number): void {
    const event: PerformanceEvent = {
      timestamp: new Date(),
      type: 'cache_hit',
      responseTime,
      modelType,
      rodId,
      readingId
    }

    this.addEvent(event)
    this.metrics.totalRequests++
    this.metrics.cacheHits++
    this.metrics.totalResponseTime += responseTime
    this.metrics.averageResponseTime = this.metrics.totalResponseTime / this.metrics.totalRequests
    this.metrics.hitRate = this.metrics.cacheHits / this.metrics.totalRequests
    this.metrics.modelTypeStats[modelType]++
  }

  /**
   * Record a cache miss event (new suggestion generated)
   */
  recordCacheMiss(responseTime: number, modelType: 'rule_based' | 'deepseek', rodId?: string | number, readingId?: string | number): void {
    const event: PerformanceEvent = {
      timestamp: new Date(),
      type: 'cache_miss',
      responseTime,
      modelType,
      rodId,
      readingId
    }

    this.addEvent(event)
    this.metrics.totalRequests++
    this.metrics.cacheMisses++
    this.metrics.totalResponseTime += responseTime
    this.metrics.averageResponseTime = this.metrics.totalResponseTime / this.metrics.totalRequests
    this.metrics.hitRate = this.metrics.cacheHits / this.metrics.totalRequests
    this.metrics.modelTypeStats[modelType]++
  }

  /**
   * Record an AI API error
   */
  recordAiError(responseTime: number, errorMessage: string, rodId?: string | number, readingId?: string | number): void {
    const event: PerformanceEvent = {
      timestamp: new Date(),
      type: 'ai_error',
      responseTime,
      errorMessage,
      rodId,
      readingId
    }

    this.addEvent(event)
    this.metrics.errorStats.aiErrors++
  }

  /**
   * Record a cache/database error
   */
  recordCacheError(errorMessage: string, rodId?: string | number, readingId?: string | number): void {
    const event: PerformanceEvent = {
      timestamp: new Date(),
      type: 'cache_error',
      errorMessage,
      rodId,
      readingId
    }

    this.addEvent(event)
    this.metrics.errorStats.cacheErrors++
  }

  /**
   * Record a database error
   */
  recordDbError(errorMessage: string, rodId?: string | number, readingId?: string | number): void {
    const event: PerformanceEvent = {
      timestamp: new Date(),
      type: 'db_error',
      errorMessage,
      rodId,
      readingId
    }

    this.addEvent(event)
    this.metrics.errorStats.dbErrors++
  }

  /**
   * Get current performance metrics
   */
  getMetrics(): CacheMetrics {
    return { ...this.metrics }
  }

  /**
   * Get recent performance events
   */
  getRecentEvents(limit: number = 50): PerformanceEvent[] {
    return this.events.slice(-limit).reverse() // Most recent first
  }

  /**
   * Get events within a time range
   */
  getEventsInRange(startTime: Date, endTime: Date): PerformanceEvent[] {
    return this.events.filter(event => 
      event.timestamp >= startTime && event.timestamp <= endTime
    )
  }

  /**
   * Get cache performance for a specific rod
   */
  getRodMetrics(rodId: string | number): { hits: number, misses: number, hitRate: number } {
    const rodEvents = this.events.filter(event => event.rodId === rodId)
    const hits = rodEvents.filter(event => event.type === 'cache_hit').length
    const misses = rodEvents.filter(event => event.type === 'cache_miss').length
    const total = hits + misses
    
    return {
      hits,
      misses,
      hitRate: total > 0 ? hits / total : 0
    }
  }

  /**
   * Reset all metrics (useful for testing or periodic resets)
   */
  resetMetrics(): void {
    this.metrics = {
      totalRequests: 0,
      cacheHits: 0,
      cacheMisses: 0,
      hitRate: 0,
      averageResponseTime: 0,
      totalResponseTime: 0,
      lastReset: new Date(),
      modelTypeStats: {
        rule_based: 0,
        deepseek: 0
      },
      errorStats: {
        aiErrors: 0,
        cacheErrors: 0,
        dbErrors: 0
      }
    }
    this.events = []
  }

  /**
   * Get summary report for monitoring dashboards
   */
  getSummaryReport(): string {
    const metrics = this.metrics
    const uptime = Date.now() - metrics.lastReset.getTime()
    const uptimeHours = uptime / (1000 * 60 * 60)
    
    return `
🎯 AI Suggestions Cache Performance Report
==========================================
📊 Overall Stats:
   • Total Requests: ${metrics.totalRequests}
   • Cache Hit Rate: ${(metrics.hitRate * 100).toFixed(1)}% (${metrics.cacheHits} hits, ${metrics.cacheMisses} misses)
   • Average Response: ${metrics.averageResponseTime.toFixed(1)}ms
   • Uptime: ${uptimeHours.toFixed(1)} hours

🤖 Model Usage:
   • Rule-based: ${metrics.modelTypeStats.rule_based} requests
   • DeepSeek AI: ${metrics.modelTypeStats.deepseek} requests

🚨 Error Summary:
   • AI API Errors: ${metrics.errorStats.aiErrors}
   • Cache Errors: ${metrics.errorStats.cacheErrors}
   • DB Errors: ${metrics.errorStats.dbErrors}

💡 Performance Insights:
   ${this.generateInsights()}
`.trim()
  }

  /**
   * Generate performance insights based on current metrics
   */
  private generateInsights(): string {
    const metrics = this.metrics
    const insights: string[] = []

    // Cache performance insights
    if (metrics.hitRate > 0.8) {
      insights.push("✅ Excellent cache performance (>80% hit rate)")
    } else if (metrics.hitRate > 0.6) {
      insights.push("🔶 Good cache performance (60-80% hit rate)")
    } else if (metrics.hitRate > 0.3) {
      insights.push("⚠️ Moderate cache performance (30-60% hit rate)")
    } else if (metrics.totalRequests > 0) {
      insights.push("🔴 Low cache performance (<30% hit rate) - consider cache strategy review")
    }

    // Response time insights
    if (metrics.averageResponseTime < 100) {
      insights.push("🚀 Fast response times (<100ms average)")
    } else if (metrics.averageResponseTime < 500) {
      insights.push("⏱️ Moderate response times (100-500ms average)")
    } else if (metrics.totalRequests > 0) {
      insights.push("🐌 Slow response times (>500ms average) - performance optimization needed")
    }

    // Model usage insights
    const totalModel = metrics.modelTypeStats.rule_based + metrics.modelTypeStats.deepseek
    if (totalModel > 0) {
      const rulePct = (metrics.modelTypeStats.rule_based / totalModel * 100).toFixed(1)
      insights.push(`🔧 ${rulePct}% rule-based, ${(100 - parseFloat(rulePct)).toFixed(1)}% AI-powered`)
    }

    // Error rate insights
    const totalErrors = metrics.errorStats.aiErrors + metrics.errorStats.cacheErrors + metrics.errorStats.dbErrors
    if (totalErrors === 0 && metrics.totalRequests > 0) {
      insights.push("✨ Zero errors - system running smoothly")
    } else if (metrics.totalRequests > 0) {
      const errorRate = (totalErrors / metrics.totalRequests * 100).toFixed(1)
      insights.push(`⚠️ ${errorRate}% error rate (${totalErrors} errors)`)
    }

    return insights.join("\n   ")
  }

  /**
   * Add event to the events array, maintaining the maximum size
   */
  private addEvent(event: PerformanceEvent): void {
    this.events.push(event)
    
    // Keep only the most recent events
    if (this.events.length > this.maxEvents) {
      this.events = this.events.slice(-this.maxEvents)
    }
  }
}

// Export singleton instance
export const cacheMonitor = new CachePerformanceMonitor()

// Export class for testing
export { CachePerformanceMonitor }