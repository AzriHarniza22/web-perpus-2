'use client'

import { useEffect } from 'react'
import useAuthStore from '@/lib/authStore'

export default function AuthInitializer() {
  const { fetchUser } = useAuthStore()

  useEffect(() => {
    fetchUser()
  }, [fetchUser])

  return null
}