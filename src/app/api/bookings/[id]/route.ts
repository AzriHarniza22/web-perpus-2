import { NextRequest } from 'next/server'
import {
  withAuth,
  successResponse,
  errorResponse,
  type AuthenticatedRequest
} from '@/lib/api-middleware'

export const runtime = 'edge'

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withAuth(request, async (req: AuthenticatedRequest) => {
    try {
      const bookingId = (await params).id

      // Verify booking exists and belongs to authenticated user
      const { data: booking, error: fetchError } = await req.supabase
        .from('bookings')
        .select('id, status, user_id')
        .eq('id', bookingId)
        .eq('user_id', req.user.id)
        .single()

      if (fetchError || !booking) {
        console.error('Booking fetch error:', fetchError)
        return errorResponse('Booking not found', 404)
      }

      // Check if status is 'pending'
      if (booking.status !== 'pending') {
        return errorResponse('Only pending bookings can be cancelled', 400)
      }

      // Update status to 'cancelled'
      const { data: updatedBooking, error: updateError } = await req.supabase
        .from('bookings')
        .update({ status: 'cancelled' })
        .eq('id', bookingId)
        .eq('user_id', req.user.id)
        .select()
        .single()

      if (updateError) {
        console.error('Booking update error:', updateError)
        return errorResponse('Failed to cancel booking', 500)
      }

      return successResponse({ booking: updatedBooking }, 'Booking cancelled successfully')
    } catch (error) {
      console.error('API error:', error)
      return errorResponse('Internal server error', 500)
    }
  })
}