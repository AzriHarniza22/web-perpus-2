import { LogEntry, LogLevel, LogCategory, logger } from './logger'

export interface LogMetrics {
  totalLogs: number
  errorCount: number
  warnCount: number
  infoCount: number
  debugCount: number
  logsByCategory: Record<string, number>
  logsByLevel: Record<string, number>
  errorRate: number
  averageLogsPerHour: number
  topErrors: Array<{
    message: string
    count: number
    lastSeen: string
  }>
  performanceMetrics: {
    averageResponseTime: number
    slowOperations: number
    timeoutCount: number
  }
}

export interface LogAggregationConfig {
  timeWindow: number // in milliseconds
  maxEntries: number
  enableMetrics: boolean
  enableAlerts: boolean
  alertThresholds: {
    errorRate: number
    responseTime: number
    errorCount: number
  }
}

class LogAggregator {
  private logs: LogEntry[] = []
  private metrics: LogMetrics
  private config: LogAggregationConfig
  private alertCallbacks: Array<(alert: LogAlert) => void> = []

  constructor(config: Partial<LogAggregationConfig> = {}) {
    this.config = {
      timeWindow: 60 * 60 * 1000, // 1 hour
      maxEntries: 10000,
      enableMetrics: true,
      enableAlerts: false,
      alertThresholds: {
        errorRate: 0.1, // 10%
        responseTime: 5000, // 5 seconds
        errorCount: 100,
      },
      ...config,
    }

    this.metrics = this.initializeMetrics()

    // Clean up old logs periodically
    setInterval(() => this.cleanup(), this.config.timeWindow / 4)
  }

  private initializeMetrics(): LogMetrics {
    return {
      totalLogs: 0,
      errorCount: 0,
      warnCount: 0,
      infoCount: 0,
      debugCount: 0,
      logsByCategory: {},
      logsByLevel: {},
      errorRate: 0,
      averageLogsPerHour: 0,
      topErrors: [],
      performanceMetrics: {
        averageResponseTime: 0,
        slowOperations: 0,
        timeoutCount: 0,
      },
    }
  }

  addLog(entry: LogEntry): void {
    this.logs.push(entry)

    // Limit the number of stored logs
    if (this.logs.length > this.config.maxEntries) {
      this.logs.shift()
    }

    this.updateMetrics(entry)

    if (this.config.enableAlerts) {
      this.checkAlerts(entry)
    }
  }

  private updateMetrics(entry: LogEntry): void {
    this.metrics.totalLogs++

    // Update level counts
    switch (entry.level) {
      case LogLevel.ERROR:
        this.metrics.errorCount++
        break
      case LogLevel.WARN:
        this.metrics.warnCount++
        break
      case LogLevel.INFO:
        this.metrics.infoCount++
        break
      case LogLevel.DEBUG:
        this.metrics.debugCount++
        break
    }

    // Update category counts
    const categoryName = entry.category
    this.metrics.logsByCategory[categoryName] =
      (this.metrics.logsByCategory[categoryName] || 0) + 1

    // Update level distribution
    const levelName = LogLevel[entry.level]
    this.metrics.logsByLevel[levelName] =
      (this.metrics.logsByLevel[levelName] || 0) + 1

    // Update error rate
    const totalLogs = this.metrics.totalLogs
    const errorLogs = this.metrics.errorCount
    this.metrics.errorRate = totalLogs > 0 ? errorLogs / totalLogs : 0

    // Update performance metrics
    if (entry.duration !== undefined) {
      const currentAvg = this.metrics.performanceMetrics.averageResponseTime
      const totalOperations = this.metrics.performanceMetrics.slowOperations +
                             this.metrics.performanceMetrics.timeoutCount +
                             (this.logs.filter(l => l.duration !== undefined).length - 1)

      if (totalOperations > 0) {
        this.metrics.performanceMetrics.averageResponseTime =
          (currentAvg * totalOperations + entry.duration) / (totalOperations + 1)
      } else {
        this.metrics.performanceMetrics.averageResponseTime = entry.duration
      }

      // Count slow operations (> 5 seconds)
      if (entry.duration > 5000) {
        this.metrics.performanceMetrics.slowOperations++
      }

      // Count timeouts (> 30 seconds)
      if (entry.duration > 30000) {
        this.metrics.performanceMetrics.timeoutCount++
      }
    }

    // Update top errors
    if (entry.level === LogLevel.ERROR && entry.error) {
      this.updateTopErrors(entry)
    }

    // Update average logs per hour
    const hoursElapsed = Math.max(1, Date.now() - (Date.now() - this.config.timeWindow)) / (60 * 60 * 1000)
    this.metrics.averageLogsPerHour = this.metrics.totalLogs / hoursElapsed
  }

  private updateTopErrors(entry: LogEntry): void {
    const errorKey = entry.error?.message || 'Unknown error'
    const existingIndex = this.metrics.topErrors.findIndex(e => e.message === errorKey)

    if (existingIndex >= 0) {
      this.metrics.topErrors[existingIndex].count++
      this.metrics.topErrors[existingIndex].lastSeen = entry.timestamp
    } else {
      this.metrics.topErrors.push({
        message: errorKey,
        count: 1,
        lastSeen: entry.timestamp,
      })
    }

    // Keep only top 10 errors
    this.metrics.topErrors.sort((a, b) => b.count - a.count)
    this.metrics.topErrors = this.metrics.topErrors.slice(0, 10)
  }

