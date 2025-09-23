'use client'

import { useBookings, useUpdateBookingStatus } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { BookingWithRelations } from '@/lib/api'


export default function BookingManagement() {
  const { data: bookings = [], isLoading } = useBookings()
  const updateBookingStatusMutation = useUpdateBookingStatus()

  const updateBookingStatus = (id: string, status: string) => {
    updateBookingStatusMutation.mutate({ id, status })
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

  if (isLoading) {
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
          {bookings.map((booking: BookingWithRelations) => (
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
                  {booking.notes && (
                    <p className="text-sm text-gray-600 mt-1">
                      Notes: {booking.notes}
                    </p>
                  )}
                  {booking.proposal_file && (
                    <div className="mt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        asChild
                      >
                        <a
                          href={booking.proposal_file}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          View Proposal
                        </a>
                      </Button>
                    </div>
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
