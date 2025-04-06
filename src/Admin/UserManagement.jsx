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
  Tooltip
} from '@mui/material';
import { styled } from '@mui/system';
import axios from 'axios';
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
  hoverBg: '#2a2a2a'
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
  const navigate = useNavigate();

  const fetchUsers = async () => {
    try {
      setRefreshing(true);
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      const response = await axios.get('http://localhost:5000/api/admin/users', {
        headers: {
          'Authorization': token
        }
      });

      if (response.data && response.data.users) {
        setUsers(response.data.users);
      } else {
        setError('No users data received');
      }
    } catch (err) {
      console.error('Error fetching users:', err);
      setError(err.message || 'Failed to fetch users');
      if (err.response?.status === 401) {
        navigate('/login');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [navigate]);

  const handleUserStatusChange = async (userId, currentStatus) => {
    try {
      const token = localStorage.getItem('token');
      const newStatus = currentStatus === 'active' ? 'suspended' : 'active';

      await axios.put(
        `http://localhost:5000/api/admin/users/${userId}/status`,
        { status: newStatus },
        {
          headers: {
            'Authorization': token
          }
        }
      );

      setUsers(prevUsers => 
        prevUsers.map(user =>
          user.user_id === userId ? { ...user, account_status: newStatus } : user
        )
      );
    } catch (err) {
      console.error('Error updating user status:', err);
      setError('Failed to update user status');
    }
  };

  const handleRefresh = () => {
    fetchUsers();
  };

  const filteredUsers = users.filter(user => 
    user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.user_id.toString().includes(searchTerm)
  );

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
        
        <Paper 
          sx={{ 
            p: 3, 
            backgroundColor: colors.cardBg,
            border: `1px solid ${colors.borderColor}`,
            borderRadius: '8px'
          }}
        >
          <Box sx={{ mb: 3 }}>
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
                      <TableCell sx={{ color: colors.primaryText, borderBottom: `1px solid ${colors.borderColor}` }}>{user.username}</TableCell>
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
                        {new Date(user.last_login).toLocaleString()}
                      </TableCell>
                      <TableCell sx={{ color: colors.primaryText, borderBottom: `1px solid ${colors.borderColor}` }}>
                        {new Date(user.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell sx={{ borderBottom: `1px solid ${colors.borderColor}` }}>
                        <Button 
                          variant="outlined" 
                          size="small" 
                          onClick={() => handleUserStatusChange(user.user_id, user.account_status)}
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
                ) : (
                  <TableRow>
                    <TableCell colSpan={8} align="center" sx={{ color: colors.secondaryText, borderBottom: `1px solid ${colors.borderColor}` }}>
                      No users found
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