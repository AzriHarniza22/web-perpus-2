'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/components/AuthProvider'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Loading } from '@/components/ui/loading'
import { Skeleton } from '@/components/ui/skeleton'
import { AdminRoomsSkeleton } from '@/components/ui/skeletons'
import { RoomsContentSkeleton } from '@/components/ui/skeletons'
import { LogOut } from 'lucide-react'
import AdminSidebar from '@/components/admin/AdminSidebar'
import RoomManagement from '@/components/admin/RoomManagement'
import { UnifiedPageHeader } from '@/components/ui/unified-page-header'

interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  institution: string | null;
  phone: string | null;
  profile_photo: string | null;
  role: 'admin';
  created_at: string;
  updated_at: string;
}

export default function RoomsPage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const { user, isLoading: authLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    const checkAuth = async () => {
      if (!user) {
        router.push('/login')
        return
      }

      // Check if user is admin
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (profileData?.role !== 'admin') {
        router.push('/')
        return
      }

      setProfile(profileData)
      setLoading(false)
    }

    if (user) {
      checkAuth()
    } else if (!authLoading && !user) {
      router.push('/login')
      setLoading(false)
    }
  }, [user, router, authLoading])

  // Transform profile to User type for UnifiedPageHeader
  const transformedProfile = profile ? {
    id: profile.id,
    email: profile.email,
    app_metadata: {},
    user_metadata: {
      full_name: profile.full_name || null,
      role: profile.role || 'admin'
    },
    aud: 'authenticated',
    created_at: profile.created_at,
  } : null

  if (!profile && !loading) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-primary/5 to-secondary/10 dark:from-background dark:via-primary/20 dark:to-secondary/20">
      {/* Sidebar - Real component, not skeleton */}
      <AdminSidebar onToggle={setSidebarCollapsed} />

      {/* Header - Real component, not skeleton */}
      <UnifiedPageHeader
        title="Manajemen Ruangan"
        description="Kelola ruangan perpustakaan - tambah, edit, dan nonaktifkan ruangan"
        user={transformedProfile}
        profile={profile}
        isAdmin={true}
        sidebarCollapsed={sidebarCollapsed}
      />

      <main className={`pt-24 p-6 transition-all duration-300 ${
        sidebarCollapsed ? 'ml-16' : 'ml-64'
      }`}>
        {/* Room Management Component */}
        <Card className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm">
          <CardContent className="p-6">
            <RoomManagement />
          </CardContent>
        </Card>
      </main>
    </div>
  )
}