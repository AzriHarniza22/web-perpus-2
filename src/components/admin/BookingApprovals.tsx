'use client'

import { useState, useMemo } from 'react'
import { useBookings, useUpdateBookingStatus } from '@/lib/api'
import { supabase } from '@/lib/supabase'
import { useToastContext } from '@/components/ToastProvider'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Input } from '@/components/ui/input'
import {
  Check,
  X,
  Clock,
  FileText,
  Users,
  Calendar,
  MapPin,
  Eye,
  File,
  Sparkles,
  Building,
  Grid3X3,
  Search,
  SortAsc,
  SortDesc,
  AlertTriangle,
  MoreHorizontal,
  Star,
  UserCheck,
  CalendarDays,
  Phone,
  Mail,
  Bell,
  BellOff,
  ArrowUpDown,
  ArrowUp,
  ArrowDown
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { BookingWithRelations } from '@/lib/api'
import BookingDetailModal from '@/components/admin/BookingDetailModal'

// Visual distinction system configuration
const bookingTypeConfigs = {
  room: {
    icon: Building,
    color: { primary: 'primary', secondary: 'primary', background: 'primary/10' },
    bgColor: 'bg-primary',
    label: 'Reservasi Ruangan',
    badgeBg: 'primary/10',
    badgeBorder: 'primary/20'
  },
  tour: {
    icon: Sparkles,
    color: { primary: 'secondary', secondary: 'secondary', background: 'secondary/10' },
    bgColor: 'bg-secondary',
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
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<'newest' | 'oldest'>('newest')
  const [sortField, setSortField] = useState<'created_at' | 'start_time'>('created_at')
  const [detailModalOpen, setDetailModalOpen] = useState(false)
  const [selectedBooking, setSelectedBooking] = useState<BookingWithRelations | null>(null)
  const toast = useToastContext()

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

  // Enhanced filtering and sorting
  const filteredAndSortedBookings = useMemo(() => {
    let filtered = bookings

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(booking => {
        const isTourBooking = booking.is_tour || false
        const tourInfo = isTourBooking ? getTourInfo(booking) : null
        const name = isTourBooking ? tourInfo?.name : booking.rooms?.name
        const userName = booking.profiles?.full_name || ''
        const userEmail = booking.profiles?.email || ''

        return name?.toLowerCase().includes(query) ||
               userName.toLowerCase().includes(query) ||
               userEmail.toLowerCase().includes(query)
      })
    }

    // Apply sorting
    filtered.sort((a, b) => {
      const fieldA = sortField === 'created_at' ? a.created_at : a.start_time
      const fieldB = sortField === 'created_at' ? b.created_at : b.start_time

      switch (sortBy) {
        case 'newest':
          return new Date(fieldB).getTime() - new Date(fieldA).getTime()
        case 'oldest':
          return new Date(fieldA).getTime() - new Date(fieldB).getTime()
        default:
          return 0
      }
    })

    return filtered
  }, [bookings, searchQuery, sortBy, sortField])

  const updateBookingStatus = (id: string, status: string) => {
    updateBookingStatusMutation.mutate({ id, status }, {
      onSuccess: () => {
        if (status === 'approved') {
          toast.success('Reservasi berhasil disetujui', 'Permintaan reservasi telah dikonfirmasi.')
        } else if (status === 'rejected') {
          toast.warning('Reservasi berhasil ditolak', 'Permintaan reservasi telah dibatalkan.')
        }
      },
      onError: (error) => {
        console.error('Error updating booking status:', error)
        toast.error('Gagal memperbarui status reservasi', 'Terjadi kesalahan saat memproses permintaan.')
      }
    })
  }

  const handleViewDetails = (booking: BookingWithRelations) => {
    setSelectedBooking(booking)
    setDetailModalOpen(true)
  }

  const handleSort = (field: 'created_at' | 'start_time') => {
    if (sortField === field) {
      // Toggle sort direction if same field
      setSortBy(sortBy === 'newest' ? 'oldest' : 'newest')
    } else {
      // Set new field and default to newest
      setSortField(field)
      setSortBy('newest')
    }
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

      {/* Compact Filter and Search Controls */}
      <Card className="group bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm hover:shadow-lg transition-all duration-200 border-2">
        <CardContent className="p-3">
          <div className="flex flex-col md:flex-row gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Cari berdasarkan nama ruangan/tour, nama pengguna, atau email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-8"
              />
            </div>

            {/* Type Filters */}
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-muted-foreground whitespace-nowrap">Tampilkan:</span>
              <div className="flex rounded-lg border bg-card">
                {Object.keys(filterConfigs).map((filterKey) => {
                  const config = filterConfigs[filterKey as keyof typeof filterConfigs]
                  const Icon = config.icon
                  const isActive = bookingType === config.key

                  return (
                    <button
                      key={config.key}
                      onClick={() => setBookingType(config.key as 'all' | 'room' | 'tour')}
                      className={`px-2 py-1.5 text-xs font-medium transition-all duration-200 flex items-center gap-1.5 rounded-md ${
                        isActive
                          ? `${config.color} ${config.bgColor} shadow-sm`
                          : 'text-muted-foreground hover:bg-primary hover:text-white hover:border-primary'
                      } ${config.key === 'all' ? 'rounded-l-md' : config.key === 'tour' ? 'rounded-r-md' : ''}`}
                    >
                      <Icon className={`w-3.5 h-3.5 ${isActive ? '' : 'opacity-60'}`} />
                      <span>{config.label}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Sort Options */}
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-muted-foreground whitespace-nowrap">Urutkan:</span>
              <div className="flex gap-1">
                {[
                  { key: 'newest', label: 'Terbaru', icon: SortDesc },
                  { key: 'oldest', label: 'Terlama', icon: SortAsc }
                ].map((sort) => (
                  <Button
                    key={sort.key}
                    variant={sortBy === sort.key ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSortBy(sort.key as 'newest' | 'oldest')}
                    className={`px-2 h-8 text-xs ${sortBy !== sort.key ? 'hover:bg-primary hover:text-white hover:border-primary' : ''}`}
                  >
                    <sort.icon className="w-3 h-3 mr-1" />
                    <span className="hidden sm:inline">{sort.label}</span>
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Enhanced Booking Table */}
      <AnimatePresence mode="popLayout">
        {filteredAndSortedBookings.length > 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-card rounded-lg border shadow-sm overflow-hidden group-hover:shadow-lg transition-all duration-200"
          >
            <Table>
              <TableHeader>
                <TableRow className="bg-white/90 dark:bg-gray-800/90 hover:bg-white/90 dark:hover:bg-gray-800/90">
                  <TableHead className="font-semibold text-left pl-25">Reservasi</TableHead>
                  <TableHead className="font-semibold text-left pl-21">Pengguna</TableHead>
                  <TableHead className="font-semibold text-center pl-8">
                    <button
                      onClick={() => handleSort('start_time')}
                      className="flex items-center justify-center gap-1 hover:text-primary transition-colors w-full"
                    >
                      <span>Jadwal</span>
                      {sortField === 'start_time' ? (
                        sortBy === 'newest' ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />
                      ) : (
                        <ArrowUpDown className="w-4 h-4 opacity-50" />
                      )}
                    </button>
                  </TableHead>
                  <TableHead className="font-semibold text-center">
                    <button
                      onClick={() => handleSort('created_at')}
                      className="flex items-center justify-center gap-1 hover:text-primary transition-colors w-full"
                    >
                      <span>Dibuat</span>
                      {sortField === 'created_at' ? (
                        sortBy === 'newest' ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />
                      ) : (
                        <ArrowUpDown className="w-4 h-4 opacity-50" />
                      )}
                    </button>
                  </TableHead>
                  <TableHead className="font-semibold text-center">Detail</TableHead>
                  <TableHead className="font-semibold text-center">Status</TableHead>
                  <TableHead className="font-semibold text-center pl-10">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAndSortedBookings.map((booking, index) => {
                  // Determine booking type from API response
                  const isTourBooking = booking.is_tour || false
                  const bookingTypeKey = isTourBooking ? 'tour' : 'room'
                  const config = bookingTypeConfigs[bookingTypeKey]
                  const Icon = config.icon
                  const tourInfo = bookingTypeKey === 'tour' ? getTourInfo(booking) : null

                  const today = new Date()
                  const tomorrow = new Date(today)
                  tomorrow.setDate(today.getDate() + 1)
                  const startDate = new Date(booking.start_time)
                  const isTomorrow = startDate.toDateString() === tomorrow.toDateString()
                  const isUrgent = isTomorrow

                  return (
                    <motion.tr
                      key={booking.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ delay: index * 0.02 }}
                      className={`hover:bg-muted/30 transition-colors ${
                        isUrgent ? 'bg-orange-50/20 dark:bg-orange-950/10' : ''
                      }`}
                    >
                      {/* Booking Info Column */}
                      <TableCell className="py-3">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 ${config.bgColor} rounded-md flex items-center justify-center flex-shrink-0`}>
                            <Icon className="w-3 h-3 text-white" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-sm truncate text-gray-900 dark:text-white">
                              {bookingTypeKey === 'tour' ? tourInfo?.name : booking.rooms?.name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              #{booking.id.slice(-8).toUpperCase()}
                            </p>
                          </div>
                        </div>
                      </TableCell>

                      {/* User Info Column */}
                      <TableCell className="py-3">
                        <div className="flex items-center gap-3">
                          <Avatar className="w-8 h-8 flex-shrink-0">
                            <AvatarImage src={booking.profiles?.profile_photo || undefined} alt={booking.profiles?.full_name} />
                            <AvatarFallback className={`text-xs ${config.bgColor} text-white text-[10px] flex items-center justify-center`}>
                              {booking.profiles?.full_name ? booking.profiles.full_name.split(' ').map(n => n[0]).join('').toUpperCase() : 'U'}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <p className="font-medium text-sm truncate text-gray-900 dark:text-white">
                              {booking.profiles?.full_name}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">
                              {booking.profiles?.email}
                            </p>
                          </div>
                        </div>
                      </TableCell>

                      {/* Schedule Info Column */}
                      <TableCell className="py-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <Calendar className="w-4 h-4 text-primary flex-shrink-0" />
                          <div>
                            <p className="font-medium text-sm text-gray-900 dark:text-white">
                              {new Date(booking.start_time).toLocaleDateString('id-ID', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric'
                              })}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(booking.start_time).toLocaleTimeString('id-ID', {
                                hour: '2-digit',
                                minute: '2-digit'
                              })} - {new Date(booking.end_time).toLocaleTimeString('id-ID', {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </p>
                          </div>
                        </div>
                      </TableCell>

                      {/* Created Date Column */}
                      <TableCell className="py-3">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-secondary flex-shrink-0" />
                          <div>
                            <p className="font-medium text-sm text-gray-900 dark:text-white">
                              {new Date(booking.created_at).toLocaleDateString('id-ID', {
                                day: 'numeric',
                                month: 'short'
                              })}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(booking.created_at).toLocaleTimeString('id-ID', {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </p>
                          </div>
                        </div>
                      </TableCell>

                      {/* Details Column */}
                      <TableCell className="py-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                          {bookingTypeKey === 'tour' ? <Users className="w-4 h-4 text-secondary flex-shrink-0" /> : <Building className="w-4 h-4 text-secondary flex-shrink-0" />}
                          <div>
                            <p className="font-medium text-sm text-gray-900 dark:text-white">
                              {booking.guest_count || 1} {bookingTypeKey === 'tour' ? 'Peserta' : 'Orang'}
                            </p>
                          </div>
                        </div>
                      </TableCell>

                      {/* Status Column */}
                      <TableCell className="py-3 text-center">
                        <div className="flex flex-col gap-1 items-center">
                          <div className="flex gap-1 justify-center">
                            {isUrgent && (
                              <Badge variant="outline" className="w-fit bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-900/20 dark:text-orange-400 dark:border-orange-800 text-xs px-1.5 py-0">
                                <AlertTriangle className="w-3 h-3 mr-1" />
                                Besok
                              </Badge>
                            )}
                            <Badge variant="outline" className="w-fit bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800 text-xs px-1.5 py-0">
                              <Clock className="w-3 h-3 mr-1" />
                              Pending
                            </Badge>
                          </div>
                        </div>
                      </TableCell>

                      {/* Actions Column */}
                      <TableCell className="py-3">
                        <div className="flex items-center justify-end gap-1">
                          {/* Primary Action Row */}
                          <div className="flex items-center gap-1">
                            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                              <Button
                                onClick={() => handleViewDetails(booking)}
                                variant="outline"
                                size="sm"
                                className="h-7 px-2 text-xs hover:bg-primary hover:text-white hover:border-primary transition-colors duration-200"
                              >
                                <Eye className="w-3 h-3" />
                              </Button>
                            </motion.div>

                            {booking.proposal_file && (
                              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  asChild
                                  className="h-7 px-2 text-xs hover:bg-primary hover:text-white hover:border-primary transition-colors duration-200"
                                >
                                  <a
                                    href={supabase.storage.from('proposals').getPublicUrl(booking.proposal_file).data.publicUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                  >
                                    <File className="w-3 h-3" />
                                  </a>
                                </Button>
                              </motion.div>
                            )}
                          </div>

                          {/* Decision Actions Row */}
                          <div className="flex items-center gap-1">
                            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                              <Button
                                onClick={() => updateBookingStatus(booking.id, 'approved')}
                                size="sm"
                                className="h-7 bg-green-600 hover:bg-green-700 text-white font-medium text-xs px-3 shadow-sm"
                                disabled={updateBookingStatusMutation.isPending}
                              >
                                <Check className="w-4 h-4 mr-1.5" />
                                Setujui
                              </Button>
                            </motion.div>

                            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                              <Button
                                onClick={() => updateBookingStatus(booking.id, 'rejected')}
                                variant="destructive"
                                size="sm"
                                className="h-7 text-xs px-3"
                                disabled={updateBookingStatusMutation.isPending}
                              >
                                <X className="w-4 h-4 mr-1.5" />
                                Tolak
                              </Button>
                            </motion.div>
                          </div>
                        </div>
                      </TableCell>
                    </motion.tr>
                  )
                })}
              </TableBody>
            </Table>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-16 bg-card rounded-lg border group-hover:shadow-lg transition-all duration-200"
          >
            <div className="w-20 h-20 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
              {bookingType === 'room' ? <Building className="w-10 h-10 text-primary" /> : bookingType === 'tour' ? <Sparkles className="w-10 h-10 text-secondary" /> : <Check className="w-10 h-10 text-primary" />}
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              {searchQuery ? 'Tidak Ada Hasil Pencarian' : 'Tidak Ada Permintaan Menunggu'}
            </h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              {searchQuery
                ? `Tidak ditemukan permintaan yang sesuai dengan pencarian "${searchQuery}".`
                : `Semua permintaan ${bookingType === 'all' ? '' : bookingType === 'room' ? 'reservasi ruangan' : 'pemesanan tour'} sudah diputuskan.`
              }
            </p>
          </motion.div>
        )}
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
                <Check className="w-8 h-8 text-green-600 dark:text-green-400" />
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
