import { logger, LogCategory } from './logger'
import { logAggregator } from './logAggregator'

export interface PerformanceMetrics {
  operationName: string
  duration: number
  timestamp: string
  success: boolean
  metadata?: Record<string, unknown>
}

export interface SystemMetrics {
  memoryUsage: NodeJS.MemoryUsage
  uptime: number
  timestamp: string
  activeConnections?: number
  requestCount?: number
}

export interface DatabaseMetrics {
  queryTime: number
  operation: string
  table?: string
  success: boolean
  error?: string
  timestamp: string
}

class PerformanceMonitor {
  private metrics: PerformanceMetrics[] = []
  private systemMetrics: SystemMetrics[] = []
  private databaseMetrics: DatabaseMetrics[] = []
  private maxMetricsAge = 24 * 60 * 60 * 1000 // 24 hours
  private systemMetricsInterval?: NodeJS.Timeout

  constructor() {
    this.startSystemMonitoring()
    this.setupCleanup()
  }

  private startSystemMonitoring(): void {
    // Collect system metrics every 30 seconds
    this.systemMetricsInterval = setInterval(() => {
      this.collectSystemMetrics()
    }, 30000)

    // Collect initial metrics
    this.collectSystemMetrics()
  }

  private setupCleanup(): void {
    // Clean up old metrics every hour
    setInterval(() => {
      this.cleanup()
    }, 60 * 60 * 1000)
  }

  private collectSystemMetrics(): void {
    try {
      const memUsage = process.memoryUsage()
      const uptime = process.uptime()

      const metrics: SystemMetrics = {
        memoryUsage: memUsage,
        uptime,
        timestamp: new Date().toISOString(),
      }

      this.systemMetrics.push(metrics)

      // Log system metrics periodically
      if (this.systemMetrics.length % 20 === 0) { // Every 10 minutes
        logger.info(LogCategory.PERFORMANCE, 'System metrics collected', undefined, {
          memoryUsage: {
            rss: `${Math.round(memUsage.rss / 1024 / 1024)}MB`,
            heapUsed: `${Math.round(memUsage.heapUsed / 1024 / 1024)}MB`,
            heapTotal: `${Math.round(memUsage.heapTotal / 1024 / 1024)}MB`,
          },
          uptime: `${Math.round(uptime / 60)} minutes`,
        })
      }
    } catch (error) {
      logger.error(LogCategory.SYSTEM, 'Failed to collect system metrics', undefined, error as Error)
    }
  }

  recordOperation(
    operationName: string,
    duration: number,
    success: boolean,
    metadata?: Record<string, unknown>
  ): void {
    const metrics: PerformanceMetrics = {
      operationName,
      duration,
      timestamp: new Date().toISOString(),
      success,
      metadata,
    }

    this.metrics.push(metrics)

    // Log slow operations
    if (duration > 5000) { // 5 seconds
      logger.warn(LogCategory.PERFORMANCE, 'Slow operation detected', undefined, undefined, {
        operationName,
        duration,
        success,
        ...metadata,
      })
    }

    // Log performance metrics periodically
    if (this.metrics.length % 100 === 0) {
      this.logPerformanceSummary()
    }
  }

  recordDatabaseOperation(
    operation: string,
    queryTime: number,
    success: boolean,
    table?: string,
    error?: string
  ): void {
    const metrics: DatabaseMetrics = {
      operation,
      queryTime,
      table,
      success,
      error,
      timestamp: new Date().toISOString(),
    }

    this.databaseMetrics.push(metrics)

    // Log slow database operations
    if (queryTime > 1000) { // 1 second
      logger.warn(LogCategory.PERFORMANCE, 'Slow database operation', undefined, undefined, {
        operation,
        queryTime,
        table,
        success,
      })
    }

    // Log database errors
    if (!success && error) {
      logger.error(LogCategory.DATABASE, 'Database operation failed', undefined, undefined, {
        operation,
        queryTime,
        table,
        error,
      })
    }
  }

