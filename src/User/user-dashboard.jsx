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
  CircularProgress
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
        
        // Check if we're in an infinite loop by checking a session flag
        const reloadAttempts = sessionStorage.getItem('reloadAttempts') || 0;
        console.log('UserDashboard - Reload attempts:', reloadAttempts);
        
        if (parseInt(reloadAttempts) > 2) {
          console.error('UserDashboard - Too many reload attempts, clearing auth and redirecting');
          // Clear tokens and redirect to home
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          sessionStorage.removeItem('reloadAttempts');
          window.location.href = window.location.origin + '/#/';
          return;
        }
        
        if (!token) {
          console.log('UserDashboard - No token, redirecting to home');
          // Redirect to home page if no token
          window.location.href = window.location.origin + '/#/';
          return;
        }
        
        // Log the token format for debugging
        if (token) {
          const tokenStart = token.substring(0, 15);
          console.log('UserDashboard - Token format check:', 
                      `Starts with 'Bearer': ${token.startsWith('Bearer ')}`, 
                      `First chars: ${tokenStart}...`);
        }
        
        console.log('UserDashboard - Calling API.auth.me()');
        try {
          const response = await API.auth.me();
          console.log('UserDashboard - Got user data:', response.data);
          // Clear reload attempts on success
          sessionStorage.removeItem('reloadAttempts');
          setUser(response.data.user);
        } catch (apiError) {
          console.error('UserDashboard - API.auth.me() failed:', apiError.response?.status, apiError.message);
          
          // If we're getting 401 unauthorized, let's try ONE repair attempt
          if (apiError.response?.status === 401 && token && parseInt(reloadAttempts) < 2) {
            console.log('UserDashboard - Attempting to fix token format and retry');
            
            // Increment reload attempts
            sessionStorage.setItem('reloadAttempts', parseInt(reloadAttempts) + 1);
            
            // Try removing Bearer prefix if it exists (maybe backend doesn't want it)
            let fixedToken = token;
            if (token.startsWith('Bearer ')) {
              fixedToken = token.substring(7); // Remove "Bearer " prefix
            } else {
              // Otherwise add it
              fixedToken = `Bearer ${token}`;
            }
            
            // Store fixed token
            localStorage.setItem('token', fixedToken);
            console.log('UserDashboard - Token format updated to:', 
                        fixedToken.substring(0, 15) + '...',
                        `(with Bearer: ${fixedToken.startsWith('Bearer ')})`);
            
            // Reload the page to try again with the fixed token
            window.location.reload();
            return;
          }
          
          throw apiError; // Re-throw for the main catch block to handle
        }
      } catch (err) {
        console.error('Authentication error:', err);
        // Clear user data and reload attempts on authentication failure
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        sessionStorage.removeItem('reloadAttempts');
        // Redirect to home page
        window.location.href = window.location.origin + '/#/';
      }
    };
    
    fetchUser();
  }, [navigate]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      console.log('UserDashboard - Fetching dashboard data');
      try {
        // Fetch favorite markets
        const favoritesResponse = await API.favorites.getAll();
        console.log('UserDashboard - Got favorites:', favoritesResponse.data);
        setFavoriteMarkets(favoritesResponse.data.favorites);

        setLoading(false);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
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

  if (!user) {
    return null;
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
                <IconButton sx={{ color: colors.secondaryText }}>
                  <SettingsIcon />
                </IconButton>
              </Tooltip>
              <Button 
                startIcon={<Avatar sx={{ width: 30, height: 30, backgroundColor: colors.accentBlue }}>{user.username.charAt(0).toUpperCase()}</Avatar>}
                onClick={handleMenuOpen}
                sx={{ 
                  color: colors.primaryText,
                  '&:hover': { backgroundColor: colors.hoverBg }
                }}
              >
                {user.username}
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
                <MenuItem onClick={handleMenuClose} sx={{ color: colors.secondaryText }}>
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

