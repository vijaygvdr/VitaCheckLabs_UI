// Reports Service Integration

import { 
  apiUtils, 
  apiCache, 
  retryRequest,
  rateLimiter 
} from './api';
import {
  Report,
  ReportCreate,
  ReportUpdate,
  ReportFilters,
  ReportShare,
  ReportDownload,
  ReportStats,
  ReportStatus,
  PaymentStatus,
  ReportPriority,
  PaginatedResponse,
  ApiResponse
} from '../types/api';

// Reports service class
class ReportsService {
  private readonly baseUrl = '/reports/';
  private readonly cachePrefix = 'reports_';

  /**
   * Get paginated list of reports with filtering
   */
  async getReports(filters: ReportFilters = {}): Promise<PaginatedResponse<Report>> {
    try {
      // Create cache key based on filters
      const cacheKey = `${this.cachePrefix}list_${JSON.stringify(filters)}`;
      
      // Check cache first (short cache for reports due to status changes)
      const cached = apiCache.get<PaginatedResponse<Report>>(cacheKey);
      if (cached) {
        return cached;
      }

      console.log('Making reports API call to:', this.baseUrl, 'with filters:', filters);
      console.log('Full API URL will be:', `${import.meta.env.VITE_API_BASE_URL || ''}/api/v1${this.baseUrl}`);
      console.log('Auth token present:', !!localStorage.getItem('vitacheck_access_token'));
      
      const response = await apiUtils.get<any>(
        this.baseUrl,
        filters
      );
      console.log('Raw reports API response:', response);

      // Handle backend response format: {reports: [...]} instead of {data: [...]}
      const formattedResponse: PaginatedResponse<Report> = {
        data: response.reports || response.data || [],
        total: response.total || 0,
        page: response.page || 1,
        per_page: response.per_page || 20,
        total_pages: response.total_pages || 1
      };

      // Cache for shorter period due to dynamic nature of reports
      apiCache.set(cacheKey, formattedResponse, 300000); // 5 minutes

      return formattedResponse;
    } catch (error) {
      console.error('Failed to fetch reports:', error);
      throw error;
    }
  }

  /**
   * Get specific report by ID
   */
  async getReport(reportId: string): Promise<Report> {
    try {
      const cacheKey = `${this.cachePrefix}detail_${reportId}`;
      
      // Check cache first
      const cached = apiCache.get<Report>(cacheKey);
      if (cached) {
        return cached;
      }

      const response = await apiUtils.get<Report>(`${this.baseUrl}/${reportId}`);
      
      // Cache report details
      apiCache.set(cacheKey, response, 600000); // 10 minutes
      
      return response;
    } catch (error) {
      console.error(`Failed to fetch report ${reportId}:`, error);
      throw error;
    }
  }

  /**
   * Create new report
   */
  async createReport(reportData: ReportCreate): Promise<Report> {
    try {
      const response = await apiUtils.post<Report>(this.baseUrl, reportData);
      
      // Clear related cache
      this.clearCache();
      
      return response;
    } catch (error) {
      console.error('Failed to create report:', error);
      throw error;
    }
  }

  /**
   * Update report
   */
  async updateReport(reportId: string, reportData: ReportUpdate): Promise<Report> {
    try {
      const response = await apiUtils.put<Report>(`${this.baseUrl}/${reportId}`, reportData);
      
      // Clear related cache
      this.clearCache();
      apiCache.clear(`${this.cachePrefix}detail_${reportId}`);
      
      return response;
    } catch (error) {
      console.error(`Failed to update report ${reportId}:`, error);
      throw error;
    }
  }

  /**
   * Delete report
   */
  async deleteReport(reportId: string): Promise<ApiResponse<null>> {
    try {
      const response = await apiUtils.delete<ApiResponse<null>>(`${this.baseUrl}/${reportId}`);
      
      // Clear related cache
      this.clearCache();
      apiCache.clear(`${this.cachePrefix}detail_${reportId}`);
      
      return response;
    } catch (error) {
      console.error(`Failed to delete report ${reportId}:`, error);
      throw error;
    }
  }

