import { supabase } from './supabase'

export interface RoomLookupResult {
  success: boolean
  roomId?: string
  error?: string
  wasCreated?: boolean
}

/**
 * Ensures the Library Tour room exists in the database
 * Creates it if it doesn't exist, returns existing if it does
 */
export async function ensureLibraryTourRoom(): Promise<RoomLookupResult> {
  try {
    // First, try to find the existing Library Tour room
    const { data: existingRoom, error: findError } = await supabase
      .from('rooms')
      .select('id')
      .eq('name', 'Library Tour')
      .single()

    if (existingRoom && !findError) {
      console.log('Library Tour room found:', existingRoom.id)
      return {
        success: true,
        roomId: existingRoom.id,
        wasCreated: false
      }
    }

    // If not found, create the Library Tour room
    console.log('Library Tour room not found, creating it...')
    const { data: newRoom, error: createError } = await supabase
      .from('rooms')
      .insert({
        name: 'Library Tour',
        description: 'Area untuk tur perpustakaan',
        capacity: 15,
        facilities: ['Panduan Audio'],
        is_active: true
      })
      .select('id')
      .single()

    if (createError) {
      console.error('Failed to create Library Tour room:', createError)

      // Fallback: try to use an existing room
      const fallbackRoom = await getFallbackRoom()
      if (fallbackRoom) {
        console.log('Using fallback room:', fallbackRoom.name)
        return {
          success: true,
          roomId: fallbackRoom.id,
          error: 'Library Tour room created failed, using fallback room'
        }
      }

      return {
        success: false,
        error: `Failed to create Library Tour room: ${createError.message}`
      }
    }

    console.log('Library Tour room created successfully:', newRoom.id)
    return {
      success: true,
      roomId: newRoom.id,
      wasCreated: true
    }

  } catch (error) {
    console.error('Error in ensureLibraryTourRoom:', error)

    // Final fallback: try to use any existing room
    const fallbackRoom = await getFallbackRoom()
    if (fallbackRoom) {
      console.log('Using fallback room after error:', fallbackRoom.name)
      return {
        success: true,
        roomId: fallbackRoom.id,
        error: 'Error occurred, using fallback room'
      }
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }
  }
}

/**
 * Gets a fallback room to use when Library Tour is not available
 */
async function getFallbackRoom() {
  try {
    // Try to get the first available active room
    const { data: room, error } = await supabase
      .from('rooms')
      .select('id, name')
      .eq('is_active', true)
      .limit(1)
      .single()

    if (room && !error) {
      return room
    }

    return null
  } catch (error) {
    console.error('Error getting fallback room:', error)
    return null
  }
}

/**
 * Gets the Library Tour room ID, creating it if necessary
 * @deprecated Use ensureLibraryTourRoom() instead for better error handling
 */
export async function getLibraryTourRoomId(): Promise<string | null> {
  const result = await ensureLibraryTourRoom()
  return result.roomId || null
}