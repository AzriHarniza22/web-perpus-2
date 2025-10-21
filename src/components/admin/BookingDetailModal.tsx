'use client'

import * as React from 'react'
import { Eye, Calendar, Clock, User, MapPin, FileText, Sparkles, Mail, Building, CheckCircle, XCircle, Users, Phone, Globe } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useUpdateBookingStatus } from '@/lib/api'
import type { BookingWithRelations } from '@/lib/api'

interface BookingDetailModalProps {
  booking: BookingWithRelations | null
  open: boolean
  onOpenChange: (open: boolean) => void
  context?: 'history' | 'approvals'
  onStatusUpdate?: (id: string, status: string) => void
}

export default function BookingDetailModal({
  booking,
  open,
  onOpenChange,
  context = 'history',
  onStatusUpdate
}: BookingDetailModalProps) {
  const updateBookingStatusMutation = useUpdateBookingStatus()

  if (!booking) return null

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Asia/Jakarta'
    })
  }

  const formatDateOnly = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: 'Asia/Jakarta'
    })
  }

  const formatTimeOnly = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Asia/Jakarta'
    })
  }

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'approved': return 'default'
      case 'rejected': return 'destructive'
      case 'completed': return 'secondary'
      case 'cancelled': return 'outline'
      case 'pending': return 'outline'
      default: return 'outline'
    }
  }

  const getStatusIndonesian = (status: string) => {
    switch (status) {
      case 'approved': return 'Disetujui'
      case 'rejected': return 'Ditolak'
      case 'completed': return 'Selesai'
      case 'cancelled': return 'Dibatalkan'
      case 'pending': return 'Menunggu'
      default: return status
    }
  }

  // Use is_tour column if available, otherwise fallback to client-side detection
  const isTour = booking.is_tour || false

  const getBookingTypeConfig = () => {
    if (isTour) {
      return {
        icon: Sparkles,
        gradient: 'from-secondary to-accent-600',
        bgGradient: 'from-secondary-50 to-accent-50',
        darkBgGradient: 'from-secondary-900/20 to-accent-900/20',
        primaryColor: 'purple',
        label: 'Pemesanan Tour',
        typeLabel: 'Tour'
      }
    } else {
      return {
        icon: Building,
        gradient: 'from-primary to-indigo-600',
        bgGradient: 'from-primary-50 to-indigo-50',
        darkBgGradient: 'from-primary-900/20 to-indigo-900/20',
        primaryColor: 'blue',
        label: 'Reservasi Ruangan',
        typeLabel: 'Ruangan'
      }
    }
  }

  const getTourInfo = () => {
    if (!isTour) return null
    const tourName = booking.event_description?.replace('Tour: ', '').split(' - ')[0] || 'Tour Khusus'
    return {
      name: tourName,
      duration: 60,
      maxParticipants: booking.guest_count || 10,
      meetingPoint: booking.notes?.split('Meeting Point:')[1]?.trim() || 'Lokasi Tour',
      guideName: 'Guide Tour',
      guideContact: 'guide@library.edu',
      description: booking.event_description || 'Deskripsi tour tidak tersedia'
    }
  }

  const config = getBookingTypeConfig()
  const tourInfo = getTourInfo()
  const TypeIcon = config.icon

  const handleStatusUpdate = (status: string) => {
    if (onStatusUpdate) {
      onStatusUpdate(booking.id, status)
    } else {
      updateBookingStatusMutation.mutate({ id: booking.id, status })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="!max-w-none w-[95vw] !sm:max-w-none max-h-[95vh] flex flex-col bg-background border shadow-2xl">
        {/* Fixed Header */}
        <div className="flex-shrink-0 space-y-4 p-6 pb-4 border-b">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-4 min-w-0 flex-1">
              <div className={`w-12 h-12 bg-gradient-to-br ${config.gradient} rounded-xl flex items-center justify-center shadow-lg flex-shrink-0`}>
                <TypeIcon className="w-6 h-6 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <DialogTitle className={`text-2xl font-bold bg-gradient-to-r ${config.gradient} bg-clip-text text-transparent truncate`}>
                  Detail {config.label}
                </DialogTitle>
                <DialogDescription className="text-base text-muted-foreground mt-1 truncate">
                  Informasi lengkap {isTour ? tourInfo?.name : booking.rooms?.name}
                </DialogDescription>
              </div>
            </div>
            <div className="flex-shrink-0">
              {booking.status === 'pending' ? (
                <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800">
                  <Clock className="w-3.5 h-3.5 mr-1" />
                  {getStatusIndonesian(booking.status)}
                </Badge>
              ) : (
                <Badge variant="outline" className={`bg-gradient-to-r ${config.gradient} text-white border-white/20`}>
                  {getStatusIndonesian(booking.status)}
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto min-h-0">
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 p-6 pt-0">

          {/* Left Column - Primary Information */}
          <div className="space-y-6">

            {/* Quick Info Summary Card */}
            <Card className="border-2">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-bold flex items-center text-gray-900 dark:text-white">
                  <TypeIcon className={`w-5 h-5 mr-3 text-${config.primaryColor}-600 dark:text-${config.primaryColor}-400`} />
                  Informasi Personal
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="bg-muted/50 rounded-lg p-4">
                  <div className="flex items-center space-x-3 mb-3">
                    <Avatar className="w-12 h-12">
                      <AvatarImage src={booking.profiles?.profile_photo || undefined} alt={booking.profiles?.full_name} />
                      <AvatarFallback className={`bg-gradient-to-br ${config.gradient} text-white font-bold`}>
                        {booking.profiles?.full_name ? booking.profiles.full_name.split(' ').map(n => n[0]).join('').toUpperCase() : 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white">{booking.profiles?.full_name || 'Tidak tersedia'}</p>
                      <p className="text-sm text-muted-foreground">{booking.profiles?.email || 'Tidak tersedia'}</p>
                      {booking.profiles?.institution && (
                        <p className="text-xs text-muted-foreground">{booking.profiles.institution}</p>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Schedule Information */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-bold flex items-center">
                  <Calendar className="w-5 h-5 mr-3 text-primary" />
                  Jadwal {isTour ? 'Tour' : 'Reservasi'}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-4">
                  <div className="flex items-center space-x-3 p-3 bg-muted/50 rounded-lg">
                    <Calendar className="w-5 h-5 text-primary" />
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Tanggal</p>
                      <p className="font-semibold">{formatDateOnly(booking.start_time)}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 p-3 bg-muted/50 rounded-lg">
                    <Clock className="w-5 h-5 text-orange-600" />
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Waktu</p>
                      <p className="font-semibold">
                        {formatTimeOnly(booking.start_time)} - {formatTimeOnly(booking.end_time)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 p-3 bg-muted/50 rounded-lg">
                    <Users className="w-5 h-5 text-green-600" />
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Peserta</p>
                      <p className="font-semibold">{booking.guest_count ? `${booking.guest_count} orang` : 'Tidak ditentukan'}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Asset Information */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-bold flex items-center">
                  {isTour ? <Sparkles className="w-5 h-5 mr-3 text-secondary" /> : <Building className="w-5 h-5 mr-3 text-primary" />}
                  {isTour ? 'Detail Tour' : 'Detail Ruangan'}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-4">
                  {isTour && tourInfo ? (
                    <>
                      <div className="flex items-center space-x-3 p-3 bg-muted/50 rounded-lg">
                        <Sparkles className="w-5 h-5 text-secondary" />
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Nama Tour</p>
                          <p className="font-semibold">{tourInfo.name}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3 p-3 bg-muted/50 rounded-lg">
                        <MapPin className="w-5 h-5 text-secondary" />
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Meeting Point</p>
                          <p className="font-semibold">{tourInfo.meetingPoint}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3 p-3 bg-muted/50 rounded-lg">
                        <Users className="w-5 h-5 text-green-600" />
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Guide</p>
                          <p className="font-semibold">{tourInfo.guideName}</p>
                          <p className="text-sm text-muted-foreground">{tourInfo.guideContact}</p>
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex items-center space-x-3 p-3 bg-muted/50 rounded-lg">
                        <Building className="w-5 h-5 text-primary" />
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Ruangan</p>
                          <p className="font-semibold">{booking.rooms?.name}</p>
                        </div>
                      </div>
                      {booking.rooms?.capacity && (
                        <div className="flex items-center space-x-3 p-3 bg-muted/50 rounded-lg">
                          <Users className="w-5 h-5 text-green-600" />
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">Kapasitas</p>
                            <p className="font-semibold">{booking.rooms.capacity} orang</p>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </CardContent>
            </Card>

          </div>

          {/* Right Column - Additional Details and Documents */}
          <div className="space-y-6">

            {/* Description Section */}
            {booking.event_description && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg font-bold flex items-center">
                    <FileText className="w-5 h-5 mr-3 text-secondary" />
                    Deskripsi Kegiatan
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="bg-muted/50 rounded-lg p-4">
                    <p className="text-sm leading-relaxed">{booking.event_description}</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Notes Section */}
            {booking.notes && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg font-bold flex items-center">
                    <FileText className="w-5 h-5 mr-3 text-yellow-600" />
                    Catatan Tambahan
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4 border border-yellow-200 dark:border-yellow-800">
                    <p className="text-sm leading-relaxed text-yellow-800 dark:text-yellow-200">{booking.notes}</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Proposal File Section */}
            {booking.proposal_file && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg font-bold flex items-center">
                    <FileText className="w-5 h-5 mr-3 text-primary dark:text-primary-foreground" />
                    Dokumen Proposal
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <Button
                    variant="outline"
                    size="lg"
                    asChild
                    className="w-full justify-start bg-primary/5 hover:bg-primary/10 dark:bg-primary-900/10 dark:hover:bg-primary-900/20 border-2 border-primary/20 dark:border-primary-800 hover:border-primary/30 dark:hover:border-primary-700 text-primary-700 dark:text-primary-300 hover:text-primary-800 dark:hover:text-primary-200 shadow-sm hover:shadow-md transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                  >
                    <a
                      href={supabase.storage.from('proposals').getPublicUrl(booking.proposal_file).data.publicUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center py-3 px-4"
                    >
                      <FileText className="w-5 h-5 mr-3 flex-shrink-0" />
                      <span className="font-medium">Buka File Proposal</span>
                    </a>
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Context-aware Action Buttons */}
            {context === 'approvals' && booking.status === 'pending' && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg font-bold flex items-center">
                    <CheckCircle className="w-5 h-5 mr-3 text-green-600" />
                    Aksi Persetujuan
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0 space-y-4">
                  <div className="bg-muted/50 p-4 rounded-lg">
                    <p className="text-sm text-muted-foreground mb-4">
                      Konfirmasikan keputusan untuk permintaan reservasi ini. Setelah diputuskan, status tidak dapat diubah.
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <Button
                      onClick={() => handleStatusUpdate('approved')}
                      size="lg"
                      className="bg-green-600 hover:bg-green-700 text-white font-medium shadow-md hover:shadow-green-500/25 hover:shadow-lg transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] flex-1"
                      disabled={updateBookingStatusMutation.isPending}
                    >
                      <CheckCircle className="w-5 h-5 mr-2 flex-shrink-0" />
                      <span>Setujui</span>
                    </Button>
                    <Button
                      onClick={() => handleStatusUpdate('rejected')}
                      variant="destructive"
                      size="lg"
                      disabled={updateBookingStatusMutation.isPending}
                      className="hover:shadow-lg transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] flex-1"
                    >
                      <XCircle className="w-5 h-5 mr-2 flex-shrink-0" />
                      <span>Tolak</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

          </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
