// Sidebar.jsx
import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, CircularProgress, Badge, Divider, Avatar, Tooltip } from '@mui/material';
import { styled } from '@mui/system';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  SwapHoriz as TransactionsIcon,
  Assessment as ReportsIcon,
  Settings as SettingsIcon,
  Logout as LogoutIcon,
  Notifications as NotificationsIcon
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
  gradientPrimary: 'linear-gradient(45deg, #1976d2 30%, #2196f3 90%)'
};

const SidebarContainer = styled('div')(({ theme }) => ({
  width: '250px',
  background: colors.background,
  color: colors.primaryText,
  height: '100vh',
  position: 'fixed',
  left: 0,
  top: 0,
  display: 'flex',
  flexDirection: 'column',
  borderRight: `1px solid ${colors.borderColor}`,
  boxShadow: '4px 0 15px rgba(0, 0, 0, 0.1)',
  zIndex: 1200,
  transition: 'width 0.3s ease-in-out'
}));

const SidebarHeader = styled(Box)({
  padding: '24px 20px',
  textAlign: 'center',
  borderBottom: `1px solid ${colors.borderColor}30`,
  marginBottom: '16px'
});

const NavItem = styled(Button)(({ active }) => ({
  justifyContent: 'flex-start',
  padding: '12px 16px',
  margin: '4px 16px',
  color: active ? colors.primary : colors.primaryText,
  backgroundColor: active ? colors.activeItemBg : 'transparent',
  borderRadius: '12px',
  position: 'relative',
  '&:hover': {
    backgroundColor: active ? colors.activeItemBg : colors.hoverBg
  },
  '&::before': active ? {
    content: '""',
    position: 'absolute',
    left: -16,
    top: '50%',
    transform: 'translateY(-50%)',
    width: 4,
    height: '60%',
    backgroundColor: colors.primary,
    borderRadius: '0 4px 4px 0'
  } : {}
}));

const NavIcon = styled(Box)(({ active }) => ({
  color: active ? colors.primary : colors.secondaryText,
  marginRight: '12px',
  display: 'flex',
  alignItems: 'center'
}));

const NavText = styled(Typography)(({ active }) => ({
  color: active ? colors.primary : colors.primaryText,
  fontWeight: active ? 600 : 400,
  transition: 'all 0.2s'
}));

const ProfileSection = styled(Box)({
  marginTop: 'auto',
  padding: '16px',
  borderTop: `1px solid ${colors.borderColor}30`
});

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('');
  const [pendingRequests, setPendingRequests] = useState(0);
  const [user, setUser] = useState(null);

  // Set active tab based on current path when component mounts
  useEffect(() => {
    const currentPath = location.pathname;
    setActiveTab(currentPath);
    
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
  }, [location.pathname]);

  const handleTabClick = (path) => {
    setLoading(true);
    setActiveTab(path);
    
    // Navigate using the router
    navigate(path);
    
    // Reset loading after a short delay
    setTimeout(() => {
      setLoading(false);
    }, 500);
  };
  
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/home');
  };

  const menuItems = [
    { name: 'Dashboard', path: '/admin-dashboard', icon: <DashboardIcon />, badge: null },
    { name: 'Users', path: '/UserManagement', icon: <PeopleIcon />, badge: null },
    { name: 'Transactions', path: '/TransactionPage', icon: <TransactionsIcon />, badge: pendingRequests },
    { name: 'Reports', path: '/ReportPage', icon: <ReportsIcon />, badge: null },
    { name: 'Settings', path: '/adminsettings', icon: <SettingsIcon />, badge: null }
  ];

  return (
    <SidebarContainer>
      <SidebarHeader>
        <Typography variant="h5" sx={{ 
          fontWeight: 'bold', 
          background: colors.gradientPrimary,
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}>
          MARKETPULSE
        </Typography>
        <Typography variant="caption" sx={{ color: colors.secondaryText, textTransform: 'uppercase', letterSpacing: '1.2px' }}>
          Admin Dashboard
        </Typography>
      </SidebarHeader>

      <Box sx={{ flexGrow: 1, overflow: 'auto', pb: 2 }}>
        {menuItems.map((item) => (
          <NavItem
            key={item.path}
            fullWidth
            active={location.pathname === item.path ? 1 : 0}
            onClick={() => handleTabClick(item.path)}
            startIcon={
              <NavIcon active={location.pathname === item.path ? 1 : 0}>
                {loading && activeTab === item.path ? 
                  <CircularProgress size={20} color="inherit" /> : 
                  item.icon
                }
              </NavIcon>
            }
          >
            <NavText active={location.pathname === item.path ? 1 : 0} variant="body2">
              {item.name}
            </NavText>
            {item.badge > 0 && (
              <Badge 
                badgeContent={item.badge} 
                color="error" 
                sx={{ ml: 'auto' }}
              />
            )}
          </NavItem>
        ))}
      </Box>
      
      <ProfileSection>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Avatar 
            src={user?.profile_image || undefined}
            alt={user?.username || 'Admin'} 
            sx={{ 
              width: 42, 
              height: 42, 
              bgcolor: colors.secondary,
              border: `2px solid ${colors.borderColor}`
            }}
          >
            {user?.username ? user.username.charAt(0).toUpperCase() : 'A'}
          </Avatar>
          <Box sx={{ ml: 1.5 }}>
            <Typography variant="body2" sx={{ fontWeight: 500, color: colors.primaryText }}>
              {user?.username || 'Admin User'}
            </Typography>
            <Typography variant="caption" sx={{ color: colors.secondaryText }}>
              {user?.role || 'Admin'} • Online
            </Typography>
          </Box>
        </Box>
        
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="Notifications">
            <Button 
              variant="outlined"
              size="small"
              sx={{ 
                minWidth: 0, 
                padding: '6px', 
                borderRadius: '8px',
                color: colors.secondaryText,
                borderColor: colors.borderColor,
                flex: 1,
                '&:hover': {
                  borderColor: colors.primary,
                  backgroundColor: `${colors.primary}15`
                }
              }}
            >
              <NotificationsIcon fontSize="small" />
            </Button>
          </Tooltip>
          
          <Tooltip title="Logout">
            <Button 
              variant="outlined"
              size="small"
              onClick={handleLogout}
              sx={{ 
                minWidth: 0, 
                padding: '6px', 
                borderRadius: '8px',
                color: colors.sellRed,
                borderColor: colors.borderColor,
                flex: 1,
                '&:hover': {
                  borderColor: colors.sellRed,
                  backgroundColor: `${colors.sellRed}15`
                }
              }}
            >
              <LogoutIcon fontSize="small" />
            </Button>
          </Tooltip>
        </Box>
      </ProfileSection>
    </SidebarContainer>
  );
};

export default Sidebar;