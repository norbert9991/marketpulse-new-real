import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Button, 
  TextField, 
  Grid, 
  Alert, 
  Divider,
  Avatar,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import PersonIcon from '@mui/icons-material/Person';
import EditIcon from '@mui/icons-material/Edit';
import LockIcon from '@mui/icons-material/Lock';
import EmailIcon from '@mui/icons-material/Email';
import SecurityIcon from '@mui/icons-material/Security';
import DeleteIcon from '@mui/icons-material/Delete';
import axios from 'axios';

// Forex Trading Color Palette
const colors = {
  darkBg: '#0A0C14',
  panelBg: '#141620',
  cardBg: '#1E2235',
  primaryText: '#FFFFFF',
  secondaryText: '#A0A5B8',
  accentBlue: '#2196F3',
  hoverBg: 'rgba(33, 150, 243, 0.1)',
  borderColor: '#2A2F45',
  gradientStart: '#2196F3',
  gradientEnd: '#00E676',
  errorRed: '#FF3D57',
  successGreen: '#00E676'
};

const Settings = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ type: '', text: '' });
    const [email, setEmail] = useState('');
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
  const [username, setUsername] = useState('');
  const [openEmailDialog, setOpenEmailDialog] = useState(false);
  const [openPasswordDialog, setOpenPasswordDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [processing, setProcessing] = useState(false);

    useEffect(() => {
        fetchUserProfile();
    }, []);

    const fetchUserProfile = async () => {
        try {
            const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      // First get the user data from the auth/me endpoint
      const userResponse = await axios.get('http://localhost:5000/api/auth/me', {
                headers: {
          'Authorization': token
        }
      });
      
      if (userResponse.data && userResponse.data.user) {
        setUser(userResponse.data.user);
        setEmail(userResponse.data.user.email || '');
        setUsername(userResponse.data.user.username || '');
      } else {
        setMessage({ type: 'error', text: 'Failed to load user data' });
            }
        } catch (error) {
      console.error('Error fetching profile:', error);
            setMessage({ type: 'error', text: 'Failed to load profile data' });
    } finally {
      setLoading(false);
        }
    };

    const handleEmailUpdate = async (e) => {
        e.preventDefault();
    setProcessing(true);
        try {
            const token = localStorage.getItem('token');
      const response = await axios.put('http://localhost:5000/api/settings/update-email', 
        {
          email,
          password: currentPassword
        },
        {
                headers: {
                    'Content-Type': 'application/json',
            'Authorization': token
          }
        }
      );
      
      if (response.data.status === 'success') {
        setMessage({
          type: 'success',
          text: response.data.message || 'Email updated successfully'
        });
        setCurrentPassword('');
        setOpenEmailDialog(false);
        fetchUserProfile();
      } else {
            setMessage({
          type: 'error',
          text: response.data.message || 'Failed to update email'
            });
            }
        } catch (error) {
      console.error('Error updating email:', error);
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.message || 'Failed to update email' 
      });
    } finally {
      setProcessing(false);
    }
    };

    const handlePasswordUpdate = async (e) => {
        e.preventDefault();
    
        if (newPassword !== confirmPassword) {
            setMessage({ type: 'error', text: 'Passwords do not match' });
            return;
        }
    
        if (newPassword.length < 8) {
            setMessage({ type: 'error', text: 'Password must be at least 8 characters long' });
            return;
        }

    setProcessing(true);
        try {
            const token = localStorage.getItem('token');
      const response = await axios.put('http://localhost:5000/api/settings/update-password', 
        {
          currentPassword,
          newPassword
        },
        {
                headers: {
                    'Content-Type': 'application/json',
            'Authorization': token
          }
        }
      );
      
      if (response.data.status === 'success') {
            setMessage({
          type: 'success',
          text: response.data.message || 'Password updated successfully'
            });
                setCurrentPassword('');
                setNewPassword('');
                setConfirmPassword('');
        setOpenPasswordDialog(false);
      } else {
        setMessage({
          type: 'error',
          text: response.data.message || 'Failed to update password'
        });
            }
        } catch (error) {
      console.error('Error updating password:', error);
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.message || 'Failed to update password' 
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!deletePassword) {
      setMessage({ type: 'error', text: 'Please enter your password to confirm account deletion' });
      return;
    }

    setProcessing(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.delete('http://localhost:5000/api/settings/delete-account', 
        {
          data: { password: deletePassword },
          headers: {
            'Content-Type': 'application/json',
            'Authorization': token
          }
        }
      );
      
      if (response.data.status === 'success') {
        localStorage.removeItem('token');
        navigate('/login');
      } else {
        setMessage({
          type: 'error',
          text: response.data.message || 'Failed to delete account'
        });
      }
    } catch (error) {
      console.error('Error deleting account:', error);
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.message || 'Failed to delete account' 
      });
    } finally {
      setProcessing(false);
      setOpenDeleteDialog(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: colors.darkBg }}>
        <Sidebar />
        <Box sx={{ flexGrow: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', ml: '250px' }}>
          <CircularProgress sx={{ color: colors.accentBlue }} />
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: colors.darkBg }}>
            <Sidebar />
      <Box component="main" sx={{ flexGrow: 1, p: 3, ml: '250px' }}>
        <Box sx={{ maxWidth: 1000, mx: 'auto', mt: 4, mb: 4 }}>
          <Typography 
            variant="h4" 
            component="div"
            gutterBottom 
            sx={{ 
              color: colors.primaryText,
              fontWeight: 'bold',
              mb: 4
            }}
          >
                        Account Settings
                    </Typography>
                    
                    {message.text && (
            <Alert 
              severity={message.type} 
              sx={{ 
                mb: 3,
                bgcolor: message.type === 'success' ? 'rgba(0, 230, 118, 0.1)' : 'rgba(255, 61, 87, 0.1)',
                color: message.type === 'success' ? colors.successGreen : colors.errorRed,
                border: `1px solid ${message.type === 'success' ? colors.successGreen : colors.errorRed}`
              }}
              onClose={() => setMessage({ type: '', text: '' })}
            >
                            {message.text}
                        </Alert>
                    )}

                    <Grid container spacing={3}>
            {/* Profile Information */}
            <Grid item xs={12}>
              <Paper 
                sx={{ 
                  p: 3,
                  bgcolor: colors.cardBg,
                  border: `1px solid ${colors.borderColor}`,
                  borderRadius: 2
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                  <Avatar 
                    sx={{ 
                      width: 80, 
                      height: 80, 
                      bgcolor: colors.accentBlue,
                      mr: 2
                    }}
                  >
                    <PersonIcon sx={{ fontSize: 40 }} />
                  </Avatar>
                  <Box>
                    <Typography 
                      variant="h5" 
                      component="div"
                      sx={{ color: colors.primaryText, fontWeight: 'bold' }}
                    >
                      {user?.username || 'User'}
                    </Typography>
                    <Typography 
                      variant="body1" 
                      sx={{ color: colors.secondaryText }}
                    >
                      {user?.email || 'No email provided'}
                    </Typography>
                    <Typography 
                      variant="body2" 
                      sx={{ color: colors.secondaryText, mt: 0.5 }}
                    >
                      User ID: {user?.user_id || 'N/A'}
                    </Typography>
                  </Box>
                </Box>
                
                <Divider sx={{ bgcolor: colors.borderColor, mb: 3 }} />
                
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <EmailIcon sx={{ color: colors.accentBlue, mr: 1 }} />
                      <Typography sx={{ color: colors.primaryText, mr: 1 }}>
                        Email:
                      </Typography>
                      <Typography sx={{ color: colors.secondaryText }}>
                        {user?.email || 'Not set'}
                      </Typography>
                    </Box>
                    <Button
                      variant="outlined"
                      startIcon={<EditIcon />}
                      onClick={() => setOpenEmailDialog(true)}
                      sx={{ 
                        color: colors.accentBlue,
                        borderColor: colors.accentBlue,
                        '&:hover': {
                          borderColor: colors.gradientEnd,
                          bgcolor: 'rgba(33, 150, 243, 0.1)'
                        }
                      }}
                    >
                      Change Email
                    </Button>
                  </Grid>
                  
                        <Grid item xs={12} md={6}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <LockIcon sx={{ color: colors.accentBlue, mr: 1 }} />
                      <Typography sx={{ color: colors.primaryText, mr: 1 }}>
                        Password:
                      </Typography>
                      <Typography sx={{ color: colors.secondaryText }}>
                        ••••••••
                      </Typography>
                    </Box>
                    <Button
                      variant="outlined"
                      startIcon={<EditIcon />}
                      onClick={() => setOpenPasswordDialog(true)}
                      sx={{ 
                        color: colors.accentBlue,
                        borderColor: colors.accentBlue,
                        '&:hover': {
                          borderColor: colors.gradientEnd,
                          bgcolor: 'rgba(33, 150, 243, 0.1)'
                        }
                      }}
                    >
                      Change Password
                    </Button>
                  </Grid>
                </Grid>
              </Paper>
            </Grid>
            
            {/* Security Settings */}
            <Grid item xs={12}>
              <Paper 
                sx={{ 
                  p: 3,
                  bgcolor: colors.cardBg,
                  border: `1px solid ${colors.borderColor}`,
                  borderRadius: 2
                }}
              >
                <Typography 
                  variant="h6" 
                  component="div"
                  sx={{ color: colors.primaryText, mb: 2, display: 'flex', alignItems: 'center' }}
                >
                  <SecurityIcon sx={{ mr: 1, color: colors.accentBlue }} />
                  Security Settings
                </Typography>
                
                <Divider sx={{ bgcolor: colors.borderColor, mb: 3 }} />
                
                <Button
                  variant="outlined"
                  color="error"
                  startIcon={<DeleteIcon />}
                  onClick={() => setOpenDeleteDialog(true)}
                  sx={{ 
                    color: colors.errorRed,
                    borderColor: colors.errorRed,
                    '&:hover': {
                      borderColor: colors.errorRed,
                      bgcolor: 'rgba(255, 61, 87, 0.1)'
                    }
                  }}
                >
                  Delete Account
                </Button>
                <Typography 
                  variant="body2" 
                  sx={{ color: colors.secondaryText, mt: 1 }}
                >
                  Warning: This action cannot be undone. All your data will be permanently deleted.
                                </Typography>
              </Paper>
            </Grid>
          </Grid>
        </Box>
      </Box>
      
      {/* Email Update Dialog */}
      <Dialog 
        open={openEmailDialog} 
        onClose={() => !processing && setOpenEmailDialog(false)}
        PaperProps={{
          sx: {
            bgcolor: colors.cardBg,
            color: colors.primaryText,
            borderRadius: 2,
            border: `1px solid ${colors.borderColor}`
          }
        }}
      >
        <DialogTitle sx={{ color: colors.primaryText }}>
          Update Email Address
        </DialogTitle>
        <DialogContent>
          <Box component="form" onSubmit={handleEmailUpdate} sx={{ mt: 2 }}>
                                    <TextField
                                        fullWidth
              label="New Email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        margin="normal"
                                        type="email"
                                        required
              sx={{
                '& .MuiOutlinedInput-root': {
                  color: colors.primaryText,
                  '& fieldset': {
                    borderColor: colors.borderColor,
                  },
                  '&:hover fieldset': {
                    borderColor: colors.accentBlue,
                  },
                },
                '& .MuiInputLabel-root': {
                  color: colors.secondaryText,
                },
              }}
                                    />
                                    <TextField
                                        fullWidth
                                        label="Current Password"
                                        value={currentPassword}
                                        onChange={(e) => setCurrentPassword(e.target.value)}
                                        margin="normal"
                                        type="password"
                                        required
              sx={{
                '& .MuiOutlinedInput-root': {
                  color: colors.primaryText,
                  '& fieldset': {
                    borderColor: colors.borderColor,
                  },
                  '&:hover fieldset': {
                    borderColor: colors.accentBlue,
                  },
                },
                '& .MuiInputLabel-root': {
                  color: colors.secondaryText,
                },
              }}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button 
            onClick={() => setOpenEmailDialog(false)} 
            disabled={processing}
            sx={{ color: colors.secondaryText }}
          >
            Cancel
          </Button>
                                    <Button
            onClick={handleEmailUpdate} 
                                        variant="contained"
            disabled={processing}
            sx={{ 
              background: `linear-gradient(135deg, ${colors.gradientStart}, ${colors.gradientEnd})`,
              '&:hover': {
                background: `linear-gradient(135deg, ${colors.gradientEnd}, ${colors.gradientStart})`,
              }
            }}
          >
            {processing ? <CircularProgress size={24} color="inherit" /> : 'Update Email'}
                                    </Button>
        </DialogActions>
      </Dialog>
      
      {/* Password Update Dialog */}
      <Dialog 
        open={openPasswordDialog} 
        onClose={() => !processing && setOpenPasswordDialog(false)}
        PaperProps={{
          sx: {
            bgcolor: colors.cardBg,
            color: colors.primaryText,
            borderRadius: 2,
            border: `1px solid ${colors.borderColor}`
          }
        }}
      >
        <DialogTitle sx={{ color: colors.primaryText }}>
                                    Change Password
        </DialogTitle>
        <DialogContent>
          <Box component="form" onSubmit={handlePasswordUpdate} sx={{ mt: 2 }}>
                                    <TextField
                                        fullWidth
                                        label="Current Password"
                                        value={currentPassword}
                                        onChange={(e) => setCurrentPassword(e.target.value)}
                                        margin="normal"
                                        type="password"
                                        required
              sx={{
                '& .MuiOutlinedInput-root': {
                  color: colors.primaryText,
                  '& fieldset': {
                    borderColor: colors.borderColor,
                  },
                  '&:hover fieldset': {
                    borderColor: colors.accentBlue,
                  },
                },
                '& .MuiInputLabel-root': {
                  color: colors.secondaryText,
                },
              }}
                                    />
                                    <TextField
                                        fullWidth
                                        label="New Password"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        margin="normal"
                                        type="password"
                                        required
              sx={{
                '& .MuiOutlinedInput-root': {
                  color: colors.primaryText,
                  '& fieldset': {
                    borderColor: colors.borderColor,
                  },
                  '&:hover fieldset': {
                    borderColor: colors.accentBlue,
                  },
                },
                '& .MuiInputLabel-root': {
                  color: colors.secondaryText,
                },
              }}
                                    />
                                    <TextField
                                        fullWidth
                                        label="Confirm New Password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        margin="normal"
                                        type="password"
                                        required
              sx={{
                '& .MuiOutlinedInput-root': {
                  color: colors.primaryText,
                  '& fieldset': {
                    borderColor: colors.borderColor,
                  },
                  '&:hover fieldset': {
                    borderColor: colors.accentBlue,
                  },
                },
                '& .MuiInputLabel-root': {
                  color: colors.secondaryText,
                },
              }}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button 
            onClick={() => setOpenPasswordDialog(false)} 
            disabled={processing}
            sx={{ color: colors.secondaryText }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handlePasswordUpdate} 
            variant="contained"
            disabled={processing}
            sx={{ 
              background: `linear-gradient(135deg, ${colors.gradientStart}, ${colors.gradientEnd})`,
              '&:hover': {
                background: `linear-gradient(135deg, ${colors.gradientEnd}, ${colors.gradientStart})`,
              }
            }}
          >
            {processing ? <CircularProgress size={24} color="inherit" /> : 'Update Password'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Delete Account Dialog */}
      <Dialog 
        open={openDeleteDialog} 
        onClose={() => !processing && setOpenDeleteDialog(false)}
        PaperProps={{
          sx: {
            bgcolor: colors.cardBg,
            color: colors.primaryText,
            borderRadius: 2,
            border: `1px solid ${colors.borderColor}`
          }
        }}
      >
        <DialogTitle sx={{ color: colors.errorRed }}>
          Delete Account
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ color: colors.primaryText, mb: 2 }}>
            Are you sure you want to delete your account? This action cannot be undone.
          </Typography>
          <TextField
            fullWidth
            label="Enter your password to confirm"
            value={deletePassword}
            onChange={(e) => setDeletePassword(e.target.value)}
            margin="normal"
            type="password"
            required
            sx={{
              '& .MuiOutlinedInput-root': {
                color: colors.primaryText,
                '& fieldset': {
                  borderColor: colors.borderColor,
                },
                '&:hover fieldset': {
                  borderColor: colors.errorRed,
                },
              },
              '& .MuiInputLabel-root': {
                color: colors.secondaryText,
              },
            }}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button 
            onClick={() => setOpenDeleteDialog(false)} 
            disabled={processing}
            sx={{ color: colors.secondaryText }}
          >
            Cancel
          </Button>
                                    <Button
            onClick={handleDeleteAccount} 
                                        variant="contained"
            disabled={processing}
            sx={{ 
              bgcolor: colors.errorRed,
              '&:hover': {
                bgcolor: '#d32f2f',
              }
            }}
          >
            {processing ? <CircularProgress size={24} color="inherit" /> : 'Delete Account'}
                                    </Button>
        </DialogActions>
      </Dialog>
        </Box>
    );
};

export default Settings;
