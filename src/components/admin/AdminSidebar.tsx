'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useRouter, usePathname } from 'next/navigation'
import { useState } from 'react'
import Image from 'next/image'
import { BarChart3, Building, CheckCircle, Home, Shield, ChevronLeft, ChevronRight, History } from 'lucide-react'
import { useHoverAnimation } from '@/hooks/useAnimations'


interface AdminSidebarProps {
  className?: string
  onToggle?: (collapsed: boolean) => void
}

export default function AdminSidebar({ className, onToggle }: AdminSidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [isCollapsed, setIsCollapsed] = useState(false)
  const hoverAnimation = useHoverAnimation()

  const menuItems = [
    {
      href: '/admin',
      label: 'Dashboard',
      icon: Home,
      active: pathname === '/admin'
    },
    {
      href: '/admin/analytics',
      label: 'Analytics & Reports',
      icon: BarChart3,
      active: pathname === '/admin/analytics'
    },
    {
      href: '/admin/rooms',
      label: 'Ruangan',
      icon: Building,
      active: pathname === '/admin/rooms'
    },
    {
      href: '/admin/approvals',
      label: 'Persetujuan',
      icon: CheckCircle,
      active: pathname === '/admin/approvals'
    },
    {
      href: '/admin/history',
      label: 'History',
      icon: History,
      active: pathname === '/admin/history'
    },
    {
      href: '/admin/profile',
      label: 'Profil Admin',
      icon: Shield,
      active: pathname === '/admin/profile'
    }
  ]

  const toggleSidebar = () => {
    const newCollapsed = !isCollapsed
    setIsCollapsed(newCollapsed)
    onToggle?.(newCollapsed)
  }

  return (
    <motion.div
      initial={{ x: -250, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      className={`fixed left-0 top-0 h-full bg-background/95 backdrop-blur-lg border-r border-gray-200 dark:border-gray-800 shadow-xl z-40 transition-all duration-300 ${
        isCollapsed ? 'w-16' : 'w-64'
      } ${className}`}
    >
      {/* Toggle Button */}
      <div className="absolute -right-3 top-6 z-50">
        <motion.button
          {...hoverAnimation}
          onClick={toggleSidebar}
          className="w-6 h-6 bg-background border border-gray-200 dark:border-gray-700 rounded-full shadow-lg flex items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
        >
          <motion.div
            animate={{ rotate: isCollapsed ? 180 : 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            <ChevronLeft className="w-3 h-3 text-gray-600 dark:text-gray-300" />
          </motion.div>
        </motion.button>
      </div>

      {/* Logo/Brand */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-800">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className={`flex items-center ${isCollapsed ? 'justify-center' : 'space-x-3'}`}
        >
          <div className="w-8 h-8 flex items-center justify-center flex-shrink-0">
            <Image
              src="/logo.svg"
              alt="Perpustakaan Aceh Logo"
              width={32}
              height={32}
              className="w-8 h-8"
            />
          </div>
          <AnimatePresence>
            {!isCollapsed && (
              <motion.div
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <h2 className="text-sm font-bold text-primary whitespace-nowrap">
                  Admin Panel
                </h2>
                <p className="text-xs text-gray-600 dark:text-gray-400">Perpustakaan Aceh</p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* Navigation Menu */}
      <nav className="p-3">
        <ul className="space-y-1">
          {menuItems.map((item, index) => (
            <motion.li
              key={item.href}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1, duration: 0.4, ease: "easeOut" }}
            >
              <motion.button
                {...hoverAnimation}
                onClick={() => router.push(item.href)}
                className={`w-full flex items-center px-3 py-3 rounded-lg transition-all duration-200 ${
                  isCollapsed ? 'justify-center' : 'space-x-3'
                } ${
                  item.active
                    ? 'bg-primary text-white shadow-lg'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-primary dark:hover:text-primary-400'
                }`}
                title={isCollapsed ? item.label : undefined}
                whileHover={item.active ? {} : { scale: 1.02, x: 4 }}
                whileTap={{ scale: 0.98 }}
              >
                <item.icon className={`w-5 h-5 flex-shrink-0 ${item.active ? 'text-white' : 'text-gray-700 dark:text-gray-300'}`} />
                <AnimatePresence>
                  {!isCollapsed && (
                    <motion.span
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: 'auto' }}
                      exit={{ opacity: 0, width: 0 }}
                      transition={{ duration: 0.2 }}
                      className="font-medium overflow-hidden whitespace-nowrap"
                    >
                      {item.label}
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.button>
            </motion.li>
          ))}
        </ul>
      </nav>

      {/* Footer */}
      <div className="absolute bottom-0 left-0 right-0 p-3 border-t border-gray-200 dark:border-gray-800">
        <AnimatePresence>
          {!isCollapsed && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="text-xs text-gray-500 dark:text-gray-400 text-center"
            >
              © 2024 Perpustakaan Aceh
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}
