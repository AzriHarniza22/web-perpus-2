import { NextRequest, NextResponse } from 'next/server'
import { sendNewBookingNotificationToAdmin } from '@/lib/email'
import {
  withAuth,
  parseQueryParams,
  applyFilters,
  applyPaginationAndSorting,
  successResponse,
  errorResponse,
  ensureProfileExists,
  validateTimeRange,
  checkBookingConflicts,
  type AuthenticatedRequest
} from '@/lib/api-middleware'

export async function GET(request: NextRequest) {
  return withAuth(request, async (req: AuthenticatedRequest) => {
    try {
      // Parse query parameters using common utility
      const queryParams = parseQueryParams(request)

      let query = req.supabase
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

      // Apply filters using common utility
      query = applyFilters(query, queryParams)

      // Apply pagination and sorting using common utility
      query = applyPaginationAndSorting(query, queryParams)

      const { data: bookings, error, count } = await query
  
      console.log('Supabase query result:', { bookingsCount: bookings?.length, error, count })
  
      if (error) {
        console.error('Bookings fetch error:', error)
        return errorResponse(`Failed to fetch bookings: ${error.message}`, 500)
      }
  
      const result = {
        bookings: bookings || [],
        totalCount: count || 0,
        currentPage: queryParams.page || 1,
        totalPages: Math.ceil((count || 0) / (queryParams.limit || 50))
      }
  
      console.log('API response:', result)
      return NextResponse.json(result)
    } catch (error) {
      console.error('API error:', error)
      return errorResponse('Internal server error', 500)
    }
  })
}

export async function POST(request: NextRequest) {
  return withAuth(request, async (req: AuthenticatedRequest) => {
    try {
      // Parse and validate request body
      const rawBody = await request.text()
      console.log('Request method:', request.method)
      console.log('Request headers:', Object.fromEntries(request.headers.entries()))
      console.log('Request body:', rawBody)

      let body
      try {
        body = JSON.parse(rawBody)
      } catch (error) {
        console.error('JSON parse error:', error)
        return errorResponse('Invalid JSON', 400)
      }

      const { room_id, start_time, end_time, event_description, proposal_file, notes } = body

      if (!room_id || !start_time || !end_time) {
        return errorResponse('Missing required fields', 400)
      }

      // Validate time range using utility
      const timeValidation = validateTimeRange(start_time, end_time)
      if (!timeValidation.isValid) {
        return errorResponse(timeValidation.error!, 400)
      }

      // Check for conflicting bookings using utility
      const { hasConflicts, conflicts } = await checkBookingConflicts(
        req.supabase,
        room_id,
        start_time,
        end_time
      )

      if (hasConflicts) {
        return errorResponse('Time slot is already booked', 409, undefined, { conflicts })
      }

      // Ensure profile exists using utility
      const profileResult = await ensureProfileExists(req.supabase, req.user)
      if ('error' in profileResult) {
        console.error('Profile creation error:', profileResult.error)
        return errorResponse('Failed to create profile', 500)
      }

      // Insert booking
      const insertData = {
        user_id: req.user.id,
        room_id,
        start_time,
        end_time,
        event_description,
        proposal_file,
        notes,
        status: 'pending'
      }

      const { data: booking, error: insertError } = await req.supabase
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
        return errorResponse('Failed to create booking', 500)
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
        await sendNewBookingNotificationToAdmin(req.supabase, bookingDetails)
      } catch (emailError) {
        console.error('Email notification error:', emailError)
        // Don't fail the booking if email fails
      }

      return successResponse({ booking }, 'Booking created successfully', { status: 201 })
    } catch (error) {
      console.error('API error:', error)
      return errorResponse('Internal server error', 500)
    }
  })
}