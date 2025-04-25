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
  Chip,
  Tabs,
  Tab,
  Card,
  CardContent,
  InputAdornment,
  Tooltip,
  Switch,
  FormControlLabel
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
  VisibilityOff as VisibilityOffIcon,
  Settings as SettingsIcon,
  Security as SecurityIcon,
  Notifications as NotificationsIcon,
  CloudUpload as CloudUploadIcon
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

const StyledTab = styled(Tab)({
  color: colors.secondaryText,
  '&.Mui-selected': {
    color: colors.primary,
  },
  '&.Mui-focusVisible': {
    backgroundColor: colors.hoverBg,
  },
  minHeight: '48px'
});

const StyledTabs = styled(Tabs)({
  borderBottom: `1px solid ${colors.borderColor}`,
  '& .MuiTabs-indicator': {
    backgroundColor: colors.primary,
  },
});

const SettingsSection = styled(Paper)({
  padding: '24px',
  backgroundColor: colors.cardBg,
  border: `1px solid ${colors.borderColor}`,
  borderRadius: '12px',
  marginBottom: '24px'
});

const AdminSettings = () => {
  const navigate = useNavigate();
  const [currentAdmin, setCurrentAdmin] = useState(null);
  const [loading, setLoading] = useState(true);
  const [adminsLoading, setAdminsLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState('');
  const [admins, setAdmins] = useState([]);
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showAddAdminDialog, setShowAddAdminDialog] = useState(false);
  const [adminCreationSuccess, setAdminCreationSuccess] = useState(false);
  const [newAdmin, setNewAdmin] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [newAdminError, setNewAdminError] = useState('');
  const [newAdminLoading, setNewAdminLoading] = useState(false);
  const [activeTab, setActiveTab] = useState(0);

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

      const response = await API.admin.getProfile();
      
      setCurrentAdmin(response.data.user);
      setFormData({
        username: response.data.user.username,
        email: response.data.user.email,
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
      setAdminsLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      const response = await API.admin.getUsers();
      
      const adminUsers = response.data.users ? response.data.users.filter(user => user.role === 'admin') : [];
      setAdmins(adminUsers);
    } catch (err) {
      setError('Failed to load admins: ' + err.message);
    } finally {
      setAdminsLoading(false);
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

      const response = await API.admin.updateProfile({
        username: formData.username,
        email: formData.email,
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword
      });

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
      setError('Failed to update profile: ' + (err.response?.data?.message || err.message));
    } finally {
      setSaving(false);
    }
  };

  const handleAddAdmin = async (e) => {
    e.preventDefault();
    setNewAdminLoading(true);
    setNewAdminError('');
    setAdminCreationSuccess(false);

    try {
      // Validate form
      if (!newAdmin.username || !newAdmin.email || !newAdmin.password) {
        throw new Error('All fields are required');
      }

      if (newAdmin.password !== newAdmin.confirmPassword) {
        throw new Error('Passwords do not match');
      }

      // Email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(newAdmin.email)) {
        throw new Error('Please enter a valid email address');
      }

      // Password strength validation
      if (newAdmin.password.length < 8) {
        throw new Error('Password must be at least 8 characters long');
      }

      const response = await API.admin.addAdmin({
        username: newAdmin.username,
        email: newAdmin.email,
        password: newAdmin.password,
        role: 'admin'
      });

      setAdminCreationSuccess(true);
      setSuccess('Admin added successfully');
      
      // Reset form
      setNewAdmin({
        username: '',
        email: '',
        password: '',
        confirmPassword: ''
      });
      
      // Refresh admin list
      fetchAdmins();
      
      // Close dialog after a short delay to show success message
      setTimeout(() => {
        setShowAddAdminDialog(false);
      }, 1500);
    } catch (err) {
      setNewAdminError('Failed to add admin: ' + (err.response?.data?.message || err.message));
    } finally {
      setNewAdminLoading(false);
    }
  };

  const handleDeleteAdmin = async (adminId) => {
    try {
      if (window.confirm('Are you sure you want to delete this admin?')) {
        let response;
        try {
          response = await API.admin.deleteAdmin(adminId);
        } catch (deleteErr) {
          response = await API.admin.updateUserStatus(adminId, 'deleted');
        }
        
        setSuccess('Admin deleted successfully');
        
        // Refresh admin list
        fetchAdmins();
      }
    } catch (err) {
      setError('Failed to delete admin: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
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
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" sx={{ color: colors.primaryText, fontWeight: 600 }}>Settings</Typography>
        </Box>
        
        <Box sx={{ mb: 4 }}>
          <StyledTabs value={activeTab} onChange={handleTabChange}>
            <StyledTab label="Profile" icon={<PersonIcon />} iconPosition="start" />
            <StyledTab label="Security" icon={<SecurityIcon />} iconPosition="start" />
            <StyledTab label="Admin Management" icon={<SettingsIcon />} iconPosition="start" />
          </StyledTabs>
        </Box>
        
        {/* Profile Tab */}
        {activeTab === 0 && (
          <SettingsSection>
            <Typography variant="h5" sx={{ mb: 3, color: colors.primaryText }}>Profile Settings</Typography>
            
            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 4, mb: 4 }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', p: 2 }}>
                <Avatar 
                  src={currentAdmin?.profile_image || undefined}
                  alt={currentAdmin?.username || ''} 
                  sx={{ 
                    width: 120, 
                    height: 120, 
                    backgroundColor: colors.secondary,
                    mb: 2,
                    border: `4px solid ${colors.borderColor}`
                  }}
                >
                  {currentAdmin?.username ? currentAdmin.username.charAt(0).toUpperCase() : 'A'}
                </Avatar>
                
                <Button 
                  variant="outlined" 
                  component="label"
                  startIcon={<CloudUploadIcon />}
                  sx={{ 
                    borderColor: colors.primary,
                    color: colors.primary,
                    '&:hover': {
                      backgroundColor: `${colors.primary}22`,
                      borderColor: colors.primary
                    }
                  }}
                >
                  Upload Photo
                  <input type="file" hidden />
                </Button>
                
                <Typography variant="caption" sx={{ color: colors.secondaryText, mt: 1, textAlign: 'center' }}>
                  Recommended: Square image, at least 200x200px
                </Typography>
              </Box>
              
              <Box sx={{ flexGrow: 1 }}>
                <form onSubmit={handleUpdateProfile}>
                  <Grid container spacing={3}>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="Username"
                        name="username"
                        value={formData.username}
                        onChange={handleInputChange}
                        required
                        variant="outlined"
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <PersonIcon sx={{ color: colors.secondaryText }} />
                            </InputAdornment>
                          ),
                          sx: {
                            color: colors.primaryText,
                          }
                        }}
                        InputLabelProps={{
                          sx: {
                            color: colors.secondaryText
                          }
                        }}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            '& fieldset': {
                              borderColor: colors.borderColor,
                            },
                            '&:hover fieldset': {
                              borderColor: colors.primary,
                            },
                            '&.Mui-focused fieldset': {
                              borderColor: colors.primary,
                            },
                          }
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="Email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        required
                        variant="outlined"
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <EmailIcon sx={{ color: colors.secondaryText }} />
                            </InputAdornment>
                          ),
                          sx: {
                            color: colors.primaryText,
                          }
                        }}
                        InputLabelProps={{
                          sx: {
                            color: colors.secondaryText
                          }
                        }}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            '& fieldset': {
                              borderColor: colors.borderColor,
                            },
                            '&:hover fieldset': {
                              borderColor: colors.primary,
                            },
                            '&.Mui-focused fieldset': {
                              borderColor: colors.primary,
                            },
                          }
                        }}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <Button
                        type="submit"
                        variant="contained"
                        color="primary"
                        startIcon={saving ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
                        disabled={saving}
                        sx={{ 
                          mt: 2,
                          backgroundColor: colors.primary,
                          '&:hover': {
                            backgroundColor: `${colors.primary}dd`
                          }
                        }}
                      >
                        Save Profile
                      </Button>
                    </Grid>
                  </Grid>
                </form>
              </Box>
            </Box>
            
            {success && (
              <Alert severity="success" sx={{ mb: 2, backgroundColor: `${colors.buyGreen}22`, color: colors.buyGreen }}>
                {success}
              </Alert>
            )}
            
            {error && (
              <Alert severity="error" sx={{ mb: 2, backgroundColor: `${colors.sellRed}22`, color: colors.sellRed }}>
                {error}
              </Alert>
            )}
          </SettingsSection>
        )}
        
        {/* Security Tab */}
        {activeTab === 1 && (
          <SettingsSection>
            <Typography variant="h5" sx={{ mb: 3, color: colors.primaryText }}>Security Settings</Typography>
            
            <form onSubmit={handleUpdateProfile}>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Current Password"
                    name="currentPassword"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.currentPassword}
                    onChange={handleInputChange}
                    variant="outlined"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <LockIcon sx={{ color: colors.secondaryText }} />
                        </InputAdornment>
                      ),
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            onClick={() => setShowPassword(!showPassword)}
                            edge="end"
                            sx={{ color: colors.secondaryText }}
                          >
                            {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                          </IconButton>
                        </InputAdornment>
                      ),
                      sx: {
                        color: colors.primaryText,
                      }
                    }}
                    InputLabelProps={{
                      sx: {
                        color: colors.secondaryText
                      }
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        '& fieldset': {
                          borderColor: colors.borderColor,
                        },
                        '&:hover fieldset': {
                          borderColor: colors.primary,
                        },
                        '&.Mui-focused fieldset': {
                          borderColor: colors.primary,
                        },
                      }
                    }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="New Password"
                    name="newPassword"
                    type={showNewPassword ? 'text' : 'password'}
                    value={formData.newPassword}
                    onChange={handleInputChange}
                    variant="outlined"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <LockIcon sx={{ color: colors.secondaryText }} />
                        </InputAdornment>
                      ),
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            onClick={() => setShowNewPassword(!showNewPassword)}
                            edge="end"
                            sx={{ color: colors.secondaryText }}
                          >
                            {showNewPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                          </IconButton>
                        </InputAdornment>
                      ),
                      sx: {
                        color: colors.primaryText,
                      }
                    }}
                    InputLabelProps={{
                      sx: {
                        color: colors.secondaryText
                      }
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        '& fieldset': {
                          borderColor: colors.borderColor,
                        },
                        '&:hover fieldset': {
                          borderColor: colors.primary,
                        },
                        '&.Mui-focused fieldset': {
                          borderColor: colors.primary,
                        },
                      }
                    }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Confirm New Password"
                    name="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    variant="outlined"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <LockIcon sx={{ color: colors.secondaryText }} />
                        </InputAdornment>
                      ),
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            edge="end"
                            sx={{ color: colors.secondaryText }}
                          >
                            {showConfirmPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                          </IconButton>
                        </InputAdornment>
                      ),
                      sx: {
                        color: colors.primaryText,
                      }
                    }}
                    InputLabelProps={{
                      sx: {
                        color: colors.secondaryText
                      }
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        '& fieldset': {
                          borderColor: colors.borderColor,
                        },
                        '&:hover fieldset': {
                          borderColor: colors.primary,
                        },
                        '&.Mui-focused fieldset': {
                          borderColor: colors.primary,
                        },
                      }
                    }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <Button
                    type="submit"
                    variant="contained"
                    color="primary"
                    startIcon={saving ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
                    disabled={saving}
                    sx={{ 
                      mt: 2,
                      backgroundColor: colors.primary,
                      '&:hover': {
                        backgroundColor: `${colors.primary}dd`
                      }
                    }}
                  >
                    Update Password
                  </Button>
                </Grid>
              </Grid>
            </form>
            
            <Box sx={{ mt: 4 }}>
              <Typography variant="h6" sx={{ mb: 2, color: colors.primaryText }}>Additional Security Settings</Typography>
              
              <Card sx={{ backgroundColor: `${colors.cardBg}80`, border: `1px solid ${colors.borderColor}` }}>
                <CardContent>
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <FormControlLabel
                        control={
                          <Switch 
                            checked={true} 
                            sx={{
                              '& .MuiSwitch-switchBase.Mui-checked': {
                                color: colors.primary,
                                '&:hover': {
                                  backgroundColor: `${colors.primary}22`
                                }
                              },
                              '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                                backgroundColor: colors.primary
                              }
                            }}
                          />
                        }
                        label={
                          <Box>
                            <Typography variant="body1" sx={{ color: colors.primaryText }}>Two-Factor Authentication</Typography>
                            <Typography variant="caption" sx={{ color: colors.secondaryText }}>
                              Enable two-factor authentication for additional security
                            </Typography>
                          </Box>
                        }
                        sx={{ display: 'flex', alignItems: 'flex-start' }}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <FormControlLabel
                        control={
                          <Switch 
                            checked={false} 
                            sx={{
                              '& .MuiSwitch-switchBase.Mui-checked': {
                                color: colors.primary,
                                '&:hover': {
                                  backgroundColor: `${colors.primary}22`
                                }
                              },
                              '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                                backgroundColor: colors.primary
                              }
                            }}
                          />
                        }
                        label={
                          <Box>
                            <Typography variant="body1" sx={{ color: colors.primaryText }}>Login Notifications</Typography>
                            <Typography variant="caption" sx={{ color: colors.secondaryText }}>
                              Receive notifications when your account is accessed
                            </Typography>
                          </Box>
                        }
                        sx={{ display: 'flex', alignItems: 'flex-start' }}
                      />
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Box>
            
            {success && (
              <Alert severity="success" sx={{ mt: 3, backgroundColor: `${colors.buyGreen}22`, color: colors.buyGreen }}>
                {success}
              </Alert>
            )}
            
            {error && (
              <Alert severity="error" sx={{ mt: 3, backgroundColor: `${colors.sellRed}22`, color: colors.sellRed }}>
                {error}
              </Alert>
            )}
          </SettingsSection>
        )}
        
        {/* Admin Management Tab */}
        {activeTab === 2 && (
          <SettingsSection>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h5" sx={{ color: colors.primaryText }}>Admin Management</Typography>
              <Button 
                variant="contained" 
                startIcon={<AddIcon />}
                onClick={() => setShowAddAdminDialog(true)}
                sx={{ 
                  backgroundColor: colors.primary,
                  '&:hover': {
                    backgroundColor: `${colors.primary}dd`
                  }
                }}
              >
                Add Admin
              </Button>
            </Box>
            
            {success && (
              <Alert severity="success" sx={{ mb: 3, backgroundColor: `${colors.buyGreen}22`, color: colors.buyGreen }}>
                {success}
              </Alert>
            )}
            
            {error && (
              <Alert severity="error" sx={{ mb: 3, backgroundColor: `${colors.sellRed}22`, color: colors.sellRed }}>
                {error}
              </Alert>
            )}
            
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ color: colors.secondaryText, borderBottom: `1px solid ${colors.borderColor}` }}>Admin</TableCell>
                    <TableCell sx={{ color: colors.secondaryText, borderBottom: `1px solid ${colors.borderColor}` }}>Email</TableCell>
                    <TableCell sx={{ color: colors.secondaryText, borderBottom: `1px solid ${colors.borderColor}` }}>Status</TableCell>
                    <TableCell sx={{ color: colors.secondaryText, borderBottom: `1px solid ${colors.borderColor}` }}>Created</TableCell>
                    <TableCell sx={{ color: colors.secondaryText, borderBottom: `1px solid ${colors.borderColor}` }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {adminsLoading ? (
                    <TableRow>
                      <TableCell colSpan={5} align="center" sx={{ py: 4, color: colors.secondaryText, borderBottom: `1px solid ${colors.borderColor}` }}>
                        <CircularProgress size={32} sx={{ color: colors.primary }} />
                      </TableCell>
                    </TableRow>
                  ) : admins.length > 0 ? (
                    admins.map((admin) => (
                      <TableRow key={admin.user_id || admin.id} sx={{ '&:hover': { backgroundColor: colors.hoverBg } }}>
                        <TableCell sx={{ borderBottom: `1px solid ${colors.borderColor}` }}>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Avatar 
                              sx={{ width: 32, height: 32, backgroundColor: colors.secondary, mr: 1.5 }}
                            >
                              {admin.username ? admin.username.charAt(0).toUpperCase() : 'A'}
                            </Avatar>
                            <Typography sx={{ color: colors.primaryText }}>{admin.username}</Typography>
                            {(admin.user_id || admin.id) === currentAdmin?.user_id && (
                              <Chip 
                                label="You" 
                                size="small" 
                                sx={{ 
                                  ml: 1,
                                  backgroundColor: `${colors.primary}22`,
                                  color: colors.primary,
                                  fontSize: '0.65rem'
                                }} 
                              />
                            )}
                          </Box>
                        </TableCell>
                        <TableCell sx={{ color: colors.primaryText, borderBottom: `1px solid ${colors.borderColor}` }}>
                          {admin.email}
                        </TableCell>
                        <TableCell sx={{ borderBottom: `1px solid ${colors.borderColor}` }}>
                          <Chip 
                            label={admin.status || admin.account_status || 'active'} 
                            size="small" 
                            sx={{ 
                              backgroundColor: `${colors.buyGreen}22`,
                              color: colors.buyGreen
                            }} 
                          />
                        </TableCell>
                        <TableCell sx={{ color: colors.primaryText, borderBottom: `1px solid ${colors.borderColor}` }}>
                          {admin.created_at ? new Date(admin.created_at).toLocaleDateString() : 'N/A'}
                        </TableCell>
                        <TableCell sx={{ borderBottom: `1px solid ${colors.borderColor}` }}>
                          <Tooltip title="Edit">
                            <IconButton sx={{ color: colors.primary, mr: 1 }}>
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title={(admin.user_id || admin.id) === currentAdmin?.user_id ? "Cannot delete your own account" : "Delete"}>
                            <span>
                              <IconButton 
                                sx={{ color: colors.sellRed }}
                                onClick={() => (admin.user_id || admin.id) !== currentAdmin?.user_id && handleDeleteAdmin(admin.user_id || admin.id)}
                                disabled={(admin.user_id || admin.id) === currentAdmin?.user_id}
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </span>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} align="center" sx={{ py: 4, color: colors.secondaryText, borderBottom: `1px solid ${colors.borderColor}` }}>
                        No admin users found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </SettingsSection>
        )}
        
        {/* Add Admin Dialog */}
        <Dialog 
          open={showAddAdminDialog} 
          onClose={() => !newAdminLoading && setShowAddAdminDialog(false)}
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
            
            {adminCreationSuccess && (
              <Alert severity="success" sx={{ mb: 2, backgroundColor: `${colors.buyGreen}22`, color: colors.buyGreen, border: `1px solid ${colors.buyGreen}` }}>
                Admin created successfully!
              </Alert>
            )}
            
            <form onSubmit={handleAddAdmin} id="add-admin-form">
              <TextField
                fullWidth
                label="Username"
                name="username"
                value={newAdmin.username}
                onChange={handleNewAdminInputChange}
                margin="normal"
                required
                disabled={newAdminLoading || adminCreationSuccess}
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
                disabled={newAdminLoading || adminCreationSuccess}
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
                type={showPassword ? "text" : "password"}
                value={newAdmin.password}
                onChange={handleNewAdminInputChange}
                margin="normal"
                required
                disabled={newAdminLoading || adminCreationSuccess}
                InputProps={{
                  startAdornment: <LockIcon sx={{ mr: 1, color: colors.secondaryText }} />,
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                        sx={{ color: colors.secondaryText }}
                      >
                        {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                      </IconButton>
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
                InputLabelProps={{
                  sx: { color: colors.secondaryText }
                }}
                helperText="Password must be at least 8 characters long"
                FormHelperTextProps={{
                  sx: { color: colors.secondaryText }
                }}
              />

              <TextField
                fullWidth
                label="Confirm Password"
                name="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                value={newAdmin.confirmPassword}
                onChange={handleNewAdminInputChange}
                margin="normal"
                required
                disabled={newAdminLoading || adminCreationSuccess}
                InputProps={{
                  startAdornment: <LockIcon sx={{ mr: 1, color: colors.secondaryText }} />,
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        edge="end"
                        sx={{ color: colors.secondaryText }}
                      >
                        {showConfirmPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                      </IconButton>
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
                InputLabelProps={{
                  sx: { color: colors.secondaryText }
                }}
                error={newAdmin.password !== newAdmin.confirmPassword && newAdmin.confirmPassword !== ''}
                helperText={newAdmin.password !== newAdmin.confirmPassword && newAdmin.confirmPassword !== '' ? "Passwords don't match" : ""}
                FormHelperTextProps={{
                  sx: { color: colors.sellRed }
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
              disabled={newAdminLoading}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleAddAdmin}
              disabled={newAdminLoading || adminCreationSuccess}
              type="submit"
              form="add-admin-form"
              startIcon={newAdminLoading ? <CircularProgress size={20} color="inherit" /> : <AddIcon />}
              sx={{ 
                color: colors.primary,
                '&:hover': {
                  backgroundColor: `${colors.primary}22`
                }
              }}
            >
              {newAdminLoading ? 'Creating...' : 'Add Admin'}
            </Button>
          </DialogActions>
        </Dialog>
      </MainContent>
    </PageContainer>
  );
};

export default AdminSettings;
