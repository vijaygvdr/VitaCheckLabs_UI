import { render, screen, act } from '@testing-library/react';
import { ThemeProvider } from '@mui/material/styles';
import { describe, it, expect, vi } from 'vitest';
import TabContent from './TabContent';
import theme from '../styles/theme';

const TabContentWrapper = ({ children }: { children: React.ReactNode }) => (
  <ThemeProvider theme={theme}>
    {children}
  </ThemeProvider>
);

describe('TabContent', () => {
  it('renders content when active', () => {
    render(
      <TabContentWrapper>
        <TabContent value="/lab-tests" currentValue="/lab-tests">
          <div>Lab Tests Content</div>
        </TabContent>
      </TabContentWrapper>
    );
    
    expect(screen.getByText('Lab Tests Content')).toBeInTheDocument();
  });

  it('hides content when inactive', () => {
    render(
      <TabContentWrapper>
        <TabContent value="/lab-tests" currentValue="/reports">
          <div>Lab Tests Content</div>
        </TabContent>
      </TabContentWrapper>
    );
    
    const content = screen.getByText('Lab Tests Content');
    expect(content.closest('[role="tabpanel"]')).toHaveAttribute('hidden');
  });

  it('shows loading state', () => {
    render(
      <TabContentWrapper>
        <TabContent value="/lab-tests" currentValue="/lab-tests" loading={true}>
          <div>Lab Tests Content</div>
        </TabContent>
      </TabContentWrapper>
    );
    
    expect(screen.getByText('Loading...')).toBeInTheDocument();
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('shows error state', () => {
    render(
      <TabContentWrapper>
        <TabContent value="/lab-tests" currentValue="/lab-tests" error="Something went wrong">
          <div>Lab Tests Content</div>
        </TabContent>
      </TabContentWrapper>
    );
    
    expect(screen.getByText('Error')).toBeInTheDocument();
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });

  it('has proper accessibility attributes', () => {
    render(
      <TabContentWrapper>
        <TabContent value="/lab-tests" currentValue="/lab-tests">
          <div>Lab Tests Content</div>
        </TabContent>
      </TabContentWrapper>
    );
    
    const tabpanel = screen.getByRole('tabpanel');
    expect(tabpanel).toHaveAttribute('id', 'tabpanel-/lab-tests');
    expect(tabpanel).toHaveAttribute('aria-labelledby', 'tab-/lab-tests');
  });

  it('handles root path correctly', () => {
    render(
      <TabContentWrapper>
        <TabContent value="/lab-tests" currentValue="/">
          <div>Lab Tests Content</div>
        </TabContent>
      </TabContentWrapper>
    );
    
    expect(screen.getByText('Lab Tests Content')).toBeInTheDocument();
  });

  it('applies custom min height', () => {
    render(
      <TabContentWrapper>
        <TabContent value="/lab-tests" currentValue="/lab-tests" minHeight="500px">
          <div>Lab Tests Content</div>
        </TabContent>
      </TabContentWrapper>
    );
    
    const tabpanel = screen.getByRole('tabpanel');
    expect(tabpanel).toHaveStyle({ minHeight: '500px' });
  });

  it('applies custom padding', () => {
    render(
      <TabContentWrapper>
        <TabContent value="/lab-tests" currentValue="/lab-tests" padding="20px">
          <div>Lab Tests Content</div>
        </TabContent>
      </TabContentWrapper>
    );
    
    const tabpanel = screen.getByRole('tabpanel');
    expect(tabpanel).toHaveStyle({ padding: '20px' });
  });

  it('handles numeric minHeight', () => {
    render(
      <TabContentWrapper>
        <TabContent value="/lab-tests" currentValue="/lab-tests" minHeight={600}>
          <div>Lab Tests Content</div>
        </TabContent>
      </TabContentWrapper>
    );
    
    const tabpanel = screen.getByRole('tabpanel');
    expect(tabpanel).toHaveStyle({ minHeight: '600px' });
  });

  it('handles numeric padding', () => {
    render(
      <TabContentWrapper>
        <TabContent value="/lab-tests" currentValue="/lab-tests" padding={24}>
          <div>Lab Tests Content</div>
        </TabContent>
      </TabContentWrapper>
    );
    
    const tabpanel = screen.getByRole('tabpanel');
    expect(tabpanel).toHaveStyle({ padding: '24px' });
  });

  it('handles different animation types', () => {
    const { rerender } = render(
      <TabContentWrapper>
        <TabContent value="/lab-tests" currentValue="/lab-tests" animationType="fade">
          <div>Lab Tests Content</div>
        </TabContent>
      </TabContentWrapper>
    );
    
    expect(screen.getByText('Lab Tests Content')).toBeInTheDocument();
    
    rerender(
      <TabContentWrapper>
        <TabContent value="/lab-tests" currentValue="/lab-tests" animationType="slide">
          <div>Lab Tests Content</div>
        </TabContent>
      </TabContentWrapper>
    );
    
    expect(screen.getByText('Lab Tests Content')).toBeInTheDocument();
    
    rerender(
      <TabContentWrapper>
        <TabContent value="/lab-tests" currentValue="/lab-tests" animationType="grow">
          <div>Lab Tests Content</div>
        </TabContent>
      </TabContentWrapper>
    );
    
    expect(screen.getByText('Lab Tests Content')).toBeInTheDocument();
    
    rerender(
      <TabContentWrapper>
        <TabContent value="/lab-tests" currentValue="/lab-tests" animationType="none">
          <div>Lab Tests Content</div>
        </TabContent>
      </TabContentWrapper>
    );
    
    expect(screen.getByText('Lab Tests Content')).toBeInTheDocument();
  });

  it('handles custom animation duration', () => {
    render(
      <TabContentWrapper>
        <TabContent value="/lab-tests" currentValue="/lab-tests" animationDuration={500}>
          <div>Lab Tests Content</div>
        </TabContent>
      </TabContentWrapper>
    );
    
    expect(screen.getByText('Lab Tests Content')).toBeInTheDocument();
  });

  it('handles lazy loading - does not render when not active and not visited', () => {
    render(
      <TabContentWrapper>
        <TabContent value="/lab-tests" currentValue="/reports" lazy={true}>
          <div>Lab Tests Content</div>
        </TabContent>
      </TabContentWrapper>
    );
    
    expect(screen.queryByText('Lab Tests Content')).not.toBeInTheDocument();
  });

  it('handles lazy loading - renders when active', () => {
    render(
      <TabContentWrapper>
        <TabContent value="/lab-tests" currentValue="/lab-tests" lazy={true}>
          <div>Lab Tests Content</div>
        </TabContent>
      </TabContentWrapper>
    );
    
    expect(screen.getByText('Lab Tests Content')).toBeInTheDocument();
  });

  it('handles lazy loading - remembers visited state', () => {
    const { rerender } = render(
      <TabContentWrapper>
        <TabContent value="/lab-tests" currentValue="/lab-tests" lazy={true}>
          <div>Lab Tests Content</div>
        </TabContent>
      </TabContentWrapper>
    );
    
    // First render - active, content should be visible
    expect(screen.getByText('Lab Tests Content')).toBeInTheDocument();
    
    // Switch to another tab
    rerender(
      <TabContentWrapper>
        <TabContent value="/lab-tests" currentValue="/reports" lazy={true}>
          <div>Lab Tests Content</div>
        </TabContent>
      </TabContentWrapper>
    );
    
    // Content should still be rendered (has been visited)
    expect(screen.getByText('Lab Tests Content')).toBeInTheDocument();
  });

  it('renders with complex content structure', () => {
    render(
      <TabContentWrapper>
        <TabContent value="/lab-tests" currentValue="/lab-tests">
          <div>
            <h1>Lab Tests</h1>
            <p>Browse our comprehensive lab tests</p>
            <button>Book Test</button>
          </div>
        </TabContent>
      </TabContentWrapper>
    );
    
    expect(screen.getByText('Lab Tests')).toBeInTheDocument();
    expect(screen.getByText('Browse our comprehensive lab tests')).toBeInTheDocument();
    expect(screen.getByText('Book Test')).toBeInTheDocument();
  });

  it('handles rapid tab switching', () => {
    const { rerender } = render(
      <TabContentWrapper>
        <TabContent value="/lab-tests" currentValue="/lab-tests">
          <div>Lab Tests Content</div>
        </TabContent>
      </TabContentWrapper>
    );
    
    expect(screen.getByText('Lab Tests Content')).toBeInTheDocument();
    
    // Rapidly switch tabs
    rerender(
      <TabContentWrapper>
        <TabContent value="/lab-tests" currentValue="/reports">
          <div>Lab Tests Content</div>
        </TabContent>
      </TabContentWrapper>
    );
    
    rerender(
      <TabContentWrapper>
        <TabContent value="/lab-tests" currentValue="/lab-tests">
          <div>Lab Tests Content</div>
        </TabContent>
      </TabContentWrapper>
    );
    
    expect(screen.getByText('Lab Tests Content')).toBeInTheDocument();
  });

  it('handles loading state with custom content', () => {
    render(
      <TabContentWrapper>
        <TabContent value="/lab-tests" currentValue="/lab-tests" loading={true}>
          <div>This should not be visible</div>
        </TabContent>
      </TabContentWrapper>
    );
    
    expect(screen.getByText('Loading...')).toBeInTheDocument();
    expect(screen.queryByText('This should not be visible')).not.toBeInTheDocument();
  });

  it('handles error state with custom content', () => {
    render(
      <TabContentWrapper>
        <TabContent value="/lab-tests" currentValue="/lab-tests" error="Network error">
          <div>This should not be visible</div>
        </TabContent>
      </TabContentWrapper>
    );
    
    expect(screen.getByText('Error')).toBeInTheDocument();
    expect(screen.getByText('Network error')).toBeInTheDocument();
    expect(screen.queryByText('This should not be visible')).not.toBeInTheDocument();
  });
});