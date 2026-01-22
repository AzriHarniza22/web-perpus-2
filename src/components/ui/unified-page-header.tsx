'use client'

import { motion } from 'framer-motion'
import { User } from '@supabase/supabase-js'
import { Profile } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { LogOut, Shield, ChevronDown, User as UserIcon } from 'lucide-react'
import { fadeVariants, slideVariants, transitions } from '@/lib/animations'
import { createClient } from '@/lib/supabase/client'

interface UnifiedPageHeaderProps {
  title: string
  description?: string
  user?: User | null
  profile?: Profile | null
  isAdmin?: boolean
  sidebarCollapsed?: boolean
  isLoading?: boolean
}

export function UnifiedPageHeader({
  title,
  description,
  user,
  profile,
  isAdmin = false,
  sidebarCollapsed = false,
  isLoading = false
}: UnifiedPageHeaderProps) {
  const supabase = createClient()

  const handleLogout = async () => {
    console.log('[UNIFIED HEADER] Starting logout process')

    try {
      // Redirect immediately to prevent any flash
      window.location.replace('/login')

      // Sign out in background (fire and forget)
      supabase.auth.signOut().catch(error => {
        console.error('[UNIFIED HEADER] Supabase sign out error:', error)
      })

      // Clear storage in background
      setTimeout(() => {
        // Clear localStorage
        const localKeys = []
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i)
          if (key && (key.includes('sb-') || key.includes('supabase') || key.includes('auth'))) {
            localKeys.push(key)
          }
        }
        localKeys.forEach(key => localStorage.removeItem(key))

        // Clear sessionStorage
        for (let i = sessionStorage.length - 1; i >= 0; i--) {
          const key = sessionStorage.key(i)
          if (key && (key.includes('sb-') || key.includes('supabase') || key.includes('auth'))) {
            sessionStorage.removeItem(key)
          }
        }

        // Clear cookies
        const cookies = document.cookie.split(';')
        cookies.forEach(cookie => {
          const eqPos = cookie.indexOf('=')
          const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim()
          if (name && (name.includes('sb-') || name.includes('supabase'))) {
            document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`
          }
        })
      }, 100)

    } catch (error) {
      console.error('[UNIFIED HEADER] Unexpected error:', error)
      // Fallback redirect
      window.location.replace('/login')
    }
  }

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 bg-background/90 backdrop-blur-lg border-b border-gray-200 dark:border-gray-800 ${sidebarCollapsed ? 'ml-16' : 'ml-64'}`}
    >
      <div className="px-4 py-3 flex justify-between items-center">
        {/* Left side: Title and Description */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={slideVariants.left}
          transition={transitions.spring}
          className="flex-1 min-w-0"
        >
          <div className="flex items-center gap-4">
            <div>
              <h1 className="text-xl lg:text-2xl font-bold text-primary truncate">
                {title}
              </h1>
              {description && (
                <p className="text-xs lg:text-sm text-gray-600 dark:text-gray-400 mt-0.5 truncate">
                  {description}
                </p>
              )}
            </div>
          </div>
        </motion.div>

        {/* Right side: User info, Theme toggle, Logout */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={slideVariants.right}
          transition={transitions.spring}
          className="flex items-center space-x-2 lg:space-x-4 flex-shrink-0"
        >
          {(user || isLoading) && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <motion.button
                  initial="hidden"
                  animate="visible"
                  variants={fadeVariants}
                  transition={{ delay: 0.1 }}
                  className="flex items-center space-x-2 hidden lg:flex cursor-pointer rounded-md px-2 py-1 hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none"
                  aria-label="User menu"
                  suppressHydrationWarning={true}
                >
                  <Avatar className="w-7 h-7">
                    <AvatarFallback className="text-xs">
                      {isLoading ? (
                        <div className="w-full h-full bg-gray-300 animate-pulse rounded" />
                      ) : (
                        (profile?.full_name || user?.user_metadata?.full_name || user?.email || 'U')?.[0].toUpperCase()
                      )}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-black dark:text-white text-sm truncate max-w-[220px]">
                    {isLoading ? (
                      <div className="w-32 h-4 bg-gray-300 animate-pulse rounded" />
                    ) : (
                      profile?.full_name || user?.user_metadata?.full_name || (isAdmin ? user?.email : user?.email?.split('@')[0]) || 'Loading...'
                    )}
                  </span>
                  {isAdmin && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.3, ...transitions.bounce }}
                    >
                      <Badge variant="secondary" className="flex items-center gap-1">
                        <Shield className="w-3 h-3" />
                        Admin
                      </Badge>
                    </motion.div>
                  )}
                  <ChevronDown className="w-4 h-4 text-muted-foreground" />
                </motion.button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem
                  onClick={() => window.location.href = isAdmin ? '/admin/profile' : '/profile'}
                  className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 focus:bg-gray-100 dark:focus:bg-gray-800 hover:text-foreground focus:text-foreground"
                >
                  <UserIcon className="w-4 h-4 mr-2" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={handleLogout}
                  className="cursor-pointer text-destructive focus:text-destructive bg-destructive/10 hover:bg-destructive/20 focus:bg-destructive/20"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
          >
            <ThemeToggle />
          </motion.div>

        </motion.div>
      </div>
    </header>
  )
}