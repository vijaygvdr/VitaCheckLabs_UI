import React from 'react';
import {
  Box,
  Container,
  Typography,
  AppBar,
  Toolbar,
  Button,
  Avatar,
  Menu,
  MenuItem,
  Divider,
} from '@mui/material';
import { 
  Person,
  Logout as LogoutIcon 
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const About: React.FC = () => {
  const navigate = useNavigate();
  const { logout, state: authState } = useAuth();
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);

  const handleLogout = async () => {
    await logout();
    navigate('/auth/login');
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogoutClick = async () => {
    handleMenuClose();
    await handleLogout();
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
              sx={{ color: '#374151', textTransform: 'none' }}
              onClick={() => navigate('/my-bookings')}
            >
              My Bookings
            </Button>
            <Button 
              color="inherit" 
              sx={{ color: '#374151', textTransform: 'none', backgroundColor: '#e5e7eb' }}
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
                onClick={handleMenuOpen}
                aria-controls={anchorEl ? 'user-menu' : undefined}
                aria-haspopup="true"
                aria-expanded={anchorEl ? 'true' : undefined}
              >
                {authState.user?.first_name || authState.user?.username || 'User'}
              </Button>
              
              {/* User Dropdown Menu */}
              <Menu
                id="user-menu"
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleMenuClose}
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
                <MenuItem onClick={() => { handleMenuClose(); /* Navigate to profile */ }}>
                  <Person fontSize="small" sx={{ mr: 1.5 }} />
                  Profile
                </MenuItem>
                <MenuItem onClick={() => { handleMenuClose(); /* Navigate to settings */ }}>
                  <Person fontSize="small" sx={{ mr: 1.5 }} />
                  Settings
                </MenuItem>
                <Divider />
                <MenuItem onClick={handleLogoutClick}>
                  <LogoutIcon fontSize="small" sx={{ mr: 1.5 }} />
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
          About VitaCheckLabs
        </Typography>

        <Box sx={{ 
          backgroundColor: 'white', 
          borderRadius: '8px', 
          p: 4,
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 3, color: '#1f2937' }}>
            Your Trusted Healthcare Partner
          </Typography>
          
          <Typography variant="body1" sx={{ mb: 3, lineHeight: 1.6, color: '#374151' }}>
            VitaCheckLabs is a leading healthcare technology platform dedicated to providing convenient, 
            accurate, and reliable medical testing services. We bridge the gap between patients and 
            healthcare providers through innovative digital solutions.
          </Typography>
          
          <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2, color: '#1f2937' }}>
            Our Services
          </Typography>
          
          <Box component="ul" sx={{ pl: 2, mb: 3 }}>
            <Typography component="li" variant="body1" sx={{ mb: 1, color: '#374151' }}>
              <strong>Diagnostics:</strong> Comprehensive laboratory testing with advanced diagnostic capabilities
            </Typography>
            <Typography component="li" variant="body1" sx={{ mb: 1, color: '#374151' }}>
              <strong>Home Collection:</strong> Convenient sample collection at your doorstep
            </Typography>
            <Typography component="li" variant="body1" sx={{ mb: 1, color: '#374151' }}>
              <strong>Digital Reports:</strong> Fast, secure, and easy-to-understand test results
            </Typography>
            <Typography component="li" variant="body1" sx={{ mb: 1, color: '#374151' }}>
              <strong>Expert Consultation:</strong> Access to healthcare professionals for result interpretation
            </Typography>
          </Box>
          
          <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2, color: '#1f2937' }}>
            Why Choose VitaCheckLabs?
          </Typography>
          
          <Box component="ul" sx={{ pl: 2 }}>
            <Typography component="li" variant="body1" sx={{ mb: 1, color: '#374151' }}>
              State-of-the-art laboratory equipment and certified technicians
            </Typography>
            <Typography component="li" variant="body1" sx={{ mb: 1, color: '#374151' }}>
              NABL accredited facilities ensuring quality and accuracy
            </Typography>
            <Typography component="li" variant="body1" sx={{ mb: 1, color: '#374151' }}>
              24/7 customer support and emergency services
            </Typography>
            <Typography component="li" variant="body1" sx={{ mb: 1, color: '#374151' }}>
              Secure data handling and privacy protection
            </Typography>
            <Typography component="li" variant="body1" sx={{ color: '#374151' }}>
              Affordable pricing with transparent cost structure
            </Typography>
          </Box>
        </Box>
      </Container>
    </Box>
  );
};

export default About;