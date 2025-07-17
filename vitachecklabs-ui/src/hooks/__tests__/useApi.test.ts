import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { 
  useApiGet, 
  useApiMutation, 
  useApiPagination, 
  useApiMultiple, 
  useOptimisticUpdate, 
  useApiDebounced, 
  useApiWithRetry, 
  useApiRealtime 
} from '../useApi';
import { ApiError } from '../../types/api';

// Mock timers
vi.useFakeTimers();

describe('useApi hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.clearAllTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('useApiGet', () => {
    it('should fetch data successfully', async () => {
      const mockData = { id: 1, name: 'Test' };
      const mockApiCall = vi.fn().mockResolvedValue(mockData);

      const { result } = renderHook(() => useApiGet(mockApiCall));

      expect(result.current.loading).toBe(true);
      expect(result.current.data).toBe(null);
      expect(result.current.error).toBe(null);

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.data).toEqual(mockData);
      expect(result.current.success).toBe(true);
      expect(result.current.error).toBe(null);
    });

    it('should handle errors', async () => {
      const mockError: ApiError = { message: 'API Error', status: 500 };
      const mockApiCall = vi.fn().mockRejectedValue(mockError);

      const { result } = renderHook(() => useApiGet(mockApiCall));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.data).toBe(null);
      expect(result.current.error).toEqual(mockError);
      expect(result.current.success).toBe(false);
    });

    it('should not fetch immediately when immediate is false', async () => {
      const mockApiCall = vi.fn().mockResolvedValue({ id: 1 });

      const { result } = renderHook(() => useApiGet(mockApiCall, [], { immediate: false }));

      expect(result.current.loading).toBe(false);
      expect(mockApiCall).not.toHaveBeenCalled();
    });

    it('should refetch when refetch is called', async () => {
      const mockData = { id: 1, name: 'Test' };
      const mockApiCall = vi.fn().mockResolvedValue(mockData);

      const { result } = renderHook(() => useApiGet(mockApiCall));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(mockApiCall).toHaveBeenCalledTimes(1);

      act(() => {
        result.current.refetch();
      });

      await waitFor(() => {
        expect(mockApiCall).toHaveBeenCalledTimes(2);
      });
    });

    it('should clear error when clearError is called', async () => {
      const mockError: ApiError = { message: 'API Error', status: 500 };
      const mockApiCall = vi.fn().mockRejectedValue(mockError);

      const { result } = renderHook(() => useApiGet(mockApiCall));

      await waitFor(() => {
        expect(result.current.error).toEqual(mockError);
      });

      act(() => {
        result.current.clearError();
      });

      expect(result.current.error).toBe(null);
    });
  });

  describe('useApiMutation', () => {
    it('should handle successful mutation', async () => {
      const mockData = { id: 1, name: 'Created' };
      const mockApiCall = vi.fn().mockResolvedValue(mockData);

      const { result } = renderHook(() => useApiMutation(mockApiCall));

      expect(result.current.loading).toBe(false);
      expect(result.current.data).toBe(null);

      await act(async () => {
        await result.current.mutate({ name: 'Test' });
      });

      expect(result.current.data).toEqual(mockData);
      expect(result.current.success).toBe(true);
      expect(result.current.error).toBe(null);
    });

    it('should handle mutation errors', async () => {
      const mockError: ApiError = { message: 'Mutation Error', status: 400 };
      const mockApiCall = vi.fn().mockRejectedValue(mockError);

      const { result } = renderHook(() => useApiMutation(mockApiCall));

      await act(async () => {
        try {
          await result.current.mutate({ name: 'Test' });
        } catch (error) {
          expect(error).toEqual(mockError);
        }
      });

      expect(result.current.error).toEqual(mockError);
      expect(result.current.success).toBe(false);
    });

    it('should reset state when reset is called', async () => {
      const mockData = { id: 1, name: 'Created' };
      const mockApiCall = vi.fn().mockResolvedValue(mockData);

      const { result } = renderHook(() => useApiMutation(mockApiCall));

      await act(async () => {
        await result.current.mutate({ name: 'Test' });
      });

      expect(result.current.data).toEqual(mockData);

      act(() => {
        result.current.reset();
      });

      expect(result.current.data).toBe(null);
      expect(result.current.error).toBe(null);
      expect(result.current.success).toBe(false);
    });
  });

  describe('useApiPagination', () => {
    it('should handle paginated data', async () => {
      const mockResponse = {
        data: [{ id: 1, name: 'Item 1' }],
        page: 1,
        per_page: 20,
        total: 1,
        total_pages: 1,
      };
      const mockApiCall = vi.fn().mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useApiPagination(mockApiCall));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.data).toEqual(mockResponse.data);
      expect(result.current.pagination).toEqual({
        page: 1,
        per_page: 20,
        total: 1,
        total_pages: 1,
      });
    });

    it('should handle page navigation', async () => {
      const mockResponse = {
        data: [{ id: 2, name: 'Item 2' }],
        page: 2,
        per_page: 20,
        total: 2,
        total_pages: 2,
      };
      const mockApiCall = vi.fn().mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useApiPagination(mockApiCall));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      act(() => {
        result.current.goToPage(2);
      });

      await waitFor(() => {
        expect(mockApiCall).toHaveBeenCalledWith(2, 20, {});
      });
    });

    it('should handle filter updates', async () => {
      const mockResponse = {
        data: [{ id: 1, name: 'Filtered Item' }],
        page: 1,
        per_page: 20,
        total: 1,
        total_pages: 1,
      };
      const mockApiCall = vi.fn().mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useApiPagination(mockApiCall));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      act(() => {
        result.current.updateFilters({ search: 'test' });
      });

      await waitFor(() => {
        expect(mockApiCall).toHaveBeenCalledWith(1, 20, { search: 'test' });
      });
    });
  });

  describe('useApiMultiple', () => {
    it('should handle multiple API calls', async () => {
      const mockCalls = {
        users: vi.fn().mockResolvedValue([{ id: 1, name: 'User 1' }]),
        posts: vi.fn().mockResolvedValue([{ id: 1, title: 'Post 1' }]),
      };

      const { result } = renderHook(() => useApiMultiple(mockCalls));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.data.users).toEqual([{ id: 1, name: 'User 1' }]);
      expect(result.current.data.posts).toEqual([{ id: 1, title: 'Post 1' }]);
      expect(result.current.success).toBe(true);
    });

    it('should handle partial failures', async () => {
      const mockCalls = {
        users: vi.fn().mockResolvedValue([{ id: 1, name: 'User 1' }]),
        posts: vi.fn().mockRejectedValue(new Error('Failed to fetch posts')),
      };

      const { result } = renderHook(() => useApiMultiple(mockCalls));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.data.users).toEqual([{ id: 1, name: 'User 1' }]);
      expect(result.current.error).toBeTruthy();
      expect(result.current.success).toBe(false);
    });

    it('should refetch single call', async () => {
      const mockCalls = {
        users: vi.fn().mockResolvedValue([{ id: 1, name: 'User 1' }]),
        posts: vi.fn().mockResolvedValue([{ id: 1, title: 'Post 1' }]),
      };

      const { result } = renderHook(() => useApiMultiple(mockCalls));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      act(() => {
        result.current.refetchSingle('users');
      });

      expect(mockCalls.users).toHaveBeenCalledTimes(2);
      expect(mockCalls.posts).toHaveBeenCalledTimes(1);
    });
  });

  describe('useOptimisticUpdate', () => {
    it('should handle optimistic updates', async () => {
      const initialData = { id: 1, name: 'Original' };
      const mockUpdateFn = vi.fn().mockResolvedValue({ id: 1, name: 'Updated' });

      const { result } = renderHook(() => useOptimisticUpdate(initialData, mockUpdateFn));

      expect(result.current.data).toEqual(initialData);

      await act(async () => {
        await result.current.update({ name: 'Updated' });
      });

      expect(result.current.data).toEqual({ id: 1, name: 'Updated' });
      expect(result.current.loading).toBe(false);
    });

    it('should revert on error', async () => {
      const initialData = { id: 1, name: 'Original' };
      const mockUpdateFn = vi.fn().mockRejectedValue(new Error('Update failed'));

      const { result } = renderHook(() => useOptimisticUpdate(initialData, mockUpdateFn));

      await act(async () => {
        await result.current.update({ name: 'Updated' });
      });

      expect(result.current.data).toEqual(initialData); // Reverted
      expect(result.current.error).toBeTruthy();
    });
  });

  describe('useApiDebounced', () => {
    it('should debounce API calls', async () => {
      const mockApiCall = vi.fn().mockResolvedValue([{ id: 1, name: 'Result' }]);

      const { result } = renderHook(() => useApiDebounced(mockApiCall, 300));

      act(() => {
        result.current.search('test');
      });

      expect(mockApiCall).not.toHaveBeenCalled();

      act(() => {
        vi.advanceTimersByTime(300);
      });

      await waitFor(() => {
        expect(mockApiCall).toHaveBeenCalledWith('test');
      });
    });

    it('should cancel previous calls on new search', async () => {
      const mockApiCall = vi.fn().mockResolvedValue([{ id: 1, name: 'Result' }]);

      const { result } = renderHook(() => useApiDebounced(mockApiCall, 300));

      act(() => {
        result.current.search('test1');
      });

      act(() => {
        vi.advanceTimersByTime(100);
      });

      act(() => {
        result.current.search('test2');
      });

      act(() => {
        vi.advanceTimersByTime(300);
      });

      await waitFor(() => {
        expect(mockApiCall).toHaveBeenCalledTimes(1);
        expect(mockApiCall).toHaveBeenCalledWith('test2');
      });
    });

    it('should not call API for empty query', async () => {
      const mockApiCall = vi.fn().mockResolvedValue([]);

      const { result } = renderHook(() => useApiDebounced(mockApiCall, 300));

      act(() => {
        result.current.search('');
      });

      act(() => {
        vi.advanceTimersByTime(300);
      });

      expect(mockApiCall).not.toHaveBeenCalled();
      expect(result.current.data).toBe(null);
    });
  });

  describe('useApiWithRetry', () => {
    it('should retry on failure', async () => {
      const mockApiCall = vi.fn()
        .mockRejectedValueOnce({ status: 500 })
        .mockRejectedValueOnce({ status: 500 })
        .mockResolvedValue({ id: 1, name: 'Success' });

      const { result } = renderHook(() => useApiWithRetry(mockApiCall, 3, 100));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(mockApiCall).toHaveBeenCalledTimes(3);
      expect(result.current.data).toEqual({ id: 1, name: 'Success' });
    });

    it('should not retry on auth errors', async () => {
      const mockApiCall = vi.fn().mockRejectedValue({ status: 401 });

      const { result } = renderHook(() => useApiWithRetry(mockApiCall, 3, 100));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(mockApiCall).toHaveBeenCalledTimes(1);
      expect(result.current.error).toEqual({ status: 401 });
    });

    it('should allow manual retry', async () => {
      const mockApiCall = vi.fn()
        .mockRejectedValueOnce({ status: 500 })
        .mockResolvedValue({ id: 1, name: 'Success' });

      const { result } = renderHook(() => useApiWithRetry(mockApiCall, 0, 100));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBeTruthy();

      act(() => {
        result.current.retry();
      });

      await waitFor(() => {
        expect(result.current.data).toEqual({ id: 1, name: 'Success' });
      });
    });
  });

  describe('useApiRealtime', () => {
    it('should fetch data at intervals', async () => {
      const mockApiCall = vi.fn()
        .mockResolvedValueOnce({ id: 1, timestamp: '2023-01-01' })
        .mockResolvedValueOnce({ id: 1, timestamp: '2023-01-02' });

      const { result } = renderHook(() => useApiRealtime(mockApiCall, 1000));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.data).toEqual({ id: 1, timestamp: '2023-01-01' });

      act(() => {
        vi.advanceTimersByTime(1000);
      });

      await waitFor(() => {
        expect(mockApiCall).toHaveBeenCalledTimes(2);
      });
    });

    it('should pause and resume updates', async () => {
      const mockApiCall = vi.fn().mockResolvedValue({ id: 1, timestamp: '2023-01-01' });

      const { result } = renderHook(() => useApiRealtime(mockApiCall, 1000));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      act(() => {
        result.current.pause();
      });

      expect(result.current.isPaused).toBe(true);

      act(() => {
        vi.advanceTimersByTime(1000);
      });

      // Should not call API while paused
      expect(mockApiCall).toHaveBeenCalledTimes(1);

      act(() => {
        result.current.resume();
      });

      expect(result.current.isPaused).toBe(false);

      await waitFor(() => {
        expect(mockApiCall).toHaveBeenCalledTimes(2);
      });
    });
  });
});