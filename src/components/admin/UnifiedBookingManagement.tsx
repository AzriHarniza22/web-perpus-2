'use client'

import * as React from 'react'
import { RefreshCw, History, Filter, FileText, Sparkles, Eye, Search, X, Calendar, Building, RotateCcw } from 'lucide-react'

import { useBookings, useUpdateBookingStatus, useRooms } from '@/lib/api'
import { supabase } from '@/lib/supabase'
import { useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DataTable } from '@/components/ui/data-table'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import BookingDetailModal from '@/components/admin/BookingDetailModal'
import type { BookingWithRelations } from '@/lib/api'

// Function to auto-complete expired approved bookings
const autoCompleteExpiredBookings = async (bookings: BookingWithRelations[]) => {
  const now = new Date()
  const expiredApprovedBookings = bookings.filter(booking =>
    booking.status === 'approved' &&
    new Date(booking.end_time) < now
  )

  if (expiredApprovedBookings.length === 0) return

  // Update each expired booking to completed
  const updatePromises = expiredApprovedBookings.map(booking =>
    supabase
      .from('bookings')
      .update({ status: 'completed' })
      .eq('id', booking.id)
  )

  await Promise.all(updatePromises)
}

interface UnifiedBookingManagementProps {
  readonly?: boolean;
}

