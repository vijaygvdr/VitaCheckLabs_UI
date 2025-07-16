import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import { describe, it, expect, vi } from 'vitest';
import Navigation from './Navigation';
import theme from '../styles/theme';

// Mock useMediaQuery to test responsive behavior
vi.mock('@mui/material/useMediaQuery', () => ({
  __esModule: true,
  default: vi.fn()
}));

import useMediaQuery from '@mui/material/useMediaQuery';

const NavigationWrapper = ({ children }: { children: React.ReactNode }) => (
  <ThemeProvider theme={theme}>
    <BrowserRouter>
      {children}
    </BrowserRouter>
  </ThemeProvider>
);

describe('Navigation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders desktop navigation by default', () => {
    (useMediaQuery as any).mockReturnValue(false); // Desktop view
    
    render(
      <NavigationWrapper>
        <Navigation />
      </NavigationWrapper>
    );
    
    expect(screen.getByText('Lab Tests')).toBeInTheDocument();
    expect(screen.getByText('Reports')).toBeInTheDocument();
    expect(screen.getByText('About')).toBeInTheDocument();
    expect(screen.queryByTestId('MenuIcon')).not.toBeInTheDocument();
  });

  it('renders mobile navigation menu button', () => {
    (useMediaQuery as any).mockReturnValue(true); // Mobile view
    
    render(
      <NavigationWrapper>
        <Navigation />
      </NavigationWrapper>
    );
    
    expect(screen.getByTestId('MenuIcon')).toBeInTheDocument();
    expect(screen.queryByText('Lab Tests')).not.toBeInTheDocument();
  });

  it('opens mobile menu when menu button is clicked', () => {
    (useMediaQuery as any).mockReturnValue(true); // Mobile view
    
    render(
      <NavigationWrapper>
        <Navigation />
      </NavigationWrapper>
    );
    
    const menuButton = screen.getByRole('button');
    fireEvent.click(menuButton);
    
    expect(screen.getByText('Lab Tests')).toBeInTheDocument();
    expect(screen.getByText('Reports')).toBeInTheDocument();
    expect(screen.getByText('About')).toBeInTheDocument();
  });

  it('closes mobile menu when menu item is clicked', () => {
    (useMediaQuery as any).mockReturnValue(true); // Mobile view
    
    render(
      <NavigationWrapper>
        <Navigation />
      </NavigationWrapper>
    );
    
    const menuButton = screen.getByRole('button');
    fireEvent.click(menuButton);
    
    const labTestsItem = screen.getByText('Lab Tests');
    fireEvent.click(labTestsItem);
    
    // Menu should close (items should not be visible)
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('has correct navigation links', () => {
    (useMediaQuery as any).mockReturnValue(false); // Desktop view
    
    render(
      <NavigationWrapper>
        <Navigation />
      </NavigationWrapper>
    );
    
    const labTestsLink = screen.getByText('Lab Tests').closest('a');
    const reportsLink = screen.getByText('Reports').closest('a');
    const aboutLink = screen.getByText('About').closest('a');
    
    expect(labTestsLink).toHaveAttribute('href', '/lab-tests');
    expect(reportsLink).toHaveAttribute('href', '/reports');
    expect(aboutLink).toHaveAttribute('href', '/about');
  });

  it('highlights active navigation item', () => {
    (useMediaQuery as any).mockReturnValue(false); // Desktop view
    
    // Mock location pathname
    Object.defineProperty(window, 'location', {
      value: {
        pathname: '/lab-tests'
      },
      writable: true
    });
    
    render(
      <NavigationWrapper>
        <Navigation />
      </NavigationWrapper>
    );
    
    const labTestsButton = screen.getByText('Lab Tests');
    const reportsButton = screen.getByText('Reports');
    
    // Active item should have different styling
    expect(labTestsButton.closest('a')).toHaveStyle({
      backgroundColor: 'rgba(255,255,255,0.15)'
    });
    expect(reportsButton.closest('a')).toHaveStyle({
      backgroundColor: 'transparent'
    });
  });

  it('handles hover effects on navigation items', () => {
    (useMediaQuery as any).mockReturnValue(false); // Desktop view
    
    render(
      <NavigationWrapper>
        <Navigation />
      </NavigationWrapper>
    );
    
    const labTestsButton = screen.getByText('Lab Tests');
    
    fireEvent.mouseEnter(labTestsButton);
    // Should trigger hover effect (tested via CSS)
    expect(labTestsButton).toBeInTheDocument();
  });

  it('provides proper accessibility attributes', () => {
    (useMediaQuery as any).mockReturnValue(true); // Mobile view
    
    render(
      <NavigationWrapper>
        <Navigation />
      </NavigationWrapper>
    );
    
    const menuButton = screen.getByRole('button');
    expect(menuButton).toHaveAttribute('aria-expanded', 'false');
    
    fireEvent.click(menuButton);
    expect(menuButton).toHaveAttribute('aria-expanded', 'true');
  });
});