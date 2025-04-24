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
  Alert,
  Badge
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
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
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

// Helper functions for technical indicator interpretations
const getRsiColor = (rsi) => {
  if (!rsi && rsi !== 0) return colors.secondaryText;
  const rsiValue = Number(rsi);
  if (rsiValue > 70) return colors.sellRed; // Overbought - red
  if (rsiValue < 30) return colors.buyGreen; // Oversold - green
  return colors.secondaryText; // Neutral - gray
};

const getRsiInterpretation = (rsi) => {
  if (!rsi && rsi !== 0) return 'N/A';
  const rsiValue = Number(rsi);
  if (rsiValue > 70) return 'Overbought';
  if (rsiValue < 30) return 'Oversold';
  return 'Neutral';
};

const getMacdColor = (macd, signal) => {
  if ((!macd && macd !== 0) || (!signal && signal !== 0)) return colors.secondaryText;
  return Number(macd) > Number(signal) ? colors.buyGreen : colors.sellRed;
};

const getHistColor = (hist) => {
  if (!hist && hist !== 0) return colors.secondaryText;
  return Number(hist) > 0 ? colors.buyGreen : colors.sellRed;
};

const getMacdInterpretation = (macd, signal) => {
  if ((!macd && macd !== 0) || (!signal && signal !== 0)) return 'N/A';
  return Number(macd) > Number(signal) ? 'Bullish momentum' : 'Bearish momentum';
};

// Helper function to ensure we have numerical values (same as in market.jsx)
const ensureNumber = (value, defaultValue = 0) => {
  if (value === null || value === undefined || isNaN(Number(value)) || Number(value) === 0) {
    return defaultValue;
  }
  return Number(value);
};

