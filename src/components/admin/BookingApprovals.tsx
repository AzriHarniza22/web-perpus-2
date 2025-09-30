'use client'

import { useState } from 'react'
import { useBookings, useUpdateBookingStatus } from '@/lib/api'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { CheckCircle, XCircle, Clock, FileText, Users, Calendar, MapPin, Eye, File, Sparkles, Building, Grid3X3 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

// Visual distinction system configuration
const bookingTypeConfigs = {
  room: {
    icon: Building,
    color: { primary: 'blue', secondary: 'indigo', background: 'blue-50' },
    gradient: 'from-blue-600 to-indigo-600',
    label: 'Reservasi Ruangan',
    badgeBg: 'blue-100',
    badgeBorder: 'blue-200'
  },
  tour: {
    icon: Sparkles,
    color: { primary: 'purple', secondary: 'pink', background: 'purple-50' },
    gradient: 'from-purple-600 to-pink-600',
    label: 'Pemesanan Tour',
    badgeBg: 'purple-100',
    badgeBorder: 'purple-200'
  }
}

// Enhanced filter configuration with Indonesian labels
const filterConfigs = {
  all: { key: 'all', label: 'Semua', icon: Grid3X3, color: 'text-gray-600', bgColor: 'bg-gray-100' },
  room: { key: 'room', label: 'Ruangan', icon: Building, color: 'text-blue-600', bgColor: 'bg-blue-100' },
  tour: { key: 'tour', label: 'Tour', icon: Sparkles, color: 'text-purple-600', bgColor: 'bg-purple-100' }
}

export default function BookingApprovals() {
  const [bookingType, setBookingType] = useState<'all' | 'room' | 'tour'>('all')
  const { data: bookings = [], isLoading } = useBookings()
  const updateBookingStatusMutation = useUpdateBookingStatus()

  // Helper function to determine booking type based on data
  const getBookingType = (booking: any) => {
    if (booking.tours?.name || booking.event_description?.includes('Tour') || booking.is_tour) {
      return 'tour'
    }
    return 'room'
  }

  // Helper function to get tour information from booking
  const getTourInfo = (booking: any) => {
    // For tour bookings, we can extract tour info from the booking data
    // This removes the dependency on mock data
    return {
      name: booking.tours?.name || booking.event_description?.replace('Tour: ', '').split(' - ')[0] || 'Tour Khusus',
      duration: booking.tours?.duration || 60,
      maxParticipants: booking.tours?.max_participants || booking.guest_count || 10,
      meetingPoint: booking.tours?.meeting_point || 'Lokasi Tour',
      guideName: booking.tours?.guide_name || 'Guide Tour',
      guideContact: booking.tours?.guide_contact || 'guide@library.edu',
      description: booking.tours?.description || booking.event_description || 'Deskripsi tour tidak tersedia'
    }
  }

  // Filter only pending bookings
  const allPendingBookings = bookings.filter(booking => booking.status === 'pending')

  // Apply client-side filtering based on booking type
  const pendingBookings = allPendingBookings.filter(booking => {
    if (bookingType === 'all') return true
    const bookingTypeKey = getBookingType(booking)
    return bookingTypeKey === bookingType
  })

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
          <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Persetujuan Reservasi
          </h2>
          <p className="text-muted-foreground">Tinjau dan kelola permintaan reservasi yang menunggu persetujuan</p>
        </div>
        <div className="flex items-center space-x-3">
          <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Filter:</span>
          <div className="flex rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm">
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
        {pendingBookings.map((booking, index) => {
          const bookingTypeKey = getBookingType(booking)
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
              <Card className={`bg-gradient-to-r from-white to-gray-50 dark:from-gray-800 dark:to-gray-900/50 backdrop-blur-sm hover:shadow-xl transition-all duration-300 border border-gray-200/50 dark:border-gray-700/50 hover:shadow-${config.color.primary}-500/10`}>
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
                        <Badge className={`bg-${config.badgeBg} text-${config.color.primary}-800 dark:bg-${config.badgeBg} dark:text-${config.color.primary}-300 border border-${config.badgeBorder} dark:border-${config.color.primary}-800 px-3 py-1`}>
                          <Clock className="w-3 h-3 mr-1" />
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
                      <div className={`w-8 h-8 bg-${config.color.background} dark:bg-${config.color.primary}-900/50 rounded-full flex items-center justify-center`}>
                        <Calendar className={`w-4 h-4 text-${config.color.primary}-600 dark:text-${config.color.primary}-400`} />
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
                    <Dialog>
                      <DialogTrigger asChild>
                        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                          <Button
                            variant="outline"
                            size="sm"
                            className={`w-full justify-start bg-white hover:bg-gray-50 dark:bg-gray-800 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-600 hover:border-${config.color.primary}-300 dark:hover:border-${config.color.primary}-600 text-gray-900 hover:text-gray-900 dark:text-gray-100 dark:hover:text-gray-100 transition-all`}
                          >
                            <Eye className={`w-4 h-4 mr-2 text-${config.color.primary}-600`} />
                            Lihat Detail
                          </Button>
                        </motion.div>
                      </DialogTrigger>
                      <DialogContent className={`max-w-5xl max-h-[90vh] overflow-y-auto bg-gradient-to-br from-white via-${config.color.background}/30 to-purple-50/30 dark:from-gray-900 dark:via-${config.color.primary}-900/20 dark:to-purple-900/20`}>
                        <DialogHeader className="space-y-4 pb-6 border-b border-gray-200 dark:border-gray-700">
                          <div className="flex items-center space-x-4">
                            <div className={`w-12 h-12 bg-gradient-to-br ${config.gradient} rounded-xl flex items-center justify-center shadow-lg`}>
                              <Icon className="w-6 h-6 text-white" />
                            </div>
                            <div className="flex-1">
                              <DialogTitle className={`text-2xl font-bold bg-gradient-to-r ${config.gradient} bg-clip-text text-transparent`}>
                                Detail {config.label}
                              </DialogTitle>
                              <DialogDescription className="text-base text-gray-600 dark:text-gray-300 mt-1">
                                Informasi lengkap permintaan {bookingTypeKey === 'tour' ? tourInfo?.name : booking.rooms?.name}
                              </DialogDescription>
                            </div>
                            <div className="text-right">
                              <Badge className={`bg-${config.badgeBg} text-${config.color.primary}-800 dark:bg-${config.badgeBg} dark:text-white border border-${config.badgeBorder} dark:border-${config.color.primary}-800 px-3 py-1`}>
                                <Clock className="w-3 h-3 mr-1" />
                                Menunggu Approval
                              </Badge>
                            </div>
                          </div>
                        </DialogHeader>

                        <div className="space-y-6 mt-6">
                          {/* Enhanced Basic Information Section */}
                          <div className="space-y-4">
                            <h3 className={`text-lg font-semibold flex items-center bg-gradient-to-r ${config.gradient} bg-clip-text text-transparent`}>
                              <div className={`w-8 h-8 bg-${config.color.background} dark:bg-${config.color.primary}-900/50 rounded-lg flex items-center justify-center mr-3`}>
                                <FileText className={`w-4 h-4 text-${config.color.primary}-600 dark:text-${config.color.primary}-400`} />
                              </div>
                              Informasi Dasar
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                              {bookingTypeKey === 'room' ? (
                                <div className="bg-white dark:bg-gray-800/50 rounded-xl p-4 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-all">
                                  <h4 className="font-semibold text-sm mb-3 flex items-center text-gray-900 dark:text-gray-100">
                                    <MapPin className={`w-4 h-4 mr-2 text-${config.color.primary}-600 dark:text-${config.color.primary}-400`} />
                                    Ruangan
                                  </h4>
                                  <p className="text-gray-700 dark:text-gray-300 font-medium text-sm">{booking.rooms?.name}</p>
                                </div>
                              ) : (
                                <div className="bg-white dark:bg-gray-800/50 rounded-xl p-4 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-all">
                                  <h4 className="font-semibold text-sm mb-3 flex items-center text-gray-900 dark:text-gray-100">
                                    <Sparkles className={`w-4 h-4 mr-2 text-${config.color.primary}-600 dark:text-${config.color.primary}-400`} />
                                    Nama Tour
                                  </h4>
                                  <p className="text-gray-700 dark:text-gray-300 font-medium text-sm">{tourInfo?.name}</p>
                                </div>
                              )}
                              <div className="bg-white dark:bg-gray-800/50 rounded-xl p-4 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-all">
                                <h4 className="font-semibold text-sm mb-3 flex items-center text-gray-900 dark:text-gray-100">
                                  <Users className={`w-4 h-4 mr-2 text-${config.color.primary}-600 dark:text-${config.color.primary}-400`} />
                                  Pemohon
                                </h4>
                                <div className="flex items-center space-x-3">
                                  <Avatar className="w-10 h-10">
                                    <AvatarImage src={booking.profiles?.profile_photo || undefined} alt={booking.profiles?.full_name} />
                                    <AvatarFallback className={`text-sm bg-gradient-to-br ${config.gradient} text-white`}>
                                      {booking.profiles?.full_name ? booking.profiles.full_name.split(' ').map(n => n[0]).join('').toUpperCase() : 'U'}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <p className="text-gray-700 dark:text-gray-300 font-medium text-sm">{booking.profiles?.full_name}</p>
                                    <p className="text-gray-600 dark:text-gray-400 text-xs">{booking.profiles?.email}</p>
                                  </div>
                                </div>
                              </div>
                              <div className="bg-white dark:bg-gray-800/50 rounded-xl p-4 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-all">
                                <h4 className="font-semibold text-sm mb-3 flex items-center text-gray-900 dark:text-gray-100">
                                  <Users className={`w-4 h-4 mr-2 text-green-600 dark:text-green-400`} />
                                  Jumlah {bookingTypeKey === 'tour' ? 'Peserta' : 'Tamu'}
                                </h4>
                                <p className="text-gray-700 dark:text-gray-300 font-medium text-sm">
                                  {booking.guest_count ? `${booking.guest_count} orang` : 'Tidak ditentukan'}
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* Enhanced Date & Time Section */}
                          <div className="space-y-4">
                            <h3 className={`text-lg font-semibold flex items-center bg-gradient-to-r ${config.gradient} bg-clip-text text-transparent`}>
                              <div className={`w-8 h-8 bg-${config.color.background} dark:bg-${config.color.primary}-900/50 rounded-lg flex items-center justify-center mr-3`}>
                                <Calendar className={`w-4 h-4 text-${config.color.primary}-600 dark:text-${config.color.primary}-400`} />
                              </div>
                              Jadwal {bookingTypeKey === 'tour' ? 'Tour' : 'Reservasi'}
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="bg-white dark:bg-gray-800/50 rounded-xl p-4 border border-gray-200 dark:border-gray-700 shadow-sm">
                                <h4 className="font-semibold text-sm mb-3 flex items-center text-gray-900 dark:text-gray-100">
                                  <Calendar className={`w-4 h-4 mr-2 text-${config.color.primary}-600 dark:text-${config.color.primary}-400`} />
                                  Waktu Mulai
                                </h4>
                                <p className="text-gray-700 dark:text-gray-300 font-medium text-base">{formatDateTime(booking.start_time)}</p>
                              </div>
                              <div className="bg-white dark:bg-gray-800/50 rounded-xl p-4 border border-gray-200 dark:border-gray-700 shadow-sm">
                                <h4 className="font-semibold text-sm mb-3 flex items-center text-gray-900 dark:text-gray-100">
                                  <Clock className={`w-4 h-4 mr-2 text-orange-600 dark:text-orange-400`} />
                                  Waktu Selesai
                                </h4>
                                <p className="text-gray-700 dark:text-gray-300 font-medium text-base">{formatDateTime(booking.end_time)}</p>
                              </div>
                            </div>
                          </div>

                          {/* Tour-specific sections */}
                          {bookingTypeKey === 'tour' && tourInfo && (
                            <>
                              {/* Tour Details Section */}
                              <div className="space-y-4">
                                <h3 className={`text-lg font-semibold flex items-center bg-gradient-to-r ${config.gradient} bg-clip-text text-transparent`}>
                                  <div className={`w-8 h-8 bg-${config.color.background} dark:bg-${config.color.primary}-900/50 rounded-lg flex items-center justify-center mr-3`}>
                                    <MapPin className={`w-4 h-4 text-${config.color.primary}-600 dark:text-${config.color.primary}-400`} />
                                  </div>
                                  Detail Tour
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div className="bg-white dark:bg-gray-800/50 rounded-xl p-4 border border-gray-200 dark:border-gray-700 shadow-sm">
                                    <h4 className="font-semibold text-sm mb-3 flex items-center text-gray-900 dark:text-gray-100">
                                      <MapPin className={`w-4 h-4 mr-2 text-${config.color.primary}-600 dark:text-${config.color.primary}-400`} />
                                      Meeting Point
                                    </h4>
                                    <p className="text-gray-700 dark:text-gray-300 font-medium text-sm">{tourInfo.meetingPoint}</p>
                                  </div>
                                  <div className="bg-white dark:bg-gray-800/50 rounded-xl p-4 border border-gray-200 dark:border-gray-700 shadow-sm">
                                    <h4 className="font-semibold text-sm mb-3 flex items-center text-gray-900 dark:text-gray-100">
                                      <Users className={`w-4 h-4 mr-2 text-green-600 dark:text-green-400`} />
                                      Guide
                                    </h4>
                                    <p className="text-gray-700 dark:text-gray-300 font-medium text-sm">{tourInfo.guideName}</p>
                                    <p className="text-gray-600 dark:text-gray-400 text-xs">{tourInfo.guideContact}</p>
                                  </div>
                                </div>
                              </div>
                            </>
                          )}

                          {/* Description Section */}
                          {booking.event_description && (
                            <div className="space-y-4">
                              <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                                <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/50 rounded-lg flex items-center justify-center mr-3">
                                  <FileText className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                                </div>
                                Deskripsi Kegiatan
                              </h3>
                              <div className="bg-white dark:bg-gray-800/50 rounded-xl p-5 border border-gray-200 dark:border-gray-700 shadow-sm">
                                <p className="text-gray-700 dark:text-gray-300 leading-relaxed text-sm">{booking.event_description}</p>
                              </div>
                            </div>
                          )}

                          {/* Notes Section */}
                          {booking.notes && (
                            <div className="space-y-4">
                              <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                                <div className="w-8 h-8 bg-yellow-100 dark:bg-yellow-900/50 rounded-lg flex items-center justify-center mr-3">
                                  <FileText className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
                                </div>
                                Catatan Tambahan
                              </h3>
                              <div className="bg-white dark:bg-gray-800/50 rounded-xl p-5 border border-gray-200 dark:border-gray-700 shadow-sm">
                                <p className="text-gray-700 dark:text-gray-300 leading-relaxed text-sm">{booking.notes}</p>
                              </div>
                            </div>
                          )}

                          {/* Proposal File Section */}
                          {booking.proposal_file && (
                            <div className="space-y-4">
                              <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                                <div className="w-8 h-8 bg-red-100 dark:bg-red-900/50 rounded-lg flex items-center justify-center mr-3">
                                  <File className="w-4 h-4 text-red-600 dark:text-red-400" />
                                </div>
                                Dokumen Proposal
                              </h3>
                              <div className="bg-white dark:bg-gray-800/50 rounded-xl p-4 border border-gray-200 dark:border-gray-700 shadow-sm">
                                <Button
                                  variant="outline"
                                  asChild
                                  className="bg-gradient-to-r from-red-50 to-pink-50 hover:from-red-100 hover:to-pink-100 dark:from-red-900/20 dark:to-pink-900/20 dark:hover:from-red-900/30 dark:hover:to-pink-900/30 border border-red-200 dark:border-red-800 hover:border-red-300 dark:hover:border-red-700 text-red-700 dark:text-red-300 hover:text-red-800 dark:hover:text-red-200 transition-all"
                                >
                                  <a
                                    href={supabase.storage.from('proposals').getPublicUrl(booking.proposal_file).data.publicUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                  >
                                    <File className="w-4 h-4 mr-2" />
                                    Buka File Proposal
                                  </a>
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      </DialogContent>
                    </Dialog>

                    {booking.proposal_file && (
                      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                        <Button
                          variant="outline"
                          size="sm"
                          asChild
                          className="w-full justify-start bg-white hover:bg-gray-50 dark:bg-gray-800 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-600 hover:border-purple-300 dark:hover:border-purple-600 text-gray-900 hover:text-gray-900 dark:text-gray-100 dark:hover:text-gray-100 transition-all"
                        >
                          <a
                            href={supabase.storage.from('proposals').getPublicUrl(booking.proposal_file).data.publicUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <File className="w-4 h-4 mr-2 text-purple-600" />
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
                          <CheckCircle className="w-3 h-3 mr-1" />
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
                          <XCircle className="w-3 h-3 mr-1" />
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

      {pendingBookings.length === 0 && (
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
              <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <Building className="w-8 h-8 text-blue-600 dark:text-blue-400" />
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
              <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-8 h-8 text-purple-600 dark:text-purple-400" />
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
    </div>
  )
}