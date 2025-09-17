import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import RoomManagement from '../../components/admin/RoomManagement'
import BookingManagement from '../../components/admin/BookingManagement'
import Reports from '../../components/admin/Reports'

export default async function AdminPage() {
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

  // Check if user is admin
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') {
    redirect('/')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-xl font-semibold">Admin Panel - Perpustakaan Aceh</h1>
          <div className="flex items-center space-x-4">
            <span>Welcome, {profile?.full_name}</span>
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
            Admin Dashboard
          </h1>
          <p className="text-gray-600">
            Manage rooms and bookings
          </p>
        </div>

        <div className="space-y-8">
          <RoomManagement />
          <BookingManagement />
          <Reports />
        </div>
      </main>
    </div>
  )
}