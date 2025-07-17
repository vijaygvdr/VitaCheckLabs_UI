import React, { useState, useEffect } from 'react';
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
  ListItemText,
  Alert
} from '@mui/material';
import { 
  LocationOn, 
  AccessTime, 
  DirectionsCar, 
  LocalParking,
  Accessible,
  Wifi,
  Info
} from '@mui/icons-material';
import { ContactInfo } from '../../types/api';
import { companyService } from '../../services/companyService';

interface LocationMapProps {
  contactInfo: ContactInfo | null;
}

const LocationMap: React.FC<LocationMapProps> = ({ contactInfo }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkOperatingStatus = async () => {
      try {
        const currentlyOpen = await companyService.isCurrentlyOpen();
        setIsOpen(currentlyOpen);
      } catch (error) {
        console.error('Error checking operating status:', error);
      } finally {
        setLoading(false);
      }
    };

    checkOperatingStatus();
  }, []);

  const formatOperatingHours = (hours: Record<string, string>) => {
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    
    return days.map((day, index) => ({
      day: dayNames[index],
      hours: hours[day] || 'Closed'
    }));
  };

  const facilities = [
    { icon: <DirectionsCar />, text: 'Easy Access Parking' },
    { icon: <LocalParking />, text: 'Free Parking Available' },
    { icon: <Accessible />, text: 'Wheelchair Accessible' },
    { icon: <Wifi />, text: 'Free Wi-Fi' }
  ];

  if (!contactInfo) {
    return (
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h2" gutterBottom align="center">
          Location & Hours
        </Typography>
        <Alert severity="info">
          Location information is currently unavailable.
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ mb: 4 }}>
      <Typography variant="h4" component="h2" gutterBottom align="center">
        Location & Hours
      </Typography>
      <Typography variant="body1" align="center" sx={{ mb: 4 }} color="text.secondary">
        Visit us at our convenient location
      </Typography>
      
      <Grid container spacing={4}>
        {/* Location Info */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <LocationOn sx={{ mr: 2, color: 'primary.main' }} />
                <Typography variant="h6">
                  Our Location
                </Typography>
              </Box>
              
              <Typography variant="body1" sx={{ mb: 2 }}>
                <strong>{contactInfo.address.street}</strong><br />
                {contactInfo.address.city}, {contactInfo.address.state} {contactInfo.address.zip_code}
              </Typography>
              
              <Box sx={{ mb: 3 }}>
                <Chip 
                  label={loading ? 'Checking...' : (isOpen ? 'Currently Open' : 'Currently Closed')}
                  color={loading ? 'default' : (isOpen ? 'success' : 'error')}
                  variant="outlined"
                  size="small"
                />
              </Box>
              
              {/* Map Placeholder */}
              <Box 
                sx={{ 
                  height: 200, 
                  backgroundColor: 'grey.100',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 1,
                  border: '1px solid',
                  borderColor: 'grey.300'
                }}
              >
                <Box sx={{ textAlign: 'center' }}>
                  <LocationOn sx={{ fontSize: 48, color: 'primary.main', mb: 1 }} />
                  <Typography variant="body2" color="text.secondary">
                    Interactive Map Coming Soon
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        {/* Operating Hours */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <AccessTime sx={{ mr: 2, color: 'primary.main' }} />
                <Typography variant="h6">
                  Operating Hours
                </Typography>
              </Box>
              
              <List dense>
                {formatOperatingHours(contactInfo.operating_hours).map((item, index) => (
                  <ListItem key={index} sx={{ py: 0.5 }}>
                    <ListItemText
                      primary={item.day}
                      secondary={item.hours}
                      primaryTypographyProps={{ fontWeight: 'medium' }}
                    />
                  </ListItem>
                ))}
              </List>
              
              <Box sx={{ mt: 3 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Facilities & Amenities
                </Typography>
                <List dense>
                  {facilities.map((facility, index) => (
                    <ListItem key={index} sx={{ py: 0.5 }}>
                      <ListItemIcon sx={{ minWidth: 32 }}>
                        {React.cloneElement(facility.icon, { 
                          sx: { fontSize: 20, color: 'primary.main' }
                        })}
                      </ListItemIcon>
                      <ListItemText 
                        primary={facility.text}
                        primaryTypographyProps={{ variant: 'body2' }}
                      />
                    </ListItem>
                  ))}
                </List>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      
      {/* Additional Information */}
      <Card sx={{ mt: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Info sx={{ mr: 2, color: 'primary.main' }} />
            <Typography variant="h6">
              Important Information
            </Typography>
          </Box>
          
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Typography variant="body2" paragraph>
                <strong>Emergency Hours:</strong> For urgent test results or medical emergencies, 
                please contact our 24/7 hotline or visit the nearest emergency room.
              </Typography>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Typography variant="body2" paragraph>
                <strong>Appointment Required:</strong> Some specialized tests require advance scheduling. 
                Please call ahead to ensure availability.
              </Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </Box>
  );
};

export default LocationMap;