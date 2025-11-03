# Skeleton Loading Implementation Guide

## Overview

Dokumen ini berisi panduan lengkap untuk mengimplementasikan skeleton loading menggunakan shadcn/ui pada **semua halaman utama** aplikasi Library Reservation System. Implementasi ini fokus pada pendekatan sederhana namun efektif dengan menggunakan komponen yang sudah tersedia.

## Prerequisites

### Dependencies
- `shadcn/ui` skeleton component (sudah terinstall)
- `framer-motion` untuk animasi (sudah terinstall)
- React 18+ dengan built-in Suspense

### File Structure Saat Ini
```
src/
├── components/
│   ├── ui/
│   │   ├── skeleton.tsx
│   │   └── loading.tsx
│   │   └── skeletons/ (folder baru)
│   │       ├── index.ts
│   │       ├── BaseSkeleton.tsx
│   │       ├── SkeletonPatterns.tsx
│   │       ├── HomepageSkeleton.tsx
│   │       ├── AnalyticsSkeleton.tsx
│   │       ├── ProfileSkeleton.tsx
│   │       ├── BookSkeleton.tsx
│   │       ├── RoomBookingSkeleton.tsx
│   │       ├── BookTourSkeleton.tsx
│   │       ├── HistorySkeleton.tsx
│   │       ├── AdminHistorySkeleton.tsx
│   │       └── AdminApprovalsSkeleton.tsx
├── hooks/
│   └── useAnimations.ts
└── app/
    ├── page.tsx (dashboard/homepage)
    ├── admin/analytics/page.tsx
    ├── profile/page.tsx
    ├── book/page.tsx
    ├── book/[roomId]/page.tsx
    ├── book-tour/page.tsx
    ├── history/page.tsx
    ├── admin/history/page.tsx
    ├── admin/profile/page.tsx
    └── admin/approvals/page.tsx
```

## Halaman yang Dicakup

### ✅ Halaman yang Sudah Diimplementasi
1. **Homepage/Dashboard** (`src/app/page.tsx`) - Hero section + 6 room cards
2. **Analytics** (`src/app/admin/analytics/page.tsx`) - Sidebar + charts + overview cards
3. **Profile** (`src/app/profile/page.tsx`) - User profile form
4. **Book Page** (`src/app/book/page.tsx`) - 6 room cards grid
5. **Book [roomId]** (`src/app/book/[roomId]/page.tsx`) - Room detail + booking form
6. **Book Tour** (`src/app/book-tour/page.tsx`) - Tour booking layout

### ➕ Halaman Tambahan yang Perlu Ditambahkan
7. **History** (`src/app/history/page.tsx`) - Booking history list
8. **Admin History** (`src/app/admin/history/page.tsx`) - Admin booking management
9. **Admin Profile** (`src/app/admin/profile/page.tsx`) - Admin profile management
10. **Admin Approvals** (`src/app/admin/approvals/page.tsx`) - Booking approvals dashboard

## Architecture Design

### Core Components

#### 1. Base Skeleton Components
```tsx
// components/ui/skeletons/BaseSkeleton.tsx
import { Skeleton } from "@/components/ui/skeleton"
import { motion } from "framer-motion"

interface BaseSkeletonProps {
  className?: string
  animated?: boolean
}

export const BaseSkeleton: React.FC<BaseSkeletonProps> = ({
  className,
  animated = true,
  children
}) => {
  if (!animated) {
    return <div className={className}>{children}</div>
  }

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {children}
    </motion.div>
  )
}
```

#### 2. Reusable Skeleton Patterns
```tsx
// components/ui/skeletons/SkeletonPatterns.tsx
import { Skeleton } from "@/components/ui/skeleton"

export const CardSkeleton: React.FC<{ className?: string }> = ({ className }) => (
  <div className={`bg-card rounded-lg p-6 space-y-4 ${className || ''}`}>
    <Skeleton className="h-4 w-3/4" />
    <Skeleton className="h-4 w-1/2" />
    <div className="space-y-2">
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-3 w-4/5" />
      <Skeleton className="h-3 w-2/3" />
    </div>
  </div>
)

export const RoomCardSkeleton: React.FC = () => (
  <CardSkeleton className="h-80">
    <Skeleton className="h-48 w-full rounded-md" />
    <Skeleton className="h-6 w-3/4 mt-4" />
    <Skeleton className="h-4 w-1/2" />
    <div className="flex gap-2 mt-4">
      <Skeleton className="h-6 w-16" />
      <Skeleton className="h-6 w-20" />
      <Skeleton className="h-6 w-14" />
    </div>
  </CardSkeleton>
)
```

### Page-Specific Skeleton Components

