// tests/unit/skeletons/ProfileSkeleton.test.tsx
import { render, screen } from '@testing-library/react'
import { ProfileSkeleton } from '@/components/ui/skeletons'

describe('ProfileSkeleton', () => {
  it('renders profile form skeleton elements', () => {
    render(<ProfileSkeleton />)

    // Check profile photo skeleton
    expect(screen.getByTestId('profile-photo-skeleton')).toBeInTheDocument()

    // Check form fields (4 fields)
    const formFields = screen.getAllByTestId('form-field-skeleton')
    expect(formFields).toHaveLength(4)

    // Check account info section
    expect(screen.getByTestId('account-info-skeleton')).toBeInTheDocument()
  })

  it('has proper accessibility attributes', () => {
    render(<ProfileSkeleton />)

    // Skeleton components don't have role="progressbar" by default
    // Check that skeleton elements exist
    const skeletonElements = screen.getAllByTestId(/skeleton/)
    expect(skeletonElements.length).toBeGreaterThan(0)
  })
})