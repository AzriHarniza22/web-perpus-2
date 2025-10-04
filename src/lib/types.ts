// Core application types - Consolidated User and Profile interfaces
export interface User {
  id: string
  email: string
  full_name: string | null
  institution: string | null
  phone: string | null
  profile_photo: string | null
  role: 'user' | 'admin'
  created_at: string
  updated_at: string
}

// Use User type for Profile to eliminate duplication
export type Profile = User

export interface RegistrationData {
  email: string
  password: string
  fullName: string
  institution: string
  phone: string
}

export interface ApiResponse<T = unknown> {
  success: boolean
  message?: string
  data?: T
  error?: string
  details?: string
  debug?: Record<string, unknown>
}

export interface AuthState {
  user: User | null
  isLoading: boolean
  error: string | null
}

export interface Room {
  id: string
  name: string
  description: string | null
  capacity: number
  facilities: string[] | null
  photos: string[] | null
  layout: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Booking {
  id: string
  user_id: string
  room_id: string
  start_time: string
  end_time: string
  status: 'pending' | 'approved' | 'rejected' | 'completed' | 'cancelled'
  event_description: string | null
  guest_count: number | null
  proposal_file: string | null
  notes: string | null
  letter: string | null
  is_tour: boolean
  created_at: string
  updated_at: string
  // Tour-specific fields (added by tour schema update)
  tour_meeting_point?: string | null
  tour_guide?: string | null
  tour_duration_minutes?: number | null
}

export interface Tour {
  id: string
  name: string
  description: string | null
  capacity: number
  duration_minutes: number | null
  meeting_point: string | null
  guide_name: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

// API response types
export interface RegistrationResponse {
  success: boolean
  userId: string
  email: string
  profile: Profile
}

import type { Session } from '@supabase/supabase-js'

export interface LoginResponse {
  success: boolean
  user: User
  session: Session
}

// Form validation types
export interface ValidationError {
  field: string
  message: string
}

export interface FormState {
  isSubmitting: boolean
  errors: ValidationError[]
  isValid: boolean
}

// Environment variables type
export interface EnvironmentVariables {
  supabaseUrl: string
  supabaseAnonKey: string
  supabaseServiceRoleKey: string
  emailConfig: {
    host: string
    port: number
    secure: boolean
    user: string
    pass: string
    from: string
  }
}