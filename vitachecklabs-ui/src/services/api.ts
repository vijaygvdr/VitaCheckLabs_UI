// Base API Configuration and Interceptors

import axios, { 
  AxiosInstance, 
  AxiosRequestConfig, 
  AxiosResponse, 
  AxiosError 
} from 'axios';
import { ApiError, ApiResponse } from '../types/api';

// API Configuration
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000';
const API_VERSION = '/api/v1';

// Token storage keys
const ACCESS_TOKEN_KEY = 'vitacheck_access_token';
const REFRESH_TOKEN_KEY = 'vitacheck_refresh_token';

// Create axios instance with base configuration
const createAxiosInstance = (): AxiosInstance => {
  const instance = axios.create({
    baseURL: `${API_BASE_URL}${API_VERSION}`,
    timeout: 30000, // 30 seconds
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
  });

  return instance;
};

// Token management utilities
export const tokenManager = {
  getAccessToken: (): string | null => {
    return localStorage.getItem(ACCESS_TOKEN_KEY);
  },

  getRefreshToken: (): string | null => {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  },

  setTokens: (accessToken: string, refreshToken: string): void => {
    localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  },

  removeTokens: (): void => {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  },

  isTokenExpired: (token: string): boolean => {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Date.now() / 1000;
      return payload.exp < currentTime;
    } catch (error) {
      return true;
    }
  },
};

// Create the main API instance
export const apiClient = createAxiosInstance();