  /**
   * Upload report file (Admin only)
   */
  async uploadReportFile(
    reportId: string, 
    file: File,
    onUploadProgress?: (progressEvent: any) => void
  ): Promise<ApiResponse<{
    file_path: string;
    file_size: number;
    upload_id: string;
  }>> {
    try {
      // Check file size (max 10MB)
      const maxSize = 10 * 1024 * 1024; // 10MB in bytes
      if (file.size > maxSize) {
        throw new Error('File size exceeds 10MB limit');
      }

      // Check file type
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/gif'];
      if (!allowedTypes.includes(file.type)) {
        throw new Error('Invalid file type. Only PDF, JPEG, PNG, and GIF files are allowed.');
      }

      const response = await apiUtils.uploadFile<ApiResponse<any>>(
        `${this.baseUrl}/${reportId}/upload`,
        file,
        onUploadProgress
      );

      // Clear related cache
      apiCache.clear(`${this.cachePrefix}detail_${reportId}`);
      
      return response;
    } catch (error) {
      console.error(`Failed to upload file for report ${reportId}:`, error);
      throw error;
    }
  }

  /**
   * Download report file
   */
  async downloadReport(reportId: string): Promise<ReportDownload> {
    try {
      const response = await apiUtils.get<ReportDownload>(`${this.baseUrl}/${reportId}/download`);
      return response;
    } catch (error) {
      console.error(`Failed to get download link for report ${reportId}:`, error);
      throw error;
    }
  }

  /**
   * Download report file directly
   */
  async downloadReportFile(reportId: string, filename?: string): Promise<void> {
    try {
      // Download file directly through the API with authentication
      await apiUtils.downloadFile(
        `${this.baseUrl}/${reportId}/download`,
        filename || `report_${reportId}.pdf`
      );
    } catch (error) {
      console.error(`Failed to download report file ${reportId}:`, error);
      throw error;
    }
  }

  /**
   * Share report with others
   */
  async shareReport(reportId: string, shareData: ReportShare): Promise<ApiResponse<{
    shared_with: string[];
    share_id: string;
    expires_at: string;
  }>> {
    try {
      // Check rate limit for sharing
      const rateLimitKey = `share_${reportId}`;
      if (!rateLimiter.isAllowed(rateLimitKey, 10, 3600000)) { // 10 shares per hour
        throw new Error('Too many sharing attempts. Please wait before trying again.');
      }

      const response = await apiUtils.post<ApiResponse<any>>(
        `${this.baseUrl}/${reportId}/share`,
        shareData
      );

      // Clear related cache
      apiCache.clear(`${this.cachePrefix}detail_${reportId}`);
      
      return response;
    } catch (error) {
      console.error(`Failed to share report ${reportId}:`, error);
      throw error;
    }
  }

  /**
   * Get report statistics
   */
  async getReportStats(): Promise<ReportStats> {
    try {
      const cacheKey = `${this.cachePrefix}stats`;
      
      // Check cache first
      const cached = apiCache.get<ReportStats>(cacheKey);
      if (cached) {
        return cached;
      }

      const response = await apiUtils.get<ReportStats>(`${this.baseUrl}/stats/overview`);
      
      // Cache stats for shorter period
      apiCache.set(cacheKey, response, 300000); // 5 minutes
      
      return response;
    } catch (error) {
      console.error('Failed to fetch report statistics:', error);
      throw error;
    }
  }

  /**
   * Get reports by status
   */
  async getReportsByStatus(
    status: ReportStatus, 
    filters: Omit<ReportFilters, 'status'> = {}
  ): Promise<PaginatedResponse<Report>> {
    try {
      const statusFilters: ReportFilters = {
        ...filters,
        status
      };

      return await this.getReports(statusFilters);
    } catch (error) {
      console.error(`Failed to fetch reports with status ${status}:`, error);
      throw error;
    }
  }

  /**
   * Get reports by payment status
   */
  async getReportsByPaymentStatus(
    paymentStatus: PaymentStatus, 
    filters: Omit<ReportFilters, 'payment_status'> = {}
  ): Promise<PaginatedResponse<Report>> {
    try {
      const paymentFilters: ReportFilters = {
        ...filters,
        payment_status: paymentStatus
      };

      return await this.getReports(paymentFilters);
    } catch (error) {
      console.error(`Failed to fetch reports with payment status ${paymentStatus}:`, error);
      throw error;
    }
  }

