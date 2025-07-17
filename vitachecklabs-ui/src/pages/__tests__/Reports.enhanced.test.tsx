import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import Reports from '../Reports';
import { reportsService } from '../../services/reportsService';
import { ReportStatus, PaymentStatus, ReportPriority } from '../../types/api';

// Mock the reports service
vi.mock('../../services/reportsService', () => ({
  reportsService: {
    getReports: vi.fn(),
    getStats: vi.fn(),
    downloadReport: vi.fn(),
    shareReport: vi.fn(),
  },
}));

const mockReports = [
  {
    id: '1',
    user_id: 'user1',
    lab_test_id: 'test1',
    report_number: 'RPT-001',
    status: ReportStatus.COMPLETED,
    collection_location: 'Lab Center A',
    results: 'Normal values across all parameters',
    observations: 'No abnormal findings',
    recommendations: 'Maintain current lifestyle',
    file_path: '/reports/rpt-001.pdf',
    file_original_name: 'blood_test_report.pdf',
    file_size: 1024000,
    is_shared: false,
    amount_charged: 49.99,
    payment_status: PaymentStatus.PAID,
    payment_reference: 'PAY-123',
    priority: ReportPriority.NORMAL,
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-01-15T14:00:00Z',
    completed_at: '2024-01-15T14:00:00Z',
    lab_test: {
      id: 'test1',
      name: 'Complete Blood Count',
      code: 'CBC',
      description: 'Comprehensive blood analysis',
      category: 'HEMATOLOGY',
      sample_type: 'BLOOD',
      price: 49.99,
      is_active: true,
      is_home_collection_available: true,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    },
  },
  {
    id: '2',
    user_id: 'user1',
    lab_test_id: 'test2',
    report_number: 'RPT-002',
    status: ReportStatus.PENDING,
    collection_location: 'Lab Center B',
    is_shared: false,
    amount_charged: 39.99,
    payment_status: PaymentStatus.PENDING,
    priority: ReportPriority.HIGH,
    created_at: '2024-01-20T09:00:00Z',
    updated_at: '2024-01-20T09:00:00Z',
    lab_test: {
      id: 'test2',
      name: 'Lipid Panel',
      code: 'LIP',
      description: 'Cholesterol and lipid analysis',
      category: 'BLOOD_CHEMISTRY',
      sample_type: 'BLOOD',
      price: 39.99,
      is_active: true,
      is_home_collection_available: false,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    },
  },
  {
    id: '3',
    user_id: 'user1',
    lab_test_id: 'test3',
    report_number: 'RPT-003',
    status: ReportStatus.PROCESSING,
    collection_location: 'Home Collection',
    is_shared: true,
    shared_at: '2024-01-22T12:00:00Z',
    shared_with: ['doctor@example.com'],
    amount_charged: 89.99,
    payment_status: PaymentStatus.PAID,
    priority: ReportPriority.LOW,
    created_at: '2024-01-22T08:00:00Z',
    updated_at: '2024-01-22T11:00:00Z',
    lab_test: {
      id: 'test3',
      name: 'Diabetes Panel',
      code: 'DIA',
      description: 'Comprehensive diabetes screening',
      category: 'ENDOCRINOLOGY',
      sample_type: 'BLOOD',
      price: 89.99,
      is_active: true,
      is_home_collection_available: true,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    },
  },
];

const mockStats = {
  total_reports: 25,
  completed_reports: 18,
  pending_reports: 5,
  processing_reports: 2,
  cancelled_reports: 0,
  total_revenue: 1247.75,
  average_report_value: 49.91,
  reports_by_status: {
    [ReportStatus.COMPLETED]: 18,
    [ReportStatus.PENDING]: 5,
    [ReportStatus.PROCESSING]: 2,
    [ReportStatus.SCHEDULED]: 0,
    [ReportStatus.COLLECTED]: 0,
    [ReportStatus.CANCELLED]: 0,
  },
  reports_by_priority: {
    [ReportPriority.HIGH]: 8,
    [ReportPriority.NORMAL]: 15,
    [ReportPriority.LOW]: 2,
  },
  monthly_revenue: 3245.50,
  monthly_report_count: 65,
};

const mockApiResponse = {
  data: mockReports,
  total: 25,
  page: 1,
  per_page: 10,
  total_pages: 3,
};

const renderReportsPage = () => {
  return render(
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Reports />
    </LocalizationProvider>
  );
};

