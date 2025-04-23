import React, { useState, useEffect, useRef } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Grid,
  IconButton,
  Tooltip,
  Chip,
  Divider,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Slider,
  CircularProgress,
  Alert,
  Snackbar,
  Stack,
  Container,
  Card,
  CardContent,
  Badge,
  Switch,
  FormControlLabel
} from '@mui/material';
import { createChart, CrosshairMode, LineStyle } from 'lightweight-charts';
import Sidebar from './Sidebar';
import { API } from '../axiosConfig';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import CloseIcon from '@mui/icons-material/Close';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import BarChartIcon from '@mui/icons-material/BarChart';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import CandlestickChartIcon from '@mui/icons-material/CandlestickChart';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import RefreshIcon from '@mui/icons-material/Refresh';
import InfoIcon from '@mui/icons-material/Info';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import HistoryIcon from '@mui/icons-material/History';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import PriceChart from '../components/PriceChart';

// Forex Trading Color Palette - Modern Dark Theme
const colors = {
  darkBg: '#121212',
  panelBg: '#1E1E1E',
  cardBg: '#252525',
  primaryText: '#FFFFFF',
  secondaryText: '#B0B0B0',
  buyGreen: '#4CAF50',
  sellRed: '#F44336',
  accentBlue: '#2196F3',
  warningOrange: '#FF9800',
  profitGreen: '#00C853',
  lossRed: '#D50000',
  chartLine: '#2196F3',
  borderColor: '#333333',
  shadowColor: 'rgba(0, 0, 0, 0.5)',
  hoverBg: 'rgba(33, 150, 243, 0.1)',
};

