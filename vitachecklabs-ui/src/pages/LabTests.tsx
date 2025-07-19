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
import { LabTest } from '../types/api';
import LabTestBookingComponent from '../components/LabTestBooking';

const LabTests: React.FC = () => {
  const navigate = useNavigate();
  const { logout, state: authState } = useAuth();
  const [tests, setTests] = useState<LabTest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTest, setSelectedTest] = useState<LabTest | null>(null);
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
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
    fetchTests();
  }, []);

  const fetchTests = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Fetching lab tests...');
      const response = await labTestsService.getLabTests({
        is_active: true,
        per_page: 50
      });
      console.log('Lab tests response:', response);
      setTests(response.data || []);
    } catch (err: any) {
      console.error('Error fetching lab tests:', err);
      console.error('Error details:', {
        message: err?.message,
        response: err?.response,
        status: err?.response?.status,
        data: err?.response?.data
      });
      
      // Fallback to mock data if API fails
      const mockTests: LabTest[] = [
        {
          id: '1',
          name: 'Complete Blood Count (CBC)',
          code: 'CBC001',
          description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
          category: 'BLOOD_CHEMISTRY' as any,
          sample_type: 'BLOOD' as any,
          price: 50,
          is_active: true,
          is_home_collection_available: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: '2',
          name: 'Lipid Panel',
          code: 'LIP001',
          description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
          category: 'BLOOD_CHEMISTRY' as any,
          sample_type: 'BLOOD' as any,
          price: 75,
          is_active: true,
          is_home_collection_available: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: '3',
          name: 'Liver Function Test (LFT)',
          code: 'LFT001',
          description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
          category: 'BLOOD_CHEMISTRY' as any,
          sample_type: 'BLOOD' as any,
          price: 85,
          is_active: true,
          is_home_collection_available: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: '4',
          name: 'Hemoglobin A1c',
          code: 'HBA1C001',
          description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
          category: 'ENDOCRINOLOGY' as any,
          sample_type: 'BLOOD' as any,
          price: 60,
          is_active: true,
          is_home_collection_available: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ];
      
      console.log('Using mock data due to API error');
      setTests(mockTests);
      setError('Using demo data - API connection failed. Please check if the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  const handleBookTest = (test: LabTest) => {
    setSelectedTest(test);
    setBookingModalOpen(true);
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
              sx={{ color: '#374151', textTransform: 'none', backgroundColor: '#e5e7eb' }}
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
              sx={{ color: '#374151', textTransform: 'none' }}
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
          Lab Tests
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

        {/* Lab Tests List */}
        {!loading && (
          <List sx={{ backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
            {tests.map((test, index) => (
              <React.Fragment key={test.id}>
                <ListItem 
                  sx={{ 
                    py: 3,
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
                      {test.name}
                    </Typography>
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        color: '#6b7280',
                        lineHeight: 1.5
                      }}
                    >
                      {test.description}
                    </Typography>
                  </Box>
                  <Button
                    variant="contained"
                    onClick={() => handleBookTest(test)}
                    sx={{
                      backgroundColor: '#3b82f6',
                      borderRadius: '6px',
                      textTransform: 'none',
                      fontWeight: '500',
                      px: 3,
                      py: 1,
                      '&:hover': {
                        backgroundColor: '#2563eb',
                      }
                    }}
                  >
                    Book
                  </Button>
                </ListItem>
                {index < tests.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </List>
        )}

        {/* Booking Modal */}
        <LabTestBookingComponent
          open={bookingModalOpen}
          onClose={() => setBookingModalOpen(false)}
          test={selectedTest}
        />
      </Container>
    </Box>
  );
};

export default LabTests;