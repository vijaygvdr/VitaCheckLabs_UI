// Login Page Component

import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import {
  Box,
  TextField,
  Button,
  Typography,
  Alert,
  IconButton,
  InputAdornment,
  Container,
  Grid,
  CircularProgress,
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  Email,
} from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useAuth } from '../../contexts/AuthContext';
import { UserLogin } from '../../types/api';
import { errorHandler } from '../../services/api';

// Form validation schema
const loginSchema = yup.object({
  username: yup
    .string()
    .required('Username is required')
    .min(3, 'Username must be at least 3 characters'),
  password: yup
    .string()
    .required('Password is required')
    .min(6, 'Password must be at least 6 characters'),
});

type LoginFormData = yup.InferType<typeof loginSchema>;

interface LoginPageProps {
  redirectTo?: string;
  onLoginSuccess?: (user: any) => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ 
  redirectTo = '/home', 
  onLoginSuccess 
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, state: authState, clearError } = useAuth();
  
  const [showPassword, setShowPassword] = useState(false);

  // Get redirect path from location state or default
  const from = (location.state as any)?.from?.pathname || redirectTo;

  // Form setup
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setError,
  } = useForm<LoginFormData>({
    resolver: yupResolver(loginSchema),
    defaultValues: {
      username: '',
      password: '',
    },
  });

  // Clear errors when component mounts
  useEffect(() => {
    clearError();
  }, [clearError]);

  // Redirect if already authenticated
  useEffect(() => {
    if (authState.isAuthenticated) {
      navigate(from, { replace: true });
    }
  }, [authState.isAuthenticated, navigate, from]);

  // Handle form submission
  const onSubmit = async (data: LoginFormData) => {
    try {
      const loginData: UserLogin = {
        username: data.username,
        password: data.password,
      };

      const user = await login(loginData);
      
      // Reset form
      reset();
      
      // Call success callback
      if (onLoginSuccess) {
        onLoginSuccess(user);
      }

      // Navigate to home page after successful login
      navigate('/home', { replace: true });
      
    } catch (error: any) {
      // Handle specific error types
      if (errorHandler.isAuthError(error)) {
        setError('username', { 
          type: 'manual', 
          message: 'Invalid username or password' 
        });
        setError('password', { 
          type: 'manual', 
          message: 'Invalid username or password' 
        });
      } else if (errorHandler.isValidationError(error)) {
        const validationErrors = errorHandler.getValidationErrors(error);
        Object.entries(validationErrors).forEach(([field, messages]) => {
          setError(field as keyof LoginFormData, {
            type: 'manual',
            message: messages[0],
          });
        });
      }
    }
  };

  // Toggle password visibility
  const handleTogglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  // Handle register navigation
  const handleRegisterNavigation = () => {
    navigate('/auth/register', { state: { from: location.state?.from } });
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        height: '100vh',
        width: '100vw',
        backgroundColor: '#f8f9fa',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        margin: 0,
        padding: 0
      }}
    >
      <Grid container sx={{ height: '100%', width: '100%', maxWidth: '1200px' }}>
        {/* Left Side - Branding */}
        <Grid 
          item 
          xs={12} 
          md={6} 
          sx={{ 
            display: 'flex', 
            flexDirection: 'column', 
            justifyContent: 'center',
            alignItems: 'center',
            px: { xs: 4, md: 6 },
            textAlign: 'center',
            backgroundColor: '#f8f9fa'
          }}
        >
          {/* Logo */}
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 4 }}>
            <Box
              component="img"
              src="/images/VitaCheckLabsIcon.png"
              alt="VitaCheckLabs"
              sx={{
                width: 40,
                height: 40,
                mr: 2,
              }}
            />
            <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#1f2937' }}>
              VitaCheckLabs
            </Typography>
          </Box>

          <Typography 
            variant="h2" 
            sx={{ 
              fontWeight: 'bold',
              color: '#1f2937',
              mb: 3,
              fontSize: { xs: '2rem', md: '3rem' }
            }}
          >
            Medical Lab Tests
          </Typography>

          <Typography 
            variant="body1" 
            sx={{ 
              color: '#6b7280',
              mb: 4,
              maxWidth: '400px'
            }}
          >
            Lorem ipsum dolor sit amet, consectetur adipiscing elit, 
            sed do eiusmod tempor incididunt ut labore et dolore magna 
            aliqua.
          </Typography>

          {/* Medical Illustration */}
          <Box
            sx={{
              width: '100%',
              maxWidth: '400px',
              height: '300px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Box
              component="img"
              src="/images/Login_Image.png"
              alt="Medical Lab Tests"
              sx={{
                width: '100%',
                height: '100%',
                objectFit: 'contain',
              }}
            />
          </Box>
        </Grid>

        {/* Right Side - Login Form */}
        <Grid 
          item 
          xs={12} 
          md={6} 
          sx={{ 
            display: 'flex', 
            flexDirection: 'column', 
            justifyContent: 'center',
            alignItems: 'center',
            px: { xs: 4, md: 6 },
            backgroundColor: '#f8f9fa'
          }}
        >
          <Box
            sx={{
              width: '100%',
              maxWidth: '400px',
              backgroundColor: 'white',
              borderRadius: '16px',
              p: 4,
              boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
            }}
          >
              <Typography 
                variant="h4" 
                sx={{ 
                  fontWeight: 'bold',
                  color: '#1f2937',
                  mb: 4,
                  textAlign: 'center'
                }}
              >
                Log In
              </Typography>

              {/* Error Display */}
              {authState.error && (
                <Alert 
                  severity="error" 
                  sx={{ marginBottom: 2 }}
                  onClose={clearError}
                >
                  {errorHandler.getErrorMessage(authState.error)}
                </Alert>
              )}

              {/* Login Form */}
              <Box component="form" onSubmit={handleSubmit(onSubmit)}>
                {/* Username Field */}
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  Username
                </Typography>
                <Controller
                  name="username"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      placeholder="Enter your username"
                      variant="outlined"
                      error={!!errors.username}
                      helperText={errors.username?.message}
                      disabled={isSubmitting}
                      sx={{ 
                        mb: 3,
                        '& .MuiOutlinedInput-root': {
                          borderRadius: '8px',
                          backgroundColor: '#f8f9fa'
                        }
                      }}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <Email color="action" />
                          </InputAdornment>
                        ),
                      }}
                      autoComplete="username"
                      autoFocus
                    />
                  )}
                />

                {/* Password Field */}
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  Password
                </Typography>
                <Controller
                  name="password"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      placeholder="••••••••"
                      type={showPassword ? 'text' : 'password'}
                      variant="outlined"
                      error={!!errors.password}
                      helperText={errors.password?.message}
                      disabled={isSubmitting}
                      sx={{ 
                        mb: 2,
                        '& .MuiOutlinedInput-root': {
                          borderRadius: '8px',
                          backgroundColor: '#f8f9fa'
                        }
                      }}
                      InputProps={{
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton
                              onClick={handleTogglePasswordVisibility}
                              edge="end"
                              disabled={isSubmitting}
                            >
                              {showPassword ? <VisibilityOff /> : <Visibility />}
                            </IconButton>
                          </InputAdornment>
                        ),
                      }}
                      autoComplete="current-password"
                    />
                  )}
                />

                <Box sx={{ textAlign: 'right', mb: 3 }}>
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      color: '#3b82f6', 
                      cursor: 'pointer',
                      '&:hover': {
                        textDecoration: 'underline'
                      }
                    }}
                  >
                    Forgot password?
                  </Typography>
                </Box>

                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  size="large"
                  disabled={isSubmitting}
                  sx={{
                    mb: 3,
                    py: 1.5,
                    backgroundColor: '#3b82f6',
                    borderRadius: '8px',
                    textTransform: 'none',
                    fontSize: '16px',
                    fontWeight: '600',
                    '&:hover': {
                      backgroundColor: '#2563eb',
                    }
                  }}
                  startIcon={
                    isSubmitting ? (
                      <CircularProgress size={20} color="inherit" />
                    ) : null
                  }
                >
                  {isSubmitting ? 'Logging In...' : 'Log In'}
                </Button>

                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="body2" color="text.secondary">
                    Don't have an account?{' '}
                    <Typography
                      component="span"
                      sx={{ 
                        color: '#3b82f6', 
                        cursor: 'pointer',
                        fontWeight: '500',
                        '&:hover': {
                          textDecoration: 'underline'
                        }
                      }}
                      onClick={handleRegisterNavigation}
                    >
                      Sign Up
                    </Typography>
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Grid>
        </Grid>
    </Box>
  );
};

export default LoginPage;