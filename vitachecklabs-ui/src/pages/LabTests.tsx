import { Container, Typography, Box, Card, CardContent, Grid } from '@mui/material';
import { Science } from '@mui/icons-material';

const LabTests = () => {
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 4, textAlign: 'center' }}>
        <Science sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
        <Typography variant="h3" component="h1" gutterBottom>
          Lab Tests
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Browse and book our comprehensive range of laboratory tests
        </Typography>
      </Box>
      
      <Grid container spacing={3}>
        {/* Placeholder for test cards */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Complete Blood Count
              </Typography>
              <Typography variant="body2" color="text.secondary">
                A comprehensive blood test to check overall health
              </Typography>
              <Typography variant="h6" color="primary.main" sx={{ mt: 2 }}>
                $49.99
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Lipid Panel
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Measures cholesterol and triglyceride levels
              </Typography>
              <Typography variant="h6" color="primary.main" sx={{ mt: 2 }}>
                $39.99
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Diabetes Panel
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Comprehensive diabetes screening tests
              </Typography>
              <Typography variant="h6" color="primary.main" sx={{ mt: 2 }}>
                $59.99
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
};

export default LabTests;