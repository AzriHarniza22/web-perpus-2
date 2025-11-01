'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useCreateBooking, type Room, type Booking } from '@/lib/api'
import { useAuth } from '@/components/AuthProvider'
import { supabase } from '@/lib/supabase'
import { format as formatDate } from 'date-fns'
import { id } from 'date-fns/locale'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, ArrowRight, Upload, X, FileText, CheckCircle, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { cn } from '@/lib/utils'
import dayjs from 'dayjs'
import { useToast } from '@/components/ui/toast'
import { useHoverAnimation, useStaggerAnimation, useLoadingAnimation } from '@/hooks/useAnimations'

const bookingSchema = z.object({
  startHour: z.string().min(1, 'Please select start hour'),
  startMinute: z.string().min(1, 'Please select start minute'),
  endHour: z.string().min(1, 'Please select end hour'),
  endMinute: z.string().min(1, 'Please select end minute'),
  eventDescription: z.string().min(1, 'Event description is required'),
  guestCount: z.number().min(1, 'Please enter at least 1 guest').max(100, 'Maximum 100 guests'),
  contactName: z.string().min(1, 'Contact name is required'),
  institution: z.string().min(1, 'Institution is required'),
  notes: z.string().optional(),
  proposalFile: z.instanceof(File).optional().refine((file) => {
    if (!file) return true;
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    return allowedTypes.includes(file.type);
  }, 'File must be a PDF or Word document').refine((file) => {
    if (!file) return true;
    return file.size <= 10 * 1024 * 1024; // 10MB
  }, 'File size must be less than 10MB'),
}).refine((data) => {
  const startTime = `${data.startHour}:${data.startMinute}`
  const endTime = `${data.endHour}:${data.endMinute}`

  const startDateTime = dayjs(`2000-01-01 ${startTime}`)
  const endDateTime = dayjs(`2000-01-01 ${endTime}`)

  return startDateTime.isBefore(endDateTime)
}, {
  message: 'End time must be after start time',
  path: ['endHour'],
})

type BookingFormData = z.infer<typeof bookingSchema>

interface ReservationFormCardProps {
  room: Room
  existingBookings: Booking[]
  selectedDate?: Date
  isTour?: boolean
}

