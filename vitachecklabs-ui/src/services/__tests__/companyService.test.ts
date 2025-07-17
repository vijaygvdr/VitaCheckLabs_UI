import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import companyService from '../companyService';
import { apiUtils, apiCache, retryRequest, rateLimiter } from '../api';
import { 
  CompanyInfo, 
  CompanyInfoUpdate, 
  ContactInfo, 
  Service, 
  ContactFormSubmission, 
  ContactMessage, 
  ContactMessageStatus, 
  ContactMessagePriority, 
  InquiryType,
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

describe('CompanyService', () => {
  const mockCompanyInfo: CompanyInfo = {
    id: '1',
    name: 'VitaCheckLabs',
    legal_name: 'VitaCheckLabs Inc.',
    registration_number: 'REG123456',
    email: 'info@vitachecklabs.com',
    phone_primary: '+1-555-0123',
    phone_secondary: '+1-555-0124',
    address_line1: '123 Healthcare Ave',
    address_line2: 'Suite 100',
    city: 'Health City',
    state: 'HC',
    postal_code: '12345',
    country: 'US',
    established_year: 2020,
    license_number: 'LIC123456',
    accreditation: 'ISO 15189',
    services: ['Blood Tests', 'Urine Tests', 'Radiology'],
    specializations: ['Cardiology', 'Oncology'],
    certifications: ['ISO 15189', 'CLIA'],
    operating_hours: {
      monday: '09:00-17:00',
      tuesday: '09:00-17:00',
      wednesday: '09:00-17:00',
      thursday: '09:00-17:00',
      friday: '09:00-17:00',
      saturday: '09:00-13:00',
      sunday: 'closed',
    },
    home_collection_radius_km: 25,
    created_at: '2023-01-01T00:00:00Z',
    updated_at: '2023-01-01T00:00:00Z',
  };

  const mockContactInfo: ContactInfo = {
    email: 'info@vitachecklabs.com',
    phone_primary: '+1-555-0123',
    phone_secondary: '+1-555-0124',
    address_line1: '123 Healthcare Ave',
    address_line2: 'Suite 100',
    city: 'Health City',
    state: 'HC',
    postal_code: '12345',
    country: 'US',
    operating_hours: {
      monday: '09:00-17:00',
      tuesday: '09:00-17:00',
      wednesday: '09:00-17:00',
      thursday: '09:00-17:00',
      friday: '09:00-17:00',
      saturday: '09:00-13:00',
      sunday: 'closed',
    },
  };

  const mockServices: Service[] = [
    {
      id: '1',
      name: 'Blood Tests',
      description: 'Comprehensive blood testing services',
      category: 'Laboratory',
      is_active: true,
    },
    {
      id: '2',
      name: 'Radiology',
      description: 'X-ray and imaging services',
      category: 'Imaging',
      is_active: true,
    },
  ];

  const mockContactMessage: ContactMessage = {
    id: '1',
    full_name: 'John Doe',
    email: 'john.doe@example.com',
    phone: '+1-555-0199',
    subject: 'Test Inquiry',
    message: 'I have a question about lab tests',
    inquiry_type: InquiryType.GENERAL,
    status: ContactMessageStatus.UNREAD,
    priority: ContactMessagePriority.NORMAL,
    source: 'website',
    user_agent: 'Mozilla/5.0...',
    ip_address: '192.168.1.1',
    created_at: '2023-12-01T10:00:00Z',
    updated_at: '2023-12-01T10:00:00Z',
  };

  const mockPaginatedMessages: PaginatedResponse<ContactMessage> = {
    data: [mockContactMessage],
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

  describe('getCompanyInfo', () => {
    it('should fetch company information successfully', async () => {
      (apiUtils.get as any).mockResolvedValue(mockCompanyInfo);

      const result = await companyService.getCompanyInfo();

      expect(result).toEqual(mockCompanyInfo);
      expect(apiUtils.get).toHaveBeenCalledWith('/company/info');
      expect(apiCache.set).toHaveBeenCalledWith(
        'company_info',
        mockCompanyInfo,
        3600000
      );
    });

    it('should return cached result', async () => {
      (apiCache.get as any).mockReturnValue(mockCompanyInfo);

      const result = await companyService.getCompanyInfo();

      expect(result).toEqual(mockCompanyInfo);
      expect(apiUtils.get).not.toHaveBeenCalled();
    });

    it('should handle API errors', async () => {
      const error = { message: 'Failed to fetch company info', status: 500 };
      (apiUtils.get as any).mockRejectedValue(error);

      await expect(companyService.getCompanyInfo()).rejects.toEqual(error);
    });
  });

  describe('updateCompanyInfo', () => {
    it('should update company information successfully', async () => {
      const updateData: CompanyInfoUpdate = {
        name: 'Updated VitaCheckLabs',
        phone_primary: '+1-555-9999',
      };

      const updatedInfo = { ...mockCompanyInfo, ...updateData };
      (apiUtils.put as any).mockResolvedValue(updatedInfo);

      const result = await companyService.updateCompanyInfo(updateData);

      expect(result).toEqual(updatedInfo);
      expect(apiUtils.put).toHaveBeenCalledWith('/company/info', updateData);
    });

    it('should clear related cache after update', async () => {
      const updateData: CompanyInfoUpdate = {
        name: 'Updated VitaCheckLabs',
      };

      (apiUtils.put as any).mockResolvedValue(mockCompanyInfo);

      await companyService.updateCompanyInfo(updateData);

      expect(apiCache.clear).toHaveBeenCalledWith('company_info');
      expect(apiCache.clear).toHaveBeenCalledWith('company_contact');
      expect(apiCache.clear).toHaveBeenCalledWith('company_profile');
    });
  });

  describe('getContactInfo', () => {
    it('should fetch contact information successfully', async () => {
      (apiUtils.get as any).mockResolvedValue(mockContactInfo);

      const result = await companyService.getContactInfo();

      expect(result).toEqual(mockContactInfo);
      expect(apiUtils.get).toHaveBeenCalledWith('/company/contact');
      expect(apiCache.set).toHaveBeenCalledWith(
        'company_contact',
        mockContactInfo,
        3600000
      );
    });

    it('should return cached result', async () => {
      (apiCache.get as any).mockReturnValue(mockContactInfo);

      const result = await companyService.getContactInfo();

      expect(result).toEqual(mockContactInfo);
      expect(apiUtils.get).not.toHaveBeenCalled();
    });
  });

  describe('getServices', () => {
    it('should fetch services successfully', async () => {
      (apiUtils.get as any).mockResolvedValue(mockServices);

      const result = await companyService.getServices();

      expect(result).toEqual(mockServices);
      expect(apiUtils.get).toHaveBeenCalledWith('/company/services');
      expect(apiCache.set).toHaveBeenCalledWith(
        'company_services',
        mockServices,
        1800000
      );
    });

    it('should return cached result', async () => {
      (apiCache.get as any).mockReturnValue(mockServices);

      const result = await companyService.getServices();

      expect(result).toEqual(mockServices);
      expect(apiUtils.get).not.toHaveBeenCalled();
    });
  });

  describe('submitContactForm', () => {
    it('should submit contact form successfully', async () => {
      const formData: ContactFormSubmission = {
        full_name: 'Jane Doe',
        email: 'jane.doe@example.com',
        phone: '+1-555-0199',
        subject: 'Test Subject',
        message: 'Test message',
        inquiry_type: InquiryType.GENERAL,
      };

      const mockResponse = {
        data: {
          message_id: 'msg123',
          status: 'submitted',
          estimated_response_time: '24 hours',
        },
        message: 'Contact form submitted successfully',
        success: true,
      };

      (rateLimiter.isAllowed as any).mockReturnValue(true);
      (retryRequest as any).mockResolvedValue(mockResponse);

      const result = await companyService.submitContactForm(formData);

      expect(result).toEqual(mockResponse);
      expect(rateLimiter.isAllowed).toHaveBeenCalledWith(
        'contact_form_jane.doe@example.com',
        5,
        3600000
      );
    });

    it('should handle rate limiting', async () => {
      const formData: ContactFormSubmission = {
        full_name: 'Jane Doe',
        email: 'jane.doe@example.com',
        subject: 'Test Subject',
        message: 'Test message',
        inquiry_type: InquiryType.GENERAL,
      };

      (rateLimiter.isAllowed as any).mockReturnValue(false);

      await expect(companyService.submitContactForm(formData)).rejects.toThrow(
        'Too many contact form submissions'
      );
    });
  });

  describe('getCompanyProfile', () => {
    it('should fetch company profile successfully', async () => {
      const mockProfile = {
        company_info: mockCompanyInfo,
        contact_info: mockContactInfo,
        services: mockServices,
        stats: {
          years_of_service: 3,
          total_tests_conducted: 10000,
          customer_satisfaction: 4.8,
          certifications_count: 2,
        },
      };

      (apiUtils.get as any).mockResolvedValue(mockProfile);

      const result = await companyService.getCompanyProfile();

      expect(result).toEqual(mockProfile);
      expect(apiUtils.get).toHaveBeenCalledWith('/company/profile');
      expect(apiCache.set).toHaveBeenCalledWith(
        'company_profile',
        mockProfile,
        1800000
      );
    });

    it('should return cached result', async () => {
      const mockProfile = {
        company_info: mockCompanyInfo,
        contact_info: mockContactInfo,
        services: mockServices,
        stats: {
          years_of_service: 3,
          total_tests_conducted: 10000,
          customer_satisfaction: 4.8,
          certifications_count: 2,
        },
      };

      (apiCache.get as any).mockReturnValue(mockProfile);

      const result = await companyService.getCompanyProfile();

      expect(result).toEqual(mockProfile);
      expect(apiUtils.get).not.toHaveBeenCalled();
    });
  });

  describe('getContactMessages', () => {
    it('should fetch contact messages successfully', async () => {
      (apiUtils.get as any).mockResolvedValue(mockPaginatedMessages);

      const result = await companyService.getContactMessages();

      expect(result).toEqual(mockPaginatedMessages);
      expect(apiUtils.get).toHaveBeenCalledWith('/company/contact/messages', {});
    });

    it('should fetch contact messages with filters', async () => {
      const filters = {
        status: ContactMessageStatus.UNREAD,
        priority: ContactMessagePriority.HIGH,
      };

      (apiUtils.get as any).mockResolvedValue(mockPaginatedMessages);

      const result = await companyService.getContactMessages(filters);

      expect(result).toEqual(mockPaginatedMessages);
      expect(apiUtils.get).toHaveBeenCalledWith('/company/contact/messages', filters);
    });
  });

  describe('getContactMessage', () => {
    it('should fetch single contact message successfully', async () => {
      (apiUtils.get as any).mockResolvedValue(mockContactMessage);

      const result = await companyService.getContactMessage('1');

      expect(result).toEqual(mockContactMessage);
      expect(apiUtils.get).toHaveBeenCalledWith('/company/contact/messages/1');
    });
  });

  describe('updateContactMessage', () => {
    it('should update contact message successfully', async () => {
      const updateData = {
        status: ContactMessageStatus.READ,
        priority: ContactMessagePriority.HIGH,
      };

      const updatedMessage = { ...mockContactMessage, ...updateData };
      (apiUtils.put as any).mockResolvedValue(updatedMessage);

      const result = await companyService.updateContactMessage('1', updateData);

      expect(result).toEqual(updatedMessage);
      expect(apiUtils.put).toHaveBeenCalledWith('/company/contact/messages/1', updateData);
    });
  });

  describe('deleteContactMessage', () => {
    it('should delete contact message successfully', async () => {
      const mockResponse = { data: null, message: 'Message deleted', success: true };
      (apiUtils.delete as any).mockResolvedValue(mockResponse);

      const result = await companyService.deleteContactMessage('1');

      expect(result).toEqual(mockResponse);
      expect(apiUtils.delete).toHaveBeenCalledWith('/company/contact/messages/1');
    });
  });

  describe('getContactStats', () => {
    it('should fetch contact statistics successfully', async () => {
      const mockStats = {
        total_messages: 100,
        status_counts: {
          [ContactMessageStatus.UNREAD]: 10,
          [ContactMessageStatus.READ]: 20,
          [ContactMessageStatus.RESPONDED]: 60,
          [ContactMessageStatus.CLOSED]: 10,
        },
        priority_counts: {
          [ContactMessagePriority.LOW]: 20,
          [ContactMessagePriority.NORMAL]: 60,
          [ContactMessagePriority.HIGH]: 15,
          [ContactMessagePriority.URGENT]: 5,
        },
        inquiry_type_counts: {
          [InquiryType.GENERAL]: 40,
          [InquiryType.BOOKING]: 30,
          [InquiryType.COMPLAINT]: 10,
          [InquiryType.SUPPORT]: 15,
          [InquiryType.BUSINESS]: 5,
        },
        average_response_time: 4.5,
        response_rate: 85.0,
      };

      (apiUtils.get as any).mockResolvedValue(mockStats);

      const result = await companyService.getContactStats();

      expect(result).toEqual(mockStats);
      expect(apiUtils.get).toHaveBeenCalledWith('/company/contact/stats');
    });
  });

  describe('getContactMessagesByStatus', () => {
    it('should fetch messages by status', async () => {
      (apiUtils.get as any).mockResolvedValue(mockPaginatedMessages);

      const result = await companyService.getContactMessagesByStatus(
        ContactMessageStatus.UNREAD
      );

      expect(result).toEqual(mockPaginatedMessages);
      expect(apiUtils.get).toHaveBeenCalledWith('/company/contact/messages', {
        status: ContactMessageStatus.UNREAD,
      });
    });
  });

  describe('getContactMessagesByPriority', () => {
    it('should fetch messages by priority', async () => {
      (apiUtils.get as any).mockResolvedValue(mockPaginatedMessages);

      const result = await companyService.getContactMessagesByPriority(
        ContactMessagePriority.HIGH
      );

      expect(result).toEqual(mockPaginatedMessages);
      expect(apiUtils.get).toHaveBeenCalledWith('/company/contact/messages', {
        priority: ContactMessagePriority.HIGH,
      });
    });
  });

  describe('getContactMessagesByInquiryType', () => {
    it('should fetch messages by inquiry type', async () => {
      (apiUtils.get as any).mockResolvedValue(mockPaginatedMessages);

      const result = await companyService.getContactMessagesByInquiryType(
        InquiryType.BOOKING
      );

      expect(result).toEqual(mockPaginatedMessages);
      expect(apiUtils.get).toHaveBeenCalledWith('/company/contact/messages', {
        inquiry_type: InquiryType.BOOKING,
      });
    });
  });

  describe('markContactMessageAsRead', () => {
    it('should mark message as read successfully', async () => {
      const readMessage = { ...mockContactMessage, status: ContactMessageStatus.READ };
      (apiUtils.put as any).mockResolvedValue(readMessage);

      const result = await companyService.markContactMessageAsRead('1');

      expect(result).toEqual(readMessage);
      expect(apiUtils.put).toHaveBeenCalledWith('/company/contact/messages/1', {
        status: ContactMessageStatus.READ,
      });
    });
  });

  describe('respondToContactMessage', () => {
    it('should respond to message successfully', async () => {
      const respondedMessage = {
        ...mockContactMessage,
        status: ContactMessageStatus.RESPONDED,
        response: 'Thank you for your inquiry',
      };
      (apiUtils.put as any).mockResolvedValue(respondedMessage);

      const result = await companyService.respondToContactMessage(
        '1',
        'Thank you for your inquiry'
      );

      expect(result).toEqual(respondedMessage);
      expect(apiUtils.put).toHaveBeenCalledWith('/company/contact/messages/1', {
        response: 'Thank you for your inquiry',
        status: ContactMessageStatus.RESPONDED,
      });
    });

    it('should close message when requested', async () => {
      const closedMessage = {
        ...mockContactMessage,
        status: ContactMessageStatus.CLOSED,
        response: 'Thank you for your inquiry',
      };
      (apiUtils.put as any).mockResolvedValue(closedMessage);

      const result = await companyService.respondToContactMessage(
        '1',
        'Thank you for your inquiry',
        true
      );

      expect(result).toEqual(closedMessage);
      expect(apiUtils.put).toHaveBeenCalledWith('/company/contact/messages/1', {
        response: 'Thank you for your inquiry',
        status: ContactMessageStatus.CLOSED,
      });
    });
  });

  describe('setContactMessagePriority', () => {
    it('should set message priority successfully', async () => {
      const priorityMessage = {
        ...mockContactMessage,
        priority: ContactMessagePriority.HIGH,
      };
      (apiUtils.put as any).mockResolvedValue(priorityMessage);

      const result = await companyService.setContactMessagePriority(
        '1',
        ContactMessagePriority.HIGH
      );

      expect(result).toEqual(priorityMessage);
      expect(apiUtils.put).toHaveBeenCalledWith('/company/contact/messages/1', {
        priority: ContactMessagePriority.HIGH,
      });
    });
  });

  describe('closeContactMessage', () => {
    it('should close message successfully', async () => {
      const closedMessage = {
        ...mockContactMessage,
        status: ContactMessageStatus.CLOSED,
      };
      (apiUtils.put as any).mockResolvedValue(closedMessage);

      const result = await companyService.closeContactMessage('1');

      expect(result).toEqual(closedMessage);
      expect(apiUtils.put).toHaveBeenCalledWith('/company/contact/messages/1', {
        status: ContactMessageStatus.CLOSED,
      });
    });
  });

  describe('searchContactMessages', () => {
    it('should search contact messages successfully', async () => {
      (apiUtils.get as any).mockResolvedValue(mockPaginatedMessages);

      const result = await companyService.searchContactMessages('test query');

      expect(result).toEqual(mockPaginatedMessages);
      expect(apiUtils.get).toHaveBeenCalledWith('/company/contact/messages', {
        search: 'test query',
      });
    });
  });

  describe('getContactMessagesByDateRange', () => {
    it('should fetch messages by date range', async () => {
      (apiUtils.get as any).mockResolvedValue(mockPaginatedMessages);

      const result = await companyService.getContactMessagesByDateRange(
        '2023-12-01',
        '2023-12-31'
      );

      expect(result).toEqual(mockPaginatedMessages);
      expect(apiUtils.get).toHaveBeenCalledWith('/company/contact/messages', {
        start_date: '2023-12-01',
        end_date: '2023-12-31',
      });
    });
  });

  describe('bulkUpdateContactMessages', () => {
    it('should bulk update messages successfully', async () => {
      const mockResponse = {
        data: { updated_count: 5 },
        message: 'Messages updated successfully',
        success: true,
      };

      (apiUtils.put as any).mockResolvedValue(mockResponse);

      const result = await companyService.bulkUpdateContactMessages(
        ['1', '2', '3', '4', '5'],
        { status: ContactMessageStatus.READ }
      );

      expect(result).toEqual(mockResponse);
      expect(apiUtils.put).toHaveBeenCalledWith('/company/contact/messages/bulk-update', {
        message_ids: ['1', '2', '3', '4', '5'],
        update_data: { status: ContactMessageStatus.READ },
      });
    });
  });

  describe('getContactDashboardData', () => {
    it('should fetch contact dashboard data successfully', async () => {
      const mockDashboard = {
        total_messages: 100,
        unread_messages: 10,
        urgent_messages: 5,
        response_rate: 85.0,
        average_response_time: 4.5,
        recent_messages: [mockContactMessage],
        inquiry_type_distribution: {
          [InquiryType.GENERAL]: 40,
          [InquiryType.BOOKING]: 30,
          [InquiryType.COMPLAINT]: 10,
          [InquiryType.SUPPORT]: 15,
          [InquiryType.BUSINESS]: 5,
        },
      };

      (apiUtils.get as any).mockResolvedValue(mockDashboard);

      const result = await companyService.getContactDashboardData();

      expect(result).toEqual(mockDashboard);
      expect(apiUtils.get).toHaveBeenCalledWith('/company/contact/dashboard');
    });
  });

  describe('getOperatingHours', () => {
    it('should get operating hours from company info', async () => {
      (apiUtils.get as any).mockResolvedValue(mockCompanyInfo);

      const result = await companyService.getOperatingHours();

      expect(result).toEqual(mockCompanyInfo.operating_hours);
    });
  });

  describe('isCurrentlyOpen', () => {
    it('should check if company is currently open', async () => {
      (apiUtils.get as any).mockResolvedValue(mockCompanyInfo);

      // Mock current time to be Tuesday at 10:00 AM
      const mockDate = new Date('2023-12-05T10:00:00'); // Tuesday
      vi.spyOn(global, 'Date').mockImplementation(() => mockDate);

      const result = await companyService.isCurrentlyOpen();

      expect(result).toBe(true);
    });

    it('should return false when company is closed', async () => {
      (apiUtils.get as any).mockResolvedValue(mockCompanyInfo);

      // Mock current time to be Sunday at 10:00 AM
      const mockDate = new Date('2023-12-03T10:00:00'); // Sunday
      vi.spyOn(global, 'Date').mockImplementation(() => mockDate);

      const result = await companyService.isCurrentlyOpen();

      expect(result).toBe(false);
    });
  });

  describe('getCertifications', () => {
    it('should get certifications from company info', async () => {
      (apiUtils.get as any).mockResolvedValue(mockCompanyInfo);

      const result = await companyService.getCertifications();

      expect(result).toEqual(mockCompanyInfo.certifications);
    });
  });

  describe('getSpecializations', () => {
    it('should get specializations from company info', async () => {
      (apiUtils.get as any).mockResolvedValue(mockCompanyInfo);

      const result = await companyService.getSpecializations();

      expect(result).toEqual(mockCompanyInfo.specializations);
    });
  });

  describe('getHomeCollectionRadius', () => {
    it('should get home collection radius from company info', async () => {
      (apiUtils.get as any).mockResolvedValue(mockCompanyInfo);

      const result = await companyService.getHomeCollectionRadius();

      expect(result).toBe(mockCompanyInfo.home_collection_radius_km);
    });
  });

  describe('isLocationInHomeCollectionRadius', () => {
    it('should check if location is within radius', async () => {
      (apiUtils.get as any).mockResolvedValue(mockCompanyInfo);

      // Mock coordinates within radius
      const result = await companyService.isLocationInHomeCollectionRadius(
        40.7128, // User lat
        -74.0060, // User lng
        40.7589, // Company lat
        -73.9851  // Company lng
      );

      expect(result).toBe(true);
    });

    it('should return true when coordinates not provided', async () => {
      (apiUtils.get as any).mockResolvedValue(mockCompanyInfo);

      const result = await companyService.isLocationInHomeCollectionRadius(
        40.7128, // User lat
        -74.0060  // User lng
      );

      expect(result).toBe(true);
    });
  });

  describe('preloadCompanyData', () => {
    it('should preload company data without throwing errors', async () => {
      (apiUtils.get as any)
        .mockResolvedValueOnce(mockCompanyInfo)
        .mockResolvedValueOnce(mockContactInfo)
        .mockResolvedValueOnce(mockServices);

      await expect(companyService.preloadCompanyData()).resolves.not.toThrow();
    });

    it('should handle preload errors gracefully', async () => {
      (apiUtils.get as any).mockRejectedValue(new Error('Preload failed'));

      await expect(companyService.preloadCompanyData()).resolves.not.toThrow();
    });
  });
});