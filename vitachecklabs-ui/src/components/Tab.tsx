import { 
  Button, 
  Box, 
  Typography, 
  useTheme, 
  alpha,
  Fade 
} from '@mui/material';
import { Link, useLocation } from 'react-router-dom';
import { ReactNode } from 'react';

interface TabProps {
  label: string;
  to: string;
  icon?: ReactNode;
  isActive?: boolean;
  onClick?: () => void;
  disabled?: boolean;
  badge?: number | string;
  variant?: 'primary' | 'secondary' | 'outlined';
  size?: 'small' | 'medium' | 'large';
}

const Tab = ({ 
  label, 
  to, 
  icon, 
  isActive, 
  onClick, 
  disabled = false, 
  badge,
  variant = 'primary',
  size = 'medium'
}: TabProps) => {
  const theme = useTheme();
  const location = useLocation();
  
  // Auto-detect active state if not provided
  const active = isActive !== undefined ? isActive : location.pathname === to || (to === '/lab-tests' && location.pathname === '/');

  const sizeConfig = {
    small: { height: 40, px: 2, fontSize: '0.875rem' },
    medium: { height: 48, px: 3, fontSize: '1rem' },
    large: { height: 56, px: 4, fontSize: '1.125rem' }
  };

  const config = sizeConfig[size];

  const getVariantStyles = () => {
    const baseStyles = {
      height: config.height,
      px: config.px,
      fontSize: config.fontSize,
      textTransform: 'none' as const,
      fontWeight: active ? 600 : 500,
      borderRadius: 2,
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      position: 'relative' as const,
      overflow: 'hidden' as const,
      '&::before': {
        content: '""',
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: active ? 3 : 0,
        backgroundColor: theme.palette.primary.main,
        transition: 'height 0.3s ease',
        borderRadius: '2px 2px 0 0',
      },
      '&:hover::before': {
        height: active ? 3 : 2,
      },
      '&:focus-visible': {
        outline: `2px solid ${theme.palette.primary.main}`,
        outlineOffset: 2,
      },
    };

    switch (variant) {
      case 'primary':
        return {
          ...baseStyles,
          color: active ? theme.palette.primary.main : theme.palette.text.secondary,
          backgroundColor: active ? alpha(theme.palette.primary.main, 0.08) : 'transparent',
          '&:hover': {
            backgroundColor: alpha(theme.palette.primary.main, active ? 0.12 : 0.04),
            color: theme.palette.primary.main,
          },
        };
      case 'secondary':
        return {
          ...baseStyles,
          color: active ? theme.palette.secondary.main : theme.palette.text.secondary,
          backgroundColor: active ? alpha(theme.palette.secondary.main, 0.08) : 'transparent',
          '&:hover': {
            backgroundColor: alpha(theme.palette.secondary.main, active ? 0.12 : 0.04),
            color: theme.palette.secondary.main,
          },
        };
      case 'outlined':
        return {
          ...baseStyles,
          border: `1px solid ${active ? theme.palette.primary.main : theme.palette.divider}`,
          color: active ? theme.palette.primary.main : theme.palette.text.secondary,
          backgroundColor: active ? alpha(theme.palette.primary.main, 0.04) : 'transparent',
          '&:hover': {
            borderColor: theme.palette.primary.main,
            backgroundColor: alpha(theme.palette.primary.main, 0.08),
            color: theme.palette.primary.main,
          },
        };
      default:
        return baseStyles;
    }
  };

  const handleClick = (event: React.MouseEvent) => {
    if (disabled) {
      event.preventDefault();
      return;
    }
    onClick?.();
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (disabled) return;
    
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onClick?.();
    }
  };

  return (
    <Button
      component={Link}
      to={disabled ? '#' : to}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      disabled={disabled}
      sx={getVariantStyles()}
      aria-current={active ? 'page' : undefined}
      role="tab"
      aria-selected={active}
      tabIndex={disabled ? -1 : 0}
    >
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: 1,
        position: 'relative'
      }}>
        {icon && (
          <Fade in={true} timeout={300}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              {icon}
            </Box>
          </Fade>
        )}
        
        <Typography
          variant="inherit"
          component="span"
          sx={{
            fontSize: 'inherit',
            fontWeight: 'inherit',
            lineHeight: 1.2,
          }}
        >
          {label}
        </Typography>
        
        {badge && (
          <Box
            sx={{
              minWidth: 20,
              height: 20,
              borderRadius: '50%',
              backgroundColor: theme.palette.error.main,
              color: theme.palette.error.contrastText,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.75rem',
              fontWeight: 600,
              ml: 0.5,
            }}
          >
            {badge}
          </Box>
        )}
      </Box>
    </Button>
  );
};

export default Tab;