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
  IconButton
} from '@mui/material';
import { styled } from '@mui/system';
import axios from 'axios';
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
  borderRadius: '12px',
  overflow: 'hidden'
});

const LoginForm = styled('div')({
  padding: '40px',
  width: '400px',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  backgroundColor: colors.cardBg,
  borderRight: `1px solid ${colors.borderColor}`
});

const LoginInfo = styled('div')({
  padding: '40px',
  width: '300px',
  background: `linear-gradient(135deg, ${colors.gradientStart}, ${colors.gradientEnd})`,
  color: colors.primaryText,
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center'
});

const StyledTextField = styled(TextField)({
  '& .MuiOutlinedInput-root': {
    '& fieldset': {
      borderColor: colors.borderColor,
    },
    '&:hover fieldset': {
      borderColor: colors.accentBlue,
    },
    '&.Mui-focused fieldset': {
      borderColor: colors.accentBlue,
    },
    backgroundColor: colors.panelBg,
    color: colors.primaryText,
    '& input': {
      color: colors.primaryText,
      '&::placeholder': {
        color: colors.secondaryText,
        opacity: 0.7
      }
    },
    '& label': {
      color: colors.secondaryText,
      '&.Mui-focused': {
        color: colors.accentBlue
      }
    },
    '&.Mui-focused label': {
      color: colors.accentBlue
    }
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
      const response = await axios.post('http://localhost:5000/api/auth/login', {
        email,
        password
      });
      
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      
      // Redirect based on role
      if (response.data.user.role === 'admin') {
        navigate('/admin-dashboard');
      } else {
        navigate('/user-dashboard');
      }
      
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
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
      await axios.post('http://localhost:5000/api/auth/register', {
        username: fullName.split(' ')[0], // Simple username from first name
        email,
        password,
        role: 'user' // Default role for new registrations
      });
      
      // Switch to login form after successful registration
      toggleForm();
      setError('');
    } catch (err) {
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
                sx={{ mb: 3 }} 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <StyledTextField 
                label="Password" 
                type="password" 
                variant="outlined" 
                fullWidth 
                sx={{ mb: 2 }} 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <Button 
                variant="contained" 
                size="large" 
                fullWidth 
                sx={{ 
                  py: 1.5, 
                  mb: 2,
                  backgroundColor: colors.buyGreen,
                  '&:hover': { 
                    backgroundColor: colors.profitGreen,
                    transform: 'translateY(-2px)',
                    boxShadow: `0 4px 12px ${colors.buyGreen}40`
                  },
                  transition: 'all 0.3s ease'
                }}
                onClick={handleLogin}
                disabled={loading}
              >
                {loading ? <CircularProgress size={24} /> : 'Login'}
              </Button>
              <Typography align="center" sx={{ mb: 2, color: colors.secondaryText }}>
                Forgot password?
              </Typography>
              <Typography align="center" sx={{ color: colors.secondaryText }}>
                Don't have an account?{' '}
                <Button 
                  onClick={toggleForm} 
                  sx={{ 
                    textTransform: 'none',
                    color: colors.accentBlue,
                    '&:hover': {
                      backgroundColor: 'transparent',
                      color: colors.gradientEnd
                    }
                  }}
                >
                  Register
                </Button>
              </Typography>
            </>
          ) : (
            <>
              <StyledTextField 
                label="Full Name" 
                variant="outlined" 
                fullWidth 
                sx={{ mb: 3 }} 
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
              <StyledTextField 
                label="Email" 
                variant="outlined" 
                fullWidth 
                sx={{ mb: 3 }} 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <StyledTextField 
                label="Password" 
                type="password" 
                variant="outlined" 
                fullWidth 
                sx={{ mb: 3 }} 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <StyledTextField 
                label="Confirm Password" 
                type="password" 
                variant="outlined" 
                fullWidth 
                sx={{ mb: 2 }} 
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
              <Button 
                variant="contained" 
                size="large" 
                fullWidth 
                sx={{ 
                  py: 1.5, 
                  mb: 2,
                  backgroundColor: colors.buyGreen,
                  '&:hover': { 
                    backgroundColor: colors.profitGreen,
                    transform: 'translateY(-2px)',
                    boxShadow: `0 4px 12px ${colors.buyGreen}40`
                  },
                  transition: 'all 0.3s ease'
                }}
                onClick={handleRegister}
                disabled={loading}
              >
                {loading ? <CircularProgress size={24} /> : 'Register'}
              </Button>
              <Typography align="center" sx={{ color: colors.secondaryText }}>
                Already have an account?{' '}
                <Button 
                  onClick={toggleForm} 
                  sx={{ 
                    textTransform: 'none',
                    color: colors.accentBlue,
                    '&:hover': {
                      backgroundColor: 'transparent',
                      color: colors.gradientEnd
                    }
                  }}
                >
                  Login
                </Button>
              </Typography>
            </>
          )}
        </LoginForm>
        
        <LoginInfo>
          <Typography variant="h5" component="h3" gutterBottom sx={{ fontWeight: 'bold' }}>
            Start Trading Today
          </Typography>
          <Typography paragraph sx={{ opacity: 0.9 }}>
            Join thousands of traders who trust Markepulse for their forex trading needs.
          </Typography>
          <Box component="ul" sx={{ 
            paddingLeft: '20px', 
            marginBottom: '30px',
            '& li': {
              marginBottom: '10px',
              opacity: 0.9
            }
          }}>
            <li>Real-time market data</li>
            <li>Advanced charting tools</li>
            <li>Risk management features</li>
            <li>24/7 customer support</li>
          </Box>
          <Typography variant="body2" sx={{ opacity: 0.8 }}>
            By creating an account, you agree to our Terms of Service and Privacy Policy.
          </Typography>
        </LoginInfo>
      </LoginFormContainer>
    </Dialog>
  );
};

export default LoginDialog;