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
  MenuItem,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  FormControlLabel,
  FormControl,
  Switch
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
  Bar,
  CandlestickChart,
  Candlestick
} from 'recharts';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import InfoIcon from '@mui/icons-material/Info';
import SettingsIcon from '@mui/icons-material/Settings';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import Sidebar from './Sidebar';
import { API } from '../axiosConfig';
import Link from '@mui/material/Link';
import LaunchIcon from '@mui/icons-material/Launch';
import CloseIcon from '@mui/icons-material/Close';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';

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

// Helper functions for technical indicator colors
const getRsiColor = (rsi) => {
  if (!rsi) return '#888';
  const rsiValue = Number(rsi);
  if (rsiValue > 70) return '#e74c3c'; // Overbought - red
  if (rsiValue < 30) return '#2ecc71'; // Oversold - green
  return '#888'; // Neutral - gray
};

const getMacdColor = (macd, signal) => {
  if (!macd || !signal) return '#888';
  return Number(macd) > Number(signal) ? '#2ecc71' : '#e74c3c';
};

const getAdxColor = (adx) => {
  if (!adx) return '#888';
  const adxValue = Number(adx);
  if (adxValue > 25) return '#2ecc71'; // Strong trend - green
  return '#888'; // Weak trend - gray
};

// Helper function to ensure we have numerical values
const ensureNumber = (value, defaultValue = 0) => {
  if (value === null || value === undefined || isNaN(Number(value)) || Number(value) === 0) {
    return defaultValue;
  }
  return Number(value);
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
  const [pageLoading, setPageLoading] = useState(true);
  
  // Add states for dialogs and notifications
  const [marketInfoOpen, setMarketInfoOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsNotification, setSettingsNotification] = useState(false);
  
  // Add states for settings
  const [settings, setSettings] = useState({
    showTechnicalIndicators: true,
    showSupportResistance: true,
    showSentimentAnalysis: true,
    enableRealTimeUpdates: false,
    darkMode: true,
    chartStyle: 'area' // 'area', 'line', or 'candle'
  });

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
      } finally {
        // Remove page loading state when user data is fetched
        setPageLoading(false);
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
    
    console.log('Setting temporary selected pair to:', newPair);
    setSelectedPair(newPair);
    
    // Don't automatically fetch data when changing pairs
    // User must click "Start Analyze" button to fetch data
  };

  const fetchMarketAnalysis = async (symbolToFetch = selectedPair) => {
    try {
    setLoading(true);
      
      // Try to fetch market analysis
      console.log(`Attempting to analyze symbol: ${symbolToFetch}`);
      const response = await API.market.analyze({ symbol: symbolToFetch });
      
      console.log('Raw API response:', response.data);
      
      // Create a comprehensive response for UI rendering
      const completeResponse = {
        ...response.data,
        // Ensure these objects exist
        technical_indicators: response.data.technical_indicators || {},
        sentiment: response.data.sentiment || {}
      };
      
      // Process support and resistance levels - API response might have a different structure
      if (response.data.support_resistance) {
        // Process support_resistance data, which could be in different formats
        const supportLevels = [];
        const resistanceLevels = [];
        
        // Check if support_resistance has arrays named support and resistance
        if (Array.isArray(response.data.support_resistance.support)) {
          supportLevels.push(...response.data.support_resistance.support.map(item => 
            typeof item === 'object' ? parseFloat(item.level_value) : parseFloat(item)
          ));
        }
        
        if (Array.isArray(response.data.support_resistance.resistance)) {
          resistanceLevels.push(...response.data.support_resistance.resistance.map(item => 
            typeof item === 'object' ? parseFloat(item.level_value) : parseFloat(item)
          ));
        }
        
        completeResponse.support_resistance = {
          support: supportLevels,
          resistance: resistanceLevels
        };
        
        console.log('Extracted support levels:', supportLevels);
        console.log('Extracted resistance levels:', resistanceLevels);
      } else {
        // Create empty support_resistance structure if missing
        completeResponse.support_resistance = { support: [], resistance: [] };
      }
      
      // Add missing historical data if needed
      if (!completeResponse.historical_data || !completeResponse.historical_data.prices || !completeResponse.historical_data.dates) {
        console.warn('API response missing historical data structure:', response.data);
        completeResponse.historical_data = {
          prices: [1.0, 1.01, 1.02, 1.03, 1.04, 1.05],
          dates: ['Day 1', 'Day 2', 'Day 3', 'Day 4', 'Day 5', 'Day 6']
        };
      }
      
      // Make sure support_resistance has proper arrays
      if (!completeResponse.support_resistance.support) {
        completeResponse.support_resistance.support = [];
      }
      if (!completeResponse.support_resistance.resistance) {
        completeResponse.support_resistance.resistance = [];
      }
      
      // Log the complete data for debugging
      console.log('Processed market analysis data:', completeResponse);
      
      setAnalysisData(completeResponse);
    setError(null);
    } catch (error) {
      console.error('Error fetching market data:', error);
      
      // Create a helpful error message based on the error response
      const errorMessage = error.response?.data?.error || 'Error fetching data';
      console.log('Error message:', errorMessage);
      
      // If the error is "No data available for this symbol", create synthetic data
      if (errorMessage.includes('No data available for this symbol')) {
        console.log('Creating synthetic data for missing currency pair:', symbolToFetch);
        
        // Get base pair name for display
        const pairInfo = currencyPairs.find(p => p.value === symbolToFetch);
        const pairName = pairInfo ? pairInfo.label : symbolToFetch;
        
        // Create synthetic data based on the currency pair
        const syntheticPrice = generateSyntheticPrice(symbolToFetch);
        const syntheticTrend = Math.random() > 0.5 ? 'Bullish' : 'Bearish';
        
        // Generate realistic support and resistance levels
        const supportLevels = [
          (syntheticPrice * 0.98).toFixed(4),
          (syntheticPrice * 0.985).toFixed(4),
          (syntheticPrice * 0.99).toFixed(4)
        ].map(Number);
        
        const resistanceLevels = [
          (syntheticPrice * 1.01).toFixed(4),
          (syntheticPrice * 1.015).toFixed(4),
          (syntheticPrice * 1.02).toFixed(4)
        ].map(Number);
        
        // Generate synthetic technical indicators
        const rsi = Math.floor(Math.random() * 100);
        const macd = Number((Math.random() * 0.01 - 0.005).toFixed(4));
        const macdSignal = Number((Math.random() * 0.01 - 0.005).toFixed(4));
        const macdHist = Number((macd - macdSignal).toFixed(4));
        
        // Generate realistic predictions based on current synthetic price
        const predictions = [];
        const predictionDates = [];
        const today = new Date();
        
        for (let i = 1; i <= 5; i++) {
          const futureDate = new Date(today);
          futureDate.setDate(today.getDate() + i);
          const dateStr = futureDate.toISOString().split('T')[0]; // YYYY-MM-DD format
          
          const randomChange = (Math.random() * 0.01 - 0.005) * i;
          const prediction = Number((syntheticPrice * (1 + randomChange)).toFixed(4));
          
          predictions.push(prediction);
          predictionDates.push(dateStr);
        }
        
        // Create synthetic historical data
        const historyPrices = [];
        const historyDates = [];
        
        for (let i = 30; i > 0; i--) {
          const pastDate = new Date(today);
          pastDate.setDate(today.getDate() - i);
          const dateStr = pastDate.toISOString().split('T')[0]; // Full YYYY-MM-DD format
          
          // Create somewhat realistic price history with small variations
          const randomVariation = Math.sin(i * 0.2) * 0.02 + (Math.random() * 0.01 - 0.005);
          const historicalPrice = Number((syntheticPrice * (1 + randomVariation)).toFixed(4));
          
          historyPrices.push(historicalPrice);
          historyDates.push(dateStr);
        }
        
        // Prepare the synthetic data object
        const syntheticData = {
          symbol: symbolToFetch,
          current_price: syntheticPrice,
          trend: syntheticTrend,
          slope: Number((Math.random() * 0.1 - 0.05).toFixed(4)),
          change_percentage: Number((Math.random() * 2 - 1).toFixed(2)),
          predictions: predictions,
          prediction_dates: predictionDates,
          historical_data: {
            prices: historyPrices,
            dates: historyDates
          },
          support_resistance: {
            support: supportLevels,
            resistance: resistanceLevels
          },
          technical_indicators: {
            rsi: rsi,
            macd: macd,
            macd_signal: macdSignal,
            macd_hist: macdHist,
            sma20: Number((syntheticPrice * (1 + Math.random() * 0.01 - 0.005)).toFixed(4)),
            sma50: Number((syntheticPrice * (1 + Math.random() * 0.02 - 0.01)).toFixed(4)),
            sma200: Number((syntheticPrice * (1 + Math.random() * 0.03 - 0.015)).toFixed(4))
          },
          sentiment: {
            overall: Math.random() > 0.5 ? 'Bullish' : 'Bearish',
            confidence: Math.floor(Math.random() * 30) + 50, // 50-80% confidence
            news_sentiment: Math.random() * 0.6 - 0.3, // -0.3 to 0.3
            social_sentiment: Math.random() * 0.6 - 0.3, // -0.3 to 0.3
            market_mood: Math.random() > 0.5 ? 'Positive' : 'Negative',
            news_count: Math.floor(Math.random() * 50) + 10,
            social_count: Math.floor(Math.random() * 200) + 50
          },
          last_updated: new Date().toISOString()
        };
        
        console.log('Created synthetic data:', syntheticData);
        setAnalysisData(syntheticData);
        
        // Set a more friendly error message
        setError(`Using estimated data for ${pairName}. Historical data is not available in the database.`);
      } else {
        // If it's some other error, show the normal error message
        if (error.response?.status === 404) {
          setError(`Unable to analyze ${symbolToFetch}. Please try another currency pair.`);
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
      }
    } finally {
      setLoading(false);
    }
  };

  // Helper function to generate realistic synthetic prices based on currency pair
  const generateSyntheticPrice = (symbol) => {
    // Default ranges for common currency pairs
    const priceRanges = {
      'EURUSD': { min: 1.05, max: 1.12 },
      'GBPUSD': { min: 1.20, max: 1.30 },
      'USDJPY': { min: 130, max: 150 },
      'AUDUSD': { min: 0.65, max: 0.72 },
      'USDCAD': { min: 1.25, max: 1.35 },
      'NZDUSD': { min: 0.55, max: 0.65 },
      'USDCHF': { min: 0.85, max: 0.95 }
    };
    
    // Extract the base pair name without the =X suffix
    const basePair = symbol.replace('=X', '');
    
    // Get the price range for this pair, or use a default range
    const range = priceRanges[basePair] || { min: 1.0, max: 1.1 };
    
    // Generate a random price within the range
    const randomPrice = range.min + Math.random() * (range.max - range.min);
    
    // Return the price with 4 decimal places
    return Number(randomPrice.toFixed(4));
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

  // Function to process technical indicators with current price as fallback
  const getTechnicalIndicators = () => {
    if (!analysisData || !analysisData.technical_indicators) {
      console.log('No technical indicators found in analysis data, using mock data');
      return mockData.technicalIndicators;
    }

    const indicators = analysisData.technical_indicators;
    console.log('Technical indicators from database:', indicators);
    
    // For GBP/USD, USD/JPY, USD/CAD, etc - check if we have real values
    // If all values are 0, it's likely synthetic data isn't being displayed
    const allZeros = 
      indicators.rsi === 0 && 
      indicators.macd === 0 && 
      indicators.macd_signal === 0 && 
      indicators.macd_hist === 0;
    
    // If all values are 0 and we're showing synthetic data for a currency
    // that doesn't exist in the database, generate realistic values
    if (allZeros && (error || !indicators.rsi)) {
      console.log('Using synthetic indicators based on current price');
      const price = Number(analysisData.current_price || 1.0);
      
      return {
        rsi: Math.floor(Math.random() * 30 + 40), // Random RSI between 40-70
        macd: Number((Math.random() * 0.002 - 0.001).toFixed(6)),
        macdSignal: Number((Math.random() * 0.002 - 0.001).toFixed(6)),
        macdHist: Number((Math.random() * 0.001 - 0.0005).toFixed(6)),
        sma20: price * (1 + (Math.random() * 0.01 - 0.005)),
        sma50: price * (1 + (Math.random() * 0.015 - 0.0075)),
        sma200: price * (1 + (Math.random() * 0.02 - 0.01))
      };
    }
    
    return {
      rsi: ensureNumber(indicators.rsi),
      macd: ensureNumber(indicators.macd),
      macdSignal: ensureNumber(indicators.macd_signal),
      macdHist: ensureNumber(indicators.macd_hist),
      sma20: ensureNumber(indicators.sma20),
      sma50: ensureNumber(indicators.sma50),
      sma200: ensureNumber(indicators.sma200)
    };
  };

  const handleSettingsChange = (setting) => (event) => {
    setSettings({
      ...settings,
      [setting]: event.target.checked
    });
    // Show settings notification
    setSettingsNotification(true);
  };
  
  const handleChartStyleChange = (style) => {
    setSettings({
      ...settings,
      chartStyle: style
    });
    // Show settings notification
    setSettingsNotification(true);
  };
  
  // Function to get currency information for the selected pair
  const getCurrencyInfo = () => {
    const pairInfo = {
      'EURUSD=X': {
        name: 'Euro / US Dollar',
        description: 'The EUR/USD pair represents the exchange rate between the Euro and the US Dollar. It is the most traded currency pair in the forex market, accounting for about 28% of daily forex trades.',
        baseCurrency: 'Euro (EUR)',
        quoteCurrency: 'US Dollar (USD)',
        centralBanks: 'European Central Bank (ECB), Federal Reserve (Fed)',
        tradingHours: '24 hours, Sunday 5PM ET to Friday 5PM ET',
        typicalSpread: '0.1 to 1.0 pips',
        volatility: 'Medium',
        majorInfluences: 'ECB and Fed monetary policy, European and US economic data, political developments in EU and US'
      },
      'GBPUSD=X': {
        name: 'British Pound / US Dollar',
        description: 'Also known as "Cable", the GBP/USD pair represents the exchange rate between the British Pound and the US Dollar. It is one of the oldest and most traded currency pairs.',
        baseCurrency: 'British Pound (GBP)',
        quoteCurrency: 'US Dollar (USD)',
        centralBanks: 'Bank of England (BoE), Federal Reserve (Fed)',
        tradingHours: '24 hours, Sunday 5PM ET to Friday 5PM ET',
        typicalSpread: '0.5 to 2.0 pips',
        volatility: 'High',
        majorInfluences: 'BoE and Fed monetary policy, UK and US economic data, Brexit developments'
      },
      'USDJPY=X': {
        name: 'US Dollar / Japanese Yen',
        description: 'The USD/JPY pair represents the exchange rate between the US Dollar and the Japanese Yen. It is one of the most liquid currency pairs in the forex market.',
        baseCurrency: 'US Dollar (USD)',
        quoteCurrency: 'Japanese Yen (JPY)',
        centralBanks: 'Federal Reserve (Fed), Bank of Japan (BoJ)',
        tradingHours: '24 hours, Sunday 5PM ET to Friday 5PM ET',
        typicalSpread: '0.5 to 1.5 pips',
        volatility: 'Medium',
        majorInfluences: 'Fed and BoJ monetary policy, US-Japan interest rate differentials, risk sentiment'
      },
      'AUDUSD=X': {
        name: 'Australian Dollar / US Dollar',
        description: 'The AUD/USD pair represents the exchange rate between the Australian Dollar and the US Dollar. Also known as the "Aussie", it is influenced by commodity prices and risk sentiment.',
        baseCurrency: 'Australian Dollar (AUD)',
        quoteCurrency: 'US Dollar (USD)',
        centralBanks: 'Reserve Bank of Australia (RBA), Federal Reserve (Fed)',
        tradingHours: '24 hours, Sunday 5PM ET to Friday 5PM ET',
        typicalSpread: '0.5 to 2.0 pips',
        volatility: 'Medium-High',
        majorInfluences: 'Commodity prices, China economic data, risk sentiment, RBA policy'
      },
      'USDCAD=X': {
        name: 'US Dollar / Canadian Dollar',
        description: 'The USD/CAD pair represents the exchange rate between the US Dollar and the Canadian Dollar. Also known as the "Loonie", it is heavily influenced by oil prices and the economic relationship between the US and Canada.',
        baseCurrency: 'US Dollar (USD)',
        quoteCurrency: 'Canadian Dollar (CAD)',
        centralBanks: 'Federal Reserve (Fed), Bank of Canada (BoC)',
        tradingHours: '24 hours, Sunday 5PM ET to Friday 5PM ET',
        typicalSpread: '0.5 to 2.0 pips',
        volatility: 'Medium',
        majorInfluences: 'Oil prices, US-Canada trade relations, economic data from both countries'
      },
      'NZDUSD=X': {
        name: 'New Zealand Dollar / US Dollar',
        description: 'The NZD/USD pair represents the exchange rate between the New Zealand Dollar and the US Dollar. Also known as the "Kiwi", it is influenced by dairy prices and risk sentiment.',
        baseCurrency: 'New Zealand Dollar (NZD)',
        quoteCurrency: 'US Dollar (USD)',
        centralBanks: 'Reserve Bank of New Zealand (RBNZ), Federal Reserve (Fed)',
        tradingHours: '24 hours, Sunday 5PM ET to Friday 5PM ET',
        typicalSpread: '1.0 to 3.0 pips',
        volatility: 'Medium-High',
        majorInfluences: 'Dairy prices, agricultural exports, risk sentiment, RBNZ policy'
      },
      'USDCHF=X': {
        name: 'US Dollar / Swiss Franc',
        description: 'The USD/CHF pair represents the exchange rate between the US Dollar and the Swiss Franc. The Swiss Franc is considered a safe-haven currency.',
        baseCurrency: 'US Dollar (USD)',
        quoteCurrency: 'Swiss Franc (CHF)',
        centralBanks: 'Federal Reserve (Fed), Swiss National Bank (SNB)',
        tradingHours: '24 hours, Sunday 5PM ET to Friday 5PM ET',
        typicalSpread: '0.5 to 2.0 pips',
        volatility: 'Medium',
        majorInfluences: 'Safe-haven flows, global risk sentiment, SNB interventions'
      }
    };
    
    return pairInfo[selectedPair] || {
      name: 'Currency Pair',
      description: 'Information not available',
      baseCurrency: 'N/A',
      quoteCurrency: 'N/A',
      centralBanks: 'N/A',
      tradingHours: '24 hours, Sunday 5PM ET to Friday 5PM ET',
      typicalSpread: 'Varies',
      volatility: 'Varies',
      majorInfluences: 'Economic data, central bank policies, geopolitical events'
    };
  };

  // Function to render the appropriate chart based on settings
  const renderChart = () => {
    // Prepare the chart data
    const chartData = analysisData && analysisData.historical_data && analysisData.historical_data.prices && 
      analysisData.historical_data.dates ? 
      analysisData.historical_data.prices.map((price, index) => ({
        time: analysisData.historical_data.dates[index],
        price: price,
        // Add synthetic high, low, open, close for candlestick chart
        open: price * (1 - Math.random() * 0.01),
        high: price * (1 + Math.random() * 0.015),
        low: price * (1 - Math.random() * 0.015),
        close: price * (1 + Math.random() * 0.01)
      })) : mockData.priceHistory;
    
    // Return the appropriate chart component based on settings
    switch(settings.chartStyle) {
      case 'line':
        return (
          <LineChart data={chartData}>
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
            <Line 
              type="monotone" 
              dataKey="price" 
              stroke={colors.accentBlue} 
              dot={false}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        );
        
      case 'candle':
        return (
          <LineChart data={chartData}>
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
            <Line 
              type="monotone" 
              dataKey="price" 
              stroke={colors.warningOrange} 
              dot={true}
              strokeWidth={2}
            />
            <Line 
              type="monotone" 
              dataKey="high" 
              stroke={colors.buyGreen} 
              dot={false}
              strokeDasharray="5 5"
              strokeWidth={1}
            />
            <Line 
              type="monotone" 
              dataKey="low" 
              stroke={colors.sellRed} 
              dot={false}
              strokeDasharray="5 5"
              strokeWidth={1}
            />
          </LineChart>
        );
        
      case 'area':
      default:
        return (
          <AreaChart data={chartData}>
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
        );
    }
  };

  if (pageLoading) {
    return (
      <Box sx={{ 
        display: 'flex', 
        minHeight: '100vh', 
        backgroundColor: colors.darkBg,
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'column',
        gap: 2
      }}>
        <CircularProgress size={60} sx={{ color: colors.accentBlue }} />
        <Typography variant="h6" sx={{ color: colors.primaryText }}>
          Loading Market Data...
        </Typography>
      </Box>
    );
  }

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
        ml: '250px',
        backgroundColor: settings.darkMode ? colors.darkBg : '#f5f5f5'
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
                    // Reset data when clicking analyze button
                    setAnalysisData(null);
                    setError(null);
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
                <IconButton 
                  sx={{ color: colors.secondaryText }}
                  onClick={() => setMarketInfoOpen(true)}
                >
                  <InfoIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="Settings">
                <IconButton 
                  sx={{ color: colors.secondaryText }}
                  onClick={() => setSettingsOpen(true)}
                >
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
          {/* Top Row: Price History */}
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
                Price History
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                <Typography variant="caption" sx={{ color: colors.secondaryText }}>
                  Chart Type: {settings.chartStyle}
                </Typography>
                <Tooltip title="Price history shows how the currency pair has traded over time. This chart helps identify trends and potential trading opportunities." arrow>
                  <IconButton size="small" sx={{ color: colors.secondaryText }}>
                    <HelpOutlineIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>
            </Box>
            <Box sx={{ flex: 1, minHeight: 400 }}>
              <ResponsiveContainer width="100%" height="100%">
                {renderChart()}
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
                flexDirection: 'column',
                display: settings.showTechnicalIndicators ? 'flex' : 'none'
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" sx={{ color: colors.primaryText }}>
                Technical Indicators
              </Typography>
                <Tooltip title="Technical indicators are mathematical calculations based on price and volume data that help predict future price movements and generate trading signals." arrow>
                  <IconButton size="small" sx={{ color: colors.secondaryText }}>
                    <HelpOutlineIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>
              
              {/* RSI Indicator */}
              <Box sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography variant="subtitle1" sx={{ color: colors.secondaryText }}>
                      RSI (14)
                    </Typography>
                  <Tooltip title="RSI (Relative Strength Index) measures the speed and change of price movements on a scale of 0-100. Above 70 suggests overbought conditions (price may fall), below 30 suggests oversold conditions (price may rise)." arrow>
                    <IconButton size="small" sx={{ color: colors.secondaryText, ml: 0.5, p: 0 }}>
                      <HelpOutlineIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Typography variant="h5" sx={{ 
                    color: getRsiColor(getTechnicalIndicators().rsi),
                    fontWeight: 'bold'
                  }}>
                    {getTechnicalIndicators().rsi.toFixed(2)}
                      </Typography>
                    </Box>
                <Box sx={{ 
                  width: '100%', 
                  height: 8, 
                  backgroundColor: colors.borderColor,
                  borderRadius: 4,
                  position: 'relative',
                  overflow: 'hidden'
                }}>
                  <Box sx={{ 
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    height: '100%',
                    width: `${Math.min(100, Math.max(0, getTechnicalIndicators().rsi))}%`,
                    background: `linear-gradient(90deg, ${colors.buyGreen} 0%, ${colors.accentBlue} 50%, ${colors.sellRed} 100%)`,
                    borderRadius: 4
                  }} />
                  </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
                  <Typography variant="caption" sx={{ color: colors.buyGreen }}>Oversold (30)</Typography>
                  <Typography variant="caption" sx={{ color: colors.primaryText }}>Neutral</Typography>
                  <Typography variant="caption" sx={{ color: colors.sellRed }}>Overbought (70)</Typography>
                </Box>
              </Box>
              
              {/* MACD Indicators */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle1" sx={{ color: colors.secondaryText, mb: 2 }}>
                  MACD Indicator
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={4}>
                    <Box sx={{ 
                      textAlign: 'center', 
                      p: 1.5, 
                      borderRadius: '10px', 
                      backgroundColor: colors.panelBg 
                    }}>
                    <Typography variant="subtitle2" sx={{ color: colors.secondaryText, mb: 1 }}>
                        MACD Line
                    </Typography>
                      <Tooltip title="MACD (Moving Average Convergence Divergence) is a trend-following momentum indicator that shows the relationship between two moving averages. When MACD crosses above its signal line, it's a bullish signal; when it crosses below, it's bearish." arrow>
                        <IconButton size="small" sx={{ color: colors.secondaryText, ml: 0.5, p: 0 }}>
                          <HelpOutlineIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Typography variant="h6" sx={{ 
                        color: getMacdColor(getTechnicalIndicators().macd, getTechnicalIndicators().macdSignal),
                        fontWeight: 'bold'
                      }}>
                        {getTechnicalIndicators().macd.toFixed(4)}
                        </Typography>
                      </Box>
                  </Grid>
                  <Grid item xs={4}>
                    <Box sx={{ 
                      textAlign: 'center', 
                      p: 1.5, 
                      borderRadius: '10px', 
                      backgroundColor: colors.panelBg 
                    }}>
                      <Typography variant="subtitle2" sx={{ color: colors.secondaryText, mb: 1 }}>
                        Signal Line
                      </Typography>
                      <Typography variant="h6" sx={{ 
                        color: colors.primaryText,
                        fontWeight: 'bold'
                      }}>
                        {getTechnicalIndicators().macdSignal.toFixed(4)}
                        </Typography>
                      </Box>
                  </Grid>
                  <Grid item xs={4}>
                    <Box sx={{ 
                      textAlign: 'center', 
                      p: 1.5, 
                      borderRadius: '10px', 
                      backgroundColor: colors.panelBg 
                    }}>
                      <Typography variant="subtitle2" sx={{ color: colors.secondaryText, mb: 1 }}>
                        Histogram
                      </Typography>
                      <Typography variant="h6" sx={{ 
                        color: getTechnicalIndicators().macdHist > 0 ? colors.buyGreen : colors.sellRed,
                        fontWeight: 'bold'
                      }}>
                        {getTechnicalIndicators().macdHist.toFixed(4)}
                        </Typography>
                      </Box>
                  </Grid>
                </Grid>
                <Box sx={{ mt: 2, p: 1, borderRadius: '8px', backgroundColor: `${colors.accentBlue}15` }}>
                  <Typography variant="body2" sx={{ color: colors.secondaryText }}>
                    Signal: {getTechnicalIndicators().macd > getTechnicalIndicators().macdSignal ? <span style={{ color: colors.buyGreen, fontWeight: 'bold' }}>Bullish</span> : <span style={{ color: colors.sellRed, fontWeight: 'bold' }}>Bearish</span>}
                  </Typography>
                  </Box>
                </Box>

              {/* Moving Averages */}
                  <Box>
                <Typography variant="subtitle1" sx={{ color: colors.secondaryText, mb: 2 }}>
                  Moving Averages
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={4}>
                    <Box sx={{ 
                      textAlign: 'center', 
                      p: 1.5, 
                      borderRadius: '10px', 
                      backgroundColor: colors.panelBg,
                      height: '100%' 
                    }}>
                    <Typography variant="subtitle2" sx={{ color: colors.secondaryText, mb: 1 }}>
                        SMA 20
                    </Typography>
                      <Tooltip title="Moving Averages smooth out price data to create a single flowing line, making it easier to identify trends. They represent the average price over a specific time period. When price is above the MA, it indicates an uptrend; when below, a downtrend." arrow>
                        <IconButton size="small" sx={{ color: colors.secondaryText }}>
                          <HelpOutlineIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Typography variant="h6" sx={{ fontWeight: 'bold', color: colors.primaryText }}>
                        {getTechnicalIndicators().sma20.toFixed(4)}
                        </Typography>
                      </Box>
                  </Grid>
                  <Grid item xs={4}>
                    <Box sx={{ 
                      textAlign: 'center', 
                      p: 1.5, 
                      borderRadius: '10px', 
                      backgroundColor: colors.panelBg,
                      height: '100%'  
                    }}>
                      <Typography variant="subtitle2" sx={{ color: colors.secondaryText, mb: 1 }}>
                        SMA 50
                      </Typography>
                      <Tooltip title="Moving Averages smooth out price data to create a single flowing line, making it easier to identify trends. They represent the average price over a specific time period. When price is above the MA, it indicates an uptrend; when below, a downtrend." arrow>
                        <IconButton size="small" sx={{ color: colors.secondaryText }}>
                          <HelpOutlineIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Typography variant="h6" sx={{ fontWeight: 'bold', color: colors.primaryText }}>
                        {getTechnicalIndicators().sma50.toFixed(4)}
                        </Typography>
                      </Box>
                  </Grid>
                  <Grid item xs={4}>
                    <Box sx={{ 
                      textAlign: 'center', 
                      p: 1.5, 
                      borderRadius: '10px', 
                      backgroundColor: colors.panelBg,
                      height: '100%'  
                    }}>
                      <Typography variant="subtitle2" sx={{ color: colors.secondaryText, mb: 1 }}>
                        SMA 200
                      </Typography>
                      <Tooltip title="Moving Averages smooth out price data to create a single flowing line, making it easier to identify trends. They represent the average price over a specific time period. When price is above the MA, it indicates an uptrend; when below, a downtrend." arrow>
                        <IconButton size="small" sx={{ color: colors.secondaryText }}>
                          <HelpOutlineIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Typography variant="h6" sx={{ fontWeight: 'bold', color: colors.primaryText }}>
                        {getTechnicalIndicators().sma200.toFixed(4)}
                        </Typography>
                      </Box>
                  </Grid>
                </Grid>
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
                flexDirection: 'column',
                display: settings.showSupportResistance ? 'flex' : 'none'
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
                    {analysisData && analysisData.support_resistance && 
                     Array.isArray(analysisData.support_resistance.support) && 
                     analysisData.support_resistance.support.length > 0 ? (
                      analysisData.support_resistance.support.map((level, index) => {
                        // Make sure level is a valid number
                        const numValue = typeof level === 'object' 
                          ? parseFloat(level.level_value || 0) 
                          : parseFloat(level || 0);
                          
                        return (
                      <Chip 
                        key={index}
                            label={!isNaN(numValue) ? numValue.toFixed(4) : '0.0000'}
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
                        );
                      })
                    ) : error && error.includes('estimated data') && analysisData ? (
                      // Generate synthetic support levels for missing data
                      Array.from({ length: 3 }).map((_, index) => {
                        const basePrice = analysisData.current_price;
                        const supportLevel = (basePrice * (0.99 - (index * 0.005))).toFixed(4);
                        return (
                      <Chip 
                        key={index}
                            label={supportLevel}
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
                        );
                      })
                    ) : (
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
                    {analysisData && analysisData.support_resistance && 
                     Array.isArray(analysisData.support_resistance.resistance) && 
                     analysisData.support_resistance.resistance.length > 0 ? (
                      analysisData.support_resistance.resistance.map((level, index) => {
                        // Make sure level is a valid number
                        const numValue = typeof level === 'object' 
                          ? parseFloat(level.level_value || 0) 
                          : parseFloat(level || 0);
                          
                        return (
                      <Chip 
                        key={index}
                            label={!isNaN(numValue) ? numValue.toFixed(4) : '0.0000'}
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
                        );
                      })
                    ) : error && error.includes('estimated data') && analysisData ? (
                      // Generate synthetic resistance levels for missing data
                      Array.from({ length: 3 }).map((_, index) => {
                        const basePrice = analysisData.current_price;
                        const resistanceLevel = (basePrice * (1.01 + (index * 0.005))).toFixed(4);
                        return (
                      <Chip 
                        key={index}
                            label={resistanceLevel}
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
                        );
                      })
                    ) : (
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
                              ? analysisData.prediction_dates[index].replace(/^\d{4}-/, '') // Format as MM-DD
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
                flexDirection: 'column',
                display: settings.showSentimentAnalysis ? 'flex' : 'none'
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

      {/* Market Info Dialog */}
      <Dialog
        open={marketInfoOpen}
        onClose={() => setMarketInfoOpen(false)}
        maxWidth="md"
        PaperProps={{
          sx: {
            backgroundColor: colors.cardBg,
            color: colors.primaryText,
            borderRadius: '12px',
            border: `1px solid ${colors.borderColor}`
          }
        }}
      >
        <DialogTitle sx={{ 
          borderBottom: `1px solid ${colors.borderColor}`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <Typography variant="h6" component="div" sx={{ color: colors.primaryText }}>
            {getCurrencyInfo().name} Information
          </Typography>
          <IconButton
            edge="end"
            color="inherit"
            onClick={() => setMarketInfoOpen(false)}
            aria-label="close"
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          <Typography variant="body1" sx={{ mb: 2, color: colors.primaryText }}>
            {getCurrencyInfo().description}
          </Typography>
          
          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={12} md={6}>
              <Paper sx={{ 
                p: 2, 
                backgroundColor: colors.panelBg,
                borderRadius: '8px',
                height: '100%'
              }}>
                <Typography variant="subtitle1" sx={{ mb: 1, color: colors.accentBlue, fontWeight: 'bold' }}>
                  Currency Information
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <Box>
                    <Typography variant="subtitle2" sx={{ color: colors.secondaryText }}>
                      Base Currency:
                    </Typography>
                    <Typography variant="body2" sx={{ color: colors.primaryText }}>
                      {getCurrencyInfo().baseCurrency}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="subtitle2" sx={{ color: colors.secondaryText }}>
                      Quote Currency:
                    </Typography>
                    <Typography variant="body2" sx={{ color: colors.primaryText }}>
                      {getCurrencyInfo().quoteCurrency}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="subtitle2" sx={{ color: colors.secondaryText }}>
                      Central Banks:
                    </Typography>
                    <Typography variant="body2" sx={{ color: colors.primaryText }}>
                      {getCurrencyInfo().centralBanks}
                    </Typography>
                  </Box>
                </Box>
              </Paper>
            </Grid>
            <Grid item xs={12} md={6}>
              <Paper sx={{ 
                p: 2, 
                backgroundColor: colors.panelBg,
                borderRadius: '8px',
                height: '100%'
              }}>
                <Typography variant="subtitle1" sx={{ mb: 1, color: colors.accentBlue, fontWeight: 'bold' }}>
                  Trading Characteristics
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <Box>
                    <Typography variant="subtitle2" sx={{ color: colors.secondaryText }}>
                      Trading Hours:
                    </Typography>
                    <Typography variant="body2" sx={{ color: colors.primaryText }}>
                      {getCurrencyInfo().tradingHours}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="subtitle2" sx={{ color: colors.secondaryText }}>
                      Typical Spread:
                    </Typography>
                    <Typography variant="body2" sx={{ color: colors.primaryText }}>
                      {getCurrencyInfo().typicalSpread}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="subtitle2" sx={{ color: colors.secondaryText }}>
                      Volatility:
                    </Typography>
                    <Typography variant="body2" sx={{ color: colors.primaryText }}>
                      {getCurrencyInfo().volatility}
                    </Typography>
                  </Box>
                </Box>
              </Paper>
            </Grid>
          </Grid>
          
          <Paper sx={{ 
            p: 2, 
            backgroundColor: colors.panelBg,
            borderRadius: '8px',
            mb: 2
          }}>
            <Typography variant="subtitle1" sx={{ mb: 1, color: colors.accentBlue, fontWeight: 'bold' }}>
              Major Influences
            </Typography>
            <Typography variant="body2" sx={{ color: colors.primaryText }}>
              {getCurrencyInfo().majorInfluences}
            </Typography>
          </Paper>
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="subtitle2" sx={{ color: colors.secondaryText }}>
              Learn more about forex trading:
            </Typography>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Link 
                href="https://www.babypips.com/learn/forex" 
                target="_blank" 
                rel="noopener"
                sx={{ 
                  display: 'flex', 
                  alignItems: 'center',
                  color: colors.accentBlue,
                  '&:hover': {
                    color: colors.gradientStart
                  }
                }}
              >
                BabyPips School of Pipsology
                <LaunchIcon fontSize="small" sx={{ ml: 0.5 }} />
              </Link>
              <Link 
                href="https://www.forexfactory.com/education" 
                target="_blank" 
                rel="noopener"
                sx={{ 
                  display: 'flex', 
                  alignItems: 'center',
                  color: colors.accentBlue,
                  '&:hover': {
                    color: colors.gradientStart
                  }
                }}
              >
                Forex Factory
                <LaunchIcon fontSize="small" sx={{ ml: 0.5 }} />
              </Link>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ borderTop: `1px solid ${colors.borderColor}`, px: 3, py: 2 }}>
          <Button 
            onClick={() => setMarketInfoOpen(false)}
            variant="outlined"
            sx={{
              borderColor: colors.borderColor,
              color: colors.secondaryText,
              '&:hover': {
                borderColor: colors.accentBlue,
                backgroundColor: `${colors.accentBlue}10`
              }
            }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Settings Dialog */}
      <Dialog
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            backgroundColor: colors.cardBg,
            color: colors.primaryText,
            borderRadius: '12px',
            border: `1px solid ${colors.borderColor}`
          }
        }}
      >
        <DialogTitle sx={{ 
          borderBottom: `1px solid ${colors.borderColor}`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <Typography variant="h6" component="div">
            Market Analysis Settings
          </Typography>
          <IconButton
            edge="end"
            color="inherit"
            onClick={() => setSettingsOpen(false)}
            aria-label="close"
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          <Typography variant="subtitle1" sx={{ mb: 2, color: colors.accentBlue, fontWeight: 'bold' }}>
            Display Settings
          </Typography>
          
          <FormControlLabel
            control={
              <Switch 
                checked={settings.showTechnicalIndicators}
                onChange={handleSettingsChange('showTechnicalIndicators')}
                sx={{
                  '& .MuiSwitch-switchBase.Mui-checked': {
                    color: colors.accentBlue,
                  },
                  '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                    backgroundColor: colors.accentBlue,
                  },
                }}
              />
            }
            label="Show Technical Indicators"
            sx={{ display: 'block', mb: 1 }}
          />
          
          <FormControlLabel
            control={
              <Switch 
                checked={settings.showSupportResistance}
                onChange={handleSettingsChange('showSupportResistance')}
                sx={{
                  '& .MuiSwitch-switchBase.Mui-checked': {
                    color: colors.accentBlue,
                  },
                  '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                    backgroundColor: colors.accentBlue,
                  },
                }}
              />
            }
            label="Show Support & Resistance Levels"
            sx={{ display: 'block', mb: 1 }}
          />
          
          <FormControlLabel
            control={
              <Switch 
                checked={settings.showSentimentAnalysis}
                onChange={handleSettingsChange('showSentimentAnalysis')}
                sx={{
                  '& .MuiSwitch-switchBase.Mui-checked': {
                    color: colors.accentBlue,
                  },
                  '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                    backgroundColor: colors.accentBlue,
                  },
                }}
              />
            }
            label="Show Sentiment Analysis"
            sx={{ display: 'block', mb: 3 }}
          />
          
          <Typography variant="subtitle1" sx={{ mb: 2, color: colors.accentBlue, fontWeight: 'bold' }}>
            Chart Settings
          </Typography>
          
          <FormControl component="fieldset" sx={{ mb: 2 }}>
            <Typography variant="subtitle2" sx={{ color: colors.secondaryText, mb: 1 }}>
              Chart Style
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              {['area', 'line', 'candle'].map((style) => (
                <Button 
                  key={style}
                  variant={settings.chartStyle === style ? 'contained' : 'outlined'}
                  onClick={() => handleChartStyleChange(style)}
                  sx={{
                    textTransform: 'capitalize',
                    backgroundColor: settings.chartStyle === style ? colors.accentBlue : 'transparent',
                    borderColor: colors.borderColor,
                    color: settings.chartStyle === style ? colors.primaryText : colors.secondaryText,
                    '&:hover': {
                      backgroundColor: settings.chartStyle === style ? colors.accentBlue : `${colors.accentBlue}10`,
                      borderColor: colors.accentBlue
                    }
                  }}
                >
                  {style}
                </Button>
              ))}
            </Box>
          </FormControl>
          
          <Typography variant="subtitle1" sx={{ mb: 2, color: colors.accentBlue, fontWeight: 'bold' }}>
            Advanced Settings
          </Typography>
          
          <FormControlLabel
            control={
              <Switch 
                checked={settings.enableRealTimeUpdates}
                onChange={handleSettingsChange('enableRealTimeUpdates')}
                sx={{
                  '& .MuiSwitch-switchBase.Mui-checked': {
                    color: colors.accentBlue,
                  },
                  '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                    backgroundColor: colors.accentBlue,
                  },
                }}
              />
            }
            label="Enable Real-time Updates"
            sx={{ display: 'block', mb: 1 }}
          />
          
          <FormControlLabel
            control={
              <Switch 
                checked={settings.darkMode}
                onChange={handleSettingsChange('darkMode')}
                sx={{
                  '& .MuiSwitch-switchBase.Mui-checked': {
                    color: colors.accentBlue,
                  },
                  '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                    backgroundColor: colors.accentBlue,
                  },
                }}
              />
            }
            label="Dark Mode"
            sx={{ display: 'block', mb: 1 }}
          />
          
          <Box sx={{ mt: 3, p: 2, backgroundColor: colors.panelBg, borderRadius: '8px' }}>
            <Typography variant="subtitle2" sx={{ color: colors.secondaryText, display: 'flex', alignItems: 'center' }}>
              <InfoIcon fontSize="small" sx={{ mr: 1, color: colors.accentBlue }} />
              Settings are applied immediately and saved for your next visit
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions sx={{ borderTop: `1px solid ${colors.borderColor}`, px: 3, py: 2 }}>
          <Button 
            onClick={() => setSettingsOpen(false)}
            variant="outlined"
            sx={{
              borderColor: colors.borderColor,
              color: colors.secondaryText,
              '&:hover': {
                borderColor: colors.accentBlue,
                backgroundColor: `${colors.accentBlue}10`
              }
            }}
          >
            Close
          </Button>
          <Button 
            onClick={() => {
              // Reset settings to default
              setSettings({
                showTechnicalIndicators: true,
                showSupportResistance: true,
                showSentimentAnalysis: true,
                enableRealTimeUpdates: false,
                darkMode: true,
                chartStyle: 'area'
              });
            }}
            variant="contained"
            sx={{
              backgroundColor: colors.accentBlue,
              '&:hover': {
                backgroundColor: colors.gradientStart
              }
            }}
          >
            Reset to Default
          </Button>
        </DialogActions>
      </Dialog>

      {/* Settings Notification */}
      <Snackbar 
        open={settingsNotification} 
        autoHideDuration={3000} 
        onClose={() => setSettingsNotification(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={() => setSettingsNotification(false)} 
          severity="success" 
          variant="filled"
          sx={{ bgcolor: colors.accentBlue, color: colors.primaryText }}
        >
          Settings updated successfully
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Market;
