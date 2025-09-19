import { create } from 'zustand'
import { supabase } from './supabase'
import type { User } from '@supabase/supabase-js'

interface AuthState {
  user: User | null
  isLoading: boolean
  fetchUser: () => Promise<void>
  register: (email: string, password: string) => Promise<void>
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  fetchUser: async () => {
    set({ isLoading: true })
    const { data: { user } } = await supabase.auth.getUser()
    set({ user, isLoading: false })
  },
  register: async (email: string, password: string) => {
    set({ isLoading: true })
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${typeof window !== 'undefined' ? window.location.origin : ''}/auth/callback`
      }
    })
    if (error) throw error
    set({ user: data.user, isLoading: false })
  },
  login: async (email: string, password: string) => {
    set({ isLoading: true })
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    set({ user: data.user, isLoading: false })
  },
  logout: async () => {
    await supabase.auth.signOut()
    set({ user: null, isLoading: false })
  }
}))

export default useAuthStore