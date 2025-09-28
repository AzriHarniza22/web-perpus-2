'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useRouter, usePathname } from 'next/navigation'
import { useState } from 'react'
import { BarChart3, Building, CheckCircle, Home, Shield, ChevronLeft, ChevronRight, FileText, MapPin } from 'lucide-react'

interface AdminSidebarProps {
  className?: string
  onToggle?: (collapsed: boolean) => void
}

export default function AdminSidebar({ className, onToggle }: AdminSidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [isCollapsed, setIsCollapsed] = useState(false)

  const menuItems = [
    {
      href: '/admin',
      label: 'Dashboard',
      icon: Home,
      active: pathname === '/admin'
    },
    {
      href: '/admin/reservations',
      label: 'Reservations',
      icon: FileText,
      active: pathname === '/admin/reservations'
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
      href: '/admin/tours',
      label: 'Tour Management',
      icon: MapPin,
      active: pathname === '/admin/tours'
    },
    {
      href: '/admin/tour-approvals',
      label: 'Tour Approvals',
      icon: CheckCircle,
      active: pathname === '/admin/tour-approvals'
    },
    {
      href: '/admin/approvals',
      label: 'Persetujuan',
      icon: CheckCircle,
      active: pathname === '/admin/approvals'
    }
  ]

  const toggleSidebar = () => {
    const newCollapsed = !isCollapsed
    setIsCollapsed(newCollapsed)
    onToggle?.(newCollapsed)
  }

  return (
    <div
      className={`fixed left-0 top-0 h-full bg-white/95 dark:bg-gray-900/95 backdrop-blur-lg border-r border-gray-200 dark:border-gray-800 shadow-xl z-40 transition-all duration-300 ${
        isCollapsed ? 'w-16' : 'w-64'
      } ${className}`}
    >
      {/* Toggle Button */}
      <div className="absolute -right-3 top-6 z-50">
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={toggleSidebar}
          className="w-6 h-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full shadow-lg flex items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          <motion.div
            animate={{ rotate: isCollapsed ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronLeft className="w-3 h-3 text-gray-600 dark:text-gray-300" />
          </motion.div>
        </motion.button>
      </div>

      {/* Logo/Brand */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-800">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className={`flex items-center ${isCollapsed ? 'justify-center' : 'space-x-3'}`}
        >
          <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
            <Shield className="w-5 h-5 text-white" />
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
                <h2 className="text-sm font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent whitespace-nowrap">
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
            <li key={item.href}>
              <motion.button
                whileHover={{ scale: isCollapsed ? 1.1 : 1.02 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => router.push(item.href)}
                className={`w-full flex items-center px-3 py-3 rounded-lg transition-all duration-200 ${
                  isCollapsed ? 'justify-center' : 'space-x-3'
                } ${
                  item.active
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-blue-600 dark:hover:text-blue-400'
                }`}
                title={isCollapsed ? item.label : undefined}
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
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
            </li>
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
    </div>
  )
}
