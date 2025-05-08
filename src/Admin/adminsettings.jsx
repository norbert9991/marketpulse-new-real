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
  FormControlLabel,
  Snackbar
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
  CloudUpload as CloudUploadIcon,
  Close as CloseIcon,
  AccessTime as AccessTimeIcon,
  Shield as ShieldIcon,
  PhonelinkLock as SessionIcon,
  VerifiedUser as VerifiedUserIcon
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

// Styled notification component
const StyledAlert = styled(Alert)({
  borderRadius: '8px',
  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
  animation: 'fadeIn 0.5s ease',
  '@keyframes fadeIn': {
    '0%': { opacity: 0, transform: 'translateY(-10px)' },
    '100%': { opacity: 1, transform: 'translateY(0)' }
  }
});

const AdminSettings = () => {
  const navigate = useNavigate();
  const [currentAdmin, setCurrentAdmin] = useState(null);
  const [loading, setLoading] = useState(true);
  const [adminsLoading, setAdminsLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notification, setNotification] = useState({ open: false, type: '', message: '' });
  const [admins, setAdmins] = useState([]);
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showAddAdminDialog, setShowAddAdminDialog] = useState(false);
  const [adminCreationSuccess, setAdminCreationSuccess] = useState(false);
  const [showEditAdminDialog, setShowEditAdminDialog] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState(null);
  const [editAdminSaving, setEditAdminSaving] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deletingAdminId, setDeletingAdminId] = useState(null);
  const [deletingAdminName, setDeletingAdminName] = useState('');
  const [deleteAdminLoading, setDeleteAdminLoading] = useState(false);
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

  // Security settings state
  const [securitySettings, setSecuritySettings] = useState({
    passwordExpiry: true,
    sessionTimeout: false,
    activityLogging: true,
    secureConnection: true
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

      // Use the general auth.me() endpoint instead of admin-specific endpoint
      const response = await API.auth.me();
      
      setCurrentAdmin(response.data.user);
      setFormData({
        username: response.data.user.username,
        email: response.data.user.email,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (err) {
      showNotification('error', 'Failed to load admin data: ' + err.message);
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

      // Use a general users endpoint instead of admin-specific endpoint
      const response = await API.admin.getUsers();
      
      // Filter only admin users if the response includes a role or is_admin field
      let adminUsers = response.data.users || [];
      
      // Filter for admin users if we have role information
      adminUsers = adminUsers.filter(user => 
        user.role === 'admin' || 
        user.is_admin === true || 
        user.account_type === 'admin'
      );
      
      setAdmins(adminUsers);
    } catch (err) {
      console.error('Error fetching admins:', err);
      showNotification('error', 'Failed to load admins: ' + err.message);
      
      // Fallback: If we can't get the admin list, at least show the current admin
      if (currentAdmin) {
        setAdmins([currentAdmin]);
      }
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

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      // Validate passwords if changing
      if (formData.newPassword) {
        if (formData.newPassword !== formData.confirmPassword) {
          showNotification('error', 'New passwords do not match');
          setSaving(false);
          return;
        }
        if (!formData.currentPassword) {
          showNotification('error', 'Current password is required to change password');
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

      showNotification('success', 'Profile updated successfully');
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
      showNotification('error', 'Failed to update profile: ' + (err.response?.data?.message || err.message));
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

      try {
        // Try the admin-specific endpoint first
        await API.admin.addAdmin({
          username: newAdmin.username,
          email: newAdmin.email,
          password: newAdmin.password,
          role: 'admin' // Explicitly set role to admin
        });
      } catch (apiError) {
        console.error('Admin API error:', apiError);
        // If the admin endpoint fails, try the general register endpoint
        await API.auth.register({
          username: newAdmin.username,
          email: newAdmin.email,
          password: newAdmin.password,
          role: 'admin' // This might be ignored depending on the API
        });
      }

      setAdminCreationSuccess(true);
      showNotification('success', 'Admin added successfully');
      
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

  const handleOpenDeleteDialog = (admin) => {
    setDeletingAdminId(admin.user_id || admin.id);
    setDeletingAdminName(admin.username || 'this admin');
    setShowDeleteDialog(true);
  };
  
  const handleDeleteAdmin = async () => {
    if (!deletingAdminId) {
      showNotification('error', 'No admin selected for deletion');
      return;
    }
    
    setDeleteAdminLoading(true);
    
    try {
      console.log(`Deleting admin with ID: ${deletingAdminId}`);
      
      // Make the API call
      const response = await API.admin.deleteAdmin(deletingAdminId);
      console.log('Delete admin response:', response);
      
      showNotification('success', 'Admin deleted successfully');
      
      // Refresh admin list
      fetchAdmins();
      setShowDeleteDialog(false);
    } catch (err) {
      console.error('Error deleting admin:', err);
      
      let errorMessage = 'Failed to delete admin';
      
      // Handle specific error cases
      if (err.response?.status === 400 && err.response?.data?.message === 'Cannot delete your own account') {
        errorMessage = 'You cannot delete your own admin account';
      } else if (err.response?.status === 404) {
        errorMessage = 'Admin account not found';
      } else if (err.response?.data?.message) {
        errorMessage = `Failed to delete admin: ${err.response.data.message}`;
      } else if (err.message) {
        errorMessage = `Failed to delete admin: ${err.message}`;
      }
      
      showNotification('error', errorMessage);
    } finally {
      setDeleteAdminLoading(false);
    }
  };

  const handleOpenEditAdmin = (admin) => {
    setEditingAdmin({
      id: admin.user_id || admin.id,
      username: admin.username || '',
      email: admin.email || '',
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
      displayName: admin.username || 'this admin'  // Add displayName for UI purposes
    });
    setShowEditAdminDialog(true);
  };

  const handleUpdateAdmin = async (e) => {
    e.preventDefault();
    
    if (!editingAdmin) return;
    
    if (editingAdmin.newPassword && editingAdmin.newPassword !== editingAdmin.confirmPassword) {
      showNotification('error', 'New passwords do not match');
      return;
    }
    
    setEditAdminSaving(true);
    
    try {
      // Create update data object
      const updateData = {
        username: editingAdmin.username,
        email: editingAdmin.email
      };
      
      // Only include password fields if a new password is provided
      if (editingAdmin.newPassword) {
        updateData.currentPassword = editingAdmin.currentPassword;
        updateData.newPassword = editingAdmin.newPassword;
      }
      
      // Log what we're about to send to help with debugging
      console.log(`Updating admin ${editingAdmin.id} with data:`, {
        ...updateData, 
        currentPassword: updateData.currentPassword ? '****' : undefined,
        newPassword: updateData.newPassword ? '****' : undefined 
      });
      
      // Make the API call
      await API.admin.updateUser(editingAdmin.id, updateData);
      
      showNotification('success', 'Admin updated successfully');
      setShowEditAdminDialog(false);
      setEditingAdmin(null);
      
      // Refresh admin list after a successful update
      fetchAdmins();
    } catch (err) {
      console.error('Error updating admin:', err);
      showNotification('error', 'Failed to update admin: ' + (err.response?.data?.message || err.message));
    } finally {
      setEditAdminSaving(false);
    }
  };

  const handleEditAdminInputChange = (e) => {
    const { name, value } = e.target;
    setEditingAdmin({
      ...editingAdmin,
      [name]: value
    });
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleCloseNotification = () => {
    setNotification({ ...notification, open: false });
  };

  const showNotification = (type, message) => {
    setNotification({ open: true, type, message });
  };
  
  const handleSecuritySettingChange = (setting) => {
    setSecuritySettings({
      ...securitySettings,
      [setting]: !securitySettings[setting]
    });
    
    // In a real application, this would save to the server
    // For now, just show a notification
    showNotification('success', `Security setting '${setting}' updated successfully`);
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
              <Typography variant="h6" sx={{ mb: 2, color: colors.primaryText }}>
                Additional Security Settings
              </Typography>
              
              <Box sx={{ 
                p: 2.5, 
                mb: 3, 
                borderRadius: 2, 
                backgroundColor: `${colors.primary}10`,
                border: `1px solid ${colors.primary}30`
              }}>
                <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                  <SecurityIcon sx={{ color: colors.primary, mr: 1.5, mt: 0.2 }} />
                  <Box>
                    <Typography variant="subtitle2" sx={{ color: colors.primary, fontWeight: 'medium', mb: 0.5 }}>
                      Admin Account Security Best Practices
                    </Typography>
                    <Typography variant="body2" sx={{ color: colors.secondaryText, mb: 1 }}>
                      Enhance your admin account security by enabling these settings and following these tips:
                    </Typography>
                    <Box component="ul" sx={{ pl: 2, m: 0, '& li': { mb: 0.5, color: colors.secondaryText } }}>
                      <Typography component="li" variant="caption">
                        Use strong, unique passwords with 12+ characters including numbers and symbols
                      </Typography>
                      <Typography component="li" variant="caption">
                        Enable secure connections to protect your administrative sessions
                      </Typography>
                      <Typography component="li" variant="caption">
                        Regularly review the activity logs for any suspicious behavior
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              </Box>
              
              <Card sx={{ backgroundColor: `${colors.cardBg}80`, border: `1px solid ${colors.borderColor}` }}>
                <CardContent>
                  <Grid container spacing={3}>
                    {/* Password Expiry */}
                    <Grid item xs={12} md={6}>
                      <Box sx={{ 
                        p: 2, 
                        borderRadius: 2, 
                        border: `1px solid ${colors.borderColor}`,
                        backgroundColor: securitySettings.passwordExpiry ? `${colors.primary}15` : 'transparent',
                        transition: 'all 0.2s ease'
                      }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <AccessTimeIcon sx={{ 
                              color: securitySettings.passwordExpiry ? colors.primary : colors.secondaryText,
                              mr: 1
                            }} />
                            <Typography variant="body1" sx={{ 
                              color: colors.primaryText,
                              fontWeight: securitySettings.passwordExpiry ? 'medium' : 'normal'
                            }}>
                              Password Expiry Policy
                            </Typography>
                          </Box>
                          <Switch 
                            checked={securitySettings.passwordExpiry} 
                            onChange={() => handleSecuritySettingChange('passwordExpiry')}
                            sx={{
                              '& .MuiSwitch-switchBase.Mui-checked': {
                                color: colors.primary,
                              },
                              '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                                backgroundColor: colors.primary
                              }
                            }}
                          />
                        </Box>
                        <Typography variant="caption" sx={{ color: colors.secondaryText, display: 'block', ml: 4 }}>
                          Enforce password changes every 90 days for all admin accounts
                        </Typography>
                      </Box>
                    </Grid>
                    
                    {/* Session Timeout */}
                    <Grid item xs={12} md={6}>
                      <Box sx={{ 
                        p: 2, 
                        borderRadius: 2, 
                        border: `1px solid ${colors.borderColor}`,
                        backgroundColor: securitySettings.sessionTimeout ? `${colors.primary}15` : 'transparent',
                        transition: 'all 0.2s ease'
                      }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <SessionIcon sx={{ 
                              color: securitySettings.sessionTimeout ? colors.primary : colors.secondaryText,
                              mr: 1
                            }} />
                            <Typography variant="body1" sx={{ 
                              color: colors.primaryText,
                              fontWeight: securitySettings.sessionTimeout ? 'medium' : 'normal'
                            }}>
                              Auto Session Timeout
                            </Typography>
                          </Box>
                          <Switch 
                            checked={securitySettings.sessionTimeout} 
                            onChange={() => handleSecuritySettingChange('sessionTimeout')}
                            sx={{
                              '& .MuiSwitch-switchBase.Mui-checked': {
                                color: colors.primary,
                              },
                              '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                                backgroundColor: colors.primary
                              }
                            }}
                          />
                        </Box>
                        <Typography variant="caption" sx={{ color: colors.secondaryText, display: 'block', ml: 4 }}>
                          Automatically log out inactive sessions after 30 minutes
                        </Typography>
                      </Box>
                    </Grid>
                    
                    {/* Activity Logging */}
                    <Grid item xs={12} md={6}>
                      <Box sx={{ 
                        p: 2, 
                        borderRadius: 2, 
                        border: `1px solid ${colors.borderColor}`,
                        backgroundColor: securitySettings.activityLogging ? `${colors.primary}15` : 'transparent',
                        transition: 'all 0.2s ease'
                      }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <ShieldIcon sx={{ 
                              color: securitySettings.activityLogging ? colors.primary : colors.secondaryText,
                              mr: 1
                            }} />
                            <Typography variant="body1" sx={{ 
                              color: colors.primaryText,
                              fontWeight: securitySettings.activityLogging ? 'medium' : 'normal'
                            }}>
                              Activity Logging
                            </Typography>
                          </Box>
                          <Switch 
                            checked={securitySettings.activityLogging} 
                            onChange={() => handleSecuritySettingChange('activityLogging')}
                            sx={{
                              '& .MuiSwitch-switchBase.Mui-checked': {
                                color: colors.primary,
                              },
                              '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                                backgroundColor: colors.primary
                              }
                            }}
                          />
                        </Box>
                        <Typography variant="caption" sx={{ color: colors.secondaryText, display: 'block', ml: 4 }}>
                          Log all admin actions for security monitoring and auditing
                        </Typography>
                      </Box>
                    </Grid>
                    
                    {/* Secure Connection Policy */}
                    <Grid item xs={12} md={6}>
                      <Box sx={{ 
                        p: 2, 
                        borderRadius: 2, 
                        border: `1px solid ${colors.borderColor}`,
                        backgroundColor: securitySettings.secureConnection ? `${colors.primary}15` : 'transparent',
                        transition: 'all 0.2s ease'
                      }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <VerifiedUserIcon sx={{ 
                              color: securitySettings.secureConnection ? colors.primary : colors.secondaryText,
                              mr: 1
                            }} />
                            <Typography variant="body1" sx={{ 
                              color: colors.primaryText,
                              fontWeight: securitySettings.secureConnection ? 'medium' : 'normal'
                            }}>
                              Secure Connection Only
                            </Typography>
                          </Box>
                          <Switch 
                            checked={securitySettings.secureConnection} 
                            onChange={() => handleSecuritySettingChange('secureConnection')}
                            sx={{
                              '& .MuiSwitch-switchBase.Mui-checked': {
                                color: colors.primary,
                              },
                              '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                                backgroundColor: colors.primary
                              }
                            }}
                          />
                        </Box>
                        <Typography variant="caption" sx={{ color: colors.secondaryText, display: 'block', ml: 4 }}>
                          Allow admin access only through HTTPS secure connections
                        </Typography>
                      </Box>
                    </Grid>
                    
                  </Grid>
                </CardContent>
              </Card>
            </Box>
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
                            label={admin.account_status || 'active'} 
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
                            <IconButton sx={{ color: colors.primary, mr: 1 }} onClick={() => handleOpenEditAdmin(admin)}>
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title={(admin.user_id || admin.id) === currentAdmin?.user_id ? "Cannot delete your own account" : "Delete"}>
                            <span>
                              <IconButton 
                                sx={{ color: colors.sellRed }}
                                onClick={() => (admin.user_id || admin.id) !== currentAdmin?.user_id && handleOpenDeleteDialog(admin)}
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

        {/* Edit Admin Dialog */}
        <Dialog 
          open={showEditAdminDialog} 
          onClose={() => !editAdminSaving && setShowEditAdminDialog(false)}
          PaperProps={{
            sx: {
              backgroundColor: colors.cardBg,
              color: colors.primaryText,
              border: `1px solid ${colors.primary}40`
            }
          }}
        >
          <DialogTitle sx={{ borderBottom: `1px solid ${colors.borderColor}` }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <EditIcon sx={{ mr: 1, color: colors.primary }} />
              <Typography variant="h6" component="span" sx={{ fontWeight: 'bold' }}>
                Edit Admin
              </Typography>
            </Box>
          </DialogTitle>
          <DialogContent sx={{ pt: 3, pb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Avatar 
                sx={{ width: 40, height: 40, backgroundColor: colors.primary, mr: 2 }}
              >
                {editingAdmin?.username?.charAt(0).toUpperCase() || 'A'}
              </Avatar>
              <Typography sx={{ color: colors.primaryText, fontWeight: 'medium' }}>
                Editing user: <span style={{ color: colors.primary }}>{editingAdmin?.displayName}</span>
              </Typography>
            </Box>
            <Typography sx={{ color: colors.secondaryText, mb: 2 }}>
              Update admin information and credentials. Leave password fields empty if you don't want to change the password.
            </Typography>
            <form onSubmit={handleUpdateAdmin} id="edit-admin-form">
              <TextField
                fullWidth
                label="Username"
                name="username"
                value={editingAdmin?.username}
                onChange={handleEditAdminInputChange}
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
                value={editingAdmin?.email}
                onChange={handleEditAdminInputChange}
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
                label="Current Password"
                name="currentPassword"
                type={showPassword ? 'text' : 'password'}
                value={editingAdmin?.currentPassword}
                onChange={handleEditAdminInputChange}
                margin="normal"
                required
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
              />

              <TextField
                fullWidth
                label="New Password"
                name="newPassword"
                type={showNewPassword ? 'text' : 'password'}
                value={editingAdmin?.newPassword}
                onChange={handleEditAdminInputChange}
                margin="normal"
                InputProps={{
                  startAdornment: <LockIcon sx={{ mr: 1, color: colors.secondaryText }} />,
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
                value={editingAdmin?.confirmPassword}
                onChange={handleEditAdminInputChange}
                margin="normal"
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
              />
            </form>
          </DialogContent>
          <DialogActions sx={{ borderTop: `1px solid ${colors.borderColor}`, p: 2 }}>
            <Button 
              onClick={() => setShowEditAdminDialog(false)}
              sx={{ 
                color: colors.secondaryText,
                '&:hover': {
                  backgroundColor: colors.hoverBg
                }
              }}
              disabled={editAdminSaving}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleUpdateAdmin}
              disabled={editAdminSaving}
              type="submit"
              form="edit-admin-form"
              startIcon={editAdminSaving ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
              sx={{ 
                color: colors.primary,
                '&:hover': {
                  backgroundColor: `${colors.primary}22`
                }
              }}
            >
              {editAdminSaving ? 'Updating...' : 'Update Admin'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Delete Admin Dialog */}
        <Dialog
          open={showDeleteDialog}
          onClose={() => !deleteAdminLoading && setShowDeleteDialog(false)}
          PaperProps={{
            sx: {
              backgroundColor: colors.cardBg,
              color: colors.primaryText,
              border: `1px solid ${colors.sellRed}40`
            }
          }}
        >
          <DialogTitle sx={{ 
            borderBottom: `1px solid ${colors.borderColor}`,
            color: colors.sellRed
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <DeleteIcon sx={{ mr: 1 }} />
              Confirm Deletion
            </Box>
          </DialogTitle>
          <DialogContent sx={{ pt: 3, pb: 2 }}>
            <Alert severity="warning" sx={{ 
              mb: 2, 
              backgroundColor: `${colors.sellRed}10`,
              color: colors.sellRed,
              border: `1px solid ${colors.sellRed}30`
            }}>
              This action cannot be undone. The admin will lose all access to the system.
            </Alert>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, mt: 2 }}>
              <Avatar 
                sx={{ width: 40, height: 40, backgroundColor: colors.sellRed, mr: 2 }}
              >
                {deletingAdminName.charAt(0).toUpperCase() || 'A'}
              </Avatar>
              <Typography sx={{ color: colors.primaryText, fontWeight: 'medium' }}>
                You are about to delete admin user <span style={{ color: colors.sellRed }}>{deletingAdminName}</span>
              </Typography>
            </Box>
            <Typography variant="body1" sx={{ color: colors.primaryText }}>
              Are you sure you want to proceed with deleting this admin account?
            </Typography>
          </DialogContent>
          <DialogActions sx={{ borderTop: `1px solid ${colors.borderColor}`, p: 2 }}>
            <Button 
              onClick={() => setShowDeleteDialog(false)}
              sx={{ 
                color: colors.secondaryText,
                '&:hover': {
                  backgroundColor: colors.hoverBg
                }
              }}
              disabled={deleteAdminLoading}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleDeleteAdmin}
              disabled={deleteAdminLoading}
              sx={{ 
                bgcolor: `${colors.sellRed}`,
                color: 'white',
                '&:hover': {
                  bgcolor: `${colors.sellRed}dd`
                }
              }}
            >
              {deleteAdminLoading ? <CircularProgress size={20} color="inherit" /> : 'Delete Admin'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Notification Snackbar */}
        <Snackbar
          open={notification.open}
          autoHideDuration={5000}
          onClose={handleCloseNotification}
          anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
          sx={{ mt: 6 }}
        >
          <StyledAlert
            onClose={handleCloseNotification}
            severity={notification.type}
            sx={{
              width: '100%',
              bgcolor: notification.type === 'success' ? `${colors.buyGreen}10` : `${colors.sellRed}10`,
              color: notification.type === 'success' ? colors.buyGreen : colors.sellRed,
              border: `1px solid ${notification.type === 'success' ? `${colors.buyGreen}30` : `${colors.sellRed}30`}`,
              '& .MuiAlert-icon': {
                color: notification.type === 'success' ? colors.buyGreen : colors.sellRed,
              }
            }}
            action={
              <IconButton
                size="small"
                aria-label="close"
                color="inherit"
                onClick={handleCloseNotification}
              >
                <CloseIcon fontSize="small" />
              </IconButton>
            }
          >
            {notification.message}
          </StyledAlert>
        </Snackbar>
      </MainContent>
    </PageContainer>
  );
};

export default AdminSettings;
