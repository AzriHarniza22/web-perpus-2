import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'
import { Booking } from '@/lib/types'

// Type for Supabase client (generic)
type SupabaseClient = ReturnType<typeof createServerClient>

// Type for Supabase query builder
type SupabaseQueryBuilder<T> = {
  in: (column: string, values: string[]) => SupabaseQueryBuilder<T>
  gte: (column: string, value: string) => SupabaseQueryBuilder<T>
  lte: (column: string, value: string) => SupabaseQueryBuilder<T>
  eq: (column: string, value: string | boolean) => SupabaseQueryBuilder<T>
  or: (query: string) => SupabaseQueryBuilder<T>
  order: (column: string, options: { ascending: boolean }) => SupabaseQueryBuilder<T>
  range: (from: number, to: number) => SupabaseQueryBuilder<T>
  neq: (column: string, value: string) => SupabaseQueryBuilder<T>
  lt: (column: string, value: string) => SupabaseQueryBuilder<T>
  gt: (column: string, value: string) => SupabaseQueryBuilder<T>
  select: (columns: string) => SupabaseQueryBuilder<T>
}

export interface AuthenticatedRequest extends NextRequest {
  supabase: SupabaseClient
  user: {
    id: string
    email: string
    user_metadata?: {
      full_name?: string
      institution?: string
      phone?: string
    }
  }
}

export interface ApiResponse<T = unknown> {
  success: boolean
  message?: string
  data?: T
  error?: string
  details?: string
  debug?: Record<string, unknown>
}

