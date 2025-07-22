// Authentication Context Provider

import React, { createContext, useContext, useReducer, useEffect, useCallback, ReactNode } from 'react';
import { authService } from '../services/authService';
import { 
  User, 
  UserLogin, 
  UserRegister, 
  ChangePassword, 
  AuthResponse,
  ApiError 
} from '../types/api';

// Authentication state interface
export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: ApiError | null;
  permissions: string[];
  lastActivity: Date | null;
}

// Authentication actions
export type AuthAction =
  | { type: 'AUTH_START' }
  | { type: 'AUTH_SUCCESS'; payload: { user: User; permissions: string[] } }
  | { type: 'AUTH_FAILURE'; payload: ApiError }
  | { type: 'AUTH_LOGOUT' }
  | { type: 'AUTH_CLEAR_ERROR' }
  | { type: 'AUTH_UPDATE_USER'; payload: User }
  | { type: 'AUTH_UPDATE_ACTIVITY' }
  | { type: 'AUTH_SET_PERMISSIONS'; payload: string[] };

// Initial state
const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
  permissions: [],
  lastActivity: null,
};

// Authentication reducer
const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'AUTH_START':
      return {
        ...state,
        isLoading: true,
        error: null,
      };

    case 'AUTH_SUCCESS':
      return {
        ...state,
        user: action.payload.user,
        permissions: action.payload.permissions,
        isAuthenticated: true,
        isLoading: false,
        error: null,
        lastActivity: new Date(),
      };

    case 'AUTH_FAILURE':
      return {
        ...state,
        user: null,
        permissions: [],
        isAuthenticated: false,
        isLoading: false,
        error: action.payload,
        lastActivity: null,
      };

    case 'AUTH_LOGOUT':
      return {
        ...initialState,
      };

    case 'AUTH_CLEAR_ERROR':
      return {
        ...state,
        error: null,
      };

    case 'AUTH_UPDATE_USER':
      return {
        ...state,
        user: action.payload,
        lastActivity: new Date(),
      };

    case 'AUTH_UPDATE_ACTIVITY':
      return {
        ...state,
        lastActivity: new Date(),
      };

    case 'AUTH_SET_PERMISSIONS':
      return {
        ...state,
        permissions: action.payload,
      };

    default:
      return state;
  }
};

// Authentication context interface
export interface AuthContextType {
  // State
  state: AuthState;
  
  // Actions
  login: (credentials: UserLogin) => Promise<User>;
  register: (userData: UserRegister) => Promise<User>;
  logout: () => Promise<void>;
  changePassword: (passwordData: ChangePassword) => Promise<void>;
  updateProfile: (profileData: Partial<User>) => Promise<User>;
  clearError: () => void;
  refreshUser: () => Promise<void>;
  
  // Utility functions
  hasPermission: (permission: string) => boolean;
  hasRole: (role: string) => boolean;
  isAdmin: () => boolean;
  isLabTechnician: () => boolean;
  checkPermission: (permission: string) => Promise<boolean>;
  getTimeUntilExpiry: () => number | null;
  isSessionExpiring: () => boolean;
}

// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Authentication provider props
interface AuthProviderProps {
  children: ReactNode;
  autoRefresh?: boolean;
  sessionTimeout?: number; // in minutes
  warningTime?: number; // in minutes before expiry
}

