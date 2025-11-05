'use client'

import { TestInView } from '@/components/test/TestInView'
import { GeneralOverviewCards } from '@/components/admin/analytics/GeneralOverviewCards'
import { RoomOverviewCards } from '@/components/admin/analytics/RoomOverviewCards'
import { Booking, Room, Tour, User } from '@/lib/types'

export default function TestInViewPage() {
  // Mock data untuk testing
  const mockBookings: Booking[] = [
    {
      id: '1',
      user_id: 'user-1',
      room_id: 'room-1',
      start_time: '2024-01-15T10:00:00Z',
      end_time: '2024-01-15T12:00:00Z',
      status: 'approved',
      event_description: 'Test meeting',
      guest_count: 2,
      proposal_file: null,
      notes: null,
      letter: null,
      is_tour: false,
      created_at: '2024-01-15T10:00:00Z',
      updated_at: '2024-01-15T10:00:00Z',
      contact_name: 'John Doe',
      contact_institution: 'Test University'
    },
    {
      id: '2',
      user_id: 'user-2', 
      room_id: 'room-2',
      start_time: '2024-01-16T11:00:00Z',
      end_time: '2024-01-16T13:00:00Z',
      status: 'pending',
      event_description: 'Another test',
      guest_count: 1,
      proposal_file: null,
      notes: null,
      letter: null,
      is_tour: false,
      created_at: '2024-01-16T11:00:00Z',
      updated_at: '2024-01-16T11:00:00Z',
      contact_name: 'Jane Doe',
      contact_institution: 'Test College'
    }
  ]

  const mockRooms: Room[] = [
    {
      id: '1',
      name: 'Room A',
      description: 'A nice meeting room',
      capacity: 10,
      facilities: ['projector', 'whiteboard'],
      photos: [],
      layout: 'boardroom',
      is_active: true,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z'
    },
    {
      id: '2',
      name: 'Room B',
      description: 'Another meeting room',
      capacity: 8,
      facilities: ['tv', 'cables'],
      photos: [],
      layout: 'classroom',
      is_active: true,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z'
    }
  ]

  const mockTours: Tour[] = [
    {
      id: '1',
      name: 'Library Tour',
      description: 'Guided tour of the library',
      capacity: 20,
      duration_minutes: 60,
      meeting_point: 'Main entrance',
      guide_name: 'Tour Guide',
      is_active: true,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z'
    }
  ]

  const mockUsers: User[] = [
    {
      id: '1',
      email: 'test@example.com',
      full_name: 'Test User',
      institution: 'Test University',
      phone: '1234567890',
      profile_photo: null,
      role: 'user',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z'
    },
    {
      id: '2',
      email: 'admin@example.com',
      full_name: 'Admin User',
      institution: 'Test University',
      phone: '0987654321',
      profile_photo: null,
      role: 'admin',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z'
    }
  ]

  return (
    <div className="p-8 min-h-screen bg-gray-50">
      <h1 className="text-3xl font-bold mb-8">Test useInViewAnimation Fix</h1>
      
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Test 1: Components with useInViewAnimation */}
        <div>
          <h2 className="text-2xl font-semibold mb-4">Components Using useInViewAnimation</h2>
          <TestInView title="Test Component 1" useInView={true} />
          <TestInView title="Test Component 2" useInView={true} />
        </div>

        {/* Test 2: Components without useInViewAnimation */}
        <div>
          <h2 className="text-2xl font-semibold mb-4">Components NOT Using useInViewAnimation</h2>
          <TestInView title="Test Component 3" useInView={false} />
          <TestInView title="Test Component 4" useInView={false} />
        </div>

        {/* Test 3: Original problematic components */}
        <div>
          <h2 className="text-2xl font-semibold mb-4">Original Problematic Components</h2>
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-lg font-medium mb-2">GeneralOverviewCards:</h3>
            <div className="min-h-[200px]">
              <GeneralOverviewCards
                bookings={mockBookings}
                rooms={mockRooms}
                tours={mockTours}
                users={mockUsers}
              />
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-lg font-medium mb-2">RoomOverviewCards:</h3>
            <div className="min-h-[200px]">
              <RoomOverviewCards
                bookings={mockBookings}
                rooms={mockRooms}
              />
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <h3 className="text-lg font-semibold text-blue-800 mb-2">Instructions:</h3>
          <ul className="text-blue-700 space-y-1">
            <li>• Semua komponen harus terlihat di halaman ini</li>
            <li>• Jika ada komponen yang tidak muncul, berarti masih ada masalah</li>
            <li>• GeneralOverviewCards dan RoomOverviewCards harus muncul seperti komponen lainnya</li>
            <li>• Komponen dengan useInViewAnimation harus bisa terlihat dengan animasi</li>
          </ul>
        </div>
      </div>
    </div>
  )
}