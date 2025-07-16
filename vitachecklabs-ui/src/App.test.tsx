import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import { describe, it, expect } from 'vitest';
import App from './App';
import theme from './styles/theme';

const AppWrapper = ({ children }: { children: React.ReactNode }) => (
  <ThemeProvider theme={theme}>
    <CssBaseline />
    <BrowserRouter>
      {children}
    </BrowserRouter>
  </ThemeProvider>
);

describe('App', () => {
  it('renders without crashing', () => {
    render(
      <AppWrapper>
        <App />
      </AppWrapper>
    );
    expect(screen.getByText('VitaCheckLabs')).toBeInTheDocument();
  });

  it('renders header navigation', () => {
    render(
      <AppWrapper>
        <App />
      </AppWrapper>
    );
    expect(screen.getByText('Lab Tests')).toBeInTheDocument();
    expect(screen.getByText('Reports')).toBeInTheDocument();
    expect(screen.getByText('About')).toBeInTheDocument();
  });

  it('displays lab tests page by default', () => {
    render(
      <AppWrapper>
        <App />
      </AppWrapper>
    );
    expect(screen.getByText('Browse and book our comprehensive range of laboratory tests')).toBeInTheDocument();
  });

  it('renders with authentication state management', () => {
    render(
      <AppWrapper>
        <App />
      </AppWrapper>
    );
    
    // Should show login/register buttons initially
    expect(screen.getByText('Login')).toBeInTheDocument();
    expect(screen.getByText('Register')).toBeInTheDocument();
  });

  it('handles login functionality', () => {
    render(
      <AppWrapper>
        <App />
      </AppWrapper>
    );
    
    const loginButton = screen.getByText('Login');
    fireEvent.click(loginButton);
    
    // After login, should show user profile
    expect(screen.queryByText('Login')).not.toBeInTheDocument();
    expect(screen.queryByText('Register')).not.toBeInTheDocument();
    expect(screen.getByText('JD')).toBeInTheDocument(); // User initials
  });

  it('handles logout functionality', () => {
    render(
      <AppWrapper>
        <App />
      </AppWrapper>
    );
    
    // First login
    const loginButton = screen.getByText('Login');
    fireEvent.click(loginButton);
    
    // Then logout
    const avatarButton = screen.getByRole('button');
    fireEvent.click(avatarButton);
    
    const logoutItem = screen.getByText('Logout');
    fireEvent.click(logoutItem);
    
    // Should show login/register buttons again
    expect(screen.getByText('Login')).toBeInTheDocument();
    expect(screen.getByText('Register')).toBeInTheDocument();
  });

  it('handles register button click', () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    
    render(
      <AppWrapper>
        <App />
      </AppWrapper>
    );
    
    const registerButton = screen.getByText('Register');
    fireEvent.click(registerButton);
    
    expect(consoleSpy).toHaveBeenCalledWith('Register clicked');
    consoleSpy.mockRestore();
  });

  it('handles settings button click', () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    
    render(
      <AppWrapper>
        <App />
      </AppWrapper>
    );
    
    // First login
    const loginButton = screen.getByText('Login');
    fireEvent.click(loginButton);
    
    // Then access settings
    const avatarButton = screen.getByRole('button');
    fireEvent.click(avatarButton);
    
    const settingsItem = screen.getByText('Settings');
    fireEvent.click(settingsItem);
    
    expect(consoleSpy).toHaveBeenCalledWith('Settings clicked');
    consoleSpy.mockRestore();
  });

  it('renders with Layout component', () => {
    render(
      <AppWrapper>
        <App />
      </AppWrapper>
    );
    
    // Should have proper layout structure
    expect(screen.getByText('VitaCheckLabs')).toBeInTheDocument();
    expect(screen.getByRole('tablist')).toBeInTheDocument();
    expect(screen.getAllByRole('tab')).toHaveLength(3);
  });

  it('renders with nested routing structure', () => {
    render(
      <AppWrapper>
        <App />
      </AppWrapper>
    );
    
    // Should render the default tab content
    expect(screen.getByText('Browse and book our comprehensive range of laboratory tests')).toBeInTheDocument();
  });

  it('handles tab navigation', () => {
    render(
      <AppWrapper>
        <App />
      </AppWrapper>
    );
    
    // Click on Reports tab
    const reportsTab = screen.getByText('Reports');
    fireEvent.click(reportsTab);
    
    // Should show reports content
    expect(screen.getByText('View and manage your lab test reports')).toBeInTheDocument();
  });

  it('renders with proper theme integration', () => {
    render(
      <AppWrapper>
        <App />
      </AppWrapper>
    );
    
    const header = screen.getByRole('banner');
    expect(header).toHaveStyle({
      backgroundColor: theme.palette.primary.main,
    });
  });

  it('renders with proper initial state', () => {
    render(
      <AppWrapper>
        <App />
      </AppWrapper>
    );
    
    // Should start with unauthenticated state
    expect(screen.getByText('Login')).toBeInTheDocument();
    expect(screen.getByText('Register')).toBeInTheDocument();
    
    // Should show tab navigation
    expect(screen.getByText('Lab Tests')).toBeInTheDocument();
    expect(screen.getByText('Reports')).toBeInTheDocument();
    expect(screen.getByText('About')).toBeInTheDocument();
  });

  it('handles fallback route correctly', () => {
    // This test would require more complex routing setup to test properly
    // For now, we'll just verify the component renders
    render(
      <AppWrapper>
        <App />
      </AppWrapper>
    );
    
    expect(screen.getByText('VitaCheckLabs')).toBeInTheDocument();
  });

  it('maintains authentication state between renders', () => {
    const { rerender } = render(
      <AppWrapper>
        <App />
      </AppWrapper>
    );
    
    // Login
    const loginButton = screen.getByText('Login');
    fireEvent.click(loginButton);
    
    // Rerender
    rerender(
      <AppWrapper>
        <App />
      </AppWrapper>
    );
    
    // Should still be authenticated
    expect(screen.queryByText('Login')).not.toBeInTheDocument();
    expect(screen.getByText('JD')).toBeInTheDocument();
  });
});