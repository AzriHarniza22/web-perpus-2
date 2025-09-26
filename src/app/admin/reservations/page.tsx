'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import useAuthStore from '@/lib/authStore'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { Loading } from '@/components/ui/loading'
import { Skeleton } from '@/components/ui/skeleton'
import AdminSidebar from '@/components/admin/AdminSidebar'
import BookingManagement from '@/components/admin/BookingManagement'

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

export default function ReservationsPage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const { user, isLoading: authLoading, fetchUser } = useAuthStore()
  const router = useRouter()

  useEffect(() => {
    fetchUser()
  }, [fetchUser])

  useEffect(() => {
    const checkAuth = async () => {
      if (authLoading) return // Wait for auth to load

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

    checkAuth()
  }, [user, authLoading, router])

  if (loading) {
    return (
      <Loading variant="skeleton">
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-blue-900 dark:to-purple-900">
          {/* Sidebar */}
          <AdminSidebar onToggle={setSidebarCollapsed} />

          {/* Header */}
          <motion.header
            initial={{ y: -100 }}
            animate={{ y: 0 }}
            className={`bg-white/90 dark:bg-gray-900/90 backdrop-blur-lg border-b border-gray-200 dark:border-gray-800 transition-all duration-300 ${
              sidebarCollapsed ? 'ml-16' : 'ml-64'
            }`}
          >
            <div className="px-6 py-4 flex justify-between items-center">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <Skeleton className="h-8 w-48 mb-1" />
                <Skeleton className="h-4 w-64" />
              </motion.div>
              <div className="flex items-center space-x-4">
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-gray-600 dark:text-gray-300 hidden md:block"
                >
                  <Skeleton className="h-4 w-32" />
                </motion.span>
                <ThemeToggle />
                <Skeleton className="h-8 w-20" />
              </div>
            </div>
          </motion.header>

          <main className={`p-6 transition-all duration-300 ${
            sidebarCollapsed ? 'ml-16' : 'ml-64'
          }`}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8"
            >
              <Skeleton className="h-10 w-64 mb-2" />
              <Skeleton className="h-5 w-96" />
            </motion.div>

            {/* Content skeleton */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <div className="space-y-6">
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-96 w-full" />
              </div>
            </motion.div>
          </main>
        </div>
      </Loading>
    )
  }

  if (!profile) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-blue-900 dark:to-purple-900">
      {/* Sidebar */}
      <AdminSidebar onToggle={setSidebarCollapsed} />

      {/* Header */}
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className={`bg-white/90 dark:bg-gray-900/90 backdrop-blur-lg border-b border-gray-200 dark:border-gray-800 transition-all duration-300 ${
          sidebarCollapsed ? 'ml-16' : 'ml-64'
        }`}
      >
        <div className="px-6 py-4 flex justify-between items-center">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Reservations Management
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">View, filter, and manage all room reservations</p>
          </motion.div>
          <div className="flex items-center space-x-4">
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-gray-600 dark:text-gray-300 hidden md:block"
            >
              Welcome, {profile?.full_name}
            </motion.span>
            <ThemeToggle />
          </div>
        </div>
      </motion.header>

      <main className={`transition-all duration-300 ${
        sidebarCollapsed ? 'ml-16' : 'ml-64'
      }`}>
        <BookingManagement />
      </main>
    </div>
  )
}