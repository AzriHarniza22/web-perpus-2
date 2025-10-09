'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { User } from '@supabase/supabase-js'
import { Button } from '@/components/ui/button'
import { Loading } from '@/components/ui/loading'
import UserSidebar from '@/components/UserSidebar'
import { PageHeader } from '@/components/ui/page-header'
import TourBookingForm from '@/components/TourBookingForm'
import { Sparkles } from 'lucide-react'
import { Booking as BookingType } from '@/lib/types'

// Tour interface matching database schema
interface Tour {
  id: string
  name: string
  description: string | null
  capacity: number
  facilities: string[] | null
  photos: string[] | null
  layout: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export default function BookTourPage() {
  const [loading, setLoading] = useState(true)
  const [tourLoading, setTourLoading] = useState(true)
  const [user, setUser] = useState<User | null>(null)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [existingBookings, setExistingBookings] = useState<BookingType[]>([])
  const [tour, setTour] = useState<Tour | null>(null)
  const [tourError, setTourError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    const checkAuthAndFetchTour = async () => {
      // Check if user is authenticated
      const { data: { user: currentUser } } = await supabase.auth.getUser()
      setUser(currentUser)

      if (!currentUser) {
        console.log('User not authenticated')
        setLoading(false)
        setTourLoading(false)
        return
      }

      // Fetch Library Tour data from database
      try {
        const { data: tourData, error: tourError } = await supabase
          .from('rooms')
          .select('*')
          .eq('name', 'Library Tour')
          .eq('is_active', true)
          .single()

        if (tourError) {
          console.error('Error fetching Library Tour:', tourError)
          setTourError('Failed to load tour information')
          setTour(null)
        } else if (tourData) {
          setTour(tourData)
          setTourError(null)

          // Fetch existing tour bookings using actual room UUID (future bookings only)
          try {
            const now = new Date().toISOString()
            const { data: bookings, error } = await supabase
              .from('bookings')
              .select('*')
              .eq('room_id', tourData.id) // Use actual room UUID for bookings
              .eq('is_tour', true) // Only fetch tour bookings
              .in('status', ['pending', 'approved'])
              .gte('start_time', now) // Only future bookings like landing page

            if (error) {
              console.error('Error fetching tour bookings:', error)
            } else {
              setExistingBookings(bookings || [])
            }
          } catch (err) {
            console.error('Unexpected error fetching tour bookings:', err)
          }
        } else {
          setTourError('Library Tour not found')
          setTour(null)
        }
      } catch (err) {
        console.error('Unexpected error fetching tour:', err)
        setTourError('Failed to load tour information')
        setTour(null)
      }

      setLoading(false)
      setTourLoading(false)
    }

    checkAuthAndFetchTour()
  }, [])

  if (loading || tourLoading) {
    return <Loading variant="fullscreen" />
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 bg-secondary-100 dark:bg-secondary-900 rounded-full flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-8 h-8 text-secondary-600 dark:text-secondary-400" />
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

  if (tourError || !tour) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-8 h-8 text-red-600 dark:text-red-400" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Tour Tidak Tersedia
          </h1>
          <p className="text-gray-600 mb-6">
            {tourError || 'Informasi tour tidak dapat dimuat saat ini.'}
          </p>
          <Button onClick={() => window.location.reload()}>
            Coba Lagi
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-secondary-50 via-accent-50 to-orange-50 dark:from-gray-900 dark:via-secondary-900 dark:to-secondary-900">
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
          <TourBookingForm
            existingBookings={existingBookings}
            onBookingSuccess={() => {
              // Refresh bookings after successful submission
              const refreshBookings = async () => {
                if (tour) {
                  try {
                    const now = new Date().toISOString()
                    const { data: bookings, error } = await supabase
                      .from('bookings')
                      .select('*')
                      .eq('room_id', tour.id)
                      .eq('is_tour', true) // Only fetch tour bookings
                      .in('status', ['pending', 'approved'])
                      .gte('start_time', now) // Only future bookings like landing page

                    if (error) {
                      console.error('Error refreshing tour bookings:', error)
                    } else {
                      setExistingBookings(bookings || [])
                    }
                  } catch (err) {
                    console.error('Unexpected error refreshing bookings:', err)
                  }
                }
              }
              refreshBookings()
            }}
          />
        </div>
      </main>
    </div>
  )
}