'use client'

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ChevronDown,
  ChevronUp,
  Search,
  X,
  AlertTriangle,
  CheckCircle,
  Info,
  Filter,
  Calendar,
  Building,
  RotateCcw,
  Eye,
  ArrowUpDown,
  Sliders
} from 'lucide-react'

import { format } from 'date-fns'
import { id } from 'date-fns/locale'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface Room {
  id: string
  name: string
  capacity?: number
  is_active?: boolean
}

interface FilterPanelProps {
  search: string
  onSearchChange: (value: string) => void
  status: string[]
  onStatusChange: (statuses: string[]) => void
  startDate: Date | undefined
  onStartDateChange: (date: Date | undefined) => void
  endDate: Date | undefined
  onEndDateChange: (date: Date | undefined) => void
  roomIds: string[]
  onRoomIdsChange: (ids: string[]) => void
  rooms: Room[]
  onClearFilters: () => void
  onApplyFilters: () => void
  bookingType?: 'all' | 'room' | 'tour'
  onBookingTypeChange?: (type: 'all' | 'room' | 'tour') => void
  // View Options
  bookingView?: 'all' | 'room' | 'tour'
  onBookingViewChange?: (view: 'all' | 'room' | 'tour') => void
  filteredBookings?: any[]
  // Sort Options
  sortKey?: string
  sortDirection?: 'asc' | 'desc'
  onSortingChange?: (key?: string, direction?: 'asc' | 'desc') => void
  isLoading?: boolean
  validationErrors?: string[]
  validationWarnings?: string[]
  className?: string
}

interface QuickFilter {
  key: string
  label: string
  icon: React.ReactNode
  color: string
  activeColor: string
}

const quickFilters: QuickFilter[] = [
  {
    key: 'this-week',
    label: 'Minggu Ini',
    icon: <Calendar className="w-3 h-3" />,
    color: 'bg-primary-100 text-primary-800 dark:bg-primary-900/30 dark:text-primary-300',
    activeColor: 'bg-primary text-white'
  },
  {
    key: 'this-month',
    label: 'Bulan Ini',
    icon: <Calendar className="w-3 h-3" />,
    color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    activeColor: 'bg-green-600 text-white'
  },
  {
    key: 'this-year',
    label: 'Tahun Ini',
    icon: <Calendar className="w-3 h-3" />,
    color: 'bg-secondary-100 text-secondary-800 dark:bg-secondary-900/30 dark:text-secondary-300',
    activeColor: 'bg-secondary text-white'
  }
]

