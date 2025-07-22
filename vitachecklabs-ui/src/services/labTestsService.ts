// Lab Tests Service Integration

import { 
  apiUtils, 
  apiCache, 
  retryRequest,
  rateLimiter 
} from './api';
import {
  LabTest,
  LabTestCreate,
  LabTestUpdate,
  LabTestBooking,
  LabTestFilters,
  LabTestStats,
  LabTestCategory,
  Booking,
  PaginatedResponse,
  ApiResponse
} from '../types/api';

// Lab Tests service class
class LabTestsService {
  private readonly baseUrl = '/lab-tests/';
  private readonly cachePrefix = 'lab_tests_';

  /**
   * Get paginated list of lab tests with filtering
   */
  async getLabTests(filters: LabTestFilters = {}): Promise<PaginatedResponse<LabTest>> {
    try {
      // Create cache key based on filters
      const cacheKey = `${this.cachePrefix}list_${JSON.stringify(filters)}`;
      
      // Check cache first for public data
      if (!filters.is_active) { // Only cache public queries
        const cached = apiCache.get<PaginatedResponse<LabTest>>(cacheKey);
        if (cached) {
          return cached;
        }
      }

      console.log('Making API call to:', this.baseUrl, 'with filters:', filters);
      const response = await apiUtils.get<any>(
        this.baseUrl,
        filters
      );
      console.log('Raw API response:', response);
      console.log('Response type:', typeof response);
      console.log('Response keys:', Object.keys(response || {}));

      // Handle backend response format and map missing fields
      // The API returns a direct array, not wrapped in an object
      const rawTests = Array.isArray(response) ? response : (response.tests || response.data || []);
      console.log('Raw tests extracted:', rawTests);
      console.log('Raw tests length:', rawTests?.length);
      console.log('First test sample:', rawTests?.[0]);
      
      // Map raw test data to include required fields  
      const mappedTests = rawTests.map((test: any, index: number) => {
        console.log(`Mapping test ${index}:`, test);
        const mapped = {
          ...test,
          // Convert price from string to number
          price: parseFloat(test.price) || 0,
          // Ensure required fields are present
          id: test.id || test.test_id || test.uuid || String(Date.now() + index),
          display_name: test.display_name || test.name || test.title || 'Unknown Test',
          price_formatted: test.price_formatted || test.formatted_price || `₹${parseFloat(test.price) || 0}`
        };
        console.log(`Mapped test ${index}:`, mapped);
        return mapped;
      });
      
      console.log('Final mapped tests:', mappedTests);
      
      const formattedResponse: PaginatedResponse<LabTest> = {
        data: mappedTests,
        total: Array.isArray(response) ? response.length : (response.total || mappedTests.length),
        page: Array.isArray(response) ? 1 : (response.page || 1),
        per_page: Array.isArray(response) ? mappedTests.length : (response.per_page || 20),
        total_pages: Array.isArray(response) ? 1 : (response.total_pages || 1)
      };

      // Cache public data
      if (!filters.is_active) {
        apiCache.set(cacheKey, formattedResponse, 600000); // 10 minutes
      }

      return formattedResponse;
    } catch (error) {
      console.error('Failed to fetch lab tests:', error);
      throw error;
    }
  }

  /**
   * Get specific lab test by ID
   */
  async getLabTest(testId: string): Promise<LabTest> {
    try {
      const cacheKey = `${this.cachePrefix}detail_${testId}`;
      
      // Check cache first
      const cached = apiCache.get<LabTest>(cacheKey);
      if (cached) {
        return cached;
      }

      const response = await apiUtils.get<LabTest>(`${this.baseUrl}/${testId}`);
      
      // Cache test details
      apiCache.set(cacheKey, response, 1800000); // 30 minutes
      
      return response;
    } catch (error) {
      console.error(`Failed to fetch lab test ${testId}:`, error);
      throw error;
    }
  }