#### 1. HomepageSkeleton
```tsx
// components/ui/skeletons/HomepageSkeleton.tsx
import { BaseSkeleton } from "./BaseSkeleton"
import { RoomCardSkeleton } from "./SkeletonPatterns"
import { Skeleton } from "@/components/ui/skeleton"

export const HomepageSkeleton: React.FC = () => (
  <BaseSkeleton className="min-h-screen bg-background">
    {/* Navigation Skeleton */}
    <Skeleton className="fixed top-0 left-0 right-0 z-50 bg-background/90 backdrop-blur-lg border-b h-20" />

    {/* Hero Section Skeleton */}
    <section className="relative min-h-screen flex items-center justify-center pt-20">
      <div className="px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Hero Text Skeleton */}
          <div className="text-center lg:text-left space-y-6">
            <div className="space-y-4">
              <Skeleton className="h-16 w-full max-w-lg mx-auto lg:mx-0" />
              <Skeleton className="h-16 w-3/4 max-w-md mx-auto lg:mx-0" />
              <Skeleton className="h-6 w-full max-w-xl mx-auto lg:mx-0" />
            </div>
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Skeleton className="h-12 w-48" />
            </div>
          </div>

          {/* Calendar Skeleton */}
          <div className="relative">
            <div className="bg-card rounded-2xl shadow-xl p-6">
              <Skeleton className="h-8 w-48 mb-4" />
              <div className="grid grid-cols-7 gap-2 mb-4">
                {[...Array(7)].map((_, i) => (
                  <Skeleton key={i} className="h-6 w-8" />
                ))}
              </div>
              <div className="grid grid-cols-7 gap-2">
                {[...Array(35)].map((_, i) => (
                  <Skeleton key={i} className="h-8 w-8 rounded" />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    {/* Rooms Section Skeleton */}
    <section className="py-20 bg-background">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <Skeleton className="h-12 w-64 mx-auto mb-6" />
          <Skeleton className="h-6 w-96 mx-auto" />
        </div>

        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[...Array(6)].map((_, i) => (
              <RoomCardSkeleton key={i} />
            ))}
          </div>
        </div>
      </div>
    </section>
  </BaseSkeleton>
)
```

#### 2. AnalyticsSkeleton
```tsx
// components/ui/skeletons/AnalyticsSkeleton.tsx
import { BaseSkeleton } from "./BaseSkeleton"
import { Skeleton } from "@/components/ui/skeleton"

export const AnalyticsSkeleton: React.FC = () => (
  <BaseSkeleton className="min-h-screen bg-gradient-to-br from-primary/10 via-primary/5 to-secondary/10">
    {/* Sidebar Skeleton */}
    <div className="fixed left-0 top-0 h-full w-64 bg-white dark:bg-gray-900 border-r">
      <div className="p-6 border-b">
        <Skeleton className="h-8 w-32" />
      </div>
      <div className="p-4 space-y-2">
        {[...Array(8)].map((_, i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
    </div>

    {/* Header Skeleton */}
    <div className="ml-64 bg-white/90 backdrop-blur-lg border-b h-16">
      <div className="px-6 h-full flex justify-between items-center">
        <div>
          <Skeleton className="h-6 w-48 mb-1" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="flex items-center space-x-4">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-16" />
          <Skeleton className="h-8 w-20" />
        </div>
      </div>
    </div>

    {/* Content Skeleton */}
    <main className="ml-64 p-6">
      <div className="mb-8">
        <Skeleton className="h-8 w-64 mb-2" />
        <Skeleton className="h-5 w-96" />
      </div>

      {/* Overview Cards Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-card rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <Skeleton className="h-4 w-20 mb-2" />
                <Skeleton className="h-8 w-16" />
              </div>
              <Skeleton className="w-12 h-12 rounded-full" />
            </div>
          </div>
        ))}
      </div>

      {/* Charts Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-card rounded-lg p-6">
            <Skeleton className="h-6 w-32 mb-4" />
            <Skeleton className="h-64 w-full" />
          </div>
        ))}
      </div>
    </main>
  </BaseSkeleton>
)
```

#### 3. ProfileSkeleton
```tsx
// components/ui/skeletons/ProfileSkeleton.tsx
import { BaseSkeleton } from "./BaseSkeleton"
import { Skeleton } from "@/components/ui/skeleton"

export const ProfileSkeleton: React.FC = () => (
  <BaseSkeleton className="min-h-screen bg-background">
    {/* Sidebar Skeleton */}
    <div className="fixed left-0 top-0 h-full w-64 bg-white dark:bg-gray-900 border-r">
      <div className="p-4 space-y-2">
        {[...Array(6)].map((_, i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
    </div>

    {/* Header Skeleton */}
    <div className="ml-64 pt-24 px-6 pb-8">
      <div className="mb-8">
        <Skeleton className="h-8 w-32 mb-2" />
        <Skeleton className="h-4 w-48" />
      </div>
    </div>

    {/* Profile Card Skeleton */}
    <div className="ml-64 px-6">
      <div className="max-w-2xl mx-auto">
        <div className="bg-card rounded-lg p-6 space-y-6">
          {/* Profile Photo */}
          <div className="flex flex-col items-center space-y-4 mb-6">
            <Skeleton className="w-24 h-24 rounded-full" />
            <Skeleton className="h-6 w-32" />
          </div>

          {/* Form Fields */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-10 w-full" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-10 w-full" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-10 w-full" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-10 w-full" />
            </div>
          </div>

          {/* Account Info */}
          <div className="pt-4 border-t border-gray-200 dark:border-gray-700 mt-6">
            <Skeleton className="h-5 w-24 mb-3" />
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Skeleton className="h-3 w-20 mb-1" />
                <Skeleton className="h-4 w-24" />
              </div>
              <div>
                <Skeleton className="h-3 w-24 mb-1" />
                <Skeleton className="h-4 w-20" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </BaseSkeleton>
)
```

