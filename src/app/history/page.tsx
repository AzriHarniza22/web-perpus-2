'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { User } from '@supabase/supabase-js'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Loading } from '@/components/ui/loading'
import UserSidebar from '@/components/UserSidebar'
import { PageHeader } from '@/components/ui/page-header'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Calendar, Clock, CheckCircle, XCircle, AlertCircle, CalendarX, Trash2 } from 'lucide-react'
import { motion } from 'framer-motion'

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
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null)
  const [selectedRoomName, setSelectedRoomName] = useState<string>('')
  const [isDeleting, setIsDeleting] = useState(false)
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

  const deleteBooking = async () => {
    if (!selectedBookingId) return

    setIsDeleting(true)
    try {
      const response = await fetch(`/api/bookings/${selectedBookingId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to delete booking')
      }

      // Update local state to reflect cancelled status
      setBookings(prevBookings =>
        prevBookings.map(booking =>
          booking.id === selectedBookingId
            ? { ...booking, status: 'cancelled' }
            : booking
        )
      )

      // Close the dialog
      setIsDeleteDialogOpen(false)
      setSelectedBookingId(null)
      setSelectedRoomName('')
    } catch (error) {
      console.error('Error deleting booking:', error)
      // You could add a toast notification here if available
      alert('Failed to delete booking. Please try again.')
    } finally {
      setIsDeleting(false)
    }
  }

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

      <main className={`pb-8 pt-24 transition-all duration-300 ${
        sidebarCollapsed ? 'ml-16' : 'ml-64'
      }`}>
        <div className="max-w-6xl mx-auto px-4">

        <div className="space-y-4">
          {bookings && bookings.length > 0 ? (
            bookings.map((booking: BookingWithRoom, index) => (
              <motion.div
                key={booking.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
              >
                <Card className={`hover:shadow-lg transition-all duration-300 border-l-4 ${
                  booking.status === 'approved' ? 'border-l-green-500' :
                  booking.status === 'rejected' ? 'border-l-red-500' :
                  booking.status === 'completed' ? 'border-l-blue-500' :
                  booking.status === 'cancelled' ? 'border-l-gray-500' :
                  'border-l-yellow-500'
                }`}>
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{booking.rooms?.name}</CardTitle>
                      <CardDescription className="flex items-center gap-2 text-sm">
                       <Calendar className="w-4 h-4 text-muted-foreground" />
                       <span>{new Date(booking.start_time).toLocaleDateString('id-ID')}</span>
                       <Clock className="w-4 h-4 text-muted-foreground" />
                       <span>{new Date(booking.start_time).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} - {new Date(booking.end_time).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</span>
                     </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        className={`flex items-center gap-1 ${
                          booking.status === 'approved' ? 'bg-green-500 text-white hover:bg-green-600' :
                          booking.status === 'rejected' ? 'bg-red-500 text-white hover:bg-red-600' :
                          booking.status === 'completed' ? 'bg-blue-500 text-white hover:bg-blue-600' :
                          booking.status === 'cancelled' ? 'bg-gray-500 text-white hover:bg-gray-600' :
                          'bg-yellow-400 text-gray-800 hover:bg-yellow-500'
                        }`}
                      >
                        {booking.status === 'approved' && <CheckCircle className="w-3 h-3" />}
                        {booking.status === 'rejected' && <XCircle className="w-3 h-3" />}
                        {booking.status === 'completed' && <CheckCircle className="w-3 h-3" />}
                        {booking.status === 'cancelled' && <XCircle className="w-3 h-3" />}
                        {(booking.status === 'pending' || !booking.status) && <AlertCircle className="w-3 h-3" />}
                        {booking.status === 'approved' ? 'Disetujui' :
                         booking.status === 'rejected' ? 'Ditolak' :
                         booking.status === 'completed' ? 'Selesai' :
                         booking.status === 'cancelled' ? 'Dibatalkan' :
                         'Menunggu'}
                      </Badge>
                      {booking.status === 'pending' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1"
                          onClick={() => {
                            setSelectedBookingId(booking.id)
                            setSelectedRoomName(booking.rooms?.name || '')
                            setIsDeleteDialogOpen(true)
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  {booking.event_description && (
                    <p className="text-sm text-gray-600 mb-1">
                      <strong>Acara:</strong> {booking.event_description}
                    </p>
                  )}
                  {booking.notes && (
                    <p className="text-sm text-gray-600">
                      <strong>Catatan:</strong> {booking.notes}
                    </p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    Diajukan pada: {new Date(booking.created_at).toLocaleString('id-ID', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </p>
                </CardContent>
                </Card>
              </motion.div>
            ))
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="text-center py-8">
                <CardContent>
                  <CalendarX className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">Belum Ada Reservasi</h3>
                  <p className="text-muted-foreground mb-6">
                    Anda belum memiliki riwayat reservasi. Mulai buat reservasi pertama Anda!
                  </p>
                  <Button asChild>
                    <Link href="/">
                      Buat Reservasi Baru
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </div>
        </div>
      </main>

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Konfirmasi Hapus Reservasi</DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin menghapus reservasi untuk ruangan {selectedRoomName}?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Batal
            </Button>
            <Button
              variant="destructive"
              onClick={deleteBooking}
              disabled={isDeleting}
            >
              {isDeleting ? 'Menghapus...' : 'Hapus Reservasi'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}