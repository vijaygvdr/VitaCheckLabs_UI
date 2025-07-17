import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import LabTests from '../LabTests';
import { labTestsService } from '../../services/labTestsService';
import { LabTestCategory, SampleType } from '../../types/api';

// Mock the lab tests service
vi.mock('../../services/labTestsService', () => ({
  labTestsService: {
    getLabTests: vi.fn(),
    checkTestAvailability: vi.fn(),
    bookLabTest: vi.fn(),
  },
}));

// Mock the booking component
vi.mock('../../components/LabTestBooking', () => ({
  default: ({ open, onClose, test }: any) => (
    <div data-testid="booking-modal">
      {open && (
        <div>
          <h2>Book Test: {test?.name}</h2>
          <button onClick={onClose}>Close</button>
        </div>
      )}
    </div>
  ),
}));

const mockLabTests = [
  {
    id: '1',
    name: 'Complete Blood Count',
    code: 'CBC',
    description: 'A comprehensive blood test to check overall health',
    category: LabTestCategory.HEMATOLOGY,
    sample_type: SampleType.BLOOD,
    price: 49.99,
    is_active: true,
    is_home_collection_available: true,
    minimum_age: 18,
    maximum_age: 80,
    duration_minutes: 30,
    report_delivery_hours: 24,
    created_at: '2023-01-01T00:00:00Z',
    updated_at: '2023-01-01T00:00:00Z',
  },
  {
    id: '2',
    name: 'Lipid Panel',
    code: 'LIP',
    description: 'Measures cholesterol and triglyceride levels',
    category: LabTestCategory.BLOOD_CHEMISTRY,
    sample_type: SampleType.BLOOD,
    price: 39.99,
    is_active: true,
    is_home_collection_available: false,
    minimum_age: 25,
    duration_minutes: 15,
    report_delivery_hours: 12,
    created_at: '2023-01-01T00:00:00Z',
    updated_at: '2023-01-01T00:00:00Z',
  },
  {
    id: '3',
    name: 'Diabetes Panel',
    code: 'DIA',
    description: 'Comprehensive diabetes screening tests',
    category: LabTestCategory.ENDOCRINOLOGY,
    sample_type: SampleType.BLOOD,
    price: 59.99,
    is_active: true,
    is_home_collection_available: true,
    minimum_age: 30,
    maximum_age: 75,
    duration_minutes: 45,
    report_delivery_hours: 48,
    created_at: '2023-01-01T00:00:00Z',
    updated_at: '2023-01-01T00:00:00Z',
  },
];

const mockApiResponse = {
  data: mockLabTests,
  total: 3,
  page: 1,
  per_page: 12,
  total_pages: 1,
};

