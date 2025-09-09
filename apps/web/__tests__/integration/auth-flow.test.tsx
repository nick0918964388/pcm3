import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SessionProvider } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { LoginForm } from '@/components/features/LoginForm';

// Mock dependencies
jest.mock('next-auth/react');
jest.mock('next/navigation');

const mockPush = jest.fn();
(useRouter as jest.Mock).mockReturnValue({
  push: mockPush,
});

// Mock session provider
const MockSessionProvider = ({ children }: { children: React.ReactNode }) => (
  <SessionProvider session={null}>{children}</SessionProvider>
);

describe('Authentication Flow Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should handle complete login flow with redirection', async () => {
    const { signIn } = require('next-auth/react');
    signIn.mockResolvedValueOnce({ ok: true, error: null });

    render(
      <MockSessionProvider>
        <LoginForm />
      </MockSessionProvider>
    );

    // Fill and submit form
    fireEvent.change(screen.getByLabelText('帳號'), {
      target: { value: 'testuser' },
    });
    fireEvent.change(screen.getByLabelText('密碼'), {
      target: { value: 'password123' },
    });
    
    fireEvent.click(screen.getByRole('button', { name: '登入' }));

    await waitFor(() => {
      expect(signIn).toHaveBeenCalledWith('credentials', {
        username: 'testuser',
        password: 'password123',
        redirect: false,
      });
      expect(mockPush).toHaveBeenCalledWith('/projects');
    });
  });

  it('should clear password field on authentication failure', async () => {
    const { signIn } = require('next-auth/react');
    signIn.mockResolvedValueOnce({ ok: false, error: 'CredentialsSignin' });

    render(
      <MockSessionProvider>
        <LoginForm />
      </MockSessionProvider>
    );

    const passwordInput = screen.getByLabelText('密碼') as HTMLInputElement;

    fireEvent.change(screen.getByLabelText('帳號'), {
      target: { value: 'testuser' },
    });
    fireEvent.change(passwordInput, {
      target: { value: 'wrongpassword' },
    });
    
    fireEvent.click(screen.getByRole('button', { name: '登入' }));

    await waitFor(() => {
      expect(screen.getByText('帳號或密碼錯誤，請重新輸入')).toBeInTheDocument();
      expect(passwordInput.value).toBe('');
    });
  });

  it('should maintain username but clear password on error', async () => {
    const { signIn } = require('next-auth/react');
    signIn.mockResolvedValueOnce({ ok: false, error: 'CredentialsSignin' });

    render(
      <MockSessionProvider>
        <LoginForm />
      </MockSessionProvider>
    );

    const usernameInput = screen.getByLabelText('帳號') as HTMLInputElement;
    const passwordInput = screen.getByLabelText('密碼') as HTMLInputElement;

    fireEvent.change(usernameInput, {
      target: { value: 'testuser' },
    });
    fireEvent.change(passwordInput, {
      target: { value: 'wrongpassword' },
    });
    
    fireEvent.click(screen.getByRole('button', { name: '登入' }));

    await waitFor(() => {
      expect(usernameInput.value).toBe('testuser'); // Username preserved
      expect(passwordInput.value).toBe(''); // Password cleared
    });
  });
});