  /**
   * Create new lab test (Admin only)
   */
  async createLabTest(testData: LabTestCreate): Promise<LabTest> {
    try {
      const response = await apiUtils.post<LabTest>(this.baseUrl, testData);
      
      // Clear related cache
      this.clearCache();
      
      return response;
    } catch (error) {
      console.error('Failed to create lab test:', error);
      throw error;
    }
  }

  /**
   * Update lab test (Admin only)
   */
  async updateLabTest(testId: string, testData: LabTestUpdate): Promise<LabTest> {
    try {
      const response = await apiUtils.put<LabTest>(`${this.baseUrl}/${testId}`, testData);
      
      // Clear related cache
      this.clearCache();
      apiCache.clear(`${this.cachePrefix}detail_${testId}`);
      
      return response;
    } catch (error) {
      console.error(`Failed to update lab test ${testId}:`, error);
      throw error;
    }
  }

  /**
   * Delete lab test (Admin only)
   */
  async deleteLabTest(testId: string): Promise<ApiResponse<null>> {
    try {
      const response = await apiUtils.delete<ApiResponse<null>>(`${this.baseUrl}/${testId}`);
      
      // Clear related cache
      this.clearCache();
      apiCache.clear(`${this.cachePrefix}detail_${testId}`);
      
      return response;
    } catch (error) {
      console.error(`Failed to delete lab test ${testId}:`, error);
      throw error;
    }
  }

  /**
   * Get lab test categories with counts
   */
  async getCategories(): Promise<Array<{
    category: LabTestCategory;
    count: number;
    sub_categories?: Array<{
      name: string;
      count: number;
    }>;
  }>> {
    try {
      const cacheKey = `${this.cachePrefix}categories`;
      
      // Check cache first
      const cached = apiCache.get<any[]>(cacheKey);
      if (cached) {
        return cached;
      }

      const response = await apiUtils.get<any[]>(`${this.baseUrl}/categories/list`);
      
      // Cache categories
      apiCache.set(cacheKey, response, 3600000); // 1 hour
      
      return response;
    } catch (error) {
      console.error('Failed to fetch lab test categories:', error);
      throw error;
    }
  }

  /**
   * Book a lab test (Authenticated users only)
   */
  async bookLabTest(testId: string, bookingData: LabTestBooking): Promise<ApiResponse<{
    booking_id: string;
    status: string;
    scheduled_at: string;
    amount: number;
  }>> {
    try {
      // Check rate limit for booking
      const rateLimitKey = `booking_${testId}`;
      if (!rateLimiter.isAllowed(rateLimitKey, 5, 300000)) { // 5 bookings per 5 minutes
        throw new Error('Too many booking attempts. Please wait before trying again.');
      }

      const response = await retryRequest(
        () => apiUtils.post<ApiResponse<any>>(`/bookings/${testId}`, bookingData),
        1, // Single retry for booking
        2000 // 2 second delay
      );

      return response;
    } catch (error) {
      console.error(`Failed to book lab test ${testId}:`, error);
      throw error;
    }
  }

  /**
   * Get lab test statistics (Admin only)
   */
  async getStats(): Promise<LabTestStats> {
    try {
      const cacheKey = `${this.cachePrefix}stats`;
      
      // Check cache first
      const cached = apiCache.get<LabTestStats>(cacheKey);
      if (cached) {
        return cached;
      }

      const response = await apiUtils.get<LabTestStats>(`${this.baseUrl}/stats/overview`);
      
      // Cache stats for shorter period
      apiCache.set(cacheKey, response, 300000); // 5 minutes
      
      return response;
    } catch (error) {
      console.error('Failed to fetch lab test statistics:', error);
      throw error;
    }
  }

  /**
   * Search lab tests with advanced filtering
   */
  async searchLabTests(
    query: string, 
    filters: Omit<LabTestFilters, 'search'> = {}
  ): Promise<PaginatedResponse<LabTest>> {
    try {
      const searchFilters: LabTestFilters = {
        ...filters,
        search: query
      };

      return await this.getLabTests(searchFilters);
    } catch (error) {
      console.error('Failed to search lab tests:', error);
      throw error;
    }
  }

