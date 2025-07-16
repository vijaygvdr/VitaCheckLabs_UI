import { Container, Typography, Box, Card, CardContent, Grid } from '@mui/material';
import { Info, Phone, Email, LocationOn } from '@mui/icons-material';

const About = () => {
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 4, textAlign: 'center' }}>
        <Info sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
        <Typography variant="h3" component="h1" gutterBottom>
          About VitaCheckLabs
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Your trusted partner in healthcare diagnostics
        </Typography>
      </Box>
      
      <Grid container spacing={4}>
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h5" gutterBottom>
                Our Mission
              </Typography>
              <Typography variant="body1" paragraph>
                VitaCheckLabs is committed to providing accurate, reliable, and timely diagnostic services 
                to help you make informed decisions about your health. With state-of-the-art technology 
                and experienced professionals, we ensure the highest quality results.
              </Typography>
              <Typography variant="body1" paragraph>
                Our comprehensive range of laboratory tests covers everything from routine health screenings 
                to specialized diagnostic procedures, all performed with precision and care.
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Contact Information
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Phone sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="body2">
                  (555) 123-4567
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Email sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="body2">
                  info@vitachecklabs.com
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <LocationOn sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="body2">
                  123 Healthcare Ave, Medical City, HC 12345
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
};

export default About;