describe('VIT-33: Enhanced Lab Tests Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (labTestsService.getLabTests as any).mockResolvedValue(mockApiResponse);
  });

  test('should render lab tests page with enhanced features', async () => {
    render(<LabTests />);

    // Check if the page title is present
    expect(screen.getByText('Lab Tests')).toBeInTheDocument();
    expect(screen.getByText('Browse and book our comprehensive range of laboratory tests')).toBeInTheDocument();

    // Wait for tests to load
    await waitFor(() => {
      expect(screen.getByText('Complete Blood Count')).toBeInTheDocument();
    });
  });

  test('should display search and filter controls', async () => {
    render(<LabTests />);

    // Check for search input
    expect(screen.getByLabelText('Search tests')).toBeInTheDocument();

    // Check for filter controls
    expect(screen.getByLabelText('Category')).toBeInTheDocument();
    expect(screen.getByLabelText('Sample Type')).toBeInTheDocument();
    expect(screen.getByText('Price Range:')).toBeInTheDocument();
    expect(screen.getByText('Home Collection Only')).toBeInTheDocument();
  });

  test('should perform search functionality', async () => {
    const user = userEvent.setup();
    render(<LabTests />);

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByText('Complete Blood Count')).toBeInTheDocument();
    });

    // Type in search input
    const searchInput = screen.getByLabelText('Search tests');
    await user.type(searchInput, 'blood');

    // Click search button
    const searchButton = screen.getByRole('button', { name: /search/i });
    await user.click(searchButton);

    // Verify API was called with search parameter
    expect(labTestsService.getLabTests).toHaveBeenCalledWith(
      expect.objectContaining({
        search: 'blood',
      })
    );
  });

  test('should filter by category', async () => {
    const user = userEvent.setup();
    render(<LabTests />);

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByText('Complete Blood Count')).toBeInTheDocument();
    });

    // Select category filter
    const categorySelect = screen.getByLabelText('Category');
    await user.click(categorySelect);

    // Select HEMATOLOGY category
    const hematologyOption = screen.getByText('HEMATOLOGY');
    await user.click(hematologyOption);

    // Verify API was called with category filter
    await waitFor(() => {
      expect(labTestsService.getLabTests).toHaveBeenCalledWith(
        expect.objectContaining({
          category: LabTestCategory.HEMATOLOGY,
        })
      );
    });
  });

  test('should filter by sample type', async () => {
    const user = userEvent.setup();
    render(<LabTests />);

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByText('Complete Blood Count')).toBeInTheDocument();
    });

    // Select sample type filter
    const sampleTypeSelect = screen.getByLabelText('Sample Type');
    await user.click(sampleTypeSelect);

    // Select BLOOD sample type
    const bloodOption = screen.getByText('BLOOD');
    await user.click(bloodOption);

    // Verify API was called with sample type filter
    await waitFor(() => {
      expect(labTestsService.getLabTests).toHaveBeenCalledWith(
        expect.objectContaining({
          sample_type: SampleType.BLOOD,
        })
      );
    });
  });

  test('should filter by home collection availability', async () => {
    const user = userEvent.setup();
    render(<LabTests />);

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByText('Complete Blood Count')).toBeInTheDocument();
    });

    // Click home collection filter
    const homeCollectionButton = screen.getByText('Home Collection Only');
    await user.click(homeCollectionButton);

    // Verify API was called with home collection filter
    await waitFor(() => {
      expect(labTestsService.getLabTests).toHaveBeenCalledWith(
        expect.objectContaining({
          is_home_collection_available: true,
        })
      );
    });
  });

  test('should clear all filters', async () => {
    const user = userEvent.setup();
    render(<LabTests />);

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByText('Complete Blood Count')).toBeInTheDocument();
    });

    // Apply some filters first
    const searchInput = screen.getByLabelText('Search tests');
    await user.type(searchInput, 'blood');

    const homeCollectionButton = screen.getByText('Home Collection Only');
    await user.click(homeCollectionButton);

    // Clear filters
    const clearButton = screen.getByRole('button', { name: /clear filters/i });
    await user.click(clearButton);

    // Verify filters are cleared
    expect(searchInput).toHaveValue('');
    expect(homeCollectionButton).not.toHaveClass('MuiButton-contained');
  });

  test('should display test cards with correct information', async () => {
    render(<LabTests />);

    // Wait for tests to load
    await waitFor(() => {
      expect(screen.getByText('Complete Blood Count')).toBeInTheDocument();
    });

    // Check if all mock tests are displayed
    expect(screen.getByText('Complete Blood Count')).toBeInTheDocument();
    expect(screen.getByText('Lipid Panel')).toBeInTheDocument();
    expect(screen.getByText('Diabetes Panel')).toBeInTheDocument();

    // Check if prices are displayed correctly
    expect(screen.getByText('$49.99')).toBeInTheDocument();
    expect(screen.getByText('$39.99')).toBeInTheDocument();
    expect(screen.getByText('$59.99')).toBeInTheDocument();

    // Check if home collection chips are displayed
    const homeCollectionChips = screen.getAllByText('Home Collection');
    expect(homeCollectionChips).toHaveLength(2); // CBC and Diabetes Panel
  });

  test('should open test details modal', async () => {
    const user = userEvent.setup();
    render(<LabTests />);

    // Wait for tests to load
    await waitFor(() => {
      expect(screen.getByText('Complete Blood Count')).toBeInTheDocument();
    });

    // Click details button for first test
    const detailsButtons = screen.getAllByText('Details');
    await user.click(detailsButtons[0]);

    // Check if modal is opened
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Complete Blood Count')).toBeInTheDocument();
  });

  test('should handle API errors gracefully', async () => {
    // Mock API to throw error
    (labTestsService.getLabTests as any).mockRejectedValue(new Error('API Error'));

    render(<LabTests />);

    // Wait for error to be displayed
    await waitFor(() => {
      expect(screen.getByText('Failed to load lab tests. Please try again.')).toBeInTheDocument();
    });
  });

  test('should display loading state', () => {
    // Mock API to return a pending promise
    (labTestsService.getLabTests as any).mockReturnValue(new Promise(() => {}));

    render(<LabTests />);

    // Check if loading indicator is shown
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });
});

