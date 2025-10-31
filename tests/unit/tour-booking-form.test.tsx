import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import TourBookingForm from '@/components/TourBookingForm'
import { AuthProvider } from '@/components/AuthProvider'
import { QueryProvider } from '@/lib/QueryProvider'

// Mock the auth provider
jest.mock('@/components/AuthProvider', () => ({
  useAuth: () => ({
    user: { id: 'test-user-id', email: 'test@example.com' }
  }),
  AuthProvider: ({ children, initialUser }: { children: React.ReactNode; initialUser: any }) => <div>{children}</div>
}))

// Mock supabase
jest.mock('@/lib/supabase', () => ({
  supabase: {
    storage: {
      from: () => ({
        upload: jest.fn().mockResolvedValue({ data: { path: 'test-path' }, error: null })
      })
    }
  }
}))

// Mock roomUtils
jest.mock('@/lib/roomUtils', () => ({
  ensureLibraryTourRoom: jest.fn().mockResolvedValue({
    success: true,
    roomId: 'test-room-id',
    wasCreated: false
  })
}))

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn()
  })
}))

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, whileHover, whileTap, ...props }: any) => <div {...props}>{children}</div>
  }
}))

const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <QueryProvider>
      <AuthProvider initialUser={null}>
        {component}
      </AuthProvider>
    </QueryProvider>
  )
}