#### 4. BookSkeleton (6 Room Cards)
```tsx
// components/ui/skeletons/BookSkeleton.tsx
import { BaseSkeleton } from "./BaseSkeleton"
import { RoomCardSkeleton } from "./SkeletonPatterns"
import { Skeleton } from "@/components/ui/skeleton"

export const BookSkeleton: React.FC = () => (
  <BaseSkeleton className="min-h-screen bg-background">
    {/* Sidebar Skeleton */}
    <div className="fixed left-0 top-0 h-full w-64 bg-white dark:bg-gray-900 border-r">
      <div className="p-6 border-b">
        <Skeleton className="h-8 w-32" />
      </div>
      <div className="p-4 space-y-2">
        {[...Array(6)].map((_, i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
    </div>

    {/* Header Skeleton */}
    <div className="ml-64 pt-24 px-6 pb-8">
      <div className="mb-8">
        <Skeleton className="h-8 w-48 mb-2" />
        <Skeleton className="h-5 w-64" />
      </div>
    </div>

    {/* Room Cards Grid */}
    <div className="ml-64 px-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <RoomCardSkeleton key={i} />
        ))}
      </div>
    </div>
  </BaseSkeleton>
)
```

#### 5. RoomBookingSkeleton
```tsx
// components/ui/skeletons/RoomBookingSkeleton.tsx
import { BaseSkeleton } from "./BaseSkeleton"
import { Skeleton } from "@/components/ui/skeleton"

export const RoomBookingSkeleton: React.FC = () => (
  <BaseSkeleton className="min-h-screen bg-background">
    {/* Sidebar Skeleton */}
    <div className="fixed left-0 top-0 h-full w-64 bg-white dark:bg-gray-900 border-r">
      <div className="p-4 space-y-2">
        {[...Array(6)].map((_, i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
    </div>

    {/* Header Skeleton */}
    <div className="ml-64 pt-24 px-6 pb-8">
      <div className="mb-8">
        <Skeleton className="h-8 w-48 mb-2" />
        <Skeleton className="h-4 w-64" />
      </div>
    </div>

    {/* Content Skeleton */}
    <div className="ml-64 px-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Image Gallery Skeleton */}
        <div>
          <Skeleton className="h-64 w-full rounded-md mb-4" />
          <div className="grid grid-cols-4 gap-2">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-16 w-full rounded" />
            ))}
          </div>
        </div>

        {/* Room Info Skeleton */}
        <div className="space-y-6">
          <div>
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />

            <div className="flex items-center gap-2 mt-4">
              <Skeleton className="w-5 h-5 rounded" />
              <Skeleton className="h-4 w-24" />
            </div>
            <div className="flex items-center gap-2">
              <Skeleton className="w-5 h-5 rounded" />
              <Skeleton className="h-4 w-20" />
            </div>
            <div className="flex items-center gap-2">
              <Skeleton className="w-5 h-5 rounded" />
              <Skeleton className="h-4 w-28" />
            </div>
          </div>

          <div className="pt-4 border-t">
            <Skeleton className="h-6 w-16 mb-2" />
            <Skeleton className="h-8 w-24" />
          </div>

          <Skeleton className="h-12 w-full mt-6" />
        </div>
      </div>

      {/* Additional Info Skeleton */}
      <div className="mt-8">
        <Skeleton className="h-6 w-32 mb-4" />
        <div className="space-y-3">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-4/5" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-5/6" />
        </div>
      </div>
    </div>
  </BaseSkeleton>
)
```

