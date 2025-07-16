import { render, screen } from '@testing-library/react';
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
});