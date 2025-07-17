import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { BrowserRouter } from 'react-router-dom';
import About from '../About';
import { companyService } from '../../services/companyService';
import { CompanyInfo, ContactInfo, Service } from '../../types/api';

const theme = createTheme();

// Mock the companyService
jest.mock('../../services/companyService', () => ({
  companyService: {
    getCompanyInfo: jest.fn(),
    getContactInfo: jest.fn(),
    getServices: jest.fn()
  }
}));

// Mock the about components
jest.mock('../../components/about/CompanyInfo', () => {
  return function MockCompanyInfo({ companyData }: { companyData: CompanyInfo | null }) {
    return <div data-testid=\"company-info\">Company Info Component {companyData?.name}</div>;
  };
});

jest.mock('../../components/about/ServicesGrid', () => {
  return function MockServicesGrid({ services }: { services: Service[] }) {
    return <div data-testid=\"services-grid\">Services Grid Component ({services.length} services)</div>;
  };
});

jest.mock('../../components/about/ContactForm', () => {
  return function MockContactForm() {
    return <div data-testid=\"contact-form\">Contact Form Component</div>;
  };
});

jest.mock('../../components/about/LocationMap', () => {
  return function MockLocationMap({ contactInfo }: { contactInfo: ContactInfo | null }) {
    return <div data-testid=\"location-map\">Location Map Component {contactInfo?.phone}</div>;
  };
});

jest.mock('../../components/about/TeamSection', () => {
  return function MockTeamSection({ companyData }: { companyData: CompanyInfo | null }) {
    return <div data-testid=\"team-section\">Team Section Component {companyData?.name}</div>;
  };
});

const mockCompanyService = companyService as jest.Mocked<typeof companyService>;

const mockCompanyData: CompanyInfo = {
  id: '1',
  name: 'VitaCheckLabs',
  tagline: 'Your trusted partner in healthcare diagnostics',
  description: 'Leading healthcare diagnostics provider',
  mission_statement: 'To provide accurate, reliable, and timely diagnostic services',
  vision_statement: 'To be the leading healthcare diagnostics provider',
  values: ['Excellence', 'Integrity', 'Innovation', 'Patient Care'],
  years_of_service: 15,
  total_tests_conducted: 1000000,
  customer_satisfaction: 98,
  certifications: ['ISO 9001', 'CAP Accredited', 'CLIA Certified'],
  specializations: ['Clinical Chemistry', 'Hematology', 'Microbiology'],
  home_collection_radius_km: 25,
  established_date: '2009-01-01',
  license_number: 'HL-2023-001',
  operating_hours: {
    monday: '08:00-17:00',
    tuesday: '08:00-17:00',
    wednesday: '08:00-17:00',
    thursday: '08:00-17:00',
    friday: '08:00-17:00',
    saturday: '09:00-13:00',
    sunday: 'Closed'
  },
  created_at: '2023-01-01T00:00:00Z',
  updated_at: '2023-01-01T00:00:00Z'
};

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

const mockServices: Service[] = [
  {
    id: '1',
    name: 'Complete Blood Count',
    description: 'Comprehensive blood analysis',
    category_name: 'Hematology',
    price: 45.00,
    turnaround_time: '2-4 hours',
    is_home_collection_available: true,
    sample_type: 'blood',
    fasting_required: false,
    special_instructions: 'No special preparation required',
    normal_range: '4.5-11.0 x10^3/μL',
    created_at: '2023-01-01T00:00:00Z',
    updated_at: '2023-01-01T00:00:00Z'
  },
  {
    id: '2',
    name: 'Lipid Panel',
    description: 'Comprehensive cholesterol analysis',
    category_name: 'Cardiac',
    price: 65.00,
    turnaround_time: '4-6 hours',
    is_home_collection_available: true,
    sample_type: 'blood',
    fasting_required: true,
    special_instructions: 'Fasting for 12 hours required',
    normal_range: 'Total cholesterol: <200 mg/dL',
    created_at: '2023-01-01T00:00:00Z',
    updated_at: '2023-01-01T00:00:00Z'
  }
];

const renderWithTheme = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      <ThemeProvider theme={theme}>
        {component}
      </ThemeProvider>
    </BrowserRouter>
  );
};

