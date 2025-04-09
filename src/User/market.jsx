import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  Box, 
  Typography, 
  Paper, 
  Grid,
  Tabs,
  Tab,
  IconButton,
  Tooltip,
  Chip,
  Divider,
  Button,
  CircularProgress,
  Select,
  MenuItem
} from '@mui/material';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as ChartTooltip, 
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar
} from 'recharts';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import InfoIcon from '@mui/icons-material/Info';
import SettingsIcon from '@mui/icons-material/Settings';
import Sidebar from './Sidebar';
import { API } from '../axiosConfig';

// Forex Trading Color Palette
const colors = {
  darkBg: '#0A0C14',
  panelBg: '#141620',
  cardBg: '#1E2235',
  primaryText: '#FFFFFF',
  secondaryText: '#A0A5B8',
  buyGreen: '#00E676',
  sellRed: '#FF3D57',
  accentBlue: '#2196F3',
  warningOrange: '#FFA726',
  profitGreen: '#00C853',
  lossRed: '#D50000',
  gradientStart: '#2196F3',
  gradientEnd: '#00E676',
  hoverBg: 'rgba(33, 150, 243, 0.1)',
  borderColor: '#2A2F45',
  shadowColor: 'rgba(0, 0, 0, 0.3)'
};

// Mock data for various indicators
const mockData = {
  priceHistory: [
    { time: '00:00', price: 1.0850, volume: 1200 },
    { time: '04:00', price: 1.0875, volume: 1500 },
    { time: '08:00', price: 1.0860, volume: 1800 },
    { time: '12:00', price: 1.0890, volume: 2000 },
    { time: '16:00', price: 1.0880, volume: 1600 },
    { time: '20:00', price: 1.0900, volume: 1400 }
  ],
  technicalIndicators: {
    rsi: 65.5,
    macd: 0.0023,
    macdSignal: 0.0018,
    macdHist: 0.0005,
    sma20: 1.0875,
    sma50: 1.0860,
    sma200: 1.0845
  },
  sentimentAnalysis: {
    overall: 'Bullish',
    confidence: 75,
    newsSentiment: 0.8,
    socialSentiment: 0.7,
    marketMood: 'Positive'
  },
  supportResistance: {
    support: [1.0850, 1.0820, 1.0800],
    resistance: [1.0900, 1.0920, 1.0950]
  }
};

