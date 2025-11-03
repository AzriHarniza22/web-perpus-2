// tests/integration/pages/history-loading.test.tsx
import { render, screen, waitFor } from '@testing-library/react'
import HistoryPage from '@/app/history/page'

// Mock supabase
jest.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getUser: jest.fn(() => Promise.resolve({ data: { user: { id: 'test-user-id' } } }))
    },
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          order: jest.fn(() => Promise.resolve({ data: [], error: null }))
        }))
      }))
    }))
  }
}))

// Mock useRouter
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn()
  })
}))

// Mock the HistoryContent component
jest.mock('@/app/history/HistoryContent', () => ({
  __esModule: true,
  default: ({ bookings }: { bookings: any[] }) => (
    <div data-testid="history-content">History Content with {bookings.length} bookings</div>
  )
}))

describe('History Page Loading', () => {
  it('shows skeleton while loading bookings', async () => {
    render(<HistoryPage />)

    // Initially shows skeleton
    expect(screen.getByTestId('history-skeleton')).toBeInTheDocument()

    // Wait for content to load
    await waitFor(() => {
      expect(screen.queryByTestId('history-skeleton')).not.toBeInTheDocument()
    })

    // Content should be visible
    expect(screen.getByTestId('history-content')).toBeInTheDocument()
  })
})