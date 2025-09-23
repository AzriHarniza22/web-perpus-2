'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Calendar } from '@/components/ui/calendar'
import { useBookings } from '@/lib/api'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'
import type { AuthChangeEvent, Session, User } from '@supabase/supabase-js'

export default function HomePage() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())
  const { data: bookings } = useBookings()

  const bookedDates = bookings ? [...new Set(bookings.map(b => new Date(b.start_time).toDateString()))].map(d => new Date(d)) : []

  const getBookedTimes = (date: Date) => {
    return bookings ? bookings.filter(booking => {
      const bookingDate = new Date(booking.start_time)
      return bookingDate.toDateString() === date.toDateString()
    }).map(booking => ({
      start: new Date(booking.start_time),
      end: new Date(booking.end_time),
      room: booking.rooms?.name,
      status: booking.status
    })) : []
  }

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      setLoading(false)
    }

    getUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event: AuthChangeEvent, session: Session | null) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">Loading...</div>
      </div>
    )
  }

  if (user) {
    // User is logged in - show dashboard
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-6xl mx-auto px-4">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Selamat Datang, {user.user_metadata?.full_name || user.email}
            </h1>
            <p className="text-gray-600">Kelola reservasi ruangan Anda</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardHeader>
                <CardTitle>Reservasi Baru</CardTitle>
                <CardDescription>Pesan ruangan untuk acara Anda</CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={() => router.push('/book')}
                  className="w-full"
                >
                  Pesan Ruangan
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Riwayat Reservasi</CardTitle>
                <CardDescription>Lihat reservasi Anda sebelumnya</CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={() => router.push('/history')}
                  variant="outline"
                  className="w-full"
                >
                  Lihat Riwayat
                </Button>
              </CardContent>
            </Card>

            {user.user_metadata?.role === 'admin' && (
              <Card>
                <CardHeader>
                  <CardTitle>Panel Admin</CardTitle>
                  <CardDescription>Kelola sistem reservasi</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    onClick={() => router.push('/admin')}
                    variant="outline"
                    className="w-full"
                  >
                    Admin Panel
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>

          <div className="text-center">
            <Button
              onClick={() => supabase.auth.signOut()}
              variant="outline"
            >
              Keluar
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // User is not logged in - show landing page
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <h1 className="text-5xl font-bold text-gray-900 mb-6">
          Reservasi Ruangan Perpustakaan Wilayah Aceh
        </h1>
        <p className="text-xl text-gray-600 mb-12 max-w-2xl mx-auto">
          Sistem reservasi ruangan modern untuk perpustakaan wilayah Aceh.
          Pesan ruangan dengan mudah dan cepat untuk kebutuhan belajar dan berkumpul Anda.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            onClick={() => router.push('/register')}
            className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            Daftar Akun
          </Button>
          <Button
            onClick={() => router.push('/login')}
            variant="outline"
            className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold border-2 border-blue-600 hover:bg-blue-50 transition-colors"
          >
            Masuk
          </Button>
        </div>
        <div className="mt-12 flex justify-center">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={setSelectedDate}
            modifiers={{ booked: bookedDates }}
            locale={id}
          />
          {selectedDate && (
            <div className="mt-4 text-left">
              <h4 className="font-medium mb-2">Booked times for {format(selectedDate, 'PPP', { locale: id })}:</h4>
              <div className="space-y-1">
                {getBookedTimes(selectedDate).map((time, index) => (
                  <div key={index} className="text-sm text-red-600">
                    {format(time.start, 'HH:mm')} - {format(time.end, 'HH:mm')} ({time.room}) - {time.status}
                  </div>
                ))}
                {getBookedTimes(selectedDate).length === 0 && (
                  <p className="text-sm text-green-600">No bookings for this date</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
