import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'
import { sendNewBookingNotificationToAdmin } from '@/lib/email'
import { ensureLibraryTourRoom } from '@/lib/roomUtils'

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

    // Get the Library Tour room ID (with auto-creation if missing)
    const roomResult = await ensureLibraryTourRoom()

    if (!roomResult.success || !roomResult.roomId) {
      console.error('Library Tour room lookup failed:', roomResult.error)
      return NextResponse.json({
        success: false,
        error: roomResult.error || 'Library Tour room not found and could not be created',
        timestamp: new Date().toISOString(),
        requestId: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        version: '1.0',
        statusCode: 500
      }, { status: 500 })
    }

    // Log if room was created or if using fallback
    if (roomResult.wasCreated) {
      console.log('Library Tour room was created during booking')
    } else if (roomResult.error) {
      console.log('Using fallback room for booking:', roomResult.error)
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({
        success: false,
        error: 'Unauthorized',
        timestamp: new Date().toISOString(),
        requestId: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        version: '1.0',
        statusCode: 401
      }, { status: 401 })
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
      return NextResponse.json({
        success: false,
        error: 'Invalid JSON',
        timestamp: new Date().toISOString(),
        requestId: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        version: '1.0',
        statusCode: 400
      }, { status: 400 })
    }

    const { start_time, end_time, event_description, proposal_file, notes, guest_count, special_requests } = body

    if (!start_time || !end_time) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: start_time and end_time are required',
        timestamp: new Date().toISOString(),
        requestId: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        version: '1.0',
        statusCode: 400
      }, { status: 400 })
    }

    // Validate time range
    const start = new Date(start_time)
    const end = new Date(end_time)
    if (start >= end) {
      return NextResponse.json({
        success: false,
        error: 'Invalid time range: start time must be before end time',
        timestamp: new Date().toISOString(),
        requestId: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        version: '1.0',
        statusCode: 400
      }, { status: 400 })
    }

    // Check for conflicting approved bookings for the Library Tour room
    const { data: conflicts, error: conflictError } = await supabase
      .from('bookings')
      .select('id, status, start_time, end_time')
      .eq('room_id', roomResult.roomId)
      .eq('status', 'approved')
      .lt('start_time', end_time)
      .gt('end_time', start_time)

    if (conflictError) {
      console.error('Tour booking conflict check error:', conflictError)
      return NextResponse.json({
        success: false,
        error: 'Failed to check for conflicts',
        timestamp: new Date().toISOString(),
        requestId: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        version: '1.0',
        statusCode: 500
      }, { status: 500 })
    }

    if (conflicts && conflicts.length > 0) {
      return NextResponse.json({
        success: false,
        error: 'Tour time slot is already booked',
        details: 'Conflicting bookings exist',
        debug: {
          conflicts: conflicts.map(c => ({
            id: c.id,
            status: c.status,
            start_time: c.start_time,
            end_time: c.end_time
          }))
        },
        timestamp: new Date().toISOString(),
        requestId: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        version: '1.0',
        statusCode: 409
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
        return NextResponse.json({
          success: false,
          error: 'Failed to create profile',
          timestamp: new Date().toISOString(),
          requestId: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          version: '1.0',
          statusCode: 500
        }, { status: 500 })
      }
    }

    // Prepare tour-specific booking data
    const eventDescription = event_description || `Library Tour - ${special_requests || 'Standard tour booking'}`
    const participantCount = guest_count || 1

    // Insert tour booking
    const insertData = {
      user_id: user.id,
      room_id: roomResult.roomId,
      start_time,
      end_time,
      event_description: eventDescription,
      guest_count: participantCount,
      proposal_file,
      notes: notes || 'Tour booking with Library Staff guide',
      status: 'pending',
      // Tour-specific fields based on actual database schema
      is_tour: true
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
      return NextResponse.json({
        success: false,
        error: 'Failed to create tour booking',
        timestamp: new Date().toISOString(),
        requestId: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        version: '1.0',
        statusCode: 500
      }, { status: 500 })
    }

    console.log('Tour booking inserted successfully');

    // Send notification to admin
    try {
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
      message: 'Tour booking created successfully',
      data: {
        booking,
        tour_info: {
          tour_name: TOUR_CONFIG.tour_name,
          tour_guide: TOUR_CONFIG.tour_guide,
          meeting_point: TOUR_CONFIG.tour_meeting_point
        }
      },
      timestamp: new Date().toISOString(),
      requestId: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      version: '1.0',
      statusCode: 201
    }, { status: 201 })
  } catch (error) {
    console.error('Tour booking API error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      timestamp: new Date().toISOString(),
      requestId: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      version: '1.0',
      statusCode: 500
    }, { status: 500 })
  }
}