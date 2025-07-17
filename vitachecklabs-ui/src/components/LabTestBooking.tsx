import React, { useState, useEffect } from 'react';
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
  FormControlLabel,
  Checkbox,
  Card,
  CardContent,
  Stepper,
  Step,
  StepLabel,
  Alert,
  CircularProgress,
  Chip,
  Divider,
  IconButton
} from '@mui/material';
import {
  Close,
  CalendarToday,
  Home,
  LocationOn,
  Person,
  Payment,
  CheckCircle,
  Info,
  Schedule
} from '@mui/icons-material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import { LabTest, LabTestBooking } from '../types/api';
import { labTestsService } from '../services/labTestsService';

interface LabTestBookingProps {
  open: boolean;
  onClose: () => void;
  test: LabTest | null;
}

const steps = [
  'Test Details',
  'Booking Information',
  'Confirmation'
];

const timeSlots = [
  '08:00', '08:30', '09:00', '09:30', '10:00', '10:30',
  '11:00', '11:30', '12:00', '12:30', '13:00', '13:30',
  '14:00', '14:30', '15:00', '15:30', '16:00', '16:30',
  '17:00', '17:30', '18:00'
];

const LabTestBookingComponent: React.FC<LabTestBookingProps> = ({ 
  open, 
  onClose, 
  test 
}) => {
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [bookingId, setBookingId] = useState<string | null>(null);
  
  // Form state
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [isHomeCollection, setIsHomeCollection] = useState(false);
  const [collectionAddress, setCollectionAddress] = useState('');
  const [patientAge, setPatientAge] = useState<number | ''>('');
  const [patientName, setPatientName] = useState('');
  const [patientPhone, setPatientPhone] = useState('');
  const [patientEmail, setPatientEmail] = useState('');
  const [notes, setNotes] = useState('');
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [checkingAvailability, setCheckingAvailability] = useState(false);

  useEffect(() => {
    if (selectedDate) {
      checkAvailability();
    }
  }, [selectedDate, test?.id]);

  const checkAvailability = async () => {
    if (!test?.id || !selectedDate) return;
    
    try {
      setCheckingAvailability(true);
      const dateStr = selectedDate.toISOString().split('T')[0];
      const availability = await labTestsService.checkTestAvailability(test.id, dateStr);
      setAvailableSlots(availability.available_slots || timeSlots);
    } catch (err) {
      console.error('Error checking availability:', err);
      setAvailableSlots(timeSlots); // Fallback to all slots
    } finally {
      setCheckingAvailability(false);
    }
  };

  const handleNext = () => {
    if (activeStep === 1 && !validateBookingForm()) {
      return;
    }
    setActiveStep((prevStep) => prevStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  const handleReset = () => {
    setActiveStep(0);
    setSelectedDate(null);
    setSelectedTime('');
    setIsHomeCollection(false);
    setCollectionAddress('');
    setPatientAge('');
    setPatientName('');
    setPatientPhone('');
    setPatientEmail('');
    setNotes('');
    setError(null);
    setSuccess(false);
    setBookingId(null);
  };

  const validateBookingForm = () => {
    if (!selectedDate || !selectedTime || !patientAge || !patientName || !patientPhone) {
      setError('Please fill in all required fields');
      return false;
    }
    
    if (isHomeCollection && !collectionAddress) {
      setError('Please provide collection address for home collection');
      return false;
    }
    
    const age = Number(patientAge);
    if (test?.minimum_age && age < test.minimum_age) {
      setError(`Minimum age requirement: ${test.minimum_age} years`);
      return false;
    }
    
    if (test?.maximum_age && age > test.maximum_age) {
      setError(`Maximum age requirement: ${test.maximum_age} years`);
      return false;
    }
    
    setError(null);
    return true;
  };

  const handleBooking = async () => {
    if (!test || !validateBookingForm()) return;

    try {
      setLoading(true);
      setError(null);

      const bookingData: LabTestBooking = {
        preferred_date: selectedDate!.toISOString().split('T')[0],
        preferred_time: selectedTime,
        is_home_collection: isHomeCollection,
        collection_address: isHomeCollection ? collectionAddress : undefined,
        patient_age: Number(patientAge),
        notes: notes || undefined
      };

      const response = await labTestsService.bookLabTest(test.id, bookingData);
      
      if (response.success) {
        setSuccess(true);
        setBookingId(response.data.booking_id);
        setActiveStep(2);
      } else {
        setError(response.message || 'Failed to book test');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to book test. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  const formatPrice = (price: number) => `$${price.toFixed(2)}`;

  const getStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Test Details
            </Typography>
            {test && (
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    {test.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    {test.description}
                  </Typography>
                  
                  <Grid container spacing={2} sx={{ mb: 2 }}>
                    <Grid item xs={6}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Category
                      </Typography>
                      <Typography variant="body1">
                        {test.category.replace(/_/g, ' ')}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Sample Type
                      </Typography>
                      <Typography variant="body1">
                        {test.sample_type}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Price
                      </Typography>
                      <Typography variant="h6" color="primary.main">
                        {formatPrice(test.price)}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Report Delivery
                      </Typography>
                      <Typography variant="body1">
                        {test.report_delivery_hours ? `${test.report_delivery_hours} hours` : 'Standard'}
                      </Typography>
                    </Grid>
                  </Grid>

                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    {test.is_home_collection_available && (
                      <Chip 
                        label="Home Collection Available" 
                        icon={<Home />}
                        color="success"
                        size="small"
                      />
                    )}
                    {test.minimum_age && (
                      <Chip 
                        label={`Min Age: ${test.minimum_age}`}
                        size="small"
                      />
                    )}
                    {test.maximum_age && (
                      <Chip 
                        label={`Max Age: ${test.maximum_age}`}
                        size="small"
                      />
                    )}
                  </Box>

                  {test.requirements && (
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Requirements
                      </Typography>
                      <Typography variant="body2">
                        {test.requirements}
                      </Typography>
                    </Box>
                  )}
                </CardContent>
              </Card>
            )}
          </Box>
        );

      case 1:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Booking Information
            </Typography>
            
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <DatePicker
                    label="Preferred Date"
                    value={selectedDate}
                    onChange={setSelectedDate}
                    minDate={new Date()}
                    maxDate={new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)} // 30 days from now
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        required: true
                      }
                    }}
                  />
                </LocalizationProvider>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <FormControl fullWidth required>
                  <InputLabel>Preferred Time</InputLabel>
                  <Select
                    value={selectedTime}
                    onChange={(e) => setSelectedTime(e.target.value)}
                    label="Preferred Time"
                    disabled={!selectedDate || checkingAvailability}
                  >
                    {availableSlots.map((slot) => (
                      <MenuItem key={slot} value={slot}>
                        {slot}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                {checkingAvailability && (
                  <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                    <CircularProgress size={16} sx={{ mr: 1 }} />
                    <Typography variant="caption">Checking availability...</Typography>
                  </Box>
                )}
              </Grid>

              <Grid item xs={12}>
                <Divider />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  required
                  label="Patient Name"
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  required
                  label="Patient Age"
                  type="number"
                  value={patientAge}
                  onChange={(e) => setPatientAge(e.target.value ? Number(e.target.value) : '')}
                  inputProps={{ min: 1, max: 120 }}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  required
                  label="Phone Number"
                  value={patientPhone}
                  onChange={(e) => setPatientPhone(e.target.value)}
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Email Address"
                  type="email"
                  value={patientEmail}
                  onChange={(e) => setPatientEmail(e.target.value)}
                />
              </Grid>

              {test?.is_home_collection_available && (
                <>
                  <Grid item xs={12}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={isHomeCollection}
                          onChange={(e) => setIsHomeCollection(e.target.checked)}
                        />
                      }
                      label="Home Collection"
                    />
                  </Grid>
                  
                  {isHomeCollection && (
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        required
                        multiline
                        rows={3}
                        label="Collection Address"
                        value={collectionAddress}
                        onChange={(e) => setCollectionAddress(e.target.value)}
                        placeholder="Please provide complete address including landmark"
                      />
                    </Grid>
                  )}
                </>
              )}

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={2}
                  label="Additional Notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Any special instructions or concerns..."
                />
              </Grid>
            </Grid>
          </Box>
        );

      case 2:
        return (
          <Box sx={{ textAlign: 'center' }}>
            {success ? (
              <>
                <CheckCircle sx={{ fontSize: 64, color: 'success.main', mb: 2 }} />
                <Typography variant="h5" gutterBottom>
                  Booking Confirmed!
                </Typography>
                <Typography variant="body1" color="text.secondary" paragraph>
                  Your lab test has been successfully booked.
                </Typography>
                
                {bookingId && (
                  <Card variant="outlined" sx={{ mt: 3, textAlign: 'left' }}>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Booking Details
                      </Typography>
                      <Grid container spacing={2}>
                        <Grid item xs={6}>
                          <Typography variant="subtitle2" color="text.secondary">
                            Booking ID
                          </Typography>
                          <Typography variant="body1" fontWeight="bold">
                            {bookingId}
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="subtitle2" color="text.secondary">
                            Test
                          </Typography>
                          <Typography variant="body1">
                            {test?.name}
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="subtitle2" color="text.secondary">
                            Date & Time
                          </Typography>
                          <Typography variant="body1">
                            {selectedDate?.toLocaleDateString()} at {selectedTime}
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="subtitle2" color="text.secondary">
                            Collection Type
                          </Typography>
                          <Typography variant="body1">
                            {isHomeCollection ? 'Home Collection' : 'Lab Visit'}
                          </Typography>
                        </Grid>
                        <Grid item xs={12}>
                          <Typography variant="subtitle2" color="text.secondary">
                            Patient
                          </Typography>
                          <Typography variant="body1">
                            {patientName}, {patientAge} years
                          </Typography>
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>
                )}
                
                <Alert severity="info" sx={{ mt: 2 }}>
                  A confirmation email has been sent to your registered email address.
                </Alert>
              </>
            ) : (
              <CircularProgress size={64} />
            )}
          </Box>
        );

      default:
        return 'Unknown step';
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={handleClose} 
      maxWidth="md" 
      fullWidth
      PaperProps={{
        sx: { minHeight: '70vh' }
      }}
    >
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h5">
          Book Lab Test
        </Typography>
        <IconButton onClick={handleClose}>
          <Close />
        </IconButton>
      </DialogTitle>
      
      <DialogContent>
        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {getStepContent(activeStep)}
      </DialogContent>
      
      <DialogActions sx={{ p: 3 }}>
        {activeStep === 0 && (
          <Button onClick={handleClose}>
            Cancel
          </Button>
        )}
        
        {activeStep > 0 && activeStep < 2 && (
          <Button onClick={handleBack}>
            Back
          </Button>
        )}
        
        {activeStep === 0 && (
          <Button variant="contained" onClick={handleNext}>
            Next
          </Button>
        )}
        
        {activeStep === 1 && (
          <Button 
            variant="contained" 
            onClick={handleBooking}
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : 'Book Test'}
          </Button>
        )}
        
        {activeStep === 2 && success && (
          <Button variant="contained" onClick={handleClose}>
            Done
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default LabTestBookingComponent;