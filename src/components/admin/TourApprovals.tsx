'use client'

import { useState } from 'react'
import { useBookings, useUpdateBookingStatus, BookingWithRelations } from '@/lib/api'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { CheckCircle, XCircle, Clock, FileText, Users, Calendar, MapPin, Eye, File, Sparkles } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

// Mock tour data - in real implementation, this would come from API
const mockTours = [
  {
    id: 'tour-1',
    name: 'Library Heritage Tour',
    description: 'Explore the rich history and architecture of our historic library building',
    duration: 90,
    maxParticipants: 15,
    meetingPoint: 'Main Entrance Lobby',
    guideName: 'Dr. Sarah Johnson',
    guideContact: 'sarah.johnson@library.edu',
  },
  {
    id: 'tour-2',
    name: 'Digital Archives Tour',
    description: 'Discover our extensive digital collection and research resources',
    duration: 60,
    maxParticipants: 10,
    meetingPoint: 'Digital Services Desk',
    guideName: 'Prof. Michael Chen',
    guideContact: 'michael.chen@library.edu',
  },
  {
    id: 'tour-3',
    name: 'Children\'s Literature Tour',
    description: 'A fun and educational tour of our children\'s literature collection',
    duration: 45,
    maxParticipants: 20,
    meetingPoint: 'Children\'s Section',
    guideName: 'Ms. Emily Rodriguez',
    guideContact: 'emily.rodriguez@library.edu',
  },
]

