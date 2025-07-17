import React from 'react';
import { 
  Card, 
  CardContent, 
  Typography, 
  Box, 
  Grid, 
  Chip, 
  List, 
  ListItem, 
  ListItemIcon, 
  ListItemText 
} from '@mui/material';
import { 
  Business, 
  StarRate, 
  CheckCircle, 
  Timeline, 
  Science, 
  HealthAndSafety 
} from '@mui/icons-material';
import { CompanyInfo as CompanyInfoType } from '../../types/api';

interface CompanyInfoProps {
  companyData: CompanyInfoType | null;
}

const CompanyInfo: React.FC<CompanyInfoProps> = ({ companyData }) => {
  if (!companyData) return null;

  const stats = [
    { 
      icon: <Timeline />, 
      label: 'Years of Service', 
      value: companyData.years_of_service || 0 
    },
    { 
      icon: <Science />, 
      label: 'Tests Conducted', 
      value: companyData.total_tests_conducted?.toLocaleString() || '0' 
    },
    { 
      icon: <StarRate />, 
      label: 'Customer Satisfaction', 
      value: `${companyData.customer_satisfaction || 0}%` 
    },
    { 
      icon: <CheckCircle />, 
      label: 'Certifications', 
      value: companyData.certifications?.length || 0 
    }
  ];

  return (
    <Box sx={{ mb: 4 }}>
      <Grid container spacing={4}>
        {/* Company Profile */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <Business sx={{ mr: 2, color: 'primary.main' }} />
                <Typography variant="h5" component="h2">
                  Our Mission & Values
                </Typography>
              </Box>
              
              <Typography variant="body1" paragraph>
                {companyData.mission_statement || 
                  'We are committed to providing accurate, reliable, and timely diagnostic services to help you make informed decisions about your health.'}
              </Typography>
              
              <Typography variant="body1" paragraph>
                {companyData.vision_statement || 
                  'Our vision is to be the leading healthcare diagnostics provider, setting the standard for excellence in laboratory services.'}
              </Typography>

              {companyData.values && companyData.values.length > 0 && (
                <Box sx={{ mt: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    Our Core Values
                  </Typography>
                  <List>
                    {companyData.values.map((value, index) => (
                      <ListItem key={index} sx={{ py: 0.5 }}>
                        <ListItemIcon>
                          <HealthAndSafety color="primary" />
                        </ListItemIcon>
                        <ListItemText primary={value} />
                      </ListItem>
                    ))}
                  </List>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
        
        {/* Company Stats */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Company Statistics
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {stats.map((stat, index) => (
                  <Box key={index} sx={{ display: 'flex', alignItems: 'center' }}>
                    <Box sx={{ mr: 2, color: 'primary.main' }}>
                      {stat.icon}
                    </Box>
                    <Box>
                      <Typography variant="h6" color="primary.main">
                        {stat.value}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {stat.label}
                      </Typography>
                    </Box>
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Certifications & Specializations */}
      <Grid container spacing={4} sx={{ mt: 2 }}>
        {companyData.certifications && companyData.certifications.length > 0 && (
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Certifications & Accreditations
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {companyData.certifications.map((cert, index) => (
                    <Chip
                      key={index}
                      label={cert}
                      color="primary"
                      variant="outlined"
                      size="small"
                    />
                  ))}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        )}

        {companyData.specializations && companyData.specializations.length > 0 && (
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Our Specializations
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {companyData.specializations.map((spec, index) => (
                    <Chip
                      key={index}
                      label={spec}
                      color="secondary"
                      variant="outlined"
                      size="small"
                    />
                  ))}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>
    </Box>
  );
};

export default CompanyInfo;