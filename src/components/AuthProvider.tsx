'use client'

import { createContext, useContext, useEffect, useMemo, useState } from 'react'
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
      console.log('[AUTH PROVIDER] Auth state changed:', event, session?.user?.id)
      console.log('[AUTH PROVIDER] Current URL:', window.location.href)
      console.log('[AUTH PROVIDER] Event details:', { event, hasSession: !!session, userId: session?.user?.id })
      console.log('[AUTH PROVIDER] Session details:', session)

      setUser(session?.user ?? null)

      // Only refresh router for SIGNED_OUT to avoid conflicts with login redirects
      if (event === 'SIGNED_OUT') {
        console.log('[AUTH PROVIDER] Refreshing router due to auth state change (SIGNED_OUT only)')
        router.refresh()
      }

      setIsLoading(false)
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