import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import LocationMap from '../LocationMap';
import { ContactInfo } from '../../../types/api';
import { companyService } from '../../../services/companyService';

const theme = createTheme();

// Mock the companyService
jest.mock('../../../services/companyService', () => ({
  companyService: {
    isCurrentlyOpen: jest.fn()
  }
}));

const mockIsCurrentlyOpen = companyService.isCurrentlyOpen as jest.MockedFunction<typeof companyService.isCurrentlyOpen>;

const mockContactInfo: ContactInfo = {
  phone: '555-123-4567',
  email: 'info@vitachecklabs.com',
  address: {
    street: '123 Healthcare Ave',
    city: 'Medical City',
    state: 'HC',
    zip_code: '12345',
    country: 'USA'
  },
  emergency_contact: {
    phone: '555-911-1234',
    email: 'emergency@vitachecklabs.com'
  },
  operating_hours: {
    monday: '08:00-17:00',
    tuesday: '08:00-17:00',
    wednesday: '08:00-17:00',
    thursday: '08:00-17:00',
    friday: '08:00-17:00',
    saturday: '09:00-13:00',
    sunday: 'Closed'
  },
  social_media: {
    facebook: 'https://facebook.com/vitachecklabs',
    twitter: 'https://twitter.com/vitachecklabs',
    linkedin: 'https://linkedin.com/company/vitachecklabs',
    instagram: 'https://instagram.com/vitachecklabs'
  }
};

const renderWithTheme = (component: React.ReactElement) => {
  return render(
    <ThemeProvider theme={theme}>
      {component}
    </ThemeProvider>
  );
};

describe('LocationMap Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders location information correctly', () => {
    mockIsCurrentlyOpen.mockResolvedValue(true);
    
    renderWithTheme(<LocationMap contactInfo={mockContactInfo} />);
    
    expect(screen.getByText('Location & Hours')).toBeInTheDocument();
    expect(screen.getByText('Visit us at our convenient location')).toBeInTheDocument();
    expect(screen.getByText('Our Location')).toBeInTheDocument();
    expect(screen.getByText('123 Healthcare Ave')).toBeInTheDocument();
    expect(screen.getByText('Medical City, HC 12345')).toBeInTheDocument();
  });

  test('displays operating hours correctly', () => {
    mockIsCurrentlyOpen.mockResolvedValue(true);
    
    renderWithTheme(<LocationMap contactInfo={mockContactInfo} />);
    
    expect(screen.getByText('Operating Hours')).toBeInTheDocument();
    expect(screen.getByText('Monday')).toBeInTheDocument();
    expect(screen.getByText('08:00-17:00')).toBeInTheDocument();
    expect(screen.getByText('Saturday')).toBeInTheDocument();
    expect(screen.getByText('09:00-13:00')).toBeInTheDocument();
    expect(screen.getByText('Sunday')).toBeInTheDocument();
    expect(screen.getByText('Closed')).toBeInTheDocument();
  });

  test('displays currently open status', async () => {
    mockIsCurrentlyOpen.mockResolvedValue(true);
    
    renderWithTheme(<LocationMap contactInfo={mockContactInfo} />);
    
    await waitFor(() => {
      expect(screen.getByText('Currently Open')).toBeInTheDocument();
    });
  });

  test('displays currently closed status', async () => {
    mockIsCurrentlyOpen.mockResolvedValue(false);
    
    renderWithTheme(<LocationMap contactInfo={mockContactInfo} />);
    
    await waitFor(() => {
      expect(screen.getByText('Currently Closed')).toBeInTheDocument();
    });
  });

  test('displays checking status while loading', () => {
    mockIsCurrentlyOpen.mockImplementation(() => new Promise(resolve => setTimeout(() => resolve(true), 100)));
    
    renderWithTheme(<LocationMap contactInfo={mockContactInfo} />);
    
    expect(screen.getByText('Checking...')).toBeInTheDocument();
  });

  test('displays facilities and amenities', () => {
    mockIsCurrentlyOpen.mockResolvedValue(true);
    
    renderWithTheme(<LocationMap contactInfo={mockContactInfo} />);
    
    expect(screen.getByText('Facilities & Amenities')).toBeInTheDocument();
    expect(screen.getByText('Easy Access Parking')).toBeInTheDocument();
    expect(screen.getByText('Free Parking Available')).toBeInTheDocument();
    expect(screen.getByText('Wheelchair Accessible')).toBeInTheDocument();
    expect(screen.getByText('Free Wi-Fi')).toBeInTheDocument();
  });

  test('displays important information section', () => {
    mockIsCurrentlyOpen.mockResolvedValue(true);
    
    renderWithTheme(<LocationMap contactInfo={mockContactInfo} />);
    
    expect(screen.getByText('Important Information')).toBeInTheDocument();
    expect(screen.getByText(/Emergency Hours:/)).toBeInTheDocument();
    expect(screen.getByText(/Appointment Required:/)).toBeInTheDocument();
  });

  test('displays map placeholder', () => {
    mockIsCurrentlyOpen.mockResolvedValue(true);
    
    renderWithTheme(<LocationMap contactInfo={mockContactInfo} />);
    
    expect(screen.getByText('Interactive Map Coming Soon')).toBeInTheDocument();
  });

  test('handles null contact info', () => {
    renderWithTheme(<LocationMap contactInfo={null} />);
    
    expect(screen.getByText('Location & Hours')).toBeInTheDocument();
    expect(screen.getByText('Location information is currently unavailable.')).toBeInTheDocument();
  });

  test('handles error when checking operating status', async () => {
    mockIsCurrentlyOpen.mockRejectedValue(new Error('API Error'));
    
    renderWithTheme(<LocationMap contactInfo={mockContactInfo} />);
    
    await waitFor(() => {
      expect(screen.getByText('Checking...')).toBeInTheDocument();
    });
  });

  test('displays all days of the week in operating hours', () => {
    mockIsCurrentlyOpen.mockResolvedValue(true);
    
    renderWithTheme(<LocationMap contactInfo={mockContactInfo} />);
    
    const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    
    daysOfWeek.forEach(day => {
      expect(screen.getByText(day)).toBeInTheDocument();
    });
  });

  test('formats operating hours correctly', () => {
    mockIsCurrentlyOpen.mockResolvedValue(true);
    
    renderWithTheme(<LocationMap contactInfo={mockContactInfo} />);
    
    // Check that the hours are displayed correctly
    expect(screen.getByText('08:00-17:00')).toBeInTheDocument();
    expect(screen.getByText('09:00-13:00')).toBeInTheDocument();
    expect(screen.getByText('Closed')).toBeInTheDocument();
  });

  test('handles missing operating hours gracefully', () => {
    mockIsCurrentlyOpen.mockResolvedValue(true);
    
    const contactInfoWithoutHours = {
      ...mockContactInfo,
      operating_hours: {
        monday: '',
        tuesday: '',
        wednesday: '',
        thursday: '',
        friday: '',
        saturday: '',
        sunday: ''
      }
    };
    
    renderWithTheme(<LocationMap contactInfo={contactInfoWithoutHours} />);
    
    expect(screen.getByText('Operating Hours')).toBeInTheDocument();
    // Should show 'Closed' for empty hour strings
    expect(screen.getAllByText('Closed')).toHaveLength(7);
  });
});