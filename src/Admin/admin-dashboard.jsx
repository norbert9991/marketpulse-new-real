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
  Stack,
  CircularProgress,
  Chip,
  Grid,
  IconButton,
  Tooltip
} from '@mui/material';
import { styled } from '@mui/system';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { LineChart, BarChart } from '@mui/x-charts';
import Sidebar from './Sidebar';
import { 
  People as PeopleIcon,
  Star as StarIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  TrendingFlat as TrendingFlatIcon,
  Logout as LogoutIcon,
  Person as PersonIcon,
  Settings as SettingsIcon,
  Notifications as NotificationsIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  Warning as WarningIcon,
  Close as CloseIcon,
  MoreVert as MoreVertIcon,
  Delete as DeleteIcon
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
  hoverBg: '#2a2a2a',
  shadowColor: 'rgba(0, 0, 0, 0.1)',
  accentBlue: '#2196f3'
};

// Event bus for communication between components
// This will allow other components to send notifications
export const AdminNotificationEvents = {
  // Create a notification in the admin dashboard
  createNotification: (title, message, type = 'info', link = null) => {
    const event = new CustomEvent('admin-notification', {
      detail: { title, message, type, link }
    });
    window.dispatchEvent(event);
    
    // Also store in localStorage for persistence
    try {
      const existingNotifs = JSON.parse(localStorage.getItem('marketpulse_admin_notifications') || '[]');
      const newNotif = {
        id: Date.now(),
        title,
        message,
        type,
        timestamp: new Date().toISOString(),
        read: false,
        link
      };
      
      localStorage.setItem('marketpulse_admin_notifications', 
        JSON.stringify([newNotif, ...existingNotifs])
      );
    } catch (err) {
      console.error('Error saving notification to localStorage:', err);
    }
  }
};

const DashboardContainer = styled('div')({
  display: 'flex',
  minHeight: '100vh',
  backgroundColor: colors.background,
  color: colors.primaryText
});

const MainContent = styled('div')({
  flex: 1,
  padding: '24px',
  marginLeft: '250px', // Match sidebar width
  transition: 'margin-left 0.3s ease',
  '@media (max-width: 900px)': {
    marginLeft: '0',
    padding: '16px'
  }
});

const MetricCard = styled(Paper)(({ theme }) => ({
  padding: '20px',
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  backgroundColor: colors.cardBg,
  border: `1px solid ${colors.borderColor}`,
  borderRadius: '12px',
  transition: 'transform 0.2s ease, box-shadow 0.2s ease',
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: `0 8px 16px rgba(0, 0, 0, 0.2)`
  }
}));

const StyledAppBar = styled(AppBar)({
  backgroundColor: colors.cardBg,
  boxShadow: 'none',
  borderBottom: `1px solid ${colors.borderColor}`,
  marginBottom: '24px'
});

const StyledToolbar = styled(Toolbar)({
  display: 'flex',
  justifyContent: 'space-between',
  padding: '0 24px',
  '@media (max-width: 600px)': {
    padding: '0 16px'
  }
});

const UserInfo = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  gap: '12px'
});

const UserAvatar = styled(Avatar)({
  width: 40,
  height: 40,
  backgroundColor: colors.primary,
  border: `2px solid ${colors.primary}33`
});

const StyledMenu = styled(Menu)({
  '& .MuiPaper-root': {
    backgroundColor: colors.cardBg,
    color: colors.primaryText,
    border: `1px solid ${colors.borderColor}`,
    borderRadius: '8px',
    marginTop: '8px',
    minWidth: '180px'
  }
});

const StyledMenuItem = styled(MenuItem)({
  padding: '10px 16px',
  '&:hover': {
    backgroundColor: colors.hoverBg
  }
});

const StyledDivider = styled(Divider)({
  borderColor: colors.borderColor,
  margin: '8px 0'
});

const DashboardTitle = styled(Typography)({
  marginBottom: '24px',
  fontWeight: 'bold',
  background: `linear-gradient(90deg, ${colors.primary}, ${colors.secondary})`,
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  '@media (max-width: 600px)': {
    fontSize: '1.5rem'
  }
});

const MetricsGrid = styled(Box)({
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
  gap: '24px',
  marginBottom: '32px',
  '@media (max-width: 600px)': {
    gridTemplateColumns: '1fr',
    gap: '16px'
  }
});

const StyledPopover = styled(Menu)({
  '& .MuiPaper-root': {
    backgroundColor: colors.cardBg,
    color: colors.primaryText,
    border: `1px solid ${colors.borderColor}`,
    borderRadius: '8px',
    minWidth: 320,
    maxWidth: 360,
    padding: '8px 0',
    marginTop: '8px',
    maxHeight: '70vh',
    overflowY: 'auto',
    '&::-webkit-scrollbar': {
      width: '8px',
    },
    '&::-webkit-scrollbar-track': {
      backgroundColor: 'transparent',
    },
    '&::-webkit-scrollbar-thumb': {
      backgroundColor: colors.borderColor,
      borderRadius: '4px',
    }
  }
});

const NotificationItem = styled(Box)(({ read }) => ({
  padding: '12px 16px',
  borderBottom: `1px solid ${colors.borderColor}`,
  backgroundColor: read ? 'transparent' : `${colors.primary}10`,
  transition: 'background-color 0.2s ease',
  cursor: 'pointer',
  position: 'relative',
  '&:hover': {
    backgroundColor: colors.hoverBg
  },
  '&:last-child': {
    borderBottom: 'none'
  }
}));

// Get icon for notification type
const getNotificationIcon = (type) => {
  switch (type) {
    case 'error':
      return <ErrorIcon fontSize="small" sx={{ color: colors.sellRed }} />;
    case 'warning':
      return <WarningIcon fontSize="small" sx={{ color: '#FFA726' }} />;
    case 'success':
      return <CheckCircleIcon fontSize="small" sx={{ color: colors.buyGreen }} />;
    case 'info':
    default:
      return <InfoIcon fontSize="small" sx={{ color: colors.accentBlue }} />;
  }
};

