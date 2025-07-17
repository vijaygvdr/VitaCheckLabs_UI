import React from 'react';
import { render, screen } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CompanyInfo from '../CompanyInfo';
import { CompanyInfo as CompanyInfoType } from '../../../types/api';

const theme = createTheme();

const mockCompanyData: CompanyInfoType = {
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

const renderWithTheme = (component: React.ReactElement) => {
  return render(
    <ThemeProvider theme={theme}>
      {component}
    </ThemeProvider>
  );
};

describe('CompanyInfo Component', () => {
  test('renders company information correctly', () => {
    renderWithTheme(<CompanyInfo companyData={mockCompanyData} />);
    
    expect(screen.getByText('Our Mission & Values')).toBeInTheDocument();
    expect(screen.getByText(mockCompanyData.mission_statement)).toBeInTheDocument();
    expect(screen.getByText(mockCompanyData.vision_statement)).toBeInTheDocument();
  });

  test('displays company statistics', () => {
    renderWithTheme(<CompanyInfo companyData={mockCompanyData} />);
    
    expect(screen.getByText('15')).toBeInTheDocument();
    expect(screen.getByText('Years of Service')).toBeInTheDocument();
    expect(screen.getByText('1,000,000')).toBeInTheDocument();
    expect(screen.getByText('Tests Conducted')).toBeInTheDocument();
    expect(screen.getByText('98%')).toBeInTheDocument();
    expect(screen.getByText('Customer Satisfaction')).toBeInTheDocument();
  });

  test('displays company values', () => {
    renderWithTheme(<CompanyInfo companyData={mockCompanyData} />);
    
    expect(screen.getByText('Our Core Values')).toBeInTheDocument();
    mockCompanyData.values.forEach(value => {
      expect(screen.getByText(value)).toBeInTheDocument();
    });
  });

  test('displays certifications', () => {
    renderWithTheme(<CompanyInfo companyData={mockCompanyData} />);
    
    expect(screen.getByText('Certifications & Accreditations')).toBeInTheDocument();
    mockCompanyData.certifications.forEach(cert => {
      expect(screen.getByText(cert)).toBeInTheDocument();
    });
  });

  test('displays specializations', () => {
    renderWithTheme(<CompanyInfo companyData={mockCompanyData} />);
    
    expect(screen.getByText('Our Specializations')).toBeInTheDocument();
    mockCompanyData.specializations.forEach(spec => {
      expect(screen.getByText(spec)).toBeInTheDocument();
    });
  });

  test('returns null when no company data provided', () => {
    const { container } = renderWithTheme(<CompanyInfo companyData={null} />);
    expect(container.firstChild).toBeNull();
  });

  test('handles missing optional fields gracefully', () => {
    const minimalCompanyData: CompanyInfoType = {
      ...mockCompanyData,
      values: [],
      certifications: [],
      specializations: []
    };

    renderWithTheme(<CompanyInfo companyData={minimalCompanyData} />);
    
    expect(screen.getByText('Our Mission & Values')).toBeInTheDocument();
    expect(screen.queryByText('Our Core Values')).not.toBeInTheDocument();
    expect(screen.queryByText('Certifications & Accreditations')).not.toBeInTheDocument();
    expect(screen.queryByText('Our Specializations')).not.toBeInTheDocument();
  });

  test('displays default values for missing statistics', () => {
    const companyDataWithoutStats: CompanyInfoType = {
      ...mockCompanyData,
      years_of_service: 0,
      total_tests_conducted: 0,
      customer_satisfaction: 0
    };

    renderWithTheme(<CompanyInfo companyData={companyDataWithoutStats} />);
    
    expect(screen.getByText('0')).toBeInTheDocument();
    expect(screen.getByText('0%')).toBeInTheDocument();
  });
});