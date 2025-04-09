// Sidebar.jsx
import React, { useState } from 'react';
import { Box, Typography, Button, CircularProgress } from '@mui/material';
import { styled } from '@mui/system';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  SwapHoriz as TransactionsIcon,
  Assessment as ReportsIcon,
  Settings as SettingsIcon
} from '@mui/icons-material';

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
  hoverBg: '#2a2a2a'
};

const SidebarContainer = styled('div')(({ theme }) => ({
  width: '250px',
  background: colors.background,
  color: colors.primaryText,
  padding: '20px 0',
  borderRight: `1px solid ${colors.borderColor}`,
  height: '100vh',
  position: 'fixed',
  left: 0,
  top: 0
}));

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('');

  const handleTabClick = (path) => {
    setLoading(true);
    setActiveTab(path);
    
    // Simulate loading time
    setTimeout(() => {
      navigate(path);
      setLoading(false);
    }, 500);
  };

  const menuItems = [
    { name: 'Dashboard', path: '/admin-dashboard', icon: <DashboardIcon /> },
    { name: 'Users', path: '/UserManagement', icon: <PeopleIcon /> },
    { name: 'Transactions', path: '/TransactionPage', icon: <TransactionsIcon /> },
    { name: 'Reports', path: '/ReportPage', icon: <ReportsIcon /> },
    { name: 'Settings', path: '/adminsettings', icon: <SettingsIcon /> }
  ];

  return (
    <SidebarContainer>
      <Box sx={{ textAlign: 'center', mb: 4 }}>
        <Typography variant="h6" sx={{ fontWeight: 'bold', color: colors.primary }}>
          MARKEPULSE ADMIN
        </Typography>
        <Typography variant="caption" sx={{ color: colors.secondaryText }}>
          Administration Panel
        </Typography>
      </Box>

      <Box sx={{ px: 2 }}>
        {menuItems.map((item) => (
          <Button 
            key={item.path}
            fullWidth 
            sx={{ 
              justifyContent: 'flex-start', 
              color: location.pathname === item.path ? colors.primary : colors.primaryText,
              backgroundColor: location.pathname === item.path ? colors.hoverBg : 'transparent',
              mb: 1,
              '&:hover': {
                backgroundColor: colors.hoverBg
              }
            }}
            onClick={() => handleTabClick(item.path)}
            startIcon={loading && activeTab === item.path ? 
              <CircularProgress size={20} color="inherit" /> : 
              item.icon
            }
          >
            {item.name}
          </Button>
        ))}
      </Box>
    </SidebarContainer>
  );
};

export default Sidebar;