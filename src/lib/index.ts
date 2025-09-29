// Core exports for easy importing
export * from './types'
export * from './validation'
export * from './config'
export * from './supabase'

// Specific exports to avoid naming conflicts
export {
  AppError,
  ValidationError as AppValidationError,
  AuthenticationError,
  AuthorizationError,
  DatabaseError,
  NetworkError,
  handleError,
  formatErrorResponse
} from './errors'

// Re-export commonly used items
export { supabase } from './supabase'