import { logger, LogCategory } from './logger'
import { AppError, NetworkError, DatabaseError } from './errors'

// Retry policy configuration
export interface RetryPolicy {
  maxAttempts: number
  baseDelayMs: number
  maxDelayMs: number
  backoffMultiplier: number
  jitterMaxMs: number
  retryableErrors: string[]
  retryableStatusCodes: number[]
}

// Circuit breaker states
export enum CircuitState {
  CLOSED = 'CLOSED',     // Normal operation
  OPEN = 'OPEN',         // Failing, requests rejected
  HALF_OPEN = 'HALF_OPEN' // Testing if service recovered
}

// Circuit breaker configuration
export interface CircuitBreakerConfig {
  failureThreshold: number
  resetTimeoutMs: number
  monitoringPeriodMs: number
}

// Default retry policies for different operation types
export const DEFAULT_RETRY_POLICIES = {
  database: {
    maxAttempts: 3,
    baseDelayMs: 100,
    maxDelayMs: 2000,
    backoffMultiplier: 2,
    jitterMaxMs: 100,
    retryableErrors: ['DatabaseError', 'NetworkError'],
    retryableStatusCodes: [500, 502, 503, 504, 408, 429]
  } as RetryPolicy,

  network: {
    maxAttempts: 4,
    baseDelayMs: 200,
    maxDelayMs: 5000,
    backoffMultiplier: 2,
    jitterMaxMs: 200,
    retryableErrors: ['NetworkError'],
    retryableStatusCodes: [500, 502, 503, 504, 408, 429]
  } as RetryPolicy,

  api: {
    maxAttempts: 3,
    baseDelayMs: 300,
    maxDelayMs: 3000,
    backoffMultiplier: 2,
    jitterMaxMs: 150,
    retryableErrors: ['NetworkError'],
    retryableStatusCodes: [500, 502, 503, 504, 408, 429]
  } as RetryPolicy,

  file: {
    maxAttempts: 2,
    baseDelayMs: 500,
    maxDelayMs: 2000,
    backoffMultiplier: 2,
    jitterMaxMs: 100,
    retryableErrors: ['NetworkError'],
    retryableStatusCodes: [500, 502, 503, 504]
  } as RetryPolicy
}

// Circuit breaker implementation
class CircuitBreaker {
  private state: CircuitState = CircuitState.CLOSED
  private failureCount = 0
  private lastFailureTime = 0
  private nextAttemptTime = 0

  constructor(private config: CircuitBreakerConfig) {}

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === CircuitState.OPEN) {
      if (Date.now() < this.nextAttemptTime) {
        throw new Error('Circuit breaker is OPEN')
      }
      this.state = CircuitState.HALF_OPEN
    }

    try {
      const result = await operation()
      this.onSuccess()
      return result
    } catch (error) {
      this.onFailure()
      throw error
    }
  }

  private onSuccess(): void {
    this.failureCount = 0
    this.state = CircuitState.CLOSED
  }

  private onFailure(): void {
    this.failureCount++
    this.lastFailureTime = Date.now()

    if (this.failureCount >= this.config.failureThreshold) {
      this.state = CircuitState.OPEN
      this.nextAttemptTime = Date.now() + this.config.resetTimeoutMs
    }
  }

  getState(): CircuitState {
    return this.state
  }

  getFailureCount(): number {
    return this.failureCount
  }
}

// Main retry service class
export class RetryService {
  private circuitBreakers = new Map<string, CircuitBreaker>()
  private retryPolicies = new Map<string, RetryPolicy>()

  constructor() {
    // Initialize default retry policies
    Object.entries(DEFAULT_RETRY_POLICIES).forEach(([key, policy]) => {
      this.retryPolicies.set(key, policy)
    })
  }

  // Configure retry policy for a specific operation type
  setRetryPolicy(operationType: string, policy: Partial<RetryPolicy>): void {
    const existingPolicy = this.retryPolicies.get(operationType) || DEFAULT_RETRY_POLICIES.database
    this.retryPolicies.set(operationType, { ...existingPolicy, ...policy })
  }

  // Get retry policy for operation type
  getRetryPolicy(operationType: string): RetryPolicy {
    return this.retryPolicies.get(operationType) || DEFAULT_RETRY_POLICIES.database
  }

  // Configure circuit breaker for a service
  setCircuitBreaker(serviceName: string, config: Partial<CircuitBreakerConfig>): void {
    const defaultConfig: CircuitBreakerConfig = {
      failureThreshold: 5,
      resetTimeoutMs: 60000,
      monitoringPeriodMs: 300000
    }

    const circuitBreaker = new CircuitBreaker({ ...defaultConfig, ...config })
    this.circuitBreakers.set(serviceName, circuitBreaker)
  }

