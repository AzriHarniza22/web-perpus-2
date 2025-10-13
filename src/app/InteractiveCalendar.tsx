'use client'

import { useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

// Interactive Calendar Component
const InteractiveCalendar = ({
  bookings = [],
  selectedDate: externalSelectedDate,
  onDateSelect
}: {
  bookings?: Array<{ start_time: string; end_time: string; rooms?: { name: string }; status: string; is_tour?: boolean; profiles?: { full_name?: string; email?: string } }>
  selectedDate?: Date
  onDateSelect?: (date: Date) => void
}) => {
  const [internalSelectedDate, setInternalSelectedDate] = useState(new Date())
  const [currentMonth, setCurrentMonth] = useState(new Date())

  useEffect(() => {
    if (externalSelectedDate !== undefined) {
      setInternalSelectedDate(externalSelectedDate)
    }
  }, [externalSelectedDate])

  const selectedDate = internalSelectedDate

  const handleDateSelect = (date: Date) => {
    setInternalSelectedDate(date)
    onDateSelect?.(date)
  }

  const getBookedTimes = (date: Date) => {
    const now = new Date()

    return bookings.filter(booking => {
      const bookingDate = new Date(booking.start_time)
      // Only show upcoming bookings (start_time >= today) with approved or pending status
      return bookingDate.toDateString() === date.toDateString() &&
             bookingDate >= now &&
             (booking.status === 'approved' || booking.status === 'pending')
    }).map(booking => ({
      start: new Date(booking.start_time),
      end: new Date(booking.end_time),
      room: booking.rooms?.name,
      status: booking.status,
      isTour: booking.is_tour || false
    }))
  }

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const startDate = new Date(firstDay)
    startDate.setDate(startDate.getDate() - firstDay.getDay())

    const days = []
    const currentDate = new Date(startDate)

    for (let i = 0; i < 42; i++) {
      days.push(new Date(currentDate))
      currentDate.setDate(currentDate.getDate() + 1)
    }

    return days
  }

  const isToday = (date: Date) => {
    const today = new Date()
    return date.toDateString() === today.toDateString()
  }

  const getDateStatus = (date: Date) => {
    const now = new Date()
    const bookingsOnDate = bookings.filter(booking => {
      const bookingDate = new Date(booking.start_time)
      // Only include upcoming bookings (start_time >= today) with approved or pending status
      return bookingDate.toDateString() === date.toDateString() &&
             bookingDate >= now &&
             (booking.status === 'approved' || booking.status === 'pending')
    })

    if (bookingsOnDate.some(b => b.status === 'approved')) return 'approved'
    if (bookingsOnDate.some(b => b.status === 'pending')) return 'pending'
    return null
  }

  const isSameMonth = (date: Date) => {
    return date.getMonth() === currentMonth.getMonth()
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))
  }

  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))
  }

  const days = getDaysInMonth(currentMonth)
  const monthNames = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ]

  return (
    <div className="bg-background/20 backdrop-blur-xl rounded-3xl p-6 border border-background/30 shadow-2xl">
      {/* Calendar Header */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={prevMonth}
          className="p-2 rounded-full bg-background/30 hover:bg-background/40 transition-all calendar-button"
        >
          <ChevronLeft size={20} className="text-gray-700" />
        </button>

        <h3 className="text-xl font-bold text-gray-800">
          {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
        </h3>

        <button
          onClick={nextMonth}
          className="p-2 rounded-full bg-background/30 hover:bg-background/40 transition-all calendar-button"
        >
          <ChevronRight size={20} className="text-gray-700" />
        </button>
      </div>

      {/* Days of week */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'].map(day => (
          <div key={day} className="p-2 text-center text-sm font-medium text-gray-600">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Days */}
      <div className="grid grid-cols-7 gap-1 mb-6">
        {days.map((day, index) => {
          const isCurrentMonth = isSameMonth(day)
          const isTodayDate = isToday(day)
          const dateStatus = getDateStatus(day)
          const isSelected = selectedDate.toDateString() === day.toDateString()

          const hoverStyles = { scale: 1.1 }

          return (
            <button
              key={index}
              onClick={() => handleDateSelect(day)}
              className={`
                relative p-2 text-sm rounded-lg calendar-button
                ${!isCurrentMonth ? 'text-gray-400' : 'text-gray-700'}
                ${dateStatus === 'approved' && !isTodayDate ? `bg-red-100 text-red-600 ${isSelected ? 'ring-2 ring-red-200' : ''}` : ''}
                ${dateStatus === 'pending' && !isTodayDate ? `bg-yellow-100 text-yellow-600 ${isSelected ? 'ring-2 ring-yellow-200' : ''}` : ''}
                ${isTodayDate ? 'bg-primary text-white font-bold' : ''}
                ${isSelected ? 'bg-blue-500 text-white' : ''}
              `}
            >
              {day.getDate()}
              {dateStatus && (
                <div className={`absolute top-1 right-1 w-2 h-2 rounded-full ${dateStatus === 'approved' ? 'bg-red-400' : 'bg-yellow-400'}`}></div>
              )}
            </button>
          )
        })}
      </div>

      {/* Selected Date Info */}
      <div
        key={selectedDate.toDateString()}
        className="bg-background/30 rounded-2xl p-4 fade-in-up"
      >
        <h4 className="font-bold text-gray-800 mb-3">
          📅 {formatDate(selectedDate)}
        </h4>

        <div className="space-y-2 max-h-32 overflow-y-auto">
          {getBookedTimes(selectedDate).length > 0 ? (
            getBookedTimes(selectedDate).map((booking, index) => (
              <div
                key={index}
                className="p-2 rounded-lg text-sm fade-in-left"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className={`${
                  booking.status === 'approved'
                    ? 'bg-red-100 text-red-800 border-l-4 border-red-400'
                    : 'bg-yellow-100 text-yellow-800 border-l-4 border-yellow-400'
                }`}>
                  <div className="font-medium">
                    {booking.isTour ? '🚌 Tour' : '🏢 Room'}: {booking.room}
                  </div>
                  <div className="text-xs">
                    🕐 {formatTime(booking.start)} - {formatTime(booking.end)}
                  </div>
                  <div className="text-xs capitalize">
                    📋 {booking.status === 'approved' ? 'Disetujui' : 'Menunggu'}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div
              className="text-center py-4 text-gray-600 fade-in"
            >
              <div className="text-2xl mb-2">✨</div>
              <div className="text-sm">Tidak ada booking untuk tanggal ini</div>
              <div className="text-xs text-gray-500 mt-1">Hari yang sempurna untuk reservasi!</div>
            </div>
          )}
        </div>
      </div>

      {/* Legend */}
      <div className="mt-4 flex items-center justify-center gap-4 text-xs">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-primary rounded-full"></div>
          <span className="text-gray-600">Hari ini</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-red-100 border border-red-400 rounded-full"></div>
          <span className="text-gray-600">Disetujui</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-yellow-100 border border-yellow-400 rounded-full"></div>
          <span className="text-gray-600">Menunggu</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-secondary rounded-full"></div>
          <span className="text-gray-600">Dipilih</span>
        </div>
      </div>
    </div>
  )
}

export default InteractiveCalendar