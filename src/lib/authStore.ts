import { create } from 'zustand'
import { supabase } from './supabase'
import { sessionManager } from './sessionManager'
import { config } from './config'
import type { User, Session } from '@supabase/supabase-js'

interface Profile {
  id: string
  email: string
  full_name: string | null
  institution: string | null
  phone: string | null
  profile_photo: string | null
  created_at: string
  updated_at: string
  role?: string
}

interface AuthState {
  user: User | null
  profile: Profile | null
  session: Session | null
  isLoading: boolean
  sessionWarning: {
    show: boolean
    type: 'first' | 'final' | null
    timeRemaining: number
  }
  fetchUser: () => Promise<void>
  fetchProfile: () => Promise<void>
  register: (email: string, password: string) => Promise<void>
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  updateProfile: (updates: Partial<Profile>) => void
  trackActivity: () => void
  extendSession: () => void
  dismissWarning: () => void
  handleSessionExpired: () => void
}

const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  profile: null,
  session: null,
  isLoading: true,
  sessionWarning: {
    show: false,
    type: null,
    timeRemaining: 0
  },
  fetchUser: async () => {
    set({ isLoading: true })
    const { data: { user, session } } = await supabase.auth.getSession()
    console.log(`AuthStore: fetchUser, user=${user ? user.id : 'null'}`)

    // Initialize session manager with current session
    sessionManager.initialize(session, {
      onWarning: (type, timeRemaining) => {
        set({
          sessionWarning: {
            show: true,
            type,
            timeRemaining
          }
        })
      },
      onExpired: () => {
        get().handleSessionExpired()
      },
      onRefreshed: (newSession) => {
        set({ session: newSession })
      },
      onRefreshFailed: (error) => {
        console.error('AuthStore: Session refresh failed:', error)
        get().handleSessionExpired()
      },
      onActivityDetected: () => {
        // Optional: Handle activity detection if needed
      }
    })

    set({ user, session, isLoading: false })
    if (user) {
      await get().fetchProfile()
    }
  },
  fetchProfile: async () => {
    const { user } = get()
    if (!user) return

    const { data: profileData, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching profile:', error)
    } else if (profileData) {
      set({ profile: profileData })
    }
  },
  register: async (email: string, password: string) => {
    set({ isLoading: true })
    console.log('🔐 AuthStore: Starting registration for:', email)

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${typeof window !== 'undefined' ? window.location.origin : ''}/auth/callback`
      }
    })

    if (error) {
      console.error('❌ AuthStore: Registration failed:', error)
      throw error
    }

    console.log('✅ AuthStore: Registration successful, user:', {
      id: data.user?.id,
      email: data.user?.email,
      emailConfirmed: data.user?.email_confirmed_at ? 'confirmed' : 'pending'
    })

    set({ user: data.user, isLoading: false })
  },
  login: async (email: string, password: string) => {
    set({ isLoading: true })
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error

      console.log(`AuthStore: login success, user=${data.user ? data.user.id : 'null'}`)

      // Initialize session manager with new session
      if (data.session) {
        sessionManager.initialize(data.session, {
          onWarning: (type, timeRemaining) => {
            set({
              sessionWarning: {
                show: true,
                type,
                timeRemaining
              }
            })
          },
          onExpired: () => {
            get().handleSessionExpired()
          },
          onRefreshed: (newSession) => {
            set({ session: newSession })
          },
          onRefreshFailed: (error) => {
            console.error('AuthStore: Session refresh failed:', error)
            get().handleSessionExpired()
          },
          onActivityDetected: () => {
            // Optional: Handle activity detection if needed
          }
        })
      }

      set({ user: data.user, session: data.session, isLoading: false })
      if (data.user) {
        await get().fetchProfile()
      }
    } catch (error) {
      set({ isLoading: false })
      throw error
    }
  },
  logout: async () => {
    console.log('AuthStore: logout called')

    // Clean up session manager
    sessionManager.destroy()

    await supabase.auth.signOut()
    console.log('AuthStore: signOut completed, setting user to null')

    set({
      user: null,
      profile: null,
      session: null,
      isLoading: false,
      sessionWarning: {
        show: false,
        type: null,
        timeRemaining: 0
      }
    })
  },
  updateProfile: (updates: Partial<Profile>) => {
    set((state) => ({
      profile: state.profile ? { ...state.profile, ...updates } : null
    }))
  },
  trackActivity: () => {
    sessionManager.trackActivity()
  },
  extendSession: () => {
    sessionManager.extendSession()
  },
  dismissWarning: () => {
    set({
      sessionWarning: {
        show: false,
        type: null,
        timeRemaining: 0
      }
    })
  },
  handleSessionExpired: () => {
    console.log('AuthStore: Session expired, logging out user')
    set({
      user: null,
      profile: null,
      session: null,
      sessionWarning: {
        show: false,
        type: null,
        timeRemaining: 0
      }
    })
  }
}))

export default useAuthStore