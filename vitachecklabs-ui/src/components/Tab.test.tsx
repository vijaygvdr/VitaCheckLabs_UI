import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import { describe, it, expect, vi } from 'vitest';
import Tab from './Tab';
import theme from '../styles/theme';
import { Science } from '@mui/icons-material';

const TabWrapper = ({ children }: { children: React.ReactNode }) => (
  <ThemeProvider theme={theme}>
    <BrowserRouter>
      {children}
    </BrowserRouter>
  </ThemeProvider>
);

describe('Tab', () => {
  it('renders tab with label', () => {
    render(
      <TabWrapper>
        <Tab label="Lab Tests" to="/lab-tests" />
      </TabWrapper>
    );
    
    expect(screen.getByText('Lab Tests')).toBeInTheDocument();
  });

  it('renders tab with icon', () => {
    render(
      <TabWrapper>
        <Tab label="Lab Tests" to="/lab-tests" icon={<Science />} />
      </TabWrapper>
    );
    
    expect(screen.getByText('Lab Tests')).toBeInTheDocument();
    expect(screen.getByTestId('ScienceIcon')).toBeInTheDocument();
  });

  it('renders tab with badge', () => {
    render(
      <TabWrapper>
        <Tab label="Reports" to="/reports" badge={5} />
      </TabWrapper>
    );
    
    expect(screen.getByText('Reports')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('renders tab with string badge', () => {
    render(
      <TabWrapper>
        <Tab label="Reports" to="/reports" badge="new" />
      </TabWrapper>
    );
    
    expect(screen.getByText('new')).toBeInTheDocument();
  });

  it('has correct link to route', () => {
    render(
      <TabWrapper>
        <Tab label="Lab Tests" to="/lab-tests" />
      </TabWrapper>
    );
    
    const link = screen.getByRole('tab');
    expect(link).toHaveAttribute('href', '/lab-tests');
  });

  it('shows active state correctly', () => {
    render(
      <TabWrapper>
        <Tab label="Lab Tests" to="/lab-tests" isActive={true} />
      </TabWrapper>
    );
    
    const tab = screen.getByRole('tab');
    expect(tab).toHaveAttribute('aria-selected', 'true');
    expect(tab).toHaveAttribute('aria-current', 'page');
  });

  it('shows inactive state correctly', () => {
    render(
      <TabWrapper>
        <Tab label="Lab Tests" to="/lab-tests" isActive={false} />
      </TabWrapper>
    );
    
    const tab = screen.getByRole('tab');
    expect(tab).toHaveAttribute('aria-selected', 'false');
    expect(tab).not.toHaveAttribute('aria-current');
  });

  it('calls onClick when clicked', () => {
    const mockOnClick = vi.fn();
    
    render(
      <TabWrapper>
        <Tab label="Lab Tests" to="/lab-tests" onClick={mockOnClick} />
      </TabWrapper>
    );
    
    const tab = screen.getByRole('tab');
    fireEvent.click(tab);
    
    expect(mockOnClick).toHaveBeenCalledTimes(1);
  });

  it('handles keyboard navigation with Enter key', () => {
    const mockOnClick = vi.fn();
    
    render(
      <TabWrapper>
        <Tab label="Lab Tests" to="/lab-tests" onClick={mockOnClick} />
      </TabWrapper>
    );
    
    const tab = screen.getByRole('tab');
    fireEvent.keyDown(tab, { key: 'Enter' });
    
    expect(mockOnClick).toHaveBeenCalledTimes(1);
  });

  it('handles keyboard navigation with Space key', () => {
    const mockOnClick = vi.fn();
    
    render(
      <TabWrapper>
        <Tab label="Lab Tests" to="/lab-tests" onClick={mockOnClick} />
      </TabWrapper>
    );
    
    const tab = screen.getByRole('tab');
    fireEvent.keyDown(tab, { key: ' ' });
    
    expect(mockOnClick).toHaveBeenCalledTimes(1);
  });

  it('renders disabled state correctly', () => {
    render(
      <TabWrapper>
        <Tab label="Lab Tests" to="/lab-tests" disabled={true} />
      </TabWrapper>
    );
    
    const tab = screen.getByRole('tab');
    expect(tab).toBeDisabled();
    expect(tab).toHaveAttribute('tabindex', '-1');
  });

  it('prevents navigation when disabled', () => {
    const mockOnClick = vi.fn();
    
    render(
      <TabWrapper>
        <Tab label="Lab Tests" to="/lab-tests" disabled={true} onClick={mockOnClick} />
      </TabWrapper>
    );
    
    const tab = screen.getByRole('tab');
    fireEvent.click(tab);
    
    expect(mockOnClick).not.toHaveBeenCalled();
  });

  it('prevents keyboard navigation when disabled', () => {
    const mockOnClick = vi.fn();
    
    render(
      <TabWrapper>
        <Tab label="Lab Tests" to="/lab-tests" disabled={true} onClick={mockOnClick} />
      </TabWrapper>
    );
    
    const tab = screen.getByRole('tab');
    fireEvent.keyDown(tab, { key: 'Enter' });
    
    expect(mockOnClick).not.toHaveBeenCalled();
  });

  it('renders different sizes correctly', () => {
    const { rerender } = render(
      <TabWrapper>
        <Tab label="Lab Tests" to="/lab-tests" size="small" />
      </TabWrapper>
    );
    
    expect(screen.getByText('Lab Tests')).toBeInTheDocument();
    
    rerender(
      <TabWrapper>
        <Tab label="Lab Tests" to="/lab-tests" size="large" />
      </TabWrapper>
    );
    
    expect(screen.getByText('Lab Tests')).toBeInTheDocument();
  });

  it('renders different variants correctly', () => {
    const { rerender } = render(
      <TabWrapper>
        <Tab label="Lab Tests" to="/lab-tests" variant="primary" />
      </TabWrapper>
    );
    
    expect(screen.getByText('Lab Tests')).toBeInTheDocument();
    
    rerender(
      <TabWrapper>
        <Tab label="Lab Tests" to="/lab-tests" variant="secondary" />
      </TabWrapper>
    );
    
    expect(screen.getByText('Lab Tests')).toBeInTheDocument();
    
    rerender(
      <TabWrapper>
        <Tab label="Lab Tests" to="/lab-tests" variant="outlined" />
      </TabWrapper>
    );
    
    expect(screen.getByText('Lab Tests')).toBeInTheDocument();
  });

  it('has proper accessibility attributes', () => {
    render(
      <TabWrapper>
        <Tab label="Lab Tests" to="/lab-tests" />
      </TabWrapper>
    );
    
    const tab = screen.getByRole('tab');
    expect(tab).toHaveAttribute('role', 'tab');
    expect(tab).toHaveAttribute('aria-selected');
    expect(tab).toHaveAttribute('tabindex', '0');
  });

  it('handles focus styles correctly', () => {
    render(
      <TabWrapper>
        <Tab label="Lab Tests" to="/lab-tests" />
      </TabWrapper>
    );
    
    const tab = screen.getByRole('tab');
    fireEvent.focus(tab);
    
    expect(tab).toHaveFocus();
  });

  it('auto-detects active state based on current location', () => {
    // Mock location pathname
    Object.defineProperty(window, 'location', {
      value: { pathname: '/lab-tests' },
      writable: true
    });
    
    render(
      <TabWrapper>
        <Tab label="Lab Tests" to="/lab-tests" />
      </TabWrapper>
    );
    
    const tab = screen.getByRole('tab');
    expect(tab).toHaveAttribute('aria-selected', 'true');
  });

  it('handles root path redirection to lab-tests', () => {
    // Mock location pathname
    Object.defineProperty(window, 'location', {
      value: { pathname: '/' },
      writable: true
    });
    
    render(
      <TabWrapper>
        <Tab label="Lab Tests" to="/lab-tests" />
      </TabWrapper>
    );
    
    const tab = screen.getByRole('tab');
    expect(tab).toHaveAttribute('aria-selected', 'true');
  });

  it('renders with complex icon and badge combination', () => {
    render(
      <TabWrapper>
        <Tab 
          label="Lab Tests" 
          to="/lab-tests" 
          icon={<Science />}
          badge={10}
          isActive={true}
        />
      </TabWrapper>
    );
    
    expect(screen.getByText('Lab Tests')).toBeInTheDocument();
    expect(screen.getByTestId('ScienceIcon')).toBeInTheDocument();
    expect(screen.getByText('10')).toBeInTheDocument();
  });
});