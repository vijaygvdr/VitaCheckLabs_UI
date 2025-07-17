import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import authService from '../authService';
import { apiUtils, tokenManager, apiCache } from '../api';
import { AuthResponse, User, UserLogin, UserRegister } from '../../types/api';

// Mock dependencies
vi.mock('../api', () => ({
  apiUtils: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
  },
  tokenManager: {
    getAccessToken: vi.fn(),
    getRefreshToken: vi.fn(),
    setTokens: vi.fn(),
    removeTokens: vi.fn(),
    isTokenExpired: vi.fn(),
  },
  apiCache: {
    get: vi.fn(),
    set: vi.fn(),
    clear: vi.fn(),
  },
  retryRequest: vi.fn(),
}));

describe('AuthService', () => {
  const mockUser: User = {
    id: '1',
    username: 'testuser',
    email: 'test@example.com',
    first_name: 'Test',
    last_name: 'User',
    role: 'USER',
    is_active: true,
    is_verified: true,
    created_at: '2023-01-01T00:00:00Z',
    updated_at: '2023-01-01T00:00:00Z',
  };

  const mockAuthResponse: AuthResponse = {
    user: mockUser,
    access_token: 'access-token',
    refresh_token: 'refresh-token',
    token_type: 'Bearer',
    expires_in: 3600,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('register', () => {
    it('should register a new user successfully', async () => {
      const registerData: UserRegister = {
        username: 'newuser',
        email: 'newuser@example.com',
        password: 'password123',
        first_name: 'New',
        last_name: 'User',
      };

      (apiUtils.post as any).mockResolvedValue(mockAuthResponse);

      const result = await authService.register(registerData);

      expect(result).toEqual(mockAuthResponse);
      expect(apiUtils.post).toHaveBeenCalledWith('/auth/register', registerData);
      expect(tokenManager.setTokens).toHaveBeenCalledWith('access-token', 'refresh-token');
    });

    it('should handle registration errors', async () => {
      const registerData: UserRegister = {
        username: 'newuser',
        email: 'newuser@example.com',
        password: 'password123',
        first_name: 'New',
        last_name: 'User',
      };

      const error = { message: 'Registration failed', status: 400 };
      (apiUtils.post as any).mockRejectedValue(error);

      await expect(authService.register(registerData)).rejects.toEqual(error);
    });
  });

  describe('login', () => {
    it('should login successfully', async () => {
      const credentials: UserLogin = {
        username: 'testuser',
        password: 'password123',
      };

      const mockRetryRequest = vi.fn().mockResolvedValue(mockAuthResponse);
      (vi.mocked(require('../api').retryRequest) as any).mockImplementation(mockRetryRequest);

      const result = await authService.login(credentials);

      expect(result).toEqual(mockAuthResponse);
      expect(mockRetryRequest).toHaveBeenCalled();
      expect(tokenManager.setTokens).toHaveBeenCalledWith('access-token', 'refresh-token');
      expect(apiCache.set).toHaveBeenCalledWith('current_user', mockUser, 3600000);
    });

    it('should handle login errors', async () => {
      const credentials: UserLogin = {
        username: 'testuser',
        password: 'wrongpassword',
      };

      const error = { message: 'Invalid credentials', status: 401 };
      const mockRetryRequest = vi.fn().mockRejectedValue(error);
      (vi.mocked(require('../api').retryRequest) as any).mockImplementation(mockRetryRequest);

      await expect(authService.login(credentials)).rejects.toEqual(error);
    });
  });

  describe('logout', () => {
    it('should logout successfully', async () => {
      (apiUtils.post as any).mockResolvedValue({});

      await authService.logout();

      expect(apiUtils.post).toHaveBeenCalledWith('/auth/logout');
      expect(tokenManager.removeTokens).toHaveBeenCalled();
      expect(apiCache.clear).toHaveBeenCalled();
    });

    it('should clear tokens even if logout API fails', async () => {
      (apiUtils.post as any).mockRejectedValue(new Error('Logout failed'));

      await authService.logout();

      expect(tokenManager.removeTokens).toHaveBeenCalled();
      expect(apiCache.clear).toHaveBeenCalled();
    });
  });

  describe('refreshToken', () => {
    it('should refresh token successfully', async () => {
      (tokenManager.getRefreshToken as any).mockReturnValue('refresh-token');
      (apiUtils.post as any).mockResolvedValue(mockAuthResponse);

      const result = await authService.refreshToken();

      expect(result).toEqual(mockAuthResponse);
      expect(apiUtils.post).toHaveBeenCalledWith('/auth/refresh', {
        refresh_token: 'refresh-token',
      });
      expect(tokenManager.setTokens).toHaveBeenCalledWith('access-token', 'refresh-token');
    });

    it('should handle missing refresh token', async () => {
      (tokenManager.getRefreshToken as any).mockReturnValue(null);

      await expect(authService.refreshToken()).rejects.toThrow('No refresh token available');
    });

    it('should clear tokens on refresh failure', async () => {
      (tokenManager.getRefreshToken as any).mockReturnValue('refresh-token');
      (apiUtils.post as any).mockRejectedValue(new Error('Refresh failed'));

      await expect(authService.refreshToken()).rejects.toThrow('Refresh failed');
      expect(tokenManager.removeTokens).toHaveBeenCalled();
    });
  });

  describe('getCurrentUser', () => {
    it('should return cached user', async () => {
      (apiCache.get as any).mockReturnValue(mockUser);

      const result = await authService.getCurrentUser();

      expect(result).toEqual(mockUser);
      expect(apiUtils.get).not.toHaveBeenCalled();
    });

    it('should fetch user from API when not cached', async () => {
      (apiCache.get as any).mockReturnValue(null);
      (apiUtils.get as any).mockResolvedValue(mockUser);

      const result = await authService.getCurrentUser();

      expect(result).toEqual(mockUser);
      expect(apiUtils.get).toHaveBeenCalledWith('/auth/me');
      expect(apiCache.set).toHaveBeenCalledWith('current_user', mockUser, 3600000);
    });
  });

  describe('changePassword', () => {
    it('should change password successfully', async () => {
      const passwordData = {
        current_password: 'oldpassword',
        new_password: 'newpassword',
      };

      const mockResponse = { data: null, message: 'Password changed successfully', success: true };
      (apiUtils.put as any).mockResolvedValue(mockResponse);

      const result = await authService.changePassword(passwordData);

      expect(result).toEqual(mockResponse);
      expect(apiUtils.put).toHaveBeenCalledWith('/auth/change-password', passwordData);
    });
  });

  describe('verifyToken', () => {
    it('should verify token successfully', async () => {
      (apiUtils.get as any).mockResolvedValue({ valid: true });

      const result = await authService.verifyToken();

      expect(result).toBe(true);
      expect(apiUtils.get).toHaveBeenCalledWith('/auth/verify-token');
    });

    it('should handle token verification failure', async () => {
      (apiUtils.get as any).mockRejectedValue(new Error('Token invalid'));

      const result = await authService.verifyToken();

      expect(result).toBe(false);
    });
  });

  describe('isAuthenticated', () => {
    it('should return true when token exists and is valid', () => {
      (tokenManager.getAccessToken as any).mockReturnValue('valid-token');
      (tokenManager.isTokenExpired as any).mockReturnValue(false);

      const result = authService.isAuthenticated();

      expect(result).toBe(true);
    });

    it('should return false when no token exists', () => {
      (tokenManager.getAccessToken as any).mockReturnValue(null);

      const result = authService.isAuthenticated();

      expect(result).toBe(false);
    });

    it('should return false when token is expired', () => {
      (tokenManager.getAccessToken as any).mockReturnValue('expired-token');
      (tokenManager.isTokenExpired as any).mockReturnValue(true);

      const result = authService.isAuthenticated();

      expect(result).toBe(false);
    });
  });

  describe('hasRole', () => {
    it('should return true for matching role', async () => {
      (apiCache.get as any).mockReturnValue(null);
      (apiUtils.get as any).mockResolvedValue(mockUser);

      const result = await authService.hasRole('USER');

      expect(result).toBe(true);
    });

    it('should return false for non-matching role', async () => {
      (apiCache.get as any).mockReturnValue(null);
      (apiUtils.get as any).mockResolvedValue(mockUser);

      const result = await authService.hasRole('ADMIN');

      expect(result).toBe(false);
    });

    it('should return false on error', async () => {
      (apiCache.get as any).mockReturnValue(null);
      (apiUtils.get as any).mockRejectedValue(new Error('User not found'));

      const result = await authService.hasRole('USER');

      expect(result).toBe(false);
    });
  });

  describe('isAdmin', () => {
    it('should return true for admin user', async () => {
      const adminUser = { ...mockUser, role: 'ADMIN' as const };
      (apiCache.get as any).mockReturnValue(null);
      (apiUtils.get as any).mockResolvedValue(adminUser);

      const result = await authService.isAdmin();

      expect(result).toBe(true);
    });

    it('should return false for non-admin user', async () => {
      (apiCache.get as any).mockReturnValue(null);
      (apiUtils.get as any).mockResolvedValue(mockUser);

      const result = await authService.isAdmin();

      expect(result).toBe(false);
    });
  });

  describe('isLabTechnician', () => {
    it('should return true for lab technician user', async () => {
      const labTechUser = { ...mockUser, role: 'LAB_TECHNICIAN' as const };
      (apiCache.get as any).mockReturnValue(null);
      (apiUtils.get as any).mockResolvedValue(labTechUser);

      const result = await authService.isLabTechnician();

      expect(result).toBe(true);
    });

    it('should return false for non-lab technician user', async () => {
      (apiCache.get as any).mockReturnValue(null);
      (apiUtils.get as any).mockResolvedValue(mockUser);

      const result = await authService.isLabTechnician();

      expect(result).toBe(false);
    });
  });

  describe('getPermissions', () => {
    it('should return admin permissions', async () => {
      const adminUser = { ...mockUser, role: 'ADMIN' as const };
      (apiCache.get as any).mockReturnValue(null);
      (apiUtils.get as any).mockResolvedValue(adminUser);

      const result = await authService.getPermissions();

      expect(result).toContain('create_lab_test');
      expect(result).toContain('manage_users');
      expect(result).toContain('view_analytics');
    });

    it('should return lab technician permissions', async () => {
      const labTechUser = { ...mockUser, role: 'LAB_TECHNICIAN' as const };
      (apiCache.get as any).mockReturnValue(null);
      (apiUtils.get as any).mockResolvedValue(labTechUser);

      const result = await authService.getPermissions();

      expect(result).toContain('view_lab_tests');
      expect(result).toContain('update_lab_test');
      expect(result).toContain('process_reports');
    });

    it('should return user permissions', async () => {
      (apiCache.get as any).mockReturnValue(null);
      (apiUtils.get as any).mockResolvedValue(mockUser);

      const result = await authService.getPermissions();

      expect(result).toContain('view_lab_tests');
      expect(result).toContain('book_lab_test');
      expect(result).toContain('view_own_reports');
    });
  });

  describe('hasPermission', () => {
    it('should return true for valid permission', async () => {
      (apiCache.get as any).mockReturnValue(null);
      (apiUtils.get as any).mockResolvedValue(mockUser);

      const result = await authService.hasPermission('view_lab_tests');

      expect(result).toBe(true);
    });

    it('should return false for invalid permission', async () => {
      (apiCache.get as any).mockReturnValue(null);
      (apiUtils.get as any).mockResolvedValue(mockUser);

      const result = await authService.hasPermission('create_lab_test');

      expect(result).toBe(false);
    });
  });

  describe('getAuthHeaders', () => {
    it('should return auth headers with token', () => {
      (tokenManager.getAccessToken as any).mockReturnValue('test-token');

      const headers = authService.getAuthHeaders();

      expect(headers).toEqual({
        'Authorization': 'Bearer test-token',
      });
    });

    it('should return empty headers without token', () => {
      (tokenManager.getAccessToken as any).mockReturnValue(null);

      const headers = authService.getAuthHeaders();

      expect(headers).toEqual({});
    });
  });

  describe('updateProfile', () => {
    it('should update profile successfully', async () => {
      const profileData = { first_name: 'Updated', last_name: 'Name' };
      const updatedUser = { ...mockUser, ...profileData };
      (apiUtils.put as any).mockResolvedValue(updatedUser);

      const result = await authService.updateProfile(profileData);

      expect(result).toEqual(updatedUser);
      expect(apiUtils.put).toHaveBeenCalledWith('/auth/profile', profileData);
      expect(apiCache.set).toHaveBeenCalledWith('current_user', updatedUser, 3600000);
    });
  });
});