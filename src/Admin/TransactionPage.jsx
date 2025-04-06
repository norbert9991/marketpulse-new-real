import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Button, Chip, TextField, Dialog, DialogTitle, DialogContent, DialogActions, CircularProgress, Alert, Avatar } from '@mui/material';
import { styled } from '@mui/system';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import Sidebar from './Sidebar';
import { 
  Search as SearchIcon,
  Refresh as RefreshIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon
} from '@mui/icons-material';

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
  hoverBg: '#2a2a2a'
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

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      setRefreshing(true);
      const response = await fetch('http://localhost:5000/api/balance-requests');
      const data = await response.json();
      setRequests(data);
      setLoading(false);
      setRefreshing(false);
    } catch (err) {
      setError('Failed to fetch requests');
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchPerformanceData = async (accountId) => {
    try {
      const response = await fetch(`http://localhost:5000/api/performance-history/${accountId}`);
      const data = await response.json();
      setPerformanceData(data);
    } catch (err) {
      setError('Failed to fetch performance data');
    }
  };

  const handleReview = (request) => {
    setSelectedRequest(request);
    fetchPerformanceData(request.account_id);
    setDialogOpen(true);
  };

  const handleApprove = async () => {
    try {
      setActionLoading(true);
      await fetch('http://localhost:5000/api/balance-requests/approve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          request_id: selectedRequest.request_id,
          feedback: feedback,
        }),
      });
      setDialogOpen(false);
      fetchRequests();
      setFeedback('');
    } catch (err) {
      setError('Failed to approve request');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    try {
      setActionLoading(true);
      await fetch('http://localhost:5000/api/balance-requests/reject', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          request_id: selectedRequest.request_id,
          feedback: feedback,
        }),
      });
      setDialogOpen(false);
      fetchRequests();
      setFeedback('');
    } catch (err) {
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

  return (
    <PageContainer>
      <Sidebar />
      <MainContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" sx={{ color: colors.primaryText }}>
          Virtual Balance Requests
        </Typography>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={handleRefresh}
            disabled={refreshing}
            sx={{ 
              color: colors.primary,
              borderColor: colors.primary,
              '&:hover': {
                borderColor: colors.primary,
                backgroundColor: `${colors.primary}22`
              }
            }}
          >
            Refresh
          </Button>
        </Box>
        
        {error && (
          <Alert severity="error" sx={{ mb: 2, backgroundColor: `${colors.sellRed}22`, color: colors.sellRed, border: `1px solid ${colors.sellRed}` }}>
            {error}
          </Alert>
        )}

        <Paper sx={{ 
          p: 3, 
          mb: 3, 
          backgroundColor: colors.cardBg,
          border: `1px solid ${colors.borderColor}`,
          borderRadius: '8px'
        }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3, flexDirection: { xs: 'column', sm: 'row' }, gap: 2 }}>
          <TextField
            label="Search Users"
            variant="outlined"
            size="small"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <SearchIcon sx={{ mr: 1, color: colors.secondaryText }} />
                ),
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
              sx={{ flexGrow: 1, maxWidth: { sm: '300px' } }}
          />
          <Box>
            <Button 
              variant={filterStatus === 'all' ? 'contained' : 'outlined'} 
              onClick={() => setFilterStatus('all')}
                sx={{ 
                  mr: 1,
                  backgroundColor: filterStatus === 'all' ? colors.primary : 'transparent',
                  color: filterStatus === 'all' ? colors.primaryText : colors.primaryText,
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
              onClick={() => setFilterStatus('pending')}
                sx={{ 
                  mr: 1,
                  backgroundColor: filterStatus === 'pending' ? colors.primary : 'transparent',
                  color: filterStatus === 'pending' ? colors.primaryText : colors.primaryText,
                  borderColor: colors.primary,
                  '&:hover': {
                    backgroundColor: filterStatus === 'pending' ? colors.primary : `${colors.primary}22`
                  }
                }}
            >
              Pending
            </Button>
            <Button 
              variant={filterStatus === 'approved' ? 'contained' : 'outlined'} 
              onClick={() => setFilterStatus('approved')}
                sx={{ 
                  mr: 1,
                  backgroundColor: filterStatus === 'approved' ? colors.buyGreen : 'transparent',
                  color: filterStatus === 'approved' ? colors.primaryText : colors.primaryText,
                  borderColor: colors.buyGreen,
                  '&:hover': {
                    backgroundColor: filterStatus === 'approved' ? colors.buyGreen : `${colors.buyGreen}22`
                  }
                }}
            >
              Approved
            </Button>
            <Button 
              variant={filterStatus === 'rejected' ? 'contained' : 'outlined'} 
              onClick={() => setFilterStatus('rejected')}
                sx={{ 
                  backgroundColor: filterStatus === 'rejected' ? colors.sellRed : 'transparent',
                  color: filterStatus === 'rejected' ? colors.primaryText : colors.primaryText,
                  borderColor: colors.sellRed,
                  '&:hover': {
                    backgroundColor: filterStatus === 'rejected' ? colors.sellRed : `${colors.sellRed}22`
                  }
                }}
            >
              Rejected
            </Button>
          </Box>
        </Box>
        </Paper>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
            <CircularProgress sx={{ color: colors.primary }} />
          </Box>
        ) : (
          <TableContainer component={Paper} sx={{ 
            backgroundColor: colors.cardBg,
            border: `1px solid ${colors.borderColor}`,
            borderRadius: '8px'
          }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ color: colors.secondaryText, borderBottom: `1px solid ${colors.borderColor}` }}>User</TableCell>
                  <TableCell sx={{ color: colors.secondaryText, borderBottom: `1px solid ${colors.borderColor}` }}>Account</TableCell>
                  <TableCell sx={{ color: colors.secondaryText, borderBottom: `1px solid ${colors.borderColor}` }}>Requested Amount</TableCell>
                  <TableCell sx={{ color: colors.secondaryText, borderBottom: `1px solid ${colors.borderColor}` }}>Current Balance</TableCell>
                  <TableCell sx={{ color: colors.secondaryText, borderBottom: `1px solid ${colors.borderColor}` }}>Status</TableCell>
                  <TableCell sx={{ color: colors.secondaryText, borderBottom: `1px solid ${colors.borderColor}` }}>Request Date</TableCell>
                  <TableCell sx={{ color: colors.secondaryText, borderBottom: `1px solid ${colors.borderColor}` }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredRequests.map((request) => (
                  <TableRow key={request.request_id} sx={{ '&:hover': { backgroundColor: colors.hoverBg } }}>
                    <TableCell sx={{ color: colors.primaryText, borderBottom: `1px solid ${colors.borderColor}` }}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Avatar sx={{ width: 32, height: 32, mr: 1, bgcolor: colors.primary }}>{request.username.charAt(0).toUpperCase()}</Avatar>
                        <Box>
                          <Typography variant="body2" sx={{ color: colors.primaryText }}>{request.username}</Typography>
                          <Typography variant="caption" sx={{ color: colors.secondaryText }}>{request.email}</Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell sx={{ color: colors.primaryText, borderBottom: `1px solid ${colors.borderColor}` }}>#{request.account_id}</TableCell>
                    <TableCell sx={{ color: colors.primaryText, borderBottom: `1px solid ${colors.borderColor}` }}>${request.amount.toFixed(2)}</TableCell>
                    <TableCell sx={{ color: colors.primaryText, borderBottom: `1px solid ${colors.borderColor}` }}>${request.current_balance.toFixed(2)}</TableCell>
                    <TableCell sx={{ borderBottom: `1px solid ${colors.borderColor}` }}>
                      <Chip 
                        label={request.status} 
                        size="small" 
                        sx={{ 
                          backgroundColor: 
                            request.status === 'approved' ? `${colors.buyGreen}33` : 
                            request.status === 'rejected' ? `${colors.sellRed}33` : 
                            `${colors.primary}33`,
                          color: 
                            request.status === 'approved' ? colors.buyGreen : 
                            request.status === 'rejected' ? colors.sellRed : 
                            colors.primary
                        }} 
                      />
                    </TableCell>
                    <TableCell sx={{ color: colors.primaryText, borderBottom: `1px solid ${colors.borderColor}` }}>
                      {new Date(request.request_date).toLocaleString()}
                    </TableCell>
                    <TableCell sx={{ borderBottom: `1px solid ${colors.borderColor}` }}>
                      {request.status === 'pending' && (
                        <Button 
                          variant="outlined" 
                          size="small"
                          onClick={() => handleReview(request)}
                          sx={{ 
                            color: colors.primary,
                            borderColor: colors.primary,
                            '&:hover': {
                              borderColor: colors.primary,
                              backgroundColor: `${colors.primary}22`
                            }
                          }}
                        >
                          Review
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}

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
                  {performanceData.length > 0 ? (
                    <Box sx={{ height: 300, width: '100%' }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                          data={performanceData}
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