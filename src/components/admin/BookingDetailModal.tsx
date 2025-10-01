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

  const isTour = booking.event_description?.includes('Tour:') ||
                  booking.rooms?.name?.includes('Tour') ||
                  booking.notes?.includes('Meeting Point:')

  const getBookingTypeConfig = () => {
    if (isTour) {
      return {
        icon: Sparkles,
        gradient: 'from-purple-600 to-pink-600',
        bgGradient: 'from-purple-50 to-pink-50',
        darkBgGradient: 'from-purple-900/20 to-pink-900/20',
        primaryColor: 'purple',
        label: 'Pemesanan Tour',
        typeLabel: 'Tour'
      }
    } else {
      return {
        icon: Building,
        gradient: 'from-blue-600 to-indigo-600',
        bgGradient: 'from-blue-50 to-indigo-50',
        darkBgGradient: 'from-blue-900/20 to-indigo-900/20',
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
      <DialogContent className={`max-w-8xl w-[95vw] max-h-[95vh] overflow-y-auto bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-2xl`}>
        <DialogHeader className="space-y-4 pb-6 border-b border-gray-200/50 dark:border-gray-700/50">
          <div className="flex items-center space-x-4">
            <div className={`w-12 h-12 bg-gradient-to-br ${config.gradient} rounded-xl flex items-center justify-center shadow-lg`}>
              <TypeIcon className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <DialogTitle className={`text-2xl font-bold bg-gradient-to-r ${config.gradient} bg-clip-text text-transparent`}>
                Detail {config.label}
              </DialogTitle>
              <DialogDescription className="text-base text-gray-600 dark:text-gray-300 mt-1">
                Informasi lengkap {isTour ? tourInfo?.name : booking.rooms?.name}
              </DialogDescription>
            </div>
            <div className="text-right">
              <Badge className={`bg-gradient-to-r ${config.gradient} text-white border-0 px-3 py-1`}>
                {getStatusIndonesian(booking.status)}
              </Badge>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6 mt-6">
          {/* Enhanced Basic Information Section */}
          <div className="space-y-4">
            <h3 className={`text-lg font-semibold flex items-center bg-gradient-to-r ${config.gradient} bg-clip-text text-transparent`}>
              <div className={`w-8 h-8 bg-gradient-to-br ${config.bgGradient} dark:bg-${config.primaryColor}-900/50 rounded-lg flex items-center justify-center mr-3`}>
                <Eye className={`w-4 h-4 text-${config.primaryColor}-600 dark:text-${config.primaryColor}-400`} />
              </div>
              Informasi Dasar
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {isTour && tourInfo ? (
                <div className="bg-white/80 dark:bg-gray-800/50 rounded-xl p-4 border border-gray-200/50 dark:border-gray-700/50 shadow-sm hover:shadow-md transition-all">
                  <h4 className="font-semibold text-sm mb-3 flex items-center text-gray-900 dark:text-gray-100">
                    <Sparkles className={`w-4 h-4 mr-2 text-${config.primaryColor}-600 dark:text-${config.primaryColor}-400`} />
                    Nama Tour
                  </h4>
                  <p className="text-gray-700 dark:text-gray-300 font-medium text-sm">{tourInfo.name}</p>
                </div>
              ) : (
                <div className="bg-white/80 dark:bg-gray-800/50 rounded-xl p-4 border border-gray-200/50 dark:border-gray-700/50 shadow-sm hover:shadow-md transition-all">
                  <h4 className="font-semibold text-sm mb-3 flex items-center text-gray-900 dark:text-gray-100">
                    <MapPin className={`w-4 h-4 mr-2 text-${config.primaryColor}-600 dark:text-${config.primaryColor}-400`} />
                    Ruangan
                  </h4>
                  <p className="text-gray-700 dark:text-gray-300 font-medium text-sm">{booking.rooms?.name}</p>
                </div>
              )}

              <div className="bg-white/80 dark:bg-gray-800/50 rounded-xl p-4 border border-gray-200/50 dark:border-gray-700/50 shadow-sm hover:shadow-md transition-all">
                <h4 className="font-semibold text-sm mb-3 flex items-center text-gray-900 dark:text-gray-100">
                  <Users className={`w-4 h-4 mr-2 text-green-600 dark:text-green-400`} />
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

              <div className="bg-white/80 dark:bg-gray-800/50 rounded-xl p-4 border border-gray-200/50 dark:border-gray-700/50 shadow-sm hover:shadow-md transition-all">
                <h4 className="font-semibold text-sm mb-3 flex items-center text-gray-900 dark:text-gray-100">
                  <Users className={`w-4 h-4 mr-2 text-green-600 dark:text-green-400`} />
                  Jumlah {isTour ? 'Peserta' : 'Tamu'}
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
              <div className={`w-8 h-8 bg-gradient-to-br ${config.bgGradient} dark:bg-${config.primaryColor}-900/50 rounded-lg flex items-center justify-center mr-3`}>
                <Calendar className={`w-4 h-4 text-${config.primaryColor}-600 dark:text-${config.primaryColor}-400`} />
              </div>
              Jadwal {isTour ? 'Tour' : 'Reservasi'}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white/80 dark:bg-gray-800/50 rounded-xl p-4 border border-gray-200/50 dark:border-gray-700/50 shadow-sm">
                <h4 className="font-semibold text-sm mb-3 flex items-center text-gray-900 dark:text-gray-100">
                  <Calendar className={`w-4 h-4 mr-2 text-${config.primaryColor}-600 dark:text-${config.primaryColor}-400`} />
                  Tanggal
                </h4>
                <p className="text-gray-700 dark:text-gray-300 font-medium text-base">{formatDateOnly(booking.start_time)}</p>
              </div>
              <div className="bg-white/80 dark:bg-gray-800/50 rounded-xl p-4 border border-gray-200/50 dark:border-gray-700/50 shadow-sm">
                <h4 className="font-semibold text-sm mb-3 flex items-center text-gray-900 dark:text-gray-100">
                  <Clock className={`w-4 h-4 mr-2 text-orange-600 dark:text-orange-400`} />
                  Waktu
                </h4>
                <p className="text-gray-700 dark:text-gray-300 font-medium text-base">
                  {formatTimeOnly(booking.start_time)} - {formatTimeOnly(booking.end_time)}
                </p>
              </div>
            </div>
          </div>

          {/* Tour-specific sections */}
          {isTour && tourInfo && (
            <div className="space-y-4">
              <h3 className={`text-lg font-semibold flex items-center bg-gradient-to-r ${config.gradient} bg-clip-text text-transparent`}>
                <div className={`w-8 h-8 bg-gradient-to-br ${config.bgGradient} dark:bg-${config.primaryColor}-900/50 rounded-lg flex items-center justify-center mr-3`}>
                  <MapPin className={`w-4 h-4 text-${config.primaryColor}-600 dark:text-${config.primaryColor}-400`} />
                </div>
                Detail Tour
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white/80 dark:bg-gray-800/50 rounded-xl p-4 border border-gray-200/50 dark:border-gray-700/50 shadow-sm">
                  <h4 className="font-semibold text-sm mb-3 flex items-center text-gray-900 dark:text-gray-100">
                    <MapPin className={`w-4 h-4 mr-2 text-${config.primaryColor}-600 dark:text-${config.primaryColor}-400`} />
                    Meeting Point
                  </h4>
                  <p className="text-gray-700 dark:text-gray-300 font-medium text-sm">{tourInfo.meetingPoint}</p>
                </div>
                <div className="bg-white/80 dark:bg-gray-800/50 rounded-xl p-4 border border-gray-200/50 dark:border-gray-700/50 shadow-sm">
                  <h4 className="font-semibold text-sm mb-3 flex items-center text-gray-900 dark:text-gray-100">
                    <Users className={`w-4 h-4 mr-2 text-green-600 dark:text-green-400`} />
                    Guide
                  </h4>
                  <p className="text-gray-700 dark:text-gray-300 font-medium text-sm">{tourInfo.guideName}</p>
                  <p className="text-gray-600 dark:text-gray-400 text-xs">{tourInfo.guideContact}</p>
                </div>
              </div>
            </div>
          )}

          {/* Room-specific sections */}
          {!isTour && booking.rooms?.capacity && (
            <div className="space-y-4">
              <h3 className={`text-lg font-semibold flex items-center bg-gradient-to-r ${config.gradient} bg-clip-text text-transparent`}>
                <div className={`w-8 h-8 bg-gradient-to-br ${config.bgGradient} dark:bg-${config.primaryColor}-900/50 rounded-lg flex items-center justify-center mr-3`}>
                  <Building className={`w-4 h-4 text-${config.primaryColor}-600 dark:text-${config.primaryColor}-400`} />
                </div>
                Informasi Ruangan
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white/80 dark:bg-gray-800/50 rounded-xl p-4 border border-gray-200/50 dark:border-gray-700/50 shadow-sm">
                  <h4 className="font-semibold text-sm mb-3 flex items-center text-gray-900 dark:text-gray-100">
                    <Users className={`w-4 h-4 mr-2 text-green-600 dark:text-green-400`} />
                    Kapasitas
                  </h4>
                  <p className="text-gray-700 dark:text-gray-300 font-medium text-sm">{booking.rooms.capacity} orang</p>
                </div>
              </div>
            </div>
          )}

          {/* User Information Section */}
          <div className="space-y-4">
            <h3 className={`text-lg font-semibold flex items-center bg-gradient-to-r ${config.gradient} bg-clip-text text-transparent`}>
              <div className={`w-8 h-8 bg-gradient-to-br ${config.bgGradient} dark:bg-${config.primaryColor}-900/50 rounded-lg flex items-center justify-center mr-3`}>
                <User className={`w-4 h-4 text-${config.primaryColor}-600 dark:text-${config.primaryColor}-400`} />
              </div>
              Informasi Pengguna
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white/80 dark:bg-gray-800/50 rounded-xl p-4 border border-gray-200/50 dark:border-gray-700/50 shadow-sm">
                <h4 className="font-semibold text-sm mb-3 flex items-center text-gray-900 dark:text-gray-100">
                  <User className={`w-4 h-4 mr-2 text-${config.primaryColor}-600 dark:text-${config.primaryColor}-400`} />
                  Nama Lengkap
                </h4>
                <p className="text-gray-700 dark:text-gray-300 font-medium text-sm">{booking.profiles?.full_name || 'Tidak tersedia'}</p>
              </div>
              <div className="bg-white/80 dark:bg-gray-800/50 rounded-xl p-4 border border-gray-200/50 dark:border-gray-700/50 shadow-sm">
                <h4 className="font-semibold text-sm mb-3 flex items-center text-gray-900 dark:text-gray-100">
                  <Mail className={`w-4 h-4 mr-2 text-${config.primaryColor}-600 dark:text-${config.primaryColor}-400`} />
                  Email
                </h4>
                <p className="text-gray-700 dark:text-gray-300 font-medium text-sm">{booking.profiles?.email || 'Tidak tersedia'}</p>
              </div>
              {booking.profiles?.institution && (
                <div className="bg-white/80 dark:bg-gray-800/50 rounded-xl p-4 border border-gray-200/50 dark:border-gray-700/50 shadow-sm">
                  <h4 className="font-semibold text-sm mb-3 flex items-center text-gray-900 dark:text-gray-100">
                    <Building className={`w-4 h-4 mr-2 text-${config.primaryColor}-600 dark:text-${config.primaryColor}-400`} />
                    Institusi
                  </h4>
                  <p className="text-gray-700 dark:text-gray-300 font-medium text-sm">{booking.profiles.institution}</p>
                </div>
              )}
              {booking.profiles?.phone && (
                <div className="bg-white/80 dark:bg-gray-800/50 rounded-xl p-4 border border-gray-200/50 dark:border-gray-700/50 shadow-sm">
                  <h4 className="font-semibold text-sm mb-3 flex items-center text-gray-900 dark:text-gray-100">
                    <Phone className={`w-4 h-4 mr-2 text-${config.primaryColor}-600 dark:text-${config.primaryColor}-400`} />
                    Telepon
                  </h4>
                  <p className="text-gray-700 dark:text-gray-300 font-medium text-sm">{booking.profiles.phone}</p>
                </div>
              )}
            </div>
          </div>

          {/* Description Section */}
          {booking.event_description && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/50 rounded-lg flex items-center justify-center mr-3">
                  <FileText className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                </div>
                Deskripsi Kegiatan
              </h3>
              <div className="bg-white/80 dark:bg-gray-800/50 rounded-xl p-5 border border-gray-200/50 dark:border-gray-700/50 shadow-sm">
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
              <div className="bg-white/80 dark:bg-gray-800/50 rounded-xl p-5 border border-gray-200/50 dark:border-gray-700/50 shadow-sm">
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed text-sm">{booking.notes}</p>
              </div>
            </div>
          )}

          {/* Proposal File Section */}
          {booking.proposal_file && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                <div className="w-8 h-8 bg-red-100 dark:bg-red-900/50 rounded-lg flex items-center justify-center mr-3">
                  <FileText className="w-4 h-4 text-red-600 dark:text-red-400" />
                </div>
                Dokumen Proposal
              </h3>
              <div className="bg-white/80 dark:bg-gray-800/50 rounded-xl p-4 border border-gray-200/50 dark:border-gray-700/50 shadow-sm">
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
                    <FileText className="w-4 h-4 mr-2" />
                    Buka File Proposal
                  </a>
                </Button>
              </div>
            </div>
          )}

          {/* Context-aware Action Buttons */}
          {context === 'approvals' && booking.status === 'pending' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                <div className="w-8 h-8 bg-green-100 dark:bg-green-900/50 rounded-lg flex items-center justify-center mr-3">
                  <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                </div>
                Tindakan
              </h3>
              <div className="bg-white/80 dark:bg-gray-800/50 rounded-xl p-4 border border-gray-200/50 dark:border-gray-700/50 shadow-sm">
                <div className="flex gap-3">
                  <Button
                    onClick={() => handleStatusUpdate('approved')}
                    size="lg"
                    className="bg-green-600 hover:bg-green-700 text-white font-medium shadow-md hover:shadow-green-500/25 transition-all flex-1"
                    disabled={updateBookingStatusMutation.isPending}
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Setujui
                  </Button>
                  <Button
                    onClick={() => handleStatusUpdate('rejected')}
                    variant="destructive"
                    size="lg"
                    disabled={updateBookingStatusMutation.isPending}
                    className="flex-1"
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Tolak
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}