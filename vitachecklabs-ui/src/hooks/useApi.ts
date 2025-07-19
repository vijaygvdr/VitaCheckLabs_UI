// Custom hooks for API state management with error handling and loading states

import { useState, useEffect, useCallback, useRef } from 'react';
import { ApiError } from '../types/api';
import { errorHandler } from '../services/api';

// Generic API state interface
export interface ApiState<T> {
  data: T | null;
  loading: boolean;
  error: ApiError | null;
  success: boolean;
}

// Initial state creator
const createInitialState = <T>(): ApiState<T> => ({
  data: null,
  loading: false,
  error: null,
  success: false,
});

// Generic API hook for GET requests
export function useApiGet<T>(
  apiCall: () => Promise<T>,
  dependencies: any[] = [],
  options: {
    immediate?: boolean;
    cacheKey?: string;
    cacheTTL?: number;
  } = {}
): ApiState<T> & {
  refetch: () => void;
  clearError: () => void;
} {
  const [state, setState] = useState<ApiState<T>>(createInitialState);
  const mountedRef = useRef(true);
  const { immediate = true, cacheKey, cacheTTL } = options;

  const fetchData = useCallback(async () => {
    if (!mountedRef.current) return;

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const result = await apiCall();
      if (mountedRef.current) {
        setState({
          data: result,
          loading: false,
          error: null,
          success: true,
        });
      }
    } catch (error) {
      if (mountedRef.current) {
        setState({
          data: null,
          loading: false,
          error: error as ApiError,
          success: false,
        });
      }
    }
  }, [apiCall]);

  const refetch = useCallback(() => {
    fetchData();
  }, [fetchData]);

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  useEffect(() => {
    if (immediate) {
      fetchData();
    }
  }, [fetchData, immediate, ...dependencies]);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  return {
    ...state,
    refetch,
    clearError,
  };
}

// Hook for POST/PUT/DELETE mutations
export function useApiMutation<T, P = any>(
  apiCall: (params: P) => Promise<T>
): ApiState<T> & {
  mutate: (params: P) => Promise<T>;
  reset: () => void;
} {
  const [state, setState] = useState<ApiState<T>>(createInitialState);
  const mountedRef = useRef(true);

  const mutate = useCallback(async (params: P): Promise<T> => {
    if (!mountedRef.current) throw new Error('Component unmounted');

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const result = await apiCall(params);
      if (mountedRef.current) {
        setState({
          data: result,
          loading: false,
          error: null,
          success: true,
        });
      }
      return result;
    } catch (error) {
      if (mountedRef.current) {
        setState({
          data: null,
          loading: false,
          error: error as ApiError,
          success: false,
        });
      }
      throw error;
    }
  }, [apiCall]);

  const reset = useCallback(() => {
    setState(createInitialState);
  }, []);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  return {
    ...state,
    mutate,
    reset,
  };
}

// Hook for paginated data
export function useApiPagination<T>(
  apiCall: (page: number, perPage: number, filters?: any) => Promise<{
    data: T[];
    page: number;
    per_page: number;
    total: number;
    total_pages: number;
  }>,
  initialPage: number = 1,
  initialPerPage: number = 20,
  initialFilters: any = {}
) {
  const [state, setState] = useState<ApiState<T[]>>(createInitialState);
  const [pagination, setPagination] = useState({
    page: initialPage,
    per_page: initialPerPage,
    total: 0,
    total_pages: 0,
  });
  const [filters, setFilters] = useState(initialFilters);
  const mountedRef = useRef(true);

  const fetchData = useCallback(async (page: number, perPage: number, currentFilters: any) => {
    if (!mountedRef.current) return;

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const result = await apiCall(page, perPage, currentFilters);
      if (mountedRef.current) {
        setState({
          data: result.data,
          loading: false,
          error: null,
          success: true,
        });
        setPagination({
          page: result.page,
          per_page: result.per_page,
          total: result.total,
          total_pages: result.total_pages,
        });
      }
    } catch (error) {
      if (mountedRef.current) {
        setState({
          data: null,
          loading: false,
          error: error as ApiError,
          success: false,
        });
      }
    }
  }, [apiCall]);

  const goToPage = useCallback((page: number) => {
    fetchData(page, pagination.per_page, filters);
  }, [fetchData, pagination.per_page, filters]);

  const changePerPage = useCallback((perPage: number) => {
    fetchData(1, perPage, filters);
  }, [fetchData, filters]);

  const updateFilters = useCallback((newFilters: any) => {
    setFilters(newFilters);
    fetchData(1, pagination.per_page, newFilters);
  }, [fetchData, pagination.per_page]);

  const resetFilters = useCallback(() => {
    setFilters(initialFilters);
    fetchData(1, pagination.per_page, initialFilters);
  }, [fetchData, pagination.per_page, initialFilters]);

  const refetch = useCallback(() => {
    fetchData(pagination.page, pagination.per_page, filters);
  }, [fetchData, pagination.page, pagination.per_page, filters]);

  useEffect(() => {
    fetchData(initialPage, initialPerPage, initialFilters);
  }, []);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  return {
    ...state,
    pagination,
    filters,
    goToPage,
    changePerPage,
    updateFilters,
    resetFilters,
    refetch,
  };
}

