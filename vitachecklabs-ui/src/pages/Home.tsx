import React from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  CardMedia,
  AppBar,
  Toolbar,
  Button,
  Avatar,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
} from '@mui/material';
import { 
  AccountCircle, 
  Settings, 
  Logout as LogoutIcon 
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Home: React.FC = () => {
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

  const handleProfileClick = () => {
    handleMenuClose();
    // Navigate to profile page when implemented
  };

  const handleSettingsClick = () => {
    handleMenuClose();
    // Navigate to settings page when implemented
  };

  const handleLogoutClick = async () => {
    handleMenuClose();
    await handleLogout();
  };

  const services = [
    {
      id: 'diagnostics',
      title: 'Diagnostics',
      description: 'Utilize our advanced diagnostic services to identify specific health conditions.',
      image: '/images/Diagnostics.png',
      onClick: () => navigate('/lab-tests')
    },
    {
      id: 'consultation',
      title: 'Consultation',
      description: 'Schedule an appointment with our healthcare professionals.',
      image: '/images/Consultation.png',
      onClick: () => navigate('/consultation')
    },
    {
      id: 'wellness',
      title: 'Wellness',
      description: 'Engage in our wellness programs for a healthier lifestyle.',
      image: '/images/Wellness.png',
      onClick: () => navigate('/wellness')
    }
  ];

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
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
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
                <MenuItem onClick={handleProfileClick}>
                  <ListItemIcon>
                    <AccountCircle fontSize="small" />
                  </ListItemIcon>
                  <ListItemText>Profile</ListItemText>
                </MenuItem>
                <MenuItem onClick={handleSettingsClick}>
                  <ListItemIcon>
                    <Settings fontSize="small" />
                  </ListItemIcon>
                  <ListItemText>Settings</ListItemText>
                </MenuItem>
                <Divider />
                <MenuItem onClick={handleLogoutClick}>
                  <ListItemIcon>
                    <LogoutIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText>Logout</ListItemText>
                </MenuItem>
              </Menu>
            </Box>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Main Content */}
      <Box sx={{ 
        flexGrow: 1, 
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        py: 6,
        px: 2
      }}>
        {/* Title */}
        <Typography 
          variant="h2" 
          sx={{ 
            fontWeight: 'bold',
            color: '#1f2937',
            mb: 2,
            textAlign: 'center',
            fontSize: { xs: '2.5rem', md: '3.5rem' }
          }}
        >
          Medical Lab Tests
        </Typography>

        <Typography 
          variant="h6" 
          sx={{ 
            color: '#6b7280',
            mb: 6,
            textAlign: 'center',
            maxWidth: '800px',
            fontSize: '1.2rem'
          }}
        >
          Choose from our comprehensive range of medical services designed for your health and wellness
        </Typography>

        {/* Service Cards - Full Width */}
        <Box sx={{ width: '100%', maxWidth: '1600px' }}>
          <Grid container spacing={4} sx={{ display: 'flex', justifyContent: 'center' }}>
            {services.map((service) => (
              <Grid item xs={12} sm={4} md={4} lg={4} key={service.id} sx={{ display: 'flex', justifyContent: 'center' }}>
                <Card
                  sx={{
                    width: '100%',
                    maxWidth: '400px',
                    height: '500px',
                    display: 'flex',
                    flexDirection: 'column',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-8px)',
                      boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
                    },
                    borderRadius: '20px',
                    overflow: 'hidden',
                    border: '1px solid #e5e7eb'
                  }}
                  onClick={service.onClick}
                >
                  <CardMedia
                    component="div"
                    sx={{
                      height: 320,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: '#ffffff',
                      p: 3,
                    }}
                  >
                    <Box
                      component="img"
                      src={service.image}
                      alt={service.title}
                      sx={{
                        width: '280px',
                        height: '280px',
                        objectFit: 'contain',
                      }}
                    />
                  </CardMedia>
                  <CardContent sx={{ 
                    flexGrow: 1, 
                    p: 3,
                    textAlign: 'center',
                    backgroundColor: '#ffffff',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center'
                  }}>
                    <Typography 
                      gutterBottom 
                      variant="h4" 
                      component="h2"
                      sx={{ 
                        fontWeight: 'bold',
                        color: '#1f2937',
                        mb: 1,
                        fontSize: '1.5rem'
                      }}
                    >
                      {service.title}
                    </Typography>
                    <Typography 
                      variant="body1" 
                      color="text.secondary"
                      sx={{ 
                        lineHeight: 1.6,
                        fontSize: '1rem'
                      }}
                    >
                      {service.description}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      </Box>
    </Box>
  );
};

export default Home;