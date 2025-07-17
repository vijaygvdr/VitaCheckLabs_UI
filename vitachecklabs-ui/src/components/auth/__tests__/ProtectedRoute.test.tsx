// ProtectedRoute Test Suite

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from '../../../contexts/AuthContext';
import ProtectedRoute, { 
  AdminRoute, 
  LabTechnicianRoute, 
  UserRoute, 
  GuestRoute,
  PermissionRoute,
  ConditionalRender,
  withProtection 
} from '../ProtectedRoute';
import { authService } from '../../../services/authService';
import { User } from '../../../types/api';

// Mock the auth service
vi.mock('../../../services/authService', () => ({
  authService: {
    isAuthenticated: vi.fn(),
    getCurrentUser: vi.fn(),
    getPermissions: vi.fn(),
    refreshToken: vi.fn(),
  },
}));

// Mock react-router-dom
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useLocation: () => ({ pathname: '/protected', state: null }),
    Navigate: ({ to, state, replace }: any) => {
      mockNavigate(to, { state, replace });
      return <div data-testid="navigate">Navigating to {to}</div>;
    },
  };
});

const mockUser: User = {
  id: '1',
  username: 'testuser',
  email: 'test@example.com',
  first_name: 'Test',
  last_name: 'User',
  phone_number: '+1234567890',
  role: 'USER',
  is_active: true,
  created_at: '2023-01-01T00:00:00Z',
  updated_at: '2023-01-01T00:00:00Z',
};

const mockAdminUser: User = {
  ...mockUser,
  role: 'ADMIN',
};

const mockLabTechUser: User = {
  ...mockUser,
  role: 'LAB_TECHNICIAN',
};

const TestComponent: React.FC = () => <div data-testid="protected-content">Protected Content</div>;

const renderWithAuth = (children: React.ReactNode, initialEntries = ['/']) => {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <AuthProvider>
        {children}
      </AuthProvider>
    </MemoryRouter>
  );
};

