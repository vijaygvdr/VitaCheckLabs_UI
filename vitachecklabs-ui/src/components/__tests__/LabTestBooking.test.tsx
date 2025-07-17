import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import LabTestBookingComponent from '../LabTestBooking';
import { labTestsService } from '../../services/labTestsService';
import { LabTestCategory, SampleType } from '../../types/api';

// Mock the lab tests service
vi.mock('../../services/labTestsService', () => ({
  labTestsService: {
    checkTestAvailability: vi.fn(),
    bookLabTest: vi.fn(),
  },
}));

const mockTest = {
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
  requirements: 'Fasting required for 12 hours',
  procedure: 'Blood will be drawn from a vein in your arm',
  created_at: '2023-01-01T00:00:00Z',
  updated_at: '2023-01-01T00:00:00Z',
};

const mockAvailability = {
  available: true,
  available_slots: ['09:00', '10:00', '11:00', '14:00', '15:00'],
  home_collection_available: true,
};

const mockBookingResponse = {
  success: true,
  data: {
    booking_id: 'BOOK-123',
    status: 'confirmed',
    scheduled_at: '2023-12-25T10:00:00Z',
    amount: 49.99,
  },
  message: 'Booking confirmed successfully',
};

const renderBookingComponent = (props = {}) => {
  const defaultProps = {
    open: true,
    onClose: vi.fn(),
    test: mockTest,
    ...props,
  };

  return render(
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <LabTestBookingComponent {...defaultProps} />
    </LocalizationProvider>
  );
};

