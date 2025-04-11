import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Button, Chip, TextField, Dialog, DialogTitle, DialogContent, DialogActions, CircularProgress, Alert, Avatar, Grid, IconButton, Tooltip, Card, CardContent } from '@mui/material';
import { styled } from '@mui/system';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import Sidebar from './Sidebar';
import { 
  Search as SearchIcon,
  Refresh as RefreshIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  ArrowUpward as ArrowUpwardIcon,
  ArrowDownward as ArrowDownwardIcon,
  FilterList as FilterListIcon,
  MoreVert as MoreVertIcon,
  AttachMoney as AttachMoneyIcon
} from '@mui/icons-material';
import { API } from '../axiosConfig';

// Define theme colors to match the user components
const colors = {
  primary: '#1976d2',
  secondary: '#9c27b0',
  background: '#121212',
  cardBg: '#1e1e1e',
  primaryText: '#ffffff',
  secondaryText: '#b3b3b3',
  borderColor: '#333333',
  buyGreen: '#4caf50',
  sellRed: '#f44336',
  hoverBg: '#2a2a2a',
  warningOrange: '#ffa500'
};

const PageContainer = styled('div')({
  display: 'flex',
  minHeight: '100vh',
  backgroundColor: colors.background,
  color: colors.primaryText
});

const MainContent = styled('div')({
  flexGrow: 1,
  padding: '20px',
  marginLeft: '250px' // Match sidebar width
});

const StyledCard = styled(Paper)({
  padding: '20px',
  backgroundColor: colors.cardBg,
  border: `1px solid ${colors.borderColor}`,
  borderRadius: '10px',
  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  transition: 'transform 0.2s ease',
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15)'
  }
});

const StatusIndicator = styled(Box)(({ status }) => ({
  width: 10,
  height: 10,
  borderRadius: '50%',
  marginRight: '8px',
  backgroundColor: 
    status === 'approved' ? colors.buyGreen : 
    status === 'rejected' ? colors.sellRed : 
    colors.warningOrange,
  boxShadow: 
    status === 'approved' ? `0 0 10px ${colors.buyGreen}40` : 
    status === 'rejected' ? `0 0 10px ${colors.sellRed}40` : 
    `0 0 10px ${colors.warningOrange}40`
}));

