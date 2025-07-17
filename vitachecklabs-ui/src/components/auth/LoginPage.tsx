// Login Page Component

import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Alert,
  IconButton,
  InputAdornment,
  Checkbox,
  FormControlLabel,
  Divider,
  CircularProgress,
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  Login as LoginIcon,
  Email,
  Lock,
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
    .required('Username or email is required')
    .min(3, 'Username must be at least 3 characters'),
  password: yup
    .string()
    .required('Password is required')
    .min(6, 'Password must be at least 6 characters'),
  rememberMe: yup.boolean(),
});

type LoginFormData = yup.InferType<typeof loginSchema>;

interface LoginPageProps {
  redirectTo?: string;
  onLoginSuccess?: (user: any) => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ 
  redirectTo = '/lab-tests', 
  onLoginSuccess 
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, state: authState, clearError } = useAuth();
  
  const [showPassword, setShowPassword] = useState(false);
  const [loginAttempts, setLoginAttempts] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const [lockoutTime, setLockoutTime] = useState(0);

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
      rememberMe: false,
    },
  });

  // Handle lockout timer
  useEffect(() => {
    if (lockoutTime > 0) {
      const timer = setTimeout(() => {
        setLockoutTime(lockoutTime - 1);
        if (lockoutTime === 1) {
          setIsLocked(false);
          setLoginAttempts(0);
        }
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [lockoutTime]);

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
    if (isLocked) return;

    try {
      const loginData: UserLogin = {
        username: data.username,
        password: data.password,
      };

      const user = await login(loginData);
      
      // Store remember me preference
      if (data.rememberMe) {
        localStorage.setItem('vitacheck_remember_me', 'true');
      } else {
        localStorage.removeItem('vitacheck_remember_me');
      }

      // Reset form and attempts
      reset();
      setLoginAttempts(0);
      
      // Call success callback
      if (onLoginSuccess) {
        onLoginSuccess(user);
      }

      // Navigate to intended destination
      navigate(from, { replace: true });
      
    } catch (error: any) {
      // Handle failed login attempts
      const newAttempts = loginAttempts + 1;
      setLoginAttempts(newAttempts);

      // Lock account after 5 failed attempts
      if (newAttempts >= 5) {
        setIsLocked(true);
        setLockoutTime(300); // 5 minutes lockout
      }

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

  // Handle forgot password
  const handleForgotPassword = () => {
    navigate('/auth/forgot-password');
  };

  // Handle register navigation
  const handleRegisterNavigation = () => {
    navigate('/auth/register', { state: { from: location.state?.from } });
  };

  // Format lockout time
  const formatLockoutTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'background.default',
        padding: 2,
      }}
    >
      <Card
        sx={{
          maxWidth: 400,
          width: '100%',
          boxShadow: 3,
        }}
      >
        <CardContent sx={{ padding: 4 }}>
          {/* Header */}
          <Box sx={{ textAlign: 'center', marginBottom: 3 }}>
            <LoginIcon 
              sx={{ 
                fontSize: 48, 
                color: 'primary.main', 
                marginBottom: 1 
              }} 
            />
            <Typography variant="h4" component="h1" gutterBottom>
              Welcome Back
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Sign in to your VitaCheckLabs account
            </Typography>
          </Box>

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

          {/* Lockout Warning */}
          {isLocked && (
            <Alert severity="warning" sx={{ marginBottom: 2 }}>
              Account temporarily locked due to multiple failed attempts. 
              Please try again in {formatLockoutTime(lockoutTime)}.
            </Alert>
          )}

          {/* Login Attempts Warning */}
          {loginAttempts >= 3 && !isLocked && (
            <Alert severity="warning" sx={{ marginBottom: 2 }}>
              {5 - loginAttempts} attempts remaining before account lockout.
            </Alert>
          )}

          {/* Login Form */}
          <Box component="form" onSubmit={handleSubmit(onSubmit)}>
            {/* Username Field */}
            <Controller
              name="username"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  label="Username or Email"
                  variant="outlined"
                  margin="normal"
                  error={!!errors.username}
                  helperText={errors.username?.message}
                  disabled={isSubmitting || isLocked}
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
            <Controller
              name="password"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  label="Password"
                  type={showPassword ? 'text' : 'password'}
                  variant="outlined"
                  margin="normal"
                  error={!!errors.password}
                  helperText={errors.password?.message}
                  disabled={isSubmitting || isLocked}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Lock color="action" />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={handleTogglePasswordVisibility}
                          edge="end"
                          disabled={isSubmitting || isLocked}
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

            {/* Remember Me */}
            <Controller
              name="rememberMe"
              control={control}
              render={({ field }) => (
                <FormControlLabel
                  control={
                    <Checkbox
                      {...field}
                      checked={field.value}
                      disabled={isSubmitting || isLocked}
                      color="primary"
                    />
                  }
                  label="Remember me"
                  sx={{ marginTop: 1, marginBottom: 2 }}
                />
              )}
            />

            {/* Submit Button */}
            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={isSubmitting || isLocked}
              sx={{ marginTop: 2, marginBottom: 2 }}
              startIcon={
                isSubmitting ? (
                  <CircularProgress size={20} color="inherit" />
                ) : (
                  <LoginIcon />
                )
              }
            >
              {isSubmitting ? 'Signing In...' : 'Sign In'}
            </Button>

            {/* Forgot Password Link */}
            <Box sx={{ textAlign: 'center', marginBottom: 2 }}>
              <Button
                variant="text"
                onClick={handleForgotPassword}
                disabled={isSubmitting}
                size="small"
              >
                Forgot your password?
              </Button>
            </Box>

            <Divider sx={{ marginY: 2 }}>
              <Typography variant="body2" color="text.secondary">
                OR
              </Typography>
            </Divider>

            {/* Register Link */}
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                Don't have an account?{' '}
                <Button
                  variant="text"
                  onClick={handleRegisterNavigation}
                  disabled={isSubmitting}
                  size="small"
                  sx={{ textTransform: 'none' }}
                >
                  Create Account
                </Button>
              </Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default LoginPage;