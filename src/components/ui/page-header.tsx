'use client'

import { motion } from 'framer-motion'
import { User } from '@supabase/supabase-js'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { LogOut } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'

interface PageHeaderProps {
  title: string
  description?: string
  user?: User | null
  onSignOut?: () => void
  sidebarCollapsed?: boolean
}

export function PageHeader({
  title,
  description,
  user,
  onSignOut,
  sidebarCollapsed = false
}: PageHeaderProps) {
  const { profile } = useAuth()

  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className={`bg-white/90 dark:bg-gray-900/90 backdrop-blur-lg border-b border-gray-200 dark:border-gray-800 transition-all duration-300 ${
        sidebarCollapsed ? 'ml-16' : 'ml-64'
      }`}
    >
      <div className="px-6 py-4 flex justify-between items-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex-1"
        >
          <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            {title}
          </h1>
          {description && (
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {description}
            </p>
          )}
        </motion.div>
        <div className="flex items-center space-x-4">
          {user && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center space-x-3 hidden md:flex"
            >
              <Avatar className="w-8 h-8">
                <AvatarImage src={profile?.profile_photo || undefined} alt="Profile" />
                <AvatarFallback className="text-sm">
                  {user.email?.[0].toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className="text-gray-600 dark:text-gray-300">
                Selamat datang, {user.email?.split('@')[0]}
              </span>
            </motion.div>
          )}
          <ThemeToggle />
          {onSignOut && (
            <Button onClick={onSignOut} variant="outline" size="sm">
              <LogOut className="w-4 h-4 mr-2" />
              Keluar
            </Button>
          )}
        </div>
      </div>
    </motion.header>
  )
}