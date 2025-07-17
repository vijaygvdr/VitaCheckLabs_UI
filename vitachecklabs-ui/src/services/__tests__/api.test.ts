import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import axios from 'axios';
import { 
  apiClient, 
  tokenManager, 
  apiUtils, 
  errorHandler, 
  healthCheck,
  rateLimiter,
  retryRequest,
  apiCache 
} from '../api';

// Mock axios
vi.mock('axios');
const mockedAxios = axios as any;

// Mock localStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
});

describe('API Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    apiCache.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('tokenManager', () => {
    it('should get access token from localStorage', () => {
      mockLocalStorage.getItem.mockReturnValue('test-token');
      const token = tokenManager.getAccessToken();
      expect(token).toBe('test-token');
      expect(mockLocalStorage.getItem).toHaveBeenCalledWith('vitacheck_access_token');
    });

    it('should get refresh token from localStorage', () => {
      mockLocalStorage.getItem.mockReturnValue('refresh-token');
      const token = tokenManager.getRefreshToken();
      expect(token).toBe('refresh-token');
      expect(mockLocalStorage.getItem).toHaveBeenCalledWith('vitacheck_refresh_token');
    });

    it('should set tokens in localStorage', () => {
      tokenManager.setTokens('access-token', 'refresh-token');
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('vitacheck_access_token', 'access-token');
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('vitacheck_refresh_token', 'refresh-token');
    });

    it('should remove tokens from localStorage', () => {
      tokenManager.removeTokens();
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('vitacheck_access_token');
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('vitacheck_refresh_token');
    });

    it('should check if token is expired', () => {
      const futurePayload = { exp: Date.now() / 1000 + 3600 }; // 1 hour in future
      const pastPayload = { exp: Date.now() / 1000 - 3600 }; // 1 hour in past
      
      const validToken = `header.${btoa(JSON.stringify(futurePayload))}.signature`;
      const expiredToken = `header.${btoa(JSON.stringify(pastPayload))}.signature`;
      
      expect(tokenManager.isTokenExpired(validToken)).toBe(false);
      expect(tokenManager.isTokenExpired(expiredToken)).toBe(true);
    });

    it('should handle invalid token format', () => {
      expect(tokenManager.isTokenExpired('invalid-token')).toBe(true);
    });
  });

  describe('apiUtils', () => {
    const mockResponse = { data: { message: 'success' } };

    beforeEach(() => {
      mockedAxios.create.mockReturnValue({
        get: vi.fn().mockResolvedValue(mockResponse),
        post: vi.fn().mockResolvedValue(mockResponse),
        put: vi.fn().mockResolvedValue(mockResponse),
        delete: vi.fn().mockResolvedValue(mockResponse),
        patch: vi.fn().mockResolvedValue(mockResponse),
        interceptors: {
          request: { use: vi.fn() },
          response: { use: vi.fn() },
        },
      });
    });

    it('should make GET request', async () => {
      const result = await apiUtils.get('/test');
      expect(result).toEqual(mockResponse.data);
    });

    it('should make POST request', async () => {
      const data = { name: 'test' };
      const result = await apiUtils.post('/test', data);
      expect(result).toEqual(mockResponse.data);
    });

    it('should make PUT request', async () => {
      const data = { id: 1, name: 'updated' };
      const result = await apiUtils.put('/test/1', data);
      expect(result).toEqual(mockResponse.data);
    });

    it('should make DELETE request', async () => {
      const result = await apiUtils.delete('/test/1');
      expect(result).toEqual(mockResponse.data);
    });

    it('should make PATCH request', async () => {
      const data = { name: 'patched' };
      const result = await apiUtils.patch('/test/1', data);
      expect(result).toEqual(mockResponse.data);
    });

    it('should handle API errors', async () => {
      const errorResponse = {
        response: {
          data: { message: 'API Error' },
          status: 400,
        },
      };

      mockedAxios.create.mockReturnValue({
        get: vi.fn().mockRejectedValue(errorResponse),
        interceptors: {
          request: { use: vi.fn() },
          response: { use: vi.fn() },
        },
      });

      await expect(apiUtils.get('/test')).rejects.toMatchObject({
        message: 'API Error',
        status: 400,
      });
    });
  });

  describe('errorHandler', () => {
    it('should extract error message from different error formats', () => {
      expect(errorHandler.getErrorMessage({ message: 'Direct message' })).toBe('Direct message');
      expect(errorHandler.getErrorMessage({ 
        response: { data: { message: 'Response message' } } 
      })).toBe('Response message');
      expect(errorHandler.getErrorMessage({ 
        response: { data: { detail: 'Detail message' } } 
      })).toBe('Detail message');
      expect(errorHandler.getErrorMessage({})).toBe('An unexpected error occurred');
    });

    it('should check if error is network related', () => {
      expect(errorHandler.isNetworkError({ code: 'NETWORK_ERROR' })).toBe(true);
      expect(errorHandler.isNetworkError({ response: { status: 500 } })).toBe(false);
      expect(errorHandler.isNetworkError({})).toBe(true);
    });

    it('should check if error is authentication related', () => {
      expect(errorHandler.isAuthError({ status: 401 })).toBe(true);
      expect(errorHandler.isAuthError({ response: { status: 401 } })).toBe(true);
      expect(errorHandler.isAuthError({ status: 403 })).toBe(false);
    });

    it('should check if error is authorization related', () => {
      expect(errorHandler.isAuthzError({ status: 403 })).toBe(true);
      expect(errorHandler.isAuthzError({ response: { status: 403 } })).toBe(true);
      expect(errorHandler.isAuthzError({ status: 401 })).toBe(false);
    });

    it('should check if error is validation related', () => {
      expect(errorHandler.isValidationError({ status: 422 })).toBe(true);
      expect(errorHandler.isValidationError({ response: { status: 422 } })).toBe(true);
      expect(errorHandler.isValidationError({ status: 400 })).toBe(false);
    });

    it('should extract validation errors', () => {
      const error = {
        errors: { field1: ['Error 1'], field2: ['Error 2'] },
      };
      expect(errorHandler.getValidationErrors(error)).toEqual(error.errors);
    });
  });

  describe('healthCheck', () => {
    it('should return true when health check passes', async () => {
      mockedAxios.create.mockReturnValue({
        get: vi.fn().mockResolvedValue({ data: { status: 'healthy' } }),
        interceptors: {
          request: { use: vi.fn() },
          response: { use: vi.fn() },
        },
      });

      const result = await healthCheck();
      expect(result).toBe(true);
    });

    it('should return false when health check fails', async () => {
      mockedAxios.create.mockReturnValue({
        get: vi.fn().mockRejectedValue(new Error('Health check failed')),
        interceptors: {
          request: { use: vi.fn() },
          response: { use: vi.fn() },
        },
      });

      const result = await healthCheck();
      expect(result).toBe(false);
    });
  });

  describe('rateLimiter', () => {
    beforeEach(() => {
      rateLimiter.requests.clear();
    });

    it('should allow requests within limit', () => {
      expect(rateLimiter.isAllowed('test-key', 5, 60000)).toBe(true);
      expect(rateLimiter.isAllowed('test-key', 5, 60000)).toBe(true);
      expect(rateLimiter.isAllowed('test-key', 5, 60000)).toBe(true);
    });

    it('should block requests exceeding limit', () => {
      // Fill up the limit
      for (let i = 0; i < 5; i++) {
        rateLimiter.isAllowed('test-key', 5, 60000);
      }
      
      // This should be blocked
      expect(rateLimiter.isAllowed('test-key', 5, 60000)).toBe(false);
    });

    it('should get remaining requests', () => {
      rateLimiter.isAllowed('test-key', 10, 60000);
      rateLimiter.isAllowed('test-key', 10, 60000);
      
      expect(rateLimiter.getRemaining('test-key', 10, 60000)).toBe(8);
    });
  });

  describe('retryRequest', () => {
    it('should succeed on first attempt', async () => {
      const successRequest = vi.fn().mockResolvedValue('success');
      const result = await retryRequest(successRequest, 3, 100);
      
      expect(result).toBe('success');
      expect(successRequest).toHaveBeenCalledTimes(1);
    });

    it('should retry on server errors', async () => {
      const failingRequest = vi.fn()
        .mockRejectedValueOnce({ status: 500 })
        .mockRejectedValueOnce({ status: 500 })
        .mockResolvedValue('success');
      
      const result = await retryRequest(failingRequest, 3, 10);
      
      expect(result).toBe('success');
      expect(failingRequest).toHaveBeenCalledTimes(3);
    });

    it('should not retry on client errors', async () => {
      const clientErrorRequest = vi.fn().mockRejectedValue({ status: 400 });
      
      await expect(retryRequest(clientErrorRequest, 3, 10)).rejects.toMatchObject({
        status: 400,
      });
      
      expect(clientErrorRequest).toHaveBeenCalledTimes(1);
    });

    it('should exhaust retries and throw last error', async () => {
      const alwaysFailingRequest = vi.fn().mockRejectedValue({ status: 500 });
      
      await expect(retryRequest(alwaysFailingRequest, 2, 10)).rejects.toMatchObject({
        status: 500,
      });
      
      expect(alwaysFailingRequest).toHaveBeenCalledTimes(3); // Initial + 2 retries
    });
  });

  describe('apiCache', () => {
    it('should store and retrieve cached data', () => {
      const testData = { id: 1, name: 'test' };
      apiCache.set('test-key', testData, 60000);
      
      const retrieved = apiCache.get('test-key');
      expect(retrieved).toEqual(testData);
    });

    it('should return null for expired cache', () => {
      const testData = { id: 1, name: 'test' };
      apiCache.set('test-key', testData, 1); // 1ms TTL
      
      // Wait for cache to expire
      setTimeout(() => {
        const retrieved = apiCache.get('test-key');
        expect(retrieved).toBeNull();
      }, 2);
    });

    it('should clear specific cache entry', () => {
      apiCache.set('test-key-1', 'data1', 60000);
      apiCache.set('test-key-2', 'data2', 60000);
      
      apiCache.clear('test-key-1');
      
      expect(apiCache.get('test-key-1')).toBeNull();
      expect(apiCache.get('test-key-2')).toBe('data2');
    });

    it('should clear all cache entries', () => {
      apiCache.set('test-key-1', 'data1', 60000);
      apiCache.set('test-key-2', 'data2', 60000);
      
      apiCache.clear();
      
      expect(apiCache.get('test-key-1')).toBeNull();
      expect(apiCache.get('test-key-2')).toBeNull();
    });

    it('should handle cached API call', async () => {
      const expensiveCall = vi.fn().mockResolvedValue('expensive-result');
      
      // First call should execute the function
      const result1 = await apiCache.cachedCall('test-key', expensiveCall, 60000);
      expect(result1).toBe('expensive-result');
      expect(expensiveCall).toHaveBeenCalledTimes(1);
      
      // Second call should return cached result
      const result2 = await apiCache.cachedCall('test-key', expensiveCall, 60000);
      expect(result2).toBe('expensive-result');
      expect(expensiveCall).toHaveBeenCalledTimes(1); // Still only called once
    });
  });
});