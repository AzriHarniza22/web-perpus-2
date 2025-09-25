'use client'

import { useBookings, useUpdateBookingStatus } from '@/lib/api'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover'
import { CheckCircle, XCircle, Clock, FileText, Users, Calendar, MapPin } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export default function BookingApprovals() {
  const { data: bookings = [], isLoading } = useBookings()
  const updateBookingStatusMutation = useUpdateBookingStatus()

  // Filter only pending bookings
  const pendingBookings = bookings.filter(booking => booking.status === 'pending')

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
      <AnimatePresence>
        {pendingBookings.map((booking, index) => (
          <motion.div
            key={booking.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm hover:shadow-lg transition-all">
              <CardContent className="p-6">
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                  <div className="flex-1 space-y-3">
                    {/* Room and User Info */}
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                          <MapPin className="w-4 h-4 mr-2 text-blue-600" />
                          {booking.rooms?.name}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-300 flex items-center mt-1">
                          <Users className="w-4 h-4 mr-2 text-gray-400" />
                          {booking.profiles?.full_name} ({booking.profiles?.email})
                        </p>
                      </div>
                      <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                        <Clock className="w-3 h-3 mr-1" />
                        Menunggu
                      </Badge>
                    </div>

                    {/* Date and Time */}
                    <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                      <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                      <span>
                        {formatDateTime(booking.start_time)} - {formatDateTime(booking.end_time)}
                      </span>
                    </div>

                    {/* Event Description */}
                    {booking.event_description && (
                      <div className="text-sm">
                        <span className="font-medium text-gray-700 dark:text-gray-300">Kegiatan:</span>
                        <p className="text-gray-600 dark:text-gray-400 mt-1">{booking.event_description}</p>
                      </div>
                    )}

                    {/* Notes */}
                    {booking.notes && (
                      <div className="text-sm">
                        <span className="font-medium text-gray-700 dark:text-gray-300">Catatan:</span>
                        <p className="text-gray-600 dark:text-gray-400 mt-1">{booking.notes}</p>
                      </div>
                    )}

                    {/* Proposal File */}
                    {booking.proposal_file && (
                      <div className="flex items-center">
                        <FileText className="w-4 h-4 mr-2 text-gray-400" />
                        <Button
                          variant="outline"
                          size="sm"
                          asChild
                          className="text-xs"
                        >
                          <a
                            href={supabase.storage.from('proposals').getPublicUrl(booking.proposal_file).data.publicUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            Lihat Proposal
                          </a>
                        </Button>
                      </div>
                    )}

                    {/* View Details Popover */}
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" size="sm" className="text-xs">
                          Lihat Detail
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-96">
                        <div className="space-y-4">
                          {booking.event_description && (
                            <div>
                              <h4 className="font-semibold text-sm mb-2">Deskripsi Kegiatan</h4>
                              <p className="text-sm text-gray-600 dark:text-gray-400">{booking.event_description}</p>
                            </div>
                          )}
                          {booking.notes && (
                            <div>
                              <h4 className="font-semibold text-sm mb-2">Catatan</h4>
                              <p className="text-sm text-gray-600 dark:text-gray-400">{booking.notes}</p>
                            </div>
                          )}
                          {booking.proposal_file && (
                            <div>
                              <h4 className="font-semibold text-sm mb-2">File Proposal</h4>
                              <Button
                                variant="outline"
                                size="sm"
                                asChild
                                className="text-xs"
                              >
                                <a
                                  href={supabase.storage.from('proposals').getPublicUrl(booking.proposal_file).data.publicUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  Lihat Proposal
                                </a>
                              </Button>
                            </div>
                          )}
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row gap-2 lg:flex-shrink-0">
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Button
                        onClick={() => updateBookingStatus(booking.id, 'approved')}
                        className="bg-green-600 hover:bg-green-700 text-white w-full sm:w-auto"
                        disabled={updateBookingStatusMutation.isPending}
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Setujui
                      </Button>
                    </motion.div>
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Button
                        onClick={() => updateBookingStatus(booking.id, 'rejected')}
                        variant="destructive"
                        className="w-full sm:w-auto"
                        disabled={updateBookingStatusMutation.isPending}
                      >
                        <XCircle className="w-4 h-4 mr-2" />
                        Tolak
                      </Button>
                    </motion.div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </AnimatePresence>

      {pendingBookings.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12"
        >
          <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Semua Reservasi Sudah Diputuskan
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Tidak ada permintaan reservasi yang menunggu persetujuan saat ini.
          </p>
        </motion.div>
      )}
    </div>
  )
}