  /**
   * Get reports by priority
   */
  async getReportsByPriority(
    priority: ReportPriority, 
    filters: Omit<ReportFilters, 'priority'> = {}
  ): Promise<PaginatedResponse<Report>> {
    try {
      const priorityFilters: ReportFilters = {
        ...filters,
        priority
      };

      return await this.getReports(priorityFilters);
    } catch (error) {
      console.error(`Failed to fetch reports with priority ${priority}:`, error);
      throw error;
    }
  }

  /**
   * Get reports by date range
   */
  async getReportsByDateRange(
    startDate: string, 
    endDate: string, 
    filters: Omit<ReportFilters, 'start_date' | 'end_date'> = {}
  ): Promise<PaginatedResponse<Report>> {
    try {
      const dateFilters: ReportFilters = {
        ...filters,
        start_date: startDate,
        end_date: endDate
      };

      return await this.getReports(dateFilters);
    } catch (error) {
      console.error(`Failed to fetch reports for date range ${startDate} to ${endDate}:`, error);
      throw error;
    }
  }

  /**
   * Search reports
   */
  async searchReports(
    query: string, 
    filters: Omit<ReportFilters, 'search'> = {}
  ): Promise<PaginatedResponse<Report>> {
    try {
      const searchFilters: ReportFilters = {
        ...filters,
        search: query
      };

      return await this.getReports(searchFilters);
    } catch (error) {
      console.error('Failed to search reports:', error);
      throw error;
    }
  }

  /**
   * Get pending reports
   */
  async getPendingReports(filters: ReportFilters = {}): Promise<PaginatedResponse<Report>> {
    return this.getReportsByStatus(ReportStatus.PENDING, filters);
  }

  /**
   * Get completed reports
   */
  async getCompletedReports(filters: ReportFilters = {}): Promise<PaginatedResponse<Report>> {
    return this.getReportsByStatus(ReportStatus.COMPLETED, filters);
  }

  /**
   * Get reports requiring processing
   */
  async getProcessingReports(filters: ReportFilters = {}): Promise<PaginatedResponse<Report>> {
    return this.getReportsByStatus(ReportStatus.PROCESSING, filters);
  }

  /**
   * Get urgent reports
   */
  async getUrgentReports(filters: ReportFilters = {}): Promise<PaginatedResponse<Report>> {
    return this.getReportsByPriority(ReportPriority.URGENT, filters);
  }

  /**
   * Update report status
   */
  async updateReportStatus(
    reportId: string, 
    status: ReportStatus, 
    notes?: string
  ): Promise<Report> {
    try {
      const updateData: ReportUpdate = {
        status,
        ...(notes && { observations: notes })
      };

      // Add timestamp based on status
      const now = new Date().toISOString();
      switch (status) {
        case ReportStatus.COLLECTED:
          updateData.collected_at = now;
          break;
        case ReportStatus.PROCESSING:
          updateData.processed_at = now;
          break;
        case ReportStatus.COMPLETED:
          updateData.completed_at = now;
          break;
      }

      return await this.updateReport(reportId, updateData);
    } catch (error) {
      console.error(`Failed to update report ${reportId} status to ${status}:`, error);
      throw error;
    }
  }

  /**
   * Update report priority
   */
  async updateReportPriority(reportId: string, priority: ReportPriority): Promise<Report> {
    try {
      return await this.updateReport(reportId, { priority });
    } catch (error) {
      console.error(`Failed to update report ${reportId} priority to ${priority}:`, error);
      throw error;
    }
  }

  /**
   * Add report results
   */
  async addReportResults(
    reportId: string, 
    results: string, 
    observations?: string, 
    recommendations?: string
  ): Promise<Report> {
    try {
      const updateData: ReportUpdate = {
        results,
        observations,
        recommendations,
        status: ReportStatus.COMPLETED,
        completed_at: new Date().toISOString()
      };

      return await this.updateReport(reportId, updateData);
    } catch (error) {
      console.error(`Failed to add results to report ${reportId}:`, error);
      throw error;
    }
  }