#### 6. BookTourSkeleton
```tsx
// components/ui/skeletons/BookTourSkeleton.tsx
import { BaseSkeleton } from "./BaseSkeleton"
import { Skeleton } from "@/components/ui/skeleton"

export const BookTourSkeleton: React.FC = () => (
  <BaseSkeleton className="h-screen bg-gradient-to-br from-primary-50 via-indigo-50 to-secondary-50">
    {/* Sidebar Skeleton */}
    <div className="fixed left-0 top-0 h-full w-64 bg-white dark:bg-gray-900 border-r">
      <div className="p-4 space-y-2">
        {[...Array(6)].map((_, i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
    </div>

    {/* Header Skeleton */}
    <div className="ml-64 pt-24 px-6">
      <div className="mb-6">
        <Skeleton className="h-8 w-48 mb-2" />
        <Skeleton className="h-4 w-32" />
      </div>
    </div>

    {/* Three Column Layout */}
    <div className="ml-64 h-[calc(100vh-120px)] flex flex-col md:flex-row gap-4 px-6">
      {/* Tour Info Card */}
      <div className="flex-1">
        <div className="bg-card rounded-lg p-6 h-full">
          <Skeleton className="h-8 w-32 mb-4" />
          <Skeleton className="h-48 w-full mb-4" />
          <div className="space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        </div>
      </div>

      {/* Calendar Card */}
      <div className="flex-1">
        <div className="bg-card rounded-lg p-6 h-full">
          <Skeleton className="h-8 w-32 mb-4" />
          <div className="grid grid-cols-7 gap-2 mb-4">
            {[...Array(7)].map((_, i) => (
              <Skeleton key={i} className="h-6 w-8" />
            ))}
          </div>
          <div className="grid grid-cols-7 gap-2">
            {[...Array(35)].map((_, i) => (
              <Skeleton key={i} className="h-8 w-8 rounded" />
            ))}
          </div>
        </div>
      </div>

      {/* Form Card */}
      <div className="flex-1">
        <div className="bg-card rounded-lg p-6 h-full">
          <Skeleton className="h-8 w-40 mb-4" />
          <div className="space-y-4">
            <div className="space-y-2">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-10 w-full" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-10 w-full" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-10 w-full" />
            </div>
            <Skeleton className="h-12 w-full mt-6" />
          </div>
        </div>
      </div>
    </div>
  </BaseSkeleton>
)
```

#### 7. HistorySkeleton (User History)
```tsx
// components/ui/skeletons/HistorySkeleton.tsx
import { BaseSkeleton } from "./BaseSkeleton"
import { Skeleton } from "@/components/ui/skeleton"

export const HistorySkeleton: React.FC = () => (
  <BaseSkeleton className="min-h-screen bg-background">
    {/* Sidebar Skeleton */}
    <div className="fixed left-0 top-0 h-full w-64 bg-white dark:bg-gray-900 border-r">
      <div className="p-4 space-y-2">
        {[...Array(6)].map((_, i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
    </div>

    {/* Header Skeleton */}
    <div className="ml-64 pt-24 px-6 pb-8">
      <div className="mb-8">
        <Skeleton className="h-8 w-48 mb-2" />
        <Skeleton className="h-4 w-64" />
      </div>
    </div>

    {/* History Cards */}
    <div className="ml-64 px-6">
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="bg-card rounded-lg p-6 border-l-4 border-l-yellow-500">
            <div className="flex justify-between items-start mb-4">
              <div>
                <Skeleton className="h-6 w-32 mb-2" />
                <div className="flex items-center gap-2 text-sm">
                  <Skeleton className="w-4 h-4" />
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="w-4 h-4" />
                  <Skeleton className="h-4 w-20" />
                </div>
              </div>
              <Skeleton className="h-6 w-20 rounded-full" />
            </div>

            <div className="space-y-2 mb-4">
              <div>
                <Skeleton className="h-4 w-16 mb-1" />
                <Skeleton className="h-4 w-full" />
              </div>
              <div>
                <Skeleton className="h-4 w-12 mb-1" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            </div>

            <Skeleton className="h-3 w-48" />
          </div>
        ))}
      </div>
    </div>
  </BaseSkeleton>
)
```

#### 8. AdminHistorySkeleton
```tsx
// components/ui/skeletons/AdminHistorySkeleton.tsx
import { BaseSkeleton } from "./BaseSkeleton"
import { Skeleton } from "@/components/ui/skeleton"

export const AdminHistorySkeleton: React.FC = () => (
  <BaseSkeleton className="min-h-screen bg-gradient-to-br from-primary/10 via-primary/5 to-secondary/10">
    {/* Sidebar Skeleton */}
    <div className="fixed left-0 top-0 h-full w-64 bg-white dark:bg-gray-900 border-r">
      <div className="p-6 border-b">
        <Skeleton className="h-8 w-32" />
      </div>
      <div className="p-4 space-y-2">
        {[...Array(8)].map((_, i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
    </div>

    {/* Header Skeleton */}
    <div className="ml-64 bg-white/90 backdrop-blur-lg border-b h-16">
      <div className="px-6 h-full flex justify-between items-center">
        <div>
          <Skeleton className="h-6 w-48 mb-1" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-8 w-20" />
      </div>
    </div>

    {/* Content Skeleton */}
    <div className="ml-64 p-6">
      <div className="mb-8">
        <Skeleton className="h-8 w-64 mb-2" />
        <Skeleton className="h-5 w-96" />
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-card rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <Skeleton className="h-4 w-20 mb-2" />
                <Skeleton className="h-8 w-16" />
              </div>
              <Skeleton className="w-12 h-12 rounded-full" />
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg mb-6">
        <Skeleton className="h-10 w-24" />
        <Skeleton className="h-10 w-20" />
      </div>

      {/* Content Area */}
      <Skeleton className="h-96 w-full rounded-lg" />
    </div>
  </BaseSkeleton>
)
```