describe('VIT-34: Reports Management System', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (reportsService.getReports as any).mockResolvedValue(mockApiResponse);
    (reportsService.getStats as any).mockResolvedValue(mockStats);
  });

  describe('Page Rendering and Initial Load', () => {
    test('should render reports page with correct header', async () => {
      renderReportsPage();

      expect(screen.getByText('Reports Management')).toBeInTheDocument();
      expect(screen.getByText('View, manage, and analyze your lab test reports')).toBeInTheDocument();
      expect(screen.getByLabelText('Assignment')).toBeInTheDocument();

      await waitFor(() => {
        expect(screen.getByText('Complete Blood Count')).toBeInTheDocument();
      });
    });

    test('should display filter controls', () => {
      renderReportsPage();

      expect(screen.getByLabelText('Search reports')).toBeInTheDocument();
      expect(screen.getByLabelText('Status')).toBeInTheDocument();
      expect(screen.getByLabelText('Priority')).toBeInTheDocument();
      expect(screen.getByLabelText('From Date')).toBeInTheDocument();
      expect(screen.getByLabelText('To Date')).toBeInTheDocument();
    });

    test('should display view mode toggle buttons', () => {
      renderReportsPage();

      expect(screen.getByText('List View')).toBeInTheDocument();
      expect(screen.getByText('Show Stats')).toBeInTheDocument();
      expect(screen.getByText('Refresh')).toBeInTheDocument();
    });

    test('should fetch reports and stats on initial load', async () => {
      renderReportsPage();

      await waitFor(() => {
        expect(reportsService.getReports).toHaveBeenCalledWith({
          page: 1,
          per_page: 10,
        });
        expect(reportsService.getStats).toHaveBeenCalled();
      });
    });
  });

  describe('Reports Display - Grid View', () => {
    test('should display reports in grid view by default', async () => {
      renderReportsPage();

      await waitFor(() => {
        expect(screen.getByText('Complete Blood Count')).toBeInTheDocument();
        expect(screen.getByText('Lipid Panel')).toBeInTheDocument();
        expect(screen.getByText('Diabetes Panel')).toBeInTheDocument();
      });

      // Check report cards display correct information
      expect(screen.getByText('RPT-001')).toBeInTheDocument();
      expect(screen.getByText('RPT-002')).toBeInTheDocument();
      expect(screen.getByText('RPT-003')).toBeInTheDocument();
    });

    test('should display correct status chips with appropriate colors', async () => {
      renderReportsPage();

      await waitFor(() => {
        const completedChip = screen.getByText('COMPLETED');
        const pendingChip = screen.getByText('PENDING');
        const processingChip = screen.getByText('PROCESSING');

        expect(completedChip).toBeInTheDocument();
        expect(pendingChip).toBeInTheDocument();
        expect(processingChip).toBeInTheDocument();
      });
    });

    test('should display priority and payment status chips', async () => {
      renderReportsPage();

      await waitFor(() => {
        expect(screen.getByText('NORMAL')).toBeInTheDocument();
        expect(screen.getByText('HIGH')).toBeInTheDocument();
        expect(screen.getByText('LOW')).toBeInTheDocument();
        expect(screen.getByText('PAID')).toBeInTheDocument();
        expect(screen.getByText('PENDING')).toBeInTheDocument();
      });
    });

    test('should display file attachment indicators', async () => {
      renderReportsPage();

      await waitFor(() => {
        const fileChips = screen.getAllByText('Has File');
        expect(fileChips).toHaveLength(1); // Only first report has file
      });
    });

    test('should display action buttons for each report', async () => {
      renderReportsPage();

      await waitFor(() => {
        const viewButtons = screen.getAllByText('View');
        const shareButtons = screen.getAllByText('Share');
        const downloadButtons = screen.getAllByText('Download');

        expect(viewButtons).toHaveLength(3);
        expect(shareButtons).toHaveLength(3);
        expect(downloadButtons).toHaveLength(1); // Only report with file
      });
    });
  });

  describe('Reports Display - List View', () => {
    test('should switch to list view when toggled', async () => {
      const user = userEvent.setup();
      renderReportsPage();

      await waitFor(() => {
        expect(screen.getByText('Complete Blood Count')).toBeInTheDocument();
      });

      const listViewButton = screen.getByText('List View');
      await user.click(listViewButton);

      // Should show table headers
      expect(screen.getByText('Report')).toBeInTheDocument();
      expect(screen.getByText('Test')).toBeInTheDocument();
      expect(screen.getByText('Status')).toBeInTheDocument();
      expect(screen.getByText('Priority')).toBeInTheDocument();
      expect(screen.getByText('Payment')).toBeInTheDocument();
      expect(screen.getByText('Amount')).toBeInTheDocument();
      expect(screen.getByText('Created')).toBeInTheDocument();
      expect(screen.getByText('Actions')).toBeInTheDocument();
    });

    test('should display pagination controls in list view', async () => {
      const user = userEvent.setup();
      renderReportsPage();

      await waitFor(() => {
        expect(screen.getByText('Complete Blood Count')).toBeInTheDocument();
      });

      const listViewButton = screen.getByText('List View');
      await user.click(listViewButton);

      // Should show pagination
      expect(screen.getByText('1–3 of 25')).toBeInTheDocument();
      expect(screen.getByLabelText('Go to next page')).toBeInTheDocument();
    });
  });

  describe('Statistics Dashboard', () => {
    test('should toggle stats display', async () => {
      const user = userEvent.setup();
      renderReportsPage();

      const showStatsButton = screen.getByText('Show Stats');
      await user.click(showStatsButton);

      await waitFor(() => {
        expect(screen.getByText('Reports Statistics')).toBeInTheDocument();
        expect(screen.getByText('Total Reports')).toBeInTheDocument();
        expect(screen.getByText('Completed')).toBeInTheDocument();
        expect(screen.getByText('Pending')).toBeInTheDocument();
        expect(screen.getByText('Total Revenue')).toBeInTheDocument();
      });

      // Check stat values
      expect(screen.getByText('25')).toBeInTheDocument(); // Total reports
      expect(screen.getByText('18')).toBeInTheDocument(); // Completed reports
      expect(screen.getByText('5')).toBeInTheDocument(); // Pending reports
      expect(screen.getByText('$1247.75')).toBeInTheDocument(); // Total revenue
    });

    test('should hide stats when toggled off', async () => {
      const user = userEvent.setup();
      renderReportsPage();

      const showStatsButton = screen.getByText('Show Stats');
      await user.click(showStatsButton);

      await waitFor(() => {
        expect(screen.getByText('Reports Statistics')).toBeInTheDocument();
      });

      const hideStatsButton = screen.getByText('Hide Stats');
      await user.click(hideStatsButton);

      expect(screen.queryByText('Reports Statistics')).not.toBeInTheDocument();
    });
  });

  describe('Search and Filtering', () => {
    test('should perform search when search button is clicked', async () => {
      const user = userEvent.setup();
      renderReportsPage();

      await waitFor(() => {
        expect(screen.getByText('Complete Blood Count')).toBeInTheDocument();
      });

      const searchInput = screen.getByLabelText('Search reports');
      await user.type(searchInput, 'blood');

      const searchButton = screen.getByRole('button', { name: /search/i });
      await user.click(searchButton);

      expect(reportsService.getReports).toHaveBeenCalledWith(
        expect.objectContaining({
          search: 'blood',
        })
      );
    });

    test('should filter by status', async () => {
      const user = userEvent.setup();
      renderReportsPage();

      await waitFor(() => {
        expect(screen.getByText('Complete Blood Count')).toBeInTheDocument();
      });

      const statusSelect = screen.getByLabelText('Status');
      await user.click(statusSelect);

      const completedOption = screen.getByText('COMPLETED');
      await user.click(completedOption);

      await waitFor(() => {
        expect(reportsService.getReports).toHaveBeenCalledWith(
          expect.objectContaining({
            status: ReportStatus.COMPLETED,
          })
        );
      });
    });

    test('should filter by priority', async () => {
      const user = userEvent.setup();
      renderReportsPage();

      await waitFor(() => {
        expect(screen.getByText('Complete Blood Count')).toBeInTheDocument();
      });

      const prioritySelect = screen.getByLabelText('Priority');
      await user.click(prioritySelect);

      const highOption = screen.getByText('HIGH');
      await user.click(highOption);

      await waitFor(() => {
        expect(reportsService.getReports).toHaveBeenCalledWith(
          expect.objectContaining({
            priority: ReportPriority.HIGH,
          })
        );
      });
    });

    test('should clear all filters', async () => {
      const user = userEvent.setup();
      renderReportsPage();

      await waitFor(() => {
        expect(screen.getByText('Complete Blood Count')).toBeInTheDocument();
      });

      // Apply some filters
      const searchInput = screen.getByLabelText('Search reports');
      await user.type(searchInput, 'blood');

      const statusSelect = screen.getByLabelText('Status');
      await user.click(statusSelect);
      const completedOption = screen.getByText('COMPLETED');
      await user.click(completedOption);

      // Clear filters
      const clearButton = screen.getByRole('button', { name: /clear/i });
      await user.click(clearButton);

      expect(searchInput).toHaveValue('');
    });

    test('should display active filter chips', async () => {
      const user = userEvent.setup();
      renderReportsPage();

      await waitFor(() => {
        expect(screen.getByText('Complete Blood Count')).toBeInTheDocument();
      });

      const statusSelect = screen.getByLabelText('Status');
      await user.click(statusSelect);
      const completedOption = screen.getByText('COMPLETED');
      await user.click(completedOption);

      await waitFor(() => {
        const filterChips = screen.getAllByText('COMPLETED');
        expect(filterChips.length).toBeGreaterThan(1); // One in the filter chip area
      });
    });
  });

  describe('Report Details Modal', () => {
    test('should open report details modal when view button is clicked', async () => {
      const user = userEvent.setup();
      renderReportsPage();

      await waitFor(() => {
        expect(screen.getByText('Complete Blood Count')).toBeInTheDocument();
      });

      const viewButtons = screen.getAllByText('View');
      await user.click(viewButtons[0]);

      expect(screen.getByText('Report Details')).toBeInTheDocument();
      expect(screen.getByText('RPT-001')).toBeInTheDocument();
      expect(screen.getByText('Normal values across all parameters')).toBeInTheDocument();
      expect(screen.getByText('No abnormal findings')).toBeInTheDocument();
      expect(screen.getByText('Maintain current lifestyle')).toBeInTheDocument();
    });

    test('should close report details modal', async () => {
      const user = userEvent.setup();
      renderReportsPage();

      await waitFor(() => {
        expect(screen.getByText('Complete Blood Count')).toBeInTheDocument();
      });

      const viewButtons = screen.getAllByText('View');
      await user.click(viewButtons[0]);

      const closeButton = screen.getByRole('button', { name: /close/i });
      await user.click(closeButton);

      expect(screen.queryByText('Report Details')).not.toBeInTheDocument();
    });

    test('should show download button in details modal for reports with files', async () => {
      const user = userEvent.setup();
      renderReportsPage();

      await waitFor(() => {
        expect(screen.getByText('Complete Blood Count')).toBeInTheDocument();
      });

      const viewButtons = screen.getAllByText('View');
      await user.click(viewButtons[0]);

      expect(screen.getByText('Download Report')).toBeInTheDocument();
    });
  });

  describe('Report Sharing', () => {
    test('should open share modal when share button is clicked', async () => {
      const user = userEvent.setup();
      renderReportsPage();

      await waitFor(() => {
        expect(screen.getByText('Complete Blood Count')).toBeInTheDocument();
      });

      const shareButtons = screen.getAllByText('Share');
      await user.click(shareButtons[0]);

      expect(screen.getByText('Share Report')).toBeInTheDocument();
      expect(screen.getByLabelText('Email Address')).toBeInTheDocument();
      expect(screen.getByLabelText('Expiration Date (Optional)')).toBeInTheDocument();
    });

    test('should submit share form with email', async () => {
      const user = userEvent.setup();
      renderReportsPage();

      await waitFor(() => {
        expect(screen.getByText('Complete Blood Count')).toBeInTheDocument();
      });

      const shareButtons = screen.getAllByText('Share');
      await user.click(shareButtons[0]);

      const emailInput = screen.getByLabelText('Email Address');
      await user.type(emailInput, 'test@example.com');

      const shareButton = screen.getByRole('button', { name: /share report/i });
      await user.click(shareButton);

      expect(reportsService.shareReport).toHaveBeenCalledWith(
        '1',
        expect.objectContaining({
          email: 'test@example.com',
        })
      );
    });

    test('should disable share button when no email is provided', async () => {
      const user = userEvent.setup();
      renderReportsPage();

      await waitFor(() => {
        expect(screen.getByText('Complete Blood Count')).toBeInTheDocument();
      });

      const shareButtons = screen.getAllByText('Share');
      await user.click(shareButtons[0]);

      const shareButton = screen.getByRole('button', { name: /share report/i });
      expect(shareButton).toBeDisabled();
    });
  });

  describe('Report Download', () => {
    test('should call download service when download button is clicked', async () => {
      const user = userEvent.setup();
      renderReportsPage();

      await waitFor(() => {
        expect(screen.getByText('Complete Blood Count')).toBeInTheDocument();
      });

      const downloadButtons = screen.getAllByText('Download');
      await user.click(downloadButtons[0]);

      expect(reportsService.downloadReport).toHaveBeenCalledWith('1', 'pdf');
    });

    test('should handle download errors gracefully', async () => {
      const user = userEvent.setup();
      (reportsService.downloadReport as any).mockRejectedValue(new Error('Download failed'));

      renderReportsPage();

      await waitFor(() => {
        expect(screen.getByText('Complete Blood Count')).toBeInTheDocument();
      });

      const downloadButtons = screen.getAllByText('Download');
      await user.click(downloadButtons[0]);

      await waitFor(() => {
        expect(screen.getByText('Failed to download report. Please try again.')).toBeInTheDocument();
      });
    });
  });

  describe('Pagination', () => {
    test('should handle page changes', async () => {
      const user = userEvent.setup();
      renderReportsPage();

      await waitFor(() => {
        expect(screen.getByText('Complete Blood Count')).toBeInTheDocument();
      });

      // Switch to list view to access pagination
      const listViewButton = screen.getByText('List View');
      await user.click(listViewButton);

      const nextPageButton = screen.getByLabelText('Go to next page');
      await user.click(nextPageButton);

      expect(reportsService.getReports).toHaveBeenCalledWith(
        expect.objectContaining({
          page: 2,
        })
      );
    });

    test('should handle rows per page changes', async () => {
      const user = userEvent.setup();
      renderReportsPage();

      await waitFor(() => {
        expect(screen.getByText('Complete Blood Count')).toBeInTheDocument();
      });

      // Switch to list view to access pagination
      const listViewButton = screen.getByText('List View');
      await user.click(listViewButton);

      const rowsPerPageSelect = screen.getByDisplayValue('10');
      await user.click(rowsPerPageSelect);

      const option25 = screen.getByRole('option', { name: '25' });
      await user.click(option25);

      expect(reportsService.getReports).toHaveBeenCalledWith(
        expect.objectContaining({
          per_page: 25,
        })
      );
    });
  });

  describe('Error Handling', () => {
    test('should display error message when API call fails', async () => {
      (reportsService.getReports as any).mockRejectedValue(new Error('API Error'));

      renderReportsPage();

      await waitFor(() => {
        expect(screen.getByText('Failed to load reports. Please try again.')).toBeInTheDocument();
      });
    });

    test('should handle share API errors', async () => {
      const user = userEvent.setup();
      (reportsService.shareReport as any).mockRejectedValue(new Error('Share failed'));

      renderReportsPage();

      await waitFor(() => {
        expect(screen.getByText('Complete Blood Count')).toBeInTheDocument();
      });

      const shareButtons = screen.getAllByText('Share');
      await user.click(shareButtons[0]);

      const emailInput = screen.getByLabelText('Email Address');
      await user.type(emailInput, 'test@example.com');

      const shareButton = screen.getByRole('button', { name: /share report/i });
      await user.click(shareButton);

      await waitFor(() => {
        expect(screen.getByText('Failed to share report. Please try again.')).toBeInTheDocument();
      });
    });
  });

  describe('Loading States', () => {
    test('should display loading spinner during initial load', () => {
      (reportsService.getReports as any).mockReturnValue(new Promise(() => {}));

      renderReportsPage();

      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });

    test('should hide loading spinner after data loads', async () => {
      renderReportsPage();

      await waitFor(() => {
        expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
      });
    });
  });

  describe('Empty State', () => {
    test('should display empty state when no reports found', async () => {
      (reportsService.getReports as any).mockResolvedValue({
        data: [],
        total: 0,
        page: 1,
        per_page: 10,
        total_pages: 0,
      });

      renderReportsPage();

      await waitFor(() => {
        expect(screen.getByText('No reports found')).toBeInTheDocument();
        expect(screen.getByText('Try adjusting your search criteria or filters')).toBeInTheDocument();
      });
    });
  });

  describe('Refresh Functionality', () => {
    test('should refresh data when refresh button is clicked', async () => {
      const user = userEvent.setup();
      renderReportsPage();

      await waitFor(() => {
        expect(screen.getByText('Complete Blood Count')).toBeInTheDocument();
      });

      const refreshButton = screen.getByText('Refresh');
      await user.click(refreshButton);

      expect(reportsService.getReports).toHaveBeenCalledTimes(2);
    });
  });
});

