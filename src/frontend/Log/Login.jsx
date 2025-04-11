import React, { useState } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogTitle, 
  TextField, 
  Button, 
  Typography, 
  Box,
  CircularProgress,
  Alert,
  IconButton,
} from '@mui/material';
import { styled } from '@mui/system';
import { API } from '../../axiosConfig';
import { useNavigate } from 'react-router-dom';
import CloseIcon from '@mui/icons-material/Close';

// Forex Trading Color Palette
const colors = {
  darkBg: '#0A0C14',
  panelBg: '#141620',
  cardBg: '#1E2235',
  primaryText: '#FFFFFF',
  secondaryText: '#A0A5B8',
  buyGreen: '#00E676',
  sellRed: '#FF3D57',
  accentBlue: '#2196F3',
  warningOrange: '#FFA726',
  profitGreen: '#00C853',
  lossRed: '#D50000',
  gradientStart: '#2196F3',
  gradientEnd: '#00E676',
  hoverBg: 'rgba(33, 150, 243, 0.1)',
  borderColor: '#2A2F45',
  shadowColor: 'rgba(0, 0, 0, 0.3)'
};

const LoginFormContainer = styled('div')({
  display: 'flex',
  height: '600px',
  backgroundColor: colors.panelBg,
  borderRadius: '16px',
  overflow: 'hidden',
  boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
  border: `1px solid ${colors.borderColor}`,
  position: 'relative',
  transition: 'all 0.5s ease'
});

const FormsWrapper = styled('div')(({ isLogin }) => ({
  display: 'flex',
  width: '740px',
  transition: 'transform 0.6s ease-in-out',
  transform: isLogin ? 'translateX(0)' : 'translateX(-400px)',
}));

const LoginForm = styled('div')({
  padding: '50px 40px',
  width: '400px',
  minWidth: '400px',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  backgroundColor: colors.cardBg,
  position: 'relative',
  zIndex: 1,
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    background: `radial-gradient(circle at 30% 107%, ${colors.panelBg} 0%, ${colors.cardBg} 90%)`,
    opacity: 0.4,
    zIndex: -1
  }
});

const LoginInfo = styled('div')({
  padding: '50px 40px',
  width: '340px',
  minWidth: '340px',
  background: `linear-gradient(135deg, ${colors.gradientStart}, ${colors.gradientEnd})`,
  color: colors.primaryText,
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  position: 'relative',
  overflow: 'hidden',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    background: 'url(https://www.transparenttextures.com/patterns/cubes.png)',
    opacity: 0.1,
    zIndex: 0
  },
  '& > *': {
    position: 'relative',
    zIndex: 1
  }
});

const StyledTextField = styled(TextField)({
  marginBottom: '20px',
  '& .MuiOutlinedInput-root': {
    '& fieldset': {
      borderColor: colors.borderColor,
      borderWidth: '1px',
      borderRadius: '12px',
      transition: 'all 0.3s ease'
    },
    '&:hover fieldset': {
      borderColor: colors.accentBlue,
    },
    '&.Mui-focused fieldset': {
      borderColor: colors.accentBlue,
      borderWidth: '2px',
      boxShadow: `0 0 0 3px ${colors.accentBlue}20`,
    },
    backgroundColor: `${colors.panelBg}90`,
    color: colors.primaryText,
    borderRadius: '12px',
    transition: 'all 0.3s ease',
    padding: '2px 5px',
    '& input': {
      color: colors.primaryText,
      padding: '16px 14px',
      '&::placeholder': {
        color: colors.secondaryText,
        opacity: 0.7
      }
    }
  },
  '& .MuiInputLabel-root': {
    color: colors.secondaryText,
    fontSize: '0.9rem',
    fontWeight: 500,
    transition: 'all 0.3s ease',
    transformOrigin: 'left top',
    '&.Mui-focused': {
      color: colors.accentBlue,
    }
  },
  '& .MuiInputLabel-shrink': {
    transform: 'translate(14px, -9px) scale(0.75)'
  }
});

const AnimatedButton = styled(Button)({
  transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
  '&:hover': {
    transform: 'translateY(-3px)',
  },
  '&:active': {
    transform: 'translateY(0)',
  }
});

