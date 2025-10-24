import { NextRequest } from 'next/server'
import { POST } from '@/app/api/register-fixed/route'

// Mock Supabase
jest.mock('@/lib/supabase', () => ({
  getSupabaseServer: jest.fn(() => ({
    auth: {
      signUp: jest.fn(),
    },
  })),
  getSupabaseAdmin: jest.fn(() => ({
    from: jest.fn(() => ({
      insert: jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn(),
        })),
      })),
    })),
  })),
  dbHelpers: {
    createProfile: jest.fn(),
  },
}))

describe('Registration API Integration Tests', () => {
  const { getSupabaseServer, getSupabaseAdmin, dbHelpers } = require('@/lib/supabase')

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should register user successfully', async () => {
    const mockUser = { id: '123', email: 'test@example.com' }
    const mockProfile = {
      id: '123',
      email: 'test@example.com',
      full_name: 'John Doe',
      institution: 'University',
      phone: '+6281234567890',
      role: 'user',
    }

    // Mock Supabase responses
    const mockSupabase = {
      auth: {
        signUp: jest.fn().mockResolvedValue({
          data: { user: mockUser },
          error: null,
        }),
      },
    }

    const mockSupabaseAdmin = {
      from: jest.fn(() => ({
        insert: jest.fn(() => ({
          select: jest.fn(() => ({
            single: jest.fn().mockResolvedValue({
              data: mockProfile,
              error: null,
            }),
          })),
        })),
      })),
    }

    getSupabaseServer.mockReturnValue(mockSupabase)
    getSupabaseAdmin.mockReturnValue(mockSupabaseAdmin)
    dbHelpers.createProfile.mockResolvedValue(mockProfile)

    const request = new NextRequest('http://localhost:3000/api/register-fixed', {
      method: 'POST',
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'password123',
        fullName: 'John Doe',
        institution: 'University',
        phone: '+6281234567890',
      }),
    })

    const response = await POST(request)
    const result = await response.json()

    expect(response.status).toBe(200)
    expect(result.success).toBe(true)
    expect(result.data.userId).toBe('123')
    expect(result.data.email).toBe('test@example.com')
  })

  it('should handle validation errors', async () => {
    const request = new NextRequest('http://localhost:3000/api/register-fixed', {
      method: 'POST',
      body: JSON.stringify({
        email: 'invalid-email',
        password: '123',
        fullName: '',
        institution: '',
        phone: '',
      }),
    })

    const response = await POST(request)
    const result = await response.json()

    expect(response.status).toBe(400)
    expect(result.success).toBe(false)
    expect(result.error).toBe('Validation failed')
  })

  it('should handle Supabase auth errors', async () => {
    const mockSupabase = {
      auth: {
        signUp: jest.fn().mockResolvedValue({
          data: { user: null },
          error: { message: 'Email already exists' },
        }),
      },
    }

    getSupabaseServer.mockReturnValue(mockSupabase)

    const request = new NextRequest('http://localhost:3000/api/register-fixed', {
      method: 'POST',
      body: JSON.stringify({
        email: 'existing@example.com',
        password: 'password123',
        fullName: 'John Doe',
        institution: 'University',
        phone: '+6281234567890',
      }),
    })

    const response = await POST(request)
    const result = await response.json()

    expect(response.status).toBe(400)
    expect(result.success).toBe(false)
  })

  it('should handle profile creation errors', async () => {
    const mockUser = { id: '123', email: 'test@example.com' }

    const mockSupabase = {
      auth: {
        signUp: jest.fn().mockResolvedValue({
          data: { user: mockUser },
          error: null,
        }),
      },
    }

    getSupabaseServer.mockReturnValue(mockSupabase)
    dbHelpers.createProfile.mockRejectedValue(new Error('Database error'))

    const request = new NextRequest('http://localhost:3000/api/register-fixed', {
      method: 'POST',
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'password123',
        fullName: 'John Doe',
        institution: 'University',
        phone: '+6281234567890',
      }),
    })

    const response = await POST(request)
    const result = await response.json()

    expect(response.status).toBe(500)
    expect(result.success).toBe(false)
  })

  it('should sanitize input data', async () => {
    const mockUser = { id: '123', email: 'test@example.com' }
    const mockProfile = {
      id: '123',
      email: 'test@example.com',
      full_name: 'John Doe',
      institution: 'University',
      phone: '+6281234567890',
      role: 'user',
    }

    const mockSupabase = {
      auth: {
        signUp: jest.fn().mockResolvedValue({
          data: { user: mockUser },
          error: null,
        }),
      },
    }

    const mockSupabaseAdmin = {
      from: jest.fn(() => ({
        insert: jest.fn(() => ({
          select: jest.fn(() => ({
            single: jest.fn().mockResolvedValue({
              data: mockProfile,
              error: null,
            }),
          })),
        })),
      })),
    }

    getSupabaseServer.mockReturnValue(mockSupabase)
    getSupabaseAdmin.mockReturnValue(mockSupabaseAdmin)
    dbHelpers.createProfile.mockResolvedValue(mockProfile)

    const request = new NextRequest('http://localhost:3000/api/register-fixed', {
      method: 'POST',
      body: JSON.stringify({
        email: '  TEST@EXAMPLE.COM  ',
        password: 'password123',
        confirmPassword: 'password123',
        fullName: '  John Doe  ',
        institution: '  University  ',
        phone: '  +6281234567890  ',
      }),
    })

    const response = await POST(request)
    const result = await response.json()

    expect(response.status).toBe(200)
    expect(result.success).toBe(true)

    // Verify that Supabase auth.signUp was called with sanitized email
    expect(mockSupabase.auth.signUp).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password123',
      options: {
        emailRedirectTo: expect.stringContaining('/auth/callback'),
      },
    })
  })

  it('should handle malformed JSON', async () => {
    const request = new NextRequest('http://localhost:3000/api/register-fixed', {
      method: 'POST',
      body: 'invalid json',
    })

    const response = await POST(request)
    const result = await response.json()

    expect(response.status).toBe(500)
    expect(result.success).toBe(false)
  })

  it('should handle missing environment variables', async () => {
    // Temporarily remove environment variable
    const originalEnv = process.env.SUPABASE_SERVICE_ROLE_KEY
    delete process.env.SUPABASE_SERVICE_ROLE_KEY

    const request = new NextRequest('http://localhost:3000/api/register-fixed', {
      method: 'POST',
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'password123',
        fullName: 'John Doe',
        institution: 'University',
        phone: '+6281234567890',
      }),
    })

    const response = await POST(request)
    const result = await response.json()

    expect(response.status).toBe(500)
    expect(result.success).toBe(false)
    expect(result.details).toContain('SUPABASE_SERVICE_ROLE_KEY is missing')

    // Restore environment variable
    process.env.SUPABASE_SERVICE_ROLE_KEY = originalEnv
  })
})