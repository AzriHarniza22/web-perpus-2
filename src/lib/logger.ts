export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

export enum LogCategory {
  AUTHENTICATION = 'authentication',
  AUTHORIZATION = 'authorization',
  DATABASE = 'database',
  NETWORK = 'network',
  VALIDATION = 'validation',
  BUSINESS_LOGIC = 'business_logic',
  PERFORMANCE = 'performance',
  SECURITY = 'security',
  API = 'api',
  SYSTEM = 'system',
}

export interface LogContext {
  userId?: string
  requestId?: string
  sessionId?: string
  userAgent?: string
  ip?: string
  url?: string
  method?: string
  [key: string]: unknown
}

export interface LogEntry {
  timestamp: string
  level: LogLevel
  category: LogCategory
  message: string
  context?: LogContext
  error?: {
    name: string
    message: string
    stack?: string
    code?: string
    statusCode?: number
    details?: Record<string, unknown>
  }
  metadata?: Record<string, unknown>
  duration?: number
  traceId?: string
}

export interface LoggerConfig {
  level: LogLevel
  enableConsole: boolean
  enableFile: boolean
  enableRemote: boolean
  maxFileSize: number
  maxFiles: number
  remoteUrl?: string
  environment: string
  serviceName: string
  version: string
}

class Logger {
  private config: LoggerConfig
  private logBuffer: LogEntry[] = []
  private flushInterval?: NodeJS.Timeout
  private isFlushing = false

  constructor(config: Partial<LoggerConfig> = {}) {
    this.config = {
      level: LogLevel.INFO,
      enableConsole: true,
      enableFile: false,
      enableRemote: false,
      maxFileSize: 10 * 1024 * 1024, // 10MB
      maxFiles: 5,
      environment: process.env.NODE_ENV || 'development',
      serviceName: 'library-reservation',
      version: '1.0.0',
      ...config,
    }

    // Set log level based on environment
    if (this.config.environment === 'production') {
      this.config.level = LogLevel.WARN
    } else if (this.config.environment === 'development') {
      this.config.level = LogLevel.DEBUG
    }

    // Start periodic flush for buffered logs
    if (this.config.enableFile || this.config.enableRemote) {
      this.flushInterval = setInterval(() => this.flush(), 5000)
    }
  }

  private shouldLog(level: LogLevel): boolean {
    return level >= this.config.level
  }

  private createLogEntry(
    level: LogLevel,
    category: LogCategory,
    message: string,
    context?: LogContext,
    error?: Error | AppError,
    metadata?: Record<string, unknown>,
    duration?: number
  ): LogEntry {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      category,
      message,
      context,
      metadata,
      duration,
      traceId: this.generateTraceId(),
    }

    if (error) {
      entry.error = {
        name: error.name,
        message: error.message,
        stack: error.stack,
        ...(error instanceof AppError && {
          code: error.code,
          statusCode: error.statusCode,
          details: error.details,
        }),
      }
    }

