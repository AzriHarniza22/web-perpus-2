'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import Image from 'next/image'
import BookingForm from '../../../components/BookingForm'
import UserSidebar from '@/components/UserSidebar'
import { PageHeader } from '@/components/ui/page-header'
import { Loading } from '@/components/ui/loading'
import { useAuth } from '@/hooks/useAuth'

import { Room, Booking } from '@/lib/api'

export default function BookRoomPage() {
  const params = useParams()
  const roomId = params.roomId as string
  const { user, isLoading, isAuthenticated } = useAuth()
  const [room, setRoom] = useState<Room | null>(null)
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedImage, setSelectedImage] = useState<string>('')
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set())
  const router = useRouter()


  const handleImageError = (photo: string) => {
    setImageErrors(prev => new Set(prev).add(photo))
  }

  const isImageValid = (photo: string) => {
    return photo && !imageErrors.has(photo) && photo.trim() !== ''
  }

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
        router.push('/')
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
      router.push('/login')
      setLoading(false)
    }
  }, [roomId, router, isAuthenticated, user, isLoading])



  if (isLoading || loading) {
    return <Loading variant="fullscreen" />
  }

  if (!isAuthenticated || !user || !room) {
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
                      {isImageValid(photo) ? (
                        <Image
                          src={photo}
                          alt={`${room.name} - ${index + 1}`}
                          fill
                          className="object-cover hover:scale-105 transition-transform duration-300 cursor-pointer"
                          onError={() => handleImageError(photo)}
                          onClick={() => {
                            if (isImageValid(photo)) {
                              setSelectedImage(photo)
                              setIsModalOpen(true)
                            }
                          }}
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                          <div className="text-center text-gray-500 dark:text-gray-400">
                            <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <p className="text-sm">Gambar tidak tersedia</p>
                          </div>
                        </div>
                      )}
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
                }}
              >
                <div className="relative max-w-full max-h-full p-4" onClick={e => e.stopPropagation()}>
                  {isImageValid(selectedImage) ? (
                    <Image
                      src={selectedImage}
                      alt="Zoomed room image"
                      width={800}
                      height={600}
                      className="max-w-full max-h-full object-contain"
                      onError={() => handleImageError(selectedImage)}
                    />
                  ) : (
                    <div className="max-w-full max-h-full flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-lg">
                      <div className="text-center text-gray-500 dark:text-gray-400 p-8">
                        <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <p className="text-lg font-medium">Gambar tidak dapat dimuat</p>
                        <p className="text-sm">Gambar mungkin telah dihapus atau URL tidak valid</p>
                      </div>
                    </div>
                  )}
                  <button
                    className="absolute top-2 right-2 bg-white/75 rounded-full p-2 hover:bg-white transition"
                    onClick={() => {
                      setIsModalOpen(false)
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