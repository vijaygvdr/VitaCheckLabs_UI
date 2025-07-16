import { useState } from 'react';
import { 
  Box, 
  Button, 
  IconButton, 
  Menu, 
  MenuItem, 
  useTheme, 
  useMediaQuery 
} from '@mui/material';
import { Link, useLocation } from 'react-router-dom';
import { Menu as MenuIcon } from '@mui/icons-material';

interface NavigationItem {
  label: string;
  path: string;
  icon?: React.ReactNode;
}

const navigationItems: NavigationItem[] = [
  { label: 'Lab Tests', path: '/lab-tests' },
  { label: 'Reports', path: '/reports' },
  { label: 'About', path: '/about' }
];

const Navigation = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const location = useLocation();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const isActiveRoute = (path: string) => {
    return location.pathname === path || (path === '/lab-tests' && location.pathname === '/');
  };

  const getButtonStyles = (path: string) => ({
    textDecoration: 'none',
    backgroundColor: isActiveRoute(path) ? 'rgba(255,255,255,0.15)' : 'transparent',
    borderRadius: 1,
    px: 2,
    py: 1,
    '&:hover': {
      backgroundColor: 'rgba(255,255,255,0.1)',
    },
    transition: 'all 0.2s ease-in-out',
  });

  if (isMobile) {
    return (
      <Box>
        <IconButton
          color="inherit"
          onClick={handleMenuOpen}
          sx={{ ml: 1 }}
        >
          <MenuIcon />
        </IconButton>
        <Menu
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
        >
          {navigationItems.map((item) => (
            <MenuItem
              key={item.path}
              component={Link}
              to={item.path}
              onClick={handleMenuClose}
              sx={{
                backgroundColor: isActiveRoute(item.path) ? 'rgba(46, 125, 50, 0.1)' : 'transparent',
                color: isActiveRoute(item.path) ? 'primary.main' : 'inherit',
                fontWeight: isActiveRoute(item.path) ? 600 : 400,
              }}
            >
              {item.label}
            </MenuItem>
          ))}
        </Menu>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', gap: 1 }}>
      {navigationItems.map((item) => (
        <Button
          key={item.path}
          color="inherit"
          component={Link}
          to={item.path}
          sx={getButtonStyles(item.path)}
        >
          {item.label}
        </Button>
      ))}
    </Box>
  );
};

export default Navigation;