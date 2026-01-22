'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function LogoutButton() {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleLogout = async () => {
    setIsLoading(true)

    try {
      console.log('[LOGOUT] Starting comprehensive logout process')

      // 1. Sign out from Supabase
      const { error } = await supabase.auth.signOut()
      if (error) {
        console.error('[LOGOUT] Supabase sign out error:', error)
      }

      console.log('[LOGOUT] Supabase sign out successful')

      // 2. Clear ALL browser storage
      console.log('[LOGOUT] Clearing browser storage')

      // Clear localStorage
      const keysToRemove = []
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key && (key.includes('sb-') || key.includes('supabase') || key.includes('auth'))) {
          keysToRemove.push(key)
        }
      }
      keysToRemove.forEach(key => {
        localStorage.removeItem(key)
        console.log(`[LOGOUT] Removed localStorage key: ${key}`)
      })

      // Clear sessionStorage
      for (let i = sessionStorage.length - 1; i >= 0; i--) {
        const key = sessionStorage.key(i)
        if (key && (key.includes('sb-') || key.includes('supabase') || key.includes('auth'))) {
          sessionStorage.removeItem(key)
          console.log(`[LOGOUT] Removed sessionStorage key: ${key}`)
        }
      }

      // 3. Clear all cookies manually
      console.log('[LOGOUT] Clearing all cookies')
      const cookies = document.cookie.split(';')
      cookies.forEach(cookie => {
        const eqPos = cookie.indexOf('=')
        const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim()
        if (name && (name.includes('sb-') || name.includes('supabase'))) {
          document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`
          console.log(`[LOGOUT] Cleared cookie: ${name}`)
        }
      })

      console.log('[LOGOUT] All storage cleared, redirecting to login')

      // 4. Force complete page reload and redirect
      window.location.href = '/login'

    } catch (error) {
      console.error('[LOGOUT] Unexpected error:', error)
      // Even if there's an error, try to redirect and clear storage
      window.location.href = '/login'
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <button
      onClick={handleLogout}
      disabled={isLoading}
      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {isLoading ? 'Logging out...' : 'Logout'}
    </button>
  )
}