  /**
   * Get lab tests by category
   */
  async getLabTestsByCategory(
    category: LabTestCategory, 
    filters: Omit<LabTestFilters, 'category'> = {}
  ): Promise<PaginatedResponse<LabTest>> {
    try {
      const categoryFilters: LabTestFilters = {
        ...filters,
        category
      };

      return await this.getLabTests(categoryFilters);
    } catch (error) {
      console.error(`Failed to fetch lab tests for category ${category}:`, error);
      throw error;
    }
  }

  /**
   * Get lab tests by price range
   */
  async getLabTestsByPriceRange(
    minPrice: number, 
    maxPrice: number, 
    filters: Omit<LabTestFilters, 'min_price' | 'max_price'> = {}
  ): Promise<PaginatedResponse<LabTest>> {
    try {
      const priceFilters: LabTestFilters = {
        ...filters,
        min_price: minPrice,
        max_price: maxPrice
      };

      return await this.getLabTests(priceFilters);
    } catch (error) {
      console.error(`Failed to fetch lab tests for price range ${minPrice}-${maxPrice}:`, error);
      throw error;
    }
  }

  /**
   * Get home collection available tests
   */
  async getHomeCollectionTests(
    filters: Omit<LabTestFilters, 'is_home_collection_available'> = {}
  ): Promise<PaginatedResponse<LabTest>> {
    try {
      const homeCollectionFilters: LabTestFilters = {
        ...filters,
        is_home_collection_available: true
      };

      return await this.getLabTests(homeCollectionFilters);
    } catch (error) {
      console.error('Failed to fetch home collection tests:', error);
      throw error;
    }
  }

  /**
   * Get popular lab tests (most booked)
   */
  async getPopularLabTests(limit: number = 10): Promise<LabTest[]> {
    try {
      const cacheKey = `${this.cachePrefix}popular_${limit}`;
      
      // Check cache first
      const cached = apiCache.get<LabTest[]>(cacheKey);
      if (cached) {
        return cached;
      }

      // This would be implemented when backend supports it
      const response = await apiUtils.get<LabTest[]>(`${this.baseUrl}/popular`, {
        limit
      });
      
      // Cache popular tests
      apiCache.set(cacheKey, response, 1800000); // 30 minutes
      
      return response;
    } catch (error) {
      console.error('Failed to fetch popular lab tests:', error);
      // Fallback to regular lab tests
      const allTests = await this.getLabTests({ per_page: limit });
      return allTests.data;
    }
  }

  /**
   * Get recommended lab tests for user
   */
  async getRecommendedTests(userId?: string, limit: number = 5): Promise<LabTest[]> {
    try {
      const cacheKey = `${this.cachePrefix}recommended_${userId || 'anonymous'}_${limit}`;
      
      // Check cache first
      const cached = apiCache.get<LabTest[]>(cacheKey);
      if (cached) {
        return cached;
      }

      // This would be implemented when backend supports it
      const response = await apiUtils.get<LabTest[]>(`${this.baseUrl}/recommended`, {
        user_id: userId,
        limit
      });
      
      // Cache recommendations
      apiCache.set(cacheKey, response, 1800000); // 30 minutes
      
      return response;
    } catch (error) {
      console.error('Failed to fetch recommended lab tests:', error);
      // Fallback to popular tests
      return await this.getPopularLabTests(limit);
    }
  }

  /**
   * Get lab test price history (Admin only)
   */
  async getPriceHistory(testId: string): Promise<Array<{
    date: string;
    price: number;
    changed_by: string;
  }>> {
    try {
      const response = await apiUtils.get<any[]>(`${this.baseUrl}/${testId}/price-history`);
      return response;
    } catch (error) {
      console.error(`Failed to fetch price history for test ${testId}:`, error);
      throw error;
    }
  }

