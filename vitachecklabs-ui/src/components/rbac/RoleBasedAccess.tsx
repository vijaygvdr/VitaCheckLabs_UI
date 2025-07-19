// Role-Based Access Control Components

import React, { ReactNode } from 'react';
import { Alert, Box, Typography, Button } from '@mui/material';
import { Lock, Warning, Error as ErrorIcon } from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';

// Base interface for RBAC props
interface RBACProps {
  children: ReactNode;
  fallback?: ReactNode;
  showFallback?: boolean;
}

// Role-based access interface
interface RoleAccessProps extends RBACProps {
  roles: string | string[];
  requireAll?: boolean;
}

// Permission-based access interface
interface PermissionAccessProps extends RBACProps {
  permissions: string | string[];
  requireAll?: boolean;
}

// Admin access interface
interface AdminAccessProps extends RBACProps {}

// User access interface
interface UserAccessProps extends RBACProps {}

// Lab technician access interface
interface LabTechnicianAccessProps extends RBACProps {}

// Conditional access based on authentication state
interface ConditionalAccessProps {
  authenticated?: ReactNode;
  unauthenticated?: ReactNode;
  loading?: ReactNode;
  error?: ReactNode;
}

// Default fallback component
const DefaultFallback: React.FC<{ type: 'role' | 'permission' | 'auth'; message?: string }> = ({ 
  type, 
  message 
}) => (
  <Alert 
    severity="warning" 
    sx={{ 
      display: 'flex', 
      alignItems: 'center',
      margin: 2 
    }}
  >
    <Lock sx={{ mr: 1 }} />
    <Typography variant="body2">
      {message || `You don't have the required ${type}s to access this content.`}
    </Typography>
  </Alert>
);

// Role-based access component
export const RoleAccess: React.FC<RoleAccessProps> = ({
  children,
  roles,
  requireAll = false,
  fallback,
  showFallback = true,
}) => {
  const { state: authState, hasRole } = useAuth();

  // If not authenticated, show auth fallback
  if (!authState.isAuthenticated) {
    if (showFallback) {
      return fallback || <DefaultFallback type="auth" message="Please log in to access this content." />;
    }
    return null;
  }

  // Normalize roles to array
  const rolesArray = Array.isArray(roles) ? roles : [roles];

  // Check role access
  const hasAccess = requireAll
    ? rolesArray.every(role => hasRole(role))
    : rolesArray.some(role => hasRole(role));

  if (!hasAccess) {
    if (showFallback) {
      return fallback || <DefaultFallback type="role" />;
    }
    return null;
  }

  return <>{children}</>;
};

// Permission-based access component
export const PermissionAccess: React.FC<PermissionAccessProps> = ({
  children,
  permissions,
  requireAll = true,
  fallback,
  showFallback = true,
}) => {
  const { state: authState, hasPermission } = useAuth();

  // If not authenticated, show auth fallback
  if (!authState.isAuthenticated) {
    if (showFallback) {
      return fallback || <DefaultFallback type="auth" message="Please log in to access this content." />;
    }
    return null;
  }

  // Normalize permissions to array
  const permissionsArray = Array.isArray(permissions) ? permissions : [permissions];

  // Check permission access
  const hasAccess = requireAll
    ? permissionsArray.every(permission => hasPermission(permission))
    : permissionsArray.some(permission => hasPermission(permission));

  if (!hasAccess) {
    if (showFallback) {
      return fallback || <DefaultFallback type="permission" />;
    }
    return null;
  }

  return <>{children}</>;
};

// Admin-only access component
export const AdminAccess: React.FC<AdminAccessProps> = ({
  children,
  fallback,
  showFallback = true,
}) => {
  return (
    <RoleAccess 
      roles="ADMIN" 
      fallback={fallback} 
      showFallback={showFallback}
    >
      {children}
    </RoleAccess>
  );
};

// User access component (any authenticated user)
export const UserAccess: React.FC<UserAccessProps> = ({
  children,
  fallback,
  showFallback = true,
}) => {
  const { state: authState } = useAuth();

  if (!authState.isAuthenticated) {
    if (showFallback) {
      return fallback || <DefaultFallback type="auth" message="Please log in to access this content." />;
    }
    return null;
  }

  return <>{children}</>;
};

// Lab technician access component
export const LabTechnicianAccess: React.FC<LabTechnicianAccessProps> = ({
  children,
  fallback,
  showFallback = true,
}) => {
  return (
    <RoleAccess 
      roles="LAB_TECHNICIAN" 
      fallback={fallback} 
      showFallback={showFallback}
    >
      {children}
    </RoleAccess>
  );
};

// Multiple role access component
export const MultiRoleAccess: React.FC<RoleAccessProps> = ({
  children,
  roles,
  requireAll = false,
  fallback,
  showFallback = true,
}) => {
  return (
    <RoleAccess 
      roles={roles}
      requireAll={requireAll}
      fallback={fallback}
      showFallback={showFallback}
    >
      {children}
    </RoleAccess>
  );
};

