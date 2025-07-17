// LoginPage Test Suite

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { BrowserRouter, MemoryRouter } from 'react-router-dom';
import { AuthProvider } from '../../../contexts/AuthContext';
import LoginPage from '../LoginPage';
import { authService } from '../../../services/authService';
import { User } from '../../../types/api';

// Mock the auth service
vi.mock('../../../services/authService', () => ({
  authService: {
    login: vi.fn(),
    isAuthenticated: vi.fn(),
    getCurrentUser: vi.fn(),
    getPermissions: vi.fn(),
  },
}));

// Mock react-router-dom
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useLocation: () => ({ state: null }),
  };
});

// Mock user data
const mockUser: User = {
  id: '1',
  username: 'testuser',
  email: 'test@example.com',
  first_name: 'Test',
  last_name: 'User',
  phone_number: '+1234567890',
  role: 'USER',
  is_active: true,
  created_at: '2023-01-01T00:00:00Z',
  updated_at: '2023-01-01T00:00:00Z',
};

const renderLoginPage = (props = {}) => {
  return render(
    <MemoryRouter>
      <AuthProvider>
        <LoginPage {...props} />
      </AuthProvider>
    </MemoryRouter>
  );
};

describe('LoginPage', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(authService.isAuthenticated).mockReturnValue(false);
    localStorage.clear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('Rendering', () => {
    it('should render login form with all required fields', () => {
      renderLoginPage();

      expect(screen.getByText('Welcome Back')).toBeInTheDocument();
      expect(screen.getByText('Sign in to your VitaCheckLabs account')).toBeInTheDocument();
      expect(screen.getByLabelText(/username or email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/remember me/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
      expect(screen.getByText(/forgot your password/i)).toBeInTheDocument();
      expect(screen.getByText(/create account/i)).toBeInTheDocument();
    });

    it('should show password visibility toggle', () => {
      renderLoginPage();

      const passwordField = screen.getByLabelText(/password/i);
      const visibilityButton = screen.getByRole('button', { name: '' }); // IconButton without accessible name

      expect(passwordField).toHaveAttribute('type', 'password');
      
      fireEvent.click(visibilityButton);
      expect(passwordField).toHaveAttribute('type', 'text');
    });

    it('should render with custom redirect prop', () => {
      renderLoginPage({ redirectTo: '/custom-redirect' });
      
      expect(screen.getByText('Welcome Back')).toBeInTheDocument();
    });
  });

  describe('Form Validation', () => {
    it('should show validation errors for empty fields', async () => {
      renderLoginPage();

      const submitButton = screen.getByRole('button', { name: /sign in/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/username or email is required/i)).toBeInTheDocument();
        expect(screen.getByText(/password is required/i)).toBeInTheDocument();
      });
    });

    it('should show validation error for short username', async () => {
      renderLoginPage();

      const usernameField = screen.getByLabelText(/username or email/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      await user.type(usernameField, 'ab');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/username must be at least 3 characters/i)).toBeInTheDocument();
      });
    });

    it('should show validation error for short password', async () => {
      renderLoginPage();

      const usernameField = screen.getByLabelText(/username or email/i);
      const passwordField = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      await user.type(usernameField, 'testuser');
      await user.type(passwordField, '12345');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/password must be at least 6 characters/i)).toBeInTheDocument();
      });
    });
  });

  describe('Authentication', () => {
    it('should handle successful login', async () => {
      vi.mocked(authService.login).mockResolvedValue({
        user: mockUser,
        access_token: 'token',
        refresh_token: 'refresh_token',
        token_type: 'bearer',
        expires_in: 3600,
      });
      vi.mocked(authService.getPermissions).mockResolvedValue(['test:read']);

      renderLoginPage();

      const usernameField = screen.getByLabelText(/username or email/i);
      const passwordField = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      await user.type(usernameField, 'testuser');
      await user.type(passwordField, 'password123');
      await user.click(submitButton);

      await waitFor(() => {
        expect(authService.login).toHaveBeenCalledWith({
          username: 'testuser',
          password: 'password123',
        });
      });

      expect(mockNavigate).toHaveBeenCalledWith('/lab-tests', { replace: true });
    });

    it('should handle login failure', async () => {
      const loginError = new Error('Invalid credentials');
      vi.mocked(authService.login).mockRejectedValue(loginError);

      renderLoginPage();

      const usernameField = screen.getByLabelText(/username or email/i);
      const passwordField = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      await user.type(usernameField, 'testuser');
      await user.type(passwordField, 'wrongpassword');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/invalid username or password/i)).toBeInTheDocument();
      });
    });

    it('should call onLoginSuccess callback when provided', async () => {
      const onLoginSuccess = vi.fn();
      vi.mocked(authService.login).mockResolvedValue({
        user: mockUser,
        access_token: 'token',
        refresh_token: 'refresh_token',
        token_type: 'bearer',
        expires_in: 3600,
      });
      vi.mocked(authService.getPermissions).mockResolvedValue(['test:read']);

      renderLoginPage({ onLoginSuccess });

      const usernameField = screen.getByLabelText(/username or email/i);
      const passwordField = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      await user.type(usernameField, 'testuser');
      await user.type(passwordField, 'password123');
      await user.click(submitButton);

      await waitFor(() => {
        expect(onLoginSuccess).toHaveBeenCalledWith(mockUser);
      });
    });
  });

  describe('Remember Me Functionality', () => {
    it('should store remember me preference when checked', async () => {
      vi.mocked(authService.login).mockResolvedValue({
        user: mockUser,
        access_token: 'token',
        refresh_token: 'refresh_token',
        token_type: 'bearer',
        expires_in: 3600,
      });
      vi.mocked(authService.getPermissions).mockResolvedValue(['test:read']);

      renderLoginPage();

      const usernameField = screen.getByLabelText(/username or email/i);
      const passwordField = screen.getByLabelText(/password/i);
      const rememberMeCheckbox = screen.getByLabelText(/remember me/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      await user.type(usernameField, 'testuser');
      await user.type(passwordField, 'password123');
      await user.click(rememberMeCheckbox);
      await user.click(submitButton);

      await waitFor(() => {
        expect(localStorage.getItem('vitacheck_remember_me')).toBe('true');
      });
    });

    it('should remove remember me preference when unchecked', async () => {
      localStorage.setItem('vitacheck_remember_me', 'true');
      
      vi.mocked(authService.login).mockResolvedValue({
        user: mockUser,
        access_token: 'token',
        refresh_token: 'refresh_token',
        token_type: 'bearer',
        expires_in: 3600,
      });
      vi.mocked(authService.getPermissions).mockResolvedValue(['test:read']);

      renderLoginPage();

      const usernameField = screen.getByLabelText(/username or email/i);
      const passwordField = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      await user.type(usernameField, 'testuser');
      await user.type(passwordField, 'password123');
      // Remember me is unchecked by default
      await user.click(submitButton);

      await waitFor(() => {
        expect(localStorage.getItem('vitacheck_remember_me')).toBeNull();
      });
    });
  });

  describe('Account Lockout', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    it('should track failed login attempts', async () => {
      const loginError = new Error('Invalid credentials');
      vi.mocked(authService.login).mockRejectedValue(loginError);

      renderLoginPage();

      const usernameField = screen.getByLabelText(/username or email/i);
      const passwordField = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      // First failed attempt
      await user.type(usernameField, 'testuser');
      await user.type(passwordField, 'wrong1');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/invalid username or password/i)).toBeInTheDocument();
      });

      // Clear fields and try again
      await user.clear(usernameField);
      await user.clear(passwordField);
      await user.type(usernameField, 'testuser');
      await user.type(passwordField, 'wrong2');
      await user.click(submitButton);

      // Continue until we hit the warning threshold
      for (let i = 0; i < 2; i++) {
        await user.clear(usernameField);
        await user.clear(passwordField);
        await user.type(usernameField, 'testuser');
        await user.type(passwordField, `wrong${i + 3}`);
        await user.click(submitButton);
        
        await waitFor(() => {
          expect(screen.getByText(/invalid username or password/i)).toBeInTheDocument();
        });
      }

      // Should show warning after 3 attempts
      await waitFor(() => {
        expect(screen.getByText(/attempts remaining before account lockout/i)).toBeInTheDocument();
      });
    });

    it('should lock account after 5 failed attempts', async () => {
      const loginError = new Error('Invalid credentials');
      vi.mocked(authService.login).mockRejectedValue(loginError);

      renderLoginPage();

      const usernameField = screen.getByLabelText(/username or email/i);
      const passwordField = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      // Perform 5 failed login attempts
      for (let i = 0; i < 5; i++) {
        await user.clear(usernameField);
        await user.clear(passwordField);
        await user.type(usernameField, 'testuser');
        await user.type(passwordField, `wrong${i + 1}`);
        await user.click(submitButton);
        
        await waitFor(() => {
          expect(screen.getByText(/invalid username or password/i)).toBeInTheDocument();
        });
      }

      // Should show lockout message
      await waitFor(() => {
        expect(screen.getByText(/account temporarily locked/i)).toBeInTheDocument();
        expect(screen.getByText(/please try again in/i)).toBeInTheDocument();
      });

      // Submit button should be disabled
      expect(submitButton).toBeDisabled();
    });

    it('should unlock account after lockout period', async () => {
      const loginError = new Error('Invalid credentials');
      vi.mocked(authService.login).mockRejectedValue(loginError);

      renderLoginPage();

      const usernameField = screen.getByLabelText(/username or email/i);
      const passwordField = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      // Lock the account
      for (let i = 0; i < 5; i++) {
        await user.clear(usernameField);
        await user.clear(passwordField);
        await user.type(usernameField, 'testuser');
        await user.type(passwordField, `wrong${i + 1}`);
        await user.click(submitButton);
        
        await waitFor(() => {
          expect(screen.getByText(/invalid username or password/i)).toBeInTheDocument();
        });
      }

      // Verify lockout
      await waitFor(() => {
        expect(screen.getByText(/account temporarily locked/i)).toBeInTheDocument();
      });

      // Fast-forward time to unlock
      act(() => {
        vi.advanceTimersByTime(300000); // 5 minutes
      });

      // Should be unlocked
      await waitFor(() => {
        expect(screen.queryByText(/account temporarily locked/i)).not.toBeInTheDocument();
        expect(submitButton).not.toBeDisabled();
      });
    });
  });

  describe('Navigation', () => {
    it('should navigate to forgot password page', async () => {
      renderLoginPage();

      const forgotPasswordLink = screen.getByText(/forgot your password/i);
      await user.click(forgotPasswordLink);

      expect(mockNavigate).toHaveBeenCalledWith('/auth/forgot-password');
    });

    it('should navigate to register page', async () => {
      renderLoginPage();

      const createAccountLink = screen.getByText(/create account/i);
      await user.click(createAccountLink);

      expect(mockNavigate).toHaveBeenCalledWith('/auth/register', { 
        state: { from: undefined } 
      });
    });
  });

  describe('Redirect Behavior', () => {
    it('should redirect to intended page after login', async () => {
      // Mock useLocation to return a state with 'from'
      const mockUseLocation = vi.fn(() => ({
        state: { from: { pathname: '/protected-page' } }
      }));
      
      vi.doMock('react-router-dom', async () => {
        const actual = await vi.importActual('react-router-dom');
        return {
          ...actual,
          useNavigate: () => mockNavigate,
          useLocation: mockUseLocation,
        };
      });

      vi.mocked(authService.login).mockResolvedValue({
        user: mockUser,
        access_token: 'token',
        refresh_token: 'refresh_token',
        token_type: 'bearer',
        expires_in: 3600,
      });
      vi.mocked(authService.getPermissions).mockResolvedValue(['test:read']);

      renderLoginPage();

      const usernameField = screen.getByLabelText(/username or email/i);
      const passwordField = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      await user.type(usernameField, 'testuser');
      await user.type(passwordField, 'password123');
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/protected-page', { replace: true });
      });
    });

    it('should redirect authenticated users', () => {
      vi.mocked(authService.isAuthenticated).mockReturnValue(true);
      vi.mocked(authService.getCurrentUser).mockResolvedValue(mockUser);
      vi.mocked(authService.getPermissions).mockResolvedValue(['test:read']);

      renderLoginPage();

      // Should redirect immediately for authenticated users
      expect(mockNavigate).toHaveBeenCalledWith('/lab-tests', { replace: true });
    });
  });

  describe('Loading States', () => {
    it('should show loading state during submission', async () => {
      // Mock a delayed login response
      vi.mocked(authService.login).mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({
          user: mockUser,
          access_token: 'token',
          refresh_token: 'refresh_token',
          token_type: 'bearer',
          expires_in: 3600,
        }), 100))
      );
      vi.mocked(authService.getPermissions).mockResolvedValue(['test:read']);

      renderLoginPage();

      const usernameField = screen.getByLabelText(/username or email/i);
      const passwordField = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      await user.type(usernameField, 'testuser');
      await user.type(passwordField, 'password123');
      
      // Click submit and immediately check for loading state
      user.click(submitButton);

      // Should show loading text and spinner
      await waitFor(() => {
        expect(screen.getByText(/signing in/i)).toBeInTheDocument();
      });

      // Should be disabled during loading
      expect(submitButton).toBeDisabled();
    });

    it('should disable form fields during submission', async () => {
      vi.mocked(authService.login).mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({
          user: mockUser,
          access_token: 'token',
          refresh_token: 'refresh_token',
          token_type: 'bearer',
          expires_in: 3600,
        }), 100))
      );

      renderLoginPage();

      const usernameField = screen.getByLabelText(/username or email/i);
      const passwordField = screen.getByLabelText(/password/i);
      const rememberMeCheckbox = screen.getByLabelText(/remember me/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      await user.type(usernameField, 'testuser');
      await user.type(passwordField, 'password123');
      
      user.click(submitButton);

      await waitFor(() => {
        expect(usernameField).toBeDisabled();
        expect(passwordField).toBeDisabled();
        expect(rememberMeCheckbox).toBeDisabled();
        expect(submitButton).toBeDisabled();
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels and roles', () => {
      renderLoginPage();

      expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
      expect(screen.getByLabelText(/username or email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/remember me/i)).toBeInTheDocument();
    });

    it('should support keyboard navigation', async () => {
      renderLoginPage();

      const usernameField = screen.getByLabelText(/username or email/i);
      const passwordField = screen.getByLabelText(/password/i);

      // Tab navigation should work
      await user.tab();
      expect(usernameField).toHaveFocus();

      await user.tab();
      expect(passwordField).toHaveFocus();
    });
  });
});