import { render, screen } from '@testing-library/react';
import { ThemeProvider } from '@mui/material/styles';
import { describe, it, expect } from 'vitest';
import Logo from './Logo';
import theme from '../styles/theme';

const LogoWrapper = ({ children }: { children: React.ReactNode }) => (
  <ThemeProvider theme={theme}>
    {children}
  </ThemeProvider>
);

describe('Logo', () => {
  it('renders full logo with icon and text by default', () => {
    render(
      <LogoWrapper>
        <Logo />
      </LogoWrapper>
    );
    
    expect(screen.getByText('VitaCheckLabs')).toBeInTheDocument();
    expect(screen.getByTestId('LocalHospitalIcon')).toBeInTheDocument();
  });

  it('renders only icon when variant is "icon"', () => {
    render(
      <LogoWrapper>
        <Logo variant="icon" />
      </LogoWrapper>
    );
    
    expect(screen.getByTestId('LocalHospitalIcon')).toBeInTheDocument();
    expect(screen.queryByText('VitaCheckLabs')).not.toBeInTheDocument();
  });

  it('renders only text when variant is "text"', () => {
    render(
      <LogoWrapper>
        <Logo variant="text" />
      </LogoWrapper>
    );
    
    expect(screen.getByText('VitaCheckLabs')).toBeInTheDocument();
    expect(screen.queryByTestId('LocalHospitalIcon')).not.toBeInTheDocument();
  });

  it('renders with different sizes', () => {
    const { rerender } = render(
      <LogoWrapper>
        <Logo size="small" />
      </LogoWrapper>
    );
    
    expect(screen.getByText('VitaCheckLabs')).toBeInTheDocument();
    
    rerender(
      <LogoWrapper>
        <Logo size="large" />
      </LogoWrapper>
    );
    
    expect(screen.getByText('VitaCheckLabs')).toBeInTheDocument();
  });

  it('applies primary color correctly', () => {
    render(
      <LogoWrapper>
        <Logo color="primary" />
      </LogoWrapper>
    );
    
    const text = screen.getByText('VitaCheckLabs');
    expect(text).toHaveStyle({ color: theme.palette.primary.main });
  });

  it('applies secondary color correctly', () => {
    render(
      <LogoWrapper>
        <Logo color="secondary" />
      </LogoWrapper>
    );
    
    const text = screen.getByText('VitaCheckLabs');
    expect(text).toHaveStyle({ color: theme.palette.secondary.main });
  });

  it('has proper accessibility attributes', () => {
    render(
      <LogoWrapper>
        <Logo />
      </LogoWrapper>
    );
    
    const text = screen.getByText('VitaCheckLabs');
    expect(text).toHaveAttribute('role', 'img');
  });
});