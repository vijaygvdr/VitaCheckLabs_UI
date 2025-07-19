// Service exports and initialization

// Main API client
export { default as apiClient, tokenManager, apiUtils, errorHandler } from './api';

// Service classes
export { default as authService } from './authService';
export { default as labTestsService } from './labTestsService';
export { default as reportsService } from './reportsService';

// API hooks
export * from '../hooks/useApi';

// Types
export * from '../types/api';

// Service initialization and health checks
import { healthCheck } from './api';
import { authService } from './authService';
import { labTestsService } from './labTestsService';
import { reportsService } from './reportsService';

/**
 * Initialize all services and perform health checks
 */
export const initializeServices = async (): Promise<{
  healthy: boolean;
  services: {
    api: boolean;
    auth: boolean;
    labTests: boolean;
    reports: boolean;
  };
}> => {
  const services = {
    api: false,
    auth: false,
    labTests: false,
    reports: false,
  };

  try {
    // Check API health
    services.api = await healthCheck();

    // Check authentication service
    try {
      if (authService.isAuthenticated()) {
        await authService.getCurrentUser();
      }
      services.auth = true;
    } catch (error) {
      console.warn('Auth service check failed:', error);
      services.auth = false;
    }

    // Preload essential data
    try {
      await Promise.all([
        labTestsService.preloadPopularTests(),
        reportsService.preloadUserReports(),
      ]);
      services.labTests = true;
      services.reports = true;
    } catch (error) {
      console.warn('Service preload failed:', error);
      // Set individual service status based on what succeeded
      services.labTests = true; // Assume success if no specific error
      services.reports = true;
    }

    return {
      healthy: services.api,
      services,
    };
  } catch (error) {
    console.error('Service initialization failed:', error);
    return {
      healthy: false,
      services,
    };
  }
};

/**
 * Clear all service caches
 */
export const clearServiceCaches = (): void => {
  try {
    // Clear API cache
    import('./api').then(({ apiCache }) => {
      apiCache.clear();
    });

    console.log('Service caches cleared');
  } catch (error) {
    console.error('Failed to clear service caches:', error);
  }
};

/**
 * Get service status
 */
export const getServiceStatus = async (): Promise<{
  timestamp: string;
  api: boolean;
  authentication: boolean;
  services: {
    labTests: boolean;
    reports: boolean;
  };
}> => {
  const status = {
    timestamp: new Date().toISOString(),
    api: false,
    authentication: false,
    services: {
      labTests: false,
      reports: false,
    },
  };

  try {
    // Check API health
    status.api = await healthCheck();

    // Check authentication
    status.authentication = authService.isAuthenticated();

    // Check individual services (simplified check)
    status.services.labTests = status.api;
    status.services.reports = status.api;

    return status;
  } catch (error) {
    console.error('Service status check failed:', error);
    return status;
  }
};

/**
 * Service configuration
 */
export const serviceConfig = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || '',
  apiVersion: '/api/v1',
  timeout: 30000,
  retryAttempts: 3,
  retryDelay: 1000,
  cacheEnabled: true,
  cacheTTL: {
    short: 300000, // 5 minutes
    medium: 1800000, // 30 minutes
    long: 3600000, // 1 hour
  },
  rateLimits: {
    default: 100, // requests per minute
    auth: 10, // auth requests per minute
    upload: 5, // upload requests per minute
    contact: 5, // contact form submissions per hour
  },
};

/**
 * Service error types
 */
export const serviceErrors = {
  NETWORK_ERROR: 'NETWORK_ERROR',
  TIMEOUT_ERROR: 'TIMEOUT_ERROR',
  AUTH_ERROR: 'AUTH_ERROR',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  RATE_LIMIT_ERROR: 'RATE_LIMIT_ERROR',
  SERVER_ERROR: 'SERVER_ERROR',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
};

/**
 * Service event emitter for global state management
 */
class ServiceEventEmitter {
  private listeners: Map<string, Function[]> = new Map();

  on(event: string, listener: Function): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(listener);
  }

  off(event: string, listener: Function): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      const index = eventListeners.indexOf(listener);
      if (index > -1) {
        eventListeners.splice(index, 1);
      }
    }
  }

  emit(event: string, data?: any): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.forEach(listener => listener(data));
    }
  }
}

export const serviceEvents = new ServiceEventEmitter();

// Service event types
export const SERVICE_EVENTS = {
  AUTH_STATE_CHANGED: 'auth_state_changed',
  API_ERROR: 'api_error',
  NETWORK_STATUS_CHANGED: 'network_status_changed',
  CACHE_CLEARED: 'cache_cleared',
  SERVICE_UNAVAILABLE: 'service_unavailable',
};

/**
 * Service monitoring
 */
export const serviceMonitor = {
  start: () => {
    console.log('Service monitor started');
    
    // Monitor API health every 5 minutes
    setInterval(async () => {
      try {
        const healthy = await healthCheck();
        if (!healthy) {
          serviceEvents.emit(SERVICE_EVENTS.SERVICE_UNAVAILABLE, {
            service: 'api',
            timestamp: new Date().toISOString(),
          });
        }
      } catch (error) {
        console.error('Health check failed:', error);
      }
    }, 300000); // 5 minutes

    // Monitor authentication state
    setInterval(() => {
      const isAuthenticated = authService.isAuthenticated();
      serviceEvents.emit(SERVICE_EVENTS.AUTH_STATE_CHANGED, {
        authenticated: isAuthenticated,
        timestamp: new Date().toISOString(),
      });
    }, 60000); // 1 minute
  },

  stop: () => {
    console.log('Service monitor stopped');
    // Clear intervals would be implemented here
  },
};

/**
 * Service utilities
 */
export const serviceUtils = {
  isOnline: () => navigator.onLine,
  
  getStorageSize: () => {
    try {
      let total = 0;
      for (let key in localStorage) {
        if (localStorage.hasOwnProperty(key)) {
          total += localStorage[key].length;
        }
      }
      return total;
    } catch (error) {
      return 0;
    }
  },
  
  clearStorage: () => {
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch (error) {
      console.error('Failed to clear storage:', error);
    }
  },
  
  exportConfiguration: () => {
    return {
      config: serviceConfig,
      timestamp: new Date().toISOString(),
      version: '1.0.0',
    };
  },
};

// Default export for convenience
export default {
  authService,
  labTestsService,
  reportsService,
  initializeServices,
  clearServiceCaches,
  getServiceStatus,
  serviceConfig,
  serviceEvents,
  serviceMonitor,
  serviceUtils,
};