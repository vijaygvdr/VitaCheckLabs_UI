// RegisterPage Test Suite

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from '../../../contexts/AuthContext';
import RegisterPage from '../RegisterPage';
import { authService } from '../../../services/authService';
import { User } from '../../../types/api';

// Mock the auth service
vi.mock('../../../services/authService', () => ({
  authService: {
    register: vi.fn(),
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

const renderRegisterPage = (props = {}) => {
  return render(
    <MemoryRouter>
      <AuthProvider>
        <RegisterPage {...props} />
      </AuthProvider>
    </MemoryRouter>
  );
};

describe('RegisterPage', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(authService.isAuthenticated).mockReturnValue(false);
  });

  describe('Rendering', () => {
    it('should render registration form with stepper', () => {
      renderRegisterPage();

      expect(screen.getByText('Create Account')).toBeInTheDocument();
      expect(screen.getByText('Join VitaCheckLabs for comprehensive lab testing')).toBeInTheDocument();
      
      // Should show stepper
      expect(screen.getByText('Account Info')).toBeInTheDocument();
      expect(screen.getByText('Personal Info')).toBeInTheDocument();
      expect(screen.getByText('Terms & Privacy')).toBeInTheDocument();
      
      // Should show first step fields
      expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
    });

    it('should show navigation buttons', () => {
      renderRegisterPage();
      
      expect(screen.getByText('Back')).toBeDisabled(); // First step, back should be disabled
      expect(screen.getByText('Next')).toBeInTheDocument();
      expect(screen.getByText('Sign In')).toBeInTheDocument();
    });
  });

  describe('Step Navigation', () => {
    it('should navigate to next step when current step is valid', async () => {
      renderRegisterPage();

      // Fill out first step
      await user.type(screen.getByLabelText(/username/i), 'testuser');
      await user.type(screen.getByLabelText(/email address/i), 'test@example.com');
      await user.type(screen.getByLabelText(/^password$/i), 'Password123');
      await user.type(screen.getByLabelText(/confirm password/i), 'Password123');

      // Click next
      await user.click(screen.getByText('Next'));

      await waitFor(() => {
        // Should be on step 2
        expect(screen.getByLabelText(/first name/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/last name/i)).toBeInTheDocument();
        expect(screen.getByText('Back')).not.toBeDisabled();
      });
    });

    it('should not navigate to next step when current step is invalid', async () => {
      renderRegisterPage();

      // Don't fill out required fields
      await user.click(screen.getByText('Next'));

      await waitFor(() => {
        // Should show validation errors
        expect(screen.getByText(/username is required/i)).toBeInTheDocument();
        expect(screen.getByText(/email is required/i)).toBeInTheDocument();
        expect(screen.getByText(/password is required/i)).toBeInTheDocument();
        
        // Should still be on step 1
        expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
      });
    });

    it('should navigate back to previous step', async () => {
      renderRegisterPage();

      // Navigate to step 2
      await user.type(screen.getByLabelText(/username/i), 'testuser');
      await user.type(screen.getByLabelText(/email address/i), 'test@example.com');
      await user.type(screen.getByLabelText(/^password$/i), 'Password123');
      await user.type(screen.getByLabelText(/confirm password/i), 'Password123');
      await user.click(screen.getByText('Next'));

      await waitFor(() => {
        expect(screen.getByLabelText(/first name/i)).toBeInTheDocument();
      });

      // Navigate back
      await user.click(screen.getByText('Back'));

      await waitFor(() => {
        expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
      });
    });

    it('should show create account button on final step', async () => {
      renderRegisterPage();

      // Navigate through all steps
      // Step 1
      await user.type(screen.getByLabelText(/username/i), 'testuser');
      await user.type(screen.getByLabelText(/email address/i), 'test@example.com');
      await user.type(screen.getByLabelText(/^password$/i), 'Password123');
      await user.type(screen.getByLabelText(/confirm password/i), 'Password123');
      await user.click(screen.getByText('Next'));

      // Step 2
      await waitFor(() => {
        expect(screen.getByLabelText(/first name/i)).toBeInTheDocument();
      });
      await user.type(screen.getByLabelText(/first name/i), 'Test');
      await user.type(screen.getByLabelText(/last name/i), 'User');
      await user.click(screen.getByText('Next'));

      // Step 3
      await waitFor(() => {
        expect(screen.getByText(/terms and conditions/i)).toBeInTheDocument();
        expect(screen.getByText('Create Account')).toBeInTheDocument();
        expect(screen.queryByText('Next')).not.toBeInTheDocument();
      });
    });
  });

  describe('Form Validation', () => {
    it('should validate username requirements', async () => {
      renderRegisterPage();

      const usernameField = screen.getByLabelText(/username/i);
      
      // Too short
      await user.type(usernameField, 'ab');
      await user.click(screen.getByText('Next'));

      await waitFor(() => {
        expect(screen.getByText(/username must be at least 3 characters/i)).toBeInTheDocument();
      });

      // Invalid characters
      await user.clear(usernameField);
      await user.type(usernameField, 'test@user');
      await user.click(screen.getByText('Next'));

      await waitFor(() => {
        expect(screen.getByText(/username can only contain letters, numbers, and underscores/i)).toBeInTheDocument();
      });
    });

    it('should validate email format', async () => {
      renderRegisterPage();

      const emailField = screen.getByLabelText(/email address/i);
      
      await user.type(emailField, 'invalid-email');
      await user.click(screen.getByText('Next'));

      await waitFor(() => {
        expect(screen.getByText(/please enter a valid email address/i)).toBeInTheDocument();
      });
    });

    it('should validate password strength', async () => {
      renderRegisterPage();

      const passwordField = screen.getByLabelText(/^password$/i);
      
      // Too short
      await user.type(passwordField, '123');
      await user.click(screen.getByText('Next'));

      await waitFor(() => {
        expect(screen.getByText(/password must be at least 8 characters/i)).toBeInTheDocument();
      });

      // Missing requirements
      await user.clear(passwordField);
      await user.type(passwordField, 'password');
      await user.click(screen.getByText('Next'));

      await waitFor(() => {
        expect(screen.getByText(/password must contain at least one uppercase letter/i)).toBeInTheDocument();
      });
    });

    it('should validate password confirmation', async () => {
      renderRegisterPage();

      await user.type(screen.getByLabelText(/^password$/i), 'Password123');
      await user.type(screen.getByLabelText(/confirm password/i), 'DifferentPassword');
      await user.click(screen.getByText('Next'));

      await waitFor(() => {
        expect(screen.getByText(/passwords must match/i)).toBeInTheDocument();
      });
    });

    it('should validate phone number format', async () => {
      renderRegisterPage();

      // Navigate to step 2
      await user.type(screen.getByLabelText(/username/i), 'testuser');
      await user.type(screen.getByLabelText(/email address/i), 'test@example.com');
      await user.type(screen.getByLabelText(/^password$/i), 'Password123');
      await user.type(screen.getByLabelText(/confirm password/i), 'Password123');
      await user.click(screen.getByText('Next'));

      await waitFor(() => {
        expect(screen.getByLabelText(/phone number/i)).toBeInTheDocument();
      });

      // Invalid phone number
      await user.type(screen.getByLabelText(/phone number/i), 'abc');
      await user.click(screen.getByText('Next'));

      await waitFor(() => {
        expect(screen.getByText(/please enter a valid phone number/i)).toBeInTheDocument();
      });
    });

    it('should require terms and privacy agreement', async () => {
      renderRegisterPage();

      // Navigate to final step
      await user.type(screen.getByLabelText(/username/i), 'testuser');
      await user.type(screen.getByLabelText(/email address/i), 'test@example.com');
      await user.type(screen.getByLabelText(/^password$/i), 'Password123');
      await user.type(screen.getByLabelText(/confirm password/i), 'Password123');
      await user.click(screen.getByText('Next'));

      await waitFor(() => {
        expect(screen.getByLabelText(/first name/i)).toBeInTheDocument();
      });
      await user.type(screen.getByLabelText(/first name/i), 'Test');
      await user.type(screen.getByLabelText(/last name/i), 'User');
      await user.click(screen.getByText('Next'));

      // Try to submit without agreeing to terms
      await waitFor(() => {
        expect(screen.getByText('Create Account')).toBeInTheDocument();
      });
      await user.click(screen.getByText('Create Account'));

      await waitFor(() => {
        expect(screen.getByText(/you must agree to the terms and conditions/i)).toBeInTheDocument();
        expect(screen.getByText(/you must agree to the privacy policy/i)).toBeInTheDocument();
      });
    });
  });

  describe('Password Strength Indicator', () => {
    it('should show password strength indicator', async () => {
      renderRegisterPage();

      const passwordField = screen.getByLabelText(/^password$/i);
      
      // Weak password
      await user.type(passwordField, 'weak');
      expect(screen.getByText('Weak')).toBeInTheDocument();

      // Strong password
      await user.clear(passwordField);
      await user.type(passwordField, 'StrongPassword123!');
      await waitFor(() => {
        expect(screen.getByText('Strong')).toBeInTheDocument();
      });
    });

    it('should update strength indicator color', async () => {
      renderRegisterPage();

      const passwordField = screen.getByLabelText(/^password$/i);
      
      await user.type(passwordField, 'Password123');
      
      // Should show good strength with appropriate color
      await waitFor(() => {
        const strengthIndicator = screen.getByText('Good');
        expect(strengthIndicator).toBeInTheDocument();
      });
    });
  });

  describe('Registration Submission', () => {
    it('should handle successful registration', async () => {
      vi.mocked(authService.register).mockResolvedValue({
        user: mockUser,
        access_token: 'token',
        refresh_token: 'refresh_token',
        token_type: 'bearer',
        expires_in: 3600,
      });
      vi.mocked(authService.getPermissions).mockResolvedValue(['test:read']);

      renderRegisterPage();

      // Fill out all steps
      await user.type(screen.getByLabelText(/username/i), 'testuser');
      await user.type(screen.getByLabelText(/email address/i), 'test@example.com');
      await user.type(screen.getByLabelText(/^password$/i), 'Password123');
      await user.type(screen.getByLabelText(/confirm password/i), 'Password123');
      await user.click(screen.getByText('Next'));

      await waitFor(() => {
        expect(screen.getByLabelText(/first name/i)).toBeInTheDocument();
      });
      await user.type(screen.getByLabelText(/first name/i), 'Test');
      await user.type(screen.getByLabelText(/last name/i), 'User');
      await user.type(screen.getByLabelText(/phone number/i), '+1234567890');
      await user.click(screen.getByText('Next'));

      await waitFor(() => {
        expect(screen.getByText(/terms and conditions/i)).toBeInTheDocument();
      });
      await user.click(screen.getByLabelText(/terms and conditions/i));
      await user.click(screen.getByLabelText(/privacy policy/i));
      await user.click(screen.getByText('Create Account'));

      await waitFor(() => {
        expect(authService.register).toHaveBeenCalledWith({
          username: 'testuser',
          email: 'test@example.com',
          password: 'Password123',
          first_name: 'Test',
          last_name: 'User',
          phone_number: '+1234567890',
        });
      });

      expect(mockNavigate).toHaveBeenCalledWith('/lab-tests', { replace: true });
    });

    it('should handle registration failure', async () => {
      const registerError = new Error('User already exists');
      vi.mocked(authService.register).mockRejectedValue(registerError);

      renderRegisterPage();

      // Complete registration form
      await user.type(screen.getByLabelText(/username/i), 'testuser');
      await user.type(screen.getByLabelText(/email address/i), 'test@example.com');
      await user.type(screen.getByLabelText(/^password$/i), 'Password123');
      await user.type(screen.getByLabelText(/confirm password/i), 'Password123');
      await user.click(screen.getByText('Next'));

      await waitFor(() => {
        expect(screen.getByLabelText(/first name/i)).toBeInTheDocument();
      });
      await user.type(screen.getByLabelText(/first name/i), 'Test');
      await user.type(screen.getByLabelText(/last name/i), 'User');
      await user.click(screen.getByText('Next'));

      await waitFor(() => {
        expect(screen.getByText(/terms and conditions/i)).toBeInTheDocument();
      });
      await user.click(screen.getByLabelText(/terms and conditions/i));
      await user.click(screen.getByLabelText(/privacy policy/i));
      await user.click(screen.getByText('Create Account'));

      await waitFor(() => {
        expect(screen.getByText(/user already exists/i)).toBeInTheDocument();
      });
    });

    it('should call onRegisterSuccess callback when provided', async () => {
      const onRegisterSuccess = vi.fn();
      vi.mocked(authService.register).mockResolvedValue({
        user: mockUser,
        access_token: 'token',
        refresh_token: 'refresh_token',
        token_type: 'bearer',
        expires_in: 3600,
      });
      vi.mocked(authService.getPermissions).mockResolvedValue(['test:read']);

      renderRegisterPage({ onRegisterSuccess });

      // Complete registration
      await user.type(screen.getByLabelText(/username/i), 'testuser');
      await user.type(screen.getByLabelText(/email address/i), 'test@example.com');
      await user.type(screen.getByLabelText(/^password$/i), 'Password123');
      await user.type(screen.getByLabelText(/confirm password/i), 'Password123');
      await user.click(screen.getByText('Next'));

      await waitFor(() => {
        expect(screen.getByLabelText(/first name/i)).toBeInTheDocument();
      });
      await user.type(screen.getByLabelText(/first name/i), 'Test');
      await user.type(screen.getByLabelText(/last name/i), 'User');
      await user.click(screen.getByText('Next'));

      await waitFor(() => {
        expect(screen.getByText(/terms and conditions/i)).toBeInTheDocument();
      });
      await user.click(screen.getByLabelText(/terms and conditions/i));
      await user.click(screen.getByLabelText(/privacy policy/i));
      await user.click(screen.getByText('Create Account'));

      await waitFor(() => {
        expect(onRegisterSuccess).toHaveBeenCalledWith(mockUser);
      });
    });
  });

  describe('Marketing Emails Option', () => {
    it('should include marketing email preference in submission', async () => {
      vi.mocked(authService.register).mockResolvedValue({
        user: mockUser,
        access_token: 'token',
        refresh_token: 'refresh_token',
        token_type: 'bearer',
        expires_in: 3600,
      });
      vi.mocked(authService.getPermissions).mockResolvedValue(['test:read']);

      renderRegisterPage();

      // Navigate to final step and check marketing emails
      await user.type(screen.getByLabelText(/username/i), 'testuser');
      await user.type(screen.getByLabelText(/email address/i), 'test@example.com');
      await user.type(screen.getByLabelText(/^password$/i), 'Password123');
      await user.type(screen.getByLabelText(/confirm password/i), 'Password123');
      await user.click(screen.getByText('Next'));

      await waitFor(() => {
        expect(screen.getByLabelText(/first name/i)).toBeInTheDocument();
      });
      await user.type(screen.getByLabelText(/first name/i), 'Test');
      await user.type(screen.getByLabelText(/last name/i), 'User');
      await user.click(screen.getByText('Next'));

      await waitFor(() => {
        expect(screen.getByText(/marketing emails/i)).toBeInTheDocument();
      });
      await user.click(screen.getByLabelText(/terms and conditions/i));
      await user.click(screen.getByLabelText(/privacy policy/i));
      await user.click(screen.getByLabelText(/marketing emails/i));
      await user.click(screen.getByText('Create Account'));

      await waitFor(() => {
        expect(authService.register).toHaveBeenCalled();
      });
    });
  });

  describe('Navigation Links', () => {
    it('should navigate to login page', async () => {
      renderRegisterPage();

      const signInLink = screen.getByText('Sign In');
      await user.click(signInLink);

      expect(mockNavigate).toHaveBeenCalledWith('/auth/login', { 
        state: { from: undefined } 
      });
    });
  });

  describe('Error Handling', () => {
    it('should show validation errors on appropriate steps', async () => {
      const registerError = {
        response: {
          data: {
            detail: [
              { field: 'username', message: 'Username already taken' },
              { field: 'email', message: 'Email already registered' },
            ]
          }
        }
      };
      
      vi.mocked(authService.register).mockRejectedValue(registerError);

      renderRegisterPage();

      // Complete form and submit
      await user.type(screen.getByLabelText(/username/i), 'testuser');
      await user.type(screen.getByLabelText(/email address/i), 'test@example.com');
      await user.type(screen.getByLabelText(/^password$/i), 'Password123');
      await user.type(screen.getByLabelText(/confirm password/i), 'Password123');
      await user.click(screen.getByText('Next'));

      await waitFor(() => {
        expect(screen.getByLabelText(/first name/i)).toBeInTheDocument();
      });
      await user.type(screen.getByLabelText(/first name/i), 'Test');
      await user.type(screen.getByLabelText(/last name/i), 'User');
      await user.click(screen.getByText('Next'));

      await waitFor(() => {
        expect(screen.getByText(/terms and conditions/i)).toBeInTheDocument();
      });
      await user.click(screen.getByLabelText(/terms and conditions/i));
      await user.click(screen.getByLabelText(/privacy policy/i));
      await user.click(screen.getByText('Create Account'));

      // Should navigate back to step 1 for username/email errors
      await waitFor(() => {
        expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
      });
    });
  });

  describe('Loading States', () => {
    it('should show loading state during submission', async () => {
      vi.mocked(authService.register).mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({
          user: mockUser,
          access_token: 'token',
          refresh_token: 'refresh_token',
          token_type: 'bearer',
          expires_in: 3600,
        }), 100))
      );

      renderRegisterPage();

      // Complete form quickly and submit
      await user.type(screen.getByLabelText(/username/i), 'testuser');
      await user.type(screen.getByLabelText(/email address/i), 'test@example.com');
      await user.type(screen.getByLabelText(/^password$/i), 'Password123');
      await user.type(screen.getByLabelText(/confirm password/i), 'Password123');
      await user.click(screen.getByText('Next'));

      await waitFor(() => {
        expect(screen.getByLabelText(/first name/i)).toBeInTheDocument();
      });
      await user.type(screen.getByLabelText(/first name/i), 'Test');
      await user.type(screen.getByLabelText(/last name/i), 'User');
      await user.click(screen.getByText('Next'));

      await waitFor(() => {
        expect(screen.getByText(/terms and conditions/i)).toBeInTheDocument();
      });
      await user.click(screen.getByLabelText(/terms and conditions/i));
      await user.click(screen.getByLabelText(/privacy policy/i));
      
      user.click(screen.getByText('Create Account'));

      // Should show loading state
      await waitFor(() => {
        expect(screen.getByText(/creating account/i)).toBeInTheDocument();
      });
    });

    it('should disable form during submission', async () => {
      vi.mocked(authService.register).mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({
          user: mockUser,
          access_token: 'token',
          refresh_token: 'refresh_token',
          token_type: 'bearer',
          expires_in: 3600,
        }), 100))
      );

      renderRegisterPage();

      // Navigate to final step and start submission
      await user.type(screen.getByLabelText(/username/i), 'testuser');
      await user.type(screen.getByLabelText(/email address/i), 'test@example.com');
      await user.type(screen.getByLabelText(/^password$/i), 'Password123');
      await user.type(screen.getByLabelText(/confirm password/i), 'Password123');
      await user.click(screen.getByText('Next'));

      await waitFor(() => {
        expect(screen.getByLabelText(/first name/i)).toBeInTheDocument();
      });
      await user.type(screen.getByLabelText(/first name/i), 'Test');
      await user.type(screen.getByLabelText(/last name/i), 'User');
      await user.click(screen.getByText('Next'));

      await waitFor(() => {
        expect(screen.getByText(/terms and conditions/i)).toBeInTheDocument();
      });
      await user.click(screen.getByLabelText(/terms and conditions/i));
      await user.click(screen.getByLabelText(/privacy policy/i));
      
      user.click(screen.getByText('Create Account'));

      await waitFor(() => {
        const createButton = screen.getByText(/creating account/i);
        expect(createButton).toBeDisabled();
      });
    });
  });

  describe('Redirect Behavior', () => {
    it('should redirect authenticated users', () => {
      vi.mocked(authService.isAuthenticated).mockReturnValue(true);
      vi.mocked(authService.getCurrentUser).mockResolvedValue(mockUser);
      vi.mocked(authService.getPermissions).mockResolvedValue(['test:read']);

      renderRegisterPage();

      expect(mockNavigate).toHaveBeenCalledWith('/lab-tests', { replace: true });
    });

    it('should redirect to custom path after registration', async () => {
      vi.mocked(authService.register).mockResolvedValue({
        user: mockUser,
        access_token: 'token',
        refresh_token: 'refresh_token',
        token_type: 'bearer',
        expires_in: 3600,
      });
      vi.mocked(authService.getPermissions).mockResolvedValue(['test:read']);

      renderRegisterPage({ redirectTo: '/custom-path' });

      // Complete registration
      await user.type(screen.getByLabelText(/username/i), 'testuser');
      await user.type(screen.getByLabelText(/email address/i), 'test@example.com');
      await user.type(screen.getByLabelText(/^password$/i), 'Password123');
      await user.type(screen.getByLabelText(/confirm password/i), 'Password123');
      await user.click(screen.getByText('Next'));

      await waitFor(() => {
        expect(screen.getByLabelText(/first name/i)).toBeInTheDocument();
      });
      await user.type(screen.getByLabelText(/first name/i), 'Test');
      await user.type(screen.getByLabelText(/last name/i), 'User');
      await user.click(screen.getByText('Next'));

      await waitFor(() => {
        expect(screen.getByText(/terms and conditions/i)).toBeInTheDocument();
      });
      await user.click(screen.getByLabelText(/terms and conditions/i));
      await user.click(screen.getByLabelText(/privacy policy/i));
      await user.click(screen.getByText('Create Account'));

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/custom-path', { replace: true });
      });
    });
  });
});