// UserManagement.jsx
import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Button,
  CircularProgress,
  TextField,
  InputAdornment,
  IconButton,
  Tooltip,
  Grid,
  Avatar
} from '@mui/material';
import { styled } from '@mui/system';
import { API } from '../axiosConfig';
import { useNavigate } from 'react-router-dom';
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
  hoverBg: '#2a2a2a',
  warningOrange: '#ffa500',
  accentBlue: '#007bff'
};

// Create a styled container for the layout
const DashboardContainer = styled('div')({
  display: 'flex',
  minHeight: '100vh',
  backgroundColor: colors.background,
  color: colors.primaryText
});

const MainContent = styled('div')({
  flex: 1,
  padding: '20px',
  marginLeft: '250px' // Match sidebar width
});

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [filterRole, setFilterRole] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    admins: 0,
    recentLogins: 0,
    newUsers: 0
  });
  const navigate = useNavigate();

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await API.admin.getUsers();
      setUsers(response.data.users);
      
      // Calculate stats
      const now = new Date();
      const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      
      setStats({
        totalUsers: response.data.users.length,
        activeUsers: response.data.users.filter(user => user.account_status === 'active').length,
        admins: response.data.users.filter(user => user.role === 'admin').length,
        recentLogins: response.data.users.filter(user => new Date(user.last_login) > dayAgo).length,
        newUsers: response.data.users.filter(user => new Date(user.created_at) > weekAgo).length
      });
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching users:', error);
      setError('Failed to load users');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [navigate]);

  const updateUserStatus = async (userId, newStatus) => {
    try {
      setRefreshing(true);
      await API.admin.updateUserStatus(userId, newStatus);
      
      // Refresh the user list
      fetchUsers();
      setRefreshing(false);
    } catch (error) {
      console.error('Error updating user status:', error);
      setError('Failed to update user status');
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    fetchUsers();
  };

  // Get time difference as a string
  const getTimeAgo = (dateString) => {
    if (!dateString) return 'Never';
    
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
  
  // Get login status visually
  const getLoginStatus = (dateString, accountStatus) => {
    // If user is suspended, always show red dot
    if (accountStatus === 'suspended') {
      return { color: colors.sellRed, text: 'Suspended' };
    }
    
    if (!dateString) return { color: colors.secondaryText, text: 'Never logged in' };
    
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays > 30) return { color: colors.secondaryText, text: 'Inactive' };
    if (diffDays > 7) return { color: colors.warningOrange, text: 'Away' };
    return { color: colors.buyGreen, text: 'Active' };
  };

  // Filter users based on search, role and status
  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.user_id?.toString().includes(searchTerm);
    
    const matchesRole = filterRole === 'all' || user.role === filterRole;
    const matchesStatus = filterStatus === 'all' || user.account_status === filterStatus;
    
    return matchesSearch && matchesRole && matchesStatus;
  })
  // Sort users by ID in ascending order
  .sort((a, b) => {
    // Convert to numbers to ensure correct numeric sorting
    return parseInt(a.user_id) - parseInt(b.user_id);
  });

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="100vh" sx={{ backgroundColor: colors.background }}>
        <CircularProgress sx={{ color: colors.primary }} />
      </Box>
    );
  }

  if (error) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="100vh" sx={{ backgroundColor: colors.background }}>
        <Typography color={colors.sellRed}>{error}</Typography>
      </Box>
    );
  }

  return (
    <DashboardContainer>
      <Sidebar />
      
      <MainContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" sx={{ color: colors.primaryText }}>User Management</Typography>
          <Tooltip title="Refresh users">
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
        
        {/* User stats cards */}
        <Box sx={{ mb: 3 }}>
          <Grid container spacing={2}>
            <Grid item xs={6} sm={4} md={2.4}>
              <Paper sx={{ 
                p: 2, 
                backgroundColor: colors.cardBg,
                border: `1px solid ${colors.borderColor}`,
                borderRadius: '8px',
                textAlign: 'center',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center'
              }}>
                <Typography variant="body2" color={colors.secondaryText}>Total Users</Typography>
                <Typography variant="h5" color={colors.primaryText} sx={{ mt: 1, fontWeight: 'bold' }}>{stats.totalUsers}</Typography>
              </Paper>
            </Grid>
            <Grid item xs={6} sm={4} md={2.4}>
              <Paper sx={{ 
                p: 2, 
                backgroundColor: colors.cardBg,
                border: `1px solid ${colors.borderColor}`,
                borderRadius: '8px',
                textAlign: 'center',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center'
              }}>
                <Typography variant="body2" color={colors.secondaryText}>Active Users</Typography>
                <Typography variant="h5" color={colors.buyGreen} sx={{ mt: 1, fontWeight: 'bold' }}>{stats.activeUsers}</Typography>
              </Paper>
            </Grid>
            <Grid item xs={6} sm={4} md={2.4}>
              <Paper sx={{ 
                p: 2, 
                backgroundColor: colors.cardBg,
                border: `1px solid ${colors.borderColor}`,
                borderRadius: '8px',
                textAlign: 'center',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center'
              }}>
                <Typography variant="body2" color={colors.secondaryText}>Admin Users</Typography>
                <Typography variant="h5" color={colors.secondary} sx={{ mt: 1, fontWeight: 'bold' }}>{stats.admins}</Typography>
              </Paper>
            </Grid>
            <Grid item xs={6} sm={4} md={2.4}>
              <Paper sx={{ 
                p: 2, 
                backgroundColor: colors.cardBg,
                border: `1px solid ${colors.borderColor}`,
                borderRadius: '8px',
                textAlign: 'center',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center'
              }}>
                <Typography variant="body2" color={colors.secondaryText}>Recent Logins (24h)</Typography>
                <Typography variant="h5" color={colors.accentBlue} sx={{ mt: 1, fontWeight: 'bold' }}>{stats.recentLogins}</Typography>
              </Paper>
            </Grid>
            <Grid item xs={6} sm={4} md={2.4}>
              <Paper sx={{ 
                p: 2, 
                backgroundColor: colors.cardBg,
                border: `1px solid ${colors.borderColor}`,
                borderRadius: '8px',
                textAlign: 'center',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center'
              }}>
                <Typography variant="body2" color={colors.secondaryText}>New Users (7d)</Typography>
                <Typography variant="h5" color={colors.primary} sx={{ mt: 1, fontWeight: 'bold' }}>{stats.newUsers}</Typography>
              </Paper>
            </Grid>
          </Grid>
        </Box>
        
        {/* User List section */}
        <Paper 
          sx={{ 
            p: 3, 
            backgroundColor: colors.cardBg,
            border: `1px solid ${colors.borderColor}`,
            borderRadius: '8px'
          }}
        >
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" sx={{ mb: 2, color: colors.primaryText }}>User Directory</Typography>
            
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  variant="outlined"
                  placeholder="Search users by ID, username, or email"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon sx={{ color: colors.secondaryText }} />
                      </InputAdornment>
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
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="caption" color={colors.secondaryText} sx={{ mb: 0.5, display: 'block' }}>Filter by Role</Typography>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Button 
                        variant={filterRole === 'all' ? 'contained' : 'outlined'} 
                        size="small"
                        onClick={() => setFilterRole('all')}
                        sx={{ 
                          flex: 1,
                          backgroundColor: filterRole === 'all' ? colors.primary : 'transparent',
                          color: filterRole === 'all' ? colors.primaryText : colors.primary,
                          borderColor: colors.primary,
                          '&:hover': {
                            backgroundColor: filterRole === 'all' ? colors.primary : `${colors.primary}22`,
                            borderColor: colors.primary
                          }
                        }}
                      >
                        All
                      </Button>
                      <Button 
                        variant={filterRole === 'user' ? 'contained' : 'outlined'} 
                        size="small"
                        onClick={() => setFilterRole('user')}
                        sx={{ 
                          flex: 1,
                          backgroundColor: filterRole === 'user' ? colors.primary : 'transparent',
                          color: filterRole === 'user' ? colors.primaryText : colors.primary,
                          borderColor: colors.primary,
                          '&:hover': {
                            backgroundColor: filterRole === 'user' ? colors.primary : `${colors.primary}22`,
                            borderColor: colors.primary
                          }
                        }}
                      >
                        Users
                      </Button>
                      <Button 
                        variant={filterRole === 'admin' ? 'contained' : 'outlined'} 
                        size="small"
                        onClick={() => setFilterRole('admin')}
                        sx={{ 
                          flex: 1,
                          backgroundColor: filterRole === 'admin' ? colors.secondary : 'transparent',
                          color: filterRole === 'admin' ? colors.primaryText : colors.secondary,
                          borderColor: colors.secondary,
                          '&:hover': {
                            backgroundColor: filterRole === 'admin' ? colors.secondary : `${colors.secondary}22`,
                            borderColor: colors.secondary
                          }
                        }}
                      >
                        Admins
                      </Button>
                    </Box>
                  </Box>
                  
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="caption" color={colors.secondaryText} sx={{ mb: 0.5, display: 'block' }}>Filter by Status</Typography>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Button 
                        variant={filterStatus === 'all' ? 'contained' : 'outlined'} 
                        size="small"
                        onClick={() => setFilterStatus('all')}
                        sx={{ 
                          flex: 1,
                          backgroundColor: filterStatus === 'all' ? colors.primary : 'transparent',
                          color: filterStatus === 'all' ? colors.primaryText : colors.primary,
                          borderColor: colors.primary,
                          '&:hover': {
                            backgroundColor: filterStatus === 'all' ? colors.primary : `${colors.primary}22`,
                            borderColor: colors.primary
                          }
                        }}
                      >
                        All
                      </Button>
                      <Button 
                        variant={filterStatus === 'active' ? 'contained' : 'outlined'} 
                        size="small"
                        onClick={() => setFilterStatus('active')}
                        sx={{ 
                          flex: 1,
                          backgroundColor: filterStatus === 'active' ? colors.buyGreen : 'transparent',
                          color: filterStatus === 'active' ? colors.primaryText : colors.buyGreen,
                          borderColor: colors.buyGreen,
                          '&:hover': {
                            backgroundColor: filterStatus === 'active' ? colors.buyGreen : `${colors.buyGreen}22`,
                            borderColor: colors.buyGreen
                          }
                        }}
                      >
                        Active
                      </Button>
                      <Button 
                        variant={filterStatus === 'suspended' ? 'contained' : 'outlined'} 
                        size="small"
                        onClick={() => setFilterStatus('suspended')}
                        sx={{ 
                          flex: 1.4,
                          minWidth: '110px',
                          backgroundColor: filterStatus === 'suspended' ? colors.sellRed : 'transparent',
                          color: filterStatus === 'suspended' ? colors.primaryText : colors.sellRed,
                          borderColor: colors.sellRed,
                          '&:hover': {
                            backgroundColor: filterStatus === 'suspended' ? colors.sellRed : `${colors.sellRed}22`,
                            borderColor: colors.sellRed
                          }
                        }}
                      >
                        Suspended
                      </Button>
                    </Box>
                  </Box>
                </Box>
              </Grid>
            </Grid>
          </Box>
          
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ color: colors.secondaryText, borderBottom: `1px solid ${colors.borderColor}` }}>ID</TableCell>
                  <TableCell sx={{ color: colors.secondaryText, borderBottom: `1px solid ${colors.borderColor}` }}>Username</TableCell>
                  <TableCell sx={{ color: colors.secondaryText, borderBottom: `1px solid ${colors.borderColor}` }}>Email</TableCell>
                  <TableCell sx={{ color: colors.secondaryText, borderBottom: `1px solid ${colors.borderColor}` }}>Role</TableCell>
                  <TableCell sx={{ color: colors.secondaryText, borderBottom: `1px solid ${colors.borderColor}` }}>Status</TableCell>
                  <TableCell sx={{ color: colors.secondaryText, borderBottom: `1px solid ${colors.borderColor}` }}>Last Login</TableCell>
                  <TableCell sx={{ color: colors.secondaryText, borderBottom: `1px solid ${colors.borderColor}` }}>Created At</TableCell>
                  <TableCell sx={{ color: colors.secondaryText, borderBottom: `1px solid ${colors.borderColor}` }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredUsers && filteredUsers.length > 0 ? (
                  filteredUsers.map((user) => (
                    <TableRow key={user.user_id} sx={{ '&:hover': { backgroundColor: colors.hoverBg } }}>
                      <TableCell sx={{ color: colors.primaryText, borderBottom: `1px solid ${colors.borderColor}` }}>{user.user_id}</TableCell>
                      <TableCell sx={{ color: colors.primaryText, borderBottom: `1px solid ${colors.borderColor}` }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Avatar 
                            sx={{ 
                              width: 32, 
                              height: 32, 
                              backgroundColor: user.role === 'admin' ? colors.secondary : colors.primary
                            }}
                          >
                            {user.username.charAt(0).toUpperCase()}
                          </Avatar>
                          {user.username}
                        </Box>
                      </TableCell>
                      <TableCell sx={{ color: colors.primaryText, borderBottom: `1px solid ${colors.borderColor}` }}>{user.email}</TableCell>
                      <TableCell sx={{ color: colors.primaryText, borderBottom: `1px solid ${colors.borderColor}` }}>
                        <Chip 
                          label={user.role} 
                          size="small"
                          sx={{ 
                            backgroundColor: user.role === 'admin' ? `${colors.secondary}33` : `${colors.primary}33`,
                            color: user.role === 'admin' ? colors.secondary : colors.primary
                          }}
                        />
                      </TableCell>
                      <TableCell sx={{ borderBottom: `1px solid ${colors.borderColor}` }}>
                        <Chip 
                          label={user.account_status} 
                          size="small"
                          sx={{ 
                            backgroundColor: user.account_status === 'active' ? `${colors.buyGreen}33` : `${colors.sellRed}33`,
                            color: user.account_status === 'active' ? colors.buyGreen : colors.sellRed
                          }}
                        />
                      </TableCell>
                      <TableCell sx={{ color: colors.primaryText, borderBottom: `1px solid ${colors.borderColor}` }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Box sx={{ 
                            width: 8, 
                            height: 8, 
                            borderRadius: '50%', 
                            backgroundColor: getLoginStatus(user.last_login, user.account_status).color 
                          }} />
                          <Box>
                            <Typography variant="body2">{getTimeAgo(user.last_login)}</Typography>
                            <Typography variant="caption" color={colors.secondaryText}>
                              {user.last_login ? new Date(user.last_login).toLocaleString() : 'Never'}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell sx={{ color: colors.primaryText, borderBottom: `1px solid ${colors.borderColor}` }}>
                        <Box>
                          <Typography variant="body2">{new Date(user.created_at).toLocaleDateString()}</Typography>
                          <Typography variant="caption" color={colors.secondaryText}>
                            {getTimeAgo(user.created_at)}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell sx={{ borderBottom: `1px solid ${colors.borderColor}` }}>
                        <Button 
                          variant="outlined" 
                          size="small" 
                          onClick={() => updateUserStatus(user.user_id, user.account_status === 'active' ? 'suspended' : 'active')}
                          startIcon={user.account_status === 'active' ? <CancelIcon /> : <CheckCircleIcon />}
                          sx={{ 
                            color: user.account_status === 'active' ? colors.sellRed : colors.buyGreen,
                            borderColor: user.account_status === 'active' ? colors.sellRed : colors.buyGreen,
                            '&:hover': {
                              borderColor: user.account_status === 'active' ? colors.sellRed : colors.buyGreen,
                              backgroundColor: user.account_status === 'active' ? `${colors.sellRed}22` : `${colors.buyGreen}22`
                            }
                          }}
                        >
                          {user.account_status === 'active' ? 'Suspend' : 'Activate'}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : loading ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center" sx={{ py: 4, borderBottom: `1px solid ${colors.borderColor}` }}>
                      <CircularProgress size={32} sx={{ color: colors.primary }} />
                    </TableCell>
                  </TableRow>
                ) : (
                  <TableRow>
                    <TableCell colSpan={8} align="center" sx={{ py: 4, borderBottom: `1px solid ${colors.borderColor}` }}>
                      <Typography color={colors.secondaryText}>No users found</Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      </MainContent>
    </DashboardContainer>
  );
};

export default UserManagement;