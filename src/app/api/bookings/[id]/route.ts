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
      console.log('=== BOOKING DELETION DEBUG ===')
      console.log('Booking ID:', bookingId)
      console.log('User ID:', req.user.id)
      console.log('User email:', req.user.email)

      // Verify booking exists and belongs to authenticated user
      console.log('Fetching booking data...')
      const { data: booking, error: fetchError } = await req.supabase
        .from('bookings')
        .select('id, status, user_id, start_time, end_time, event_description')
        .eq('id', bookingId)
        .single()

      console.log('Fetch result:', { booking, fetchError })
      
      if (fetchError) {
        console.error('Booking fetch error details:', {
          message: fetchError.message,
          details: fetchError.details,
          hint: fetchError.hint,
          code: fetchError.code
        })
        return errorResponse(`Database error: ${fetchError.message}`, 404)
      }

      if (!booking) {
        console.error('Booking not found for ID:', bookingId)
        return errorResponse('Booking tidak ditemukan', 404)
      }

      // Check if booking belongs to user
      if (booking.user_id !== req.user.id) {
        console.error('Booking ownership mismatch:', {
          bookingUserId: booking.user_id,
          requestUserId: req.user.id
        })
        return errorResponse('Anda tidak memiliki权限 untuk membatalkan booking ini', 403)
      }

      console.log('Booking details:', {
        id: booking.id,
        status: booking.status,
        user_id: booking.user_id,
        start_time: booking.start_time,
        end_time: booking.end_time,
        event_description: booking.event_description
      })

      // Check if status is 'pending'
      if (booking.status !== 'pending') {
        console.error('Invalid booking status for cancellation:', {
          currentStatus: booking.status,
          expectedStatus: 'pending'
        })
        return errorResponse(`Hanya booking dengan status 'pending' yang dapat dibatalkan. Status saat ini: '${booking.status}'`, 400)
      }

      console.log('Status check passed, proceeding with cancellation...')

      // Update status to 'cancelled'
      const { data: updatedBooking, error: updateError } = await req.supabase
        .from('bookings')
        .update({ status: 'cancelled' })
        .eq('id', bookingId)
        .eq('user_id', req.user.id)
        .select()
        .single()

      console.log('Update result:', { updatedBooking, updateError })

      if (updateError) {
        console.error('Booking update error details:', {
          message: updateError.message,
          details: updateError.details,
          hint: updateError.hint,
          code: updateError.code
        })
        return errorResponse(`Gagal membatalkan booking: ${updateError.message}`, 500)
      }

      console.log('Booking successfully cancelled:', updatedBooking)
      console.log('=== END BOOKING DELETION DEBUG ===')
      
      return successResponse({ booking: updatedBooking }, 'Booking berhasil dibatalkan')
    } catch (error) {
      console.error('API error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        error
      })
      return errorResponse('Kesalahan server internal', 500)
    }
  })
}