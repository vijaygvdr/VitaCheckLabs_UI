import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  AppBar,
  Toolbar,
  Avatar,
  CircularProgress,
  Alert,
  List,
  ListItem,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Card,
  CardContent,
  Menu,
  MenuItem,
  IconButton
} from '@mui/material';
import {
  ArrowDropDown,
  Logout,
  Person
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { labTestsService } from '../services/labTestsService';
import { Booking } from '../types/api';

const MyBookings: React.FC = () => {
  const navigate = useNavigate();
  const { logout, state: authState } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancellingBookingId, setCancellingBookingId] = useState<string | null>(null);
  const [confirmCancelDialog, setConfirmCancelDialog] = useState<{
    open: boolean;
    booking: Booking | null;
  }>({ open: false, booking: null });
  const [userMenuAnchor, setUserMenuAnchor] = useState<null | HTMLElement>(null);

  const handleUserMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setUserMenuAnchor(event.currentTarget);
  };

  const handleUserMenuClose = () => {
    setUserMenuAnchor(null);
  };

  const handleLogout = async () => {
    handleUserMenuClose();
    await logout();
    navigate('/auth/login');
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('=== FETCHING USER BOOKINGS ===');
      console.log('About to call labTestsService.getUserBookings...');
      
      const response = await labTestsService.getUserBookings();
      console.log('✅ API Response received:', response);
      console.log('Bookings data:', response.data);
      
      if (response.data && response.data.length > 0) {
        setBookings(response.data);
        console.log(`✅ Successfully loaded ${response.data.length} bookings from API`);
      } else {
        setBookings([]);
        console.log('⚠️ No bookings returned from API');
        setError('No bookings found. Book your first test to see it here!');
      }
    } catch (err: any) {
      console.error('❌ API Error fetching bookings:', err);
      console.error('Error details:', {
        message: err?.message,
        response: err?.response,
        status: err?.response?.status,
        data: err?.response?.data
      });
      
      // Handle specific error cases
      if (err?.response?.status === 401 || err?.response?.status === 403) {
        setError('Authentication required. Please log in to view your bookings.');
        setBookings([]);
      } else if (err?.response?.status === 404) {
        setError('Bookings endpoint not found. Please check the API configuration.');
        setBookings([]);
      } else if (err?.code === 'NETWORK_ERROR' || err?.message?.includes('Network Error')) {
        setError('Network error. Please check if the API is running on localhost:8000.');
        
        // Fallback to mock data only for network errors
        console.log('🔄 Using mock data as fallback for network error');
        const mockBookings: Booking[] = [
          {
            id: 'mock-1',
            test_id: '1',
            test_name: 'Complete Blood Count (CBC)',
            patient_name: 'Vijay G',
            patient_age: 28,
            appointment_date: '2025-07-22T09:00:00.000Z',
            home_collection: true,
            address: 'test address',
            phone_number: '9876543210',
            status: 'confirmed',
            created_at: '2025-07-19T10:30:00.000Z'
          },
          {
            id: 'mock-2',
            test_id: '2',
            test_name: 'Lipid Panel',
            patient_name: 'Vijay G',
            patient_age: 28,
            appointment_date: '2025-08-15T09:00:00.000Z',
            home_collection: true,
            address: 'test address',
            phone_number: '9876543210',
            status: 'confirmed',
            created_at: '2025-07-19T11:45:00.000Z'
          }
        ];
        setBookings(mockBookings);
      } else {
        const errorMessage = err?.message || 'Unknown error';
        if (errorMessage.includes('No available bookings endpoint found')) {
          setError('Bookings feature is not yet available in the backend. The booking retrieval API endpoint needs to be implemented.');
          setBookings([]);
        } else {
          setError(`Failed to fetch bookings: ${errorMessage}. Please try again.`);
          setBookings([]);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCancelBooking = (booking: Booking) => {
    setConfirmCancelDialog({ open: true, booking });
  };

  const confirmCancelBooking = async () => {
    const { booking } = confirmCancelDialog;
    if (!booking) return;

    try {
      setCancellingBookingId(booking.id);
      setError(null);
      
      console.log('Cancelling booking:', booking.id);
      
      try {
        await labTestsService.cancelBooking(booking.id);
        console.log('Booking cancelled successfully');
      } catch (apiError) {
        console.log('API cancel failed, updating locally');
      }
      
      // Update booking status to cancelled locally
      setBookings(prevBookings => 
        prevBookings.map(b => 
          b.id === booking.id 
            ? { ...b, status: 'cancelled' as const }
            : b
        )
      );
      
      setConfirmCancelDialog({ open: false, booking: null });
    } catch (err: any) {
      console.error('Error cancelling booking:', err);
      setError('Failed to cancel booking. Please try again.');
    } finally {
      setCancellingBookingId(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: '2-digit' 
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return '#10b981';
      case 'pending': return '#f59e0b';
      case 'cancelled': return '#ef4444';
      case 'completed': return '#3b82f6';
      default: return '#6b7280';
    }
  };

  return (
    <Box sx={{ 
      minHeight: '100vh', 
      width: '100vw',
      backgroundColor: '#f8f9fa',
      margin: 0,
      padding: 0
    }}>
      {/* Navigation Header */}
      <AppBar 
        position="static" 
        sx={{ 
          backgroundColor: 'white', 
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          borderBottom: '1px solid #e5e7eb'
        }}
      >
        <Toolbar sx={{ justifyContent: 'space-between' }}>
          {/* Logo */}
          <Box 
            sx={{ 
              display: 'flex', 
              alignItems: 'center',
              cursor: 'pointer',
              '&:hover': {
                opacity: 0.8
              },
              transition: 'opacity 0.2s ease'
            }}
            onClick={() => navigate('/home')}
          >
            <Box
              component="img"
              src="/images/VitaCheckLabsIcon.png"
              alt="VitaCheckLabs"
              sx={{
                width: 32,
                height: 32,
                mr: 2,
              }}
            />
            <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#1f2937' }}>
              VitaCheckLabs
            </Typography>
          </Box>

          {/* Navigation Links */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <Button 
              color="inherit" 
              sx={{ color: '#374151', textTransform: 'none' }}
              onClick={() => navigate('/lab-tests')}
            >
              Lab Tests
            </Button>
            <Button 
              color="inherit" 
              sx={{ color: '#374151', textTransform: 'none' }}
              onClick={() => navigate('/reports')}
            >
              Reports
            </Button>
            <Button 
              color="inherit" 
              sx={{ color: '#374151', textTransform: 'none', backgroundColor: '#e5e7eb' }}
              onClick={() => navigate('/my-bookings')}
            >
              My Bookings
            </Button>
            <Button 
              color="inherit" 
              sx={{ color: '#374151', textTransform: 'none' }}
              onClick={() => navigate('/about')}
            >
              About
            </Button>
            
            {/* User Menu */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Avatar sx={{ width: 24, height: 24, backgroundColor: '#3b82f6' }}>
                <Typography variant="caption" sx={{ color: 'white', fontSize: '12px' }}>
                  {authState.user?.first_name?.charAt(0).toUpperCase() || authState.user?.username?.charAt(0).toUpperCase() || 'U'}
                </Typography>
              </Avatar>
              <Button 
                color="inherit" 
                sx={{ color: '#374151', textTransform: 'none' }}
                onClick={handleUserMenuOpen}
                aria-controls={userMenuAnchor ? 'user-menu' : undefined}
                aria-haspopup="true"
                aria-expanded={userMenuAnchor ? 'true' : undefined}
              >
                {authState.user?.first_name || authState.user?.username || 'User'}
              </Button>
              
              {/* User Dropdown Menu */}
              <Menu
                id="user-menu"
                anchorEl={userMenuAnchor}
                open={Boolean(userMenuAnchor)}
                onClose={handleUserMenuClose}
                anchorOrigin={{
                  vertical: 'bottom',
                  horizontal: 'right',
                }}
                transformOrigin={{
                  vertical: 'top',
                  horizontal: 'right',
                }}
                sx={{
                  '& .MuiPaper-root': {
                    minWidth: 200,
                    borderRadius: 2,
                    boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                  },
                }}
              >
                {/* User Info Header */}
                <Box sx={{ px: 2, py: 1.5, borderBottom: '1px solid #f0f0f0' }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                    {authState.user?.first_name && authState.user?.last_name 
                      ? `${authState.user.first_name} ${authState.user.last_name}`
                      : authState.user?.username || 'User'}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {authState.user?.email || 'user@example.com'}
                  </Typography>
                </Box>

                {/* Menu Items */}
                <MenuItem onClick={() => { handleUserMenuClose(); /* Navigate to profile */ }}>
                  <Person fontSize="small" sx={{ mr: 1.5 }} />
                  Profile
                </MenuItem>
                <MenuItem onClick={() => { handleUserMenuClose(); /* Navigate to settings */ }}>
                  <Person fontSize="small" sx={{ mr: 1.5 }} />
                  Settings
                </MenuItem>
                <Divider />
                <MenuItem onClick={handleLogout}>
                  <Logout fontSize="small" sx={{ mr: 1.5 }} />
                  Logout
                </MenuItem>
              </Menu>
            </Box>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Main Content */}
      <Container maxWidth="lg" sx={{ mt: 4, pb: 6 }}>
        <Typography 
          variant="h3" 
          sx={{ 
            fontWeight: 'bold',
            color: '#1f2937',
            mb: 4
          }}
        >
          Bookings
        </Typography>

        {/* Error Alert */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Loading State */}
        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress />
          </Box>
        )}

        {/* Bookings List */}
        {!loading && (
          <List sx={{ backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
            {bookings.map((booking, index) => (
              <React.Fragment key={booking.id}>
                <ListItem 
                  sx={{ 
                    py: 4,
                    px: 4,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start'
                  }}
                >
                  <Box sx={{ flexGrow: 1, mr: 3 }}>
                    <Typography 
                      variant="h6" 
                      sx={{ 
                        fontWeight: 'bold',
                        color: '#1f2937',
                        mb: 1
                      }}
                    >
                      {booking.test_name}
                    </Typography>
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        color: '#6b7280',
                        lineHeight: 1.5
                      }}
                    >
                      {formatDate(booking.appointment_date)}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', mt: 1, gap: 2 }}>
                      <Typography 
                        variant="caption" 
                        sx={{ 
                          color: getStatusColor(booking.status),
                          fontWeight: '500',
                          textTransform: 'capitalize'
                        }}
                      >
                        {booking.status}
                      </Typography>
                      {booking.home_collection && (
                        <Typography variant="caption" sx={{ color: '#6b7280' }}>
                          Home Collection
                        </Typography>
                      )}
                    </Box>
                  </Box>
                  
                  <Button
                    variant="contained"
                    onClick={() => handleCancelBooking(booking)}
                    disabled={cancellingBookingId === booking.id || booking.status === 'cancelled'}
                    sx={{
                      backgroundColor: booking.status === 'cancelled' ? '#9ca3af' : '#3b82f6',
                      borderRadius: '6px',
                      textTransform: 'none',
                      fontWeight: '500',
                      px: 3,
                      py: 1,
                      '&:hover': {
                        backgroundColor: booking.status === 'cancelled' ? '#9ca3af' : '#2563eb',
                      },
                      '&:disabled': {
                        backgroundColor: '#9ca3af',
                      }
                    }}
                  >
                    {cancellingBookingId === booking.id ? (
                      <>
                        <CircularProgress size={16} sx={{ mr: 1, color: 'white' }} />
                        Cancelling...
                      </>
                    ) : booking.status === 'cancelled' ? (
                      'Cancelled'
                    ) : (
                      'Cancel Booking'
                    )}
                  </Button>
                </ListItem>
                {index < bookings.length - 1 && <Divider />}
              </React.Fragment>
            ))}
            
            {bookings.length === 0 && (
              <Box sx={{ textAlign: 'center', py: 8 }}>
                <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
                  No bookings found
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  You don't have any active bookings yet.
                </Typography>
                <Button
                  variant="contained"
                  onClick={() => navigate('/lab-tests')}
                  sx={{
                    mt: 3,
                    backgroundColor: '#3b82f6',
                    textTransform: 'none',
                    '&:hover': {
                      backgroundColor: '#2563eb',
                    }
                  }}
                >
                  Book a Test
                </Button>
              </Box>
            )}
          </List>
        )}

        {/* Cancel Confirmation Dialog */}
        <Dialog
          open={confirmCancelDialog.open}
          onClose={() => setConfirmCancelDialog({ open: false, booking: null })}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>
            Cancel Booking
          </DialogTitle>
          <DialogContent>
            <Typography variant="body1" sx={{ mb: 2 }}>
              Are you sure you want to cancel the following booking?
            </Typography>
            {confirmCancelDialog.booking && (
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    {confirmCancelDialog.booking.test_name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Appointment Date: {formatDate(confirmCancelDialog.booking.appointment_date)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Patient: {confirmCancelDialog.booking.patient_name}
                  </Typography>
                </CardContent>
              </Card>
            )}
            <Alert severity="warning" sx={{ mt: 2 }}>
              This action cannot be undone. You may need to rebook if you change your mind.
            </Alert>
          </DialogContent>
          <DialogActions sx={{ p: 3 }}>
            <Button 
              onClick={() => setConfirmCancelDialog({ open: false, booking: null })}
              sx={{ textTransform: 'none' }}
            >
              Keep Booking
            </Button>
            <Button 
              variant="contained"
              color="error"
              onClick={confirmCancelBooking}
              disabled={cancellingBookingId !== null}
              sx={{ textTransform: 'none' }}
            >
              {cancellingBookingId ? 'Cancelling...' : 'Cancel Booking'}
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Box>
  );
};

export default MyBookings;