const ShortTermTrading = () => {
  // Forex pairs available for trading with Yahoo Finance format
  const forexPairs = [
    { label: 'EUR/USD', value: 'EURUSD=X' },
    { label: 'GBP/USD', value: 'GBPUSD=X' },
    { label: 'USD/JPY', value: 'USDJPY=X' },
    { label: 'USD/CHF', value: 'USDCHF=X' },
    { label: 'AUD/USD', value: 'AUDUSD=X' },
    { label: 'USD/CAD', value: 'USDCAD=X' },
    { label: 'NZD/USD', value: 'NZDUSD=X' },
    { label: 'EUR/GBP', value: 'EURGBP=X' },
    { label: 'EUR/JPY', value: 'EURJPY=X' },
    { label: 'GBP/JPY', value: 'GBPJPY=X' }
  ];
  
  // Chart refs
  const chartContainerRef = useRef(null);
  const chartRef = useRef(null);
  const candleSeriesRef = useRef(null);
  const volumeSeriesRef = useRef(null);
  const maSeriesRef = useRef([]);
  const supportLevelsRef = useRef([]);
  const resistanceLevelsRef = useRef([]);
  
  // UI State
  const [loading, setLoading] = useState(false);
  const [chartLoading, setChartLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tradeTab, setTradeTab] = useState(0);
  const [notification, setNotification] = useState({ open: false, message: '', type: 'info' });
  const [chartType, setChartType] = useState('candles');
  const [showIndicators, setShowIndicators] = useState(true);
  const [chartData, setChartData] = useState([]);
  const [supportResistance, setSupportResistance] = useState({
    support: [],
    resistance: []
  });
  
  // Trading State
  const [selectedPair, setSelectedPair] = useState(forexPairs[0]);
  const [marketData, setMarketData] = useState([]);
  const [currentPrice, setCurrentPrice] = useState(null);
  const [priceChange, setPriceChange] = useState({ value: 0, percentage: 0 });
  const [selectedTimeframe, setSelectedTimeframe] = useState('1h');
  const [orderType, setOrderType] = useState('market');
  const [tradeDirection, setTradeDirection] = useState('buy');
  const [orderAmount, setOrderAmount] = useState(0.1);
  const [leverage, setLeverage] = useState(10);
  const [limitPrice, setLimitPrice] = useState('');
  const [stopLoss, setStopLoss] = useState('');
  const [takeProfit, setTakeProfit] = useState('');
  
  // Account State
  const [accountBalance, setAccountBalance] = useState(10000);
  const [availableBalance, setAvailableBalance] = useState(10000);
  const [marginUsed, setMarginUsed] = useState(0);
  const [equity, setEquity] = useState(10000);
  const [openPositions, setOpenPositions] = useState([]);
  const [pendingOrders, setPendingOrders] = useState([]);
  const [tradeHistory, setTradeHistory] = useState([]);
  
  // Technical Analysis State
  const [technicalIndicators, setTechnicalIndicators] = useState({
    rsi: 50,
    macd: { macd: 0, signal: 0, histogram: 0 },
    ma: { fast: [], slow: [] },
    volume: [],
    supports: [],
    resistances: []
  });
  
  // Time intervals for chart
  const timeIntervals = [
    { value: '1m', label: '1m' },
    { value: '5m', label: '5m' },
    { value: '15m', label: '15m' },
    { value: '30m', label: '30m' },
    { value: '1h', label: '1h' },
    { value: '4h', label: '4h' },
    { value: '1d', label: '1d' }
  ];

  // Format time without date-fns
  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });
  };

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  // Initialize chart with advanced features
  useEffect(() => {
    if (!chartContainerRef.current) return;
    
    // Create chart instance
    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { color: colors.chartBg },
        textColor: colors.primaryText,
      },
      grid: {
        vertLines: { color: colors.gridLines },
        horzLines: { color: colors.gridLines },
      },
      width: chartContainerRef.current.clientWidth,
      height: chartContainerRef.current.clientHeight,
      timeScale: {
        timeVisible: true,
        secondsVisible: false,
        borderColor: colors.borderColor,
      },
      rightPriceScale: {
        borderColor: colors.borderColor,
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: {
          color: colors.crosshair,
          width: 1,
          style: LineStyle.Dashed,
        },
        horzLine: {
          color: colors.crosshair,
          width: 1,
          style: LineStyle.Dashed,
        },
      },
      handleScroll: {
        vertTouchDrag: false,
      },
    });
    
    // Store chart reference
    chartRef.current = chart;
    
    // Set up candle series
    const candleSeries = chartType === 'candles' 
      ? chart.addCandlestickSeries({
          upColor: colors.buyGreen,
          downColor: colors.sellRed,
          borderUpColor: colors.buyGreen,
          borderDownColor: colors.sellRed,
          wickUpColor: colors.buyGreen,
          wickDownColor: colors.sellRed,
        })
      : chart.addLineSeries({
          color: colors.accentBlue,
          lineWidth: 2,
        });
    
    candleSeriesRef.current = candleSeries;
    
    // Add volume histogram if in candle mode
    if (chartType === 'candles') {
      // Create volume series with 30% panel height
      const volumeSeries = chart.addHistogramSeries({
        color: colors.secondaryText,
        priceFormat: {
          type: 'volume',
        },
        priceScaleId: 'volume',
        scaleMargins: {
          top: 0.8,
          bottom: 0,
        },
      });
      
      volumeSeriesRef.current = volumeSeries;
    }
    
    // Create moving average lines
    if (showIndicators) {
      const ma20Series = chart.addLineSeries({
        color: '#FF6D00',
        lineWidth: 1,
        priceLineVisible: false,
        title: 'MA 20',
      });
      
      const ma50Series = chart.addLineSeries({
        color: '#2962FF',
        lineWidth: 1,
        priceLineVisible: false,
        title: 'MA 50',
      });
      
      const ma200Series = chart.addLineSeries({
        color: '#673AB7',
        lineWidth: 1, 
        priceLineVisible: false,
        title: 'MA 200',
      });
      
      maSeriesRef.current = [ma20Series, ma50Series, ma200Series];
    }
    
    // Handle resize
    const handleResize = () => {
      if (chartRef.current && chartContainerRef.current) {
        chartRef.current.applyOptions({
          width: chartContainerRef.current.clientWidth,
          height: chartContainerRef.current.clientHeight
        });
      }
    };
    
    window.addEventListener('resize', handleResize);
    
    // Generate initial data
    if (!chartLoading && !marketData.length) {
      generateMarketData();
    }
    
    return () => {
      window.removeEventListener('resize', handleResize);
      
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
      }
    };
  }, [chartType, showIndicators, colors]);

  // Generate realistic forex price data
  const generateMarketData = async () => {
    setLoading(true);
    setError(null);

    try {
      // Try to fetch live market data
      const response = await axios.get(`/api/market-data/${selectedPair.value}`);
      const data = response.data;

      if (data && data.currentPrice) {
        // Update current price
        setCurrentPrice(data.currentPrice);
        
        // Update indicators
        const indicators = {
          rsi: data.technicalIndicators?.rsi || 50,
          macd: data.technicalIndicators?.macd || { macd: 0, signal: 0, histogram: 0 },
          sma: data.technicalIndicators?.sma || [0, 0, 0]
        };
        setTechnicalIndicators(indicators);
        
        // Update support and resistance
        setSupportResistance({
          support: data.supportResistance?.support || [data.currentPrice * 0.98, data.currentPrice * 0.95],
          resistance: data.supportResistance?.resistance || [data.currentPrice * 1.02, data.currentPrice * 1.05]
        });
        
        // Process historical data for chart
        if (data.historicalData && data.historicalData.length > 0) {
          const chartData = data.historicalData.map(item => ({
            time: new Date(item.date).getTime() / 1000,
            open: item.open,
            high: item.high,
            low: item.low,
            close: item.close
          }));
          
          // Calculate moving averages
          const [ma20, ma50, ma200] = calculateMovingAverages(chartData);
          
          // Update chart with data
          setChartData(chartData);
          updateChart(chartData, ma20, ma50, ma200);
        } else {
          // Generate fallback data if no historical data
          generateFallbackData(data.currentPrice);
        }
      } else {
        throw new Error("Invalid data format received from API");
      }
    } catch (error) {
      console.error("Error fetching market data:", error);
      setError(`Unable to fetch market data: ${error.message}`);
      
      // Fallback to simulated data
      generateFallbackData();
    }

    setLoading(false);
  };

  const generateFallbackData = (basePrice = 100) => {
    // Generate a random base price near 100 if not provided
    const actualBasePrice = basePrice || (95 + Math.random() * 10);
    setCurrentPrice(actualBasePrice);
    
    // Set default indicators
    setTechnicalIndicators({
      rsi: 45 + Math.random() * 10,
      macd: { 
        macd: -0.5 + Math.random(), 
        signal: -0.5 + Math.random(), 
        histogram: -0.5 + Math.random() 
      },
      sma: [
        actualBasePrice * (0.98 + Math.random() * 0.04),
        actualBasePrice * (0.97 + Math.random() * 0.06),
        actualBasePrice * (0.96 + Math.random() * 0.08)
      ]
    });
    
    // Set support and resistance
    setSupportResistance({
      support: [actualBasePrice * 0.98, actualBasePrice * 0.95],
      resistance: [actualBasePrice * 1.02, actualBasePrice * 1.05]
    });
    
    // Generate historical data based on timeframe
    const now = new Date();
    const data = [];
    const volatility = 0.005; // 0.5% volatility
    
    // Number of data points based on timeframe
    let dataPoints = 200;
    let interval = 24 * 60 * 60; // 1 day in seconds
    
    if (timeframe === '1h') {
      dataPoints = 60;
      interval = 60 * 60; // 1 hour in seconds
    } else if (timeframe === '4h') {
      dataPoints = 60;
      interval = 4 * 60 * 60; // 4 hours in seconds
    } else if (timeframe === '1d') {
      dataPoints = 60;
      interval = 24 * 60 * 60; // 1 day in seconds
    } else if (timeframe === '1w') {
      dataPoints = 52;
      interval = 7 * 24 * 60 * 60; // 1 week in seconds
    }
    
    let price = actualBasePrice * (0.9 + Math.random() * 0.2);
    
    // Generate data points
    for (let i = 0; i < dataPoints; i++) {
      const time = Math.floor(now.getTime() / 1000) - (dataPoints - i) * interval;
      const change = (Math.random() - 0.5) * volatility * price;
      price += change;
      
      const dailyVolatility = price * volatility;
      const open = price;
      const close = price + (Math.random() - 0.5) * dailyVolatility;
      const high = Math.max(open, close) + Math.random() * dailyVolatility * 0.5;
      const low = Math.min(open, close) - Math.random() * dailyVolatility * 0.5;
      
      data.push({
        time,
        open,
        high,
        low,
        close
      });
    }
    
    // Calculate moving averages
    const [ma20, ma50, ma200] = calculateMovingAverages(data);
    
    // Update chart data
    setChartData(data);
    updateChart(data, ma20, ma50, ma200);
  };

  const updateChart = (data, ma20 = [], ma50 = [], ma200 = []) => {
    if (chartRef.current && data?.length > 0) {
      const chart = chartRef.current;
      
      // Clear previous series
      chart.removeAllSeries();
      
      // Add candlestick series
      const mainSeries = chart.addCandlestickSeries({
        upColor: '#26a69a', 
        downColor: '#ef5350',
        borderVisible: false,
        wickUpColor: '#26a69a', 
        wickDownColor: '#ef5350'
      });
      
      mainSeries.setData(data);
      
      // Add moving average series
      if (ma20.length > 0) {
        const ma20Series = chart.addLineSeries({
          color: '#2196F3',
          lineWidth: 2,
          title: 'MA20'
        });
        ma20Series.setData(ma20);
      }
      
      if (ma50.length > 0) {
        const ma50Series = chart.addLineSeries({
          color: '#FF9800',
          lineWidth: 2,
          title: 'MA50'
        });
        ma50Series.setData(ma50);
      }
      
      if (ma200.length > 0) {
        const ma200Series = chart.addLineSeries({
          color: '#E91E63',
          lineWidth: 2,
          title: 'MA200'
        });
        ma200Series.setData(ma200);
      }
      
      // Fit content
      chart.timeScale().fitContent();
    }
  };
  
  // Generate candle data based on base price and timeframe
  const generatePriceData = (basePrice, timeframe) => {
    try {
      const now = new Date();
      const data = [];
      let lastClose = basePrice;
      let trend = 0; // -1 = down, 0 = sideways, 1 = up
      let trendStrength = 0.5; // 0 = weak, 1 = strong
      let trendDuration = 0;
      const maxTrendDuration = 20;
      
      // Determine time interval in minutes
      let intervalMinutes;
      switch(timeframe) {
        case '1m': intervalMinutes = 1; break;
        case '5m': intervalMinutes = 5; break;
        case '15m': intervalMinutes = 15; break;
        case '30m': intervalMinutes = 30; break;
        case '1h': intervalMinutes = 60; break;
        case '4h': intervalMinutes = 240; break;
        case '1d': intervalMinutes = 1440; break;
        default: intervalMinutes = 60; // Default to 1h
      }
      
      // Generate more realistic data with trends and volatility based on timeframe
      for (let i = 300; i >= 0; i--) {
        const time = new Date(now);
        time.setMinutes(time.getMinutes() - (i * intervalMinutes));
        
        // Adjust volatility based on timeframe
        let volatility;
        switch(timeframe) {
          case '1m': volatility = 0.0001; break;
          case '5m': volatility = 0.0002; break;
          case '15m': volatility = 0.0003; break;
          case '30m': volatility = 0.0004; break;
          case '1h': volatility = 0.0005; break;
          case '4h': volatility = 0.0008; break;
          case '1d': volatility = 0.001; break;
          default: volatility = 0.0005;
        }
        
        // Randomly change trend
        if (trendDuration >= maxTrendDuration || Math.random() < 0.05) {
          trend = Math.floor(Math.random() * 3) - 1; // -1, 0, or 1
          trendStrength = 0.2 + Math.random() * 0.8; // Between 0.2 and 1
          trendDuration = 0;
        } else {
          trendDuration++;
        }
        
        // Create price movement with trend bias
        const trendBias = trend * trendStrength * volatility;
        const randomChange = (Math.random() - 0.5) * volatility;
        const change = randomChange + trendBias;
        
        // Calculate OHLC values
        const open = lastClose;
        const close = parseFloat((open + change).toFixed(5));
        
        // Higher volatility for high/low based on timeframe
        const wickVolatility = volatility * (1 + Math.random() * 0.5);
        const high = parseFloat(Math.max(open, close, open + (Math.random() * wickVolatility)).toFixed(5));
        const low = parseFloat(Math.min(open, close, open - (Math.random() * wickVolatility)).toFixed(5));
        
        // Generate volume
        const volume = Math.floor(Math.random() * 100) + 50;
        
        // Add data point
        data.push({
          time: Math.floor(time.getTime() / 1000),
          open,
          high,
          low,
          close,
          volume
        });
        
        lastClose = close;
      }
      
      return data;
    } catch (error) {
      console.error('Error generating price data:', error);
      return [];
    }
  };
  
  // Calculate Moving Average
  const calculateMA = (data, period) => {
    const result = [];
    for (let i = period - 1; i < data.length; i++) {
      const sum = data.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
      result.push(sum / period);
    }
    return result;
  };
  
  // Generate technical indicators
  const generateTechnicalIndicators = (data) => {
    // Get closing prices
    const closes = data.map(item => item.close);
    
    // Calculate RSI
    const rsiValue = calculateRSI(closes, 14);
    
    // Calculate MACD
    const macdValues = calculateMACD(closes);
    
    // Calculate moving averages
    const ma20 = calculateMA(closes, 20);
    const ma50 = calculateMA(closes, 50);
    const ma200 = calculateMA(closes, 200);
    
    // Identify support and resistance levels
    const levels = identifyKeyLevels(data);
    
    return {
      rsi: rsiValue,
      macd: macdValues,
      ma: {
        fast: ma20,
        medium: ma50,
        slow: ma200
      },
      supports: levels.supports,
      resistances: levels.resistances
    };
  };
  
  // Calculate RSI (Relative Strength Index)
  const calculateRSI = (prices, period = 14) => {
    if (prices.length < period + 1) {
      return 50; // Default neutral value if not enough data
    }
    
    let gains = 0;
    let losses = 0;
    
    // Calculate initial average gain/loss
    for (let i = 1; i <= period; i++) {
      const change = prices[i] - prices[i - 1];
      if (change >= 0) {
        gains += change;
      } else {
        losses -= change;
      }
    }
    
    let avgGain = gains / period;
    let avgLoss = losses / period;
    
    // Calculate RSI using the smoothed method
    for (let i = period + 1; i < prices.length; i++) {
      const change = prices[i] - prices[i - 1];
      let currentGain = 0;
      let currentLoss = 0;
      
      if (change >= 0) {
        currentGain = change;
      } else {
        currentLoss = -change;
      }
      
      avgGain = ((avgGain * (period - 1)) + currentGain) / period;
      avgLoss = ((avgLoss * (period - 1)) + currentLoss) / period;
    }
    
    if (avgLoss === 0) {
      return 100;
    }
    
    const rs = avgGain / avgLoss;
    return parseFloat((100 - (100 / (1 + rs))).toFixed(2));
  };
  
  // Calculate MACD (Moving Average Convergence Divergence)
  const calculateMACD = (prices) => {
    const fastEMA = calculateEMA(prices, 12);
    const slowEMA = calculateEMA(prices, 26);
    
    if (fastEMA.length === 0 || slowEMA.length === 0) {
      return { macd: 0, signal: 0, histogram: 0 };
    }
    
    // Calculate MACD line
    const macdLine = [];
    for (let i = 0; i < slowEMA.length; i++) {
      const fastIndex = fastEMA.length - slowEMA.length + i;
      if (fastIndex >= 0) {
        macdLine.push(fastEMA[fastIndex] - slowEMA[i]);
      }
    }
    
    // Calculate signal line (9-day EMA of MACD)
    const signalLine = calculateEMA(macdLine, 9);
    
    if (signalLine.length === 0) {
      return { macd: 0, signal: 0, histogram: 0 };
    }
    
    // Calculate histogram
    const histogram = macdLine[macdLine.length - 1] - signalLine[signalLine.length - 1];
    
    return {
      macd: parseFloat(macdLine[macdLine.length - 1].toFixed(5)),
      signal: parseFloat(signalLine[signalLine.length - 1].toFixed(5)),
      histogram: parseFloat(histogram.toFixed(5))
    };
  };
  
  // Calculate EMA (Exponential Moving Average)
  const calculateEMA = (prices, period) => {
    if (prices.length < period) {
      return [];
    }
    
    const k = 2 / (period + 1);
    let ema = prices.slice(0, period).reduce((sum, price) => sum + price, 0) / period; // SMA as initial EMA
    const emaValues = [ema];
    
    for (let i = period; i < prices.length; i++) {
      ema = (prices[i] * k) + (ema * (1 - k));
      emaValues.push(ema);
    }
    
    return emaValues;
  };
  
  // Identify support and resistance levels
  const identifyKeyLevels = (data) => {
    if (data.length < 10) {
      return { supports: [], resistances: [] };
    }
    
    const prices = data.map(item => item.close);
    const currentPrice = prices[prices.length - 1];
    
    // Simple swing high/low detection
    const supports = [];
    const resistances = [];
    
    // Look for recent swing lows as support
    for (let i = 10; i < data.length - 2; i++) {
      const prev = data[i-1].low;
      const current = data[i].low;
      const next = data[i+1].low;
      
      if (current < prev && current < next) {
        supports.push(parseFloat(current.toFixed(5)));
      }
    }
    
    // Look for recent swing highs as resistance
    for (let i = 10; i < data.length - 2; i++) {
      const prev = data[i-1].high;
      const current = data[i].high;
      const next = data[i+1].high;
      
      if (current > prev && current > next) {
        resistances.push(parseFloat(current.toFixed(5)));
      }
    }
    
    // Filter levels that are close to current price
    const filteredSupports = supports
      .filter(level => level < currentPrice) // Only levels below current price
      .sort((a, b) => b - a) // Sort descending
      .slice(0, 3); // Take top 3
    
    const filteredResistances = resistances
      .filter(level => level > currentPrice) // Only levels above current price
      .sort((a, b) => a - b) // Sort ascending
      .slice(0, 3); // Take top 3
    
    return {
      supports: filteredSupports,
      resistances: filteredResistances
    };
  };
  
  // Function to add support and resistance levels to the chart
  const addSupportResistanceLevels = (supports, resistances) => {
    try {
      // Clear previous levels
      if (supportLevelsRef.current.length > 0) {
        supportLevelsRef.current.forEach(line => line.remove());
        supportLevelsRef.current = [];
      }
      
      if (resistanceLevelsRef.current.length > 0) {
        resistanceLevelsRef.current.forEach(line => line.remove());
        resistanceLevelsRef.current = [];
      }
      
      // Add support levels
      if (supports && supports.length > 0 && chartRef.current) {
        supports.forEach(level => {
          const supportLine = chartRef.current.addLineSeries({
            color: 'rgba(76, 175, 80, 0.5)',
            lineWidth: 1,
            lineStyle: LineStyle.Dashed,
            priceLineVisible: false,
          });
          
          // Create horizontal line data
          const lineData = [];
          for (let i = 0; i < marketData.length; i++) {
            lineData.push({
              time: marketData[i].time,
              value: level
            });
          }
          
          supportLine.setData(lineData);
          supportLevelsRef.current.push(supportLine);
        });
      }
      
      // Add resistance levels
      if (resistances && resistances.length > 0 && chartRef.current) {
        resistances.forEach(level => {
          const resistanceLine = chartRef.current.addLineSeries({
            color: 'rgba(244, 67, 54, 0.5)',
            lineWidth: 1,
            lineStyle: LineStyle.Dashed,
            priceLineVisible: false,
          });
          
          // Create horizontal line data
          const lineData = [];
          for (let i = 0; i < marketData.length; i++) {
            lineData.push({
              time: marketData[i].time,
              value: level
            });
          }
          
          resistanceLine.setData(lineData);
          resistanceLevelsRef.current.push(resistanceLine);
        });
      }
    } catch (error) {
      console.error('Error adding support/resistance levels:', error);
    }
  };

  // Update market price simulation
  useEffect(() => {
    if (chartLoading) return;
    
    // Initialize the market data if needed
    if (!currentPrice) {
      generateMarketData();
      return;
    }
    
    // Update interval based on timeframe
    const interval = selectedTimeframe === '1m' ? 1000 : 
                    selectedTimeframe === '5m' ? 2000 : 5000;
    
    const updateId = setInterval(() => {
      updateCurrentPrice();
      checkPendingOrders();
      updatePositionsPnL();
    }, interval);
    
    return () => clearInterval(updateId);
  }, [chartLoading, selectedTimeframe, currentPrice]);
  
  // Update the current price with slight movements
  const updateCurrentPrice = () => {
    if (!currentPrice) return;
    
    // Create realistic price movements based on timeframe volatility
    let volatility;
    switch(selectedTimeframe) {
      case '1m': volatility = 0.00005; break;
      case '5m': volatility = 0.0001; break;
      default: volatility = 0.00015;
    }
    
    const change = (Math.random() - 0.5) * volatility;
    const newPrice = parseFloat((currentPrice + change).toFixed(5));
    
    // Update UI with new price
    setCurrentPrice(newPrice);
    
    // Calculate price change
    const priceChangeValue = parseFloat((newPrice - currentPrice).toFixed(5));
    const priceChangePercentage = parseFloat(((priceChangeValue / currentPrice) * 100).toFixed(2));
    
    setPriceChange({
      value: priceChangeValue,
      percentage: priceChangePercentage
    });
    
    // Update chart with new price if we're using line chart
    if (chartRef.current && candleSeriesRef.current && chartType === 'line') {
      candleSeriesRef.current.update({
        time: Math.floor(Date.now() / 1000),
        value: newPrice
      });
    }
  };
  
  // Check pending orders to see if they should be executed
  const checkPendingOrders = () => {
    if (!currentPrice || pendingOrders.length === 0) return;
    
    const triggeredOrders = [];
    const remainingOrders = [];
    
    pendingOrders.forEach(order => {
      let isTriggered = false;
      
      // Check if limit buy order should be executed (price falls below limit)
      if (order.type === 'limit' && order.direction === 'buy' && currentPrice <= order.limitPrice) {
        isTriggered = true;
      }
      // Check if limit sell order should be executed (price rises above limit)
      else if (order.type === 'limit' && order.direction === 'sell' && currentPrice >= order.limitPrice) {
        isTriggered = true;
      }
      // Check if stop buy order should be executed (price rises above stop)
      else if (order.type === 'stop' && order.direction === 'buy' && currentPrice >= order.limitPrice) {
        isTriggered = true;
      }
      // Check if stop sell order should be executed (price falls below stop)
      else if (order.type === 'stop' && order.direction === 'sell' && currentPrice <= order.limitPrice) {
        isTriggered = true;
      }
      
      if (isTriggered) {
        triggeredOrders.push(order);
      } else {
        remainingOrders.push(order);
      }
    });
    
    // Execute triggered orders
    if (triggeredOrders.length > 0) {
      setPendingOrders(remainingOrders);
      
      triggeredOrders.forEach(order => {
        executeOrder(order, currentPrice);
      });
      
      // Notify user
      setNotification({
        open: true,
        message: `${triggeredOrders.length} order(s) executed at ${currentPrice.toFixed(5)}`,
        type: 'success'
      });
    }
  };
  
  // Execute an order and create a position
  const executeOrder = (order, price) => {
    const orderAmount = order.amount;
    const leverage = order.leverage;
    const direction = order.direction;
    const marginRequired = orderAmount / leverage;
    
    // Check if enough margin is available
    if (marginRequired > availableBalance) {
      setNotification({
        open: true,
        message: 'Insufficient balance to execute order',
        type: 'error'
      });
      return;
    }
    
    // Create new position
    const position = {
      id: uuidv4(),
      symbol: selectedPair.label,
      direction,
      openPrice: price,
      currentPrice: price,
      amount: orderAmount,
      leverage,
      margin: marginRequired,
      pnl: 0,
      pnlPercentage: 0,
      takeProfit: order.takeProfit || null,
      stopLoss: order.stopLoss || null,
      openTime: new Date().toISOString()
    };
    
    // Update account
    setMarginUsed(prev => prev + marginRequired);
    setAvailableBalance(prev => prev - marginRequired);
    setOpenPositions(prev => [...prev, position]);
    
    // Add to trade history
    const tradeRecord = {
      id: uuidv4(),
      type: 'OPEN',
      symbol: selectedPair.label,
      direction,
      price,
      amount: orderAmount,
      leverage,
      time: new Date().toISOString(),
      positionId: position.id
    };
    
    setTradeHistory(prev => [tradeRecord, ...prev]);
    
    // Show notification
    setNotification({
      open: true,
      message: `${direction.toUpperCase()} order executed at ${price.toFixed(5)}`,
      type: 'success'
    });
  };
  
  // Update positions PnL
  const updatePositionsPnL = () => {
    if (!currentPrice || openPositions.length === 0) return;
    
    const updatedPositions = openPositions.map(position => {
      // Calculate profit/loss
      const { pnl, pnlPercentage } = calculatePositionPnL(position, currentPrice);
      
      // Check for stop loss or take profit
      let shouldClose = false;
      let closeReason = '';
      
      if (position.stopLoss !== null) {
        if (position.direction === 'buy' && currentPrice <= position.stopLoss) {
          shouldClose = true;
          closeReason = 'Stop Loss';
        } else if (position.direction === 'sell' && currentPrice >= position.stopLoss) {
          shouldClose = true;
          closeReason = 'Stop Loss';
        }
      }
      
      if (!shouldClose && position.takeProfit !== null) {
        if (position.direction === 'buy' && currentPrice >= position.takeProfit) {
          shouldClose = true;
          closeReason = 'Take Profit';
        } else if (position.direction === 'sell' && currentPrice <= position.takeProfit) {
          shouldClose = true;
          closeReason = 'Take Profit';
        }
      }
      
      // Close position if stop loss or take profit hit
      if (shouldClose) {
        closePosition(position.id, closeReason);
        return null;
      }
      
      // Update position with new price and PnL
      return {
        ...position,
        currentPrice,
        pnl,
        pnlPercentage
      };
    }).filter(Boolean); // Remove closed positions (null values)
    
    setOpenPositions(updatedPositions);
    
    // Update equity based on positions PnL
    const totalPnl = updatedPositions.reduce((sum, position) => sum + position.pnl, 0);
    setEquity(accountBalance + totalPnl);
  };
  
  // Calculate position profit/loss
  const calculatePositionPnL = (position, currentPrice) => {
    const direction = position.direction;
    const openPrice = position.openPrice;
    const amount = position.amount;
    const leverage = position.leverage;
    
    // Calculate price difference based on direction
    const priceDiff = direction === 'buy' 
      ? currentPrice - openPrice 
      : openPrice - currentPrice;
    
    // Calculate pip value based on currency pair
    let pipValue = 0.0001; // Default for most pairs
    if (position.symbol.includes('JPY')) {
      pipValue = 0.01; // JPY pairs have 2 decimal places
    }
    
    // Calculate PnL
    const pips = priceDiff / pipValue;
    const pnl = (pips * amount * leverage) / 100;
    
    // Calculate percentage gain/loss relative to margin
    const margin = amount / leverage;
    const pnlPercentage = (pnl / margin) * 100;
    
    return {
      pnl: parseFloat(pnl.toFixed(2)),
      pnlPercentage: parseFloat(pnlPercentage.toFixed(2))
    };
  };
  
  // Place a new order
  const placeOrder = () => {
    // Validate order
    if (orderAmount <= 0) {
      setNotification({
        open: true,
        message: 'Please enter a valid order amount',
        type: 'error'
      });
      return;
    }
    
    const marginRequired = orderAmount / leverage;
    if (marginRequired > availableBalance) {
      setNotification({
        open: true,
        message: 'Insufficient balance for this order',
        type: 'error'
      });
      return;
    }
    
    // For market orders, execute immediately
    if (orderType === 'market') {
      const order = {
        id: uuidv4(),
        type: 'market',
        direction: tradeDirection,
        amount: orderAmount,
        leverage,
        takeProfit: takeProfit ? parseFloat(takeProfit) : null,
        stopLoss: stopLoss ? parseFloat(stopLoss) : null
      };
      
      executeOrder(order, currentPrice);
      
      // Reset form
      resetOrderForm();
    } 
    // For limit/stop orders, add to pending orders
    else {
      if (!limitPrice) {
        setNotification({
          open: true,
          message: 'Please enter a limit price',
          type: 'error'
        });
        return;
      }
      
      const order = {
        id: uuidv4(),
        type: orderType,
        direction: tradeDirection,
        amount: orderAmount,
        leverage,
        limitPrice: parseFloat(limitPrice),
        takeProfit: takeProfit ? parseFloat(takeProfit) : null,
        stopLoss: stopLoss ? parseFloat(stopLoss) : null,
        createdAt: new Date().toISOString()
      };
      
      setPendingOrders(prev => [...prev, order]);
      
      // Reset form
      resetOrderForm();
      
      // Show notification
      setNotification({
        open: true,
        message: `${tradeDirection.toUpperCase()} ${orderType} order placed at ${limitPrice}`,
        type: 'info'
      });
    }
  };
  
  // Cancel a pending order
  const cancelOrder = (orderId) => {
    setPendingOrders(prev => prev.filter(order => order.id !== orderId));
    
    setNotification({
      open: true,
      message: 'Order canceled',
      type: 'info'
    });
  };
  
  // Close an open position
  const closePosition = (positionId, reason = 'Manual Close') => {
    const position = openPositions.find(p => p.id === positionId);
    if (!position) return;
    
    // Calculate final PnL
    const { pnl } = calculatePositionPnL(position, currentPrice);
    
    // Update account balance
    setAccountBalance(prev => prev + pnl);
    setAvailableBalance(prev => prev + position.margin + pnl);
    setMarginUsed(prev => prev - position.margin);
    
    // Remove position
    setOpenPositions(prev => prev.filter(p => p.id !== positionId));
    
    // Add to trade history
    const tradeRecord = {
      id: uuidv4(),
      type: 'CLOSE',
      symbol: position.symbol,
      direction: position.direction,
      price: currentPrice,
      amount: position.amount,
      leverage: position.leverage,
      pnl,
      reason,
      time: new Date().toISOString(),
      positionId: position.id
    };
    
    setTradeHistory(prev => [tradeRecord, ...prev]);
    
    // Show notification
    setNotification({
      open: true,
      message: `Position closed with P/L: ${pnl > 0 ? '+' : ''}${pnl.toFixed(2)} (${reason})`,
      type: pnl >= 0 ? 'success' : 'error'
    });
  };
  
  // Close all positions
  const closeAllPositions = () => {
    if (openPositions.length === 0) return;
    
    openPositions.forEach(position => {
      closePosition(position.id, 'Manual Close (All)');
    });
  };
  
  // Reset order form
  const resetOrderForm = () => {
    setOrderAmount(0.1);
    setLimitPrice('');
    setStopLoss('');
    setTakeProfit('');
  };
  
  // Handle tab change for trade form
  const handleTradeTabChange = (event, newValue) => {
    setTradeTab(newValue);
    resetOrderForm();
  };

  // Calculate moving averages from price data
  const calculateMovingAverages = (data) => {
    try {
      // Extract close prices
      const closes = data.map(item => item.close);
      
      // Calculate 20-period moving average
      const ma20 = [];
      for (let i = 19; i < closes.length; i++) {
        const sum = closes.slice(i - 19, i + 1).reduce((a, b) => a + b, 0);
        const avg = sum / 20;
        ma20.push({
          time: data[i].time,
          value: parseFloat(avg.toFixed(5))
        });
      }
      
      // Calculate 50-period moving average
      const ma50 = [];
      for (let i = 49; i < closes.length; i++) {
        const sum = closes.slice(i - 49, i + 1).reduce((a, b) => a + b, 0);
        const avg = sum / 50;
        ma50.push({
          time: data[i].time,
          value: parseFloat(avg.toFixed(5))
        });
      }
      
      // Calculate 200-period moving average
      const ma200 = [];
      for (let i = 199; i < closes.length; i++) {
        const sum = closes.slice(i - 199, i + 1).reduce((a, b) => a + b, 0);
        const avg = sum / 200;
        ma200.push({
          time: data[i].time,
          value: parseFloat(avg.toFixed(5))
        });
      }
      
      return [ma20, ma50, ma200];
    } catch (error) {
      console.error('Error calculating moving averages:', error);
      return [[], [], []];
    }
  };

  return (
    <Box sx={{
      display: 'flex',
      backgroundColor: colors.darkBg,
      minHeight: '100vh',
      color: colors.primaryText
    }}>
      <Sidebar />
      
      <Box 
        component="main" 
        sx={{ 
          flexGrow: 1, 
          p: 3,
          overflow: 'hidden'
        }}
      >
        <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
          {/* Header */}
          <Grid container spacing={3} alignItems="center" sx={{ mb: 3 }}>
            <Grid item xs={12} md={6}>
              <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold', mb: 1 }}>
                Short-Term Trading
              </Typography>
              <Typography variant="body1" sx={{ color: colors.secondaryText }}>
                Real-time forex trading with advanced charting
              </Typography>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Box sx={{ display: 'flex', justifyContent: { xs: 'flex-start', md: 'flex-end' }, gap: 2, flexWrap: 'wrap' }}>
                <FormControl size="small" sx={{ minWidth: 120 }}>
                  <InputLabel id="pair-select-label">Pair</InputLabel>
                  <Select
                    labelId="pair-select-label"
                    value={selectedPair.value}
                    label="Pair"
                    onChange={(e) => {
                      const pair = forexPairs.find(p => p.value === e.target.value);
                      if (pair) setSelectedPair(pair);
                    }}
                    sx={{ 
                      bgcolor: colors.panelBg,
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: colors.borderColor
                      }
                    }}
                  >
                    {forexPairs.map((pair) => (
                      <MenuItem key={pair.value} value={pair.value}>
                        {pair.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                
                <FormControl size="small" sx={{ minWidth: 120 }}>
                  <InputLabel id="timeframe-select-label">Timeframe</InputLabel>
                  <Select
                    labelId="timeframe-select-label"
                    value={selectedTimeframe}
                    label="Timeframe"
                    onChange={(e) => setSelectedTimeframe(e.target.value)}
                    sx={{ 
                      bgcolor: colors.panelBg,
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: colors.borderColor
                      }
                    }}
                  >
                    {timeIntervals.map((interval) => (
                      <MenuItem key={interval.value} value={interval.value}>
                        {interval.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                
                <Tooltip title="Refresh Chart">
                  <IconButton 
                    onClick={generateMarketData}
                    sx={{ color: colors.accentBlue }}
                  >
                    <RefreshIcon />
                  </IconButton>
                </Tooltip>
                
                <Tooltip title={showIndicators ? "Hide Indicators" : "Show Indicators"}>
                  <IconButton 
                    onClick={() => setShowIndicators(!showIndicators)}
                    sx={{ color: showIndicators ? colors.accentBlue : colors.secondaryText }}
                  >
                    <BarChartIcon />
                  </IconButton>
                </Tooltip>
                
                <Tooltip title={chartType === 'candles' ? "Switch to Line Chart" : "Switch to Candle Chart"}>
                  <IconButton 
                    onClick={() => setChartType(chartType === 'candles' ? 'line' : 'candles')}
                    sx={{ color: colors.accentBlue }}
                  >
                    {chartType === 'candles' ? <ShowChartIcon /> : <CandlestickChartIcon />}
                  </IconButton>
                </Tooltip>
              </Box>
            </Grid>
          </Grid>
          
          {/* Price info */}
          <Paper 
            elevation={3} 
            sx={{ 
              p: 2, 
              mb: 3, 
              backgroundColor: colors.panelBg,
              borderRadius: 2,
              border: `1px solid ${colors.borderColor}`
            }}
          >
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} sm={4}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Typography variant="h5" component="div" sx={{ mr: 2, fontWeight: 'bold' }}>
                    {selectedPair.label}
                  </Typography>
                  <Chip 
                    label={priceChange.percentage >= 0 ? "Bullish" : "Bearish"} 
                    color={priceChange.percentage >= 0 ? "success" : "error"}
                    size="small"
                    sx={{ 
                      fontWeight: 'bold',
                      bgcolor: priceChange.percentage >= 0 ? 'rgba(76, 175, 80, 0.2)' : 'rgba(244, 67, 54, 0.2)',
                      borderColor: priceChange.percentage >= 0 ? colors.buyGreen : colors.sellRed,
                      color: priceChange.percentage >= 0 ? colors.buyGreen : colors.sellRed
                    }}
                  />
                </Box>
                <Typography variant="body2" sx={{ color: colors.secondaryText, mt: 0.5 }}>
                  <AccessTimeIcon sx={{ fontSize: 16, mr: 0.5, verticalAlign: 'middle' }} />
                  {new Date().toLocaleTimeString()}
                </Typography>
              </Grid>
              
              <Grid item xs={12} sm={4} sx={{ textAlign: 'center' }}>
                <Typography variant="h4" component="div" sx={{ fontWeight: 'bold' }}>
                  {currentPrice ? currentPrice.toFixed(5) : '-.-----'}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {priceChange.value > 0 ? (
                    <ArrowUpwardIcon sx={{ color: colors.buyGreen, fontSize: 18 }} />
                  ) : (
                    <ArrowDownwardIcon sx={{ color: colors.sellRed, fontSize: 18 }} />
                  )}
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      color: priceChange.value >= 0 ? colors.buyGreen : colors.sellRed,
                      fontWeight: 'bold',
                      ml: 0.5
                    }}
                  >
                    {priceChange.value >= 0 ? '+' : ''}{priceChange.value} ({priceChange.percentage}%)
                  </Typography>
                </Box>
              </Grid>
              
              <Grid item xs={12} sm={4} sx={{ textAlign: { xs: 'center', sm: 'right' }, mt: { xs: 2, sm: 0 } }}>
                <Box sx={{ display: 'flex', justifyContent: { xs: 'center', sm: 'flex-end' }, gap: 2 }}>
                  <Button 
                    variant="contained" 
                    color="success"
                    startIcon={<TrendingUpIcon />}
                    onClick={() => {
                      setTradeDirection('buy');
                      setOrderType('market');
                      placeOrder();
                    }}
                    sx={{ fontWeight: 'bold', bgcolor: colors.buyGreen }}
                  >
                    Buy
                  </Button>
                  <Button 
                    variant="contained" 
                    color="error"
                    startIcon={<TrendingDownIcon />}
                    onClick={() => {
                      setTradeDirection('sell');
                      setOrderType('market');
                      placeOrder();
                    }}
                    sx={{ fontWeight: 'bold', bgcolor: colors.sellRed }}
                  >
                    Sell
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </Paper>
          
          {/* Main content grid */}
          <Grid container spacing={3}>
            {/* Left column - Chart and indicators */}
            <Grid item xs={12} md={8}>
              {/* Chart */}
              <Paper 
                elevation={3} 
                sx={{ 
                  p: 2, 
                  mb: 3, 
                  backgroundColor: colors.panelBg,
                  borderRadius: 2,
                  border: `1px solid ${colors.borderColor}`,
                  height: { xs: 350, md: 500 },
                  position: 'relative'
                }}
              >
                {chartLoading ? (
                  <Box sx={{ 
                    display: 'flex', 
                    justifyContent: 'center', 
                    alignItems: 'center',
                    height: '100%',
                    flexDirection: 'column',
                    gap: 2
                  }}>
                    <CircularProgress />
                    <Typography variant="body2" color="textSecondary">
                      Loading chart data...
                    </Typography>
                  </Box>
                ) : (
                  <Box 
                    ref={chartContainerRef} 
                    sx={{ 
                      width: '100%', 
                      height: '100%' 
                    }}
                  />
                )}
              </Paper>
              
              {/* Indicators panel */}
              {showIndicators && (
                <Paper 
                  elevation={3} 
                  sx={{ 
                    p: 2, 
                    mb: 3, 
                    backgroundColor: colors.panelBg,
                    borderRadius: 2,
                    border: `1px solid ${colors.borderColor}`
                  }}
                >
                  <Grid container spacing={2}>
                    {/* RSI */}
                    <Grid item xs={12} sm={4}>
                      <Typography variant="subtitle2" sx={{ mb: 1, color: colors.secondaryText }}>
                        RSI (14)
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                          {technicalIndicators.rsi}
                        </Typography>
                        <Box sx={{ 
                          ml: 2, 
                          p: 0.5, 
                          px: 1, 
                          borderRadius: 1, 
                          bgcolor: technicalIndicators.rsi > 70 ? 'rgba(244, 67, 54, 0.2)' :
                                    technicalIndicators.rsi < 30 ? 'rgba(76, 175, 80, 0.2)' :
                                    'rgba(255, 152, 0, 0.2)',
                          color: technicalIndicators.rsi > 70 ? colors.sellRed :
                                technicalIndicators.rsi < 30 ? colors.buyGreen :
                                colors.warningOrange,
                          fontSize: '0.75rem',
                          fontWeight: 'bold'
                        }}>
                          {technicalIndicators.rsi > 70 ? 'OVERBOUGHT' :
                           technicalIndicators.rsi < 30 ? 'OVERSOLD' : 'NEUTRAL'}
                        </Box>
                      </Box>
                    </Grid>
                    
                    {/* MACD */}
                    <Grid item xs={12} sm={4}>
                      <Typography variant="subtitle2" sx={{ mb: 1, color: colors.secondaryText }}>
                        MACD
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                          {technicalIndicators.macd.macd}
                        </Typography>
                        <Tooltip title={`Signal: ${technicalIndicators.macd.signal}, Hist: ${technicalIndicators.macd.histogram}`}>
                          <Box sx={{ 
                            ml: 2, 
                            p: 0.5, 
                            px: 1, 
                            borderRadius: 1,
                            bgcolor: technicalIndicators.macd.histogram > 0 ? 'rgba(76, 175, 80, 0.2)' : 'rgba(244, 67, 54, 0.2)',
                            color: technicalIndicators.macd.histogram > 0 ? colors.buyGreen : colors.sellRed,
                            fontSize: '0.75rem',
                            fontWeight: 'bold'
                          }}>
                            {technicalIndicators.macd.histogram > 0 ? 'BULLISH' : 'BEARISH'}
                          </Box>
                        </Tooltip>
                      </Box>
                    </Grid>
                    
                    {/* Support/Resistance */}
                    <Grid item xs={12} sm={4}>
                      <Typography variant="subtitle2" sx={{ mb: 1, color: colors.secondaryText }}>
                        Support/Resistance
                      </Typography>
                      <Box>
                        <Typography variant="body2" sx={{ color: colors.sellRed }}>
                          R: {technicalIndicators.resistances.map((r, i) => 
                            <span key={i} style={{ marginRight: '8px' }}>{r}</span>
                          )}
                        </Typography>
                        <Typography variant="body2" sx={{ color: colors.buyGreen, mt: 0.5 }}>
                          S: {technicalIndicators.supports.map((s, i) => 
                            <span key={i} style={{ marginRight: '8px' }}>{s}</span>
                          )}
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>
                </Paper>
              )}
            </Grid>
            
            {/* Right column - Trading panel and positions */}
            <Grid item xs={12} md={4}>
              {/* Account info */}
              <Paper 
                elevation={3} 
                sx={{ 
                  p: 2, 
                  mb: 3, 
                  backgroundColor: colors.panelBg,
                  borderRadius: 2,
                  border: `1px solid ${colors.borderColor}`
                }}
              >
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
                  <AccountBalanceIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Account Summary
                </Typography>
                
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="body2" sx={{ color: colors.secondaryText }}>
                      Balance
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                      ${accountBalance.toFixed(2)}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" sx={{ color: colors.secondaryText }}>
                      Equity
                    </Typography>
                    <Typography 
                      variant="h6" 
                      sx={{ 
                        fontWeight: 'bold',
                        color: equity > accountBalance ? colors.buyGreen : 
                               equity < accountBalance ? colors.sellRed :
                               colors.primaryText
                      }}
                    >
                      ${equity.toFixed(2)}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" sx={{ color: colors.secondaryText }}>
                      Available
                    </Typography>
                    <Typography variant="h6">
                      ${availableBalance.toFixed(2)}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" sx={{ color: colors.secondaryText }}>
                      Margin Used
                    </Typography>
                    <Typography variant="h6">
                      ${marginUsed.toFixed(2)}
                    </Typography>
                  </Grid>
                </Grid>
              </Paper>
              
              {/* Order form */}
              <Paper 
                elevation={3} 
                sx={{ 
                  p: 2, 
                  mb: 3, 
                  backgroundColor: colors.panelBg,
                  borderRadius: 2,
                  border: `1px solid ${colors.borderColor}`
                }}
              >
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
                  <AttachMoneyIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                  New Order
                </Typography>
                
                <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
                  <Tabs 
                    value={tradeTab} 
                    onChange={handleTradeTabChange}
                    variant="fullWidth"
                    sx={{
                      '& .MuiTab-root': {
                        color: colors.secondaryText
                      },
                      '& .Mui-selected': {
                        color: colors.accentBlue
                      },
                      '& .MuiTabs-indicator': {
                        backgroundColor: colors.accentBlue
                      }
                    }}
                  >
                    <Tab label="Market" />
                    <Tab label="Limit" />
                    <Tab label="Stop" />
                  </Tabs>
                </Box>
                
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" sx={{ mb: 1, color: colors.secondaryText }}>
                    Order Direction
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <Button
                      variant={tradeDirection === 'buy' ? 'contained' : 'outlined'}
                      fullWidth
                      sx={{
                        bgcolor: tradeDirection === 'buy' ? colors.buyGreen : 'transparent',
                        borderColor: colors.buyGreen,
                        color: tradeDirection === 'buy' ? '#fff' : colors.buyGreen,
                        '&:hover': {
                          bgcolor: tradeDirection === 'buy' ? colors.buyGreen : 'rgba(76, 175, 80, 0.1)'
                        }
                      }}
                      onClick={() => setTradeDirection('buy')}
                    >
                      Buy
                    </Button>
                    <Button
                      variant={tradeDirection === 'sell' ? 'contained' : 'outlined'}
                      fullWidth
                      sx={{
                        bgcolor: tradeDirection === 'sell' ? colors.sellRed : 'transparent',
                        borderColor: colors.sellRed,
                        color: tradeDirection === 'sell' ? '#fff' : colors.sellRed,
                        '&:hover': {
                          bgcolor: tradeDirection === 'sell' ? colors.sellRed : 'rgba(244, 67, 54, 0.1)'
                        }
                      }}
                      onClick={() => setTradeDirection('sell')}
                    >
                      Sell
                    </Button>
                  </Box>
                </Box>
                
                {/* Amount and Leverage */}
                <Grid container spacing={2} sx={{ mb: 2 }}>
                  <Grid item xs={6}>
                    <TextField
                      label="Amount"
                      type="number"
                      value={orderAmount}
                      onChange={(e) => setOrderAmount(Math.max(0.01, parseFloat(e.target.value) || 0))}
                      InputProps={{ 
                        startAdornment: <Box component="span" sx={{ mr: 1 }}>$</Box>
                      }}
                      fullWidth
                      size="small"
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          '& fieldset': {
                            borderColor: colors.borderColor
                          }
                        },
                        '& .MuiInputLabel-root': {
                          color: colors.secondaryText
                        },
                        '& .MuiInputBase-input': {
                          color: colors.primaryText
                        }
                      }}
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <TextField
                      label="Leverage"
                      type="number"
                      value={leverage}
                      onChange={(e) => setLeverage(Math.max(1, Math.min(100, parseInt(e.target.value) || 1)))}
                      InputProps={{ 
                        startAdornment: <Box component="span" sx={{ mr: 1 }}>×</Box>
                      }}
                      fullWidth
                      size="small"
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          '& fieldset': {
                            borderColor: colors.borderColor
                          }
                        },
                        '& .MuiInputLabel-root': {
                          color: colors.secondaryText
                        },
                        '& .MuiInputBase-input': {
                          color: colors.primaryText
                        }
                      }}
                    />
                  </Grid>
                </Grid>
                
                {/* Limit Price (for limit/stop orders) */}
                {tradeTab > 0 && (
                  <TextField
                    label={tradeTab === 1 ? "Limit Price" : "Stop Price"}
                    type="number"
                    value={limitPrice}
                    onChange={(e) => setLimitPrice(e.target.value)}
                    fullWidth
                    size="small"
                    sx={{
                      mb: 2,
                      '& .MuiOutlinedInput-root': {
                        '& fieldset': {
                          borderColor: colors.borderColor
                        }
                      },
                      '& .MuiInputLabel-root': {
                        color: colors.secondaryText
                      },
                      '& .MuiInputBase-input': {
                        color: colors.primaryText
                      }
                    }}
                  />
                )}
                
                {/* Take Profit & Stop Loss */}
                <Typography variant="body2" sx={{ mb: 1, color: colors.secondaryText }}>
                  Risk Management (Optional)
                </Typography>
                <Grid container spacing={2} sx={{ mb: 2 }}>
                  <Grid item xs={6}>
                    <TextField
                      label="Take Profit"
                      type="number"
                      value={takeProfit}
                      onChange={(e) => setTakeProfit(e.target.value)}
                      placeholder="Optional"
                      fullWidth
                      size="small"
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          '& fieldset': {
                            borderColor: colors.borderColor
                          }
                        },
                        '& .MuiInputLabel-root': {
                          color: colors.secondaryText
                        },
                        '& .MuiInputBase-input': {
                          color: colors.primaryText
                        }
                      }}
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <TextField
                      label="Stop Loss"
                      type="number"
                      value={stopLoss}
                      onChange={(e) => setStopLoss(e.target.value)}
                      placeholder="Optional"
                      fullWidth
                      size="small"
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          '& fieldset': {
                            borderColor: colors.borderColor
                          }
                        },
                        '& .MuiInputLabel-root': {
                          color: colors.secondaryText
                        },
                        '& .MuiInputBase-input': {
                          color: colors.primaryText
                        }
                      }}
                    />
                  </Grid>
                </Grid>
                
                {/* Order Button */}
                <Button 
                  variant="contained"
                  fullWidth
                  onClick={placeOrder}
                  sx={{
                    bgcolor: tradeDirection === 'buy' ? colors.buyGreen : colors.sellRed,
                    fontWeight: 'bold',
                    '&:hover': {
                      bgcolor: tradeDirection === 'buy' ? '#3d8b40' : '#c62828'
                    }
                  }}
                >
                  {tradeTab === 0 ? 'Place Market Order' : 
                   tradeTab === 1 ? 'Place Limit Order' : 'Place Stop Order'} ({tradeDirection.toUpperCase()})
                </Button>
              </Paper>
              
              {/* Open Positions */}
              <Paper 
                elevation={3} 
                sx={{ 
                  p: 2, 
                  mb: 3, 
                  backgroundColor: colors.panelBg,
                  borderRadius: 2,
                  border: `1px solid ${colors.borderColor}`
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                  <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                    Open Positions
                  </Typography>
                  
                  {openPositions.length > 0 && (
                    <Button 
                      variant="outlined"
                      size="small"
                      onClick={closeAllPositions}
                      sx={{
                        borderColor: colors.warningOrange,
                        color: colors.warningOrange,
                        '&:hover': {
                          borderColor: colors.warningOrange,
                          bgcolor: 'rgba(255, 152, 0, 0.1)'
                        }
                      }}
                    >
                      Close All
                    </Button>
                  )}
                </Box>
                
                {openPositions.length === 0 ? (
                  <Typography variant="body2" sx={{ color: colors.secondaryText, textAlign: 'center', py: 2 }}>
                    No open positions
                  </Typography>
                ) : (
                  <TableContainer sx={{ maxHeight: 240 }}>
                    <Table size="small" stickyHeader>
                      <TableHead>
                        <TableRow>
                          <TableCell sx={{ color: colors.secondaryText, bgcolor: colors.panelBg }}>Symbol</TableCell>
                          <TableCell sx={{ color: colors.secondaryText, bgcolor: colors.panelBg }}>Type</TableCell>
                          <TableCell sx={{ color: colors.secondaryText, bgcolor: colors.panelBg }}>Size</TableCell>
                          <TableCell sx={{ color: colors.secondaryText, bgcolor: colors.panelBg }}>Entry</TableCell>
                          <TableCell sx={{ color: colors.secondaryText, bgcolor: colors.panelBg }}>P/L</TableCell>
                          <TableCell sx={{ color: colors.secondaryText, bgcolor: colors.panelBg }}></TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {openPositions.map((position) => (
                          <TableRow key={position.id} hover>
                            <TableCell sx={{ color: colors.primaryText }}>{position.symbol}</TableCell>
                            <TableCell sx={{ 
                              color: position.direction === 'buy' ? colors.buyGreen : colors.sellRed,
                              fontWeight: 'bold'
                            }}>
                              {position.direction.toUpperCase()}
                            </TableCell>
                            <TableCell sx={{ color: colors.primaryText }}>
                              ${position.amount} (×{position.leverage})
                            </TableCell>
                            <TableCell sx={{ color: colors.primaryText }}>{position.openPrice.toFixed(5)}</TableCell>
                            <TableCell sx={{ 
                              color: position.pnl >= 0 ? colors.buyGreen : colors.sellRed,
                              fontWeight: 'bold'
                            }}>
                              {position.pnl >= 0 ? '+' : ''}{position.pnl} ({position.pnlPercentage}%)
                            </TableCell>
                            <TableCell>
                              <IconButton 
                                size="small" 
                                onClick={() => closePosition(position.id)}
                                sx={{ color: colors.warningOrange }}
                              >
                                <CloseIcon fontSize="small" />
                              </IconButton>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </Paper>
              
              {/* Pending Orders */}
              <Paper 
                elevation={3} 
                sx={{ 
                  p: 2, 
                  mb: 3, 
                  backgroundColor: colors.panelBg,
                  borderRadius: 2,
                  border: `1px solid ${colors.borderColor}`
                }}
              >
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
                  Pending Orders
                </Typography>
                
                {pendingOrders.length === 0 ? (
                  <Typography variant="body2" sx={{ color: colors.secondaryText, textAlign: 'center', py: 2 }}>
                    No pending orders
                  </Typography>
                ) : (
                  <TableContainer sx={{ maxHeight: 240 }}>
                    <Table size="small" stickyHeader>
                      <TableHead>
                        <TableRow>
                          <TableCell sx={{ color: colors.secondaryText, bgcolor: colors.panelBg }}>Type</TableCell>
                          <TableCell sx={{ color: colors.secondaryText, bgcolor: colors.panelBg }}>Direction</TableCell>
                          <TableCell sx={{ color: colors.secondaryText, bgcolor: colors.panelBg }}>Size</TableCell>
                          <TableCell sx={{ color: colors.secondaryText, bgcolor: colors.panelBg }}>Price</TableCell>
                          <TableCell sx={{ color: colors.secondaryText, bgcolor: colors.panelBg }}></TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {pendingOrders.map((order) => (
                          <TableRow key={order.id} hover>
                            <TableCell sx={{ color: colors.primaryText, textTransform: 'capitalize' }}>
                              {order.type}
                            </TableCell>
                            <TableCell sx={{ 
                              color: order.direction === 'buy' ? colors.buyGreen : colors.sellRed,
                              fontWeight: 'bold'
                            }}>
                              {order.direction.toUpperCase()}
                            </TableCell>
                            <TableCell sx={{ color: colors.primaryText }}>
                              ${order.amount} (×{order.leverage})
                            </TableCell>
                            <TableCell sx={{ color: colors.primaryText }}>{order.limitPrice.toFixed(5)}</TableCell>
                            <TableCell>
                              <IconButton 
                                size="small" 
                                onClick={() => cancelOrder(order.id)}
                                sx={{ color: colors.warningOrange }}
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </Paper>
              
              {/* Trade History */}
              <Paper 
                elevation={3} 
                sx={{ 
                  p: 2, 
                  backgroundColor: colors.panelBg,
                  borderRadius: 2,
                  border: `1px solid ${colors.borderColor}`
                }}
              >
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
                  <HistoryIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Trade History
                </Typography>
                
                {tradeHistory.length === 0 ? (
                  <Typography variant="body2" sx={{ color: colors.secondaryText, textAlign: 'center', py: 2 }}>
                    No trade history
                  </Typography>
                ) : (
                  <TableContainer sx={{ maxHeight: 300 }}>
                    <Table size="small" stickyHeader>
                      <TableHead>
                        <TableRow>
                          <TableCell sx={{ color: colors.secondaryText, bgcolor: colors.panelBg }}>Time</TableCell>
                          <TableCell sx={{ color: colors.secondaryText, bgcolor: colors.panelBg }}>Type</TableCell>
                          <TableCell sx={{ color: colors.secondaryText, bgcolor: colors.panelBg }}>Symbol</TableCell>
                          <TableCell sx={{ color: colors.secondaryText, bgcolor: colors.panelBg }}>Direction</TableCell>
                          <TableCell sx={{ color: colors.secondaryText, bgcolor: colors.panelBg }}>Price</TableCell>
                          <TableCell sx={{ color: colors.secondaryText, bgcolor: colors.panelBg }}>P/L</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {tradeHistory.map((trade) => (
                          <TableRow key={trade.id} hover>
                            <TableCell sx={{ color: colors.primaryText, whiteSpace: 'nowrap' }}>
                              {formatTime(trade.time)}
                            </TableCell>
                            <TableCell sx={{ color: colors.primaryText }}>
                              {trade.type}
                            </TableCell>
                            <TableCell sx={{ color: colors.primaryText }}>{trade.symbol}</TableCell>
                            <TableCell sx={{ 
                              color: trade.direction === 'buy' ? colors.buyGreen : colors.sellRed,
                              fontWeight: 'bold'
                            }}>
                              {trade.direction.toUpperCase()}
                            </TableCell>
                            <TableCell sx={{ color: colors.primaryText }}>{trade.price.toFixed(5)}</TableCell>
                            <TableCell sx={{ 
                              color: trade.pnl > 0 ? colors.buyGreen : 
                                    trade.pnl < 0 ? colors.sellRed : 
                                    colors.primaryText,
                              fontWeight: 'bold'
                            }}>
                              {trade.pnl ? (trade.pnl > 0 ? '+' : '') + trade.pnl : '-'}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </Paper>
            </Grid>
          </Grid>
          
          {/* Notification toast */}
          {notification && (
            <div className={`notification ${notification.type}`}>
              {notification.message}
            </div>
          )}
        </Container>
      </Box>
      
      {/* Notifications */}
      <Snackbar 
        open={notification.open} 
        autoHideDuration={3000} 
        onClose={() => setNotification({ ...notification, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={() => setNotification({ ...notification, open: false })} 
          severity={notification.type} 
          sx={{ width: '100%' }}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ShortTermTrading; 