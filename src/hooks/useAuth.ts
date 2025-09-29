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
  isLoading: boolean

  // Computed properties
  isAuthenticated: boolean
  isAdmin: boolean
  userRole: string | null

  // Auth actions
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  fetchUser: () => Promise<void>

  // Helper methods
  hasRole: (role: string) => boolean
  hasAnyRole: (roles: string[]) => boolean
  requireAuth: () => boolean
}

export function useAuth(): UseAuthReturn {
  const {
    user,
    profile,
    isLoading,
    login,
    logout,
    fetchUser: storeFetchUser
  } = useAuthStore()

  // Auto-fetch user on mount
  useEffect(() => {
    storeFetchUser()
  }, [storeFetchUser])

  // Computed properties
  const isAuthenticated = !!user
  const isAdmin = profile?.role === 'admin'
  const userRole = profile?.role || null

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
    isLoading,

    // Computed properties
    isAuthenticated,
    isAdmin,
    userRole,

    // Auth actions
    login,
    logout,
    fetchUser: storeFetchUser,

    // Helper methods
    hasRole,
    hasAnyRole,
    requireAuth
  }
}