#### 9. AdminProfileSkeleton
```tsx
// components/ui/skeletons/AdminProfileSkeleton.tsx
import { BaseSkeleton } from "./BaseSkeleton"
import { Skeleton } from "@/components/ui/skeleton"

export const AdminProfileSkeleton: React.FC = () => (
  <BaseSkeleton className="min-h-screen bg-background">
    {/* Sidebar Skeleton */}
    <div className="fixed left-0 top-0 h-full w-64 bg-white dark:bg-gray-900 border-r">
      <div className="p-6 border-b">
        <Skeleton className="h-8 w-32" />
      </div>
      <div className="p-4 space-y-2">
        {[...Array(6)].map((_, i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
    </div>

    {/* Header Skeleton */}
    <div className="ml-64 pt-24 px-6 pb-8">
      <div className="mb-8">
        <Skeleton className="h-8 w-48 mb-2" />
        <Skeleton className="h-4 w-64" />
      </div>
    </div>

    {/* Profile Card Skeleton */}
    <div className="ml-64 px-6">
      <div className="max-w-2xl mx-auto">
        <div className="bg-card rounded-lg p-6 space-y-6">
          {/* Profile Photo */}
          <div className="flex flex-col items-center">
            <Skeleton className="w-24 h-24 rounded-full" />
            <Skeleton className="h-6 w-32 mt-4" />
          </div>

          {/* Role (Read-only) */}
          <div className="space-y-2">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-10 w-full" />
          </div>

          {/* Form Fields */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-10 w-full" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-10 w-full" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-10 w-full" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-10 w-full" />
            </div>
          </div>

          {/* Account Info */}
          <div className="pt-4 border-t space-y-2">
            <Skeleton className="h-5 w-24 mb-3" />
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Skeleton className="h-3 w-20 mb-1" />
                <Skeleton className="h-4 w-24" />
              </div>
              <div>
                <Skeleton className="h-3 w-24 mb-1" />
                <Skeleton className="h-4 w-20" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </BaseSkeleton>
)
```

#### 10. AdminApprovalsSkeleton
```tsx
// components/ui/skeletons/AdminApprovalsSkeleton.tsx
import { BaseSkeleton } from "./BaseSkeleton"
import { Skeleton } from "@/components/ui/skeleton"

export const AdminApprovalsSkeleton: React.FC = () => (
  <BaseSkeleton className="min-h-screen bg-gradient-to-br from-primary/10 via-primary/5 to-secondary/10">
    {/* Sidebar Skeleton */}
    <div className="fixed left-0 top-0 h-full w-64 bg-white dark:bg-gray-900 border-r">
      <div className="p-6 border-b">
        <Skeleton className="h-8 w-32" />
      </div>
      <div className="p-4 space-y-2">
        {[...Array(8)].map((_, i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
    </div>

    {/* Header Skeleton */}
    <div className="ml-64 bg-white/90 backdrop-blur-lg border-b h-16">
      <div className="px-6 h-full flex justify-between items-center">
        <div>
          <Skeleton className="h-6 w-48 mb-1" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-8 w-20" />
      </div>
    </div>

    {/* Content Skeleton */}
    <div className="ml-64 p-6">
      <div className="mb-8">
        <Skeleton className="h-8 w-64 mb-2" />
        <Skeleton className="h-5 w-96" />
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-card rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <Skeleton className="h-4 w-20 mb-2" />
                <Skeleton className="h-8 w-16" />
              </div>
              <Skeleton className="w-12 h-12 rounded-full" />
            </div>
          </div>
        ))}
      </div>

      {/* Approvals Card */}
      <div className="bg-card rounded-lg p-6">
        <div className="flex items-center mb-4">
          <Skeleton className="w-5 h-5 mr-2" />
          <Skeleton className="h-6 w-48" />
        </div>
        <Skeleton className="h-4 w-64 mb-6" />

        {/* Booking Items */}
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="p-4 bg-muted/50 rounded-lg">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <Skeleton className="h-5 w-32 mb-1" />
                  <Skeleton className="h-4 w-48" />
                </div>
                <Skeleton className="h-6 w-16 rounded-full" />
              </div>
              <div className="flex space-x-2">
                <Skeleton className="h-8 w-20" />
                <Skeleton className="h-8 w-20" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  </BaseSkeleton>
)
```

### Index File
```tsx
// components/ui/skeletons/index.ts
export { BaseSkeleton } from './BaseSkeleton'
export { HomepageSkeleton } from './HomepageSkeleton'
export { AnalyticsSkeleton } from './AnalyticsSkeleton'
export { ProfileSkeleton } from './ProfileSkeleton'
export { BookSkeleton } from './BookSkeleton'
export { RoomBookingSkeleton } from './RoomBookingSkeleton'
export { BookTourSkeleton } from './BookTourSkeleton'
export { HistorySkeleton } from './HistorySkeleton'
export { AdminHistorySkeleton } from './AdminHistorySkeleton'
export { AdminProfileSkeleton } from './AdminProfileSkeleton'
export { AdminApprovalsSkeleton } from './AdminApprovalsSkeleton'
export { CardSkeleton, RoomCardSkeleton } from './SkeletonPatterns'
```