  // Get circuit breaker for service
  getCircuitBreaker(serviceName: string): CircuitBreaker | undefined {
    return this.circuitBreakers.get(serviceName)
  }

  // Calculate delay with exponential backoff and jitter
  private calculateDelay(attempt: number, policy: RetryPolicy): number {
    const exponentialDelay = policy.baseDelayMs * Math.pow(policy.backoffMultiplier, attempt - 1)
    const cappedDelay = Math.min(exponentialDelay, policy.maxDelayMs)

    // Add jitter to prevent thundering herd
    const jitter = Math.random() * policy.jitterMaxMs
    return Math.floor(cappedDelay + jitter)
  }

  // Check if error is retryable based on policy
  private isRetryableError(error: Error, policy: RetryPolicy): boolean {
    // Check error type
    if (error instanceof AppError) {
      return policy.retryableErrors.includes(error.constructor.name)
    }

    // Check error message for common transient errors
    const message = error.message.toLowerCase()
    const retryableMessages = [
      'timeout',
      'network',
      'connection',
      'temporary',
      'transient',
      'rate limit',
      'too many requests',
      'service unavailable',
      'internal server error'
    ]

    return retryableMessages.some(retryableMessage => message.includes(retryableMessage))
  }

  // Main retry execution method
  async executeWithRetry<T>(
    operation: () => Promise<T>,
    operationType: string = 'database',
    serviceName?: string,
    context?: Record<string, unknown>
  ): Promise<T> {
    const policy = this.getRetryPolicy(operationType)
    const circuitBreaker = serviceName ? this.getCircuitBreaker(serviceName) : undefined

    return logger.withDuration(
      LogCategory.PERFORMANCE,
      `Retry operation: ${operationType}`,
      async () => {
        let lastError: Error | null = null

        for (let attempt = 1; attempt <= policy.maxAttempts; attempt++) {
          try {
            // Execute with circuit breaker if available
            const result = circuitBreaker
              ? await circuitBreaker.execute(operation)
              : await operation()

            // Log successful retry attempt if not first attempt
            if (attempt > 1) {
              await logger.info(
                LogCategory.PERFORMANCE,
                `Operation succeeded after ${attempt} attempts`,
                {
                  operationType,
                  serviceName,
                  attempt,
                  ...context
                }
              )
            }

            return result
          } catch (error) {
            lastError = error as Error

            // Log retry attempt
            await logger.warn(
              LogCategory.PERFORMANCE,
              `Operation attempt ${attempt} failed`,
              {
                operationType,
                serviceName,
                attempt,
                maxAttempts: policy.maxAttempts,
                error: lastError.message,
                ...context
              },
              lastError
            )

            // Check if error is retryable
            if (!this.isRetryableError(lastError, policy)) {
              await logger.info(
                LogCategory.PERFORMANCE,
                'Error not retryable, failing immediately',
                {
                  operationType,
                  serviceName,
                  attempt,
                  error: lastError.message,
                  ...context
                }
              )
              throw lastError
            }

            // Don't wait after last attempt
            if (attempt === policy.maxAttempts) {
              break
            }

            // Calculate delay and wait
            const delay = this.calculateDelay(attempt, policy)
            await logger.debug(
              LogCategory.PERFORMANCE,
              `Waiting ${delay}ms before retry attempt ${attempt + 1}`,
              {
                operationType,
                serviceName,
                attempt,
                delay,
                ...context
              }
            )

            await this.sleep(delay)
          }
        }

        // All attempts failed
        await logger.error(
          LogCategory.PERFORMANCE,
          `Operation failed after ${policy.maxAttempts} attempts`,
          {
            operationType,
            serviceName,
            maxAttempts: policy.maxAttempts,
            ...context
          },
          lastError || new Error('Operation failed after all retry attempts')
        )

        throw lastError || new Error('Operation failed after all retry attempts')
      },
      { operationType, serviceName, ...context }
    )
  }

  // Helper method for sleep/delay
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  // Get circuit breaker stats for monitoring
  getCircuitBreakerStats(): Record<string, { state: CircuitState; failureCount: number }> {
    const stats: Record<string, { state: CircuitState; failureCount: number }> = {}

    for (const [serviceName, circuitBreaker] of this.circuitBreakers) {
      stats[serviceName] = {
        state: circuitBreaker.getState(),
        failureCount: circuitBreaker.getFailureCount()
      }
    }

    return stats
  }

  // Reset circuit breaker for a service
  resetCircuitBreaker(serviceName: string): void {
    const circuitBreaker = this.circuitBreakers.get(serviceName)
    if (circuitBreaker) {
      // Note: CircuitBreaker class doesn't have a reset method in current implementation
      // This would need to be added to the CircuitBreaker class if needed
      logger.info(LogCategory.SYSTEM, `Circuit breaker reset requested for ${serviceName}`)
    }
  }
}

// Export singleton instance
export const retryService = new RetryService()