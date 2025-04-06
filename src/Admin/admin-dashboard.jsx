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
  Chip
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
  const [anchorEl, setAnchorEl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/login');
          return;
        }

        // Fetch user data
        const userResponse = await axios.get('http://localhost:5000/api/auth/me', {
          headers: {
            'Authorization': token
          }
        });

        if (!userResponse.data || !userResponse.data.user) {
          throw new Error('Invalid user data received');
        }

        setUser(userResponse.data.user);

        // If admin, fetch all data
        if (userResponse.data.user.role === 'admin') {
          try {
            // Fetch users
            const usersResponse = await axios.get('http://localhost:5000/api/admin/users', {
              headers: {
                'Authorization': token
              }
            });

            setUsers(usersResponse.data.users);
            setUserCount(usersResponse.data.users.length);

            // Fetch user growth data
            const growthResponse = await axios.get('http://localhost:5000/api/admin/user-growth', {
              headers: {
                'Authorization': token
              }
            });
            
            if (growthResponse.data.success) {
              setUserGrowthData(growthResponse.data.data);
            }

            // Fetch favorite symbols data
            const symbolsResponse = await axios.get('http://localhost:5000/api/admin/favorite-symbols', {
              headers: {
                'Authorization': token
              }
            });

            if (symbolsResponse.data.status === 'success') {
              setFavoriteSymbolsData(symbolsResponse.data.data);
            }

            // Fetch market trends data
            const trendsResponse = await axios.get('http://localhost:5000/api/market-trends', {
              headers: {
                'Authorization': token
              }
            });

            if (trendsResponse.data.status === 'success') {
              setMarketTrendsData(trendsResponse.data.data);
            }
          } catch (err) {
            console.error('Error fetching admin data:', err);
            setError('Failed to load admin data');
          } finally {
            setLoadingChart(false);
          }
        } else {
          // If not admin, redirect to appropriate dashboard
          navigate(userResponse.data.user.role === 'user' ? '/user-dashboard' : '/');
        }
      } catch (err) {
        console.error('Authentication error:', err);
        if (err.response?.status === 401) {
          // Only logout if it's an authentication error
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          navigate('/login');
        } else {
          setError(err.message || 'Failed to load dashboard');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/home');
  };

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
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
      value: userCount ? `${userCount.toLocaleString()}` : "Loading...",
      period: "Total registered users",
      icon: <PeopleIcon sx={{ color: colors.primary }} />,
      chart: true
    },
    { 
      title: "Favorite Symbols", 
      value: favoriteSymbolsData.length ? `${favoriteSymbolsData.length} symbols` : "Loading...",
      period: "Top symbols by user favorites",
      icon: <StarIcon sx={{ color: colors.secondary }} />,
      chart: true,
      chartType: 'bar'
    },
    { 
      title: "Market Trends", 
      value: marketTrendsData ? `${marketTrendsData.overall_trend.charAt(0).toUpperCase() + marketTrendsData.overall_trend.slice(1)}` : "Loading...",
      period: "Overall market sentiment",
      icon: marketTrendsData ? getTrendIcon(marketTrendsData.overall_trend) : <TrendingFlatIcon sx={{ color: colors.secondaryText }} />,
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
            <Button 
              onClick={handleMenuOpen}
                sx={{ 
                  color: colors.primaryText,
                  textTransform: 'none',
                  fontWeight: 'medium',
                  '&:hover': {
                    backgroundColor: 'transparent'
                  }
                }}
            >
              {user.username}
            </Button>
              <UserAvatar>{user.username.charAt(0).toUpperCase()}</UserAvatar>
            </UserInfo>
          </StyledToolbar>
        </StyledAppBar>

        <StyledMenu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleMenuClose}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'right',
          }}
          transformOrigin={{
            vertical: 'top',
            horizontal: 'right',
          }}
        >
          <StyledMenuItem onClick={handleMenuClose}>
            <PersonIcon sx={{ mr: 1, fontSize: 20 }} /> Profile
          </StyledMenuItem>
          <StyledMenuItem onClick={handleMenuClose}>
            <SettingsIcon sx={{ mr: 1, fontSize: 20 }} /> Settings
          </StyledMenuItem>
          <StyledDivider />
          <StyledMenuItem onClick={handleLogout}>
            <LogoutIcon sx={{ mr: 1, fontSize: 20 }} /> Logout
          </StyledMenuItem>
        </StyledMenu>

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
                          data: userGrowthData.map(item => item.count),
                          color: colors.primary,
                          area: true,
                          showMark: false
                        }
                      ]}
                      xAxis={[{ 
                        data: userGrowthData.map(item => item.date),
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
      </MainContent>
    </DashboardContainer>
  );
};

export default AdminDashboard;