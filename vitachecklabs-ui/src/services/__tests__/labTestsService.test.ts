import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import labTestsService from '../labTestsService';
import { apiUtils, apiCache, retryRequest, rateLimiter } from '../api';
import { 
  LabTest, 
  LabTestCreate, 
  LabTestUpdate, 
  LabTestBooking, 
  LabTestCategory, 
  SampleType,
  PaginatedResponse 
} from '../../types/api';

// Mock dependencies
vi.mock('../api', () => ({
  apiUtils: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
  apiCache: {
    get: vi.fn(),
    set: vi.fn(),
    clear: vi.fn(),
    cache: new Map(),
  },
  retryRequest: vi.fn(),
  rateLimiter: {
    isAllowed: vi.fn(),
  },
}));

describe('LabTestsService', () => {
  const mockLabTest: LabTest = {
    id: '1',
    name: 'Complete Blood Count',
    code: 'CBC001',
    description: 'Basic blood test',
    category: LabTestCategory.HEMATOLOGY,
    sub_category: 'Basic Tests',
    sample_type: SampleType.BLOOD,
    requirements: 'Fasting required',
    procedure: 'Blood draw',
    price: 50.0,
    is_active: true,
    is_home_collection_available: true,
    minimum_age: 0,
    maximum_age: 120,
    duration_minutes: 15,
    report_delivery_hours: 24,
    created_at: '2023-01-01T00:00:00Z',
    updated_at: '2023-01-01T00:00:00Z',
  };

  const mockPaginatedResponse: PaginatedResponse<LabTest> = {
    data: [mockLabTest],
    page: 1,
    per_page: 20,
    total: 1,
    total_pages: 1,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (apiCache.cache as Map<string, any>).clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getLabTests', () => {
    it('should fetch lab tests successfully', async () => {
      (apiUtils.get as any).mockResolvedValue(mockPaginatedResponse);

      const result = await labTestsService.getLabTests();

      expect(result).toEqual(mockPaginatedResponse);
      expect(apiUtils.get).toHaveBeenCalledWith('/lab-tests', {});
    });

    it('should return cached result for public queries', async () => {
      const cachedResponse = { ...mockPaginatedResponse, cached: true };
      (apiCache.get as any).mockReturnValue(cachedResponse);

      const result = await labTestsService.getLabTests();

      expect(result).toEqual(cachedResponse);
      expect(apiUtils.get).not.toHaveBeenCalled();
    });

    it('should not cache admin queries', async () => {
      (apiUtils.get as any).mockResolvedValue(mockPaginatedResponse);

      const result = await labTestsService.getLabTests({ is_active: false });

      expect(result).toEqual(mockPaginatedResponse);
      expect(apiCache.set).not.toHaveBeenCalled();
    });

    it('should handle API errors', async () => {
      const error = { message: 'Failed to fetch lab tests', status: 500 };
      (apiUtils.get as any).mockRejectedValue(error);

      await expect(labTestsService.getLabTests()).rejects.toEqual(error);
    });
  });

  describe('getLabTest', () => {
    it('should fetch single lab test successfully', async () => {
      (apiUtils.get as any).mockResolvedValue(mockLabTest);

      const result = await labTestsService.getLabTest('1');

      expect(result).toEqual(mockLabTest);
      expect(apiUtils.get).toHaveBeenCalledWith('/lab-tests/1');
      expect(apiCache.set).toHaveBeenCalledWith(
        'lab_tests_detail_1',
        mockLabTest,
        1800000
      );
    });

    it('should return cached result', async () => {
      (apiCache.get as any).mockReturnValue(mockLabTest);

      const result = await labTestsService.getLabTest('1');

      expect(result).toEqual(mockLabTest);
      expect(apiUtils.get).not.toHaveBeenCalled();
    });
  });

  describe('createLabTest', () => {
    it('should create lab test successfully', async () => {
      const createData: LabTestCreate = {
        name: 'New Test',
        code: 'NT001',
        description: 'New test description',
        category: LabTestCategory.BLOOD_CHEMISTRY,
        sample_type: SampleType.BLOOD,
        price: 75.0,
        is_home_collection_available: true,
      };

      (apiUtils.post as any).mockResolvedValue(mockLabTest);

      const result = await labTestsService.createLabTest(createData);

      expect(result).toEqual(mockLabTest);
      expect(apiUtils.post).toHaveBeenCalledWith('/lab-tests', createData);
    });

    it('should clear cache after creation', async () => {
      const createData: LabTestCreate = {
        name: 'New Test',
        code: 'NT001',
        description: 'New test description',
        category: LabTestCategory.BLOOD_CHEMISTRY,
        sample_type: SampleType.BLOOD,
        price: 75.0,
        is_home_collection_available: true,
      };

      (apiUtils.post as any).mockResolvedValue(mockLabTest);

      await labTestsService.createLabTest(createData);

      // Check that cache clearing was attempted
      expect(apiCache.clear).toHaveBeenCalled();
    });
  });

  describe('updateLabTest', () => {
    it('should update lab test successfully', async () => {
      const updateData: LabTestUpdate = {
        name: 'Updated Test',
        price: 80.0,
      };

      (apiUtils.put as any).mockResolvedValue({ ...mockLabTest, ...updateData });

      const result = await labTestsService.updateLabTest('1', updateData);

      expect(result).toEqual({ ...mockLabTest, ...updateData });
      expect(apiUtils.put).toHaveBeenCalledWith('/lab-tests/1', updateData);
    });
  });

  describe('deleteLabTest', () => {
    it('should delete lab test successfully', async () => {
      const mockResponse = { data: null, message: 'Test deleted', success: true };
      (apiUtils.delete as any).mockResolvedValue(mockResponse);

      const result = await labTestsService.deleteLabTest('1');

      expect(result).toEqual(mockResponse);
      expect(apiUtils.delete).toHaveBeenCalledWith('/lab-tests/1');
    });
  });

  describe('getCategories', () => {
    it('should fetch categories successfully', async () => {
      const mockCategories = [
        {
          category: LabTestCategory.HEMATOLOGY,
          count: 5,
          sub_categories: [
            { name: 'Basic Tests', count: 3 },
            { name: 'Advanced Tests', count: 2 },
          ],
        },
      ];

      (apiUtils.get as any).mockResolvedValue(mockCategories);

      const result = await labTestsService.getCategories();

      expect(result).toEqual(mockCategories);
      expect(apiUtils.get).toHaveBeenCalledWith('/lab-tests/categories/list');
      expect(apiCache.set).toHaveBeenCalledWith(
        'lab_tests_categories',
        mockCategories,
        3600000
      );
    });

    it('should return cached categories', async () => {
      const mockCategories = [
        {
          category: LabTestCategory.HEMATOLOGY,
          count: 5,
        },
      ];

      (apiCache.get as any).mockReturnValue(mockCategories);

      const result = await labTestsService.getCategories();

      expect(result).toEqual(mockCategories);
      expect(apiUtils.get).not.toHaveBeenCalled();
    });
  });

  describe('bookLabTest', () => {
    it('should book lab test successfully', async () => {
      const bookingData: LabTestBooking = {
        preferred_date: '2023-12-01',
        preferred_time: '10:00',
        is_home_collection: true,
        collection_address: '123 Test St',
        patient_age: 30,
        notes: 'Test booking',
      };

      const mockResponse = {
        data: {
          booking_id: 'booking123',
          status: 'confirmed',
          scheduled_at: '2023-12-01T10:00:00Z',
          amount: 50.0,
        },
        message: 'Booking confirmed',
        success: true,
      };

      (rateLimiter.isAllowed as any).mockReturnValue(true);
      (retryRequest as any).mockResolvedValue(mockResponse);

      const result = await labTestsService.bookLabTest('1', bookingData);

      expect(result).toEqual(mockResponse);
      expect(rateLimiter.isAllowed).toHaveBeenCalledWith('booking_1', 5, 300000);
    });

    it('should handle rate limiting', async () => {
      const bookingData: LabTestBooking = {
        preferred_date: '2023-12-01',
        preferred_time: '10:00',
        is_home_collection: false,
        patient_age: 30,
      };

      (rateLimiter.isAllowed as any).mockReturnValue(false);

      await expect(labTestsService.bookLabTest('1', bookingData)).rejects.toThrow(
        'Too many booking attempts'
      );
    });
  });

  describe('getStats', () => {
    it('should fetch lab test statistics', async () => {
      const mockStats = {
        total_tests: 100,
        active_tests: 80,
        categories_count: {
          [LabTestCategory.HEMATOLOGY]: 20,
          [LabTestCategory.BLOOD_CHEMISTRY]: 30,
        },
        average_price: 65.5,
        home_collection_percentage: 70,
      };

      (apiUtils.get as any).mockResolvedValue(mockStats);

      const result = await labTestsService.getStats();

      expect(result).toEqual(mockStats);
      expect(apiUtils.get).toHaveBeenCalledWith('/lab-tests/stats/overview');
    });
  });

  describe('searchLabTests', () => {
    it('should search lab tests successfully', async () => {
      (apiUtils.get as any).mockResolvedValue(mockPaginatedResponse);

      const result = await labTestsService.searchLabTests('blood test');

      expect(result).toEqual(mockPaginatedResponse);
      expect(apiUtils.get).toHaveBeenCalledWith('/lab-tests', {
        search: 'blood test',
      });
    });

    it('should search with additional filters', async () => {
      (apiUtils.get as any).mockResolvedValue(mockPaginatedResponse);

      const result = await labTestsService.searchLabTests('blood test', {
        category: LabTestCategory.HEMATOLOGY,
        min_price: 20,
        max_price: 100,
      });

      expect(result).toEqual(mockPaginatedResponse);
      expect(apiUtils.get).toHaveBeenCalledWith('/lab-tests', {
        search: 'blood test',
        category: LabTestCategory.HEMATOLOGY,
        min_price: 20,
        max_price: 100,
      });
    });
  });

  describe('getLabTestsByCategory', () => {
    it('should fetch lab tests by category', async () => {
      (apiUtils.get as any).mockResolvedValue(mockPaginatedResponse);

      const result = await labTestsService.getLabTestsByCategory(
        LabTestCategory.HEMATOLOGY
      );

      expect(result).toEqual(mockPaginatedResponse);
      expect(apiUtils.get).toHaveBeenCalledWith('/lab-tests', {
        category: LabTestCategory.HEMATOLOGY,
      });
    });
  });

  describe('getLabTestsByPriceRange', () => {
    it('should fetch lab tests by price range', async () => {
      (apiUtils.get as any).mockResolvedValue(mockPaginatedResponse);

      const result = await labTestsService.getLabTestsByPriceRange(20, 100);

      expect(result).toEqual(mockPaginatedResponse);
      expect(apiUtils.get).toHaveBeenCalledWith('/lab-tests', {
        min_price: 20,
        max_price: 100,
      });
    });
  });

  describe('getHomeCollectionTests', () => {
    it('should fetch home collection tests', async () => {
      (apiUtils.get as any).mockResolvedValue(mockPaginatedResponse);

      const result = await labTestsService.getHomeCollectionTests();

      expect(result).toEqual(mockPaginatedResponse);
      expect(apiUtils.get).toHaveBeenCalledWith('/lab-tests', {
        is_home_collection_available: true,
      });
    });
  });

  describe('getPopularLabTests', () => {
    it('should fetch popular lab tests', async () => {
      const mockPopularTests = [mockLabTest];
      (apiUtils.get as any).mockResolvedValue(mockPopularTests);

      const result = await labTestsService.getPopularLabTests(10);

      expect(result).toEqual(mockPopularTests);
      expect(apiUtils.get).toHaveBeenCalledWith('/lab-tests/popular', {
        limit: 10,
      });
    });

    it('should fallback to regular tests if popular tests fail', async () => {
      (apiUtils.get as any)
        .mockRejectedValueOnce(new Error('Popular tests not available'))
        .mockResolvedValueOnce(mockPaginatedResponse);

      const result = await labTestsService.getPopularLabTests(10);

      expect(result).toEqual(mockPaginatedResponse.data);
    });
  });

  describe('getRecommendedTests', () => {
    it('should fetch recommended tests', async () => {
      const mockRecommendedTests = [mockLabTest];
      (apiUtils.get as any).mockResolvedValue(mockRecommendedTests);

      const result = await labTestsService.getRecommendedTests('user123', 5);

      expect(result).toEqual(mockRecommendedTests);
      expect(apiUtils.get).toHaveBeenCalledWith('/lab-tests/recommended', {
        user_id: 'user123',
        limit: 5,
      });
    });

    it('should fallback to popular tests if recommendations fail', async () => {
      const mockPopularTests = [mockLabTest];
      (apiUtils.get as any)
        .mockRejectedValueOnce(new Error('Recommendations not available'))
        .mockResolvedValueOnce(mockPopularTests);

      const result = await labTestsService.getRecommendedTests('user123', 5);

      expect(result).toEqual(mockPopularTests);
    });
  });

  describe('checkTestAvailability', () => {
    it('should check test availability', async () => {
      const mockAvailability = {
        available: true,
        available_slots: ['09:00', '10:00', '11:00'],
        home_collection_available: true,
      };

      (apiUtils.get as any).mockResolvedValue(mockAvailability);

      const result = await labTestsService.checkTestAvailability('1', '2023-12-01');

      expect(result).toEqual(mockAvailability);
      expect(apiUtils.get).toHaveBeenCalledWith('/lab-tests/1/availability', {
        date: '2023-12-01',
      });
    });
  });

  describe('getTestInstructions', () => {
    it('should fetch test instructions', async () => {
      const mockInstructions = {
        pre_test_instructions: ['Fast for 12 hours', 'Avoid alcohol'],
        post_test_instructions: ['Rest for 10 minutes', 'Drink water'],
        fasting_required: true,
        fasting_hours: 12,
        special_requirements: ['Bring ID', 'Wear comfortable clothing'],
      };

      (apiUtils.get as any).mockResolvedValue(mockInstructions);

      const result = await labTestsService.getTestInstructions('1');

      expect(result).toEqual(mockInstructions);
      expect(apiUtils.get).toHaveBeenCalledWith('/lab-tests/1/instructions');
      expect(apiCache.set).toHaveBeenCalledWith(
        'lab_tests_instructions_1',
        mockInstructions,
        3600000
      );
    });
  });

  describe('bulkUpdateLabTests', () => {
    it('should bulk update lab tests', async () => {
      const mockResponse = {
        data: { updated_count: 3 },
        message: 'Tests updated successfully',
        success: true,
      };

      (apiUtils.put as any).mockResolvedValue(mockResponse);

      const result = await labTestsService.bulkUpdateLabTests(
        ['1', '2', '3'],
        { is_active: false }
      );

      expect(result).toEqual(mockResponse);
      expect(apiUtils.put).toHaveBeenCalledWith('/lab-tests/bulk-update', {
        test_ids: ['1', '2', '3'],
        update_data: { is_active: false },
      });
    });
  });

  describe('compareTests', () => {
    it('should compare tests', async () => {
      const mockComparison = [
        {
          test: mockLabTest,
          comparison_metrics: {
            price_rank: 1,
            popularity_rank: 2,
            delivery_time_rank: 1,
          },
        },
      ];

      (apiUtils.post as any).mockResolvedValue(mockComparison);

      const result = await labTestsService.compareTests(['1', '2']);

      expect(result).toEqual(mockComparison);
      expect(apiUtils.post).toHaveBeenCalledWith('/lab-tests/compare', {
        test_ids: ['1', '2'],
      });
    });
  });

  describe('preloadPopularTests', () => {
    it('should preload popular tests without throwing errors', async () => {
      const mockPopularTests = [mockLabTest];
      const mockCategories = [
        {
          category: LabTestCategory.HEMATOLOGY,
          count: 5,
        },
      ];

      (apiUtils.get as any)
        .mockResolvedValueOnce(mockPopularTests)
        .mockResolvedValueOnce(mockCategories);

      await expect(labTestsService.preloadPopularTests()).resolves.not.toThrow();
    });

    it('should handle preload errors gracefully', async () => {
      (apiUtils.get as any).mockRejectedValue(new Error('Preload failed'));

      await expect(labTestsService.preloadPopularTests()).resolves.not.toThrow();
    });
  });
});