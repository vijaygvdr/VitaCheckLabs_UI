import { render, screen } from '@testing-library/react';
import { ThemeProvider } from '@mui/material/styles';
import { describe, it, expect } from 'vitest';
import Reports from './Reports';
import theme from '../styles/theme';

const ReportsWrapper = ({ children }: { children: React.ReactNode }) => (
  <ThemeProvider theme={theme}>
    {children}
  </ThemeProvider>
);

describe('Reports', () => {
  it('renders reports page title', () => {
    render(
      <ReportsWrapper>
        <Reports />
      </ReportsWrapper>
    );
    expect(screen.getByText('Reports')).toBeInTheDocument();
  });

  it('renders reports description', () => {
    render(
      <ReportsWrapper>
        <Reports />
      </ReportsWrapper>
    );
    expect(screen.getByText('View and manage your lab test reports')).toBeInTheDocument();
  });

  it('renders sample report cards', () => {
    render(
      <ReportsWrapper>
        <Reports />
      </ReportsWrapper>
    );
    expect(screen.getByText('Blood Test Report')).toBeInTheDocument();
    expect(screen.getByText('Lipid Panel Report')).toBeInTheDocument();
    expect(screen.getByText('Diabetes Panel Report')).toBeInTheDocument();
  });

  it('displays report status chips', () => {
    render(
      <ReportsWrapper>
        <Reports />
      </ReportsWrapper>
    );
    expect(screen.getByText('Completed')).toBeInTheDocument();
    expect(screen.getByText('Reviewed')).toBeInTheDocument();
    expect(screen.getByText('Pending')).toBeInTheDocument();
  });
});