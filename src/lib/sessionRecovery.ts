import { sessionManager } from './sessionManager'
import { supabase } from './supabase'
import { config } from './config'

interface RecoveryState {
  isOnline: boolean
  pendingActions: Array<{
    type: 'refresh' | 'extend' | 'logout'
    timestamp: number
    retryCount: number
  }>
  lastKnownSession: any
  recoveryAttempts: number
}

interface NetworkStatusCallback {
  onOnline: () => void
  onOffline: () => void
  onRecovered: (success: boolean) => void
}

class SessionRecovery {
  private state: RecoveryState
  private callbacks: NetworkStatusCallback | null = null
  private recoveryTimer: NodeJS.Timeout | null = null
  private isDestroyed = false

  constructor() {
    this.state = {
      isOnline: navigator.onLine,
      pendingActions: [],
      lastKnownSession: null,
      recoveryAttempts: 0
    }

    this.initializeNetworkListeners()
  }

  // Initialize network status listeners
  private initializeNetworkListeners() {
    if (typeof window === 'undefined') return

    const handleOnline = () => {
      console.log('SessionRecovery: Network connection restored')
      this.state.isOnline = true
      this.callbacks?.onOnline()
      this.attemptRecovery()
    }

    const handleOffline = () => {
      console.log('SessionRecovery: Network connection lost')
      this.state.isOnline = false
      this.callbacks?.onOffline()
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Store cleanup function
    ;(this as any).cleanupListeners = () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }

  // Set up recovery callbacks
  setCallbacks(callbacks: NetworkStatusCallback) {
    this.callbacks = callbacks
  }

  // Record a failed action for retry when network is restored
  recordPendingAction(type: 'refresh' | 'extend' | 'logout') {
    if (this.isDestroyed) return

    const action = {
      type,
      timestamp: Date.now(),
      retryCount: 0
    }

    this.state.pendingActions.push(action)
    console.log(`SessionRecovery: Recorded pending action: ${type}`)

    // Limit pending actions to prevent memory buildup
    if (this.state.pendingActions.length > 10) {
      this.state.pendingActions = this.state.pendingActions.slice(-5)
    }
  }

  // Store current session for potential recovery
  storeSessionForRecovery(session: any) {
    if (this.isDestroyed || !session) return

    this.state.lastKnownSession = {
      ...session,
      storedAt: Date.now()
    }

    console.log('SessionRecovery: Stored session for recovery')
  }

  // Attempt to recover session and retry pending actions
  private async attemptRecovery() {
    if (this.isDestroyed || !this.state.isOnline) return

    if (this.state.recoveryAttempts >= 3) {
      console.log('SessionRecovery: Max recovery attempts reached')
      this.callbacks?.onRecovered(false)
      return
    }

    this.state.recoveryAttempts++

    try {
      console.log(`SessionRecovery: Attempting recovery (attempt ${this.state.recoveryAttempts})`)

      // Try to restore session from stored data
      if (this.state.lastKnownSession) {
        const sessionAge = Date.now() - this.state.lastKnownSession.storedAt

        // Only attempt recovery if session is not too old (within 1 hour)
        if (sessionAge < 60 * 60 * 1000) {
          const { data, error } = await supabase.auth.setSession({
            access_token: this.state.lastKnownSession.access_token,
            refresh_token: this.state.lastKnownSession.refresh_token
          })

          if (!error && data.session) {
            console.log('SessionRecovery: Session restored successfully')

            // Reinitialize session manager with recovered session
            sessionManager.initialize(data.session)

            // Retry pending actions
            await this.retryPendingActions()

            this.callbacks?.onRecovered(true)
            this.state.recoveryAttempts = 0
            return
          }
        }
      }

      // If session recovery failed, try to get current session
      const { data: { session }, error } = await supabase.auth.getSession()

      if (!error && session) {
        console.log('SessionRecovery: Current session retrieved')

        // Reinitialize session manager
        sessionManager.initialize(session)

        // Retry pending actions
        await this.retryPendingActions()

        this.callbacks?.onRecovered(true)
        this.state.recoveryAttempts = 0
        return
      }

      throw new Error('No valid session found')

    } catch (error) {
      console.error('SessionRecovery: Recovery attempt failed:', error)

      // Schedule retry with exponential backoff
      const delay = Math.min(1000 * Math.pow(2, this.state.recoveryAttempts), 30000)
      this.recoveryTimer = setTimeout(() => {
        this.attemptRecovery()
      }, delay)
    }
  }

  // Retry pending actions
  private async retryPendingActions() {
    if (this.isDestroyed || this.state.pendingActions.length === 0) return

    console.log(`SessionRecovery: Retrying ${this.state.pendingActions.length} pending actions`)

    const actionsToRetry = [...this.state.pendingActions]
    this.state.pendingActions = []

    for (const action of actionsToRetry) {
      try {
        switch (action.type) {
          case 'refresh':
            await this.retryRefreshToken()
            break
          case 'extend':
            sessionManager.extendSession()
            break
          case 'logout':
            await sessionManager.logout()
            break
        }

        console.log(`SessionRecovery: Successfully retried action: ${action.type}`)
      } catch (error) {
        console.error(`SessionRecovery: Failed to retry action ${action.type}:`, error)

        // Re-queue action if it still makes sense
        if (action.retryCount < 3) {
          action.retryCount++
          this.state.pendingActions.push(action)
        }
      }
    }
  }

  // Retry token refresh
  private async retryRefreshToken() {
    const sessionState = sessionManager.getState()

    if (!sessionState.session) {
      throw new Error('No session available for refresh')
    }

    const { data, error } = await supabase.auth.refreshSession({
      refresh_token: sessionState.session.refresh_token
    })

    if (error) throw error

    if (data.session) {
      sessionManager.initialize(data.session)
      console.log('SessionRecovery: Token refresh completed during recovery')
    }
  }

  // Check if currently online
  isCurrentlyOnline(): boolean {
    return this.state.isOnline
  }

  // Get recovery statistics
  getRecoveryStats() {
    return {
      isOnline: this.state.isOnline,
      pendingActionsCount: this.state.pendingActions.length,
      recoveryAttempts: this.state.recoveryAttempts,
      lastKnownSessionAge: this.state.lastKnownSession
        ? Date.now() - this.state.lastKnownSession.storedAt
        : null
    }
  }

  // Manual recovery trigger (for testing or manual intervention)
  async triggerManualRecovery(): Promise<boolean> {
    if (!this.state.isOnline) {
      console.log('SessionRecovery: Cannot trigger manual recovery while offline')
      return false
    }

    this.state.recoveryAttempts = 0
    await this.attemptRecovery()

    return true
  }

  // Clear all pending actions and stored session data
  clearRecoveryData() {
    this.state.pendingActions = []
    this.state.lastKnownSession = null
    this.state.recoveryAttempts = 0

    if (this.recoveryTimer) {
      clearTimeout(this.recoveryTimer)
      this.recoveryTimer = null
    }

    console.log('SessionRecovery: Recovery data cleared')
  }

  // Cleanup and destroy
  destroy() {
    if (this.isDestroyed) return

    this.isDestroyed = true

    // Cleanup event listeners
    if ((this as any).cleanupListeners) {
      (this as any).cleanupListeners()
    }

    // Clear timers
    if (this.recoveryTimer) {
      clearTimeout(this.recoveryTimer)
    }

    this.clearRecoveryData()
    this.callbacks = null

    console.log('SessionRecovery: Destroyed')
  }
}

// Export singleton instance
export const sessionRecovery = new SessionRecovery()
export default SessionRecovery