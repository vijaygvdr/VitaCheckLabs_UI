import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import reportsService from '../reportsService';
import { apiUtils, apiCache, rateLimiter } from '../api';
import { 
  Report, 
  ReportCreate, 
  ReportUpdate, 
  ReportShare, 
  ReportStatus, 
  PaymentStatus, 
  ReportPriority,
  PaginatedResponse 
} from '../../types/api';

// Mock dependencies
vi.mock('../api', () => ({
  apiUtils: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
    uploadFile: vi.fn(),
  },
  apiCache: {
    get: vi.fn(),
    set: vi.fn(),
    clear: vi.fn(),
    cache: new Map(),
  },
  rateLimiter: {
    isAllowed: vi.fn(),
  },
}));

// Mock DOM for file download
Object.defineProperty(document, 'createElement', {
  value: vi.fn(() => ({
    href: '',
    download: '',
    click: vi.fn(),
  })),
});

Object.defineProperty(document, 'body', {
  value: {
    appendChild: vi.fn(),
    removeChild: vi.fn(),
  },
});

describe('ReportsService', () => {
  const mockReport: Report = {
    id: '1',
    user_id: 'user123',
    lab_test_id: 'test123',
    report_number: 'RPT001',
    status: ReportStatus.COMPLETED,
    scheduled_at: '2023-12-01T10:00:00Z',
    collected_at: '2023-12-01T10:00:00Z',
    processed_at: '2023-12-01T12:00:00Z',
    completed_at: '2023-12-01T14:00:00Z',
    collection_location: 'Lab Center',
    results: 'Normal values',
    observations: 'No issues found',
    recommendations: 'Continue healthy lifestyle',
    file_path: '/reports/RPT001.pdf',
    file_original_name: 'report.pdf',
    file_size: 1024,
    is_shared: false,
    amount_charged: 50.0,
    payment_status: PaymentStatus.PAID,
    payment_reference: 'PAY123',
    priority: ReportPriority.NORMAL,
    created_at: '2023-12-01T08:00:00Z',
    updated_at: '2023-12-01T14:00:00Z',
    lab_test: {
      id: 'test123',
      name: 'Blood Test',
      code: 'BT001',
      description: 'Basic blood test',
      category: 'HEMATOLOGY' as any,
      sample_type: 'BLOOD' as any,
      price: 50.0,
      is_active: true,
      is_home_collection_available: true,
      created_at: '2023-01-01T00:00:00Z',
      updated_at: '2023-01-01T00:00:00Z',
    },
  };

  const mockPaginatedResponse: PaginatedResponse<Report> = {
    data: [mockReport],
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

  describe('getReports', () => {
    it('should fetch reports successfully', async () => {
      (apiUtils.get as any).mockResolvedValue(mockPaginatedResponse);

      const result = await reportsService.getReports();

      expect(result).toEqual(mockPaginatedResponse);
      expect(apiUtils.get).toHaveBeenCalledWith('/reports', {});
    });

    it('should return cached result', async () => {
      const cachedResponse = { ...mockPaginatedResponse, cached: true };
      (apiCache.get as any).mockReturnValue(cachedResponse);

      const result = await reportsService.getReports();

      expect(result).toEqual(cachedResponse);
      expect(apiUtils.get).not.toHaveBeenCalled();
    });

    it('should handle API errors', async () => {
      const error = { message: 'Failed to fetch reports', status: 500 };
      (apiUtils.get as any).mockRejectedValue(error);

      await expect(reportsService.getReports()).rejects.toEqual(error);
    });
  });

  describe('getReport', () => {
    it('should fetch single report successfully', async () => {
      (apiUtils.get as any).mockResolvedValue(mockReport);

      const result = await reportsService.getReport('1');

      expect(result).toEqual(mockReport);
      expect(apiUtils.get).toHaveBeenCalledWith('/reports/1');
      expect(apiCache.set).toHaveBeenCalledWith(
        'reports_detail_1',
        mockReport,
        600000
      );
    });

    it('should return cached result', async () => {
      (apiCache.get as any).mockReturnValue(mockReport);

      const result = await reportsService.getReport('1');

      expect(result).toEqual(mockReport);
      expect(apiUtils.get).not.toHaveBeenCalled();
    });
  });

  describe('createReport', () => {
    it('should create report successfully', async () => {
      const createData: ReportCreate = {
        lab_test_id: 'test123',
        scheduled_at: '2023-12-01T10:00:00Z',
        is_home_collection: true,
        collection_address: '123 Test St',
        patient_age: 30,
        notes: 'Test report',
      };

      (apiUtils.post as any).mockResolvedValue(mockReport);

      const result = await reportsService.createReport(createData);

      expect(result).toEqual(mockReport);
      expect(apiUtils.post).toHaveBeenCalledWith('/reports', createData);
    });

    it('should clear cache after creation', async () => {
      const createData: ReportCreate = {
        lab_test_id: 'test123',
        is_home_collection: false,
        patient_age: 30,
      };

      (apiUtils.post as any).mockResolvedValue(mockReport);

      await reportsService.createReport(createData);

      expect(apiCache.clear).toHaveBeenCalled();
    });
  });

  describe('updateReport', () => {
    it('should update report successfully', async () => {
      const updateData: ReportUpdate = {
        status: ReportStatus.PROCESSING,
        observations: 'Updated observations',
      };

      (apiUtils.put as any).mockResolvedValue({ ...mockReport, ...updateData });

      const result = await reportsService.updateReport('1', updateData);

      expect(result).toEqual({ ...mockReport, ...updateData });
      expect(apiUtils.put).toHaveBeenCalledWith('/reports/1', updateData);
    });
  });

  describe('deleteReport', () => {
    it('should delete report successfully', async () => {
      const mockResponse = { data: null, message: 'Report deleted', success: true };
      (apiUtils.delete as any).mockResolvedValue(mockResponse);

      const result = await reportsService.deleteReport('1');

      expect(result).toEqual(mockResponse);
      expect(apiUtils.delete).toHaveBeenCalledWith('/reports/1');
    });
  });

  describe('uploadReportFile', () => {
    it('should upload report file successfully', async () => {
      const file = new File(['test content'], 'test.pdf', { type: 'application/pdf' });
      const mockResponse = {
        data: {
          file_path: '/reports/test.pdf',
          file_size: 1024,
          upload_id: 'upload123',
        },
        message: 'File uploaded successfully',
        success: true,
      };

      (apiUtils.uploadFile as any).mockResolvedValue(mockResponse);

      const result = await reportsService.uploadReportFile('1', file);

      expect(result).toEqual(mockResponse);
      expect(apiUtils.uploadFile).toHaveBeenCalledWith(
        '/reports/1/upload',
        file,
        undefined
      );
    });

    it('should handle file size validation', async () => {
      // Create a file larger than 10MB
      const largeFile = new File(['x'.repeat(11 * 1024 * 1024)], 'large.pdf', {
        type: 'application/pdf',
      });

      await expect(reportsService.uploadReportFile('1', largeFile)).rejects.toThrow(
        'File size exceeds 10MB limit'
      );
    });

    it('should handle file type validation', async () => {
      const invalidFile = new File(['test'], 'test.txt', { type: 'text/plain' });

      await expect(reportsService.uploadReportFile('1', invalidFile)).rejects.toThrow(
        'Invalid file type'
      );
    });

    it('should call progress callback', async () => {
      const file = new File(['test content'], 'test.pdf', { type: 'application/pdf' });
      const progressCallback = vi.fn();
      const mockResponse = {
        data: {
          file_path: '/reports/test.pdf',
          file_size: 1024,
          upload_id: 'upload123',
        },
        message: 'File uploaded successfully',
        success: true,
      };

      (apiUtils.uploadFile as any).mockResolvedValue(mockResponse);

      await reportsService.uploadReportFile('1', file, progressCallback);

      expect(apiUtils.uploadFile).toHaveBeenCalledWith(
        '/reports/1/upload',
        file,
        progressCallback
      );
    });
  });

  describe('downloadReport', () => {
    it('should get download link successfully', async () => {
      const mockDownloadResponse = {
        download_url: 'https://example.com/download/report.pdf',
        expires_at: '2023-12-01T18:00:00Z',
      };

      (apiUtils.get as any).mockResolvedValue(mockDownloadResponse);

      const result = await reportsService.downloadReport('1');

      expect(result).toEqual(mockDownloadResponse);
      expect(apiUtils.get).toHaveBeenCalledWith('/reports/1/download');
    });
  });

  describe('downloadReportFile', () => {
    it('should download report file successfully', async () => {
      const mockDownloadResponse = {
        download_url: 'https://example.com/download/report.pdf',
        expires_at: '2023-12-01T18:00:00Z',
      };

      (apiUtils.get as any).mockResolvedValue(mockDownloadResponse);

      const mockLink = {
        href: '',
        download: '',
        click: vi.fn(),
      };
      (document.createElement as any).mockReturnValue(mockLink);

      await reportsService.downloadReportFile('1', 'custom-report.pdf');

      expect(mockLink.href).toBe(mockDownloadResponse.download_url);
      expect(mockLink.download).toBe('custom-report.pdf');
      expect(mockLink.click).toHaveBeenCalled();
    });
  });

  describe('shareReport', () => {
    it('should share report successfully', async () => {
      const shareData: ReportShare = {
        email_addresses: ['user@example.com', 'doctor@example.com'],
        message: 'Please review this report',
        expires_at: '2023-12-31T23:59:59Z',
      };

      const mockResponse = {
        data: {
          shared_with: shareData.email_addresses,
          share_id: 'share123',
          expires_at: shareData.expires_at,
        },
        message: 'Report shared successfully',
        success: true,
      };

      (rateLimiter.isAllowed as any).mockReturnValue(true);
      (apiUtils.post as any).mockResolvedValue(mockResponse);

      const result = await reportsService.shareReport('1', shareData);

      expect(result).toEqual(mockResponse);
      expect(apiUtils.post).toHaveBeenCalledWith('/reports/1/share', shareData);
      expect(rateLimiter.isAllowed).toHaveBeenCalledWith('share_1', 10, 3600000);
    });

    it('should handle rate limiting', async () => {
      const shareData: ReportShare = {
        email_addresses: ['user@example.com'],
      };

      (rateLimiter.isAllowed as any).mockReturnValue(false);

      await expect(reportsService.shareReport('1', shareData)).rejects.toThrow(
        'Too many sharing attempts'
      );
    });
  });

  describe('getReportStats', () => {
    it('should fetch report statistics', async () => {
      const mockStats = {
        total_reports: 100,
        status_counts: {
          [ReportStatus.PENDING]: 10,
          [ReportStatus.COMPLETED]: 80,
          [ReportStatus.PROCESSING]: 5,
          [ReportStatus.CANCELLED]: 5,
        },
        payment_status_counts: {
          [PaymentStatus.PAID]: 85,
          [PaymentStatus.PENDING]: 10,
          [PaymentStatus.FAILED]: 5,
        },
        priority_counts: {
          [ReportPriority.NORMAL]: 70,
          [ReportPriority.HIGH]: 20,
          [ReportPriority.URGENT]: 10,
        },
        total_revenue: 5000.0,
        average_processing_time: 24.5,
      };

      (apiUtils.get as any).mockResolvedValue(mockStats);

      const result = await reportsService.getReportStats();

      expect(result).toEqual(mockStats);
      expect(apiUtils.get).toHaveBeenCalledWith('/reports/stats/overview');
    });
  });

  describe('getReportsByStatus', () => {
    it('should fetch reports by status', async () => {
      (apiUtils.get as any).mockResolvedValue(mockPaginatedResponse);

      const result = await reportsService.getReportsByStatus(ReportStatus.PENDING);

      expect(result).toEqual(mockPaginatedResponse);
      expect(apiUtils.get).toHaveBeenCalledWith('/reports', {
        status: ReportStatus.PENDING,
      });
    });
  });

  describe('getReportsByPaymentStatus', () => {
    it('should fetch reports by payment status', async () => {
      (apiUtils.get as any).mockResolvedValue(mockPaginatedResponse);

      const result = await reportsService.getReportsByPaymentStatus(PaymentStatus.PAID);

      expect(result).toEqual(mockPaginatedResponse);
      expect(apiUtils.get).toHaveBeenCalledWith('/reports', {
        payment_status: PaymentStatus.PAID,
      });
    });
  });

  describe('getReportsByPriority', () => {
    it('should fetch reports by priority', async () => {
      (apiUtils.get as any).mockResolvedValue(mockPaginatedResponse);

      const result = await reportsService.getReportsByPriority(ReportPriority.HIGH);

      expect(result).toEqual(mockPaginatedResponse);
      expect(apiUtils.get).toHaveBeenCalledWith('/reports', {
        priority: ReportPriority.HIGH,
      });
    });
  });

  describe('getReportsByDateRange', () => {
    it('should fetch reports by date range', async () => {
      (apiUtils.get as any).mockResolvedValue(mockPaginatedResponse);

      const result = await reportsService.getReportsByDateRange(
        '2023-12-01',
        '2023-12-31'
      );

      expect(result).toEqual(mockPaginatedResponse);
      expect(apiUtils.get).toHaveBeenCalledWith('/reports', {
        start_date: '2023-12-01',
        end_date: '2023-12-31',
      });
    });
  });

  describe('searchReports', () => {
    it('should search reports successfully', async () => {
      (apiUtils.get as any).mockResolvedValue(mockPaginatedResponse);

      const result = await reportsService.searchReports('blood test');

      expect(result).toEqual(mockPaginatedResponse);
      expect(apiUtils.get).toHaveBeenCalledWith('/reports', {
        search: 'blood test',
      });
    });
  });

  describe('updateReportStatus', () => {
    it('should update report status successfully', async () => {
      const now = new Date().toISOString();
      const updatedReport = {
        ...mockReport,
        status: ReportStatus.COLLECTED,
        collected_at: now,
      };

      (apiUtils.put as any).mockResolvedValue(updatedReport);

      // Mock Date.now to return consistent time
      const mockDate = new Date('2023-12-01T12:00:00Z');
      vi.spyOn(global, 'Date').mockImplementation(() => mockDate);

      const result = await reportsService.updateReportStatus(
        '1',
        ReportStatus.COLLECTED,
        'Sample collected successfully'
      );

      expect(result).toEqual(updatedReport);
      expect(apiUtils.put).toHaveBeenCalledWith('/reports/1', {
        status: ReportStatus.COLLECTED,
        collected_at: mockDate.toISOString(),
        observations: 'Sample collected successfully',
      });
    });
  });

  describe('updateReportPriority', () => {
    it('should update report priority successfully', async () => {
      const updatedReport = {
        ...mockReport,
        priority: ReportPriority.HIGH,
      };

      (apiUtils.put as any).mockResolvedValue(updatedReport);

      const result = await reportsService.updateReportPriority('1', ReportPriority.HIGH);

      expect(result).toEqual(updatedReport);
      expect(apiUtils.put).toHaveBeenCalledWith('/reports/1', {
        priority: ReportPriority.HIGH,
      });
    });
  });

  describe('addReportResults', () => {
    it('should add report results successfully', async () => {
      const mockDate = new Date('2023-12-01T14:00:00Z');
      vi.spyOn(global, 'Date').mockImplementation(() => mockDate);

      const updatedReport = {
        ...mockReport,
        results: 'Normal values',
        observations: 'All tests within normal range',
        recommendations: 'Continue healthy lifestyle',
        status: ReportStatus.COMPLETED,
        completed_at: mockDate.toISOString(),
      };

      (apiUtils.put as any).mockResolvedValue(updatedReport);

      const result = await reportsService.addReportResults(
        '1',
        'Normal values',
        'All tests within normal range',
        'Continue healthy lifestyle'
      );

      expect(result).toEqual(updatedReport);
      expect(apiUtils.put).toHaveBeenCalledWith('/reports/1', {
        results: 'Normal values',
        observations: 'All tests within normal range',
        recommendations: 'Continue healthy lifestyle',
        status: ReportStatus.COMPLETED,
        completed_at: mockDate.toISOString(),
      });
    });
  });

  describe('bulkUpdateReports', () => {
    it('should bulk update reports successfully', async () => {
      const mockResponse = {
        data: { updated_count: 3 },
        message: 'Reports updated successfully',
        success: true,
      };

      (apiUtils.put as any).mockResolvedValue(mockResponse);

      const result = await reportsService.bulkUpdateReports(
        ['1', '2', '3'],
        { priority: ReportPriority.HIGH }
      );

      expect(result).toEqual(mockResponse);
      expect(apiUtils.put).toHaveBeenCalledWith('/reports/bulk-update', {
        report_ids: ['1', '2', '3'],
        update_data: { priority: ReportPriority.HIGH },
      });
    });
  });

  describe('getDashboardData', () => {
    it('should fetch dashboard data successfully', async () => {
      const mockDashboardData = {
        total_reports: 100,
        pending_reports: 10,
        completed_reports: 80,
        urgent_reports: 5,
        recent_reports: [mockReport],
        processing_time_avg: 24.5,
        completion_rate: 85.0,
      };

      (apiUtils.get as any).mockResolvedValue(mockDashboardData);

      const result = await reportsService.getDashboardData();

      expect(result).toEqual(mockDashboardData);
      expect(apiUtils.get).toHaveBeenCalledWith('/reports/dashboard');
    });
  });

  describe('scheduleReportProcessing', () => {
    it('should schedule report processing successfully', async () => {
      const mockResponse = {
        data: { scheduled: true },
        message: 'Processing scheduled',
        success: true,
      };

      (apiUtils.post as any).mockResolvedValue(mockResponse);

      const result = await reportsService.scheduleReportProcessing(
        '1',
        '2023-12-01T15:00:00Z',
        'technician123'
      );

      expect(result).toEqual(mockResponse);
      expect(apiUtils.post).toHaveBeenCalledWith('/reports/1/schedule', {
        scheduled_at: '2023-12-01T15:00:00Z',
        assigned_to: 'technician123',
      });
    });
  });

  describe('getProcessingQueue', () => {
    it('should fetch processing queue successfully', async () => {
      const mockQueue = [
        {
          report_id: '1',
          priority: ReportPriority.HIGH,
          scheduled_at: '2023-12-01T15:00:00Z',
          assigned_to: 'technician123',
          estimated_completion: '2023-12-01T17:00:00Z',
        },
      ];

      (apiUtils.get as any).mockResolvedValue(mockQueue);

      const result = await reportsService.getProcessingQueue();

      expect(result).toEqual(mockQueue);
      expect(apiUtils.get).toHaveBeenCalledWith('/reports/processing-queue');
    });
  });

  describe('preloadUserReports', () => {
    it('should preload user reports without throwing errors', async () => {
      (apiUtils.get as any)
        .mockResolvedValueOnce(mockPaginatedResponse)
        .mockResolvedValueOnce({
          total_reports: 100,
          status_counts: {},
          payment_status_counts: {},
          priority_counts: {},
          total_revenue: 5000.0,
          average_processing_time: 24.5,
        });

      await expect(reportsService.preloadUserReports()).resolves.not.toThrow();
    });

    it('should handle preload errors gracefully', async () => {
      (apiUtils.get as any).mockRejectedValue(new Error('Preload failed'));

      await expect(reportsService.preloadUserReports()).resolves.not.toThrow();
    });
  });
});