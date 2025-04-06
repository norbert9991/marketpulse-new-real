import React, { useState, useEffect } from 'react';
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
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/login');
          return;
        }
        
        const response = await axios.get('http://localhost:5000/api/auth/me', {
          headers: {
            'Authorization': token
          }
        });
        
        setUser(response.data.user);
      } catch (err) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
      }
    };
    
    fetchUser();
  }, [navigate]);

  useEffect(() => {
    const checkFavoriteStatus = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`http://localhost:5000/api/favorites/check/${selectedPair}`, {
          headers: {
            'Authorization': token
          }
        });
        setIsFavorite(response.data.is_favorite);
      } catch (err) {
        console.error('Error checking favorite status:', err);
      }
    };
    
    if (user) {
      checkFavoriteStatus();
    }
  }, [selectedPair, user]);

  const handleTabChange = (event, newValue) => {
    setSelectedTab(newValue);
  };

  const handlePairChange = (event) => {
    setSelectedPair(event.target.value);
  };

  const handleAnalyze = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('http://localhost:5000/api/market/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ symbol: selectedPair }),
      });
      
      const data = await response.json();
      if (data.error) {
        throw new Error(data.error);
      }
      setAnalysisData(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleFavorite = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post('http://localhost:5000/api/favorites/toggle', {
        symbol: selectedPair,
        pair_name: currencyPairs.find(pair => pair.value === selectedPair)?.label
      }, {
        headers: {
          'Authorization': token
        }
      });
      
      setIsFavorite(response.data.is_favorite);
    } catch (err) {
      console.error('Error toggling favorite:', err);
    }
  };

  // Calculate sentiment based on analysis data
  const getSentimentAnalysis = () => {
    if (!analysisData) return mockData.sentimentAnalysis;

    const sentiment = analysisData.sentiment;
    if (!sentiment) return mockData.sentimentAnalysis;

    return {
      overall: sentiment.overall,
      confidence: sentiment.confidence,
      newsSentiment: (sentiment.news_sentiment + 1) / 2, // Convert from -1 to 1 range to 0 to 1
      socialSentiment: (sentiment.social_sentiment + 1) / 2,
      marketMood: sentiment.market_mood,
      newsCount: sentiment.news_count,
      socialCount: sentiment.social_count
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
                onClick={handleAnalyze}
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
                onClick={handleToggleFavorite}
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
                <AreaChart data={analysisData ? analysisData.historical_data.prices.map((price, index) => ({
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
              <Box sx={{ display: 'flex', gap: 2 }}>
                {/* Left Column */}
                <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Box>
                    <Typography variant="subtitle2" sx={{ color: colors.secondaryText, mb: 1 }}>
                      RSI (14)
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="h5" sx={{ color: colors.primaryText }}>
                        {analysisData?.technical_indicators?.rsi?.toFixed(2) || mockData.technicalIndicators.rsi}
                      </Typography>
                      <Chip 
                        label={analysisData?.technical_indicators?.rsi > 70 ? 'Overbought' : analysisData?.technical_indicators?.rsi < 30 ? 'Oversold' : 'Neutral'} 
                        color={analysisData?.technical_indicators?.rsi > 70 ? 'error' : analysisData?.technical_indicators?.rsi < 30 ? 'success' : 'default'}
                        size="small"
                      />
                    </Box>
                  </Box>
                  <Box>
                    <Typography variant="subtitle2" sx={{ color: colors.secondaryText, mb: 1 }}>
                      Moving Averages
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" sx={{ color: colors.secondaryText }}>SMA 20</Typography>
                        <Typography variant="body2" sx={{ color: colors.primaryText }}>
                          {analysisData?.technical_indicators?.sma20?.toFixed(5) || mockData.technicalIndicators.sma20}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" sx={{ color: colors.secondaryText }}>SMA 50</Typography>
                        <Typography variant="body2" sx={{ color: colors.primaryText }}>
                          {analysisData?.technical_indicators?.sma50?.toFixed(5) || mockData.technicalIndicators.sma50}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" sx={{ color: colors.secondaryText }}>SMA 200</Typography>
                        <Typography variant="body2" sx={{ color: colors.primaryText }}>
                          {analysisData?.technical_indicators?.sma200?.toFixed(5) || mockData.technicalIndicators.sma200}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                </Box>

                {/* Vertical Divider */}
                <Divider orientation="vertical" flexItem sx={{ backgroundColor: colors.borderColor }} />

                {/* Right Column */}
                <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Box>
                    <Typography variant="subtitle2" sx={{ color: colors.secondaryText, mb: 1 }}>
                      MACD
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" sx={{ color: colors.secondaryText }}>MACD</Typography>
                        <Typography variant="body2" sx={{ color: colors.primaryText }}>
                          {analysisData?.technical_indicators?.macd?.toFixed(5) || mockData.technicalIndicators.macd}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" sx={{ color: colors.secondaryText }}>Signal</Typography>
                        <Typography variant="body2" sx={{ color: colors.primaryText }}>
                          {analysisData?.technical_indicators?.macd_signal?.toFixed(5) || mockData.technicalIndicators.macdSignal}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" sx={{ color: colors.secondaryText }}>Histogram</Typography>
                        <Typography variant="body2" sx={{ color: colors.primaryText }}>
                          {analysisData?.technical_indicators?.macd_hist?.toFixed(5) || mockData.technicalIndicators.macdHist}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                </Box>
              </Box>
            </Paper>

            {/* Support & Resistance */}
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
                Support & Resistance
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box>
                  <Typography variant="subtitle2" sx={{ color: colors.secondaryText, mb: 1 }}>
                    Support Levels
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    {analysisData?.support_resistance?.support?.map((level, index) => (
                      <Chip 
                        key={index}
                        label={level.toFixed(5)}
                        color="success"
                        size="small"
                        variant="outlined"
                        sx={{ 
                          borderColor: colors.buyGreen,
                          color: colors.buyGreen,
                          '&:hover': {
                            backgroundColor: `${colors.buyGreen}20`
                          }
                        }}
                      />
                    )) || mockData.supportResistance.support.map((level, index) => (
                      <Chip 
                        key={index}
                        label={level.toFixed(5)}
                        color="success"
                        size="small"
                        variant="outlined"
                        sx={{ 
                          borderColor: colors.buyGreen,
                          color: colors.buyGreen,
                          '&:hover': {
                            backgroundColor: `${colors.buyGreen}20`
                          }
                        }}
                      />
                    ))}
                  </Box>
                </Box>
                <Box>
                  <Typography variant="subtitle2" sx={{ color: colors.secondaryText, mb: 1 }}>
                    Resistance Levels
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    {analysisData?.support_resistance?.resistance?.map((level, index) => (
                      <Chip 
                        key={index}
                        label={level.toFixed(5)}
                        color="error"
                        size="small"
                        variant="outlined"
                        sx={{ 
                          borderColor: colors.sellRed,
                          color: colors.sellRed,
                          '&:hover': {
                            backgroundColor: `${colors.sellRed}20`
                          }
                        }}
                      />
                    )) || mockData.supportResistance.resistance.map((level, index) => (
                      <Chip 
                        key={index}
                        label={level.toFixed(5)}
                        color="error"
                        size="small"
                        variant="outlined"
                        sx={{ 
                          borderColor: colors.sellRed,
                          color: colors.sellRed,
                          '&:hover': {
                            backgroundColor: `${colors.sellRed}20`
                          }
                        }}
                      />
                    ))}
                  </Box>
                </Box>
              </Box>
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
                        {analysisData.trend}
                      </Typography>
                      <Chip 
                        label={`Slope: ${analysisData.slope.toFixed(4)}`}
                        color={analysisData.slope > 0 ? 'success' : 'error'}
                        size="small"
                      />
                    </Box>
                  </Box>
                  <Box>
                    <Typography variant="subtitle2" sx={{ color: colors.secondaryText, mb: 1 }}>
                      Price Predictions (Next 5 Days)
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                      {analysisData.predictions.map((prediction, index) => (
                        <Box key={index} sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="body2" sx={{ color: colors.secondaryText }}>
                            Day {index + 1}
                          </Typography>
                          <Typography variant="body2" sx={{ color: colors.primaryText }}>
                            {prediction.toFixed(4)}
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
