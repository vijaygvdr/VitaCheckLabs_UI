import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Typography, 
  Box, 
  Card, 
  CardContent, 
  Grid,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  Chip,
  CircularProgress,
  Alert,
  Pagination,
  Modal,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CardActions,
  IconButton,
  Tooltip,
  Slider,
  Paper,
  Stack,
  Divider
} from '@mui/material';
import { 
  Science, 
  Search, 
  FilterList, 
  BookOnline, 
  Home, 
  AccessTime,
  LocalHospital,
  MonetizationOn,
  Close,
  Info
} from '@mui/icons-material';
import { labTestsService } from '../services/labTestsService';
import { LabTest, LabTestCategory, SampleType, LabTestFilters } from '../types/api';
import LabTestBookingComponent from '../components/LabTestBooking';

const LabTests = () => {
  const [tests, setTests] = useState<LabTest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<LabTestCategory | ''>('');
  const [selectedSampleType, setSelectedSampleType] = useState<SampleType | ''>('');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 500]);
  const [homeCollectionOnly, setHomeCollectionOnly] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedTest, setSelectedTest] = useState<LabTest | null>(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [bookingModalOpen, setBookingModalOpen] = useState(false);

  const perPage = 12;

  useEffect(() => {
    fetchTests();
  }, [currentPage, selectedCategory, selectedSampleType, homeCollectionOnly, priceRange]);

  const fetchTests = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const filters: LabTestFilters = {
        page: currentPage,
        per_page: perPage,
        is_active: true,
        ...(selectedCategory && { category: selectedCategory }),
        ...(selectedSampleType && { sample_type: selectedSampleType }),
        ...(homeCollectionOnly && { is_home_collection_available: true }),
        min_price: priceRange[0],
        max_price: priceRange[1],
        ...(searchQuery && { search: searchQuery })
      };

      const response = await labTestsService.getLabTests(filters);
      setTests(response.data || []);
      setTotalPages(Math.ceil((response.total || 0) / perPage));
    } catch (err) {
      setError('Failed to load lab tests. Please try again.');
      console.error('Error fetching lab tests:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setCurrentPage(1);
    fetchTests();
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setSelectedCategory('');
    setSelectedSampleType('');
    setPriceRange([0, 500]);
    setHomeCollectionOnly(false);
    setCurrentPage(1);
  };

  const handleTestDetails = (test: LabTest) => {
    setSelectedTest(test);
    setDetailsModalOpen(true);
  };

  const handleBookTest = (test: LabTest) => {
    setSelectedTest(test);
    setBookingModalOpen(true);
  };

  const formatPrice = (price: number) => `$${price.toFixed(2)}`;

  const getCategoryColor = (category: LabTestCategory) => {
    const colors: Record<LabTestCategory, string> = {
      [LabTestCategory.BLOOD_CHEMISTRY]: 'primary',
      [LabTestCategory.HEMATOLOGY]: 'secondary',
      [LabTestCategory.IMMUNOLOGY]: 'success',
      [LabTestCategory.MICROBIOLOGY]: 'warning',
      [LabTestCategory.PATHOLOGY]: 'error',
      [LabTestCategory.RADIOLOGY]: 'info',
      [LabTestCategory.CARDIOLOGY]: 'primary',
      [LabTestCategory.ENDOCRINOLOGY]: 'secondary',
      [LabTestCategory.ONCOLOGY]: 'error',
      [LabTestCategory.GENETICS]: 'success'
    };
    return colors[category] || 'default';
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 4, textAlign: 'center' }}>
        <Science sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
        <Typography variant="h3" component="h1" gutterBottom>
          Lab Tests
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Browse and book our comprehensive range of laboratory tests
        </Typography>
      </Box>

      {/* Search and Filters */}
      <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
        <Grid container spacing={3} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Search tests"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              InputProps={{
                startAdornment: <Search sx={{ mr: 1, color: 'action.active' }} />
              }}
            />
          </Grid>
          
          <Grid item xs={12} md={2}>
            <FormControl fullWidth>
              <InputLabel>Category</InputLabel>
              <Select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value as LabTestCategory)}
                label="Category"
              >
                <MenuItem value="">All Categories</MenuItem>
                {Object.values(LabTestCategory).map((category) => (
                  <MenuItem key={category} value={category}>
                    {category.replace(/_/g, ' ')}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={2}>
            <FormControl fullWidth>
              <InputLabel>Sample Type</InputLabel>
              <Select
                value={selectedSampleType}
                onChange={(e) => setSelectedSampleType(e.target.value as SampleType)}
                label="Sample Type"
              >
                <MenuItem value="">All Types</MenuItem>
                {Object.values(SampleType).map((type) => (
                  <MenuItem key={type} value={type}>
                    {type}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={2}>
            <Box sx={{ px: 2 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Price Range: {formatPrice(priceRange[0])} - {formatPrice(priceRange[1])}
              </Typography>
              <Slider
                value={priceRange}
                onChange={(_, newValue) => setPriceRange(newValue as [number, number])}
                valueLabelDisplay="auto"
                min={0}
                max={1000}
                step={10}
                valueLabelFormat={formatPrice}
              />
            </Box>
          </Grid>

          <Grid item xs={12} md={2}>
            <Stack spacing={1}>
              <Button
                variant="contained"
                onClick={handleSearch}
                startIcon={<Search />}
                fullWidth
              >
                Search
              </Button>
              <Button
                variant="outlined"
                onClick={handleClearFilters}
                size="small"
                fullWidth
              >
                Clear Filters
              </Button>
            </Stack>
          </Grid>
        </Grid>

        <Box sx={{ mt: 2 }}>
          <Button
            variant={homeCollectionOnly ? 'contained' : 'outlined'}
            onClick={() => setHomeCollectionOnly(!homeCollectionOnly)}
            startIcon={<Home />}
            size="small"
          >
            Home Collection Only
          </Button>
        </Box>
      </Paper>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Loading State */}
      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      )}

      {/* Test Results */}
      {!loading && (
        <>
          <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">
              {tests.length} tests found
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {selectedCategory && (
                <Chip 
                  label={selectedCategory.replace(/_/g, ' ')} 
                  onDelete={() => setSelectedCategory('')}
                  color={getCategoryColor(selectedCategory) as any}
                />
              )}
              {selectedSampleType && (
                <Chip 
                  label={selectedSampleType} 
                  onDelete={() => setSelectedSampleType('')}
                />
              )}
              {homeCollectionOnly && (
                <Chip 
                  label="Home Collection" 
                  onDelete={() => setHomeCollectionOnly(false)}
                  icon={<Home />}
                />
              )}
            </Box>
          </Box>

          <Grid container spacing={3}>
            {tests.map((test) => (
              <Grid item xs={12} md={6} lg={4} key={test.id}>
                <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                      <Typography variant="h6" component="h2" sx={{ flexGrow: 1 }}>
                        {test.name}
                      </Typography>
                      <Chip 
                        label={test.category.replace(/_/g, ' ')} 
                        size="small"
                        color={getCategoryColor(test.category) as any}
                      />
                    </Box>
                    
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      {test.description}
                    </Typography>

                    <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                      <Chip 
                        label={test.sample_type} 
                        size="small" 
                        icon={<LocalHospital />}
                      />
                      {test.is_home_collection_available && (
                        <Chip 
                          label="Home Collection" 
                          size="small" 
                          icon={<Home />}
                          color="success"
                        />
                      )}
                      {test.report_delivery_hours && (
                        <Chip 
                          label={`${test.report_delivery_hours}h delivery`} 
                          size="small" 
                          icon={<AccessTime />}
                        />
                      )}
                    </Box>

                    <Typography variant="h5" color="primary.main" fontWeight="bold">
                      {formatPrice(test.price)}
                    </Typography>
                  </CardContent>
                  
                  <CardActions sx={{ p: 2, pt: 0 }}>
                    <Button
                      size="small"
                      onClick={() => handleTestDetails(test)}
                      startIcon={<Info />}
                    >
                      Details
                    </Button>
                    <Button
                      size="small"
                      variant="contained"
                      onClick={() => handleBookTest(test)}
                      startIcon={<BookOnline />}
                    >
                      Book Now
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>

          {/* Pagination */}
          {totalPages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
              <Pagination
                count={totalPages}
                page={currentPage}
                onChange={(_, page) => setCurrentPage(page)}
                color="primary"
                size="large"
              />
            </Box>
          )}
        </>
      )}

      {/* Test Details Modal */}
      <Dialog
        open={detailsModalOpen}
        onClose={() => setDetailsModalOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h5">
            {selectedTest?.name}
          </Typography>
          <IconButton onClick={() => setDetailsModalOpen(false)}>
            <Close />
          </IconButton>
        </DialogTitle>
        
        <DialogContent>
          {selectedTest && (
            <Box>
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Test Information
                </Typography>
                <Typography variant="body1" paragraph>
                  {selectedTest.description}
                </Typography>
                
                <Grid container spacing={2} sx={{ mb: 2 }}>
                  <Grid item xs={6}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Category
                    </Typography>
                    <Typography variant="body1">
                      {selectedTest.category.replace(/_/g, ' ')}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Sample Type
                    </Typography>
                    <Typography variant="body1">
                      {selectedTest.sample_type}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Price
                    </Typography>
                    <Typography variant="h6" color="primary.main">
                      {formatPrice(selectedTest.price)}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Report Delivery
                    </Typography>
                    <Typography variant="body1">
                      {selectedTest.report_delivery_hours ? `${selectedTest.report_delivery_hours} hours` : 'Not specified'}
                    </Typography>
                  </Grid>
                </Grid>
              </Box>

              {selectedTest.requirements && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    Requirements
                  </Typography>
                  <Typography variant="body2">
                    {selectedTest.requirements}
                  </Typography>
                </Box>
              )}

              {selectedTest.procedure && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    Procedure
                  </Typography>
                  <Typography variant="body2">
                    {selectedTest.procedure}
                  </Typography>
                </Box>
              )}

              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {selectedTest.is_home_collection_available && (
                  <Chip 
                    label="Home Collection Available" 
                    icon={<Home />}
                    color="success"
                  />
                )}
                {selectedTest.minimum_age && (
                  <Chip 
                    label={`Min Age: ${selectedTest.minimum_age}`}
                  />
                )}
                {selectedTest.maximum_age && (
                  <Chip 
                    label={`Max Age: ${selectedTest.maximum_age}`}
                  />
                )}
              </Box>
            </Box>
          )}
        </DialogContent>
        
        <DialogActions>
          <Button onClick={() => setDetailsModalOpen(false)}>
            Close
          </Button>
          <Button 
            variant="contained" 
            startIcon={<BookOnline />}
            onClick={() => {
              setDetailsModalOpen(false);
              handleBookTest(selectedTest!);
            }}
          >
            Book This Test
          </Button>
        </DialogActions>
      </Dialog>

      {/* Booking Modal */}
      <LabTestBookingComponent
        open={bookingModalOpen}
        onClose={() => setBookingModalOpen(false)}
        test={selectedTest}
      />
    </Container>
  );
};

export default LabTests;