describe('About Page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders loading state initially', () => {
    mockCompanyService.getCompanyInfo.mockImplementation(() => new Promise(() => {}));
    mockCompanyService.getContactInfo.mockImplementation(() => new Promise(() => {}));
    mockCompanyService.getServices.mockImplementation(() => new Promise(() => {}));

    renderWithTheme(<About />);

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  test('renders about page with all components after successful data fetch', async () => {
    mockCompanyService.getCompanyInfo.mockResolvedValue(mockCompanyData);
    mockCompanyService.getContactInfo.mockResolvedValue(mockContactInfo);
    mockCompanyService.getServices.mockResolvedValue(mockServices);

    renderWithTheme(<About />);

    await waitFor(() => {
      expect(screen.getByText('About VitaCheckLabs')).toBeInTheDocument();
      expect(screen.getByText('Your trusted partner in healthcare diagnostics')).toBeInTheDocument();
    });

    // Check that all components are rendered
    expect(screen.getByTestId('company-info')).toBeInTheDocument();
    expect(screen.getByTestId('services-grid')).toBeInTheDocument();
    expect(screen.getByTestId('team-section')).toBeInTheDocument();
    expect(screen.getByTestId('location-map')).toBeInTheDocument();
    expect(screen.getByTestId('contact-form')).toBeInTheDocument();
  });

  test('displays company name from API data', async () => {
    mockCompanyService.getCompanyInfo.mockResolvedValue(mockCompanyData);
    mockCompanyService.getContactInfo.mockResolvedValue(mockContactInfo);
    mockCompanyService.getServices.mockResolvedValue(mockServices);

    renderWithTheme(<About />);

    await waitFor(() => {
      expect(screen.getByText('About VitaCheckLabs')).toBeInTheDocument();
      expect(screen.getByText('Your trusted partner in healthcare diagnostics')).toBeInTheDocument();
    });
  });

  test('displays fallback name when company data is null', async () => {
    mockCompanyService.getCompanyInfo.mockResolvedValue(null as any);
    mockCompanyService.getContactInfo.mockResolvedValue(mockContactInfo);
    mockCompanyService.getServices.mockResolvedValue(mockServices);

    renderWithTheme(<About />);

    await waitFor(() => {
      expect(screen.getByText('About VitaCheckLabs')).toBeInTheDocument();
      expect(screen.getByText('Your trusted partner in healthcare diagnostics')).toBeInTheDocument();
    });
  });

  test('handles API errors gracefully', async () => {
    mockCompanyService.getCompanyInfo.mockRejectedValue(new Error('API Error'));
    mockCompanyService.getContactInfo.mockRejectedValue(new Error('API Error'));
    mockCompanyService.getServices.mockRejectedValue(new Error('API Error'));

    renderWithTheme(<About />);

    await waitFor(() => {
      expect(screen.getByText('Failed to load company information. Please try again later.')).toBeInTheDocument();
    });
  });

  test('passes correct data to child components', async () => {
    mockCompanyService.getCompanyInfo.mockResolvedValue(mockCompanyData);
    mockCompanyService.getContactInfo.mockResolvedValue(mockContactInfo);
    mockCompanyService.getServices.mockResolvedValue(mockServices);

    renderWithTheme(<About />);

    await waitFor(() => {
      expect(screen.getByTestId('company-info')).toHaveTextContent('VitaCheckLabs');
      expect(screen.getByTestId('services-grid')).toHaveTextContent('2 services');
      expect(screen.getByTestId('team-section')).toHaveTextContent('VitaCheckLabs');
      expect(screen.getByTestId('location-map')).toHaveTextContent('555-123-4567');
    });
  });

  test('makes all required API calls', async () => {
    mockCompanyService.getCompanyInfo.mockResolvedValue(mockCompanyData);
    mockCompanyService.getContactInfo.mockResolvedValue(mockContactInfo);
    mockCompanyService.getServices.mockResolvedValue(mockServices);

    renderWithTheme(<About />);

    await waitFor(() => {
      expect(mockCompanyService.getCompanyInfo).toHaveBeenCalledTimes(1);
      expect(mockCompanyService.getContactInfo).toHaveBeenCalledTimes(1);
      expect(mockCompanyService.getServices).toHaveBeenCalledTimes(1);
    });
  });

  test('displays custom tagline when available', async () => {
    const customCompanyData = {
      ...mockCompanyData,
      tagline: 'Custom tagline for testing'
    };

    mockCompanyService.getCompanyInfo.mockResolvedValue(customCompanyData);
    mockCompanyService.getContactInfo.mockResolvedValue(mockContactInfo);
    mockCompanyService.getServices.mockResolvedValue(mockServices);

    renderWithTheme(<About />);

    await waitFor(() => {
      expect(screen.getByText('Custom tagline for testing')).toBeInTheDocument();
    });
  });

  test('handles partial API failures', async () => {
    mockCompanyService.getCompanyInfo.mockResolvedValue(mockCompanyData);
    mockCompanyService.getContactInfo.mockRejectedValue(new Error('Contact API Error'));
    mockCompanyService.getServices.mockResolvedValue(mockServices);

    renderWithTheme(<About />);

    await waitFor(() => {
      expect(screen.getByText('Failed to load company information. Please try again later.')).toBeInTheDocument();
    });
  });

  test('displays error message for different types of errors', async () => {
    const customError = new Error('Custom error message');
    mockCompanyService.getCompanyInfo.mockRejectedValue(customError);
    mockCompanyService.getContactInfo.mockRejectedValue(customError);
    mockCompanyService.getServices.mockRejectedValue(customError);

    renderWithTheme(<About />);

    await waitFor(() => {
      expect(screen.getByText('Failed to load company information. Please try again later.')).toBeInTheDocument();
    });
  });

  test('maintains proper component hierarchy', async () => {
    mockCompanyService.getCompanyInfo.mockResolvedValue(mockCompanyData);
    mockCompanyService.getContactInfo.mockResolvedValue(mockContactInfo);
    mockCompanyService.getServices.mockResolvedValue(mockServices);

    renderWithTheme(<About />);

    await waitFor(() => {
      const container = screen.getByText('About VitaCheckLabs').closest('.MuiContainer-root');
      expect(container).toBeInTheDocument();
      
      // Check that all components are within the container
      expect(container).toContainElement(screen.getByTestId('company-info'));
      expect(container).toContainElement(screen.getByTestId('services-grid'));
      expect(container).toContainElement(screen.getByTestId('team-section'));
      expect(container).toContainElement(screen.getByTestId('location-map'));
      expect(container).toContainElement(screen.getByTestId('contact-form'));
    });
  });
});