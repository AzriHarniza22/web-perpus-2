import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import ConfirmPage from '@/app/confirm/page';

// Mock fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Mock useRouter
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
  useSearchParams: () => ({
    get: (key: string) => key === 'email' ? 'test@example.com' : null,
  }),
}));

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  Mail: () => <div data-testid="mail-icon" />,
  AlertTriangle: () => <div data-testid="alert-triangle-icon" />,
  Clock: () => <div data-testid="clock-icon" />,
  Shield: () => <div data-testid="shield-icon" />,
  CheckCircle: () => <div data-testid="check-circle-icon" />,
  RefreshCw: () => <div data-testid="refresh-cw-icon" />,
}));

describe('ConfirmPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  const renderComponent = () => {
    return render(
      <ConfirmPage
        searchParams={Promise.resolve({ email: 'test@example.com' })}
      />
    );
  };

  it('should render loading state initially', () => {
    render(
      <ConfirmPage
        searchParams={Promise.resolve({} as { email?: string })}
      />
    );
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('should render confirm page with email', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Cek Email Anda')).toBeInTheDocument();
    });

    expect(screen.getByText('test@example.com')).toBeInTheDocument();
    expect(screen.getByText('Silakan klik link konfirmasi di email tersebut untuk mengaktifkan akun Anda.')).toBeInTheDocument();
  });

  it('should display important notes', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Catatan Penting')).toBeInTheDocument();
    });

    expect(screen.getByText('Email konfirmasi biasanya tiba dalam 1-5 menit')).toBeInTheDocument();
    expect(screen.getByText('Link konfirmasi akan kadaluarsa dalam 24 jam')).toBeInTheDocument();
    expect(screen.getByText('Anda tidak bisa login sebelum mengkonfirmasi email')).toBeInTheDocument();
  });

  it('should display success tips', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Tips untuk Sukses')).toBeInTheDocument();
    });

    expect(screen.getByText(/Pastikan email yang dimasukkan benar/)).toBeInTheDocument();
    expect(screen.getByText(/Cek folder spam atau junk jika tidak menemukan email/)).toBeInTheDocument();
    expect(screen.getByText(/Link konfirmasi hanya bisa digunakan sekali/)).toBeInTheDocument();
  });

  it('should have back to login button', async () => {
    renderComponent();

    await waitFor(() => {
      const loginButton = screen.getByRole('link', { name: 'Kembali ke Login' });
      expect(loginButton).toBeInTheDocument();
      expect(loginButton).toHaveAttribute('href', '/login');
    });
  });

  it('should have resend email button enabled initially', async () => {
    await act(async () => {
      renderComponent();
    });

    await waitFor(() => {
      const resendButton = screen.getByRole('button', { name: /Kirim Ulang Email Konfirmasi/ });
      expect(resendButton).toBeInTheDocument();
      expect(resendButton).toBeEnabled();
    });
  });

  it('should handle successful resend email', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true }),
    });

    await act(async () => {
      renderComponent();
    });

    await waitFor(() => {
      const resendButton = screen.getByRole('button', { name: /Kirim Ulang Email Konfirmasi/ });
      fireEvent.click(resendButton);
    });

    await waitFor(() => {
      expect(screen.getByText('Email konfirmasi telah dikirim ulang. Silakan periksa kotak masuk Anda.')).toBeInTheDocument();
    });

    expect(mockFetch).toHaveBeenCalledWith('/api/resend-confirmation', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email: 'test@example.com' }),
    });
  });

  it('should handle failed resend email', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ success: false }),
    });

    await act(async () => {
      renderComponent();
    });

    await waitFor(() => {
      const resendButton = screen.getByRole('button', { name: /Kirim Ulang Email Konfirmasi/ });
      fireEvent.click(resendButton);
    });

    await waitFor(() => {
      expect(screen.getByText('Gagal mengirim ulang email. Silakan coba lagi nanti.')).toBeInTheDocument();
    });
  });

  it('should show loading state during resend', async () => {
    mockFetch.mockImplementation(() => new Promise(resolve => setTimeout(() => resolve({
      ok: true,
      json: async () => ({ success: true }),
    }), 100)));

    await act(async () => {
      renderComponent();
    });

    await waitFor(() => {
      const resendButton = screen.getByRole('button', { name: /Kirim Ulang Email Konfirmasi/ });
      fireEvent.click(resendButton);
    });

    expect(screen.getByText('Mengirim ulang...')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.queryByText('Mengirim ulang...')).not.toBeInTheDocument();
    });
  });

  it('should disable resend button during countdown', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true }),
    });

    await act(async () => {
      renderComponent();
    });

    await waitFor(() => {
      const resendButton = screen.getByRole('button', { name: /Kirim Ulang Email Konfirmasi/ });
      fireEvent.click(resendButton);
    });

    await waitFor(() => {
      expect(screen.getByText('Kirim ulang dalam 60s')).toBeInTheDocument();
    });

    const resendButton = screen.getByRole('button', { name: /Kirim ulang dalam/ });
    expect(resendButton).toBeDisabled();
  });

  it('should countdown timer work correctly', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true }),
    });

    await act(async () => {
      renderComponent();
    });

    await waitFor(() => {
      const resendButton = screen.getByRole('button', { name: /Kirim Ulang Email Konfirmasi/ });
      fireEvent.click(resendButton);
    });

    await waitFor(() => {
      expect(screen.getByText('Kirim ulang dalam 60s')).toBeInTheDocument();
    });

    // Advance timer by 1 second
    act(() => {
      jest.advanceTimersByTime(1000);
    });

    await waitFor(() => {
      expect(screen.getByText('Kirim ulang dalam 59s')).toBeInTheDocument();
    });

    // Advance timer by another second
    act(() => {
      jest.advanceTimersByTime(1000);
    });

    await waitFor(() => {
      expect(screen.getByText('Kirim ulang dalam 58s')).toBeInTheDocument();
    });
  });

  it('should re-enable button after countdown finishes', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true }),
    });

    await act(async () => {
      renderComponent();
    });

    await waitFor(() => {
      const resendButton = screen.getByRole('button', { name: /Kirim Ulang Email Konfirmasi/ });
      fireEvent.click(resendButton);
    });

    await waitFor(() => {
      expect(screen.getByText('Kirim ulang dalam 60s')).toBeInTheDocument();
    });

    // Advance timer to finish countdown
    act(() => {
      jest.advanceTimersByTime(60000);
    });

    await waitFor(() => {
      const resendButton = screen.getByRole('button', { name: /Kirim Ulang Email Konfirmasi/ });
      expect(resendButton).toBeEnabled();
    });
  });

  it('should handle network error', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    await act(async () => {
      renderComponent();
    });

    await waitFor(() => {
      const resendButton = screen.getByRole('button', { name: /Kirim Ulang Email Konfirmasi/ });
      fireEvent.click(resendButton);
    });

    await waitFor(() => {
      expect(screen.getByText('Terjadi kesalahan. Silakan coba lagi nanti.')).toBeInTheDocument();
    });
  });

  it('should prevent resend when countdown is active', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true }),
    });

    await act(async () => {
      renderComponent();
    });

    await waitFor(() => {
      const resendButton = screen.getByRole('button', { name: /Kirim Ulang Email Konfirmasi/ });
      fireEvent.click(resendButton);
    });

    await waitFor(() => {
      expect(screen.getByText('Kirim ulang dalam 60s')).toBeInTheDocument();
    });

    // Try to click again during countdown
    const disabledButton = screen.getByRole('button', { name: /Kirim ulang dalam/ });
    fireEvent.click(disabledButton);

    // Should not make another API call
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it('should handle missing email gracefully', async () => {
    render(
      <ConfirmPage
        searchParams={Promise.resolve({})}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Cek Email Anda')).toBeInTheDocument();
    });

    // Email display should not be present
    expect(screen.queryByText(/@/)).not.toBeInTheDocument();
  });

  it('should have proper accessibility attributes', async () => {
    await act(async () => {
      renderComponent();
    });

    await waitFor(() => {
      const resendButton = screen.getByRole('button', { name: /Kirim Ulang Email Konfirmasi/ });
      expect(resendButton).toHaveAttribute('aria-label', 'Kirim ulang email konfirmasi');
    });
  });
});