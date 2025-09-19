'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { useCreateBooking } from '@/lib/api'
import useAuthStore from '@/lib/authStore'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Calendar } from '@/components/ui/calendar'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'

interface BookingFormProps {
  room: any
  existingBookings: any[]
}

export default function BookingForm({ room, existingBookings }: BookingFormProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [eventDescription, setEventDescription] = useState('')
  const [notes, setNotes] = useState('')
  const [proposalFile, setProposalFile] = useState<File | null>(null)
  const [error, setError] = useState('')
  const router = useRouter()

  const { user } = useAuthStore()
  const createBookingMutation = useCreateBooking()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedDate || !startTime || !endTime) {
      setError('Please select date and time')
      return
    }

    const startDateTime = new Date(selectedDate)
    const [startHour, startMinute] = startTime.split(':').map(Number)
    startDateTime.setHours(startHour, startMinute, 0, 0)

    const endDateTime = new Date(selectedDate)
    const [endHour, endMinute] = endTime.split(':').map(Number)
    endDateTime.setHours(endHour, endMinute, 0, 0)

    if (startDateTime >= endDateTime) {
      setError('End time must be after start time')
      return
    }

    // Check for conflicts
    const conflict = existingBookings.some(booking => {
      const bookingStart = new Date(booking.start_time)
      const bookingEnd = new Date(booking.end_time)
      return (
        (startDateTime >= bookingStart && startDateTime < bookingEnd) ||
        (endDateTime > bookingStart && endDateTime <= bookingEnd) ||
        (startDateTime <= bookingStart && endDateTime >= bookingEnd)
      )
    })

    if (conflict) {
      setError('This time slot is already booked')
      return
    }

    setError('')

    if (!user) {
      setError('Not authenticated')
      return
    }

    const bookingData = {
      room_id: room.id,
      start_time: startDateTime.toISOString(),
      end_time: endDateTime.toISOString(),
      status: 'pending',
      event_description: eventDescription,
      notes: notes,
    }

    createBookingMutation.mutate(bookingData, {
      onSuccess: () => {
        router.push('/?success=Booking submitted successfully')
      },
      onError: (err) => {
        setError(err instanceof Error ? err.message : 'An error occurred')
      },
    })
  }

  const isDateDisabled = (date: Date) => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return date < today
  }

  const getBookedTimes = (date: Date) => {
    return existingBookings
      .filter(booking => {
        const bookingDate = new Date(booking.start_time)
        return bookingDate.toDateString() === date.toDateString()
      })
      .map(booking => ({
        start: new Date(booking.start_time),
        end: new Date(booking.end_time),
      }))
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <Card>
        <CardHeader>
          <CardTitle>Select Date</CardTitle>
          <CardDescription>Choose your preferred date for the reservation</CardDescription>
        </CardHeader>
        <CardContent>
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={setSelectedDate}
            disabled={isDateDisabled}
            locale={id}
            className="rounded-md border"
          />
          {selectedDate && (
            <div className="mt-4">
              <h4 className="font-medium mb-2">Booked times for {format(selectedDate, 'PPP', { locale: id })}:</h4>
              <div className="space-y-1">
                {getBookedTimes(selectedDate).map((time, index) => (
                  <div key={index} className="text-sm text-red-600">
                    {format(time.start, 'HH:mm')} - {format(time.end, 'HH:mm')} (Booked)
                  </div>
                ))}
                {getBookedTimes(selectedDate).length === 0 && (
                  <p className="text-sm text-green-600">No bookings for this date</p>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Booking Details</CardTitle>
          <CardDescription>Fill in the reservation details</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="startTime">Start Time</Label>
                <Input
                  id="startTime"
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="endTime">End Time</Label>
                <Input
                  id="endTime"
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="eventDescription">Event Description</Label>
              <Textarea
                id="eventDescription"
                value={eventDescription}
                onChange={(e) => setEventDescription(e.target.value)}
                placeholder="Describe your event or purpose"
                required
              />
            </div>

            <div>
              <Label htmlFor="notes">Additional Notes</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any special requirements or notes"
              />
            </div>

            <div>
              <Label htmlFor="proposalFile">Upload Proposal Letter (Optional)</Label>
              <Input
                id="proposalFile"
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={(e) => setProposalFile(e.target.files?.[0] || null)}
              />
              <p className="text-sm text-muted-foreground mt-1">Upload your reservation letter (PDF, DOC, DOCX)</p>
            </div>

            {error && <p className="text-red-500 text-sm">{error}</p>}

            <Button type="submit" className="w-full" disabled={createBookingMutation.isPending}>
              {createBookingMutation.isPending ? 'Submitting...' : 'Submit Reservation'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}