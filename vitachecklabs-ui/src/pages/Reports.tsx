import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  CardActions,
  Grid,
  Chip,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Alert,
  CircularProgress,
  Badge,
  Tooltip,
  Stack,
  Divider,
  Avatar,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  LinearProgress
} from '@mui/material';
import {
  Assignment,
  Search,
  FilterList,
  Download,
  Share,
  Visibility,
  GetApp,
  Close,
  Schedule,
  CheckCircle,
  Pending,
  Cancel,
  Priority,
  AttachFile,
  Person,
  CalendarToday,
  Payment,
  Analytics,
  Refresh,
  Sort,
  ViewList,
  ViewModule,
  ExpandMore,
  TrendingUp,
  TrendingDown,
  Info,
  Warning,
  Error
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { reportsService } from '../services/reportsService';
import { 
  Report, 
  ReportStatus, 
  PaymentStatus, 
  ReportPriority, 
  ReportFilters,
  ReportStats
} from '../types/api';

const Reports = () => {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<ReportStats | null>(null);
  
  // Filters and search
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<ReportStatus | ''>('');
  const [priorityFilter, setPriorityFilter] = useState<ReportPriority | ''>('');
  const [paymentFilter, setPaymentFilter] = useState<PaymentStatus | ''>('');
  const [dateFrom, setDateFrom] = useState<Date | null>(null);
  const [dateTo, setDateTo] = useState<Date | null>(null);
  
  // Pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalReports, setTotalReports] = useState(0);
  
  // View modes
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  // Modals
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [shareEmail, setShareEmail] = useState('');
  const [shareExpiration, setShareExpiration] = useState<Date | null>(null);
  
  // Statistics view
  const [showStats, setShowStats] = useState(false);

  useEffect(() => {
    fetchReports();
    fetchStats();
  }, [page, rowsPerPage, statusFilter, priorityFilter, paymentFilter, dateFrom, dateTo]);

  const fetchReports = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const filters: ReportFilters = {
        page: page + 1,
        per_page: rowsPerPage,
        ...(statusFilter && { status: statusFilter }),
        ...(priorityFilter && { priority: priorityFilter }),
        ...(paymentFilter && { payment_status: paymentFilter }),
        ...(dateFrom && { date_from: dateFrom.toISOString().split('T')[0] }),
        ...(dateTo && { date_to: dateTo.toISOString().split('T')[0] }),
        ...(searchQuery && { search: searchQuery })
      };

      const response = await reportsService.getReports(filters);
      setReports(response.data || []);
      setTotalReports(response.total || 0);
    } catch (err) {
      setError('Failed to load reports. Please try again.');
      console.error('Error fetching reports:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const statsData = await reportsService.getStats();
      setStats(statsData);
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  };

  const handleSearch = () => {
    setPage(0);
    fetchReports();
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setStatusFilter('');
    setPriorityFilter('');
    setPaymentFilter('');
    setDateFrom(null);
    setDateTo(null);
    setPage(0);
  };

  const handleViewReport = (report: Report) => {
    setSelectedReport(report);
    setDetailsModalOpen(true);
  };

  const handleDownloadReport = async (report: Report) => {
    try {
      await reportsService.downloadReport(report.id, 'pdf');
    } catch (err) {
      setError('Failed to download report. Please try again.');
    }
  };

  const handleShareReport = (report: Report) => {
    setSelectedReport(report);
    setShareModalOpen(true);
  };

  const handleShareSubmit = async () => {
    if (!selectedReport || !shareEmail) return;
    
    try {
      await reportsService.shareReport(selectedReport.id, {
        email: shareEmail,
        expiration_date: shareExpiration?.toISOString().split('T')[0]
      });
      setShareModalOpen(false);
      setShareEmail('');
      setShareExpiration(null);
    } catch (err) {
      setError('Failed to share report. Please try again.');
    }
  };

  const getStatusColor = (status: ReportStatus) => {
    const colors = {
      [ReportStatus.PENDING]: 'warning',
      [ReportStatus.SCHEDULED]: 'info',
      [ReportStatus.COLLECTED]: 'primary',
      [ReportStatus.PROCESSING]: 'secondary',
      [ReportStatus.COMPLETED]: 'success',
      [ReportStatus.CANCELLED]: 'error'
    };
    return colors[status] || 'default';
  };

  const getPriorityColor = (priority: ReportPriority) => {
    const colors = {
      [ReportPriority.LOW]: 'success',
      [ReportPriority.NORMAL]: 'primary',
      [ReportPriority.HIGH]: 'error'
    };
    return colors[priority] || 'default';
  };

  const getPaymentStatusColor = (status: PaymentStatus) => {
    const colors = {
      [PaymentStatus.PENDING]: 'warning',
      [PaymentStatus.PAID]: 'success',
      [PaymentStatus.FAILED]: 'error',
      [PaymentStatus.REFUNDED]: 'info'
    };
    return colors[status] || 'default';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatCurrency = (amount: number) => {
    return `$${amount.toFixed(2)}`;
  };

  const getStatusIcon = (status: ReportStatus) => {
    const icons = {
      [ReportStatus.PENDING]: <Pending />,
      [ReportStatus.SCHEDULED]: <Schedule />,
      [ReportStatus.COLLECTED]: <GetApp />,
      [ReportStatus.PROCESSING]: <CircularProgress size={20} />,
      [ReportStatus.COMPLETED]: <CheckCircle />,
      [ReportStatus.CANCELLED]: <Cancel />
    };
    return icons[status] || <Info />;
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Container maxWidth="xl" sx={{ py: 4 }}>
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Assignment sx={{ fontSize: 48, color: 'primary.main', mr: 2 }} />
              <Box>
                <Typography variant="h3" component="h1" gutterBottom>
                  Reports Management
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  View, manage, and analyze your lab test reports
                </Typography>
              </Box>
            </Box>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button
                variant="outlined"
                startIcon={<Analytics />}
                onClick={() => setShowStats(!showStats)}
              >
                {showStats ? 'Hide Stats' : 'Show Stats'}
              </Button>
              <Button
                variant="outlined"
                startIcon={<Refresh />}
                onClick={fetchReports}
              >
                Refresh
              </Button>
              <Button
                variant="outlined"
                startIcon={viewMode === 'grid' ? <ViewList /> : <ViewModule />}
                onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
              >
                {viewMode === 'grid' ? 'List View' : 'Grid View'}
              </Button>
            </Box>
          </Box>
        </Box>

        {/* Statistics Dashboard */}
        {showStats && stats && (
          <Card sx={{ mb: 4 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Reports Statistics
              </Typography>
              <Grid container spacing={3}>
                <Grid item xs={12} md={3}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="h4" color="primary.main">
                        {stats.total_reports}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Total Reports
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} md={3}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="h4" color="success.main">
                        {stats.completed_reports}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Completed
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} md={3}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="h4" color="warning.main">
                        {stats.pending_reports}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Pending
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} md={3}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="h4" color="primary.main">
                        {formatCurrency(stats.total_revenue)}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Total Revenue
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        )}

        {/* Filters */}
        <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                label="Search reports"
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
                <InputLabel>Status</InputLabel>
                <Select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as ReportStatus)}
                  label="Status"
                >
                  <MenuItem value="">All Statuses</MenuItem>
                  {Object.values(ReportStatus).map((status) => (
                    <MenuItem key={status} value={status}>
                      {status}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={2}>
              <FormControl fullWidth>
                <InputLabel>Priority</InputLabel>
                <Select
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value as ReportPriority)}
                  label="Priority"
                >
                  <MenuItem value="">All Priorities</MenuItem>
                  {Object.values(ReportPriority).map((priority) => (
                    <MenuItem key={priority} value={priority}>
                      {priority}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={2}>
              <DatePicker
                label="From Date"
                value={dateFrom}
                onChange={setDateFrom}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    size: 'small'
                  }
                }}
              />
            </Grid>

            <Grid item xs={12} md={2}>
              <DatePicker
                label="To Date"
                value={dateTo}
                onChange={setDateTo}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    size: 'small'
                  }
                }}
              />
            </Grid>

            <Grid item xs={12} md={1}>
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
                  Clear
                </Button>
              </Stack>
            </Grid>
          </Grid>
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

        {/* Results Count */}
        {!loading && (
          <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">
              {totalReports} reports found
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {statusFilter && (
                <Chip 
                  label={statusFilter} 
                  onDelete={() => setStatusFilter('')}
                  color={getStatusColor(statusFilter) as any}
                />
              )}
              {priorityFilter && (
                <Chip 
                  label={priorityFilter} 
                  onDelete={() => setPriorityFilter('')}
                  color={getPriorityColor(priorityFilter) as any}
                />
              )}
              {paymentFilter && (
                <Chip 
                  label={paymentFilter} 
                  onDelete={() => setPaymentFilter('')}
                  color={getPaymentStatusColor(paymentFilter) as any}
                />
              )}
            </Box>
          </Box>
        )}

        {/* Reports Display */}
        {!loading && viewMode === 'grid' && (
          <Grid container spacing={3}>
            {reports.map((report) => (
              <Grid item xs={12} md={6} lg={4} key={report.id}>
                <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                      <Typography variant="h6" component="h2">
                        {report.lab_test.name}
                      </Typography>
                      <Chip 
                        label={report.status} 
                        color={getStatusColor(report.status) as any}
                        size="small"
                        icon={getStatusIcon(report.status)}
                      />
                    </Box>
                    
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Report #{report.report_number}
                    </Typography>
                    
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Created: {formatDate(report.created_at)}
                    </Typography>
                    
                    {report.completed_at && (
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Completed: {formatDate(report.completed_at)}
                      </Typography>
                    )}

                    <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                      <Chip 
                        label={report.priority} 
                        size="small"
                        color={getPriorityColor(report.priority) as any}
                        icon={<Priority />}
                      />
                      <Chip 
                        label={report.payment_status} 
                        size="small"
                        color={getPaymentStatusColor(report.payment_status) as any}
                        icon={<Payment />}
                      />
                      {report.file_path && (
                        <Chip 
                          label="Has File" 
                          size="small"
                          color="info"
                          icon={<AttachFile />}
                        />
                      )}
                    </Box>

                    {report.amount_charged && (
                      <Typography variant="h6" color="primary.main" fontWeight="bold">
                        {formatCurrency(report.amount_charged)}
                      </Typography>
                    )}
                  </CardContent>
                  
                  <CardActions>
                    <Button
                      size="small"
                      onClick={() => handleViewReport(report)}
                      startIcon={<Visibility />}
                    >
                      View
                    </Button>
                    {report.file_path && (
                      <Button
                        size="small"
                        onClick={() => handleDownloadReport(report)}
                        startIcon={<Download />}
                      >
                        Download
                      </Button>
                    )}
                    <Button
                      size="small"
                      onClick={() => handleShareReport(report)}
                      startIcon={<Share />}
                    >
                      Share
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}

        {/* List View */}
        {!loading && viewMode === 'list' && (
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Report</TableCell>
                  <TableCell>Test</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Priority</TableCell>
                  <TableCell>Payment</TableCell>
                  <TableCell>Amount</TableCell>
                  <TableCell>Created</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {reports.map((report) => (
                  <TableRow key={report.id}>
                    <TableCell>
                      <Box>
                        <Typography variant="subtitle2">
                          #{report.report_number}
                        </Typography>
                        {report.file_path && (
                          <Chip 
                            label="Has File" 
                            size="small"
                            color="info"
                            icon={<AttachFile />}
                          />
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>{report.lab_test.name}</TableCell>
                    <TableCell>
                      <Chip 
                        label={report.status} 
                        color={getStatusColor(report.status) as any}
                        size="small"
                        icon={getStatusIcon(report.status)}
                      />
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={report.priority} 
                        color={getPriorityColor(report.priority) as any}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={report.payment_status} 
                        color={getPaymentStatusColor(report.payment_status) as any}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {report.amount_charged ? formatCurrency(report.amount_charged) : '-'}
                    </TableCell>
                    <TableCell>{formatDate(report.created_at)}</TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <IconButton 
                          size="small" 
                          onClick={() => handleViewReport(report)}
                        >
                          <Visibility />
                        </IconButton>
                        {report.file_path && (
                          <IconButton 
                            size="small" 
                            onClick={() => handleDownloadReport(report)}
                          >
                            <Download />
                          </IconButton>
                        )}
                        <IconButton 
                          size="small" 
                          onClick={() => handleShareReport(report)}
                        >
                          <Share />
                        </IconButton>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <TablePagination
              rowsPerPageOptions={[5, 10, 25, 50]}
              component="div"
              count={totalReports}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={(_, newPage) => setPage(newPage)}
              onRowsPerPageChange={(e) => {
                setRowsPerPage(parseInt(e.target.value, 10));
                setPage(0);
              }}
            />
          </TableContainer>
        )}

        {/* Empty State */}
        {!loading && reports.length === 0 && (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <Assignment sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary">
              No reports found
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Try adjusting your search criteria or filters
            </Typography>
          </Box>
        )}

        {/* Report Details Modal */}
        <Dialog
          open={detailsModalOpen}
          onClose={() => setDetailsModalOpen(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h5">
              Report Details
            </Typography>
            <IconButton onClick={() => setDetailsModalOpen(false)}>
              <Close />
            </IconButton>
          </DialogTitle>
          
          <DialogContent>
            {selectedReport && (
              <Box>
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <Typography variant="h6" gutterBottom>
                      {selectedReport.lab_test.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Report #{selectedReport.report_number}
                    </Typography>
                    
                    <Box sx={{ mb: 2 }}>
                      <Chip 
                        label={selectedReport.status} 
                        color={getStatusColor(selectedReport.status) as any}
                        icon={getStatusIcon(selectedReport.status)}
                      />
                    </Box>
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Priority
                    </Typography>
                    <Chip 
                      label={selectedReport.priority} 
                      color={getPriorityColor(selectedReport.priority) as any}
                      size="small"
                    />
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Payment Status
                    </Typography>
                    <Chip 
                      label={selectedReport.payment_status} 
                      color={getPaymentStatusColor(selectedReport.payment_status) as any}
                      size="small"
                    />
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Amount
                    </Typography>
                    <Typography variant="h6" color="primary.main">
                      {selectedReport.amount_charged ? formatCurrency(selectedReport.amount_charged) : 'N/A'}
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Created
                    </Typography>
                    <Typography variant="body1">
                      {formatDate(selectedReport.created_at)}
                    </Typography>
                  </Grid>
                  
                  {selectedReport.completed_at && (
                    <Grid item xs={12} md={6}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Completed
                      </Typography>
                      <Typography variant="body1">
                        {formatDate(selectedReport.completed_at)}
                      </Typography>
                    </Grid>
                  )}
                  
                  {selectedReport.collection_location && (
                    <Grid item xs={12}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Collection Location
                      </Typography>
                      <Typography variant="body1">
                        {selectedReport.collection_location}
                      </Typography>
                    </Grid>
                  )}
                  
                  {selectedReport.results && (
                    <Grid item xs={12}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Results
                      </Typography>
                      <Typography variant="body1">
                        {selectedReport.results}
                      </Typography>
                    </Grid>
                  )}
                  
                  {selectedReport.observations && (
                    <Grid item xs={12}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Observations
                      </Typography>
                      <Typography variant="body1">
                        {selectedReport.observations}
                      </Typography>
                    </Grid>
                  )}
                  
                  {selectedReport.recommendations && (
                    <Grid item xs={12}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Recommendations
                      </Typography>
                      <Typography variant="body1">
                        {selectedReport.recommendations}
                      </Typography>
                    </Grid>
                  )}
                </Grid>
              </Box>
            )}
          </DialogContent>
          
          <DialogActions>
            <Button onClick={() => setDetailsModalOpen(false)}>
              Close
            </Button>
            {selectedReport?.file_path && (
              <Button 
                variant="contained" 
                startIcon={<Download />}
                onClick={() => handleDownloadReport(selectedReport)}
              >
                Download Report
              </Button>
            )}
          </DialogActions>
        </Dialog>

        {/* Share Modal */}
        <Dialog
          open={shareModalOpen}
          onClose={() => setShareModalOpen(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Share Report</DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 2 }}>
              <TextField
                fullWidth
                label="Email Address"
                type="email"
                value={shareEmail}
                onChange={(e) => setShareEmail(e.target.value)}
                sx={{ mb: 3 }}
              />
              
              <DatePicker
                label="Expiration Date (Optional)"
                value={shareExpiration}
                onChange={setShareExpiration}
                minDate={new Date()}
                slotProps={{
                  textField: {
                    fullWidth: true
                  }
                }}
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShareModalOpen(false)}>
              Cancel
            </Button>
            <Button 
              variant="contained" 
              onClick={handleShareSubmit}
              disabled={!shareEmail}
            >
              Share Report
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </LocalizationProvider>
  );
};

export default Reports;