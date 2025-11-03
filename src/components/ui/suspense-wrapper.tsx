'use client'

import React, { Suspense } from 'react'
import { motion } from 'framer-motion'
import { Loading } from '@/components/ui/loading'
import { ErrorBoundary, DefaultErrorFallback } from '@/components/ui/error-boundary'
import { cn } from '@/lib/utils'
import { gpuProps } from '@/lib/animations'

interface SuspenseWrapperProps {
  children: React.ReactNode
  fallback?: React.ReactNode
  errorFallback?: React.ComponentType<{ error: Error; resetError: () => void }>
  className?: string
  enableLogging?: boolean
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
}

/**
 * SuspenseWrapper component for wrapping async components
 * Combines React Suspense with Error Boundary for comprehensive loading and error handling
 */
export const SuspenseWrapper: React.FC<SuspenseWrapperProps> = ({
  children,
  fallback,
  errorFallback,
  className,
  enableLogging = true,
  onError
}) => (
  <ErrorBoundary
    fallback={errorFallback}
    enableLogging={enableLogging}
    onError={onError}
  >
    <Suspense
      fallback={
        fallback || (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={cn('flex items-center justify-center min-h-[200px]', className)}
            style={gpuProps}
          >
            <Loading variant="fullscreen" message="Memuat..." />
          </motion.div>
        )
      }
    >
      {children}
    </Suspense>
  </ErrorBoundary>
)

interface AsyncBoundaryProps extends SuspenseWrapperProps {
  /**
   * Custom loading component for different states
   */
  loadingComponent?: 'fullscreen' | 'inline' | 'skeleton'
  loadingSize?: 'sm' | 'md' | 'lg' | 'xl'
  loadingMessage?: string
}

/**
 * AsyncBoundary component combining Suspense + Error Boundary
 * Enhanced version with customizable loading states
 */
export const AsyncBoundary: React.FC<AsyncBoundaryProps> = ({
  children,
  fallback,
  errorFallback,
  className,
  enableLogging = true,
  onError,
  loadingComponent = 'fullscreen',
  loadingSize = 'md',
  loadingMessage
}) => {
  const defaultFallback = (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={cn('flex items-center justify-center', className)}
      style={gpuProps}
    >
      <Loading
        variant={loadingComponent}
        size={loadingSize}
        message={loadingMessage}
      />
    </motion.div>
  )

  return (
    <ErrorBoundary
      fallback={errorFallback}
      enableLogging={enableLogging}
      onError={onError}
    >
      <Suspense fallback={fallback || defaultFallback}>
        {children}
      </Suspense>
    </ErrorBoundary>
  )
}

interface LoadingFallbackProps {
  variant?: 'fullscreen' | 'inline' | 'skeleton' | 'card'
  size?: 'sm' | 'md' | 'lg' | 'xl'
  message?: string
  className?: string
  showDots?: boolean
  children?: React.ReactNode
  customIcon?: React.ReactNode
  customAnimation?: 'spinner' | 'pulse' | 'shimmer' | 'bounce'
}

/**
 * LoadingFallback component with customizable loading states
 * Provides consistent loading UI across the application
 */
export const LoadingFallback: React.FC<LoadingFallbackProps> = ({
  variant = 'inline',
  size = 'md',
  message,
  className,
  showDots = true,
  children,
  customIcon,
  customAnimation = 'spinner'
}) => {
  const content = (() => {
    switch (variant) {
      case 'fullscreen':
        return (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={cn('fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm', className)}
            style={gpuProps}
          >
            <div className="flex flex-col items-center space-y-4">
              {customIcon || <Loading variant="inline" size="xl" />}
              {message && (
                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-lg font-medium text-center"
                >
                  {message}
                </motion.p>
              )}
              {children}
            </div>
          </motion.div>
        )

      case 'card':
        return (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={cn('bg-card rounded-lg p-6 space-y-4 border', className)}
            style={gpuProps}
          >
            <div className="flex items-center space-x-3">
              <Loading variant="inline" size={size} />
              {message && <span className="text-sm text-muted-foreground">{message}</span>}
            </div>
            {children}
          </motion.div>
        )

      case 'skeleton':
        return (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={cn('relative overflow-hidden', className)}
            style={gpuProps}
          >
            {children}
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: '100%' }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 dark:via-gray-700/20 to-transparent"
            />
          </motion.div>
        )

      default: // inline
        return (
          <div className={cn('flex items-center space-x-2', className)}>
            <Loading variant="inline" size={size} />
            {message && <span className="text-sm text-muted-foreground">{message}</span>}
            {children}
          </div>
        )
    }
  })()

  return content
}

