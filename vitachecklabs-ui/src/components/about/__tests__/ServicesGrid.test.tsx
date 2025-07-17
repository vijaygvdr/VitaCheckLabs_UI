import React from 'react';
import { render, screen } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import ServicesGrid from '../ServicesGrid';
import { Service } from '../../../types/api';

const theme = createTheme();

const mockServices: Service[] = [
  {
    id: '1',
    name: 'Complete Blood Count',
    description: 'Comprehensive blood analysis including white blood cells, red blood cells, and platelets',
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
    description: 'Comprehensive cholesterol and lipid analysis for cardiovascular health assessment',
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
  },
  {
    id: '3',
    name: 'Basic Metabolic Panel',
    description: 'Essential metabolic markers including glucose, electrolytes, and kidney function',
    category_name: 'General',
    price: 35.00,
    turnaround_time: '2-3 hours',
    is_home_collection_available: false,
    sample_type: 'blood',
    fasting_required: false,
    special_instructions: 'No special preparation required',
    normal_range: 'Glucose: 70-100 mg/dL',
    created_at: '2023-01-01T00:00:00Z',
    updated_at: '2023-01-01T00:00:00Z'
  }
];

const renderWithTheme = (component: React.ReactElement) => {
  return render(
    <ThemeProvider theme={theme}>
      {component}
    </ThemeProvider>
  );
};

describe('ServicesGrid Component', () => {
  test('renders services grid with all services', () => {
    renderWithTheme(<ServicesGrid services={mockServices} />);
    
    expect(screen.getByText('Our Services')).toBeInTheDocument();
    expect(screen.getByText('Comprehensive healthcare diagnostic services tailored to your needs')).toBeInTheDocument();
    
    mockServices.forEach(service => {
      expect(screen.getByText(service.name)).toBeInTheDocument();
      expect(screen.getByText(service.description)).toBeInTheDocument();
      expect(screen.getByText(service.category_name)).toBeInTheDocument();
      expect(screen.getByText(service.turnaround_time)).toBeInTheDocument();
      expect(screen.getByText(`$${service.price}`)).toBeInTheDocument();
    });
  });

  test('displays home collection availability correctly', () => {
    renderWithTheme(<ServicesGrid services={mockServices} />);
    
    // Should show home collection chip for services that support it
    const homeCollectionChips = screen.getAllByText('Home Collection Available');
    expect(homeCollectionChips).toHaveLength(2); // Only 2 services have home collection
  });

  test('displays Learn More buttons for all services', () => {
    renderWithTheme(<ServicesGrid services={mockServices} />);
    
    const learnMoreButtons = screen.getAllByText('Learn More');
    expect(learnMoreButtons).toHaveLength(mockServices.length);
  });

  test('handles empty services array', () => {
    renderWithTheme(<ServicesGrid services={[]} />);
    
    expect(screen.getByText('Our Services')).toBeInTheDocument();
    expect(screen.getByText('No services available at the moment. Please check back later.')).toBeInTheDocument();
  });

  test('handles null services prop', () => {
    renderWithTheme(<ServicesGrid services={null as any} />);
    
    expect(screen.getByText('Our Services')).toBeInTheDocument();
    expect(screen.getByText('No services available at the moment. Please check back later.')).toBeInTheDocument();
  });

  test('displays correct service categories with appropriate icons', () => {
    renderWithTheme(<ServicesGrid services={mockServices} />);
    
    // Check that different categories are displayed
    expect(screen.getByText('Hematology')).toBeInTheDocument();
    expect(screen.getByText('Cardiac')).toBeInTheDocument();
    expect(screen.getByText('General')).toBeInTheDocument();
  });

  test('displays pricing information', () => {
    renderWithTheme(<ServicesGrid services={mockServices} />);
    
    expect(screen.getByText('$45')).toBeInTheDocument();
    expect(screen.getByText('$65')).toBeInTheDocument();
    expect(screen.getByText('$35')).toBeInTheDocument();
  });

  test('displays turnaround time information', () => {
    renderWithTheme(<ServicesGrid services={mockServices} />);
    
    expect(screen.getByText('2-4 hours')).toBeInTheDocument();
    expect(screen.getByText('4-6 hours')).toBeInTheDocument();
    expect(screen.getByText('2-3 hours')).toBeInTheDocument();
  });

  test('handles services without price', () => {
    const servicesWithoutPrice: Service[] = [
      {
        ...mockServices[0],
        price: undefined
      }
    ];

    renderWithTheme(<ServicesGrid services={servicesWithoutPrice} />);
    
    expect(screen.getByText('Complete Blood Count')).toBeInTheDocument();
    expect(screen.queryByText('$45')).not.toBeInTheDocument();
  });

  test('applies hover effects to service cards', () => {
    renderWithTheme(<ServicesGrid services={mockServices} />);
    
    const serviceCards = screen.getAllByText('Learn More').map(button => 
      button.closest('.MuiCard-root')
    );
    
    serviceCards.forEach(card => {
      expect(card).toHaveStyle({
        transition: 'transform 0.2s, box-shadow 0.2s'
      });
    });
  });
});