import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              request.cookies.set({ name, value, ...options })
            })
          },
        },
      }
    )

    // Allow anonymous access for viewing active rooms
    // The RLS policy will handle filtering to only active rooms for anonymous users
    const { data: rooms, error } = await supabase
      .from('rooms')
      .select('*')
      .eq('is_active', true) // Only return active rooms for anonymous access
      .order('name')

    if (error) {
      console.error('Rooms fetch error:', error)
      return NextResponse.json({ error: 'Failed to fetch rooms' }, { status: 500 })
    }

    // Debug logging to investigate room count issue
    console.log('=== ROOMS DEBUG INFO ===')
    console.log('Total rooms in database:', rooms?.length || 0)
    console.log('All rooms data:', rooms?.map(room => ({
      id: room.id,
      name: room.name,
      is_active: room.is_active,
      capacity: room.capacity
    })))

    // Check for inactive rooms
    const activeRooms = rooms?.filter(room => room.is_active) || []
    const inactiveRooms = rooms?.filter(room => !room.is_active) || []

    console.log('Active rooms count:', activeRooms.length)
    console.log('Inactive rooms count:', inactiveRooms.length)
    console.log('Inactive rooms:', inactiveRooms.map(room => ({ id: room.id, name: room.name })))
    console.log('=======================')

    return NextResponse.json({ rooms: rooms || [] })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}