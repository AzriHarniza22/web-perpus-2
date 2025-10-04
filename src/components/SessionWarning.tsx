import React, { useEffect } from 'react'
import useAuthStore from '@/lib/authStore'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertTriangle, Clock, X } from 'lucide-react'

interface SessionWarningProps {
  className?: string
}

export function SessionWarning({ className }: SessionWarningProps) {
  const { sessionWarning, extendSession, dismissWarning, trackActivity } = useAuthStore()

  // Track activity when component mounts or updates
  useEffect(() => {
    trackActivity()
  }, [trackActivity])

  // Auto-dismiss warning after 10 seconds if not interacted with
  useEffect(() => {
    if (sessionWarning.show) {
      const timer = setTimeout(() => {
        dismissWarning()
      }, 10000)

      return () => clearTimeout(timer)
    }
  }, [sessionWarning.show, dismissWarning])

  if (!sessionWarning.show || !sessionWarning.type) {
    return null
  }

  const formatTimeRemaining = (ms: number): string => {
    const minutes = Math.floor(ms / (1000 * 60))
    const seconds = Math.floor((ms % (1000 * 60)) / 1000)

    if (minutes > 0) {
      return `${minutes} minute${minutes !== 1 ? 's' : ''} and ${seconds} second${seconds !== 1 ? 's' : ''}`
    }
    return `${seconds} second${seconds !== 1 ? 's' : ''}`
  }

  const getWarningConfig = () => {
    switch (sessionWarning.type) {
      case 'first':
        return {
          title: 'Session Expiring Soon',
          description: `Your session will expire in ${formatTimeRemaining(sessionWarning.timeRemaining)}. Would you like to extend it?`,
          variant: 'default' as const,
          icon: <Clock className="h-4 w-4" />
        }
      case 'final':
        return {
          title: 'Session Expiring Now',
          description: `Your session will expire in ${formatTimeRemaining(sessionWarning.timeRemaining)}. Please save your work.`,
          variant: 'destructive' as const,
          icon: <AlertTriangle className="h-4 w-4" />
        }
      default:
        return null
    }
  }

  const config = getWarningConfig()
  if (!config) return null

  const handleExtendSession = () => {
    extendSession()
    dismissWarning()
  }

  const handleDismiss = () => {
    dismissWarning()
  }

  return (
    <div className={`fixed top-4 right-4 z-50 max-w-md ${className}`}>
      <Alert variant={config.variant} className="border-l-4 shadow-lg">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-2">
            {config.icon}
            <div className="flex-1">
              <h4 className="font-semibold text-sm mb-1">{config.title}</h4>
              <AlertDescription className="text-sm">
                {config.description}
              </AlertDescription>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDismiss}
            className="h-6 w-6 p-0 ml-2"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex justify-end space-x-2 mt-3">
          <Button
            variant="outline"
            size="sm"
            onClick={handleDismiss}
          >
            Dismiss
          </Button>
          {sessionWarning.type === 'first' && (
            <Button
              size="sm"
              onClick={handleExtendSession}
            >
              Extend Session
            </Button>
          )}
        </div>
      </Alert>
    </div>
  )
}

export default SessionWarning