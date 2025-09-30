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
import { Booking as BookingType } from '@/lib/types'

// Tour interface
interface Tour {
  id: string
  name: string
  description: string
  duration: number
  maxParticipants: number
  meetingPoint: string
  guideName: string
  guideContact: string
  schedule: TourSchedule[]
  isActive: boolean
}

interface TourSchedule {
  id: string
  tourId: string
  dayOfWeek: number
  startTime: string
  availableSlots: number
}

// Library Tour data - fixed tour information
const libraryTour: Tour = {
  id: 'library-tour',
  name: 'Library Tour',
  description: 'Guided tour of the library facilities and collections',
  duration: 60,
  maxParticipants: 50,
  meetingPoint: 'Main Entrance',
  guideName: 'Library Staff',
  guideContact: 'info@library.edu',
  schedule: [
    { id: 'sched-library-1', tourId: 'library-tour', dayOfWeek: 1, startTime: '10:00', availableSlots: 50 },
    { id: 'sched-library-2', tourId: 'library-tour', dayOfWeek: 2, startTime: '14:00', availableSlots: 50 },
    { id: 'sched-library-3', tourId: 'library-tour', dayOfWeek: 3, startTime: '10:00', availableSlots: 50 },
    { id: 'sched-library-4', tourId: 'library-tour', dayOfWeek: 4, startTime: '14:00', availableSlots: 50 },
    { id: 'sched-library-5', tourId: 'library-tour', dayOfWeek: 5, startTime: '10:00', availableSlots: 50 },
  ],
  isActive: true,
}

export default function BookTourPage() {
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<User | null>(null)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [existingBookings, setExistingBookings] = useState<BookingType[]>([])
  const [tour, setTour] = useState<Tour | null>(null)
  const router = useRouter()

  useEffect(() => {
    const checkAuthAndFetchTour = async () => {
      // Check if user is authenticated
      const { data: { user: currentUser } } = await supabase.auth.getUser()
      setUser(currentUser)

      if (!currentUser) {
        console.log('User not authenticated')
        setLoading(false)
        return
      }

      // Set Library Tour as the default tour
      setTour(libraryTour)

      // Get the Library Tour room UUID from database
      const { data: room, error: roomError } = await supabase
        .from('rooms')
        .select('id')
        .eq('name', 'Library Tour')
        .single()

      if (roomError || !room) {
        console.error('Library Tour room not found:', roomError)
      } else {
        // Fetch existing tour bookings using actual room UUID (future bookings only)
        try {
          const now = new Date().toISOString()
          const { data: bookings, error } = await supabase
            .from('bookings')
            .select('*')
            .eq('room_id', room.id) // Use actual room UUID for bookings
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
      }

      setLoading(false)
    }

    checkAuthAndFetchTour()
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
          <TourBookingForm
            existingBookings={existingBookings}
            onBookingSuccess={() => {
              // Refresh bookings after successful submission
              const refreshBookings = async () => {
                try {
                  const { data: room } = await supabase
                    .from('rooms')
                    .select('id')
                    .eq('name', 'Library Tour')
                    .single()

                  if (room) {
                    const now = new Date().toISOString()
                    const { data: bookings, error } = await supabase
                      .from('bookings')
                      .select('*')
                      .eq('room_id', room.id)
                      .eq('is_tour', true) // Only fetch tour bookings
                      .in('status', ['pending', 'approved'])
                      .gte('start_time', now) // Only future bookings like landing page

                    if (error) {
                      console.error('Error refreshing tour bookings:', error)
                    } else {
                      setExistingBookings(bookings || [])
                    }
                  }
                } catch (err) {
                  console.error('Unexpected error refreshing bookings:', err)
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