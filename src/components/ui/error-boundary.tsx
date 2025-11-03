'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { AlertTriangle, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
  isRetrying?: boolean
}

interface ErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ComponentType<{ error: Error; resetError: () => void }>
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
  enableLogging?: boolean
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, isRetrying: false }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error for debugging and monitoring
    if (this.props.enableLogging !== false) {
      console.error('Error Boundary caught an error:', error, errorInfo)

      // Call custom error handler if provided
      if (this.props.onError) {
        this.props.onError(error, errorInfo)
      }

      // In production, you might want to send this to an error reporting service
      // Example: Sentry, LogRocket, etc.
      if (process.env.NODE_ENV === 'production') {
        // reportError(error, errorInfo)
      }
    }
  }

  resetError = () => {
    this.setState({ hasError: false, error: undefined, isRetrying: false })
  }

  handleRetry = async () => {
    this.setState({ isRetrying: true })

    // Add a small delay for better UX
    await new Promise(resolve => setTimeout(resolve, 1000))

    this.resetError()
  }

  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback || DefaultErrorFallback
      return (
        <FallbackComponent
          error={this.state.error!}
          resetError={this.resetError}
          onRetry={this.handleRetry}
          isRetrying={this.state.isRetrying}
        />
      )
    }

    return this.props.children
  }
}

interface DefaultErrorFallbackProps {
  error: Error
  resetError: () => void
  onRetry?: () => void
  isRetrying?: boolean
}

const DefaultErrorFallback: React.FC<DefaultErrorFallbackProps> = ({
  error,
  resetError,
  onRetry,
  isRetrying = false
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
          <summary className="cursor-pointer font-medium mb-2">
            Detail Error (untuk developer)
          </summary>
          <pre className="mt-2 p-2 bg-gray-100 dark:bg-gray-800 rounded text-xs overflow-auto whitespace-pre-wrap">
            {error.message}
            {error.stack && (
              <>
                {'\n\nStack Trace:'}
                {'\n'}{error.stack}
              </>
            )}
          </pre>
        </details>
        <div className="flex gap-2">
          <Button
            onClick={onRetry || resetError}
            disabled={isRetrying}
            className="flex-1"
            aria-label={isRetrying ? "Mencoba lagi..." : "Coba lagi"}
          >
            {isRetrying ? (
              <>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  className="mr-2"
                >
                  <RefreshCw className="w-4 h-4" />
                </motion.div>
                Mencoba lagi...
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4 mr-2" />
                Coba Lagi
              </>
            )}
          </Button>
          <Button
            variant="outline"
            onClick={resetError}
            disabled={isRetrying}
            aria-label="Tutup pesan error"
          >
            Tutup
          </Button>
        </div>
      </CardContent>
    </Card>
  </motion.div>
)

export { ErrorBoundary, DefaultErrorFallback }