    return entry
  }

  private generateTraceId(): string {
    return `trace_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private formatMessage(entry: LogEntry): string {
    const levelName = LogLevel[entry.level]
    const categoryName = entry.category.toUpperCase()
    const contextStr = entry.context ? ` | Context: ${JSON.stringify(entry.context)}` : ''
    const errorStr = entry.error ? ` | Error: ${entry.error.message}` : ''
    const durationStr = entry.duration ? ` | Duration: ${entry.duration}ms` : ''

    return `[${entry.timestamp}] ${levelName} [${categoryName}] ${entry.message}${contextStr}${errorStr}${durationStr}`
  }

  private async writeToConsole(entry: LogEntry): Promise<void> {
    if (!this.config.enableConsole) return

    const formattedMessage = this.formatMessage(entry)

    switch (entry.level) {
      case LogLevel.DEBUG:
        console.debug(formattedMessage, entry.metadata)
        break
      case LogLevel.INFO:
        console.info(formattedMessage, entry.metadata)
        break
      case LogLevel.WARN:
        console.warn(formattedMessage, entry.metadata)
        break
      case LogLevel.ERROR:
        console.error(formattedMessage, entry.metadata)
        if (entry.error?.stack) {
          console.error(entry.error.stack)
        }
        break
    }
  }

  private async writeToFile(entry: LogEntry): Promise<void> {
    if (!this.config.enableFile) return

    try {
      // In a real implementation, you might want to use a proper logging library
      // like winston or pino for file logging
      const fs = await import('fs/promises')
      const path = await import('path')

      const logDir = path.join(process.cwd(), 'logs')
      const logFile = path.join(logDir, `app-${new Date().toISOString().split('T')[0]}.log`)

      // Ensure log directory exists
      await fs.mkdir(logDir, { recursive: true })

      const logLine = `${this.formatMessage(entry)}\n`
      await fs.appendFile(logFile, logLine)
    } catch (error) {
      console.error('Failed to write to log file:', error)
    }
  }

  private async writeToRemote(entry: LogEntry): Promise<void> {
    if (!this.config.enableRemote || !this.config.remoteUrl) return

    try {
      await fetch(this.config.remoteUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...entry,
          service: this.config.serviceName,
          environment: this.config.environment,
          version: this.config.version,
        }),
      })
    } catch (error) {
      console.error('Failed to send log to remote service:', error)
    }
  }

  private async writeLog(entry: LogEntry): Promise<void> {
    // Always write to console if enabled
    await this.writeToConsole(entry)

    // Buffer file and remote logs for batch processing
    if (this.config.enableFile || this.config.enableRemote) {
      this.logBuffer.push(entry)

      // Flush if buffer gets too large
      if (this.logBuffer.length >= 100) {
        await this.flush()
      }
    }
  }

  private async flush(): Promise<void> {
    if (this.isFlushing || this.logBuffer.length === 0) return

    this.isFlushing = true
    const entries = [...this.logBuffer]
    this.logBuffer = []

    try {
      await Promise.all([
        ...entries.map(entry => this.writeToFile(entry)),
        ...entries.map(entry => this.writeToRemote(entry)),
      ])
    } catch (error) {
      console.error('Failed to flush logs:', error)
      // Re-add entries to buffer if flush failed
      this.logBuffer.unshift(...entries)
    } finally {
      this.isFlushing = false
    }
  }

  async debug(
    category: LogCategory,
    message: string,
    context?: LogContext,
    metadata?: Record<string, unknown>
  ): Promise<void> {
    if (!this.shouldLog(LogLevel.DEBUG)) return

    const entry = this.createLogEntry(LogLevel.DEBUG, category, message, context, undefined, metadata)
    await this.writeLog(entry)
  }

  async info(
    category: LogCategory,
    message: string,
    context?: LogContext,
    metadata?: Record<string, unknown>
  ): Promise<void> {
    if (!this.shouldLog(LogLevel.INFO)) return

    const entry = this.createLogEntry(LogLevel.INFO, category, message, context, undefined, metadata)
    await this.writeLog(entry)
  }

  async warn(
    category: LogCategory,
    message: string,
    context?: LogContext,
    error?: Error,
    metadata?: Record<string, unknown>
  ): Promise<void> {
    if (!this.shouldLog(LogLevel.WARN)) return

    const entry = this.createLogEntry(LogLevel.WARN, category, message, context, error, metadata)
    await this.writeLog(entry)
  }

  async error(
    category: LogCategory,
    message: string,
    context?: LogContext,
    error?: Error | AppError,
    metadata?: Record<string, unknown>
  ): Promise<void> {
    if (!this.shouldLog(LogLevel.ERROR)) return

    const entry = this.createLogEntry(LogLevel.ERROR, category, message, context, error, metadata)
    await this.writeLog(entry)
  }

  // Performance monitoring helper
  async withDuration<T>(
    category: LogCategory,
    message: string,
    operation: () => Promise<T>,
    context?: LogContext
  ): Promise<T> {
    const startTime = performance.now()

    try {
      const result = await operation()
      const duration = performance.now() - startTime

      await this.info(category, `${message} completed`, context, {
        duration,
        success: true,
      })

      return result
    } catch (error) {
      const duration = performance.now() - startTime

      await this.error(category, `${message} failed`, context, error as Error, {
        duration,
        success: false,
      })

      throw error
    }
  }

  // Create child logger with preset context
  child(context: LogContext): ChildLogger {
    return new ChildLogger(this, context)
  }

  // Update configuration
  updateConfig(newConfig: Partial<LoggerConfig>): void {
    this.config = { ...this.config, ...newConfig }
  }

  // Cleanup method
  async destroy(): Promise<void> {
    if (this.flushInterval) {
      clearInterval(this.flushInterval)
    }
    await this.flush()
  }
}

// Child logger for contextual logging
class ChildLogger {
  constructor(
    private parent: Logger,
    private context: LogContext
  ) {}

  async debug(category: LogCategory, message: string, additionalContext?: LogContext, metadata?: Record<string, unknown>): Promise<void> {
    await this.parent.debug(category, message, { ...this.context, ...additionalContext }, metadata)
  }

  async info(category: LogCategory, message: string, additionalContext?: LogContext, metadata?: Record<string, unknown>): Promise<void> {
    await this.parent.info(category, message, { ...this.context, ...additionalContext }, metadata)
  }

  async warn(category: LogCategory, message: string, additionalContext?: LogContext, error?: Error, metadata?: Record<string, unknown>): Promise<void> {
    await this.parent.warn(category, message, { ...this.context, ...additionalContext }, error, metadata)
  }

  async error(category: LogCategory, message: string, additionalContext?: LogContext, error?: Error | AppError, metadata?: Record<string, unknown>): Promise<void> {
    await this.parent.error(category, message, { ...this.context, ...additionalContext }, error, metadata)
  }

  async withDuration<T>(category: LogCategory, message: string, operation: () => Promise<T>, additionalContext?: LogContext): Promise<T> {
    return this.parent.withDuration(category, message, operation, { ...this.context, ...additionalContext })
  }

  child(additionalContext: LogContext): ChildLogger {
    return new ChildLogger(this.parent, { ...this.context, ...additionalContext })
  }
}

// Import AppError for typing
import { AppError } from './errors'

// Create default logger instance
export const logger = new Logger()

// Export types and enums for use in other modules
export { Logger, ChildLogger }