'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Skeleton } from '@/components/ui/skeleton'
import UserSidebar from '@/components/UserSidebar'
import AdminSidebar from '@/components/admin/AdminSidebar'
import { UnifiedPageHeader } from '@/components/ui/unified-page-header'
import { useSkeletonAnimation } from '@/hooks/useSkeletonAnimation'

interface BaseSkeletonProps {
  className?: string
  animated?: boolean
  children: React.ReactNode
  isAdmin?: boolean
  title?: string
  description?: string
  user?: any
  profile?: any
  isLoading?: boolean
}

export const BaseSkeleton: React.FC<BaseSkeletonProps> = ({
  className = '',
  animated = true,
  children,
  isAdmin = false,
  title = 'Loading',
  description = 'Please wait...',
  user = null,
  profile = null,
  isLoading = true
}) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const { fadeIn, slideUp, shimmer } = useSkeletonAnimation()

  // Render Sidebar - Real (not skeleton)
  const SidebarComponent = isAdmin ? AdminSidebar : UserSidebar

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar - Rendered Real */}
      <div data-testid="navigation-skeleton">
        <SidebarComponent onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />
      </div>
      
      {/* Page Header - Rendered Real */}
      <UnifiedPageHeader
        title={title}
        description={description}
        user={user}
        profile={profile}
        sidebarCollapsed={sidebarCollapsed}
        isLoading={isLoading}
      />

      {/* Content Area - Skeleton */}
      <main className={`pb-8 pt-24 transition-all duration-300 ${
        sidebarCollapsed ? 'ml-16' : 'ml-64'
      }`}>
        <div className="max-w-7xl mx-auto px-6">
          {animated ? (
            <motion.div
              {...fadeIn}
              className={className}
            >
              {children}
            </motion.div>
          ) : (
            <div className={className}>
              {children}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

// Export content-only skeleton components for page-specific content
export const ContentSkeleton: React.FC<{
  className?: string
  animated?: boolean
  children: React.ReactNode
}> = ({ className = '', animated = true, children }) => {
  const { fadeIn } = useSkeletonAnimation()

  if (!animated) {
    return <div className={className}>{children}</div>
  }

  return (
    <motion.div
      {...fadeIn}
      className={className}
    >
      {children}
    </motion.div>
  )
}

export default BaseSkeleton