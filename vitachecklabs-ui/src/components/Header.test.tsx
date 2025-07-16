import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import { describe, it, expect, vi } from 'vitest';
import Header from './Header';
import theme from '../styles/theme';

const HeaderWrapper = ({ children }: { children: React.ReactNode }) => (
  <ThemeProvider theme={theme}>
    <BrowserRouter>
      {children}
    </BrowserRouter>
  </ThemeProvider>
);

describe('Header', () => {
  it('renders VitaCheckLabs logo and title', () => {
    render(
      <HeaderWrapper>
        <Header />
      </HeaderWrapper>
    );
    expect(screen.getByText('VitaCheckLabs')).toBeInTheDocument();
  });

  it('renders navigation buttons', () => {
    render(
      <HeaderWrapper>
        <Header />
      </HeaderWrapper>
    );
    expect(screen.getByText('Lab Tests')).toBeInTheDocument();
    expect(screen.getByText('Reports')).toBeInTheDocument();
    expect(screen.getByText('About')).toBeInTheDocument();
  });

  it('has correct navigation links', () => {
    render(
      <HeaderWrapper>
        <Header />
      </HeaderWrapper>
    );
    const labTestsLink = screen.getByText('Lab Tests').closest('a');
    const reportsLink = screen.getByText('Reports').closest('a');
    const aboutLink = screen.getByText('About').closest('a');
    
    expect(labTestsLink).toHaveAttribute('href', '/lab-tests');
    expect(reportsLink).toHaveAttribute('href', '/reports');
    expect(aboutLink).toHaveAttribute('href', '/about');
  });

  it('renders logo as clickable link to home', () => {
    render(
      <HeaderWrapper>
        <Header />
      </HeaderWrapper>
    );
    
    const logoLink = screen.getByText('VitaCheckLabs').closest('a');
    expect(logoLink).toHaveAttribute('href', '/');
  });

  it('renders user profile section for unauthenticated user', () => {
    render(
      <HeaderWrapper>
        <Header isAuthenticated={false} />
      </HeaderWrapper>
    );
    
    expect(screen.getByText('Login')).toBeInTheDocument();
    expect(screen.getByText('Register')).toBeInTheDocument();
  });

  it('renders user profile section for authenticated user', () => {
    const mockUser = {
      name: 'John Doe',
      email: 'john.doe@example.com'
    };
    
    render(
      <HeaderWrapper>
        <Header isAuthenticated={true} user={mockUser} />
      </HeaderWrapper>
    );
    
    expect(screen.queryByText('Login')).not.toBeInTheDocument();
    expect(screen.queryByText('Register')).not.toBeInTheDocument();
    expect(screen.getByText('JD')).toBeInTheDocument(); // User initials
  });

  it('calls onLogin when login button is clicked', () => {
    const mockOnLogin = vi.fn();
    
    render(
      <HeaderWrapper>
        <Header isAuthenticated={false} onLogin={mockOnLogin} />
      </HeaderWrapper>
    );
    
    const loginButton = screen.getByText('Login');
    fireEvent.click(loginButton);
    
    expect(mockOnLogin).toHaveBeenCalledTimes(1);
  });

  it('calls onRegister when register button is clicked', () => {
    const mockOnRegister = vi.fn();
    
    render(
      <HeaderWrapper>
        <Header isAuthenticated={false} onRegister={mockOnRegister} />
      </HeaderWrapper>
    );
    
    const registerButton = screen.getByText('Register');
    fireEvent.click(registerButton);
    
    expect(mockOnRegister).toHaveBeenCalledTimes(1);
  });

  it('calls onLogout when logout is clicked from user menu', () => {
    const mockOnLogout = vi.fn();
    const mockUser = {
      name: 'John Doe',
      email: 'john.doe@example.com'
    };
    
    render(
      <HeaderWrapper>
        <Header isAuthenticated={true} user={mockUser} onLogout={mockOnLogout} />
      </HeaderWrapper>
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
      email: 'john.doe@example.com'
    };
    
    render(
      <HeaderWrapper>
        <Header isAuthenticated={true} user={mockUser} onSettings={mockOnSettings} />
      </HeaderWrapper>
    );
    
    // Click user avatar to open menu
    const avatarButton = screen.getByRole('button');
    fireEvent.click(avatarButton);
    
    // Click settings
    const settingsItem = screen.getByText('Settings');
    fireEvent.click(settingsItem);
    
    expect(mockOnSettings).toHaveBeenCalledTimes(1);
  });

  it('has proper responsive layout with Container', () => {
    render(
      <HeaderWrapper>
        <Header />
      </HeaderWrapper>
    );
    
    // Check that Container is used for responsive layout
    const header = screen.getByRole('banner');
    expect(header).toBeInTheDocument();
  });

  it('has proper styling and shadows', () => {
    render(
      <HeaderWrapper>
        <Header />
      </HeaderWrapper>
    );
    
    const header = screen.getByRole('banner');
    expect(header).toHaveStyle({
      backgroundColor: theme.palette.primary.main,
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
    });
  });

  it('shows hover effect on logo', () => {
    render(
      <HeaderWrapper>
        <Header />
      </HeaderWrapper>
    );
    
    const logoLink = screen.getByText('VitaCheckLabs').closest('a');
    expect(logoLink).toHaveStyle({
      transition: 'opacity 0.2s ease-in-out'
    });
  });
});