// Hook for handling multiple API calls
export function useApiMultiple<T extends Record<string, any>>(
  apiCalls: { [K in keyof T]: () => Promise<T[K]> },
  dependencies: any[] = []
): {
  data: Partial<T>;
  loading: boolean;
  error: ApiError | null;
  success: boolean;
  refetch: () => void;
  refetchSingle: <K extends keyof T>(key: K) => void;
} {
  const [state, setState] = useState<{
    data: Partial<T>;
    loading: boolean;
    error: ApiError | null;
    success: boolean;
  }>({
    data: {},
    loading: false,
    error: null,
    success: false,
  });
  const mountedRef = useRef(true);

  const fetchData = useCallback(async () => {
    if (!mountedRef.current) return;

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const results = await Promise.allSettled(
        Object.entries(apiCalls).map(async ([key, call]) => {
          const result = await call();
          return { key, result };
        })
      );

      if (mountedRef.current) {
        const data: Partial<T> = {};
        let hasError = false;
        let errorResult: ApiError | null = null;

        results.forEach((result, index) => {
          if (result.status === 'fulfilled') {
            const { key, result: value } = result.value;
            data[key as keyof T] = value;
          } else {
            hasError = true;
            errorResult = result.reason as ApiError;
          }
        });

        setState({
          data,
          loading: false,
          error: errorResult,
          success: !hasError,
        });
      }
    } catch (error) {
      if (mountedRef.current) {
        setState({
          data: {},
          loading: false,
          error: error as ApiError,
          success: false,
        });
      }
    }
  }, [apiCalls]);

  const refetchSingle = useCallback(async <K extends keyof T>(key: K) => {
    if (!mountedRef.current) return;

    try {
      const result = await apiCalls[key]();
      if (mountedRef.current) {
        setState(prev => ({
          ...prev,
          data: { ...prev.data, [key]: result },
        }));
      }
    } catch (error) {
      if (mountedRef.current) {
        setState(prev => ({
          ...prev,
          error: error as ApiError,
        }));
      }
    }
  }, [apiCalls]);

  const refetch = useCallback(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    fetchData();
  }, [fetchData, ...dependencies]);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  return {
    ...state,
    refetch,
    refetchSingle,
  };
}

// Hook for optimistic updates
export function useOptimisticUpdate<T>(
  initialData: T,
  updateFn: (data: T, optimisticUpdate: Partial<T>) => Promise<T>
) {
  const [data, setData] = useState<T>(initialData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);
  const mountedRef = useRef(true);

  const update = useCallback(async (optimisticUpdate: Partial<T>) => {
    if (!mountedRef.current) return;

    // Apply optimistic update immediately
    const previousData = data;
    setData(prev => ({ ...prev, ...optimisticUpdate }));
    setLoading(true);
    setError(null);

    try {
      const result = await updateFn(data, optimisticUpdate);
      if (mountedRef.current) {
        setData(result);
        setLoading(false);
      }
    } catch (error) {
      if (mountedRef.current) {
        // Revert optimistic update on error
        setData(previousData);
        setError(error as ApiError);
        setLoading(false);
      }
    }
  }, [data, updateFn]);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  return {
    data,
    loading,
    error,
    update,
  };
}

