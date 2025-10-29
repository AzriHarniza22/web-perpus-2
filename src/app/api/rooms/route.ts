import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'
import {
  parseQueryParams,
  applyFilters,
  applyPaginationAndSorting,
  encodeCursor
} from '@/lib/api-middleware'

export const runtime = 'edge'

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

    // Parse query parameters for pagination and filtering
    const queryParams = parseQueryParams(request)

    // Allow anonymous access for viewing active rooms
    // The RLS policy will handle filtering to only active rooms for anonymous users
    let query = supabase
      .from('rooms')
      .select('*', { count: 'exact' })
      .eq('is_active', true) // Only return active rooms for anonymous access

    // Apply filters (if any - currently only is_active filter is applied)
    query = applyFilters(query, queryParams)

    // Apply pagination and sorting
    query = applyPaginationAndSorting(query, queryParams)

    const { data: rooms, error, count } = await query

    if (error) {
      console.error('Rooms fetch error:', error)
      return NextResponse.json({ error: 'Failed to fetch rooms' }, { status: 500 })
    }

    // Generate cursors for cursor-based pagination
    let nextCursor: string | null = null
    let prevCursor: string | null = null

    if (rooms && rooms.length > 0) {
      const lastRoom = rooms[rooms.length - 1]
      const firstRoom = rooms[0]

      // Generate next cursor based on sort field
      const sortField = queryParams.sortBy || 'name'
      nextCursor = encodeCursor(lastRoom[sortField])

      // Generate previous cursor if not on first page
      if (queryParams.cursor && queryParams.cursorDirection === 'next') {
        prevCursor = encodeCursor(firstRoom[sortField])
      }
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

    const result = {
      rooms: rooms || [],
      totalCount: count || 0,
      currentPage: queryParams.page || 1,
      totalPages: Math.ceil((count || 0) / (queryParams.limit || 50)),
      // Cursor pagination metadata
      nextCursor,
      prevCursor,
      hasNext: rooms && rooms.length === (queryParams.limit || 50),
      hasPrev: !!queryParams.cursor && queryParams.cursorDirection === 'next'
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}