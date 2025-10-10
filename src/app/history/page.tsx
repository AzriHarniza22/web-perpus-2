'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { User } from '@supabase/supabase-js'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Loading } from '@/components/ui/loading'
import UserSidebar from '@/components/UserSidebar'
import { PageHeader } from '@/components/ui/page-header'

interface BookingWithRoom {
  id: string
  start_time: string
  end_time: string
  status: string
  event_description?: string
  notes?: string
  created_at: string
  rooms?: { name: string }
}

export default function HistoryPage() {
  const [bookings, setBookings] = useState<BookingWithRoom[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<User | null>(null)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const checkAuthAndFetchBookings = async () => {
      // Check if user is authenticated
      const { data: { user: currentUser } } = await supabase.auth.getUser()
      setUser(currentUser)

      if (!currentUser) {
        router.push('/login')
        return
      }

      // Get user bookings
      const { data: bookingsData } = await supabase
        .from('bookings')
        .select(`
          *,
          rooms:room_id (
            name
          )
        `)
        .eq('user_id', currentUser.id)
        .order('created_at', { ascending: false })

      setBookings(bookingsData || [])
      setLoading(false)
    }

    checkAuthAndFetchBookings()
  }, [router])

  if (loading) {
    return <Loading variant="fullscreen" />
  }

  if (!user) {
    return null // Will redirect
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar */}
      <UserSidebar onToggle={setSidebarCollapsed} />

      {/* Header */}
      <PageHeader
        title="Riwayat Reservasi"
        description="Lihat semua reservasi yang telah Anda buat"
        user={user}
        sidebarCollapsed={sidebarCollapsed}
      />

      <main className={`py-8 transition-all duration-300 ${
        sidebarCollapsed ? 'ml-16' : 'ml-64'
      }`}>
        <div className="max-w-6xl mx-auto px-4">

        <div className="space-y-4">
          {bookings && bookings.length > 0 ? (
            bookings.map((booking: BookingWithRoom) => (
              <Card key={booking.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{booking.rooms?.name}</CardTitle>
                      <CardDescription>
                        {new Date(booking.start_time).toLocaleDateString('id-ID')} {' '}
                        {new Date(booking.start_time).toLocaleTimeString('id-ID')} - {' '}
                        {new Date(booking.end_time).toLocaleTimeString('id-ID')}
                      </CardDescription>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                      booking.status === 'approved' ? 'bg-green-100 text-green-800' :
                      booking.status === 'rejected' ? 'bg-red-100 text-red-800' :
                      booking.status === 'completed' ? 'bg-primary-100 text-primary-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {booking.status === 'approved' ? 'Disetujui' :
                       booking.status === 'rejected' ? 'Ditolak' :
                       booking.status === 'completed' ? 'Selesai' :
                       booking.status === 'cancelled' ? 'Dibatalkan' :
                       'Menunggu'}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {booking.event_description && (
                    <p className="text-sm text-gray-600 mb-2">
                      <strong>Acara:</strong> {booking.event_description}
                    </p>
                  )}
                  {booking.notes && (
                    <p className="text-sm text-gray-600">
                      <strong>Catatan:</strong> {booking.notes}
                    </p>
                  )}
                  <p className="text-xs text-gray-500 mt-2">
                    Diajukan pada: {new Date(booking.created_at).toLocaleString('id-ID')}
                  </p>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="py-8">
                <p className="text-center text-gray-500">
                  Anda belum memiliki reservasi
                </p>
                <div className="text-center mt-4">
                  <Link
                    href="/"
                    className="inline-block bg-primary text-white py-2 px-4 rounded hover:bg-primary"
                  >
                    Buat Reservasi Baru
                  </Link>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
        </div>
      </main>
    </div>
  )
}