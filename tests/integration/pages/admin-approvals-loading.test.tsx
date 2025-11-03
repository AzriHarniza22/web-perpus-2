// tests/integration/pages/admin-approvals-loading.test.tsx
import { render, screen, waitFor } from '@testing-library/react'
import ApprovalsPage from '@/app/admin/approvals/page'

// Mock the AuthProvider
jest.mock('@/components/AuthProvider', () => ({
  useAuth: () => ({
    user: { id: 'test-admin-id', email: 'admin@example.com' },
    isLoading: false
  })
}))

// Mock supabase
jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(() => Promise.resolve({
            data: { id: 'test-admin-id', role: 'admin' },
            error: null
          }))
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

// Mock the AdminApprovalsContent component
jest.mock('@/app/admin/approvals/AdminApprovalsContent', () => ({
  __esModule: true,
  default: () => <div data-testid="admin-approvals-content">Admin Approvals Content</div>
}))

describe('Admin Approvals Page Loading', () => {
  it('shows skeleton while loading', async () => {
    render(<ApprovalsPage />)

    // Initially shows skeleton
    expect(screen.getByTestId('admin-approvals-skeleton')).toBeInTheDocument()

    // Wait for content to load
    await waitFor(() => {
      expect(screen.queryByTestId('admin-approvals-skeleton')).not.toBeInTheDocument()
    })

    // Content should be visible
    expect(screen.getByTestId('admin-approvals-content')).toBeInTheDocument()
  })
})