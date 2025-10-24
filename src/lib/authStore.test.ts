import { renderHook, act } from '@testing-library/react'
import useAuthStore from './authStore'
import { supabase } from './supabase'
import type { User } from '@supabase/supabase-js'

// Mock Supabase
jest.mock('./supabase', () => ({
  supabase: {
    auth: {
      signInWithPassword: jest.fn(),
      signUp: jest.fn(),
      signInWithOAuth: jest.fn(),
      resetPasswordForEmail: jest.fn(),
      signOut: jest.fn(),
      getUser: jest.fn(),
      onAuthStateChange: jest.fn(),
    },
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(),
        })),
      })),
    })),
  },
}))

// Mock User type
const mockUser: User = {
  id: '123',
  email: 'test@example.com',
  app_metadata: {},
  user_metadata: {},
  aud: 'authenticated',
  created_at: '2023-01-01T00:00:00Z',
  updated_at: '2023-01-01T00:00:00Z',
  email_confirmed_at: '2023-01-01T00:00:00Z',
  phone_confirmed_at: undefined,
  confirmed_at: '2023-01-01T00:00:00Z',
  last_sign_in_at: '2023-01-01T00:00:00Z',
  role: 'authenticated',
  identities: [],
}

// Mock Profile type
const mockProfile = {
  id: '123',
  email: 'test@example.com',
  full_name: 'John Doe',
  institution: 'University',
  phone: '+6281234567890',
  profile_photo: null,
  role: 'user' as const,
  created_at: '2023-01-01T00:00:00Z',
  updated_at: '2023-01-01T00:00:00Z',
}

describe('Auth Store', () => {
  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks()

    // Reset store state
    const { result } = renderHook(() => useAuthStore())
    act(() => {
      result.current.logout()
    })
  })

  describe('fetchUser', () => {
    it('should fetch user successfully', async () => {
      ;(supabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: mockUser },
        error: null,
      })

      // Mock profile fetch
      const mockSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: mockProfile,
            error: null,
          }),
        }),
      })
      ;(supabase.from as jest.Mock).mockReturnValue({
        select: mockSelect,
      })

      const { result } = renderHook(() => useAuthStore())

      await act(async () => {
        await result.current.fetchUser()
      })

      expect(result.current.user).toEqual(mockUser)
      expect(result.current.profile).toEqual(mockProfile)
      expect(result.current.isLoading).toBe(false)
    })

    it('should handle no user', async () => {
      ;(supabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: null },
        error: null,
      })

      const { result } = renderHook(() => useAuthStore())

      await act(async () => {
        await result.current.fetchUser()
      })

      expect(result.current.user).toBe(null)
      expect(result.current.isLoading).toBe(false)
    })
  })

  describe('fetchProfile', () => {
    it('should fetch profile successfully', async () => {
      // Set user first
      const { result } = renderHook(() => useAuthStore())
      act(() => {
        result.current.user = mockUser
      })

      // Mock profile fetch
      const mockSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: mockProfile,
            error: null,
          }),
        }),
      })
      ;(supabase.from as jest.Mock).mockReturnValue({
        select: mockSelect,
      })

      await act(async () => {
        await result.current.fetchProfile()
      })

      expect(result.current.profile).toEqual(mockProfile)
    })

    it('should handle profile fetch error', async () => {
      const { result } = renderHook(() => useAuthStore())
      act(() => {
        result.current.user = mockUser
      })

      const mockSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: null,
            error: { code: 'PGRST116' }, // Not found error
          }),
        }),
      })
      ;(supabase.from as jest.Mock).mockReturnValue({
        select: mockSelect,
      })

      await act(async () => {
        await result.current.fetchProfile()
      })

      expect(result.current.profile).toBe(null)
    })
  })

  describe('login', () => {
    it('should login successfully', async () => {
      const mockUser = { id: '123', email: 'test@example.com' }
      const mockProfile = {
        id: '123',
        email: 'test@example.com',
        full_name: 'John Doe',
        role: 'user'
      }

      ;(supabase.auth.signInWithPassword as jest.Mock).mockResolvedValue({
        data: { user: mockUser },
        error: null,
      })

      const mockSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: mockProfile,
            error: null,
          }),
        }),
      })
      ;(supabase.from as jest.Mock).mockReturnValue({
        select: mockSelect,
      })

      const { result } = renderHook(() => useAuthStore())

      await act(async () => {
        await result.current.login('test@example.com', 'password123')
      })

      expect(result.current.user).toEqual(mockUser)
      expect(result.current.profile).toEqual(mockProfile)
      expect(result.current.isLoading).toBe(false)
    })

    it('should handle login error', async () => {
      const mockError = new Error('Invalid credentials')
      ;(supabase.auth.signInWithPassword as jest.Mock).mockResolvedValue({
        data: null,
        error: mockError,
      })

      const { result } = renderHook(() => useAuthStore())

      await expect(result.current.login('test@example.com', 'wrongpassword')).rejects.toThrow('Invalid credentials')

      expect(result.current.isLoading).toBe(false)
    })
  })

  describe('register', () => {
    it('should register successfully', async () => {
      const mockUser = { id: '123', email: 'test@example.com' }

      ;(supabase.auth.signUp as jest.Mock).mockResolvedValue({
        data: { user: mockUser },
        error: null,
      })

      const { result } = renderHook(() => useAuthStore())

      await act(async () => {
        await result.current.register('test@example.com', 'password123')
      })

      expect(result.current.user).toEqual(mockUser)
      expect(result.current.isLoading).toBe(false)
    })

    it('should handle registration error', async () => {
      const mockError = new Error('Email already exists')
      ;(supabase.auth.signUp as jest.Mock).mockResolvedValue({
        data: null,
        error: mockError,
      })

      const { result } = renderHook(() => useAuthStore())

      await expect(result.current.register('existing@example.com', 'password123')).rejects.toThrow('Email already exists')

      // Check loading state is reset after error
      expect(result.current.isLoading).toBe(false)
    })
  })

  describe('logout', () => {
    it('should logout successfully', async () => {
      // Set initial state
      const { result } = renderHook(() => useAuthStore())
      act(() => {
        result.current.user = mockUser
        result.current.profile = mockProfile
      })

      ;(supabase.auth.signOut as jest.Mock).mockResolvedValue({
        error: null,
      })

      await act(async () => {
        await result.current.logout()
      })

      expect(result.current.user).toBe(null)
      expect(result.current.profile).toBe(null)
      expect(result.current.isLoading).toBe(false)
    })
  })

  describe('updateProfile', () => {
    it('should update profile', () => {
      const { result } = renderHook(() => useAuthStore())
      act(() => {
        result.current.profile = mockProfile
      })

      act(() => {
        result.current.updateProfile({ full_name: 'Jane Doe' })
      })

      expect(result.current.profile?.full_name).toBe('Jane Doe')
    })
  })
})