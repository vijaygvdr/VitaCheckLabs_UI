// Company Service Integration

import { 
  apiUtils, 
  apiCache, 
  retryRequest,
  rateLimiter 
} from './api';
import {
  CompanyInfo,
  CompanyInfoUpdate,
  ContactInfo,
  Service,
  ContactFormSubmission,
  ContactMessage,
  ContactMessageUpdate,
  ContactMessageFilters,
  ContactStats,
  ContactMessageStatus,
  ContactMessagePriority,
  InquiryType,
  PaginatedResponse,
  ApiResponse
} from '../types/api';

// Company service class
class CompanyService {
  private readonly baseUrl = '/company';
  private readonly cachePrefix = 'company_';

  /**
   * Get company information
   */
  async getCompanyInfo(): Promise<CompanyInfo> {
    try {
      const cacheKey = `${this.cachePrefix}info`;
      
      // Check cache first
      const cached = apiCache.get<CompanyInfo>(cacheKey);
      if (cached) {
        return cached;
      }

      const response = await apiUtils.get<CompanyInfo>(`${this.baseUrl}/info`);
      
      // Cache company info for longer period (rarely changes)
      apiCache.set(cacheKey, response, 3600000); // 1 hour
      
      return response;
    } catch (error) {
      console.error('Failed to fetch company information:', error);
      throw error;
    }
  }

  /**
   * Update company information (Admin only)
   */
  async updateCompanyInfo(companyData: CompanyInfoUpdate): Promise<CompanyInfo> {
    try {
      const response = await apiUtils.put<CompanyInfo>(`${this.baseUrl}/info`, companyData);
      
      // Clear related cache
      apiCache.clear(`${this.cachePrefix}info`);
      apiCache.clear(`${this.cachePrefix}contact`);
      apiCache.clear(`${this.cachePrefix}profile`);
      
      return response;
    } catch (error) {
      console.error('Failed to update company information:', error);
      throw error;
    }
  }

  /**
   * Get company contact information
   */
  async getContactInfo(): Promise<ContactInfo> {
    try {
      const cacheKey = `${this.cachePrefix}contact`;
      
      // Check cache first
      const cached = apiCache.get<ContactInfo>(cacheKey);
      if (cached) {
        return cached;
      }

      const response = await apiUtils.get<ContactInfo>(`${this.baseUrl}/contact`);
      
      // Cache contact info
      apiCache.set(cacheKey, response, 3600000); // 1 hour
      
      return response;
    } catch (error) {
      console.error('Failed to fetch contact information:', error);
      throw error;
    }
  }

  /**
   * Get company services
   */
  async getServices(): Promise<Service[]> {
    try {
      const cacheKey = `${this.cachePrefix}services`;
      
      // Check cache first
      const cached = apiCache.get<Service[]>(cacheKey);
      if (cached) {
        return cached;
      }

      const response = await apiUtils.get<Service[]>(`${this.baseUrl}/services`);
      
      // Cache services
      apiCache.set(cacheKey, response, 1800000); // 30 minutes
      
      return response;
    } catch (error) {
      console.error('Failed to fetch company services:', error);
      throw error;
    }
  }

  /**
   * Submit contact form
   */
  async submitContactForm(formData: ContactFormSubmission): Promise<ApiResponse<{
    message_id: string;
    status: string;
    estimated_response_time: string;
  }>> {
    try {
      // Check rate limit for contact form submissions
      const rateLimitKey = `contact_form_${formData.email}`;
      if (!rateLimiter.isAllowed(rateLimitKey, 5, 3600000)) { // 5 submissions per hour
        throw new Error('Too many contact form submissions. Please wait before trying again.');
      }

      const response = await retryRequest(
        () => apiUtils.post<ApiResponse<any>>(`${this.baseUrl}/contact`, formData),
        2, // Max 2 retries
        1000 // 1 second delay
      );

      return response;
    } catch (error) {
      console.error('Failed to submit contact form:', error);
      throw error;
    }
  }

  /**
   * Get company profile (complete information)
   */
  async getCompanyProfile(): Promise<{
    company_info: CompanyInfo;
    contact_info: ContactInfo;
    services: Service[];
    stats: {
      years_of_service: number;
      total_tests_conducted: number;
      customer_satisfaction: number;
      certifications_count: number;
    };
  }> {
    try {
      const cacheKey = `${this.cachePrefix}profile`;
      
      // Check cache first
      const cached = apiCache.get<any>(cacheKey);
      if (cached) {
        return cached;
      }

      const response = await apiUtils.get<any>(`${this.baseUrl}/profile`);
      
      // Cache profile data
      apiCache.set(cacheKey, response, 1800000); // 30 minutes
      
      return response;
    } catch (error) {
      console.error('Failed to fetch company profile:', error);
      throw error;
    }
  }

