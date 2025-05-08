import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, Divider, Tooltip, Avatar } from '@mui/material';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  Dashboard as DashboardIcon,
  ShowChart as ShowChartIcon,
  SwapHoriz as SwapHorizIcon,
  Settings as SettingsIcon,
  Article as ArticleIcon,
  ExitToApp as LogoutIcon
} from '@mui/icons-material';

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
  errorRed: '#FF3D57'
};

const Sidebar = ({ activePage }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [activePath, setActivePath] = useState('');
  const [user, setUser] = useState(null);

  useEffect(() => {
    setActivePath(location.pathname);
    
    // Get user data from localStorage
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
  }, [location.pathname]);

  const handleNavigation = (path) => {
    navigate(path);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = window.location.origin + '/#/';
  };

  const menuItems = [
    { name: 'Dashboard', path: '/user-dashboard', icon: <DashboardIcon /> },
    { name: 'Markets', path: '/market', icon: <ShowChartIcon /> },
    { name: 'Forex News', path: '/forex-news', icon: <ArticleIcon /> },
    { name: 'Trade', path: '/trade', icon: <SwapHorizIcon /> },
    { name: 'Settings', path: '/settings', icon: <SettingsIcon /> },
  ];

  return (
    <Box 
      sx={{ 
        width: 250, 
        bgcolor: colors.panelBg,
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
          Forex Trading Platform
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
              bgcolor: `${colors.accentBlue}80`,
              mb: 1,
              border: `2px solid ${colors.borderColor}`
            }}
            src={user.profile_image}
          >
            {(!user.profile_image && user.username) ? user.username.charAt(0).toUpperCase() : 'U'}
          </Avatar>
          <Typography 
            sx={{ 
              color: colors.primaryText,
              fontWeight: 'medium',
              mb: 0.5
            }}
          >
            {user.username || 'User'}
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
          <Button 
            key={item.name} 
            onClick={() => handleNavigation(item.path)}
            fullWidth 
            startIcon={item.icon}
            sx={{
              justifyContent: 'flex-start',
              color: (location.pathname === item.path || activePage === item.name) ? colors.primaryText : colors.secondaryText,
              mb: 1.5,
              borderRadius: '12px',
              px: 2,
              py: 1.5,
              backgroundColor: (location.pathname === item.path || activePage === item.name) ? colors.hoverBg : 'transparent',
              position: 'relative',
              transition: 'all 0.3s ease',
              overflow: 'hidden',
              '&:hover': {
                backgroundColor: colors.hoverBg,
                color: colors.primaryText,
                transform: 'translateX(3px)',
                '& .MuiSvgIcon-root': {
                  color: colors.accentBlue,
                  transform: 'scale(1.2)'
                }
              },
              '& .MuiSvgIcon-root': {
                color: (location.pathname === item.path || activePage === item.name) ? colors.accentBlue : colors.secondaryText,
                transition: 'all 0.3s ease',
                mr: 1
              },
              '&::before': (location.pathname === item.path || activePage === item.name) ? {
                content: '""',
                position: 'absolute',
                left: 0,
                top: '50%',
                transform: 'translateY(-50%)',
                width: '4px',
                height: '60%',
                background: `linear-gradient(to bottom, ${colors.gradientStart}, ${colors.gradientEnd})`,
                borderRadius: '0 4px 4px 0'
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
              }
            }}
          >
            {item.name}
          </Button>
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
            startIcon={<LogoutIcon />}
            onClick={handleLogout}
            sx={{
              color: colors.errorRed,
              borderColor: `${colors.errorRed}40`,
              borderRadius: '12px',
              py: 1.2,
              justifyContent: 'flex-start',
              '&:hover': {
                backgroundColor: `${colors.errorRed}10`,
                borderColor: colors.errorRed,
                transform: 'translateY(-2px)',
                boxShadow: `0 4px 12px ${colors.errorRed}30`
              },
              transition: 'all 0.3s ease'
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