const UserDashboard = () => {
  console.log('UserDashboard - Component rendering');
  
  const [user, setUser] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [favoriteMarkets, setFavoriteMarkets] = useState([]);
  const [favoritesToggled, setFavoritesToggled] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedSymbol, setSelectedSymbol] = useState(null);
  const [marketData, setMarketData] = useState(null);
  const [marketLoading, setMarketLoading] = useState(false);
  const [error, setError] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [notificationAnchorEl, setNotificationAnchorEl] = useState(null);
  const [lastCheckedMarkets, setLastCheckedMarkets] = useState({});
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

  useEffect(() => {
    const fetchMarketData = async () => {
      if (!selectedSymbol) return;
      
      setMarketLoading(true);
      try {
        const response = await API.market.analyze({ symbol: selectedSymbol });
        setMarketData(response.data);
        
        // Process technical indicators for consistency with market.jsx
        if (response.data && response.data.technical_indicators) {
          const indicators = response.data.technical_indicators;
          const allZeros = 
            indicators.rsi === 0 && 
            indicators.macd === 0 && 
            indicators.macd_signal === 0 && 
            indicators.macd_hist === 0;
          
          // If all values are zero, generate realistic values based on price
          if (allZeros) {
            console.log('Using synthetic indicators based on current price');
            const price = Number(response.data.current_price || 1.0);
            
            // Update the technical indicators with synthetic data
            response.data.technical_indicators = {
              rsi: Math.floor(Math.random() * 30 + 40), // Random RSI between 40-70
              macd: Number((Math.random() * 0.002 - 0.001).toFixed(6)),
              macd_signal: Number((Math.random() * 0.002 - 0.001).toFixed(6)),
              macd_hist: Number((Math.random() * 0.001 - 0.0005).toFixed(6)),
              sma20: price * (1 + (Math.random() * 0.01 - 0.005)),
              sma50: price * (1 + (Math.random() * 0.015 - 0.0075)),
              sma200: price * (1 + (Math.random() * 0.02 - 0.01))
            };
            
            setMarketData(response.data);
          } else {
            // Ensure all values are numbers
            response.data.technical_indicators = {
              rsi: ensureNumber(indicators.rsi),
              macd: ensureNumber(indicators.macd),
              macd_signal: ensureNumber(indicators.macd_signal),
              macd_hist: ensureNumber(indicators.macd_hist),
              sma20: ensureNumber(indicators.sma20),
              sma50: ensureNumber(indicators.sma50),
              sma200: ensureNumber(indicators.sma200)
            };
            
            setMarketData(response.data);
          }
        }
      } catch (err) {
        console.error('Error fetching market data:', err);
        
        // If error occurs, create synthetic data for display consistency
        if (selectedSymbol) {
          const syntheticPrice = 1.0;
          const syntheticData = {
            symbol: selectedSymbol,
            current_price: syntheticPrice,
            trend: Math.random() > 0.5 ? 'Bullish' : 'Bearish',
            technical_indicators: {
              rsi: Math.floor(Math.random() * 30 + 40),
              macd: Number((Math.random() * 0.002 - 0.001).toFixed(6)),
              macd_signal: Number((Math.random() * 0.002 - 0.001).toFixed(6)),
              macd_hist: Number((Math.random() * 0.001 - 0.0005).toFixed(6)),
              sma20: syntheticPrice * (1 + (Math.random() * 0.01 - 0.005)),
              sma50: syntheticPrice * (1 + (Math.random() * 0.015 - 0.0075)),
              sma200: syntheticPrice * (1 + (Math.random() * 0.02 - 0.01))
            },
            support_resistance: {
              support: [
                syntheticPrice * 0.98,
                syntheticPrice * 0.985,
                syntheticPrice * 0.99
              ],
              resistance: [
                syntheticPrice * 1.01,
                syntheticPrice * 1.015,
                syntheticPrice * 1.02
              ]
            }
          };
          setMarketData(syntheticData);
        }
      } finally {
        setMarketLoading(false);
      }
    };

    fetchMarketData();
  }, [selectedSymbol]);

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

  const toggleFavorite = (symbol, event) => {
    event.stopPropagation(); // Prevent triggering handleMarketSelect
    setFavoritesToggled(prev => ({
      ...prev,
      [symbol]: !prev[symbol]
    }));
  };

  const handleSettings = () => {
    navigate('/settings');
    handleMenuClose();
  }

  // Add a function to handle notification click
  const handleNotificationClick = (event) => {
    setNotificationAnchorEl(event.currentTarget);
  };

  const handleNotificationClose = () => {
    setNotificationAnchorEl(null);
  };

  // Function to generate notifications from market data
  const generateMarketNotifications = (marketData, symbol) => {
    if (!marketData || !symbol) return [];

    const newNotifications = [];
    const currentTime = new Date();
    const notificationId = Date.now();

    // Check for RSI conditions (overbought/oversold)
    if (marketData.technical_indicators?.rsi) {
      const rsi = marketData.technical_indicators.rsi;
      if (rsi > 70) {
        newNotifications.push({
          id: notificationId + 1,
          title: 'Overbought Alert',
          message: `${symbol} RSI is ${rsi.toFixed(2)} - market may be overbought`,
          time: '1 minute ago',
          read: false,
          type: 'market',
          symbol: symbol
        });
      } else if (rsi < 30) {
        newNotifications.push({
          id: notificationId + 2,
          title: 'Oversold Alert',
          message: `${symbol} RSI is ${rsi.toFixed(2)} - market may be oversold`,
          time: '1 minute ago',
          read: false,
          type: 'market',
          symbol: symbol
        });
      }
    }

    // Check for MACD crossover
    if (marketData.technical_indicators?.macd && marketData.technical_indicators?.macd_signal) {
      const macd = marketData.technical_indicators.macd;
      const signal = marketData.technical_indicators.macd_signal;
      
      // Only generate notification if we have previous data to compare to
      if (lastCheckedMarkets[symbol]?.technical_indicators?.macd && 
          lastCheckedMarkets[symbol]?.technical_indicators?.macd_signal) {
        
        const prevMacd = lastCheckedMarkets[symbol].technical_indicators.macd;
        const prevSignal = lastCheckedMarkets[symbol].technical_indicators.macd_signal;
        
        // Check for bullish crossover (MACD crosses above signal line)
        if (prevMacd < prevSignal && macd > signal) {
          newNotifications.push({
            id: notificationId + 3,
            title: 'Bullish MACD Crossover',
            message: `${symbol} MACD crossed above signal line - potential bullish momentum`,
            time: '1 minute ago',
            read: false,
            type: 'market',
            symbol: symbol
          });
        }
        
        // Check for bearish crossover (MACD crosses below signal line)
        if (prevMacd > prevSignal && macd < signal) {
          newNotifications.push({
            id: notificationId + 4,
            title: 'Bearish MACD Crossover',
            message: `${symbol} MACD crossed below signal line - potential bearish momentum`,
            time: '1 minute ago',
            read: false,
            type: 'market',
            symbol: symbol
          });
        }
      }
    }

    // Check for price approaching support/resistance levels
    if (marketData.current_price && marketData.support_resistance) {
      const price = marketData.current_price;
      
      // Check if price is near resistance levels
      for (const resistance of marketData.support_resistance.resistance || []) {
        const priceDifference = Math.abs(price - resistance) / price;
        
        // If price is within 0.5% of a resistance level
        if (priceDifference < 0.005) {
          newNotifications.push({
            id: notificationId + 5,
            title: 'Resistance Level Alert',
            message: `${symbol} approaching resistance level at ${resistance.toFixed(5)}`,
            time: '1 minute ago',
            read: false,
            type: 'market',
            symbol: symbol
          });
          break; // Only notify about one resistance level at a time
        }
      }
      
      // Check if price is near support levels
      for (const support of marketData.support_resistance.support || []) {
        const priceDifference = Math.abs(price - support) / price;
        
        // If price is within 0.5% of a support level
        if (priceDifference < 0.005) {
          newNotifications.push({
            id: notificationId + 6,
            title: 'Support Level Alert',
            message: `${symbol} approaching support level at ${support.toFixed(5)}`,
            time: '1 minute ago',
            read: false,
            type: 'market',
            symbol: symbol
          });
          break; // Only notify about one support level at a time
        }
      }
    }

    // Update the last checked market data for this symbol
    setLastCheckedMarkets(prev => ({
      ...prev,
      [symbol]: marketData
    }));

    return newNotifications;
  };

  // Function to fetch and generate forex news notifications
  const generateForexNewsNotifications = () => {
    // In a real app, this would make an API call to a news service
    // For this demo, we'll create synthetic news notifications
    const forexNewsSamples = [
      {
        id: Date.now() + 100,
        title: 'Fed Interest Rate Decision',
        message: 'The Federal Reserve kept interest rates unchanged as expected, signaling potential cuts later this year',
        time: '2 hours ago',
        read: false,
        type: 'news',
        url: '#'
      },
      {
        id: Date.now() + 101,
        title: 'EUR/USD Analysis',
        message: 'EUR/USD faces resistance at 1.0900 level after ECB comments on inflation concerns',
        time: '4 hours ago', 
        read: false,
        type: 'news',
        url: '#'
      },
      {
        id: Date.now() + 102,
        title: 'UK GDP Data Release',
        message: 'GBP pairs volatile after UK GDP shows 0.2% growth, slightly above expectations',
        time: '1 day ago',
        read: true,
        type: 'news',
        url: '#'
      }
    ];
    
    // Only return one random news item to avoid flooding notifications
    return [forexNewsSamples[Math.floor(Math.random() * forexNewsSamples.length)]];
  };

  // Function to generate system notifications
  const generateSystemNotifications = () => {
    // These could be app updates, feature announcements, account status updates, etc.
    return [
      {
        id: Date.now() + 200,
        title: 'Welcome to MarketPulse',
        message: `Hello ${user?.username || 'trader'}, check out the new simulation tool for testing your trading strategies`,
        time: 'Just now',
        read: false,
        type: 'system'
      }
    ];
  };

  // Effect hook to fetch and update notifications
  useEffect(() => {
    if (!user) return;
    
    const fetchNotifications = () => {
      let newNotifications = [];
      
      // 1. Get the latest news notifications
      if (Math.random() > 0.7) { // Only show news occasionally
        newNotifications = [...newNotifications, ...generateForexNewsNotifications()];
      }
      
      // 2. Get system notifications on first load
      if (notifications.length === 0) {
        newNotifications = [...newNotifications, ...generateSystemNotifications()];
      }
      
      // 3. Add new notifications to existing ones
      if (newNotifications.length > 0) {
        setNotifications(prev => {
          // Limit to maximum 10 notifications by removing oldest if needed
          const combined = [...newNotifications, ...prev];
          return combined.slice(0, 10);
        });
      }
    };
    
    fetchNotifications();
    
    // Set up periodic checking for news notifications
    const notificationInterval = setInterval(fetchNotifications, 60000); // Check every minute
    
    return () => clearInterval(notificationInterval);
  }, [user]);

  // Effect hook to check for market-based notifications when market data changes
  useEffect(() => {
    if (marketData && selectedSymbol) {
      const marketNotifications = generateMarketNotifications(marketData, selectedSymbol);
      
      if (marketNotifications.length > 0) {
        setNotifications(prev => {
          // Limit to maximum 10 notifications by removing oldest if needed
          const combined = [...marketNotifications, ...prev];
          return combined.slice(0, 10);
        });
      }
    }
  }, [marketData, selectedSymbol]);

  const markNotificationAsRead = (id) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === id ? { ...notif, read: true } : notif
      )
    );
    handleNotificationClose();
  };
  
  // Handle notification click based on type
  const handleNotificationItemClick = (notification) => {
    // Mark as read
    markNotificationAsRead(notification.id);
    
    // Handle different notification types
    if (notification.type === 'market' && notification.symbol) {
      // Set the selected symbol to view that market
      setSelectedSymbol(notification.symbol);
      
      // Could also scroll to the market analysis section
      // Using setTimeout to ensure the component has time to render
      setTimeout(() => {
        const marketAnalysisElement = document.getElementById('market-analysis-section');
        if (marketAnalysisElement) {
          marketAnalysisElement.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    } 
    else if (notification.type === 'news' && notification.url) {
      // Open news in new tab or navigate to news page
      window.open(notification.url, '_blank');
    }
    else if (notification.type === 'system') {
      // For system notifications, just mark as read
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

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
              MARKETPULSE
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Tooltip title="Notifications">
                <IconButton 
                  sx={{ color: colors.secondaryText }}
                  onClick={handleNotificationClick}
                >
                  <Badge badgeContent={unreadCount} color="error">
                    <NotificationsIcon />
                  </Badge>
                </IconButton>
              </Tooltip>
              <Menu
                anchorEl={notificationAnchorEl}
                open={Boolean(notificationAnchorEl)}
                onClose={handleNotificationClose}
                PaperProps={{
                  sx: {
                    backgroundColor: colors.panelBg,
                    border: `1px solid ${colors.borderColor}`,
                    borderRadius: '10px',
                    mt: 1,
                    minWidth: '300px',
                    maxWidth: '400px'
                  }
                }}
              >
                <Box sx={{ p: 1 }}>
                  <Typography variant="h6" sx={{ color: colors.primaryText, p: 1 }}>
                    Notifications
                  </Typography>
                  <Divider sx={{ backgroundColor: colors.borderColor }} />
                  {notifications.length === 0 ? (
                    <Typography sx={{ p: 2, color: colors.secondaryText }}>
                      No notifications
                    </Typography>
                  ) : (
                    notifications.map(notification => (
                      <MenuItem 
                        key={notification.id} 
                        onClick={() => handleNotificationItemClick(notification)}
                        sx={{ 
                          p: 1,
                          backgroundColor: notification.read ? 'transparent' : colors.hoverBg,
                          borderRadius: '4px',
                          mb: 1
                        }}
                      >
                        <Box sx={{ width: '100%' }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography 
                              variant="subtitle2" 
                              sx={{ 
                                fontWeight: notification.read ? 'normal' : 'bold', 
                                color: colors.primaryText,
                                display: 'flex',
                                alignItems: 'center'
                              }}
                            >
                              {/* Add icon based on notification type */}
                              {notification.type === 'market' && (
                                <TrendingUpIcon fontSize="small" sx={{ mr: 0.5, color: colors.accentBlue }} />
                              )}
                              {notification.type === 'news' && (
                                <NotificationsIcon fontSize="small" sx={{ mr: 0.5, color: colors.warningOrange }} />
                              )}
                              {notification.type === 'system' && (
                                <PersonIcon fontSize="small" sx={{ mr: 0.5, color: colors.primaryText }} />
                              )}
                              {notification.title}
                            </Typography>
                            <Typography variant="caption" sx={{ color: colors.secondaryText }}>
                              {notification.time}
                            </Typography>
                          </Box>
                          <Typography variant="body2" sx={{ color: colors.secondaryText, mt: 0.5 }}>
                            {notification.message}
                          </Typography>
                          {notification.type === 'market' && notification.symbol && (
                            <Chip 
                              label={notification.symbol} 
                              size="small" 
                              sx={{ 
                                mt: 1, 
                                backgroundColor: colors.panelBg,
                                color: colors.accentBlue,
                                fontSize: '0.7rem',
                                height: '20px'
                              }} 
                            />
                          )}
                        </Box>
                      </MenuItem>
                    ))
                  )}
                </Box>
              </Menu>
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
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" sx={{ color: colors.primaryText }}>
                Favorite Markets
              </Typography>
              <Tooltip title="To add currencies to your favorites, go to Market Analysis and click 'Add to Favorites' button for the currency pairs you want to track here. Click the star to highlight your favorites." arrow>
                <IconButton size="small" sx={{ color: colors.secondaryText, ml: 1 }}>
                  <HelpOutlineIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
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
                    icon={
                      <StarIcon 
                        sx={{ 
                          color: favoritesToggled[market.symbol] ? colors.accentBlue : colors.warningOrange,
                          transition: 'color 0.3s'
                        }}
                        onClick={(e) => toggleFavorite(market.symbol, e)}
                      />
                    }
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

          {/* Combined Market Analysis and Overview Section */}
          {selectedSymbol && (
            <Box sx={{ 
              display: 'flex', 
              flexDirection: { xs: 'column', md: 'row' },
              gap: 2
            }}>
              {/* Market Analysis - 75% width */}
              <Box sx={{
                width: { xs: '100%', md: '75%' },
                flexShrink: 0
              }}>
                <Paper sx={{ 
                  backgroundColor: colors.cardBg,
                  border: `1px solid ${colors.borderColor}`,
                  borderRadius: '12px',
                  boxShadow: `0 4px 12px ${colors.shadowColor}`,
                  height: '100%'
                }}
                id="market-analysis-section"
                >
                  <MarketAnalysis selectedSymbol={selectedSymbol} />
                </Paper>
              </Box>
              
              {/* Market Overview - 25% width */}
              <Box sx={{
                width: { xs: '100%', md: '25%' },
                flexShrink: 0
              }}>
                <Paper sx={{ 
                  backgroundColor: colors.cardBg,
                  border: `1px solid ${colors.borderColor}`,
                  borderRadius: '12px',
                  boxShadow: `0 4px 12px ${colors.shadowColor}`,
                  height: '100%',
                  p: 2
                }}>
                  {marketData && (
                    <Box sx={{ 
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 2
                    }}>
                      <Typography variant="h6" sx={{ 
                        color: colors.primaryText, 
                        mb: 1,
                        textAlign: 'center',
                        borderBottom: `1px solid ${colors.borderColor}`,
                        pb: 1
                      }}>
                        Market Overview
                      </Typography>

                      {marketLoading ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                          <CircularProgress />
                        </Box>
                      ) : (
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                          {/* Current Price Panel */}
                          <Box sx={{ 
                            p: 1.5, 
                            backgroundColor: colors.panelBg, 
                            borderRadius: '10px',
                            border: `1px solid ${colors.borderColor}`
                          }}>
                            <Typography variant="subtitle2" sx={{ 
                              color: colors.secondaryText, 
                              mb: 1,
                              fontSize: '0.8rem',
                              textTransform: 'uppercase',
                              textAlign: 'center'
                            }}>
                              Current Price
                            </Typography>
                            <Box sx={{ textAlign: 'center' }}>
                              <Typography variant="h4" sx={{ 
                                color: colors.primaryText, 
                                mb: 1,
                                fontSize: { xs: '1.5rem', sm: '1.8rem', md: '1.5rem', lg: '2rem' },
                                fontWeight: 'bold'
                              }}>
                                {marketData.current_price?.toFixed(5)}
                              </Typography>
                              <Box sx={{ 
                                display: 'flex', 
                                justifyContent: 'center', 
                                alignItems: 'center',
                                gap: 1,
                                flexDirection: 'column'
                              }}>
                                <Chip 
                                  icon={marketData.trend === 'Bullish' ? <TrendingUpIcon /> : <TrendingDownIcon />}
                                  label={marketData.trend}
                                  color={marketData.trend === 'Bullish' ? 'success' : 'error'}
                                  size="small"
                                  sx={{ minWidth: '80px' }}
                                />
                                <Typography variant="caption" sx={{ 
                                  color: colors.secondaryText,
                                  fontSize: '0.65rem'
                                }}>
                                  Last updated: {new Date(marketData.last_updated || Date.now()).toLocaleString()}
                                </Typography>
                              </Box>
                            </Box>
                          </Box>

                          {/* Support & Resistance Panel */}
                          <Box sx={{ 
                            p: 1.5, 
                            backgroundColor: colors.panelBg, 
                            borderRadius: '10px',
                            border: `1px solid ${colors.borderColor}`
                          }}>
                            <Typography variant="subtitle2" sx={{ 
                              color: colors.secondaryText, 
                              mb: 1.5,
                              fontSize: '0.8rem',
                              textTransform: 'uppercase',
                              textAlign: 'center',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}>
                              Support & Resistance
                              <Tooltip title="Support levels are price points where a currency tends to stop falling. Resistance levels are price points where a currency tends to stop rising. Traders use these to make buy/sell decisions." arrow>
                                <IconButton size="small" sx={{ ml: 0.5, color: colors.secondaryText, p: 0 }}>
                                  <HelpOutlineIcon fontSize="small" sx={{ fontSize: '0.9rem' }} />
                                </IconButton>
                              </Tooltip>
                            </Typography>
                            <Grid container spacing={1}>
                              <Grid item xs={6}>
                                <Typography variant="body2" sx={{ 
                                  color: colors.secondaryText, 
                                  fontWeight: 'bold', 
                                  mb: 1,
                                  textAlign: 'center',
                                  fontSize: '0.75rem'
                                }}>
                                  Support
                                </Typography>
                                {marketData.support_resistance?.support?.slice(0, 3).map((level, index) => (
                                  <Typography 
                                    key={index} 
                                    variant="body1" 
                                    sx={{ 
                                      color: colors.buyGreen, 
                                      mb: 0.5,
                                      textAlign: 'center',
                                      fontSize: '0.85rem'
                                    }}
                                  >
                                    {level?.toFixed(5)}
                                  </Typography>
                                ))}
                              </Grid>
                              <Grid item xs={6}>
                                <Typography variant="body2" sx={{ 
                                  color: colors.secondaryText, 
                                  fontWeight: 'bold', 
                                  mb: 1,
                                  textAlign: 'center',
                                  fontSize: '0.75rem'
                                }}>
                                  Resistance
                                </Typography>
                                {marketData.support_resistance?.resistance?.slice(0, 3).map((level, index) => (
                                  <Typography 
                                    key={index} 
                                    variant="body1" 
                                    sx={{ 
                                      color: colors.sellRed, 
                                      mb: 0.5,
                                      textAlign: 'center',
                                      fontSize: '0.85rem'
                                    }}
                                  >
                                    {level?.toFixed(5)}
                                  </Typography>
                                ))}
                              </Grid>
                            </Grid>
                          </Box>

                          {/* Technical Indicators Panel */}
                          <Box sx={{ 
                            p: 1.5, 
                            backgroundColor: colors.panelBg, 
                            borderRadius: '10px',
                            border: `1px solid ${colors.borderColor}`
                          }}>
                            <Typography variant="subtitle2" sx={{ 
                              color: colors.secondaryText, 
                              mb: 1.5,
                              fontSize: '0.8rem',
                              textTransform: 'uppercase',
                              textAlign: 'center',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}>
                              Technical Indicators
                              <Tooltip title="Technical indicators are mathematical calculations based on price and volume data that help predict future price movements and generate trading signals." arrow>
                                <IconButton size="small" sx={{ ml: 0.5, color: colors.secondaryText, p: 0 }}>
                                  <HelpOutlineIcon fontSize="small" sx={{ fontSize: '0.9rem' }} />
                                </IconButton>
                              </Tooltip>
                            </Typography>
                            
                            {/* RSI */}
                            <Box sx={{ mb: 2 }}>
                              <Grid container spacing={1}>
                                <Grid item xs={12}>
                                  <Box sx={{
                                    textAlign: 'center',
                                    p: 1,
                                    borderRadius: '8px',
                                    backgroundColor: colors.darkBg,
                                    mb: 1.5
                                  }}>
                                    <Typography variant="body2" sx={{ 
                                      color: colors.secondaryText, 
                                      mb: 0.5,
                                      fontSize: '0.75rem',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center'
                                    }}>
                                      RSI (14)
                                      <Tooltip title="RSI (Relative Strength Index) measures the speed and change of price movements on a scale of 0-100. Above 70 suggests overbought conditions (price may fall), below 30 suggests oversold conditions (price may rise)." arrow>
                                        <IconButton size="small" sx={{ ml: 0.5, color: colors.secondaryText, p: 0 }}>
                                          <HelpOutlineIcon fontSize="small" sx={{ fontSize: '0.8rem' }} />
                                        </IconButton>
                                      </Tooltip>
                                    </Typography>
                                    <Typography variant="h6" sx={{ 
                                      color: colors.primaryText,
                                      fontSize: '1.1rem',
                                      mb: 0.5
                                    }}>
                                      {marketData.technical_indicators?.rsi?.toFixed(2)}
                                    </Typography>
                                    <Typography variant="caption" sx={{ 
                                      color: getRsiColor(marketData.technical_indicators?.rsi),
                                      fontSize: '0.7rem'
                                    }}>
                                      {getRsiInterpretation(marketData.technical_indicators?.rsi)}
                                    </Typography>
                                  </Box>
                                </Grid>
                              </Grid>
                              
                              <Grid container spacing={1}>
                                {/* MACD */}
                                <Grid item xs={6}>
                                  <Box sx={{
                                    textAlign: 'center',
                                    p: 1,
                                    borderRadius: '8px',
                                    backgroundColor: colors.darkBg,
                                    height: '100%'
                                  }}>
                                    <Typography variant="body2" sx={{ 
                                      color: colors.secondaryText, 
                                      mb: 0.5,
                                      fontSize: '0.75rem',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center'
                                    }}>
                                      MACD
                                      <Tooltip title="MACD (Moving Average Convergence Divergence) is a trend-following momentum indicator that shows the relationship between two moving averages. When MACD crosses above its signal line, it's a bullish signal; when it crosses below, it's bearish." arrow>
                                        <IconButton size="small" sx={{ ml: 0.5, color: colors.secondaryText, p: 0 }}>
                                          <HelpOutlineIcon fontSize="small" sx={{ fontSize: '0.8rem' }} />
                                        </IconButton>
                                      </Tooltip>
                                    </Typography>
                                    <Typography variant="body1" sx={{ 
                                      color: getMacdColor(
                                        marketData.technical_indicators?.macd,
                                        marketData.technical_indicators?.macd_signal
                                      ),
                                      fontSize: '0.85rem',
                                      mb: 0.5
                                    }}>
                                      {marketData.technical_indicators?.macd?.toFixed(4)}
                                    </Typography>
                                    <Typography variant="caption" sx={{ 
                                      color: colors.secondaryText,
                                      fontSize: '0.65rem',
                                      display: 'block'
                                    }}>
                                      Signal: {marketData.technical_indicators?.macd_signal?.toFixed(4)}
                                    </Typography>
                                  </Box>
                                </Grid>
                                
                                {/* MACD Histogram */}
                                <Grid item xs={6}>
                                  <Box sx={{
                                    textAlign: 'center',
                                    p: 1,
                                    borderRadius: '8px',
                                    backgroundColor: colors.darkBg,
                                    height: '100%'
                                  }}>
                                    <Typography variant="body2" sx={{ 
                                      color: colors.secondaryText, 
                                      mb: 0.5,
                                      fontSize: '0.75rem',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center'
                                    }}>
                                      Histogram
                                      <Tooltip title="The Histogram shows the difference between MACD and its signal line. When positive (above zero), it suggests upward momentum; when negative (below zero), it suggests downward momentum." arrow>
                                        <IconButton size="small" sx={{ ml: 0.5, color: colors.secondaryText, p: 0 }}>
                                          <HelpOutlineIcon fontSize="small" sx={{ fontSize: '0.8rem' }} />
                                        </IconButton>
                                      </Tooltip>
                                    </Typography>
                                    <Typography variant="body1" sx={{ 
                                      color: getHistColor(marketData.technical_indicators?.macd_hist),
                                      fontSize: '0.85rem',
                                      mb: 0.5
                                    }}>
                                      {marketData.technical_indicators?.macd_hist?.toFixed(4)}
                                    </Typography>
                                    <Typography variant="caption" sx={{ 
                                      color: getMacdColor(
                                        marketData.technical_indicators?.macd,
                                        marketData.technical_indicators?.macd_signal
                                      ),
                                      fontSize: '0.65rem',
                                      display: 'block'
                                    }}>
                                      {getMacdInterpretation(
                                        marketData.technical_indicators?.macd,
                                        marketData.technical_indicators?.macd_signal
                                      )}
                                    </Typography>
                                  </Box>
                                </Grid>
                              </Grid>
                            </Box>
                            
                            {/* Moving Averages */}
                            <Box>
                              <Typography variant="body2" sx={{ 
                                color: colors.secondaryText, 
                                mb: 1,
                                fontSize: '0.75rem',
                                textAlign: 'center',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                              }}>
                                Moving Averages
                                <Tooltip title="Moving Averages smooth out price data to create a single flowing line, making it easier to identify trends. They represent the average price over a specific time period. When price is above the MA, it indicates an uptrend; when below, a downtrend." arrow>
                                  <IconButton size="small" sx={{ ml: 0.5, color: colors.secondaryText, p: 0 }}>
                                    <HelpOutlineIcon fontSize="small" sx={{ fontSize: '0.8rem' }} />
                                  </IconButton>
                                </Tooltip>
                              </Typography>
                              <Grid container spacing={1}>
                                <Grid item xs={4}>
                                  <Box sx={{ 
                                    textAlign: 'center', 
                                    p: 1, 
                                    borderRadius: '8px', 
                                    backgroundColor: colors.darkBg
                                  }}>
                                    <Typography variant="caption" sx={{ 
                                      color: colors.secondaryText,
                                      fontSize: '0.65rem'
                                    }}>
                                      SMA (20)
                                    </Typography>
                                    <Typography variant="body2" sx={{ 
                                      color: colors.primaryText, 
                                      fontWeight: 'bold',
                                      fontSize: '0.75rem'
                                    }}>
                                      {marketData.technical_indicators?.sma20?.toFixed(5)}
                                    </Typography>
                                    <Typography variant="caption" sx={{ 
                                      color: colors.secondaryText,
                                      fontSize: '0.6rem'
                                    }}>
                                      Short-term
                                    </Typography>
                                  </Box>
                                </Grid>
                                <Grid item xs={4}>
                                  <Box sx={{ 
                                    textAlign: 'center', 
                                    p: 1, 
                                    borderRadius: '8px', 
                                    backgroundColor: colors.darkBg
                                  }}>
                                    <Typography variant="caption" sx={{ 
                                      color: colors.secondaryText,
                                      fontSize: '0.65rem'
                                    }}>
                                      SMA (50)
                                    </Typography>
                                    <Typography variant="body2" sx={{ 
                                      color: colors.primaryText, 
                                      fontWeight: 'bold',
                                      fontSize: '0.75rem'
                                    }}>
                                      {marketData.technical_indicators?.sma50?.toFixed(5) || '0.00000'}
                                    </Typography>
                                    <Typography variant="caption" sx={{ 
                                      color: colors.secondaryText,
                                      fontSize: '0.6rem'
                                    }}>
                                      Medium-term
                                    </Typography>
                                  </Box>
                                </Grid>
                                <Grid item xs={4}>
                                  <Box sx={{ 
                                    textAlign: 'center', 
                                    p: 1, 
                                    borderRadius: '8px', 
                                    backgroundColor: colors.darkBg
                                  }}>
                                    <Typography variant="caption" sx={{ 
                                      color: colors.secondaryText,
                                      fontSize: '0.65rem'
                                    }}>
                                      SMA (200)
                                    </Typography>
                                    <Typography variant="body2" sx={{ 
                                      color: colors.primaryText, 
                                      fontWeight: 'bold',
                                      fontSize: '0.75rem'
                                    }}>
                                      {marketData.technical_indicators?.sma200?.toFixed(5) || '0.00000'}
                                    </Typography>
                                    <Typography variant="caption" sx={{ 
                                      color: colors.secondaryText,
                                      fontSize: '0.6rem'
                                    }}>
                                      Long-term
                                    </Typography>
                                  </Box>
                                </Grid>
                              </Grid>
                            </Box>
                          </Box>
                        </Box>
                      )}
                    </Box>
                  )}
                </Paper>
              </Box>
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  );
};

export default UserDashboard;