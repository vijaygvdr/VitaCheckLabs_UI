import { AppBar, Toolbar, Box, Container } from '@mui/material';
import { Link } from 'react-router-dom';
import Logo from './Logo';
import Navigation from './Navigation';
import UserProfile from './UserProfile';

interface HeaderProps {
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

const Header = ({
  isAuthenticated = false,
  user,
  onLogin,
  onRegister,
  onLogout,
  onSettings
}: HeaderProps) => {
  return (
    <AppBar 
      position="static" 
      sx={{ 
        backgroundColor: 'primary.main',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      }}
    >
      <Container maxWidth="lg">
        <Toolbar sx={{ px: { xs: 0, sm: 2 } }}>
          <Box
            component={Link}
            to="/"
            sx={{
              textDecoration: 'none',
              color: 'inherit',
              display: 'flex',
              alignItems: 'center',
              mr: 4,
              '&:hover': {
                opacity: 0.8,
              },
              transition: 'opacity 0.2s ease-in-out',
            }}
          >
            <Logo variant="full" size="medium" color="inherit" />
          </Box>
          
          <Box sx={{ flexGrow: 1 }} />
          
          <Navigation />
          
          <Box sx={{ ml: 2 }}>
            <UserProfile
              isAuthenticated={isAuthenticated}
              user={user}
              onLogin={onLogin}
              onRegister={onRegister}
              onLogout={onLogout}
              onSettings={onSettings}
            />
          </Box>
        </Toolbar>
      </Container>
    </AppBar>
  );
};

export default Header;