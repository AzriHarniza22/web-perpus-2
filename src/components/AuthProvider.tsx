'use client'

import { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'

type AuthContextType = {
  user: User | null
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
})

export function AuthProvider({
  children,
  initialUser,
}: {
  children: React.ReactNode
  initialUser: User | null
}) {
  const [user, setUser] = useState<User | null>(initialUser)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])

  useEffect(() => {
    // Listen to auth state changes for real-time updates
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      const newUser = session?.user ?? null
      setUser(newUser)

      // Handle different auth events
      if (event === 'SIGNED_OUT') {
        setUser(null)
        setIsLoading(false)

        // Note: LogoutButton handles storage clearing and redirect, so we don't need to do it here
        // to avoid conflicts and flash messages

      } else if (event === 'INITIAL_SESSION') {
        setIsLoading(false)
      } else if (event === 'TOKEN_REFRESHED') {
        setIsLoading(false)
      } else {
        setIsLoading(false)
      }
    })

    return () => {
      console.log('[AUTH PROVIDER] Cleaning up auth subscription')
      subscription.unsubscribe()
    }
  }, [supabase])

  return (
    <AuthContext.Provider value={{ user, isLoading }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}