export default function ReservationFormCard({ room, existingBookings, selectedDate, isTour = false }: ReservationFormCardProps) {
  const router = useRouter()
  const { user } = useAuth()
  const createBookingMutation = useCreateBooking()
  const { success } = useToast()

  // Animation hooks
  const hoverAnimation = useHoverAnimation()
  const loadingAnimation = useLoadingAnimation()
  const staggerAnimation = useStaggerAnimation()

  const [pendingOverlapWarning, setPendingOverlapWarning] = useState(false)
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [uploadProgress, setUploadProgress] = useState<number>(0)
  const [showSuccess, setShowSuccess] = useState(false)
  const [showError, setShowError] = useState(false)

  const form = useForm<BookingFormData>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      startHour: '09',
      startMinute: '00',
      endHour: '10',
      endMinute: '00',
      eventDescription: '',
      guestCount: 1,
      contactName: '',
      institution: '',
      notes: '',
      proposalFile: undefined,
    },
    mode: 'onChange',
  })

  const onSubmit = async (data: BookingFormData) => {
    console.log(`ReservationFormCard: onSubmit, user=${user ? user.id : 'null'}`)
    console.log('DEBUG - Form data being submitted:', {
      contactName: data.contactName,
      institution: data.institution,
      eventDescription: data.eventDescription,
      guestCount: data.guestCount,
      startHour: data.startHour,
      endHour: data.endHour
    })
    if (!user || !selectedDate) {
      form.setError('root', { message: 'Not authenticated or no date selected' })
      return
    }

    const selectedDateStr = formatDate(selectedDate, 'yyyy-MM-dd')
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

    const file = data.proposalFile;
    let filePath: string | undefined = undefined;
    if (file) {
      const fileName = `user-${user.id}-${Date.now()}-${file.name}`;
      console.log(`ReservationFormCard: Uploading file ${fileName} for user ${user.id}`);

      // Simulate progress for demo (in real implementation, use actual upload progress)
      setUploadProgress(0);
      for (let progress = 0; progress <= 100; progress += 10) {
        setUploadProgress(progress);
        await new Promise(resolve => setTimeout(resolve, 50));
      }

      const { data: uploadData, error: uploadError } = await supabase.storage.from('proposals').upload(fileName, file);
      if (uploadError) {
        console.error(`ReservationFormCard: Upload error for user ${user.id}:`, uploadError);
        form.setError('root', { message: 'Failed to upload file: ' + uploadError.message });
        setUploadProgress(0);
        return;
      }
      filePath = fileName;
      console.log(`ReservationFormCard: File uploaded successfully, path: ${filePath} for user ${user.id}`);
      setUploadProgress(0);
    }

    const bookingData = {
      room_id: room.id,
      start_time: startDateTime.toISOString(),
      end_time: endDateTime.toISOString(),
      status: 'pending',
      event_description: data.eventDescription,
      guest_count: data.guestCount,
      contact_name: data.contactName,
      contact_institution: data.institution,
      notes: data.notes || '',
      proposal_file: filePath,
      is_tour: isTour,
    }

    createBookingMutation.mutate(bookingData, {
      onSuccess: () => {
        console.log(`ReservationFormCard: Booking success, redirecting to /dashboard, user=${user ? user.id : 'null'}`)
        setShowSuccess(true)
        success('Reservasi Berhasil', 'Reservasi Anda telah berhasil dikirim dan menunggu persetujuan.')
        setTimeout(() => {
          router.push('/dashboard?success=Booking submitted successfully')
        }, 1500)
      },
      onError: (err) => {
        setShowError(true)
        form.setError('root', { message: err instanceof Error ? err.message : 'An error occurred' })
        setTimeout(() => setShowError(false), 3000)
      },
    })
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      whileHover={{ y: -2 }}
      whileTap={{ y: 1 }}
    >
      {/* Success Animation */}
      <AnimatePresence>
        {showSuccess && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: -50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: -50 }}
            className="fixed top-4 right-4 z-50 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-2"
          >
            <CheckCircle className="w-5 h-5" />
            <span>Booking submitted successfully!</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error Animation */}
      <AnimatePresence>
        {showError && (
          <motion.div
            initial={{ opacity: 0, x: 300 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 300 }}
            className="fixed top-4 right-4 z-50 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-2"
          >
            <AlertCircle className="w-5 h-5" />
            <span>Failed to submit booking</span>
          </motion.div>
        )}
      </AnimatePresence>

      <Card className="bg-card backdrop-blur-sm hover:shadow-xl transition-all duration-300 relative overflow-hidden group flex flex-col">
        {/* Background Gradient */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-br from-secondary-50/50 via-accent-50/30 to-orange-50/50 dark:from-secondary-900/20 dark:via-accent-900/20 dark:to-orange-900/20 pointer-events-none"
          initial={{ opacity: 0 }}
          whileHover={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        />

        <CardHeader className="relative z-10 flex-shrink-0">
          <CardTitle className="flex items-center gap-3">
            <motion.div
              className="w-10 h-10 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center"
              whileHover={{ scale: 1.1, rotate: -5 }}
              transition={{ type: "spring", stiffness: 400, damping: 10 }}
            >
              <Sparkles className="w-5 h-5 text-white" />
            </motion.div>
            <span className="bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent">
              Detail Reservasi
            </span>
          </CardTitle>
          <CardDescription className="text-gray-600 dark:text-gray-300 text-sm">
            Isi detail reservasi Anda dengan lengkap
          </CardDescription>
        </CardHeader>

        <CardContent className="flex-1 overflow-y-auto">
          {selectedDate && (
            <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
                Tanggal Terpilih: {formatDate(selectedDate, 'EEEE, dd MMMM yyyy', { locale: id })}
              </p>
            </div>
          )}
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">

            <motion.div
              className="space-y-2"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Label htmlFor="contactName" className="text-sm font-medium">Nama</Label>
              <motion.div
                whileFocus={{ scale: 1.01 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
              >
                <Input
                  id="contactName"
                  {...form.register('contactName')}
                  placeholder="Nama lengkap kontak"
                  className={cn("h-9", form.formState.errors.contactName && "border-red-500")}
                />
              </motion.div>
              <AnimatePresence>
                {form.formState.errors.contactName && (
                  <motion.p
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="text-xs text-red-500"
                  >
                    {form.formState.errors.contactName.message}
                  </motion.p>
                )}
              </AnimatePresence>
            </motion.div>

            <motion.div
              className="space-y-2"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Label htmlFor="institution" className="text-sm font-medium">Institusi</Label>
              <motion.div
                whileFocus={{ scale: 1.01 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
              >
                <Input
                  id="institution"
                  {...form.register('institution')}
                  placeholder="Nama institusi atau organisasi"
                  className={cn("h-9", form.formState.errors.institution && "border-red-500")}
                />
              </motion.div>
              <AnimatePresence>
                {form.formState.errors.institution && (
                  <motion.p
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="text-xs text-red-500"
                  >
                    {form.formState.errors.institution.message}
                  </motion.p>
                )}
              </AnimatePresence>
            </motion.div>
            {/* Time Selection - Optimized for equal width layout */}
            <motion.div
              className="grid grid-cols-2 gap-3"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <motion.div
                className="space-y-2"
                whileHover={{ scale: 1.02 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
              >
                <Label className="text-sm font-medium">Waktu Mulai</Label>
                <div className="flex gap-2">
                  <Select value={form.watch('startHour')} onValueChange={(value: string) => form.setValue('startHour', value)}>
                    <SelectTrigger className="h-9 flex-1">
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
                    <SelectTrigger className="h-9 flex-1">
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
              </motion.div>
              <motion.div
                className="space-y-2"
                whileHover={{ scale: 1.02 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
              >
                <Label className="text-sm font-medium">Waktu Selesai</Label>
                <div className="flex gap-2">
                  <Select value={form.watch('endHour')} onValueChange={(value: string) => form.setValue('endHour', value)}>
                    <SelectTrigger className="h-9 flex-1">
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
                    <SelectTrigger className="h-9 flex-1">
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
              </motion.div>
            </motion.div>

            <motion.div
              className="space-y-2"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              <Label htmlFor="eventDescription" className="text-sm font-medium">Deskripsi Acara</Label>
              <motion.div
                whileFocus={{ scale: 1.01 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
              >
                <Textarea
                  id="eventDescription"
                  {...form.register('eventDescription')}
                  placeholder="Jelaskan acara atau tujuan Anda"
                  className={cn("min-h-[80px] resize-none", form.formState.errors.eventDescription && "border-red-500")}
                />
              </motion.div>
              <AnimatePresence>
                {form.formState.errors.eventDescription && (
                  <motion.p
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="text-xs text-red-500"
                  >
                    {form.formState.errors.eventDescription.message}
                  </motion.p>
                )}
              </AnimatePresence>
            </motion.div>

            <motion.div
              className="space-y-2"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
            >
              <Label htmlFor="guestCount" className="text-sm font-medium">Jumlah Tamu</Label>
              <motion.div
                whileFocus={{ scale: 1.01 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
              >
                <Input
                  id="guestCount"
                  type="number"
                  {...form.register('guestCount', { valueAsNumber: true })}
                  placeholder="1-100"
                  className={cn("h-9", form.formState.errors.guestCount && "border-red-500")}
                />
              </motion.div>
              <AnimatePresence>
                {form.formState.errors.guestCount && (
                  <motion.p
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="text-xs text-red-500"
                  >
                    {form.formState.errors.guestCount.message}
                  </motion.p>
                )}
              </AnimatePresence>
            </motion.div>

            <motion.div
              className="space-y-2"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
            >
              <Label htmlFor="notes" className="text-sm font-medium">Catatan Tambahan</Label>
              <motion.div
                whileFocus={{ scale: 1.01 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
              >
                <Textarea
                  id="notes"
                  {...form.register('notes')}
                  placeholder="Persyaratan khusus atau catatan lainnya"
                  className="min-h-[60px] resize-none"
                />
              </motion.div>
            </motion.div>

            {/* Upload Proposal Section */}
            <motion.div
              className="space-y-2"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9 }}
            >
              <Label className="text-sm font-medium">Upload Proposal</Label>
              <div className="space-y-3">
                <motion.div
                  whileHover={{ scale: 1.01 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  className="relative"
                >
                  <Input
                    type="file"
                    accept=".pdf,.doc,.docx"
                    onChange={(e) => {
                      const file = e.target.files?.[0] || undefined;
                      form.setValue('proposalFile', file);
                      setUploadedFile(file || null);
                    }}
                    className="h-10 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                  <p className="text-xs text-gray-500 mt-1">Format yang diterima: PDF, DOC, DOCX (Maks 10MB)</p>
                </motion.div>

                <AnimatePresence>
                  {form.formState.errors.proposalFile && (
                    <motion.p
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="text-xs text-red-500"
                    >
                      {form.formState.errors.proposalFile.message}
                    </motion.p>
                  )}
                </AnimatePresence>

                {/* File Display */}
                <AnimatePresence>
                  {uploadedFile && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      className="space-y-2"
                    >
                      <Label className="text-xs text-gray-600">File yang dipilih:</Label>
                      <motion.div
                        className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded-lg"
                        layout
                      >
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-blue-500" />
                          <span className="text-sm truncate max-w-[200px]">{uploadedFile.name}</span>
                          <span className="text-xs text-gray-500">({(uploadedFile.size / 1024 / 1024).toFixed(2)} MB)</span>
                        </div>
                        <motion.div
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                        >
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setUploadedFile(null);
                              form.setValue('proposalFile', undefined);
                            }}
                            className="h-6 w-6 p-0 hover:bg-red-100 hover:text-red-600"
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </motion.div>
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Progress Bar for Upload */}
                <AnimatePresence>
                  {uploadProgress > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="space-y-2"
                    >
                      <div className="flex justify-between text-xs">
                        <span>Uploading {uploadedFile?.name}</span>
                        <span>{uploadProgress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <motion.div
                          className="bg-blue-600 h-2 rounded-full"
                          initial={{ width: 0 }}
                          animate={{ width: `${uploadProgress}%` }}
                          transition={{ duration: 0.3 }}
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>

            <div className="space-y-2">
              {form.formState.errors.root && (
                <Alert variant="destructive" className="py-2">
                  <AlertDescription className="text-sm">{form.formState.errors.root.message}</AlertDescription>
                </Alert>
              )}

              {pendingOverlapWarning && (
                <Alert className="py-2">
                  <AlertDescription className="text-sm">
                    ⚠️ Overlap dengan reservasi pending lainnya
                  </AlertDescription>
                </Alert>
              )}

              <motion.div
                className="relative z-10"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-medium py-2.5 h-10 group-hover:shadow-lg transition-all duration-300"
                  disabled={createBookingMutation.isPending || !selectedDate}
                >
                  {createBookingMutation.isPending ? (
                    <motion.div
                      className="flex items-center justify-center"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    >
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                      Mengirim Reservasi...
                    </motion.div>
                  ) : (
                    <motion.div
                      className="flex items-center justify-center"
                      whileHover={{ x: 2 }}
                      transition={{ type: "spring", stiffness: 400, damping: 10 }}
                    >
                      <ArrowRight className="w-4 h-4 mr-2" />
                      Kirim Reservasi
                    </motion.div>
                  )}
                </Button>
              </motion.div>
            </div>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  )
}