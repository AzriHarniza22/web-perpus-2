import { NextRequest } from 'next/server';
import { POST } from '@/app/api/resend-confirmation/route';

// Mock Supabase
jest.mock('@/lib/supabase', () => ({
  getSupabaseServer: jest.fn(),
}));

const mockSupabase = {
  auth: {
    resend: jest.fn(),
  },
};

const { getSupabaseServer } = require('@/lib/supabase');

describe('/api/resend-confirmation', () => {
  let mockRequest: any;

  beforeEach(() => {
    jest.clearAllMocks();
    getSupabaseServer.mockResolvedValue(mockSupabase);

    // Create a mock request
    mockRequest = {
      json: jest.fn(),
      nextUrl: { origin: 'http://localhost:3000' },
      cookies: {},
    };
  });

  it('should return 400 if email is missing', async () => {
    mockRequest.json.mockResolvedValue({});

    const response = await POST(mockRequest);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Email is required');
  });

  it('should resend confirmation email successfully', async () => {
    mockRequest.json.mockResolvedValue({ email: 'test@example.com' });
    mockSupabase.auth.resend.mockResolvedValue({ error: null });

    const response = await POST(mockRequest);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.message).toBe('Confirmation email resent successfully');
    expect(data.data.success).toBe(true);

    expect(mockSupabase.auth.resend).toHaveBeenCalledWith({
      type: 'signup',
      email: 'test@example.com',
      options: {
        emailRedirectTo: 'http://localhost:3000/auth/callback'
      }
    });
  });

  it('should handle resend error from Supabase', async () => {
    mockRequest.json.mockResolvedValue({ email: 'test@example.com' });
    mockSupabase.auth.resend.mockResolvedValue({
      error: { message: 'User not found' }
    });

    const response = await POST(mockRequest);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Failed to resend confirmation email');
  });

  it('should handle unexpected errors', async () => {
    mockRequest.json.mockResolvedValue({ email: 'test@example.com' });
    getSupabaseServer.mockRejectedValue(new Error('Database connection failed'));

    const response = await POST(mockRequest);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Internal server error');
  });

  it('should handle invalid JSON in request', async () => {
    mockRequest.json.mockRejectedValue(new Error('Invalid JSON'));

    const response = await POST(mockRequest);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Internal server error');
  });

  it('should use correct email redirect URL', async () => {
    mockRequest.json.mockResolvedValue({ email: 'user@domain.com' });
    mockRequest.nextUrl = { origin: 'https://myapp.com' };
    mockSupabase.auth.resend.mockResolvedValue({ error: null });

    await POST(mockRequest);

    expect(mockSupabase.auth.resend).toHaveBeenCalledWith({
      type: 'signup',
      email: 'user@domain.com',
      options: {
        emailRedirectTo: 'https://myapp.com/auth/callback'
      }
    });
  });

  it('should handle empty email string', async () => {
    mockRequest.json.mockResolvedValue({ email: '' });

    const response = await POST(mockRequest);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Email is required');
  });

  it('should handle null email', async () => {
    mockRequest.json.mockResolvedValue({ email: null });

    const response = await POST(mockRequest);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Email is required');
  });

  it('should handle undefined email', async () => {
    mockRequest.json.mockResolvedValue({ email: undefined });

    const response = await POST(mockRequest);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Email is required');
  });
});