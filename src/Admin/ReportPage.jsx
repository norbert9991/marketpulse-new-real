import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  CircularProgress,
  Button,
  TextField,
  MenuItem,
  IconButton,
  Tooltip,
  Tabs,
  Tab,
  Divider,
  Alert,
  Chip
} from '@mui/material';
import { styled } from '@mui/system';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  Legend, 
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis
} from 'recharts';
import {
  Download as DownloadIcon,
  FilterList as FilterListIcon,
  Refresh as RefreshIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  ShowChart as ShowChartIcon,
  PeopleAlt as PeopleAltIcon,
  CurrencyExchange as CurrencyExchangeIcon,
  BarChart as BarChartIcon,
  StackedBarChart as StackedBarChartIcon,
  DonutLarge as DonutLargeIcon
} from '@mui/icons-material';
import { API } from '../axiosConfig';
import Sidebar from './Sidebar';

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
  accentBlue: '#2196f3',
  warningOrange: '#FFA726'
};

const PageContainer = styled('div')({
  display: 'flex',
  minHeight: '100vh',
  backgroundColor: colors.background,
  color: colors.primaryText
});

const MainContent = styled('div')({
  flexGrow: 1,
  padding: '24px',
  marginLeft: '250px' // Match sidebar width
});

const StyledCard = styled(Paper)({
  padding: '20px',
  backgroundColor: colors.cardBg,
  border: `1px solid ${colors.borderColor}`,
  borderRadius: '10px',
  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
  height: '100%'
});

const StyledTabs = styled(Tabs)({
  marginBottom: '24px',
  '& .MuiTabs-indicator': {
    backgroundColor: colors.primary,
  },
});

const StyledTab = styled(Tab)({
  color: colors.secondaryText,
  '&.Mui-selected': {
    color: colors.primary,
  },
  textTransform: 'none',
  minWidth: '80px'
});

const StatCard = styled(Card)({
  backgroundColor: colors.cardBg,
  border: `1px solid ${colors.borderColor}`,
  borderRadius: '10px',
  height: '100%',
  transition: 'transform 0.2s',
  '&:hover': {
    transform: 'translateY(-5px)',
    boxShadow: '0 8px 16px rgba(0, 0, 0, 0.2)'
  }
});

const TrendChip = styled(Chip)(({ theme, trend }) => ({
  backgroundColor: 
    trend === 'bullish' ? `${colors.buyGreen}20` :
    trend === 'bearish' ? `${colors.sellRed}20` : 
    `${colors.warningOrange}20`,
  color: 
    trend === 'bullish' ? colors.buyGreen :
    trend === 'bearish' ? colors.sellRed : 
    colors.warningOrange,
  fontWeight: 'bold',
  fontSize: '0.75rem',
  height: '24px'
}));

