'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { motion } from 'framer-motion'
import { CalendarIcon, Clock } from 'lucide-react'
import { Calendar as UICalendar } from '@/components/ui/calendar'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { Booking } from '@/lib/api'

interface ReservationCalendarCardProps {
  existingBookings: Booking[]
  selectedDate?: Date
  onDateSelect?: (date: Date | undefined) => void
}

export default function ReservationCalendarCard({
  existingBookings,
  selectedDate,
  onDateSelect
}: ReservationCalendarCardProps) {
  const [internalSelectedDate, setInternalSelectedDate] = useState<Date | undefined>(selectedDate || new Date())

  // Use external selectedDate if provided, otherwise use internal state
  const currentSelectedDate = selectedDate !== undefined ? selectedDate : internalSelectedDate

  const handleDateSelect = (date: Date | undefined) => {
    setInternalSelectedDate(date)
    onDateSelect?.(date)
  }

  const getBookedTimes = (date: Date) => {
    const now = new Date()

    return existingBookings
      .filter(booking => {
        const bookingDate = new Date(booking.start_time)
        // Only show future bookings or active bookings (same logic as InteractiveCalendar)
        return bookingDate.toDateString() === date.toDateString() &&
               booking.status !== 'rejected' &&
               (bookingDate >= now || booking.status === 'pending' || booking.status === 'approved')
      })
      .map(booking => ({
        start: new Date(booking.start_time),
        end: new Date(booking.end_time),
        status: booking.status,
      }))
  }

  const getBookedDates = () => {
    const now = new Date()
    const futureBookings = existingBookings.filter(booking => {
      const bookingDate = new Date(booking.start_time)
      // Only include future bookings or active bookings (same logic as InteractiveCalendar)
      return bookingDate >= now || booking.status === 'pending' || booking.status === 'approved'
    })

    const dates = new Set<string>()
    futureBookings.forEach(booking => {
      const date = new Date(booking.start_time).toDateString()
      dates.add(date)
    })
    return Array.from(dates).map(date => new Date(date))
  }

  const getDateStatus = (date: Date) => {
    const now = new Date()
    const bookingsOnDate = existingBookings.filter(booking => {
      const bookingDate = new Date(booking.start_time)
      // Only include future bookings or active bookings (same logic as InteractiveCalendar)
      return bookingDate.toDateString() === date.toDateString() &&
             (bookingDate >= now || booking.status === 'pending' || booking.status === 'approved')
    })

    if (bookingsOnDate.some(b => b.status === 'approved')) return 'approved'
    if (bookingsOnDate.some(b => b.status === 'pending')) return 'pending'
    return null
  }

  const isToday = (date: Date) => {
    const today = new Date()
    return date.toDateString() === today.toDateString()
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="h-full bg-card backdrop-blur-sm hover:shadow-xl transition-all duration-300 relative overflow-hidden group flex flex-col">
        {/* Background Gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary-50/50 via-indigo-50/30 to-secondary-50/50 dark:from-primary-900/20 dark:via-indigo-900/20 dark:to-secondary-900/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        <CardHeader className="relative z-10 flex-shrink-0">
          <CardTitle className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
              <CalendarIcon className="w-5 h-5 text-white" />
            </div>
            <span className="bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent">
              Pilih Tanggal
            </span>
          </CardTitle>
          <CardDescription className="text-gray-600 dark:text-gray-300 text-sm">
            Pilih tanggal yang diinginkan untuk reservasi
          </CardDescription>
        </CardHeader>

        <CardContent className="relative z-10 flex-1 overflow-y-auto">
          <div className="space-y-3">
            <div className="flex-shrink-0">
              <Label htmlFor="date" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Tanggal Reservasi
              </Label>
              <div className="mt-2">
                <UICalendar
                  mode="single"
                  selected={currentSelectedDate}
                  onSelect={handleDateSelect}
                  disabled={(date: Date) => {
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    return date < today;
                  }}
                  modifiers={{
                    booked: getBookedDates(),
                    approved: getBookedDates().filter(date => getDateStatus(date) === 'approved'),
                    pending: getBookedDates().filter(date => getDateStatus(date) === 'pending'),
                    today: (date) => isToday(date)
                  }}
                  modifiersStyles={{
                    approved: {
                      backgroundColor: 'rgb(254 202 202)', // red-200
                      color: 'rgb(153 27 27)', // red-800
                      fontWeight: 'bold'
                    },
                    pending: {
                      backgroundColor: 'rgb(254 240 138)', // yellow-200
                      color: 'rgb(133 77 14)', // yellow-800
                      fontWeight: 'bold'
                    },
                    today: {
                      backgroundColor: 'var(--primary)',
                      color: 'white',
                      fontWeight: 'bold'
                    }
                  }}
                  className="rounded-md border shadow-sm [&_.rdp-day_button:hover]:hover:bg-gray-100 [&_.rdp-months]:space-y-2 [&_.rdp-month]:space-y-2 [&_.rdp-table]:text-sm"
                />
              </div>
            </div>

            {currentSelectedDate && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-2.5 flex-shrink-0"
              >
                <h4 className="font-medium text-gray-900 dark:text-white mb-2 flex items-center text-sm">
                  <Clock className="w-4 h-4 mr-2 text-primary flex-shrink-0" />
                  <span className="truncate">Waktu dipesan {format(currentSelectedDate, 'dd/MM')}:</span>
                </h4>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {getBookedTimes(currentSelectedDate).slice(0, 4).map((time, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className={`flex items-center gap-2 text-xs px-2 py-1.5 rounded-md ${
                        time.status === 'approved'
                          ? 'text-red-600 bg-red-50 dark:bg-red-900/20'
                          : 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20'
                      }`}
                    >
                      <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                        time.status === 'approved' ? 'bg-red-500' : 'bg-yellow-500'
                      }`}></div>
                      <span className="truncate">{format(time.start, 'HH:mm')} - {format(time.end, 'HH:mm')}</span>
                    </motion.div>
                  ))}
                  {getBookedTimes(currentSelectedDate).length > 4 && (
                    <div className="text-xs text-gray-500 dark:text-gray-400 px-2 py-1">
                      +{getBookedTimes(currentSelectedDate).length - 4} lagi
                    </div>
                  )}
                  {getBookedTimes(currentSelectedDate).length === 0 && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex items-center gap-2 text-xs text-green-600 bg-green-50 dark:bg-green-900/20 px-2 py-1.5 rounded-md"
                    >
                      <div className="w-1.5 h-1.5 bg-green-500 rounded-full flex-shrink-0"></div>
                      Tidak ada pemesanan
                    </motion.div>
                  )}
                </div>
              </motion.div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}