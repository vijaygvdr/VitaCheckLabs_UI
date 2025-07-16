import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeProvider } from '@mui/material/styles';
import { describe, it, expect, vi } from 'vitest';
import UserProfile from './UserProfile';
import theme from '../styles/theme';

// Mock useMediaQuery to test responsive behavior
vi.mock('@mui/material/useMediaQuery', () => ({
  __esModule: true,
  default: vi.fn()
}));

import useMediaQuery from '@mui/material/useMediaQuery';

const UserProfileWrapper = ({ children }: { children: React.ReactNode }) => (
  <ThemeProvider theme={theme}>
    {children}
  </ThemeProvider>
);

describe('UserProfile', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Unauthenticated state', () => {
    it('renders login and register buttons on desktop', () => {
      (useMediaQuery as any).mockReturnValue(false); // Desktop view
      
      render(
        <UserProfileWrapper>
          <UserProfile isAuthenticated={false} />
        </UserProfileWrapper>
      );
      
      expect(screen.getByText('Login')).toBeInTheDocument();
      expect(screen.getByText('Register')).toBeInTheDocument();
    });

    it('renders login and register icons on mobile', () => {
      (useMediaQuery as any).mockReturnValue(true); // Mobile view
      
      render(
        <UserProfileWrapper>
          <UserProfile isAuthenticated={false} />
        </UserProfileWrapper>
      );
      
      expect(screen.getByTestId('LoginIcon')).toBeInTheDocument();
      expect(screen.getByTestId('PersonAddIcon')).toBeInTheDocument();
      expect(screen.queryByText('Login')).not.toBeInTheDocument();
      expect(screen.queryByText('Register')).not.toBeInTheDocument();
    });

    it('calls onLogin when login button is clicked', () => {
      const mockOnLogin = vi.fn();
      (useMediaQuery as any).mockReturnValue(false); // Desktop view
      
      render(
        <UserProfileWrapper>
          <UserProfile isAuthenticated={false} onLogin={mockOnLogin} />
        </UserProfileWrapper>
      );
      
      const loginButton = screen.getByText('Login');
      fireEvent.click(loginButton);
      
      expect(mockOnLogin).toHaveBeenCalledTimes(1);
    });

    it('calls onRegister when register button is clicked', () => {
      const mockOnRegister = vi.fn();
      (useMediaQuery as any).mockReturnValue(false); // Desktop view
      
      render(
        <UserProfileWrapper>
          <UserProfile isAuthenticated={false} onRegister={mockOnRegister} />
        </UserProfileWrapper>
      );
      
      const registerButton = screen.getByText('Register');
      fireEvent.click(registerButton);
      
      expect(mockOnRegister).toHaveBeenCalledTimes(1);
    });
  });

  describe('Authenticated state', () => {
    const mockUser = {
      name: 'John Doe',
      email: 'john.doe@example.com',
      avatar: 'https://example.com/avatar.jpg'
    };

    it('renders user avatar button when authenticated', () => {
      (useMediaQuery as any).mockReturnValue(false); // Desktop view
      
      render(
        <UserProfileWrapper>
          <UserProfile isAuthenticated={true} user={mockUser} />
        </UserProfileWrapper>
      );
      
      const avatarButton = screen.getByRole('button');
      expect(avatarButton).toBeInTheDocument();
      expect(screen.queryByText('Login')).not.toBeInTheDocument();
      expect(screen.queryByText('Register')).not.toBeInTheDocument();
    });

    it('shows user initials when no avatar provided', () => {
      (useMediaQuery as any).mockReturnValue(false); // Desktop view
      
      render(
        <UserProfileWrapper>
          <UserProfile 
            isAuthenticated={true} 
            user={{ name: 'John Doe', email: 'john.doe@example.com' }} 
          />
        </UserProfileWrapper>
      );
      
      expect(screen.getByText('JD')).toBeInTheDocument();
    });

    it('opens user menu when avatar is clicked', () => {
      (useMediaQuery as any).mockReturnValue(false); // Desktop view
      
      render(
        <UserProfileWrapper>
          <UserProfile isAuthenticated={true} user={mockUser} />
        </UserProfileWrapper>
      );
      
      const avatarButton = screen.getByRole('button');
      fireEvent.click(avatarButton);
      
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('john.doe@example.com')).toBeInTheDocument();
      expect(screen.getByText('Settings')).toBeInTheDocument();
      expect(screen.getByText('Profile')).toBeInTheDocument();
      expect(screen.getByText('Logout')).toBeInTheDocument();
    });

    it('calls onLogout when logout menu item is clicked', () => {
      const mockOnLogout = vi.fn();
      (useMediaQuery as any).mockReturnValue(false); // Desktop view
      
      render(
        <UserProfileWrapper>
          <UserProfile 
            isAuthenticated={true} 
            user={mockUser} 
            onLogout={mockOnLogout}
          />
        </UserProfileWrapper>
      );
      
      const avatarButton = screen.getByRole('button');
      fireEvent.click(avatarButton);
      
      const logoutItem = screen.getByText('Logout');
      fireEvent.click(logoutItem);
      
      expect(mockOnLogout).toHaveBeenCalledTimes(1);
    });

    it('calls onSettings when settings menu item is clicked', () => {
      const mockOnSettings = vi.fn();
      (useMediaQuery as any).mockReturnValue(false); // Desktop view
      
      render(
        <UserProfileWrapper>
          <UserProfile 
            isAuthenticated={true} 
            user={mockUser} 
            onSettings={mockOnSettings}
          />
        </UserProfileWrapper>
      );
      
      const avatarButton = screen.getByRole('button');
      fireEvent.click(avatarButton);
      
      const settingsItem = screen.getByText('Settings');
      fireEvent.click(settingsItem);
      
      expect(mockOnSettings).toHaveBeenCalledTimes(1);
    });

    it('closes menu when menu item is clicked', () => {
      (useMediaQuery as any).mockReturnValue(false); // Desktop view
      
      render(
        <UserProfileWrapper>
          <UserProfile isAuthenticated={true} user={mockUser} />
        </UserProfileWrapper>
      );
      
      const avatarButton = screen.getByRole('button');
      fireEvent.click(avatarButton);
      
      const profileItem = screen.getByText('Profile');
      fireEvent.click(profileItem);
      
      // Menu should close
      expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    });

    it('generates correct initials for single name', () => {
      (useMediaQuery as any).mockReturnValue(false); // Desktop view
      
      render(
        <UserProfileWrapper>
          <UserProfile 
            isAuthenticated={true} 
            user={{ name: 'John', email: 'john@example.com' }} 
          />
        </UserProfileWrapper>
      );
      
      expect(screen.getByText('JO')).toBeInTheDocument();
    });

    it('generates correct initials for multiple names', () => {
      (useMediaQuery as any).mockReturnValue(false); // Desktop view
      
      render(
        <UserProfileWrapper>
          <UserProfile 
            isAuthenticated={true} 
            user={{ name: 'John Michael Doe', email: 'john@example.com' }} 
          />
        </UserProfileWrapper>
      );
      
      expect(screen.getByText('JM')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA attributes for authenticated user', () => {
      (useMediaQuery as any).mockReturnValue(false); // Desktop view
      
      render(
        <UserProfileWrapper>
          <UserProfile isAuthenticated={true} user={{ name: 'John Doe', email: 'john@example.com' }} />
        </UserProfileWrapper>
      );
      
      const avatarButton = screen.getByRole('button');
      expect(avatarButton).toHaveAttribute('aria-expanded', 'false');
      
      fireEvent.click(avatarButton);
      expect(avatarButton).toHaveAttribute('aria-expanded', 'true');
    });

    it('has proper button roles for unauthenticated state', () => {
      (useMediaQuery as any).mockReturnValue(false); // Desktop view
      
      render(
        <UserProfileWrapper>
          <UserProfile isAuthenticated={false} />
        </UserProfileWrapper>
      );
      
      const loginButton = screen.getByRole('button', { name: /login/i });
      const registerButton = screen.getByRole('button', { name: /register/i });
      
      expect(loginButton).toBeInTheDocument();
      expect(registerButton).toBeInTheDocument();
    });
  });
});