const Market = () => {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();
  const [selectedTab, setSelectedTab] = useState(0);
  const [analysisData, setAnalysisData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedPair, setSelectedPair] = useState('EURUSD=X');
  const [isFavorite, setIsFavorite] = useState(false);
  const [favoriteMessage, setFavoriteMessage] = useState('');
  const [showFavoriteAlert, setShowFavoriteAlert] = useState(false);

  // Add a ref to track if we've already logged sentiment messages
  const sentimentLoggedRef = useRef(false);

  const currencyPairs = [
    { value: 'EURUSD=X', label: 'EUR/USD' },
    { value: 'GBPUSD=X', label: 'GBP/USD' },
    { value: 'USDJPY=X', label: 'USD/JPY' },
    { value: 'AUDUSD=X', label: 'AUD/USD' },
    { value: 'USDCAD=X', label: 'USD/CAD' },
    { value: 'NZDUSD=X', label: 'NZD/USD' },
    { value: 'USDCHF=X', label: 'USD/CHF' }
  ];

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await API.auth.me();
        setUser(response.data.user);
      } catch (error) {
        console.error('Error fetching user data:', error);
        // Handle auth error
      }
    };
    
    fetchUser();
  }, [navigate]);

  useEffect(() => {
    const checkIfFavorite = async () => {
      try {
        // Handle case where selectedPair might be an object
        let pairSymbol = selectedPair;
        
        if (typeof selectedPair === 'object' && selectedPair !== null) {
          pairSymbol = selectedPair.value || 'EURUSD=X';
          console.warn('Selected pair is object in favorite check, using value:', pairSymbol);
        }
        
        // Handle case where the symbol might have -X suffix
        const cleanSymbol = typeof pairSymbol === 'string' && pairSymbol.includes('-X') 
          ? pairSymbol.split('-X')[0] 
          : pairSymbol;
          
        console.log('Checking favorite status for clean symbol:', cleanSymbol);
        
        const response = await API.favorites.check(cleanSymbol);
        setIsFavorite(response.data.isFavorite);
      } catch (error) {
        console.error('Error checking favorite status:', error);
      }
    };
    
    if (user) {
      checkIfFavorite();
    }
  }, [selectedPair, user]);

  // Initial data fetch when component mounts
  useEffect(() => {
    if (user && selectedPair) {
      console.log('Initial load - fetching market analysis for:', selectedPair);
      fetchMarketAnalysis();
    }
  }, [user]); // Only run when user changes

  const handleTabChange = (event, newValue) => {
    setSelectedTab(newValue);
  };

  const handlePairChange = (event) => {
    // Make sure we're getting a string value, not an object
    let newPair = event.target.value;
    
    // If it's an object with a value property, use that instead
    if (typeof newPair === 'object' && newPair !== null) {
      console.warn('Selected pair is an object instead of string:', newPair);
      newPair = newPair.value || 'EURUSD=X';
    }
    
    console.log('Setting new pair to:', newPair);
    setSelectedPair(newPair);
    
    // Reset data when changing pairs
    setAnalysisData(null);
    setError(null);
    
    // Automatically fetch analysis data for the new pair
    setTimeout(() => {
      fetchMarketAnalysis(newPair);
    }, 100);
  };

  const fetchMarketAnalysis = async (symbolToFetch = selectedPair) => {
    try {
      setLoading(true);
      
      // Try to fetch market analysis
      console.log(`Attempting to analyze symbol: ${symbolToFetch}`);
      const response = await API.market.analyze({ symbol: symbolToFetch });
      
      // Create a comprehensive response for UI rendering
      const completeResponse = {
        ...response.data,
        // Ensure these objects exist
        technical_indicators: response.data.technical_indicators || {},
        support_resistance: response.data.support_resistance || { support: [], resistance: [] },
        sentiment: response.data.sentiment || {}
      };
      
      // Format support_resistance data correctly
      // This handles both formats: {support: [...], resistance: [...]} and {support_resistance: {support: [...], resistance: [...]}}
      if (response.data.support_resistance) {
        console.log('Original support_resistance data:', response.data.support_resistance);
        
        // Extract the values if they're in arrays of objects with level_value property
        if (Array.isArray(response.data.support_resistance.support)) {
          const supportValues = response.data.support_resistance.support.map(item => 
            typeof item === 'object' && item.level_value ? parseFloat(item.level_value) : item
          );
          completeResponse.support_resistance.support = supportValues;
        }
        
        if (Array.isArray(response.data.support_resistance.resistance)) {
          const resistanceValues = response.data.support_resistance.resistance.map(item => 
            typeof item === 'object' && item.level_value ? parseFloat(item.level_value) : item
          );
          completeResponse.support_resistance.resistance = resistanceValues;
        }
      }
      
      // Make sure support_resistance has proper arrays
      if (!completeResponse.support_resistance.support) {
        completeResponse.support_resistance.support = [];
      }
      if (!completeResponse.support_resistance.resistance) {
        completeResponse.support_resistance.resistance = [];
      }
      
      // Add missing historical data if needed
      if (!completeResponse.historical_data || !completeResponse.historical_data.prices || !completeResponse.historical_data.dates) {
        console.warn('API response missing historical data structure:', response.data);
        completeResponse.historical_data = {
          prices: [1.0, 1.01, 1.02, 1.03, 1.04, 1.05],
          dates: ['Day 1', 'Day 2', 'Day 3', 'Day 4', 'Day 5', 'Day 6']
        };
      }
      
      // Log the complete data for debugging
      console.log('Processed market analysis data:', completeResponse);
      
      setAnalysisData(completeResponse);
      setError(null);
    } catch (error) {
      console.error('Error fetching market data:', error);
      
      // Create a helpful error message based on the error response
      if (error.response?.status === 404) {
        if (error.response?.data?.error?.includes('No data available for this symbol')) {
          setError(`No data available for ${symbolToFetch}. This currency pair may be temporarily unavailable or delisted.`);
        } else {
          setError(`Unable to analyze ${symbolToFetch}. Please try another currency pair.`);
        }
      } else if (error.response?.status === 500) {
        setError('The server encountered an error. Please try again later.');
      } else {
        setError('Failed to load market data. Please try again or select a different currency pair.');
      }
      
      // Provide comprehensive mock data structure to prevent UI errors
      setAnalysisData({
        symbol: symbolToFetch,
        current_price: 0,
        trend: 'Neutral',
        slope: 0,
        predictions: [0.1, 0.2, 0.3, 0.4, 0.5],
        prediction_dates: ['Day 1', 'Day 2', 'Day 3', 'Day 4', 'Day 5'],
        historical_data: {
          prices: [1.0, 1.01, 1.02, 1.03, 1.04, 1.05],
          dates: ['Day 1', 'Day 2', 'Day 3', 'Day 4', 'Day 5', 'Day 6']
        },
        support_resistance: {
          support: [0.95, 0.96, 0.97],
          resistance: [1.10, 1.11, 1.12]
        },
        technical_indicators: {
          rsi: 50,
          macd: 0,
          macd_signal: 0,
          macd_hist: 0,
          sma20: 1.00,
          sma50: 1.01,
          sma200: 1.02
        },
        sentiment: {
          overall: 'Neutral',
          confidence: 50,
          news_sentiment: 0,
          social_sentiment: 0,
          market_mood: 'Neutral',
          news_count: 0,
          social_count: 0
        },
        last_updated: new Date().toISOString()
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleFavorite = async () => {
    try {
      // Handle case where selectedPair might be an object
      let pairSymbol = selectedPair;
      
      if (typeof selectedPair === 'object' && selectedPair !== null) {
        pairSymbol = selectedPair.value || 'EURUSD=X';
        console.warn('Selected pair is object in toggle favorite, using value:', pairSymbol);
      }

      const pairInfo = currencyPairs.find(pair => pair.value === pairSymbol);
      const pairName = pairInfo ? pairInfo.label : pairSymbol;
      
      // Log request data for debugging
      console.log('Toggling favorite with data:', { 
        symbol: pairSymbol, 
        pair_name: pairName 
      });
      
      // Handle case where the symbol might have -X suffix
      const cleanSymbol = typeof pairSymbol === 'string' && pairSymbol.includes('-X') 
        ? pairSymbol.split('-X')[0] 
        : pairSymbol;
      
      const response = await API.favorites.toggle({
        symbol: cleanSymbol,
        pair_name: pairName
      });
      
      setIsFavorite(response.data.isFavorite);
      setFavoriteMessage(response.data.message);
      setShowFavoriteAlert(true);
      setTimeout(() => setShowFavoriteAlert(false), 3000);
    } catch (error) {
      console.error('Error toggling favorite:', error);
      
      // Display error message to user
      const errorMessage = error.response?.data?.message || 'Failed to update favorites. Please try again.';
      setFavoriteMessage(errorMessage);
      setShowFavoriteAlert(true);
      setTimeout(() => setShowFavoriteAlert(false), 3000);
    }
  };

  // Calculate sentiment based on analysis data
  const getSentimentAnalysis = () => {
    if (!analysisData || !analysisData.sentiment) {
      if (!sentimentLoggedRef.current) {
        console.log('Using mock sentiment data since actual data is missing');
        sentimentLoggedRef.current = true;
      }
      return mockData.sentimentAnalysis;
    }

    // Safely extract sentiment data with defaults for missing values
    const sentiment = analysisData.sentiment || {};
    
    // Check that all required properties exist, if not use mock data
    if (typeof sentiment.news_sentiment === 'undefined' || 
        typeof sentiment.social_sentiment === 'undefined') {
      if (!sentimentLoggedRef.current) {
        console.log('Sentiment data is incomplete, using mock data');
        sentimentLoggedRef.current = true;
      }
      return mockData.sentimentAnalysis;
    }
    
    // Reset the logging flag when we get valid data
    sentimentLoggedRef.current = false;
    
    // Convert values and provide defaults as needed
    return {
      overall: sentiment.overall || 'Neutral',
      confidence: sentiment.confidence || 50,
      newsSentiment: typeof sentiment.news_sentiment === 'number' ? 
        (sentiment.news_sentiment + 1) / 2 : 0.5, // Convert from -1 to 1 range to 0 to 1
      socialSentiment: typeof sentiment.social_sentiment === 'number' ? 
        (sentiment.social_sentiment + 1) / 2 : 0.5,
      marketMood: sentiment.market_mood || 'Neutral',
      newsCount: sentiment.news_count || 0,
      socialCount: sentiment.social_count || 0
    };
  };

  if (!user) {
    return null;
  }

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', backgroundColor: colors.darkBg }}>
      <Sidebar />
      
      {/* Main Content */}
      <Box sx={{ 
        flex: 1, 
        p: { xs: 2, md: 3 },
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
        ml: '250px'
      }}>
        {/* Header Section */}
        <Paper 
          sx={{ 
            p: 2,
            backgroundColor: colors.cardBg,
            border: `1px solid ${colors.borderColor}`,
            borderRadius: '12px',
            boxShadow: `0 4px 12px ${colors.shadowColor}`
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Typography variant="h5" sx={{ color: colors.primaryText, fontWeight: 'bold' }}>
                {currencyPairs.find(pair => pair.value === selectedPair)?.label} Analysis
              </Typography>
              <Select
                value={selectedPair}
                onChange={handlePairChange}
                sx={{
                  backgroundColor: colors.panelBg,
                  color: colors.primaryText,
                  '& .MuiSelect-icon': {
                    color: colors.secondaryText
                  },
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: colors.borderColor
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: colors.accentBlue
                  }
                }}
              >
                {currencyPairs.map((pair) => (
                  <MenuItem key={pair.value} value={pair.value}>
                    {pair.label}
                  </MenuItem>
                ))}
              </Select>
            </Box>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button 
                variant="contained" 
                onClick={() => {
                  console.log('Selected pair before analysis:', selectedPair);
                  if (typeof selectedPair === 'object') {
                    console.warn('selectedPair is an object instead of a string, extracting value');
                    const actualValue = selectedPair?.value || 'EURUSD=X';
                    setSelectedPair(actualValue);
                    setTimeout(() => fetchMarketAnalysis(actualValue), 100);
                  } else {
                    fetchMarketAnalysis(selectedPair);
                  }
                }}
                disabled={loading}
                sx={{ 
                  backgroundColor: colors.accentBlue,
                  '&:hover': { backgroundColor: colors.gradientStart }
                }}
              >
                {loading ? <CircularProgress size={24} /> : 'Start Analyze'}
              </Button>
              <Button
                variant="outlined"
                onClick={toggleFavorite}
                sx={{
                  borderColor: isFavorite ? colors.buyGreen : colors.borderColor,
                  color: isFavorite ? colors.buyGreen : colors.secondaryText,
                  '&:hover': {
                    borderColor: isFavorite ? colors.buyGreen : colors.accentBlue,
                    backgroundColor: `${colors.accentBlue}10`
                  }
                }}
              >
                {isFavorite ? 'Remove from Favorites' : 'Add to Favorites'}
              </Button>
              <Tooltip title="Market Info">
                <IconButton sx={{ color: colors.secondaryText }}>
                  <InfoIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="Settings">
                <IconButton sx={{ color: colors.secondaryText }}>
                  <SettingsIcon />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <Typography variant="h6" sx={{ color: colors.primaryText }}>
              {analysisData ? analysisData.current_price : '1.0900'}
            </Typography>
            {analysisData ? (
              <Chip 
                icon={analysisData.trend === 'Bullish' ? <TrendingUpIcon /> : <TrendingDownIcon />} 
                label={analysisData.trend} 
                color={analysisData.trend === 'Bullish' ? 'success' : 'error'} 
                size="small"
                sx={{ backgroundColor: analysisData.trend === 'Bullish' ? colors.profitGreen : colors.lossRed }}
              />
            ) : (
              <Chip 
                icon={<TrendingUpIcon />} 
                label="+0.25%" 
                color="success" 
                size="small"
                sx={{ backgroundColor: colors.profitGreen }}
              />
            )}
            <Typography variant="body2" sx={{ color: colors.secondaryText }}>
              Last updated: {analysisData ? 'Just now' : '2 minutes ago'}
            </Typography>
          </Box>
        </Paper>

        {/* Main Content Flex Layout */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {/* Top Row: Price Chart */}
          <Paper 
            sx={{ 
              p: 2, 
              backgroundColor: colors.cardBg,
              border: `1px solid ${colors.borderColor}`,
              borderRadius: '12px',
              boxShadow: `0 4px 12px ${colors.shadowColor}`,
              display: 'flex',
              flexDirection: 'column',
              minHeight: '500px'
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" sx={{ color: colors.primaryText }}>
                Price Chart
              </Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Chip label="1H" size="small" sx={{ backgroundColor: colors.accentBlue, color: colors.primaryText }} />
                <Chip label="4H" size="small" sx={{ backgroundColor: colors.cardBg, color: colors.secondaryText }} />
                <Chip label="1D" size="small" sx={{ backgroundColor: colors.cardBg, color: colors.secondaryText }} />
              </Box>
            </Box>
            <Box sx={{ flex: 1, minHeight: 400 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={analysisData && analysisData.historical_data && analysisData.historical_data.prices && 
                  analysisData.historical_data.dates ? 
                  analysisData.historical_data.prices.map((price, index) => ({
                  time: analysisData.historical_data.dates[index],
                  price: price
                })) : mockData.priceHistory}>
                  <defs>
                    <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={colors.accentBlue} stopOpacity={0.3}/>
                      <stop offset="95%" stopColor={colors.accentBlue} stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={colors.borderColor} />
                  <XAxis dataKey="time" stroke={colors.secondaryText} />
                  <YAxis stroke={colors.secondaryText} />
                  <ChartTooltip 
                    contentStyle={{ 
                      backgroundColor: colors.cardBg, 
                      border: `1px solid ${colors.borderColor}`,
                      borderRadius: '8px'
                    }}
                    labelStyle={{ color: colors.primaryText }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="price" 
                    stroke={colors.accentBlue} 
                    fillOpacity={1} 
                    fill="url(#colorPrice)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </Box>
          </Paper>

          {/* Middle Row: Technical Indicators and Support/Resistance */}
          <Box sx={{ display: 'flex', gap: 2 }}>
            {/* Technical Indicators */}
            <Paper 
              sx={{ 
                p: 2, 
                flex: 1,
                backgroundColor: colors.cardBg,
                border: `1px solid ${colors.borderColor}`,
                borderRadius: '12px',
                boxShadow: `0 4px 12px ${colors.shadowColor}`,
                display: 'flex',
                flexDirection: 'column'
              }}
            >
              <Typography variant="h6" sx={{ color: colors.primaryText, mb: 2 }}>
                Technical Indicators
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Box>
                    <Typography variant="subtitle2" sx={{ color: colors.secondaryText, mb: 1 }}>
                      RSI (14)
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="h5" sx={{ color: colors.primaryText }}>
                      {typeof analysisData?.technical_indicators?.rsi === 'number' 
                        ? analysisData.technical_indicators.rsi.toFixed(1) 
                        : '50.0'}
                      </Typography>
                      <Chip 
                      label={analysisData?.technical_indicators?.rsi > 70 
                        ? 'Overbought' 
                        : analysisData?.technical_indicators?.rsi < 30 
                          ? 'Oversold' 
                          : 'Neutral'} 
                      color={analysisData?.technical_indicators?.rsi > 70 
                        ? 'error' 
                        : analysisData?.technical_indicators?.rsi < 30 
                          ? 'success' 
                          : 'default'}
                        size="small"
                      sx={{
                        backgroundColor: analysisData?.technical_indicators?.rsi > 70 
                          ? `${colors.lossRed}40` 
                          : analysisData?.technical_indicators?.rsi < 30 
                            ? `${colors.profitGreen}40` 
                            : colors.panelBg,
                        color: colors.primaryText
                      }}
                      />
                    </Box>
                  </Box>
                  <Box>
                    <Typography variant="subtitle2" sx={{ color: colors.secondaryText, mb: 1 }}>
                    MACD
                    </Typography>
                  <Grid container spacing={1}>
                    <Grid item xs={4}>
                      <Box sx={{ textAlign: 'center', p: 1, border: `1px solid ${colors.borderColor}`, borderRadius: '8px' }}>
                        <Typography variant="body2" sx={{ color: colors.secondaryText }}>MACD</Typography>
                        <Typography variant="body1" sx={{ color: colors.primaryText }}>
                          {typeof analysisData?.technical_indicators?.macd === 'number' 
                            ? analysisData.technical_indicators.macd.toFixed(4) 
                            : '0.0000'}
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={4}>
                      <Box sx={{ textAlign: 'center', p: 1, border: `1px solid ${colors.borderColor}`, borderRadius: '8px' }}>
                        <Typography variant="body2" sx={{ color: colors.secondaryText }}>Signal</Typography>
                        <Typography variant="body1" sx={{ color: colors.primaryText }}>
                          {typeof analysisData?.technical_indicators?.macd_signal === 'number' 
                            ? analysisData.technical_indicators.macd_signal.toFixed(4) 
                            : '0.0000'}
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={4}>
                      <Box sx={{ textAlign: 'center', p: 1, border: `1px solid ${colors.borderColor}`, borderRadius: '8px' }}>
                        <Typography variant="body2" sx={{ color: colors.secondaryText }}>Histogram</Typography>
                        <Typography variant="body1" sx={{ color: colors.primaryText }}>
                          {typeof analysisData?.technical_indicators?.macd_hist === 'number' 
                            ? analysisData.technical_indicators.macd_hist.toFixed(4) 
                            : '0.0000'}
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>
                </Box>
                  <Box>
                    <Typography variant="subtitle2" sx={{ color: colors.secondaryText, mb: 1 }}>
                    Moving Averages
                    </Typography>
                  <Grid container spacing={1}>
                    <Grid item xs={4}>
                      <Box sx={{ textAlign: 'center', p: 1, border: `1px solid ${colors.borderColor}`, borderRadius: '8px' }}>
                        <Typography variant="body2" sx={{ color: colors.secondaryText }}>SMA 20</Typography>
                        <Typography variant="body1" sx={{ color: colors.primaryText }}>
                          {typeof analysisData?.technical_indicators?.sma20 === 'number' 
                            ? analysisData.technical_indicators.sma20.toFixed(4) 
                            : '0.0000'}
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={4}>
                      <Box sx={{ textAlign: 'center', p: 1, border: `1px solid ${colors.borderColor}`, borderRadius: '8px' }}>
                        <Typography variant="body2" sx={{ color: colors.secondaryText }}>SMA 50</Typography>
                        <Typography variant="body1" sx={{ color: colors.primaryText }}>
                          {typeof analysisData?.technical_indicators?.sma50 === 'number' 
                            ? analysisData.technical_indicators.sma50.toFixed(4) 
                            : '0.0000'}
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={4}>
                      <Box sx={{ textAlign: 'center', p: 1, border: `1px solid ${colors.borderColor}`, borderRadius: '8px' }}>
                        <Typography variant="body2" sx={{ color: colors.secondaryText }}>SMA 200</Typography>
                        <Typography variant="body1" sx={{ color: colors.primaryText }}>
                          {typeof analysisData?.technical_indicators?.sma200 === 'number' 
                            ? analysisData.technical_indicators.sma200.toFixed(4) 
                            : '0.0000'}
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>
                </Box>
              </Box>
            </Paper>

            {/* Support & Resistance */}
            <Paper 
              sx={{ 
                p: 2, 
                backgroundColor: colors.cardBg,
                border: `1px solid ${colors.borderColor}`,
                borderRadius: '12px',
                boxShadow: `0 4px 12px ${colors.shadowColor}`,
                display: 'flex',
                flexDirection: 'column'
              }}
            >
              <Typography variant="h6" sx={{ color: colors.primaryText, mb: 2 }}>
                Support & Resistance Levels
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="subtitle1" sx={{ color: colors.secondaryText, mb: 1 }}>
                    Support Levels
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    {(analysisData?.support_resistance?.support || []).map((level, index) => (
                      <Chip 
                        key={index}
                        label={typeof level === 'number' ? level.toFixed(4) : '0.0000'}
                        color="success"
                        size="medium"
                        sx={{ 
                          my: 0.5,
                          backgroundColor: `${colors.buyGreen}22`,
                          color: colors.buyGreen,
                          border: `1px solid ${colors.buyGreen}`,
                          fontWeight: 'bold'
                        }}
                      />
                    ))}
                    {(!analysisData?.support_resistance?.support || analysisData.support_resistance.support.length === 0) && (
                      <Typography variant="body2" sx={{ color: colors.secondaryText, fontStyle: 'italic' }}>
                        No support levels available
                      </Typography>
                    )}
                  </Box>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle1" sx={{ color: colors.secondaryText, mb: 1 }}>
                    Resistance Levels
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    {(analysisData?.support_resistance?.resistance || []).map((level, index) => (
                      <Chip 
                        key={index}
                        label={typeof level === 'number' ? level.toFixed(4) : '0.0000'}
                        color="error"
                        size="medium"
                        sx={{ 
                          my: 0.5,
                          backgroundColor: `${colors.sellRed}22`,
                          color: colors.sellRed,
                          border: `1px solid ${colors.sellRed}`,
                          fontWeight: 'bold'
                        }}
                      />
                    ))}
                    {(!analysisData?.support_resistance?.resistance || analysisData.support_resistance.resistance.length === 0) && (
                      <Typography variant="body2" sx={{ color: colors.secondaryText, fontStyle: 'italic' }}>
                        No resistance levels available
                      </Typography>
                    )}
                  </Box>
                </Grid>
              </Grid>
            </Paper>
          </Box>

          {/* Bottom Row: Market Analysis and Sentiment */}
          <Box sx={{ display: 'flex', gap: 2 }}>
            {/* Market Analysis */}
            <Paper 
              sx={{ 
                p: 2, 
                flex: 1,
                backgroundColor: colors.cardBg,
                border: `1px solid ${colors.borderColor}`,
                borderRadius: '12px',
                boxShadow: `0 4px 12px ${colors.shadowColor}`,
                display: 'flex',
                flexDirection: 'column'
              }}
            >
              <Typography variant="h6" sx={{ color: colors.primaryText, mb: 2 }}>
                Market Analysis
              </Typography>
              {error && (
                <Typography color="error" sx={{ mb: 2 }}>
                  {error}
                </Typography>
              )}
              {analysisData && (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Box>
                    <Typography variant="subtitle2" sx={{ color: colors.secondaryText, mb: 1 }}>
                      Trend Analysis
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="h5" sx={{ color: colors.primaryText }}>
                        {analysisData.trend || 'Neutral'}
                      </Typography>
                      <Chip 
                        label={`Slope: ${typeof analysisData.slope === 'number' ? analysisData.slope.toFixed(4) : (analysisData.change_percentage || 0).toFixed(4)}`}
                        color={(analysisData.slope > 0 || analysisData.change_percentage > 0) ? 'success' : 'error'}
                        size="small"
                        sx={{
                          backgroundColor: (analysisData.slope > 0 || analysisData.change_percentage > 0) ? `${colors.profitGreen}40` : `${colors.lossRed}40`,
                          color: colors.primaryText
                        }}
                      />
                    </Box>
                  </Box>
                  <Box>
                    <Typography variant="subtitle2" sx={{ color: colors.secondaryText, mb: 1 }}>
                      Price Predictions (Next 5 Days)
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                      {(analysisData.predictions || []).map((prediction, index) => (
                        <Box key={index} sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="body2" sx={{ color: colors.secondaryText }}>
                            {analysisData.prediction_dates && analysisData.prediction_dates[index] 
                              ? analysisData.prediction_dates[index].replace('2025-', '') 
                              : `Day ${index + 1}`}
                          </Typography>
                          <Typography variant="body2" sx={{ color: colors.primaryText }}>
                            {typeof prediction === 'number' ? prediction.toFixed(4) : '0.0000'}
                          </Typography>
                        </Box>
                      ))}
                    </Box>
                  </Box>
                </Box>
              )}
            </Paper>

            {/* Sentiment Analysis */}
            <Paper 
              sx={{ 
                p: 2, 
                flex: 1,
                backgroundColor: colors.cardBg,
                border: `1px solid ${colors.borderColor}`,
                borderRadius: '12px',
                boxShadow: `0 4px 12px ${colors.shadowColor}`,
                display: 'flex',
                flexDirection: 'column'
              }}
            >
              <Typography variant="h6" sx={{ color: colors.primaryText, mb: 2 }}>
                Sentiment Analysis
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box>
                  <Typography variant="subtitle2" sx={{ color: colors.secondaryText, mb: 1 }}>
                    Overall Sentiment
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="h5" sx={{ color: colors.primaryText }}>
                      {getSentimentAnalysis().overall}
                    </Typography>
                    <Chip 
                      label={`${getSentimentAnalysis().confidence}%`}
                      color="primary"
                      size="small"
                    />
                  </Box>
                  <Typography variant="body2" sx={{ color: colors.secondaryText, mt: 1 }}>
                    Based on {getSentimentAnalysis().newsCount} news articles and {getSentimentAnalysis().socialCount} social mentions
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="subtitle2" sx={{ color: colors.secondaryText, mb: 1 }}>
                      News Sentiment
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="h6" sx={{ color: colors.primaryText }}>
                        {(getSentimentAnalysis().newsSentiment * 100).toFixed(1)}%
                      </Typography>
                      <Chip 
                        label={getSentimentAnalysis().newsSentiment > 0.5 ? 'Positive' : 'Negative'}
                        color={getSentimentAnalysis().newsSentiment > 0.5 ? 'success' : 'error'}
                        size="small"
                      />
                    </Box>
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="subtitle2" sx={{ color: colors.secondaryText, mb: 1 }}>
                      Social Sentiment
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="h6" sx={{ color: colors.primaryText }}>
                        {(getSentimentAnalysis().socialSentiment * 100).toFixed(1)}%
                      </Typography>
                      <Chip 
                        label={getSentimentAnalysis().socialSentiment > 0.5 ? 'Positive' : 'Negative'}
                        color={getSentimentAnalysis().socialSentiment > 0.5 ? 'success' : 'error'}
                        size="small"
                      />
                    </Box>
                  </Box>
                </Box>
                <Box>
                  <Typography variant="subtitle2" sx={{ color: colors.secondaryText, mb: 1 }}>
                    Market Mood
                  </Typography>
                  <Chip 
                    label={getSentimentAnalysis().marketMood}
                    color={getSentimentAnalysis().marketMood === 'Positive' ? 'success' : 'error'}
                    size="small"
                    sx={{ 
                      backgroundColor: getSentimentAnalysis().marketMood === 'Positive' ? colors.profitGreen : colors.lossRed
                    }}
                  />
                </Box>
              </Box>
            </Paper>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default Market;