  /**
   * Get contact messages (Admin only)
   */
  async getContactMessages(filters: ContactMessageFilters = {}): Promise<PaginatedResponse<ContactMessage>> {
    try {
      const response = await apiUtils.get<PaginatedResponse<ContactMessage>>(
        `${this.baseUrl}/contact/messages`,
        filters
      );

      return response;
    } catch (error) {
      console.error('Failed to fetch contact messages:', error);
      throw error;
    }
  }

  /**
   * Get specific contact message (Admin only)
   */
  async getContactMessage(messageId: string): Promise<ContactMessage> {
    try {
      const response = await apiUtils.get<ContactMessage>(`${this.baseUrl}/contact/messages/${messageId}`);
      return response;
    } catch (error) {
      console.error(`Failed to fetch contact message ${messageId}:`, error);
      throw error;
    }
  }

  /**
   * Update contact message (Admin only)
   */
  async updateContactMessage(messageId: string, updateData: ContactMessageUpdate): Promise<ContactMessage> {
    try {
      const response = await apiUtils.put<ContactMessage>(
        `${this.baseUrl}/contact/messages/${messageId}`,
        updateData
      );

      return response;
    } catch (error) {
      console.error(`Failed to update contact message ${messageId}:`, error);
      throw error;
    }
  }

  /**
   * Delete contact message (Admin only)
   */
  async deleteContactMessage(messageId: string): Promise<ApiResponse<null>> {
    try {
      const response = await apiUtils.delete<ApiResponse<null>>(
        `${this.baseUrl}/contact/messages/${messageId}`
      );

      return response;
    } catch (error) {
      console.error(`Failed to delete contact message ${messageId}:`, error);
      throw error;
    }
  }

  /**
   * Get contact statistics (Admin only)
   */
  async getContactStats(): Promise<ContactStats> {
    try {
      const cacheKey = `${this.cachePrefix}contact_stats`;
      
      // Check cache first
      const cached = apiCache.get<ContactStats>(cacheKey);
      if (cached) {
        return cached;
      }

      const response = await apiUtils.get<ContactStats>(`${this.baseUrl}/contact/stats`);
      
      // Cache stats for shorter period
      apiCache.set(cacheKey, response, 300000); // 5 minutes
      
      return response;
    } catch (error) {
      console.error('Failed to fetch contact statistics:', error);
      throw error;
    }
  }

  /**
   * Get contact messages by status (Admin only)
   */
  async getContactMessagesByStatus(
    status: ContactMessageStatus,
    filters: Omit<ContactMessageFilters, 'status'> = {}
  ): Promise<PaginatedResponse<ContactMessage>> {
    try {
      const statusFilters: ContactMessageFilters = {
        ...filters,
        status
      };

      return await this.getContactMessages(statusFilters);
    } catch (error) {
      console.error(`Failed to fetch contact messages with status ${status}:`, error);
      throw error;
    }
  }

  /**
   * Get contact messages by priority (Admin only)
   */
  async getContactMessagesByPriority(
    priority: ContactMessagePriority,
    filters: Omit<ContactMessageFilters, 'priority'> = {}
  ): Promise<PaginatedResponse<ContactMessage>> {
    try {
      const priorityFilters: ContactMessageFilters = {
        ...filters,
        priority
      };

      return await this.getContactMessages(priorityFilters);
    } catch (error) {
      console.error(`Failed to fetch contact messages with priority ${priority}:`, error);
      throw error;
    }
  }

  /**
   * Get contact messages by inquiry type (Admin only)
   */
  async getContactMessagesByInquiryType(
    inquiryType: InquiryType,
    filters: Omit<ContactMessageFilters, 'inquiry_type'> = {}
  ): Promise<PaginatedResponse<ContactMessage>> {
    try {
      const inquiryFilters: ContactMessageFilters = {
        ...filters,
        inquiry_type: inquiryType
      };

      return await this.getContactMessages(inquiryFilters);
    } catch (error) {
      console.error(`Failed to fetch contact messages with inquiry type ${inquiryType}:`, error);
      throw error;
    }
  }

