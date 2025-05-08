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
import { styled } from '@mui/system';
import { useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import PersonIcon from '@mui/icons-material/Person';
import EditIcon from '@mui/icons-material/Edit';
import LockIcon from '@mui/icons-material/Lock';
import EmailIcon from '@mui/icons-material/Email';
import SecurityIcon from '@mui/icons-material/Security';
import DeleteIcon from '@mui/icons-material/Delete';
import { API } from '../axiosConfig';

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

// Add these styled components after the colors definition
const StyledTextField = styled(TextField)({
  '& .MuiOutlinedInput-root': {
    color: colors.primaryText,
    '& fieldset': {
      borderColor: colors.borderColor,
      borderRadius: '12px',
    },
    '&:hover fieldset': {
      borderColor: colors.accentBlue,
    },
    '&.Mui-focused fieldset': {
      borderColor: colors.accentBlue,
    },
  },
  '& .MuiInputLabel-root': {
    color: colors.secondaryText,
  },
  '& .MuiInputLabel-root.Mui-focused': {
    color: colors.accentBlue,
  },
  '& .MuiInputBase-input': {
    padding: '14px',
  }
});

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
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      const userResponse = await API.auth.me();
      setUser(userResponse.data.user);
      setEmail(userResponse.data.user.email);
      setUsername(userResponse.data.user.username);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching user data:', error);
      setMessage({ type: 'error', text: 'Failed to load user data' });
      setLoading(false);
    }
  };

  const handleEmailUpdate = async (e) => {
    e.preventDefault();
    console.log('Starting email update');
    
    if (!email) {
      setMessage({ type: 'error', text: 'Please enter a valid email address' });
      return;
    }
    
    if (!currentPassword) {
      setMessage({ type: 'error', text: 'Please enter your current password' });
      return;
    }
    
    setProcessing(true);
    try {
      console.log('Sending email update request with:', { email, password: currentPassword });
      const response = await API.settings.updateEmail({
        password: currentPassword,
        email: email
      });
      
      console.log('Email update response:', response.data);
      setMessage({
        type: 'success',
        text: response.data.message || 'Email updated successfully'
      });
      setCurrentPassword('');
      setOpenEmailDialog(false);
      fetchUserData();
    } catch (error) {
      console.error('Error updating email:', error);
      console.error('Error response:', error.response?.data);
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
    console.log('Starting password update');
    
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
      console.log('Sending password update request');
      const response = await API.settings.updatePassword({
        currentPassword: currentPassword,
        newPassword: newPassword
      });
      
      console.log('Password update response:', response.data);
      setMessage({
        type: 'success',
        text: response.data.message || 'Password updated successfully'
      });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setOpenPasswordDialog(false);
    } catch (error) {
      console.error('Error updating password:', error);
      console.error('Error response:', error.response?.data);
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.message || 'Failed to update password' 
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleDeleteAccount = async () => {
    console.log('Starting account deletion');
    
    if (!deletePassword) {
      setMessage({ type: 'error', text: 'Please enter your password to confirm account deletion' });
      return;
    }

    setProcessing(true);
    try {
      console.log('Sending delete account request');
      await API.settings.deleteAccount({ password: deletePassword });
      
      console.log('Account deletion successful, clearing local data');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      navigate('/');
    } catch (error) {
      console.error('Error deleting account:', error);
      console.error('Error response:', error.response?.data);
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
          {/* Gradient Header */}
          <Box 
            sx={{ 
              mb: 4, 
              p: 4, 
              borderRadius: 3,
              background: `linear-gradient(135deg, ${colors.gradientStart}40, ${colors.gradientEnd}40)`,
              backdropFilter: 'blur(10px)',
              border: `1px solid ${colors.borderColor}`,
              boxShadow: `0 8px 32px rgba(0, 0, 0, 0.2)`,
              transition: 'all 0.3s ease',
              '&:hover': {
                boxShadow: `0 12px 40px rgba(0, 0, 0, 0.25)`,
                transform: 'translateY(-5px)'
              }
            }}
          >
            <Typography 
              variant="h4" 
              component="div"
              sx={{ 
                color: colors.primaryText,
                fontWeight: 'bold',
                background: `linear-gradient(135deg, ${colors.gradientStart}, ${colors.gradientEnd})`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                display: 'inline-block'
              }}
            >
              Account Settings
            </Typography>
            <Typography 
              variant="body1" 
              sx={{ 
                color: colors.secondaryText,
                mt: 1,
                maxWidth: '600px'
              }}
            >
              Manage your profile information, update email, change password, and control security settings
            </Typography>
          </Box>
          
          {message.text && (
            <Alert 
              severity={message.type} 
              sx={{ 
                mb: 3,
                bgcolor: message.type === 'success' ? 'rgba(0, 230, 118, 0.1)' : 'rgba(255, 61, 87, 0.1)',
                color: message.type === 'success' ? colors.successGreen : colors.errorRed,
                border: `1px solid ${message.type === 'success' ? 'rgba(0, 230, 118, 0.3)' : 'rgba(255, 61, 87, 0.3)'}`,
                borderRadius: 2,
                boxShadow: `0 4px 12px ${message.type === 'success' ? 'rgba(0, 230, 118, 0.2)' : 'rgba(255, 61, 87, 0.2)'}`,
                '& .MuiAlert-icon': {
                  color: message.type === 'success' ? colors.successGreen : colors.errorRed,
                },
                animation: 'fadeIn 0.5s ease',
                '@keyframes fadeIn': {
                  '0%': { opacity: 0, transform: 'translateY(-10px)' },
                  '100%': { opacity: 1, transform: 'translateY(0)' }
                }
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
                  p: 4,
                  bgcolor: colors.cardBg,
                  border: `1px solid ${colors.borderColor}`,
                  borderRadius: 3,
                  boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15)',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    boxShadow: '0 12px 32px rgba(0, 0, 0, 0.2)',
                    borderColor: colors.accentBlue,
                  }
                }}
              >
                <Box sx={{ display: 'flex', flexDirection: {xs: 'column', sm: 'row'}, alignItems: {xs: 'center', sm: 'flex-start'}, mb: 4, gap: 3 }}>
                  <Box sx={{ 
                    position: 'relative', 
                    transition: 'transform 0.3s ease',
                    '&:hover': { transform: 'scale(1.05)' }
                  }}>
                    <Avatar 
                      sx={{ 
                        width: 100, 
                        height: 100, 
                        bgcolor: `${colors.accentBlue}80`,
                        border: `4px solid ${colors.borderColor}`,
                        boxShadow: `0 4px 20px rgba(0, 0, 0, 0.2)`,
                      }}
                    >
                      <PersonIcon sx={{ fontSize: 50 }} />
                    </Avatar>
                    <Box sx={{ 
                      position: 'absolute', 
                      bottom: 0, 
                      right: 0, 
                      bgcolor: colors.accentBlue,
                      borderRadius: '50%',
                      p: 0.5,
                      border: `2px solid ${colors.cardBg}`,
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        bgcolor: colors.gradientEnd,
                        transform: 'scale(1.1)'
                      }
                    }}>
                      <EditIcon sx={{ fontSize: 18 }} />
                    </Box>
                  </Box>
                  <Box sx={{ textAlign: {xs: 'center', sm: 'left'} }}>
                    <Typography 
                      variant="h5" 
                      component="div"
                      sx={{ 
                        color: colors.primaryText, 
                        fontWeight: 'bold',
                        background: `linear-gradient(135deg, ${colors.primaryText}, ${colors.secondaryText})`,
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                      }}
                    >
                      {user?.username || 'User'}
                    </Typography>
                    <Typography 
                      variant="body1" 
                      sx={{ 
                        color: colors.secondaryText,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        flexWrap: 'wrap',
                        justifyContent: {xs: 'center', sm: 'flex-start'}
                      }}
                    >
                      <EmailIcon fontSize="small" />
                      {user?.email || 'No email provided'}
                    </Typography>
                    <Box sx={{ 
                      display: 'inline-block',
                      mt: 1,
                      px: 2,
                      py: 0.5,
                      bgcolor: `${colors.accentBlue}20`,
                      color: colors.accentBlue,
                      borderRadius: 5,
                      fontSize: '0.8rem',
                      border: `1px solid ${colors.accentBlue}40`
                    }}>
                      Active Account
                    </Box>
                  </Box>
                </Box>
                
                <Divider sx={{ 
                  bgcolor: `${colors.borderColor}80`, 
                  mb: 4, 
                  position: 'relative',
                  '&::after': {
                    content: '""',
                    position: 'absolute',
                    width: '80px',
                    height: '3px',
                    background: `linear-gradient(90deg, ${colors.accentBlue}, ${colors.gradientEnd})`,
                    bottom: 0,
                    left: 0,
                    borderRadius: '3px'
                  }
                }} />
                
                <Grid container spacing={4}>
                  <Grid item xs={12} md={6}>
                    <Box sx={{ 
                      display: 'flex', 
                      flexDirection: 'column',
                      p: 3,
                      bgcolor: `${colors.panelBg}60`,
                      borderRadius: 3,
                      border: `1px solid ${colors.borderColor}`,
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        bgcolor: colors.panelBg,
                        transform: 'translateY(-5px)',
                        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.12)'
                      }
                    }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <Box sx={{ 
                          p: 1.5,
                          borderRadius: '12px',
                          bgcolor: `${colors.accentBlue}20`,
                          mr: 2,
                          display: 'flex',
                          justifyContent: 'center',
                          alignItems: 'center'
                        }}>
                          <EmailIcon sx={{ color: colors.accentBlue }} />
                        </Box>
                        <Box>
                          <Typography sx={{ color: colors.primaryText, fontWeight: 'bold' }}>
                            Email Address
                          </Typography>
                          <Typography sx={{ color: colors.secondaryText, fontSize: '0.9rem' }}>
                            {user?.email || 'Not set'}
                          </Typography>
                        </Box>
                      </Box>
                      <Button
                        variant="contained"
                        startIcon={<EditIcon />}
                        onClick={() => setOpenEmailDialog(true)}
                        sx={{ 
                          mt: 'auto',
                          background: `linear-gradient(135deg, ${colors.accentBlue}, ${colors.gradientEnd})`,
                          borderRadius: '12px',
                          textTransform: 'none',
                          fontWeight: 'bold',
                          py: 1.5,
                          '&:hover': {
                            background: `linear-gradient(135deg, ${colors.gradientEnd}, ${colors.accentBlue})`,
                            boxShadow: `0 8px 16px ${colors.accentBlue}40`,
                            transform: 'translateY(-2px)'
                          },
                          transition: 'all 0.3s ease'
                        }}
                      >
                        Change Email
                      </Button>
                    </Box>
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <Box sx={{ 
                      display: 'flex', 
                      flexDirection: 'column',
                      p: 3,
                      bgcolor: `${colors.panelBg}60`,
                      borderRadius: 3,
                      border: `1px solid ${colors.borderColor}`,
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        bgcolor: colors.panelBg,
                        transform: 'translateY(-5px)',
                        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.12)'
                      }
                    }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <Box sx={{ 
                          p: 1.5,
                          borderRadius: '12px',
                          bgcolor: `${colors.accentBlue}20`,
                          mr: 2,
                          display: 'flex',
                          justifyContent: 'center',
                          alignItems: 'center'
                        }}>
                          <LockIcon sx={{ color: colors.accentBlue }} />
                        </Box>
                        <Box>
                          <Typography sx={{ color: colors.primaryText, fontWeight: 'bold' }}>
                            Password
                          </Typography>
                          <Typography sx={{ color: colors.secondaryText, fontSize: '0.9rem' }}>
                            Last changed: Not available
                          </Typography>
                        </Box>
                      </Box>
                      <Button
                        variant="contained"
                        startIcon={<EditIcon />}
                        onClick={() => setOpenPasswordDialog(true)}
                        sx={{ 
                          mt: 'auto',
                          background: `linear-gradient(135deg, ${colors.accentBlue}, ${colors.gradientEnd})`,
                          borderRadius: '12px',
                          textTransform: 'none',
                          fontWeight: 'bold',
                          py: 1.5,
                          '&:hover': {
                            background: `linear-gradient(135deg, ${colors.gradientEnd}, ${colors.accentBlue})`,
                            boxShadow: `0 8px 16px ${colors.accentBlue}40`,
                            transform: 'translateY(-2px)'
                          },
                          transition: 'all 0.3s ease'
                        }}
                      >
                        Change Password
                      </Button>
                    </Box>
                  </Grid>
                </Grid>
              </Paper>
            </Grid>
            
            {/* Security Settings */}
            <Grid item xs={12}>
              <Paper 
                sx={{ 
                  p: 4,
                  bgcolor: colors.cardBg,
                  border: `1px solid ${colors.borderColor}`,
                  borderRadius: 3,
                  boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15)',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    boxShadow: '0 12px 32px rgba(0, 0, 0, 0.2)',
                    borderColor: `${colors.errorRed}40`,
                  }
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                  <Box sx={{ 
                    p: 1.5,
                    borderRadius: '12px',
                    bgcolor: `${colors.errorRed}20`,
                    mr: 2,
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center'
                  }}>
                    <SecurityIcon sx={{ color: colors.errorRed }} />
                  </Box>
                  <Typography 
                    variant="h6" 
                    component="div"
                    sx={{ color: colors.primaryText, fontWeight: 'bold' }}
                  >
                    Danger Zone
                  </Typography>
                </Box>
                
                <Divider sx={{ 
                  bgcolor: `${colors.borderColor}80`, 
                  mb: 3,
                  position: 'relative',
                  '&::after': {
                    content: '""',
                    position: 'absolute',
                    width: '80px',
                    height: '3px',
                    background: `linear-gradient(90deg, ${colors.errorRed}, ${colors.errorRed}60)`,
                    bottom: 0,
                    left: 0,
                    borderRadius: '3px'
                  }
                }} />
                
                <Box sx={{ 
                  p: 3, 
                  border: `1px dashed ${colors.errorRed}60`,
                  borderRadius: 3,
                  bgcolor: `${colors.errorRed}10`,
                }}>
                  <Typography sx={{ color: colors.primaryText, mb: 2, fontWeight: 'medium' }}>
                    Delete Your Account
                  </Typography>
                  <Typography 
                    variant="body2" 
                    sx={{ color: colors.secondaryText, mb: 3 }}
                  >
                    Warning: This action cannot be undone. All your data will be permanently deleted, including your profile, favorites, and account history.
                  </Typography>
                  <Button
                    variant="contained"
                    color="error"
                    startIcon={<DeleteIcon />}
                    onClick={() => setOpenDeleteDialog(true)}
                    sx={{ 
                      bgcolor: colors.errorRed,
                      borderRadius: '12px',
                      textTransform: 'none',
                      fontWeight: 'bold',
                      py: 1.5,
                      '&:hover': {
                        bgcolor: `${colors.errorRed}D0`,
                        boxShadow: `0 8px 16px ${colors.errorRed}40`,
                      },
                      transition: 'all 0.3s ease'
                    }}
                  >
                    Delete Account
                  </Button>
                </Box>
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
            borderRadius: 3,
            border: `1px solid ${colors.borderColor}`,
            maxWidth: '450px',
            width: '100%'
          }
        }}
      >
        <DialogTitle sx={{ 
          color: colors.primaryText, 
          borderBottom: `1px solid ${colors.borderColor}`,
          pb: 2
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <EmailIcon sx={{ color: colors.accentBlue, mr: 1.5 }} />
            <Typography variant="h6" component="span" sx={{ fontWeight: 'bold' }}>
              Update Email Address
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ pt: 3, pb: 2 }}>
          <Typography sx={{ color: colors.secondaryText, mb: 3 }}>
            Enter your new email address and current password to verify your identity.
          </Typography>
          <Box component="form" id="email-update-form" onSubmit={handleEmailUpdate} sx={{ mt: 1 }}>
            <StyledTextField
              fullWidth
              label="New Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              margin="normal"
              type="email"
              required
              variant="outlined"
              sx={{ mb: 2 }}
            />
            <StyledTextField
              fullWidth
              label="Current Password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              margin="normal"
              type="password"
              required
              variant="outlined"
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 1 }}>
          <Button 
            onClick={() => setOpenEmailDialog(false)} 
            disabled={processing}
            sx={{ 
              color: colors.secondaryText,
              '&:hover': {
                color: colors.primaryText,
                backgroundColor: 'transparent'
              }
            }}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form="email-update-form"
            variant="contained"
            disabled={processing}
            sx={{ 
              background: `linear-gradient(135deg, ${colors.gradientStart}, ${colors.gradientEnd})`,
              borderRadius: '12px',
              textTransform: 'none',
              px: 3,
              py: 1,
              '&:hover': {
                background: `linear-gradient(135deg, ${colors.gradientEnd}, ${colors.gradientStart})`,
                boxShadow: `0 4px 12px ${colors.accentBlue}40`,
              }
            }}
          >
            {processing ? <CircularProgress size={24} color="inherit" /> : 'Update Email'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Password Update Dialog - update using the same styling pattern as the email dialog */}
      <Dialog 
        open={openPasswordDialog} 
        onClose={() => !processing && setOpenPasswordDialog(false)}
        PaperProps={{
          sx: {
            bgcolor: colors.cardBg,
            color: colors.primaryText,
            borderRadius: 3,
            border: `1px solid ${colors.borderColor}`,
            maxWidth: '450px',
            width: '100%'
          }
        }}
      >
        <DialogTitle sx={{ 
          color: colors.primaryText, 
          borderBottom: `1px solid ${colors.borderColor}`,
          pb: 2
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <LockIcon sx={{ color: colors.accentBlue, mr: 1.5 }} />
            <Typography variant="h6" component="span" sx={{ fontWeight: 'bold' }}>
              Change Password
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ pt: 3, pb: 2 }}>
          <Typography sx={{ color: colors.secondaryText, mb: 3 }}>
            Create a strong password that's at least 8 characters long. Include a mix of letters, numbers, and symbols for better security.
          </Typography>
          <Box component="form" onSubmit={handlePasswordUpdate} sx={{ mt: 1 }}>
            <StyledTextField
              fullWidth
              label="Current Password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              margin="normal"
              type="password"
              required
              variant="outlined"
              sx={{ mb: 2 }}
            />
            <StyledTextField
              fullWidth
              label="New Password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              margin="normal"
              type="password"
              required
              variant="outlined"
              sx={{ mb: 2 }}
            />
            <StyledTextField
              fullWidth
              label="Confirm New Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              margin="normal"
              type="password"
              required
              variant="outlined"
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 1 }}>
          <Button 
            onClick={() => setOpenPasswordDialog(false)} 
            disabled={processing}
            sx={{ 
              color: colors.secondaryText,
              '&:hover': {
                color: colors.primaryText,
                backgroundColor: 'transparent'
              }
            }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handlePasswordUpdate} 
            variant="contained"
            disabled={processing}
            sx={{ 
              background: `linear-gradient(135deg, ${colors.gradientStart}, ${colors.gradientEnd})`,
              borderRadius: '12px',
              textTransform: 'none',
              px: 3,
              py: 1,
              '&:hover': {
                background: `linear-gradient(135deg, ${colors.gradientEnd}, ${colors.gradientStart})`,
                boxShadow: `0 4px 12px ${colors.accentBlue}40`,
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
            borderRadius: 3,
            border: `1px solid ${colors.errorRed}40`,
            maxWidth: '450px',
            width: '100%'
          }
        }}
      >
        <DialogTitle sx={{ 
          color: colors.errorRed, 
          borderBottom: `1px solid ${colors.borderColor}`,
          pb: 2
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <DeleteIcon sx={{ color: colors.errorRed, mr: 1.5 }} />
            <Typography variant="h6" component="span" sx={{ fontWeight: 'bold' }}>
              Delete Account
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ pt: 3, pb: 2 }}>
          <Box sx={{ 
            p: 2, 
            mb: 3, 
            bgcolor: `${colors.errorRed}10`, 
            borderRadius: 2,
            border: `1px solid ${colors.errorRed}30`,
          }}>
            <Typography sx={{ color: colors.primaryText, fontWeight: 'medium' }}>
              This action cannot be undone
            </Typography>
            <Typography sx={{ color: colors.secondaryText, mt: 1, fontSize: '0.9rem' }}>
              All your data, including your profile, preferences, and trading history will be permanently deleted.
            </Typography>
          </Box>
          <StyledTextField
            fullWidth
            label="Enter your password to confirm"
            value={deletePassword}
            onChange={(e) => setDeletePassword(e.target.value)}
            margin="normal"
            type="password"
            required
            variant="outlined"
            sx={{
              '& .MuiOutlinedInput-root': {
                '&:hover fieldset': {
                  borderColor: colors.errorRed,
                },
                '&.Mui-focused fieldset': {
                  borderColor: colors.errorRed,
                },
              },
              '& .MuiInputLabel-root.Mui-focused': {
                color: colors.errorRed,
              },
            }}
          />
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 1 }}>
          <Button 
            onClick={() => setOpenDeleteDialog(false)} 
            disabled={processing}
            sx={{ 
              color: colors.secondaryText,
              '&:hover': {
                color: colors.primaryText,
                backgroundColor: 'transparent'
              }
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleDeleteAccount} 
            variant="contained"
            disabled={processing}
            sx={{ 
              bgcolor: colors.errorRed,
              borderRadius: '12px',
              textTransform: 'none',
              px: 3,
              py: 1,
              '&:hover': {
                bgcolor: `${colors.errorRed}D0`,
                boxShadow: `0 4px 12px ${colors.errorRed}40`,
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
