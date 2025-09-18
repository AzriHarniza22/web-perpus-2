'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { sendBookingConfirmation } from '@/lib/notifications'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Calendar } from '@/components/ui/calendar'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'

interface Room {
  id: string
  name: string
  capacity: number
  facilities: string[]
}

interface Booking {
  start_time: string
  end_time: string
  status: string
}

interface BookingFormProps {
  room: Room
  existingBookings: Booking[]
}

export default function BookingForm({ room, existingBookings }: BookingFormProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [eventDescription, setEventDescription] = useState('')
  const [notes, setNotes] = useState('')
  const [proposalFile, setProposalFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

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

    setLoading(true)
    setError('')

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Ensure user profile exists
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .single()

      if (!profile) {
        // Create profile if it doesn't exist
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: user.id,
            email: user.email,
            full_name: user.user_metadata?.full_name || '',
            institution: user.user_metadata?.institution || '',
            phone: user.user_metadata?.phone || '',
          })

        if (profileError) throw profileError
      }

      let proposalFileUrl = null
      if (proposalFile) {
        const fileExt = proposalFile.name.split('.').pop()
        const fileName = `${user.id}_${Date.now()}.${fileExt}`
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('proposals')
          .upload(fileName, proposalFile, {
            cacheControl: '3600',
            upsert: false
          })

        if (uploadError) throw new Error(`Upload failed: ${uploadError.message}`)

        const { data: { publicUrl } } = supabase.storage
          .from('proposals')
          .getPublicUrl(fileName)

        proposalFileUrl = publicUrl
      }

      const { data, error } = await supabase
        .from('bookings')
        .insert({
          user_id: user.id,
          room_id: room.id,
          start_time: startDateTime.toISOString(),
          end_time: endDateTime.toISOString(),
          event_description: eventDescription,
          proposal_file: proposalFileUrl,
          notes: notes,
        })
        .select()
        .single()

      if (error) throw error

      // Send confirmation notification
      await sendBookingConfirmation(data.id)

      router.push('/?success=Booking submitted successfully')
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
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

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Submitting...' : 'Submit Reservation'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}