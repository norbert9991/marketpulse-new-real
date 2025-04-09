import React from 'react';
import { Box, Typography, Button, Divider } from '@mui/material';
import { NavLink } from 'react-router-dom';
import {
  Dashboard as DashboardIcon,
  ShowChart as ShowChartIcon,
  SwapHoriz as SwapHorizIcon,
  Settings as SettingsIcon
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
  gradientEnd: '#00E676'
};

const Sidebar = () => {
  const menuItems = [
    { name: 'Dashboard', path: '/user-dashboard', icon: <DashboardIcon /> },
    { name: 'Markets', path: '/market', icon: <ShowChartIcon /> },
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
        top: 0
      }}
    >
      <Box sx={{ textAlign: 'center', mb: 4, px: 2 }}>
        <Typography 
          variant="h6" 
          sx={{ 
            fontWeight: 'bold',
            background: `linear-gradient(135deg, ${colors.gradientStart}, ${colors.gradientEnd})`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            mb: 0.5
          }}
        >
          MARKEPULSE
        </Typography>
        <Typography 
          variant="caption" 
          sx={{ 
            color: colors.secondaryText,
            letterSpacing: '0.5px'
          }}
        >
          Forex Trading Platform
        </Typography>
      </Box>

      <Divider sx={{ backgroundColor: colors.borderColor, mb: 2 }} />

      <Box sx={{ px: 2 }}>
        {menuItems.map((item) => (
          <Button 
            key={item.name} 
            component={NavLink} 
            to={item.path} 
            fullWidth 
            startIcon={item.icon}
            sx={{
              justifyContent: 'flex-start',
              color: colors.secondaryText,
              mb: 1,
              borderRadius: '8px',
              px: 2,
              py: 1.5,
              '&:hover': {
                backgroundColor: colors.hoverBg,
                color: colors.primaryText,
                '& .MuiSvgIcon-root': {
                  color: colors.accentBlue
                }
              },
              '&.active': {
                backgroundColor: colors.hoverBg,
                color: colors.primaryText,
                '& .MuiSvgIcon-root': {
                  color: colors.accentBlue
                },
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  left: 0,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: '4px',
                  height: '24px',
                  backgroundColor: colors.accentBlue,
                  borderRadius: '0 4px 4px 0'
                }
              }
            }}
          >
            {item.name}
          </Button>
        ))}
      </Box>
    </Box>
  );
};

export default Sidebar;
