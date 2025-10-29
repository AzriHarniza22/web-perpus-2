import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'
import { sendApprovalNotification, sendRejectionNotification } from '@/lib/email'

export const runtime = 'edge'

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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

    const body = await request.json()
    const { status } = body

    if (!status) {
      return NextResponse.json({ error: 'Status is required' }, { status: 400 })
    }

    const bookingId = (await params).id

    // Update booking status
    const { data: booking, error: updateError } = await supabase
      .from('bookings')
      .update({ status })
      .eq('id', bookingId)
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

    if (updateError) {
      console.error('Booking update error:', updateError)
      return NextResponse.json({ error: 'Failed to update booking status' }, { status: 500 })
    }

    // Send notification if status is approved or rejected (fire and forget)
    if (status === 'approved' || status === 'rejected') {
      const bookingDetails = {
        roomName: booking.rooms?.name || 'Unknown Room',
        time: `${new Date(booking.start_time).toLocaleString()} - ${new Date(booking.end_time).toLocaleString()}`,
        userName: booking.profiles?.full_name || 'Unknown User'
      }

      const userEmail = booking.profiles?.email
      if (userEmail) {
        if (status === 'approved') {
          console.log('Sending approval email asynchronously');
          sendApprovalNotification(userEmail, bookingDetails).catch(emailError => {
            console.error('Email notification error:', emailError)
          })
        } else if (status === 'rejected') {
          console.log('Sending rejection email asynchronously');
          sendRejectionNotification(userEmail, bookingDetails).catch(emailError => {
            console.error('Email notification error:', emailError)
          })
        }
      }
    }

    return NextResponse.json({ success: true, booking }, { status: 200 })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}