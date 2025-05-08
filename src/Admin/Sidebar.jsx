// Sidebar.jsx
import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, CircularProgress, Badge, Divider, Avatar, Tooltip } from '@mui/material';
import { styled } from '@mui/system';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  Help as HelpIcon,
  Assessment as ReportsIcon,
  Settings as SettingsIcon,
  Logout as LogoutIcon,
  ExitToApp as LogoutIconAlt
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
  activeItemBg: 'rgba(25, 118, 210, 0.15)',
  gradientStart: '#1976d2',
  gradientEnd: '#2196f3',
  errorRed: '#f44336'
};

// Styled menu button for better transitions
const MenuButton = styled(Button)(({ theme, active }) => ({
  justifyContent: 'flex-start',
  color: active ? colors.primaryText : colors.secondaryText,
  marginBottom: '12px',
  borderRadius: '12px',
  padding: '12px 16px',
  backgroundColor: active ? colors.activeItemBg : 'transparent',
  position: 'relative',
  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
  overflow: 'hidden',
  '&:hover': {
    backgroundColor: active ? colors.activeItemBg : colors.hoverBg,
    color: colors.primaryText,
    transform: active ? 'none' : 'translateX(3px)',
  },
  '& .MuiSvgIcon-root': {
    color: active ? colors.primary : colors.secondaryText,
    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
    marginRight: '8px',
  },
  '&:hover .MuiSvgIcon-root': {
    color: colors.primary,
    transform: active ? 'none' : 'scale(1.1)',
  },
  '&::before': active ? {
    content: '""',
    position: 'absolute',
    left: 0,
    top: '50%',
    transform: 'translateY(-50%)',
    width: '4px',
    height: '60%',
    background: `linear-gradient(to bottom, ${colors.gradientStart}, ${colors.gradientEnd})`,
    borderRadius: '0 4px 4px 0',
    animation: 'fadeIn 0.3s ease'
  } : {},
  '&::after': {
    content: '""',
    position: 'absolute',
    bottom: 0,
    left: '10%',
    width: '80%',
    height: '1px',
    backgroundColor: `${colors.borderColor}50`,
    opacity: 0.5
  },
  '@keyframes fadeIn': {
    '0%': { opacity: 0, height: '0%' },
    '100%': { opacity: 1, height: '60%' }
  }
}));

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('');
  const [pendingRequests, setPendingRequests] = useState(0);
  const [user, setUser] = useState(null);
  const [animating, setAnimating] = useState(false);

  // Set active tab based on current path when component mounts
  useEffect(() => {
    const currentPath = location.pathname;
    
    // Add animation flag
    setAnimating(true);
    setActiveTab(currentPath);
    
    // Reset animation flag after animation completes
    const timer = setTimeout(() => {
      setAnimating(false);
    }, 300);
    
    // Fetch the current user data
    const fetchUserData = async () => {
      try {
        const response = await API.auth.me();
        setUser(response.data.user);
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };
    
    // Fetch pending requests count for the badge
    const fetchPendingRequests = async () => {
      try {
        const response = await API.balance.getRequests();
        const pendingCount = response.data.requests?.filter(req => req.status === 'pending').length || 0;
        setPendingRequests(pendingCount);
      } catch (error) {
        console.error('Error fetching pending requests:', error);
      }
    };
    
    fetchUserData();
    fetchPendingRequests();
    
    return () => clearTimeout(timer);
  }, [location.pathname]);

  const handleNavigation = (path) => {
    if (path !== activeTab) {
      navigate(path);
    }
  };
  
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = window.location.origin + '/#/';
  };

  const menuItems = [
    { name: 'Dashboard', path: '/admin-dashboard', icon: <DashboardIcon />, badge: null },
    { name: 'Users', path: '/UserManagement', icon: <PeopleIcon />, badge: null },
    { name: 'Help Center', path: '/HelpCenter', icon: <HelpIcon />, badge: null },
    { name: 'Reports', path: '/ReportPage', icon: <ReportsIcon />, badge: null },
    { name: 'Settings', path: '/adminsettings', icon: <SettingsIcon />, badge: null }
  ];

  return (
    <Box 
      sx={{ 
        width: 250, 
        bgcolor: colors.background,
        borderRight: `1px solid ${colors.borderColor}`,
        p: '20px 0',
        height: '100vh',
        position: 'fixed',
        left: 0,
        top: 0,
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '4px 0 15px rgba(0, 0, 0, 0.1)',
        zIndex: 1200,
        overflow: 'hidden'
      }}
    >
      {/* Logo Area */}
      <Box sx={{ textAlign: 'center', mb: 3, px: 2 }}>
        <Typography 
          variant="h6" 
          sx={{ 
            fontWeight: 'bold',
            background: `linear-gradient(135deg, ${colors.gradientStart}, ${colors.gradientEnd})`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            mb: 0.5,
            letterSpacing: '1px',
            fontSize: '1.5rem'
          }}
        >
          MARKETPULSE
        </Typography>
        <Typography 
          variant="caption" 
          sx={{ 
            color: colors.secondaryText,
            letterSpacing: '0.5px',
            fontSize: '0.7rem',
            textTransform: 'uppercase'
          }}
        >
          Admin Dashboard
        </Typography>
      </Box>

      {/* User Profile Area */}
      {user && (
        <Box sx={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center',
          mb: 3,
          px: 3,
          pb: 3,
          borderBottom: `1px solid ${colors.borderColor}`
        }}>
          <Avatar 
            sx={{ 
              width: 60, 
              height: 60, 
              bgcolor: `${colors.primary}80`,
              mb: 1,
              border: `2px solid ${colors.borderColor}`
            }}
          >
            {user.username ? user.username.charAt(0).toUpperCase() : 'A'}
          </Avatar>
          <Typography 
            sx={{ 
              color: colors.primaryText,
              fontWeight: 'medium',
              mb: 0.5
            }}
          >
            {user.username || 'Admin'}
          </Typography>
          <Typography 
            variant="caption" 
            sx={{ 
              color: colors.secondaryText,
              fontSize: '0.7rem',
              mb: 1,
              textAlign: 'center',
              display: '-webkit-box',
              WebkitLineClamp: 1,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden'
            }}
          >
            {user.email || ''}
          </Typography>
        </Box>
      )}

      {/* Navigation Menu */}
      <Box sx={{ 
        px: 2, 
        flex: 1,
        overflow: 'auto'
      }}>
        {menuItems.map((item) => (
          <MenuButton 
            key={item.name} 
            onClick={() => handleNavigation(item.path)}
            fullWidth 
            startIcon={item.icon}
            active={activeTab === item.path}
            className={animating && activeTab === item.path ? 'animating' : ''}
          >
            {item.name}
            {item.badge > 0 && (
              <Badge 
                badgeContent={item.badge} 
                color="error" 
                sx={{ ml: 'auto' }}
              />
            )}
          </MenuButton>
        ))}
      </Box>

      {/* Logout Button */}
      <Box sx={{ 
        mt: 'auto', 
        pt: 2, 
        px: 2, 
        pb: 3,
        borderTop: `1px solid ${colors.borderColor}`
      }}>
        <Tooltip title="Logout" placement="right">
          <Button
            variant="outlined"
            fullWidth
            startIcon={<LogoutIconAlt />}
            onClick={handleLogout}
            sx={{
              color: colors.errorRed,
              borderColor: `${colors.errorRed}40`,
              borderRadius: '12px',
              py: 1.2,
              justifyContent: 'flex-start',
              '&:hover': {
                backgroundColor: `${colors.errorRed}15`,
                borderColor: colors.errorRed,
                transform: 'translateY(-2px)',
                boxShadow: `0 4px 12px ${colors.errorRed}30`
              },
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
            }}
          >
            Logout
          </Button>
        </Tooltip>
      </Box>
    </Box>
  );
};

export default Sidebar;