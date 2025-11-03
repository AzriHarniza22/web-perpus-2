// tests/integration/pages/profile-loading.test.tsx
import { render, screen, waitFor } from '@testing-library/react'
import ProfilePage from '@/app/profile/page'

// Mock the AuthProvider
jest.mock('@/components/AuthProvider', () => ({
  useAuth: () => ({
    user: { id: 'test-user-id', email: 'user@example.com' },
    isLoading: false
  })
}))

// Mock useRouter
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn()
  })
}))

// Mock the ProfileContent component
jest.mock('@/app/profile/ProfileContent', () => ({
  __esModule: true,
  default: () => <div data-testid="profile-content">Profile Content</div>
}))

describe('Profile Page Loading', () => {
  it('shows skeleton while loading', async () => {
    render(<ProfilePage />)

    // Initially shows skeleton
    expect(screen.getByTestId('profile-skeleton')).toBeInTheDocument()

    // Wait for content to load
    await waitFor(() => {
      expect(screen.queryByTestId('profile-skeleton')).not.toBeInTheDocument()
    })

    // Content should be visible
    expect(screen.getByTestId('profile-content')).toBeInTheDocument()
  })
})