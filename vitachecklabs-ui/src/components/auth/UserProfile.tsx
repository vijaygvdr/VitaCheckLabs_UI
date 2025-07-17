// User Profile Management Component

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  TextField,
  Button,
  Typography,
  Alert,
  IconButton,
  InputAdornment,
  Divider,
  CircularProgress,
  Grid,
  Avatar,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Switch,
  FormControlLabel,
} from '@mui/material';
import {
  Edit,
  Save,
  Cancel,
  Person,
  Email,
  Phone,
  Lock,
  Visibility,
  VisibilityOff,
  Security,
  AccountCircle,
  Notifications,
  History,
  ExitToApp,
  PhotoCamera,
  CalendarToday,
  LocationOn,
  Work,
} from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useAuth } from '../../contexts/AuthContext';
import { User, ChangePassword } from '../../types/api';
import { errorHandler } from '../../services/api';

// Profile update validation schema
const profileSchema = yup.object({
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
  email: yup
    .string()
    .required('Email is required')
    .email('Please enter a valid email address'),
  phoneNumber: yup
    .string()
    .matches(/^[\+]?[\d\s\-\(\)]+$/, 'Please enter a valid phone number')
    .min(10, 'Phone number must be at least 10 digits'),
  dateOfBirth: yup.date().nullable(),
  address: yup.string().max(200, 'Address must be less than 200 characters'),
  occupation: yup.string().max(100, 'Occupation must be less than 100 characters'),
});

