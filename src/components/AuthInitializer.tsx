'use client'

import { useAuth } from '@/hooks/useAuth'

export default function AuthInitializer() {
  // useAuth hook will automatically call fetchUser on mount
  useAuth()

  return null
}