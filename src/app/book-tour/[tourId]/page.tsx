'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import { User } from '@supabase/supabase-js'
import { Button } from '@/components/ui/button'
import { Loading } from '@/components/ui/loading'
import UserSidebar from '@/components/UserSidebar'
import { PageHeader } from '@/components/ui/page-header'
import TourBookingForm from '@/components/TourBookingForm'
import { ArrowLeft, Sparkles } from 'lucide-react'
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

interface Booking extends BookingType {}

// Library Tour data - fixed tour information as required
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

// Mock tour data for backward compatibility
const mockTours: Tour[] = [
  libraryTour,
  {
    id: 'tour-1',
    name: 'Library Heritage Tour',
    description: 'Explore the rich history and architecture of our historic library building',
    duration: 90,
    maxParticipants: 15,
    meetingPoint: 'Main Entrance Lobby',
    guideName: 'Dr. Sarah Johnson',
    guideContact: 'sarah.johnson@library.edu',
    schedule: [
      { id: 'sched-1', tourId: 'tour-1', dayOfWeek: 1, startTime: '10:00', availableSlots: 15 },
      { id: 'sched-2', tourId: 'tour-1', dayOfWeek: 3, startTime: '14:00', availableSlots: 15 },
      { id: 'sched-3', tourId: 'tour-1', dayOfWeek: 5, startTime: '10:00', availableSlots: 15 },
    ],
    isActive: true,
  },
  {
    id: 'tour-2',
    name: 'Digital Archives Tour',
    description: 'Discover our extensive digital collection and research resources',
    duration: 60,
    maxParticipants: 10,
    meetingPoint: 'Digital Services Desk',
    guideName: 'Prof. Michael Chen',
    guideContact: 'michael.chen@library.edu',
    schedule: [
      { id: 'sched-4', tourId: 'tour-2', dayOfWeek: 2, startTime: '11:00', availableSlots: 10 },
      { id: 'sched-5', tourId: 'tour-2', dayOfWeek: 4, startTime: '15:00', availableSlots: 10 },
    ],
    isActive: true,
  },
  {
    id: 'tour-3',
    name: 'Children\'s Literature Tour',
    description: 'A fun and educational tour of our children\'s literature collection',
    duration: 45,
    maxParticipants: 20,
    meetingPoint: 'Children\'s Section',
    guideName: 'Ms. Emily Rodriguez',
    guideContact: 'emily.rodriguez@library.edu',
    schedule: [
      { id: 'sched-6', tourId: 'tour-3', dayOfWeek: 6, startTime: '10:30', availableSlots: 20 },
    ],
    isActive: true,
  },
]

export default function BookSpecificTourPage({ params }: { params: { tourId: string } }) {
  const [tour, setTour] = useState<Tour | null>(null)
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<User | null>(null)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [existingBookings, setExistingBookings] = useState<BookingType[]>([])
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

      // Always use Library Tour regardless of tourId parameter
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
  }, [params.tourId])

  if (loading) {
    return <Loading variant="fullscreen" />
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
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

  if (!tour) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-8 h-8 text-purple-600 dark:text-purple-400" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Tour tidak ditemukan
          </h1>
          <p className="text-gray-600 mb-6">
            Tour yang Anda cari tidak tersedia atau sudah tidak aktif.
          </p>
          <Button onClick={() => router.push('/book-tour')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Kembali ke Daftar Tour
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
        title={`Pesan ${tour.name}`}
        description={tour.description}
        user={user}
        sidebarCollapsed={sidebarCollapsed}
      />

      <main className={`py-8 transition-all duration-300 ${
        sidebarCollapsed ? 'ml-16' : 'ml-64'
      }`}>
        <div className="max-w-4xl mx-auto px-4">
          {/* Back Button */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="mb-6"
          >
            <Button
              variant="outline"
              onClick={() => router.push('/book-tour')}
              className="bg-white/80 hover:bg-white dark:bg-gray-800/80 dark:hover:bg-gray-800"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Kembali ke Daftar Tour
            </Button>
          </motion.div>

          {/* Tour Information Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-gray-200/50 dark:border-gray-700/50">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                    {tour.name}
                  </h2>
                  <p className="text-gray-600 dark:text-gray-300 mb-4">
                    {tour.description}
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900 dark:text-white">Durasi:</span>
                      <span className="text-gray-600 dark:text-gray-300">{tour.duration} menit</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900 dark:text-white">Max Peserta:</span>
                      <span className="text-gray-600 dark:text-gray-300">{tour.maxParticipants} orang</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900 dark:text-white">Meeting Point:</span>
                      <span className="text-gray-600 dark:text-gray-300">{tour.meetingPoint}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Booking Form */}
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