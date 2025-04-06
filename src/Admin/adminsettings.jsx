import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  TextField, 
  Button, 
  Grid, 
  Divider, 
  Alert, 
  CircularProgress, 
  Avatar, 
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip
} from '@mui/material';
import { styled } from '@mui/system';
import { useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import { 
  Save as SaveIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Person as PersonIcon,
  Email as EmailIcon,
  Lock as LockIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon
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

const AdminSettings = () => {
  const navigate = useNavigate();
  const [currentAdmin, setCurrentAdmin] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState('');
  const [admins, setAdmins] = useState([]);
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showAddAdminDialog, setShowAddAdminDialog] = useState(false);
  const [newAdmin, setNewAdmin] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [newAdminError, setNewAdminError] = useState('');
  const [newAdminLoading, setNewAdminLoading] = useState(false);

  // Form data for current admin
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  useEffect(() => {
    fetchCurrentAdmin();
    fetchAdmins();
  }, []);

  const fetchCurrentAdmin = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      const response = await fetch('http://localhost:5000/api/admin/profile', {
        headers: {
          'Authorization': token
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch admin data');
      }

      const data = await response.json();
      setCurrentAdmin(data.user);
      setFormData({
        username: data.user.username,
        email: data.user.email,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (err) {
      setError('Failed to load admin data: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchAdmins = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      const response = await fetch('http://localhost:5000/api/admin/admins', {
        headers: {
          'Authorization': token
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch admins');
      }

      const data = await response.json();
      setAdmins(data.admins);
    } catch (err) {
      setError('Failed to load admins: ' + err.message);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleNewAdminInputChange = (e) => {
    const { name, value } = e.target;
    setNewAdmin({
      ...newAdmin,
      [name]: value
    });
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      // Validate passwords if changing
      if (formData.newPassword) {
        if (formData.newPassword !== formData.confirmPassword) {
          setError('New passwords do not match');
          setSaving(false);
          return;
        }
        if (!formData.currentPassword) {
          setError('Current password is required to change password');
          setSaving(false);
          return;
        }
      }

      const response = await fetch('http://localhost:5000/api/admin/update-profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token
        },
        body: JSON.stringify({
          username: formData.username,
          email: formData.email,
          currentPassword: formData.currentPassword,
          newPassword: formData.newPassword
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to update profile');
      }

      setSuccess('Profile updated successfully');
      setFormData({
        ...formData,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      
      // Update current admin data
      setCurrentAdmin({
        ...currentAdmin,
        username: formData.username,
        email: formData.email
      });
    } catch (err) {
      setError('Failed to update profile: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleAddAdmin = async (e) => {
    e.preventDefault();
    setNewAdminLoading(true);
    setNewAdminError('');

    try {
      // Validate passwords
      if (newAdmin.password !== newAdmin.confirmPassword) {
        setNewAdminError('Passwords do not match');
        setNewAdminLoading(false);
        return;
      }

      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      const response = await fetch('http://localhost:5000/api/admin/add-admin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token
        },
        body: JSON.stringify({
          username: newAdmin.username,
          email: newAdmin.email,
          password: newAdmin.password
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to add admin');
      }

      // Reset form and close dialog
      setNewAdmin({
        username: '',
        email: '',
        password: '',
        confirmPassword: ''
      });
      setShowAddAdminDialog(false);
      
      // Refresh admin list
      fetchAdmins();
      
      setSuccess('Admin added successfully');
    } catch (err) {
      setNewAdminError('Failed to add admin: ' + err.message);
    } finally {
      setNewAdminLoading(false);
    }
  };

  const handleDeleteAdmin = async (adminId) => {
    if (!window.confirm('Are you sure you want to delete this admin?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      const response = await fetch(`http://localhost:5000/api/admin/delete-admin/${adminId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': token
        }
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to delete admin');
      }

      // Refresh admin list
      fetchAdmins();
      
      setSuccess('Admin deleted successfully');
    } catch (err) {
      setError('Failed to delete admin: ' + err.message);
    }
  };

  if (loading) {
    return (
      <PageContainer>
        <Sidebar />
        <MainContent>
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
            <CircularProgress sx={{ color: colors.primary }} />
          </Box>
        </MainContent>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <Sidebar />
      <MainContent>
        <Typography variant="h4" sx={{ mb: 3, color: colors.primaryText }}>
          Admin Settings
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2, backgroundColor: `${colors.sellRed}22`, color: colors.sellRed, border: `1px solid ${colors.sellRed}` }}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 2, backgroundColor: `${colors.buyGreen}22`, color: colors.buyGreen, border: `1px solid ${colors.buyGreen}` }}>
            {success}
          </Alert>
        )}

        <Grid container spacing={3}>
          {/* Current Admin Profile */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ 
              p: 3, 
              backgroundColor: colors.cardBg,
              border: `1px solid ${colors.borderColor}`,
              borderRadius: '8px'
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <Avatar sx={{ width: 60, height: 60, bgcolor: colors.primary, mr: 2 }}>
                  {currentAdmin?.username?.charAt(0).toUpperCase()}
                </Avatar>
                <Box>
                  <Typography variant="h6" sx={{ color: colors.primaryText }}>
                    {currentAdmin?.username}
                  </Typography>
                  <Typography variant="body2" sx={{ color: colors.secondaryText }}>
                    {currentAdmin?.email}
                  </Typography>
                  <Chip 
                    label="Administrator" 
                    size="small" 
                    sx={{ 
                      mt: 1,
                      backgroundColor: `${colors.secondary}33`,
                      color: colors.secondary
                    }} 
                  />
                </Box>
              </Box>

              <Divider sx={{ borderColor: colors.borderColor, mb: 3 }} />

              <Typography variant="h6" sx={{ mb: 2, color: colors.primaryText }}>
                Update Profile
              </Typography>

              <form onSubmit={handleUpdateProfile}>
                <TextField
                  fullWidth
                  label="Username"
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  margin="normal"
                  InputProps={{
                    startAdornment: <PersonIcon sx={{ mr: 1, color: colors.secondaryText }} />,
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

                <TextField
                  fullWidth
                  label="Email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  margin="normal"
                  InputProps={{
                    startAdornment: <EmailIcon sx={{ mr: 1, color: colors.secondaryText }} />,
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

                <Typography variant="subtitle1" sx={{ mt: 3, mb: 2, color: colors.primaryText }}>
                  Change Password
                </Typography>

                <TextField
                  fullWidth
                  label="Current Password"
                  name="currentPassword"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.currentPassword}
                  onChange={handleInputChange}
                  margin="normal"
                  InputProps={{
                    startAdornment: <LockIcon sx={{ mr: 1, color: colors.secondaryText }} />,
                    endAdornment: (
                      <IconButton
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                        sx={{ color: colors.secondaryText }}
                      >
                        {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                      </IconButton>
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
                  InputLabelProps={{
                    sx: { color: colors.secondaryText }
                  }}
                />

                <TextField
                  fullWidth
                  label="New Password"
                  name="newPassword"
                  type={showNewPassword ? 'text' : 'password'}
                  value={formData.newPassword}
                  onChange={handleInputChange}
                  margin="normal"
                  InputProps={{
                    startAdornment: <LockIcon sx={{ mr: 1, color: colors.secondaryText }} />,
                    endAdornment: (
                      <IconButton
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        edge="end"
                        sx={{ color: colors.secondaryText }}
                      >
                        {showNewPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                      </IconButton>
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
                  InputLabelProps={{
                    sx: { color: colors.secondaryText }
                  }}
                />

                <TextField
                  fullWidth
                  label="Confirm New Password"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  margin="normal"
                  InputProps={{
                    startAdornment: <LockIcon sx={{ mr: 1, color: colors.secondaryText }} />,
                    endAdornment: (
                      <IconButton
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        edge="end"
                        sx={{ color: colors.secondaryText }}
                      >
                        {showConfirmPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                      </IconButton>
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
                  InputLabelProps={{
                    sx: { color: colors.secondaryText }
                  }}
                />

                <Button
                  type="submit"
                  variant="contained"
                  startIcon={<SaveIcon />}
                  disabled={saving}
                  sx={{ 
                    mt: 3, 
                    backgroundColor: colors.primary,
                    '&:hover': {
                      backgroundColor: colors.primary
                    }
                  }}
                >
                  {saving ? <CircularProgress size={24} color="inherit" /> : 'Save Changes'}
                </Button>
              </form>
            </Paper>
          </Grid>

          {/* Admin Management */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ 
              p: 3, 
              backgroundColor: colors.cardBg,
              border: `1px solid ${colors.borderColor}`,
              borderRadius: '8px'
            }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h6" sx={{ color: colors.primaryText }}>
                  Admin Accounts
                </Typography>
                <Button
                  variant="outlined"
                  startIcon={<AddIcon />}
                  onClick={() => setShowAddAdminDialog(true)}
                  sx={{ 
                    color: colors.primary,
                    borderColor: colors.primary,
                    '&:hover': {
                      borderColor: colors.primary,
                      backgroundColor: `${colors.primary}22`
                    }
                  }}
                >
                  Add Admin
                </Button>
              </Box>

              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ color: colors.secondaryText, borderBottom: `1px solid ${colors.borderColor}` }}>Username</TableCell>
                      <TableCell sx={{ color: colors.secondaryText, borderBottom: `1px solid ${colors.borderColor}` }}>Email</TableCell>
                      <TableCell sx={{ color: colors.secondaryText, borderBottom: `1px solid ${colors.borderColor}` }}>Status</TableCell>
                      <TableCell sx={{ color: colors.secondaryText, borderBottom: `1px solid ${colors.borderColor}` }}>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {admins.map((admin) => (
                      <TableRow key={admin.user_id} sx={{ '&:hover': { backgroundColor: colors.hoverBg } }}>
                        <TableCell sx={{ color: colors.primaryText, borderBottom: `1px solid ${colors.borderColor}` }}>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Avatar sx={{ width: 32, height: 32, bgcolor: colors.primary, mr: 1 }}>
                              {admin.username.charAt(0).toUpperCase()}
                            </Avatar>
                            {admin.username}
                          </Box>
                        </TableCell>
                        <TableCell sx={{ color: colors.primaryText, borderBottom: `1px solid ${colors.borderColor}` }}>
                          {admin.email}
                        </TableCell>
                        <TableCell sx={{ borderBottom: `1px solid ${colors.borderColor}` }}>
                          <Chip 
                            label={admin.account_status} 
                            size="small"
                            sx={{ 
                              backgroundColor: 
                                admin.account_status === 'active' ? `${colors.buyGreen}33` : 
                                `${colors.sellRed}33`,
                              color: 
                                admin.account_status === 'active' ? colors.buyGreen : 
                                colors.sellRed
                            }} 
                          />
                        </TableCell>
                        <TableCell sx={{ borderBottom: `1px solid ${colors.borderColor}` }}>
                          {admin.user_id !== currentAdmin?.user_id && (
                            <IconButton 
                              onClick={() => handleDeleteAdmin(admin.user_id)}
                              sx={{ 
                                color: colors.sellRed,
                                '&:hover': {
                                  backgroundColor: `${colors.sellRed}22`
                                }
                              }}
                            >
                              <DeleteIcon />
                            </IconButton>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </Grid>
        </Grid>

        {/* Add Admin Dialog */}
        <Dialog 
          open={showAddAdminDialog} 
          onClose={() => setShowAddAdminDialog(false)}
          PaperProps={{
            sx: {
              backgroundColor: colors.cardBg,
              color: colors.primaryText,
              border: `1px solid ${colors.borderColor}`
            }
          }}
        >
          <DialogTitle sx={{ borderBottom: `1px solid ${colors.borderColor}` }}>
            Add New Admin
          </DialogTitle>
          <DialogContent sx={{ pt: 2 }}>
            {newAdminError && (
              <Alert severity="error" sx={{ mb: 2, backgroundColor: `${colors.sellRed}22`, color: colors.sellRed, border: `1px solid ${colors.sellRed}` }}>
                {newAdminError}
              </Alert>
            )}
            <form onSubmit={handleAddAdmin}>
              <TextField
                fullWidth
                label="Username"
                name="username"
                value={newAdmin.username}
                onChange={handleNewAdminInputChange}
                margin="normal"
                required
                InputProps={{
                  startAdornment: <PersonIcon sx={{ mr: 1, color: colors.secondaryText }} />,
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

              <TextField
                fullWidth
                label="Email"
                name="email"
                type="email"
                value={newAdmin.email}
                onChange={handleNewAdminInputChange}
                margin="normal"
                required
                InputProps={{
                  startAdornment: <EmailIcon sx={{ mr: 1, color: colors.secondaryText }} />,
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

              <TextField
                fullWidth
                label="Password"
                name="password"
                type="password"
                value={newAdmin.password}
                onChange={handleNewAdminInputChange}
                margin="normal"
                required
                InputProps={{
                  startAdornment: <LockIcon sx={{ mr: 1, color: colors.secondaryText }} />,
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

              <TextField
                fullWidth
                label="Confirm Password"
                name="confirmPassword"
                type="password"
                value={newAdmin.confirmPassword}
                onChange={handleNewAdminInputChange}
                margin="normal"
                required
                InputProps={{
                  startAdornment: <LockIcon sx={{ mr: 1, color: colors.secondaryText }} />,
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
            </form>
          </DialogContent>
          <DialogActions sx={{ borderTop: `1px solid ${colors.borderColor}`, p: 2 }}>
            <Button 
              onClick={() => setShowAddAdminDialog(false)}
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
              onClick={handleAddAdmin}
              disabled={newAdminLoading}
              startIcon={newAdminLoading ? <CircularProgress size={20} color="inherit" /> : <AddIcon />}
              sx={{ 
                color: colors.primary,
                '&:hover': {
                  backgroundColor: `${colors.primary}22`
                }
              }}
            >
              Add Admin
            </Button>
          </DialogActions>
        </Dialog>
      </MainContent>
    </PageContainer>
  );
};

export default AdminSettings;
