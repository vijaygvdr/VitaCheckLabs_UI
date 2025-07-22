// Protected Route Component for Authentication and Authorization

import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Box, CircularProgress, Alert, Typography, Button } from '@mui/material';
import { Lock, Warning, Error as ErrorIcon } from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  requiredPermissions?: string[];
  requiredRole?: string;
  fallbackPath?: string;
  loadingComponent?: React.ReactNode;
  unauthorizedComponent?: React.ReactNode;
  redirectOnAuth?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requireAuth = true,
  requiredPermissions = [],
  requiredRole,
  fallbackPath = '/auth/login',
  loadingComponent,
  unauthorizedComponent,
  redirectOnAuth = false,
}) => {
  const { state: authState, hasPermission, hasRole, refreshUser } = useAuth();
  const location = useLocation();
  const [isChecking, setIsChecking] = useState(true);
  const [permissionStatus, setPermissionStatus] = useState<{
    hasRequiredPermissions: boolean;
    hasRequiredRole: boolean;
    checkedPermissions: string[];
  }>({
    hasRequiredPermissions: true,
    hasRequiredRole: true,
    checkedPermissions: [],
  });

  // Check permissions and roles
  useEffect(() => {
    const checkAuthorization = async () => {
      if (!authState.isAuthenticated) {
        setIsChecking(false);
        return;
      }

      try {
        // Check required role
        let hasRequiredRole = true;
        if (requiredRole) {
          hasRequiredRole = hasRole(requiredRole);
        }

        // Check required permissions
        let hasRequiredPermissions = true;
        const checkedPermissions: string[] = [];
        
        if (requiredPermissions.length > 0) {
          for (const permission of requiredPermissions) {
            const hasPermissionResult = hasPermission(permission);
            checkedPermissions.push(permission);
            if (!hasPermissionResult) {
              hasRequiredPermissions = false;
              break;
            }
          }
        }

        setPermissionStatus({
          hasRequiredPermissions,
          hasRequiredRole,
          checkedPermissions,
        });
      } catch (error) {
        console.error('Authorization check failed:', error);
        setPermissionStatus({
          hasRequiredPermissions: false,
          hasRequiredRole: false,
          checkedPermissions: [],
        });
      } finally {
        setIsChecking(false);
      }
    };

    // Add small delay to prevent flashing
    const timer = setTimeout(checkAuthorization, 100);
    return () => clearTimeout(timer);
  }, [
    authState.isAuthenticated,
    authState.user,
    authState.permissions,
    requiredPermissions,
    requiredRole,
    hasPermission,
    hasRole,
  ]);

  // Refresh user data if authentication failed
  useEffect(() => {
    if (authState.error && requireAuth) {
      refreshUser();
    }
  }, [authState.error, requireAuth, refreshUser]);

  // Handle redirects when already authenticated
  if (redirectOnAuth && authState.isAuthenticated && !authState.isLoading) {
    return <Navigate to="/lab-tests" replace />;
  }

  // Show loading state
  if (authState.isLoading || isChecking) {
    if (loadingComponent) {
      return <>{loadingComponent}</>;
    }

    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '50vh',
          gap: 2,
        }}
      >
        <CircularProgress size={40} />
        <Typography variant="body2" color="text.secondary">
          Verifying access...
        </Typography>
      </Box>
    );
  }

  // Check authentication requirement
  console.log('ProtectedRoute: Checking authentication', {
    requireAuth,
    isAuthenticated: authState.isAuthenticated,
    isLoading: authState.isLoading,
    user: authState.user
  });
  
  if (requireAuth && !authState.isAuthenticated) {
    console.log('ProtectedRoute: User not authenticated, redirecting to login');
    return (
      <Navigate
        to={fallbackPath}
        state={{ from: location }}
        replace
      />
    );
  }

  // Check role and permission requirements
  if (authState.isAuthenticated) {
    const { hasRequiredPermissions, hasRequiredRole } = permissionStatus;

    if (!hasRequiredRole || !hasRequiredPermissions) {
      if (unauthorizedComponent) {
        return <>{unauthorizedComponent}</>;
      }

      return (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '50vh',
            padding: 4,
            textAlign: 'center',
          }}
        >
          <Lock
            sx={{
              fontSize: 64,
              color: 'warning.main',
              marginBottom: 2,
            }}
          />
          <Typography variant="h5" gutterBottom>
            Access Denied
          </Typography>
          <Typography variant="body1" color="text.secondary" paragraph>
            You don't have the required permissions to access this page.
          </Typography>
          
          {!hasRequiredRole && requiredRole && (
            <Alert severity="warning" sx={{ marginBottom: 2, maxWidth: 400 }}>
              <Typography variant="body2">
                <strong>Required Role:</strong> {requiredRole}
              </Typography>
              <Typography variant="body2">
                <strong>Your Role:</strong> {authState.user?.role || 'Unknown'}
              </Typography>
            </Alert>
          )}

          {!hasRequiredPermissions && requiredPermissions.length > 0 && (
            <Alert severity="warning" sx={{ marginBottom: 2, maxWidth: 400 }}>
              <Typography variant="body2">
                <strong>Required Permissions:</strong>
              </Typography>
              <ul style={{ margin: 0, paddingLeft: 20 }}>
                {requiredPermissions.map((permission) => (
                  <li key={permission}>
                    <Typography variant="body2">{permission}</Typography>
                  </li>
                ))}
              </ul>
            </Alert>
          )}

          <Box sx={{ display: 'flex', gap: 2, marginTop: 2 }}>
            <Button
              variant="outlined"
              onClick={() => window.history.back()}
            >
              Go Back
            </Button>
            <Button
              variant="contained"
              onClick={() => window.location.href = '/lab-tests'}
            >
              Go to Dashboard
            </Button>
          </Box>
        </Box>
      );
    }
  }

  // Show authentication error
  if (authState.error && requireAuth) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '50vh',
          padding: 4,
          textAlign: 'center',
        }}
      >
        <ErrorIcon
          sx={{
            fontSize: 64,
            color: 'error.main',
            marginBottom: 2,
          }}
        />
        <Typography variant="h5" gutterBottom>
          Authentication Error
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          There was a problem verifying your authentication.
        </Typography>
        
        <Alert severity="error" sx={{ marginBottom: 2, maxWidth: 400 }}>
          {authState.error.message}
        </Alert>

        <Box sx={{ display: 'flex', gap: 2, marginTop: 2 }}>
          <Button
            variant="outlined"
            onClick={() => window.location.reload()}
          >
            Retry
          </Button>
          <Button
            variant="contained"
            onClick={() => window.location.href = '/auth/login'}
          >
            Login Again
          </Button>
        </Box>
      </Box>
    );
  }

  // Render children if all checks pass
  return <>{children}</>;
};

