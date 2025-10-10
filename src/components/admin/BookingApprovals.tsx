'use client'

import { useState } from 'react'
import { useBookings, useUpdateBookingStatus } from '@/lib/api'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { CheckCircle, XCircle, Clock, FileText, Users, Calendar, MapPin, Eye, File, Sparkles, Building, Grid3X3 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { BookingWithRelations } from '@/lib/api'
import BookingDetailModal from '@/components/admin/BookingDetailModal'

// Visual distinction system configuration
const bookingTypeConfigs = {
  room: {
    icon: Building,
    color: { primary: 'primary', secondary: 'primary', background: 'primary/10' },
    gradient: 'from-primary to-primary',
    label: 'Reservasi Ruangan',
    badgeBg: 'primary/10',
    badgeBorder: 'primary/20'
  },
  tour: {
    icon: Sparkles,
    color: { primary: 'secondary', secondary: 'secondary', background: 'secondary/10' },
    gradient: 'from-secondary to-secondary',
    label: 'Pemesanan Tour',
    badgeBg: 'secondary/10',
    badgeBorder: 'secondary/20'
  }
}

// Enhanced filter configuration with Indonesian labels
const filterConfigs = {
  all: { key: 'all', label: 'Semua', icon: Grid3X3, color: 'text-muted-foreground', bgColor: 'bg-muted' },
  room: { key: 'room', label: 'Ruangan', icon: Building, color: 'text-primary', bgColor: 'bg-primary/10' },
  tour: { key: 'tour', label: 'Tour', icon: Sparkles, color: 'text-secondary', bgColor: 'bg-secondary/10' }
}

export default function BookingApprovals() {
  const [bookingType, setBookingType] = useState<'all' | 'room' | 'tour'>('all')
  const [detailModalOpen, setDetailModalOpen] = useState(false)
  const [selectedBooking, setSelectedBooking] = useState<BookingWithRelations | null>(null)

  // Use API filtering instead of client-side filtering
  const isTourFilter = bookingType === 'all' ? undefined : bookingType === 'tour'
  const { data: bookingsData, isLoading } = useBookings({
    status: ['pending'],
    isTour: isTourFilter
  })
  const bookings = bookingsData?.bookings || []
  const updateBookingStatusMutation = useUpdateBookingStatus()

  // Helper function to get tour information from booking
  const getTourInfo = (booking: BookingWithRelations) => {
    // For tour bookings, we can extract tour info from the booking data
    // This removes the dependency on mock data
    const tourName = booking.event_description?.replace('Tour: ', '').split(' - ')[0] || 'Tour Khusus'
    return {
      name: tourName,
      duration: 60, // Default duration
      maxParticipants: booking.guest_count || 10,
      meetingPoint: 'Lokasi Tour',
      guideName: 'Guide Tour',
      guideContact: 'guide@library.edu',
      description: booking.event_description || 'Deskripsi tour tidak tersedia'
    }
  }

  const updateBookingStatus = (id: string, status: string) => {
    updateBookingStatusMutation.mutate({ id, status })
  }

  const handleViewDetails = (booking: BookingWithRelations) => {
    setSelectedBooking(booking)
    setDetailModalOpen(true)
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
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="p-6">
            <div className="animate-pulse">
              <div className="flex justify-between items-start mb-4">
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-32"></div>
                  <div className="h-3 bg-gray-200 rounded w-48"></div>
                  <div className="h-3 bg-gray-200 rounded w-40"></div>
                </div>
                <div className="h-6 bg-gray-200 rounded w-16"></div>
              </div>
              <div className="flex space-x-2">
                <div className="h-8 bg-gray-200 rounded w-20"></div>
                <div className="h-8 bg-gray-200 rounded w-20"></div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Enhanced Header with Filter */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Persetujuan Reservasi
          </h2>
          <p className="text-muted-foreground">Tinjau dan kelola permintaan reservasi yang menunggu persetujuan</p>
        </div>
        <div className="flex items-center space-x-3">
          <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Filter:</span>
          <div className="flex rounded-lg border border-gray-200 dark:border-gray-700 bg-card shadow-sm">
            {(Object.keys(filterConfigs) as Array<keyof typeof filterConfigs>).map((filterKey) => {
              const filter = filterConfigs[filterKey]
              const Icon = filter.icon
              const isActive = bookingType === filter.key

              return (
                <button
                  key={filter.key}
                  onClick={() => setBookingType(filter.key as 'all' | 'room' | 'tour')}
                  className={`px-4 py-2 text-sm font-medium transition-all duration-200 flex items-center space-x-2 ${
                    isActive
                      ? `${filter.color} ${filter.bgColor} border-2 border-opacity-50`
                      : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700'
                  } ${
                    filter.key === 'all' ? 'rounded-l-lg' :
                    filter.key === 'tour' ? 'rounded-r-lg' : ''
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? filter.color : 'opacity-60'}`} />
                  <span>{filter.label}</span>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {bookings.map((booking, index) => {
          // Determine booking type from API response
          const isTourBooking = booking.is_tour || false
          const bookingTypeKey = isTourBooking ? 'tour' : 'room'
          const config = bookingTypeConfigs[bookingTypeKey]
          const Icon = config.icon
          const tourInfo = bookingTypeKey === 'tour' ? getTourInfo(booking) : null

          return (
            <motion.div
              key={booking.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className={`bg-gradient-to-r from-white to-gray-50 dark:from-gray-800 dark:to-gray-900/50 backdrop-blur-sm hover:shadow-xl transition-all duration-300 border border-gray-200/50 dark:border-gray-700/50 hover:shadow-primary/10`}>
                <CardContent className="py-0 px-4">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div className="flex-1 space-y-3">
                      {/* Enhanced Header with Type-specific Styling */}
                      <div className="flex items-center justify-between">
                        <h3 className={`text-lg font-bold flex items-center bg-gradient-to-r ${config.gradient} bg-clip-text text-transparent`}>
                          <div className={`w-8 h-8 bg-gradient-to-br ${config.gradient} rounded-full flex items-center justify-center mr-3 shadow-lg`}>
                            <Icon className="w-4 h-4 text-white" />
                          </div>
                          {bookingTypeKey === 'tour' ? tourInfo?.name : booking.rooms?.name}
                        </h3>
                        <Badge className={`bg-${config.badgeBg} text-primary dark:bg-${config.badgeBg} dark:text-primary-foreground border border-${config.badgeBorder} dark:border-primary/30 px-3 py-1`}>
                          <Clock className="w-3 h-3 mr-1 text-gray-600" />
                          Menunggu
                        </Badge>
                      </div>

                    {/* Enhanced User Info with Type-specific Styling */}
                    <div className="flex items-center space-x-3">
                      <Avatar className="w-8 h-8">
                        <AvatarImage src={booking.profiles?.profile_photo || undefined} alt={booking.profiles?.full_name} />
                        <AvatarFallback className={`text-xs bg-gradient-to-br ${config.gradient} text-white`}>
                          {booking.profiles?.full_name ? booking.profiles.full_name.split(' ').map(n => n[0]).join('').toUpperCase() : 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white text-sm">
                          {booking.profiles?.full_name}
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          {booking.profiles?.email}
                        </p>
                      </div>
                    </div>

                    {/* Enhanced Date and Time with Type-specific Icons */}
                    <div className="flex items-center space-x-2">
                      <div className={`w-8 h-8 bg-${config.color.background} dark:bg-${config.color.primary}/20 rounded-full flex items-center justify-center`}>
                        <Calendar className={`w-4 h-4 text-${config.color.primary} dark:text-${config.color.primary}-foreground`} />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white text-sm">
                          {formatDateTime(booking.start_time)}
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          sampai {formatDateTime(booking.end_time)}
                          {bookingTypeKey === 'tour' && tourInfo && ` • ${tourInfo.duration} menit`}
                        </p>
                      </div>
                    </div>
                    </div>

                    {/* Enhanced Action Buttons */}
                    <div className="flex flex-col gap-2 lg:flex-shrink-0 min-w-[180px]">
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewDetails(booking)}
                        className={`w-full justify-start bg-card border border-gray-200 dark:border-gray-600 hover:border-primary/30 dark:hover:border-primary/50 text-gray-900 hover:text-gray-900 dark:text-gray-100 dark:hover:text-gray-100 transition-all`}
                      >
                        <Eye className={`w-4 h-4 mr-2 text-${config.color.primary}`} />
                        Lihat Detail
                      </Button>
                    </motion.div>

                    {booking.proposal_file && (
                      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                        <Button
                          variant="outline"
                          size="sm"
                          asChild
                          className="w-full justify-start bg-card border border-gray-200 dark:border-gray-600 hover:border-secondary/30 dark:hover:border-secondary/50 text-gray-900 hover:text-gray-900 dark:text-gray-100 dark:hover:text-gray-100 transition-all"
                        >
                          <a
                            href={supabase.storage.from('proposals').getPublicUrl(booking.proposal_file).data.publicUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <File className="w-4 h-4 mr-2 text-secondary" />
                            Lihat Proposal
                          </a>
                        </Button>
                      </motion.div>
                    )}

                    <div className="flex gap-2">
                      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="flex-1">
                        <Button
                          onClick={() => updateBookingStatus(booking.id, 'approved')}
                          size="sm"
                          className="bg-green-600 hover:bg-green-700 text-white font-medium shadow-md hover:shadow-green-500/25 transition-all"
                          disabled={updateBookingStatusMutation.isPending}
                        >
                          <CheckCircle className="w-3 h-3 mr-1 text-green-600" />
                          Setujui
                        </Button>
                      </motion.div>
                      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="flex-1">
                        <Button
                          onClick={() => updateBookingStatus(booking.id, 'rejected')}
                          variant="destructive"
                          size="sm"
                          disabled={updateBookingStatusMutation.isPending}
                        >
                          <XCircle className="w-3 h-3 mr-1 text-red-600" />
                          Tolak
                        </Button>
                      </motion.div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
          )
        })}
      </AnimatePresence>

      {bookings.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12"
        >
          {bookingType === 'all' ? (
            <>
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Semua Reservasi Sudah Diputuskan
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Tidak ada permintaan reservasi yang menunggu persetujuan saat ini.
              </p>
            </>
          ) : bookingType === 'room' ? (
            <>
              <div className="w-16 h-16 bg-primary/10 dark:bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Building className="w-8 h-8 text-primary dark:text-primary-foreground" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Tidak Ada Reservasi Ruangan
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Saat ini tidak ada permintaan reservasi ruangan yang menunggu persetujuan.
              </p>
            </>
          ) : (
            <>
              <div className="w-16 h-16 bg-secondary/10 dark:bg-secondary/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-8 h-8 text-secondary dark:text-secondary-foreground" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Tidak Ada Pemesanan Tour
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Saat ini tidak ada permintaan pemesanan tour yang menunggu persetujuan.
              </p>
            </>
          )}
        </motion.div>
      )}

      <BookingDetailModal
        booking={selectedBooking}
        open={detailModalOpen}
        onOpenChange={setDetailModalOpen}
        context="approvals"
      />
    </div>
  )
}