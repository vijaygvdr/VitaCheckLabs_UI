import React from 'react';
import { 
  Card, 
  CardContent, 
  Typography, 
  Box, 
  Grid, 
  Chip, 
  Avatar,
  Button
} from '@mui/material';
import { 
  Biotech, 
  MonitorHeart, 
  Healing, 
  LocalHospital,
  AccessTime,
  AttachMoney
} from '@mui/icons-material';
import { Service } from '../../types/api';

interface ServicesGridProps {
  services: Service[];
}

const ServicesGrid: React.FC<ServicesGridProps> = ({ services }) => {
  const getServiceIcon = (categoryName: string) => {
    const category = categoryName.toLowerCase();
    if (category.includes('blood') || category.includes('hematology')) {
      return <Biotech />;
    } else if (category.includes('cardiac') || category.includes('heart')) {
      return <MonitorHeart />;
    } else if (category.includes('general') || category.includes('basic')) {
      return <Healing />;
    } else {
      return <LocalHospital />;
    }
  };

  const getServiceColor = (index: number) => {
    const colors = ['primary', 'secondary', 'success', 'info', 'warning'] as const;
    return colors[index % colors.length];
  };

  if (!services || services.length === 0) {
    return (
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h2" gutterBottom align="center">
          Our Services
        </Typography>
        <Card>
          <CardContent>
            <Typography variant="body1" align="center">
              No services available at the moment. Please check back later.
            </Typography>
          </CardContent>
        </Card>
      </Box>
    );
  }

  return (
    <Box sx={{ mb: 4 }}>
      <Typography variant="h4" component="h2" gutterBottom align="center">
        Our Services
      </Typography>
      <Typography variant="body1" align="center" sx={{ mb: 4 }} color="text.secondary">
        Comprehensive healthcare diagnostic services tailored to your needs
      </Typography>
      
      <Grid container spacing={3}>
        {services.map((service, index) => (
          <Grid item xs={12} sm={6} md={4} key={service.id}>
            <Card 
              sx={{ 
                height: '100%', 
                display: 'flex', 
                flexDirection: 'column',
                transition: 'transform 0.2s, box-shadow 0.2s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: (theme) => theme.shadows[8]
                }
              }}
            >
              <CardContent sx={{ flexGrow: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Avatar
                    sx={{ 
                      bgcolor: `${getServiceColor(index)}.main`, 
                      mr: 2,
                      width: 48,
                      height: 48
                    }}
                  >
                    {getServiceIcon(service.category_name)}
                  </Avatar>
                  <Box>
                    <Typography variant="h6" component="h3" gutterBottom>
                      {service.name}
                    </Typography>
                    <Chip 
                      label={service.category_name} 
                      size="small" 
                      color={getServiceColor(index)}
                      variant="outlined"
                    />
                  </Box>
                </Box>
                
                <Typography variant="body2" color="text.secondary" paragraph>
                  {service.description}
                </Typography>
                
                <Box sx={{ mt: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <AccessTime sx={{ mr: 1, fontSize: 16, color: 'text.secondary' }} />
                    <Typography variant="body2" color="text.secondary">
                      {service.turnaround_time}
                    </Typography>
                  </Box>
                  
                  {service.price && (
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <AttachMoney sx={{ mr: 1, fontSize: 16, color: 'text.secondary' }} />
                      <Typography variant="body2" color="text.secondary">
                        ${service.price}
                      </Typography>
                    </Box>
                  )}
                  
                  {service.is_home_collection_available && (
                    <Chip 
                      label="Home Collection Available" 
                      size="small" 
                      color="success"
                      variant="outlined"
                      sx={{ mt: 1 }}
                    />
                  )}
                </Box>
              </CardContent>
              
              <Box sx={{ p: 2, pt: 0 }}>
                <Button 
                  variant="outlined" 
                  color={getServiceColor(index)}
                  fullWidth
                  size="small"
                >
                  Learn More
                </Button>
              </Box>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default ServicesGrid;