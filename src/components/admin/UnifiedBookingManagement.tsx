'use client'

import * as React from 'react'
import { DateRange } from 'react-day-picker'
import { RefreshCw, History, Filter, FileText, Sparkles, Eye } from 'lucide-react'

import { useBookings, useUpdateBookingStatus, useRooms } from '@/lib/api'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DataTable } from '@/components/ui/data-table'
import { FilterPanel } from '@/components/ui/filter-panel'
import { Skeleton } from '@/components/ui/skeleton'
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
  // Filter states
  const [search, setSearch] = React.useState('')
  const [status, setStatus] = React.useState<string[]>([])
  const [dateRange, setDateRange] = React.useState<DateRange | undefined>()
  const [roomIds, setRoomIds] = React.useState<string[]>([])
  const [bookingView, setBookingView] = React.useState<'all' | 'room' | 'tour'>('all')

  // Pagination and sorting
  const [currentPage, setCurrentPage] = React.useState(1)
  const [pageSize, setPageSize] = React.useState(10)
  const [sortKey, setSortKey] = React.useState<string>('created_at')
  const [sortDirection, setSortDirection] = React.useState<'asc' | 'desc'>('desc')

  // Modal state
  const [detailModalOpen, setDetailModalOpen] = React.useState(false)
  const [selectedBooking, setSelectedBooking] = React.useState<BookingWithRelations | null>(null)

  // Convert date range to API format
  const apiDateRange = dateRange?.from && dateRange?.to ? {
    start: dateRange.from.toISOString(),
    end: dateRange.to.toISOString()
  } : undefined

  // Fetch data based on booking view
  const { data: allBookings = [], isLoading } = useBookings({
    status: status.length > 0 ? status : undefined,
    dateRange: apiDateRange,
    roomIds: roomIds.length > 0 ? roomIds : undefined,
    page: currentPage,
    limit: pageSize,
    sortBy: sortKey,
    sortOrder: sortDirection,
    isTour: bookingView === 'tour' ? true : bookingView === 'room' ? false : undefined,
  })

  // Filter bookings based on view selection
  const bookings = React.useMemo(() => {
    if (bookingView === 'all') return allBookings

    if (bookingView === 'room') {
      return allBookings.filter(booking =>
        !booking.event_description?.includes('Tour:') &&
        !booking.rooms?.name?.includes('Tour') &&
        !booking.notes?.includes('Meeting Point:')
      )
    }

    if (bookingView === 'tour') {
      return allBookings.filter(booking =>
        booking.event_description?.includes('Tour:') ||
        booking.rooms?.name?.includes('Tour') ||
        booking.notes?.includes('Meeting Point:')
      )
    }

    return allBookings
  }, [allBookings, bookingView])

  // Client-side search filtering
  const filteredBookings = React.useMemo(() => {
    if (!search.trim()) return bookings

    const searchLower = search.toLowerCase().trim()
    return bookings.filter(booking =>
      booking.event_description?.toLowerCase().includes(searchLower) ||
      booking.notes?.toLowerCase().includes(searchLower) ||
      booking.profiles?.full_name?.toLowerCase().includes(searchLower) ||
      booking.profiles?.email?.toLowerCase().includes(searchLower) ||
      booking.rooms?.name?.toLowerCase().includes(searchLower)
    )
  }, [bookings, search])

  // Auto-complete expired approved bookings
  React.useEffect(() => {
    if (allBookings.length > 0) {
      autoCompleteExpiredBookings(allBookings).then(() => {
        // Invalidate and refetch bookings after updating expired ones
        // This will be handled by React Query's cache invalidation
      }).catch(console.error)
    }
  }, [allBookings])

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
    const isTour = booking.event_description?.includes('Tour:') ||
                   booking.rooms?.name?.includes('Tour') ||
                   booking.notes?.includes('Meeting Point:')

    return isTour ? Sparkles : FileText
  }

  const getBookingTypeLabel = (booking: BookingWithRelations) => {
    const isTour = booking.event_description?.includes('Tour:') ||
                   booking.rooms?.name?.includes('Tour') ||
                   booking.notes?.includes('Meeting Point:')

    return isTour ? 'Tour' : 'Room'
  }

  const handleClearFilters = () => {
    setSearch('')
    setStatus([])
    setDateRange(undefined)
    setRoomIds([])
    setBookingView('all')
    setCurrentPage(1)
  }

  const handleApplyFilters = () => {
    setCurrentPage(1) // Reset to first page when applying filters
  }

  const handleSortingChange = (key: string, direction: 'asc' | 'desc' | null) => {
    setSortKey(key)
    setSortDirection(direction === null ? 'desc' : direction)
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

  const columns = [
    {
      key: 'type',
      header: 'Type',
      render: (booking: BookingWithRelations) => {
        const TypeIcon = getBookingTypeIcon(booking)
        const typeLabel = getBookingTypeLabel(booking)

        return (
          <div className="flex items-center space-x-2">
            <TypeIcon className="w-4 h-4 text-blue-600" />
            <Badge variant="outline" className="text-xs">
              {typeLabel}
            </Badge>
          </div>
        )
      },
      sortable: false,
    },
    {
      key: 'date',
      header: 'Date & Time',
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
                <Sparkles className="w-4 h-4 mr-2 text-purple-600" />
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

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center">
              <History className="w-8 h-8 mr-3 text-blue-600" />
              History Management
            </h1>
            <p className="text-muted-foreground">Unified view of all reservations and tour bookings</p>
          </div>
          <Button variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>

        {/* View Filter Buttons */}
        <div className="flex items-center space-x-2">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <div className="flex space-x-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
            {['all', 'room', 'tour'].map((view) => (
              <Button
                key={view}
                variant={bookingView === view ? 'default' : 'ghost'}
                size="sm"
                className="capitalize"
              >
                {view === 'all' ? 'All Bookings' : view}
              </Button>
            ))}
          </div>
        </div>

        <FilterPanel
          search={search}
          onSearchChange={setSearch}
          status={status}
          onStatusChange={setStatus}
          dateRange={dateRange}
          onDateRangeChange={setDateRange}
          roomIds={roomIds}
          onRoomIdsChange={setRoomIds}
          rooms={rooms}
          onClearFilters={handleClearFilters}
          onApplyFilters={handleApplyFilters}
          bookingType={bookingView}
          onBookingTypeChange={setBookingView}
        />

        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="border rounded-lg p-4">
              <Skeleton className="h-4 w-3/4 mb-2" />
              <Skeleton className="h-3 w-1/2 mb-1" />
              <Skeleton className="h-3 w-1/3" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center">
            <History className="w-8 h-8 mr-3 text-blue-600" />
            History Management
          </h1>
          <p className="text-muted-foreground">Unified view of all reservations and tour bookings</p>
        </div>
        <Button variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* View Filter Buttons */}
      <div className="flex items-center space-x-2">
        <Filter className="w-4 h-4 text-muted-foreground" />
        <div className="flex space-x-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
          {[
            { value: 'all', label: 'All Bookings' },
            { value: 'room', label: 'Room Only' },
            { value: 'tour', label: 'Tour Only' }
          ].map((view) => (
            <Button
              key={view.value}
              variant={bookingView === view.value ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setBookingView(view.value as 'all' | 'room' | 'tour')}
              className="capitalize"
            >
              {view.label}
            </Button>
          ))}
        </div>
      </div>

      <FilterPanel
        search={search}
        onSearchChange={setSearch}
        status={status}
        onStatusChange={setStatus}
        dateRange={dateRange}
        onDateRangeChange={setDateRange}
        roomIds={roomIds}
        onRoomIdsChange={setRoomIds}
        rooms={rooms}
        onClearFilters={handleClearFilters}
        onApplyFilters={handleApplyFilters}
        bookingType={bookingView}
        onBookingTypeChange={setBookingView}
      />

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
      />

      {filteredBookings.length === 0 && (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-4">
            <History className="w-8 h-8 text-blue-600 dark:text-blue-400" />
          </div>
          <p className="text-muted-foreground text-lg">No bookings found</p>
          <p className="text-sm text-muted-foreground mt-2">
            Try adjusting your filters or search terms
          </p>
        </div>
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