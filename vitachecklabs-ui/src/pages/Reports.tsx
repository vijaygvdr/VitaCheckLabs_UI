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
import { reportsService } from '../services/reportsService';
import { Report } from '../types/api';

const Reports: React.FC = () => {
  const navigate = useNavigate();
  const { logout, state: authState } = useAuth();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userMenuAnchor, setUserMenuAnchor] = useState<null | HTMLElement>(null);

  console.log('Reports component state:', { reports: reports.length, loading, error });

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
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('=== FETCHING REPORTS ===');
      console.log('About to call reportsService.getReports...');
      
      const response = await reportsService.getReports({
        per_page: 50
      });
      console.log('Reports API response received:', response);
      console.log('Response type:', typeof response);
      console.log('Response keys:', Object.keys(response || {}));
      
      // Handle backend response format: {reports: [...]} instead of {data: [...]}
      const reportsData = (response as any).reports || (response as any).data || [];
      console.log('Extracted reports data:', reportsData);
      console.log('Reports data length:', reportsData.length);
      console.log('Looking for reports in:', (response as any).reports ? 'response.reports' : (response as any).data ? 'response.data' : 'neither found');
      
      setReports(reportsData);
      console.log('Reports state updated with:', reportsData.length, 'reports');
      
      if (reportsData.length === 0) {
        setError('No reports found. Please check if the API is running and returning data.');
      }
    } catch (err: any) {
      console.error('Error fetching reports:', err);
      console.error('Error details:', {
        message: err?.message,
        response: err?.response,
        status: err?.response?.status,
        data: err?.response?.data
      });
      
      setReports([]);
      
      // Handle specific error cases
      if (err?.response?.status === 401 || err?.response?.status === 403) {
        setError('Authentication required. Please log in to access your reports.');
      } else if (err?.response?.status === 404) {
        setError('Reports endpoint not found. Please check the API configuration.');
      } else if (err?.code === 'NETWORK_ERROR' || err?.message?.includes('Network Error')) {
        setError('Network error. Please check if the API is running on localhost:8000.');
      } else {
        setError(`Failed to fetch reports: ${err?.message || 'Unknown error'}. Please check your connection and try again.`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadReport = async (report: Report) => {
    try {
      console.log('Downloading report:', report.id);
      await reportsService.downloadReportFile(report.id);
    } catch (err: any) {
      console.error('Error downloading report:', err);
      setError('Failed to download report. Please try again.');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: '2-digit' 
    });
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
              sx={{ color: '#374151', textTransform: 'none', backgroundColor: '#e5e7eb' }}
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
          Lab Reports
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


        {/* Reports List */}
        {!loading && reports.length > 0 && (
          <List sx={{ backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
            {reports.map((report, index) => (
              <React.Fragment key={report.id}>
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
                      {report.report_number}
                    </Typography>
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        color: '#6b7280',
                        lineHeight: 1.5
                      }}
                    >
                      {formatDate(report.created_at)}
                    </Typography>
                  </Box>
                  <Button
                    variant="contained"
                    onClick={() => handleDownloadReport(report)}
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
                    Download
                  </Button>
                </ListItem>
                {index < reports.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </List>
        )}

        {/* Empty State */}
        {!loading && reports.length === 0 && (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
              No reports found
            </Typography>
            <Typography variant="body2" color="text.secondary">
              You don't have any lab reports yet.
            </Typography>
          </Box>
        )}
      </Container>
    </Box>
  );
};

export default Reports;