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
  CircularProgress,
  Switch,
  FormControlLabel,
  Slider,
  Select,
  MenuItem,
  InputLabel,
  FormControl
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import PersonIcon from '@mui/icons-material/Person';
import EditIcon from '@mui/icons-material/Edit';
import LockIcon from '@mui/icons-material/Lock';
import EmailIcon from '@mui/icons-material/Email';
import SecurityIcon from '@mui/icons-material/Security';
import DeleteIcon from '@mui/icons-material/Delete';
import PaletteIcon from '@mui/icons-material/Palette';
import VisibilityIcon from '@mui/icons-material/Visibility';
import FormatSizeIcon from '@mui/icons-material/FormatSize';
import SpeedIcon from '@mui/icons-material/Speed';
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
  
  // Appearance settings
  const [darkMode, setDarkMode] = useState(true);
  const [fontSize, setFontSize] = useState(16);
  const [accentColor, setAccentColor] = useState('#2196F3');
  const [animationsEnabled, setAnimationsEnabled] = useState(true);
  const [chartDisplayMode, setChartDisplayMode] = useState('candles');
  const [layoutDensity, setLayoutDensity] = useState('comfortable');
  const [colorTheme, setColorTheme] = useState('default');
  const [showTutorialTips, setShowTutorialTips] = useState(true);
  
  // Performance settings
  const [autoRefreshData, setAutoRefreshData] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(30);
  
  // Available accent colors
  const accentOptions = [
    { name: 'Blue', value: '#2196F3' },
    { name: 'Green', value: '#4CAF50' },
    { name: 'Purple', value: '#9C27B0' },
    { name: 'Orange', value: '#FF9800' },
    { name: 'Pink', value: '#E91E63' },
    { name: 'Teal', value: '#009688' }
  ];
  
  // Available themes
  const themeOptions = [
    { name: 'Default Dark', value: 'default' },
    { name: 'Deep Ocean', value: 'ocean' },
    { name: 'Terminal', value: 'terminal' },
    { name: 'Night Sky', value: 'night' },
    { name: 'Midnight Blue', value: 'midnight' }
  ];

  useEffect(() => {
    fetchUserData();
    loadAppearanceSettings();
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
  
  // Load saved appearance settings from localStorage
  const loadAppearanceSettings = () => {
    const savedSettings = localStorage.getItem('appearanceSettings');
    if (savedSettings) {
      const settings = JSON.parse(savedSettings);
      setDarkMode(settings.darkMode ?? true);
      setFontSize(settings.fontSize ?? 16);
      setAccentColor(settings.accentColor ?? '#2196F3');
      setAnimationsEnabled(settings.animationsEnabled ?? true);
      setChartDisplayMode(settings.chartDisplayMode ?? 'candles');
      setLayoutDensity(settings.layoutDensity ?? 'comfortable');
      setColorTheme(settings.colorTheme ?? 'default');
      setShowTutorialTips(settings.showTutorialTips ?? true);
      setAutoRefreshData(settings.autoRefreshData ?? true);
      setRefreshInterval(settings.refreshInterval ?? 30);
    }
  };
  
  // Save appearance settings to localStorage
  const saveAppearanceSettings = () => {
    const settings = {
      darkMode,
      fontSize,
      accentColor,
      animationsEnabled,
      chartDisplayMode,
      layoutDensity,
      colorTheme,
      showTutorialTips,
      autoRefreshData,
      refreshInterval
    };
    localStorage.setItem('appearanceSettings', JSON.stringify(settings));
    setMessage({ type: 'success', text: 'Appearance settings saved successfully' });
    
    // In a real app, you might want to update the UI immediately
    // This is just a placeholder for demonstration
    document.documentElement.style.setProperty('--accent-color', accentColor);
    document.documentElement.style.setProperty('--font-size-base', `${fontSize}px`);
  };

  // Apply appearance settings to the application
  useEffect(() => {
    // This is a simplified implementation - in a real app you would
    // likely use a theme provider or CSS variables to apply these settings
    
    // Apply accent color
    document.documentElement.style.setProperty('--accent-color', accentColor);
    
    // Apply font size
    document.documentElement.style.setProperty('--font-size-base', `${fontSize}px`);
    
    // Apply dark/light mode
    document.body.classList.toggle('dark-mode', darkMode);
    document.body.classList.toggle('light-mode', !darkMode);
    
    // Apply chosen theme
    document.body.className = document.body.className
      .replace(/theme-\w+/g, '')
      .trim();
    document.body.classList.add(`theme-${colorTheme}`);
    
    // Apply animations setting
    document.body.classList.toggle('no-animations', !animationsEnabled);
    
    // Apply layout density
    document.body.className = document.body.className
      .replace(/density-\w+/g, '')
      .trim();
    document.body.classList.add(`density-${layoutDensity}`);
    
    // Store the selected chart display mode for other components to use
    localStorage.setItem('chartDisplayMode', chartDisplayMode);
    
  }, [darkMode, fontSize, accentColor, animationsEnabled, chartDisplayMode, layoutDensity, colorTheme]);

  const handleEmailUpdate = async (e) => {
    e.preventDefault();
    setProcessing(true);
    try {
      const response = await API.settings.updateEmail({
        current_password: currentPassword,
        new_email: email
      });
      
      setMessage({
        type: 'success',
        text: response.data.message || 'Email updated successfully'
      });
      setCurrentPassword('');
      setOpenEmailDialog(false);
      fetchUserData();
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
      const response = await API.settings.updatePassword({
        current_password: currentPassword,
        new_password: newPassword
      });
      
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
      await API.settings.deleteAccount();
      
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      navigate('/');
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
            
            {/* Appearance Settings */}
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
                  <PaletteIcon sx={{ mr: 1, color: colors.accentBlue }} />
                  Appearance Settings
                </Typography>
                
                <Divider sx={{ bgcolor: colors.borderColor, mb: 3 }} />
                
                <Grid container spacing={3}>
                  {/* Theme Selection */}
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2" sx={{ color: colors.primaryText, mb: 1 }}>
                      Color Theme
                    </Typography>
                    <FormControl fullWidth variant="outlined" sx={{ mb: 2 }}>
                      <InputLabel id="theme-select-label" sx={{ color: colors.secondaryText }}>
                        Theme
                      </InputLabel>
                      <Select
                        labelId="theme-select-label"
                        value={colorTheme}
                        onChange={(e) => setColorTheme(e.target.value)}
                        label="Theme"
                        sx={{
                          color: colors.primaryText,
                          '& .MuiOutlinedInput-notchedOutline': {
                            borderColor: colors.borderColor,
                          },
                          '&:hover .MuiOutlinedInput-notchedOutline': {
                            borderColor: colors.accentBlue,
                          },
                        }}
                      >
                        {themeOptions.map((theme) => (
                          <MenuItem key={theme.value} value={theme.value}>
                            {theme.name}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                    
                    <Typography variant="subtitle2" sx={{ color: colors.primaryText, mb: 1 }}>
                      Accent Color
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, mb: 3, flexWrap: 'wrap' }}>
                      {accentOptions.map((color) => (
                        <Box
                          key={color.value}
                          onClick={() => setAccentColor(color.value)}
                          sx={{
                            width: 36,
                            height: 36,
                            bgcolor: color.value,
                            borderRadius: '50%',
                            cursor: 'pointer',
                            border: accentColor === color.value ? '2px solid white' : 'none',
                            transition: 'transform 0.2s',
                            '&:hover': {
                              transform: 'scale(1.1)',
                            },
                          }}
                        />
                      ))}
                    </Box>
                    
                    <FormControlLabel
                      control={
                        <Switch
                          checked={darkMode}
                          onChange={(e) => setDarkMode(e.target.checked)}
                          sx={{
                            '& .MuiSwitch-switchBase.Mui-checked': {
                              color: colors.accentBlue,
                            },
                            '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                              backgroundColor: colors.accentBlue,
                            },
                          }}
                        />
                      }
                      label={
                        <Typography sx={{ color: colors.primaryText }}>
                          Dark Mode
                        </Typography>
                      }
                    />
                  </Grid>
                  
                  {/* Font and Layout Settings */}
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2" sx={{ color: colors.primaryText, mb: 1, display: 'flex', alignItems: 'center' }}>
                      <FormatSizeIcon sx={{ fontSize: 20, mr: 0.5 }} />
                      Font Size: {fontSize}px
                    </Typography>
                    <Slider
                      value={fontSize}
                      min={12}
                      max={20}
                      step={1}
                      onChange={(_, newValue) => setFontSize(newValue)}
                      sx={{
                        width: '100%',
                        color: colors.accentBlue,
                        mb: 3,
                        '& .MuiSlider-thumb': {
                          bgcolor: colors.accentBlue,
                        },
                        '& .MuiSlider-rail': {
                          bgcolor: colors.borderColor,
                        },
                      }}
                    />
                    
                    <Typography variant="subtitle2" sx={{ color: colors.primaryText, mb: 1 }}>
                      Layout Density
                    </Typography>
                    <FormControl fullWidth variant="outlined" sx={{ mb: 2 }}>
                      <Select
                        value={layoutDensity}
                        onChange={(e) => setLayoutDensity(e.target.value)}
                        sx={{
                          color: colors.primaryText,
                          '& .MuiOutlinedInput-notchedOutline': {
                            borderColor: colors.borderColor,
                          },
                          '&:hover .MuiOutlinedInput-notchedOutline': {
                            borderColor: colors.accentBlue,
                          },
                        }}
                      >
                        <MenuItem value="compact">Compact</MenuItem>
                        <MenuItem value="comfortable">Comfortable</MenuItem>
                        <MenuItem value="spacious">Spacious</MenuItem>
                      </Select>
                    </FormControl>
                    
                    <Typography variant="subtitle2" sx={{ color: colors.primaryText, mb: 1 }}>
                      Chart Display Mode
                    </Typography>
                    <FormControl fullWidth variant="outlined" sx={{ mb: 2 }}>
                      <Select
                        value={chartDisplayMode}
                        onChange={(e) => setChartDisplayMode(e.target.value)}
                        sx={{
                          color: colors.primaryText,
                          '& .MuiOutlinedInput-notchedOutline': {
                            borderColor: colors.borderColor,
                          },
                          '&:hover .MuiOutlinedInput-notchedOutline': {
                            borderColor: colors.accentBlue,
                          },
                        }}
                      >
                        <MenuItem value="candles">Candlesticks</MenuItem>
                        <MenuItem value="line">Line Chart</MenuItem>
                        <MenuItem value="area">Area Chart</MenuItem>
                        <MenuItem value="bars">OHLC Bars</MenuItem>
                      </Select>
                    </FormControl>
                    
                    <FormControlLabel
                      control={
                        <Switch
                          checked={animationsEnabled}
                          onChange={(e) => setAnimationsEnabled(e.target.checked)}
                          sx={{
                            '& .MuiSwitch-switchBase.Mui-checked': {
                              color: colors.accentBlue,
                            },
                            '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                              backgroundColor: colors.accentBlue,
                            },
                          }}
                        />
                      }
                      label={
                        <Typography sx={{ color: colors.primaryText }}>
                          Enable Animations
                        </Typography>
                      }
                    />
                  </Grid>
                </Grid>
                
                {/* Live Preview */}
                <Box sx={{ mt: 4, mb: 3 }}>
                  <Typography variant="subtitle1" sx={{ color: colors.primaryText, mb: 2, display: 'flex', alignItems: 'center' }}>
                    <VisibilityIcon sx={{ fontSize: 20, mr: 1 }} />
                    Live Preview
                  </Typography>
                  
                  <Paper
                    sx={{
                      p: 3,
                      bgcolor: darkMode ? '#1A1E2D' : '#FFFFFF',
                      borderRadius: 2,
                      border: `1px solid ${darkMode ? '#2A2F45' : '#E0E0E0'}`,
                      transition: animationsEnabled ? 'all 0.3s ease' : 'none',
                      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
                      overflow: 'hidden'
                    }}
                  >
                    <Box sx={{ 
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      pb: 2,
                      borderBottom: `1px solid ${darkMode ? '#2A2F45' : '#E0E0E0'}`
                    }}>
                      <Typography 
                        variant="h6" 
                        sx={{ 
                          color: darkMode ? '#FFFFFF' : '#212121',
                          fontSize: `${fontSize}px`,
                          fontWeight: 'bold'
                        }}
                      >
                        Market Overview
                      </Typography>
                      
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button
                          size="small"
                          variant="outlined"
                          sx={{
                            borderColor: accentColor,
                            color: accentColor,
                            '&:hover': {
                              borderColor: accentColor,
                              backgroundColor: `${accentColor}10`
                            },
                            transition: animationsEnabled ? 'all 0.2s ease' : 'none'
                          }}
                        >
                          Refresh
                        </Button>
                        
                        <Button
                          size="small"
                          variant="contained"
                          sx={{
                            backgroundColor: accentColor,
                            color: '#FFFFFF',
                            '&:hover': {
                              backgroundColor: accentColor,
                              opacity: 0.9
                            },
                            transition: animationsEnabled ? 'all 0.2s ease' : 'none'
                          }}
                        >
                          Trade
                        </Button>
                      </Box>
                    </Box>
                    
                    <Box sx={{ 
                      mt: layoutDensity === 'compact' ? 1 : (layoutDensity === 'comfortable' ? 2 : 3),
                      p: layoutDensity === 'compact' ? 1 : (layoutDensity === 'comfortable' ? 2 : 3),
                      backgroundColor: darkMode ? '#141824' : '#F5F5F5',
                      borderRadius: 1,
                    }}>
                      <Grid container spacing={layoutDensity === 'compact' ? 1 : (layoutDensity === 'comfortable' ? 2 : 3)}>
                        <Grid item xs={6}>
                          <Typography 
                            variant="body2" 
                            sx={{ 
                              color: darkMode ? '#A0A5B8' : '#757575',
                              fontSize: `${fontSize - 2}px`
                            }}
                          >
                            EUR/USD
                          </Typography>
                          <Typography 
                            variant="body1" 
                            sx={{ 
                              color: darkMode ? '#FFFFFF' : '#212121',
                              fontSize: `${fontSize}px`,
                              fontWeight: 'bold'
                            }}
                          >
                            1.0865
                          </Typography>
                          <Typography 
                            variant="body2" 
                            sx={{ 
                              color: '#4CAF50',
                              fontSize: `${fontSize - 2}px`
                            }}
                          >
                            +0.15%
                          </Typography>
                        </Grid>
                        
                        <Grid item xs={6}>
                          <Typography 
                            variant="body2" 
                            sx={{ 
                              color: darkMode ? '#A0A5B8' : '#757575',
                              fontSize: `${fontSize - 2}px`
                            }}
                          >
                            CHART TYPE
                          </Typography>
                          <Typography 
                            variant="body1" 
                            sx={{ 
                              color: darkMode ? '#FFFFFF' : '#212121',
                              fontSize: `${fontSize}px`,
                              textTransform: 'capitalize'
                            }}
                          >
                            {chartDisplayMode}
                          </Typography>
                          <Typography 
                            variant="body2" 
                            sx={{ 
                              color: accentColor,
                              fontSize: `${fontSize - 2}px`
                            }}
                          >
                            1D Timeframe
                          </Typography>
                        </Grid>
                      </Grid>
                      
                      {/* Simple representation of the selected chart type */}
                      <Box 
                        sx={{ 
                          mt: 2, 
                          height: 100, 
                          position: 'relative', 
                          borderBottom: darkMode ? `1px solid #2A2F45` : `1px solid #E0E0E0`,
                        }}
                      >
                        {chartDisplayMode === 'line' && (
                          <svg width="100%" height="100%" viewBox="0 0 300 100" preserveAspectRatio="none">
                            <path
                              d="M0,50 C50,30 100,70 150,50 S250,20 300,40"
                              fill="none"
                              stroke={accentColor}
                              strokeWidth="2"
                            />
                          </svg>
                        )}
                        
                        {chartDisplayMode === 'area' && (
                          <svg width="100%" height="100%" viewBox="0 0 300 100" preserveAspectRatio="none">
                            <path
                              d="M0,50 C50,30 100,70 150,50 S250,20 300,40 L300,100 L0,100 Z"
                              fill={`${accentColor}20`}
                              stroke={accentColor}
                              strokeWidth="2"
                            />
                          </svg>
                        )}
                        
                        {chartDisplayMode === 'candles' && (
                          <svg width="100%" height="100%" viewBox="0 0 300 100" preserveAspectRatio="none">
                            {/* Simplified candles */}
                            <rect x="30" y="20" width="20" height="40" fill="#FF3D57" />
                            <line x1="40" y1="10" x2="40" y2="20" stroke="#FF3D57" strokeWidth="2" />
                            <line x1="40" y1="60" x2="40" y2="70" stroke="#FF3D57" strokeWidth="2" />
                            
                            <rect x="80" y="40" width="20" height="30" fill="#4CAF50" />
                            <line x1="90" y1="30" x2="90" y2="40" stroke="#4CAF50" strokeWidth="2" />
                            <line x1="90" y1="70" x2="90" y2="80" stroke="#4CAF50" strokeWidth="2" />
                            
                            <rect x="130" y="30" width="20" height="20" fill="#4CAF50" />
                            <line x1="140" y1="20" x2="140" y2="30" stroke="#4CAF50" strokeWidth="2" />
                            <line x1="140" y1="50" x2="140" y2="65" stroke="#4CAF50" strokeWidth="2" />
                            
                            <rect x="180" y="45" width="20" height="25" fill="#FF3D57" />
                            <line x1="190" y1="30" x2="190" y2="45" stroke="#FF3D57" strokeWidth="2" />
                            <line x1="190" y1="70" x2="190" y2="80" stroke="#FF3D57" strokeWidth="2" />
                            
                            <rect x="230" y="25" width="20" height="35" fill="#4CAF50" />
                            <line x1="240" y1="15" x2="240" y2="25" stroke="#4CAF50" strokeWidth="2" />
                            <line x1="240" y1="60" x2="240" y2="75" stroke="#4CAF50" strokeWidth="2" />
                          </svg>
                        )}
                        
                        {chartDisplayMode === 'bars' && (
                          <svg width="100%" height="100%" viewBox="0 0 300 100" preserveAspectRatio="none">
                            {/* Simplified OHLC bars */}
                            <line x1="40" y1="20" x2="40" y2="70" stroke="#FF3D57" strokeWidth="2" />
                            <line x1="30" y1="25" x2="40" y2="25" stroke="#FF3D57" strokeWidth="2" />
                            <line x1="40" y1="65" x2="50" y2="65" stroke="#FF3D57" strokeWidth="2" />
                            
                            <line x1="90" y1="30" x2="90" y2="80" stroke="#4CAF50" strokeWidth="2" />
                            <line x1="80" y1="35" x2="90" y2="35" stroke="#4CAF50" strokeWidth="2" />
                            <line x1="90" y1="75" x2="100" y2="75" stroke="#4CAF50" strokeWidth="2" />
                            
                            <line x1="140" y1="20" x2="140" y2="65" stroke="#4CAF50" strokeWidth="2" />
                            <line x1="130" y1="25" x2="140" y2="25" stroke="#4CAF50" strokeWidth="2" />
                            <line x1="140" y1="60" x2="150" y2="60" stroke="#4CAF50" strokeWidth="2" />
                            
                            <line x1="190" y1="30" x2="190" y2="80" stroke="#FF3D57" strokeWidth="2" />
                            <line x1="180" y1="35" x2="190" y2="35" stroke="#FF3D57" strokeWidth="2" />
                            <line x1="190" y1="75" x2="200" y2="75" stroke="#FF3D57" strokeWidth="2" />
                            
                            <line x1="240" y1="15" x2="240" y2="75" stroke="#4CAF50" strokeWidth="2" />
                            <line x1="230" y1="20" x2="240" y2="20" stroke="#4CAF50" strokeWidth="2" />
                            <line x1="240" y1="70" x2="250" y2="70" stroke="#4CAF50" strokeWidth="2" />
                          </svg>
                        )}
                      </Box>
                    </Box>
                  </Paper>
                </Box>
                
                <Divider sx={{ bgcolor: colors.borderColor, my: 3 }} />
                
                {/* Performance Settings */}
                <Typography 
                  variant="h6" 
                  component="div"
                  sx={{ color: colors.primaryText, mb: 2, display: 'flex', alignItems: 'center' }}
                >
                  <SpeedIcon sx={{ mr: 1, color: colors.accentBlue }} />
                  Performance Settings
                </Typography>
                
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={autoRefreshData}
                          onChange={(e) => setAutoRefreshData(e.target.checked)}
                          sx={{
                            '& .MuiSwitch-switchBase.Mui-checked': {
                              color: colors.accentBlue,
                            },
                            '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                              backgroundColor: colors.accentBlue,
                            },
                          }}
                        />
                      }
                      label={
                        <Typography sx={{ color: colors.primaryText }}>
                          Auto-Refresh Market Data
                        </Typography>
                      }
                    />
                    
                    {autoRefreshData && (
                      <>
                        <Typography variant="subtitle2" sx={{ color: colors.primaryText, mt: 2, mb: 1, display: 'flex', alignItems: 'center' }}>
                          Refresh Interval: {refreshInterval} seconds
                        </Typography>
                        <Slider
                          value={refreshInterval}
                          min={5}
                          max={60}
                          step={5}
                          onChange={(_, newValue) => setRefreshInterval(newValue)}
                          sx={{
                            width: '100%',
                            color: colors.accentBlue,
                            mb: 2,
                            '& .MuiSlider-thumb': {
                              bgcolor: colors.accentBlue,
                            },
                            '& .MuiSlider-rail': {
                              bgcolor: colors.borderColor,
                            },
                          }}
                        />
                      </>
                    )}
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={showTutorialTips}
                          onChange={(e) => setShowTutorialTips(e.target.checked)}
                          sx={{
                            '& .MuiSwitch-switchBase.Mui-checked': {
                              color: colors.accentBlue,
                            },
                            '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                              backgroundColor: colors.accentBlue,
                            },
                          }}
                        />
                      }
                      label={
                        <Typography sx={{ color: colors.primaryText }}>
                          Show Tutorial Tips
                        </Typography>
                      }
                    />
                    <Typography variant="body2" sx={{ color: colors.secondaryText, mt: 1, ml: 4 }}>
                      Display helpful tips and guidance for new users
                    </Typography>
                  </Grid>
                </Grid>
                
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
                  <Button
                    variant="contained"
                    onClick={saveAppearanceSettings}
                    sx={{ 
                      background: `linear-gradient(135deg, ${colors.gradientStart}, ${colors.gradientEnd})`,
                      '&:hover': {
                        background: `linear-gradient(135deg, ${colors.gradientEnd}, ${colors.gradientStart})`,
                      }
                    }}
                  >
                    Save Appearance Settings
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
