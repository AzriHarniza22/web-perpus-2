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
  encodeCursor,
  type AuthenticatedRequest
} from '@/lib/api-middleware'

export const runtime = 'nodejs'

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

      // Generate cursors for cursor-based pagination
      let nextCursor: string | null = null
      let prevCursor: string | null = null

      if (bookings && bookings.length > 0) {
        const lastBooking = bookings[bookings.length - 1]
        const firstBooking = bookings[0]

        // Generate next cursor based on sort field
        const sortField = queryParams.sortBy || 'created_at'
        nextCursor = encodeCursor(lastBooking[sortField])

        // Generate previous cursor if not on first page
        if (queryParams.cursor && queryParams.cursorDirection === 'next') {
          prevCursor = encodeCursor(firstBooking[sortField])
        }
      }

      const result = {
        bookings: bookings || [],
        totalCount: count || 0,
        currentPage: queryParams.page || 1,
        totalPages: Math.ceil((count || 0) / (queryParams.limit || 50)),
        // Cursor pagination metadata
        nextCursor,
        prevCursor,
        hasNext: bookings && bookings.length === (queryParams.limit || 50),
        hasPrev: !!queryParams.cursor && queryParams.cursorDirection === 'next'
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

      const { room_id, start_time, end_time, event_description, proposal_file, notes, contact_name, contact_institution, is_tour } = body

      console.log('DEBUG - API received booking data:', {
        room_id,
        contact_name,
        contact_institution,
        event_description,
        notes
      })

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
        contact_name,
        contact_institution,
        status: 'pending',
        is_tour: is_tour ?? false
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

      // Send notification to admin asynchronously (fire and forget)
      console.log('Sending new booking notification to admin asynchronously');
      const bookingDetails = {
        roomName: booking.rooms?.name || 'Unknown Room',
        time: `${new Date(booking.start_time).toLocaleString()} - ${new Date(booking.end_time).toLocaleString()}`,
        userName: booking.profiles?.full_name || 'Unknown User'
      }
      sendNewBookingNotificationToAdmin(req.supabase, bookingDetails).catch(emailError => {
        console.error('Email notification error:', emailError)
      })

      return successResponse({ booking }, 'Booking created successfully', { status: 201 })
    } catch (error) {
      console.error('API error:', error)
      return errorResponse('Internal server error', 500)
    }
  })
}