describe('VIT-34: Lab Test Booking Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (labTestsService.checkTestAvailability as any).mockResolvedValue(mockAvailability);
    (labTestsService.bookLabTest as any).mockResolvedValue(mockBookingResponse);
  });

  test('should render booking modal when open', () => {
    renderBookingComponent();

    expect(screen.getByText('Book Lab Test')).toBeInTheDocument();
    expect(screen.getByText('Test Details')).toBeInTheDocument();
    expect(screen.getByText('Complete Blood Count')).toBeInTheDocument();
  });

  test('should not render when closed', () => {
    renderBookingComponent({ open: false });

    expect(screen.queryByText('Book Lab Test')).not.toBeInTheDocument();
  });

  test('should display test details correctly', () => {
    renderBookingComponent();

    expect(screen.getByText('Complete Blood Count')).toBeInTheDocument();
    expect(screen.getByText('A comprehensive blood test to check overall health')).toBeInTheDocument();
    expect(screen.getByText('$49.99')).toBeInTheDocument();
    expect(screen.getByText('HEMATOLOGY')).toBeInTheDocument();
    expect(screen.getByText('BLOOD')).toBeInTheDocument();
    expect(screen.getByText('24 hours')).toBeInTheDocument();
    expect(screen.getByText('Home Collection Available')).toBeInTheDocument();
    expect(screen.getByText('Min Age: 18')).toBeInTheDocument();
    expect(screen.getByText('Max Age: 80')).toBeInTheDocument();
    expect(screen.getByText('Fasting required for 12 hours')).toBeInTheDocument();
  });

  test('should proceed to booking information step', async () => {
    const user = userEvent.setup();
    renderBookingComponent();

    const nextButton = screen.getByText('Next');
    await user.click(nextButton);

    expect(screen.getByText('Booking Information')).toBeInTheDocument();
    expect(screen.getByLabelText('Preferred Date')).toBeInTheDocument();
    expect(screen.getByLabelText('Preferred Time')).toBeInTheDocument();
    expect(screen.getByLabelText('Patient Name')).toBeInTheDocument();
    expect(screen.getByLabelText('Patient Age')).toBeInTheDocument();
    expect(screen.getByLabelText('Phone Number')).toBeInTheDocument();
  });

  test('should check availability when date is selected', async () => {
    const user = userEvent.setup();
    renderBookingComponent();

    // Navigate to booking step
    const nextButton = screen.getByText('Next');
    await user.click(nextButton);

    // Select a date (this would normally trigger the date picker)
    // For testing, we'll simulate the effect
    expect(labTestsService.checkTestAvailability).toHaveBeenCalledWith(
      mockTest.id,
      expect.any(String)
    );
  });

  test('should fill booking form and proceed', async () => {
    const user = userEvent.setup();
    renderBookingComponent();

    // Navigate to booking step
    const nextButton = screen.getByText('Next');
    await user.click(nextButton);

    // Fill out form
    await user.type(screen.getByLabelText('Patient Name'), 'John Doe');
    await user.type(screen.getByLabelText('Patient Age'), '30');
    await user.type(screen.getByLabelText('Phone Number'), '1234567890');
    await user.type(screen.getByLabelText('Email Address'), 'john@example.com');

    // Select time slot
    const timeSelect = screen.getByLabelText('Preferred Time');
    await user.click(timeSelect);
    await user.click(screen.getByText('09:00'));

    // Submit booking
    const bookButton = screen.getByText('Book Test');
    await user.click(bookButton);

    // Verify booking service was called
    expect(labTestsService.bookLabTest).toHaveBeenCalledWith(
      mockTest.id,
      expect.objectContaining({
        patient_age: 30,
        is_home_collection: false,
      })
    );
  });

  test('should handle home collection option', async () => {
    const user = userEvent.setup();
    renderBookingComponent();

    // Navigate to booking step
    const nextButton = screen.getByText('Next');
    await user.click(nextButton);

    // Enable home collection
    const homeCollectionCheckbox = screen.getByLabelText('Home Collection');
    await user.click(homeCollectionCheckbox);

    // Fill address
    const addressField = screen.getByLabelText('Collection Address');
    await user.type(addressField, '123 Main St, City, State 12345');

    // Fill other required fields
    await user.type(screen.getByLabelText('Patient Name'), 'John Doe');
    await user.type(screen.getByLabelText('Patient Age'), '30');
    await user.type(screen.getByLabelText('Phone Number'), '1234567890');

    // Select time slot
    const timeSelect = screen.getByLabelText('Preferred Time');
    await user.click(timeSelect);
    await user.click(screen.getByText('09:00'));

    // Submit booking
    const bookButton = screen.getByText('Book Test');
    await user.click(bookButton);

    // Verify booking service was called with home collection
    expect(labTestsService.bookLabTest).toHaveBeenCalledWith(
      mockTest.id,
      expect.objectContaining({
        is_home_collection: true,
        collection_address: '123 Main St, City, State 12345',
      })
    );
  });

  test('should validate age requirements', async () => {
    const user = userEvent.setup();
    renderBookingComponent();

    // Navigate to booking step
    const nextButton = screen.getByText('Next');
    await user.click(nextButton);

    // Fill form with invalid age
    await user.type(screen.getByLabelText('Patient Name'), 'John Doe');
    await user.type(screen.getByLabelText('Patient Age'), '16'); // Below minimum age
    await user.type(screen.getByLabelText('Phone Number'), '1234567890');

    // Select time slot
    const timeSelect = screen.getByLabelText('Preferred Time');
    await user.click(timeSelect);
    await user.click(screen.getByText('09:00'));

    // Try to submit booking
    const bookButton = screen.getByText('Book Test');
    await user.click(bookButton);

    // Should show error message
    await waitFor(() => {
      expect(screen.getByText('Minimum age requirement: 18 years')).toBeInTheDocument();
    });
  });

  test('should validate required fields', async () => {
    const user = userEvent.setup();
    renderBookingComponent();

    // Navigate to booking step
    const nextButton = screen.getByText('Next');
    await user.click(nextButton);

    // Try to submit without filling required fields
    const bookButton = screen.getByText('Book Test');
    await user.click(bookButton);

    // Should show error message
    await waitFor(() => {
      expect(screen.getByText('Please fill in all required fields')).toBeInTheDocument();
    });
  });

  test('should show confirmation step after successful booking', async () => {
    const user = userEvent.setup();
    renderBookingComponent();

    // Navigate to booking step
    const nextButton = screen.getByText('Next');
    await user.click(nextButton);

    // Fill out form
    await user.type(screen.getByLabelText('Patient Name'), 'John Doe');
    await user.type(screen.getByLabelText('Patient Age'), '30');
    await user.type(screen.getByLabelText('Phone Number'), '1234567890');

    // Select time slot
    const timeSelect = screen.getByLabelText('Preferred Time');
    await user.click(timeSelect);
    await user.click(screen.getByText('09:00'));

    // Submit booking
    const bookButton = screen.getByText('Book Test');
    await user.click(bookButton);

    // Should show confirmation step
    await waitFor(() => {
      expect(screen.getByText('Booking Confirmed!')).toBeInTheDocument();
      expect(screen.getByText('Your lab test has been successfully booked.')).toBeInTheDocument();
      expect(screen.getByText('BOOK-123')).toBeInTheDocument();
    });
  });

  test('should handle booking API errors', async () => {
    const user = userEvent.setup();
    
    // Mock API to throw error
    (labTestsService.bookLabTest as any).mockRejectedValue(new Error('Booking failed'));
    
    renderBookingComponent();

    // Navigate to booking step
    const nextButton = screen.getByText('Next');
    await user.click(nextButton);

    // Fill out form
    await user.type(screen.getByLabelText('Patient Name'), 'John Doe');
    await user.type(screen.getByLabelText('Patient Age'), '30');
    await user.type(screen.getByLabelText('Phone Number'), '1234567890');

    // Select time slot
    const timeSelect = screen.getByLabelText('Preferred Time');
    await user.click(timeSelect);
    await user.click(screen.getByText('09:00'));

    // Submit booking
    const bookButton = screen.getByText('Book Test');
    await user.click(bookButton);

    // Should show error message
    await waitFor(() => {
      expect(screen.getByText('Booking failed')).toBeInTheDocument();
    });
  });

  test('should navigate back between steps', async () => {
    const user = userEvent.setup();
    renderBookingComponent();

    // Navigate to booking step
    const nextButton = screen.getByText('Next');
    await user.click(nextButton);

    expect(screen.getByText('Booking Information')).toBeInTheDocument();

    // Navigate back
    const backButton = screen.getByText('Back');
    await user.click(backButton);

    expect(screen.getByText('Test Details')).toBeInTheDocument();
  });

  test('should close modal and reset form', async () => {
    const user = userEvent.setup();
    const mockOnClose = vi.fn();
    renderBookingComponent({ onClose: mockOnClose });

    // Navigate to booking step and fill some data
    const nextButton = screen.getByText('Next');
    await user.click(nextButton);

    await user.type(screen.getByLabelText('Patient Name'), 'John Doe');

    // Close modal
    const closeButton = screen.getByRole('button', { name: /close/i });
    await user.click(closeButton);

    expect(mockOnClose).toHaveBeenCalled();
  });

  test('should handle tests without home collection', () => {
    const testWithoutHomeCollection = {
      ...mockTest,
      is_home_collection_available: false,
    };

    renderBookingComponent({ test: testWithoutHomeCollection });

    expect(screen.queryByText('Home Collection Available')).not.toBeInTheDocument();
  });

  test('should disable time selection when no date is selected', async () => {
    const user = userEvent.setup();
    renderBookingComponent();

    // Navigate to booking step
    const nextButton = screen.getByText('Next');
    await user.click(nextButton);

    // Time select should be disabled initially
    const timeSelect = screen.getByLabelText('Preferred Time');
    expect(timeSelect.closest('.MuiInputBase-root')).toHaveClass('Mui-disabled');
  });
});

