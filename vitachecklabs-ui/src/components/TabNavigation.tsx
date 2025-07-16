import { 
  Box, 
  useTheme, 
  useMediaQuery,
  Paper,
  Container
} from '@mui/material';
import { useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useState, useCallback } from 'react';
import Tab from './Tab';
import TabContent from './TabContent';
import { 
  Science, 
  Assignment, 
  Info,
  KeyboardArrowLeft,
  KeyboardArrowRight
} from '@mui/icons-material';

interface TabItem {
  label: string;
  value: string;
  icon?: React.ReactNode;
  disabled?: boolean;
  badge?: number | string;
  component?: React.ComponentType;
}

interface TabNavigationProps {
  tabs: TabItem[];
  variant?: 'primary' | 'secondary' | 'outlined';
  size?: 'small' | 'medium' | 'large';
  orientation?: 'horizontal' | 'vertical';
  centered?: boolean;
  scrollable?: boolean;
  animationType?: 'fade' | 'slide' | 'grow' | 'none';
  animationDuration?: number;
  showIndicator?: boolean;
  stickyTabs?: boolean;
  lazy?: boolean;
  onChange?: (value: string) => void;
  children?: React.ReactNode;
}

const defaultTabs: TabItem[] = [
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

const TabNavigation = ({
  tabs = defaultTabs,
  variant = 'primary',
  size = 'medium',
  orientation = 'horizontal',
  centered = true,
  scrollable = true,
  animationType = 'fade',
  animationDuration = 300,
  showIndicator = true,
  stickyTabs = false,
  lazy = false,
  onChange,
  children
}: TabNavigationProps) => {
  const theme = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [activeTab, setActiveTab] = useState<string>(location.pathname);
  const [indicatorStyle, setIndicatorStyle] = useState<{
    left: number;
    width: number;
  }>({ left: 0, width: 0 });

  // Update active tab when location changes
  useEffect(() => {
    const currentPath = location.pathname;
    const matchingTab = tabs.find(tab => 
      tab.value === currentPath || 
      (tab.value === '/lab-tests' && currentPath === '/')
    );
    
    if (matchingTab) {
      setActiveTab(matchingTab.value);
    }
  }, [location.pathname, tabs]);

  // Update indicator position
  const updateIndicator = useCallback(() => {
    if (!showIndicator || orientation === 'vertical') return;
    
    const activeTabElement = document.querySelector(`[aria-current="page"]`) as HTMLElement;
    if (activeTabElement) {
      const containerElement = activeTabElement.closest('[role="tablist"]') as HTMLElement;
      if (containerElement) {
        const containerRect = containerElement.getBoundingClientRect();
        const tabRect = activeTabElement.getBoundingClientRect();
        
        setIndicatorStyle({
          left: tabRect.left - containerRect.left,
          width: tabRect.width,
        });
      }
    }
  }, [showIndicator, orientation]);

  useEffect(() => {
    updateIndicator();
    
    const handleResize = () => {
      setTimeout(updateIndicator, 100);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [updateIndicator, activeTab]);

  const handleTabChange = (tabValue: string) => {
    setActiveTab(tabValue);
    navigate(tabValue);
    onChange?.(tabValue);
  };

  const handleKeyDown = (event: React.KeyboardEvent, currentIndex: number) => {
    const enabledTabs = tabs.filter(tab => !tab.disabled);
    const currentTabIndex = enabledTabs.findIndex(tab => tab.value === activeTab);
    
    let nextIndex = currentTabIndex;
    
    switch (event.key) {
      case 'ArrowRight':
      case 'ArrowDown':
        event.preventDefault();
        nextIndex = (currentTabIndex + 1) % enabledTabs.length;
        break;
      case 'ArrowLeft':
      case 'ArrowUp':
        event.preventDefault();
        nextIndex = currentTabIndex === 0 ? enabledTabs.length - 1 : currentTabIndex - 1;
        break;
      case 'Home':
        event.preventDefault();
        nextIndex = 0;
        break;
      case 'End':
        event.preventDefault();
        nextIndex = enabledTabs.length - 1;
        break;
      default:
        return;
    }
    
    const nextTab = enabledTabs[nextIndex];
    if (nextTab) {
      handleTabChange(nextTab.value);
    }
  };

  const renderTabs = () => (
    <Box
      role="tablist"
      sx={{
        display: 'flex',
        flexDirection: orientation === 'vertical' ? 'column' : 'row',
        gap: 1,
        position: 'relative',
        justifyContent: centered ? 'center' : 'flex-start',
        alignItems: orientation === 'vertical' ? 'stretch' : 'center',
        overflowX: scrollable && orientation === 'horizontal' ? 'auto' : 'visible',
        overflowY: scrollable && orientation === 'vertical' ? 'auto' : 'visible',
        '&::-webkit-scrollbar': {
          height: 4,
          width: 4,
        },
        '&::-webkit-scrollbar-track': {
          backgroundColor: theme.palette.grey[100],
        },
        '&::-webkit-scrollbar-thumb': {
          backgroundColor: theme.palette.grey[400],
          borderRadius: 2,
        },
      }}
    >
      {tabs.map((tab, index) => (
        <Tab
          key={tab.value}
          label={tab.label}
          to={tab.value}
          icon={tab.icon}
          isActive={activeTab === tab.value}
          disabled={tab.disabled}
          badge={tab.badge}
          variant={variant}
          size={size}
          onClick={() => handleTabChange(tab.value)}
        />
      ))}
      
      {showIndicator && orientation === 'horizontal' && (
        <Box
          sx={{
            position: 'absolute',
            bottom: 0,
            height: 3,
            backgroundColor: theme.palette.primary.main,
            borderRadius: '2px 2px 0 0',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            left: indicatorStyle.left,
            width: indicatorStyle.width,
          }}
        />
      )}
    </Box>
  );

  const tabsContent = stickyTabs ? (
    <Paper
      elevation={1}
      sx={{
        position: 'sticky',
        top: 0,
        zIndex: theme.zIndex.appBar - 1,
        backgroundColor: theme.palette.background.paper,
        borderBottom: `1px solid ${theme.palette.divider}`,
        py: 1,
      }}
    >
      <Container maxWidth="lg">
        {renderTabs()}
      </Container>
    </Paper>
  ) : (
    <Box sx={{ py: 2 }}>
      {renderTabs()}
    </Box>
  );

  return (
    <Box
      sx={{
        width: '100%',
        display: 'flex',
        flexDirection: orientation === 'vertical' ? 'row' : 'column',
        gap: orientation === 'vertical' ? 2 : 0,
      }}
    >
      {tabsContent}
      
      <Box
        sx={{
          flex: 1,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {children || (
          <Box>
            {tabs.map((tab) => (
              <TabContent
                key={tab.value}
                value={tab.value}
                currentValue={activeTab}
                animationType={animationType}
                animationDuration={animationDuration}
                lazy={lazy}
              >
                {tab.component && <tab.component />}
              </TabContent>
            ))}
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default TabNavigation;