const LoginDialog = ({ open, onClose, isLogin, toggleForm }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async () => {
    setLoading(true);
    setError('');
    try {
      console.log('Attempting login with:', { email });
      const response = await API.auth.login({ email, password });
      console.log('Login response:', response.data ? 'Success' : 'Failed');
      
      if (response.data && response.data.token) {
        // Get token from response
        const token = response.data.token;
        console.log('Received token (first 10 chars):', token.substring(0, 10) + '...');
        
        // Important: Clear any existing reload attempts when logging in fresh
        sessionStorage.removeItem('reloadAttempts');
        
        // Clear previous token
        localStorage.removeItem('token');
        
        // Store token with proper formatting - ensure Bearer prefix is present
        const formattedToken = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
        localStorage.setItem('token', formattedToken);
        
        // Store user data
        localStorage.removeItem('user');
        localStorage.setItem('user', JSON.stringify(response.data.user));
        
        console.log('User data stored, role:', response.data.user.role);
        console.log('Token stored with format:', formattedToken.substring(0, 20) + '...');
        
        // Close the dialog
        onClose();
        
        // Use timeout to ensure the dialog is closed before navigating
        setTimeout(() => {
          const baseUrl = window.location.origin;
          
          // Direct both admin and regular users to user dashboard to avoid admin dashboard errors
          console.log('Redirecting to user dashboard');
          window.location.href = `${baseUrl}/#/user-dashboard`;
        }, 100);
        
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    setLoading(true);
    setError('');
    try {
      await API.auth.register({
        username: fullName.split(' ')[0], // Simple username from first name
        email,
        password,
        role: 'user' // Default role for new registrations
      });
      
      // Switch to login form after successful registration
      toggleForm();
      setError('');
    } catch (err) {
      console.error('Registration error:', err);
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="md"
      PaperProps={{
        sx: {
          backgroundColor: 'transparent',
          boxShadow: `0 8px 32px ${colors.shadowColor}`
        }
      }}
    >
      <LoginFormContainer>
        <FormsWrapper isLogin={isLogin}>
          {!isLogin && (
            <LoginInfo>
              <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', mb: 4 }}>
                Join MarketPulse
              </Typography>
              <Typography sx={{ mb: 4, lineHeight: 1.7 }}>
                Create an account to start your trading journey with advanced analytics and market forecasting.
              </Typography>
              
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 4 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box sx={{ 
                    width: 40, 
                    height: 40, 
                    borderRadius: '50%', 
                    backgroundColor: 'rgba(255, 255, 255, 0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <Typography sx={{ fontWeight: 'bold' }}>1</Typography>
                  </Box>
                  <Typography>Real-time market analysis</Typography>
                </Box>
                
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box sx={{ 
                    width: 40, 
                    height: 40, 
                    borderRadius: '50%', 
                    backgroundColor: 'rgba(255, 255, 255, 0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <Typography sx={{ fontWeight: 'bold' }}>2</Typography>
                  </Box>
                  <Typography>Advanced technical indicators</Typography>
                </Box>
                
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box sx={{ 
                    width: 40, 
                    height: 40, 
                    borderRadius: '50%', 
                    backgroundColor: 'rgba(255, 255, 255, 0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <Typography sx={{ fontWeight: 'bold' }}>3</Typography>
                  </Box>
                  <Typography>AI-powered market predictions</Typography>
                </Box>
              </Box>
            </LoginInfo>
          )}
          
          <LoginForm>
            <Box sx={{ position: 'absolute', top: 16, right: 16 }}>
              <IconButton
                onClick={onClose}
                sx={{ 
                  color: colors.secondaryText,
                  '&:hover': {
                    color: colors.primaryText,
                    backgroundColor: colors.hoverBg
                  }
                }}
              >
                <CloseIcon />
              </IconButton>
            </Box>
            
            <DialogTitle sx={{ textAlign: 'center', p: 0, mb: 4 }}>
              <Typography 
                variant="h4" 
                component="h2" 
                sx={{ 
                  fontWeight: 'bold',
                  background: `linear-gradient(135deg, ${colors.gradientStart}, ${colors.gradientEnd})`,
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent'
                }}
              >
                {isLogin ? 'Welcome Back' : 'Create Account'}
              </Typography>
            </DialogTitle>
            
            {error && (
              <Alert 
                severity="error" 
                sx={{ 
                  mb: 2,
                  backgroundColor: `${colors.lossRed}20`,
                  color: colors.sellRed,
                  border: `1px solid ${colors.sellRed}40`
                }}
              >
                {error}
              </Alert>
            )}
            
            {isLogin ? (
              <>
                <StyledTextField 
                  label="Email" 
                  variant="outlined" 
                  fullWidth
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  InputProps={{
                    sx: { borderRadius: '12px' }
                  }}
                />
                <StyledTextField 
                  label="Password" 
                  type="password" 
                  variant="outlined" 
                  fullWidth
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  InputProps={{
                    sx: { borderRadius: '12px' }
                  }}
                />
                <AnimatedButton 
                  variant="contained" 
                  size="large" 
                  fullWidth 
                  sx={{ 
                    py: 1.8, 
                    mb: 3,
                    mt: 1,
                    backgroundColor: colors.buyGreen,
                    borderRadius: '12px',
                    textTransform: 'none',
                    fontSize: '1rem',
                    fontWeight: 'bold',
                    letterSpacing: '0.5px',
                    '&:hover': { 
                      backgroundColor: colors.profitGreen,
                      boxShadow: `0 6px 20px ${colors.buyGreen}40`
                    },
                    transition: 'all 0.3s ease'
                  }}
                  onClick={handleLogin}
                  disabled={loading}
                >
                  {loading ? <CircularProgress size={24} /> : 'Sign In'}
                </AnimatedButton>
                
                <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
                  <Button 
                    variant="text" 
                    sx={{ 
                      textTransform: 'none',
                      color: colors.accentBlue,
                      '&:hover': {
                        backgroundColor: 'transparent',
                        opacity: 0.8
                      }
                    }}
                  >
                    Forgot password?
                  </Button>
                </Box>
                
                <Box sx={{ textAlign: 'center', mt: 3 }}>
                  <Typography sx={{ color: colors.secondaryText, display: 'inline-block', mr: 1 }}>
                    Don't have an account?
                  </Typography>
                  <Button 
                    onClick={toggleForm} 
                    sx={{ 
                      textTransform: 'none',
                      color: colors.accentBlue,
                      p: 0,
                      minWidth: 'auto',
                      fontWeight: 'bold',
                      '&:hover': {
                        backgroundColor: 'transparent',
                        opacity: 0.8
                      }
                    }}
                  >
                    Register
                  </Button>
                </Box>
              </>
            ) : (
              <>
                <StyledTextField 
                  label="Full Name" 
                  variant="outlined" 
                  fullWidth
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  InputProps={{
                    sx: { borderRadius: '12px' }
                  }}
                />
                <StyledTextField 
                  label="Email" 
                  variant="outlined" 
                  fullWidth
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  InputProps={{
                    sx: { borderRadius: '12px' }
                  }}
                />
                <StyledTextField 
                  label="Password" 
                  type="password" 
                  variant="outlined" 
                  fullWidth
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  InputProps={{
                    sx: { borderRadius: '12px' }
                  }}
                />
                <StyledTextField 
                  label="Confirm Password" 
                  type="password" 
                  variant="outlined" 
                  fullWidth
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  InputProps={{
                    sx: { borderRadius: '12px' }
                  }}
                />
                <AnimatedButton 
                  variant="contained" 
                  size="large" 
                  fullWidth 
                  sx={{ 
                    py: 1.8, 
                    mb: 3,
                    mt: 1,
                    backgroundColor: colors.buyGreen,
                    borderRadius: '12px',
                    textTransform: 'none',
                    fontSize: '1rem',
                    fontWeight: 'bold',
                    letterSpacing: '0.5px',
                    '&:hover': { 
                      backgroundColor: colors.profitGreen,
                      boxShadow: `0 6px 20px ${colors.buyGreen}40`
                    },
                    transition: 'all 0.3s ease'
                  }}
                  onClick={handleRegister}
                  disabled={loading}
                >
                  {loading ? <CircularProgress size={24} /> : 'Create Account'}
                </AnimatedButton>
                
                <Box sx={{ textAlign: 'center' }}>
                  <Typography sx={{ color: colors.secondaryText, display: 'inline-block', mr: 1 }}>
                    Already have an account?
                  </Typography>
                  <Button 
                    onClick={toggleForm} 
                    sx={{ 
                      textTransform: 'none',
                      color: colors.accentBlue,
                      p: 0,
                      minWidth: 'auto',
                      fontWeight: 'bold',
                      '&:hover': {
                        backgroundColor: 'transparent',
                        opacity: 0.8
                      }
                    }}
                  >
                    Sign In
                  </Button>
                </Box>
              </>
            )}
          </LoginForm>
          
          {isLogin && (
            <LoginInfo>
              <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', mb: 4 }}>
                Welcome to MarketPulse
              </Typography>
              <Typography sx={{ mb: 4, lineHeight: 1.7 }}>
                Access your portfolio, track your investments, and get real-time market insights.
              </Typography>
              
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 4 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box sx={{ 
                    width: 40, 
                    height: 40, 
                    borderRadius: '50%', 
                    backgroundColor: 'rgba(255, 255, 255, 0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <Typography sx={{ fontWeight: 'bold' }}>1</Typography>
                  </Box>
                  <Typography>Real-time market analysis</Typography>
                </Box>
                
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box sx={{ 
                    width: 40, 
                    height: 40, 
                    borderRadius: '50%', 
                    backgroundColor: 'rgba(255, 255, 255, 0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <Typography sx={{ fontWeight: 'bold' }}>2</Typography>
                  </Box>
                  <Typography>Advanced technical indicators</Typography>
                </Box>
                
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box sx={{ 
                    width: 40, 
                    height: 40, 
                    borderRadius: '50%', 
                    backgroundColor: 'rgba(255, 255, 255, 0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <Typography sx={{ fontWeight: 'bold' }}>3</Typography>
                  </Box>
                  <Typography>AI-powered market predictions</Typography>
                </Box>
              </Box>
            </LoginInfo>
          )}
        </FormsWrapper>
      </LoginFormContainer>
    </Dialog>
  );
};

export default LoginDialog;