// ============================================================================
// LAZY LOADING UTILITIES
// ============================================================================

/**
 * Lazy loading utility for code splitting
 * Wraps React.lazy with Suspense and Error Boundary
 */
export const lazyLoad = <T extends React.ComponentType<any>>(
  importFunc: () => Promise<{ default: T }>,
  fallback?: React.ReactNode,
  errorFallback?: React.ComponentType<{ error: Error; resetError: () => void }>
) => {
  const LazyComponent = React.lazy(importFunc)

  const Component = (props: React.ComponentProps<T>) => (
    <SuspenseWrapper
      fallback={fallback || <LoadingFallback variant="fullscreen" message="Memuat komponen..." />}
      errorFallback={errorFallback}
    >
      <LazyComponent {...props} />
    </SuspenseWrapper>
  )

  Component.displayName = `LazyLoad(${LazyComponent.name || 'Component'})`

  return Component
}

/**
 * Create a lazy-loaded component with custom loading and error states
 */
export const createLazyComponent = <T extends React.ComponentType<any>>(
  importFunc: () => Promise<{ default: T }>,
  options: {
    loadingComponent?: React.ReactNode
    errorComponent?: React.ComponentType<{ error: Error; resetError: () => void }>
    loadingMessage?: string
  } = {}
) => {
  const {
    loadingComponent,
    errorComponent,
    loadingMessage = 'Memuat...'
  } = options

  const LazyComponent = React.lazy(importFunc)

  const Component = (props: React.ComponentProps<T>) => (
    <AsyncBoundary
      fallback={loadingComponent || <LoadingFallback variant="fullscreen" message={loadingMessage} />}
      errorFallback={errorComponent}
    >
      <LazyComponent {...props} />
    </AsyncBoundary>
  )

  Component.displayName = `LazyComponent(${LazyComponent.name || 'Component'})`

  return Component
}

/**
 * Hook for dynamic imports with loading states
 */
export const useLazyImport = <T,>(
  importFunc: () => Promise<T>,
  options: {
    onSuccess?: (module: T) => void
    onError?: (error: Error) => void
  } = {}
) => {
  const [isLoading, setIsLoading] = React.useState(false)
  const [error, setError] = React.useState<Error | null>(null)
  const [data, setData] = React.useState<T | null>(null)

  const load = React.useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const module = await importFunc()
      setData(module)
      options.onSuccess?.(module)
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Import failed')
      setError(error)
      options.onError?.(error)
    } finally {
      setIsLoading(false)
    }
  }, [importFunc, options])

  return {
    data,
    error,
    isLoading,
    load,
    reset: () => {
      setData(null)
      setError(null)
      setIsLoading(false)
    }
  }
}

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export type LoadingVariant = 'fullscreen' | 'inline' | 'skeleton' | 'card'
export type LoadingSize = 'sm' | 'md' | 'lg' | 'xl'
export type LoadingAnimation = 'spinner' | 'pulse' | 'shimmer' | 'bounce'

export interface LazyComponentOptions {
  loadingComponent?: React.ReactNode
  errorComponent?: React.ComponentType<{ error: Error; resetError: () => void }>
  loadingMessage?: string
}

export interface LazyImportResult<T> {
  data: T | null
  error: Error | null
  isLoading: boolean
  load: () => Promise<void>
  reset: () => void
}

// ============================================================================
// ACCESSIBILITY FEATURES
// ============================================================================

/**
 * Accessible loading wrapper with ARIA attributes
 */
export const AccessibleLoadingWrapper: React.FC<{
  children: React.ReactNode
  isLoading: boolean
  loadingMessage?: string
  error?: Error | null
  retry?: () => void
}> = ({ children, isLoading, loadingMessage, error, retry }) => (
  <div role="region" aria-live="polite" aria-atomic="true">
    {isLoading && (
      <div
        role="status"
        aria-label={loadingMessage || 'Memuat konten'}
        className="sr-only"
      >
        {loadingMessage || 'Memuat konten'}
      </div>
    )}

    {error && (
      <div
        role="alert"
        aria-live="assertive"
        className="sr-only"
      >
        Terjadi kesalahan: {error.message}
        {retry && ' Tekan Enter untuk mencoba lagi.'}
      </div>
    )}

    {children}
  </div>
)