## Implementation Steps

### Step 1: Create Skeleton Components Folder
```bash
mkdir -p src/components/ui/skeletons
```

### Step 2: Create Base Components
1. Buat `BaseSkeleton.tsx`
2. Buat `SkeletonPatterns.tsx`
3. Buat index file

### Step 3: Create Page-Specific Skeletons
1. `HomepageSkeleton.tsx`
2. `AnalyticsSkeleton.tsx`
3. `ProfileSkeleton.tsx`
4. `BookSkeleton.tsx`
5. `RoomBookingSkeleton.tsx`
6. `BookTourSkeleton.tsx`

### Step 4: Update Page Components

#### Homepage Implementation
```tsx
// src/app/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/components/AuthProvider'
import { HomepageSkeleton } from '@/components/ui/skeletons'
import HomePage from './HomePage'

export default function Page() {
  const { user, isLoading: authLoading } = useAuth()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!authLoading) {
      // Simulate additional loading time if needed
      const timer = setTimeout(() => setLoading(false), 500)
      return () => clearTimeout(timer)
    }
  }, [authLoading])

  if (loading) {
    return <HomepageSkeleton />
  }

  return <HomePage />
}
```

#### Analytics Page Implementation
```tsx
// src/app/admin/analytics/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/components/AuthProvider'
import { useRouter } from 'next/navigation'
import { AnalyticsSkeleton } from '@/components/ui/skeletons'
import AnalyticsDashboard from '@/components/admin/AnalyticsDashboard'

export default function AnalyticsPage() {
  const { user, isLoading: authLoading } = useAuth()
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push('/login')
        return
      }
      setLoading(false)
    }
  }, [user, authLoading, router])

  if (loading || authLoading) {
    return <AnalyticsSkeleton />
  }

  return <AnalyticsDashboard />
}
```

#### Profile Page Implementation
```tsx
// src/app/profile/page.tsx
'use client'

import { useEffect } from 'react'
import { useAuth } from '@/components/AuthProvider'
import { useRouter } from 'next/navigation'
import { ProfileSkeleton } from '@/components/ui/skeletons'
import ProfileContent from './ProfileContent'

export default function ProfilePage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login')
    }
  }, [isLoading, user, router])

  if (isLoading) {
    return <ProfileSkeleton />
  }

  return <ProfileContent />
}
```

#### Book Page Implementation (6 Cards)
```tsx
// src/app/book/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { BookSkeleton } from '@/components/ui/skeletons'
import BookContent from './BookContent'
import type { Room } from '@/lib/types'

export default function BookPage() {
  const [rooms, setRooms] = useState<Room[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchRooms() {
      try {
        const { data, error } = await supabase
          .from('rooms')
          .select('*')
          .eq('is_active', true)

        if (error) throw error
        setRooms(data || [])
      } catch (error) {
        console.error('Error fetching rooms:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchRooms()
  }, [])

  if (loading) {
    return <BookSkeleton />
  }

  return <BookContent rooms={rooms} />
}
```

#### Room Booking Page Implementation
```tsx
// src/app/book/[roomId]/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/components/AuthProvider'
import { RoomBookingSkeleton } from '@/components/ui/skeletons'
import RoomBookingContent from './RoomBookingContent'
import type { Room } from '@/lib/types'

interface PageProps {
  params: { roomId: string }
}

export default function RoomBookingPage({ params }: PageProps) {
  const roomId = params.roomId
  const { user, isLoading: authLoading } = useAuth()
  const [room, setRoom] = useState<Room | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!authLoading && user) {
      // Fetch room data
      setLoading(false)
    }
  }, [roomId, user, authLoading])

  if (authLoading || loading) {
    return <RoomBookingSkeleton />
  }

  return <RoomBookingContent room={room} />
}
```

#### Book Tour Page Implementation
```tsx
// src/app/book-tour/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/components/AuthProvider'
import { BookTourSkeleton } from '@/components/ui/skeletons'
import BookTourContent from './BookTourContent'
import type { Tour } from '@/lib/types'

export default function BookTourPage() {
  const { user, isLoading: authLoading } = useAuth()
  const [tour, setTour] = useState<Tour | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!authLoading && user) {
      // Fetch tour data
      setLoading(false)
    }
  }, [user, authLoading])

  if (authLoading || loading) {
    return <BookTourSkeleton />
  }

  return <BookTourContent tour={tour} />
}
```

