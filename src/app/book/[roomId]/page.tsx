'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import RoomInfoCard from '@/components/RoomInfoCard'
import InteractiveCalendar from '@/app/InteractiveCalendar'
import ReservationFormCard from '@/components/ReservationFormCard'
import UserSidebar from '@/components/UserSidebar'
import { PageHeader } from '@/components/ui/page-header'
import { Loading } from '@/components/ui/loading'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/components/AuthProvider'
import { Sparkles, ArrowLeft, CalendarIcon } from 'lucide-react'

import { Room, Booking } from '@/lib/api'

export default function BookRoomPage() {
  const params = useParams()
  const roomId = params.roomId as string
  const { user, isLoading } = useAuth()
  const [room, setRoom] = useState<Room | null>(null)
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())
  const router = useRouter()



  useEffect(() => {
    const fetchData = async () => {
      if (!user) {
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
        .select('*, rooms(name)')
        .eq('room_id', roomId)
        .in('status', ['approved', 'pending'])
        .gte('start_time', now) // Only future bookings like landing page

      setBookings(bookingsData || [])
      setLoading(false)
    }

    if (roomId && user) {
      fetchData()
    } else if (!isLoading && !user) {
      setLoading(false)
    }
  }, [roomId, router, user, isLoading])



  if (isLoading || loading) {
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
    <div className="h-screen bg-gradient-to-br from-primary-50 via-indigo-50 to-secondary-50 dark:from-gray-900 dark:via-primary-900 dark:to-secondary-900 flex flex-col">
      {/* Sidebar */}
      <UserSidebar onToggle={setSidebarCollapsed} />

      {/* Header */}
      <PageHeader
        title={`Reservasi ${room.name}`}
        description={`Kapasitas: ${room.capacity} orang`}
        user={user}
        sidebarCollapsed={sidebarCollapsed}
      />

      {/* Back Button Section - Perfect equal spacing with header */}
      <div className={`relative transition-all duration-300 ${
        sidebarCollapsed ? 'ml-16' : 'ml-64'
      }`}>
        {/* Responsive spacer matching header height for perfect symmetry */}
        <div className="h-[62px] sm:h-[68px] lg:h-[72px]"></div>

        {/* Back button container - perfectly centered with responsive padding */}
        <div className="relative px-3 sm:px-4 lg:px-6 py-3 sm:py-4">
          <div className="max-w-full flex justify-start">
            {/* Back navigation button - responsive optimized positioning */}
            <Button
              variant="outline"
              size="sm"
              className="px-3 sm:px-4"
              onClick={() => router.push('/book')}
            >
              <ArrowLeft className="w-4 h-4 sm:mr-2" />
              <span className="hidden md:inline lg:inline">Kembali ke Pilih Ruangan</span>
            </Button>
          </div>
        </div>

        {/* Reduced responsive spacer for more compact layout */}
        <div className="h-[1px] sm:h-[1px] lg:h-[1px]"></div>
        </div>

       <main className={`flex-1 px-2 sm:px-3 md:px-4 lg:px-5 xl:px-6 pb-2 sm:pb-3 pt-0 transition-all duration-300 ${
         sidebarCollapsed ? 'ml-16' : 'ml-64'
       }`}>

        {/* Full Height Content Area - Perfect height with new spacing */}
       <div className="h-[calc(100vh-168px)] sm:h-[calc(100vh-174px)] lg:h-[calc(100vh-176px)] flex flex-col">
          {/* Optimized 3-Card Grid Layout - Equal width cards with responsive spacing */}
          <div className="flex flex-col md:flex-row gap-2 sm:gap-3 lg:gap-3 xl:gap-4 flex-1 min-h-0">
                {/* Room Info Card - Equal width on all screen sizes */}
                <div className="flex-1 min-h-0">
                  <RoomInfoCard room={room} />
                </div>

                {/* Reservation Calendar Card - Equal width on all screen sizes */}
                <div className="flex-1 min-h-0">
                  <Card className="bg-card backdrop-blur-sm hover:shadow-xl transition-all duration-300 relative overflow-hidden group flex flex-col h-full">
                    {/* Background Gradient */}
                    <div className="absolute inset-0 bg-gradient-to-br from-primary-50/50 via-indigo-50/30 to-secondary-50/50 dark:from-primary-900/20 dark:via-indigo-900/20 dark:to-secondary-900/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                    <CardHeader className="relative z-10 flex-shrink-0">
                      <CardTitle className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                          <CalendarIcon className="w-5 h-5 text-white" />
                        </div>
                        <span className="bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent">
                          Pilih Tanggal
                        </span>
                      </CardTitle>
                      <CardDescription className="text-gray-600 dark:text-gray-300 text-sm">
                        Pilih tanggal yang diinginkan untuk reservasi
                      </CardDescription>
                    </CardHeader>

                    <CardContent className="relative z-10 flex-1">
                      <InteractiveCalendar
                        bookings={bookings}
                        selectedDate={selectedDate}
                        onDateSelect={setSelectedDate}
                        size="compact"
                      />
                    </CardContent>
                  </Card>
                </div>

                {/* Reservation Form Card - Equal width on all screen sizes */}
                <div className="flex-1 min-h-0">
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