// Higher-order component for protecting routes
export const withProtection = (
  Component: React.ComponentType<any>,
  protectionOptions?: Omit<ProtectedRouteProps, 'children'>
) => {
  return (props: any) => (
    <ProtectedRoute {...protectionOptions}>
      <Component {...props} />
    </ProtectedRoute>
  );
};

// Specific protection components for common use cases
export const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ProtectedRoute requiredRole="ADMIN">
    {children}
  </ProtectedRoute>
);

export const LabTechnicianRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ProtectedRoute requiredRole="LAB_TECHNICIAN">
    {children}
  </ProtectedRoute>
);

export const UserRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ProtectedRoute requireAuth={true}>
    {children}
  </ProtectedRoute>
);

export const GuestRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ProtectedRoute requireAuth={false} redirectOnAuth={true}>
    {children}
  </ProtectedRoute>
);

// Permission-based protection
interface PermissionRouteProps {
  children: React.ReactNode;
  permissions: string[];
  requireAll?: boolean;
}

export const PermissionRoute: React.FC<PermissionRouteProps> = ({
  children,
  permissions,
  requireAll = true,
}) => {
  const { hasPermission } = useAuth();
  const [hasAccess, setHasAccess] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkPermissions = () => {
      if (requireAll) {
        // User must have ALL permissions
        const hasAllPermissions = permissions.every(permission => hasPermission(permission));
        setHasAccess(hasAllPermissions);
      } else {
        // User must have at least ONE permission
        const hasAnyPermission = permissions.some(permission => hasPermission(permission));
        setHasAccess(hasAnyPermission);
      }
      setIsChecking(false);
    };

    checkPermissions();
  }, [permissions, requireAll, hasPermission]);

  if (isChecking) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', padding: 2 }}>
        <CircularProgress size={24} />
      </Box>
    );
  }

  if (!hasAccess) {
    return (
      <Alert severity="warning" sx={{ margin: 2 }}>
        <Typography variant="body2">
          You don't have permission to access this content.
        </Typography>
        <Typography variant="caption" display="block">
          Required permissions: {permissions.join(', ')}
        </Typography>
      </Alert>
    );
  }

  return <>{children}</>;
};

// Conditional rendering based on authentication state
interface ConditionalRenderProps {
  authenticated?: React.ReactNode;
  unauthenticated?: React.ReactNode;
  loading?: React.ReactNode;
  error?: React.ReactNode;
}

export const ConditionalRender: React.FC<ConditionalRenderProps> = ({
  authenticated,
  unauthenticated,
  loading,
  error,
}) => {
  const { state: authState } = useAuth();

  if (authState.isLoading && loading) {
    return <>{loading}</>;
  }

  if (authState.error && error) {
    return <>{error}</>;
  }

  if (authState.isAuthenticated && authenticated) {
    return <>{authenticated}</>;
  }

  if (!authState.isAuthenticated && unauthenticated) {
    return <>{unauthenticated}</>;
  }

  return null;
};

export default ProtectedRoute;