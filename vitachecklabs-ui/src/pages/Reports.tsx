import { Container, Typography, Box, Card, CardContent, Grid, Chip } from '@mui/material';
import { Assignment } from '@mui/icons-material';

const Reports = () => {
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 4, textAlign: 'center' }}>
        <Assignment sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
        <Typography variant="h3" component="h1" gutterBottom>
          Reports
        </Typography>
        <Typography variant="body1" color="text.secondary">
          View and manage your lab test reports
        </Typography>
      </Box>
      
      <Grid container spacing={3}>
        {/* Placeholder for report cards */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Blood Test Report
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Complete Blood Count - January 15, 2024
              </Typography>
              <Box sx={{ mt: 2 }}>
                <Chip label="Completed" color="success" size="small" />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Lipid Panel Report
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Cholesterol Test - January 10, 2024
              </Typography>
              <Box sx={{ mt: 2 }}>
                <Chip label="Reviewed" color="primary" size="small" />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Diabetes Panel Report
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                HbA1c Test - January 5, 2024
              </Typography>
              <Box sx={{ mt: 2 }}>
                <Chip label="Pending" color="warning" size="small" />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Reports;