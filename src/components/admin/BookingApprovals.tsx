'use client'

import { useState } from 'react'
import { useBookings, useUpdateBookingStatus } from '@/lib/api'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { CheckCircle, XCircle, Clock, FileText, Users, Calendar, MapPin, Eye, File } from 'lucide-react'
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
            <Card className="bg-gradient-to-r from-white to-gray-50 dark:from-gray-800 dark:to-gray-900/50 backdrop-blur-sm hover:shadow-xl hover:shadow-blue-500/10 transition-all duration-300 border border-gray-200/50 dark:border-gray-700/50">
              <CardContent className="py-0 px-4">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  <div className="flex-1 space-y-3">
                    {/* Header with Room and Status */}
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center">
                        <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900/50 rounded-full flex items-center justify-center mr-2">
                          <MapPin className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                        </div>
                        {booking.rooms?.name}
                      </h3>
                      <Badge variant="secondary" className="bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300 border border-amber-200 dark:border-amber-800 px-2 py-0.5 text-xs">
                        <Clock className="w-3 h-3 mr-1" />
                        Menunggu
                      </Badge>
                    </div>

                    {/* User Info */}
                    <div className="flex items-center space-x-2">
                      <div className="w-7 h-7 bg-gradient-to-br from-purple-400 to-blue-500 rounded-full flex items-center justify-center">
                        <Users className="w-3.5 h-3.5 text-white" />
                      </div>
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
                      <div className="w-7 h-7 bg-blue-100 dark:bg-blue-800 rounded-full flex items-center justify-center">
                        <Calendar className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white text-sm">
                          {formatDateTime(booking.start_time)}
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          sampai {formatDateTime(booking.end_time)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col gap-2 lg:flex-shrink-0 min-w-[180px]">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm" className="w-full justify-start bg-white hover:bg-gray-50 dark:bg-gray-800 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-600 transition-all">
                          <Eye className="w-4 h-4 mr-2 text-blue-600" />
                          Lihat Detail
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                        <DialogHeader className="space-y-3">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                              <MapPin className="w-5 h-5 text-white" />
                            </div>
                            <div>
                              <DialogTitle className="text-xl font-bold">
                                Detail Reservasi
                              </DialogTitle>
                              <DialogDescription className="text-sm">
                                {booking.rooms?.name} - Informasi lengkap permintaan reservasi
                              </DialogDescription>
                            </div>
                          </div>
                        </DialogHeader>
                        <div className="space-y-4 mt-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg p-3 border border-blue-200 dark:border-blue-800">
                              <h4 className="font-semibold text-sm mb-2 flex items-center text-blue-900 dark:text-blue-100">
                                <MapPin className="w-4 h-4 mr-2" />
                                Ruangan
                              </h4>
                              <p className="text-blue-800 dark:text-blue-200 font-medium text-sm">{booking.rooms?.name}</p>
                            </div>
                            <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg p-3 border border-purple-200 dark:border-purple-800">
                              <h4 className="font-semibold text-sm mb-2 flex items-center text-purple-900 dark:text-purple-100">
                                <Users className="w-4 h-4 mr-2" />
                                Pemohon
                              </h4>
                              <p className="text-purple-800 dark:text-purple-200 font-medium text-sm">{booking.profiles?.full_name}</p>
                              <p className="text-purple-700 dark:text-purple-300 text-xs">{booking.profiles?.email}</p>
                            </div>
                            <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg p-3 border border-green-200 dark:border-green-800">
                              <h4 className="font-semibold text-sm mb-2 flex items-center text-green-900 dark:text-green-100">
                                <Calendar className="w-4 h-4 mr-2" />
                                Waktu Mulai
                              </h4>
                              <p className="text-green-800 dark:text-green-200 font-medium text-sm">{formatDateTime(booking.start_time)}</p>
                            </div>
                            <div className="bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 rounded-lg p-3 border border-orange-200 dark:border-orange-800">
                              <h4 className="font-semibold text-sm mb-2 flex items-center text-orange-900 dark:text-orange-100">
                                <Clock className="w-4 h-4 mr-2" />
                                Waktu Selesai
                              </h4>
                              <p className="text-orange-800 dark:text-orange-200 font-medium text-sm">{formatDateTime(booking.end_time)}</p>
                            </div>
                          </div>

                          {booking.event_description && (
                            <div className="bg-gradient-to-br from-gray-50 to-slate-50 dark:from-gray-800/50 dark:to-slate-800/50 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                              <h4 className="font-semibold text-sm mb-2 flex items-center text-gray-900 dark:text-gray-100">
                                <FileText className="w-4 h-4 mr-2" />
                                Deskripsi Kegiatan
                              </h4>
                              <p className="text-gray-700 dark:text-gray-300 leading-relaxed text-sm">{booking.event_description}</p>
                            </div>
                          )}

                          {booking.notes && (
                            <div className="bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20 rounded-lg p-4 border border-amber-200 dark:border-amber-800">
                              <h4 className="font-semibold text-sm mb-2 flex items-center text-amber-900 dark:text-amber-100">
                                <FileText className="w-4 h-4 mr-2" />
                                Catatan Tambahan
                              </h4>
                              <p className="text-amber-800 dark:text-amber-200 leading-relaxed text-sm">{booking.notes}</p>
                            </div>
                          )}

                          {booking.proposal_file && (
                            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-lg p-4 border border-indigo-200 dark:border-indigo-800">
                              <h4 className="font-semibold text-sm mb-2 flex items-center text-indigo-900 dark:text-indigo-100">
                                <File className="w-4 h-4 mr-2" />
                                File Proposal
                              </h4>
                              <Button
                                variant="outline"
                                asChild
                                className="bg-white hover:bg-indigo-50 dark:bg-gray-800 dark:hover:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-700 hover:border-indigo-400 transition-all"
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
                          )}
                        </div>
                      </DialogContent>
                    </Dialog>

                    {booking.proposal_file && (
                      <Button
                        variant="outline"
                        size="sm"
                        asChild
                        className="justify-start bg-white hover:bg-gray-50 dark:bg-gray-800 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-600 hover:border-purple-300 dark:hover:border-purple-600 transition-all"
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
                    )}

                    <div className="flex gap-2">
                      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="flex-1">
                        <Button
                          onClick={() => updateBookingStatus(booking.id, 'approved')}
                          size="sm"
                          className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-medium shadow-md hover:shadow-green-500/25 transition-all"
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
                          className="bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 font-medium shadow-md hover:shadow-red-500/25 transition-all"
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