  /**
   * Bulk update lab tests (Admin only)
   */
  async bulkUpdateLabTests(
    testIds: string[], 
    updateData: Partial<LabTestUpdate>
  ): Promise<ApiResponse<{ updated_count: number }>> {
    try {
      const response = await apiUtils.put<ApiResponse<any>>(`${this.baseUrl}/bulk-update`, {
        test_ids: testIds,
        update_data: updateData
      });

      // Clear related cache
      this.clearCache();
      
      return response;
    } catch (error) {
      console.error('Failed to bulk update lab tests:', error);
      throw error;
    }
  }

  /**
   * Export lab tests data (Admin only)
   */
  async exportLabTests(
    format: 'csv' | 'xlsx' = 'csv',
    filters: LabTestFilters = {}
  ): Promise<void> {
    try {
      const response = await apiUtils.get(`${this.baseUrl}/export`, {
        format,
        ...filters
      });

      // This would handle file download
      // Implementation depends on how backend returns the file
      console.log('Export response:', response);
    } catch (error) {
      console.error('Failed to export lab tests:', error);
      throw error;
    }
  }

  /**
   * Get lab test booking history (Admin only)
   */
  async getBookingHistory(testId: string): Promise<Array<{
    booking_id: string;
    user_id: string;
    booked_at: string;
    status: string;
    amount: number;
  }>> {
    try {
      const response = await apiUtils.get<any[]>(`${this.baseUrl}/${testId}/bookings`);
      return response;
    } catch (error) {
      console.error(`Failed to fetch booking history for test ${testId}:`, error);
      throw error;
    }
  }

  /**
   * Check test availability
   */
  async checkTestAvailability(testId: string, date: string): Promise<{
    available: boolean;
    available_slots: string[];
    home_collection_available: boolean;
  }> {
    try {
      const response = await apiUtils.get<any>(`${this.baseUrl}/${testId}/availability`, {
        date
      });
      return response;
    } catch (error) {
      console.error(`Failed to check availability for test ${testId}:`, error);
      throw error;
    }
  }

  /**
   * Get test requirements and instructions
   */
  async getTestInstructions(testId: string): Promise<{
    pre_test_instructions: string[];
    post_test_instructions: string[];
    fasting_required: boolean;
    fasting_hours: number;
    special_requirements: string[];
  }> {
    try {
      const cacheKey = `${this.cachePrefix}instructions_${testId}`;
      
      // Check cache first
      const cached = apiCache.get<any>(cacheKey);
      if (cached) {
        return cached;
      }

      const response = await apiUtils.get<any>(`${this.baseUrl}/${testId}/instructions`);
      
      // Cache instructions
      apiCache.set(cacheKey, response, 3600000); // 1 hour
      
      return response;
    } catch (error) {
      console.error(`Failed to fetch instructions for test ${testId}:`, error);
      throw error;
    }
  }

  /**
   * Clear all lab tests cache
   */
  private clearCache(): void {
    // Clear all cache entries that start with the cache prefix
    const keys = Array.from(apiCache.cache.keys());
    keys.forEach(key => {
      if (key.startsWith(this.cachePrefix)) {
        apiCache.clear(key);
      }
    });
  }

  /**
   * Preload popular tests for better UX
   */
  async preloadPopularTests(): Promise<void> {
    try {
      await this.getPopularLabTests(20);
      await this.getCategories();
    } catch (error) {
      console.error('Failed to preload popular tests:', error);
      // Don't throw error for preloading
    }
  }

  /**
   * Get test comparison data
   */
  async compareTests(testIds: string[]): Promise<Array<{
    test: LabTest;
    comparison_metrics: {
      price_rank: number;
      popularity_rank: number;
      delivery_time_rank: number;
    };
  }>> {
    try {
      const response = await apiUtils.post<any[]>(`${this.baseUrl}/compare`, {
        test_ids: testIds
      });
      return response;
    } catch (error) {
      console.error('Failed to compare tests:', error);
      throw error;
    }
  }

