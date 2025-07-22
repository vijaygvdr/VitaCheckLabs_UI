// Authentication Service Integration

import { 
  apiUtils, 
  tokenManager, 
  apiCache, 
  retryRequest 
} from './api';
import {
  AuthResponse,
  User,
  UserLogin,
  UserRegister,
  TokenRefresh,
  ChangePassword,
  ApiResponse
} from '../types/api';

// Authentication service class
class AuthService {
  private readonly baseUrl = '/auth';

  /**
   * Register a new user account
   */
  async register(userData: UserRegister): Promise<AuthResponse> {
    try {
      const response = await apiUtils.post<AuthResponse>(
        `${this.baseUrl}/register`,
        userData
      );

      // Store tokens after successful registration
      this.storeTokens(response);
      
      return response;
    } catch (error) {
      console.error('Registration failed:', error);
      throw error;
    }
  }

  /**
   * Login user with credentials
   */
  async login(credentials: UserLogin): Promise<AuthResponse> {
    try {
      console.log('AuthService: Sending login request with credentials:', credentials);
      console.log('AuthService: Login URL:', `${this.baseUrl}/login`);
      const response = await retryRequest(
        () => apiUtils.post<any>(`${this.baseUrl}/login`, credentials),
        2, // Max 2 retries for login
        1000 // 1 second delay
      );
      console.log('AuthService: Raw login response:', response);
      console.log('AuthService: Response type:', typeof response);
      console.log('AuthService: Response keys:', Object.keys(response));
      if (response.tokens) {
        console.log('AuthService: Tokens object keys:', Object.keys(response.tokens));
      }

      // Transform backend response to expected format
      // Handle the actual API response structure
      const authResponse: AuthResponse = {
        user: {
          id: response.user.user_id,
          username: response.user.username,
          email: response.user.email,
          first_name: response.user.first_name,
          last_name: response.user.last_name,
          phone_number: undefined,
          role: response.user.role,
          is_active: response.user.is_active,
          is_verified: response.user.is_verified,
          created_at: new Date().toISOString(), // API doesn't provide this
          updated_at: new Date().toISOString(), // API doesn't provide this
          last_login: undefined
        },
        access_token: response.access_token,
        refresh_token: response.refresh_token || '', // API doesn't provide refresh token
        token_type: response.token_type || 'Bearer',
        expires_in: response.expires_in || 3600 // Default to 1 hour if not provided
      };
      console.log('AuthService: Transformed auth response:', authResponse);

      // Store tokens after successful login
      this.storeTokens(authResponse);
      console.log('AuthService: Tokens stored successfully');
      
      // Cache user data
      apiCache.set('current_user', authResponse.user, 3600000); // 1 hour
      console.log('AuthService: User data cached');
      
      return authResponse;
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  }

  /**
   * Logout user and clear tokens
   */
  async logout(): Promise<void> {
    try {
      // Call logout endpoint (optional, mainly for server-side cleanup)
      await apiUtils.post(`${this.baseUrl}/logout`);
    } catch (error) {
      console.error('Logout API call failed:', error);
      // Continue with client-side cleanup even if server call fails
    } finally {
      // Clear tokens and cache
      this.clearTokens();
      apiCache.clear();
    }
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshToken(): Promise<AuthResponse> {
    const refreshToken = tokenManager.getRefreshToken();
    if (!refreshToken) {
      console.log('AuthService: No refresh token available, skipping refresh');
      throw new Error('No refresh token available');
    }

    try {
      console.log('AuthService: Attempting token refresh');
      const response = await apiUtils.post<AuthResponse>(
        `${this.baseUrl}/refresh`,
        { refresh_token: refreshToken }
      );

      // Store new tokens
      this.storeTokens(response);
      console.log('AuthService: Token refresh successful');
      
      return response;
    } catch (error) {
      console.error('Token refresh failed:', error);
      // Clear tokens on refresh failure
      this.clearTokens();
      throw error;
    }
  }

  /**
   * Get current user information
   */
  async getCurrentUser(): Promise<User> {
    try {
      // Check cache first
      const cachedUser = apiCache.get<User>('current_user');
      if (cachedUser) {
        return cachedUser;
      }

      const response = await apiUtils.get<User>(`${this.baseUrl}/me`);
      
      // Cache user data
      apiCache.set('current_user', response, 3600000); // 1 hour
      
      return response;
    } catch (error) {
      console.error('Failed to get current user:', error);
      throw error;
    }
  }

  /**
   * Change user password
   */
  async changePassword(passwordData: ChangePassword): Promise<ApiResponse<null>> {
    try {
      const response = await apiUtils.put<ApiResponse<null>>(
        `${this.baseUrl}/change-password`,
        passwordData
      );

      return response;
    } catch (error) {
      console.error('Password change failed:', error);
      throw error;
    }
  }

  /**
   * Verify token validity
   */
  async verifyToken(): Promise<boolean> {
    try {
      const response = await apiUtils.get<{ valid: boolean }>(`${this.baseUrl}/verify-token`);
      return response.valid;
    } catch (error) {
      console.error('Token verification failed:', error);
      return false;
    }
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    const token = tokenManager.getAccessToken();
    if (!token) {
      return false;
    }

    // Check if token is expired
    if (tokenManager.isTokenExpired(token)) {
      return false;
    }

    return true;
  }

  /**
   * Check if user has specific role
   */
  async hasRole(role: string): Promise<boolean> {
    try {
      const user = await this.getCurrentUser();
      return user.role === role;
    } catch (error) {
      console.error('Role check failed:', error);
      return false;
    }
  }

  /**
   * Check if user is admin
   */
  async isAdmin(): Promise<boolean> {
    return this.hasRole('ADMIN');
  }

  /**
   * Check if user is lab technician
   */
  async isLabTechnician(): Promise<boolean> {
    return this.hasRole('LAB_TECHNICIAN');
  }

  /**
   * Get user permissions based on role
   */
  async getPermissions(): Promise<string[]> {
    try {
      const user = await this.getCurrentUser();
      
      switch (user.role) {
        case 'ADMIN':
          return [
            'create_lab_test',
            'update_lab_test',
            'delete_lab_test',
            'view_all_reports',
            'update_report',
            'delete_report',
            'view_contact_messages',
            'respond_to_contact',
            'view_analytics',
            'manage_users'
          ];
        case 'LAB_TECHNICIAN':
          return [
            'view_lab_tests',
            'update_lab_test',
            'view_assigned_reports',
            'update_report',
            'process_reports'
          ];
        case 'USER':
        default:
          return [
            'view_lab_tests',
            'book_lab_test',
            'view_own_reports',
            'upload_report',
            'share_report',
            'submit_contact_form'
          ];
      }
    } catch (error) {
      console.error('Failed to get permissions:', error);
      return [];
    }
  }

  /**
   * Check if user has specific permission
   */
  async hasPermission(permission: string): Promise<boolean> {
    try {
      const permissions = await this.getPermissions();
      return permissions.includes(permission);
    } catch (error) {
      console.error('Permission check failed:', error);
      return false;
    }
  }

  /**
   * Store authentication tokens
   */
  private storeTokens(authResponse: AuthResponse): void {
    tokenManager.setTokens(authResponse.access_token, authResponse.refresh_token);
  }

  /**
   * Clear authentication tokens
   */
  private clearTokens(): void {
    tokenManager.removeTokens();
  }

  /**
   * Get authentication headers for manual requests
   */
  getAuthHeaders(): Record<string, string> {
    const token = tokenManager.getAccessToken();
    if (token) {
      return {
        'Authorization': `Bearer ${token}`
      };
    }
    return {};
  }

  /**
   * Password reset request (placeholder for future implementation)
   */
  async requestPasswordReset(email: string): Promise<ApiResponse<null>> {
    try {
      // This would typically be implemented when backend supports it
      const response = await apiUtils.post<ApiResponse<null>>(
        `${this.baseUrl}/request-password-reset`,
        { email }
      );

      return response;
    } catch (error) {
      console.error('Password reset request failed:', error);
      throw error;
    }
  }

  /**
   * Password reset confirmation (placeholder for future implementation)
   */
  async resetPassword(token: string, newPassword: string): Promise<ApiResponse<null>> {
    try {
      // This would typically be implemented when backend supports it
      const response = await apiUtils.post<ApiResponse<null>>(
        `${this.baseUrl}/reset-password`,
        { token, new_password: newPassword }
      );

      return response;
    } catch (error) {
      console.error('Password reset failed:', error);
      throw error;
    }
  }

  /**
   * Resend email verification (placeholder for future implementation)
   */
  async resendEmailVerification(): Promise<ApiResponse<null>> {
    try {
      const response = await apiUtils.post<ApiResponse<null>>(
        `${this.baseUrl}/resend-verification`
      );

      return response;
    } catch (error) {
      console.error('Email verification resend failed:', error);
      throw error;
    }
  }

  /**
   * Verify email with token (placeholder for future implementation)
   */
  async verifyEmail(token: string): Promise<ApiResponse<null>> {
    try {
      const response = await apiUtils.post<ApiResponse<null>>(
        `${this.baseUrl}/verify-email`,
        { token }
      );

      return response;
    } catch (error) {
      console.error('Email verification failed:', error);
      throw error;
    }
  }

  /**
   * Update user profile
   */
  async updateProfile(profileData: Partial<User>): Promise<User> {
    try {
      const response = await apiUtils.put<User>(`${this.baseUrl}/profile`, profileData);
      
      // Update cached user data
      apiCache.set('current_user', response, 3600000); // 1 hour
      
      return response;
    } catch (error) {
      console.error('Profile update failed:', error);
      throw error;
    }
  }

  /**
   * Get user activity/audit log (admin only)
   */
  async getUserActivity(userId?: string): Promise<any[]> {
    try {
      const url = userId ? `${this.baseUrl}/activity/${userId}` : `${this.baseUrl}/activity`;
      const response = await apiUtils.get<any[]>(url);
      return response;
    } catch (error) {
      console.error('Failed to get user activity:', error);
      throw error;
    }
  }

  /**
   * Revoke user session (admin only)
   */
  async revokeUserSession(userId: string): Promise<ApiResponse<null>> {
    try {
      const response = await apiUtils.post<ApiResponse<null>>(
        `${this.baseUrl}/revoke-session/${userId}`
      );

      return response;
    } catch (error) {
      console.error('Failed to revoke user session:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const authService = new AuthService();
export default authService;