  private logPerformanceSummary(): void {
    const recentMetrics = this.metrics.slice(-100)
    const successfulOps = recentMetrics.filter(m => m.success)
    const failedOps = recentMetrics.filter(m => !m.success)

    if (recentMetrics.length === 0) return

    const avgDuration = recentMetrics.reduce((sum, m) => sum + m.duration, 0) / recentMetrics.length
    const successRate = (successfulOps.length / recentMetrics.length) * 100

    logger.info(LogCategory.PERFORMANCE, 'Performance summary', undefined, {
      totalOperations: recentMetrics.length,
      successfulOperations: successfulOps.length,
      failedOperations: failedOps.length,
      averageDuration: `${Math.round(avgDuration)}ms`,
      successRate: `${Math.round(successRate)}%`,
      slowestOperation: Math.max(...recentMetrics.map(m => m.duration)),
      fastestOperation: Math.min(...recentMetrics.map(m => m.duration)),
    })
  }

  getPerformanceMetrics(
    filter?: {
      operationName?: string
      success?: boolean
      minDuration?: number
      maxDuration?: number
      startTime?: string
      endTime?: string
      limit?: number
    }
  ): PerformanceMetrics[] {
    let filtered = [...this.metrics]

    if (filter) {
      if (filter.operationName) {
        filtered = filtered.filter(m => m.operationName.includes(filter.operationName!))
      }

      if (filter.success !== undefined) {
        filtered = filtered.filter(m => m.success === filter.success)
      }

      if (filter.minDuration !== undefined) {
        filtered = filtered.filter(m => m.duration >= filter.minDuration!)
      }

      if (filter.maxDuration !== undefined) {
        filtered = filtered.filter(m => m.duration <= filter.maxDuration!)
      }

      if (filter.startTime) {
        const startTime = new Date(filter.startTime).getTime()
        filtered = filtered.filter(m => new Date(m.timestamp).getTime() >= startTime)
      }

      if (filter.endTime) {
        const endTime = new Date(filter.endTime).getTime()
        filtered = filtered.filter(m => new Date(m.timestamp).getTime() <= endTime)
      }

      if (filter.limit) {
        filtered = filtered.slice(-filter.limit)
      }
    }

    return filtered
  }

  getDatabaseMetrics(
    filter?: {
      operation?: string
      table?: string
      success?: boolean
      minQueryTime?: number
      startTime?: string
      endTime?: string
      limit?: number
    }
  ): DatabaseMetrics[] {
    let filtered = [...this.databaseMetrics]

    if (filter) {
      if (filter.operation) {
        filtered = filtered.filter(m => m.operation.includes(filter.operation!))
      }

      if (filter.table) {
        filtered = filtered.filter(m => m.table === filter.table)
      }

      if (filter.success !== undefined) {
        filtered = filtered.filter(m => m.success === filter.success)
      }

      if (filter.minQueryTime !== undefined) {
        filtered = filtered.filter(m => m.queryTime >= filter.minQueryTime!)
      }

      if (filter.startTime) {
        const startTime = new Date(filter.startTime).getTime()
        filtered = filtered.filter(m => new Date(m.timestamp).getTime() >= startTime)
      }

      if (filter.endTime) {
        const endTime = new Date(filter.endTime).getTime()
        filtered = filtered.filter(m => new Date(m.timestamp).getTime() <= endTime)
      }

      if (filter.limit) {
        filtered = filtered.slice(-filter.limit)
      }
    }

    return filtered
  }

  getSystemMetrics(
    filter?: {
      startTime?: string
      endTime?: string
      limit?: number
    }
  ): SystemMetrics[] {
    let filtered = [...this.systemMetrics]

    if (filter) {
      if (filter.startTime) {
        const startTime = new Date(filter.startTime).getTime()
        filtered = filtered.filter(m => new Date(m.timestamp).getTime() >= startTime)
      }

      if (filter.endTime) {
        const endTime = new Date(filter.endTime).getTime()
        filtered = filtered.filter(m => new Date(m.timestamp).getTime() <= endTime)
      }

      if (filter.limit) {
        filtered = filtered.slice(-filter.limit)
      }
    }

    return filtered
  }

