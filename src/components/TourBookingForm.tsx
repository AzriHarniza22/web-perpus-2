'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAuth } from '@/components/AuthProvider'
import { supabase } from '@/lib/supabase'
import { format } from 'date-fns'
import { motion } from 'framer-motion'
import { CalendarIcon, Clock, Users, FileText, MapPin, User, ArrowRight } from 'lucide-react'
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
import { useDebouncedValidation } from '@/hooks/useDebouncedValidation'
import dayjs from 'dayjs'
import { Booking } from '@/lib/types'
import { ensureLibraryTourRoom } from '@/lib/roomUtils'

interface TourBookingFormProps {
  existingBookings?: Booking[]
  onBookingSuccess?: () => void
}

const tourBookingSchema = z.object({
  selectedDate: z.date().optional(),
  startHour: z.string().min(1, 'Please select start hour'),
  startMinute: z.string().min(1, 'Please select start minute'),
  endHour: z.string().min(1, 'Please select end hour'),
  endMinute: z.string().min(1, 'Please select end minute'),
  participantCount: z.number().min(1, 'Please enter at least 1 participant').max(50, 'Maximum 50 participants'),
  specialRequests: z.string().optional(),
  tourDocumentFile: z.string().optional(),
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

type TourBookingFormData = z.infer<typeof tourBookingSchema>

// Fixed tour information
const TOUR_INFO = {
  name: 'Library Tour',
  guide: 'Library Staff',
  meetingPoint: 'Main Entrance',
  maxParticipants: 50,
}

export default function TourBookingForm({ existingBookings = [], onBookingSuccess }: TourBookingFormProps) {
  const router = useRouter()

  const { user } = useAuth()

  // Local state for immediate UI updates
   const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())
   const [pendingOverlapWarning, setPendingOverlapWarning] = useState(false)
   const [isSubmitting, setIsSubmitting] = useState(false)
   const [uploadedFilePath, setUploadedFilePath] = useState<string | undefined>(undefined)
   const [isUploadingFile, setIsUploadingFile] = useState(false)
   const [uploadError, setUploadError] = useState<string | null>(null)
   const [optimisticBookings, setOptimisticBookings] = useState<Booking[]>([])
   const [isSubmittingOptimistically, setIsSubmittingOptimistically] = useState(false)

  const form = useForm<TourBookingFormData>({
    resolver: zodResolver(tourBookingSchema),
    defaultValues: {
      selectedDate: new Date(),
      startHour: '09',
      startMinute: '00',
      endHour: '10',
      endMinute: '00',
      participantCount: 1,
      specialRequests: '',
      tourDocumentFile: undefined,
    },
    mode: 'onChange',
  })

  // Debounced validation for performance
  const { debouncedValidate } = useDebouncedValidation<TourBookingFormData>((data) => {
    // Real-time validation feedback for better UX
    // This helps prevent excessive re-renders while providing immediate feedback
  }, { delay: 300 })

  // Handler for date selection
  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date)
    form.setValue('selectedDate', date)
  }

  const getBookedTimes = (date: Date) => {
    const now = new Date()

    // Combine existing bookings with optimistic bookings
    const allBookings = [...existingBookings, ...optimisticBookings]

    return allBookings
      .filter(booking => {
        const bookingDate = new Date(booking.start_time)
        // Only show future bookings or active bookings (same logic as InteractiveCalendar)
        return bookingDate.toDateString() === date.toDateString() &&
               booking.status !== 'rejected' &&
               (bookingDate >= now || booking.status === 'pending' || booking.status === 'approved')
      })
      .map(booking => ({
        start: new Date(booking.start_time),
        end: new Date(booking.end_time),
        status: booking.status,
        isOptimistic: booking.id.startsWith('optimistic-'),
      }))
  }

  const getBookedDates = () => {
    const now = new Date()
    // Combine existing bookings with optimistic bookings
    const allBookings = [...existingBookings, ...optimisticBookings]
    const futureBookings = allBookings.filter(booking => {
      const bookingDate = new Date(booking.start_time)
      // Only include future bookings or active bookings (same logic as InteractiveCalendar)
      return bookingDate >= now || booking.status === 'pending' || booking.status === 'approved'
    })

    const dates = new Set<string>()
    futureBookings.forEach(booking => {
      const date = new Date(booking.start_time).toDateString()
      dates.add(date)
    })
    return Array.from(dates).map(date => new Date(date))
  }

  const getDateStatus = (date: Date) => {
    const now = new Date()
    // Combine existing bookings with optimistic bookings
    const allBookings = [...existingBookings, ...optimisticBookings]
    const bookingsOnDate = allBookings.filter(booking => {
      const bookingDate = new Date(booking.start_time)
      // Only include future bookings or active bookings (same logic as InteractiveCalendar)
      return bookingDate.toDateString() === date.toDateString() &&
             (bookingDate >= now || booking.status === 'pending' || booking.status === 'approved')
    })

    if (bookingsOnDate.some(b => b.status === 'approved')) return 'approved'
    if (bookingsOnDate.some(b => b.status === 'pending')) return 'pending'
    return null
  }

  const isToday = (date: Date) => {
    const today = new Date()
    return date.toDateString() === today.toDateString()
  }

  const handleFileUpload = async (file: File) => {
    if (!user) {
      const errorMsg = 'Not authenticated'
      setUploadError(errorMsg)
      form.setError('tourDocumentFile', { message: errorMsg })
      return
    }

    // Clear previous errors
    setUploadError(null)
    form.clearErrors('tourDocumentFile')

    setIsUploadingFile(true)
    try {
      const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
      if (!allowedTypes.includes(file.type)) {
        const errorMsg = 'File must be a PDF or Word document'
        setUploadError(errorMsg)
        form.setError('tourDocumentFile', { message: errorMsg })
        return
      }
      if (file.size > 10 * 1024 * 1024) {
        const errorMsg = 'File size must be less than 10MB'
        setUploadError(errorMsg)
        form.setError('tourDocumentFile', { message: errorMsg })
        return
      }

      const fileName = `tour-user-${user.id}-${Date.now()}-${file.name}`
      console.log(`TourBookingForm: Uploading file ${fileName} for user ${user.id}`)
      const { data: uploadData, error: uploadError } = await supabase.storage.from('proposals').upload(fileName, file)
      if (uploadError) {
        console.error(`TourBookingForm: Upload error for user ${user.id}:`, uploadError)
        const errorMsg = 'Failed to upload file: ' + uploadError.message
        setUploadError(errorMsg)
        form.setError('tourDocumentFile', { message: errorMsg })
        return
      }
      setUploadedFilePath(fileName)
      form.setValue('tourDocumentFile', fileName)
      console.log(`TourBookingForm: File uploaded successfully, path: ${fileName} for user ${user.id}`)
    } catch (error) {
      console.error('File upload error:', error)
      const errorMsg = 'An error occurred during upload'
      setUploadError(errorMsg)
      form.setError('tourDocumentFile', { message: errorMsg })
    } finally {
      setIsUploadingFile(false)
    }
  }

  const onSubmit = async (data: TourBookingFormData) => {
    console.log(`TourBookingForm: onSubmit, user=${user ? user.id : 'null'}`)
    if (!user) {
      form.setError('root', { message: 'Not authenticated' })
      return
    }

    setIsSubmitting(true)

    const selectedDateStr = formatDate(data.selectedDate!, 'yyyy-MM-dd')
    const startTimeStr = `${data.startHour}:${data.startMinute}`
    const endTimeStr = `${data.endHour}:${data.endMinute}`

    const startDateTime = dayjs(`${selectedDateStr} ${startTimeStr}`).toDate()
    const endDateTime = dayjs(`${selectedDateStr} ${endTimeStr}`).toDate()

    // Check for approved conflicts
    const approvedConflict = existingBookings.some(booking => {
      if (booking.status !== 'approved') return false
      const bookingStart = new Date(booking.start_time)
      const bookingEnd = new Date(booking.end_time)
      return (
        (startDateTime >= bookingStart && startDateTime < bookingEnd) ||
        (endDateTime > bookingStart && endDateTime <= bookingEnd) ||
        (startDateTime <= bookingStart && endDateTime >= bookingEnd)
      )
    })

    if (approvedConflict) {
      form.setError('root', { message: 'This time slot is already approved' })
      setIsSubmitting(false)
      return
    }

    // Check for pending overlaps
    const pendingOverlap = existingBookings.some(booking => {
      if (booking.status !== 'pending') return false
      const bookingStart = new Date(booking.start_time)
      const bookingEnd = new Date(booking.end_time)
      return (
        (startDateTime >= bookingStart && startDateTime < bookingEnd) ||
        (endDateTime > bookingStart && endDateTime <= bookingEnd) ||
        (startDateTime <= bookingStart && endDateTime >= bookingEnd)
      )
    })

    setPendingOverlapWarning(pendingOverlap)

    // Get the Library Tour room UUID from database (with auto-creation if missing)
    const roomResult = await ensureLibraryTourRoom()

    if (!roomResult.success || !roomResult.roomId) {
      console.error('Library Tour room lookup failed:', roomResult.error)
      form.setError('root', {
        message: roomResult.error || 'Library Tour room not found and could not be created'
      })
      setIsSubmitting(false)
      return
    }

    // Log if room was created or if using fallback
    if (roomResult.wasCreated) {
      console.log('Library Tour room was created during booking')
    } else if (roomResult.error) {
      console.log('Using fallback room for booking:', roomResult.error)
    }

    // Create optimistic booking for immediate UI feedback
    const optimisticBooking: Booking = {
      id: `optimistic-${Date.now()}`,
      room_id: roomResult.roomId,
      start_time: startDateTime.toISOString(),
      end_time: endDateTime.toISOString(),
      status: 'pending',
      event_description: `Library Tour Booking`,
      guest_count: data.participantCount,
      notes: data.specialRequests || '',
      proposal_file: data.tourDocumentFile || null,
      letter: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      user_id: user.id,
      is_tour: true,
    }

    // Add optimistic booking to local state
    setOptimisticBookings(prev => [...prev, optimisticBooking])
    setIsSubmittingOptimistically(true)

    const filePath = data.tourDocumentFile;

    const bookingData = {
      start_time: startDateTime.toISOString(),
      end_time: endDateTime.toISOString(),
      event_description: `Library Tour Booking`,
      guest_count: data.participantCount,
      notes: data.specialRequests || '',
      proposal_file: filePath,
      room_id: roomResult.roomId, // Use the room ID from our utility function
      // Tour-specific fields based on actual database schema
      is_tour: true
    }

    try {
        const response = await fetch('/api/tour-booking', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(bookingData),
        })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create tour booking')
      }

      const result = await response.json()
      console.log(`TourBookingForm: Booking success, refreshing bookings, user=${user ? user.id : 'null'}`)

      // Remove optimistic booking and add real one
      setOptimisticBookings(prev => prev.filter(b => b.id !== optimisticBooking.id))
      setIsSubmittingOptimistically(false)

      // Refresh bookings in parent component
      if (onBookingSuccess) {
        onBookingSuccess()
      }

      router.push('/dashboard?success=Tour booking submitted successfully')
    } catch (error) {
      console.error('Tour booking error:', error)
      // Remove optimistic booking on error
      setOptimisticBookings(prev => prev.filter(b => b.id !== optimisticBooking.id))
      setIsSubmittingOptimistically(false)
      form.setError('root', { message: error instanceof Error ? error.message : 'An error occurred' })
      setIsSubmitting(false)
    } finally {
      setIsSubmitting(false)
    }
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
          <Card className="bg-card hover:shadow-xl transition-all duration-300">

            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                  <CalendarIcon className="w-5 h-5 text-white" />
                </div>
                <span className="text-blue-600">
                  Pilih Tanggal
                </span>
              </CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-300">
                Pilih tanggal yang diinginkan untuk tour
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="date" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Tanggal Tour
                  </Label>
                  <div className="flex justify-center">
                    <UICalendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={handleDateSelect}
                      disabled={(date: Date) => {
                        const today = new Date();
                        today.setHours(0, 0, 0, 0);
                        return date < today;
                      }}
                      modifiers={{
                        booked: getBookedDates(),
                        approved: getBookedDates().filter(date => getDateStatus(date) === 'approved'),
                        pending: getBookedDates().filter(date => getDateStatus(date) === 'pending'),
                        today: (date) => isToday(date)
                      }}
                      modifiersStyles={{
                        approved: {
                          backgroundColor: 'rgb(254 202 202)', // red-200
                          color: 'rgb(153 27 27)', // red-800
                          fontWeight: 'bold'
                        },
                        pending: {
                          backgroundColor: 'rgb(254 240 138)', // yellow-200
                          color: 'rgb(133 77 14)', // yellow-800
                          fontWeight: 'bold'
                        },
                        today: {
                          backgroundColor: 'rgb(59 130 246)', // blue-500
                          color: 'white',
                          fontWeight: 'bold'
                        }
                      }}
                      className="rounded-md border shadow-sm [&_.rdp-day_button:hover]:hover:bg-gray-100"
                    />
                  </div>
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
                      <Clock className="w-4 h-4 mr-2 text-primary" />
                      Waktu yang sudah dipesan untuk {formatDate(selectedDate, 'dd MMMM yyyy')}:
                    </h4>
                    <div className="space-y-1">
                      {getBookedTimes(selectedDate).map((time, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className={`flex items-center gap-2 text-sm px-3 py-2 rounded-md ${
                            time.status === 'approved'
                              ? 'text-red-600 bg-red-50 dark:bg-red-900/20'
                              : time.isOptimistic
                              ? 'text-blue-600 bg-blue-50 dark:bg-blue-900/20 animate-pulse'
                              : 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20'
                          }`}
                        >
                          <div className={`w-2 h-2 rounded-full ${
                            time.status === 'approved'
                              ? 'bg-red-500'
                              : time.isOptimistic
                              ? 'bg-blue-500 animate-pulse'
                              : 'bg-yellow-500'
                          }`}></div>
                          {format(time.start, 'HH:mm')} - {format(time.end, 'HH:mm')} ({
                            time.status === 'approved'
                              ? 'Sudah disetujui'
                              : time.isOptimistic
                              ? 'Sedang diproses...'
                              : 'Menunggu persetujuan'
                          })
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
          <Card className="bg-card hover:shadow-xl transition-all duration-300">

            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Users className="w-5 h-5 text-white" />
                </div>
                <span className="text-blue-600">
                  Detail Booking Tour
                </span>
              </CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-300">
                Isi detail booking tour Anda dengan lengkap
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
                  <Label htmlFor="participantCount">Jumlah Peserta</Label>
                  <Input
                    id="participantCount"
                    type="number"
                    {...form.register('participantCount', { valueAsNumber: true })}
                    placeholder="Masukkan jumlah peserta"
                    className={cn(form.formState.errors.participantCount && "border-red-500")}
                  />
                  {form.formState.errors.participantCount && (
                    <p className="text-sm text-red-500 mt-1">{form.formState.errors.participantCount.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="specialRequests">Permintaan Khusus</Label>
                  <Textarea
                    id="specialRequests"
                    {...form.register('specialRequests')}
                    placeholder="Permintaan khusus atau kebutuhan aksesibilitas..."
                  />
                </div>

                <div>
                  <Label htmlFor="tourDocumentFile">Upload Dokumen (Opsional)</Label>
                  <div className="relative">
                    <Input
                      id="tourDocumentFile"
                      type="file"
                      accept=".pdf,.doc,.docx"
                      disabled={isUploadingFile || isSubmitting || isSubmittingOptimistically}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          handleFileUpload(file);
                        } else {
                          setUploadedFilePath(undefined);
                          setUploadError(null);
                          form.setValue('tourDocumentFile', undefined);
                          form.clearErrors('tourDocumentFile');
                        }
                      }}
                      className={cn(
                        uploadError && "border-red-500",
                        isUploadingFile && "border-blue-500 bg-blue-50"
                      )}
                    />
                    {isUploadingFile && (
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Format yang diterima: PDF, DOC, DOCX (Maks 10MB)</p>
                  {isUploadingFile && (
                    <div className="flex items-center gap-2 mt-2">
                      <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                      <p className="text-sm text-blue-600 font-medium">Mengunggah file...</p>
                    </div>
                  )}
                  {uploadedFilePath && !isUploadingFile && !uploadError && (
                    <div className="flex items-center gap-2 mt-2">
                      <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <p className="text-sm text-green-600 font-medium">File berhasil diunggah</p>
                    </div>
                  )}
                  {(uploadError || form.formState.errors.tourDocumentFile) && (
                    <div className="flex items-center gap-2 mt-2">
                      <div className="w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <p className="text-sm text-red-600 font-medium">{uploadError || form.formState.errors.tourDocumentFile?.message}</p>
                    </div>
                  )}
                </div>

                {form.formState.errors.endHour && (
                  <p className="text-sm text-red-500">{form.formState.errors.endHour.message}</p>
                )}

                {form.formState.errors.root && (
                  <Alert variant="destructive">
                    <AlertDescription>{form.formState.errors.root.message}</AlertDescription>
                  </Alert>
                )}

                {pendingOverlapWarning && (
                  <Alert>
                    <AlertDescription>
                      ⚠️ This time slot overlaps with a pending reservation. Your booking will still be submitted but may be rejected if the other reservation is approved first.
                    </AlertDescription>
                  </Alert>
                )}

                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Button
                    type="submit"
                    disabled={isSubmitting || isSubmittingOptimistically || isUploadingFile}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 group-hover:shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isUploadingFile ? (
                      <div className="flex items-center justify-center">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2 animate-spin" />
                        Menunggu upload file selesai...
                      </div>
                    ) : isSubmitting || isSubmittingOptimistically ? (
                      <>
                        <div className="w-4 h-4 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        Mengirim Booking...
                      </>
                    ) : (
                      <>
                        <ArrowRight className="w-4 h-4 mr-2 text-white" />
                        Kirim Booking Tour
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