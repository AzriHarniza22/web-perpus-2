import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { cache } from 'react'
import type { User } from '@supabase/supabase-js'

export type Profile = {
  id: string
  email: string
  full_name: string | null
  role: 'user' | 'admin' | 'staff'
  created_at: string
  updated_at: string
}

/**
 * Get current authenticated user
 * Returns null if not authenticated
 * Uses React cache to prevent multiple calls in same request
 */
export const getUser = cache(async (): Promise<User | null> => {
  try {
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error) {
      // Only log non-session-missing errors
      if (!error.message.includes('Auth session missing')) {
        console.error('Error getting user:', error.message)
      }
      return null
    }

    return user
  } catch (err) {
    // Handle any unexpected errors silently
    return null
  }
})

/**
 * Get user profile from database
 * Returns null if user not authenticated or profile not found
 * Uses React cache to prevent multiple calls in same request
 */
export const getProfile = cache(async (): Promise<Profile | null> => {
  const user = await getUser()
  if (!user) return null

  const supabase = await createClient()
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (error) {
    console.error('Error getting profile:', error.message)
    return null
  }

  return profile
})

/**
 * Require authentication
 * Redirects to login if not authenticated
 * @param redirectTo - Optional path to redirect after login
 */
export const requireAuth = async (redirectTo?: string): Promise<User> => {
  const user = await getUser()
  
  if (!user) {
    const params = redirectTo ? `?redirect=${encodeURIComponent(redirectTo)}` : ''
    redirect(`/login${params}`)
  }
  
  return user
}

/**
 * Require admin role
 * Redirects to home if not admin
 */
export const requireAdmin = async (): Promise<Profile> => {
  const user = await requireAuth()
  const profile = await getProfile()
  
  if (!profile || profile.role !== 'admin') {
    redirect('/')
  }
  
  return profile
}

/**
 * Require staff role (admin or staff)
 * Redirects to home if not staff or admin
 */
export const requireStaff = async (): Promise<Profile> => {
  const user = await requireAuth()
  const profile = await getProfile()
  
  if (!profile || !['admin', 'staff'].includes(profile.role)) {
    redirect('/')
  }
  
  return profile
}

/**
 * Check if user is authenticated (without redirect)
 * Useful for conditional rendering
 */
export const isAuthenticated = async (): Promise<boolean> => {
  const user = await getUser()
  return !!user
}

/**
 * Check if user is admin (without redirect)
 * Useful for conditional rendering
 */
export const isAdmin = async (): Promise<boolean> => {
  const profile = await getProfile()
  return profile?.role === 'admin'
}

/**
 * Check if user is staff or admin (without redirect)
 * Useful for conditional rendering
 */
export const isStaff = async (): Promise<boolean> => {
  const profile = await getProfile()
  return ['admin', 'staff'].includes(profile?.role || '')
}