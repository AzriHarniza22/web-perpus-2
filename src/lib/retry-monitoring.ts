import { retryService } from './retry-service'
import { logger, LogCategory } from './logger'

// Retry monitoring and configuration utilities
export interface RetryMetrics {
  totalAttempts: number
  successfulAttempts: number
  failedAttempts: number
  averageAttempts: number
  circuitBreakerStats: Record<string, { state: string; failureCount: number }>
  lastUpdated: string
}

export class RetryMonitor {
  private metrics: RetryMetrics = {
    totalAttempts: 0,
    successfulAttempts: 0,
    failedAttempts: 0,
    averageAttempts: 0,
    circuitBreakerStats: {},
    lastUpdated: new Date().toISOString()
  }

  private attemptCounts = new Map<string, number>()

  // Initialize retry service with circuit breakers for key services
  initializeRetryService(): void {
    // Configure circuit breakers for critical services
    retryService.setCircuitBreaker('supabase-profiles', {
      failureThreshold: 5,
      resetTimeoutMs: 30000,
      monitoringPeriodMs: 300000
    })

    retryService.setCircuitBreaker('supabase-bookings', {
      failureThreshold: 3,
      resetTimeoutMs: 20000,
      monitoringPeriodMs: 300000
    })

    retryService.setCircuitBreaker('email-service', {
      failureThreshold: 3,
      resetTimeoutMs: 60000,
      monitoringPeriodMs: 300000
    })

    retryService.setCircuitBreaker('bookings-api', {
      failureThreshold: 5,
      resetTimeoutMs: 15000,
      monitoringPeriodMs: 300000
    })

    logger.info(LogCategory.SYSTEM, 'Retry service initialized with circuit breakers')
  }

  // Update metrics after each retry operation
  updateMetrics(operationType: string, attempt: number, success: boolean): void {
    this.metrics.totalAttempts++

    if (success) {
      this.metrics.successfulAttempts++
    } else {
      this.metrics.failedAttempts++
    }

    // Track attempts per operation type
    const key = `${operationType}:${success ? 'success' : 'failure'}`
    this.attemptCounts.set(key, (this.attemptCounts.get(key) || 0) + 1)

    // Update average attempts
    if (this.metrics.totalAttempts > 0) {
      this.metrics.averageAttempts = this.metrics.totalAttempts / (this.metrics.successfulAttempts + this.metrics.failedAttempts)
    }

    this.metrics.lastUpdated = new Date().toISOString()
  }

  // Get current metrics
  getMetrics(): RetryMetrics {
    this.metrics.circuitBreakerStats = retryService.getCircuitBreakerStats()
    return { ...this.metrics }
  }

  // Log retry metrics periodically
  async logMetrics(): Promise<void> {
    const metrics = this.getMetrics()

    await logger.info(LogCategory.PERFORMANCE, 'Retry service metrics', {
      totalAttempts: metrics.totalAttempts,
      successfulAttempts: metrics.successfulAttempts,
      failedAttempts: metrics.failedAttempts,
      averageAttempts: metrics.averageAttempts.toFixed(2),
      circuitBreakerStats: metrics.circuitBreakerStats
    })

    // Log detailed attempt counts
    for (const [key, count] of this.attemptCounts) {
      await logger.debug(LogCategory.PERFORMANCE, `Retry attempts: ${key}`, { count })
    }
  }

  // Reset metrics
  resetMetrics(): void {
    this.metrics = {
      totalAttempts: 0,
      successfulAttempts: 0,
      failedAttempts: 0,
      averageAttempts: 0,
      circuitBreakerStats: {},
      lastUpdated: new Date().toISOString()
    }
    this.attemptCounts.clear()

    logger.info(LogCategory.SYSTEM, 'Retry metrics reset')
  }

  // Get retry configuration for different operation types
  getRetryConfig(operationType: string) {
    return retryService.getRetryPolicy(operationType)
  }

  // Update retry configuration
  updateRetryConfig(operationType: string, config: Partial<import('./retry-service').RetryPolicy>): void {
    retryService.setRetryPolicy(operationType, config)
    logger.info(LogCategory.SYSTEM, `Retry policy updated for ${operationType}`, { config })
  }
}

// Export singleton instance
export const retryMonitor = new RetryMonitor()

// Enhanced retry service wrapper with monitoring
export class MonitoredRetryService {
  async executeWithRetry<T>(
    operation: () => Promise<T>,
    operationType: string = 'database',
    serviceName?: string,
    context?: Record<string, unknown>
  ): Promise<T> {
    const startTime = performance.now()

    try {
      const result = await retryService.executeWithRetry(operation, operationType, serviceName, context)

      // Update metrics on success
      retryMonitor.updateMetrics(operationType, 1, true)

      const duration = performance.now() - startTime
      await logger.debug(LogCategory.PERFORMANCE, `Monitored retry operation succeeded`, {
        operationType,
        serviceName,
        duration: `${duration.toFixed(2)}ms`,
        ...context
      })

      return result
    } catch (error) {
      // Update metrics on failure
      retryMonitor.updateMetrics(operationType, 1, false)

      const duration = performance.now() - startTime
      await logger.warn(LogCategory.PERFORMANCE, `Monitored retry operation failed`, {
        operationType,
        serviceName,
        duration: `${duration.toFixed(2)}ms`,
        error: error instanceof Error ? error.message : 'Unknown error',
        ...context
      })

      throw error
    }
  }
}

// Export monitored retry service instance
export const monitoredRetryService = new MonitoredRetryService()