describe('ProtectedRoute', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockNavigate.mockClear();
  });

  describe('Authentication Requirements', () => {
    it('should render children when authenticated', async () => {
      vi.mocked(authService.isAuthenticated).mockReturnValue(true);
      vi.mocked(authService.getCurrentUser).mockResolvedValue(mockUser);
      vi.mocked(authService.getPermissions).mockResolvedValue(['test:read']);

      renderWithAuth(
        <ProtectedRoute>
          <TestComponent />
        </ProtectedRoute>
      );

      await waitFor(() => {
        expect(screen.getByTestId('protected-content')).toBeInTheDocument();
      });
    });

    it('should redirect to login when not authenticated', async () => {
      vi.mocked(authService.isAuthenticated).mockReturnValue(false);

      renderWithAuth(
        <ProtectedRoute>
          <TestComponent />
        </ProtectedRoute>
      );

      await waitFor(() => {
        expect(screen.getByTestId('navigate')).toBeInTheDocument();
        expect(screen.getByText('Navigating to /auth/login')).toBeInTheDocument();
      });
    });

    it('should redirect to custom fallback path', async () => {
      vi.mocked(authService.isAuthenticated).mockReturnValue(false);

      renderWithAuth(
        <ProtectedRoute fallbackPath="/custom-login">
          <TestComponent />
        </ProtectedRoute>
      );

      await waitFor(() => {
        expect(screen.getByText('Navigating to /custom-login')).toBeInTheDocument();
      });
    });

    it('should allow access when requireAuth is false', async () => {
      vi.mocked(authService.isAuthenticated).mockReturnValue(false);

      renderWithAuth(
        <ProtectedRoute requireAuth={false}>
          <TestComponent />
        </ProtectedRoute>
      );

      await waitFor(() => {
        expect(screen.getByTestId('protected-content')).toBeInTheDocument();
      });
    });
  });

  describe('Role-Based Access', () => {
    beforeEach(() => {
      vi.mocked(authService.isAuthenticated).mockReturnValue(true);
      vi.mocked(authService.getPermissions).mockResolvedValue(['test:read']);
    });

    it('should allow access when user has required role', async () => {
      vi.mocked(authService.getCurrentUser).mockResolvedValue(mockAdminUser);

      renderWithAuth(
        <ProtectedRoute requiredRole="ADMIN">
          <TestComponent />
        </ProtectedRoute>
      );

      await waitFor(() => {
        expect(screen.getByTestId('protected-content')).toBeInTheDocument();
      });
    });

    it('should deny access when user lacks required role', async () => {
      vi.mocked(authService.getCurrentUser).mockResolvedValue(mockUser);

      renderWithAuth(
        <ProtectedRoute requiredRole="ADMIN">
          <TestComponent />
        </ProtectedRoute>
      );

      await waitFor(() => {
        expect(screen.getByText('Access Denied')).toBeInTheDocument();
        expect(screen.getByText("You don't have the required permissions to access this page.")).toBeInTheDocument();
        expect(screen.getByText('Required Role: ADMIN')).toBeInTheDocument();
        expect(screen.getByText('Your Role: USER')).toBeInTheDocument();
      });
    });
  });

  describe('Permission-Based Access', () => {
    beforeEach(() => {
      vi.mocked(authService.isAuthenticated).mockReturnValue(true);
      vi.mocked(authService.getCurrentUser).mockResolvedValue(mockUser);
    });

    it('should allow access when user has required permissions', async () => {
      vi.mocked(authService.getPermissions).mockResolvedValue(['test:read', 'test:write']);

      renderWithAuth(
        <ProtectedRoute requiredPermissions={['test:read']}>
          <TestComponent />
        </ProtectedRoute>
      );

      await waitFor(() => {
        expect(screen.getByTestId('protected-content')).toBeInTheDocument();
      });
    });

    it('should deny access when user lacks required permissions', async () => {
      vi.mocked(authService.getPermissions).mockResolvedValue(['test:read']);

      renderWithAuth(
        <ProtectedRoute requiredPermissions={['test:write']}>
          <TestComponent />
        </ProtectedRoute>
      );

      await waitFor(() => {
        expect(screen.getByText('Access Denied')).toBeInTheDocument();
        expect(screen.getByText('test:write')).toBeInTheDocument();
      });
    });

    it('should require all permissions by default', async () => {
      vi.mocked(authService.getPermissions).mockResolvedValue(['test:read']);

      renderWithAuth(
        <ProtectedRoute requiredPermissions={['test:read', 'test:write']}>
          <TestComponent />
        </ProtectedRoute>
      );

      await waitFor(() => {
        expect(screen.getByText('Access Denied')).toBeInTheDocument();
      });
    });
  });

  describe('Loading States', () => {
    it('should show loading state during authentication check', async () => {
      vi.mocked(authService.isAuthenticated).mockReturnValue(true);
      vi.mocked(authService.getCurrentUser).mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve(mockUser), 100))
      );
      vi.mocked(authService.getPermissions).mockResolvedValue(['test:read']);

      renderWithAuth(
        <ProtectedRoute>
          <TestComponent />
        </ProtectedRoute>
      );

      // Should show loading initially
      expect(screen.getByText('Verifying access...')).toBeInTheDocument();

      // Should show content after loading
      await waitFor(() => {
        expect(screen.getByTestId('protected-content')).toBeInTheDocument();
      });
    });

    it('should show custom loading component', async () => {
      vi.mocked(authService.isAuthenticated).mockReturnValue(true);
      vi.mocked(authService.getCurrentUser).mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve(mockUser), 100))
      );
      vi.mocked(authService.getPermissions).mockResolvedValue(['test:read']);

      const CustomLoader = () => <div data-testid="custom-loader">Custom Loading...</div>;

      renderWithAuth(
        <ProtectedRoute loadingComponent={<CustomLoader />}>
          <TestComponent />
        </ProtectedRoute>
      );

      expect(screen.getByTestId('custom-loader')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should show error when authentication fails', async () => {
      vi.mocked(authService.isAuthenticated).mockReturnValue(true);
      vi.mocked(authService.getCurrentUser).mockRejectedValue(new Error('Auth failed'));

      renderWithAuth(
        <ProtectedRoute>
          <TestComponent />
        </ProtectedRoute>
      );

      await waitFor(() => {
        expect(screen.getByText('Authentication Error')).toBeInTheDocument();
        expect(screen.getByText('There was a problem verifying your authentication.')).toBeInTheDocument();
      });
    });

    it('should show custom unauthorized component', async () => {
      vi.mocked(authService.isAuthenticated).mockReturnValue(true);
      vi.mocked(authService.getCurrentUser).mockResolvedValue(mockUser);
      vi.mocked(authService.getPermissions).mockResolvedValue(['test:read']);

      const CustomUnauthorized = () => <div data-testid="custom-unauthorized">Custom Unauthorized</div>;

      renderWithAuth(
        <ProtectedRoute 
          requiredRole="ADMIN"
          unauthorizedComponent={<CustomUnauthorized />}
        >
          <TestComponent />
        </ProtectedRoute>
      );

      await waitFor(() => {
        expect(screen.getByTestId('custom-unauthorized')).toBeInTheDocument();
      });
    });
  });

  describe('Redirect on Auth', () => {
    it('should redirect authenticated users when redirectOnAuth is true', async () => {
      vi.mocked(authService.isAuthenticated).mockReturnValue(true);
      vi.mocked(authService.getCurrentUser).mockResolvedValue(mockUser);
      vi.mocked(authService.getPermissions).mockResolvedValue(['test:read']);

      renderWithAuth(
        <ProtectedRoute redirectOnAuth={true}>
          <TestComponent />
        </ProtectedRoute>
      );

      await waitFor(() => {
        expect(screen.getByText('Navigating to /lab-tests')).toBeInTheDocument();
      });
    });
  });

  describe('Specialized Route Components', () => {
    describe('AdminRoute', () => {
      it('should allow admin access', async () => {
        vi.mocked(authService.isAuthenticated).mockReturnValue(true);
        vi.mocked(authService.getCurrentUser).mockResolvedValue(mockAdminUser);
        vi.mocked(authService.getPermissions).mockResolvedValue(['admin:all']);

        renderWithAuth(
          <AdminRoute>
            <TestComponent />
          </AdminRoute>
        );

        await waitFor(() => {
          expect(screen.getByTestId('protected-content')).toBeInTheDocument();
        });
      });

      it('should deny non-admin access', async () => {
        vi.mocked(authService.isAuthenticated).mockReturnValue(true);
        vi.mocked(authService.getCurrentUser).mockResolvedValue(mockUser);
        vi.mocked(authService.getPermissions).mockResolvedValue(['user:basic']);

        renderWithAuth(
          <AdminRoute>
            <TestComponent />
          </AdminRoute>
        );

        await waitFor(() => {
          expect(screen.getByText('Access Denied')).toBeInTheDocument();
        });
      });
    });

    describe('LabTechnicianRoute', () => {
      it('should allow lab technician access', async () => {
        vi.mocked(authService.isAuthenticated).mockReturnValue(true);
        vi.mocked(authService.getCurrentUser).mockResolvedValue(mockLabTechUser);
        vi.mocked(authService.getPermissions).mockResolvedValue(['lab:process']);

        renderWithAuth(
          <LabTechnicianRoute>
            <TestComponent />
          </LabTechnicianRoute>
        );

        await waitFor(() => {
          expect(screen.getByTestId('protected-content')).toBeInTheDocument();
        });
      });
    });

    describe('UserRoute', () => {
      it('should allow any authenticated user access', async () => {
        vi.mocked(authService.isAuthenticated).mockReturnValue(true);
        vi.mocked(authService.getCurrentUser).mockResolvedValue(mockUser);
        vi.mocked(authService.getPermissions).mockResolvedValue(['user:basic']);

        renderWithAuth(
          <UserRoute>
            <TestComponent />
          </UserRoute>
        );

        await waitFor(() => {
          expect(screen.getByTestId('protected-content')).toBeInTheDocument();
        });
      });

      it('should deny unauthenticated access', async () => {
        vi.mocked(authService.isAuthenticated).mockReturnValue(false);

        renderWithAuth(
          <UserRoute>
            <TestComponent />
          </UserRoute>
        );

        await waitFor(() => {
          expect(screen.getByText('Navigating to /auth/login')).toBeInTheDocument();
        });
      });
    });

    describe('GuestRoute', () => {
      it('should allow unauthenticated access', async () => {
        vi.mocked(authService.isAuthenticated).mockReturnValue(false);

        renderWithAuth(
          <GuestRoute>
            <TestComponent />
          </GuestRoute>
        );

        await waitFor(() => {
          expect(screen.getByTestId('protected-content')).toBeInTheDocument();
        });
      });

      it('should redirect authenticated users', async () => {
        vi.mocked(authService.isAuthenticated).mockReturnValue(true);
        vi.mocked(authService.getCurrentUser).mockResolvedValue(mockUser);
        vi.mocked(authService.getPermissions).mockResolvedValue(['user:basic']);

        renderWithAuth(
          <GuestRoute>
            <TestComponent />
          </GuestRoute>
        );

        await waitFor(() => {
          expect(screen.getByText('Navigating to /lab-tests')).toBeInTheDocument();
        });
      });
    });
  });

  describe('PermissionRoute Component', () => {
    beforeEach(() => {
      vi.mocked(authService.isAuthenticated).mockReturnValue(true);
      vi.mocked(authService.getCurrentUser).mockResolvedValue(mockUser);
    });

    it('should allow access with required permissions (requireAll=true)', async () => {
      vi.mocked(authService.getPermissions).mockResolvedValue(['test:read', 'test:write']);

      renderWithAuth(
        <PermissionRoute permissions={['test:read', 'test:write']} requireAll={true}>
          <TestComponent />
        </PermissionRoute>
      );

      await waitFor(() => {
        expect(screen.getByTestId('protected-content')).toBeInTheDocument();
      });
    });

    it('should deny access when missing permissions (requireAll=true)', async () => {
      vi.mocked(authService.getPermissions).mockResolvedValue(['test:read']);

      renderWithAuth(
        <PermissionRoute permissions={['test:read', 'test:write']} requireAll={true}>
          <TestComponent />
        </PermissionRoute>
      );

      await waitFor(() => {
        expect(screen.getByText("You don't have permission to access this content.")).toBeInTheDocument();
        expect(screen.getByText('Required permissions: test:read, test:write')).toBeInTheDocument();
      });
    });

    it('should allow access with any permission (requireAll=false)', async () => {
      vi.mocked(authService.getPermissions).mockResolvedValue(['test:read']);

      renderWithAuth(
        <PermissionRoute permissions={['test:read', 'test:write']} requireAll={false}>
          <TestComponent />
        </PermissionRoute>
      );

      await waitFor(() => {
        expect(screen.getByTestId('protected-content')).toBeInTheDocument();
      });
    });
  });

  describe('ConditionalRender Component', () => {
    it('should render authenticated content when user is authenticated', async () => {
      vi.mocked(authService.isAuthenticated).mockReturnValue(true);
      vi.mocked(authService.getCurrentUser).mockResolvedValue(mockUser);
      vi.mocked(authService.getPermissions).mockResolvedValue(['user:basic']);

      renderWithAuth(
        <ConditionalRender
          authenticated={<div data-testid="auth-content">Authenticated</div>}
          unauthenticated={<div data-testid="unauth-content">Unauthenticated</div>}
        />
      );

      await waitFor(() => {
        expect(screen.getByTestId('auth-content')).toBeInTheDocument();
        expect(screen.queryByTestId('unauth-content')).not.toBeInTheDocument();
      });
    });

    it('should render unauthenticated content when user is not authenticated', async () => {
      vi.mocked(authService.isAuthenticated).mockReturnValue(false);

      renderWithAuth(
        <ConditionalRender
          authenticated={<div data-testid="auth-content">Authenticated</div>}
          unauthenticated={<div data-testid="unauth-content">Unauthenticated</div>}
        />
      );

      await waitFor(() => {
        expect(screen.getByTestId('unauth-content')).toBeInTheDocument();
        expect(screen.queryByTestId('auth-content')).not.toBeInTheDocument();
      });
    });

    it('should render loading content during authentication', async () => {
      vi.mocked(authService.isAuthenticated).mockReturnValue(true);
      vi.mocked(authService.getCurrentUser).mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve(mockUser), 100))
      );

      renderWithAuth(
        <ConditionalRender
          loading={<div data-testid="loading-content">Loading...</div>}
          authenticated={<div data-testid="auth-content">Authenticated</div>}
        />
      );

      expect(screen.getByTestId('loading-content')).toBeInTheDocument();
    });

    it('should render error content when there is an error', async () => {
      vi.mocked(authService.isAuthenticated).mockReturnValue(true);
      vi.mocked(authService.getCurrentUser).mockRejectedValue(new Error('Auth error'));

      renderWithAuth(
        <ConditionalRender
          error={<div data-testid="error-content">Error occurred</div>}
          authenticated={<div data-testid="auth-content">Authenticated</div>}
        />
      );

      await waitFor(() => {
        expect(screen.getByTestId('error-content')).toBeInTheDocument();
      });
    });
  });

  describe('Higher-Order Component', () => {
    it('should wrap component with protection', async () => {
      vi.mocked(authService.isAuthenticated).mockReturnValue(true);
      vi.mocked(authService.getCurrentUser).mockResolvedValue(mockAdminUser);
      vi.mocked(authService.getPermissions).mockResolvedValue(['admin:all']);

      const ProtectedComponent = withProtection(TestComponent, {
        requiredRole: 'ADMIN',
      });

      renderWithAuth(<ProtectedComponent />);

      await waitFor(() => {
        expect(screen.getByTestId('protected-content')).toBeInTheDocument();
      });
    });

    it('should deny access through HOC when unauthorized', async () => {
      vi.mocked(authService.isAuthenticated).mockReturnValue(true);
      vi.mocked(authService.getCurrentUser).mockResolvedValue(mockUser);
      vi.mocked(authService.getPermissions).mockResolvedValue(['user:basic']);

      const ProtectedComponent = withProtection(TestComponent, {
        requiredRole: 'ADMIN',
      });

      renderWithAuth(<ProtectedComponent />);

      await waitFor(() => {
        expect(screen.getByText('Access Denied')).toBeInTheDocument();
      });
    });
  });

  describe('User Refresh on Error', () => {
    it('should attempt to refresh user data on authentication error', async () => {
      const refreshUser = vi.fn();
      vi.mocked(authService.isAuthenticated).mockReturnValue(true);
      vi.mocked(authService.getCurrentUser)
        .mockRejectedValueOnce(new Error('Auth failed'))
        .mockResolvedValueOnce(mockUser);
      vi.mocked(authService.getPermissions).mockResolvedValue(['user:basic']);

      renderWithAuth(
        <ProtectedRoute>
          <TestComponent />
        </ProtectedRoute>
      );

      // Should show error initially
      await waitFor(() => {
        expect(screen.getByText('Authentication Error')).toBeInTheDocument();
      });
    });
  });
});