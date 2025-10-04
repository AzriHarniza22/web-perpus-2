import { supabase } from './supabase'
import { config } from './config'
import { sessionRecovery } from './sessionRecovery'
import type { Session, User } from '@supabase/supabase-js'

interface SessionState {
  session: Session | null
  lastActivity: number
  warningsShown: {
    first: boolean
    final: boolean
  }
  isRefreshing: boolean
  refreshAttempts: number
}

interface SessionManagerEvents {
  onWarning: (type: 'first' | 'final', timeRemaining: number) => void
  onExpired: () => void
  onRefreshed: (newSession: Session) => void
  onRefreshFailed: (error: Error) => void
  onActivityDetected: () => void
}

class SessionManager {
  private state: SessionState
  private events: SessionManagerEvents | null = null
  private timeoutTimer: NodeJS.Timeout | null = null
  private warningTimer: NodeJS.Timeout | null = null
  private activityTimer: NodeJS.Timeout | null = null
  private refreshTimer: NodeJS.Timeout | null = null
  private isDestroyed = false

  constructor() {
    this.state = {
      session: null,
      lastActivity: Date.now(),
      warningsShown: {
        first: false,
        final: false
      },
      isRefreshing: false,
      refreshAttempts: 0
    }

    this.initializeEventListeners()
    this.initializeRecoveryMechanisms()
    this.loadPersistedSession()
  }

  // Initialize the session manager with a session
  initialize(session: Session | null, events?: Partial<SessionManagerEvents>) {
    if (this.isDestroyed) return

    this.state.session = session
    this.events = {
      onWarning: () => {},
      onExpired: () => {},
      onRefreshed: () => {},
      onRefreshFailed: () => {},
      onActivityDetected: () => {},
      ...events
    }

    if (session) {
      this.persistSession(session)
      this.startTimers()
      this.trackActivity()
    }
  }

  // Update event handlers
  updateEvents(events: Partial<SessionManagerEvents>) {
    if (this.events) {
      this.events = { ...this.events, ...events }
    }
  }

  // Track user activity to extend session
  trackActivity() {
    if (this.isDestroyed || !this.state.session) return

    this.state.lastActivity = Date.now()
    this.events?.onActivityDetected()

    // Extend session if configured to do so
    if (config.session.activity.extendOnActivity) {
      this.resetTimeoutTimer()
    }
  }

  // Get current session state
  getState(): SessionState {
    return { ...this.state }
  }

  // Check if session is valid
  isValid(): boolean {
    if (!this.state.session) return false

    const now = Date.now()
    const expiresAt = new Date(this.state.session.expires_at! * 1000).getTime()
    return now < expiresAt
  }

  // Get time until expiry
  getTimeUntilExpiry(): number {
    if (!this.state.session) return 0

    const now = Date.now()
    const expiresAt = new Date(this.state.session.expires_at! * 1000).getTime()
    return Math.max(0, expiresAt - now)
  }

  // Get appropriate timeout for user role
  private getTimeoutForUser(): number {
    // This would need to be passed from the auth store or determined from user profile
    // For now, default to regular timeout
    return config.session.timeouts.regular
  }

  // Start all timers
  private startTimers() {
    this.stopTimers()
    this.startTimeoutTimer()
    this.startActivityTimer()
    this.startRefreshTimer()
  }

