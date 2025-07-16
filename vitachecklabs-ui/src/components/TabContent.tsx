import { 
  Box, 
  Fade, 
  Slide, 
  Grow, 
  useTheme,
  CircularProgress,
  Typography
} from '@mui/material';
import { ReactNode, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

interface TabContentProps {
  children: ReactNode;
  value: string;
  currentValue: string;
  animationType?: 'fade' | 'slide' | 'grow' | 'none';
  animationDuration?: number;
  loading?: boolean;
  error?: string;
  minHeight?: string | number;
  padding?: string | number;
  lazy?: boolean;
}

const TabContent = ({
  children,
  value,
  currentValue,
  animationType = 'fade',
  animationDuration = 300,
  loading = false,
  error,
  minHeight = 400,
  padding = 0,
  lazy = false
}: TabContentProps) => {
  const theme = useTheme();
  const location = useLocation();
  const [hasBeenVisible, setHasBeenVisible] = useState(false);
  
  const isActive = currentValue === value || 
    (value === '/lab-tests' && (currentValue === '/lab-tests' || currentValue === '/'));

  useEffect(() => {
    if (isActive && !hasBeenVisible) {
      setHasBeenVisible(true);
    }
  }, [isActive, hasBeenVisible]);

  // Don't render content if lazy loading and hasn't been visible yet
  if (lazy && !hasBeenVisible && !isActive) {
    return null;
  }

  const renderContent = () => {
    if (loading) {
      return (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: typeof minHeight === 'number' ? `${minHeight}px` : minHeight,
            gap: 2,
          }}
        >
          <CircularProgress size={40} />
          <Typography variant="body2" color="text.secondary">
            Loading...
          </Typography>
        </Box>
      );
    }

    if (error) {
      return (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: typeof minHeight === 'number' ? `${minHeight}px` : minHeight,
            gap: 2,
            color: theme.palette.error.main,
          }}
        >
          <Typography variant="h6" color="error">
            Error
          </Typography>
          <Typography variant="body2" color="error" textAlign="center">
            {error}
          </Typography>
        </Box>
      );
    }

    return children;
  };

  const getAnimationComponent = () => {
    const commonProps = {
      in: isActive,
      timeout: animationDuration,
      unmountOnExit: lazy,
    };

    switch (animationType) {
      case 'fade':
        return (
          <Fade {...commonProps}>
            <Box>{renderContent()}</Box>
          </Fade>
        );
      case 'slide':
        return (
          <Slide 
            {...commonProps} 
            direction="left"
            mountOnEnter
            unmountOnExit
          >
            <Box>{renderContent()}</Box>
          </Slide>
        );
      case 'grow':
        return (
          <Grow {...commonProps}>
            <Box>{renderContent()}</Box>
          </Grow>
        );
      case 'none':
        return <Box>{renderContent()}</Box>;
      default:
        return (
          <Fade {...commonProps}>
            <Box>{renderContent()}</Box>
          </Fade>
        );
    }
  };

  return (
    <Box
      role="tabpanel"
      id={`tabpanel-${value}`}
      aria-labelledby={`tab-${value}`}
      sx={{
        width: '100%',
        minHeight: typeof minHeight === 'number' ? `${minHeight}px` : minHeight,
        padding: typeof padding === 'number' ? `${padding}px` : padding,
        display: isActive ? 'block' : 'none',
        opacity: isActive ? 1 : 0,
        transition: `opacity ${animationDuration}ms ease-in-out`,
        '& > div': {
          width: '100%',
          minHeight: 'inherit',
        },
      }}
      hidden={!isActive}
    >
      {animationType === 'none' ? (
        renderContent()
      ) : (
        getAnimationComponent()
      )}
    </Box>
  );
};

export default TabContent;