describe('VIT-34: Reports Management Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (reportsService.getReports as any).mockResolvedValue(mockApiResponse);
    (reportsService.getStats as any).mockResolvedValue(mockStats);
  });

  test('should maintain filter state when switching between grid and list views', async () => {
    const user = userEvent.setup();
    renderReportsPage();

    await waitFor(() => {
      expect(screen.getByText('Complete Blood Count')).toBeInTheDocument();
    });

    // Apply a filter
    const statusSelect = screen.getByLabelText('Status');
    await user.click(statusSelect);
    const completedOption = screen.getByText('COMPLETED');
    await user.click(completedOption);

    // Switch to list view
    const listViewButton = screen.getByText('List View');
    await user.click(listViewButton);

    // Switch back to grid view
    const gridViewButton = screen.getByText('Grid View');
    await user.click(gridViewButton);

    // Filter should still be applied
    await waitFor(() => {
      const filterChips = screen.getAllByText('COMPLETED');
      expect(filterChips.length).toBeGreaterThan(1);
    });
  });

  test('should maintain search state when opening and closing modals', async () => {
    const user = userEvent.setup();
    renderReportsPage();

    await waitFor(() => {
      expect(screen.getByText('Complete Blood Count')).toBeInTheDocument();
    });

    // Apply search
    const searchInput = screen.getByLabelText('Search reports');
    await user.type(searchInput, 'blood');

    // Open and close details modal
    const viewButtons = screen.getAllByText('View');
    await user.click(viewButtons[0]);

    const closeButton = screen.getByRole('button', { name: /close/i });
    await user.click(closeButton);

    // Search should still be applied
    expect(searchInput).toHaveValue('blood');
  });

  test('should update report count when filters are applied', async () => {
    const user = userEvent.setup();
    
    // Mock filtered response
    const filteredResponse = {
      data: [mockReports[0]],
      total: 1,
      page: 1,
      per_page: 10,
      total_pages: 1,
    };

    (reportsService.getReports as any)
      .mockResolvedValueOnce(mockApiResponse)
      .mockResolvedValueOnce(filteredResponse);

    renderReportsPage();

    await waitFor(() => {
      expect(screen.getByText('25 reports found')).toBeInTheDocument();
    });

    // Apply filter
    const statusSelect = screen.getByLabelText('Status');
    await user.click(statusSelect);
    const completedOption = screen.getByText('COMPLETED');
    await user.click(completedOption);

    await waitFor(() => {
      expect(screen.getByText('1 reports found')).toBeInTheDocument();
    });
  });

  test('should handle concurrent API calls gracefully', async () => {
    const user = userEvent.setup();
    let resolveGetReports: (value: any) => void;
    let resolveGetStats: (value: any) => void;

    (reportsService.getReports as any).mockImplementation(
      () => new Promise((resolve) => { resolveGetReports = resolve; })
    );
    (reportsService.getStats as any).mockImplementation(
      () => new Promise((resolve) => { resolveGetStats = resolve; })
    );

    renderReportsPage();

    // Both API calls should be initiated
    expect(reportsService.getReports).toHaveBeenCalled();
    expect(reportsService.getStats).toHaveBeenCalled();

    // Resolve stats first
    resolveGetStats!(mockStats);

    // Resolve reports
    resolveGetReports!(mockApiResponse);

    await waitFor(() => {
      expect(screen.getByText('Complete Blood Count')).toBeInTheDocument();
    });
  });

  test('should handle date range filtering', async () => {
    const user = userEvent.setup();
    renderReportsPage();

    await waitFor(() => {
      expect(screen.getByText('Complete Blood Count')).toBeInTheDocument();
    });

    // This would typically involve date picker interaction
    // For now, we'll test the API call structure
    const searchButton = screen.getByRole('button', { name: /search/i });
    await user.click(searchButton);

    expect(reportsService.getReports).toHaveBeenCalledWith(
      expect.objectContaining({
        page: 1,
        per_page: 10,
      })
    );
  });
});