'use client'

import { Moon, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'
import { Button } from '@/components/ui/button'
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'

const MotionSun = motion(Sun)
const MotionMoon = motion(Moon)

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return null
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
      className="relative h-9 w-9 rounded-full"
      aria-label="Toggle theme"
    >
      <MotionSun
        className="h-4 w-4"
        animate={{
          rotate: theme === 'light' ? 0 : -90,
          scale: theme === 'light' ? 1 : 0
        }}
      />
      <MotionMoon
        className="absolute h-4 w-4"
        animate={{
          rotate: theme === 'dark' ? 0 : 90,
          scale: theme === 'dark' ? 1 : 0
        }}
      />
      <span className="sr-only">Toggle theme</span>
    </Button>
  )
}