const AdminDashboard = () => {
  const [user, setUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [userCount, setUserCount] = useState(0);
  const [userGrowthData, setUserGrowthData] = useState([]);
  const [favoriteSymbolsData, setFavoriteSymbolsData] = useState([]);
  const [marketTrendsData, setMarketTrendsData] = useState(null);
  const [loadingChart, setLoadingChart] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  
  // Notification states
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notificationsAnchorEl, setNotificationsAnchorEl] = useState(null);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  const [isUsingLocalNotifications, setIsUsingLocalNotifications] = useState(false);
  
  const notificationsOpen = Boolean(notificationsAnchorEl);

  // Local storage key for client-side notifications
  const LOCAL_NOTIFICATIONS_KEY = 'marketpulse_admin_notifications';
  
  // Listen for notification events from other components
  useEffect(() => {
    const handleNotificationEvent = (event) => {
      if (event.detail) {
        const { title, message, type, link } = event.detail;
        createLocalNotification(title, message, type, link);
      }
    };
    
    // Add event listener
    window.addEventListener('admin-notification', handleNotificationEvent);
    
    // Clean up on unmount
    return () => {
      window.removeEventListener('admin-notification', handleNotificationEvent);
    };
  }, []);

  // Load saved notifications from localStorage on initial render
  useEffect(() => {
    // Try to load saved notifications
    try {
      const savedNotifications = localStorage.getItem(LOCAL_NOTIFICATIONS_KEY);
      if (savedNotifications) {
        const parsedNotifications = JSON.parse(savedNotifications);
        if (Array.isArray(parsedNotifications)) {
          setNotifications(parsedNotifications);
          const unread = parsedNotifications.filter(notif => !notif.read).length;
          setUnreadCount(unread);
        }
      }
    } catch (err) {
      console.error('Error loading saved notifications:', err);
    }
    
    // Default to local notifications for better demo experience
    setIsUsingLocalNotifications(true);
  }, []);

  // Save notifications to localStorage whenever they change
  useEffect(() => {
    if (isUsingLocalNotifications && notifications.length > 0) {
      try {
        localStorage.setItem(LOCAL_NOTIFICATIONS_KEY, JSON.stringify(notifications));
      } catch (err) {
        console.error('Error saving notifications:', err);
      }
    }
  }, [notifications, isUsingLocalNotifications]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        // Get current admin user info
        const userResponse = await API.auth.me();
        setUser(userResponse.data.user);
        
        // Get all users
        const usersResponse = await API.admin.getUsers();
        const userData = usersResponse.data.users || [];
        setUsers(userData);
        setUserCount(userData.length);
        
        // Get user growth stats
        const growthResponse = await API.admin.getUserGrowth();
        setUserGrowthData(growthResponse.data?.data || []);
        
        // Get popular symbols/pairs
        const symbolsResponse = await API.admin.getFavoriteSymbols();
        const symbolsData = symbolsResponse.data?.data || [];
        setFavoriteSymbolsData(symbolsData);
        
        // Get current market trends
        const trendsResponse = await API.admin.getMarketTrends();
        const trendsData = trendsResponse.data?.data || {
          overall_trend: 'neutral',
          bullish_percentage: 33,
          bearish_percentage: 33,
          neutral_percentage: 34,
          total_symbols: 30
        };
        setMarketTrendsData(trendsData);
        
        // Fetch notifications
        fetchNotifications();
        
        // Set chart loading false after small delay to allow rendering
        setTimeout(() => {
          setLoadingChart(false);
        }, 500);
        
        setLoading(false);
        
        // Create a welcome notification if first login of the session
        const lastLoginTime = localStorage.getItem('last_admin_login');
        const currentTime = new Date().toISOString();
        
        if (!lastLoginTime || (new Date(currentTime) - new Date(lastLoginTime)) > 3600000) { // 1 hour
          localStorage.setItem('last_admin_login', currentTime);
          
          // Add login notification after a short delay
          setTimeout(() => {
            createLocalNotification(
              'Welcome Back, Admin',
              `You've logged in successfully at ${new Date().toLocaleTimeString()}`,
              'info',
              null
            );
          }, 1500);
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setError('Failed to load dashboard data');
        setLoading(false);
        
        // Set default values for metrics on error
        setUserCount(0);
        setUsers([]);
        setFavoriteSymbolsData([]);
        setMarketTrendsData({
          overall_trend: 'neutral',
          bullish_percentage: 33,
          bearish_percentage: 33,
          neutral_percentage: 34,
          total_symbols: 0
        });
      }
    };

    fetchDashboardData();
    
    // Set up a polling interval for notifications
    const notificationInterval = setInterval(() => {
      if (!loadingNotifications) {
        fetchNotifications();
      }
    }, 60000); // Check for new notifications every minute
    
    return () => {
      clearInterval(notificationInterval);
    };
  }, []);
  
  // Create a client-side notification (for demo/fallback purposes)
  const createLocalNotification = (title, message, type = 'info', link = null) => {
    if (!isUsingLocalNotifications) return;
    
    const newNotification = {
      id: Date.now(),
      title,
      message,
      type,
      timestamp: new Date().toISOString(),
      read: false,
      link
    };
    
    setNotifications(prev => [newNotification, ...prev]);
    setUnreadCount(prev => prev + 1);
    
    // Show browser notification if supported
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification(title, { 
        body: message,
        icon: '/favicon.ico'
      });
    }
    // Return the notification ID in case we need to reference it later
    return newNotification.id;
  };
  
  // Fetch notifications from API
  const fetchNotifications = async () => {
    setLoadingNotifications(true);
    try {
      // Skip API call if we're already using local notifications
      if (isUsingLocalNotifications) {
        setLoadingNotifications(false);
        return;
      }
      
      // Use the API endpoint for notifications
      const response = await API.admin.getNotifications();
      if (response && response.data && response.data.notifications) {
        setNotifications(response.data.notifications);
        // Calculate unread count
        const unread = response.data.notifications.filter(notif => !notif.read).length;
        setUnreadCount(unread);
      } else {
        // Only initialize with empty if not using local fallback
        if (!isUsingLocalNotifications) {
          setNotifications([]);
          setUnreadCount(0);
        }
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
      
      if (error.message && error.message.includes('CORS')) {
        console.log('CORS error detected. Switching to local notifications mode');
        
        // If this is a CORS error and we haven't already switched to local mode
        if (!isUsingLocalNotifications) {
          setIsUsingLocalNotifications(true);
          // Generate some local notifications based on data we have
          createLocalNotification(
            'CORS Error Detected',
            'The API notifications are temporarily unavailable. Switching to local notifications mode.',
            'warning',
            null
          );
        }
      } else if (!isUsingLocalNotifications) {
        // Reset to empty on non-CORS error if not using local mode
        setNotifications([]);
        setUnreadCount(0);
      }
    } finally {
      setLoadingNotifications(false);
    }
  };
  
  // Mark a notification as read
  const markAsRead = async (notificationId) => {
    try {
      // If using local notifications, just update state
      if (isUsingLocalNotifications) {
        setNotifications(prevNotifications => 
          prevNotifications.map(notif => 
            notif.id === notificationId ? { ...notif, read: true } : notif
          )
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
        return;
      }
      
      await API.admin.markNotificationRead(notificationId);
      
      // Update local state to reflect the change
      setNotifications(prevNotifications => 
        prevNotifications.map(notif => 
          notif.id === notificationId ? { ...notif, read: true } : notif
        )
      );
      
      // Update unread count
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
      
      // Check for CORS errors
      if (error.message && error.message.includes('CORS') && !isUsingLocalNotifications) {
        // Switch to local notifications mode
        setIsUsingLocalNotifications(true);
        
        // Still mark as read in local state
        setNotifications(prevNotifications => 
          prevNotifications.map(notif => 
            notif.id === notificationId ? { ...notif, read: true } : notif
          )
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      } else if (!isUsingLocalNotifications) {
        // Refresh notifications on other error types
        fetchNotifications();
      }
    }
  };
  
  // Mark all notifications as read
  const markAllAsRead = async () => {
    try {
      // If using local notifications, just update state
      if (isUsingLocalNotifications) {
        setNotifications(prevNotifications => 
          prevNotifications.map(notif => ({ ...notif, read: true }))
        );
        setUnreadCount(0);
        return;
      }
      
      await API.admin.markAllNotificationsRead();
      
      // Update local state
      setNotifications(prevNotifications => 
        prevNotifications.map(notif => ({ ...notif, read: true }))
      );
      
      // Update unread count
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      
      // Check for CORS errors
      if (error.message && error.message.includes('CORS') && !isUsingLocalNotifications) {
        // Switch to local notifications mode
        setIsUsingLocalNotifications(true);
        
        // Still mark all as read in local state
        setNotifications(prevNotifications => 
          prevNotifications.map(notif => ({ ...notif, read: true }))
        );
        setUnreadCount(0);
      } else if (!isUsingLocalNotifications) {
        // Refresh notifications on other error types
        fetchNotifications();
      }
    }
  };
  
  // Delete a notification
  const deleteNotification = async (notificationId) => {
    try {
      // If using local notifications, just update state
      if (isUsingLocalNotifications) {
        // Update local state
        const notifToDelete = notifications.find(notif => notif.id === notificationId);
        setNotifications(prevNotifications => 
          prevNotifications.filter(notif => notif.id !== notificationId)
        );
        
        // Update unread count if necessary
        if (notifToDelete && !notifToDelete.read) {
          setUnreadCount(prev => Math.max(0, prev - 1));
        }
        return;
      }
      
      await API.admin.deleteNotification(notificationId);
      
      // Update local state
      setNotifications(prevNotifications => 
        prevNotifications.filter(notif => notif.id !== notificationId)
      );
      
      // Update unread count if necessary
      const deletedNotification = notifications.find(notif => notif.id === notificationId);
      if (deletedNotification && !deletedNotification.read) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
      
      // Check for CORS errors
      if (error.message && error.message.includes('CORS') && !isUsingLocalNotifications) {
        // Switch to local notifications mode
        setIsUsingLocalNotifications(true);
        
        // Still delete in local state
        const notifToDelete = notifications.find(notif => notif.id === notificationId);
        setNotifications(prevNotifications => 
          prevNotifications.filter(notif => notif.id !== notificationId)
        );
        
        // Update unread count if necessary
        if (notifToDelete && !notifToDelete.read) {
          setUnreadCount(prev => Math.max(0, prev - 1));
        }
      } else if (!isUsingLocalNotifications) {
        // Refresh notifications on other error types
        fetchNotifications();
      }
    }
  };
  
  // Clear all notifications
  const clearAllNotifications = async () => {
    try {
      // If using local notifications, just update state
      if (isUsingLocalNotifications) {
        setNotifications([]);
        setUnreadCount(0);
        return;
      }
      
      await API.admin.clearAllNotifications();
      
      // Update local state
      setNotifications([]);
      
      // Update unread count
      setUnreadCount(0);
    } catch (error) {
      console.error('Error clearing notifications:', error);
      
      // Check for CORS errors
      if (error.message && error.message.includes('CORS') && !isUsingLocalNotifications) {
        // Switch to local notifications mode
        setIsUsingLocalNotifications(true);
        
        // Still clear in local state
        setNotifications([]);
        setUnreadCount(0);
      } else if (!isUsingLocalNotifications) {
        // Refresh notifications on other error types
        fetchNotifications();
      }
    }
  };

  // Handle notification click
  const handleNotificationClick = (notification) => {
    // Mark as read
    if (!notification.read) {
      markAsRead(notification.id);
    }
    
    // Navigate to link if provided
    if (notification.link) {
      navigate(notification.link);
    }
    
    // Close the notification menu
    setNotificationsAnchorEl(null);
  };
  
  // Handle notification menu open
  const handleNotificationsOpen = (event) => {
    setNotificationsAnchorEl(event.currentTarget);
  };
  
  // Handle notification menu close
  const handleNotificationsClose = () => {
    setNotificationsAnchorEl(null);
  };

  // Get trend icon based on market trend
  const getTrendIcon = (trend) => {
    switch (trend) {
      case 'bullish':
        return <TrendingUpIcon sx={{ color: colors.buyGreen }} />;
      case 'bearish':
        return <TrendingDownIcon sx={{ color: colors.sellRed }} />;
      default:
        return <TrendingFlatIcon sx={{ color: colors.secondaryText }} />;
    }
  };

  // Get trend color based on market trend
  const getTrendColor = (trend) => {
    switch (trend) {
      case 'bullish':
        return colors.buyGreen;
      case 'bearish':
        return colors.sellRed;
      default:
        return colors.secondaryText;
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="100vh" sx={{ backgroundColor: colors.background }}>
        <CircularProgress sx={{ color: colors.primary }} />
      </Box>
    );
  }

  if (error) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="100vh" sx={{ backgroundColor: colors.background }}>
        <Typography color={colors.sellRed}>{error}</Typography>
      </Box>
    );
  }

  if (!user) {
    return null; // or a loading state
  }

  // Metric data
  const metrics = [
    { 
      title: "Users", 
      value: userCount !== null ? `${userCount.toLocaleString()}` : "Loading...",
      period: "Total registered users",
      icon: <PeopleIcon sx={{ color: colors.primary }} />,
      chart: true
    },
    { 
      title: "Favorite Symbols", 
      value: favoriteSymbolsData && favoriteSymbolsData.length 
        ? `${favoriteSymbolsData.length} symbols` 
        : "No favorites",
      period: "Top symbols by user favorites",
      icon: <StarIcon sx={{ color: colors.secondary }} />,
      chart: true,
      chartType: 'bar'
    },
    { 
      title: "Market Trends", 
      value: marketTrendsData && marketTrendsData.overall_trend 
        ? `${marketTrendsData.overall_trend.charAt(0).toUpperCase() + marketTrendsData.overall_trend.slice(1)}` 
        : "Neutral",
      period: "Overall market sentiment",
      icon: marketTrendsData && marketTrendsData.overall_trend 
        ? getTrendIcon(marketTrendsData.overall_trend) 
        : <TrendingFlatIcon sx={{ color: colors.secondaryText }} />,
      chart: true,
      chartType: 'trend'
    }
  ];

  return (
    <DashboardContainer>
      <Sidebar />
      <MainContent>
        <StyledAppBar position="static">
          <StyledToolbar>
            <DashboardTitle variant="h4">Admin Dashboard</DashboardTitle>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Tooltip title="Notifications">
                <IconButton 
                  sx={{ color: colors.secondaryText, position: 'relative' }}
                  onClick={handleNotificationsOpen}
                >
                  <NotificationsIcon />
                  {unreadCount > 0 && (
                    <Box
                      sx={{
                        position: 'absolute',
                        top: 0,
                        right: 0,
                        backgroundColor: colors.sellRed,
                        color: '#fff',
                        fontSize: '0.65rem',
                        fontWeight: 'bold',
                        minWidth: '18px',
                        height: '18px',
                        borderRadius: '9px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: `2px solid ${colors.background}`,
                        zIndex: 1
                      }}
                    >
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </Box>
                  )}
                </IconButton>
              </Tooltip>
            </Box>
          </StyledToolbar>
        </StyledAppBar>

        {/* Notifications Menu */}
        <StyledPopover
          anchorEl={notificationsAnchorEl}
          open={notificationsOpen}
          onClose={handleNotificationsClose}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'right',
          }}
          transformOrigin={{
            vertical: 'top',
            horizontal: 'right',
          }}
        >
          <Box sx={{ px: 2, py: 1.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `1px solid ${colors.borderColor}` }}>
            <Typography variant="h6" sx={{ fontWeight: 600, color: colors.primaryText }}>
              Notifications
            </Typography>
            <Box>
              {notifications.length > 0 && (
                <>
                  <Tooltip title="Mark all as read">
                    <IconButton size="small" onClick={markAllAsRead} sx={{ color: colors.primary }}>
                      <CheckCircleIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Clear all notifications">
                    <IconButton size="small" onClick={clearAllNotifications} sx={{ color: colors.sellRed }}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </>
              )}
            </Box>
          </Box>
          
          {loadingNotifications ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 3 }}>
              <CircularProgress size={28} sx={{ color: colors.primary }} />
            </Box>
          ) : notifications.length > 0 ? (
            <>
              {notifications.map((notification) => (
                <NotificationItem key={notification.id} read={notification.read}>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                    <Box sx={{ 
                      backgroundColor: `${notification.type === 'error' ? colors.sellRed : 
                                        notification.type === 'warning' ? '#FFA726' : 
                                        notification.type === 'success' ? colors.buyGreen : 
                                        colors.accentBlue}20`,
                      borderRadius: '50%',
                      width: 34,
                      height: 34,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      {getNotificationIcon(notification.type)}
                    </Box>
                    <Box sx={{ flex: 1 }} onClick={() => handleNotificationClick(notification)}>
                      <Typography variant="subtitle2" sx={{ 
                        fontWeight: notification.read ? 500 : 700,
                        color: colors.primaryText,
                        mb: 0.5
                      }}>
                        {notification.title}
                      </Typography>
                      <Typography variant="body2" sx={{ color: colors.secondaryText, fontSize: '0.8rem' }}>
                        {notification.message}
                      </Typography>
                      <Typography variant="caption" sx={{ color: `${colors.secondaryText}aa`, display: 'block', mt: 1, fontSize: '0.7rem' }}>
                        {new Date(notification.timestamp).toLocaleString()}
                      </Typography>
                    </Box>
                    <IconButton 
                      size="small" 
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteNotification(notification.id);
                      }}
                      sx={{ 
                        color: colors.secondaryText,
                        opacity: 0.7,
                        '&:hover': {
                          opacity: 1,
                          color: colors.sellRed
                        }
                      }}
                    >
                      <CloseIcon fontSize="small" />
                    </IconButton>
                  </Box>
                </NotificationItem>
              ))}
            </>
          ) : (
            <Box sx={{ py: 4, px: 2, textAlign: 'center' }}>
              <Typography variant="body2" sx={{ color: colors.secondaryText }}>
                No notifications
              </Typography>
            </Box>
          )}
          
          {notifications.length > 0 && (
            <Box sx={{ p: 1.5, textAlign: 'center', borderTop: `1px solid ${colors.borderColor}` }}>
              <Button 
                size="small" 
                onClick={() => {
                  navigate('/HelpCenter');
                  handleNotificationsClose();
                }}
                sx={{ 
                  color: colors.primary,
                  textTransform: 'none',
                  fontWeight: 500,
                  '&:hover': {
                    backgroundColor: `${colors.primary}15`
                  }
                }}
              >
                View all notifications
              </Button>
            </Box>
          )}
        </StyledPopover>

        <MetricsGrid>
          {metrics.map((metric, index) => (
            <MetricCard key={index} elevation={0}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" sx={{ color: colors.primaryText, fontWeight: 'bold' }}>
                        {metric.title}
                      </Typography>
                <Box sx={{ 
                  width: 40, 
                  height: 40, 
                  borderRadius: '10px', 
                  display: 'flex', 
                  justifyContent: 'center', 
                  alignItems: 'center',
                  backgroundColor: `${colors.primary}22`
                }}>
                  {metric.icon}
                </Box>
              </Box>

              <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 0.5, color: colors.primaryText }}>
                    {metric.value}
                  </Typography>

              <Typography variant="body2" sx={{ color: colors.secondaryText, mb: 2 }}>
                    {metric.period}
                  </Typography>

                {metric.chart && (
                <Box sx={{ flex: 1, minHeight: 0, width: '100%' }}>
                    {loadingChart ? (
                      <Box display="flex" justifyContent="center" alignItems="center" height="100%">
                      <CircularProgress size={24} sx={{ color: colors.primary }} />
                      </Box>
                  ) : metric.chartType === 'bar' ? (
                    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                      <BarChart
                        series={[
                          {
                            data: favoriteSymbolsData.map(item => item.count),
                            color: colors.secondary,
                            label: 'Favorites'
                          }
                        ]}
                        xAxis={[{ 
                          data: favoriteSymbolsData.map(item => item.symbol),
                          scaleType: 'band',
                          tickLabelStyle: {
                            angle: -45,
                            textAnchor: 'end',
                            fontSize: 10,
                            fill: colors.secondaryText
                          }
                        }]}
                        yAxis={[{
                          tickLabelStyle: {
                            fill: colors.secondaryText
                          }
                        }]}
                        slotProps={{
                          legend: {
                            position: {
                              vertical: 'top',
                              horizontal: 'right',
                            },
                            padding: {
                              top: 0,
                              right: 10,
                            },
                            labelStyle: {
                              fill: colors.primaryText,
                              fontSize: 12,
                              fontWeight: 'bold',
                            },
                          },
                        }}
                        height={100}
                        margin={{ top: 20, bottom: 30, left: 10, right: 10 }}
                        sx={{
                          '.MuiBarElement-root': {
                            fill: colors.secondary,
                            rx: 4,
                            ry: 4
                          },
                          '.MuiAxisLine-root': {
                            stroke: colors.borderColor
                          },
                          '.MuiAxisTick-root': {
                            stroke: colors.borderColor
                          }
                        }}
                      />
                      <Box sx={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center',
                        mt: 1,
                        px: 1
                      }}>
                        <Typography variant="caption" sx={{ color: colors.secondaryText }}>
                          {favoriteSymbolsData.length > 0 ? `Most popular: ${favoriteSymbolsData[0].symbol}` : ''}
                        </Typography>
                        <Typography variant="caption" sx={{ color: colors.secondaryText }}>
                          {favoriteSymbolsData.length > 0 ? `${favoriteSymbolsData[0].count} favorites` : ''}
                        </Typography>
                      </Box>
                    </Box>
                  ) : metric.chartType === 'trend' ? (
                    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                      {marketTrendsData && (
                        <>
                          <Box sx={{ 
                            display: 'flex', 
                            flexDirection: 'column', 
                            alignItems: 'center', 
                            justifyContent: 'center',
                            height: '100%',
                            py: 1
                          }}>
                            {/* Overall trend indicator */}
                            <Box sx={{ 
                              display: 'flex', 
                              flexDirection: 'column', 
                              alignItems: 'center', 
                              mb: 2
                            }}>
                              <Box sx={{ 
                                width: 70, 
                                height: 70, 
                                borderRadius: '50%', 
                                display: 'flex', 
                                justifyContent: 'center', 
                                alignItems: 'center',
                                backgroundColor: `${getTrendColor(marketTrendsData.overall_trend)}22`,
                                border: `2px solid ${getTrendColor(marketTrendsData.overall_trend)}`,
                                boxShadow: `0 0 10px ${getTrendColor(marketTrendsData.overall_trend)}33`
                              }}>
                                {getTrendIcon(marketTrendsData.overall_trend)}
                              </Box>
                              <Typography 
                                variant="subtitle2" 
                                sx={{ 
                                  mt: 1, 
                                  fontWeight: 'bold',
                                  color: getTrendColor(marketTrendsData.overall_trend),
                                  textTransform: 'capitalize'
                                }}
                              >
                                {marketTrendsData.overall_trend}
                              </Typography>
                            </Box>

                            {/* Trend percentages */}
                            <Box sx={{ 
                              width: '100%', 
                              display: 'flex', 
                              flexDirection: 'column', 
                              gap: 1
                            }}>
                              {/* Bullish bar */}
                              <Box sx={{ width: '100%' }}>
                                <Box sx={{ 
                                  display: 'flex', 
                                  justifyContent: 'space-between', 
                                  mb: 0.5 
                                }}>
                                  <Typography variant="caption" sx={{ color: colors.buyGreen, fontWeight: 'medium' }}>
                                    Bullish
                                  </Typography>
                                  <Typography variant="caption" sx={{ color: colors.buyGreen, fontWeight: 'bold' }}>
                                    {marketTrendsData.bullish_percentage}%
                                  </Typography>
                                </Box>
                                <Box sx={{ 
                                  width: '100%', 
                                  height: 6, 
                                  backgroundColor: `${colors.buyGreen}22`, 
                                  borderRadius: 3,
                                  overflow: 'hidden'
                                }}>
                                  <Box sx={{ 
                                    width: `${marketTrendsData.bullish_percentage}%`, 
                                    height: '100%', 
                                    backgroundColor: colors.buyGreen,
                                    borderRadius: 3
                                  }} />
                                </Box>
                              </Box>

                              {/* Neutral bar */}
                              <Box sx={{ width: '100%' }}>
                                <Box sx={{ 
                                  display: 'flex', 
                                  justifyContent: 'space-between', 
                                  mb: 0.5 
                                }}>
                                  <Typography variant="caption" sx={{ color: colors.secondaryText, fontWeight: 'medium' }}>
                                    Neutral
                                  </Typography>
                                  <Typography variant="caption" sx={{ color: colors.secondaryText, fontWeight: 'bold' }}>
                                    {marketTrendsData.neutral_percentage}%
                                  </Typography>
                                </Box>
                                <Box sx={{ 
                                  width: '100%', 
                                  height: 6, 
                                  backgroundColor: `${colors.secondaryText}22`, 
                                  borderRadius: 3,
                                  overflow: 'hidden'
                                }}>
                                  <Box sx={{ 
                                    width: `${marketTrendsData.neutral_percentage}%`, 
                                    height: '100%', 
                                    backgroundColor: colors.secondaryText,
                                    borderRadius: 3
                                  }} />
                                </Box>
                              </Box>

                              {/* Bearish bar */}
                              <Box sx={{ width: '100%' }}>
                                <Box sx={{ 
                                  display: 'flex', 
                                  justifyContent: 'space-between', 
                                  mb: 0.5 
                                }}>
                                  <Typography variant="caption" sx={{ color: colors.sellRed, fontWeight: 'medium' }}>
                                    Bearish
                                  </Typography>
                                  <Typography variant="caption" sx={{ color: colors.sellRed, fontWeight: 'bold' }}>
                                    {marketTrendsData.bearish_percentage}%
                                  </Typography>
                                </Box>
                                <Box sx={{ 
                          width: '100%',
                                  height: 6, 
                                  backgroundColor: `${colors.sellRed}22`, 
                                  borderRadius: 3,
                                  overflow: 'hidden'
                                }}>
                                  <Box sx={{ 
                                    width: `${marketTrendsData.bearish_percentage}%`, 
                                    height: '100%', 
                                    backgroundColor: colors.sellRed,
                                    borderRadius: 3
                                  }} />
                                </Box>
                              </Box>
                            </Box>

                            {/* Total symbols indicator */}
                            <Box sx={{ 
                              mt: 2, 
                              display: 'flex', 
                              alignItems: 'center', 
                              justifyContent: 'center',
                              backgroundColor: `${colors.primary}22`,
                              borderRadius: 1,
                              py: 0.5,
                              px: 1
                            }}>
                              <Typography variant="caption" sx={{ color: colors.primaryText }}>
                                {marketTrendsData.total_symbols} symbols analyzed
                              </Typography>
                            </Box>
                          </Box>
                        </>
                      )}
                    </Box>
                  ) : (
                    <LineChart
                      series={[
                        {
                          data: userGrowthData && Array.isArray(userGrowthData) && userGrowthData.length > 0 ? 
                            userGrowthData.map(item => (item?.users || 0)) : [0],
                          color: colors.primary,
                          area: true,
                          showMark: false
                        }
                      ]}
                      xAxis={[{ 
                        data: userGrowthData && Array.isArray(userGrowthData) && userGrowthData.length > 0 ? 
                          userGrowthData.map(item => (item?.month || '')) : ['No Data'],
                        scaleType: 'point',
                        tickLabelStyle: {
                          fill: colors.secondaryText,
                          fontSize: 10
                        }
                      }]}
                      yAxis={[{
                        tickLabelStyle: {
                          fill: colors.secondaryText,
                          fontSize: 10
                        }
                      }]}
                      height={100}
                      margin={{ top: 10, bottom: 20, left: 10, right: 10 }}
                      sx={{
                        '.MuiLineElement-root': {
                          strokeWidth: 2
                        },
                        '.MuiAreaElement-root': {
                          fill: `${colors.primary}33`
                        },
                        '.MuiAxisLine-root': {
                          stroke: colors.borderColor
                        },
                        '.MuiAxisTick-root': {
                          stroke: colors.borderColor
                        }
                        }}
                      />
                    )}
                  </Box>
                )}
            </MetricCard>
            ))}
        </MetricsGrid>

        <Box sx={{ mb: 4 }}>
          <Typography variant="h5" sx={{ 
            mb: 2, 
            fontWeight: 600, 
            color: colors.primaryText,
            display: 'flex',
            alignItems: 'center',
            gap: 1
          }}>
            <SettingsIcon fontSize="small" sx={{ color: colors.primary }} />
            System Overview
          </Typography>
          
          <Paper sx={{ 
            p: 3, 
            backgroundColor: colors.cardBg, 
            border: `1px solid ${colors.borderColor}`,
            borderRadius: '12px',
            boxShadow: `0 4px 12px ${colors.shadowColor}`
          }}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                  <Typography variant="h6" sx={{ 
                    mb: 2, 
                    color: colors.primaryText, 
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1
                  }}>
                    <PeopleIcon fontSize="small" sx={{ color: colors.primary }} />
                    Recent Activities
                  </Typography>
                  
                  <Box sx={{ 
                    flex: 1, 
                    backgroundColor: `${colors.background}80`, 
                    borderRadius: '12px', 
                    p: 2, 
                    overflowY: 'auto',
                    maxHeight: '300px',
                    border: `1px solid ${colors.borderColor}`,
                    boxShadow: 'inset 0 2px 6px rgba(0,0,0,0.15)'
                  }}>
                    {loading ? (
                      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                        <CircularProgress size={28} sx={{ color: colors.primary }} />
                      </Box>
                    ) : users && users.length > 0 ? (
                      <>
                        {/* Sort users by creation date, newest first */}
                        {[...users]
                          .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))
                          .slice(0, 5)
                          .map((user, index) => (
                            <Box key={user.user_id || index} sx={{ 
                              mb: 2, 
                              p: 1.5, 
                              borderRadius: '10px',
                              backgroundColor: index % 2 === 0 ? `${colors.hoverBg}80` : 'transparent',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 2,
                              transition: 'all 0.3s ease',
                              cursor: 'pointer',
                              border: `1px solid transparent`,
                              '&:hover': {
                                backgroundColor: colors.hoverBg,
                                transform: 'translateX(5px)',
                                borderColor: `${colors.primary}33`
                              }
                            }}
                            onClick={() => {
                              // Create notification when clicking on a user
                              createLocalNotification(
                                'User Profile Viewed',
                                `You viewed ${user.username}'s profile`,
                                'info',
                                `/UserManagement?userId=${user.user_id}`
                              );
                              
                              // Navigate to user management
                              navigate(`/UserManagement?userId=${user.user_id}`);
                            }}
                            >
                              <Avatar 
                                sx={{ 
                                  bgcolor: index % 3 === 0 ? colors.primary : index % 3 === 1 ? colors.secondary : colors.accentBlue, 
                                  width: 40, 
                                  height: 40,
                                  boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
                                }}
                              >
                                {user.username ? user.username.charAt(0).toUpperCase() : 'U'}
                              </Avatar>
                              <Box sx={{ flex: 1 }}>
                                <Typography variant="body2" sx={{ fontWeight: 600, color: colors.primaryText }}>
                                  {user.username || 'User'} joined the platform
                                </Typography>
                                <Typography variant="caption" sx={{ color: colors.secondaryText }}>
                                  {user.created_at ? new Date(user.created_at).toLocaleString() : 'Unknown date'}
                                </Typography>
                              </Box>
                              <Chip 
                                label={user.role || 'user'} 
                                size="small"
                                sx={{ 
                                  backgroundColor: user.role === 'admin' ? `${colors.secondary}33` : `${colors.primary}33`,
                                  color: user.role === 'admin' ? colors.secondary : colors.primary,
                                  fontWeight: 600,
                                  borderRadius: '8px'
                                }}
                              />
                            </Box>
                          ))}
                          
                          {/* "View All" button */}
                          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                            <Button 
                              variant="outlined" 
                              size="small"
                              onClick={() => navigate('/UserManagement')}
                              sx={{
                                borderColor: colors.borderColor,
                                color: colors.secondaryText,
                                borderRadius: '8px',
                                textTransform: 'none',
                                fontWeight: 600,
                                '&:hover': {
                                  borderColor: colors.primary,
                                  color: colors.primary,
                                  backgroundColor: `${colors.primary}15`
                                }
                              }}
                            >
                              View All Users
                            </Button>
                          </Box>
                      </>
                    ) : (
                      <Box sx={{ 
                        display: 'flex', 
                        justifyContent: 'center', 
                        alignItems: 'center', 
                        height: '100%', 
                        color: colors.secondaryText,
                        minHeight: '100px'
                      }}>
                        No user activity data available
                      </Box>
                    )}
                  </Box>
                </Box>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                  <Typography variant="h6" sx={{ 
                    mb: 2, 
                    color: colors.primaryText, 
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1
                  }}>
                    <StarIcon fontSize="small" sx={{ color: colors.secondary }} />
                    System Health & Status
                  </Typography>
                  
                  <Box sx={{ 
                    flex: 1, 
                    backgroundColor: `${colors.background}80`, 
                    borderRadius: '12px', 
                    p: 2,
                    border: `1px solid ${colors.borderColor}`,
                    boxShadow: 'inset 0 2px 6px rgba(0,0,0,0.15)'
                  }}>
                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <Box sx={{ 
                          p: 2, 
                          borderRadius: '12px', 
                          backgroundColor: `${colors.buyGreen}15`,
                          border: `1px solid ${colors.buyGreen}50`,
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          height: '100px',
                          transition: 'transform 0.2s ease',
                          '&:hover': {
                            transform: 'translateY(-4px)'
                          }
                        }}>
                          <Typography variant="h6" sx={{ color: colors.buyGreen, fontWeight: 600 }}>
                            Server Status
                          </Typography>
                          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mt: 1 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Box sx={{ 
                                width: 12, 
                                height: 12, 
                                borderRadius: '50%', 
                                backgroundColor: colors.buyGreen,
                                boxShadow: `0 0 10px ${colors.buyGreen}`
                              }} />
                              <Typography variant="body1" sx={{ color: colors.primaryText }}>
                                Operational
                              </Typography>
                            </Box>
                            <Typography variant="caption" sx={{ color: colors.secondaryText, mt: 0.5 }}>
                              Uptime: 99.9%
                            </Typography>
                          </Box>
                        </Box>
                      </Grid>
                      
                      <Grid item xs={6}>
                        <Box sx={{ 
                          p: 2, 
                          borderRadius: '12px', 
                          backgroundColor: `${colors.accentBlue}15`,
                          border: `1px solid ${colors.accentBlue}50`,
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          height: '100px',
                          transition: 'transform 0.2s ease',
                          '&:hover': {
                            transform: 'translateY(-4px)'
                          }
                        }}>
                          <Typography variant="h6" sx={{ color: colors.accentBlue, fontWeight: 600 }}>
                            API Status
                          </Typography>
                          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mt: 1 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Box sx={{ 
                                width: 12, 
                                height: 12, 
                                borderRadius: '50%', 
                                backgroundColor: colors.accentBlue,
                                boxShadow: `0 0 10px ${colors.accentBlue}`
                              }} />
                              <Typography variant="body1" sx={{ color: colors.primaryText }}>
                                Active
                              </Typography>
                            </Box>
                            <Typography variant="caption" sx={{ color: colors.secondaryText, mt: 0.5 }}>
                              Response time: 45ms
                            </Typography>
                          </Box>
                        </Box>
                      </Grid>
                      
                      <Grid item xs={12}>
                        <Box sx={{
                          display: 'flex',
                          gap: 2,
                          mt: 1,
                          p: 0
                        }}>
                          <Box sx={{ 
                            p: 2, 
                            borderRadius: '12px', 
                            backgroundColor: `${colors.primary}15`,
                            border: `1px solid ${colors.primary}50`,
                            flex: 1,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            transition: 'transform 0.2s ease',
                            '&:hover': {
                              transform: 'translateY(-4px)'
                            }
                          }}>
                            <Typography variant="subtitle2" sx={{ color: colors.primary, fontWeight: 600 }}>
                              Database
                            </Typography>
                            <Box sx={{ 
                              width: 40, 
                              height: 40, 
                              display: 'flex',
                              justifyContent: 'center',
                              alignItems: 'center',
                              backgroundColor: `${colors.primary}22`,
                              borderRadius: '50%',
                              mt: 1
                            }}>
                              <Typography variant="body2" sx={{ color: colors.primaryText, fontWeight: 'bold' }}>
                                OK
                              </Typography>
                            </Box>
                          </Box>
                          
                          <Box sx={{ 
                            p: 2, 
                            borderRadius: '12px', 
                            backgroundColor: `${colors.secondary}15`,
                            border: `1px solid ${colors.secondary}50`,
                            flex: 1,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            transition: 'transform 0.2s ease',
                            '&:hover': {
                              transform: 'translateY(-4px)'
                            }
                          }}>
                            <Typography variant="subtitle2" sx={{ color: colors.secondary, fontWeight: 600 }}>
                              Security
                            </Typography>
                            <Box sx={{ 
                              width: 40, 
                              height: 40, 
                              display: 'flex',
                              justifyContent: 'center',
                              alignItems: 'center',
                              backgroundColor: `${colors.secondary}22`,
                              borderRadius: '50%',
                              mt: 1
                            }}>
                              <Typography variant="body2" sx={{ color: colors.primaryText, fontWeight: 'bold' }}>
                                A+
                              </Typography>
                            </Box>
                          </Box>
                        </Box>
                      </Grid>
                      
                      <Grid item xs={12}>
                        <Box sx={{ 
                          mt: 1,
                          p: 2, 
                          borderRadius: '12px', 
                          backgroundColor: colors.hoverBg,
                          border: `1px solid ${colors.borderColor}`,
                        }}>
                          <Typography variant="subtitle2" sx={{ 
                            color: colors.primaryText, 
                            mb: 1,
                            fontWeight: 600,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1
                          }}>
                            <SettingsIcon fontSize="small" sx={{ color: colors.secondaryText }} />
                            Quick Actions
                          </Typography>
                          <Grid container spacing={1}>
                            <Grid item xs={6}>
                              <Button 
                                variant="outlined" 
                                size="small" 
                                fullWidth
                                onClick={() => navigate('/UserManagement')}
                                sx={{ 
                                  borderColor: colors.primary,
                                  color: colors.primary,
                                  borderRadius: '8px',
                                  textTransform: 'none',
                                  fontWeight: 600,
                                  '&:hover': {
                                    backgroundColor: `${colors.primary}15`,
                                    borderColor: colors.primary
                                  }
                                }}
                              >
                                Manage Users
                              </Button>
                            </Grid>
                            <Grid item xs={6}>
                              <Button 
                                variant="outlined" 
                                size="small" 
                                fullWidth 
                                onClick={() => navigate('/adminsettings')}
                                sx={{ 
                                  borderColor: colors.secondary,
                                  color: colors.secondary,
                                  borderRadius: '8px',
                                  textTransform: 'none',
                                  fontWeight: 600,
                                  '&:hover': {
                                    backgroundColor: `${colors.secondary}15`,
                                    borderColor: colors.secondary
                                  }
                                }}
                              >
                                System Settings
                              </Button>
                            </Grid>
                          </Grid>
                        </Box>
                      </Grid>
                    </Grid>
                  </Box>
                </Box>
              </Grid>
            </Grid>
          </Paper>
        </Box>
      </MainContent>
    </DashboardContainer>
  );
};

export default AdminDashboard;