export interface PaginationParams {
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export interface FilterParams {
  status?: string[]
  dateRangeStart?: string
  dateRangeEnd?: string
  search?: string
  roomIds?: string[]
  isTour?: 'true' | 'false'
}

/**
 * Creates authenticated Supabase client with cookie handling
 */
export function createAuthenticatedClient(request: NextRequest): SupabaseClient {
  return createServerClient(
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
}

/**
 * Middleware to authenticate requests and provide Supabase client
 */
export async function withAuth(
  request: NextRequest,
  handler: (req: AuthenticatedRequest) => Promise<NextResponse>
): Promise<NextResponse> {
  try {
    console.log('withAuth called for:', request.url)
    const supabase = createAuthenticatedClient(request)

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    console.log('Auth check result:', { hasUser: !!user, authError: authError?.message })

    if (authError || !user) {
      console.error('Authentication failed:', { authError: authError?.message, user: !!user })
      return NextResponse.json(
        {
          error: 'Unauthorized',
          success: false,
          debug: { authError: authError?.message, hasUser: !!user }
        } as ApiResponse,
        { status: 401 }
      )
    }

    console.log('Authentication successful for user:', user.email)

    // Create authenticated request object
    const authenticatedRequest = Object.assign(request, {
      supabase,
      user: {
        id: user.id,
        email: user.email!,
        user_metadata: user.user_metadata
      }
    }) as AuthenticatedRequest

    console.log('Authenticated user:', { id: user.id, email: user.email })
    const result = await handler(authenticatedRequest)
    console.log('Handler result status:', result.status)
    return result
  } catch (error) {
    console.error('Auth middleware error:', error)
    return NextResponse.json(
      { error: 'Internal server error', success: false } as ApiResponse,
      { status: 500 }
    )
  }
}

/**
 * Parse common query parameters from request URL
 */
export function parseQueryParams(request: NextRequest): PaginationParams & FilterParams {
  const url = new URL(request.url)

  return {
    // Pagination
    page: parseInt(url.searchParams.get('page') || '1'),
    limit: parseInt(url.searchParams.get('limit') || '50'),
    sortBy: url.searchParams.get('sortBy') || 'created_at',
    sortOrder: (url.searchParams.get('sortOrder') || 'desc') as 'asc' | 'desc',

    // Filters
    status: url.searchParams.get('status')?.split(',').filter(Boolean),
    dateRangeStart: url.searchParams.get('dateRangeStart') || undefined,
    dateRangeEnd: url.searchParams.get('dateRangeEnd') || undefined,
    search: url.searchParams.get('search') || undefined,
    roomIds: url.searchParams.get('roomIds')?.split(',').filter(Boolean),
    isTour: url.searchParams.get('isTour') as 'true' | 'false' | undefined,
  }
}

/**
 * Apply common filters to Supabase query
 */
export function applyFilters<T>(
  query: SupabaseQueryBuilder<T>,
  filters: FilterParams
): SupabaseQueryBuilder<T> {
  let filteredQuery = query

  // Status filter
  if (filters.status && filters.status.length > 0 && filters.status[0] !== '') {
    filteredQuery = filteredQuery.in('status', filters.status)
  }

  // Date range filter
  if (filters.dateRangeStart && filters.dateRangeEnd) {
    filteredQuery = filteredQuery
      .gte('created_at', filters.dateRangeStart)
      .lte('created_at', filters.dateRangeEnd)
  }

  // Room IDs filter
  if (filters.roomIds && filters.roomIds.length > 0 && filters.roomIds[0] !== '') {
    filteredQuery = filteredQuery.in('room_id', filters.roomIds)
  }

  // Search filter
  if (filters.search && filters.search.trim()) {
    const searchTerm = filters.search.trim()
    filteredQuery = filteredQuery.or(`event_description.ilike.%${searchTerm}%,notes.ilike.%${searchTerm}%`)
  }

  // Tour filter
  if (filters.isTour === 'true') {
    filteredQuery = filteredQuery.eq('is_tour', true)
  } else if (filters.isTour === 'false') {
    filteredQuery = filteredQuery.eq('is_tour', false)
  }

  return filteredQuery
}

/**
 * Apply pagination and sorting to Supabase query
 */
export function applyPaginationAndSorting<T>(
  query: SupabaseQueryBuilder<T>,
  params: PaginationParams
): SupabaseQueryBuilder<T> {
  let paginatedQuery = query

  // Apply sorting
  paginatedQuery = paginatedQuery.order(params.sortBy || 'created_at', {
    ascending: params.sortOrder === 'asc'
  })

  // Apply pagination
  if (params.page && params.limit) {
    const from = (params.page - 1) * params.limit
    const to = from + params.limit - 1
    paginatedQuery = paginatedQuery.range(from, to)
  }

  return paginatedQuery
}

/**
 * Standardized success response
 */
export function successResponse<T>(
  data?: T,
  message?: string,
  metadata?: Record<string, unknown>
): NextResponse<ApiResponse<T>> {
  return NextResponse.json({
    success: true,
    message,
    data,
    ...metadata
  } as ApiResponse<T>)
}

/**
 * Standardized error response
 */
export function errorResponse(
  error: string,
  status: number = 500,
  details?: string,
  debug?: Record<string, unknown>
): NextResponse<ApiResponse> {
  const response: ApiResponse = {
    success: false,
    error,
    details,
    debug
  }

  return NextResponse.json(response, { status })
}

/**
 * Handle profile creation/update for authenticated users
 */
export async function ensureProfileExists(
  supabase: SupabaseClient,
  user: AuthenticatedRequest['user']
): Promise<{ data: { id: string } | null } | { error: Error }> {
  // Check if profile exists
  const { data: existingProfile } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', user.id)
    .single()

  if (!existingProfile) {
    // Create profile if it doesn't exist
    const { data, error } = await supabase
      .from('profiles')
      .insert({
        id: user.id,
        email: user.email,
        full_name: user.user_metadata?.full_name || '',
        institution: user.user_metadata?.institution || '',
        phone: user.user_metadata?.phone || '',
      })
      .select()
      .single()

    if (error) {
      return { error }
    }

    return { data }
  }

  return { data: existingProfile }
}

/**
 * Validate time range for bookings
 */
export function validateTimeRange(startTime: string, endTime: string): { isValid: boolean; error?: string } {
  const start = new Date(startTime)
  const end = new Date(endTime)

  if (start >= end) {
    return {
      isValid: false,
      error: 'Invalid time range: start time must be before end time'
    }
  }

  return { isValid: true }
}

/**
 * Check for booking conflicts
 */
export async function checkBookingConflicts(
  supabase: SupabaseClient,
  roomId: string,
  startTime: string,
  endTime: string,
  excludeBookingId?: string
): Promise<{ hasConflicts: boolean; conflicts?: Booking[] }> {
  let query = supabase
    .from('bookings')
    .select('id, status, start_time, end_time')
    .eq('room_id', roomId)
    .eq('status', 'approved')
    .lt('start_time', endTime)
    .gt('end_time', startTime)

  // Exclude current booking if updating
  if (excludeBookingId) {
    query = query.neq('id', excludeBookingId)
  }

  const { data: conflicts, error } = await query

  if (error) {
    throw new Error('Failed to check for conflicts')
  }

  return {
    hasConflicts: conflicts && conflicts.length > 0,
    conflicts
  }
}