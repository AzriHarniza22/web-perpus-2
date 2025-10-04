import { NextRequest } from 'next/server'
import { withAuth, successResponse, errorResponse } from '@/lib/api-middleware'
import { sendNewBookingNotificationToAdmin } from '@/lib/email'
import { logger, LogCategory } from '@/lib/logger'
import { handleError } from '@/lib/errors'

export async function POST(request: NextRequest) {
  return withAuth(request, async (req) => {
    return logger.withDuration(LogCategory.API, 'Tour Booking Creation', async () => {
      try {
        const rawBody = await request.text()

        await logger.debug(LogCategory.API, 'Tour booking request received', {
          userId: req.user?.id,
          method: request.method,
          url: request.url,
        }, {
          bodyLength: rawBody.length,
        })

        let body
        try {
          body = JSON.parse(rawBody)
        } catch (error) {
          const parseError = handleError(error)
          await logger.error(LogCategory.VALIDATION, 'Invalid JSON in tour booking request', {
            userId: req.user?.id,
            url: request.url,
          }, parseError)

          return errorResponse('Invalid JSON', 400, parseError.message)
        }

        const { room_id, start_time, end_time, event_description, proposal_file, notes, guest_count } = body

        // For tours, room_id actually contains the tour_id
        const tour_id = room_id

        if (!tour_id || !start_time || !end_time) {
          await logger.warn(LogCategory.VALIDATION, 'Missing required fields in tour booking', {
            userId: req.user?.id,
            providedFields: { tour_id: !!tour_id, start_time: !!start_time, end_time: !!end_time },
          })

          return errorResponse('Missing required fields', 400, 'tour_id, start_time, and end_time are required')
        }

        // Validate time range
        const start = new Date(start_time)
        const end = new Date(end_time)
        if (start >= end) {
          await logger.warn(LogCategory.VALIDATION, 'Invalid time range in tour booking', {
            userId: req.user?.id,
            start_time,
            end_time,
          })

          return errorResponse('Invalid time range: start time must be before end time', 400)
        }

        // Check for conflicting approved tour bookings
        const { data: conflicts, error: conflictError } = await req.supabase
          .from('bookings')
          .select('id, status, start_time, end_time')
          .eq('is_tour', true)
          .eq('status', 'approved')
          .lt('start_time', end_time)
          .gt('end_time', start_time)

        if (conflictError) {
          await logger.error(LogCategory.DATABASE, 'Tour conflict check failed', {
            userId: req.user?.id,
            tour_id,
            start_time,
            end_time,
          }, handleError(conflictError))

          return errorResponse('Failed to check for conflicts', 500, conflictError.message)
        }

        if (conflicts && conflicts.length > 0) {
          await logger.info(LogCategory.BUSINESS_LOGIC, 'Tour booking conflict detected', {
            userId: req.user?.id,
            tour_id,
            conflictCount: conflicts.length,
          })

          return errorResponse('Tour time slot is already booked', 409, 'Conflicting bookings exist', {
            conflicts: conflicts.map((c: any) => ({
              id: c.id,
              status: c.status,
              start_time: c.start_time,
              end_time: c.end_time
            }))
          })
        }

        // Ensure profile exists
        const { data: profile } = await req.supabase
          .from('profiles')
          .select('id')
          .eq('id', req.user.id)
          .single()

        if (!profile) {
          const { error: profileError } = await req.supabase
            .from('profiles')
            .insert({
              id: req.user.id,
              email: req.user.email!,
              full_name: req.user.user_metadata?.full_name || '',
              institution: req.user.user_metadata?.institution || '',
              phone: req.user.user_metadata?.phone || '',
            })

          if (profileError) {
            await logger.error(LogCategory.DATABASE, 'Profile creation failed', {
              userId: req.user?.id,
            }, handleError(profileError))

            return errorResponse('Failed to create profile', 500, profileError.message)
          }

          await logger.info(LogCategory.DATABASE, 'Profile created for user', {
            userId: req.user?.id,
          })
        }

        // Insert tour booking
        const insertData = {
          user_id: req.user.id,
          room_id: tour_id,
          start_time,
          end_time,
          event_description,
          proposal_file,
          notes,
          guest_count,
          status: 'pending',
          is_tour: true
        }

        const { data: booking, error: insertError } = await req.supabase
          .from('bookings')
          .insert(insertData)
          .select(`
            *,
            profiles:user_id (
              full_name,
              email
            )
          `)
          .single()

        if (insertError) {
          await logger.error(LogCategory.DATABASE, 'Tour booking insert failed', {
            userId: req.user?.id,
            tour_id,
          }, handleError(insertError))

          return errorResponse('Failed to create tour booking', 500, insertError.message)
        }

        await logger.info(LogCategory.BUSINESS_LOGIC, 'Tour booking created successfully', {
          userId: req.user?.id,
          bookingId: booking.id,
          tour_id,
        })

        // Send notification to admin
        try {
          const bookingDetails = {
            roomName: `Tour Booking`,
            time: `${new Date(booking.start_time).toLocaleString()} - ${new Date(booking.end_time).toLocaleString()}`,
            userName: booking.profiles?.full_name || 'Unknown User',
            type: 'tour'
          }

          await logger.withDuration(LogCategory.NETWORK, 'Send tour booking notification email', async () => {
            await sendNewBookingNotificationToAdmin(req.supabase, bookingDetails)
          }, {
            userId: req.user?.id,
            bookingId: booking.id,
          })

          await logger.info(LogCategory.NETWORK, 'Tour booking notification sent', {
            userId: req.user?.id,
            bookingId: booking.id,
          })
        } catch (emailError) {
          await logger.error(LogCategory.NETWORK, 'Tour booking notification failed', {
            userId: req.user?.id,
            bookingId: booking.id,
          }, handleError(emailError))
          // Don't fail the booking if email fails
        }

        return successResponse({ booking }, 'Tour booking created successfully', { status: 201 })
      } catch (error) {
        const appError = handleError(error)
        await logger.error(LogCategory.API, 'Tour booking API error', {
          userId: req.user?.id,
          url: request.url,
        }, appError)

        return errorResponse('Internal server error', 500, appError.message)
      }
    }, {
      userId: req.user?.id,
      url: request.url,
    })
  })
}