  /**
   * Get report sharing history
   */
  async getReportSharingHistory(reportId: string): Promise<Array<{
    shared_with: string;
    shared_at: string;
    expires_at: string;
    accessed_at?: string;
  }>> {
    try {
      const response = await apiUtils.get<any[]>(`${this.baseUrl}/${reportId}/sharing-history`);
      return response;
    } catch (error) {
      console.error(`Failed to fetch sharing history for report ${reportId}:`, error);
      throw error;
    }
  }

  /**
   * Get report activity log
   */
  async getReportActivityLog(reportId: string): Promise<Array<{
    action: string;
    performed_by: string;
    performed_at: string;
    details?: string;
  }>> {
    try {
      const response = await apiUtils.get<any[]>(`${this.baseUrl}/${reportId}/activity`);
      return response;
    } catch (error) {
      console.error(`Failed to fetch activity log for report ${reportId}:`, error);
      throw error;
    }
  }

  /**
   * Bulk update reports
   */
  async bulkUpdateReports(
    reportIds: string[], 
    updateData: Partial<ReportUpdate>
  ): Promise<ApiResponse<{ updated_count: number }>> {
    try {
      const response = await apiUtils.put<ApiResponse<any>>(`${this.baseUrl}/bulk-update`, {
        report_ids: reportIds,
        update_data: updateData
      });

      // Clear related cache
      this.clearCache();
      
      return response;
    } catch (error) {
      console.error('Failed to bulk update reports:', error);
      throw error;
    }
  }

  /**
   * Export reports data
   */
  async exportReports(
    format: 'csv' | 'xlsx' | 'pdf' = 'csv',
    filters: ReportFilters = {}
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
      console.error('Failed to export reports:', error);
      throw error;
    }
  }

  /**
   * Get reports dashboard data
   */
  async getDashboardData(): Promise<{
    total_reports: number;
    pending_reports: number;
    completed_reports: number;
    urgent_reports: number;
    recent_reports: Report[];
    processing_time_avg: number;
    completion_rate: number;
  }> {
    try {
      const cacheKey = `${this.cachePrefix}dashboard`;
      
      // Check cache first
      const cached = apiCache.get<any>(cacheKey);
      if (cached) {
        return cached;
      }

      const response = await apiUtils.get<any>(`${this.baseUrl}/dashboard`);
      
      // Cache dashboard data
      apiCache.set(cacheKey, response, 300000); // 5 minutes
      
      return response;
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      throw error;
    }
  }

  /**
   * Schedule report processing
   */
  async scheduleReportProcessing(
    reportId: string, 
    scheduledAt: string, 
    assignedTo?: string
  ): Promise<ApiResponse<{ scheduled: boolean }>> {
    try {
      const response = await apiUtils.post<ApiResponse<any>>(
        `${this.baseUrl}/${reportId}/schedule`,
        {
          scheduled_at: scheduledAt,
          assigned_to: assignedTo
        }
      );

      // Clear related cache
      apiCache.clear(`${this.cachePrefix}detail_${reportId}`);
      
      return response;
    } catch (error) {
      console.error(`Failed to schedule processing for report ${reportId}:`, error);
      throw error;
    }
  }

  /**
   * Get report processing queue
   */
  async getProcessingQueue(): Promise<Array<{
    report_id: string;
    priority: ReportPriority;
    scheduled_at: string;
    assigned_to?: string;
    estimated_completion: string;
  }>> {
    try {
      const response = await apiUtils.get<any[]>(`${this.baseUrl}/processing-queue`);
      return response;
    } catch (error) {
      console.error('Failed to fetch processing queue:', error);
      throw error;
    }
  }

  /**
   * Clear all reports cache
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
   * Preload user reports for better UX
   */
  async preloadUserReports(): Promise<void> {
    try {
      await this.getReports({ per_page: 10 });
      await this.getReportStats();
    } catch (error) {
      console.error('Failed to preload user reports:', error);
      // Don't throw error for preloading
    }
  }
}

// Export singleton instance
export const reportsService = new ReportsService();
export default reportsService;