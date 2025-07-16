import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import { describe, it, expect } from 'vitest';
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
});