  private checkAlerts(entry: LogEntry): void {
    const alerts: LogAlert[] = []

    // Check error rate threshold
    if (this.metrics.errorRate > this.config.alertThresholds.errorRate) {
      alerts.push({
        type: 'error_rate',
        level: 'warning',
        message: `Error rate exceeded threshold: ${(this.metrics.errorRate * 100).toFixed(2)}%`,
        timestamp: entry.timestamp,
        data: {
          errorRate: this.metrics.errorRate,
          threshold: this.config.alertThresholds.errorRate,
        },
      })
    }

    // Check error count threshold
    if (this.metrics.errorCount > this.config.alertThresholds.errorCount) {
      alerts.push({
        type: 'error_count',
        level: 'critical',
        message: `Error count exceeded threshold: ${this.metrics.errorCount}`,
        timestamp: entry.timestamp,
        data: {
          errorCount: this.metrics.errorCount,
          threshold: this.config.alertThresholds.errorCount,
        },
      })
    }

    // Check response time threshold
    if (entry.duration && entry.duration > this.config.alertThresholds.responseTime) {
      alerts.push({
        type: 'slow_operation',
        level: 'warning',
        message: `Slow operation detected: ${entry.duration}ms`,
        timestamp: entry.timestamp,
        data: {
          duration: entry.duration,
          threshold: this.config.alertThresholds.responseTime,
          category: entry.category,
        },
      })
    }

    // Trigger alert callbacks
    alerts.forEach(alert => {
      this.alertCallbacks.forEach(callback => {
        try {
          callback(alert)
        } catch (error) {
          logger.error(LogCategory.SYSTEM, 'Alert callback failed', undefined, error as Error)
        }
      })
    })
  }

  private cleanup(): void {
    const cutoffTime = Date.now() - this.config.timeWindow
    const initialCount = this.logs.length

    this.logs = this.logs.filter(log => new Date(log.timestamp).getTime() > cutoffTime)

    const removedCount = initialCount - this.logs.length
    if (removedCount > 0) {
      logger.debug(LogCategory.SYSTEM, `Cleaned up ${removedCount} old log entries`)
    }
  }

  getMetrics(): LogMetrics {
    return { ...this.metrics }
  }

  getLogs(
    filter?: {
      level?: LogLevel
      category?: LogCategory
      startTime?: string
      endTime?: string
      limit?: number
    }
  ): LogEntry[] {
    let filteredLogs = [...this.logs]

    if (filter) {
      if (filter.level !== undefined) {
        filteredLogs = filteredLogs.filter(log => log.level === filter.level)
      }

      if (filter.category !== undefined) {
        filteredLogs = filteredLogs.filter(log => log.category === filter.category)
      }

      if (filter.startTime) {
        const startTime = new Date(filter.startTime).getTime()
        filteredLogs = filteredLogs.filter(log => new Date(log.timestamp).getTime() >= startTime)
      }

      if (filter.endTime) {
        const endTime = new Date(filter.endTime).getTime()
        filteredLogs = filteredLogs.filter(log => new Date(log.timestamp).getTime() <= endTime)
      }

      if (filter.limit) {
        filteredLogs = filteredLogs.slice(-filter.limit)
      }
    }

    return filteredLogs
  }

  onAlert(callback: (alert: LogAlert) => void): void {
    this.alertCallbacks.push(callback)
  }

  removeAlertCallback(callback: (alert: LogAlert) => void): void {
    const index = this.alertCallbacks.indexOf(callback)
    if (index > -1) {
      this.alertCallbacks.splice(index, 1)
    }
  }

  clearLogs(): void {
    this.logs = []
    this.metrics = this.initializeMetrics()
  }

  exportLogs(format: 'json' | 'csv' = 'json'): string {
    if (format === 'csv') {
      const headers = ['timestamp', 'level', 'category', 'message', 'context', 'error', 'duration']
      const rows = [
        headers.join(','),
        ...this.logs.map(log => [
          log.timestamp,
          LogLevel[log.level],
          log.category,
          `"${log.message.replace(/"/g, '""')}"`,
          log.context ? `"${JSON.stringify(log.context).replace(/"/g, '""')}"` : '',
          log.error ? `"${JSON.stringify(log.error).replace(/"/g, '""')}"` : '',
          log.duration || '',
        ].join(','))
      ]
      return rows.join('\n')
    }

    return JSON.stringify(this.logs, null, 2)
  }
}

export interface LogAlert {
  type: 'error_rate' | 'error_count' | 'slow_operation' | 'system_issue'
  level: 'info' | 'warning' | 'critical'
  message: string
  timestamp: string
  data?: Record<string, unknown>
}

// Create default aggregator instance
export const logAggregator = new LogAggregator()

// Hook into logger to automatically aggregate logs
const originalWriteLog = logger['writeLog']
logger['writeLog'] = async function(entry: LogEntry) {
  await originalWriteLog.call(this, entry)
  logAggregator.addLog(entry)
}