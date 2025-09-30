import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'
import { sendNewBookingNotificationToAdmin } from '@/lib/email'

// Fixed tour information
const TOUR_CONFIG = {
  room_name: 'Library Tour', // Room name to look up dynamically
  tour_name: 'Library Tour',
  tour_guide: 'Library Staff',
  tour_meeting_point: 'Main Entrance'
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

    // Get the Library Tour room ID
    const { data: room, error: roomError } = await supabase
      .from('rooms')
      .select('id')
      .eq('name', TOUR_CONFIG.room_name)
      .single()

    if (roomError || !room) {
      console.error('Library Tour room not found:', roomError)
      return NextResponse.json({ error: 'Library Tour room not found' }, { status: 500 })
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const rawBody = await request.text()
    console.log('Tour booking request method:', request.method)
    console.log('Tour booking request headers:', Object.fromEntries(request.headers.entries()))
    console.log('Tour booking request body:', rawBody)

    let body
    try {
      body = JSON.parse(rawBody)
    } catch (error) {
      console.error('JSON parse error:', error)
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
    }

    const { start_time, end_time, event_description, proposal_file, notes, guest_count, special_requests } = body

    if (!start_time || !end_time) {
      return NextResponse.json({ error: 'Missing required fields: start_time and end_time are required' }, { status: 400 })
    }

    // Validate time range
    const start = new Date(start_time)
    const end = new Date(end_time)
    if (start >= end) {
      return NextResponse.json({ error: 'Invalid time range: start time must be before end time' }, { status: 400 })
    }

    // Check for conflicting approved bookings for the Library Tour room
    const { data: conflicts, error: conflictError } = await supabase
      .from('bookings')
      .select('id, status, start_time, end_time')
      .eq('room_id', room.id)
      .eq('status', 'approved')
      .lt('start_time', end_time)
      .gt('end_time', start_time)

    if (conflictError) {
      console.error('Tour booking conflict check error:', conflictError)
      return NextResponse.json({ error: 'Failed to check for conflicts' }, { status: 500 })
    }

    if (conflicts && conflicts.length > 0) {
      return NextResponse.json({
        error: 'Tour time slot is already booked',
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

    // Prepare tour-specific booking data
    const eventDescription = event_description || `Library Tour - ${special_requests || 'Standard tour booking'}`
    const participantCount = guest_count || 1

    // Insert tour booking
    const insertData = {
      user_id: user.id,
      room_id: room.id,
      start_time,
      end_time,
      event_description: eventDescription,
      guest_count: participantCount,
      proposal_file,
      notes: notes || 'Tour booking with Library Staff guide',
      status: 'pending',
      // Tour-specific fields
      is_tour: true,
      tour_name: TOUR_CONFIG.tour_name,
      tour_guide: TOUR_CONFIG.tour_guide,
      tour_meeting_point: TOUR_CONFIG.tour_meeting_point
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
      console.error('Tour booking insert error:', insertError)
      return NextResponse.json({ error: 'Failed to create tour booking' }, { status: 500 })
    }

    console.log('Tour booking inserted successfully');

    // Send notification to admin
    try {
      console.log('About to send tour booking notification to admin');
      const bookingDetails = {
        roomName: `${TOUR_CONFIG.tour_name} (${booking.rooms?.name || 'Library Tour'})`,
        time: `${new Date(booking.start_time).toLocaleString()} - ${new Date(booking.end_time).toLocaleString()}`,
        userName: booking.profiles?.full_name || 'Unknown User',
        tourGuide: TOUR_CONFIG.tour_guide,
        meetingPoint: TOUR_CONFIG.tour_meeting_point,
        participantCount: participantCount
      }
      await sendNewBookingNotificationToAdmin(supabase, bookingDetails)
    } catch (emailError) {
      console.error('Tour booking email notification error:', emailError)
      // Don't fail the booking if email fails
    }

    return NextResponse.json({
      success: true,
      booking,
      tour_info: {
        tour_name: TOUR_CONFIG.tour_name,
        tour_guide: TOUR_CONFIG.tour_guide,
        meeting_point: TOUR_CONFIG.tour_meeting_point
      }
    }, { status: 201 })
  } catch (error) {
    console.error('Tour booking API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}