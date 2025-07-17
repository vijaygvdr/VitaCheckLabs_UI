import React, { useState } from 'react';
import { 
  Card, 
  CardContent, 
  Typography, 
  Box, 
  TextField, 
  Button, 
  MenuItem,
  Alert,
  CircularProgress,
  Grid
} from '@mui/material';
import { Send, Phone, Email, LocationOn } from '@mui/icons-material';
import { companyService } from '../../services/companyService';
import { ContactFormSubmission, InquiryType } from '../../types/api';

const ContactForm: React.FC = () => {
  const [formData, setFormData] = useState<ContactFormSubmission>({
    name: '',
    email: '',
    phone: '',
    inquiry_type: 'general' as InquiryType,
    subject: '',
    message: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const inquiryTypes = [
    { value: 'general', label: 'General Inquiry' },
    { value: 'appointment', label: 'Appointment Booking' },
    { value: 'test_results', label: 'Test Results' },
    { value: 'billing', label: 'Billing Question' },
    { value: 'technical_support', label: 'Technical Support' },
    { value: 'complaint', label: 'Complaint/Feedback' }
  ];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await companyService.submitContactForm(formData);
      
      setSuccess(
        `Thank you for your message! We've received your inquiry and will respond within ${response.data.estimated_response_time || '24 hours'}.`
      );
      
      // Reset form
      setFormData({
        name: '',
        email: '',
        phone: '',
        inquiry_type: 'general' as InquiryType,
        subject: '',
        message: ''
      });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to send message. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = () => {
    return formData.name.trim() && 
           formData.email.trim() && 
           formData.subject.trim() && 
           formData.message.trim();
  };

  return (
    <Box sx={{ mb: 4 }}>
      <Typography variant="h4" component="h2" gutterBottom align="center">
        Get In Touch
      </Typography>
      <Typography variant="body1" align="center" sx={{ mb: 4 }} color="text.secondary">
        Have questions or need assistance? We're here to help!
      </Typography>
      
      <Grid container spacing={4}>
        {/* Contact Information */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Contact Information
              </Typography>
              
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Phone sx={{ mr: 2, color: 'primary.main' }} />
                <Box>
                  <Typography variant="body2" fontWeight="bold">
                    Phone
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    (555) 123-4567
                  </Typography>
                </Box>
              </Box>
              
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Email sx={{ mr: 2, color: 'primary.main' }} />
                <Box>
                  <Typography variant="body2" fontWeight="bold">
                    Email
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    info@vitachecklabs.com
                  </Typography>
                </Box>
              </Box>
              
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <LocationOn sx={{ mr: 2, color: 'primary.main' }} />
                <Box>
                  <Typography variant="body2" fontWeight="bold">
                    Address
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    123 Healthcare Ave<br />
                    Medical City, HC 12345
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        {/* Contact Form */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Send us a Message
              </Typography>
              
              {success && (
                <Alert severity="success" sx={{ mb: 3 }}>
                  {success}
                </Alert>
              )}
              
              {error && (
                <Alert severity="error" sx={{ mb: 3 }}>
                  {error}
                </Alert>
              )}
              
              <form onSubmit={handleSubmit}>
                <Grid container spacing={3}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Full Name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      disabled={loading}
                    />
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      disabled={loading}
                    />
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Phone Number"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      disabled={loading}
                    />
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      select
                      label="Inquiry Type"
                      name="inquiry_type"
                      value={formData.inquiry_type}
                      onChange={handleChange}
                      disabled={loading}
                    >
                      {inquiryTypes.map((option) => (
                        <MenuItem key={option.value} value={option.value}>
                          {option.label}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>
                  
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Subject"
                      name="subject"
                      value={formData.subject}
                      onChange={handleChange}
                      required
                      disabled={loading}
                    />
                  </Grid>
                  
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Message"
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      required
                      multiline
                      rows={4}
                      disabled={loading}
                    />
                  </Grid>
                  
                  <Grid item xs={12}>
                    <Button
                      type="submit"
                      variant="contained"
                      size="large"
                      disabled={loading || !isFormValid()}
                      startIcon={loading ? <CircularProgress size={20} /> : <Send />}
                    >
                      {loading ? 'Sending...' : 'Send Message'}
                    </Button>
                  </Grid>
                </Grid>
              </form>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ContactForm;