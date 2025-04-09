import React, { useEffect, useState } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Button,
  AppBar,
  Toolbar,
  Avatar,
  Menu,
  MenuItem,
  Divider,
  Grid,
  IconButton,
  Tooltip,
  Chip,
  CircularProgress,
  Alert
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import MarketAnalysis from './MarketAnalysis';
import NotificationsIcon from '@mui/icons-material/Notifications';
import SettingsIcon from '@mui/icons-material/Settings';
import PersonIcon from '@mui/icons-material/Person';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import StarIcon from '@mui/icons-material/Star';
import { API } from '../axiosConfig';

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

const UserDashboard = () => {
  console.log('UserDashboard - Component rendering');
  
  const [user, setUser] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [favoriteMarkets, setFavoriteMarkets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSymbol, setSelectedSymbol] = useState(null);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // Debug current location
  useEffect(() => {
    console.log('UserDashboard - Current path:', window.location.pathname);
    console.log('UserDashboard - Current hash:', window.location.hash);
    console.log('UserDashboard - Is user set:', !!user);
  }, [user]);

  useEffect(() => {
    console.log('UserDashboard - Fetching user data');
    const fetchUser = async () => {
      try {
        const token = localStorage.getItem('token');
        console.log('UserDashboard - Token exists:', !!token);
        
        if (!token) {
          console.log('UserDashboard - No token, redirecting to home');
          window.location.href = window.location.origin + '/#/';
          return;
        }
        
        // Try to get user data from API
        try {
          console.log('UserDashboard - Calling API.auth.me()');
          const response = await API.auth.me();
          console.log('UserDashboard - Got user data:', response.data);
          
          // Store the latest user data in localStorage for offline access
          localStorage.setItem('user', JSON.stringify(response.data.user));
          
          setUser(response.data.user);
        } catch (apiError) {
          console.error('UserDashboard - API.auth.me() failed:', apiError.response?.status, apiError.message);
          
          // If we have the user stored in localStorage, use that as a fallback
          const storedUser = localStorage.getItem('user');
          if (storedUser) {
            try {
              console.log('UserDashboard - Using cached user data from localStorage');
              const parsedUser = JSON.parse(storedUser);
              setUser(parsedUser);
              
              // If we're using cached data, don't try to load favorites from API
              setFavoriteMarkets([]);
              setLoading(false);
            } catch (parseError) {
              console.error('UserDashboard - Failed to parse stored user:', parseError);
              throw new Error('Authentication failed - invalid user data');
            }
          } else {
            // No stored user, redirect to login
            localStorage.removeItem('token');
            window.location.href = window.location.origin + '/#/';
            return;
          }
        }
      } catch (err) {
        console.error('Authentication error:', err);
        setError('Authentication failed. Please login again.');
        // Clear user data on authentication failure
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        // Redirect after a short delay to show the error
        setTimeout(() => {
          window.location.href = window.location.origin + '/#/';
        }, 2000);
      }
    };
    
    fetchUser();
  }, []);

  useEffect(() => {
    const fetchDashboardData = async () => {
      console.log('UserDashboard - Fetching dashboard data');
      
      // Skip API call if we're using cached user data (API is likely unavailable)
      if (user && !navigator.onLine) {
        console.log('UserDashboard - Browser is offline, skipping API calls');
        setFavoriteMarkets([]);
        setLoading(false);
        return;
      }
      
      try {
        // Fetch favorite markets
        const favoritesResponse = await API.favorites.getAll();
        console.log('UserDashboard - Got favorites:', favoritesResponse.data);
        setFavoriteMarkets(favoritesResponse.data.favorites || []);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        
        // Handle 500 Internal Server Error specifically
        if (err.response && err.response.status === 500) {
          console.log('Server error occurred. Continuing with empty favorites list.');
          // Don't show error to user, just proceed with empty list
        } else if (err.response && err.response.status) {
          console.log(`API error status ${err.response.status}. Continuing with empty favorites list.`);
        } else {
          console.log('Network or other error. Continuing with empty favorites list.');
        }
        
        // Still use the User object even if we can't fetch favorites
        setFavoriteMarkets([]);
        setLoading(false);
      }
    };

    if (user) {
      console.log('UserDashboard - User exists, fetching dashboard data');
      fetchDashboardData();
    }
  }, [user]);

  const handleLogout = () => {
    console.log('UserDashboard - Logging out');
    // Clear authentication data
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    // Use window location for more reliable redirect with hash router
    window.location.href = window.location.origin + '/#/';
  };

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleMarketSelect = (symbol) => {
    setSelectedSymbol(symbol);
  };

  const handleSettings = () => {
    navigate('/settings');
    handleMenuClose();
  }

  if (error) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', bgcolor: colors.darkBg }}>
        <Alert severity="error" sx={{ width: '80%', maxWidth: '500px' }}>
          {error}
        </Alert>
      </Box>
    );
  }

  if (!user) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', bgcolor: colors.darkBg }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', backgroundColor: colors.darkBg }}>
      <Sidebar />
      
      {/* Main Content */}
      <Box sx={{ flex: 1, p: 3, ml: '250px' }}>
        <AppBar 
          position="static" 
          elevation={0}
          sx={{ 
            backgroundColor: colors.panelBg,
            borderBottom: `1px solid ${colors.borderColor}`,
            mb: 3
          }}
        >
          <Toolbar sx={{ justifyContent: 'space-between' }}>
            <Typography 
              variant="h6" 
              sx={{ 
                fontWeight: 'bold',
                background: `linear-gradient(135deg, ${colors.accentBlue}, ${colors.buyGreen})`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}
            >
              MARKEPULSE
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Tooltip title="Notifications">
                <IconButton sx={{ color: colors.secondaryText }}>
                  <NotificationsIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="Settings">
                <IconButton sx={{ color: colors.secondaryText }} onClick={handleSettings}>
                  <SettingsIcon />
                </IconButton>
              </Tooltip>
              <Button 
                startIcon={<Avatar sx={{ width: 30, height: 30, backgroundColor: colors.accentBlue }}>{user.username ? user.username.charAt(0).toUpperCase() : 'U'}</Avatar>}
                onClick={handleMenuOpen}
                sx={{ 
                  color: colors.primaryText,
                  '&:hover': { backgroundColor: colors.hoverBg }
                }}
              >
                {user.username || 'User'}
              </Button>
              <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleMenuClose}
                PaperProps={{
                  sx: {
                    backgroundColor: colors.panelBg,
                    border: `1px solid ${colors.borderColor}`,
                    borderRadius: '10px',
                    mt: 1
                  }
                }}
              >
                <MenuItem onClick={handleMenuClose} sx={{ color: colors.secondaryText }}>
                  <PersonIcon sx={{ mr: 1 }} /> Profile
                </MenuItem>
                <MenuItem onClick={handleSettings} sx={{ color: colors.secondaryText }}>
                  <SettingsIcon sx={{ mr: 1 }} /> Settings
                </MenuItem>
                <Divider sx={{ backgroundColor: colors.borderColor }} />
                <MenuItem onClick={handleLogout} sx={{ color: colors.sellRed }}>
                  Logout
                </MenuItem>
              </Menu>
            </Box>
          </Toolbar>
        </AppBar>
        
        {/* Dashboard Content */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {/* Favorites Section */}
          <Paper 
            sx={{ 
              p: 3,
              backgroundColor: colors.cardBg,
              border: `1px solid ${colors.borderColor}`,
              borderRadius: '12px',
              boxShadow: `0 4px 12px ${colors.shadowColor}`
            }}
          >
            <Typography variant="h6" sx={{ color: colors.primaryText, mb: 2 }}>
              Favorite Markets
            </Typography>
            <Box sx={{ 
              display: 'flex', 
              flexWrap: 'wrap', 
              gap: 2,
              justifyContent: 'flex-start'
            }}>
              {loading ? (
                <CircularProgress />
              ) : favoriteMarkets.length > 0 ? (
                favoriteMarkets.map((market) => (
                  <Chip
                    key={market.symbol}
                    label={market.symbol}
                    icon={<StarIcon sx={{ color: colors.warningOrange }} />}
                    onClick={() => handleMarketSelect(market.symbol)}
                    sx={{
                      backgroundColor: selectedSymbol === market.symbol ? colors.hoverBg : colors.panelBg,
                      color: colors.primaryText,
                      border: `1px solid ${colors.borderColor}`,
                      '&:hover': {
                        backgroundColor: colors.hoverBg
                      }
                    }}
                  />
                ))
              ) : (
                <Typography variant="body1" sx={{ color: colors.secondaryText }}>
                  No favorite markets added yet
                </Typography>
              )}
            </Box>
          </Paper>

          {/* Market Analysis Section */}
          {selectedSymbol && (
            <MarketAnalysis selectedSymbol={selectedSymbol} />
          )}
        </Box>
      </Box>
    </Box>
  );
};

export default UserDashboard;

