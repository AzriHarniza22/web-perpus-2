import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'
import { sendNewBookingNotificationToAdmin } from '@/lib/email'

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

    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse query parameters
    const url = new URL(request.url)
    const status = url.searchParams.get('status')?.split(',')
    const dateRangeStart = url.searchParams.get('dateRangeStart')
    const dateRangeEnd = url.searchParams.get('dateRangeEnd')
    const roomIds = url.searchParams.get('roomIds')?.split(',')
    const search = url.searchParams.get('search')
    const page = parseInt(url.searchParams.get('page') || '1')
    const limit = parseInt(url.searchParams.get('limit') || '50')
    const sortBy = url.searchParams.get('sortBy') || 'created_at'
    const sortOrder = url.searchParams.get('sortOrder') || 'desc'
    const isTour = url.searchParams.get('isTour')

    let query = supabase
      .from('bookings')
      .select(`
        *,
        profiles:user_id (
          full_name,
          email,
          institution,
          role,
          profile_photo
        ),
        rooms:room_id (
          name,
          capacity,
          facilities
        )
      `, { count: 'exact' })

    // Apply filters
    if (status && status.length > 0 && status[0] !== '') {
      query = query.in('status', status)
    }

    if (dateRangeStart && dateRangeEnd) {
      query = query
        .gte('created_at', dateRangeStart)
        .lte('created_at', dateRangeEnd)
    }

    if (roomIds && roomIds.length > 0 && roomIds[0] !== '') {
      query = query.in('room_id', roomIds)
    }

    if (search && search.trim()) {
      const searchTerm = search.trim()
      query = query.or(`event_description.ilike.%${searchTerm}%,notes.ilike.%${searchTerm}%`)
    }

    // Apply tour filtering if specified
    if (isTour === 'true') {
      // Filter for tour bookings using is_tour column
      query = query.eq('is_tour', true)
    } else if (isTour === 'false') {
      // Filter for room bookings using is_tour column
      query = query.eq('is_tour', false)
    }

    // Apply sorting
    query = query.order(sortBy, { ascending: sortOrder === 'asc' })

    // Apply pagination
    const from = (page - 1) * limit
    const to = from + limit - 1
    query = query.range(from, to)

    const { data: bookings, error, count } = await query

    if (error) {
      console.error('Bookings fetch error:', error)
      return NextResponse.json({ error: 'Failed to fetch bookings' }, { status: 500 })
    }

    return NextResponse.json({
      bookings: bookings || [],
      totalCount: count || 0,
      currentPage: page,
      totalPages: Math.ceil((count || 0) / limit)
    })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
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

    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const rawBody = await request.text()
    console.log('Request method:', request.method)
    console.log('Request headers:', Object.fromEntries(request.headers.entries()))
    console.log('Request body:', rawBody)

    let body
    try {
      body = JSON.parse(rawBody)
    } catch (error) {
      console.error('JSON parse error:', error)
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
    }

    const { room_id, start_time, end_time, event_description, proposal_file, notes } = body

    if (!room_id || !start_time || !end_time) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Validate time range
    const start = new Date(start_time)
    const end = new Date(end_time)
    if (start >= end) {
      return NextResponse.json({ error: 'Invalid time range: start time must be before end time' }, { status: 400 })
    }

    // Check for conflicting approved bookings
    const { data: conflicts, error: conflictError } = await supabase
      .from('bookings')
      .select('id, status, start_time, end_time')
      .eq('room_id', room_id)
      .eq('status', 'approved')
      .lt('start_time', end_time)
      .gt('end_time', start_time)

    if (conflictError) {
      console.error('Conflict check error:', conflictError)
      return NextResponse.json({ error: 'Failed to check for conflicts' }, { status: 500 })
    }

    if (conflicts && conflicts.length > 0) {
      return NextResponse.json({
        error: 'Time slot is already booked',
        conflicts: conflicts.map(c => ({
          id: c.id,
          status: c.status,
          start_time: c.start_time,
          end_time: c.end_time
        }))
      }, { status: 409 })
    }

    // Ensure profile exists
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', user.id)
      .single()

    if (!profile) {
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: user.id,
          email: user.email!,
          full_name: user.user_metadata?.full_name || '',
          institution: user.user_metadata?.institution || '',
          phone: user.user_metadata?.phone || '',
        })

      if (profileError) {
        console.error('Profile creation error:', profileError)
        return NextResponse.json({ error: 'Failed to create profile' }, { status: 500 })
      }
    }

    // Insert booking
    const insertData = {
      user_id: user.id,
      room_id,
      start_time,
      end_time,
      event_description,
      proposal_file,
      notes,
      status: 'pending'
    }

    const { data: booking, error: insertError } = await supabase
      .from('bookings')
      .insert(insertData)
      .select(`
        *,
        profiles:user_id (
          full_name,
          email
        ),
        rooms:room_id (
          name
        )
      `)
      .single()

    if (insertError) {
      console.error('Booking insert error:', insertError)
      return NextResponse.json({ error: 'Failed to create booking' }, { status: 500 })
    }

    console.log('Booking inserted successfully');

    // Send notification to admin
    try {
      console.log('About to send new booking notification to admin');
      const bookingDetails = {
        roomName: booking.rooms?.name || 'Unknown Room',
        time: `${new Date(booking.start_time).toLocaleString()} - ${new Date(booking.end_time).toLocaleString()}`,
        userName: booking.profiles?.full_name || 'Unknown User'
      }
      await sendNewBookingNotificationToAdmin(supabase, bookingDetails)
    } catch (emailError) {
      console.error('Email notification error:', emailError)
      // Don't fail the booking if email fails
    }

    return NextResponse.json({ success: true, booking }, { status: 201 })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}