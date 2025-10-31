import { describe, it, expect, beforeAll, afterAll, jest } from '@jest/globals'

// Mock the auth functions
const mockGetUser = jest.fn() as jest.MockedFunction<any>
const mockCreateClient = jest.fn() as jest.MockedFunction<any>

jest.mock('@/lib/auth/server', () => ({
  getUser: mockGetUser
}))

jest.mock('@/lib/supabase/server', () => ({
  createClient: mockCreateClient
}))

// Mock NextRequest and NextResponse
jest.mock('next/server', () => ({
  NextRequest: jest.fn(),
  NextResponse: {
    json: jest.fn((data: any, options?: { status?: number }) => ({
      json: () => Promise.resolve(data),
      status: options?.status || 200
    }))
  }
}))

describe('Change Password API Integration Tests', () => {
  let mockSupabaseClient: any
  let mockUser: any

  beforeAll(() => {
    // Setup mock user
    mockUser = {
      id: 'test-user-id',
      email: 'test@example.com'
    }

    // Setup mock Supabase client
    mockSupabaseClient = {
      auth: {
        signInWithPassword: jest.fn(),
        updateUser: jest.fn()
      }
    }

    // Mock the getUser function
    mockGetUser.mockResolvedValue(mockUser)

    // Mock the createClient function
    mockCreateClient.mockResolvedValue(mockSupabaseClient)
  })

  afterAll(() => {
    jest.clearAllMocks()
  })

  describe('POST /api/change-password', () => {
    it('should return 401 when user is not authenticated', async () => {
      // Mock unauthenticated user
      mockGetUser.mockResolvedValueOnce(null)

      // Import and call the API handler directly
      const { POST } = await import('@/app/api/change-password/route')

      const mockRequest = {
        json: async () => ({
          currentPassword: 'currentpass',
          newPassword: 'newpassword123'
        })
      } as any

      const response = await POST(mockRequest)
      const result = await response.json()

      expect(response.status).toBe(401)
      expect(result.success).toBe(false)
      expect(result.error).toBe('Authentication required')
    })

    it('should return 400 when current password is missing', async () => {
      const { POST } = await import('@/app/api/change-password/route')

      const mockRequest = {
        json: async () => ({
          newPassword: 'newpassword123'
        })
      } as any

      const response = await POST(mockRequest)
      const result = await response.json()

      expect(response.status).toBe(400)
      expect(result.success).toBe(false)
      expect(result.error).toBe('Current password and new password are required')
    })

    it('should return 400 when new password is missing', async () => {
      const { POST } = await import('@/app/api/change-password/route')

      const mockRequest = {
        json: async () => ({
          currentPassword: 'currentpass'
        })
      } as any

      const response = await POST(mockRequest)
      const result = await response.json()

      expect(response.status).toBe(400)
      expect(result.success).toBe(false)
      expect(result.error).toBe('Current password and new password are required')
    })

    it('should return 400 when new password is too short', async () => {
      const { POST } = await import('@/app/api/change-password/route')

      const mockRequest = {
        json: async () => ({
          currentPassword: 'currentpass',
          newPassword: '12345' // 5 characters
        })
      } as any

      const response = await POST(mockRequest)
      const result = await response.json()

      expect(response.status).toBe(400)
      expect(result.success).toBe(false)
      expect(result.error).toBe('New password must be at least 6 characters long')
    })

    it('should return 400 when current password is incorrect', async () => {
      // Mock sign in failure
      mockSupabaseClient.auth.signInWithPassword.mockResolvedValueOnce({
        data: null,
        error: { message: 'Invalid login credentials' }
      })

      const { POST } = await import('@/app/api/change-password/route')

      const mockRequest = {
        json: async () => ({
          currentPassword: 'wrongpassword',
          newPassword: 'newpassword123'
        })
      } as any

      const response = await POST(mockRequest)
      const result = await response.json()

      expect(response.status).toBe(400)
      expect(result.success).toBe(false)
      expect(result.error).toBe('Current password is incorrect')
      expect(mockSupabaseClient.auth.signInWithPassword).toHaveBeenCalledWith({
        email: mockUser.email,
        password: 'wrongpassword'
      })
    })

    it('should return 500 when password update fails', async () => {
      // Mock successful sign in
      mockSupabaseClient.auth.signInWithPassword.mockResolvedValueOnce({
        data: { user: mockUser },
        error: null
      })

      // Mock update failure
      mockSupabaseClient.auth.updateUser.mockResolvedValueOnce({
        data: null,
        error: { message: 'Update failed' }
      })

      const { POST } = await import('@/app/api/change-password/route')

      const mockRequest = {
        json: async () => ({
          currentPassword: 'currentpass',
          newPassword: 'newpassword123'
        })
      } as any

      const response = await POST(mockRequest)
      const result = await response.json()

      expect(response.status).toBe(500)
      expect(result.success).toBe(false)
      expect(result.error).toBe('Failed to update password')
      expect(mockSupabaseClient.auth.updateUser).toHaveBeenCalledWith({
        password: 'newpassword123'
      })
    })

    it('should successfully change password', async () => {
      // Mock successful sign in
      mockSupabaseClient.auth.signInWithPassword.mockResolvedValueOnce({
        data: { user: mockUser },
        error: null
      })

      // Mock successful update
      mockSupabaseClient.auth.updateUser.mockResolvedValueOnce({
        data: { user: mockUser },
        error: null
      })

      const { POST } = await import('@/app/api/change-password/route')

      const mockRequest = {
        json: async () => ({
          currentPassword: 'currentpass',
          newPassword: 'newpassword123'
        })
      } as any

      const response = await POST(mockRequest)
      const result = await response.json()

      expect(response.status).toBe(200)
      expect(result.success).toBe(true)
      expect(result.message).toBe('Password changed successfully')
      expect(mockSupabaseClient.auth.signInWithPassword).toHaveBeenCalledWith({
        email: mockUser.email,
        password: 'currentpass'
      })
      expect(mockSupabaseClient.auth.updateUser).toHaveBeenCalledWith({
        password: 'newpassword123'
      })
    })

    it('should handle unexpected errors', async () => {
      // Mock getUser to throw an error
      mockGetUser.mockRejectedValueOnce(new Error('Database connection failed'))

      const { POST } = await import('@/app/api/change-password/route')

      const mockRequest = {
        json: async () => ({
          currentPassword: 'currentpass',
          newPassword: 'newpassword123'
        })
      } as any

      const response = await POST(mockRequest)
      const result = await response.json()

      expect(response.status).toBe(500)
      expect(result.success).toBe(false)
      expect(result.error).toBe('An unexpected error occurred')
    })
  })
})