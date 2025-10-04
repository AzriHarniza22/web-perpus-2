import { createBrowserClient } from '@supabase/ssr'
import { createServerClient } from '@supabase/ssr'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { DatabaseError, AuthenticationError } from './errors'
import { config, validateConfig } from './config'
import { Profile } from './types'

// Validate configuration on module load
const configValidation = validateConfig()
if (configValidation.isValid) {
  console.info('✅ Supabase configuration validated successfully')
} else {
  console.warn('⚠️ Supabase configuration validation failed - some environment variables are missing', {
    missing: configValidation.missing
  })
}

// Client-side Supabase client (singleton)
let supabaseClient: ReturnType<typeof createBrowserClient>

export const getSupabase = () => {
  if (!supabaseClient) {
    supabaseClient = createBrowserClient(config.supabase.url, config.supabase.anonKey)
    console.debug('Browser Supabase client initialized')
  }
  return supabaseClient
}

// Server-side Supabase client for API routes
export const getSupabaseServer = async (request?: NextRequest, response?: NextResponse) => {
  const client = createServerClient(config.supabase.url, config.supabase.anonKey, {
    cookies: {
      getAll() {
        return request ? request.cookies.getAll() : []
      },
      setAll(cookiesToSet) {
        if (response) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options)
          })
        }
      },
    },
  })

  console.debug('Server Supabase client initialized')
  return client
}

// Service role client for admin operations (bypass RLS)
export const getSupabaseAdmin = () => {
  const client = createClient(config.supabase.url, config.supabase.serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  })

  console.debug('Admin Supabase client initialized')
  return client
}

// Database operation helpers
export const dbHelpers = {
  // Safe profile operations
  async getProfile(supabase: SupabaseClient, userId: string) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error && error.code !== 'PGRST116') {
        throw new DatabaseError('Failed to fetch profile', { originalError: error })
      }

      return data
    } catch (error) {
      throw new DatabaseError('Profile fetch failed', { originalError: error })
    }
  },

  async createProfile(supabase: SupabaseClient, profileData: Omit<Profile, 'id' | 'created_at' | 'updated_at'>) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .insert(profileData)
        .select()
        .single()

      if (error) {
        throw new DatabaseError('Failed to create profile', { originalError: error })
      }

      return data
    } catch (error) {
      throw new DatabaseError('Profile creation failed', { originalError: error })
    }
  },

  async updateProfile(supabase: SupabaseClient, userId: string, updates: Partial<Omit<Profile, 'id' | 'created_at' | 'updated_at'>>) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', userId)
        .select()
        .single()

      if (error) {
        throw new DatabaseError('Failed to update profile', { originalError: error })
      }

      return data
    } catch (error) {
      throw new DatabaseError('Profile update failed', { originalError: error })
    }
  }
}

// Export singleton instance for client-side usage
export const supabase = getSupabase()