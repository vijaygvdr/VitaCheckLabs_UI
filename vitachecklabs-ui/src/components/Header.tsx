import { AppBar, Toolbar, Typography, Button, Box } from '@mui/material';
import { Link, useLocation } from 'react-router-dom';
import { LocalHospital } from '@mui/icons-material';

const Header = () => {
  const location = useLocation();

  return (
    <AppBar position="static" sx={{ backgroundColor: 'primary.main' }}>
      <Toolbar>
        <LocalHospital sx={{ mr: 2 }} />
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          VitaCheckLabs
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            color="inherit"
            component={Link}
            to="/lab-tests"
            sx={{
              textDecoration: 'none',
              backgroundColor: location.pathname === '/lab-tests' ? 'rgba(255,255,255,0.1)' : 'transparent',
            }}
          >
            Lab Tests
          </Button>
          <Button
            color="inherit"
            component={Link}
            to="/reports"
            sx={{
              textDecoration: 'none',
              backgroundColor: location.pathname === '/reports' ? 'rgba(255,255,255,0.1)' : 'transparent',
            }}
          >
            Reports
          </Button>
          <Button
            color="inherit"
            component={Link}
            to="/about"
            sx={{
              textDecoration: 'none',
              backgroundColor: location.pathname === '/about' ? 'rgba(255,255,255,0.1)' : 'transparent',
            }}
          >
            About
          </Button>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Header;