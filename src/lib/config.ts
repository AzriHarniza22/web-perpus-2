import { EnvironmentVariables } from './types'

// Environment variables validation and configuration
export const config = {
  // Supabase configuration
  supabase: {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL!,
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
  },

  // Email configuration
  email: {
    host: process.env.EMAIL_HOST!,
    port: parseInt(process.env.EMAIL_PORT || '465'),
    secure: process.env.EMAIL_SECURE === 'true',
    user: process.env.EMAIL_USER!,
    pass: process.env.EMAIL_PASS!,
    from: process.env.EMAIL_FROM!,
  },

  // Application configuration
  app: {
    name: 'Library Reservation System',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    isDevelopment: process.env.NODE_ENV === 'development',
    isProduction: process.env.NODE_ENV === 'production',
  },

  // Validation rules
  validation: {
    password: {
      minLength: 6,
      requireUppercase: false,
      requireNumbers: false,
      requireSpecialChars: false,
    },
    email: {
      allowPlusAddressing: true,
      blockDisposable: false,
    },
  },

  // API configuration
  api: {
    timeout: 10000, // 10 seconds
    retryAttempts: 3,
    rateLimit: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      maxRequests: 100,
    },
  },

  // Session management configuration
  session: {
    // Session timeout periods (in milliseconds)
    timeouts: {
      regular: 8 * 60 * 60 * 1000, // 8 hours for regular users
      admin: 30 * 60 * 1000, // 30 minutes for admin users
      extended: 24 * 60 * 60 * 1000, // 24 hours for extended sessions
    },

    // Warning periods before session expiry (in milliseconds)
    warnings: {
      first: 10 * 60 * 1000, // 10 minutes before expiry
      final: 2 * 60 * 1000, // 2 minutes before expiry
    },

    // Token refresh configuration
    refresh: {
      threshold: 5 * 60 * 1000, // Refresh if expires within 5 minutes
      retryAttempts: 3,
      retryDelay: 1000, // 1 second between retries
    },

    // Activity tracking
    activity: {
      idleThreshold: 30 * 60 * 1000, // 30 minutes of inactivity
      checkInterval: 60 * 1000, // Check every minute
      extendOnActivity: true,
    },

    // Storage configuration
    storage: {
      prefix: 'library_session_',
      secure: true,
    },
  },
}

// Validate required environment variables
export const validateConfig = (): { isValid: boolean; missing: string[] } => {
  const required = [
    { key: 'NEXT_PUBLIC_SUPABASE_URL', value: config.supabase.url },
    { key: 'NEXT_PUBLIC_SUPABASE_ANON_KEY', value: config.supabase.anonKey },
    { key: 'SUPABASE_SERVICE_ROLE_KEY', value: config.supabase.serviceRoleKey },
  ]

  const missing = required.filter(item => !item.value)

  return {
    isValid: missing.length === 0,
    missing: missing.map(m => m.key)
  }
}

// Export environment variables interface
export const env: EnvironmentVariables = {
  supabaseUrl: config.supabase.url,
  supabaseAnonKey: config.supabase.anonKey,
  supabaseServiceRoleKey: config.supabase.serviceRoleKey,
  emailConfig: config.email,
}