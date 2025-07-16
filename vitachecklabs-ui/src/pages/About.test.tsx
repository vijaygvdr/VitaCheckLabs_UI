import { render, screen } from '@testing-library/react';
import { ThemeProvider } from '@mui/material/styles';
import { describe, it, expect } from 'vitest';
import About from './About';
import theme from '../styles/theme';

const AboutWrapper = ({ children }: { children: React.ReactNode }) => (
  <ThemeProvider theme={theme}>
    {children}
  </ThemeProvider>
);

describe('About', () => {
  it('renders about page title', () => {
    render(
      <AboutWrapper>
        <About />
      </AboutWrapper>
    );
    expect(screen.getByText('About VitaCheckLabs')).toBeInTheDocument();
  });

  it('renders about description', () => {
    render(
      <AboutWrapper>
        <About />
      </AboutWrapper>
    );
    expect(screen.getByText('Your trusted partner in healthcare diagnostics')).toBeInTheDocument();
  });

  it('renders mission section', () => {
    render(
      <AboutWrapper>
        <About />
      </AboutWrapper>
    );
    expect(screen.getByText('Our Mission')).toBeInTheDocument();
    expect(screen.getByText(/VitaCheckLabs is committed to providing accurate/)).toBeInTheDocument();
  });

  it('renders contact information', () => {
    render(
      <AboutWrapper>
        <About />
      </AboutWrapper>
    );
    expect(screen.getByText('Contact Information')).toBeInTheDocument();
    expect(screen.getByText('(555) 123-4567')).toBeInTheDocument();
    expect(screen.getByText('info@vitachecklabs.com')).toBeInTheDocument();
    expect(screen.getByText('123 Healthcare Ave, Medical City, HC 12345')).toBeInTheDocument();
  });
});