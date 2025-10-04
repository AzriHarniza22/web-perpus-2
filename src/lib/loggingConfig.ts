import { LoggerConfig } from './logger'

/**
 * Centralized logging configuration
 * This file contains all logging-related configuration for different environments
 */

export const loggingConfig: LoggerConfig = {
  // Log level configuration based on environment
  level: process.env.LOG_LEVEL ? parseInt(process.env.LOG_LEVEL) : (
    process.env.NODE_ENV === 'production' ? 2 : // WARN level for production
    process.env.NODE_ENV === 'development' ? 0 : // DEBUG level for development
    1 // INFO level for other environments
  ),

  // Output configuration
  enableConsole: process.env.LOG_ENABLE_CONSOLE !== 'false',
  enableFile: process.env.LOG_ENABLE_FILE === 'true',
  enableRemote: process.env.LOG_ENABLE_REMOTE === 'true',

  // File logging configuration
  maxFileSize: parseInt(process.env.LOG_MAX_FILE_SIZE || '10485760'), // 10MB default
  maxFiles: parseInt(process.env.LOG_MAX_FILES || '5'),

  // Remote logging configuration
  remoteUrl: process.env.LOG_REMOTE_URL,

  // Service information
  environment: process.env.NODE_ENV || 'development',
  serviceName: process.env.LOG_SERVICE_NAME || 'library-reservation',
  version: process.env.LOG_VERSION || '1.0.0',
}

/**
 * Environment-specific logging configurations
 */
export const environmentConfigs = {
  development: {
    level: 0, // DEBUG
    enableConsole: true,
    enableFile: false,
    enableRemote: false,
  },

  test: {
    level: 3, // ERROR only
    enableConsole: false,
    enableFile: false,
    enableRemote: false,
  },

  staging: {
    level: 1, // INFO
    enableConsole: true,
    enableFile: true,
    enableRemote: true,
  },

  production: {
    level: 2, // WARN
    enableConsole: true,
    enableFile: true,
    enableRemote: true,
  },
}

/**
 * Get logging configuration for current environment
 */
export function getLoggingConfig(): LoggerConfig {
  const env = process.env.NODE_ENV || 'development'
  const envConfig = environmentConfigs[env as keyof typeof environmentConfigs] || environmentConfigs.development

  return {
    ...loggingConfig,
    ...envConfig,
  }
}

/**
 * Validate logging configuration
 */
export function validateLoggingConfig(config: LoggerConfig): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  if (config.level < 0 || config.level > 3) {
    errors.push('Log level must be between 0 (DEBUG) and 3 (ERROR)')
  }

  if (config.maxFileSize <= 0) {
    errors.push('Max file size must be greater than 0')
  }

  if (config.maxFiles <= 0) {
    errors.push('Max files must be greater than 0')
  }

  if (config.enableRemote && !config.remoteUrl) {
    errors.push('Remote URL is required when remote logging is enabled')
  }

  if (config.remoteUrl && !config.remoteUrl.startsWith('http')) {
    errors.push('Remote URL must start with http:// or https://')
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

/**
 * Apply logging configuration to logger instance
 */
export function applyLoggingConfig(): void {
  const config = getLoggingConfig()
  const { logger } = require('./logger')

  logger.updateConfig(config)

  // Log configuration application
  logger.info('system', 'Logging configuration applied', {
    environment: config.environment,
    level: config.level,
    enableConsole: config.enableConsole,
    enableFile: config.enableFile,
    enableRemote: config.enableRemote,
  })
}