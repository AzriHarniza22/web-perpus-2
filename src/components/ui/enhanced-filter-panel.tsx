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
  Clock,
  RotateCcw
} from 'lucide-react'
import { DateRange } from 'react-day-picker'
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
import { DateRangePicker } from '@/components/ui/date-range-picker'
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
  dateRange: DateRange | undefined
  onDateRangeChange: (range: DateRange | undefined) => void
  roomIds: string[]
  onRoomIdsChange: (ids: string[]) => void
  rooms: Room[]
  onClearFilters: () => void
  onApplyFilters: () => void
  bookingType?: 'all' | 'room' | 'tour'
  onBookingTypeChange?: (type: 'all' | 'room' | 'tour') => void
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
  dateRange,
  onDateRangeChange,
  roomIds,
  onRoomIdsChange,
  rooms,
  onClearFilters,
  onApplyFilters,
  bookingType = 'all',
  onBookingTypeChange,
  isLoading = false,
  validationErrors = [],
  validationWarnings = [],
  className
}: FilterPanelProps) {
  const [isExpanded, setIsExpanded] = useState(true)
  const [showAdvanced, setShowAdvanced] = useState(false)

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
    if (dateRange) complexity += 15
    if (roomIds.length > 0) complexity += roomIds.length * 3
    if (bookingType !== 'all') complexity += 5

    return Math.min(complexity, 100)
  }, [search, status, dateRange, roomIds, bookingType])

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

  const hasActiveFilters = search || status.length > 0 || dateRange || roomIds.length > 0 || bookingType !== 'all'

  const activeFilterCount = [
    search ? 1 : 0,
    status.length,
    dateRange ? 1 : 0,
    roomIds.length,
    bookingType !== 'all' ? 1 : 0
  ].reduce((a, b) => a + b, 0)

  return (
    <Card className={cn("mb-6 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border-2", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-primary dark:text-primary-400" />
              <CardTitle className="text-lg">Filter Analytics</CardTitle>
            </div>

            {/* Filter Status Indicators */}
            <div className="flex items-center gap-2">
              {hasActiveFilters && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" />
                  {activeFilterCount} Aktif
                </Badge>
              )}

              {filterComplexity > 0 && (
                <Badge
                  variant="outline"
                  className={cn("text-xs", getComplexityColor(filterComplexity))}
                >
                  Kompleksitas: {getComplexityLabel(filterComplexity)}
                </Badge>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Performance Indicator */}
            {filterComplexity > 20 && (
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={cn(
                      "h-full transition-all duration-300",
                      filterComplexity < 30 ? "bg-green-500" :
                      filterComplexity < 60 ? "bg-yellow-500" : "bg-red-500"
                    )}
                    style={{ width: `${filterComplexity}%` }}
                  />
                </div>
              </div>
            )}

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex items-center gap-1"
            >
              {isExpanded ? (
                <>
                  <ChevronUp className="h-4 w-4" />
                  <span className="hidden sm:inline">Sembunyikan</span>
                </>
              ) : (
                <>
                  <ChevronDown className="h-4 w-4" />
                  <span className="hidden sm:inline">Tampilkan</span>
                </>
              )}
            </Button>
          </div>
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
            <CardContent className="space-y-6">
              {/* Validation Messages */}
              {(validationErrors.length > 0 || validationWarnings.length > 0) && (
                <div className="space-y-2">
                  {validationErrors.map((error, index) => (
                    <Alert key={`error-${index}`} variant="destructive">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  ))}
                  {validationWarnings.map((warning, index) => (
                    <Alert key={`warning-${index}`} className="border-yellow-200 bg-yellow-50 dark:bg-yellow-900/20">
                      <Info className="h-4 w-4 text-yellow-600" />
                      <AlertDescription className="text-yellow-800 dark:text-yellow-200">
                        {warning}
                      </AlertDescription>
                    </Alert>
                  ))}
                </div>
              )}

              {/* Quick Filters */}
              <div className="space-y-3">
                <Label className="text-sm font-medium flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Filter Cepat
                </Label>
                <div className="flex flex-wrap gap-2">
                  {quickFilters.map((filter) => (
                    <Button
                      key={filter.key}
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        // This would need to be handled by parent component
                        // For now, just clear date range
                        onDateRangeChange(undefined)
                      }}
                      className={cn(
                        "flex items-center gap-1.5 transition-all duration-200",
                        "hover:scale-105"
                      )}
                    >
                      {filter.icon}
                      {filter.label}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Main Filters */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Search and Booking Type */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="search" className="flex items-center gap-2">
                      <Search className="w-4 h-4" />
                      Pencarian
                    </Label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="search"
                        placeholder="Cari berdasarkan event, pengguna, atau ruangan..."
                        value={search}
                        onChange={(e) => onSearchChange(e.target.value)}
                        className="pl-9"
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

                  {onBookingTypeChange && (
                    <div className="space-y-2">
                      <Label>Tipe Booking</Label>
                      <Select value={bookingType} onValueChange={onBookingTypeChange}>
                        <SelectTrigger>
                          <SelectValue placeholder="Semua booking" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Semua Booking</SelectItem>
                          <SelectItem value="room">Booking Ruangan</SelectItem>
                          <SelectItem value="tour">Booking Tour</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>

                {/* Status and Date Range */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-gray-400" />
                      Status
                    </Label>
                    <Select
                      value={status.length === 0 ? "all" : "multiple"}
                      onValueChange={handleStatusChange}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Semua status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Semua Status</SelectItem>
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

                    {/* Active Status Tags */}
                    {status.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {status.map((s) => {
                          const option = statusOptions.find(opt => opt.value === s)
                          return (
                            <Badge
                              key={s}
                              variant="secondary"
                              className={cn("flex items-center gap-1", option?.color)}
                            >
                              {option?.label}
                              <button
                                onClick={() => handleStatusChange(s)}
                                className="hover:text-destructive"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </Badge>
                          )
                        })}
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      Rentang Tanggal
                    </Label>
                    <DateRangePicker
                      date={dateRange}
                      onDateChange={onDateRangeChange}
                      placeholder="Pilih rentang tanggal"
                    />
                  </div>
                </div>
              </div>

              {/* Room Selection */}
              <div className="space-y-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="flex items-center gap-2"
                >
                  <Building className="w-4 h-4" />
                  Filter Ruangan Lanjutan
                  {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </Button>

                {showAdvanced && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="space-y-3 overflow-hidden"
                  >
                  <div className="space-y-2">
                    <Label>Pilih Ruangan</Label>
                    <Select
                      value={roomIds.length === 0 ? "all" : "multiple"}
                      onValueChange={handleRoomChange}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Semua ruangan" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Semua Ruangan</SelectItem>
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

                    {/* Active Room Tags */}
                    {roomIds.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {roomIds.map((id) => {
                          const room = rooms.find(r => r.id === id)
                          return (
                            <Badge
                              key={id}
                              variant="outline"
                              className="flex items-center gap-1 bg-green-50 text-green-700 border-green-200"
                            >
                              <Building className="w-3 h-3" />
                              {room?.name || id}
                              <button
                                onClick={() => handleRoomChange(id)}
                                className="hover:text-red-600"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </Badge>
                          )
                        })}
                      </div>
                    )}
                  </div>
                  </motion.div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row justify-between gap-3 pt-4 border-t">
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={onClearFilters}
                    disabled={!hasActiveFilters || isLoading}
                    className="flex items-center gap-2"
                  >
                    <RotateCcw className="w-4 h-4" />
                    Bersihkan Semua
                  </Button>

                  {hasActiveFilters && (
                    <Badge variant="outline" className="flex items-center gap-1 self-center">
                      <span className="text-xs">{activeFilterCount} filter aktif</span>
                    </Badge>
                  )}
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setIsExpanded(false)}
                    disabled={isLoading}
                  >
                    Batal
                  </Button>
                  <Button
                    onClick={onApplyFilters}
                    disabled={isLoading || validationErrors.length > 0}
                    className="min-w-24"
                  >
                    {isLoading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                        Memproses...
                      </>
                    ) : (
                      'Terapkan Filter'
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