  /**
   * Get unread contact messages (Admin only)
   */
  async getUnreadContactMessages(filters: ContactMessageFilters = {}): Promise<PaginatedResponse<ContactMessage>> {
    return this.getContactMessagesByStatus(ContactMessageStatus.UNREAD, filters);
  }

  /**
   * Get urgent contact messages (Admin only)
   */
  async getUrgentContactMessages(filters: ContactMessageFilters = {}): Promise<PaginatedResponse<ContactMessage>> {
    return this.getContactMessagesByPriority(ContactMessagePriority.URGENT, filters);
  }

  /**
   * Mark contact message as read (Admin only)
   */
  async markContactMessageAsRead(messageId: string): Promise<ContactMessage> {
    try {
      return await this.updateContactMessage(messageId, {
        status: ContactMessageStatus.READ
      });
    } catch (error) {
      console.error(`Failed to mark contact message ${messageId} as read:`, error);
      throw error;
    }
  }

  /**
   * Respond to contact message (Admin only)
   */
  async respondToContactMessage(
    messageId: string,
    response: string,
    closeMessage: boolean = false
  ): Promise<ContactMessage> {
    try {
      const updateData: ContactMessageUpdate = {
        response,
        status: closeMessage ? ContactMessageStatus.CLOSED : ContactMessageStatus.RESPONDED
      };

      return await this.updateContactMessage(messageId, updateData);
    } catch (error) {
      console.error(`Failed to respond to contact message ${messageId}:`, error);
      throw error;
    }
  }

  /**
   * Set contact message priority (Admin only)
   */
  async setContactMessagePriority(
    messageId: string,
    priority: ContactMessagePriority
  ): Promise<ContactMessage> {
    try {
      return await this.updateContactMessage(messageId, { priority });
    } catch (error) {
      console.error(`Failed to set priority for contact message ${messageId}:`, error);
      throw error;
    }
  }

  /**
   * Close contact message (Admin only)
   */
  async closeContactMessage(messageId: string): Promise<ContactMessage> {
    try {
      return await this.updateContactMessage(messageId, {
        status: ContactMessageStatus.CLOSED
      });
    } catch (error) {
      console.error(`Failed to close contact message ${messageId}:`, error);
      throw error;
    }
  }

  /**
   * Search contact messages (Admin only)
   */
  async searchContactMessages(
    query: string,
    filters: Omit<ContactMessageFilters, 'search'> = {}
  ): Promise<PaginatedResponse<ContactMessage>> {
    try {
      const searchFilters: ContactMessageFilters = {
        ...filters,
        search: query
      };

      return await this.getContactMessages(searchFilters);
    } catch (error) {
      console.error('Failed to search contact messages:', error);
      throw error;
    }
  }

  /**
   * Get contact messages by date range (Admin only)
   */
  async getContactMessagesByDateRange(
    startDate: string,
    endDate: string,
    filters: Omit<ContactMessageFilters, 'start_date' | 'end_date'> = {}
  ): Promise<PaginatedResponse<ContactMessage>> {
    try {
      const dateFilters: ContactMessageFilters = {
        ...filters,
        start_date: startDate,
        end_date: endDate
      };

      return await this.getContactMessages(dateFilters);
    } catch (error) {
      console.error(`Failed to fetch contact messages for date range ${startDate} to ${endDate}:`, error);
      throw error;
    }
  }

  /**
   * Bulk update contact messages (Admin only)
   */
  async bulkUpdateContactMessages(
    messageIds: string[],
    updateData: Partial<ContactMessageUpdate>
  ): Promise<ApiResponse<{ updated_count: number }>> {
    try {
      const response = await apiUtils.put<ApiResponse<any>>(
        `${this.baseUrl}/contact/messages/bulk-update`,
        {
          message_ids: messageIds,
          update_data: updateData
        }
      );

      return response;
    } catch (error) {
      console.error('Failed to bulk update contact messages:', error);
      throw error;
    }
  }

  /**
   * Export contact messages (Admin only)
   */
  async exportContactMessages(
    format: 'csv' | 'xlsx' = 'csv',
    filters: ContactMessageFilters = {}
  ): Promise<void> {
    try {
      const response = await apiUtils.get(`${this.baseUrl}/contact/messages/export`, {
        format,
        ...filters
      });

      // This would handle file download
      // Implementation depends on how backend returns the file
      console.log('Export response:', response);
    } catch (error) {
      console.error('Failed to export contact messages:', error);
      throw error;
    }
  }

