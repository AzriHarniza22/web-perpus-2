'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { User } from '@supabase/supabase-js'
import Link from 'next/link'
import BookingForm from '../../../components/BookingForm'
import UserSidebar from '@/components/UserSidebar'
import { PageHeader } from '@/components/ui/page-header'

import { Room, Booking } from '@/lib/api'

export default function BookRoomPage() {
  const params = useParams()
  const roomId = params.roomId as string
  const [room, setRoom] = useState<Room | null>(null)
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<User | null>(null)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const checkAuthAndFetchData = async () => {
      // Check if user is authenticated
      const { data: { user: currentUser } } = await supabase.auth.getUser()
      setUser(currentUser)

      if (!currentUser) {
        router.push('/login')
        return
      }

      // Ensure user profile exists
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', currentUser.id)
        .single()

      if (!profile) {
        // Create profile if it doesn't exist
        await supabase
          .from('profiles')
          .insert({
            id: currentUser.id,
            email: currentUser.email,
            full_name: currentUser.user_metadata?.full_name || '',
            institution: currentUser.user_metadata?.institution || '',
            phone: currentUser.user_metadata?.phone || '',
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
        router.push('/')
        return
      }

      setRoom(roomData)

      // Get existing bookings for this room
      const { data: bookingsData } = await supabase
        .from('bookings')
        .select('*')
        .eq('room_id', roomId)
        .in('status', ['approved', 'pending'])

      setBookings(bookingsData || [])
      setLoading(false)
    }

    if (roomId) {
      checkAuthAndFetchData()
    }
  }, [roomId, router])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-blue-900 dark:to-purple-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!user || !room) {
    return null // Will redirect
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-blue-900 dark:to-purple-900">
      {/* Sidebar */}
      <UserSidebar onToggle={setSidebarCollapsed} />

      {/* Header */}
      <PageHeader
        title={`Reservasi ${room.name}`}
        description={`Kapasitas: ${room.capacity} orang`}
        user={user}
        sidebarCollapsed={sidebarCollapsed}
      />

      <main className={`py-8 transition-all duration-300 ${
        sidebarCollapsed ? 'ml-16' : 'ml-64'
      }`}>
        <div className="max-w-4xl mx-auto px-4">
          <div className="mb-8">
            <Link
              href="/book"
              className="inline-flex items-center text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 mb-4 transition-colors"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Kembali ke Pilihan Ruangan
            </Link>
            {room.facilities && room.facilities.length > 0 && (
              <div className="mt-4">
                <h3 className="font-medium text-gray-900 dark:text-white mb-2">Fasilitas:</h3>
                <ul className="text-sm text-gray-600 dark:text-gray-300">
                  {room.facilities.map((facility: string, index: number) => (
                    <li key={index}>• {facility}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          <BookingForm room={room} existingBookings={bookings} />
        </div>
      </main>
    </div>
  )
}