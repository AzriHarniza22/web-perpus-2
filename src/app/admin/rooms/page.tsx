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

interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  institution: string | null;
  phone: string | null;
  role: 'user' | 'admin';
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

  if (!profile && !loading) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-primary/5 to-secondary/10 dark:from-background dark:via-primary/20 dark:to-secondary/20">
      {/* Sidebar */}
      <AdminSidebar onToggle={setSidebarCollapsed} loading={loading || authLoading} />

      {/* Header */}
      <div
        className={`bg-white/90 dark:bg-gray-900/90 backdrop-blur-lg border-b border-gray-200 dark:border-gray-800 transition-all duration-300 ${
          sidebarCollapsed ? 'ml-16' : 'ml-64'
        }`}
      >
        <div className="px-6 py-4 flex justify-between items-center">
          <motion.div
            initial={loading ? { opacity: 1 } : { opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Manajemen Ruangan
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">Kelola ruangan perpustakaan</p>
          </motion.div>
          <div className="flex items-center space-x-4">
            <motion.span
              initial={loading ? { opacity: 1 } : { opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-gray-600 dark:text-gray-300 hidden md:block"
            >
              {loading ? 'Loading...' : `Selamat datang, ${profile?.full_name}`}
            </motion.span>
            <ThemeToggle />
            <form action="/auth/signout" method="post">
              <Button variant="outline" size="sm" type="submit">
                <LogOut className="w-4 h-4 mr-2" />
                Keluar
              </Button>
            </form>
          </div>
        </div>
      </div>

      <main className={`p-6 transition-all duration-300 ${
        sidebarCollapsed ? 'ml-16' : 'ml-64'
      }`}>
        {loading ? (
          <RoomsContentSkeleton />
        ) : (
          <>
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                Manajemen Ruangan
              </h1>
              <p className="text-gray-600 dark:text-gray-300">
                Kelola ruangan perpustakaan - tambah, edit, dan nonaktifkan ruangan
              </p>
            </div>

            {/* Room Management Component */}
            <Card className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm">
              <CardContent className="p-6">
                <RoomManagement />
              </CardContent>
            </Card>
          </>
        )}
      </main>
    </div>
  )
}