const ReportPage = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeframe, setTimeframe] = useState('month');
  const [reportType, setReportType] = useState(0);
  const [chartData, setChartData] = useState([]);
  const [marketData, setMarketData] = useState([]);
  const [marketTrendsData, setMarketTrendsData] = useState({
    overall_trend: 'neutral',
    bullish_percentage: 33,
    bearish_percentage: 33,
    neutral_percentage: 34,
    total_symbols: 0
  });
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    growthRate: 0
  });

  useEffect(() => {
    fetchReportData();
  }, [timeframe, reportType]);

  const fetchReportData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Use real API endpoints instead of mock data
      const [usersResponse, growthResponse, symbolsResponse, trendsResponse] = await Promise.all([
        API.admin.getUsers(),
        API.admin.getUserGrowth(),
        API.admin.getFavoriteSymbols(),
        API.admin.getMarketTrends()
      ]);
      
      // Process user growth data for charts
      const growthData = growthResponse.data?.data || [];
      
      // Transform the growth data into the format needed for the charts
      const formattedChartData = growthData.map(item => ({
        name: item.date || item.period || item.month || 'N/A',
        users: item.count || item.users || 0
      }));
      
      setChartData(formattedChartData);
      
      // Process favorite symbols data for market distribution
      const symbolsData = symbolsResponse.data?.data || [];
      
      // Transform symbols data into the format needed for pie charts
      const colorPalette = [colors.primary, colors.secondary, colors.buyGreen, colors.accentBlue, colors.warningOrange];
      const formattedMarketData = symbolsData.slice(0, 5).map((item, index) => {
        return {
          name: item.symbol || `Symbol ${index + 1}`,
          value: item.count || Math.floor(Math.random() * 30) + 10,
          color: colorPalette[index % colorPalette.length]
        };
      });
      
      setMarketData(formattedMarketData);
      
      // Process market trends data
      const trendsData = trendsResponse.data?.data || {
        overall_trend: 'neutral',
        bullish_percentage: 33,
        bearish_percentage: 33,
        neutral_percentage: 34,
        total_symbols: 30
      };
      
      setMarketTrendsData(trendsData);
      
      // Create radar chart data from market trends
      const radarData = [
        {
          subject: 'Bullish',
          A: trendsData.bullish_percentage,
          fullMark: 100,
          fill: colors.buyGreen
        },
        {
          subject: 'Bearish',
          A: trendsData.bearish_percentage,
          fullMark: 100,
          fill: colors.sellRed
        },
        {
          subject: 'Neutral',
          A: trendsData.neutral_percentage,
          fullMark: 100,
          fill: colors.warningOrange
        }
      ];
      
      // Calculate summary stats from the real data
      const users = usersResponse.data?.users || [];
      const currentUserCount = users.length;
      
      // Try to calculate growth rate from the growth data if available
      let growthRate = 0;
      if (growthData.length >= 2) {
        const lastIndex = growthData.length - 1;
        const prevIndex = growthData.length - 2;
        const currentUsers = growthData[lastIndex].count || growthData[lastIndex].users || 0;
        const prevUsers = growthData[prevIndex].count || growthData[prevIndex].users || 0;
        if (prevUsers > 0) {
          growthRate = ((currentUsers - prevUsers) / prevUsers) * 100;
        }
      }
      
      // Calculate active users (this might come from a different endpoint in a real app)
      // For now, we're estimating based on user data
      const activeUserCount = users.filter(user => {
        // Consider a user active if they have logged in within the last month
        // This is a placeholder logic - in a real app, you'd use actual login data
        if (user.last_login) {
          const lastLoginDate = new Date(user.last_login);
          const oneMonthAgo = new Date();
          oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
          return lastLoginDate > oneMonthAgo;
        }
        return false;
      }).length;
      
      setStats({
        totalUsers: currentUserCount,
        activeUsers: activeUserCount || Math.floor(currentUserCount * 0.7), // Fallback if active user data isn't available
        growthRate: growthRate.toFixed(1)
      });
      
      setLoading(false);
    } catch (err) {
      console.error('Error fetching report data:', err);
      setError('Failed to load report data. Please check your connection and try again.');
      setLoading(false);
    }
  };

  const handleReportTypeChange = (event, newValue) => {
    setReportType(newValue);
  };

  const handleTimeframeChange = (event) => {
    setTimeframe(event.target.value);
  };

  const COLORS = [colors.primary, colors.secondary, colors.buyGreen, colors.accentBlue, colors.warningOrange];

  // Format market trend data for display
  const marketTrendBarData = [
    { name: 'Bullish', value: marketTrendsData.bullish_percentage, color: colors.buyGreen },
    { name: 'Neutral', value: marketTrendsData.neutral_percentage, color: colors.warningOrange },
    { name: 'Bearish', value: marketTrendsData.bearish_percentage, color: colors.sellRed }
  ];

  return (
    <PageContainer>
      <Sidebar />
      <MainContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-evenly', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" sx={{ color: colors.primaryText, fontWeight: 600 }}>Analytics & Reports</Typography>
          
          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField
              select
              size="small"
              value={timeframe}
              onChange={handleTimeframeChange}
              sx={{
                minWidth: 120,
                '& .MuiInputBase-root': {
                  color: colors.primaryText,
                  backgroundColor: colors.cardBg,
                  borderColor: colors.borderColor,
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: colors.borderColor
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: colors.primary
                  }
                }
              }}
            >
              <MenuItem value="week">Last Week</MenuItem>
              <MenuItem value="month">Last Month</MenuItem>
              <MenuItem value="quarter">Last Quarter</MenuItem>
              <MenuItem value="year">Last Year</MenuItem>
            </TextField>
            
            <Tooltip title="Refresh Data">
              <IconButton 
                onClick={fetchReportData}
                sx={{
                  color: colors.primary,
                  '&:hover': {
                    backgroundColor: `${colors.primary}20`
                  }
                }}
              >
                <RefreshIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
        
        {error && (
          <Alert severity="error" sx={{ mb: 3, backgroundColor: `${colors.sellRed}22`, color: colors.sellRed }}>
            {error}
          </Alert>
        )}
        
        {/* Summary Stats Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={4}>
            <StatCard>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-evenly', alignItems: 'flex-start', mb: 2 }}>
                  <Typography variant="h6" sx={{ color: colors.secondaryText, fontSize: '0.9rem' }}>
                    Total Users
                  </Typography>
                  <Box 
                    sx={{ 
                      p: 1, 
                      borderRadius: '8px', 
                      backgroundColor: `${colors.primary}20`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <PeopleAltIcon sx={{ color: colors.primary, fontSize: '1.2rem' }} />
                  </Box>
                </Box>
                
                <Typography variant="h4" sx={{ color: colors.primaryText, fontWeight: 600, mb: 1 }}>
                  {loading ? <CircularProgress size={24} sx={{ color: colors.primary }} /> : stats.totalUsers}
                </Typography>
                
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  {stats.growthRate > 0 ? (
                    <TrendingUpIcon sx={{ color: colors.buyGreen, mr: 0.5, fontSize: '1rem' }} />
                  ) : (
                    <TrendingDownIcon sx={{ color: colors.sellRed, mr: 0.5, fontSize: '1rem' }} />
                  )}
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      color: stats.growthRate > 0 ? colors.buyGreen : colors.sellRed,
                      fontWeight: 500
                    }}
                  >
                    {stats.growthRate}% from last period
                  </Typography>
                </Box>
              </CardContent>
            </StatCard>
          </Grid>
          
          <Grid item xs={12} sm={6} md={4}>
            <StatCard>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-evenly', alignItems: 'flex-start', mb: 2 }}>
                  <Typography variant="h6" sx={{ color: colors.secondaryText, fontSize: '0.9rem' }}>
                    Active Users
                  </Typography>
                  <Box 
                    sx={{ 
                      p: 1, 
                      borderRadius: '8px', 
                      backgroundColor: `${colors.buyGreen}20`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <PeopleAltIcon sx={{ color: colors.buyGreen, fontSize: '1.2rem' }} />
                  </Box>
                </Box>
                
                <Typography variant="h4" sx={{ color: colors.primaryText, fontWeight: 600, mb: 1 }}>
                  {loading ? <CircularProgress size={24} sx={{ color: colors.buyGreen }} /> : stats.activeUsers}
                </Typography>
                
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Typography variant="body2" sx={{ color: colors.secondaryText }}>
                    {Math.round((stats.activeUsers / stats.totalUsers) * 100)}% of total users
                  </Typography>
                </Box>
              </CardContent>
            </StatCard>
          </Grid>
          
          <Grid item xs={12} sm={6} md={4}>
            <StatCard>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-evenly', alignItems: 'flex-start', mb: 2 }}>
                  <Typography variant="h6" sx={{ color: colors.secondaryText, fontSize: '0.9rem' }}>
                    Market Sentiment
                  </Typography>
                  <Box 
                    sx={{ 
                      p: 1, 
                      borderRadius: '8px', 
                      backgroundColor: `${colors.accentBlue}20`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <ShowChartIcon sx={{ color: colors.accentBlue, fontSize: '1.2rem' }} />
                  </Box>
                </Box>
                
                <Typography variant="h4" sx={{ color: colors.primaryText, fontWeight: 600, mb: 1 }}>
                  {loading ? (
                    <CircularProgress size={24} sx={{ color: colors.accentBlue }} />
                  ) : (
                    <TrendChip 
                      trend={marketTrendsData.overall_trend}
                      label={marketTrendsData.overall_trend.toUpperCase()}
                      size="medium"
                    />
                  )}
                </Typography>
                
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-evenly', mt: 2 }}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <Typography variant="body2" sx={{ color: colors.buyGreen, fontWeight: 600 }}>
                      {marketTrendsData.bullish_percentage}%
                    </Typography>
                    <Typography variant="caption" sx={{ color: colors.secondaryText }}>
                      Bullish
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <Typography variant="body2" sx={{ color: colors.warningOrange, fontWeight: 600 }}>
                      {marketTrendsData.neutral_percentage}%
                    </Typography>
                    <Typography variant="caption" sx={{ color: colors.secondaryText }}>
                      Neutral
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <Typography variant="body2" sx={{ color: colors.sellRed, fontWeight: 600 }}>
                      {marketTrendsData.bearish_percentage}%
                    </Typography>
                    <Typography variant="caption" sx={{ color: colors.secondaryText }}>
                      Bearish
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </StatCard>
          </Grid>
        </Grid>
        
        {/* Report Type Tabs */}
        <StyledTabs value={reportType} onChange={handleReportTypeChange}>
          <StyledTab label="User Growth" icon={<BarChartIcon sx={{ fontSize: '1.2rem' }} />} iconPosition="start" />
          <StyledTab label="Market Distribution" icon={<DonutLargeIcon sx={{ fontSize: '1.2rem' }} />} iconPosition="start" />
          <StyledTab label="Market Sentiment" icon={<StackedBarChartIcon sx={{ fontSize: '1.2rem' }} />} iconPosition="start" />
        </StyledTabs>
        
        {/* Report Content */}
        <Grid container spacing={3}>
          {/* Main Chart */}
          <Grid item xs={12}>
            <StyledCard>
              <Typography variant="h6" sx={{ mb: 2, color: colors.primaryText, fontWeight: 600 }}>
                {reportType === 0 ? 'User Growth Trend' : 
                 reportType === 1 ? 'Popular Currency Pairs' : 
                 'Market Sentiment Analysis'}
              </Typography>
              
              {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 600, width: 50 }}>
                  <CircularProgress size={40} sx={{ color: colors.primary }} />
                </Box>
              ) : (
                <ResponsiveContainer width="100%" height={400}>
                  {reportType === 0 ? (
                    <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={colors.primary} stopOpacity={0.8}/>
                          <stop offset="95%" stopColor={colors.primary} stopOpacity={0.1}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke={colors.borderColor} />
                      <XAxis dataKey="name" stroke={colors.secondaryText} />
                      <YAxis stroke={colors.secondaryText} />
                      <RechartsTooltip 
                        contentStyle={{ 
                          backgroundColor: colors.cardBg,
                          borderColor: colors.borderColor,
                          color: colors.primaryText
                        }} 
                      />
                      <Area 
                        type="monotone" 
                        dataKey="users" 
                        stroke={colors.primary} 
                        fillOpacity={1} 
                        fill="url(#colorUsers)" 
                        name="Users"
                      />
                    </AreaChart>
                  ) : reportType === 1 ? (
                    <BarChart data={marketData} margin={{ top: 10, right: 30, left: 20, bottom: 0 }} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke={colors.borderColor} />
                      <XAxis type="number" stroke={colors.secondaryText} />
                      <YAxis dataKey="name" type="category" stroke={colors.secondaryText} width={100} />
                      <RechartsTooltip 
                        contentStyle={{ 
                          backgroundColor: colors.cardBg,
                          borderColor: colors.borderColor,
                          color: colors.primaryText
                        }} 
                      />
                      <Bar 
                        dataKey="value" 
                        name="Users"
                        radius={[0, 4, 4, 0]}
                      >
                        {marketData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  ) : (
                    <BarChart data={marketTrendBarData} margin={{ top: 10, right: 30, left: 20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={colors.borderColor} />
                      <XAxis dataKey="name" stroke={colors.secondaryText} />
                      <YAxis stroke={colors.secondaryText} />
                      <RechartsTooltip 
                        contentStyle={{ 
                          backgroundColor: colors.cardBg,
                          borderColor: colors.borderColor,
                          color: colors.primaryText
                        }} 
                      />
                      <Bar 
                        dataKey="value" 
                        name="Percentage"
                        radius={[4, 4, 0, 0]}
                      >
                        {marketTrendBarData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  )}
                </ResponsiveContainer>
              )}
            </StyledCard>
          </Grid>
          
          {/* Secondary Charts in a row */}
          <Grid container item spacing={3}>
            <Grid item xs={12} md={6}>
              <StyledCard sx={{ height: 600, width: 550 }}>
                <Typography variant="h6" sx={{ mb: 2, color: colors.primaryText, fontWeight: 600 }}>
                  {reportType === 0 ? 'User Distribution by Role' : 
                   reportType === 1 ? 'Currency Pair Distribution' : 
                   'Market Sentiment Breakdown'}
                </Typography>
                
                {loading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 300 }}>
                    <CircularProgress size={40} sx={{ color: colors.primary }} />
                  </Box>
                ) : (
                  <ResponsiveContainer width="100%" height={350}>
                    {reportType === 0 ? (
                      <PieChart>
                        <Pie
                          data={[
                            { name: 'Regular Users', value: stats.totalUsers - 1, color: colors.primary },
                            { name: 'Admins', value: 1, color: colors.secondary }
                          ]}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={120}
                          fill="#8884d8"
                          dataKey="value"
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        >
                          <Cell fill={colors.primary} />
                          <Cell fill={colors.secondary} />
                        </Pie>
                        <Legend />
                        <RechartsTooltip 
                          contentStyle={{ 
                            backgroundColor: colors.cardBg,
                            borderColor: colors.borderColor,
                            color: colors.primaryText
                          }} 
                        />
                      </PieChart>
                    ) : reportType === 1 ? (
                      <PieChart>
                        <Pie
                          data={marketData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={120}
                          fill="#8884d8"
                          dataKey="value"
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        >
                          {marketData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Legend />
                        <RechartsTooltip 
                          contentStyle={{ 
                            backgroundColor: colors.cardBg,
                            borderColor: colors.borderColor,
                            color: colors.primaryText
                          }} 
                        />
                      </PieChart>
                    ) : (
                      <RadarChart cx="50%" cy="50%" outerRadius="70%" data={[
                        { subject: 'Bullish', A: marketTrendsData.bullish_percentage, fullMark: 100 },
                        { subject: 'Neutral', A: marketTrendsData.neutral_percentage, fullMark: 100 },
                        { subject: 'Bearish', A: marketTrendsData.bearish_percentage, fullMark: 100 }
                      ]}>
                        <PolarGrid stroke={colors.borderColor} />
                        <PolarAngleAxis dataKey="subject" stroke={colors.secondaryText} />
                        <PolarRadiusAxis stroke={colors.secondaryText} />
                        <Radar name="Market Sentiment" dataKey="A" stroke={colors.accentBlue} 
                          fill={colors.accentBlue} fillOpacity={0.6} />
                        <RechartsTooltip 
                          contentStyle={{ 
                            backgroundColor: colors.cardBg,
                            borderColor: colors.borderColor,
                            color: colors.primaryText
                          }} 
                        />
                      </RadarChart>
                    )}
                  </ResponsiveContainer>
                )}
              </StyledCard>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <StyledCard sx={{ height: 600, width: 550 }}>
                <Typography variant="h6" sx={{ mb: 2, color: colors.primaryText, fontWeight: 600 }}>
                  {reportType === 0 ? 'Monthly Registration Trend' : 
                   reportType === 1 ? 'Symbol Popularity Trend' : 
                   'Market Trend Distribution'}
                </Typography>
                
                {loading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 300 }}>
                    <CircularProgress size={40} sx={{ color: colors.primary }} />
                  </Box>
                ) : (
                  <ResponsiveContainer width="100%" height={350}>
                    {reportType === 0 ? (
                      <BarChart data={chartData.slice(-6)} margin={{ top: 10, right: 30, left: 20, bottom: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke={colors.borderColor} />
                        <XAxis dataKey="name" stroke={colors.secondaryText} />
                        <YAxis stroke={colors.secondaryText} />
                        <RechartsTooltip 
                          contentStyle={{ 
                            backgroundColor: colors.cardBg,
                            borderColor: colors.borderColor,
                            color: colors.primaryText
                          }} 
                        />
                        <Bar dataKey="users" fill={colors.accentBlue} name="New Users" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    ) : reportType === 1 ? (
                      <BarChart 
                        data={[...marketData].sort((a, b) => b.value - a.value)} 
                        margin={{ top: 10, right: 30, left: 20, bottom: 20 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke={colors.borderColor} />
                        <XAxis dataKey="name" stroke={colors.secondaryText} />
                        <YAxis stroke={colors.secondaryText} />
                        <RechartsTooltip 
                          contentStyle={{ 
                            backgroundColor: colors.cardBg,
                            borderColor: colors.borderColor,
                            color: colors.primaryText
                          }} 
                        />
                        <Bar dataKey="value" fill={colors.secondary} name="Popularity" radius={[4, 4, 0, 0]}>
                          {marketData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Bar>
                      </BarChart>
                    ) : (
                      <PieChart>
                        <Pie
                          data={marketTrendBarData}
                          cx="50%"
                          cy="50%"
                          labelLine={true}
                          outerRadius={120}
                          fill="#8884d8"
                          dataKey="value"
                          label={({ name, value }) => `${name}: ${value}%`}
                        >
                          {marketTrendBarData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Legend />
                        <RechartsTooltip 
                          contentStyle={{ 
                            backgroundColor: colors.cardBg,
                            borderColor: colors.borderColor,
                            color: colors.primaryText
                          }} 
                        />
                      </PieChart>
                    )}
                  </ResponsiveContainer>
                )}
              </StyledCard>
            </Grid>
          </Grid>
        </Grid>
      </MainContent>
    </PageContainer>
  );
};

export default ReportPage; 