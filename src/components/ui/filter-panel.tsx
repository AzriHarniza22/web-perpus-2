"use client"

import * as React from "react"
import { ChevronDown, ChevronUp, Search, X } from "lucide-react"
import { DateRange } from "react-day-picker"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { DateRangePicker } from "@/components/ui/date-range-picker"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface Room {
  id: string
  name: string
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
}

export function FilterPanel({
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
}: FilterPanelProps) {
  const [isExpanded, setIsExpanded] = React.useState(true)

  const statusOptions = [
    { value: "pending", label: "Pending" },
    { value: "approved", label: "Approved" },
    { value: "rejected", label: "Rejected" },
    { value: "completed", label: "Completed" },
    { value: "cancelled", label: "Cancelled" },
  ]

  const handleStatusChange = (value: string) => {
    if (value === "all") {
      onStatusChange([])
    } else {
      const newStatus = status.includes(value)
        ? status.filter(s => s !== value)
        : [...status, value]
      onStatusChange(newStatus)
    }
  }

  const handleRoomChange = (value: string) => {
    if (value === "all") {
      onRoomIdsChange([])
    } else {
      const newRoomIds = roomIds.includes(value)
        ? roomIds.filter(id => id !== value)
        : [...roomIds, value]
      onRoomIdsChange(newRoomIds)
    }
  }

  const hasActiveFilters = search || status.length > 0 || dateRange || roomIds.length > 0 || bookingType !== 'all'

  return (
    <Card className="mb-6">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Filters</CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="space-y-4">
          {/* Search Input */}
          <div className="space-y-2">
            <Label htmlFor="search">Search</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="search"
                placeholder="Search by event, user, or room..."
                value={search}
                onChange={(e) => onSearchChange(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Booking Type Filter */}
            {onBookingTypeChange && (
              <div className="space-y-2">
                <Label>Booking Type</Label>
                <Select value={bookingType} onValueChange={onBookingTypeChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="All bookings" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Bookings</SelectItem>
                    <SelectItem value="room">Room Bookings</SelectItem>
                    <SelectItem value="tour">Tour Bookings</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Status Filter */}
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={status.length === 0 ? "all" : "multiple"} onValueChange={handleStatusChange}>
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  {statusOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {status.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {status.map((s) => (
                    <span
                      key={s}
                      className="inline-flex items-center px-2 py-1 rounded-md text-xs bg-secondary text-secondary-foreground"
                    >
                      {statusOptions.find(opt => opt.value === s)?.label}
                      <button
                        onClick={() => handleStatusChange(s)}
                        className="ml-1 hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Date Range Filter */}
            <div className="space-y-2">
              <Label>Date Range</Label>
              <DateRangePicker
                date={dateRange}
                onDateChange={onDateRangeChange}
                placeholder="Select date range"
              />
            </div>

            {/* Room Filter */}
            <div className="space-y-2">
              <Label>Room</Label>
              <Select value={roomIds.length === 0 ? "all" : "multiple"} onValueChange={handleRoomChange}>
                <SelectTrigger>
                  <SelectValue placeholder="All rooms" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Rooms</SelectItem>
                  {rooms.map((room) => (
                    <SelectItem key={room.id} value={room.id}>
                      {room.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {roomIds.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {roomIds.map((id) => {
                    const room = rooms.find(r => r.id === id)
                    return (
                      <span
                        key={id}
                        className="inline-flex items-center px-2 py-1 rounded-md text-xs bg-secondary text-secondary-foreground"
                      >
                        {room?.name}
                        <button
                          onClick={() => handleRoomChange(id)}
                          className="ml-1 hover:text-destructive"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between pt-4">
            <Button
              variant="outline"
              onClick={onClearFilters}
              disabled={!hasActiveFilters}
            >
              Clear All Filters
            </Button>
            <Button onClick={onApplyFilters}>
              Apply Filters
            </Button>
          </div>
        </CardContent>
      )}
    </Card>
  )
}