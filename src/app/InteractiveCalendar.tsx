'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { ChevronLeft, ChevronRight } from 'lucide-react'

// Interactive Calendar Component
const InteractiveCalendar = ({ bookings = [] }: { bookings?: Array<{ start_time: string; end_time: string; rooms?: { name: string }; status: string; is_tour?: boolean; profiles?: { full_name?: string; email?: string } }> }) => {
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [currentMonth, setCurrentMonth] = useState(new Date())

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
    <div className="bg-white/20 backdrop-blur-xl rounded-3xl p-6 border border-white/30 shadow-2xl">
      {/* Calendar Header */}
      <div className="flex items-center justify-between mb-6">
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={prevMonth}
          className="p-2 rounded-full bg-white/30 hover:bg-white/40 transition-all"
        >
          <ChevronLeft size={20} className="text-gray-700" />
        </motion.button>

        <h3 className="text-xl font-bold text-gray-800">
          {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
        </h3>

        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={nextMonth}
          className="p-2 rounded-full bg-white/30 hover:bg-white/40 transition-all"
        >
          <ChevronRight size={20} className="text-gray-700" />
        </motion.button>
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

          return (
            <motion.button
              key={index}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setSelectedDate(day)}
              className={`
                relative p-2 text-sm rounded-lg transition-all duration-200
                ${!isCurrentMonth ? 'text-gray-400' : 'text-gray-700'}
                ${isTodayDate ? 'bg-primary text-white font-bold' : ''}
                ${isSelected && !isTodayDate ? 'bg-secondary-500 text-white' : ''}
                ${dateStatus === 'approved' && !isTodayDate && !isSelected ? 'bg-red-100 text-red-600' : ''}
                ${dateStatus === 'pending' && !isTodayDate && !isSelected ? 'bg-yellow-100 text-yellow-600' : ''}
                ${!isTodayDate && !isSelected && !dateStatus && isCurrentMonth ? 'hover:bg-white/40' : ''}
              `}
            >
              {day.getDate()}
              {dateStatus && (
                <div className={`absolute top-1 right-1 w-2 h-2 rounded-full ${dateStatus === 'approved' ? 'bg-red-400' : 'bg-yellow-400'}`}></div>
              )}
            </motion.button>
          )
        })}
      </div>

      {/* Selected Date Info */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        key={selectedDate.toDateString()}
        className="bg-white/30 rounded-2xl p-4"
      >
        <h4 className="font-bold text-gray-800 mb-3">
          📅 {formatDate(selectedDate)}
        </h4>

        <div className="space-y-2 max-h-32 overflow-y-auto">
          {getBookedTimes(selectedDate).length > 0 ? (
            getBookedTimes(selectedDate).map((booking, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`p-2 rounded-lg text-sm ${
                  booking.status === 'approved'
                    ? 'bg-red-100 text-red-800 border-l-4 border-red-400'
                    : 'bg-yellow-100 text-yellow-800 border-l-4 border-yellow-400'
                }`}
              >
                <div className="font-medium">
                  {booking.isTour ? '🚌 Tour' : '🏢 Room'}: {booking.room}
                </div>
                <div className="text-xs">
                  🕐 {formatTime(booking.start)} - {formatTime(booking.end)}
                </div>
                <div className="text-xs capitalize">
                  📋 {booking.status === 'approved' ? 'Disetujui' : 'Menunggu'}
                </div>
              </motion.div>
            ))
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-4 text-gray-600"
            >
              <div className="text-2xl mb-2">✨</div>
              <div className="text-sm">Tidak ada booking untuk tanggal ini</div>
              <div className="text-xs text-gray-500 mt-1">Hari yang sempurna untuk reservasi!</div>
            </motion.div>
          )}
        </div>
      </motion.div>

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