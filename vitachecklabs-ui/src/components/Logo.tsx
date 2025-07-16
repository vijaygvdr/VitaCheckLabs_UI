import { Box, Typography, useTheme } from '@mui/material';
import { LocalHospital } from '@mui/icons-material';

interface LogoProps {
  variant?: 'full' | 'icon' | 'text';
  size?: 'small' | 'medium' | 'large';
  color?: 'primary' | 'secondary' | 'inherit';
}

const Logo = ({ variant = 'full', size = 'medium', color = 'inherit' }: LogoProps) => {
  const theme = useTheme();
  
  const sizeMap = {
    small: { icon: 20, text: 'h6' },
    medium: { icon: 24, text: 'h6' },
    large: { icon: 32, text: 'h5' }
  };

  const iconSize = sizeMap[size].icon;
  const textVariant = sizeMap[size].text as 'h5' | 'h6';

  const getColor = () => {
    switch (color) {
      case 'primary': return theme.palette.primary.main;
      case 'secondary': return theme.palette.secondary.main;
      case 'inherit': return 'inherit';
      default: return 'inherit';
    }
  };

  if (variant === 'icon') {
    return (
      <LocalHospital 
        sx={{ 
          fontSize: iconSize, 
          color: getColor(),
          filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.1))'
        }} 
      />
    );
  }

  if (variant === 'text') {
    return (
      <Typography 
        variant={textVariant} 
        component="div" 
        sx={{ 
          fontWeight: 600,
          color: getColor(),
          letterSpacing: '-0.02em'
        }}
      >
        VitaCheckLabs
      </Typography>
    );
  }

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <LocalHospital 
        sx={{ 
          fontSize: iconSize, 
          color: getColor(),
          filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.1))'
        }} 
      />
      <Typography 
        variant={textVariant} 
        component="div" 
        sx={{ 
          fontWeight: 600,
          color: getColor(),
          letterSpacing: '-0.02em'
        }}
      >
        VitaCheckLabs
      </Typography>
    </Box>
  );
};

export default Logo;