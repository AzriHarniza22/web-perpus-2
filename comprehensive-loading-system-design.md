# Comprehensive Loading System Design

## Overview

This document outlines a complete loading system design for the Library Reservation System using shadcn/ui components, React Suspense, Error Boundaries, and GPU-accelerated animations. The system provides optimal user experience with consistent theming, performance optimizations, and accessibility support.

## Table of Contents

1. [System Architecture](#system-architecture)
2. [React Suspense & Error Boundaries](#react-suspense--error-boundaries)
3. [Skeleton Loading Templates](#skeleton-loading-templates)
4. [GPU-Accelerated Animations](#gpu-accelerated-animations)
5. [Performance Optimizations](#performance-optimizations)
6. [Implementation Steps](#implementation-steps)
7. [Best Practices](#best-practices)

## System Architecture

### Core Components

```
Loading System
├── React Suspense (Data Fetching)
├── Error Boundaries (Error Handling)
├── Skeleton Components (UI Placeholders)
├── Animation System (GPU-accelerated)
└── Theme Integration (shadcn/ui)
```

### Loading States Hierarchy

1. **Initial Load**: Fullscreen loading with animated background
2. **Page Transitions**: Inline loading with skeleton placeholders
3. **Component Loading**: Individual component skeletons
4. **Error States**: Graceful error handling with retry options

## React Suspense & Error Boundaries

### Error Boundary Implementation

```tsx
// components/ErrorBoundary.tsx
'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { AlertTriangle, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
}

interface ErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ComponentType<{ error: Error; resetError: () => void }>
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error Boundary caught an error:', error, errorInfo)
  }

  resetError = () => {
    this.setState({ hasError: false, error: undefined })
  }

  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback || DefaultErrorFallback
      return <FallbackComponent error={this.state.error!} resetError={this.resetError} />
    }

    return this.props.children
  }
}

const DefaultErrorFallback: React.FC<{ error: Error; resetError: () => void }> = ({
  error,
  resetError
}) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    className="min-h-screen flex items-center justify-center p-4"
  >
    <Card className="max-w-md w-full">
      <CardHeader className="text-center">
        <motion.div
          animate={{ rotate: [0, 10, -10, 0] }}
          transition={{ duration: 0.5, repeat: 3 }}
          className="mx-auto w-12 h-12 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mb-4"
        >
          <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
        </motion.div>
        <CardTitle className="text-red-900 dark:text-red-100">
          Terjadi Kesalahan
        </CardTitle>
        <CardDescription>
          Maaf, terjadi kesalahan yang tidak terduga. Silakan coba lagi.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <details className="text-sm text-gray-600 dark:text-gray-400">
          <summary className="cursor-pointer font-medium">Detail Error</summary>
          <pre className="mt-2 p-2 bg-gray-100 dark:bg-gray-800 rounded text-xs overflow-auto">
            {error.message}
          </pre>
        </details>
        <Button onClick={resetError} className="w-full">
          <RefreshCw className="w-4 h-4 mr-2" />
          Coba Lagi
        </Button>
      </CardContent>
    </Card>
  </motion.div>
)

export { ErrorBoundary, DefaultErrorFallback }
```

### Suspense Wrapper

```tsx
// components/SuspenseWrapper.tsx
'use client'

import React, { Suspense } from 'react'
import { motion } from 'framer-motion'
import { Loading } from '@/components/ui/loading'
import { ErrorBoundary } from './ErrorBoundary'

interface SuspenseWrapperProps {
  children: React.ReactNode
  fallback?: React.ReactNode
  errorFallback?: React.ComponentType<{ error: Error; resetError: () => void }>
}

export const SuspenseWrapper: React.FC<SuspenseWrapperProps> = ({
  children,
  fallback,
  errorFallback
}) => (
  <ErrorBoundary fallback={errorFallback}>
    <Suspense fallback={fallback || <Loading variant="fullscreen" />}>
      {children}
    </Suspense>
  </ErrorBoundary>
)
```

## Skeleton Loading Templates

### Reusable Skeleton Components

```tsx
// components/ui/skeleton-loader.tsx
'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Skeleton } from '@/components/ui/skeleton'
import { useLoadingAnimation } from '@/hooks/useAnimations'

interface SkeletonLoaderProps {
  className?: string
  variant?: 'pulse' | 'wave' | 'shimmer'
  children: React.ReactNode
}

export const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
  className,
  variant = 'shimmer',
  children
}) => {
  const { pulse } = useLoadingAnimation()

  if (variant === 'pulse') {
    return (
      <motion.div
        {...pulse}
        className={cn('relative overflow-hidden', className)}
      >
        {children}
      </motion.div>
    )
  }

  return (
    <motion.div
      className={cn('relative overflow-hidden', className)}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      {children}
      <motion.div
        initial={{ x: '-100%' }}
        animate={{ x: '100%' }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'easeInOut'
        }}
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 dark:via-gray-700/20 to-transparent"
      />
    </motion.div>
  )
}

// Specific skeleton components
export const CardSkeleton: React.FC<{ className?: string }> = ({ className }) => (
  <div className={cn('bg-card rounded-lg p-6 space-y-4', className)}>
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

export const ProfileSkeleton: React.FC = () => (
  <div className="max-w-2xl mx-auto space-y-6">
    <CardSkeleton>
      <div className="flex flex-col items-center space-y-4">
        <Skeleton className="w-24 h-24 rounded-full" />
        <Skeleton className="h-6 w-32" />
      </div>
      <div className="space-y-4 mt-6">
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
      </div>
    </CardSkeleton>
  </div>
)
```

### Page-Specific Skeleton Templates

#### Dashboard/Homepage Skeleton (src/app/page.tsx)

```tsx
// components/skeletons/HomepageSkeleton.tsx
'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { SkeletonLoader, CardSkeleton } from '@/components/ui/skeleton-loader'
import { Skeleton } from '@/components/ui/skeleton'

export const HomepageSkeleton: React.FC = () => (
  <div className="min-h-screen bg-background">
    {/* Navigation Skeleton */}
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className="fixed top-0 left-0 right-0 z-50 bg-background/90 backdrop-blur-lg border-b h-20"
    >
      <div className="px-4 sm:px-6 lg:px-8 h-full flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <Skeleton className="w-10 h-10 rounded" />
          <Skeleton className="h-8 w-32" />
        </div>
        <div className="hidden md:flex items-center space-x-8">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-5 w-16" />
          ))}
        </div>
        <div className="flex items-center space-x-4">
          <Skeleton className="h-8 w-16" />
          <Skeleton className="h-8 w-20" />
        </div>
      </div>
    </motion.nav>

    {/* Hero Section Skeleton */}
    <section className="relative min-h-screen flex items-center justify-center pt-20">
      <div className="px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Hero Text Skeleton */}
          <motion.div
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center lg:text-left space-y-6"
          >
            <div className="space-y-4">
              <Skeleton className="h-16 w-full max-w-lg mx-auto lg:mx-0" />
              <Skeleton className="h-16 w-3/4 max-w-md mx-auto lg:mx-0" />
              <Skeleton className="h-6 w-full max-w-xl mx-auto lg:mx-0" />
            </div>
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Skeleton className="h-12 w-48" />
            </div>
            <div className="flex items-center justify-center lg:justify-start gap-8">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Skeleton className="w-5 h-5 rounded-full" />
                  <Skeleton className="h-4 w-20" />
                </div>
              ))}
            </div>
          </motion.div>

          {/* Calendar Skeleton */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative"
          >
            <SkeletonLoader>
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
            </SkeletonLoader>
          </motion.div>
        </div>
      </div>
    </section>

    {/* Rooms Section Skeleton */}
    <section className="py-20 bg-background">
      <div className="px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <Skeleton className="h-12 w-64 mx-auto mb-6" />
          <Skeleton className="h-6 w-96 mx-auto" />
        </motion.div>

        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[...Array(6)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
              >
                <RoomCardSkeleton />
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  </div>
)
```

#### Analytics Page Skeleton (src/app/admin/analytics/page.tsx)

```tsx
// components/skeletons/AnalyticsSkeleton.tsx
'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { SkeletonLoader, CardSkeleton } from '@/components/ui/skeleton-loader'
import { Skeleton } from '@/components/ui/skeleton'

export const AnalyticsSkeleton: React.FC = () => (
  <div className="min-h-screen bg-gradient-to-br from-primary/10 via-primary/5 to-secondary/10">
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
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className="ml-64 bg-white/90 backdrop-blur-lg border-b h-16"
    >
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
    </motion.header>

    {/* Content Skeleton */}
    <main className="ml-64 p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <Skeleton className="h-8 w-64 mb-2" />
        <Skeleton className="h-5 w-96" />
      </motion.div>

      {/* Overview Cards Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[...Array(4)].map((_, i) => (
          <CardSkeleton key={i} className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <Skeleton className="h-4 w-20 mb-2" />
                <Skeleton className="h-8 w-16" />
              </div>
              <Skeleton className="w-12 h-12 rounded-full" />
            </div>
          </CardSkeleton>
        ))}
      </div>

      {/* Charts Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[...Array(4)].map((_, i) => (
          <CardSkeleton key={i} className="p-6">
            <Skeleton className="h-6 w-32 mb-4" />
            <Skeleton className="h-64 w-full" />
          </CardSkeleton>
        ))}
      </div>
    </main>
  </div>
)
```

#### Book Page Skeleton (src/app/book/page.tsx) - 6 Room Cards

```tsx
// components/skeletons/BookPageSkeleton.tsx
'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { SkeletonLoader, RoomCardSkeleton } from '@/components/ui/skeleton-loader'
import { Skeleton } from '@/components/ui/skeleton'

export const BookPageSkeleton: React.FC = () => (
  <div className="min-h-screen bg-background">
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
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <Skeleton className="h-8 w-48 mb-2" />
        <Skeleton className="h-5 w-64" />
      </motion.div>

      {/* Room Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <SkeletonLoader>
              <RoomCardSkeleton />
            </SkeletonLoader>
          </motion.div>
        ))}
      </div>
    </div>
  </div>
)
```

#### Profile Page Skeleton (src/app/profile/page.tsx)

```tsx
// components/skeletons/ProfileSkeleton.tsx
'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { SkeletonLoader, CardSkeleton } from '@/components/ui/skeleton-loader'
import { Skeleton } from '@/components/ui/skeleton'

export const ProfilePageSkeleton: React.FC = () => (
  <div className="min-h-screen bg-background">
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
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <Skeleton className="h-8 w-32 mb-2" />
        <Skeleton className="h-4 w-48" />
      </motion.div>

      {/* Profile Card Skeleton */}
      <div className="max-w-2xl mx-auto">
        <SkeletonLoader>
          <CardSkeleton className="p-6">
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
          </CardSkeleton>
        </SkeletonLoader>
      </div>
    </div>
  </div>
)
```

#### Book-Tour Page Skeleton (src/app/book-tour/page.tsx)

```tsx
// components/skeletons/BookTourSkeleton.tsx
'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { SkeletonLoader, CardSkeleton } from '@/components/ui/skeleton-loader'
import { Skeleton } from '@/components/ui/skeleton'

export const BookTourSkeleton: React.FC = () => (
  <div className="h-screen bg-gradient-to-br from-primary-50 via-indigo-50 to-secondary-50">
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
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <Skeleton className="h-8 w-48 mb-2" />
        <Skeleton className="h-4 w-32" />
      </motion.div>

      {/* Three Column Layout */}
      <div className="h-[calc(100vh-120px)] flex flex-col md:flex-row gap-4">
        {/* Tour Info Card */}
        <div className="flex-1">
          <SkeletonLoader>
            <CardSkeleton className="h-full p-6">
              <Skeleton className="h-8 w-32 mb-4" />
              <Skeleton className="h-48 w-full mb-4" />
              <div className="space-y-3">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            </CardSkeleton>
          </SkeletonLoader>
        </div>

        {/* Calendar Card */}
        <div className="flex-1">
          <SkeletonLoader>
            <CardSkeleton className="h-full p-6">
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
            </CardSkeleton>
          </SkeletonLoader>
        </div>

        {/* Form Card */}
        <div className="flex-1">
          <SkeletonLoader>
            <CardSkeleton className="h-full p-6">
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
            </CardSkeleton>
          </SkeletonLoader>
        </div>
      </div>
    </div>
  </div>
)
```

## GPU-Accelerated Animations

### Enhanced useAnimations Hook

```tsx
// hooks/useLoadingAnimations.ts
'use client'

import { useEffect, useState, RefObject, useRef } from 'react'
import { useReducedMotion } from 'framer-motion'
import { fadeVariants, slideVariants, scaleVariants, gpuProps } from '@/lib/animations'

export const useSkeletonAnimation = () => {
  const shouldReduceMotion = useReducedMotion()

  return {
    shimmer: {
      animate: shouldReduceMotion ? {} : {
        backgroundPosition: ['-200% 0', '200% 0']
      },
      transition: shouldReduceMotion ? {} : {
        duration: 2,
        repeat: Infinity,
        ease: 'linear'
      },
      style: {
        ...gpuProps,
        background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)',
        backgroundSize: '200% 100%'
      }
    },
    pulse: {
      animate: shouldReduceMotion ? {} : {
        opacity: [0.5, 1, 0.5]
      },
      transition: shouldReduceMotion ? {} : {
        duration: 1.5,
        repeat: Infinity,
        ease: 'easeInOut'
      },
      style: gpuProps
    },
    wave: {
      animate: shouldReduceMotion ? {} : {
        transform: ['translateX(-100%)', 'translateX(100%)']
      },
      transition: shouldReduceMotion ? {} : {
        duration: 2,
        repeat: Infinity,
        ease: 'easeInOut'
      },
      style: {
        ...gpuProps,
        background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.6), transparent)'
      }
    }
  }
}

export const useStaggeredSkeleton = (count: number, delay: number = 0.1) => {
  const shouldReduceMotion = useReducedMotion()

  return Array.from({ length: count }, (_, i) => ({
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: shouldReduceMotion ? { duration: 0.01 } : {
      delay: i * delay,
      duration: 0.6,
      ease: 'easeOut'
    },
    style: gpuProps
  }))
}
```

### Loading Component Enhancements

```tsx
// components/ui/loading.tsx (enhanced)
'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { useLoadingAnimation, useSkeletonAnimation } from '@/hooks/useAnimations'

interface LoadingProps {
  variant?: 'fullscreen' | 'inline' | 'skeleton' | 'card'
  size?: 'sm' | 'md' | 'lg' | 'xl'
  message?: string
  showDots?: boolean
  className?: string
  children?: React.ReactNode
}

const SkeletonLoading: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { shimmer } = useSkeletonAnimation()

  return (
    <motion.div
      className="relative overflow-hidden rounded-md"
      style={gpuProps}
    >
      {children}
      <motion.div
        {...shimmer}
        className="absolute inset-0 pointer-events-none"
      />
    </motion.div>
  )
}

const CardSkeleton: React.FC<{ className?: string }> = ({ className }) => (
  <motion.div
    className={cn('bg-card rounded-lg p-6 space-y-4', className)}
    style={gpuProps}
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ duration: 0.3, ease: 'easeOut' }}
  >
    <motion.div
      className="h-4 bg-muted rounded"
      style={gpuProps}
      initial={{ width: 0 }}
      animate={{ width: '75%' }}
      transition={{ duration: 0.8, ease: 'easeOut' }}
    />
    <motion.div
      className="h-4 bg-muted rounded"
      style={gpuProps}
      initial={{ width: 0 }}
      animate={{ width: '50%' }}
      transition={{ duration: 0.8, delay: 0.1, ease: 'easeOut' }}
    />
    <div className="space-y-2">
      <motion.div
        className="h-3 bg-muted rounded"
        style={gpuProps}
        initial={{ width: 0 }}
        animate={{ width: '100%' }}
        transition={{ duration: 0.8, delay: 0.2, ease: 'easeOut' }}
      />
      <motion.div
        className="h-3 bg-muted rounded"
        style={gpuProps}
        initial={{ width: 0 }}
        animate={{ width: '80%' }}
        transition={{ duration: 0.8, delay: 0.3, ease: 'easeOut' }}
      />
      <motion.div
        className="h-3 bg-muted rounded"
        style={gpuProps}
        initial={{ width: 0 }}
        animate={{ width: '60%' }}
        transition={{ duration: 0.8, delay: 0.4, ease: 'easeOut' }}
      />
    </div>
  </motion.div>
)

const Loading: React.FC<LoadingProps> = ({
  variant = 'inline',
  size = 'md',
  message,
  showDots = true,
  className,
  children,
}) => {
  // ... existing code ...

  const content = (() => {
    switch (variant) {
      case 'fullscreen':
        return <FullscreenLoading message={message} showDots={showDots} />
      case 'inline':
        return <InlineLoading size={size} message={message} />
      case 'skeleton':
        return <SkeletonLoading>{children}</SkeletonLoading>
      case 'card':
        return <CardSkeleton className={className} />
      default:
        return null
    }
  })()

  return <div className={className}>{content}</div>
}

export { Loading, SkeletonLoading, CardSkeleton }
```

## Performance Optimizations

### CSS Properties for GPU Acceleration

```css
/* styles/loading-optimizations.css */
.loading-optimized {
  /* Transform and opacity are GPU-accelerated */
  will-change: transform, opacity;
  backface-visibility: hidden;
  perspective: 1000px;
  transform: translateZ(0);
}

/* Reduce paint on animations */
.loading-shimmer {
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(255, 255, 255, 0.4) 50%,
    transparent 100%
  );
  background-size: 200% 100%;
  animation: shimmer 2s infinite linear;
}

@keyframes shimmer {
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
}

/* Optimized skeleton pulse */
.skeleton-pulse {
  animation: skeleton-pulse 1.5s ease-in-out infinite;
}

@keyframes skeleton-pulse {
  0%, 100% {
    opacity: 0.5;
  }
  50% {
    opacity: 1;
  }
}
```

### React Performance Best Practices

```tsx
// hooks/useDeferredLoading.ts
'use client'

import { useDeferredValue, useMemo } from 'react'

export const useDeferredLoading = <T,>(
  data: T,
  enabled: boolean = true
): T => {
  const deferredData = useDeferredValue(data)
  return enabled ? deferredData : data
}

// hooks/useVirtualizedSkeletons.ts
'use client'

import { useMemo } from 'react'

interface VirtualizedSkeletonOptions {
  itemHeight: number
  containerHeight: number
  overscan?: number
}

export const useVirtualizedSkeletons = (
  count: number,
  options: VirtualizedSkeletonOptions
) => {
  const { itemHeight, containerHeight, overscan = 5 } = options

  const visibleRange = useMemo(() => {
    const start = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan)
    const end = Math.min(
      count,
      Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
    )
    return { start, end }
  }, [scrollTop, itemHeight, containerHeight, count, overscan])

  return {
    visibleItems: Array.from(
      { length: visibleRange.end - visibleRange.start },
      (_, i) => visibleRange.start + i
    ),
    totalHeight: count * itemHeight,
    offsetY: visibleRange.start * itemHeight
  }
}
```

## Implementation Steps

### Step 1: Setup Core Infrastructure

```tsx
// 1. Install required dependencies
npm install framer-motion @tanstack/react-query

// 2. Create error boundary wrapper
// components/ErrorBoundary.tsx (as shown above)

// 3. Create suspense wrapper
// components/SuspenseWrapper.tsx (as shown above)

// 4. Enhance loading component
// components/ui/loading.tsx (enhanced version)
```

### Step 2: Create Skeleton Components

```tsx
// 1. Create base skeleton components
// components/ui/skeleton-loader.tsx

// 2. Create page-specific skeletons
// components/skeletons/HomepageSkeleton.tsx
// components/skeletons/AnalyticsSkeleton.tsx
// components/skeletons/BookPageSkeleton.tsx
// components/skeletons/ProfileSkeleton.tsx
// components/skeletons/BookTourSkeleton.tsx
```

### Step 3: Implement in Pages

#### Homepage Implementation

```tsx
// src/app/page.tsx
'use client'

import { SuspenseWrapper } from '@/components/SuspenseWrapper'
import { HomepageSkeleton } from '@/components/skeletons/HomepageSkeleton'
import HomePage from './HomePage'

export default function Page() {
  return (
    <SuspenseWrapper fallback={<HomepageSkeleton />}>
      <HomePage />
    </SuspenseWrapper>
  )
}
```

#### Analytics Page Implementation

```tsx
// src/app/admin/analytics/page.tsx
'use client'

import { SuspenseWrapper } from '@/components/SuspenseWrapper'
import { AnalyticsSkeleton } from '@/components/skeletons/AnalyticsSkeleton'
import AnalyticsPage from './AnalyticsPage'

export default function Page() {
  return (
    <ErrorBoundary fallback={AnalyticsErrorFallback}>
      <SuspenseWrapper fallback={<AnalyticsSkeleton />}>
        <AnalyticsPage />
      </SuspenseWrapper>
    </ErrorBoundary>
  )
}
```

### Step 4: Add Error Boundaries to Layout

```tsx
// src/app/layout.tsx
import { ErrorBoundary } from '@/components/ErrorBoundary'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <ErrorBoundary>
          {children}
        </ErrorBoundary>
      </body>
    </html>
  )
}
```

### Step 5: Optimize Bundle Splitting

```tsx
// 1. Dynamic imports for heavy components
const AnalyticsDashboard = dynamic(
  () => import('@/components/admin/AnalyticsDashboard'),
  {
    loading: () => <AnalyticsSkeleton />,
    ssr: false
  }
)

// 2. Route-based code splitting
// Next.js automatically handles this with app directory
```

### Step 6: Add Performance Monitoring

```tsx
// hooks/useLoadingPerformance.ts
'use client'

import { useEffect, useRef } from 'react'

export const useLoadingPerformance = (componentName: string) => {
  const startTime = useRef(Date.now())
  const renderTime = useRef(Date.now())

  useEffect(() => {
    renderTime.current = Date.now()
    console.log(`${componentName} rendered in ${renderTime.current - startTime.current}ms`)
  })

  useEffect(() => {
    return () => {
      const endTime = Date.now()
      console.log(`${componentName} unmounted after ${endTime - startTime.current}ms total`)
    }
  }, [componentName])

  return {
    markComplete: () => {
      const completeTime = Date.now()
      console.log(`${componentName} loading completed in ${completeTime - startTime.current}ms`)
    }
  }
}
```

## Best Practices

### Loading States

1. **Progressive Loading**: Show skeleton first, then enhance with data
2. **Meaningful Placeholders**: Skeletons should match actual content structure
3. **Consistent Timing**: Use consistent animation durations across the app
4. **Accessibility**: Respect `prefers-reduced-motion` setting

### Error Handling

1. **Graceful Degradation**: Always provide fallback UI
2. **User-Friendly Messages**: Clear, actionable error messages
3. **Retry Mechanisms**: Allow users to retry failed operations
4. **Logging**: Log errors for debugging while keeping user experience smooth

### Performance

1. **GPU Acceleration**: Use `transform`, `opacity`, `will-change` for animations
2. **Bundle Splitting**: Lazy load heavy components
3. **Memoization**: Use React.memo and useMemo for expensive operations
4. **Virtualization**: For large lists of skeleton items

### Theming

1. **Consistent Colors**: Use design system colors for skeletons
2. **Dark Mode Support**: Ensure skeletons work in both light and dark themes
3. **Brand Consistency**: Match loading animations with brand personality

### Code Organization

1. **Reusable Components**: Create composable skeleton components
2. **Separation of Concerns**: Keep loading logic separate from business logic
3. **Type Safety**: Use TypeScript for all loading components
4. **Testing**: Test loading states and error boundaries

This comprehensive loading system provides optimal user experience with smooth animations, proper error handling, and excellent performance across all devices and network conditions.