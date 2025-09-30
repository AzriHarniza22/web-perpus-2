'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAuth } from '@/hooks/useAuth'
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
import dayjs from 'dayjs'

const tourBookingSchema = z.object({
  selectedDate: z.date().optional(),
  startHour: z.string().min(1, 'Please select start hour'),
  startMinute: z.string().min(1, 'Please select start minute'),
  endHour: z.string().min(1, 'Please select end hour'),
  endMinute: z.string().min(1, 'Please select end minute'),
  participantCount: z.number().min(1, 'Please enter at least 1 participant').max(50, 'Maximum 50 participants'),
  specialRequests: z.string().optional(),
  tourDocumentFile: z.instanceof(File).optional().refine((file) => {
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

type TourBookingFormData = z.infer<typeof tourBookingSchema>

// Fixed tour information
const TOUR_INFO = {
  name: 'Library Tour',
  guide: 'Library Staff',
  meetingPoint: 'Main Entrance',
  maxParticipants: 50,
}

export default function TourBookingForm() {
  const router = useRouter()

  const { user, isAuthenticated } = useAuth()

  // Local state for immediate UI updates
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())

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

  // Handler for date selection
  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date)
    form.setValue('selectedDate', date)
  }

  const onSubmit = async (data: TourBookingFormData) => {
    console.log(`TourBookingForm: onSubmit, user=${user ? user.id : 'null'}`)
    if (!isAuthenticated || !user) {
      form.setError('root', { message: 'Not authenticated' })
      return
    }

    const selectedDateStr = formatDate(data.selectedDate!, 'yyyy-MM-dd')
    const startTimeStr = `${data.startHour}:${data.startMinute}`
    const endTimeStr = `${data.endHour}:${data.endMinute}`

    const startDateTime = dayjs(`${selectedDateStr} ${startTimeStr}`).toDate()
    const endDateTime = dayjs(`${selectedDateStr} ${endTimeStr}`).toDate()

    // For tours, we'll use a fixed tour ID or get it from somewhere
    // For now, we'll use a placeholder that should be replaced with actual tour ID logic
    const tourId = 'tour-library-tour' // This should come from your tour selection or be fixed

    const file = data.tourDocumentFile;
    let filePath: string | undefined = undefined;
    if (file) {
      const fileName = `tour-user-${user.id}-${Date.now()}-${file.name}`;
      console.log(`TourBookingForm: Uploading file ${fileName} for user ${user.id}`);
      const { data: uploadData, error: uploadError } = await supabase.storage.from('proposals').upload(fileName, file);
      if (uploadError) {
        console.error(`TourBookingForm: Upload error for user ${user.id}:`, uploadError);
        form.setError('root', { message: 'Failed to upload file: ' + uploadError.message });
        return;
      }
      filePath = fileName;
      console.log(`TourBookingForm: File uploaded successfully, path: ${filePath} for user ${user.id}`);
    }

    const bookingData = {
      room_id: tourId, // Tour ID stored in room_id field for compatibility
      start_time: startDateTime.toISOString(),
      end_time: endDateTime.toISOString(),
      status: 'pending',
      event_description: `Library Tour Booking`,
      guest_count: data.participantCount,
      notes: data.specialRequests || '',
      proposal_file: filePath,
      // Tour-specific fields
      is_tour: true,
      tour_name: TOUR_INFO.name,
      tour_guide: TOUR_INFO.guide,
      tour_meeting_point: TOUR_INFO.meetingPoint,
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
      console.log(`TourBookingForm: Booking success, redirecting to /dashboard, user=${user ? user.id : 'null'}`)
      router.push('/dashboard?success=Tour booking submitted successfully')
    } catch (error) {
      console.error('Tour booking error:', error)
      form.setError('root', { message: error instanceof Error ? error.message : 'An error occurred' })
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
                Pilih tanggal yang diinginkan untuk tour
              </CardDescription>
            </CardHeader>
            <CardContent className="relative z-10">
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
                      className="rounded-md border shadow-sm"
                    />
                  </div>
                  {form.formState.errors.selectedDate && (
                    <p className="text-sm text-red-500 mt-1">{form.formState.errors.selectedDate.message}</p>
                  )}
                </div>
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
                  <Users className="w-5 h-5 text-white" />
                </div>
                <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
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
                  <Input
                    id="tourDocumentFile"
                    type="file"
                    accept=".pdf,.doc,.docx"
                    onChange={(e) => {
                      const file = e.target.files?.[0] || undefined;
                      form.setValue('tourDocumentFile', file);
                    }}
                  />
                  <p className="text-xs text-gray-500 mt-1">Format yang diterima: PDF, DOC, DOCX (Maks 10MB)</p>
                  {form.formState.errors.tourDocumentFile && (
                    <p className="text-sm text-red-500 mt-1">{form.formState.errors.tourDocumentFile.message}</p>
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

                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="relative z-10"
                >
                  <Button
                    type="submit"
                    className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-medium py-3 group-hover:shadow-lg transition-all duration-300"
                  >
                    <>
                      <ArrowRight className="w-4 h-4 mr-2" />
                      Kirim Booking Tour
                    </>
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