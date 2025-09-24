'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useCreateBooking, type Room, type Booking } from '@/lib/api'
import useAuthStore from '@/lib/authStore'
import { format } from 'date-fns'
import { motion } from 'framer-motion'
import { CalendarIcon, Clock } from 'lucide-react'
import { format as formatDate } from 'date-fns'
import { Calendar } from '@/components/ui/calendar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { cn } from '@/lib/utils'
import dayjs from 'dayjs'

const bookingSchema = z.object({
  selectedDate: z.date().optional(),
  startHour: z.string().min(1, 'Please select start hour'),
  startMinute: z.string().min(1, 'Please select start minute'),
  endHour: z.string().min(1, 'Please select end hour'),
  endMinute: z.string().min(1, 'Please select end minute'),
  eventDescription: z.string().min(1, 'Event description is required'),
  notes: z.string().optional(),
}).refine((data) => data.selectedDate !== undefined, {
  message: 'Please select a date',
  path: ['selectedDate'],
}).refine((data) => {
  if (!data.selectedDate) return false

  const startTime = `${data.startHour}:${data.startMinute}`
  const endTime = `${data.endHour}:${data.endMinute}`

  const startDateTime = dayjs(`${formatDate(data.selectedDate, 'yyyy-MM-dd')} ${startTime}`)
  const endDateTime = dayjs(`${formatDate(data.selectedDate, 'yyyy-MM-dd')} ${endTime}`)

  return startDateTime.isBefore(endDateTime)
}, {
  message: 'End time must be after start time',
  path: ['endHour'],
})

type BookingFormData = z.infer<typeof bookingSchema>

interface BookingFormProps {
  room: Room
  existingBookings: Booking[]
}


export default function BookingForm({ room, existingBookings }: BookingFormProps) {
  const router = useRouter()

  const { user } = useAuthStore()
  const createBookingMutation = useCreateBooking()

  // Local state for immediate UI updates
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())

  const form = useForm<BookingFormData>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      selectedDate: new Date(),
      startHour: '09',
      startMinute: '00',
      endHour: '10',
      endMinute: '00',
      eventDescription: '',
      notes: '',
    },
    mode: 'onChange',
  })

  // Handler for date selection
  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date)
    form.setValue('selectedDate', date)
  }

  const onSubmit = async (data: BookingFormData) => {
    if (!user) {
      form.setError('root', { message: 'Not authenticated' })
      return
    }

    const selectedDateStr = formatDate(data.selectedDate!, 'yyyy-MM-dd')
    const startTimeStr = `${data.startHour}:${data.startMinute}`
    const endTimeStr = `${data.endHour}:${data.endMinute}`

    const startDateTime = dayjs(`${selectedDateStr} ${startTimeStr}`).toDate()
    const endDateTime = dayjs(`${selectedDateStr} ${endTimeStr}`).toDate()

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
      form.setError('root', { message: 'This time slot is already booked' })
      return
    }

    const bookingData = {
      room_id: room.id,
      start_time: startDateTime.toISOString(),
      end_time: endDateTime.toISOString(),
      status: 'pending',
      event_description: data.eventDescription,
      notes: data.notes || '',
    }

    createBookingMutation.mutate(bookingData, {
      onSuccess: () => {
        router.push('/?success=Booking submitted successfully')
      },
      onError: (err) => {
        form.setError('root', { message: err instanceof Error ? err.message : 'An error occurred' })
      },
    })
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

  const getBookedDates = () => {
    const dates = new Set<string>()
    existingBookings.forEach(booking => {
      const date = new Date(booking.start_time).toDateString()
      dates.add(date)
    })
    return Array.from(dates).map(date => new Date(date))
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Date Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="w-5 h-5" />
              Pilih Tanggal
            </CardTitle>
            <CardDescription>
              Pilih tanggal yang diinginkan untuk reservasi
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="date">Tanggal Reservasi</Label>
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={handleDateSelect}
                  disabled={(date) => {
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    return date < today;
                  }}
                  className="rounded-md border"
                />
                {form.formState.errors.selectedDate && (
                  <p className="text-sm text-red-500 mt-1">{form.formState.errors.selectedDate.message}</p>
                )}
              </div>

              {selectedDate && (
                <div>
                  <h4 className="font-medium mb-2">
                    Waktu yang sudah dipesan untuk {formatDate(selectedDate, 'dd MMMM yyyy')}:
                  </h4>
                  <div className="space-y-1">
                    {getBookedTimes(selectedDate).map((time, index) => (
                      <p key={index} className="text-sm text-red-600">
                        {format(time.start, 'HH:mm')} - {format(time.end, 'HH:mm')} (Sudah dipesan)
                      </p>
                    ))}
                    {getBookedTimes(selectedDate).length === 0 && (
                      <p className="text-sm text-green-600">
                        Tidak ada pemesanan untuk tanggal ini
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Booking Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Detail Reservasi
            </CardTitle>
            <CardDescription>
              Isi detail reservasi
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {/* Time Selection */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Waktu Mulai</Label>
                  <div className="flex gap-2">
                    <Select value={form.watch('startHour')} onValueChange={(value: string) => form.setValue('startHour', value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 24 }, (_, i) => (
                          <SelectItem key={i} value={i.toString().padStart(2, '0')}>
                            {i.toString().padStart(2, '0')}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select value={form.watch('startMinute')} onValueChange={(value: string) => form.setValue('startMinute', value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="00">00</SelectItem>
                        <SelectItem value="15">15</SelectItem>
                        <SelectItem value="30">30</SelectItem>
                        <SelectItem value="45">45</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label>Waktu Selesai</Label>
                  <div className="flex gap-2">
                    <Select value={form.watch('endHour')} onValueChange={(value: string) => form.setValue('endHour', value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 24 }, (_, i) => (
                          <SelectItem key={i} value={i.toString().padStart(2, '0')}>
                            {i.toString().padStart(2, '0')}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select value={form.watch('endMinute')} onValueChange={(value: string) => form.setValue('endMinute', value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="00">00</SelectItem>
                        <SelectItem value="15">15</SelectItem>
                        <SelectItem value="30">30</SelectItem>
                        <SelectItem value="45">45</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <div>
                <Label htmlFor="eventDescription">Deskripsi Acara</Label>
                <Textarea
                  id="eventDescription"
                  {...form.register('eventDescription')}
                  placeholder="Jelaskan acara atau tujuan Anda"
                  className={cn(form.formState.errors.eventDescription && "border-red-500")}
                />
                {form.formState.errors.eventDescription && (
                  <p className="text-sm text-red-500 mt-1">{form.formState.errors.eventDescription.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="notes">Catatan Tambahan</Label>
                <Textarea
                  id="notes"
                  {...form.register('notes')}
                  placeholder="Persyaratan khusus atau catatan lainnya"
                />
              </div>

              {form.formState.errors.root && (
                <Alert variant="destructive">
                  <AlertDescription>{form.formState.errors.root.message}</AlertDescription>
                </Alert>
              )}

              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                  disabled={createBookingMutation.isPending}
                >
                  {createBookingMutation.isPending ? 'Mengirim...' : 'Kirim Reservasi'}
                </Button>
              </motion.div>
            </form>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  )
}
