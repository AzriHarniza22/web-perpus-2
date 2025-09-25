'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useCreateBooking, type Room, type Booking } from '@/lib/api'
import useAuthStore from '@/lib/authStore'
import { supabase } from '@/lib/supabase'
import { format } from 'date-fns'
import { motion } from 'framer-motion'
import { CalendarIcon, Clock, Sparkles, ArrowRight } from 'lucide-react'
import { format as formatDate } from 'date-fns'
import { Calendar as UICalendar } from '@/components/ui/calendar'
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
  guestCount: z.number().min(1, 'Please enter at least 1 guest').max(100, 'Maximum 100 guests'),
  notes: z.string().optional(),
  proposalFile: z.instanceof(File).optional().refine((file) => {
    if (!file) return true;
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    return allowedTypes.includes(file.type);
  }, 'File must be a PDF or Word document').refine((file) => {
    if (!file) return true;
    return file.size <= 10 * 1024 * 1024; // 10MB
  }, 'File size must be less than 10MB'),
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
      guestCount: 1,
      notes: '',
      proposalFile: undefined,
    },
    mode: 'onChange',
  })

  // Handler for date selection
  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date)
    form.setValue('selectedDate', date)
  }

  const onSubmit = async (data: BookingFormData) => {
    console.log(`BookingForm: onSubmit, user=${user ? user.id : 'null'}`)
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

    const file = data.proposalFile;
    let filePath: string | undefined = undefined;
    if (file) {
      const fileName = `user-${user.id}-${Date.now()}-${file.name}`;
      console.log(`BookingForm: Uploading file ${fileName} for user ${user.id}`);
      const { data: uploadData, error: uploadError } = await supabase.storage.from('proposals').upload(fileName, file);
      if (uploadError) {
        console.error(`BookingForm: Upload error for user ${user.id}:`, uploadError);
        form.setError('root', { message: 'Failed to upload file: ' + uploadError.message });
        return;
      }
      filePath = fileName;
      console.log(`BookingForm: File uploaded successfully, path: ${filePath} for user ${user.id}`);
    }

    const bookingData = {
      room_id: room.id,
      start_time: startDateTime.toISOString(),
      end_time: endDateTime.toISOString(),
      status: 'pending',
      event_description: data.eventDescription,
      guest_count: data.guestCount,
      notes: data.notes || '',
      proposal_file: filePath,
    }

    createBookingMutation.mutate(bookingData, {
      onSuccess: () => {
        console.log(`BookingForm: Booking success, redirecting to /dashboard, user=${user ? user.id : 'null'}`)
        router.push('/dashboard?success=Booking submitted successfully')
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
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm hover:shadow-xl transition-all duration-300 relative overflow-hidden group">
            {/* Background Gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 via-indigo-50/30 to-purple-50/50 dark:from-blue-900/20 dark:via-indigo-900/20 dark:to-purple-900/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

            <CardHeader className="relative z-10">
              <CardTitle className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-cyan-400 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                  <CalendarIcon className="w-5 h-5 text-white" />
                </div>
                <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Pilih Tanggal
                </span>
              </CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-300">
                Pilih tanggal yang diinginkan untuk reservasi
              </CardDescription>
            </CardHeader>
          <CardContent className="relative z-10">
            <div className="space-y-4">
              <div>
                <Label htmlFor="date" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Tanggal Reservasi
                </Label>
                <UICalendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={handleDateSelect}
                  disabled={(date: Date) => {
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    return date < today;
                  }}
                  className="rounded-md border shadow-sm"
                />
                {form.formState.errors.selectedDate && (
                  <p className="text-sm text-red-500 mt-1">{form.formState.errors.selectedDate.message}</p>
                )}
              </div>

              {selectedDate && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3"
                >
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2 flex items-center">
                    <Clock className="w-4 h-4 mr-2 text-blue-600" />
                    Waktu yang sudah dipesan untuk {formatDate(selectedDate, 'dd MMMM yyyy')}:
                  </h4>
                  <div className="space-y-1">
                    {getBookedTimes(selectedDate).map((time, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="flex items-center gap-2 text-sm text-red-600 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-md"
                      >
                        <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                        {format(time.start, 'HH:mm')} - {format(time.end, 'HH:mm')} (Sudah dipesan)
                      </motion.div>
                    ))}
                    {getBookedTimes(selectedDate).length === 0 && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex items-center gap-2 text-sm text-green-600 bg-green-50 dark:bg-green-900/20 px-3 py-2 rounded-md"
                      >
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        Tidak ada pemesanan untuk tanggal ini
                      </motion.div>
                    )}
                  </div>
                </motion.div>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Booking Details */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <Card className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm hover:shadow-xl transition-all duration-300 relative overflow-hidden group">
          {/* Background Gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-purple-50/50 via-pink-50/30 to-orange-50/50 dark:from-purple-900/20 dark:via-pink-900/20 dark:to-orange-900/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

          <CardHeader className="relative z-10">
            <CardTitle className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-400 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                Detail Reservasi
              </span>
            </CardTitle>
            <CardDescription className="text-gray-600 dark:text-gray-300">
              Isi detail reservasi Anda dengan lengkap
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
                <Label htmlFor="guestCount">Perkiraan Jumlah Tamu</Label>
                <Input
                  id="guestCount"
                  type="number"
                  {...form.register('guestCount', { valueAsNumber: true })}
                  placeholder="Masukkan jumlah tamu"
                  className={cn(form.formState.errors.guestCount && "border-red-500")}
                />
                {form.formState.errors.guestCount && (
                  <p className="text-sm text-red-500 mt-1">{form.formState.errors.guestCount.message}</p>
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

              <div>
                <Label htmlFor="proposalFile">Upload Proposal File (Optional)</Label>
                <Input
                  id="proposalFile"
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={(e) => {
                    const file = e.target.files?.[0] || undefined;
                    form.setValue('proposalFile', file);
                  }}
                />
                {form.formState.errors.proposalFile && (
                  <p className="text-sm text-red-500 mt-1">{form.formState.errors.proposalFile.message}</p>
                )}
              </div>

              {form.formState.errors.root && (
                <Alert variant="destructive">
                  <AlertDescription>{form.formState.errors.root.message}</AlertDescription>
                </Alert>
              )}

              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="relative z-10"
              >
                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-medium py-3 group-hover:shadow-lg transition-all duration-300"
                  disabled={createBookingMutation.isPending}
                >
                  {createBookingMutation.isPending ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"
                    />
                  ) : (
                    <>
                      <ArrowRight className="w-4 h-4 mr-2" />
                      Kirim Reservasi
                    </>
                  )}
                </Button>
              </motion.div>
            </form>
          </CardContent>
        </Card>
        </motion.div>
      </div>
    </motion.div>
  )
}
