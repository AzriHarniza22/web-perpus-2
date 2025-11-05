import { useState, useEffect } from 'react'
import { useAuth } from '@/components/AuthProvider'
import { supabase } from '@/lib/supabase'
import { User } from '@supabase/supabase-js'
import { Profile } from '@/lib/types'

interface UserData {
  user: User | null
  profile: Profile | null
  isLoading: boolean
  isProfileLoading: boolean
}

/**
 * Custom hook for fetching user and profile data consistently across skeleton components
 * Provides loading states and proper error handling
 */
export const useUserData = (): UserData => {
  const { user, isLoading: authLoading } = useAuth()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [profileLoading, setProfileLoading] = useState(true)

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user?.id || authLoading) {
        setProfileLoading(false)
        return
      }

      try {
        setProfileLoading(true)
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()

        if (!error && data) {
          setProfile(data)
        }
      } catch (error) {
        console.error('Error fetching profile:', error)
        // Don't throw error, just log it and continue with null profile
        setProfile(null)
      } finally {
        setProfileLoading(false)
      }
    }

    fetchProfile()
  }, [user?.id, authLoading])

  // Determine if any loading is happening
  const isLoading = authLoading || profileLoading

  return {
    user,
    profile,
    isLoading,
    isProfileLoading: profileLoading
  }
}

export default useUserData