  generateReport(
    startTime?: string,
    endTime?: string
  ): {
    performance: {
      totalOperations: number
      averageDuration: number
      successRate: number
      slowestOperation: number
      fastestOperation: number
      operationsByType: Record<string, number>
    }
    database: {
      totalQueries: number
      averageQueryTime: number
      slowQueries: number
      failedQueries: number
    }
    system: {
      averageMemoryUsage: number
      peakMemoryUsage: number
      uptime: number
    }
  } {
    const start = startTime ? new Date(startTime).getTime() : Date.now() - this.maxMetricsAge
    const end = endTime ? new Date(endTime).getTime() : Date.now()

    const performanceMetrics = this.metrics.filter(
      m => new Date(m.timestamp).getTime() >= start && new Date(m.timestamp).getTime() <= end
    )

    const databaseMetrics = this.databaseMetrics.filter(
      m => new Date(m.timestamp).getTime() >= start && new Date(m.timestamp).getTime() <= end
    )

    const systemMetrics = this.systemMetrics.filter(
      m => new Date(m.timestamp).getTime() >= start && new Date(m.timestamp).getTime() <= end
    )

    // Performance analysis
    const totalOperations = performanceMetrics.length
    const successfulOperations = performanceMetrics.filter(m => m.success).length
    const durations = performanceMetrics.map(m => m.duration)

    const performanceReport = {
      totalOperations,
      averageDuration: totalOperations > 0 ? durations.reduce((a, b) => a + b, 0) / durations.length : 0,
      successRate: totalOperations > 0 ? (successfulOperations / totalOperations) * 100 : 0,
      slowestOperation: durations.length > 0 ? Math.max(...durations) : 0,
      fastestOperation: durations.length > 0 ? Math.min(...durations) : 0,
      operationsByType: performanceMetrics.reduce((acc, m) => {
        acc[m.operationName] = (acc[m.operationName] || 0) + 1
        return acc
      }, {} as Record<string, number>),
    }

    // Database analysis
    const queryTimes = databaseMetrics.map(m => m.queryTime)
    const databaseReport = {
      totalQueries: databaseMetrics.length,
      averageQueryTime: databaseMetrics.length > 0 ? queryTimes.reduce((a, b) => a + b, 0) / queryTimes.length : 0,
      slowQueries: databaseMetrics.filter(m => m.queryTime > 1000).length,
      failedQueries: databaseMetrics.filter(m => !m.success).length,
    }

    // System analysis
    const memoryUsages = systemMetrics.map(m => m.memoryUsage.heapUsed)
    const systemReport = {
      averageMemoryUsage: memoryUsages.length > 0 ? memoryUsages.reduce((a, b) => a + b, 0) / memoryUsages.length : 0,
      peakMemoryUsage: memoryUsages.length > 0 ? Math.max(...memoryUsages) : 0,
      uptime: systemMetrics.length > 0 ? systemMetrics[systemMetrics.length - 1].uptime : 0,
    }

    return {
      performance: performanceReport,
      database: databaseReport,
      system: systemReport,
    }
  }

  private cleanup(): void {
    const cutoffTime = Date.now() - this.maxMetricsAge

    this.metrics = this.metrics.filter(m => new Date(m.timestamp).getTime() > cutoffTime)
    this.databaseMetrics = this.databaseMetrics.filter(m => new Date(m.timestamp).getTime() > cutoffTime)
    this.systemMetrics = this.systemMetrics.filter(m => new Date(m.timestamp).getTime() > cutoffTime)
  }

  destroy(): void {
    if (this.systemMetricsInterval) {
      clearInterval(this.systemMetricsInterval)
    }
  }
}

// Create singleton instance
export const performanceMonitor = new PerformanceMonitor()

// Hook into logger to automatically record performance metrics
const originalWithDuration = logger.withDuration.bind(logger)
logger.withDuration = async function<T>(
  category: LogCategory,
  message: string,
  operation: () => Promise<T>,
  context?: any
): Promise<T> {
  const startTime = performance.now()

  try {
    const result = await operation()
    const duration = performance.now() - startTime

    performanceMonitor.recordOperation(message, duration, true, {
      category: category.toString(),
      ...context,
    })

    return result
  } catch (error) {
    const duration = performance.now() - startTime

    performanceMonitor.recordOperation(message, duration, false, {
      category: category.toString(),
      error: error instanceof Error ? error.message : 'Unknown error',
      ...context,
    })

    throw error
  }
}