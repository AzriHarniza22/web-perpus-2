import { FileText, Sparkles } from 'lucide-react'
import BookingManagement from '@/components/admin/BookingManagement'
import TourManagement from '@/components/admin/TourManagement'

// Configuration interface for history tabs
export interface HistoryTabConfig {
  id: string
  label: string
  icon: any
  description: string
  component: React.ComponentType<any>
  gradient: string
  headerGradient: string
  features?: string[]
}

// Unified configuration for admin history page
export const HISTORY_TABS_CONFIG: HistoryTabConfig[] = [
  {
    id: 'reservations',
    label: 'Reservations',
    icon: FileText,
    description: 'View, filter, and manage all room reservations',
    component: BookingManagement,
    gradient: 'from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-blue-900 dark:to-purple-900',
    headerGradient: 'from-blue-600 to-purple-600',
    features: [
      'Room booking management',
      'Status tracking',
      'Filter by date, room, status',
      'Bulk operations',
      'Export capabilities'
    ]
  },
  {
    id: 'tours',
    label: 'Tours',
    icon: Sparkles,
    description: 'Kelola semua pemesanan tour perpustakaan',
    component: TourManagement,
    gradient: 'from-gray-50 via-purple-50/30 to-pink-50/30 dark:from-gray-900 dark:via-purple-900/20 dark:to-pink-900/20',
    headerGradient: 'from-purple-600 to-pink-600',
    features: [
      'Tour booking management',
      'Guide assignment',
      'Participant tracking',
      'Meeting point management',
      'Tour scheduling'
    ]
  },
]

// Default tab configuration
export const DEFAULT_HISTORY_TAB = 'reservations'

// Tab navigation configuration
export const TAB_NAVIGATION = {
  showIcons: true,
  showDescriptions: false,
  layout: 'horizontal' as 'horizontal' | 'vertical',
  size: 'default' as 'sm' | 'default' | 'lg',
}

// Animation configuration
export const TAB_ANIMATIONS = {
  transitionDuration: 0.3,
  staggerDelay: 0.1,
  easing: 'easeInOut',
}

// Feature flags for future enhancements
export const HISTORY_FEATURES = {
  enableExport: true,
  enableBulkActions: true,
  enableAdvancedFilters: true,
  enableRealTimeUpdates: false,
  enableNotifications: true,
  enableAuditTrail: false,
}

// API configuration for unified data fetching
export const UNIFIED_API_CONFIG = {
  defaultPageSize: 10,
  maxPageSize: 100,
  cacheTime: 5 * 60 * 1000, // 5 minutes
  retryAttempts: 3,
  retryDelay: 1000,
}

// Styling configuration
export const HISTORY_STYLING = {
  cardOpacity: 'bg-white/90 dark:bg-gray-800/90',
  backdropBlur: 'backdrop-blur-sm',
  borderRadius: 'rounded-lg',
  shadow: 'shadow-lg',
  spacing: {
    section: 'space-y-6',
    element: 'space-y-4',
    inline: 'space-x-4',
  }
}