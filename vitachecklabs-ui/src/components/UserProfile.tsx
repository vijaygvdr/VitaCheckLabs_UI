import { useState } from 'react';
import {
  Box,
  Button,
  Avatar,
  Menu,
  MenuItem,
  Divider,
  Typography,
  IconButton,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  AccountCircle,
  Login,
  PersonAdd,
  Settings,
  Logout,
  Person
} from '@mui/icons-material';

interface UserProfileProps {
  isAuthenticated?: boolean;
  user?: {
    name: string;
    email: string;
    avatar?: string;
  };
  onLogin?: () => void;
  onRegister?: () => void;
  onLogout?: () => void;
  onSettings?: () => void;
}

const UserProfile = ({
  isAuthenticated = false,
  user,
  onLogin,
  onRegister,
  onLogout,
  onSettings
}: UserProfileProps) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleMenuItemClick = (action?: () => void) => {
    handleMenuClose();
    action?.();
  };

  if (!isAuthenticated) {
    return (
      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
        {isMobile ? (
          <>
            <IconButton color="inherit" onClick={onLogin}>
              <Login />
            </IconButton>
            <IconButton color="inherit" onClick={onRegister}>
              <PersonAdd />
            </IconButton>
          </>
        ) : (
          <>
            <Button
              color="inherit"
              startIcon={<Login />}
              onClick={onLogin}
              sx={{ textTransform: 'none' }}
            >
              Login
            </Button>
            <Button
              color="inherit"
              variant="outlined"
              startIcon={<PersonAdd />}
              onClick={onRegister}
              sx={{
                textTransform: 'none',
                borderColor: 'rgba(255,255,255,0.5)',
                '&:hover': {
                  borderColor: 'rgba(255,255,255,0.8)',
                  backgroundColor: 'rgba(255,255,255,0.1)',
                }
              }}
            >
              Register
            </Button>
          </>
        )}
      </Box>
    );
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Box sx={{ display: 'flex', alignItems: 'center' }}>
      <IconButton
        color="inherit"
        onClick={handleMenuOpen}
        sx={{ p: 0.5 }}
      >
        {user?.avatar ? (
          <Avatar
            src={user.avatar}
            alt={user.name}
            sx={{ width: 32, height: 32 }}
          />
        ) : (
          <Avatar
            sx={{
              width: 32,
              height: 32,
              bgcolor: 'rgba(255,255,255,0.2)',
              fontSize: '0.875rem'
            }}
          >
            {user?.name ? getInitials(user.name) : <AccountCircle />}
          </Avatar>
        )}
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
        sx={{ mt: 1 }}
      >
        <Box sx={{ px: 2, py: 1, minWidth: 200 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
            {user?.name || 'User'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {user?.email || 'user@example.com'}
          </Typography>
        </Box>
        <Divider />
        <MenuItem onClick={() => handleMenuItemClick(onSettings)}>
          <Settings sx={{ mr: 1 }} />
          Settings
        </MenuItem>
        <MenuItem onClick={() => handleMenuItemClick()}>
          <Person sx={{ mr: 1 }} />
          Profile
        </MenuItem>
        <Divider />
        <MenuItem onClick={() => handleMenuItemClick(onLogout)}>
          <Logout sx={{ mr: 1 }} />
          Logout
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default UserProfile;