export function EnhancedFilterPanel({
  search,
  onSearchChange,
  status,
  onStatusChange,
  startDate,
  onStartDateChange,
  endDate,
  onEndDateChange,
  roomIds,
  onRoomIdsChange,
  rooms,
  onClearFilters,
  onApplyFilters,
  bookingType = 'all',
  onBookingTypeChange,
  // View Options
  bookingView = 'all',
  onBookingViewChange,
  filteredBookings = [],
  // Sort Options
  sortKey = 'submitted_date',
  sortDirection = 'desc',
  onSortingChange,
  isLoading = false,
  validationErrors = [],
  validationWarnings = [],
  className
}: FilterPanelProps) {
  const [isExpanded, setIsExpanded] = useState(true)

  const statusOptions = [
    { value: 'pending', label: 'Pending', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'approved', label: 'Approved', color: 'bg-green-100 text-green-800' },
    { value: 'rejected', label: 'Rejected', color: 'bg-red-100 text-red-800' },
    { value: 'completed', label: 'Completed', color: 'bg-primary-100 text-primary-800' },
    { value: 'cancelled', label: 'Cancelled', color: 'bg-gray-100 text-gray-800' },
  ]

  // Calculate filter complexity for performance indication
  const filterComplexity = useMemo(() => {
    let complexity = 0
    if (search) complexity += 10
    if (status.length > 0) complexity += status.length * 5
    if (startDate || endDate) complexity += 15
    if (roomIds.length > 0) complexity += roomIds.length * 3
    if (bookingType !== 'all') complexity += 5

    return Math.min(complexity, 100)
  }, [search, status, startDate, endDate, roomIds, bookingType])

  const getComplexityColor = (complexity: number) => {
    if (complexity < 30) return 'text-green-600'
    if (complexity < 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getComplexityLabel = (complexity: number) => {
    if (complexity < 30) return 'Ringan'
    if (complexity < 60) return 'Sedang'
    return 'Berat'
  }

  const handleStatusChange = (value: string) => {
    if (value === 'all') {
      onStatusChange([])
    } else {
      const newStatus = status.includes(value)
        ? status.filter(s => s !== value)
        : [...status, value]
      onStatusChange(newStatus)
    }
  }

  const handleRoomChange = (value: string) => {
    if (value === 'all') {
      onRoomIdsChange([])
    } else {
      const newRoomIds = roomIds.includes(value)
        ? roomIds.filter(id => id !== value)
        : [...roomIds, value]
      onRoomIdsChange(newRoomIds)
    }
  }

  const hasActiveFilters = search || status.length > 0 || startDate || endDate || roomIds.length > 0 || bookingType !== 'all'

  const activeFilterCount = [
    search ? 1 : 0,
    status.length,
    (startDate || endDate) ? 1 : 0,
    roomIds.length,
    bookingType !== 'all' ? 1 : 0
  ].reduce((a, b) => a + b, 0)

  const isDefaultSorting = sortKey === 'submitted_date' && sortDirection === 'desc'

  return (
    <Card className={cn("mb-6 bg-card backdrop-blur-sm border", className)}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Sliders className="w-5 h-5 text-primary" />
              <CardTitle className="text-lg">Data Controls</CardTitle>
            </div>
            {hasActiveFilters && (
              <Badge variant="secondary" className="flex items-center gap-1 text-xs">
                <CheckCircle className="w-3 h-3" />
                {activeFilterCount} active
              </Badge>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-1"
          >
            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </div>
      </CardHeader>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <CardContent className="space-y-4">
              {/* Validation Messages */}
              {(validationErrors.length > 0 || validationWarnings.length > 0) && (
                <div className="space-y-2">
                  {validationErrors.map((error, index) => (
                    <Alert key={`error-${index}`} variant="destructive" className="text-sm">
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  ))}
                  {validationWarnings.map((warning, index) => (
                    <Alert key={`warning-${index}`} className="border-yellow-200 bg-yellow-50 dark:bg-yellow-900/20">
                      <AlertDescription className="text-yellow-800 dark:text-yellow-200 text-sm">
                        {warning}
                      </AlertDescription>
                    </Alert>
                  ))}
                </div>
              )}

              {/* Compact Top Toolbar - View & Sort */}
              <div className="flex flex-col sm:flex-row gap-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                {/* View Options */}
                {onBookingViewChange && (
                  <div className="flex-1 flex items-center gap-3">
                    <Eye className="w-4 h-4 text-primary flex-shrink-0" />
                    <div className="flex gap-1 bg-white dark:bg-gray-700 p-1 rounded-md border shadow-sm">
                      {[
                        { value: 'all' as const, label: 'All', count: filteredBookings.length },
                        { value: 'room' as const, label: 'Room', count: filteredBookings.filter(b => !b.is_tour).length },
                        { value: 'tour' as const, label: 'Tour', count: filteredBookings.filter(b => !!b.is_tour).length }
                      ].map((view) => (
                        <Button
                          key={view.value}
                          variant={bookingView === view.value ? 'default' : 'ghost'}
                          size="sm"
                          onClick={() => onBookingViewChange(view.value)}
                          className="text-xs px-2 py-1 h-7 transition-all"
                        >
                          {view.label} ({view.count})
                        </Button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Sort Options */}
                {onSortingChange && (
                  <div className="flex items-center gap-3">
                    <ArrowUpDown className="w-4 h-4 text-primary flex-shrink-0" />
                    <div className="flex items-center gap-2">
                      <Select
                        value={`${sortKey}-${sortDirection}`}
                        onValueChange={(value) => {
                          const [key, dir] = value.split('-')
                          onSortingChange(key, dir as 'asc' | 'desc')
                        }}
                      >
                        <SelectTrigger className="h-8 w-48">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="submitted_date-desc">Submit Date ↓</SelectItem>
                          <SelectItem value="reservation_date-desc">Reservation ↓</SelectItem>
                          <SelectItem value="accepted_date-desc">Accepted Date ↓</SelectItem>
                          <SelectItem value="status-desc">Status ↓</SelectItem>
                          <SelectItem value="submitted_date-asc">Submit Date ↑</SelectItem>
                          <SelectItem value="reservation_date-asc">Reservation ↑</SelectItem>
                          <SelectItem value="accepted_date-asc">Accepted Date ↑</SelectItem>
                          <SelectItem value="status-asc">Status ↑</SelectItem>
                        </SelectContent>
                      </Select>
                      {!isDefaultSorting && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onSortingChange('submitted_date', 'desc')}
                          className="h-8 px-2"
                        >
                          <RotateCcw className="w-3 h-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Compact Three-Column Layout - Search | Status | Date */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Search */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-sm">
                    <Search className="w-4 h-4" />
                    Search
                  </Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Events, users, rooms..."
                      value={search}
                      onChange={(e) => onSearchChange(e.target.value)}
                      className="pl-9 h-9"
                    />
                    {search && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onSearchChange('')}
                        className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6 p-0"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>

                {/* Status */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-sm">
                    <div className="w-3 h-3 rounded-full bg-gray-400 flex-shrink-0" />
                    Status
                  </Label>
                  <Select
                    value={status.length === 0 ? "all" : "multiple"}
                    onValueChange={handleStatusChange}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="All statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      {statusOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          <div className="flex items-center gap-2">
                            <div className={cn("w-2 h-2 rounded-full", option.color)} />
                            {option.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Date Range - Next to Status */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-sm">
                    <Calendar className="w-4 h-4" />
                    Tanggal
                  </Label>
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <Input
                        type="date"
                        value={startDate ? format(startDate, 'yyyy-MM-dd') : ''}
                        onChange={(e) => onStartDateChange(e.target.value ? new Date(e.target.value) : undefined)}
                        className="h-9 text-xs"
                      />
                      <Label className="text-xs text-muted-foreground mt-1 block">Awal</Label>
                    </div>
                    <div className="flex-1">
                      <Input
                        type="date"
                        value={endDate ? format(endDate, 'yyyy-MM-dd') : ''}
                        onChange={(e) => onEndDateChange(e.target.value ? new Date(e.target.value) : undefined)}
                        className="h-9 text-xs"
                      />
                      <Label className="text-xs text-muted-foreground mt-1 block">Akhir</Label>
                    </div>
                  </div>
                </div>
              </div>

              {/* Separate Row for Rooms - appears after date */}
              {(bookingView === 'all' || bookingView === 'room') && (
                <div className="max-w-sm">
                  <Label className="flex items-center gap-2 text-sm">
                    <Building className="w-4 h-4" />
                    Rooms
                  </Label>
                  <Select
                    value={roomIds.length === 0 ? "all" : "multiple"}
                    onValueChange={handleRoomChange}
                  >
                    <SelectTrigger className="h-9 w-full">
                      <SelectValue placeholder="All rooms" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Rooms</SelectItem>
                      {rooms.map((room) => (
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

              {/* Status Tags (if any active) */}
              {status.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {status.map((s) => {
                    const option = statusOptions.find(opt => opt.value === s)
                    return option ? (
                      <Badge
                        key={s}
                        variant="secondary"
                        className={cn("flex items-center gap-1 text-xs", option.color)}
                      >
                        {option.label}
                        <button
                          onClick={() => handleStatusChange(s)}
                          className="hover:text-destructive ml-1"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ) : null
                  })}
                </div>
              )}

              {/* Active Room Tags */}
              {roomIds.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {roomIds.map((id) => {
                    const room = rooms.find(r => r.id === id)
                    return room ? (
                      <Badge
                        key={id}
                        variant="outline"
                        className="flex items-center gap-1 text-xs bg-green-50 text-green-700 border-green-200"
                      >
                        <Building className="w-3 h-3" />
                        {room.name}
                        <button
                          onClick={() => handleRoomChange(id)}
                          className="hover:text-red-600 ml-1"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ) : null
                  })}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row justify-end gap-2 pt-2">
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={onClearFilters}
                    disabled={!hasActiveFilters || isLoading}
                    size="sm"
                    className="h-8"
                  >
                    <RotateCcw className="w-3 h-3 mr-2" />
                    Clear All
                  </Button>
                  <Button
                    onClick={onApplyFilters}
                    disabled={isLoading || validationErrors.length > 0}
                    size="sm"
                    className="h-8 px-4"
                  >
                    {isLoading ? (
                      <>
                        <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin mr-2" />
                        Applying...
                      </>
                    ) : (
                      'Apply Filters'
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  )
}
