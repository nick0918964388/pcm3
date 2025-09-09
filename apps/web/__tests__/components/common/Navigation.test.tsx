import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useSession, signOut } from 'next-auth/react';
import { Navigation } from '@/components/common/Navigation';

// Mock dependencies
jest.mock('next-auth/react');

const mockSignOut = signOut as jest.MockedFunction<typeof signOut>;
const mockUseSession = useSession as jest.MockedFunction<typeof useSession>;

describe('Navigation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders navigation with brand name', () => {
    mockUseSession.mockReturnValue({
      data: null,
      status: 'unauthenticated',
      update: jest.fn(),
    });

    render(<Navigation />);
    
    expect(screen.getByText('PCM 平台')).toBeInTheDocument();
  });

  it('displays user info when authenticated', () => {
    const mockSession = {
      user: {
        id: '1',
        name: '測試用戶',
        username: 'testuser',
        email: 'test@example.com'
      },
      expires: '2024-01-01'
    };

    mockUseSession.mockReturnValue({
      data: mockSession,
      status: 'authenticated',
      update: jest.fn(),
    });

    render(<Navigation />);
    
    expect(screen.getByText('歡迎, 測試用戶')).toBeInTheDocument();
    expect(screen.getByText('登出')).toBeInTheDocument();
  });

  it('displays username when name is not available', () => {
    const mockSession = {
      user: {
        id: '1',
        name: null,
        username: 'testuser',
        email: 'test@example.com'
      },
      expires: '2024-01-01'
    };

    mockUseSession.mockReturnValue({
      data: mockSession,
      status: 'authenticated',
      update: jest.fn(),
    });

    render(<Navigation />);
    
    expect(screen.getByText('歡迎, testuser')).toBeInTheDocument();
  });

  it('handles logout when logout button is clicked', async () => {
    const mockSession = {
      user: {
        id: '1',
        name: '測試用戶',
        username: 'testuser',
        email: 'test@example.com'
      },
      expires: '2024-01-01'
    };

    mockUseSession.mockReturnValue({
      data: mockSession,
      status: 'authenticated',
      update: jest.fn(),
    });

    render(<Navigation />);
    
    const logoutButton = screen.getByText('登出');
    fireEvent.click(logoutButton);
    
    await waitFor(() => {
      expect(mockSignOut).toHaveBeenCalledWith({ callbackUrl: '/login' });
    });
  });

  it('does not display user info when not authenticated', () => {
    mockUseSession.mockReturnValue({
      data: null,
      status: 'unauthenticated',
      update: jest.fn(),
    });

    render(<Navigation />);
    
    expect(screen.queryByText(/歡迎/)).not.toBeInTheDocument();
    expect(screen.queryByText('登出')).not.toBeInTheDocument();
  });
});