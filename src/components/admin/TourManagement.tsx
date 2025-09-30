'use client'

import * as React from 'react'
import { DateRange } from 'react-day-picker'
import { RefreshCw, Sparkles } from 'lucide-react'

import { useBookings, useUpdateBookingStatus } from '@/lib/api'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DataTable } from '@/components/ui/data-table'
import { FilterPanel } from '@/components/ui/filter-panel'
import { Skeleton } from '@/components/ui/skeleton'
import type { BookingWithRelations } from '@/lib/api'

// Mock tour data - in real implementation, this would come from API
const mockTours = [
  {
    id: 'tour-1',
    name: 'Library Heritage Tour',
    description: 'Explore the rich history and architecture of our historic library building',
    duration: 90,
    maxParticipants: 15,
  },
  {
    id: 'tour-2',
    name: 'Digital Archives Tour',
    description: 'Discover our extensive digital collection and research resources',
    duration: 60,
    maxParticipants: 10,
  },
  {
    id: 'tour-3',
    name: 'Children\'s Literature Tour',
    description: 'A fun and educational tour of our children\'s literature collection',
    duration: 45,
    maxParticipants: 20,
  },
]

// Function to auto-complete expired approved tour bookings
const autoCompleteExpiredTourBookings = async (bookings: BookingWithRelations[]) => {
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

export default function TourManagement() {
  // Filter states
  const [search, setSearch] = React.useState('')
  const [status, setStatus] = React.useState<string[]>([])
  const [dateRange, setDateRange] = React.useState<DateRange | undefined>()
  const [tourIds, setTourIds] = React.useState<string[]>([])

  // Pagination and sorting
  const [currentPage, setCurrentPage] = React.useState(1)
  const [pageSize, setPageSize] = React.useState(10)
  const [sortKey, setSortKey] = React.useState<string>('created_at')
  const [sortDirection, setSortDirection] = React.useState<'asc' | 'desc'>('desc')

  // Convert date range to API format
  const apiDateRange = dateRange?.from && dateRange?.to ? {
    start: dateRange.from.toISOString(),
    end: dateRange.to.toISOString()
  } : undefined

  // Fetch all bookings first, then filter for tours
  const { data: allBookings = [], isLoading } = useBookings({
    status: status.length > 0 ? status : undefined,
    dateRange: apiDateRange,
    page: currentPage,
    limit: pageSize,
    sortBy: sortKey,
    sortOrder: sortDirection,
  })

  // Filter for tour bookings (identified by having tour-like event descriptions)
  const tourBookings = React.useMemo(() => {
    return allBookings.filter(booking =>
      booking.event_description?.includes('Tour:') ||
      booking.rooms?.name?.includes('Tour') ||
      booking.notes?.includes('Meeting Point:')
    )
  }, [allBookings])

  // Client-side search filtering
  const bookings = React.useMemo(() => {
    if (!search.trim()) return tourBookings

    const searchLower = search.toLowerCase().trim()
    return tourBookings.filter(booking =>
      booking.event_description?.toLowerCase().includes(searchLower) ||
      booking.notes?.toLowerCase().includes(searchLower) ||
      booking.profiles?.full_name?.toLowerCase().includes(searchLower) ||
      booking.profiles?.email?.toLowerCase().includes(searchLower)
    )
  }, [tourBookings, search])

  // Auto-complete expired approved tour bookings
  React.useEffect(() => {
    if (tourBookings.length > 0) {
      autoCompleteExpiredTourBookings(tourBookings).then(() => {
        // Invalidate and refetch bookings after updating expired ones
        // This will be handled by React Query's cache invalidation
      }).catch(console.error)
    }
  }, [tourBookings])

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

  const getTourInfo = (booking: BookingWithRelations) => {
    // Extract tour name from event description or use a default
    const tourName = booking.event_description?.replace('Tour: ', '').split(' - ')[0] || 'Unknown Tour'
    return mockTours.find(tour => tour.name === tourName) || mockTours[0]
  }

  const handleClearFilters = () => {
    setSearch('')
    setStatus([])
    setDateRange(undefined)
    setTourIds([])
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

  const columns = [
    {
      key: 'date',
      header: 'Date & Time',
      render: (booking: BookingWithRelations) => {
        const tourInfo = getTourInfo(booking)
        return (
          <div>
            <div className="font-medium">
              {formatDateTime(booking.start_time)}
            </div>
            <div className="text-sm text-muted-foreground">
              to {formatDateTime(booking.end_time)} • {tourInfo.duration}min
            </div>
          </div>
        )
      },
      sortable: true,
    },
    {
      key: 'tour',
      header: 'Tour',
      render: (booking: BookingWithRelations) => {
        const tourInfo = getTourInfo(booking)
        return (
          <div>
            <div className="font-medium flex items-center">
              <Sparkles className="w-4 h-4 mr-2 text-purple-600" />
              {tourInfo.name}
            </div>
            <div className="text-sm text-muted-foreground">
              Max {tourInfo.maxParticipants} participants
            </div>
          </div>
        )
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
      key: 'participants',
      header: 'Participants',
      render: (booking: BookingWithRelations) => (
        <div className="font-medium">
          {booking.guest_count ? `${booking.guest_count} people` : 'Not specified'}
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
      header: 'Details',
      render: (booking: BookingWithRelations) => (
        <div className="max-w-xs">
          {booking.event_description ? (
            <div className="truncate" title={booking.event_description}>
              {booking.event_description.replace('Tour: ', '').split(' - ')[1] || booking.event_description}
            </div>
          ) : (
            <span className="text-muted-foreground">-</span>
          )}
          {booking.notes && (
            <div className="text-xs text-muted-foreground mt-1 truncate" title={booking.notes}>
              {booking.notes}
            </div>
          )}
        </div>
      ),
      sortable: false,
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (booking: BookingWithRelations) => (
        <div className="flex items-center space-x-2">
          {booking.proposal_file && (
            <Button variant="outline" size="sm" asChild>
              <a
                href={supabase.storage.from('proposals').getPublicUrl(booking.proposal_file).data.publicUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                View Document
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
      ),
      sortable: false,
    },
  ]

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Tour Management</h1>
            <p className="text-muted-foreground">View, filter, and manage all library tours</p>
          </div>
          <Button variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>

        <FilterPanel
          search={search}
          onSearchChange={setSearch}
          status={status}
          onStatusChange={setStatus}
          dateRange={dateRange}
          onDateRangeChange={setDateRange}
          roomIds={tourIds}
          onRoomIdsChange={setTourIds}
          rooms={[]} // Empty array for tour management since we don't filter by rooms
          onClearFilters={handleClearFilters}
          onApplyFilters={handleApplyFilters}
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
          <h1 className="text-3xl font-bold">Tour Management</h1>
          <p className="text-muted-foreground">View, filter, and manage all library tours</p>
        </div>
        <Button variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      <FilterPanel
        search={search}
        onSearchChange={setSearch}
        status={status}
        onStatusChange={setStatus}
        dateRange={dateRange}
        onDateRangeChange={setDateRange}
        roomIds={tourIds}
        onRoomIdsChange={setTourIds}
        rooms={[]} // Empty array for tour management since we don't filter by rooms
        onClearFilters={handleClearFilters}
        onApplyFilters={handleApplyFilters}
      />

      <DataTable
        columns={columns}
        data={bookings}
        pageSize={pageSize}
        onPageSizeChange={handlePageSizeChange}
        onSortingChange={handleSortingChange}
        currentPage={currentPage}
        onPageChange={handlePageChange}
        sortKey={sortKey}
        sortDirection={sortDirection}
      />

      {bookings.length === 0 && (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-8 h-8 text-purple-600 dark:text-purple-400" />
          </div>
          <p className="text-muted-foreground text-lg">No tour bookings found</p>
          <p className="text-sm text-muted-foreground mt-2">
            Try adjusting your filters or search terms
          </p>
        </div>
      )}
    </div>
  )
}