// Authentication provider component
export const AuthProvider: React.FC<AuthProviderProps> = ({
  children,
  autoRefresh = true,
  sessionTimeout = 30,
  warningTime = 5,
}) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Initialize authentication state on mount
  useEffect(() => {
    const initializeAuth = async () => {
      if (authService.isAuthenticated()) {
        dispatch({ type: 'AUTH_START' });
        try {
          const user = await authService.getCurrentUser();
          const permissions = await authService.getPermissions();
          dispatch({
            type: 'AUTH_SUCCESS',
            payload: { user, permissions },
          });
        } catch (error) {
          dispatch({
            type: 'AUTH_FAILURE',
            payload: error as ApiError,
          });
        }
      }
    };

    initializeAuth();
  }, []);

  // Logout function
  const logout = useCallback(async (): Promise<void> => {
    try {
      await authService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      dispatch({ type: 'AUTH_LOGOUT' });
    }
  }, []);

  // Get time until token expiry
  const getTimeUntilExpiry = useCallback((): number | null => {
    if (!state.isAuthenticated || !state.lastActivity) return null;
    
    const expiryTime = new Date(state.lastActivity.getTime() + sessionTimeout * 60 * 1000);
    const timeUntilExpiry = expiryTime.getTime() - Date.now();
    
    return Math.max(0, timeUntilExpiry);
  }, [state.isAuthenticated, state.lastActivity, sessionTimeout]);

  // Auto-refresh token before expiry
  useEffect(() => {
    if (!autoRefresh || !state.isAuthenticated) return;

    const interval = setInterval(async () => {
      try {
        // Check if token needs refresh
        const timeUntilExpiry = getTimeUntilExpiry();
        if (timeUntilExpiry !== null && timeUntilExpiry < 5 * 60 * 1000) { // 5 minutes
          await authService.refreshToken();
          dispatch({ type: 'AUTH_UPDATE_ACTIVITY' });
        }
      } catch (error) {
        console.error('Token refresh failed:', error);
        await logout();
      }
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [state.isAuthenticated, autoRefresh, getTimeUntilExpiry, logout]);

  // Session timeout handling
  useEffect(() => {
    if (!state.isAuthenticated || !state.lastActivity) return;

    const timeout = setTimeout(() => {
      logout();
    }, sessionTimeout * 60 * 1000);

    return () => clearTimeout(timeout);
  }, [state.lastActivity, sessionTimeout, state.isAuthenticated, logout]);

  // Activity tracking
  useEffect(() => {
    if (!state.isAuthenticated) return;

    const handleActivity = () => {
      dispatch({ type: 'AUTH_UPDATE_ACTIVITY' });
    };

    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    events.forEach(event => {
      document.addEventListener(event, handleActivity, true);
    });

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleActivity, true);
      });
    };
  }, [state.isAuthenticated]);

  // Login function
  const login = async (credentials: UserLogin): Promise<User> => {
    console.log('AuthContext: Starting login process');
    dispatch({ type: 'AUTH_START' });
    try {
      const response: AuthResponse = await authService.login(credentials);
      console.log('AuthContext: Login response received:', response);
      const permissions = await authService.getPermissions();
      console.log('AuthContext: Permissions fetched:', permissions);
      
      dispatch({
        type: 'AUTH_SUCCESS',
        payload: { user: response.user, permissions },
      });
      console.log('AuthContext: AUTH_SUCCESS dispatched');
      
      return response.user;
    } catch (error) {
      console.error('AuthContext: Login failed:', error);
      dispatch({
        type: 'AUTH_FAILURE',
        payload: error as ApiError,
      });
      throw error;
    }
  };

  // Register function
  const register = async (userData: UserRegister): Promise<User> => {
    dispatch({ type: 'AUTH_START' });
    try {
      const response: AuthResponse = await authService.register(userData);
      const permissions = await authService.getPermissions();
      
      dispatch({
        type: 'AUTH_SUCCESS',
        payload: { user: response.user, permissions },
      });
      
      return response.user;
    } catch (error) {
      dispatch({
        type: 'AUTH_FAILURE',
        payload: error as ApiError,
      });
      throw error;
    }
  };

  // Change password function
  const changePassword = async (passwordData: ChangePassword): Promise<void> => {
    try {
      await authService.changePassword(passwordData);
    } catch (error) {
      throw error;
    }
  };

  // Update profile function
  const updateProfile = async (profileData: Partial<User>): Promise<User> => {
    try {
      const updatedUser = await authService.updateProfile(profileData);
      dispatch({ type: 'AUTH_UPDATE_USER', payload: updatedUser });
      return updatedUser;
    } catch (error) {
      throw error;
    }
  };

  // Clear error function
  const clearError = (): void => {
    dispatch({ type: 'AUTH_CLEAR_ERROR' });
  };

  // Refresh user data
  const refreshUser = async (): Promise<void> => {
    if (!state.isAuthenticated) return;
    
    try {
      const user = await authService.getCurrentUser();
      const permissions = await authService.getPermissions();
      dispatch({
        type: 'AUTH_SUCCESS',
        payload: { user, permissions },
      });
    } catch (error) {
      dispatch({
        type: 'AUTH_FAILURE',
        payload: error as ApiError,
      });
    }
  };

  // Check if user has specific permission
  const hasPermission = (permission: string): boolean => {
    return state.permissions.includes(permission);
  };

  // Check if user has specific role
  const hasRole = (role: string): boolean => {
    return state.user?.role === role;
  };

  // Check if user is admin
  const isAdmin = (): boolean => {
    return hasRole('ADMIN');
  };

  // Check if user is lab technician
  const isLabTechnician = (): boolean => {
    return hasRole('LAB_TECHNICIAN');
  };

  // Async permission check (fetches latest permissions)
  const checkPermission = async (permission: string): Promise<boolean> => {
    try {
      const hasPermissionResult = await authService.hasPermission(permission);
      return hasPermissionResult;
    } catch (error) {
      console.error('Permission check failed:', error);
      return false;
    }
  };

  // Check if session is expiring soon
  const isSessionExpiring = useCallback((): boolean => {
    const timeUntilExpiry = getTimeUntilExpiry();
    if (timeUntilExpiry === null) return false;
    
    return timeUntilExpiry < warningTime * 60 * 1000;
  }, [getTimeUntilExpiry, warningTime]);

  // Context value
  const contextValue: AuthContextType = {
    state,
    login,
    register,
    logout,
    changePassword,
    updateProfile,
    clearError,
    refreshUser,
    hasPermission,
    hasRole,
    isAdmin,
    isLabTechnician,
    checkPermission,
    getTimeUntilExpiry,
    isSessionExpiring,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use authentication context
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Higher-order component for authentication
export const withAuth = <P extends object>(
  Component: React.ComponentType<P>
): React.FC<P> => {
  return (props: P) => {
    const auth = useAuth();
    return <Component {...props} auth={auth} />;
  };
};

export default AuthContext;