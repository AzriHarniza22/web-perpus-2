'use client'

import { motion } from 'framer-motion'
import { User } from '@supabase/supabase-js'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { LogOut } from 'lucide-react'

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
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
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
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-gray-600 dark:text-gray-300 hidden md:block"
            >
              Selamat datang, {user.email?.split('@')[0]}
            </motion.span>
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