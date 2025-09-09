import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { LoginForm } from '@/components/features/LoginForm';

// Mock dependencies
jest.mock('next-auth/react');
jest.mock('next/navigation');

const mockSignIn = signIn as jest.MockedFunction<typeof signIn>;
const mockPush = jest.fn();

(useRouter as jest.Mock).mockReturnValue({
  push: mockPush,
});

describe('LoginForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders login form correctly', () => {
    render(<LoginForm />);
    
    expect(screen.getByText('PCM 平台登入')).toBeInTheDocument();
    expect(screen.getByLabelText('帳號')).toBeInTheDocument();
    expect(screen.getByLabelText('密碼')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '登入' })).toBeInTheDocument();
  });

  it('shows validation error for empty username', async () => {
    render(<LoginForm />);
    
    const submitButton = screen.getByRole('button', { name: '登入' });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText('請輸入帳號')).toBeInTheDocument();
    });
  });

  it('shows validation error for empty password', async () => {
    render(<LoginForm />);
    
    const usernameInput = screen.getByLabelText('帳號');
    fireEvent.change(usernameInput, { target: { value: 'testuser' } });
    
    const submitButton = screen.getByRole('button', { name: '登入' });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText('請輸入密碼')).toBeInTheDocument();
    });
  });

  it('handles successful login', async () => {
    mockSignIn.mockResolvedValueOnce({ ok: true, error: null });
    
    render(<LoginForm />);
    
    const usernameInput = screen.getByLabelText('帳號');
    const passwordInput = screen.getByLabelText('密碼');
    const submitButton = screen.getByRole('button', { name: '登入' });
    
    fireEvent.change(usernameInput, { target: { value: 'testuser' } });
    fireEvent.change(passwordInput, { target: { value: 'password' } });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith('credentials', {
        username: 'testuser',
        password: 'password',
        redirect: false,
      });
      expect(mockPush).toHaveBeenCalledWith('/projects');
    });
  });

  it('handles login error', async () => {
    mockSignIn.mockResolvedValueOnce({ ok: false, error: 'CredentialsSignin' });
    
    render(<LoginForm />);
    
    const usernameInput = screen.getByLabelText('帳號');
    const passwordInput = screen.getByLabelText('密碼');
    const submitButton = screen.getByRole('button', { name: '登入' });
    
    fireEvent.change(usernameInput, { target: { value: 'testuser' } });
    fireEvent.change(passwordInput, { target: { value: 'wrongpassword' } });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText('帳號或密碼錯誤，請重新輸入')).toBeInTheDocument();
    });
  });

  it('shows loading state during login', async () => {
    mockSignIn.mockImplementation(() => new Promise(resolve => setTimeout(() => resolve({ ok: true }), 100)));
    
    render(<LoginForm />);
    
    const usernameInput = screen.getByLabelText('帳號');
    const passwordInput = screen.getByLabelText('密碼');
    const submitButton = screen.getByRole('button', { name: '登入' });
    
    fireEvent.change(usernameInput, { target: { value: 'testuser' } });
    fireEvent.change(passwordInput, { target: { value: 'password' } });
    fireEvent.click(submitButton);
    
    expect(screen.getByText('登入中...')).toBeInTheDocument();
    expect(submitButton).toBeDisabled();
  });
});