  /**
   * Get contact dashboard data (Admin only)
   */
  async getContactDashboardData(): Promise<{
    total_messages: number;
    unread_messages: number;
    urgent_messages: number;
    response_rate: number;
    average_response_time: number;
    recent_messages: ContactMessage[];
    inquiry_type_distribution: Record<InquiryType, number>;
  }> {
    try {
      const cacheKey = `${this.cachePrefix}contact_dashboard`;
      
      // Check cache first
      const cached = apiCache.get<any>(cacheKey);
      if (cached) {
        return cached;
      }

      const response = await apiUtils.get<any>(`${this.baseUrl}/contact/dashboard`);
      
      // Cache dashboard data
      apiCache.set(cacheKey, response, 300000); // 5 minutes
      
      return response;
    } catch (error) {
      console.error('Failed to fetch contact dashboard data:', error);
      throw error;
    }
  }

  /**
   * Get company operating hours
   */
  async getOperatingHours(): Promise<Record<string, string>> {
    try {
      const companyInfo = await this.getCompanyInfo();
      return companyInfo.operating_hours;
    } catch (error) {
      console.error('Failed to fetch operating hours:', error);
      throw error;
    }
  }

  /**
   * Check if company is currently open
   */
  async isCurrentlyOpen(): Promise<boolean> {
    try {
      const operatingHours = await this.getOperatingHours();
      const now = new Date();
      const currentDay = now.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
      const currentTime = now.toTimeString().slice(0, 5); // HH:MM format

      const todayHours = operatingHours[currentDay];
      if (!todayHours || todayHours.toLowerCase() === 'closed') {
        return false;
      }

      // Parse hours (assuming format like "09:00-17:00")
      const [openTime, closeTime] = todayHours.split('-');
      return currentTime >= openTime && currentTime <= closeTime;
    } catch (error) {
      console.error('Failed to check if company is open:', error);
      return false;
    }
  }

  /**
   * Get company certifications
   */
  async getCertifications(): Promise<string[]> {
    try {
      const companyInfo = await this.getCompanyInfo();
      return companyInfo.certifications;
    } catch (error) {
      console.error('Failed to fetch certifications:', error);
      throw error;
    }
  }

  /**
   * Get company specializations
   */
  async getSpecializations(): Promise<string[]> {
    try {
      const companyInfo = await this.getCompanyInfo();
      return companyInfo.specializations;
    } catch (error) {
      console.error('Failed to fetch specializations:', error);
      throw error;
    }
  }

  /**
   * Get home collection radius
   */
  async getHomeCollectionRadius(): Promise<number> {
    try {
      const companyInfo = await this.getCompanyInfo();
      return companyInfo.home_collection_radius_km;
    } catch (error) {
      console.error('Failed to fetch home collection radius:', error);
      throw error;
    }
  }

  /**
   * Check if location is within home collection radius
   */
  async isLocationInHomeCollectionRadius(
    userLat: number,
    userLng: number,
    companyLat?: number,
    companyLng?: number
  ): Promise<boolean> {
    try {
      const radius = await this.getHomeCollectionRadius();
      
      // If company coordinates not provided, this would need to be fetched
      // For now, assuming they're provided or calculated elsewhere
      if (!companyLat || !companyLng) {
        return true; // Default to true if coordinates not available
      }

      // Calculate distance using Haversine formula
      const distance = this.calculateDistance(userLat, userLng, companyLat, companyLng);
      return distance <= radius;
    } catch (error) {
      console.error('Failed to check home collection radius:', error);
      return false;
    }
  }

  /**
   * Calculate distance between two coordinates (Haversine formula)
   */
  private calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRadians(lat2 - lat1);
    const dLng = this.toRadians(lng2 - lng1);
    
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
              Math.sin(dLng / 2) * Math.sin(dLng / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  /**
   * Convert degrees to radians
   */
  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  /**
   * Clear all company cache
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
   * Preload company data for better UX
   */
  async preloadCompanyData(): Promise<void> {
    try {
      await this.getCompanyInfo();
      await this.getContactInfo();
      await this.getServices();
    } catch (error) {
      console.error('Failed to preload company data:', error);
      // Don't throw error for preloading
    }
  }
}

// Export singleton instance
export const companyService = new CompanyService();
export default companyService;