// Password change validation schema
const passwordSchema = yup.object({
  currentPassword: yup
    .string()
    .required('Current password is required'),
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

type ProfileFormData = yup.InferType<typeof profileSchema>;
type PasswordFormData = yup.InferType<typeof passwordSchema>;

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => (
  <div hidden={value !== index}>
    {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
  </div>
);

const UserProfile: React.FC = () => {
  const navigate = useNavigate();
  const { 
    state: authState, 
    updateProfile, 
    changePassword, 
    logout, 
    clearError 
  } = useAuth();

  const [isEditing, setIsEditing] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // Settings state
  const [settings, setSettings] = useState({
    emailNotifications: true,
    smsNotifications: false,
    marketingEmails: false,
    twoFactorEnabled: false,
  });

  // Profile form setup
  const profileForm = useForm<ProfileFormData>({
    resolver: yupResolver(profileSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phoneNumber: '',
      dateOfBirth: null,
      address: '',
      occupation: '',
    },
  });

  // Password form setup
  const passwordForm = useForm<PasswordFormData>({
    resolver: yupResolver(passwordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  // Initialize form with user data
  useEffect(() => {
    if (authState.user) {
      profileForm.reset({
        firstName: authState.user.first_name || '',
        lastName: authState.user.last_name || '',
        email: authState.user.email || '',
        phoneNumber: authState.user.phone_number || '',
        dateOfBirth: authState.user.date_of_birth ? new Date(authState.user.date_of_birth) : null,
        address: authState.user.address || '',
        occupation: authState.user.occupation || '',
      });
    }
  }, [authState.user, profileForm]);

  // Clear messages on mount
  useEffect(() => {
    clearError();
    setSuccessMessage(null);
    setProfileError(null);
    setPasswordError(null);
  }, [clearError]);

  // Auto-clear success messages
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  // Handle profile update
  const onProfileSubmit = async (data: ProfileFormData) => {
    try {
      setProfileError(null);
      const updateData: Partial<User> = {
        first_name: data.firstName,
        last_name: data.lastName,
        email: data.email,
        phone_number: data.phoneNumber,
        date_of_birth: data.dateOfBirth?.toISOString().split('T')[0],
        address: data.address,
        occupation: data.occupation,
      };

      await updateProfile(updateData);
      setIsEditing(false);
      setSuccessMessage('Profile updated successfully!');
    } catch (error: any) {
      setProfileError(errorHandler.getErrorMessage(error));
      if (errorHandler.isValidationError(error)) {
        const validationErrors = errorHandler.getValidationErrors(error);
        Object.entries(validationErrors).forEach(([field, messages]) => {
          profileForm.setError(field as keyof ProfileFormData, {
            type: 'manual',
            message: messages[0],
          });
        });
      }
    }
  };

  // Handle password change
  const onPasswordSubmit = async (data: PasswordFormData) => {
    try {
      setPasswordError(null);
      const passwordData: ChangePassword = {
        current_password: data.currentPassword,
        new_password: data.newPassword,
      };

      await changePassword(passwordData);
      passwordForm.reset();
      setSuccessMessage('Password changed successfully!');
    } catch (error: any) {
      setPasswordError(errorHandler.getErrorMessage(error));
    }
  };

  // Handle logout
  const handleLogout = async () => {
    try {
      await logout();
      navigate('/auth/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // Handle tab change
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  // Cancel editing
  const handleCancelEdit = () => {
    profileForm.reset();
    setIsEditing(false);
    setProfileError(null);
  };

  // Get user's initials for avatar
  const getUserInitials = (): string => {
    const firstName = authState.user?.first_name || '';
    const lastName = authState.user?.last_name || '';
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  // Format date for display
  const formatDate = (dateString?: string): string => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString();
  };

  // Get role color
  const getRoleColor = (role?: string): "default" | "primary" | "secondary" | "error" | "info" | "success" | "warning" => {
    switch (role) {
      case 'ADMIN':
        return 'error';
      case 'LAB_TECHNICIAN':
        return 'warning';
      case 'USER':
        return 'primary';
      default:
        return 'default';
    }
  };

  if (!authState.user) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 3, textAlign: 'center' }}>
        <Avatar
          sx={{
            width: 100,
            height: 100,
            mx: 'auto',
            mb: 2,
            fontSize: '2rem',
            bgcolor: 'primary.main',
          }}
        >
          {getUserInitials()}
        </Avatar>
        <Typography variant="h4" gutterBottom>
          {authState.user.first_name} {authState.user.last_name}
        </Typography>
        <Chip
          label={authState.user.role}
          color={getRoleColor(authState.user.role)}
          variant="outlined"
          sx={{ mb: 1 }}
        />
        <Typography variant="body2" color="text.secondary">
          Member since {formatDate(authState.user.created_at)}
        </Typography>
      </Box>

      {/* Success/Error Messages */}
      {successMessage && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccessMessage(null)}>
          {successMessage}
        </Alert>
      )}

      {authState.error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={clearError}>
          {errorHandler.getErrorMessage(authState.error)}
        </Alert>
      )}

      {/* Tabs */}
      <Card>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={activeTab} onChange={handleTabChange}>
            <Tab label="Profile Information" icon={<Person />} />
            <Tab label="Security" icon={<Security />} />
            <Tab label="Settings" icon={<Notifications />} />
            <Tab label="Activity" icon={<History />} />
          </Tabs>
        </Box>

        {/* Profile Information Tab */}
        <TabPanel value={activeTab} index={0}>
          <CardContent>
            {profileError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {profileError}
              </Alert>
            )}

            <Box component="form" onSubmit={profileForm.handleSubmit(onProfileSubmit)}>
              <Grid container spacing={3}>
                {/* Personal Information */}
                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom>
                    Personal Information
                  </Typography>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Controller
                    name="firstName"
                    control={profileForm.control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        fullWidth
                        label="First Name"
                        variant="outlined"
                        error={!!profileForm.formState.errors.firstName}
                        helperText={profileForm.formState.errors.firstName?.message}
                        disabled={!isEditing || profileForm.formState.isSubmitting}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <Person color="action" />
                            </InputAdornment>
                          ),
                        }}
                      />
                    )}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Controller
                    name="lastName"
                    control={profileForm.control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        fullWidth
                        label="Last Name"
                        variant="outlined"
                        error={!!profileForm.formState.errors.lastName}
                        helperText={profileForm.formState.errors.lastName?.message}
                        disabled={!isEditing || profileForm.formState.isSubmitting}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <Person color="action" />
                            </InputAdornment>
                          ),
                        }}
                      />
                    )}
                  />
                </Grid>

                <Grid item xs={12}>
                  <Controller
                    name="email"
                    control={profileForm.control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        fullWidth
                        label="Email Address"
                        type="email"
                        variant="outlined"
                        error={!!profileForm.formState.errors.email}
                        helperText={profileForm.formState.errors.email?.message}
                        disabled={!isEditing || profileForm.formState.isSubmitting}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <Email color="action" />
                            </InputAdornment>
                          ),
                        }}
                      />
                    )}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Controller
                    name="phoneNumber"
                    control={profileForm.control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        fullWidth
                        label="Phone Number"
                        variant="outlined"
                        error={!!profileForm.formState.errors.phoneNumber}
                        helperText={profileForm.formState.errors.phoneNumber?.message}
                        disabled={!isEditing || profileForm.formState.isSubmitting}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <Phone color="action" />
                            </InputAdornment>
                          ),
                        }}
                      />
                    )}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Controller
                    name="dateOfBirth"
                    control={profileForm.control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        fullWidth
                        label="Date of Birth"
                        type="date"
                        variant="outlined"
                        error={!!profileForm.formState.errors.dateOfBirth}
                        helperText={profileForm.formState.errors.dateOfBirth?.message}
                        disabled={!isEditing || profileForm.formState.isSubmitting}
                        value={field.value ? field.value.toISOString().split('T')[0] : ''}
                        onChange={(e) => field.onChange(e.target.value ? new Date(e.target.value) : null)}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <CalendarToday color="action" />
                            </InputAdornment>
                          ),
                        }}
                        InputLabelProps={{
                          shrink: true,
                        }}
                      />
                    )}
                  />
                </Grid>

                <Grid item xs={12}>
                  <Controller
                    name="address"
                    control={profileForm.control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        fullWidth
                        label="Address"
                        multiline
                        rows={2}
                        variant="outlined"
                        error={!!profileForm.formState.errors.address}
                        helperText={profileForm.formState.errors.address?.message}
                        disabled={!isEditing || profileForm.formState.isSubmitting}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <LocationOn color="action" />
                            </InputAdornment>
                          ),
                        }}
                      />
                    )}
                  />
                </Grid>

                <Grid item xs={12}>
                  <Controller
                    name="occupation"
                    control={profileForm.control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        fullWidth
                        label="Occupation"
                        variant="outlined"
                        error={!!profileForm.formState.errors.occupation}
                        helperText={profileForm.formState.errors.occupation?.message}
                        disabled={!isEditing || profileForm.formState.isSubmitting}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <Work color="action" />
                            </InputAdornment>
                          ),
                        }}
                      />
                    )}
                  />
                </Grid>
              </Grid>

              {/* Action Buttons */}
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 3 }}>
                {isEditing ? (
                  <>
                    <Button
                      variant="outlined"
                      onClick={handleCancelEdit}
                      disabled={profileForm.formState.isSubmitting}
                      startIcon={<Cancel />}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      variant="contained"
                      disabled={profileForm.formState.isSubmitting}
                      startIcon={
                        profileForm.formState.isSubmitting ? (
                          <CircularProgress size={20} />
                        ) : (
                          <Save />
                        )
                      }
                    >
                      {profileForm.formState.isSubmitting ? 'Saving...' : 'Save Changes'}
                    </Button>
                  </>
                ) : (
                  <Button
                    variant="contained"
                    onClick={() => setIsEditing(true)}
                    startIcon={<Edit />}
                  >
                    Edit Profile
                  </Button>
                )}
              </Box>
            </Box>
          </CardContent>
        </TabPanel>

        {/* Security Tab */}
        <TabPanel value={activeTab} index={1}>
          <CardContent>
            {passwordError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {passwordError}
              </Alert>
            )}

            <Typography variant="h6" gutterBottom>
              Change Password
            </Typography>
            
            <Box component="form" onSubmit={passwordForm.handleSubmit(onPasswordSubmit)}>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <Controller
                    name="currentPassword"
                    control={passwordForm.control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        fullWidth
                        label="Current Password"
                        type={showCurrentPassword ? 'text' : 'password'}
                        variant="outlined"
                        error={!!passwordForm.formState.errors.currentPassword}
                        helperText={passwordForm.formState.errors.currentPassword?.message}
                        disabled={passwordForm.formState.isSubmitting}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <Lock color="action" />
                            </InputAdornment>
                          ),
                          endAdornment: (
                            <InputAdornment position="end">
                              <IconButton
                                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                edge="end"
                              >
                                {showCurrentPassword ? <VisibilityOff /> : <Visibility />}
                              </IconButton>
                            </InputAdornment>
                          ),
                        }}
                      />
                    )}
                  />
                </Grid>

                <Grid item xs={12}>
                  <Controller
                    name="newPassword"
                    control={passwordForm.control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        fullWidth
                        label="New Password"
                        type={showNewPassword ? 'text' : 'password'}
                        variant="outlined"
                        error={!!passwordForm.formState.errors.newPassword}
                        helperText={passwordForm.formState.errors.newPassword?.message}
                        disabled={passwordForm.formState.isSubmitting}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <Lock color="action" />
                            </InputAdornment>
                          ),
                          endAdornment: (
                            <InputAdornment position="end">
                              <IconButton
                                onClick={() => setShowNewPassword(!showNewPassword)}
                                edge="end"
                              >
                                {showNewPassword ? <VisibilityOff /> : <Visibility />}
                              </IconButton>
                            </InputAdornment>
                          ),
                        }}
                      />
                    )}
                  />
                </Grid>

                <Grid item xs={12}>
                  <Controller
                    name="confirmPassword"
                    control={passwordForm.control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        fullWidth
                        label="Confirm New Password"
                        type={showConfirmPassword ? 'text' : 'password'}
                        variant="outlined"
                        error={!!passwordForm.formState.errors.confirmPassword}
                        helperText={passwordForm.formState.errors.confirmPassword?.message}
                        disabled={passwordForm.formState.isSubmitting}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <Lock color="action" />
                            </InputAdornment>
                          ),
                          endAdornment: (
                            <InputAdornment position="end">
                              <IconButton
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                edge="end"
                              >
                                {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                              </IconButton>
                            </InputAdornment>
                          ),
                        }}
                      />
                    )}
                  />
                </Grid>
              </Grid>

              <Box sx={{ mt: 3 }}>
                <Button
                  type="submit"
                  variant="contained"
                  disabled={passwordForm.formState.isSubmitting}
                  startIcon={
                    passwordForm.formState.isSubmitting ? (
                      <CircularProgress size={20} />
                    ) : (
                      <Lock />
                    )
                  }
                >
                  {passwordForm.formState.isSubmitting ? 'Changing...' : 'Change Password'}
                </Button>
              </Box>
            </Box>

            <Divider sx={{ my: 3 }} />

            {/* Logout Section */}
            <Typography variant="h6" gutterBottom color="error">
              Danger Zone
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Once you logout, you will need to sign in again to access your account.
            </Typography>
            <Button
              variant="outlined"
              color="error"
              onClick={() => setLogoutDialogOpen(true)}
              startIcon={<ExitToApp />}
            >
              Logout
            </Button>
          </CardContent>
        </TabPanel>

        {/* Settings Tab */}
        <TabPanel value={activeTab} index={2}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Notification Preferences
            </Typography>
            
            <List>
              <ListItem>
                <ListItemIcon>
                  <Email />
                </ListItemIcon>
                <ListItemText
                  primary="Email Notifications"
                  secondary="Receive notifications about your lab tests and results"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.emailNotifications}
                      onChange={(e) =>
                        setSettings(prev => ({ ...prev, emailNotifications: e.target.checked }))
                      }
                    />
                  }
                  label=""
                />
              </ListItem>

              <ListItem>
                <ListItemIcon>
                  <Phone />
                </ListItemIcon>
                <ListItemText
                  primary="SMS Notifications"
                  secondary="Receive text messages for urgent updates"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.smsNotifications}
                      onChange={(e) =>
                        setSettings(prev => ({ ...prev, smsNotifications: e.target.checked }))
                      }
                    />
                  }
                  label=""
                />
              </ListItem>

              <ListItem>
                <ListItemIcon>
                  <Notifications />
                </ListItemIcon>
                <ListItemText
                  primary="Marketing Emails"
                  secondary="Receive promotional content and health tips"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.marketingEmails}
                      onChange={(e) =>
                        setSettings(prev => ({ ...prev, marketingEmails: e.target.checked }))
                      }
                    />
                  }
                  label=""
                />
              </ListItem>
            </List>

            <Divider sx={{ my: 3 }} />

            <Typography variant="h6" gutterBottom>
              Security Settings
            </Typography>
            
            <List>
              <ListItem>
                <ListItemIcon>
                  <Security />
                </ListItemIcon>
                <ListItemText
                  primary="Two-Factor Authentication"
                  secondary="Add an extra layer of security to your account"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.twoFactorEnabled}
                      onChange={(e) =>
                        setSettings(prev => ({ ...prev, twoFactorEnabled: e.target.checked }))
                      }
                    />
                  }
                  label=""
                />
              </ListItem>
            </List>
          </CardContent>
        </TabPanel>

        {/* Activity Tab */}
        <TabPanel value={activeTab} index={3}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Account Activity
            </Typography>
            
            <List>
              <ListItem>
                <ListItemIcon>
                  <AccountCircle />
                </ListItemIcon>
                <ListItemText
                  primary="Account Created"
                  secondary={formatDate(authState.user.created_at)}
                />
              </ListItem>
              
              <ListItem>
                <ListItemIcon>
                  <History />
                </ListItemIcon>
                <ListItemText
                  primary="Last Updated"
                  secondary={formatDate(authState.user.updated_at)}
                />
              </ListItem>
              
              <ListItem>
                <ListItemIcon>
                  <Security />
                </ListItemIcon>
                <ListItemText
                  primary="Last Activity"
                  secondary={authState.lastActivity ? authState.lastActivity.toLocaleString() : 'Current session'}
                />
              </ListItem>
            </List>

            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              For detailed activity logs and security events, please contact support.
            </Typography>
          </CardContent>
        </TabPanel>
      </Card>

      {/* Logout Confirmation Dialog */}
      <Dialog open={logoutDialogOpen} onClose={() => setLogoutDialogOpen(false)}>
        <DialogTitle>Confirm Logout</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to logout? You will need to sign in again to access your account.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setLogoutDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleLogout} color="error" variant="contained">
            Logout
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default UserProfile;