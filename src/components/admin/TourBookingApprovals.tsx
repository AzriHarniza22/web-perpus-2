'use client'

import { useState } from 'react'
import { useTourBookings, useUpdateTourBookingStatus } from '@/lib/api'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { CheckCircle, XCircle, Clock, FileText, Users, Calendar, MapPin, Eye, File } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export default function TourBookingApprovals() {
  const { data: tourBookings = [], isLoading } = useTourBookings({ status: ['pending'] })
  const updateTourBookingStatusMutation = useUpdateTourBookingStatus()

  const updateBookingStatus = (id: string, status: string) => {
    updateTourBookingStatusMutation.mutate({ id, status })
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
        {tourBookings.map((booking, index) => (
          <motion.div
            key={booking.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="bg-gradient-to-r from-white to-gray-50 dark:from-gray-800 dark:to-gray-900/50 backdrop-blur-sm hover:shadow-xl hover:shadow-green-500/10 transition-all duration-300 border border-gray-200/50 dark:border-gray-700/50">
              <CardContent className="py-0 px-4">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  <div className="flex-1 space-y-3">
                    {/* Header with Tour and Status */}
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center">
                        <div className="w-6 h-6 bg-green-100 dark:bg-green-900/50 rounded-full flex items-center justify-center mr-2">
                          <MapPin className="w-3 h-3 text-green-600 dark:text-green-400" />
                        </div>
                        {booking.tours?.name}
                      </h3>
                      <Badge variant="secondary" className="bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300 border border-amber-200 dark:border-amber-800 px-2 py-0.5 text-xs">
                        <Clock className="w-3 h-3 mr-1" />
                        Pending
                      </Badge>
                    </div>

                    {/* User Info */}
                    <div className="flex items-center space-x-3">
                       <Avatar className="w-7 h-7">
                         <AvatarImage src={booking.profiles?.profile_photo || undefined} alt={booking.profiles?.full_name} />
                         <AvatarFallback className="text-xs bg-gradient-to-br from-purple-400 to-blue-500 text-white">
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

                    {/* Date and Time & Participants */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="w-7 h-7 bg-blue-100 dark:bg-blue-800 rounded-full flex items-center justify-center">
                          <Calendar className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white text-sm">
                            {formatDateTime(booking.start_time)}
                          </p>
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            Duration: {booking.tours?.duration} minutes
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-7 h-7 bg-green-100 dark:bg-green-800 rounded-full flex items-center justify-center">
                          <Users className="w-3.5 h-3.5 text-green-600 dark:text-green-400" />
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-gray-900 dark:text-white text-sm">
                            {booking.participant_count} participants
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col gap-2 lg:flex-shrink-0 min-w-[180px]">
                    <Dialog>
                      <DialogTrigger asChild>
                        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                          <Button variant="outline" size="sm" className="w-full justify-start bg-white hover:bg-gray-50 dark:bg-gray-800 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-600 text-gray-900 hover:text-gray-900 dark:text-gray-100 dark:hover:text-gray-100 transition-all">
                            <Eye className="w-4 h-4 mr-2 text-blue-600" />
                            View Details
                          </Button>
                        </motion.div>
                      </DialogTrigger>
                      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader className="space-y-3">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
                              <MapPin className="w-5 h-5 text-white" />
                            </div>
                            <div>
                              <DialogTitle className="text-xl font-bold">
                                Tour Booking Details
                              </DialogTitle>
                              <DialogDescription className="text-sm">
                                {booking.tours?.name} - Complete booking information
                              </DialogDescription>
                            </div>
                          </div>
                        </DialogHeader>
                        <div className="space-y-4 mt-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
                              <h4 className="font-semibold text-sm mb-2 flex items-center text-gray-900 dark:text-gray-100">
                                <MapPin className="w-4 h-4 mr-2 text-gray-600 dark:text-gray-400" />
                                Tour
                              </h4>
                              <p className="text-gray-700 dark:text-gray-300 font-medium text-sm">{booking.tours?.name}</p>
                              <p className="text-gray-600 dark:text-gray-400 text-xs mt-1">Duration: {booking.tours?.duration} minutes</p>
                            </div>
                            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
                              <h4 className="font-semibold text-sm mb-2 flex items-center text-gray-900 dark:text-gray-100">
                                <Users className="w-4 h-4 mr-2 text-gray-600 dark:text-gray-400" />
                                Requester
                              </h4>
                              <div className="flex items-center space-x-3">
                                <Avatar className="w-8 h-8">
                                  <AvatarImage src={booking.profiles?.profile_photo || undefined} alt={booking.profiles?.full_name} />
                                  <AvatarFallback className="text-xs bg-gray-400 text-white">
                                    {booking.profiles?.full_name ? booking.profiles.full_name.split(' ').map(n => n[0]).join('').toUpperCase() : 'U'}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <p className="text-gray-700 dark:text-gray-300 font-medium text-sm">{booking.profiles?.full_name}</p>
                                  <p className="text-gray-600 dark:text-gray-400 text-xs">{booking.profiles?.email}</p>
                                </div>
                              </div>
                            </div>
                            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
                              <h4 className="font-semibold text-sm mb-2 flex items-center text-gray-900 dark:text-gray-100">
                                <Calendar className="w-4 h-4 mr-2 text-gray-600 dark:text-gray-400" />
                                Start Time
                              </h4>
                              <p className="text-gray-700 dark:text-gray-300 font-medium text-sm">{formatDateTime(booking.start_time)}</p>
                            </div>
                            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
                              <h4 className="font-semibold text-sm mb-2 flex items-center text-gray-900 dark:text-gray-100">
                                <Users className="w-4 h-4 mr-2 text-gray-600 dark:text-gray-400" />
                                Participants
                              </h4>
                              <p className="text-gray-700 dark:text-gray-300 font-medium text-sm">{booking.participant_count} participants</p>
                            </div>
                          </div>

                          {booking.proposal_file && (
                            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                              <h4 className="font-semibold text-sm mb-2 flex items-center text-gray-900 dark:text-gray-100">
                                <File className="w-4 h-4 mr-2 text-gray-600 dark:text-gray-400" />
                                Proposal File
                              </h4>
                              <Button
                                variant="outline"
                                asChild
                                className="bg-white hover:bg-gray-50 dark:bg-gray-800 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-600 hover:border-gray-400 transition-all"
                              >
                                <a
                                  href={supabase.storage.from('proposals').getPublicUrl(booking.proposal_file).data.publicUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  <File className="w-4 h-4 mr-2" />
                                  View Proposal
                                </a>
                              </Button>
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
                            View Proposal
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
                          disabled={updateTourBookingStatusMutation.isPending}
                        >
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Approve
                        </Button>
                      </motion.div>
                      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="flex-1">
                        <Button
                          onClick={() => updateBookingStatus(booking.id, 'rejected')}
                          variant="destructive"
                          size="sm"
                          disabled={updateTourBookingStatusMutation.isPending}
                        >
                          <XCircle className="w-3 h-3 mr-1" />
                          Reject
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

      {tourBookings.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12"
        >
          <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            All Tour Bookings Reviewed
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            No pending tour booking requests at this time.
          </p>
        </motion.div>
      )}
    </div>
  )
}