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
  Alert
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
  Area
} from 'recharts';
import {
  Download as DownloadIcon,
  FilterList as FilterListIcon,
  Refresh as RefreshIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  ShowChart as ShowChartIcon,
  PeopleAlt as PeopleAltIcon,
  CurrencyExchange as CurrencyExchangeIcon
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

// Sample data for demo purposes (replace with real API responses later)
const generateSampleData = () => {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const currentMonth = new Date().getMonth();
  
  return Array(12).fill().map((_, i) => {
    const month = months[(currentMonth - 11 + i) % 12];
    return {
      name: month,
      users: Math.floor(Math.random() * 50) + 50,
      transactions: Math.floor(Math.random() * 200) + 100,
      volume: Math.floor(Math.random() * 10000) + 5000,
    };
  });
};

const generateMarketData = () => {
  return [
    { name: 'BTC/USD', value: 35, color: colors.buyGreen },
    { name: 'ETH/USD', value: 25, color: colors.primary },
    { name: 'EUR/USD', value: 20, color: colors.secondary },
    { name: 'GBP/USD', value: 15, color: colors.accentBlue },
    { name: 'JPY/USD', value: 5, color: colors.warningOrange }
  ];
};

const ReportPage = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeframe, setTimeframe] = useState('month');
  const [reportType, setReportType] = useState(0);
  const [chartData, setChartData] = useState([]);
  const [marketData, setMarketData] = useState([]);
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    totalTransactions: 0,
    tradingVolume: 0,
    growthRate: 0
  });

  useEffect(() => {
    fetchReportData();
  }, [timeframe, reportType]);

  const fetchReportData = async () => {
    setLoading(true);
    try {
      // In a real app, this would be API calls to fetch the data
      // For demo purposes, we'll use generated sample data
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const data = generateSampleData();
      const markets = generateMarketData();
      
      setChartData(data);
      setMarketData(markets);
      
      // Calculate summary stats
      const lastIndex = data.length - 1;
      const prevIndex = data.length - 2;
      
      const currentUsers = data[lastIndex].users;
      const prevUsers = data[prevIndex].users;
      const growthRate = ((currentUsers - prevUsers) / prevUsers) * 100;
      
      const totalTransactions = data.reduce((sum, item) => sum + item.transactions, 0);
      const totalVolume = data.reduce((sum, item) => sum + item.volume, 0);
      
      setStats({
        totalUsers: currentUsers,
        activeUsers: Math.floor(currentUsers * 0.7),
        totalTransactions,
        tradingVolume: totalVolume,
        growthRate: growthRate.toFixed(1)
      });
      
      setLoading(false);
    } catch (err) {
      console.error('Error fetching report data:', err);
      setError('Failed to load report data');
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

  return (
    <PageContainer>
      <Sidebar />
      <MainContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
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
            
            <Tooltip title="Export Report">
              <IconButton
                sx={{
                  color: colors.secondary,
                  '&:hover': {
                    backgroundColor: `${colors.secondary}20`
                  }
                }}
              >
                <DownloadIcon />
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
          <Grid item xs={12} sm={6} md={3}>
            <StatCard>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
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
          
          <Grid item xs={12} sm={6} md={3}>
            <StatCard>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
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
          
          <Grid item xs={12} sm={6} md={3}>
            <StatCard>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                  <Typography variant="h6" sx={{ color: colors.secondaryText, fontSize: '0.9rem' }}>
                    Transactions
                  </Typography>
                  <Box 
                    sx={{ 
                      p: 1, 
                      borderRadius: '8px', 
                      backgroundColor: `${colors.secondary}20`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <ShowChartIcon sx={{ color: colors.secondary, fontSize: '1.2rem' }} />
                  </Box>
                </Box>
                
                <Typography variant="h4" sx={{ color: colors.primaryText, fontWeight: 600, mb: 1 }}>
                  {loading ? <CircularProgress size={24} sx={{ color: colors.secondary }} /> : stats.totalTransactions.toLocaleString()}
                </Typography>
                
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Typography variant="body2" sx={{ color: colors.secondaryText }}>
                    Lifetime transactions
                  </Typography>
                </Box>
              </CardContent>
            </StatCard>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <StatCard>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                  <Typography variant="h6" sx={{ color: colors.secondaryText, fontSize: '0.9rem' }}>
                    Trading Volume
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
                    <CurrencyExchangeIcon sx={{ color: colors.accentBlue, fontSize: '1.2rem' }} />
                  </Box>
                </Box>
                
                <Typography variant="h4" sx={{ color: colors.primaryText, fontWeight: 600, mb: 1 }}>
                  {loading ? (
                    <CircularProgress size={24} sx={{ color: colors.accentBlue }} />
                  ) : (
                    `$${stats.tradingVolume.toLocaleString()}`
                  )}
                </Typography>
                
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Typography variant="body2" sx={{ color: colors.secondaryText }}>
                    Total volume
                  </Typography>
                </Box>
              </CardContent>
            </StatCard>
          </Grid>
        </Grid>
        
        {/* Report Type Tabs */}
        <StyledTabs value={reportType} onChange={handleReportTypeChange}>
          <StyledTab label="User Growth" />
          <StyledTab label="Transaction Volume" />
          <StyledTab label="Market Distribution" />
        </StyledTabs>
        
        {/* Report Content */}
        <Grid container spacing={3}>
          {/* Main Chart */}
          <Grid item xs={12} md={8}>
            <StyledCard>
              <Typography variant="h6" sx={{ mb: 2, color: colors.primaryText, fontWeight: 600 }}>
                {reportType === 0 ? 'User Growth Trend' : 
                 reportType === 1 ? 'Transaction Volume Trend' : 
                 'Market Activity Trend'}
              </Typography>
              
              {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 300 }}>
                  <CircularProgress size={40} sx={{ color: colors.primary }} />
                </Box>
              ) : (
                <ResponsiveContainer width="100%" height={350}>
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
                      />
                    </AreaChart>
                  ) : reportType === 1 ? (
                    <BarChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
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
                        dataKey="transactions" 
                        fill={colors.secondary} 
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  ) : (
                    <LineChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
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
                      <Line 
                        type="monotone" 
                        dataKey="volume" 
                        stroke={colors.accentBlue} 
                        strokeWidth={2}
                        dot={{ r: 4, fill: colors.accentBlue }}
                        activeDot={{ r: 6, fill: colors.accentBlue }}
                      />
                    </LineChart>
                  )}
                </ResponsiveContainer>
              )}
            </StyledCard>
          </Grid>
          
          {/* Secondary Chart/Table */}
          <Grid item xs={12} md={4}>
            <StyledCard sx={{ height: '100%' }}>
              <Typography variant="h6" sx={{ mb: 2, color: colors.primaryText, fontWeight: 600 }}>
                {reportType === 0 ? 'User Device Distribution' : 
                 reportType === 1 ? 'Transaction Types' : 
                 'Most Active Markets'}
              </Typography>
              
              {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 300 }}>
                  <CircularProgress size={40} sx={{ color: colors.primary }} />
                </Box>
              ) : (
                <ResponsiveContainer width="100%" height={350}>
                  <PieChart>
                    <Pie
                      data={marketData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
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
                </ResponsiveContainer>
              )}
              
              <Box sx={{ mt: 2, textAlign: 'center' }}>
                <Button
                  variant="outlined"
                  startIcon={<DownloadIcon />}
                  sx={{
                    borderColor: colors.primary,
                    color: colors.primary,
                    '&:hover': {
                      backgroundColor: `${colors.primary}20`,
                      borderColor: colors.primary
                    }
                  }}
                >
                  Export {reportType === 0 ? 'User' : reportType === 1 ? 'Transaction' : 'Market'} Report
                </Button>
              </Box>
            </StyledCard>
          </Grid>
        </Grid>
      </MainContent>
    </PageContainer>
  );
};

export default ReportPage; 