'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { sendBookingStatusUpdate } from '@/lib/notifications'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface Booking {
  id: string
  user_id: string
  room_id: string
  start_time: string
  end_time: string
  status: string
  event_description: string | null
  notes: string | null
  created_at: string
  profiles: {
    full_name: string
    email: string
  }
  rooms: {
    name: string
  }
}

export default function BookingManagement() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchBookings()
  }, [])

  const fetchBookings = async () => {
    const { data, error } = await supabase
      .from('bookings')
      .select(`
        *,
        profiles:user_id (
          full_name,
          email
        ),
        rooms:room_id (
          name
        )
      `)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching bookings:', error)
    } else {
      setBookings(data || [])
    }
    setLoading(false)
  }

  const updateBookingStatus = async (id: string, status: string) => {
    const { error } = await supabase
      .from('bookings')
      .update({ status })
      .eq('id', id)

    if (error) {
      console.error('Error updating booking status:', error)
    } else {
      // Send status update notification
      await sendBookingStatusUpdate(id, status)
      fetchBookings()
    }
  }

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  if (loading) {
    return <div>Loading...</div>
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Booking Management</CardTitle>
        <CardDescription>Approve or reject room reservations</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {bookings.map((booking) => (
            <div key={booking.id} className="border rounded-lg p-4">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h4 className="font-medium">{booking.rooms?.name}</h4>
                  <p className="text-sm text-gray-600">
                    {booking.profiles?.full_name} ({booking.profiles?.email})
                  </p>
                  <p className="text-sm text-gray-600">
                    {formatDateTime(booking.start_time)} - {formatDateTime(booking.end_time)}
                  </p>
                  {booking.event_description && (
                    <p className="text-sm text-gray-600 mt-1">
                      Event: {booking.event_description}
                    </p>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    booking.status === 'approved' ? 'bg-green-100 text-green-800' :
                    booking.status === 'rejected' ? 'bg-red-100 text-red-800' :
                    booking.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {booking.status}
                  </span>
                </div>
              </div>

              {booking.status === 'pending' && (
                <div className="flex space-x-2 mt-4">
                  <Button
                    size="sm"
                    onClick={() => updateBookingStatus(booking.id, 'approved')}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => updateBookingStatus(booking.id, 'rejected')}
                  >
                    Reject
                  </Button>
                </div>
              )}

              {booking.status !== 'pending' && (
                <div className="mt-4">
                  <Select
                    value={booking.status}
                    onValueChange={(value) => updateBookingStatus(booking.id, value)}
                  >
                    <SelectTrigger className="w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          ))}

          {bookings.length === 0 && (
            <p className="text-gray-500 text-center py-8">No bookings found</p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}