'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import RoomInfoCard from '@/components/RoomInfoCard'
import ReservationCalendarCard from '@/components/ReservationCalendarCard'
import ReservationFormCard from '@/components/ReservationFormCard'
import UserSidebar from '@/components/UserSidebar'
import { PageHeader } from '@/components/ui/page-header'
import { Loading } from '@/components/ui/loading'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/useAuth'
import { Sparkles } from 'lucide-react'

import { Room, Booking } from '@/lib/api'

export default function BookRoomPage() {
  const params = useParams()
  const roomId = params.roomId as string
  const { user, isLoading, isAuthenticated } = useAuth()
  const [room, setRoom] = useState<Room | null>(null)
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())
  const router = useRouter()



  useEffect(() => {
    const fetchData = async () => {
      if (!isAuthenticated || !user) {
        setLoading(false)
        return
      }

      // Ensure user profile exists
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .single()

      if (!profile) {
        // Create profile if it doesn't exist
        await supabase
          .from('profiles')
          .insert({
            id: user.id,
            email: user.email,
            full_name: user.user_metadata?.full_name || '',
            institution: user.user_metadata?.institution || '',
            phone: user.user_metadata?.phone || '',
          })
      }

      // Get room details
      const { data: roomData } = await supabase
        .from('rooms')
        .select('*')
        .eq('id', roomId)
        .eq('is_active', true)
        .single()

      if (!roomData) {
        setLoading(false)
        return
      }

      setRoom(roomData)

      // Get existing bookings for this room (future bookings only)
      const now = new Date().toISOString()
      const { data: bookingsData } = await supabase
        .from('bookings')
        .select('*')
        .eq('room_id', roomId)
        .in('status', ['approved', 'pending'])
        .gte('start_time', now) // Only future bookings like landing page

      setBookings(bookingsData || [])
      setLoading(false)
    }

    if (roomId && isAuthenticated && user) {
      fetchData()
    } else if (!isLoading && !isAuthenticated) {
      setLoading(false)
    }
  }, [roomId, router, isAuthenticated, user, isLoading])



  if (isLoading || loading) {
    return <Loading variant="fullscreen" />
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 bg-secondary-100 dark:bg-secondary-900 rounded-full flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-8 h-8 text-secondary-600 dark:text-secondary-400" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Anda perlu login untuk memesan ruangan
          </h1>
          <p className="text-gray-600 mb-6">
            Silakan login terlebih dahulu untuk melanjutkan pemesanan ruangan.
          </p>
          <Button onClick={() => router.push('/login')}>
            Login
          </Button>
        </div>
      </div>
    )
  }

  if (!room) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-8 h-8 text-red-600 dark:text-red-400" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Ruangan Tidak Tersedia
          </h1>
          <p className="text-gray-600 mb-6">
            Ruangan yang Anda cari tidak ditemukan atau tidak aktif saat ini.
          </p>
          <Button onClick={() => window.location.reload()}>
            Coba Lagi
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-indigo-50 to-secondary-50 dark:from-gray-900 dark:via-primary-900 dark:to-secondary-900">
      {/* Sidebar */}
      <UserSidebar onToggle={setSidebarCollapsed} />

      {/* Header */}
      <PageHeader
        title={`Reservasi ${room.name}`}
        description={`Kapasitas: ${room.capacity} orang`}
        user={user}
        sidebarCollapsed={sidebarCollapsed}
      />

      <main className={`px-4 sm:px-6 lg:px-8 pb-12 pt-24 transition-all duration-300 ${
        sidebarCollapsed ? 'ml-16' : 'ml-64'
      }`}>
        {/* Back Navigation */}
        <div className="mb-6 lg:mb-8">
          <Link
            href="/book"
            className="inline-flex items-center text-primary hover:text-primary dark:text-primary-400 dark:hover:text-primary-300 transition-colors text-sm lg:text-base"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Kembali ke Pilihan Ruangan
          </Link>
        </div>

        {/* Scrollable Content Area */}
        <div className="max-w-full mx-auto px-4">
          {/* Optimized 3-Card Grid Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-3 gap-3 lg:gap-4 xl:gap-5 min-h-[500px] max-w-none">
                {/* Room Info Card - Takes full width on mobile, 1/3 on desktop */}
                <div className="lg:col-span-1 h-full min-h-[500px]">
                  <RoomInfoCard room={room} />
                </div>

                {/* Reservation Calendar Card - Takes full width on mobile, 1/3 on desktop */}
                <div className="lg:col-span-1 h-full min-h-[500px]">
                  <ReservationCalendarCard
                    existingBookings={bookings}
                    selectedDate={selectedDate}
                    onDateSelect={setSelectedDate}
                  />
                </div>

                {/* Reservation Form Card - Takes full width on mobile, 1/3 on desktop */}
                <div className="lg:col-span-1 h-full min-h-[500px]">
                  <ReservationFormCard
                    room={room}
                    existingBookings={bookings}
                    selectedDate={selectedDate}
                  />
                </div>
              </div>
        </div>
      </main>
    </div>
  )
}