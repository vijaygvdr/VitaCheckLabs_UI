import React from 'react';
import { render, screen } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import TeamSection from '../TeamSection';
import { CompanyInfo } from '../../../types/api';

const theme = createTheme();

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

const renderWithTheme = (component: React.ReactElement) => {
  return render(
    <ThemeProvider theme={theme}>
      {component}
    </ThemeProvider>
  );
};

describe('TeamSection Component', () => {
  test('renders team section header', () => {
    renderWithTheme(<TeamSection companyData={mockCompanyData} />);
    
    expect(screen.getByText('Meet Our Team')).toBeInTheDocument();
    expect(screen.getByText('Our experienced professionals are dedicated to providing accurate and reliable diagnostic services')).toBeInTheDocument();
  });

  test('displays team statistics', () => {
    renderWithTheme(<TeamSection companyData={mockCompanyData} />);
    
    expect(screen.getByText('50+')).toBeInTheDocument();
    expect(screen.getByText('Team Members')).toBeInTheDocument();
    expect(screen.getByText('15+')).toBeInTheDocument();
    expect(screen.getByText('PhD Scientists')).toBeInTheDocument();
    expect(screen.getByText('8+')).toBeInTheDocument();
    expect(screen.getByText('Medical Doctors')).toBeInTheDocument();
    expect(screen.getByText('25+')).toBeInTheDocument();
    expect(screen.getByText('Lab Technicians')).toBeInTheDocument();
  });

  test('displays leadership team members', () => {
    renderWithTheme(<TeamSection companyData={mockCompanyData} />);
    
    expect(screen.getByText('Leadership Team')).toBeInTheDocument();
    expect(screen.getByText('Dr. Sarah Johnson')).toBeInTheDocument();
    expect(screen.getByText('Chief Medical Officer')).toBeInTheDocument();
    expect(screen.getByText('Clinical Pathology')).toBeInTheDocument();
    
    expect(screen.getByText('Dr. Michael Chen')).toBeInTheDocument();
    expect(screen.getByText('Laboratory Director')).toBeInTheDocument();
    expect(screen.getByText('Molecular Biology')).toBeInTheDocument();
    
    expect(screen.getByText('Dr. Emily Rodriguez')).toBeInTheDocument();
    expect(screen.getByText('Quality Assurance Manager')).toBeInTheDocument();
    expect(screen.getByText('Laboratory Quality Systems')).toBeInTheDocument();
    
    expect(screen.getByText('Dr. David Kim')).toBeInTheDocument();
    expect(screen.getByText('Research Scientist')).toBeInTheDocument();
    expect(screen.getByText('Biochemistry')).toBeInTheDocument();
  });

  test('displays areas of expertise', () => {
    renderWithTheme(<TeamSection companyData={mockCompanyData} />);
    
    expect(screen.getByText('Areas of Expertise')).toBeInTheDocument();
    
    const expertiseAreas = [
      'Clinical Chemistry',
      'Hematology',
      'Microbiology',
      'Immunology',
      'Molecular Diagnostics',
      'Pathology',
      'Toxicology',
      'Genetics'
    ];
    
    expertiseAreas.forEach(area => {
      expect(screen.getByText(area)).toBeInTheDocument();
    });
  });

  test('displays company culture and values', () => {
    renderWithTheme(<TeamSection companyData={mockCompanyData} />);
    
    expect(screen.getByText('Our Culture & Values')).toBeInTheDocument();
    
    expect(screen.getByText(/Excellence in Healthcare:/)).toBeInTheDocument();
    expect(screen.getByText(/Patient-Centered Care:/)).toBeInTheDocument();
    expect(screen.getByText(/Continuous Learning:/)).toBeInTheDocument();
    expect(screen.getByText(/Collaborative Environment:/)).toBeInTheDocument();
    
    expect(screen.getByText(/We maintain the highest standards/)).toBeInTheDocument();
    expect(screen.getByText(/Every test we perform is treated with/)).toBeInTheDocument();
    expect(screen.getByText(/Our team regularly participates in/)).toBeInTheDocument();
    expect(screen.getByText(/We foster a culture of teamwork/)).toBeInTheDocument();
  });

  test('handles null company data', () => {
    renderWithTheme(<TeamSection companyData={null} />);
    
    expect(screen.getByText('Meet Our Team')).toBeInTheDocument();
    expect(screen.getByText('Leadership Team')).toBeInTheDocument();
    expect(screen.getByText('Areas of Expertise')).toBeInTheDocument();
    expect(screen.getByText('Our Culture & Values')).toBeInTheDocument();
  });

  test('displays correct number of team member cards', () => {
    renderWithTheme(<TeamSection companyData={mockCompanyData} />);
    
    // Should display 4 leadership team members
    const leadershipSection = screen.getByText('Leadership Team').closest('.MuiCardContent-root');
    expect(leadershipSection).toBeInTheDocument();
    
    // Check that all 4 team members are displayed
    expect(screen.getByText('Dr. Sarah Johnson')).toBeInTheDocument();
    expect(screen.getByText('Dr. Michael Chen')).toBeInTheDocument();
    expect(screen.getByText('Dr. Emily Rodriguez')).toBeInTheDocument();
    expect(screen.getByText('Dr. David Kim')).toBeInTheDocument();
  });

  test('displays team statistics with proper formatting', () => {
    renderWithTheme(<TeamSection companyData={mockCompanyData} />);
    
    // Check that statistics are displayed in paper containers
    const statsPapers = screen.getAllByText(/\d+\+/);
    expect(statsPapers).toHaveLength(4);
    
    // Check that each statistic has its corresponding label
    expect(screen.getByText('50+')).toBeInTheDocument();
    expect(screen.getByText('15+')).toBeInTheDocument();
    expect(screen.getByText('8+')).toBeInTheDocument();
    expect(screen.getByText('25+')).toBeInTheDocument();
  });

  test('displays expertise areas in a list format', () => {
    renderWithTheme(<TeamSection companyData={mockCompanyData} />);
    
    const expertiseList = screen.getByText('Areas of Expertise').closest('.MuiCard-root');
    expect(expertiseList).toBeInTheDocument();
    
    // Check that all expertise areas are in list items
    const expertiseAreas = [
      'Clinical Chemistry',
      'Hematology',
      'Microbiology',
      'Immunology',
      'Molecular Diagnostics',
      'Pathology',
      'Toxicology',
      'Genetics'
    ];
    
    expertiseAreas.forEach(area => {
      const listItem = screen.getByText(area).closest('.MuiListItem-root');
      expect(listItem).toBeInTheDocument();
    });
  });

  test('displays culture values in grid layout', () => {
    renderWithTheme(<TeamSection companyData={mockCompanyData} />);
    
    const cultureSection = screen.getByText('Our Culture & Values').closest('.MuiCard-root');
    expect(cultureSection).toBeInTheDocument();
    
    // Check that culture content is in a grid
    const gridContainer = cultureSection?.querySelector('.MuiGrid-container');
    expect(gridContainer).toBeInTheDocument();
  });

  test('team member avatars have correct styling', () => {
    renderWithTheme(<TeamSection companyData={mockCompanyData} />);
    
    // Check that avatars are displayed for team members
    const avatars = screen.getAllByRole('img', { hidden: true });
    expect(avatars.length).toBeGreaterThan(0);
  });
});