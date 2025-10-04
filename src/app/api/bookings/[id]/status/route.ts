import { NextRequest } from 'next/server'
import { withAuth, successResponse, errorResponse } from '@/lib/api-middleware'
import { sendApprovalNotification, sendRejectionNotification } from '@/lib/email'

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withAuth(request, async (req) => {
    try {
      const body = await request.json()
      const { status } = body

      if (!status) {
        return errorResponse('Status is required', 400)
      }

      const bookingId = (await params).id

      // Update booking status
      const { data: booking, error: updateError } = await req.supabase
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
        return errorResponse('Failed to update booking status', 500, updateError.message)
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

      return successResponse({ booking }, 'Booking status updated successfully')
    } catch (error) {
      console.error('API error:', error)
      return errorResponse('Internal server error', 500, error instanceof Error ? error.message : 'Unknown error')
    }
  })
}