describe('TourBookingForm', () => {
  const mockOnBookingSuccess = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders the form with all required fields', () => {
    renderWithProviders(<TourBookingForm onBookingSuccess={mockOnBookingSuccess} />)

    expect(screen.getByText('Pilih Tanggal')).toBeInTheDocument()
    expect(screen.getByText('Detail Booking Tour')).toBeInTheDocument()
    expect(screen.getByLabelText('Nama Kontak')).toBeInTheDocument()
    expect(screen.getByLabelText('Institusi')).toBeInTheDocument()
    expect(screen.getByLabelText('Jumlah Peserta')).toBeInTheDocument()
    expect(screen.getByLabelText('Permintaan Khusus')).toBeInTheDocument()
    expect(screen.getByLabelText('Upload Dokumen (Opsional)')).toBeInTheDocument()
  })

  it('validates required fields', async () => {
    renderWithProviders(<TourBookingForm onBookingSuccess={mockOnBookingSuccess} />)

    const submitButton = screen.getByRole('button', { name: /Kirim Booking Tour/i })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('Please select a date')).toBeInTheDocument()
      expect(screen.getByText('Contact name is required')).toBeInTheDocument()
      expect(screen.getByText('Institution is required')).toBeInTheDocument()
      expect(screen.getByText('Please enter at least 1 participant')).toBeInTheDocument()
    })
  })

  it('validates participant count limits', async () => {
    renderWithProviders(<TourBookingForm onBookingSuccess={mockOnBookingSuccess} />)

    const participantInput = screen.getByLabelText('Jumlah Peserta')
    fireEvent.change(participantInput, { target: { value: '0' } })

    const submitButton = screen.getByRole('button', { name: /Kirim Booking Tour/i })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('Please enter at least 1 participant')).toBeInTheDocument()
    })

    fireEvent.change(participantInput, { target: { value: '51' } })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('Maximum 50 participants')).toBeInTheDocument()
    })
  })

  it('validates end time is after start time', async () => {
    renderWithProviders(<TourBookingForm onBookingSuccess={mockOnBookingSuccess} />)

    // Select a date first
    const calendar = screen.getByRole('grid')
    const todayButton = screen.getAllByRole('gridcell')[15] // Approximate today's date
    fireEvent.click(todayButton)

    // Set start time to 10:00
    const startHourSelect = screen.getAllByRole('combobox')[0]
    fireEvent.mouseDown(startHourSelect)
    fireEvent.change(startHourSelect, { target: { value: '10' } })

    const startMinuteSelect = screen.getAllByRole('combobox')[1]
    fireEvent.mouseDown(startMinuteSelect)
    fireEvent.change(startMinuteSelect, { target: { value: '00' } })

    // Set end time to 09:00 (before start time)
    const endHourSelect = screen.getAllByRole('combobox')[2]
    fireEvent.mouseDown(endHourSelect)
    fireEvent.change(endHourSelect, { target: { value: '09' } })

    const endMinuteSelect = screen.getAllByRole('combobox')[3]
    fireEvent.mouseDown(endMinuteSelect)
    fireEvent.change(endMinuteSelect, { target: { value: '00' } })

    const submitButton = screen.getByRole('button', { name: /Kirim Booking Tour/i })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('End time must be after start time')).toBeInTheDocument()
    })
  })

  it('handles file upload correctly', async () => {
    renderWithProviders(<TourBookingForm onBookingSuccess={mockOnBookingSuccess} />)

    const fileInput = screen.getByLabelText('Upload Dokumen (Opsional)')
    const file = new File(['test content'], 'test.pdf', { type: 'application/pdf' })

    fireEvent.change(fileInput, { target: { files: [file] } })

    await waitFor(() => {
      expect(screen.getByText('File berhasil diunggah')).toBeInTheDocument()
    })
  })

  it('rejects invalid file types', async () => {
    renderWithProviders(<TourBookingForm onBookingSuccess={mockOnBookingSuccess} />)

    const fileInput = screen.getByLabelText('Upload Dokumen (Opsional)')
    const file = new File(['test content'], 'test.txt', { type: 'text/plain' })

    fireEvent.change(fileInput, { target: { files: [file] } })

    await waitFor(() => {
      expect(screen.getByText('File must be a PDF or Word document')).toBeInTheDocument()
    })
  })

  it('shows loading state during submission', async () => {
    // Mock fetch to simulate API call
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ success: true })
      })
    ) as jest.Mock

    renderWithProviders(<TourBookingForm onBookingSuccess={mockOnBookingSuccess} />)

    // Fill required fields
    const calendar = screen.getByRole('grid')
    const todayButton = screen.getAllByRole('gridcell')[15]
    fireEvent.click(todayButton)

    const contactNameInput = screen.getByLabelText('Nama Kontak')
    fireEvent.change(contactNameInput, { target: { value: 'John Doe' } })

    const institutionInput = screen.getByLabelText('Institusi')
    fireEvent.change(institutionInput, { target: { value: 'Test University' } })

    const participantInput = screen.getByLabelText('Jumlah Peserta')
    fireEvent.change(participantInput, { target: { value: '5' } })

    const submitButton = screen.getByRole('button', { name: /Kirim Booking Tour/i })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('Mengirim Booking...')).toBeInTheDocument()
    })

    // Wait for the fetch call to complete
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/tour-booking', expect.objectContaining({
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: expect.any(String)
      }))
    })
  })

  it('displays booked times for selected date', async () => {
    const existingBookings = [
      {
        id: '1',
        start_time: new Date().toISOString(),
        end_time: new Date(Date.now() + 3600000).toISOString(),
        status: 'approved' as const,
        guest_count: 10,
        event_description: 'Test Tour',
        notes: '',
        proposal_file: null,
        letter: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        user_id: 'user1',
        room_id: 'room1',
        is_tour: true,
        contact_name: 'Test Contact',
        contact_institution: 'Test Institution'
      }
    ]

    renderWithProviders(<TourBookingForm existingBookings={existingBookings} onBookingSuccess={mockOnBookingSuccess} />)

    const calendar = screen.getByRole('grid')
    const todayButton = screen.getAllByRole('gridcell')[15]
    fireEvent.click(todayButton)

    await waitFor(() => {
      expect(screen.getByText(/Waktu yang sudah dipesan/)).toBeInTheDocument()
      expect(screen.getByText(/Sudah disetujui/)).toBeInTheDocument()
    })
  })

  it('handles API errors gracefully', async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: false,
        json: () => Promise.resolve({ error: 'Test error message' })
      })
    ) as jest.Mock

    renderWithProviders(<TourBookingForm onBookingSuccess={mockOnBookingSuccess} />)

    // Fill required fields and submit
    const calendar = screen.getByRole('grid')
    const todayButton = screen.getAllByRole('gridcell')[15]
    fireEvent.click(todayButton)

    const contactNameInput = screen.getByLabelText('Nama Kontak')
    fireEvent.change(contactNameInput, { target: { value: 'John Doe' } })

    const institutionInput = screen.getByLabelText('Institusi')
    fireEvent.change(institutionInput, { target: { value: 'Test University' } })

    const participantInput = screen.getByLabelText('Jumlah Peserta')
    fireEvent.change(participantInput, { target: { value: '5' } })

    const submitButton = screen.getByRole('button', { name: /Kirim Booking Tour/i })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('Test error message')).toBeInTheDocument()
    })
  })
})