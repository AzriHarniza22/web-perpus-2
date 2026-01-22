'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/AuthProvider'
import { supabase } from '@/lib/supabase'
import AdminDashboard from '../../components/admin/AdminDashboard'
import { Skeleton } from '@/components/ui/skeleton'

type Profile = {
  id: string
  email: string
  full_name: string | null
  institution: string | null
  phone: string | null
  role: 'admin'
  created_at: string
  updated_at: string
}

export default function AdminPage() {
  const { user, isLoading } = useAuth()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const checkAdminAccess = async () => {
      if (!user) {
        console.log('[ADMIN PAGE] No user, redirecting to login')
        router.push('/login')
        return
      }

      try {
        console.log(`[ADMIN PAGE] Checking admin access for user: ${user.id}`)
        const { data: profileData, error } = await supabase
          .from('profiles')
          .select('id, email, full_name, role, institution, phone, created_at, updated_at')
          .eq('id', user.id)
          .single()

        if (error) {
          console.error('[ADMIN PAGE] Error fetching profile:', error)
          router.push('/login')
          return
        }

        if (profileData.role !== 'admin') {
          console.log(`[ADMIN PAGE] User is not admin (role: ${profileData.role}), redirecting to dashboard`)
          router.push('/dashboard')
          return
        }

        console.log('[ADMIN PAGE] Admin access granted:', profileData)
        setProfile(profileData)
        setLoading(false)
      } catch (error) {
        console.error('[ADMIN PAGE] Unexpected error:', error)
        router.push('/login')
      }
    }

    if (!isLoading) {
      checkAdminAccess()
    }
  }, [user, isLoading, router])

  if (isLoading || loading) {
    return (
      <div className="space-y-4 p-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-96" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (!profile) {
    return null // Will redirect
  }

  return <AdminDashboard profile={profile} />
}