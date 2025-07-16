import { Outlet } from 'react-router-dom';
import { Box } from '@mui/material';
import Header from './Header';
import TabNavigation from './TabNavigation';
import { Science, Assignment, Info } from '@mui/icons-material';

interface LayoutProps {
  showTabNavigation?: boolean;
  stickyTabs?: boolean;
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

const Layout = ({
  showTabNavigation = true,
  stickyTabs = false,
  isAuthenticated = false,
  user,
  onLogin,
  onRegister,
  onLogout,
  onSettings
}: LayoutProps) => {
  const tabs = [
    {
      label: 'Lab Tests',
      value: '/lab-tests',
      icon: <Science />,
    },
    {
      label: 'Reports',
      value: '/reports',
      icon: <Assignment />,
    },
    {
      label: 'About',
      value: '/about',
      icon: <Info />,
    },
  ];

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <Header
        isAuthenticated={isAuthenticated}
        user={user}
        onLogin={onLogin}
        onRegister={onRegister}
        onLogout={onLogout}
        onSettings={onSettings}
      />
      
      {showTabNavigation && (
        <TabNavigation
          tabs={tabs}
          stickyTabs={stickyTabs}
          animationType="fade"
          animationDuration={300}
          showIndicator={true}
          lazy={false}
        >
          <Outlet />
        </TabNavigation>
      )}
      
      {!showTabNavigation && (
        <Box sx={{ flex: 1 }}>
          <Outlet />
        </Box>
      )}
    </Box>
  );
};

export default Layout;