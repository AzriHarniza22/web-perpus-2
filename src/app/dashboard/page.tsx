// app/dashboard/page.tsx
import { requireAuth, getProfile } from '@/lib/auth/server'
import { createClient } from '@/lib/supabase/server'
import DashboardLayout from '@/components/DashboardLayout'

export default async function DashboardPage() {
  // This will redirect to /login if not authenticated
  const user = await requireAuth()
  const profile = await getProfile()

  // Fetch user's reservations server-side
  const supabase = await createClient()

  const { data: myReservations } = await supabase
    .from('bookings')
    .select(`
      *,
      room:rooms(name, capacity)
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  // Fetch all bookings for the calendar
  const { data: allBookings } = await supabase
    .from('bookings')
    .select(`
      *,
      room:rooms(name, capacity)
    `)
    .order('created_at', { ascending: false })

  return (
    <DashboardLayout
      user={user}
      profile={profile}
      myReservations={myReservations || []}
      allBookings={allBookings || []}
    />
  )
}