// tests/integration/pages/homepage-loading.test.tsx
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Page from '@/app/page'

// Mock the AuthProvider
jest.mock('@/components/AuthProvider', () => ({
  useAuth: () => ({
    user: null,
    isLoading: false
  })
}))

// Mock the HomePage component
jest.mock('@/app/HomePage', () => ({
  __esModule: true,
  default: () => <div data-testid="homepage-content">HomePage Content</div>
}))

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