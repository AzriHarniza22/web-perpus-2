import { useEffect } from 'react'
import useAuthStore from '@/lib/authStore'
import type { User } from '@supabase/supabase-js'

interface Profile {
  id: string
  email: string
  full_name: string | null
  institution: string | null
  phone: string | null
  profile_photo: string | null
  created_at: string
  updated_at: string
  role?: string
}

interface UseAuthReturn {
  // Auth state
  user: User | null
  profile: Profile | null
  session: any | null
  isLoading: boolean
  sessionWarning: {
    show: boolean
    type: 'first' | 'final' | null
    timeRemaining: number
  }

  // Computed properties
  isAuthenticated: boolean
  isAdmin: boolean
  userRole: string | null
  isSessionValid: boolean
  timeUntilExpiry: number

  // Auth actions
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  fetchUser: () => Promise<void>

  // Session management
  trackActivity: () => void
  extendSession: () => void
  dismissWarning: () => void

  // Helper methods
  hasRole: (role: string) => boolean
  hasAnyRole: (roles: string[]) => boolean
  requireAuth: () => boolean
}

export function useAuth(): UseAuthReturn {
  const {
    user,
    profile,
    session,
    isLoading,
    sessionWarning,
    login,
    logout,
    fetchUser: storeFetchUser,
    trackActivity,
    extendSession,
    dismissWarning
  } = useAuthStore()

  // Auto-fetch user only if no user exists
  useEffect(() => {
    if (!user) {
      storeFetchUser()
    }
  }, [storeFetchUser, user])

  // Computed properties
  const isAuthenticated = !!user
  const isAdmin = profile?.role === 'admin'
  const userRole = profile?.role || null

  // Session-related computed properties
  const isSessionValid = session?.expires_at ? new Date(session.expires_at * 1000) > new Date() : false
  const timeUntilExpiry = session?.expires_at ? Math.max(0, new Date(session.expires_at * 1000).getTime() - Date.now()) : 0

  // Helper methods
  const hasRole = (role: string): boolean => {
    return profile?.role === role
  }

  const hasAnyRole = (roles: string[]): boolean => {
    return profile ? roles.includes(profile.role || '') : false
  }

  const requireAuth = (): boolean => {
    return !!user
  }

  return {
    // Auth state
    user,
    profile,
    session,
    isLoading,
    sessionWarning,

    // Computed properties
    isAuthenticated,
    isAdmin,
    userRole,
    isSessionValid,
    timeUntilExpiry,

    // Auth actions
    login,
    logout,
    fetchUser: storeFetchUser,

    // Session management
    trackActivity,
    extendSession,
    dismissWarning,

    // Helper methods
    hasRole,
    hasAnyRole,
    requireAuth
  }
}