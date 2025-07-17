import { useState, useEffect } from 'react';
import { Container, Typography, Box, Alert, CircularProgress } from '@mui/material';
import { Info } from '@mui/icons-material';
import CompanyInfo from '../components/about/CompanyInfo';
import ServicesGrid from '../components/about/ServicesGrid';
import ContactForm from '../components/about/ContactForm';
import LocationMap from '../components/about/LocationMap';
import TeamSection from '../components/about/TeamSection';
import { companyService } from '../services/companyService';
import { CompanyInfo as CompanyInfoType, ContactInfo, Service } from '../types/api';

const About = () => {
  const [companyData, setCompanyData] = useState<CompanyInfoType | null>(null);
  const [contactInfo, setContactInfo] = useState<ContactInfo | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCompanyData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const [companyInfo, contactData, servicesData] = await Promise.all([
          companyService.getCompanyInfo(),
          companyService.getContactInfo(),
          companyService.getServices()
        ]);
        
        setCompanyData(companyInfo);
        setContactInfo(contactData);
        setServices(servicesData);
      } catch (err) {
        console.error('Error fetching company data:', err);
        setError('Failed to load company information. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchCompanyData();
  }, []);

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress size={60} />
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error" sx={{ mb: 4 }}>
          {error}
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 4, textAlign: 'center' }}>
        <Info sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
        <Typography variant="h3" component="h1" gutterBottom>
          About {companyData?.name || 'VitaCheckLabs'}
        </Typography>
        <Typography variant="body1" color="text.secondary">
          {companyData?.tagline || 'Your trusted partner in healthcare diagnostics'}
        </Typography>
      </Box>
      
      <CompanyInfo companyData={companyData} />
      
      <ServicesGrid services={services} />
      
      <TeamSection companyData={companyData} />
      
      <LocationMap contactInfo={contactInfo} />
      
      <ContactForm />
    </Container>
  );
};

export default About;