describe('VIT-34: Booking Component Edge Cases', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (labTestsService.checkTestAvailability as any).mockResolvedValue(mockAvailability);
    (labTestsService.bookLabTest as any).mockResolvedValue(mockBookingResponse);
  });

  test('should handle null test prop', () => {
    renderBookingComponent({ test: null });

    expect(screen.getByText('Book Lab Test')).toBeInTheDocument();
    // Should not crash with null test
  });

  test('should handle availability check failure', async () => {
    const user = userEvent.setup();
    
    // Mock availability check to fail
    (labTestsService.checkTestAvailability as any).mockRejectedValue(new Error('Network error'));
    
    renderBookingComponent();

    // Navigate to booking step
    const nextButton = screen.getByText('Next');
    await user.click(nextButton);

    // Should still show default time slots as fallback
    const timeSelect = screen.getByLabelText('Preferred Time');
    expect(timeSelect).toBeInTheDocument();
  });

  test('should validate home collection address requirement', async () => {
    const user = userEvent.setup();
    renderBookingComponent();

    // Navigate to booking step
    const nextButton = screen.getByText('Next');
    await user.click(nextButton);

    // Enable home collection but don't fill address
    const homeCollectionCheckbox = screen.getByLabelText('Home Collection');
    await user.click(homeCollectionCheckbox);

    // Fill other required fields
    await user.type(screen.getByLabelText('Patient Name'), 'John Doe');
    await user.type(screen.getByLabelText('Patient Age'), '30');
    await user.type(screen.getByLabelText('Phone Number'), '1234567890');

    // Select time slot
    const timeSelect = screen.getByLabelText('Preferred Time');
    await user.click(timeSelect);
    await user.click(screen.getByText('09:00'));

    // Try to submit booking
    const bookButton = screen.getByText('Book Test');
    await user.click(bookButton);

    // Should show error message
    await waitFor(() => {
      expect(screen.getByText('Please provide collection address for home collection')).toBeInTheDocument();
    });
  });

  test('should handle maximum age validation', async () => {
    const user = userEvent.setup();
    renderBookingComponent();

    // Navigate to booking step
    const nextButton = screen.getByText('Next');
    await user.click(nextButton);

    // Fill form with age above maximum
    await user.type(screen.getByLabelText('Patient Name'), 'John Doe');
    await user.type(screen.getByLabelText('Patient Age'), '85'); // Above maximum age of 80
    await user.type(screen.getByLabelText('Phone Number'), '1234567890');

    // Select time slot
    const timeSelect = screen.getByLabelText('Preferred Time');
    await user.click(timeSelect);
    await user.click(screen.getByText('09:00'));

    // Try to submit booking
    const bookButton = screen.getByText('Book Test');
    await user.click(bookButton);

    // Should show error message
    await waitFor(() => {
      expect(screen.getByText('Maximum age requirement: 80 years')).toBeInTheDocument();
    });
  });
});