describe('VIT-34: Lab Test Booking Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (labTestsService.getLabTests as any).mockResolvedValue(mockApiResponse);
  });

  test('should open booking modal when clicking book button', async () => {
    const user = userEvent.setup();
    render(<LabTests />);

    // Wait for tests to load
    await waitFor(() => {
      expect(screen.getByText('Complete Blood Count')).toBeInTheDocument();
    });

    // Click book button for first test
    const bookButtons = screen.getAllByText('Book Now');
    await user.click(bookButtons[0]);

    // Check if booking modal is opened
    expect(screen.getByTestId('booking-modal')).toBeInTheDocument();
    expect(screen.getByText('Book Test: Complete Blood Count')).toBeInTheDocument();
  });

  test('should open booking modal from details modal', async () => {
    const user = userEvent.setup();
    render(<LabTests />);

    // Wait for tests to load
    await waitFor(() => {
      expect(screen.getByText('Complete Blood Count')).toBeInTheDocument();
    });

    // Click details button first
    const detailsButtons = screen.getAllByText('Details');
    await user.click(detailsButtons[0]);

    // Click book button in details modal
    const bookThisTestButton = screen.getByText('Book This Test');
    await user.click(bookThisTestButton);

    // Check if booking modal is opened
    expect(screen.getByTestId('booking-modal')).toBeInTheDocument();
    expect(screen.getByText('Book Test: Complete Blood Count')).toBeInTheDocument();
  });

  test('should close booking modal', async () => {
    const user = userEvent.setup();
    render(<LabTests />);

    // Wait for tests to load
    await waitFor(() => {
      expect(screen.getByText('Complete Blood Count')).toBeInTheDocument();
    });

    // Open booking modal
    const bookButtons = screen.getAllByText('Book Now');
    await user.click(bookButtons[0]);

    // Close modal
    const closeButton = screen.getByText('Close');
    await user.click(closeButton);

    // Check if modal is closed
    expect(screen.queryByTestId('booking-modal')).not.toBeInTheDocument();
  });

  test('should pass correct test data to booking modal', async () => {
    const user = userEvent.setup();
    render(<LabTests />);

    // Wait for tests to load
    await waitFor(() => {
      expect(screen.getByText('Complete Blood Count')).toBeInTheDocument();
    });

    // Click book button for first test
    const bookButtons = screen.getAllByText('Book Now');
    await user.click(bookButtons[0]);

    // Verify correct test name is passed
    expect(screen.getByText('Book Test: Complete Blood Count')).toBeInTheDocument();
  });
});

describe('VIT-33 & VIT-34: Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (labTestsService.getLabTests as any).mockResolvedValue(mockApiResponse);
  });

  test('should maintain filter state when opening and closing modals', async () => {
    const user = userEvent.setup();
    render(<LabTests />);

    // Wait for tests to load
    await waitFor(() => {
      expect(screen.getByText('Complete Blood Count')).toBeInTheDocument();
    });

    // Apply a filter
    const searchInput = screen.getByLabelText('Search tests');
    await user.type(searchInput, 'blood');

    // Open and close details modal
    const detailsButtons = screen.getAllByText('Details');
    await user.click(detailsButtons[0]);

    const closeButton = screen.getByRole('button', { name: /close/i });
    await user.click(closeButton);

    // Verify filter is still applied
    expect(searchInput).toHaveValue('blood');
  });

  test('should handle pagination correctly', async () => {
    const paginatedResponse = {
      ...mockApiResponse,
      total: 25,
      total_pages: 3,
    };

    (labTestsService.getLabTests as any).mockResolvedValue(paginatedResponse);

    render(<LabTests />);

    // Wait for tests to load
    await waitFor(() => {
      expect(screen.getByText('Complete Blood Count')).toBeInTheDocument();
    });

    // Check if pagination is displayed
    expect(screen.getByRole('navigation')).toBeInTheDocument();
  });

  test('should show active filter chips', async () => {
    const user = userEvent.setup();
    render(<LabTests />);

    // Wait for tests to load
    await waitFor(() => {
      expect(screen.getByText('Complete Blood Count')).toBeInTheDocument();
    });

    // Apply category filter
    const categorySelect = screen.getByLabelText('Category');
    await user.click(categorySelect);

    const hematologyOption = screen.getByText('HEMATOLOGY');
    await user.click(hematologyOption);

    // Check if filter chip is displayed
    await waitFor(() => {
      expect(screen.getByText('HEMATOLOGY')).toBeInTheDocument();
    });
  });

  test('should handle empty results gracefully', async () => {
    (labTestsService.getLabTests as any).mockResolvedValue({
      data: [],
      total: 0,
      page: 1,
      per_page: 12,
      total_pages: 0,
    });

    render(<LabTests />);

    // Wait for empty state
    await waitFor(() => {
      expect(screen.getByText('0 tests found')).toBeInTheDocument();
    });
  });
});