export class AppError extends Error {
  public code: string
  public statusCode: number
  public details?: Record<string, unknown>

  constructor(message: string, code: string, statusCode: number = 500, details?: Record<string, unknown>) {
    super(message)
    this.name = 'AppError'
    this.code = code
    this.statusCode = statusCode
    this.details = details
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 'VALIDATION_ERROR', 400, details)
    this.name = 'ValidationError'
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 'AUTHENTICATION_ERROR', 401, details)
    this.name = 'AuthenticationError'
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 'AUTHORIZATION_ERROR', 403, details)
    this.name = 'AuthorizationError'
  }
}

export class DatabaseError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 'DATABASE_ERROR', 500, details)
    this.name = 'DatabaseError'
  }
}

export class NetworkError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 'NETWORK_ERROR', 500, details)
    this.name = 'NetworkError'
  }
}

// Error handler utility
export function handleError(error: unknown): AppError {
  console.error('Error caught:', error)

  if (error instanceof AppError) {
    return error
  }

  if (error instanceof Error) {
    // Check for specific error types
    if (error.message.includes('supabaseKey is required')) {
      return new AuthenticationError('Service role key not configured', { originalError: error.message })
    }

    if (error.message.includes('cross-database references')) {
      return new DatabaseError('Database function error', { originalError: error.message })
    }

    if (error.message.includes('Auth session missing')) {
      return new AuthenticationError('Authentication session not found', { originalError: error.message })
    }

    if (error.message.includes('permission denied')) {
      return new AuthorizationError('Permission denied', { originalError: error.message })
    }

    if (error.message.includes('network') || error.message.includes('fetch')) {
      return new NetworkError('Network error', { originalError: error.message })
    }

    // Generic error
    return new AppError(error.message, 'UNKNOWN_ERROR', 500, { originalError: error.message })
  }

  return new AppError('Unknown error occurred', 'UNKNOWN_ERROR', 500)
}

// Error response formatter
export function formatErrorResponse(error: AppError) {
  return {
    success: false,
    error: error.message,
    code: error.code,
    details: error.details,
    timestamp: new Date().toISOString()
  }
}