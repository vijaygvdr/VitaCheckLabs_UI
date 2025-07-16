import { render, screen } from '@testing-library/react';
import { ThemeProvider } from '@mui/material/styles';
import { describe, it, expect } from 'vitest';
import LabTests from './LabTests';
import theme from '../styles/theme';

const LabTestsWrapper = ({ children }: { children: React.ReactNode }) => (
  <ThemeProvider theme={theme}>
    {children}
  </ThemeProvider>
);

describe('LabTests', () => {
  it('renders lab tests page title', () => {
    render(
      <LabTestsWrapper>
        <LabTests />
      </LabTestsWrapper>
    );
    expect(screen.getByText('Lab Tests')).toBeInTheDocument();
  });

  it('renders lab tests description', () => {
    render(
      <LabTestsWrapper>
        <LabTests />
      </LabTestsWrapper>
    );
    expect(screen.getByText('Browse and book our comprehensive range of laboratory tests')).toBeInTheDocument();
  });

  it('renders sample test cards', () => {
    render(
      <LabTestsWrapper>
        <LabTests />
      </LabTestsWrapper>
    );
    expect(screen.getByText('Complete Blood Count')).toBeInTheDocument();
    expect(screen.getByText('Lipid Panel')).toBeInTheDocument();
    expect(screen.getByText('Diabetes Panel')).toBeInTheDocument();
  });

  it('displays test prices', () => {
    render(
      <LabTestsWrapper>
        <LabTests />
      </LabTestsWrapper>
    );
    expect(screen.getByText('$49.99')).toBeInTheDocument();
    expect(screen.getByText('$39.99')).toBeInTheDocument();
    expect(screen.getByText('$59.99')).toBeInTheDocument();
  });
});