// Hook for debounced API calls
export function useApiDebounced<T>(
  apiCall: (query: string) => Promise<T>,
  delay: number = 300
): {
  data: T | null;
  loading: boolean;
  error: ApiError | null;
  search: (query: string) => void;
} {
  const [state, setState] = useState<ApiState<T>>(createInitialState);
  const debounceRef = useRef<NodeJS.Timeout>();
  const mountedRef = useRef(true);

  const search = useCallback((query: string) => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (!query.trim()) {
      setState(createInitialState);
      return;
    }

    setState(prev => ({ ...prev, loading: true, error: null }));

    debounceRef.current = setTimeout(async () => {
      try {
        const result = await apiCall(query);
        if (mountedRef.current) {
          setState({
            data: result,
            loading: false,
            error: null,
            success: true,
          });
        }
      } catch (error) {
        if (mountedRef.current) {
          setState({
            data: null,
            loading: false,
            error: error as ApiError,
            success: false,
          });
        }
      }
    }, delay);
  }, [apiCall, delay]);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  return {
    ...state,
    search,
  };
}

// Hook for retry logic
export function useApiWithRetry<T>(
  apiCall: () => Promise<T>,
  maxRetries: number = 3,
  retryDelay: number = 1000
): ApiState<T> & {
  retry: () => void;
  retryCount: number;
} {
  const [state, setState] = useState<ApiState<T>>(createInitialState);
  const [retryCount, setRetryCount] = useState(0);
  const mountedRef = useRef(true);

  const attemptCall = useCallback(async (attempt: number = 0) => {
    if (!mountedRef.current) return;

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const result = await apiCall();
      if (mountedRef.current) {
        setState({
          data: result,
          loading: false,
          error: null,
          success: true,
        });
        setRetryCount(0);
      }
    } catch (error) {
      if (mountedRef.current) {
        if (attempt < maxRetries && !errorHandler.isAuthError(error)) {
          // Retry after delay
          setTimeout(() => {
            setRetryCount(attempt + 1);
            attemptCall(attempt + 1);
          }, retryDelay * (attempt + 1));
        } else {
          setState({
            data: null,
            loading: false,
            error: error as ApiError,
            success: false,
          });
        }
      }
    }
  }, [apiCall, maxRetries, retryDelay]);

  const retry = useCallback(() => {
    setRetryCount(0);
    attemptCall();
  }, [attemptCall]);

  useEffect(() => {
    attemptCall();
  }, [attemptCall]);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  return {
    ...state,
    retry,
    retryCount,
  };
}

// Hook for websocket-like real-time updates
export function useApiRealtime<T>(
  apiCall: () => Promise<T>,
  intervalMs: number = 30000, // 30 seconds
  dependencies: any[] = []
): ApiState<T> & {
  pause: () => void;
  resume: () => void;
  isPaused: boolean;
} {
  const [state, setState] = useState<ApiState<T>>(createInitialState);
  const [isPaused, setIsPaused] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout>();
  const mountedRef = useRef(true);

  const fetchData = useCallback(async () => {
    if (!mountedRef.current || isPaused) return;

    try {
      const result = await apiCall();
      if (mountedRef.current) {
        setState(prev => ({
          ...prev,
          data: result,
          loading: false,
          error: null,
          success: true,
        }));
      }
    } catch (error) {
      if (mountedRef.current) {
        setState(prev => ({
          ...prev,
          error: error as ApiError,
          loading: false,
          success: false,
        }));
      }
    }
  }, [apiCall, isPaused]);

  const pause = useCallback(() => {
    setIsPaused(true);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
  }, []);

  const resume = useCallback(() => {
    setIsPaused(false);
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (!isPaused) {
      fetchData();
      intervalRef.current = setInterval(fetchData, intervalMs);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [fetchData, intervalMs, isPaused, ...dependencies]);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  return {
    ...state,
    pause,
    resume,
    isPaused,
  };
}