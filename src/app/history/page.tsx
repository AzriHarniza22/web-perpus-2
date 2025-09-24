import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface BookingWithRoom {
  id: string
  start_time: string
  end_time: string
  status: string
  event_description?: string
  notes?: string
  created_at: string
  rooms?: { name: string }
}

export default async function HistoryPage() {
  const cookieStore = await cookies()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options)
          })
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Get user bookings
  const { data: bookings } = await supabase
    .from('bookings')
    .select(`
      *,
      rooms:room_id (
        name
      )
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-xl font-semibold">Perpustakaan Aceh</h1>
          <div className="flex items-center space-x-4">
            <Link href="/dashboard" className="text-blue-600 hover:underline">
              Kembali ke Dashboard
            </Link>
            <form action="/auth/signout" method="post">
              <button type="submit" className="text-blue-600 hover:underline">
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Riwayat Reservasi
          </h1>
          <p className="text-gray-600">
            Lihat semua reservasi yang telah Anda buat
          </p>
        </div>

        <div className="space-y-4">
          {bookings && bookings.length > 0 ? (
            bookings.map((booking: BookingWithRoom) => (
              <Card key={booking.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{booking.rooms?.name}</CardTitle>
                      <CardDescription>
                        {new Date(booking.start_time).toLocaleDateString('id-ID')} {' '}
                        {new Date(booking.start_time).toLocaleTimeString('id-ID')} - {' '}
                        {new Date(booking.end_time).toLocaleTimeString('id-ID')}
                      </CardDescription>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                      booking.status === 'approved' ? 'bg-green-100 text-green-800' :
                      booking.status === 'rejected' ? 'bg-red-100 text-red-800' :
                      booking.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {booking.status === 'approved' ? 'Disetujui' :
                       booking.status === 'rejected' ? 'Ditolak' :
                       booking.status === 'completed' ? 'Selesai' :
                       booking.status === 'cancelled' ? 'Dibatalkan' :
                       'Menunggu'}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {booking.event_description && (
                    <p className="text-sm text-gray-600 mb-2">
                      <strong>Acara:</strong> {booking.event_description}
                    </p>
                  )}
                  {booking.notes && (
                    <p className="text-sm text-gray-600">
                      <strong>Catatan:</strong> {booking.notes}
                    </p>
                  )}
                  <p className="text-xs text-gray-500 mt-2">
                    Diajukan pada: {new Date(booking.created_at).toLocaleString('id-ID')}
                  </p>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="py-8">
                <p className="text-center text-gray-500">
                  Anda belum memiliki reservasi
                </p>
                <div className="text-center mt-4">
                  <Link
                    href="/"
                    className="inline-block bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"
                  >
                    Buat Reservasi Baru
                  </Link>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  )
}