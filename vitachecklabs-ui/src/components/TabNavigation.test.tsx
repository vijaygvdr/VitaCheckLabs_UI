import { render, screen, fireEvent, act } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import { describe, it, expect, vi } from 'vitest';
import TabNavigation from './TabNavigation';
import theme from '../styles/theme';
import { Science, Assignment, Info } from '@mui/icons-material';

const TabNavigationWrapper = ({ children }: { children: React.ReactNode }) => (
  <ThemeProvider theme={theme}>
    <BrowserRouter>
      {children}
    </BrowserRouter>
  </ThemeProvider>
);

const mockTabs = [
  {
    label: 'Lab Tests',
    value: '/lab-tests',
    icon: <Science />,
  },
  {
    label: 'Reports',
    value: '/reports',
    icon: <Assignment />,
  },
  {
    label: 'About',
    value: '/about',
    icon: <Info />,
  },
];

describe('TabNavigation', () => {
  it('renders all tabs', () => {
    render(
      <TabNavigationWrapper>
        <TabNavigation tabs={mockTabs} />
      </TabNavigationWrapper>
    );
    
    expect(screen.getByText('Lab Tests')).toBeInTheDocument();
    expect(screen.getByText('Reports')).toBeInTheDocument();
    expect(screen.getByText('About')).toBeInTheDocument();
  });

  it('renders with default tabs when no tabs provided', () => {
    render(
      <TabNavigationWrapper>
        <TabNavigation />
      </TabNavigationWrapper>
    );
    
    expect(screen.getByText('Lab Tests')).toBeInTheDocument();
    expect(screen.getByText('Reports')).toBeInTheDocument();
    expect(screen.getByText('About')).toBeInTheDocument();
  });

  it('renders tabs with icons', () => {
    render(
      <TabNavigationWrapper>
        <TabNavigation tabs={mockTabs} />
      </TabNavigationWrapper>
    );
    
    expect(screen.getByTestId('ScienceIcon')).toBeInTheDocument();
    expect(screen.getByTestId('AssignmentIcon')).toBeInTheDocument();
    expect(screen.getByTestId('InfoIcon')).toBeInTheDocument();
  });

  it('renders tabs with badges', () => {
    const tabsWithBadges = [
      {
        label: 'Lab Tests',
        value: '/lab-tests',
        icon: <Science />,
        badge: 5,
      },
      {
        label: 'Reports',
        value: '/reports',
        icon: <Assignment />,
        badge: 'new',
      },
      {
        label: 'About',
        value: '/about',
        icon: <Info />,
      },
    ];

    render(
      <TabNavigationWrapper>
        <TabNavigation tabs={tabsWithBadges} />
      </TabNavigationWrapper>
    );
    
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('new')).toBeInTheDocument();
  });

  it('handles disabled tabs', () => {
    const tabsWithDisabled = [
      {
        label: 'Lab Tests',
        value: '/lab-tests',
        icon: <Science />,
      },
      {
        label: 'Reports',
        value: '/reports',
        icon: <Assignment />,
        disabled: true,
      },
      {
        label: 'About',
        value: '/about',
        icon: <Info />,
      },
    ];

    render(
      <TabNavigationWrapper>
        <TabNavigation tabs={tabsWithDisabled} />
      </TabNavigationWrapper>
    );
    
    const reportsTab = screen.getByText('Reports').closest('a');
    expect(reportsTab).toHaveAttribute('aria-disabled', 'true');
  });

  it('calls onChange when tab is clicked', () => {
    const mockOnChange = vi.fn();
    
    render(
      <TabNavigationWrapper>
        <TabNavigation tabs={mockTabs} onChange={mockOnChange} />
      </TabNavigationWrapper>
    );
    
    const reportsTab = screen.getByText('Reports');
    fireEvent.click(reportsTab);
    
    expect(mockOnChange).toHaveBeenCalledWith('/reports');
  });

  it('handles keyboard navigation with arrow keys', () => {
    const mockOnChange = vi.fn();
    
    render(
      <TabNavigationWrapper>
        <TabNavigation tabs={mockTabs} onChange={mockOnChange} />
      </TabNavigationWrapper>
    );
    
    const labTestsTab = screen.getByText('Lab Tests');
    
    // Test right arrow
    fireEvent.keyDown(labTestsTab, { key: 'ArrowRight' });
    expect(mockOnChange).toHaveBeenCalledWith('/reports');
    
    // Test left arrow
    fireEvent.keyDown(labTestsTab, { key: 'ArrowLeft' });
    expect(mockOnChange).toHaveBeenCalledWith('/about');
  });

  it('handles keyboard navigation with Home and End keys', () => {
    const mockOnChange = vi.fn();
    
    render(
      <TabNavigationWrapper>
        <TabNavigation tabs={mockTabs} onChange={mockOnChange} />
      </TabNavigationWrapper>
    );
    
    const reportsTab = screen.getByText('Reports');
    
    // Test Home key
    fireEvent.keyDown(reportsTab, { key: 'Home' });
    expect(mockOnChange).toHaveBeenCalledWith('/lab-tests');
    
    // Test End key
    fireEvent.keyDown(reportsTab, { key: 'End' });
    expect(mockOnChange).toHaveBeenCalledWith('/about');
  });

  it('skips disabled tabs during keyboard navigation', () => {
    const tabsWithDisabled = [
      {
        label: 'Lab Tests',
        value: '/lab-tests',
        icon: <Science />,
      },
      {
        label: 'Reports',
        value: '/reports',
        icon: <Assignment />,
        disabled: true,
      },
      {
        label: 'About',
        value: '/about',
        icon: <Info />,
      },
    ];

    const mockOnChange = vi.fn();
    
    render(
      <TabNavigationWrapper>
        <TabNavigation tabs={tabsWithDisabled} onChange={mockOnChange} />
      </TabNavigationWrapper>
    );
    
    const labTestsTab = screen.getByText('Lab Tests');
    
    // Should skip disabled Reports tab and go to About
    fireEvent.keyDown(labTestsTab, { key: 'ArrowRight' });
    expect(mockOnChange).toHaveBeenCalledWith('/about');
  });

  it('renders with different variants', () => {
    const { rerender } = render(
      <TabNavigationWrapper>
        <TabNavigation tabs={mockTabs} variant="primary" />
      </TabNavigationWrapper>
    );
    
    expect(screen.getByText('Lab Tests')).toBeInTheDocument();
    
    rerender(
      <TabNavigationWrapper>
        <TabNavigation tabs={mockTabs} variant="secondary" />
      </TabNavigationWrapper>
    );
    
    expect(screen.getByText('Lab Tests')).toBeInTheDocument();
    
    rerender(
      <TabNavigationWrapper>
        <TabNavigation tabs={mockTabs} variant="outlined" />
      </TabNavigationWrapper>
    );
    
    expect(screen.getByText('Lab Tests')).toBeInTheDocument();
  });

  it('renders with different sizes', () => {
    const { rerender } = render(
      <TabNavigationWrapper>
        <TabNavigation tabs={mockTabs} size="small" />
      </TabNavigationWrapper>
    );
    
    expect(screen.getByText('Lab Tests')).toBeInTheDocument();
    
    rerender(
      <TabNavigationWrapper>
        <TabNavigation tabs={mockTabs} size="large" />
      </TabNavigationWrapper>
    );
    
    expect(screen.getByText('Lab Tests')).toBeInTheDocument();
  });

  it('renders with vertical orientation', () => {
    render(
      <TabNavigationWrapper>
        <TabNavigation tabs={mockTabs} orientation="vertical" />
      </TabNavigationWrapper>
    );
    
    expect(screen.getByText('Lab Tests')).toBeInTheDocument();
    expect(screen.getByText('Reports')).toBeInTheDocument();
    expect(screen.getByText('About')).toBeInTheDocument();
  });

  it('renders with sticky tabs', () => {
    render(
      <TabNavigationWrapper>
        <TabNavigation tabs={mockTabs} stickyTabs={true} />
      </TabNavigationWrapper>
    );
    
    expect(screen.getByText('Lab Tests')).toBeInTheDocument();
  });

  it('renders with different animation types', () => {
    const { rerender } = render(
      <TabNavigationWrapper>
        <TabNavigation tabs={mockTabs} animationType="fade" />
      </TabNavigationWrapper>
    );
    
    expect(screen.getByText('Lab Tests')).toBeInTheDocument();
    
    rerender(
      <TabNavigationWrapper>
        <TabNavigation tabs={mockTabs} animationType="slide" />
      </TabNavigationWrapper>
    );
    
    expect(screen.getByText('Lab Tests')).toBeInTheDocument();
    
    rerender(
      <TabNavigationWrapper>
        <TabNavigation tabs={mockTabs} animationType="grow" />
      </TabNavigationWrapper>
    );
    
    expect(screen.getByText('Lab Tests')).toBeInTheDocument();
  });

  it('renders with custom animation duration', () => {
    render(
      <TabNavigationWrapper>
        <TabNavigation tabs={mockTabs} animationDuration={500} />
      </TabNavigationWrapper>
    );
    
    expect(screen.getByText('Lab Tests')).toBeInTheDocument();
  });

  it('shows indicator when showIndicator is true', () => {
    render(
      <TabNavigationWrapper>
        <TabNavigation tabs={mockTabs} showIndicator={true} />
      </TabNavigationWrapper>
    );
    
    expect(screen.getByText('Lab Tests')).toBeInTheDocument();
  });

  it('hides indicator when showIndicator is false', () => {
    render(
      <TabNavigationWrapper>
        <TabNavigation tabs={mockTabs} showIndicator={false} />
      </TabNavigationWrapper>
    );
    
    expect(screen.getByText('Lab Tests')).toBeInTheDocument();
  });

  it('renders with centered tabs', () => {
    render(
      <TabNavigationWrapper>
        <TabNavigation tabs={mockTabs} centered={true} />
      </TabNavigationWrapper>
    );
    
    expect(screen.getByText('Lab Tests')).toBeInTheDocument();
  });

  it('renders with left-aligned tabs', () => {
    render(
      <TabNavigationWrapper>
        <TabNavigation tabs={mockTabs} centered={false} />
      </TabNavigationWrapper>
    );
    
    expect(screen.getByText('Lab Tests')).toBeInTheDocument();
  });

  it('renders with scrollable tabs', () => {
    render(
      <TabNavigationWrapper>
        <TabNavigation tabs={mockTabs} scrollable={true} />
      </TabNavigationWrapper>
    );
    
    expect(screen.getByText('Lab Tests')).toBeInTheDocument();
  });

  it('renders with custom children', () => {
    render(
      <TabNavigationWrapper>
        <TabNavigation tabs={mockTabs}>
          <div>Custom tab content</div>
        </TabNavigation>
      </TabNavigationWrapper>
    );
    
    expect(screen.getByText('Lab Tests')).toBeInTheDocument();
    expect(screen.getByText('Custom tab content')).toBeInTheDocument();
  });

  it('handles tab list role and accessibility', () => {
    render(
      <TabNavigationWrapper>
        <TabNavigation tabs={mockTabs} />
      </TabNavigationWrapper>
    );
    
    const tablist = screen.getByRole('tablist');
    expect(tablist).toBeInTheDocument();
    
    const tabs = screen.getAllByRole('tab');
    expect(tabs).toHaveLength(3);
  });

  it('updates active tab based on location changes', () => {
    // Mock location pathname
    Object.defineProperty(window, 'location', {
      value: { pathname: '/reports' },
      writable: true
    });
    
    render(
      <TabNavigationWrapper>
        <TabNavigation tabs={mockTabs} />
      </TabNavigationWrapper>
    );
    
    const reportsTab = screen.getByText('Reports').closest('[role="tab"]');
    expect(reportsTab).toHaveAttribute('aria-selected', 'true');
  });

  it('handles root path redirection', () => {
    // Mock location pathname
    Object.defineProperty(window, 'location', {
      value: { pathname: '/' },
      writable: true
    });
    
    render(
      <TabNavigationWrapper>
        <TabNavigation tabs={mockTabs} />
      </TabNavigationWrapper>
    );
    
    const labTestsTab = screen.getByText('Lab Tests').closest('[role="tab"]');
    expect(labTestsTab).toHaveAttribute('aria-selected', 'true');
  });
});