// Conditional rendering based on authentication state
export const ConditionalAccess: React.FC<ConditionalAccessProps> = ({
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

// Higher-order component for role-based access
export const withRoleAccess = <P extends object>(
  Component: React.ComponentType<P>,
  roles: string | string[],
  options: {
    requireAll?: boolean;
    fallback?: ReactNode;
    showFallback?: boolean;
  } = {}
) => {
  const { requireAll = false, fallback, showFallback = true } = options;

  return (props: P) => (
    <RoleAccess
      roles={roles}
      requireAll={requireAll}
      fallback={fallback}
      showFallback={showFallback}
    >
      <Component {...props} />
    </RoleAccess>
  );
};

// Higher-order component for permission-based access
export const withPermissionAccess = <P extends object>(
  Component: React.ComponentType<P>,
  permissions: string | string[],
  options: {
    requireAll?: boolean;
    fallback?: ReactNode;
    showFallback?: boolean;
  } = {}
) => {
  const { requireAll = true, fallback, showFallback = true } = options;

  return (props: P) => (
    <PermissionAccess
      permissions={permissions}
      requireAll={requireAll}
      fallback={fallback}
      showFallback={showFallback}
    >
      <Component {...props} />
    </PermissionAccess>
  );
};

// RBAC utility hooks
export const useRoleCheck = () => {
  const { hasRole, isAdmin, isLabTechnician } = useAuth();

  const checkRole = (role: string): boolean => hasRole(role);
  const checkRoles = (roles: string[], requireAll = false): boolean => {
    return requireAll 
      ? roles.every(role => hasRole(role))
      : roles.some(role => hasRole(role));
  };

  return {
    checkRole,
    checkRoles,
    isAdmin,
    isLabTechnician,
    hasRole,
  };
};

export const usePermissionCheck = () => {
  const { hasPermission, checkPermission } = useAuth();

  const checkPermissions = (permissions: string[], requireAll = true): boolean => {
    return requireAll
      ? permissions.every(permission => hasPermission(permission))
      : permissions.some(permission => hasPermission(permission));
  };

  return {
    hasPermission,
    checkPermission,
    checkPermissions,
  };
};

// Predefined permission constants
export const PERMISSIONS = {
  // User management
  USER_CREATE: 'user:create',
  USER_READ: 'user:read',
  USER_UPDATE: 'user:update',
  USER_DELETE: 'user:delete',

  // Lab test management
  TEST_CREATE: 'test:create',
  TEST_READ: 'test:read',
  TEST_UPDATE: 'test:update',
  TEST_DELETE: 'test:delete',
  TEST_BOOK: 'test:book',

  // Report management
  REPORT_CREATE: 'report:create',
  REPORT_READ: 'report:read',
  REPORT_UPDATE: 'report:update',
  REPORT_DELETE: 'report:delete',
  REPORT_SHARE: 'report:share',

  // Company management
  COMPANY_UPDATE: 'company:update',
  COMPANY_READ: 'company:read',

  // Admin operations
  ADMIN_DASHBOARD: 'admin:dashboard',
  ADMIN_ANALYTICS: 'admin:analytics',
  ADMIN_SETTINGS: 'admin:settings',

  // Lab technician operations
  LAB_PROCESS: 'lab:process',
  LAB_UPLOAD: 'lab:upload',
  LAB_APPROVE: 'lab:approve',
} as const;

// Predefined role constants
export const ROLES = {
  ADMIN: 'ADMIN',
  USER: 'USER',
  LAB_TECHNICIAN: 'LAB_TECHNICIAN',
} as const;

// Permission groups for common use cases
export const PERMISSION_GROUPS = {
  USER_MANAGEMENT: [
    PERMISSIONS.USER_CREATE,
    PERMISSIONS.USER_READ,
    PERMISSIONS.USER_UPDATE,
    PERMISSIONS.USER_DELETE,
  ],
  TEST_MANAGEMENT: [
    PERMISSIONS.TEST_CREATE,
    PERMISSIONS.TEST_READ,
    PERMISSIONS.TEST_UPDATE,
    PERMISSIONS.TEST_DELETE,
  ],
  REPORT_MANAGEMENT: [
    PERMISSIONS.REPORT_CREATE,
    PERMISSIONS.REPORT_READ,
    PERMISSIONS.REPORT_UPDATE,
    PERMISSIONS.REPORT_DELETE,
  ],
  LAB_OPERATIONS: [
    PERMISSIONS.LAB_PROCESS,
    PERMISSIONS.LAB_UPLOAD,
    PERMISSIONS.LAB_APPROVE,
  ],
} as const;

// Component for debugging RBAC (development only)
export const RBACDebugger: React.FC = () => {
  const { state: authState, hasRole, hasPermission } = useAuth();

  if (import.meta.env.MODE !== 'development') {
    return null;
  }

  return (
    <Box
      sx={{
        position: 'fixed',
        bottom: 16,
        right: 16,
        backgroundColor: 'background.paper',
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 1,
        padding: 2,
        maxWidth: 300,
        fontSize: '0.75rem',
        zIndex: 9999,
      }}
    >
      <Typography variant="caption" sx={{ fontWeight: 'bold' }}>
        RBAC Debugger
      </Typography>
      <Typography variant="caption" display="block">
        User: {authState.user?.username || 'None'}
      </Typography>
      <Typography variant="caption" display="block">
        Role: {authState.user?.role || 'None'}
      </Typography>
      <Typography variant="caption" display="block">
        Permissions: {authState.permissions.length}
      </Typography>
      <Typography variant="caption" display="block">
        Admin: {hasRole(ROLES.ADMIN) ? 'Yes' : 'No'}
      </Typography>
      <Typography variant="caption" display="block">
        Lab Tech: {hasRole(ROLES.LAB_TECHNICIAN) ? 'Yes' : 'No'}
      </Typography>
    </Box>
  );
};

export default {
  RoleAccess,
  PermissionAccess,
  AdminAccess,
  UserAccess,
  LabTechnicianAccess,
  MultiRoleAccess,
  ConditionalAccess,
  withRoleAccess,
  withPermissionAccess,
  useRoleCheck,
  usePermissionCheck,
  PERMISSIONS,
  ROLES,
  PERMISSION_GROUPS,
  RBACDebugger,
};