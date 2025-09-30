'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import { User } from '@supabase/supabase-js'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Loading } from '@/components/ui/loading'
import UserSidebar from '@/components/UserSidebar'
import { PageHeader } from '@/components/ui/page-header'
import TourBookingForm from '@/components/TourBookingForm'
import { Sparkles } from 'lucide-react'

export default function BookTourPage() {
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<User | null>(null)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const checkAuth = async () => {
      // Check if user is authenticated
      const { data: { user: currentUser } } = await supabase.auth.getUser()
      setUser(currentUser)

      if (!currentUser) {
        console.log('User not authenticated')
      }

      setLoading(false)
    }

    checkAuth()
  }, [])

  if (loading) {
    return <Loading variant="fullscreen" />
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-8 h-8 text-purple-600 dark:text-purple-400" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Anda perlu login untuk memesan tour
          </h1>
          <p className="text-gray-600 mb-6">
            Silakan login terlebih dahulu untuk melanjutkan pemesanan tour.
          </p>
          <Button onClick={() => router.push('/login')}>
            Login
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 dark:from-gray-900 dark:via-purple-900 dark:to-purple-900">
      {/* Sidebar */}
      <UserSidebar onToggle={setSidebarCollapsed} />

      {/* Header */}
      <PageHeader
        title="Book Library Tour"
        description="Reserve your spot for a guided tour of the library facilities and collections"
        user={user}
        sidebarCollapsed={sidebarCollapsed}
      />

      <main className={`py-8 transition-all duration-300 ${
        sidebarCollapsed ? 'ml-16' : 'ml-64'
      }`}>
        <div className="max-w-4xl mx-auto px-4">
          {/* Tour Booking Form */}
          <TourBookingForm />
        </div>
      </main>
    </div>
  )
}