import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import BookingForm from '../../../components/BookingForm'

interface PageProps {
  params: Promise<{
    roomId: string
  }>
}

export default async function BookRoomPage({ params }: PageProps) {
  const { roomId } = await params
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

  // Ensure user profile exists
  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', user.id)
    .single()

  if (!profile) {
    // Create profile if it doesn't exist
    await supabase
      .from('profiles')
      .insert({
        id: user.id,
        email: user.email,
        full_name: user.user_metadata?.full_name || '',
        institution: user.user_metadata?.institution || '',
        phone: user.user_metadata?.phone || '',
      })
  }

  // Get room details
  const { data: room } = await supabase
    .from('rooms')
    .select('*')
    .eq('id', roomId)
    .eq('is_active', true)
    .single()

  if (!room) {
    redirect('/')
  }

  // Get existing bookings for this room
  const { data: bookings } = await supabase
    .from('bookings')
    .select('*')
    .eq('room_id', roomId)
    .in('status', ['approved', 'pending'])

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-xl font-semibold">Perpustakaan Aceh</h1>
          <div className="flex items-center space-x-4">
            <Link href="/" className="text-blue-600 hover:underline">
              Back to Home
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
            Reservasi {room.name}
          </h1>
          <p className="text-gray-600">
            Kapasitas: {room.capacity} orang
          </p>
          {room.description && (
            <p className="text-gray-600 mt-2">{room.description}</p>
          )}
          {room.facilities && room.facilities.length > 0 && (
            <div className="mt-4">
              <h3 className="font-medium mb-2">Fasilitas:</h3>
              <ul className="text-sm text-gray-600">
                {room.facilities.map((facility: string, index: number) => (
                  <li key={index}>• {facility}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
        <BookingForm room={room} existingBookings={bookings || []} />
      </main>
    </div>
  )
}