'use client'

import { motion } from 'framer-motion'
import { User } from '@supabase/supabase-js'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { LogOut } from 'lucide-react'
import { useAuth } from '@/components/AuthProvider'

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
  // Profile is not available in the new auth system, remove profile usage

  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className={`fixed top-0 left-0 right-0 z-50 bg-background/90 backdrop-blur-lg border-b border-gray-200 dark:border-gray-800 ${sidebarCollapsed ? 'ml-16' : 'ml-64'}`}
    >
      <div className="px-4 py-3 flex justify-between items-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex-1 min-w-0"
        >
          <h1 className="text-xl lg:text-2xl font-bold text-primary truncate">
            {title}
          </h1>
          {description && (
            <p className="text-xs lg:text-sm text-gray-600 dark:text-gray-400 mt-0.5 truncate">
              {description}
            </p>
          )}
        </motion.div>
        <div className="flex items-center space-x-2 lg:space-x-4 flex-shrink-0">
          {user && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center space-x-2 hidden lg:flex"
            >
              <Avatar className="w-7 h-7">
                <AvatarFallback className="text-xs">
                  {user.email?.[0].toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className="text-black dark:text-white text-sm truncate max-w-[120px]">
                {user.email?.split('@')[0]}
              </span>
            </motion.div>
          )}
          <ThemeToggle />
          {onSignOut && (
            <Button onClick={onSignOut} variant="outline" size="sm" className="px-3">
              <LogOut className="w-4 h-4 lg:mr-2" />
              <span className="hidden lg:inline">Keluar</span>
            </Button>
          )}
        </div>
      </div>
    </motion.header>
  )
}