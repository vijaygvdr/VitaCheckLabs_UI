import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  IconButton
} from '@mui/material';
import {
  Close
} from '@mui/icons-material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LabTest, LabTestBooking } from '../types/api';
import { labTestsService } from '../services/labTestsService';

interface LabTestBookingProps {
  open: boolean;
  onClose: () => void;
  test: LabTest | null;
}

const LabTestBookingComponent: React.FC<LabTestBookingProps> = ({ 
  open, 
  onClose, 
  test 
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  // Form state based on mockup
  const [patientName, setPatientName] = useState('');
  const [patientAge, setPatientAge] = useState<number | ''>('');
  const [patientGender, setPatientGender] = useState('');
  const [homeCollectionDate, setHomeCollectionDate] = useState<Date | null>(new Date());
  const [address, setAddress] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [specialInstructions, setSpecialInstructions] = useState('');

  const validateForm = () => {
    if (!patientName.trim()) {
      setError('Patient name is required');
      return false;
    }
    if (!patientAge || patientAge <= 0 || patientAge > 120) {
      setError('Valid patient age (1-120) is required');
      return false;
    }
    if (!patientGender) {
      setError('Patient gender is required');
      return false;
    }
    if (!homeCollectionDate) {
      setError('Appointment date is required');
      return false;
    }
    if (!address.trim()) {
      setError('Address is required for home collection');
      return false;
    }
    if (!phoneNumber.trim()) {
      setError('Phone number is required');
      return false;
    }
    
    // Validate phone number format (basic validation)
    const phoneRegex = /^[0-9]{10}$/;
    if (!phoneRegex.test(phoneNumber.replace(/\s+/g, ''))) {
      setError('Please enter a valid 10-digit phone number');
      return false;
    }
    
    setError(null);
    return true;
  };

  const handleReset = () => {
    setPatientName('');
    setPatientAge('');
    setPatientGender('');
    setHomeCollectionDate(new Date());
    setAddress('');
    setPhoneNumber('');
    setSpecialInstructions('');
    setError(null);
    setSuccess(false);
  };

  const handleBooking = async () => {
    if (!test || !validateForm()) return;

    try {
      setLoading(true);
      setError(null);

      // Create appointment datetime by combining date and default time
      const appointmentDateTime = new Date(homeCollectionDate!);
      appointmentDateTime.setHours(9, 0, 0, 0); // Set to 9:00 AM

      const bookingData: LabTestBooking = {
        test_id: Number(test.id),
        patient_name: patientName,
        patient_age: Number(patientAge),
        patient_gender: patientGender,
        appointment_date: appointmentDateTime.toISOString(),
        home_collection: true, // Always home collection based on mockup
        address: address,
        phone_number: phoneNumber,
        special_instructions: specialInstructions || undefined
      };

      console.log('Booking test:', test.id, 'with data:', bookingData);

      const response = await labTestsService.bookLabTest(test.id, bookingData);
      
      console.log('Booking response:', response);

      // If we get here without throwing an error, the booking was successful (201 status)
      // The response contains the booking data directly from the backend
      console.log('Booking successful! Response:', response);
      setSuccess(true);
      // Show success message for 2 seconds then close
      setTimeout(() => {
        handleClose();
      }, 2000);
    } catch (err: any) {
      console.error('Booking error:', err);
      setError(err.message || 'Failed to book test. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  if (success) {
    return (
      <Dialog 
        open={open} 
        onClose={handleClose} 
        maxWidth="sm" 
        fullWidth
      >
        <DialogContent sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant="h5" color="success.main" gutterBottom>
            ✅ Booking Confirmed!
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Your lab test appointment has been successfully booked.
          </Typography>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog 
      open={open} 
      onClose={handleClose} 
      maxWidth="md" 
      fullWidth
      PaperProps={{
        sx: { 
          borderRadius: '12px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
          minHeight: '75vh'
        }
      }}
    >
      {/* Header */}
      <Box sx={{ 
        backgroundColor: '#f8f9fa', 
        borderBottom: '1px solid #e5e7eb',
        p: 3,
        display: 'flex',
        alignItems: 'center',
        position: 'relative'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Box
            component="span"
            sx={{
              width: 24,
              height: 24,
              backgroundColor: '#3b82f6',
              borderRadius: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mr: 2,
              color: 'white',
              fontSize: '16px',
              fontWeight: 'bold'
            }}
          >
            +
          </Box>
          <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#1f2937' }}>
            VitaCheckLabs
          </Typography>
        </Box>
        
        <IconButton
          onClick={handleClose}
          sx={{
            position: 'absolute',
            right: 16,
            top: '50%',
            transform: 'translateY(-50%)',
            color: '#6b7280'
          }}
        >
          <Close />
        </IconButton>
      </Box>

      <DialogContent sx={{ p: 4, pb: 2 }}>
        <Typography variant="h4" sx={{ 
          fontWeight: 'bold',
          color: '#1f2937',
          mb: 2,
          textAlign: 'center'
        }}>
          Book Lab Test
        </Typography>
        
        {test && (
          <Box sx={{ 
            backgroundColor: '#f0f9ff',
            borderRadius: '8px',
            p: 3,
            mb: 4,
            textAlign: 'center'
          }}>
            <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#1f2937', mb: 1 }}>
              {test.name}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              {test.description}
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#3b82f6' }}>
              ₹{test.price}
            </Typography>
          </Box>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        <Box sx={{ width: '100%', maxWidth: '650px', mx: 'auto' }}>
          <Grid container spacing={2.5}>
            {/* Row 1: Patient Name and Age */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Patient Name"
                value={patientName}
                onChange={(e) => setPatientName(e.target.value)}
                required
                placeholder="Enter patient's full name"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: '#f8f9fa',
                    borderRadius: '8px',
                    height: '56px',
                    '&:hover': {
                      backgroundColor: '#f1f3f4'
                    },
                    '&.Mui-focused': {
                      backgroundColor: '#ffffff'
                    }
                  },
                  '& .MuiInputLabel-root': {
                    fontWeight: '500'
                  }
                }}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Patient Age"
                type="number"
                value={patientAge}
                onChange={(e) => setPatientAge(e.target.value ? Number(e.target.value) : '')}
                required
                placeholder="Age in years"
                inputProps={{ min: 1, max: 120 }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: '#f8f9fa',
                    borderRadius: '8px',
                    height: '56px',
                    '&:hover': {
                      backgroundColor: '#f1f3f4'
                    },
                    '&.Mui-focused': {
                      backgroundColor: '#ffffff'
                    }
                  },
                  '& .MuiInputLabel-root': {
                    fontWeight: '500'
                  }
                }}
              />
            </Grid>

            {/* Row 2: Gender and Phone Number */}
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel sx={{ fontWeight: '500' }}>Patient Gender</InputLabel>
                <Select
                  value={patientGender}
                  onChange={(e) => setPatientGender(e.target.value)}
                  label="Patient Gender"
                  sx={{
                    backgroundColor: '#f8f9fa',
                    borderRadius: '8px',
                    height: '56px',
                    '& .MuiSelect-select': {
                      display: 'flex',
                      alignItems: 'center',
                      py: 0
                    },
                    '&:hover': {
                      backgroundColor: '#f1f3f4'
                    },
                    '&.Mui-focused': {
                      backgroundColor: '#ffffff'
                    },
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#d1d5db'
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#9ca3af'
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#3b82f6',
                      borderWidth: '2px'
                    }
                  }}
                  MenuProps={{
                    PaperProps: {
                      sx: {
                        borderRadius: '8px',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                        mt: 1
                      }
                    }
                  }}
                >
                  <MenuItem value="male" sx={{ py: 1.5 }}>Male</MenuItem>
                  <MenuItem value="female" sx={{ py: 1.5 }}>Female</MenuItem>
                  <MenuItem value="other" sx={{ py: 1.5 }}>Other</MenuItem>
                  <MenuItem value="prefer_not_to_say" sx={{ py: 1.5 }}>Prefer not to say</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Phone Number"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                required
                placeholder="Enter 10-digit mobile number"
                type="tel"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: '#f8f9fa',
                    borderRadius: '8px',
                    height: '56px',
                    '&:hover': {
                      backgroundColor: '#f1f3f4'
                    },
                    '&.Mui-focused': {
                      backgroundColor: '#ffffff'
                    }
                  },
                  '& .MuiInputLabel-root': {
                    fontWeight: '500'
                  }
                }}
              />
            </Grid>

            {/* Row 3: Home Collection Date and Address (first part) */}
            <Grid item xs={12} sm={6}>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DatePicker
                  label="Home Collection Date"
                  value={homeCollectionDate}
                  onChange={setHomeCollectionDate}
                  minDate={new Date()}
                  maxDate={new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      required: true,
                      placeholder: "Select appointment date",
                      sx: {
                        '& .MuiOutlinedInput-root': {
                          backgroundColor: '#f8f9fa',
                          borderRadius: '8px',
                          height: '56px',
                          '&:hover': {
                            backgroundColor: '#f1f3f4'
                          },
                          '&.Mui-focused': {
                            backgroundColor: '#ffffff'
                          }
                        },
                        '& .MuiInputLabel-root': {
                          fontWeight: '500'
                        }
                      }
                    }
                  }}
                />
              </LocalizationProvider>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Street Address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                required
                placeholder="Enter street address and house number"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: '#f8f9fa',
                    borderRadius: '8px',
                    height: '56px',
                    '&:hover': {
                      backgroundColor: '#f1f3f4'
                    },
                    '&.Mui-focused': {
                      backgroundColor: '#ffffff'
                    }
                  },
                  '& .MuiInputLabel-root': {
                    fontWeight: '500'
                  }
                }}
              />
            </Grid>

            {/* Row 4: Special Instructions (two columns to fill the space) */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Special Instructions (Optional)"
                value={specialInstructions}
                onChange={(e) => setSpecialInstructions(e.target.value)}
                multiline
                rows={3}
                placeholder="Any special requirements, medical conditions, or specific instructions for the collection..."
                sx={{
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: '#f8f9fa',
                    borderRadius: '8px',
                    '&:hover': {
                      backgroundColor: '#f1f3f4'
                    },
                    '&.Mui-focused': {
                      backgroundColor: '#ffffff'
                    }
                  },
                  '& .MuiInputLabel-root': {
                    fontWeight: '500'
                  }
                }}
              />
            </Grid>
          </Grid>
        </Box>
      </DialogContent>
      
      <DialogActions sx={{ p: 4, pt: 3, justifyContent: 'center' }}>
        <Button
          variant="outlined"
          onClick={handleClose}
          sx={{
            borderColor: '#d1d5db',
            color: '#6b7280',
            borderRadius: '8px',
            textTransform: 'none',
            fontWeight: '600',
            fontSize: '16px',
            px: 4,
            py: 1.5,
            mr: 2,
            '&:hover': {
              borderColor: '#9ca3af',
              backgroundColor: '#f9fafb',
            }
          }}
        >
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleBooking}
          disabled={loading}
          sx={{
            backgroundColor: '#3b82f6',
            borderRadius: '8px',
            textTransform: 'none',
            fontWeight: '600',
            fontSize: '16px',
            px: 6,
            py: 1.5,
            '&:hover': {
              backgroundColor: '#2563eb',
            },
            '&:disabled': {
              backgroundColor: '#9ca3af',
            }
          }}
        >
          {loading ? (
            <>
              <CircularProgress size={20} sx={{ mr: 1, color: 'white' }} />
              Booking...
            </>
          ) : (
            'Book Appointment'
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default LabTestBookingComponent;