#### History Page Implementation
```tsx
// src/app/history/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { HistorySkeleton } from '@/components/ui/skeletons'
import HistoryContent from './HistoryContent'
import type { BookingWithRoom } from '@/lib/types'

export default function HistoryPage() {
  const [bookings, setBookings] = useState<BookingWithRoom[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const router = useRouter()

  useEffect(() => {
    const checkAuthAndFetchBookings = async () => {
      const { data: { user: currentUser } } = await supabase.auth.getUser()
      setUser(currentUser)

      if (!currentUser) {
        router.push('/login')
        return
      }

      const { data: bookingsData } = await supabase
        .from('bookings')
        .select(`
          *,
          rooms:room_id (
            name
          )
        `)
        .eq('user_id', currentUser.id)
        .order('created_at', { ascending: false })

      setBookings(bookingsData || [])
      setLoading(false)
    }

    checkAuthAndFetchBookings()
  }, [router])

  if (loading) {
    return <HistorySkeleton />
  }

  if (!user) {
    return null // Will redirect
  }

  return <HistoryContent bookings={bookings} />
}
```

#### Admin History Page Implementation
```tsx
// src/app/admin/history/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/components/AuthProvider'
import { AdminHistorySkeleton } from '@/components/ui/skeletons'
import AdminHistoryContent from './AdminHistoryContent'

interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  role: 'user' | 'admin';
}

export default function AdminHistoryPage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const { user, isLoading: authLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    const checkAuth = async () => {
      if (!user) {
        router.push('/login')
        return
      }

      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (profileData?.role !== 'admin') {
        router.push('/')
        return
      }

      setProfile(profileData)
      setLoading(false)
    }

    if (user) {
      checkAuth()
    } else if (!authLoading && !user) {
      router.push('/login')
      setLoading(false)
    }
  }, [user, router, authLoading])

  if (loading) {
    return <AdminHistorySkeleton />
  }

  if (!profile) {
    return null
  }

  return <AdminHistoryContent />
}
```

#### Admin Profile Page Implementation
```tsx
// src/app/admin/profile/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/components/AuthProvider'
import { AdminProfileSkeleton } from '@/components/ui/skeletons'
import AdminProfileContent from './AdminProfileContent'

interface AdminProfile {
  id: string
  email: string
  full_name: string | null
  institution: string | null
  phone: string | null
  role: string
}

export default function AdminProfilePage() {
  const { user, isLoading } = useAuth()
  const [profile, setProfile] = useState<AdminProfile | null>(null)
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login')
      return
    }

    if (user) {
      const checkAdminRole = async () => {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single()

        if (profileData?.role !== 'admin') {
          router.push('/dashboard')
          return
        }
      }

      checkAdminRole()

      const fetchProfile = async () => {
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()

        if (data) {
          setProfile(data)
        }
      }
      fetchProfile()
    }
  }, [user, isLoading, router])

  if (isLoading) {
    return <AdminProfileSkeleton />
  }

  if (!user) {
    return null // Will redirect
  }

  return <AdminProfileContent profile={profile} />
}
```

#### Admin Approvals Page Implementation
```tsx
// src/app/admin/approvals/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/components/AuthProvider'
import { AdminApprovalsSkeleton } from '@/components/ui/skeletons'
import AdminApprovalsContent from './AdminApprovalsContent'

interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  role: 'user' | 'admin';
}

export default function ApprovalsPage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const { user, isLoading: authLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    const checkAuth = async () => {
      if (!user) {
        router.push('/login')
        return
      }

      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (profileData?.role !== 'admin') {
        router.push('/')
        return
      }

      setProfile(profileData)
      setLoading(false)
    }

    if (user) {
      checkAuth()
    } else if (!authLoading && !user) {
      router.push('/login')
      setLoading(false)
    }
  }, [user, router, authLoading])

  if (loading) {
    return <AdminApprovalsSkeleton />
  }

  if (!profile) {
    return null
  }

  return <AdminApprovalsContent />
}
```

### Step 5: Add Animations (Optional)
```tsx
// hooks/useSkeletonAnimation.ts
import { useReducedMotion } from 'framer-motion'

export const useSkeletonAnimation = () => {
  const shouldReduceMotion = useReducedMotion()

  return {
    fadeIn: {
      initial: { opacity: 0 },
      animate: { opacity: 1 },
      transition: { duration: 0.3 }
    },
    slideUp: {
      initial: { opacity: 0, y: 20 },
      animate: { opacity: 1, y: 0 },
      transition: { duration: 0.3 }
    }
  }
}
```

### Step 6: Testing Implementation

#### Unit Tests
```tsx
// tests/components/skeletons/HomepageSkeleton.test.tsx
import { render, screen } from '@testing-library/react'
import { HomepageSkeleton } from '@/components/ui/skeletons'

describe('HomepageSkeleton', () => {
  it('renders all skeleton elements', () => {
    render(<HomepageSkeleton />)

    // Check navigation skeleton
    expect(screen.getByTestId('navigation-skeleton')).toBeInTheDocument()

    // Check hero section skeletons
    expect(screen.getByTestId('hero-title-skeleton')).toBeInTheDocument()
    expect(screen.getByTestId('hero-calendar-skeleton')).toBeInTheDocument()

    // Check room cards (6 cards)
    const roomCards = screen.getAllByTestId('room-card-skeleton')
    expect(roomCards).toHaveLength(6)
  })

  it('has proper accessibility attributes', () => {
    render(<HomepageSkeleton />)

    const skeletons = screen.getAllByRole('progressbar')
    expect(skeletons.length).toBeGreaterThan(0)
  })
})
```

