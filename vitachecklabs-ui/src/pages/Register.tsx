import React, { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  TextField,
  Button,
  Grid,
  Alert,
  CircularProgress
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { UserRegister } from '../types/api';

const Register: React.FC = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  const [formData, setFormData] = useState<UserRegister>({
    username: '',
    email: '',
    password: '',
    first_name: '',
    last_name: '',
    phone_number: ''
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (error) {
      setError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (!formData.username || !formData.email || !formData.password || 
        !formData.first_name || !formData.last_name) {
      setError('Username, email, password, first name, and last name are required');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Please enter a valid email address');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      // Prepare data for submission - exclude phone_number if empty
      const submitData: UserRegister = {
        username: formData.username,
        email: formData.email,
        password: formData.password,
        first_name: formData.first_name,
        last_name: formData.last_name,
        ...(formData.phone_number && { phone_number: formData.phone_number })
      };
      
      console.log('Registering user with data:', submitData);
      
      await register(submitData);
      
      setSuccess(true);
      setTimeout(() => {
        navigate('/home');
      }, 2000);
      
    } catch (err: any) {
      console.error('Registration error:', err);
      
      if (err?.response?.status === 400) {
        setError('Registration failed. Please check your input and try again.');
      } else if (err?.response?.status === 409) {
        setError('Username or email already exists. Please try with different credentials.');
      } else if (err?.response?.data?.detail) {
        setError(err.response.data.detail);
      } else if (err?.message) {
        setError(err.message);
      } else {
        setError('Registration failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
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

        {/* Right Side - Register Form */}
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
              maxWidth: '450px',
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
                Sign Up
              </Typography>

              {/* Success Message */}
              {success && (
                <Alert severity="success" sx={{ mb: 3 }}>
                  Registration successful! Redirecting to dashboard...
                </Alert>
              )}

              {/* Error Alert */}
              {error && (
                <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
                  {error}
                </Alert>
              )}

              <Box component="form" onSubmit={handleSubmit}>
                <Grid container spacing={2}>
                  {/* Username and Email side by side */}
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      Username
                    </Typography>
                    <TextField
                      fullWidth
                      name="username"
                      value={formData.username}
                      onChange={handleInputChange}
                      placeholder="Enter your username"
                      disabled={loading}
                      sx={{ 
                        mb: 2,
                        '& .MuiOutlinedInput-root': {
                          borderRadius: '8px',
                          backgroundColor: '#f8f9fa'
                        }
                      }}
                    />
                  </Grid>

                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      Email
                    </Typography>
                    <TextField
                      fullWidth
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="Enter your email"
                      disabled={loading}
                      sx={{ 
                        mb: 2,
                        '& .MuiOutlinedInput-root': {
                          borderRadius: '8px',
                          backgroundColor: '#f8f9fa'
                        }
                      }}
                    />
                  </Grid>

                  {/* First Name and Last Name side by side */}
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      First name
                    </Typography>
                    <TextField
                      fullWidth
                      name="first_name"
                      value={formData.first_name}
                      onChange={handleInputChange}
                      placeholder="Enter your first name"
                      disabled={loading}
                      sx={{ 
                        mb: 2,
                        '& .MuiOutlinedInput-root': {
                          borderRadius: '8px',
                          backgroundColor: '#f8f9fa'
                        }
                      }}
                    />
                  </Grid>

                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      Last name
                    </Typography>
                    <TextField
                      fullWidth
                      name="last_name"
                      value={formData.last_name}
                      onChange={handleInputChange}
                      placeholder="Enter your last name"
                      disabled={loading}
                      sx={{ 
                        mb: 2,
                        '& .MuiOutlinedInput-root': {
                          borderRadius: '8px',
                          backgroundColor: '#f8f9fa'
                        }
                      }}
                    />
                  </Grid>

                  {/* Phone Number and Password side by side */}
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      Phone number (optional)
                    </Typography>
                    <TextField
                      fullWidth
                      name="phone_number"
                      value={formData.phone_number}
                      onChange={handleInputChange}
                      placeholder="Enter your phone number"
                      disabled={loading}
                      sx={{ 
                        mb: 2,
                        '& .MuiOutlinedInput-root': {
                          borderRadius: '8px',
                          backgroundColor: '#f8f9fa'
                        }
                      }}
                    />
                  </Grid>

                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      Password
                    </Typography>
                    <TextField
                      fullWidth
                      name="password"
                      type="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      placeholder="Enter your password"
                      disabled={loading}
                      sx={{ 
                        mb: 2,
                        '& .MuiOutlinedInput-root': {
                          borderRadius: '8px',
                          backgroundColor: '#f8f9fa'
                        }
                      }}
                    />
                  </Grid>

                  {/* Sign Up Button */}
                  <Grid item xs={12}>
                    <Button
                      type="submit"
                      fullWidth
                      variant="contained"
                      size="large"
                      disabled={loading}
                      sx={{
                        mt: 3,
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
                        loading ? (
                          <CircularProgress size={20} color="inherit" />
                        ) : null
                      }
                    >
                      {loading ? 'Signing Up...' : 'Sign Up'}
                    </Button>
                  </Grid>

                  {/* Login Link */}
                  <Grid item xs={12}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="body2" color="text.secondary">
                        Already have an account?{' '}
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
                          onClick={() => navigate('/auth/login')}
                        >
                          Sign In
                        </Typography>
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </Box>
            </Box>
          </Grid>
        </Grid>
    </Box>
  );
};

export default Register;