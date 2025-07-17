import React from 'react';
import { 
  Card, 
  CardContent, 
  Typography, 
  Box, 
  Grid, 
  Avatar,
  Paper,
  List,
  ListItem,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import { 
  Groups, 
  MedicalServices, 
  Science, 
  Psychology,
  HealthAndSafety,
  School,
  EmojiPeople
} from '@mui/icons-material';
import { CompanyInfo } from '../../types/api';

interface TeamSectionProps {
  companyData: CompanyInfo | null;
}

const TeamSection: React.FC<TeamSectionProps> = ({ companyData }) => {
  // Mock team data - in a real app, this would come from API
  const teamMembers = [
    {
      name: 'Dr. Sarah Johnson',
      role: 'Chief Medical Officer',
      specialization: 'Clinical Pathology',
      avatar: '/api/placeholder/150/150',
      icon: <MedicalServices />
    },
    {
      name: 'Dr. Michael Chen',
      role: 'Laboratory Director',
      specialization: 'Molecular Biology',
      avatar: '/api/placeholder/150/150',
      icon: <Science />
    },
    {
      name: 'Dr. Emily Rodriguez',
      role: 'Quality Assurance Manager',
      specialization: 'Laboratory Quality Systems',
      avatar: '/api/placeholder/150/150',
      icon: <HealthAndSafety />
    },
    {
      name: 'Dr. David Kim',
      role: 'Research Scientist',
      specialization: 'Biochemistry',
      avatar: '/api/placeholder/150/150',
      icon: <Psychology />
    }
  ];

  const teamStats = [
    {
      icon: <Groups />,
      label: 'Team Members',
      value: '50+'
    },
    {
      icon: <School />,
      label: 'PhD Scientists',
      value: '15+'
    },
    {
      icon: <MedicalServices />,
      label: 'Medical Doctors',
      value: '8+'
    },
    {
      icon: <Science />,
      label: 'Lab Technicians',
      value: '25+'
    }
  ];

  const expertise = [
    'Clinical Chemistry',
    'Hematology',
    'Microbiology',
    'Immunology',
    'Molecular Diagnostics',
    'Pathology',
    'Toxicology',
    'Genetics'
  ];

  return (
    <Box sx={{ mb: 4 }}>
      <Typography variant="h4" component="h2" gutterBottom align="center">
        Meet Our Team
      </Typography>
      <Typography variant="body1" align="center" sx={{ mb: 4 }} color="text.secondary">
        Our experienced professionals are dedicated to providing accurate and reliable diagnostic services
      </Typography>
      
      {/* Team Stats */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {teamStats.map((stat, index) => (
          <Grid item xs={6} md={3} key={index}>
            <Paper 
              elevation={2} 
              sx={{ 
                p: 2, 
                textAlign: 'center',
                transition: 'transform 0.2s',
                '&:hover': {
                  transform: 'translateY(-4px)'
                }
              }}
            >
              <Box sx={{ color: 'primary.main', mb: 1 }}>
                {stat.icon}
              </Box>
              <Typography variant="h5" color="primary.main" gutterBottom>
                {stat.value}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {stat.label}
              </Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>
      
      {/* Key Team Members */}
      <Grid container spacing={4} sx={{ mb: 4 }}>
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Leadership Team
              </Typography>
              <Grid container spacing={3}>
                {teamMembers.map((member, index) => (
                  <Grid item xs={12} sm={6} key={index}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Avatar
                        sx={{ 
                          width: 56, 
                          height: 56, 
                          mr: 2,
                          bgcolor: 'primary.main'
                        }}
                      >
                        {member.icon}
                      </Avatar>
                      <Box>
                        <Typography variant="subtitle1" fontWeight="bold">
                          {member.name}
                        </Typography>
                        <Typography variant="body2" color="primary.main">
                          {member.role}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {member.specialization}
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>
        </Grid>
        
        {/* Expertise Areas */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Areas of Expertise
              </Typography>
              <List dense>
                {expertise.map((area, index) => (
                  <ListItem key={index} sx={{ py: 0.5 }}>
                    <ListItemIcon sx={{ minWidth: 32 }}>
                      <EmojiPeople sx={{ fontSize: 20, color: 'primary.main' }} />
                    </ListItemIcon>
                    <ListItemText 
                      primary={area}
                      primaryTypographyProps={{ variant: 'body2' }}
                    />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      
      {/* Company Culture */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Our Culture & Values
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Typography variant="body2" paragraph>
                <strong>Excellence in Healthcare:</strong> We maintain the highest standards 
                in laboratory practices and continuously invest in cutting-edge technology 
                and training to ensure accurate results.
              </Typography>
              <Typography variant="body2" paragraph>
                <strong>Patient-Centered Care:</strong> Every test we perform is treated with 
                the utmost care and attention, understanding that behind every sample is a 
                person seeking answers about their health.
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="body2" paragraph>
                <strong>Continuous Learning:</strong> Our team regularly participates in 
                professional development, conferences, and training programs to stay current 
                with the latest advances in laboratory science.
              </Typography>
              <Typography variant="body2" paragraph>
                <strong>Collaborative Environment:</strong> We foster a culture of teamwork 
                and open communication, where every team member contributes to our mission 
                of delivering exceptional diagnostic services.
              </Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </Box>
  );
};

export default TeamSection;