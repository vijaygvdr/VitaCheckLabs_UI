// Register Page Component

import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
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
  Stepper,
  Step,
  StepLabel,
  Grid,
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  PersonAdd,
  Email,
  Lock,
  Person,
  Phone,
} from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useAuth } from '../../contexts/AuthContext';
import { UserRegister } from '../../types/api';
import { errorHandler } from '../../services/api';

// Form validation schema
const registerSchema = yup.object({
  username: yup
    .string()
    .required('Username is required')
    .min(3, 'Username must be at least 3 characters')
    .max(50, 'Username must be less than 50 characters')
    .matches(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
  email: yup
    .string()
    .required('Email is required')
    .email('Please enter a valid email address'),
  password: yup
    .string()
    .required('Password is required')
    .min(8, 'Password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  confirmPassword: yup
    .string()
    .required('Please confirm your password')
    .oneOf([yup.ref('password')], 'Passwords must match'),
  firstName: yup
    .string()
    .required('First name is required')
    .min(2, 'First name must be at least 2 characters')
    .max(50, 'First name must be less than 50 characters'),
  lastName: yup
    .string()
    .required('Last name is required')
    .min(2, 'Last name must be at least 2 characters')
    .max(50, 'Last name must be less than 50 characters'),
  phoneNumber: yup
    .string()
    .matches(/^\+?[\d\s\-\(\)]+$/, 'Please enter a valid phone number')
    .min(10, 'Phone number must be at least 10 digits'),
  agreeToTerms: yup
    .boolean()
    .oneOf([true], 'You must agree to the terms and conditions'),
  agreeToPrivacy: yup
    .boolean()
    .oneOf([true], 'You must agree to the privacy policy'),
  marketingEmails: yup.boolean(),
});

type RegisterFormData = yup.InferType<typeof registerSchema>;

interface RegisterPageProps {
  redirectTo?: string;
  onRegisterSuccess?: (user: any) => void;
}

const steps = ['Account Info', 'Personal Info', 'Terms & Privacy'];

const RegisterPage: React.FC<RegisterPageProps> = ({
  redirectTo = '/lab-tests',
  onRegisterSuccess,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { register, state: authState, clearError } = useAuth();

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [emailAvailable, setEmailAvailable] = useState<boolean | null>(null);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);

  // Get redirect path from location state or default
  const from = (location.state as any)?.from?.pathname || redirectTo;

  // Form setup
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting, isValid },
    reset,
    setError,
    watch,
    trigger,
  } = useForm<RegisterFormData>({
    resolver: yupResolver(registerSchema),
    defaultValues: {
      username: '',
      email: '',
      password: '',
      confirmPassword: '',
      firstName: '',
      lastName: '',
      phoneNumber: '',
      agreeToTerms: false,
      agreeToPrivacy: false,
      marketingEmails: false,
    },
    mode: 'onChange',
  });

  // Watch form values for step validation
  const watchedFields = watch();

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

  // Check if current step is valid
  const isStepValid = async (step: number): Promise<boolean> => {
    switch (step) {
      case 0:
        return await trigger(['username', 'email', 'password', 'confirmPassword']);
      case 1:
        return await trigger(['firstName', 'lastName', 'phoneNumber']);
      case 2:
        return await trigger(['agreeToTerms', 'agreeToPrivacy']);
      default:
        return false;
    }
  };

  // Handle next step
  const handleNext = async () => {
    const valid = await isStepValid(activeStep);
    if (valid && activeStep < steps.length - 1) {
      setActiveStep(activeStep + 1);
    }
  };

  // Handle previous step
  const handleBack = () => {
    if (activeStep > 0) {
      setActiveStep(activeStep - 1);
    }
  };

  // Handle form submission
  const onSubmit = async (data: RegisterFormData) => {
    try {
      const registerData: UserRegister = {
        username: data.username,
        email: data.email,
        password: data.password,
        first_name: data.firstName,
        last_name: data.lastName,
        phone_number: data.phoneNumber,
      };

      const user = await register(registerData);

      // Reset form
      reset();

      // Call success callback
      if (onRegisterSuccess) {
        onRegisterSuccess(user);
      }

      // Navigate to intended destination
      navigate(from, { replace: true });
    } catch (error: any) {
      // Handle specific error types
      if (errorHandler.isValidationError(error)) {
        const validationErrors = errorHandler.getValidationErrors(error);
        Object.entries(validationErrors).forEach(([field, messages]) => {
          setError(field as keyof RegisterFormData, {
            type: 'manual',
            message: messages[0],
          });
        });
        // Go back to relevant step based on error
        if (validationErrors.username || validationErrors.email || validationErrors.password) {
          setActiveStep(0);
        } else if (validationErrors.firstName || validationErrors.lastName || validationErrors.phoneNumber) {
          setActiveStep(1);
        }
      }
    }
  };

  // Toggle password visibility
  const handleTogglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  // Toggle confirm password visibility
  const handleToggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  // Handle login navigation
  const handleLoginNavigation = () => {
    navigate('/auth/login', { state: { from: location.state?.from } });
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

  const passwordStrength = getPasswordStrength(watchedFields.password);

  // Render step content
  const renderStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <Grid container spacing={2}>
            {/* Username Field */}
            <Grid item xs={12}>
              <Controller
                name="username"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Username"
                    variant="outlined"
                    error={!!errors.username}
                    helperText={errors.username?.message}
                    disabled={isSubmitting}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Person color="action" />
                        </InputAdornment>
                      ),
                    }}
                    autoComplete="username"
                  />
                )}
              />
            </Grid>

            {/* Email Field */}
            <Grid item xs={12}>
              <Controller
                name="email"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Email Address"
                    type="email"
                    variant="outlined"
                    error={!!errors.email}
                    helperText={errors.email?.message}
                    disabled={isSubmitting}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Email color="action" />
                        </InputAdornment>
                      ),
                    }}
                    autoComplete="email"
                  />
                )}
              />
            </Grid>

            {/* Password Field */}
            <Grid item xs={12}>
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
                    error={!!errors.password}
                    helperText={errors.password?.message}
                    disabled={isSubmitting}
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
                            disabled={isSubmitting}
                          >
                            {showPassword ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                    autoComplete="new-password"
                  />
                )}
              />
              {/* Password Strength Indicator */}
              {watchedFields.password && (
                <Box sx={{ mt: 1 }}>
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
            </Grid>

            {/* Confirm Password Field */}
            <Grid item xs={12}>
              <Controller
                name="confirmPassword"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Confirm Password"
                    type={showConfirmPassword ? 'text' : 'password'}
                    variant="outlined"
                    error={!!errors.confirmPassword}
                    helperText={errors.confirmPassword?.message}
                    disabled={isSubmitting}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Lock color="action" />
                        </InputAdornment>
                      ),
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            onClick={handleToggleConfirmPasswordVisibility}
                            edge="end"
                            disabled={isSubmitting}
                          >
                            {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                    autoComplete="new-password"
                  />
                )}
              />
            </Grid>
          </Grid>
        );

      case 1:
        return (
          <Grid container spacing={2}>
            {/* First Name Field */}
            <Grid item xs={12} sm={6}>
              <Controller
                name="firstName"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="First Name"
                    variant="outlined"
                    error={!!errors.firstName}
                    helperText={errors.firstName?.message}
                    disabled={isSubmitting}
                    autoComplete="given-name"
                  />
                )}
              />
            </Grid>

            {/* Last Name Field */}
            <Grid item xs={12} sm={6}>
              <Controller
                name="lastName"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Last Name"
                    variant="outlined"
                    error={!!errors.lastName}
                    helperText={errors.lastName?.message}
                    disabled={isSubmitting}
                    autoComplete="family-name"
                  />
                )}
              />
            </Grid>

            {/* Phone Number Field */}
            <Grid item xs={12}>
              <Controller
                name="phoneNumber"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Phone Number (Optional)"
                    variant="outlined"
                    error={!!errors.phoneNumber}
                    helperText={errors.phoneNumber?.message || 'We may use this to contact you about your tests'}
                    disabled={isSubmitting}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Phone color="action" />
                        </InputAdornment>
                      ),
                    }}
                    autoComplete="tel"
                  />
                )}
              />
            </Grid>
          </Grid>
        );

      case 2:
        return (
          <Grid container spacing={2}>
            {/* Terms Agreement */}
            <Grid item xs={12}>
              <Controller
                name="agreeToTerms"
                control={control}
                render={({ field }) => (
                  <FormControlLabel
                    control={
                      <Checkbox
                        {...field}
                        checked={field.value}
                        disabled={isSubmitting}
                        color="primary"
                      />
                    }
                    label={
                      <Typography variant="body2">
                        I agree to the{' '}
                        <Button
                          variant="text"
                          size="small"
                          sx={{ textTransform: 'none', p: 0, minWidth: 'auto' }}
                          onClick={() => window.open('/terms', '_blank')}
                        >
                          Terms and Conditions
                        </Button>
                      </Typography>
                    }
                  />
                )}
              />
              {errors.agreeToTerms && (
                <Typography color="error" variant="caption" sx={{ ml: 4 }}>
                  {errors.agreeToTerms.message}
                </Typography>
              )}
            </Grid>

            {/* Privacy Agreement */}
            <Grid item xs={12}>
              <Controller
                name="agreeToPrivacy"
                control={control}
                render={({ field }) => (
                  <FormControlLabel
                    control={
                      <Checkbox
                        {...field}
                        checked={field.value}
                        disabled={isSubmitting}
                        color="primary"
                      />
                    }
                    label={
                      <Typography variant="body2">
                        I agree to the{' '}
                        <Button
                          variant="text"
                          size="small"
                          sx={{ textTransform: 'none', p: 0, minWidth: 'auto' }}
                          onClick={() => window.open('/privacy', '_blank')}
                        >
                          Privacy Policy
                        </Button>
                      </Typography>
                    }
                  />
                )}
              />
              {errors.agreeToPrivacy && (
                <Typography color="error" variant="caption" sx={{ ml: 4 }}>
                  {errors.agreeToPrivacy.message}
                </Typography>
              )}
            </Grid>

            {/* Marketing Emails */}
            <Grid item xs={12}>
              <Controller
                name="marketingEmails"
                control={control}
                render={({ field }) => (
                  <FormControlLabel
                    control={
                      <Checkbox
                        {...field}
                        checked={field.value}
                        disabled={isSubmitting}
                        color="primary"
                      />
                    }
                    label={
                      <Typography variant="body2">
                        I would like to receive marketing emails about new tests and promotions (optional)
                      </Typography>
                    }
                  />
                )}
              />
            </Grid>
          </Grid>
        );

      default:
        return null;
    }
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
          maxWidth: 600,
          width: '100%',
          boxShadow: 3,
        }}
      >
        <CardContent sx={{ padding: 4 }}>
          {/* Header */}
          <Box sx={{ textAlign: 'center', marginBottom: 3 }}>
            <PersonAdd
              sx={{
                fontSize: 48,
                color: 'primary.main',
                marginBottom: 1,
              }}
            />
            <Typography variant="h4" component="h1" gutterBottom>
              Create Account
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Join VitaCheckLabs for comprehensive lab testing
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

          {/* Registration Form */}
          <Box component="form" onSubmit={handleSubmit(onSubmit)}>
            {/* Step Content */}
            <Box sx={{ marginBottom: 3 }}>
              {renderStepContent(activeStep)}
            </Box>

            {/* Navigation Buttons */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
              <Button
                onClick={handleBack}
                disabled={activeStep === 0 || isSubmitting}
              >
                Back
              </Button>
              
              <Box sx={{ display: 'flex', gap: 1 }}>
                {activeStep < steps.length - 1 ? (
                  <Button
                    variant="contained"
                    onClick={handleNext}
                    disabled={isSubmitting}
                  >
                    Next
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    variant="contained"
                    disabled={isSubmitting || !isValid}
                    startIcon={
                      isSubmitting ? (
                        <CircularProgress size={20} color="inherit" />
                      ) : (
                        <PersonAdd />
                      )
                    }
                  >
                    {isSubmitting ? 'Creating Account...' : 'Create Account'}
                  </Button>
                )}
              </Box>
            </Box>

            <Divider sx={{ marginY: 2 }}>
              <Typography variant="body2" color="text.secondary">
                OR
              </Typography>
            </Divider>

            {/* Login Link */}
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                Already have an account?{' '}
                <Button
                  variant="text"
                  onClick={handleLoginNavigation}
                  disabled={isSubmitting}
                  size="small"
                  sx={{ textTransform: 'none' }}
                >
                  Sign In
                </Button>
              </Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default RegisterPage;