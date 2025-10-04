import { NextRequest } from 'next/server'
import { withAuth, successResponse, errorResponse } from '@/lib/api-middleware'

export async function GET(request: NextRequest) {
  return withAuth(request, async (req) => {
    try {
      const { data: rooms, error } = await req.supabase
        .from('rooms')
        .select('*')
        .neq('name', 'Library Tour')
        .order('name')

      if (error) {
        console.error('Rooms fetch error:', error)
        return errorResponse('Failed to fetch rooms', 500, error.message)
      }

      return successResponse({ rooms: rooms || [] })
    } catch (error) {
      console.error('API error:', error)
      return errorResponse('Internal server error', 500, error instanceof Error ? error.message : 'Unknown error')
    }
  })
}