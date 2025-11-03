// tests/integration/pages/analytics-loading.test.tsx
import { render, screen, waitFor, act } from '@testing-library/react'
import AnalyticsPage from '@/app/admin/analytics/page'

// Mock the AuthProvider
jest.mock('@/components/AuthProvider', () => ({
  useAuth: () => ({
    user: { id: 'test-user-id', email: 'admin@example.com' },
    isLoading: false
  })
}))

// Mock supabase
jest.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getUser: jest.fn(() => Promise.resolve({ data: { user: { id: 'test-user-id' } } }))
    },
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(() => Promise.resolve({ data: { id: 'test-user-id', role: 'admin' }, error: null }))
        }))
      }))
    }))
  }
}))

// Mock useRouter
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn()
  }),
  usePathname: () => '/admin/analytics'
}))

// Mock the AnalyticsDashboard component
jest.mock('@/components/admin/AnalyticsDashboard', () => ({
  __esModule: true,
  default: () => <div data-testid="analytics-content">Analytics Dashboard Content</div>
}))

describe('Analytics Page Loading', () => {
  it('shows skeleton while loading', async () => {
    await act(async () => {
      render(<AnalyticsPage />)
    })

    // Initially shows skeleton
    expect(screen.getByTestId('analytics-skeleton')).toBeInTheDocument()

    // Wait for content to load
    await waitFor(() => {
      expect(screen.queryByTestId('analytics-skeleton')).not.toBeInTheDocument()
    })

    // Content should be visible
    expect(screen.getByTestId('analytics-content')).toBeInTheDocument()
  })
})