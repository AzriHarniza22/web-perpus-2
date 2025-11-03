// tests/integration/pages/book-loading.test.tsx
import { render, screen, waitFor } from '@testing-library/react'
import BookPage from '@/app/book/page'

// Mock supabase
jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          order: jest.fn(() => Promise.resolve({ data: [], error: null }))
        }))
      }))
    }))
  }
}))

// Mock the BookContent component
jest.mock('@/app/book/BookContent', () => ({
  __esModule: true,
  default: ({ rooms }: { rooms: any[] }) => (
    <div data-testid="book-content">Book Content with {rooms.length} rooms</div>
  )
}))

describe('Book Page Loading', () => {
  it('shows skeleton while loading rooms', async () => {
    render(<BookPage />)

    // Initially shows skeleton
    expect(screen.getByTestId('book-skeleton')).toBeInTheDocument()

    // Wait for content to load
    await waitFor(() => {
      expect(screen.queryByTestId('book-skeleton')).not.toBeInTheDocument()
    })

    // Content should be visible
    expect(screen.getByTestId('book-content')).toBeInTheDocument()
  })
})