  // Stop all timers
  private stopTimers() {
    if (this.timeoutTimer) {
      clearTimeout(this.timeoutTimer)
      this.timeoutTimer = null
    }
    if (this.warningTimer) {
      clearTimeout(this.warningTimer)
      this.warningTimer = null
    }
    if (this.activityTimer) {
      clearTimeout(this.activityTimer)
      this.activityTimer = null
    }
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer)
      this.refreshTimer = null
    }
  }

  // Start timeout timer
  private startTimeoutTimer() {
    if (this.isDestroyed || !this.state.session) return

    const timeout = this.getTimeoutForUser()
    const timeUntilExpiry = this.getTimeUntilExpiry()

    // Set main timeout timer
    this.timeoutTimer = setTimeout(() => {
      this.handleSessionExpired()
    }, Math.max(timeUntilExpiry, timeout))

    // Set warning timers
    this.scheduleWarnings()
  }

  // Schedule expiry warnings
  private scheduleWarnings() {
    if (this.isDestroyed || !this.state.session) return

    const timeUntilExpiry = this.getTimeUntilExpiry()

    // First warning (10 minutes before expiry)
    const firstWarningTime = timeUntilExpiry - config.session.warnings.first
    if (firstWarningTime > 0 && !this.state.warningsShown.first) {
      this.warningTimer = setTimeout(() => {
        this.showWarning('first')
      }, firstWarningTime)
    }

    // Final warning (2 minutes before expiry)
    const finalWarningTime = timeUntilExpiry - config.session.warnings.final
    if (finalWarningTime > 0 && !this.state.warningsShown.final) {
      setTimeout(() => {
        this.showWarning('final')
      }, finalWarningTime)
    }
  }

  // Show warning notification
  private showWarning(type: 'first' | 'final') {
    if (this.isDestroyed || !this.state.session) return

    const timeRemaining = this.getTimeUntilExpiry()
    this.state.warningsShown[type] = true

    this.events?.onWarning(type, timeRemaining)
  }

  // Handle session expired
  private handleSessionExpired() {
    if (this.isDestroyed) return

    console.log('SessionManager: Session expired')
    this.events?.onExpired()
    this.clearSession()
  }

  // Start activity tracking timer
  private startActivityTimer() {
    this.activityTimer = setInterval(() => {
      this.checkInactivity()
    }, config.session.activity.checkInterval)
  }

  // Check for inactivity
  private checkInactivity() {
    if (this.isDestroyed || !this.state.session) return

    const now = Date.now()
    const timeSinceActivity = now - this.state.lastActivity

    if (timeSinceActivity > config.session.activity.idleThreshold) {
      console.log('SessionManager: User inactive for threshold period')
      // Could trigger additional warnings or actions here
    }
  }

  // Start token refresh timer
  private startRefreshTimer() {
    if (this.isDestroyed || !this.state.session) return

    const refreshThreshold = config.session.refresh.threshold
    const timeUntilRefresh = this.getTimeUntilExpiry() - refreshThreshold

    if (timeUntilRefresh > 0) {
      this.refreshTimer = setTimeout(() => {
        this.refreshToken()
      }, timeUntilRefresh)
    }
  }

  // Refresh access token
  private async refreshToken() {
    if (this.isDestroyed || !this.state.session || this.state.isRefreshing) return

    // Check if offline and record for retry
    if (!sessionRecovery.isCurrentlyOnline()) {
      console.log('SessionManager: Offline, recording refresh action for retry')
      sessionRecovery.recordPendingAction('refresh')
      sessionRecovery.storeSessionForRecovery(this.state.session)
      return
    }

    this.state.isRefreshing = true
    this.state.refreshAttempts++

    try {
      console.log('SessionManager: Refreshing token, attempt', this.state.refreshAttempts)

      const { data, error } = await supabase.auth.refreshSession({
        refresh_token: this.state.session.refresh_token
      })

      if (error) throw error

      if (data.session) {
        this.state.session = data.session
        this.state.refreshAttempts = 0
        this.state.isRefreshing = false

        this.persistSession(data.session)
        this.resetTimeoutTimer()
        this.events?.onRefreshed(data.session)

        console.log('SessionManager: Token refreshed successfully')
      }
    } catch (error) {
      console.error('SessionManager: Token refresh failed:', error)
      this.state.isRefreshing = false

      // Check if network error - record for retry
      if (!sessionRecovery.isCurrentlyOnline()) {
        console.log('SessionManager: Network error during refresh, recording for retry')
        sessionRecovery.recordPendingAction('refresh')
        sessionRecovery.storeSessionForRecovery(this.state.session)
        return
      }

      if (this.state.refreshAttempts < config.session.refresh.retryAttempts) {
        // Retry with exponential backoff
        const delay = config.session.refresh.retryDelay * Math.pow(2, this.state.refreshAttempts - 1)
        setTimeout(() => this.refreshToken(), delay)
      } else {
        this.events?.onRefreshFailed(error as Error)
        this.handleSessionExpired()
      }
    }
  }

  // Reset timeout timer after activity or refresh
  private resetTimeoutTimer() {
    if (this.timeoutTimer) {
      clearTimeout(this.timeoutTimer)
    }
    this.startTimeoutTimer()
  }

  // Initialize event listeners for user activity
  private initializeEventListeners() {
    if (typeof window === 'undefined') return

    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click']

    const activityHandler = () => {
      this.trackActivity()
    }

    events.forEach(event => {
      document.addEventListener(event, activityHandler, { passive: true })
    })

    // Store cleanup function for later use
    ;(this as any).cleanupListeners = () => {
      events.forEach(event => {
        document.removeEventListener(event, activityHandler)
      })
    }
  }

  // Initialize recovery mechanisms for network interruptions
  private initializeRecoveryMechanisms() {
    sessionRecovery.setCallbacks({
      onOnline: () => {
        console.log('SessionManager: Network restored, recovery may be triggered')
      },
      onOffline: () => {
        console.log('SessionManager: Network lost, actions will be queued for retry')
      },
      onRecovered: (success) => {
        if (success) {
          console.log('SessionManager: Session successfully recovered from network interruption')
        } else {
          console.log('SessionManager: Session recovery failed, user may need to re-authenticate')
        }
      }
    })
  }

  // Persist session to storage
  private persistSession(session: Session) {
    if (typeof window === 'undefined') return

    try {
      const sessionData = {
        session,
        lastActivity: this.state.lastActivity,
        timestamp: Date.now()
      }

      const key = `${config.session.storage.prefix}data`
      localStorage.setItem(key, JSON.stringify(sessionData))
    } catch (error) {
      console.warn('SessionManager: Failed to persist session:', error)
    }
  }

  // Load persisted session
  private loadPersistedSession() {
    if (typeof window === 'undefined') return

    try {
      const key = `${config.session.storage.prefix}data`
      const stored = localStorage.getItem(key)

      if (stored) {
        const sessionData = JSON.parse(stored)

        // Check if session is still valid
        if (sessionData.timestamp && Date.now() - sessionData.timestamp < 24 * 60 * 60 * 1000) {
          this.state.lastActivity = sessionData.lastActivity || Date.now()
        } else {
          // Remove expired persisted session
          localStorage.removeItem(key)
        }
      }
    } catch (error) {
      console.warn('SessionManager: Failed to load persisted session:', error)
    }
  }

  // Clear session data
  private clearSession() {
    this.state.session = null
    this.state.warningsShown = { first: false, final: false }
    this.state.refreshAttempts = 0
    this.state.isRefreshing = false

    if (typeof window !== 'undefined') {
      const key = `${config.session.storage.prefix}data`
      localStorage.removeItem(key)
    }

    this.stopTimers()
  }

  // Manual session extension (for admin or special cases)
  extendSession(newTimeout?: number) {
    if (!this.state.session) return

    const timeout = newTimeout || this.getTimeoutForUser()
    this.resetTimeoutTimer()
    console.log(`SessionManager: Session extended for ${timeout}ms`)
  }

  // Force logout
  async logout() {
    try {
      await supabase.auth.signOut()
    } catch (error) {
      console.error('SessionManager: Logout error:', error)
    } finally {
      this.clearSession()
    }
  }

  // Cleanup and destroy
  destroy() {
    if (this.isDestroyed) return

    this.isDestroyed = true
    this.stopTimers()

    // Cleanup event listeners
    if ((this as any).cleanupListeners) {
      (this as any).cleanupListeners()
    }

    this.clearSession()
    this.events = null

    console.log('SessionManager: Destroyed')
  }
}

// Export singleton instance
export const sessionManager = new SessionManager()
export default SessionManager