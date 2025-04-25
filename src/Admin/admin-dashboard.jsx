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
  shadowColor: 'rgba(0, 0, 0, 0.1)',
  accentBlue: '#2196f3'
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
        
        // Set chart loading false after small delay to allow rendering
        setTimeout(() => {
          setLoadingChart(false);
        }, 500);
        
        setLoading(false);
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
  }, []);

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
            <UserInfo>
              <Tooltip title="Notifications">
                <IconButton sx={{ color: colors.secondaryText }}>
                  <NotificationsIcon />
                </IconButton>
              </Tooltip>
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 1,
                py: 1, 
                px: 2, 
                borderRadius: 2,
                backgroundColor: `${colors.hoverBg}50`
              }}>
                <UserAvatar>{user.username.charAt(0).toUpperCase()}</UserAvatar>
                <Typography variant="body2" sx={{ color: colors.primaryText }}>
                  {user.username}
                </Typography>
              </Box>
            </UserInfo>
          </StyledToolbar>
        </StyledAppBar>

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
                        height={100}
                        margin={{ top: 10, bottom: 30, left: 10, right: 10 }}
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
          <Typography variant="h5" sx={{ mb: 2, fontWeight: 600, color: colors.primaryText }}>
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
                  <Typography variant="h6" sx={{ mb: 2, color: colors.primaryText, fontWeight: 600 }}>
                    Recent Activities
                  </Typography>
                  
                  <Box sx={{ 
                    flex: 1, 
                    backgroundColor: `${colors.background}80`, 
                    borderRadius: '8px', 
                    p: 2, 
                    overflowY: 'auto',
                    maxHeight: '300px',
                    border: `1px solid ${colors.borderColor}`
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
                              borderRadius: '6px',
                              backgroundColor: index % 2 === 0 ? `${colors.hoverBg}80` : 'transparent',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 2,
                              transition: 'all 0.2s ease',
                              cursor: 'pointer',
                              '&:hover': {
                                backgroundColor: colors.hoverBg,
                                transform: 'translateX(5px)'
                              }
                            }}
                            onClick={() => navigate(`/UserManagement?userId=${user.user_id}`)}
                            >
                              <Avatar 
                                sx={{ 
                                  bgcolor: index % 3 === 0 ? colors.primary : index % 3 === 1 ? colors.secondary : colors.accentBlue, 
                                  width: 38, 
                                  height: 38,
                                  boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
                                }}
                              >
                                {user.username ? user.username.charAt(0).toUpperCase() : 'U'}
                              </Avatar>
                              <Box sx={{ flex: 1 }}>
                                <Typography variant="body2" sx={{ fontWeight: 500, color: colors.primaryText }}>
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
                                  fontWeight: 500
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
                  <Typography variant="h6" sx={{ mb: 2, color: colors.primaryText, fontWeight: 600 }}>
                    System Health
                  </Typography>
                  
                  <Box sx={{ 
                    flex: 1, 
                    backgroundColor: `${colors.background}80`, 
                    borderRadius: '8px', 
                    p: 2,
                    border: `1px solid ${colors.borderColor}`
                  }}>
                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <Box sx={{ 
                          p: 2, 
                          borderRadius: '8px', 
                          backgroundColor: `${colors.buyGreen}15`,
                          border: `1px solid ${colors.buyGreen}50`,
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          <Typography variant="h6" sx={{ color: colors.buyGreen, fontWeight: 600 }}>
                            Server Status
                          </Typography>
                          <Typography variant="body1" sx={{ color: colors.primaryText, display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Box sx={{ 
                              width: 12, 
                              height: 12, 
                              borderRadius: '50%', 
                              backgroundColor: colors.buyGreen,
                              boxShadow: `0 0 10px ${colors.buyGreen}`
                            }} />
                            Operational
                          </Typography>
                        </Box>
                      </Grid>
                      
                      <Grid item xs={6}>
                        <Box sx={{ 
                          p: 2, 
                          borderRadius: '8px', 
                          backgroundColor: `${colors.accentBlue}15`,
                          border: `1px solid ${colors.accentBlue}50`,
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          <Typography variant="h6" sx={{ color: colors.accentBlue, fontWeight: 600 }}>
                            API Status
                          </Typography>
                          <Typography variant="body1" sx={{ color: colors.primaryText, display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Box sx={{ 
                              width: 12, 
                              height: 12, 
                              borderRadius: '50%', 
                              backgroundColor: colors.accentBlue,
                              boxShadow: `0 0 10px ${colors.accentBlue}`
                            }} />
                            Active
                          </Typography>
                        </Box>
                      </Grid>
                      
                      <Grid item xs={12}>
                        <Box sx={{ 
                          mt: 1,
                          p: 2, 
                          borderRadius: '8px', 
                          backgroundColor: colors.hoverBg,
                          border: `1px solid ${colors.borderColor}`,
                        }}>
                          <Typography variant="subtitle2" sx={{ color: colors.secondaryText, mb: 1 }}>
                            Quick Actions
                          </Typography>
                          <Button 
                            variant="outlined" 
                            size="small" 
                            fullWidth
                            onClick={() => navigate('/UserManagement')}
                            sx={{ 
                              mb: 1,
                              borderColor: colors.primary,
                              color: colors.primary,
                              '&:hover': {
                                backgroundColor: `${colors.primary}15`,
                                borderColor: colors.primary
                              }
                            }}
                          >
                            Manage Users
                          </Button>
                          <Button 
                            variant="outlined" 
                            size="small" 
                            fullWidth 
                            onClick={() => navigate('/adminsettings')}
                            sx={{ 
                              borderColor: colors.secondary,
                              color: colors.secondary,
                              '&:hover': {
                                backgroundColor: `${colors.secondary}15`,
                                borderColor: colors.secondary
                              }
                            }}
                          >
                            System Settings
                          </Button>
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