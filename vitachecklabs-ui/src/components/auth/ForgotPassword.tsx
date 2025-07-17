// Forgot Password Component

import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Alert,
  InputAdornment,
  CircularProgress,
  Stepper,
  Step,
  StepLabel,
  Divider,
} from '@mui/material';
import {
  Email,
  Lock,
  VpnKey,
  ArrowBack,
  Send,
  Check,
} from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { authService } from '../../services/authService';
import { errorHandler } from '../../services/api';

// Email validation schema
const emailSchema = yup.object({
  email: yup
    .string()
    .required('Email is required')
    .email('Please enter a valid email address'),
});

// Reset validation schema
const resetSchema = yup.object({
  token: yup
    .string()
    .required('Reset code is required')
    .min(6, 'Reset code must be 6 characters')
    .max(6, 'Reset code must be 6 characters'),
  newPassword: yup
    .string()
    .required('New password is required')
    .min(8, 'Password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  confirmPassword: yup
    .string()
    .required('Please confirm your new password')
    .oneOf([yup.ref('newPassword')], 'Passwords must match'),
});

type EmailFormData = yup.InferType<typeof emailSchema>;
type ResetFormData = yup.InferType<typeof resetSchema>;

const steps = ['Enter Email', 'Check Email', 'Reset Password'];

const ForgotPassword: React.FC = () => {
  const navigate = useNavigate();
  
  const [activeStep, setActiveStep] = useState(0);
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);

  // Email form
  const emailForm = useForm<EmailFormData>({
    resolver: yupResolver(emailSchema),
    defaultValues: {
      email: '',
    },
  });

  // Reset form
  const resetForm = useForm<ResetFormData>({
    resolver: yupResolver(resetSchema),
    defaultValues: {
      token: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  // Handle resend cooldown timer
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  // Clear messages on mount
  useEffect(() => {
    setError(null);
    setSuccessMessage(null);
  }, []);

  // Handle email submission
  const onEmailSubmit = async (data: EmailFormData) => {
    try {
      setError(null);
      setIsSubmitting(true);
      
      await authService.forgotPassword(data.email);
      
      setEmail(data.email);
      setActiveStep(1);
      setSuccessMessage(`Reset code sent to ${data.email}`);
      setResendCooldown(60); // 60 seconds cooldown
      
    } catch (error: any) {
      setError(errorHandler.getErrorMessage(error));
      
      if (errorHandler.isValidationError(error)) {
        const validationErrors = errorHandler.getValidationErrors(error);
        Object.entries(validationErrors).forEach(([field, messages]) => {
          emailForm.setError(field as keyof EmailFormData, {
            type: 'manual',
            message: messages[0],
          });
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle reset submission
  const onResetSubmit = async (data: ResetFormData) => {
    try {
      setError(null);
      setIsSubmitting(true);
      
      await authService.resetPassword({
        email,
        token: data.token,
        newPassword: data.newPassword,
      });
      
      setActiveStep(2);
      setSuccessMessage('Password reset successfully! You can now log in with your new password.');
      
      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate('/auth/login');
      }, 3000);
      
    } catch (error: any) {
      setError(errorHandler.getErrorMessage(error));
      
      if (errorHandler.isValidationError(error)) {
        const validationErrors = errorHandler.getValidationErrors(error);
        Object.entries(validationErrors).forEach(([field, messages]) => {
          resetForm.setError(field as keyof ResetFormData, {
            type: 'manual',
            message: messages[0],
          });
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle resend code
  const handleResendCode = async () => {
    try {
      setError(null);
      setIsSubmitting(true);
      
      await authService.forgotPassword(email);
      
      setSuccessMessage(`Reset code resent to ${email}`);
      setResendCooldown(60);
      
    } catch (error: any) {
      setError(errorHandler.getErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle back to email step
  const handleBackToEmail = () => {
    setActiveStep(0);
    setError(null);
    setSuccessMessage(null);
    resetForm.reset();
  };

  // Handle back to login
  const handleBackToLogin = () => {
    navigate('/auth/login');
  };

  // Check password strength
  const getPasswordStrength = (password: string): { strength: number; label: string; color: string } => {
    if (!password) return { strength: 0, label: 'Enter password', color: 'grey' };
    
    let score = 0;
    if (password.length >= 8) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/\d/.test(password)) score++;
    if (/[^a-zA-Z\d]/.test(password)) score++;

    if (score <= 2) return { strength: score * 20, label: 'Weak', color: 'error.main' };
    if (score <= 3) return { strength: score * 20, label: 'Fair', color: 'warning.main' };
    if (score <= 4) return { strength: score * 20, label: 'Good', color: 'info.main' };
    return { strength: 100, label: 'Strong', color: 'success.main' };
  };

  const passwordStrength = getPasswordStrength(resetForm.watch('newPassword'));

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
          maxWidth: 500,
          width: '100%',
          boxShadow: 3,
        }}
      >
        <CardContent sx={{ padding: 4 }}>
          {/* Header */}
          <Box sx={{ textAlign: 'center', marginBottom: 3 }}>
            <VpnKey
              sx={{
                fontSize: 48,
                color: 'primary.main',
                marginBottom: 1,
              }}
            />
            <Typography variant="h4" component="h1" gutterBottom>
              Reset Password
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {activeStep === 0 && "Enter your email address to receive a reset code"}
              {activeStep === 1 && "Check your email and enter the reset code"}
              {activeStep === 2 && "Password reset successfully!"}
            </Typography>
          </Box>

          {/* Progress Stepper */}
          <Stepper activeStep={activeStep} sx={{ marginBottom: 3 }}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>

          {/* Success/Error Messages */}
          {successMessage && (
            <Alert severity="success" sx={{ marginBottom: 2 }}>
              {successMessage}
            </Alert>
          )}

          {error && (
            <Alert severity="error" sx={{ marginBottom: 2 }}>
              {error}
            </Alert>
          )}

          {/* Step 0: Email Input */}
          {activeStep === 0 && (
            <Box component="form" onSubmit={emailForm.handleSubmit(onEmailSubmit)}>
              <Controller
                name="email"
                control={emailForm.control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Email Address"
                    type="email"
                    variant="outlined"
                    margin="normal"
                    error={!!emailForm.formState.errors.email}
                    helperText={emailForm.formState.errors.email?.message}
                    disabled={isSubmitting}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Email color="action" />
                        </InputAdornment>
                      ),
                    }}
                    autoComplete="email"
                    autoFocus
                  />
                )}
              />

              <Button
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                disabled={isSubmitting}
                sx={{ marginTop: 2, marginBottom: 2 }}
                startIcon={
                  isSubmitting ? (
                    <CircularProgress size={20} color="inherit" />
                  ) : (
                    <Send />
                  )
                }
              >
                {isSubmitting ? 'Sending...' : 'Send Reset Code'}
              </Button>
            </Box>
          )}

          {/* Step 1: Reset Code and New Password */}
          {activeStep === 1 && (
            <Box component="form" onSubmit={resetForm.handleSubmit(onResetSubmit)}>
              <Controller
                name="token"
                control={resetForm.control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Reset Code"
                    variant="outlined"
                    margin="normal"
                    error={!!resetForm.formState.errors.token}
                    helperText={resetForm.formState.errors.token?.message || 'Enter the 6-digit code sent to your email'}
                    disabled={isSubmitting}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <VpnKey color="action" />
                        </InputAdornment>
                      ),
                    }}
                    inputProps={{
                      maxLength: 6,
                      style: { textAlign: 'center', fontSize: '1.2rem', letterSpacing: '0.5rem' },
                    }}
                    autoFocus
                  />
                )}
              />

              <Controller
                name="newPassword"
                control={resetForm.control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="New Password"
                    type="password"
                    variant="outlined"
                    margin="normal"
                    error={!!resetForm.formState.errors.newPassword}
                    helperText={resetForm.formState.errors.newPassword?.message}
                    disabled={isSubmitting}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Lock color="action" />
                        </InputAdornment>
                      ),
                    }}
                    autoComplete="new-password"
                  />
                )}
              />

              {/* Password Strength Indicator */}
              {resetForm.watch('newPassword') && (
                <Box sx={{ mt: 1, mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box
                      sx={{
                        height: 4,
                        flexGrow: 1,
                        backgroundColor: 'grey.300',
                        borderRadius: 2,
                        overflow: 'hidden',
                      }}
                    >
                      <Box
                        sx={{
                          height: '100%',
                          width: `${passwordStrength.strength}%`,
                          backgroundColor: passwordStrength.color,
                          transition: 'width 0.3s ease',
                        }}
                      />
                    </Box>
                    <Typography variant="caption" sx={{ color: passwordStrength.color }}>
                      {passwordStrength.label}
                    </Typography>
                  </Box>
                </Box>
              )}

              <Controller
                name="confirmPassword"
                control={resetForm.control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Confirm New Password"
                    type="password"
                    variant="outlined"
                    margin="normal"
                    error={!!resetForm.formState.errors.confirmPassword}
                    helperText={resetForm.formState.errors.confirmPassword?.message}
                    disabled={isSubmitting}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Lock color="action" />
                        </InputAdornment>
                      ),
                    }}
                    autoComplete="new-password"
                  />
                )}
              />

              <Button
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                disabled={isSubmitting}
                sx={{ marginTop: 2, marginBottom: 2 }}
                startIcon={
                  isSubmitting ? (
                    <CircularProgress size={20} color="inherit" />
                  ) : (
                    <Lock />
                  )
                }
              >
                {isSubmitting ? 'Resetting...' : 'Reset Password'}
              </Button>

              {/* Resend Code */}
              <Box sx={{ textAlign: 'center', marginBottom: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Didn't receive the code?{' '}
                  {resendCooldown > 0 ? (
                    <Typography component="span" variant="body2" color="text.disabled">
                      Resend in {resendCooldown}s
                    </Typography>
                  ) : (
                    <Button
                      variant="text"
                      onClick={handleResendCode}
                      disabled={isSubmitting}
                      size="small"
                      sx={{ textTransform: 'none' }}
                    >
                      Resend Code
                    </Button>
                  )}
                </Typography>
              </Box>

              {/* Back to Email */}
              <Box sx={{ textAlign: 'center' }}>
                <Button
                  variant="text"
                  onClick={handleBackToEmail}
                  disabled={isSubmitting}
                  size="small"
                  startIcon={<ArrowBack />}
                  sx={{ textTransform: 'none' }}
                >
                  Change Email Address
                </Button>
              </Box>
            </Box>
          )}

          {/* Step 2: Success */}
          {activeStep === 2 && (
            <Box sx={{ textAlign: 'center' }}>
              <Check
                sx={{
                  fontSize: 64,
                  color: 'success.main',
                  marginBottom: 2,
                }}
              />
              <Typography variant="h6" gutterBottom>
                Password Reset Complete!
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Your password has been successfully updated. You will be redirected to the login page in a few seconds.
              </Typography>
              <Button
                variant="contained"
                onClick={handleBackToLogin}
                startIcon={<ArrowBack />}
              >
                Go to Login
              </Button>
            </Box>
          )}

          {/* Navigation Links */}
          {activeStep < 2 && (
            <>
              <Divider sx={{ marginY: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  OR
                </Typography>
              </Divider>

              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  Remember your password?{' '}
                  <Button
                    component={Link}
                    to="/auth/login"
                    variant="text"
                    size="small"
                    sx={{ textTransform: 'none' }}
                  >
                    Sign In
                  </Button>
                </Typography>
              </Box>
            </>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default ForgotPassword;