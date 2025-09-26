import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'
import { sendNewBookingNotificationToAdmin } from '@/lib/email'

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