export default function UnifiedBookingManagement({ readonly = false }: UnifiedBookingManagementProps) {
  const queryClient = useQueryClient()

  // Filter states
  const [search, setSearch] = React.useState('')
  const [status, setStatus] = React.useState<string[]>([])
  const [startDate, setStartDate] = React.useState<Date | undefined>()
  const [endDate, setEndDate] = React.useState<Date | undefined>()
  const [roomIds, setRoomIds] = React.useState<string[]>([])
  const [bookingView, setBookingView] = React.useState<'all' | 'room' | 'tour'>('all')

  // Pagination and sorting
  const [currentPage, setCurrentPage] = React.useState(1)
  const [pageSize, setPageSize] = React.useState(10)
  const [sortKey, setSortKey] = React.useState<string>('submitted_date')
  const [sortDirection, setSortDirection] = React.useState<'asc' | 'desc'>('desc')

  // Modal state
  const [detailModalOpen, setDetailModalOpen] = React.useState(false)
  const [selectedBooking, setSelectedBooking] = React.useState<BookingWithRelations | null>(null)

  // Convert date range to API format
  const apiDateRange = startDate && endDate ? {
    start: startDate.toISOString(),
    end: endDate.toISOString()
  } : undefined

  // Map column keys to API field names
  const getApiSortField = (columnKey: string) => {
    switch (columnKey) {
      case 'submitted_date':
        return 'created_at'
      case 'reservation_date':
        return 'start_time'
      case 'accepted_date':
        return 'updated_at'
      case 'status':
        return 'status'
      default:
        return 'created_at'
    }
  }

  // Fetch data based on booking view
  const { data: bookingsData, isLoading } = useBookings({
    status: status.length > 0 ? status : undefined,
    dateRange: apiDateRange,
    roomIds: roomIds.length > 0 ? roomIds : undefined,
    page: currentPage,
    limit: pageSize,
    sortBy: getApiSortField(sortKey),
    sortOrder: sortDirection,
    isTour: bookingView === 'tour' ? true : bookingView === 'room' ? false : undefined,
  })

  // Client-side search filtering
  const filteredBookings = React.useMemo(() => {
    const currentBookings = bookingsData?.bookings || []
    if (!search.trim()) return currentBookings

    const searchLower = search.toLowerCase().trim()
    return currentBookings.filter(booking =>
      booking.event_description?.toLowerCase().includes(searchLower) ||
      booking.notes?.toLowerCase().includes(searchLower) ||
      booking.profiles?.full_name?.toLowerCase().includes(searchLower) ||
      booking.profiles?.email?.toLowerCase().includes(searchLower) ||
      booking.rooms?.name?.toLowerCase().includes(searchLower)
    )
  }, [bookingsData?.bookings, search])

  // Auto-complete expired approved bookings
  React.useEffect(() => {
    const currentBookings = bookingsData?.bookings || []
    if (currentBookings.length > 0) {
      autoCompleteExpiredBookings(currentBookings).then(() => {
        // Invalidate and refetch bookings after updating expired ones
        // This will be handled by React Query's cache invalidation
      }).catch(console.error)
    }
  }, [bookingsData?.bookings])

  const { data: rooms = [] } = useRooms()
  const updateBookingStatusMutation = useUpdateBookingStatus()

  const updateBookingStatus = (id: string, status: string) => {
    updateBookingStatusMutation.mutate({ id, status })
  }

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('id-ID', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'approved': return 'default'
      case 'rejected': return 'destructive'
      case 'completed': return 'secondary'
      case 'cancelled': return 'outline'
      default: return 'outline'
    }
  }

  const getBookingTypeIcon = (booking: BookingWithRelations) => {
    // Use is_tour column to determine if it's a tour booking
    const isTour = booking.is_tour || false

    return isTour ? Sparkles : FileText
  }

  const getBookingTypeLabel = (booking: BookingWithRelations) => {
    // Use is_tour column to determine if it's a tour booking
    const isTour = booking.is_tour || false

    return isTour ? 'Tour' : 'Room'
  }

  const handleClearFilters = () => {
    setSearch('')
    setStatus([])
    setStartDate(undefined)
    setEndDate(undefined)
    setRoomIds([])
    setBookingView('all')
    setCurrentPage(1)
  }

  const handleApplyFilters = () => {
    setCurrentPage(1) // Reset to first page when applying filters
  }

  const handleSortingChange = (key: string | undefined, direction: 'asc' | 'desc' | null | undefined) => {
    if (key) setSortKey(key)
    if (direction && direction !== null) setSortDirection(direction)
    else if (direction === null) setSortDirection('desc') // Reset to default
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  const handlePageSizeChange = (size: number) => {
    setPageSize(size)
    setCurrentPage(1)
  }

  const handleViewDetails = (booking: BookingWithRelations) => {
    setSelectedBooking(booking)
    setDetailModalOpen(true)
  }

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['bookings'] })
    queryClient.invalidateQueries({ queryKey: ['rooms'] })
  }

  const columns = [
    {
      key: 'type',
      header: 'Type',
      render: (booking: BookingWithRelations) => {
        const TypeIcon = getBookingTypeIcon(booking)
        const typeLabel = getBookingTypeLabel(booking)

        return (
          <div className="flex items-center space-x-2">
            <TypeIcon className="w-4 h-4 text-primary" />
            <Badge variant="outline" className="text-xs">
              {typeLabel}
            </Badge>
          </div>
        )
      },
      sortable: false,
    },
    {
      key: 'submitted_date',
      header: 'Tanggal Diajukan',
      render: (booking: BookingWithRelations) => (
        <div className="font-medium">
          {formatDateTime(booking.created_at)}
        </div>
      ),
      sortable: true,
    },
    {
      key: 'reservation_date',
      header: 'Tanggal Reservasi',
      render: (booking: BookingWithRelations) => (
        <div>
          <div className="font-medium">
            {formatDateTime(booking.start_time)}
          </div>
          <div className="text-sm text-muted-foreground">
            to {formatDateTime(booking.end_time)}
          </div>
        </div>
      ),
      sortable: true,
    },
    {
      key: 'accepted_date',
      header: 'Tanggal Diterima',
      render: (booking: BookingWithRelations) => {
        // For accepted bookings, show when they were approved
        if (booking.status === 'approved' || booking.status === 'completed') {
          return (
            <div className="font-medium text-green-600">
              {formatDateTime(booking.updated_at || booking.created_at)}
            </div>
          )
        }
        return <span className="text-muted-foreground">-</span>
      },
      sortable: true,
    },
    {
      key: 'room',
      header: 'Room/Tour',
      render: (booking: BookingWithRelations) => {
        const isTour = getBookingTypeLabel(booking) === 'Tour'

        if (isTour) {
          // For tour bookings, show tour information from event description
          const tourName = booking.event_description?.replace('Tour: ', '').split(' - ')[0] || 'Tour Booking'
          return (
            <div>
              <div className="font-medium flex items-center">
                <Sparkles className="w-4 h-4 mr-2 text-secondary" />
                {tourName}
              </div>
              <div className="text-sm text-muted-foreground">
                Tour Booking
              </div>
            </div>
          )
        } else {
          // For room bookings, show room information
          return (
            <div>
              <div className="font-medium">{booking.rooms?.name}</div>
              {booking.rooms?.capacity && (
                <div className="text-sm text-muted-foreground">
                  Capacity: {booking.rooms.capacity}
                </div>
              )}
            </div>
          )
        }
      },
      sortable: false,
    },
    {
      key: 'user',
      header: 'User',
      render: (booking: BookingWithRelations) => (
        <div>
          <div className="font-medium">{booking.profiles?.full_name}</div>
          <div className="text-sm text-muted-foreground">
            {booking.profiles?.email}
          </div>
          {booking.profiles?.institution && (
            <div className="text-xs text-muted-foreground">
              {booking.profiles.institution}
            </div>
          )}
        </div>
      ),
      sortable: false,
    },
    {
      key: 'status',
      header: 'Status',
      render: (booking: BookingWithRelations) => (
        <Badge variant={getStatusBadgeVariant(booking.status)}>
          {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
        </Badge>
      ),
      sortable: true,
    },
    {
      key: 'event',
      header: 'Event',
      render: (booking: BookingWithRelations) => (
        <div className="max-w-xs">
          {booking.event_description ? (
            <div className="truncate" title={booking.event_description}>
              {booking.event_description}
            </div>
          ) : (
            <span className="text-muted-foreground">-</span>
          )}
          {booking.notes && (
            <div className="text-xs text-muted-foreground mt-1 truncate" title={booking.notes}>
              Notes: {booking.notes}
            </div>
          )}
        </div>
      ),
      sortable: false,
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (booking: BookingWithRelations) => {
        if (readonly) {
          return (
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleViewDetails(booking)}
                className="flex items-center"
              >
                <Eye className="w-4 h-4 mr-2" />
                Lihat Detail
              </Button>
              {booking.proposal_file && (
                <Button variant="outline" size="sm" asChild>
                  <a
                    href={supabase.storage.from('proposals').getPublicUrl(booking.proposal_file).data.publicUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    View Proposal
                  </a>
                </Button>
              )}
            </div>
          )
        }

        return (
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleViewDetails(booking)}
              className="flex items-center"
            >
              <Eye className="w-4 h-4 mr-2" />
              Lihat Detail
            </Button>

            {booking.proposal_file && (
              <Button variant="outline" size="sm" asChild>
                <a
                  href={supabase.storage.from('proposals').getPublicUrl(booking.proposal_file).data.publicUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  View Proposal
                </a>
              </Button>
            )}

            {booking.status === 'pending' ? (
              <div className="flex space-x-1">
                <Button
                  size="sm"
                  onClick={() => updateBookingStatus(booking.id, 'approved')}
                  className="bg-green-600 hover:bg-green-700"
                >
                  Approve
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => updateBookingStatus(booking.id, 'rejected')}
                >
                  Reject
                </Button>
              </div>
            ) : (
              <Select
                value={booking.status}
                onValueChange={(value) => updateBookingStatus(booking.id, value)}
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            )}
          </div>
        )
      },
      sortable: false,
    },
  ]

  return (
    <div className="space-y-6">
      {/* Compact Filter Panel */}
      <Card className="bg-card backdrop-blur-sm border shadow-sm">
        <CardContent className="py-0 px-6 space-y-3">
          {/* Category Tabs */}
          <div className="flex items-center gap-2">
            <Label className="text-sm font-medium">Kategori:</Label>
            <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
              {[
                { value: 'all' as const, label: 'All' },
                { value: 'room' as const, label: 'Room' },
                { value: 'tour' as const, label: 'Tour' }
              ].map((tab) => (
                <Button
                  key={tab.value}
                  variant={bookingView === tab.value ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setBookingView(tab.value)}
                  disabled={isLoading}
                  className="text-xs px-3 py-1 h-7 transition-all"
                >
                  {tab.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Compact Single Row Layout */}
          <div className="flex flex-wrap items-end gap-4">
            {/* Search Bar */}
            <div className="flex-1 min-w-64">
              <Label className="flex items-center gap-2 text-sm mb-2">
                <Search className="w-4 h-4" />
                Pencarian
              </Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Cari berdasarkan nama, waktu, atau ruangan"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  disabled={isLoading}
                  className="pl-9 h-10"
                />
                {search && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSearch('')}
                    disabled={isLoading}
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6 p-0"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                )}
              </div>
            </div>

            {/* Status Filter */}
            <div className="min-w-40">
              <Label className="flex items-center gap-2 text-sm mb-2">
                <div className="w-3 h-3 rounded-full bg-gray-400 flex-shrink-0" />
                Status
              </Label>
              <Select
                value={status.length === 0 ? "all" : status.length === 1 ? status[0] : "multiple"}
                onValueChange={(value) => {
                  if (value === 'all') {
                    setStatus([])
                  } else {
                    const newStatus = status.includes(value)
                      ? status.filter(s => s !== value)
                      : [...status, value]
                    setStatus(newStatus)
                  }
                }}
                disabled={isLoading}
              >
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="All statuses">
                    {status.length === 0 && "All statuses"}
                    {status.length === 1 && status[0].charAt(0).toUpperCase() + status[0].slice(1)}
                    {status.length > 1 && `${status.length} selected`}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Date Range */}
            <div className="min-w-48">
              <Label className="flex items-center gap-2 text-sm mb-2">
                <Calendar className="w-4 h-4" />
                Tanggal
              </Label>
              <div className="flex gap-2">
                <Input
                  type="date"
                  value={startDate ? startDate.toISOString().split('T')[0] : ''}
                  onChange={(e) => {
                    const date = e.target.value ? new Date(e.target.value) : undefined
                    setStartDate(date)
                    if (date && endDate && date > endDate) {
                      setEndDate(undefined)
                    }
                  }}
                  disabled={isLoading}
                  className="h-10 text-sm flex-1"
                />
                <Input
                  type="date"
                  value={endDate ? endDate.toISOString().split('T')[0] : ''}
                  onChange={(e) => {
                    const date = e.target.value ? new Date(e.target.value) : undefined
                    if (date && startDate && date < startDate) {
                      // Show error - end date cannot be before start date
                      return
                    }
                    setEndDate(date)
                  }}
                  disabled={isLoading}
                  className="h-10 text-sm flex-1"
                />
              </div>
            </div>

            {/* Room Filter - Only show for All or Room */}
            {(bookingView === 'all' || bookingView === 'room') && (
              <div className="min-w-40">
                <Label className="flex items-center gap-2 text-sm mb-2">
                  <Building className="w-4 h-4" />
                  Rooms
                </Label>
                <Select
                  value={roomIds.length === 0 ? "all" : roomIds.length === 1 ? roomIds[0] : "multiple"}
                  onValueChange={(value) => {
                    if (value === 'all') {
                      setRoomIds([])
                    } else {
                      const newRoomIds = roomIds.includes(value)
                        ? roomIds.filter(id => id !== value)
                        : [...roomIds, value]
                      setRoomIds(newRoomIds)
                    }
                  }}
                  disabled={isLoading}
                >
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder="All rooms">
                      {roomIds.length === 0 && "All rooms"}
                      {roomIds.length === 1 && rooms.find((r: any) => r.id === roomIds[0])?.name}
                      {roomIds.length > 1 && `${roomIds.length} selected`}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Rooms</SelectItem>
                    {rooms.map((room: any) => (
                      <SelectItem key={room.id} value={room.id}>
                        <div className="flex items-center gap-2">
                          <Building className="w-3 h-3" />
                          {room.name}
                          {room.capacity && <Badge variant="outline" className="text-xs">{room.capacity}</Badge>}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {/* Date Validation Error - Show below the row */}
          {startDate && endDate && startDate > endDate && (
            <Alert variant="destructive" className="text-xs">
              <AlertDescription>End date must be after start date</AlertDescription>
            </Alert>
          )}

          {/* Active Filter Tags */}
          {(status.length > 0 || roomIds.length > 0) && (
            <div className="flex flex-wrap gap-1.5">
              {status.map((s) => (
                <Badge
                  key={s}
                  variant="secondary"
                  className="flex items-center gap-1 text-xs"
                >
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                  <button
                    onClick={() => setStatus(status.filter(st => st !== s))}
                    disabled={isLoading}
                    className="hover:text-destructive ml-1 disabled:opacity-50"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
              {roomIds.map((id) => {
                const room = rooms.find((r: any) => r.id === id)
                return room ? (
                  <Badge
                    key={id}
                    variant="outline"
                    className="flex items-center gap-1 text-xs bg-green-50 text-green-700 border-green-200"
                  >
                    <Building className="w-3 h-3" />
                    {room.name}
                    <button
                      onClick={() => setRoomIds(roomIds.filter(rid => rid !== id))}
                      disabled={isLoading}
                      className="hover:text-red-600 ml-1 disabled:opacity-50"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ) : null
              })}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-between items-center">
            <Button
              variant="outline"
              onClick={handleClearFilters}
              disabled={!search && status.length === 0 && !startDate && !endDate && roomIds.length === 0 && bookingView === 'all' || isLoading}
              size="sm"
              className="h-8"
            >
              <RotateCcw className="w-3 h-3 mr-2" />
              Clear All
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-2 h-8"
              onClick={handleRefresh}
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
              ) : (
                <RefreshCw className="w-3 h-3" />
              )}
              Refresh Data
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Data Table Card */}
      <Card className="bg-card backdrop-blur-sm border shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              <span>Bookings Data</span>
              <Badge variant="outline" className="ml-2">
                {filteredBookings.length} / {bookingsData?.totalCount || 0} items
              </Badge>
            </div>
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Complete list of bookings with detailed information and actions
          </p>
        </CardHeader>
        <CardContent className="p-0">
          <DataTable
            columns={columns}
            data={filteredBookings}
            pageSize={pageSize}
            onPageSizeChange={handlePageSizeChange}
            onSortingChange={handleSortingChange}
            currentPage={currentPage}
            onPageChange={handlePageChange}
            sortKey={sortKey}
            sortDirection={sortDirection}
            totalItems={bookingsData?.totalCount || 0}
          />
        </CardContent>
      </Card>

      {/* Empty State */}
      {filteredBookings.length === 0 && (
        <Card className="bg-card backdrop-blur-sm border shadow-sm">
          <CardContent className="py-16">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <History className="w-8 h-8 text-primary/60" />
              </div>
              <p className="text-muted-foreground text-lg font-medium">No bookings found</p>
              <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">
                Try adjusting your filters, search terms, or view options to find the bookings you're looking for.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <BookingDetailModal
        booking={selectedBooking}
        open={detailModalOpen}
        onOpenChange={setDetailModalOpen}
        context="history"
      />
    </div>
  )
}
