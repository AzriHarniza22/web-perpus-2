'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { User } from '@supabase/supabase-js'
import Link from 'next/link'
import BookingForm from '../../../components/BookingForm'
import UserSidebar from '@/components/UserSidebar'
import { PageHeader } from '@/components/ui/page-header'
import { Loading } from '@/components/ui/loading'

import { Room, Booking } from '@/lib/api'

export default function BookRoomPage() {
  const params = useParams()
  const roomId = params.roomId as string
  const [room, setRoom] = useState<Room | null>(null)
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<User | null>(null)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedImage, setSelectedImage] = useState<string>('')
  const [scale, setScale] = useState(1)
  const [initialDistance, setInitialDistance] = useState(0)
  const [initialScale, setInitialScale] = useState(1)
  const imageRef = useRef<HTMLImageElement>(null)
  const router = useRouter()

  const getDistance = (touch1: Touch, touch2: Touch) => {
    return Math.sqrt(
      Math.pow(touch2.clientX - touch1.clientX, 2) +
      Math.pow(touch2.clientY - touch1.clientY, 2)
    )
  }

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

  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault()
      setScale(prev => Math.max(0.5, Math.min(3, prev + (e.deltaY > 0 ? -0.1 : 0.1))))
    }
    const img = imageRef.current
    if (img && isModalOpen) {
      img.addEventListener('wheel', handleWheel)
      return () => img.removeEventListener('wheel', handleWheel)
    }
  }, [isModalOpen, scale])

  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        const dist = getDistance(e.touches[0], e.touches[1])
        setInitialDistance(dist)
        setInitialScale(scale)
      }
    }
    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        e.preventDefault()
        const dist = getDistance(e.touches[0], e.touches[1])
        const newScale = initialScale * (dist / initialDistance)
        setScale(Math.max(0.5, Math.min(3, newScale)))
      }
    }
    const img = imageRef.current
    if (img && isModalOpen) {
      img.addEventListener('touchstart', handleTouchStart)
      img.addEventListener('touchmove', handleTouchMove)
      return () => {
        img.removeEventListener('touchstart', handleTouchStart)
        img.removeEventListener('touchmove', handleTouchMove)
      }
    }
  }, [isModalOpen, scale, initialDistance, initialScale])

  if (loading) {
    return <Loading variant="fullscreen" />
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
            {room.photos && room.photos.length > 0 && (
              <div className="mb-6">
                <h3 className="font-medium text-gray-900 dark:text-white mb-4">Galeri Ruangan</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {room.photos.map((photo, index) => (
                    <div key={index} className="relative aspect-video rounded-lg overflow-hidden shadow-md">
                      <img
                        src={photo}
                        alt={`${room.name} - ${index + 1}`}
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-300 cursor-pointer"
                        onClick={() => {
                          setSelectedImage(photo)
                          setIsModalOpen(true)
                          setScale(1)
                        }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
            {isModalOpen && (
              <div
                className="fixed inset-0 bg-black/75 flex items-center justify-center z-50"
                onClick={() => {
                  setIsModalOpen(false)
                  setScale(1)
                }}
              >
                <div className="relative max-w-full max-h-full p-4" onClick={e => e.stopPropagation()}>
                  <img
                    ref={imageRef}
                    src={selectedImage}
                    alt="Zoomed room image"
                    className="max-w-full max-h-full object-contain"
                    style={{ transform: `scale(${scale})`, transformOrigin: 'center' }}
                  />
                  <button
                    className="absolute top-2 right-2 bg-white/75 rounded-full p-2 hover:bg-white transition"
                    onClick={() => {
                      setIsModalOpen(false)
                      setScale(1)
                    }}
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            )}
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