const TransactionPage = () => {
  const [requests, setRequests] = useState([]);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [performanceData, setPerformanceData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [feedback, setFeedback] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [performanceHistory, setPerformanceHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [historyError, setHistoryError] = useState(null);
  const [stats, setStats] = useState({
    totalRequests: 0,
    pendingRequests: 0,
    approvedRequests: 0,
    rejectedRequests: 0,
    totalAmount: 0
  });

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const response = await API.balance.getRequests();
      const requestsData = response.data.requests || [];
      setRequests(requestsData);
      
      // Calculate stats
      const totalAmount = requestsData.reduce((sum, req) => sum + (parseFloat(req.amount) || 0), 0);
      setStats({
        totalRequests: requestsData.length,
        pendingRequests: requestsData.filter(req => req.status === 'pending').length,
        approvedRequests: requestsData.filter(req => req.status === 'approved').length,
        rejectedRequests: requestsData.filter(req => req.status === 'rejected').length,
        totalAmount: totalAmount.toFixed(2)
      });
      
      // Generate chart data
      const chartData = [
        { name: 'Pending', value: requestsData.filter(req => req.status === 'pending').length },
        { name: 'Approved', value: requestsData.filter(req => req.status === 'approved').length },
        { name: 'Rejected', value: requestsData.filter(req => req.status === 'rejected').length }
      ];
      setPerformanceData(chartData);
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching balance requests:', error);
      setError('Failed to load balance requests');
      setLoading(false);
    }
  };

  const fetchPerformanceHistory = async (accountId) => {
    try {
      setHistoryLoading(true);
      const response = await API.balance.getHistory(accountId);
      setPerformanceHistory(response.data.history || []);
      setHistoryLoading(false);
    } catch (error) {
      console.error('Error fetching performance history:', error);
      setHistoryError('Failed to load performance history');
      setHistoryLoading(false);
    }
  };

  const handleReview = (request) => {
    setSelectedRequest(request);
    fetchPerformanceHistory(request.account_id);
    setDialogOpen(true);
  };

  const handleApprove = async () => {
    try {
      setActionLoading(true);
      await API.balance.approve({
        request_id: selectedRequest.request_id,
        feedback: feedback,
      });
      setDialogOpen(false);
      fetchRequests();
      setFeedback('');
    } catch (error) {
      console.error('Error approving request:', error);
      setError('Failed to approve request');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    try {
      setActionLoading(true);
      await API.balance.reject({
        request_id: selectedRequest.request_id,
        feedback: feedback,
      });
      setDialogOpen(false);
      fetchRequests();
      setFeedback('');
    } catch (error) {
      console.error('Error rejecting request:', error);
      setError('Failed to reject request');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRefresh = () => {
    fetchRequests();
  };

  const filteredRequests = requests.filter(request => {
    const matchesSearch = request.username.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         request.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         request.account_id.toString().includes(searchTerm);
    const matchesStatus = filterStatus === 'all' || request.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  // Add a function to format date/time nicely
  const formatDateTime = (dateTimeStr) => {
    if (!dateTimeStr) return 'N/A';
    const date = new Date(dateTimeStr);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Add a function to get time ago
  const getTimeAgo = (dateString) => {
    if (!dateString) return 'N/A';
    
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    
    if (diffDays > 30) return `${Math.floor(diffDays / 30)} months ago`;
    if (diffDays > 0) return `${diffDays} days ago`;
    if (diffHours > 0) return `${diffHours} hours ago`;
    if (diffMinutes > 0) return `${diffMinutes} minutes ago`;
    return 'Just now';
  };

  // Define colors for pie chart
  const COLORS = [colors.warningOrange, colors.buyGreen, colors.sellRed];

  return (
    <PageContainer>
      <Sidebar />
      <MainContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" sx={{ color: colors.primaryText }}>
            Balance Management
          </Typography>
          <Tooltip title="Refresh requests">
            <IconButton 
              onClick={handleRefresh}
              disabled={refreshing}
              sx={{ 
                color: colors.primary,
                '&:hover': { backgroundColor: `${colors.primary}22` }
              }}
            >
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Box>
        
        {error && (
          <Alert severity="error" sx={{ mb: 3, backgroundColor: `${colors.sellRed}22`, color: colors.sellRed, border: `1px solid ${colors.sellRed}` }}>
            {error}
          </Alert>
        )}

        {/* Dashboard stats at the top */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <StyledCard>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar sx={{ bgcolor: `${colors.primary}22`, mr: 1.5 }}>
                  <AttachMoneyIcon sx={{ color: colors.primary }} />
                </Avatar>
                <Typography variant="h6" sx={{ color: colors.primaryText }}>Total Requests</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'baseline' }}>
                <Typography variant="h3" sx={{ color: colors.primary, fontWeight: 600 }}>
                  {stats.totalRequests}
                </Typography>
                <Typography variant="body2" sx={{ color: colors.secondaryText, ml: 1 }}>
                  requests
                </Typography>
              </Box>
            </StyledCard>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <StyledCard>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar sx={{ bgcolor: `${colors.warningOrange}22`, mr: 1.5 }}>
                  <FilterListIcon sx={{ color: colors.warningOrange }} />
                </Avatar>
                <Typography variant="h6" sx={{ color: colors.primaryText }}>Pending</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'baseline' }}>
                <Typography variant="h3" sx={{ color: colors.warningOrange, fontWeight: 600 }}>
                  {stats.pendingRequests}
                </Typography>
                <Typography variant="body2" sx={{ color: colors.secondaryText, ml: 1 }}>
                  awaiting action
                </Typography>
              </Box>
            </StyledCard>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <StyledCard>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar sx={{ bgcolor: `${colors.buyGreen}22`, mr: 1.5 }}>
                  <CheckCircleIcon sx={{ color: colors.buyGreen }} />
                </Avatar>
                <Typography variant="h6" sx={{ color: colors.primaryText }}>Approved</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'baseline' }}>
                <Typography variant="h3" sx={{ color: colors.buyGreen, fontWeight: 600 }}>
                  {stats.approvedRequests}
                </Typography>
                <Typography variant="body2" sx={{ color: colors.secondaryText, ml: 1 }}>
                  requests
                </Typography>
              </Box>
            </StyledCard>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <StyledCard>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar sx={{ bgcolor: `${colors.sellRed}22`, mr: 1.5 }}>
                  <CancelIcon sx={{ color: colors.sellRed }} />
                </Avatar>
                <Typography variant="h6" sx={{ color: colors.primaryText }}>Rejected</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'baseline' }}>
                <Typography variant="h3" sx={{ color: colors.sellRed, fontWeight: 600 }}>
                  {stats.rejectedRequests}
                </Typography>
                <Typography variant="body2" sx={{ color: colors.secondaryText, ml: 1 }}>
                  requests
                </Typography>
              </Box>
            </StyledCard>
          </Grid>
        </Grid>
        
        {/* Overview charts section */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} md={8}>
            <Paper sx={{ 
              p: 3, 
              backgroundColor: colors.cardBg,
              border: `1px solid ${colors.borderColor}`,
              borderRadius: '10px',
              height: '100%'
            }}>
              <Typography variant="h6" sx={{ mb: 2, color: colors.primaryText }}>Request Timeline</Typography>
              
              {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 300 }}>
                  <CircularProgress size={40} sx={{ color: colors.primary }} />
                </Box>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart
                    data={[
                      { name: 'Pending', value: stats.pendingRequests, color: colors.warningOrange },
                      { name: 'Approved', value: stats.approvedRequests, color: colors.buyGreen },
                      { name: 'Rejected', value: stats.rejectedRequests, color: colors.sellRed }
                    ]}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke={colors.borderColor} />
                    <XAxis dataKey="name" stroke={colors.secondaryText} />
                    <YAxis stroke={colors.secondaryText} />
                    <RechartsTooltip 
                      contentStyle={{ 
                        backgroundColor: colors.cardBg, 
                        border: `1px solid ${colors.borderColor}`,
                        color: colors.primaryText,
                        borderRadius: '8px'
                      }} 
                    />
                    <Bar dataKey="value" name="Count">
                      {[
                        { name: 'Pending', value: stats.pendingRequests, color: colors.warningOrange },
                        { name: 'Approved', value: stats.approvedRequests, color: colors.buyGreen },
                        { name: 'Rejected', value: stats.rejectedRequests, color: colors.sellRed }
                      ].map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </Paper>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Paper sx={{ 
              p: 3, 
              backgroundColor: colors.cardBg,
              border: `1px solid ${colors.borderColor}`,
              borderRadius: '10px',
              height: '100%',
              display: 'flex',
              flexDirection: 'column'
            }}>
              <Typography variant="h6" sx={{ mb: 2, color: colors.primaryText }}>Request Distribution</Typography>
              
              {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flex: 1 }}>
                  <CircularProgress size={40} sx={{ color: colors.primary }} />
                </Box>
              ) : (
                <>
                  <Box sx={{ height: 220, display: 'flex', justifyContent: 'center' }}>
                    <ResponsiveContainer width="100%" height={220}>
                      <PieChart>
                        <Pie
                          data={performanceData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          labelLine={false}
                        >
                          {performanceData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                  </Box>
                  
                  <Box sx={{ mt: 'auto' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2" sx={{ color: colors.secondaryText }}>
                        Total Balance Requested:
                      </Typography>
                      <Typography variant="body1" sx={{ fontWeight: 'bold', color: colors.primaryText }}>
                        ${stats.totalAmount}
                      </Typography>
                    </Box>
                    <Button 
                      variant="outlined"
                      fullWidth
                      size="small"
                      onClick={handleRefresh}
                      sx={{ 
                        borderColor: colors.primary,
                        color: colors.primary,
                        '&:hover': {
                          backgroundColor: `${colors.primary}22`,
                          borderColor: colors.primary
                        }
                      }}
                    >
                      View Full Report
                    </Button>
                  </Box>
                </>
              )}
            </Paper>
          </Grid>
        </Grid>
        
        {/* Request list */}
        <Paper sx={{ 
          p: 3, 
          backgroundColor: colors.cardBg,
          border: `1px solid ${colors.borderColor}`,
          borderRadius: '10px'
        }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h5" sx={{ color: colors.primaryText }}>Balance Requests</Typography>
            
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                placeholder="Search requests..."
                variant="outlined"
                size="small"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: <SearchIcon sx={{ mr: 1, color: colors.secondaryText }} />,
                  sx: {
                    color: colors.primaryText,
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: colors.borderColor
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: colors.primary
                    }
                  }
                }}
              />
              
              <Box>
                <Button 
                  variant={filterStatus === 'all' ? 'contained' : 'outlined'} 
                  size="small"
                  onClick={() => setFilterStatus('all')}
                  sx={{ 
                    mr: 1,
                    backgroundColor: filterStatus === 'all' ? colors.primary : 'transparent',
                    color: filterStatus === 'all' ? '#fff' : colors.primary,
                    borderColor: colors.primary,
                    '&:hover': {
                      backgroundColor: filterStatus === 'all' ? colors.primary : `${colors.primary}22`
                    }
                  }}
                >
                  All
                </Button>
                <Button 
                  variant={filterStatus === 'pending' ? 'contained' : 'outlined'} 
                  size="small"
                  onClick={() => setFilterStatus('pending')}
                  sx={{ 
                    mr: 1,
                    backgroundColor: filterStatus === 'pending' ? colors.warningOrange : 'transparent',
                    color: filterStatus === 'pending' ? '#fff' : colors.warningOrange,
                    borderColor: colors.warningOrange,
                    '&:hover': {
                      backgroundColor: filterStatus === 'pending' ? colors.warningOrange : `${colors.warningOrange}22`
                    }
                  }}
                >
                  Pending
                </Button>
              </Box>
            </Box>
          </Box>
          
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ color: colors.secondaryText, borderBottom: `1px solid ${colors.borderColor}` }}>Request ID</TableCell>
                  <TableCell sx={{ color: colors.secondaryText, borderBottom: `1px solid ${colors.borderColor}` }}>User</TableCell>
                  <TableCell sx={{ color: colors.secondaryText, borderBottom: `1px solid ${colors.borderColor}` }}>Amount</TableCell>
                  <TableCell sx={{ color: colors.secondaryText, borderBottom: `1px solid ${colors.borderColor}` }}>Status</TableCell>
                  <TableCell sx={{ color: colors.secondaryText, borderBottom: `1px solid ${colors.borderColor}` }}>Date</TableCell>
                  <TableCell sx={{ color: colors.secondaryText, borderBottom: `1px solid ${colors.borderColor}` }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredRequests && filteredRequests.length > 0 ? (
                  filteredRequests.map((request) => (
                    <TableRow key={request.request_id} sx={{ '&:hover': { backgroundColor: colors.hoverBg } }}>
                      <TableCell sx={{ color: colors.primaryText, borderBottom: `1px solid ${colors.borderColor}` }}>
                        #{request.request_id}
                      </TableCell>
                      <TableCell sx={{ color: colors.primaryText, borderBottom: `1px solid ${colors.borderColor}` }}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Avatar sx={{ width: 32, height: 32, bgcolor: colors.primary, mr: 1.5 }}>
                            {request.username ? request.username.charAt(0).toUpperCase() : 'U'}
                          </Avatar>
                          <Box>
                            <Typography variant="body2">{request.username}</Typography>
                            <Typography variant="caption" color={colors.secondaryText}>{request.email}</Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell sx={{ color: colors.primaryText, borderBottom: `1px solid ${colors.borderColor}` }}>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          ${parseFloat(request.amount).toFixed(2)}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ borderBottom: `1px solid ${colors.borderColor}` }}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <StatusIndicator status={request.status} />
                          <Chip 
                            label={request.status.toUpperCase()} 
                            size="small"
                            sx={{ 
                              backgroundColor: 
                                request.status === 'approved' ? `${colors.buyGreen}22` : 
                                request.status === 'rejected' ? `${colors.sellRed}22` : 
                                `${colors.warningOrange}22`,
                              color: 
                                request.status === 'approved' ? colors.buyGreen : 
                                request.status === 'rejected' ? colors.sellRed : 
                                colors.warningOrange,
                              fontWeight: 500
                            }}
                          />
                        </Box>
                      </TableCell>
                      <TableCell sx={{ color: colors.primaryText, borderBottom: `1px solid ${colors.borderColor}` }}>
                        <Box>
                          <Typography variant="body2">{formatDateTime(request.created_at)}</Typography>
                          <Typography variant="caption" color={colors.secondaryText}>{getTimeAgo(request.created_at)}</Typography>
                        </Box>
                      </TableCell>
                      <TableCell sx={{ borderBottom: `1px solid ${colors.borderColor}` }}>
                        {request.status === 'pending' ? (
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <Button 
                              variant="outlined" 
                              size="small" 
                              onClick={() => handleReview(request)}
                              sx={{ 
                                color: colors.primary,
                                borderColor: colors.primary,
                                '&:hover': {
                                  backgroundColor: `${colors.primary}22`
                                }
                              }}
                            >
                              Review
                            </Button>
                          </Box>
                        ) : (
                          <Button 
                            variant="outlined" 
                            size="small" 
                            onClick={() => handleReview(request)}
                            sx={{ 
                              color: colors.secondaryText,
                              borderColor: colors.borderColor,
                              '&:hover': {
                                backgroundColor: colors.hoverBg
                              }
                            }}
                          >
                            Details
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ color: colors.secondaryText, py: 4, borderBottom: `1px solid ${colors.borderColor}` }}>
                      {loading ? (
                        <CircularProgress size={32} sx={{ color: colors.primary }} />
                      ) : (
                        'No balance requests found'
                      )}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>

        <Dialog 
          open={dialogOpen} 
          onClose={() => setDialogOpen(false)} 
          maxWidth="md" 
          fullWidth
          PaperProps={{
            sx: {
              backgroundColor: colors.cardBg,
              color: colors.primaryText,
              border: `1px solid ${colors.borderColor}`
            }
          }}
        >
          <DialogTitle sx={{ borderBottom: `1px solid ${colors.borderColor}` }}>Review Balance Request</DialogTitle>
          <DialogContent dividers sx={{ borderColor: colors.borderColor }}>
            {selectedRequest && (
              <Box>
                <Typography variant="h6" gutterBottom sx={{ color: colors.primaryText }}>
                  User: {selectedRequest.username} (Account #{selectedRequest.account_id})
                </Typography>
                <Typography gutterBottom sx={{ color: colors.primaryText }}>
                  Requested Amount: <strong style={{ color: colors.primary }}>${selectedRequest.amount.toFixed(2)}</strong>
                </Typography>
                <Typography gutterBottom sx={{ color: colors.primaryText }}>
                  Current Balance: <strong style={{ color: colors.primary }}>${selectedRequest.current_balance.toFixed(2)}</strong>
                </Typography>
                <Typography gutterBottom sx={{ color: colors.primaryText }}>
                  Margin Used: <strong style={{ color: colors.primary }}>${selectedRequest.margin_used.toFixed(2)}</strong>
                </Typography>

                <Box sx={{ mt: 4, mb: 2 }}>
                  <Typography variant="h6" gutterBottom sx={{ color: colors.primaryText }}>
                    Performance History
                  </Typography>
                  {performanceHistory.length > 0 ? (
                    <Box sx={{ height: 300, width: '100%' }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                          data={performanceHistory}
                          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke={colors.borderColor} />
                          <XAxis 
                            dataKey="date" 
                            stroke={colors.secondaryText}
                            tick={{ fill: colors.secondaryText }}
                          />
                          <YAxis 
                            stroke={colors.secondaryText}
                            tick={{ fill: colors.secondaryText }}
                          />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: colors.cardBg, 
                              border: `1px solid ${colors.borderColor}`,
                              color: colors.primaryText
                            }}
                          />
                        <Legend />
                          <Line 
                            type="monotone" 
                            dataKey="profit" 
                            stroke={colors.buyGreen} 
                            activeDot={{ r: 8 }} 
                          />
                          <Line 
                            type="monotone" 
                            dataKey="loss" 
                            stroke={colors.sellRed} 
                            activeDot={{ r: 8 }} 
                          />
                      </LineChart>
                    </ResponsiveContainer>
                  </Box>
                  ) : (
                    <Typography sx={{ color: colors.secondaryText }}>No performance data available</Typography>
                  )}
                </Box>

                  <TextField
                  fullWidth
                    multiline
                  rows={4}
                  label="Feedback"
                  variant="outlined"
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                  sx={{ mt: 2 }}
                  InputProps={{
                    sx: {
                      color: colors.primaryText,
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: colors.borderColor
                      },
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: colors.primary
                      },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: colors.primary
                      }
                    }
                  }}
                  InputLabelProps={{
                    sx: { color: colors.secondaryText }
                  }}
                />
              </Box>
            )}
          </DialogContent>
          <DialogActions sx={{ borderTop: `1px solid ${colors.borderColor}`, p: 2 }}>
            <Button 
              onClick={() => setDialogOpen(false)}
              sx={{ 
                color: colors.secondaryText,
                '&:hover': {
                  backgroundColor: colors.hoverBg
                }
              }}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleReject} 
              disabled={actionLoading}
              startIcon={<CancelIcon />}
              sx={{ 
                color: colors.sellRed,
                '&:hover': {
                  backgroundColor: `${colors.sellRed}22`
                }
              }}
            >
              Reject
            </Button>
            <Button 
              onClick={handleApprove} 
              disabled={actionLoading}
              startIcon={<CheckCircleIcon />}
              sx={{ 
                color: colors.buyGreen,
                '&:hover': {
                  backgroundColor: `${colors.buyGreen}22`
                }
              }}
            >
              Approve
            </Button>
          </DialogActions>
        </Dialog>
      </MainContent>
    </PageContainer>
  );
};

export default TransactionPage;