// Request interceptor to add authorization header
apiClient.interceptors.request.use(
  (config: AxiosRequestConfig) => {
    const token = tokenManager.getAccessToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling and token refresh
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config;

    // Handle 401 errors and token refresh
    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      originalRequest._retry = true;

      const refreshToken = tokenManager.getRefreshToken();
      if (refreshToken) {
        try {
          const response = await axios.post(`${API_BASE_URL}${API_VERSION}/auth/refresh`, {
            refresh_token: refreshToken,
          });

          const { access_token, refresh_token: newRefreshToken } = response.data;
          tokenManager.setTokens(access_token, newRefreshToken);

          // Retry original request with new token
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${access_token}`;
          }
          return apiClient(originalRequest);
        } catch (refreshError) {
          // Refresh failed, redirect to login
          tokenManager.removeTokens();
          window.location.href = '/login';
          return Promise.reject(refreshError);
        }
      } else {
        // No refresh token, redirect to login
        tokenManager.removeTokens();
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

// Generic API call handler
export const apiCall = async <T>(
  request: () => Promise<AxiosResponse<T>>
): Promise<T> => {
  try {
    const response = await request();
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const apiError: ApiError = {
        message: error.response?.data?.message || error.message,
        detail: error.response?.data?.detail,
        status: error.response?.status,
        errors: error.response?.data?.errors,
      };
      throw apiError;
    }
    throw error;
  }
};

// Utility functions for common API operations
export const apiUtils = {
  // GET request with optional query parameters
  get: <T>(url: string, params?: Record<string, any>): Promise<T> => {
    return apiCall(() => apiClient.get(url, { params }));
  },

  // POST request with data
  post: <T>(url: string, data?: any): Promise<T> => {
    return apiCall(() => apiClient.post(url, data));
  },

  // PUT request with data
  put: <T>(url: string, data?: any): Promise<T> => {
    return apiCall(() => apiClient.put(url, data));
  },

  // DELETE request
  delete: <T>(url: string): Promise<T> => {
    return apiCall(() => apiClient.delete(url));
  },

  // PATCH request with data
  patch: <T>(url: string, data?: any): Promise<T> => {
    return apiCall(() => apiClient.patch(url, data));
  },

  // File upload with progress tracking
  uploadFile: <T>(
    url: string,
    file: File,
    onUploadProgress?: (progressEvent: any) => void
  ): Promise<T> => {
    const formData = new FormData();
    formData.append('file', file);

    return apiCall(() =>
      apiClient.post(url, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress,
      })
    );
  },

  // Download file with authentication
  downloadFile: async (url: string, filename?: string): Promise<void> => {
    try {
      const response = await apiClient.get(url, {
        responseType: 'blob',
      });

      // Create blob link to download
      const blob = new Blob([response.data]);
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.download = filename || 'download';
      link.click();
      window.URL.revokeObjectURL(link.href);
    } catch (error) {
      console.error('File download failed:', error);
      throw error;
    }
  },
};

// Health check utility
export const healthCheck = async (): Promise<boolean> => {
  try {
    await apiUtils.get('/health');
    return true;
  } catch (error) {
    console.error('Health check failed:', error);
    return false;
  }
};

// Error handling utilities
export const errorHandler = {
  // Extract user-friendly error message
  getErrorMessage: (error: any): string => {
    if (error.message) {
      return error.message;
    }
    if (error.response?.data?.message) {
      return error.response.data.message;
    }
    if (error.response?.data?.detail) {
      return error.response.data.detail;
    }
    return 'An unexpected error occurred';
  },

  // Extract validation errors
  getValidationErrors: (error: any): Record<string, string[]> => {
    return error.errors || error.response?.data?.errors || {};
  },

  // Check if error is network related
  isNetworkError: (error: any): boolean => {
    return !error.response || error.code === 'NETWORK_ERROR';
  },

  // Check if error is authentication related
  isAuthError: (error: any): boolean => {
    return error.status === 401 || error.response?.status === 401;
  },

  // Check if error is authorization related
  isAuthzError: (error: any): boolean => {
    return error.status === 403 || error.response?.status === 403;
  },

  // Check if error is validation related
  isValidationError: (error: any): boolean => {
    return error.status === 422 || error.response?.status === 422;
  },
};

// Rate limiting utilities
export const rateLimiter = {
  // Simple in-memory rate limiter
  requests: new Map<string, number[]>(),
  
  // Check if request is allowed
  isAllowed: (key: string, limit: number = 10, windowMs: number = 60000): boolean => {
    const now = Date.now();
    const requests = rateLimiter.requests.get(key) || [];
    
    // Remove old requests outside the window
    const recentRequests = requests.filter(time => now - time < windowMs);
    
    if (recentRequests.length >= limit) {
      return false;
    }
    
    // Add current request
    recentRequests.push(now);
    rateLimiter.requests.set(key, recentRequests);
    
    return true;
  },

  // Get remaining requests
  getRemaining: (key: string, limit: number = 10, windowMs: number = 60000): number => {
    const now = Date.now();
    const requests = rateLimiter.requests.get(key) || [];
    const recentRequests = requests.filter(time => now - time < windowMs);
    return Math.max(0, limit - recentRequests.length);
  },
};

// Request retry utility
export const retryRequest = async <T>(
  request: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> => {
  let lastError: any;
  
  for (let i = 0; i <= maxRetries; i++) {
    try {
      return await request();
    } catch (error) {
      lastError = error;
      
      // Don't retry on client errors (4xx)
      if (error.status >= 400 && error.status < 500) {
        throw error;
      }
      
      // Don't retry on the last attempt
      if (i === maxRetries) {
        throw error;
      }
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay * (i + 1)));
    }
  }
  
  throw lastError;
};

// Cache utilities for API responses
export const apiCache = {
  cache: new Map<string, { data: any; timestamp: number; ttl: number }>(),
  
  // Get cached data
  get: <T>(key: string): T | null => {
    const cached = apiCache.cache.get(key);
    if (cached && Date.now() - cached.timestamp < cached.ttl) {
      return cached.data;
    }
    apiCache.cache.delete(key);
    return null;
  },
  
  // Set cached data
  set: (key: string, data: any, ttl: number = 300000): void => { // 5 minutes default
    apiCache.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  },
  
  // Clear cache
  clear: (key?: string): void => {
    if (key) {
      apiCache.cache.delete(key);
    } else {
      apiCache.cache.clear();
    }
  },
  
  // Cached API call
  cachedCall: async <T>(
    key: string,
    request: () => Promise<T>,
    ttl: number = 300000
  ): Promise<T> => {
    const cached = apiCache.get<T>(key);
    if (cached) {
      return cached;
    }
    
    const data = await request();
    apiCache.set(key, data, ttl);
    return data;
  },
};

export default apiClient;