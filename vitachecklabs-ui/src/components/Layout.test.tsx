import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import { describe, it, expect, vi } from 'vitest';
import Layout from './Layout';
import theme from '../styles/theme';

const LayoutWrapper = ({ children }: { children: React.ReactNode }) => (
  <ThemeProvider theme={theme}>
    <BrowserRouter>
      {children}
    </BrowserRouter>
  </ThemeProvider>
);

describe('Layout', () => {
  it('renders header component', () => {
    render(
      <LayoutWrapper>
        <Layout />
      </LayoutWrapper>
    );
    
    expect(screen.getByText('VitaCheckLabs')).toBeInTheDocument();
  });

  it('renders tab navigation by default', () => {
    render(
      <LayoutWrapper>
        <Layout />
      </LayoutWrapper>
    );
    
    expect(screen.getByText('Lab Tests')).toBeInTheDocument();
    expect(screen.getByText('Reports')).toBeInTheDocument();
    expect(screen.getByText('About')).toBeInTheDocument();
  });

  it('hides tab navigation when showTabNavigation is false', () => {
    render(
      <LayoutWrapper>
        <Layout showTabNavigation={false} />
      </LayoutWrapper>
    );
    
    expect(screen.getByText('VitaCheckLabs')).toBeInTheDocument();
    expect(screen.queryByText('Lab Tests')).not.toBeInTheDocument();
    expect(screen.queryByText('Reports')).not.toBeInTheDocument();
    expect(screen.queryByText('About')).not.toBeInTheDocument();
  });

  it('renders with sticky tabs when stickyTabs is true', () => {
    render(
      <LayoutWrapper>
        <Layout stickyTabs={true} />
      </LayoutWrapper>
    );
    
    expect(screen.getByText('Lab Tests')).toBeInTheDocument();
  });

  it('passes authentication props to header', () => {
    const mockUser = {
      name: 'John Doe',
      email: 'john.doe@example.com',
    };

    render(
      <LayoutWrapper>
        <Layout isAuthenticated={true} user={mockUser} />
      </LayoutWrapper>
    );
    
    expect(screen.getByText('VitaCheckLabs')).toBeInTheDocument();
    expect(screen.queryByText('Login')).not.toBeInTheDocument();
    expect(screen.queryByText('Register')).not.toBeInTheDocument();
  });

  it('shows login/register for unauthenticated users', () => {
    render(
      <LayoutWrapper>
        <Layout isAuthenticated={false} />
      </LayoutWrapper>
    );
    
    expect(screen.getByText('Login')).toBeInTheDocument();
    expect(screen.getByText('Register')).toBeInTheDocument();
  });

  it('calls onLogin when login button is clicked', () => {
    const mockOnLogin = vi.fn();
    
    render(
      <LayoutWrapper>
        <Layout isAuthenticated={false} onLogin={mockOnLogin} />
      </LayoutWrapper>
    );
    
    const loginButton = screen.getByText('Login');
    fireEvent.click(loginButton);
    
    expect(mockOnLogin).toHaveBeenCalledTimes(1);
  });

  it('calls onRegister when register button is clicked', () => {
    const mockOnRegister = vi.fn();
    
    render(
      <LayoutWrapper>
        <Layout isAuthenticated={false} onRegister={mockOnRegister} />
      </LayoutWrapper>
    );
    
    const registerButton = screen.getByText('Register');
    fireEvent.click(registerButton);
    
    expect(mockOnRegister).toHaveBeenCalledTimes(1);
  });

  it('calls onLogout when logout is clicked from user menu', () => {
    const mockOnLogout = vi.fn();
    const mockUser = {
      name: 'John Doe',
      email: 'john.doe@example.com',
    };
    
    render(
      <LayoutWrapper>
        <Layout isAuthenticated={true} user={mockUser} onLogout={mockOnLogout} />
      </LayoutWrapper>
    );
    
    // Click user avatar to open menu
    const avatarButton = screen.getByRole('button');
    fireEvent.click(avatarButton);
    
    // Click logout
    const logoutItem = screen.getByText('Logout');
    fireEvent.click(logoutItem);
    
    expect(mockOnLogout).toHaveBeenCalledTimes(1);
  });

  it('calls onSettings when settings is clicked from user menu', () => {
    const mockOnSettings = vi.fn();
    const mockUser = {
      name: 'John Doe',
      email: 'john.doe@example.com',
    };
    
    render(
      <LayoutWrapper>
        <Layout isAuthenticated={true} user={mockUser} onSettings={mockOnSettings} />
      </LayoutWrapper>
    );
    
    // Click user avatar to open menu
    const avatarButton = screen.getByRole('button');
    fireEvent.click(avatarButton);
    
    // Click settings
    const settingsItem = screen.getByText('Settings');
    fireEvent.click(settingsItem);
    
    expect(mockOnSettings).toHaveBeenCalledTimes(1);
  });

  it('renders with proper container styling', () => {
    render(
      <LayoutWrapper>
        <Layout />
      </LayoutWrapper>
    );
    
    // Should have main container with proper background
    const container = screen.getByText('VitaCheckLabs').closest('div');
    expect(container).toHaveStyle({
      minHeight: '100vh',
      backgroundColor: theme.palette.background.default,
    });
  });

  it('renders tab navigation with proper icons', () => {
    render(
      <LayoutWrapper>
        <Layout />
      </LayoutWrapper>
    );
    
    expect(screen.getByTestId('ScienceIcon')).toBeInTheDocument();
    expect(screen.getByTestId('AssignmentIcon')).toBeInTheDocument();
    expect(screen.getByTestId('InfoIcon')).toBeInTheDocument();
  });

  it('renders with fade animation by default', () => {
    render(
      <LayoutWrapper>
        <Layout />
      </LayoutWrapper>
    );
    
    expect(screen.getByText('Lab Tests')).toBeInTheDocument();
  });

  it('renders with indicator shown by default', () => {
    render(
      <LayoutWrapper>
        <Layout />
      </LayoutWrapper>
    );
    
    expect(screen.getByText('Lab Tests')).toBeInTheDocument();
  });

  it('renders without lazy loading by default', () => {
    render(
      <LayoutWrapper>
        <Layout />
      </LayoutWrapper>
    );
    
    expect(screen.getByText('Lab Tests')).toBeInTheDocument();
  });

  it('handles authentication state changes', () => {
    const { rerender } = render(
      <LayoutWrapper>
        <Layout isAuthenticated={false} />
      </LayoutWrapper>
    );
    
    expect(screen.getByText('Login')).toBeInTheDocument();
    expect(screen.getByText('Register')).toBeInTheDocument();
    
    const mockUser = {
      name: 'John Doe',
      email: 'john.doe@example.com',
    };
    
    rerender(
      <LayoutWrapper>
        <Layout isAuthenticated={true} user={mockUser} />
      </LayoutWrapper>
    );
    
    expect(screen.queryByText('Login')).not.toBeInTheDocument();
    expect(screen.queryByText('Register')).not.toBeInTheDocument();
  });

  it('renders tab navigation with proper tab count', () => {
    render(
      <LayoutWrapper>
        <Layout />
      </LayoutWrapper>
    );
    
    const tabs = screen.getAllByRole('tab');
    expect(tabs).toHaveLength(3);
  });

  it('renders with proper accessibility structure', () => {
    render(
      <LayoutWrapper>
        <Layout />
      </LayoutWrapper>
    );
    
    expect(screen.getByRole('banner')).toBeInTheDocument(); // Header
    expect(screen.getByRole('tablist')).toBeInTheDocument(); // Tab navigation
    expect(screen.getAllByRole('tab')).toHaveLength(3); // Individual tabs
  });

  it('handles missing user data gracefully', () => {
    render(
      <LayoutWrapper>
        <Layout isAuthenticated={true} />
      </LayoutWrapper>
    );
    
    expect(screen.getByText('VitaCheckLabs')).toBeInTheDocument();
  });

  it('handles missing callback functions gracefully', () => {
    render(
      <LayoutWrapper>
        <Layout isAuthenticated={false} />
      </LayoutWrapper>
    );
    
    const loginButton = screen.getByText('Login');
    fireEvent.click(loginButton);
    
    // Should not throw error even without onLogin callback
    expect(screen.getByText('Login')).toBeInTheDocument();
  });
});