#### Integration Tests
```tsx
// tests/pages/homepage-loading.test.tsx
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Page from '@/app/page'

describe('Homepage Loading', () => {
  it('shows skeleton while loading', async () => {
    render(<Page />)

    // Initially shows skeleton
    expect(screen.getByTestId('homepage-skeleton')).toBeInTheDocument()

    // Wait for content to load
    await waitFor(() => {
      expect(screen.queryByTestId('homepage-skeleton')).not.toBeInTheDocument()
    })

    // Content should be visible
    expect(screen.getByTestId('homepage-content')).toBeInTheDocument()
  })
})
```

### Step 7: Performance Optimization

#### Bundle Splitting
```tsx
// Implement lazy loading for heavy components
const AnalyticsDashboard = lazy(() => import('@/components/admin/AnalyticsDashboard'))

function AnalyticsPage() {
  return (
    <Suspense fallback={<AnalyticsSkeleton />}>
      <AnalyticsDashboard />
    </Suspense>
  )
}
```

#### Memoization
```tsx
// Memoize skeleton components
const RoomCardSkeleton = memo(() => (
  <div className="bg-card rounded-lg p-6 space-y-4">
    <Skeleton className="h-48 w-full rounded-md" />
    <Skeleton className="h-6 w-3/4 mt-4" />
    <Skeleton className="h-4 w-1/2" />
    <div className="flex gap-2 mt-4">
      <Skeleton className="h-6 w-16" />
      <Skeleton className="h-6 w-20" />
      <Skeleton className="h-6 w-14" />
    </div>
  </div>
))
```

## Best Practices

### 1. Content Structure Matching
- Skeleton harus mencerminkan struktur konten aktual
- Proporsi dan spacing harus sama
- Jumlah elemen skeleton harus sesuai dengan data yang akan dimuat

### 2. Performance Considerations
- Gunakan GPU-accelerated animations
- Implement lazy loading untuk komponen berat
- Memoize skeleton components yang sering digunakan

### 3. Accessibility
- Tambahkan `aria-label` untuk loading states
- Respect `prefers-reduced-motion`
- Gunakan semantic HTML elements

### 4. Responsive Design
- Pastikan skeleton responsive di semua screen sizes
- Test pada mobile, tablet, dan desktop
- Maintain aspect ratios

### 5. Theme Consistency
- Gunakan CSS custom properties untuk colors
- Support light/dark mode
- Consistent dengan design system

### 6. Error Handling
- Implement error boundaries
- Provide fallback UI
- Allow retry mechanisms

### 7. Testing Strategy
- Unit tests untuk setiap skeleton component
- Integration tests untuk loading states
- Accessibility testing
- Performance testing

## File Structure Summary

```
src/
├── components/
│   ├── ui/
│   │   ├── skeletons/
│   │   │   ├── index.ts
│   │   │   ├── BaseSkeleton.tsx
│   │   │   ├── SkeletonPatterns.tsx
│   │   │   ├── HomepageSkeleton.tsx
│   │   │   ├── AnalyticsSkeleton.tsx
│   │   │   ├── ProfileSkeleton.tsx
│   │   │   ├── BookSkeleton.tsx
│   │   │   ├── RoomBookingSkeleton.tsx
│   │   │   ├── BookTourSkeleton.tsx
│   │   │   ├── HistorySkeleton.tsx
│   │   │   ├── AdminHistorySkeleton.tsx
│   │   │   ├── AdminProfileSkeleton.tsx
│   │   │   └── AdminApprovalsSkeleton.tsx
│   │   └── skeleton.tsx (existing)
│   └── AuthProvider.tsx (existing)
├── hooks/
│   ├── useAnimations.ts (existing)
│   └── useSkeletonAnimation.ts (new)
└── app/
    ├── page.tsx (updated)
    ├── admin/analytics/page.tsx (updated)
    ├── profile/page.tsx (updated)
    ├── book/page.tsx (updated)
    ├── book/[roomId]/page.tsx (updated)
    ├── book-tour/page.tsx (updated)
    ├── history/page.tsx (updated)
    ├── admin/history/page.tsx (updated)
    ├── admin/profile/page.tsx (updated)
    └── admin/approvals/page.tsx (updated)
```

## Migration Checklist

- [ ] Create skeleton components folder
- [ ] Implement base skeleton components
- [ ] Create page-specific skeletons
- [ ] Update all target pages
- [ ] Add animations (optional)
- [ ] Test implementation
- [ ] Performance optimization
- [ ] Accessibility audit
- [ ] Documentation update

## Conclusion

Implementasi skeleton loading ini akan memberikan user experience yang jauh lebih baik dengan loading states yang informatif dan visually appealing. Dengan mengikuti langkah-langkah di atas, aplikasi akan memiliki sistem loading yang konsisten, performant, dan accessible di seluruh halaman utama.