export default function TourApprovals() {
  // Use API filtering for tour bookings only
  const { data: bookingsData, isLoading } = useBookings({
    status: ['pending'],
    isTour: true
  })
  const bookings = bookingsData?.bookings || []
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

  const getTourInfo = (booking: BookingWithRelations) => {
    // Extract tour name from event description or use a default
    const tourName = booking.event_description?.replace('Tour: ', '').split(' - ')[0] || 'Unknown Tour'
    return mockTours.find(tour => tour.name === tourName) || mockTours[0]
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
      <AnimatePresence>
        {bookings.map((booking, index) => {
          const tourInfo = getTourInfo(booking)
          return (
            <motion.div
              key={booking.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="bg-gradient-to-r from-white to-gray-50 dark:from-gray-800 dark:to-gray-900/50 backdrop-blur-sm hover:shadow-xl hover:shadow-secondary-500/10 transition-all duration-300 border border-gray-200/50 dark:border-gray-700/50">
                <CardContent className="py-0 px-4">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div className="flex-1 space-y-3">
                      {/* Header with Tour and Status */}
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center">
                          <div className="w-6 h-6 bg-secondary-100 dark:bg-secondary-900/50 rounded-full flex items-center justify-center mr-2">
                            <Sparkles className="w-3 h-3 text-secondary dark:text-secondary-400" />
                          </div>
                          {tourInfo.name}
                        </h3>
                        <Badge variant="secondary" className="bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300 border border-amber-200 dark:border-amber-800 px-2 py-0.5 text-xs">
                          <Clock className="w-3 h-3 mr-1" />
                          Menunggu
                        </Badge>
                      </div>

                      {/* User Info */}
                      <div className="flex items-center space-x-3">
                        <Avatar className="w-7 h-7">
                          <AvatarImage src={booking.profiles?.profile_photo || undefined} alt={booking.profiles?.full_name} />
                          <AvatarFallback className="text-xs bg-gradient-to-br from-secondary-400 to-accent-500 text-white">
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

                      {/* Date and Time */}
                      <div className="flex items-center space-x-2">
                        <div className="w-7 h-7 bg-secondary-100 dark:bg-secondary-800 rounded-full flex items-center justify-center">
                          <Calendar className="w-3.5 h-3.5 text-secondary dark:text-secondary-400" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white text-sm">
                            {formatDateTime(booking.start_time)}
                          </p>
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            sampai {formatDateTime(booking.end_time)} • {tourInfo.duration} menit
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col gap-2 lg:flex-shrink-0 min-w-[180px]">
                      <Dialog>
                        <DialogTrigger asChild>
                          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                            <Button variant="outline" size="sm" className="w-full justify-start bg-card border border-gray-200 dark:border-gray-600 hover:border-secondary-300 dark:hover:border-secondary-600 text-gray-900 hover:text-gray-900 dark:text-gray-100 dark:hover:text-gray-100 transition-all">
                              <Eye className="w-4 h-4 mr-2 text-secondary" />
                              Lihat Detail
                            </Button>
                          </motion.div>
                        </DialogTrigger>
                        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto bg-gradient-to-br from-background via-secondary-50/30 to-accent-50/30 dark:from-gray-900 dark:via-secondary-900/20 dark:to-accent-900/20">
                          <DialogHeader className="space-y-4 pb-6 border-b border-gray-200 dark:border-gray-700">
                            <div className="flex items-center space-x-4">
                              <div className="w-12 h-12 bg-gradient-to-br from-secondary to-accent-600 rounded-xl flex items-center justify-center shadow-lg">
                                <Sparkles className="w-6 h-6 text-white" />
                              </div>
                              <div className="flex-1">
                                <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-secondary to-accent-600 bg-clip-text text-transparent">
                                  Detail Pemesanan Tour
                                </DialogTitle>
                                <DialogDescription className="text-base text-gray-600 dark:text-gray-300 mt-1">
                                  Informasi lengkap permintaan tour - {tourInfo.name}
                                </DialogDescription>
                              </div>
                              <div className="text-right">
                                <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300 border border-amber-200 dark:border-amber-800 px-3 py-1">
                                  <Clock className="w-3 h-3 mr-1" />
                                  Menunggu Approval
                                </Badge>
                              </div>
                            </div>
                          </DialogHeader>

                          <div className="space-y-6 mt-6">
                            {/* Basic Information Section */}
                            <div className="space-y-4">
                              <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                                <div className="w-8 h-8 bg-secondary-100 dark:bg-secondary-900/50 rounded-lg flex items-center justify-center mr-3">
                                  <Sparkles className="w-4 h-4 text-secondary dark:text-secondary-400" />
                                </div>
                                Informasi Tour
                              </h3>
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                <div className="bg-card rounded-xl p-4 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-all">
                                  <h4 className="font-semibold text-sm mb-3 flex items-center text-gray-900 dark:text-gray-100">
                                    <Sparkles className="w-4 h-4 mr-2 text-secondary dark:text-secondary-400" />
                                    Nama Tour
                                  </h4>
                                  <p className="text-gray-700 dark:text-gray-300 font-medium text-sm">{tourInfo.name}</p>
                                </div>
                                <div className="bg-card rounded-xl p-4 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-all">
                                  <h4 className="font-semibold text-sm mb-3 flex items-center text-gray-900 dark:text-gray-100">
                                    <Users className="w-4 h-4 mr-2 text-secondary dark:text-secondary-400" />
                                    Peserta
                                  </h4>
                                  <div className="flex items-center space-x-3">
                                    <Avatar className="w-10 h-10">
                                      <AvatarImage src={booking.profiles?.profile_photo || undefined} alt={booking.profiles?.full_name} />
                                      <AvatarFallback className="text-sm bg-gradient-to-br from-secondary-400 to-accent-500 text-white">
                                        {booking.profiles?.full_name ? booking.profiles.full_name.split(' ').map(n => n[0]).join('').toUpperCase() : 'U'}
                                      </AvatarFallback>
                                    </Avatar>
                                    <div>
                                      <p className="text-gray-700 dark:text-gray-300 font-medium text-sm">{booking.profiles?.full_name}</p>
                                      <p className="text-gray-600 dark:text-gray-400 text-xs">{booking.profiles?.email}</p>
                                    </div>
                                  </div>
                                </div>
                                <div className="bg-card rounded-xl p-4 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-all">
                                  <h4 className="font-semibold text-sm mb-3 flex items-center text-gray-900 dark:text-gray-100">
                                    <Users className="w-4 h-4 mr-2 text-green-600 dark:text-green-400" />
                                    Jumlah Peserta
                                  </h4>
                                  <p className="text-gray-700 dark:text-gray-300 font-medium text-sm">
                                    {booking.guest_count ? `${booking.guest_count} orang` : 'Tidak ditentukan'}
                                  </p>
                                </div>
                              </div>
                            </div>

                            {/* Tour Details Section */}
                            <div className="space-y-4">
                              <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                                <div className="w-8 h-8 bg-primary-100 dark:bg-primary-900/50 rounded-lg flex items-center justify-center mr-3">
                                  <MapPin className="w-4 h-4 text-primary dark:text-primary-400" />
                                </div>
                                Detail Tour
                              </h3>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="bg-card rounded-xl p-4 border border-gray-200 dark:border-gray-700 shadow-sm">
                                  <h4 className="font-semibold text-sm mb-3 flex items-center text-gray-900 dark:text-gray-100">
                                    <MapPin className="w-4 h-4 mr-2 text-primary dark:text-primary-400" />
                                    Meeting Point
                                  </h4>
                                  <p className="text-gray-700 dark:text-gray-300 font-medium text-sm">{tourInfo.meetingPoint}</p>
                                </div>
                                <div className="bg-card rounded-xl p-4 border border-gray-200 dark:border-gray-700 shadow-sm">
                                  <h4 className="font-semibold text-sm mb-3 flex items-center text-gray-900 dark:text-gray-100">
                                    <Users className="w-4 h-4 mr-2 text-green-600 dark:text-green-400" />
                                    Guide
                                  </h4>
                                  <p className="text-gray-700 dark:text-gray-300 font-medium text-sm">{tourInfo.guideName}</p>
                                  <p className="text-gray-600 dark:text-gray-400 text-xs">{tourInfo.guideContact}</p>
                                </div>
                              </div>
                            </div>

                            {/* Date & Time Section */}
                            <div className="space-y-4">
                              <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                                <div className="w-8 h-8 bg-green-100 dark:bg-green-900/50 rounded-lg flex items-center justify-center mr-3">
                                  <Calendar className="w-4 h-4 text-green-600 dark:text-green-400" />
                                </div>
                                Jadwal Tour
                              </h3>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="bg-card rounded-xl p-4 border border-gray-200 dark:border-gray-700 shadow-sm">
                                  <h4 className="font-semibold text-sm mb-3 flex items-center text-gray-900 dark:text-gray-100">
                                    <Calendar className="w-4 h-4 mr-2 text-primary dark:text-primary-400" />
                                    Waktu Mulai
                                  </h4>
                                  <p className="text-gray-700 dark:text-gray-300 font-medium text-base">{formatDateTime(booking.start_time)}</p>
                                </div>
                                <div className="bg-card rounded-xl p-4 border border-gray-200 dark:border-gray-700 shadow-sm">
                                  <h4 className="font-semibold text-sm mb-3 flex items-center text-gray-900 dark:text-gray-100">
                                    <Clock className="w-4 h-4 mr-2 text-orange-600 dark:text-orange-400" />
                                    Durasi
                                  </h4>
                                  <p className="text-gray-700 dark:text-gray-300 font-medium text-base">{tourInfo.duration} menit</p>
                                </div>
                              </div>
                            </div>

                            {/* Special Requests Section */}
                            {booking.notes && (
                              <div className="space-y-4">
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                                  <div className="w-8 h-8 bg-yellow-100 dark:bg-yellow-900/50 rounded-lg flex items-center justify-center mr-3">
                                    <FileText className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
                                  </div>
                                  Permintaan Khusus
                                </h3>
                                <div className="bg-card rounded-xl p-5 border border-gray-200 dark:border-gray-700 shadow-sm">
                                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed text-sm">{booking.notes}</p>
                                </div>
                              </div>
                            )}

                            {/* Tour Document Section */}
                            {booking.proposal_file && (
                              <div className="space-y-4">
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                                  <div className="w-8 h-8 bg-red-100 dark:bg-red-900/50 rounded-lg flex items-center justify-center mr-3">
                                    <File className="w-4 h-4 text-red-600 dark:text-red-400" />
                                  </div>
                                  Dokumen Tour
                                </h3>
                                <div className="bg-card rounded-xl p-4 border border-gray-200 dark:border-gray-700 shadow-sm">
                                  <Button
                                    variant="outline"
                                    asChild
                                    className="bg-gradient-to-r from-red-50 to-accent-50 hover:from-red-100 hover:to-accent-100 dark:from-red-900/20 dark:to-accent-900/20 dark:hover:from-red-900/30 dark:hover:to-accent-900/30 border border-red-200 dark:border-red-800 hover:border-red-300 dark:hover:border-red-700 text-red-700 dark:text-red-300 hover:text-red-800 dark:hover:text-red-200 transition-all"
                                  >
                                    <a
                                      href={supabase.storage.from('proposals').getPublicUrl(booking.proposal_file).data.publicUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                    >
                                      <File className="w-4 h-4 mr-2" />
                                      Buka Dokumen Tour
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
                            className="w-full justify-start bg-card border border-gray-200 dark:border-gray-600 hover:border-secondary-300 dark:hover:border-secondary-600 text-gray-900 hover:text-gray-900 dark:text-gray-100 dark:hover:text-gray-100 transition-all"
                          >
                            <a
                              href={supabase.storage.from('proposals').getPublicUrl(booking.proposal_file).data.publicUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <File className="w-4 h-4 mr-2 text-secondary" />
                              Lihat Dokumen
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

      {bookings.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12"
        >
          <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Semua Pemesanan Tour Sudah Diputuskan
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Tidak ada permintaan tour yang menunggu persetujuan saat ini.
          </p>
        </motion.div>
      )}
    </div>
  )
}