  /**
   * Get user's bookings
   */
  async getUserBookings(): Promise<PaginatedResponse<Booking>> {
    try {
      const cacheKey = `${this.cachePrefix}user_bookings`;
      
      // Check cache first
      const cached = apiCache.get<PaginatedResponse<Booking>>(cacheKey);
      if (cached) {
        return cached;
      }

      console.log('Fetching user bookings...');
      
      // Try multiple possible endpoints for bookings
      const possibleEndpoints = [
        '/bookings/bookings/my',  // Correct endpoint based on user feedback
        '/bookings/my',
        '/bookings/',
        '/user/bookings',
        '/users/me/bookings',
        '/appointments/my',
        '/appointments/'
      ];

      let response = null;
      let usedEndpoint = '';

      for (const endpoint of possibleEndpoints) {
        try {
          console.log(`Trying endpoint: ${endpoint}`);
          response = await apiUtils.get<any>(endpoint);
          usedEndpoint = endpoint;
          console.log(`✅ Success with endpoint: ${endpoint}`);
          break;
        } catch (endpointError: any) {
          console.log(`❌ Failed endpoint ${endpoint}:`, endpointError?.response?.status || endpointError.message);
          continue;
        }
      }

      if (!response) {
        throw new Error('No available bookings endpoint found. The backend may not have implemented the bookings retrieval API yet.');
      }

      console.log(`User bookings response from ${usedEndpoint}:`, response);

      // Handle backend response format - check different possible structures
      let bookingsData = [];
      if (Array.isArray(response)) {
        // Direct array response
        bookingsData = response;
      } else if (response.bookings) {
        // {bookings: [...]}
        bookingsData = response.bookings;
      } else if (response.data) {
        // {data: [...]}
        bookingsData = response.data;
      } else if (response.results) {
        // {results: [...]}
        bookingsData = response.results;
      }

      console.log('Extracted bookings data:', bookingsData);

      const formattedResponse: PaginatedResponse<Booking> = {
        data: bookingsData,
        total: response.total || response.count || bookingsData.length,
        page: response.page || 1,
        per_page: response.per_page || response.limit || 20,
        total_pages: response.total_pages || Math.ceil((response.total || bookingsData.length) / (response.per_page || 20))
      };

      // Cache for shorter period due to dynamic nature
      apiCache.set(cacheKey, formattedResponse, 300000); // 5 minutes

      return formattedResponse;
    } catch (error) {
      console.error('Failed to fetch user bookings:', error);
      throw error;
    }
  }

  /**
   * Cancel a booking
   */
  async cancelBooking(bookingId: string): Promise<ApiResponse<{ cancelled: boolean }>> {
    try {
      console.log('Cancelling booking:', bookingId);
      
      const response = await apiUtils.post<ApiResponse<any>>(
        `/bookings/${bookingId}/cancel`,
        {}
      );

      // Clear related cache
      this.clearBookingsCache();
      
      return response;
    } catch (error) {
      console.error(`Failed to cancel booking ${bookingId}:`, error);
      throw error;
    }
  }

  /**
   * Get booking details by ID
   */
  async getBooking(bookingId: string): Promise<Booking> {
    try {
      const cacheKey = `${this.cachePrefix}booking_${bookingId}`;
      
      // Check cache first
      const cached = apiCache.get<Booking>(cacheKey);
      if (cached) {
        return cached;
      }

      const response = await apiUtils.get<Booking>(`/bookings/${bookingId}`);
      
      // Cache booking details
      apiCache.set(cacheKey, response, 600000); // 10 minutes
      
      return response;
    } catch (error) {
      console.error(`Failed to fetch booking ${bookingId}:`, error);
      throw error;
    }
  }

  /**
   * Clear bookings cache
   */
  private clearBookingsCache(): void {
    const keys = Array.from(apiCache.cache.keys());
    keys.forEach(key => {
      if (key.includes('user_bookings') || key.includes('booking_')) {
        apiCache.clear(key);
      }
    });
  }
}

// Export singleton instance
export const labTestsService = new LabTestsService();
export default labTestsService;