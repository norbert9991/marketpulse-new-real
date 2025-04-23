import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Box, 
  Typography, 
  Button, 
  Paper, 
  TextField, 
  Select, 
  MenuItem, 
  FormControl, 
  InputLabel, 
  Tabs, 
  Tab, 
  Grid, 
  Divider, 
  IconButton, 
  Chip, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  Tooltip,
  InputAdornment,
  Slider,
  CircularProgress,
  ButtonGroup,
  Alert,
  Snackbar,
  LinearProgress
} from '@mui/material';
import { createChart, CrosshairMode, LineStyle } from 'lightweight-charts';
import Sidebar from './Sidebar';
import { API } from '../axiosConfig';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import RefreshIcon from '@mui/icons-material/Refresh';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import CloseIcon from '@mui/icons-material/Close';
import CheckIcon from '@mui/icons-material/Check';
import CandlestickChartIcon from '@mui/icons-material/CandlestickChart';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import HistoryIcon from '@mui/icons-material/History';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import TuneIcon from '@mui/icons-material/Tune';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import ZoomOutIcon from '@mui/icons-material/ZoomOut';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import tradingService from '../services/tradingService';

// Forex color palette
const colors = {
  darkBg: '#0A0C14',
  panelBg: '#121212',
  cardBg: '#1E2026',
  primaryText: '#EAECEF',
  secondaryText: '#848E9C',
  buyGreen: '#0ECB81',
  sellRed: '#F6465D',
  accentYellow: '#F0B90B',
  warningOrange: '#FFA726',
  profitGreen: '#0ECB81',
  lossRed: '#F6465D',
  hoverBg: 'rgba(240, 185, 11, 0.1)',
  borderColor: '#2A2F45',
  shadowColor: 'rgba(0, 0, 0, 0.3)',
  chartGrid: '#292C3F',
  chartCrosshair: '#F0B90B',
  accentBlue: '#4782DA'
};

// Currency pair base price mappings for realistic values
const currencyBasePrices = {
  'EUR/USD': 1.0850,
  'GBP/USD': 1.2650,
  'USD/JPY': 145.80,
  'AUD/USD': 0.6750,
  'USD/CAD': 1.3570,
  'NZD/USD': 0.6150,
  'USD/CHF': 0.8950,
  'EUR/GBP': 0.8550,
  'EUR/JPY': 158.20,
  'GBP/JPY': 184.40
};

const ShortTermTrading = () => {
  // Chart references
  const chartContainerRef = useRef(null);
  const chartRef = useRef(null);
  const candleSeriesRef = useRef(null);
  const volumeSeriesRef = useRef(null);
  const sma20SeriesRef = useRef(null);
  const sma50SeriesRef = useRef(null);
  const sma200SeriesRef = useRef(null);
  const supportLevelsRef = useRef([]);
  const resistanceLevelsRef = useRef([]);
  const lineSeriesRef = useRef(null);
  
  // User and account state
  const [user, setUser] = useState(null);
  const [accountInfo, setAccountInfo] = useState({
    balance: 10000,
    currency: 'USD',
    equity: 10000,
    marginUsed: 0,
    freeMargin: 10000
  });
  
  // Trading state
  const [symbol, setSymbol] = useState('EUR/USD');
  const [price, setPrice] = useState(currencyBasePrices['EUR/USD'] || 1.0850);
  const [priceChange, setPriceChange] = useState(0.12);
  const [priceHistory, setPriceHistory] = useState([]);
  const [timeframe, setTimeframe] = useState('1h');
  const [orderType, setOrderType] = useState('limit');
  const [orderSide, setOrderSide] = useState('buy');
  const [orderHistory, setOrderHistory] = useState([]);
  const [openOrders, setOpenOrders] = useState([]);
  const [tabValue, setTabValue] = useState(0);
  const [indicators, setIndicators] = useState({
    rsi: { value: 50, visible: true },
    macd: { value: 0, signal: 0, histogram: 0, visible: true },
    ma: { sma20: 0, sma50: 0, sma200: 0, visible: true },
    volume: { visible: true },
    supportResistance: { support: [], resistance: [], visible: true }
  });
  const [showIndicators, setShowIndicators] = useState(true);
  const [chartType, setChartType] = useState('candles');
  
  // UI state
  const [isLoading, setIsLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(false);
  const [orderForm, setOrderForm] = useState({
    price: currencyBasePrices['EUR/USD'] || 1.0850,
    amount: 0.1,
    total: (currencyBasePrices['EUR/USD'] || 1.0850) * 0.1,
    stopPrice: '',
    limitPrice: '',
    leverage: 1
  });
  const [notification, setNotification] = useState({
    open: false,
    message: '',
    severity: 'info'
  });
  const [leverage, setLeverage] = useState(1);
  const [showLeverageWarning, setShowLeverageWarning] = useState(false);
  
  // Currency pairs - sync with database values
  const forexPairs = [
    { symbol: 'EUR/USD', price: 1.0850, change: 0.12 },
    { symbol: 'GBP/USD', price: 1.2650, change: -0.25 },
    { symbol: 'USD/JPY', price: 145.80, change: 0.33 },
    { symbol: 'AUD/USD', price: 0.6750, change: -0.48 },
    { symbol: 'USD/CAD', price: 1.3570, change: 0.10 },
    { symbol: 'NZD/USD', price: 0.6150, change: -0.15 },
    { symbol: 'USD/CHF', price: 0.8950, change: 0.05 },
    { symbol: 'EUR/GBP', price: 0.8550, change: 0.02 },
    { symbol: 'EUR/JPY', price: 158.20, change: 0.45 },
    { symbol: 'GBP/JPY', price: 184.40, change: 0.20 }
  ];
  
  // Available timeframes for chart
  const timeframes = ['1m', '5m', '15m', '1h', '4h', '1d', '1w'];
  
  // Fetch user data and account info
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await API.auth.me();
        setUser(response.data.user);
        
        // Fetch account info
        const accountData = await tradingService.getAccountInfo();
        setAccountInfo(accountData);
      } catch (error) {
        console.error('Error fetching user data:', error);
        showNotification('Error loading user data', 'error');
      }
    };
    
    fetchUserData();
    
    // Fetch order history and open orders
    fetchOpenOrders();
    fetchOrderHistory();
  }, []);
  
  // Fetch market data for the selected symbol
  useEffect(() => {
    const fetchMarketData = async () => {
      setDataLoading(true);
      try {
        // Get current price and market data
        let marketData;
        try {
          marketData = await tradingService.getMarketData(symbol);
        } catch (err) {
          console.error('Error fetching market data, using fallback:', err);
          marketData = {
            current_price: currencyBasePrices[symbol] || 1.0,
            change_percentage: (Math.random() * 0.6 - 0.3).toFixed(2)
          };
        }
        setPrice(marketData.current_price);
        setPriceChange(marketData.change_percentage);
        
        // Get historical data based on timeframe
        let historicalData;
        try {
          historicalData = await tradingService.getHistoricalData(symbol, timeframe);
        } catch (err) {
          console.error('Error fetching historical data, using fallback:', err);
          // Use generateMockHistoricalData directly
          historicalData = generateMockHistoricalData(symbol, timeframe);
        }
        setPriceHistory(historicalData);
        
        // Get technical indicators
        let techIndicators;
        try {
          techIndicators = await tradingService.getTechnicalIndicators(symbol);
        } catch (err) {
          console.error('Error fetching technical indicators, using fallback:', err);
          // Use mock data directly
          techIndicators = generateMockTechnicalIndicators(symbol);
        }
        setIndicators(prev => ({
          ...prev,
          rsi: { ...prev.rsi, value: techIndicators.rsi },
          macd: { 
            ...prev.macd, 
            value: techIndicators.macd, 
            signal: techIndicators.macd_signal, 
            histogram: techIndicators.macd_hist 
          },
          ma: { 
            ...prev.ma, 
            sma20: techIndicators.sma20, 
            sma50: techIndicators.sma50, 
            sma200: techIndicators.sma200 
          }
        }));
        
        // Get support/resistance levels
        let supportResistance;
        try {
          supportResistance = await tradingService.getSupportResistance(symbol);
        } catch (err) {
          console.error('Error fetching support/resistance levels, using fallback:', err);
          // Use mock data directly
          supportResistance = generateMockSupportResistance(symbol);
        }
        setIndicators(prev => ({
          ...prev,
          supportResistance: { 
            ...prev.supportResistance, 
            support: supportResistance.support, 
            resistance: supportResistance.resistance
          }
        }));
        
        // Update the chart if it exists
        if (candleSeriesRef.current) {
          updateChartData(historicalData);
        }
        
        // Update the order form with the current price
        setOrderForm(prev => ({
          ...prev,
          price: marketData.current_price,
          total: marketData.current_price * prev.amount
        }));
      } catch (error) {
        console.error('Error in market data fetch process:', error);
        showNotification('Error loading market data, using fallback data', 'warning');
      } finally {
        setDataLoading(false);
      }
    };
    
    fetchMarketData();
  }, [symbol, timeframe]);
  
  // Fetch open orders
  const fetchOpenOrders = async () => {
    try {
      const data = await tradingService.getOpenOrders();
      setOpenOrders(data.orders || []);
    } catch (error) {
      console.error('Error fetching open orders:', error);
    }
  };
  
  // Fetch order history
  const fetchOrderHistory = async () => {
    try {
      const data = await tradingService.getOrderHistory();
      setOrderHistory(data.orders || []);
    } catch (error) {
      console.error('Error fetching order history:', error);
    }
  };
  
  // Convert historical data to chart format
  const formatHistoricalDataForChart = useCallback((data) => {
    return data.map(item => ({
      time: new Date(item.timestamp).getTime() / 1000,
      open: item.open,
      high: item.high,
      low: item.low,
      close: item.close,
      volume: item.volume
    }));
  }, []);
  
  // Update chart with new data
  const updateChartData = useCallback((data) => {
    if (!candleSeriesRef.current) return;
    
    const formattedData = formatHistoricalDataForChart(data);
    candleSeriesRef.current.setData(formattedData);
    
    // Update volume series if visible
    if (volumeSeriesRef.current && indicators.volume.visible) {
      const volumeData = formattedData.map(item => ({
        time: item.time,
        value: item.volume
      }));
      volumeSeriesRef.current.setData(volumeData);
    }
    
    // Update moving averages if visible
    if (indicators.ma.visible) {
      // Calculate SMA values
      const sma20Data = calculateSMA(formattedData, 20);
      const sma50Data = calculateSMA(formattedData, 50);
      const sma200Data = calculateSMA(formattedData, 200);
      
      if (sma20SeriesRef.current) sma20SeriesRef.current.setData(sma20Data);
      if (sma50SeriesRef.current) sma50SeriesRef.current.setData(sma50Data);
      if (sma200SeriesRef.current) sma200SeriesRef.current.setData(sma200Data);
    }
    
    // Update support/resistance levels
    updateSupportResistanceLevels();
  }, [formatHistoricalDataForChart, indicators.ma.visible, indicators.volume.visible]);
  
  // Calculate Simple Moving Average
  const calculateSMA = useCallback((data, period) => {
    const result = [];
    
    for (let i = period - 1; i < data.length; i++) {
      let sum = 0;
      for (let j = 0; j < period; j++) {
        sum += data[i - j].close;
      }
      result.push({
        time: data[i].time,
        value: sum / period
      });
    }
    
    return result;
  }, []);
  
  // Update support/resistance levels on chart
  const updateSupportResistanceLevels = useCallback(() => {
    if (!chartRef.current || !indicators.supportResistance.visible) return;
    
    // Remove existing lines
    supportLevelsRef.current.forEach(line => {
      if (line) chartRef.current.removePriceLine(line);
    });
    resistanceLevelsRef.current.forEach(line => {
      if (line) chartRef.current.removePriceLine(line);
    });
    
    supportLevelsRef.current = [];
    resistanceLevelsRef.current = [];
    
    // Add support levels
    indicators.supportResistance.support.forEach(level => {
      const supportLine = candleSeriesRef.current.createPriceLine({
        price: level,
        color: 'rgba(14, 203, 129, 0.5)',
        lineWidth: 1,
        lineStyle: LineStyle.Dashed,
        axisLabelVisible: true,
        title: 'Support'
      });
      supportLevelsRef.current.push(supportLine);
    });
    
    // Add resistance levels
    indicators.supportResistance.resistance.forEach(level => {
      const resistanceLine = candleSeriesRef.current.createPriceLine({
        price: level,
        color: 'rgba(246, 70, 93, 0.5)',
        lineWidth: 1,
        lineStyle: LineStyle.Dashed,
        axisLabelVisible: true,
        title: 'Resistance'
      });
      resistanceLevelsRef.current.push(resistanceLine);
    });
  }, [indicators.supportResistance]);
  
  // Initialize chart
  useEffect(() => {
    if (chartContainerRef.current && !chartRef.current) {
      const container = chartContainerRef.current;
      
      // Ensure container has dimensions
      container.style.width = '100%';
      container.style.height = '100%';
      
      // Create chart with professional appearance
      const chart = createChart(container, {
        layout: {
          backgroundColor: colors.cardBg,
          textColor: colors.primaryText,
          fontSize: 12,
        },
        grid: {
          vertLines: { color: colors.chartGrid, style: LineStyle.Dotted },
          horzLines: { color: colors.chartGrid, style: LineStyle.Dotted },
        },
        crosshair: {
          mode: CrosshairMode.Normal,
          vertLine: {
            color: colors.chartCrosshair,
            width: 1,
            labelBackgroundColor: colors.chartCrosshair,
          },
          horzLine: {
            color: colors.chartCrosshair,
            width: 1,
            labelBackgroundColor: colors.chartCrosshair,
          },
        },
        timeScale: {
          borderColor: colors.borderColor,
          timeVisible: true,
          secondsVisible: false
        },
        rightPriceScale: {
          borderColor: colors.borderColor,
        },
        watermark: {
          color: 'rgba(66, 66, 66, 0.1)',
          visible: true,
          text: symbol,
          fontSize: 48,
          horzAlign: 'center',
          vertAlign: 'center',
        }
      });
      
      // Add candlestick series
      candleSeriesRef.current = chart.addCandlestickSeries({
        upColor: colors.buyGreen,
        downColor: colors.sellRed,
        borderVisible: false,
        wickUpColor: colors.buyGreen,
        wickDownColor: colors.sellRed,
      });
      
      // Add volume series
      const volumeSeries = chart.addHistogramSeries({
        color: '#26a69a',
        priceFormat: {
          type: 'volume',
        },
        priceScaleId: '',
        scaleMargins: {
          top: 0.8,
          bottom: 0,
        },
      });
      volumeSeriesRef.current = volumeSeries;
      
      // Add SMA series
      sma20SeriesRef.current = chart.addLineSeries({
        color: '#2196F3',
        lineWidth: 1,
        title: 'SMA 20',
      });
      
      sma50SeriesRef.current = chart.addLineSeries({
        color: '#FF9800',
        lineWidth: 1,
        title: 'SMA 50',
      });
      
      sma200SeriesRef.current = chart.addLineSeries({
        color: '#E91E63',
        lineWidth: 1,
        title: 'SMA 200',
      });
      
      // Store the chart reference
      chartRef.current = chart;
      
      // Handle resize
      const handleResize = () => {
        chart.applyOptions({ 
          width: container.clientWidth,
          height: container.clientHeight 
        });
      };
      
      window.addEventListener('resize', handleResize);
      
      // Set up price updates for live chart effect
      const priceUpdateInterval = setInterval(() => {
        if (!candleSeriesRef.current) return;
        
        // Calculate a small random price change with some trend bias
        const maxMove = price < 10 ? 0.0005 : 0.05; // Smaller moves for lower priced pairs
        const trendBias = Math.random() > 0.5 ? 0.3 : -0.3; // Slight trend bias
        const change = (Math.random() * maxMove * 2 - maxMove) + (maxMove * trendBias);
        
        // Update the price with the random change
        const newPrice = parseFloat((price + change).toFixed(4));
        setPrice(newPrice);
        
        // Update price change percentage (last 24h simulation)
        const newPriceChange = parseFloat(((newPrice / price - 1) * 100).toFixed(2));
        setPriceChange(newPriceChange);
        
        // Get the last candle data
        const formattedData = formatHistoricalDataForChart(priceHistory);
        if (formattedData.length === 0) return;
        
        const lastCandle = formattedData[formattedData.length - 1];
        
        // Create a new candle for the latest data point
        const currentTime = Math.floor(Date.now() / 1000);
        const newCandle = {
          time: currentTime,
          open: lastCandle.close,
          high: Math.max(lastCandle.close, newPrice),
          low: Math.min(lastCandle.close, newPrice),
          close: newPrice
        };
        
        // Update the chart with the new data
        candleSeriesRef.current.update(newCandle);
        
        // Update order form price for market orders
        if (orderType === 'market') {
          setOrderForm(prev => ({
            ...prev,
            total: newPrice * prev.amount
          }));
        }
        
        // Check if limit orders should be triggered
        checkPendingOrders(newPrice);
      }, 1000); // Update every second for fluid movement
      
      return () => {
        window.removeEventListener('resize', handleResize);
        clearInterval(priceUpdateInterval);
        if (chartRef.current) {
          chartRef.current.remove();
          chartRef.current = null;
        }
      };
    }
  }, [formatHistoricalDataForChart, price, priceHistory, symbol, orderType]);
  
  // Check if pending orders should be triggered
  const checkPendingOrders = (currentPrice) => {
    if (openOrders.length === 0) return;
    
    const ordersToProcess = [...openOrders];
    const triggeredOrders = [];
    
    ordersToProcess.forEach(order => {
      if (order.type === 'limit') {
        // For limit buy, trigger if price falls below order price
        if (order.side === 'buy' && currentPrice <= order.price) {
          executeOrder(order, currentPrice);
          triggeredOrders.push(order.id);
        }
        // For limit sell, trigger if price rises above order price
        else if (order.side === 'sell' && currentPrice >= order.price) {
          executeOrder(order, currentPrice);
          triggeredOrders.push(order.id);
        }
      }
      else if (order.type === 'stop_limit') {
        // For stop limit orders
        if (order.side === 'buy' && currentPrice >= order.stopPrice) {
          // Trigger the limit order when price goes above stop price for buy
          executeOrder(order, order.limitPrice);
          triggeredOrders.push(order.id);
        }
        else if (order.side === 'sell' && currentPrice <= order.stopPrice) {
          // Trigger the limit order when price goes below stop price for sell
          executeOrder(order, order.limitPrice);
          triggeredOrders.push(order.id);
        }
      }
    });
    
    // Remove triggered orders from open orders
    if (triggeredOrders.length > 0) {
      setOpenOrders(prev => prev.filter(order => !triggeredOrders.includes(order.id)));
    }
  };
  
  // Execute an order
  const executeOrder = async (order, execPrice = price) => {
    try {
      // Process the order
      const calculatedPrice = order.type === 'market' ? execPrice : order.price;
      const calculatedTotal = order.amount * calculatedPrice;
      
      if (order.side === 'buy') {
        // Check if user has enough balance
        if (calculatedTotal > accountInfo.balance) {
          showNotification('Insufficient balance to execute order', 'error');
          return false;
        }
        
        // Update balance
        setAccountInfo(prev => ({
          ...prev,
          balance: prev.balance - calculatedTotal,
          marginUsed: prev.marginUsed + calculatedTotal * order.leverage,
          freeMargin: prev.balance - (prev.marginUsed + calculatedTotal * order.leverage)
        }));
      } else {
        // For sell orders, add to balance
        setAccountInfo(prev => ({
          ...prev,
          balance: prev.balance + calculatedTotal
        }));
      }
      
      // Create filled order for history
      const filledOrder = {
        ...order,
        status: 'filled',
        filledPrice: calculatedPrice,
        filledTime: new Date().toISOString()
      };
      
      // Update order history
      setOrderHistory(prev => [filledOrder, ...prev]);
      
      // Show success notification
      showNotification(
        `${order.side.toUpperCase()} order executed: ${order.amount} ${order.symbol} at ${formatPrice(calculatedPrice)}`,
        'success'
      );
      
      return true;
    } catch (error) {
      console.error('Error executing order:', error);
      showNotification('Failed to execute order. Please try again.', 'error');
      return false;
    }
  };
  
  // Handle order placement
  const handlePlaceOrder = async () => {
    // Validate inputs
    if (orderForm.amount <= 0) {
      showNotification('Please enter a valid amount', 'error');
      return;
    }
    
    if (orderType !== 'market' && orderForm.price <= 0) {
      showNotification('Please enter a valid price', 'error');
      return;
    }
    
    if (orderType === 'stop_limit' && (!orderForm.stopPrice || orderForm.stopPrice <= 0)) {
      showNotification('Please enter a valid stop price', 'error');
      return;
    }
    
    const calculatedTotal = orderForm.amount * (orderType === 'market' ? price : orderForm.price);
    
    if (orderSide === 'buy' && calculatedTotal > accountInfo.balance) {
      showNotification('Insufficient balance', 'error');
      return;
    }
    
    try {
      // Create order object
      const newOrder = {
        id: Date.now(),
        symbol: symbol,
        type: orderType,
        side: orderSide,
        price: orderType === 'market' ? price : orderForm.price,
        stopPrice: orderForm.stopPrice || null,
        limitPrice: orderForm.limitPrice || null,
        amount: orderForm.amount,
        total: calculatedTotal,
        leverage: leverage,
        status: orderType === 'market' ? 'filled' : 'open',
        date: new Date().toISOString()
      };
      
      // Submit order to service
      const response = await tradingService.placeOrder(newOrder);
      
      if (response.success) {
        if (orderType === 'market') {
          // Execute market order immediately
          executeOrder(newOrder);
        } else {
          // Add limit/stop order to open orders
          setOpenOrders(prev => [...prev, newOrder]);
          
          // Show confirmation
          showNotification(
            `${orderSide.toUpperCase()} ${orderForm.amount} ${symbol} order placed successfully!`,
            'success'
          );
        }
        
        // Reset form
        setOrderForm({
          ...orderForm,
          amount: 0,
          total: 0,
          stopPrice: '',
          limitPrice: ''
        });
      } else {
        showNotification('Failed to place order. Please try again.', 'error');
      }
    } catch (error) {
      console.error('Error placing order:', error);
      showNotification('Error placing order: ' + error.message, 'error');
    }
  };
  
  // Cancel an open order
  const cancelOrder = async (orderId) => {
    try {
      const response = await tradingService.cancelOrder(orderId);
      
      if (response.success) {
        // Find the order that was canceled
        const canceledOrder = openOrders.find(order => order.id === orderId);
        
        // Remove from open orders
        setOpenOrders(prev => prev.filter(order => order.id !== orderId));
        
        // Add to order history with canceled status
        if (canceledOrder) {
          setOrderHistory(prev => [{
            ...canceledOrder,
            status: 'canceled',
            cancelTime: new Date().toISOString()
          }, ...prev]);
          
          showNotification('Order canceled successfully', 'success');
        }
      } else {
        showNotification('Failed to cancel order', 'error');
      }
    } catch (error) {
      console.error('Error canceling order:', error);
      showNotification('Error canceling order: ' + error.message, 'error');
    }
  };
  
  // Handle tab changes for the pair tabs
  const handlePairTabChange = (event, newValue) => {
    setTabValue(newValue);
    // Set the symbol based on selected tab
    if (forexPairs[newValue]) {
      setSymbol(forexPairs[newValue].symbol);
    }
  };

  // Handle tab changes for order type tabs
  const handleOrderTabChange = (event, newValue) => {
    setTabValue(newValue);
    // Set order type based on selected tab
    const orderTypes = ['limit', 'market', 'stop_limit'];
    if (orderTypes[newValue]) {
      setOrderType(orderTypes[newValue]);
    }
  };
  
  // Handle symbol selection
  const handleSymbolChange = (event) => {
    setSymbol(event.target.value);
  };
  
  // Handle timeframe changes
  const handleTimeframeChange = (tf) => {
    setTimeframe(tf);
  };
  
  // Handle order type changes
  const handleOrderTypeChange = (type) => {
    setOrderType(type);
  };
  
  // Handle order side changes
  const handleOrderSideChange = (side) => {
    setOrderSide(side);
  };
  
  // Handle indicator toggle
  const handleToggleIndicator = (indicator) => {
    setIndicators(prev => ({
      ...prev,
      [indicator]: {
        ...prev[indicator],
        visible: !prev[indicator].visible
      }
    }));
    
    // Update chart based on which indicator was toggled
    if (indicator === 'ma') {
      if (indicators.ma.visible) {
        // Hide MAs
        if (sma20SeriesRef.current) sma20SeriesRef.current.applyOptions({ visible: false });
        if (sma50SeriesRef.current) sma50SeriesRef.current.applyOptions({ visible: false });
        if (sma200SeriesRef.current) sma200SeriesRef.current.applyOptions({ visible: false });
      } else {
        // Show MAs
        if (sma20SeriesRef.current) sma20SeriesRef.current.applyOptions({ visible: true });
        if (sma50SeriesRef.current) sma50SeriesRef.current.applyOptions({ visible: true });
        if (sma200SeriesRef.current) sma200SeriesRef.current.applyOptions({ visible: true });
      }
    } else if (indicator === 'volume') {
      if (volumeSeriesRef.current) {
        volumeSeriesRef.current.applyOptions({ visible: !indicators.volume.visible });
      }
    } else if (indicator === 'supportResistance') {
      updateSupportResistanceLevels();
    }
  };
  
  // Handle chart type changes
  const handleChartTypeChange = (type) => {
    setChartType(type);
    
    if (candleSeriesRef.current && chartRef.current) {
      if (type === 'line') {
        // Switch to line chart
        candleSeriesRef.current.applyOptions({
          visible: false
        });
        
        // Create line series if it doesn't exist
        if (!lineSeriesRef.current) {
          lineSeriesRef.current = chartRef.current.addLineSeries({
            color: '#2196F3',
            lineWidth: 2,
            crosshairMarkerVisible: true,
            lastValueVisible: true,
            priceLineVisible: true,
          });
          
          // Convert candle data to line data
          const lineData = priceHistory.map(candle => ({
            time: new Date(candle.timestamp).getTime() / 1000,
            value: candle.close
          }));
          
          lineSeriesRef.current.setData(lineData);
        } else {
          lineSeriesRef.current.applyOptions({ visible: true });
        }
      } else {
        // Switch to candle chart
        if (lineSeriesRef.current) {
          lineSeriesRef.current.applyOptions({ visible: false });
        }
        candleSeriesRef.current.applyOptions({ visible: true });
      }
    }
  };
  
  // Handle amount percentage buttons
  const handleAmountPercentage = (percent) => {
    if (orderSide === 'buy') {
      // Calculate amount based on available balance
      const maxTotal = accountInfo.balance * (percent / 100);
      const currentPrice = orderType === 'market' ? price : orderForm.price;
      const newAmount = currentPrice > 0 ? maxTotal / currentPrice : 0;
      
      setOrderForm({
        ...orderForm,
        amount: newAmount,
        total: maxTotal
      });
    } else {
      // For sell orders, this would use available token balance
      // For the demo, we'll just use a simulated balance of 1 lot
      const availableTokens = 1;
      const newAmount = availableTokens * (percent / 100);
      const currentPrice = orderType === 'market' ? price : orderForm.price;
      
      setOrderForm({
        ...orderForm,
        amount: newAmount,
        total: newAmount * currentPrice
      });
    }
  };
  
  // Handle price change in form
  const handlePriceChange = (e) => {
    const newPrice = parseFloat(e.target.value) || 0;
    setOrderForm({
      ...orderForm,
      price: newPrice,
      total: newPrice * orderForm.amount
    });
  };

  // Handle amount change in form
  const handleAmountChange = (e) => {
    const newAmount = parseFloat(e.target.value) || 0;
    const currentPrice = orderType === 'market' ? price : orderForm.price;
    setOrderForm({
      ...orderForm,
      amount: newAmount,
      total: newAmount * currentPrice
    });
  };

  // Handle total change in form
  const handleTotalChange = (e) => {
    const newTotal = parseFloat(e.target.value) || 0;
    const currentPrice = orderType === 'market' ? price : orderForm.price;
    setOrderForm({
      ...orderForm,
      total: newTotal,
      amount: currentPrice > 0 ? newTotal / currentPrice : 0
    });
  };
  
  // Handle stop price change
  const handleStopPriceChange = (e) => {
    const newStopPrice = parseFloat(e.target.value) || 0;
    setOrderForm({
      ...orderForm,
      stopPrice: newStopPrice
    });
  };
  
  // Handle limit price change
  const handleLimitPriceChange = (e) => {
    const newLimitPrice = parseFloat(e.target.value) || 0;
    setOrderForm({
      ...orderForm,
      limitPrice: newLimitPrice
    });
  };
  
  // Handle leverage change
  const handleLeverageChange = (event, newValue) => {
    setLeverage(newValue);
    
    // Set leverage warning for high values
    setShowLeverageWarning(newValue > 5);
    
    setOrderForm(prev => ({
      ...prev,
      leverage: newValue
    }));
  };
  
  // Show notification
  const showNotification = (message, severity = 'info') => {
    setNotification({
      open: true,
      message,
      severity
    });
  };
  
  // Close notification
  const handleCloseNotification = () => {
    setNotification({
      ...notification,
      open: false
    });
  };
  
  // Refresh data
  const handleRefreshData = () => {
    // Refetch all data for the current symbol
    const fetchData = async () => {
      setDataLoading(true);
      try {
        // Fetch market data
        const marketData = await tradingService.getMarketData(symbol);
        setPrice(marketData.current_price);
        setPriceChange(marketData.change_percentage);
        
        // Fetch historical data
        const historicalData = await tradingService.getHistoricalData(symbol, timeframe);
        setPriceHistory(historicalData);
        
        // Update chart
        if (candleSeriesRef.current) {
          updateChartData(historicalData);
        }
        
        // Show success notification
        showNotification('Data refreshed successfully', 'success');
      } catch (error) {
        console.error('Error refreshing data:', error);
        showNotification('Error refreshing data', 'error');
      } finally {
        setDataLoading(false);
      }
    };
    
    fetchData();
  };
  
  // Format price with appropriate decimal places for forex
  const formatPrice = (value) => {
    if (typeof value !== 'number') return '0.0000';
    
    // Format based on currency pair
    if (symbol.includes('JPY')) {
      return value.toFixed(3); // JPY pairs typically show 3 decimal places
    } else {
      return value.toFixed(4); // Most forex pairs show 4 decimal places
    }
  };
  
  // Percentage buttons JSX
  const percentageButtonsJsx = (
    <Grid container spacing={1} sx={{ mt: 1 }}>
      {[25, 50, 75, 100].map((percent) => (
        <Grid item xs={3} key={percent}>
          <Button
            size="small"
            fullWidth
            variant="outlined"
            onClick={() => handleAmountPercentage(percent)}
            sx={{
              color: colors.secondaryText,
              borderColor: colors.borderColor,
              '&:hover': {
                borderColor: colors.accentYellow,
                bgcolor: 'transparent'
              }
            }}
          >
            {percent}%
          </Button>
        </Grid>
      ))}
    </Grid>
  );
  
  // Render open orders
  const renderOpenOrders = () => {
    if (openOrders.length === 0) {
      return (
        <Box sx={{ p: 2, textAlign: 'center', color: colors.secondaryText }}>
          <Typography variant="body2">No open orders</Typography>
        </Box>
      );
    }
    
    return (
      <Box sx={{ maxHeight: '200px', overflow: 'auto' }}>
        <TableContainer component={Paper} sx={{ boxShadow: 'none', bgcolor: 'transparent' }}>
          <Table size="small" sx={{ '& td, & th': { borderColor: colors.borderColor, py: 1 } }}>
            <TableHead>
              <TableRow sx={{ '& th': { color: colors.secondaryText, fontWeight: 500 } }}>
                <TableCell>Pair</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Price</TableCell>
                <TableCell>Amount</TableCell>
                <TableCell align="right">Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {openOrders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell sx={{ color: colors.primaryText }}>{order.symbol}</TableCell>
                  <TableCell>
                    <Chip 
                      size="small" 
                      label={order.type}
                      sx={{ 
                        bgcolor: colors.cardBg, 
                        color: order.side === 'buy' ? colors.buyGreen : colors.sellRed
                      }} 
                    />
                  </TableCell>
                  <TableCell sx={{ color: colors.primaryText }}>{formatPrice(order.price)}</TableCell>
                  <TableCell sx={{ color: colors.primaryText }}>{order.amount}</TableCell>
                  <TableCell align="right">
                    <IconButton 
                      size="small" 
                      sx={{ color: colors.sellRed }}
                      onClick={() => cancelOrder(order.id)}
                    >
                      <CloseIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    );
  };
  
  return (
    <Box sx={{ display: 'flex', bgcolor: colors.darkBg, height: '100vh', overflow: 'hidden' }}>
      <Sidebar activePage="Trading" />
      <Box sx={{ flexGrow: 1, ml: '250px', overflow: 'auto', height: '100vh', p: 0 }}>
        {/* Top Bar - Symbol, Price, Change */}
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between', 
          px: 2, 
          py: 1.5, 
          borderBottom: `1px solid ${colors.borderColor}`,
          bgcolor: colors.panelBg
        }}>
          <Box>
            <Typography variant="h6" sx={{ color: colors.primaryText, fontWeight: 600 }}>
              {symbol} <Chip 
                size="small" 
                label={`${price.toFixed(2)}`} 
                sx={{ bgcolor: colors.cardBg, color: colors.primaryText, ml: 1 }} 
              />
            </Typography>
            <Typography variant="body2" sx={{ color: colors.secondaryText }}>
              24h Change: <span style={{ color: forexPairs[0].change >= 0 ? colors.buyGreen : colors.sellRed }}>
                {forexPairs[0].change >= 0 ? '+' : ''}{forexPairs[0].change}%
              </span>
            </Typography>
          </Box>
          <Box>
            <Button 
              startIcon={<RefreshIcon />} 
              variant="outlined" 
              size="small"
              sx={{ 
                color: colors.primaryText, 
                borderColor: colors.borderColor,
                '&:hover': { borderColor: colors.accentYellow, bgcolor: 'transparent' }
              }}
            >
              Refresh
            </Button>
          </Box>
        </Box>
      
        <Grid container sx={{ height: 'calc(100vh - 64px - 56px)' }}>
          {/* Left Column - Trading Pairs */}
          <Grid item xs={1.5} sx={{ borderRight: `1px solid ${colors.borderColor}`, height: '100%', overflow: 'auto' }}>
            <Tabs 
              value={tabValue} 
              onChange={handlePairTabChange}
              variant="fullWidth"
              sx={{
                minHeight: '36px',
                '& .MuiTab-root': { 
                  minHeight: '36px',
                  color: colors.secondaryText,
                  '&.Mui-selected': { color: colors.accentYellow }
                },
                '& .MuiTabs-indicator': { backgroundColor: colors.accentYellow }
              }}
            >
              {forexPairs.map((pair) => (
                <Tab key={pair.symbol} label={pair.symbol} />
              ))}
            </Tabs>
            
            <Box sx={{ p: 1 }}>
              <TextField
                placeholder="Search"
                fullWidth
                size="small"
                sx={{
                  mb: 1,
                  '& .MuiOutlinedInput-root': {
                    bgcolor: colors.cardBg,
                    '& fieldset': { borderColor: colors.borderColor },
                    '&:hover fieldset': { borderColor: colors.accentYellow },
                    '&.Mui-focused fieldset': { borderColor: colors.accentYellow },
                  },
                  '& .MuiInputBase-input': { color: colors.primaryText }
                }}
              />
              
              <TableContainer component={Box}>
                <Table size="small" sx={{ '& td, & th': { borderColor: 'transparent', py: 1 } }}>
                  <TableHead>
                    <TableRow sx={{ '& th': { color: colors.secondaryText, fontWeight: 500 } }}>
                      <TableCell>Pair</TableCell>
                      <TableCell align="right">Price</TableCell>
                      <TableCell align="right">Change</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {forexPairs.map((pair) => (
                      <TableRow 
                        key={pair.symbol}
                        sx={{ 
                          cursor: 'pointer',
                          '&:hover': { bgcolor: colors.hoverBg },
                          ...(pair.symbol === symbol ? { bgcolor: colors.hoverBg } : {})
                        }}
                        onClick={() => setSymbol(pair.symbol)}
                      >
                        <TableCell sx={{ color: colors.primaryText }}>{pair.symbol}</TableCell>
                        <TableCell align="right" sx={{ color: colors.primaryText }}>{pair.price}</TableCell>
                        <TableCell 
                          align="right" 
                          sx={{ 
                            color: pair.change >= 0 ? colors.buyGreen : colors.sellRed,
                            fontWeight: 500
                          }}
                        >
                          {pair.change >= 0 ? '+' : ''}{pair.change}%
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          </Grid>
        
          {/* Middle Column - Chart */}
          <Grid item xs={7.5} sx={{ borderRight: `1px solid ${colors.borderColor}`, height: '100%', display: 'flex', flexDirection: 'column' }}>
            {/* Timeframe Selector */}
            <Box sx={{ borderBottom: `1px solid ${colors.borderColor}`, display: 'flex', p: 1 }}>
              {timeframes.map((tf) => (
                <Button
                  key={tf}
                  size="small"
                  sx={{
                    minWidth: 'auto',
                    px: 1.5,
                    py: 0.5,
                    color: timeframe === tf ? colors.accentYellow : colors.secondaryText,
                    ...(timeframe === tf ? { 
                      bgcolor: colors.hoverBg,
                    } : {}),
                    '&:hover': {
                      bgcolor: colors.hoverBg
                    }
                  }}
                  onClick={() => setTimeframe(tf)}
                >
                  {tf}
                </Button>
              ))}
              <Box sx={{ flexGrow: 1 }} />
              <Tooltip title="Line Chart">
                <IconButton 
                  size="small" 
                  sx={{ color: colors.secondaryText }}
                >
                  <ShowChartIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Candlestick Chart">
                <IconButton 
                  size="small" 
                  sx={{ color: colors.accentYellow }}
                >
                  <CandlestickChartIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Indicators">
                <IconButton 
                  size="small" 
                  sx={{ color: colors.secondaryText }}
                >
                  <TuneIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
            
            {/* Price Chart */}
            <Box 
              ref={chartContainerRef} 
              sx={{ 
                flexGrow: 1, 
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              {isLoading ? (
                <CircularProgress sx={{ color: colors.accentYellow }} />
              ) : null}
            </Box>
          </Grid>
        
          {/* Right Column - Order Form */}
          <Grid item xs={3} sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Tabs 
              value={tabValue} 
              onChange={handleOrderTabChange}
              variant="fullWidth"
              sx={{
                minHeight: '48px',
                '& .MuiTab-root': { 
                  minHeight: '48px',
                  color: colors.secondaryText,
                  '&.Mui-selected': { color: colors.primaryText }
                },
                '& .MuiTabs-indicator': { backgroundColor: colors.accentYellow }
              }}
            >
              <Tab label="Limit" />
              <Tab label="Market" />
              <Tab label="Stop-Limit" />
            </Tabs>
            
            <Box sx={{ p: 2 }}>
              {/* Buy/Sell Tabs */}
              <Box sx={{ display: 'flex', mb: 2, borderRadius: 1, overflow: 'hidden' }}>
                <Button
                  fullWidth
                  sx={{
                    bgcolor: orderSide === 'buy' ? colors.buyGreen : 'transparent',
                    color: orderSide === 'buy' ? colors.primaryText : colors.secondaryText,
                    borderRadius: 0,
                    py: 1
                  }}
                  onClick={() => setOrderSide('buy')}
                >
                  BUY
                </Button>
                <Button
                  fullWidth
                  sx={{
                    bgcolor: orderSide === 'sell' ? colors.sellRed : 'transparent',
                    color: orderSide === 'sell' ? colors.primaryText : colors.secondaryText,
                    borderRadius: 0,
                    py: 1
                  }}
                  onClick={() => setOrderSide('sell')}
                >
                  SELL
                </Button>
              </Box>
              
              {/* Price Input - hidden for market orders */}
              {orderType !== 'market' && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" sx={{ color: colors.secondaryText, mb: 0.5 }}>
                    Price
                  </Typography>
                  <TextField
                    fullWidth
                    size="small"
                    value={orderForm.price}
                    onChange={handlePriceChange}
                    InputProps={{
                      endAdornment: <InputAdornment position="end" sx={{ color: colors.secondaryText }}>USDT</InputAdornment>,
                      style: { color: colors.primaryText }
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        bgcolor: colors.cardBg,
                        '& fieldset': { borderColor: colors.borderColor },
                        '&:hover fieldset': { borderColor: colors.borderColor },
                        '&.Mui-focused fieldset': { borderColor: colors.accentYellow },
                      }
                    }}
                  />
                </Box>
              )}
              
              {/* Amount Input */}
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" sx={{ color: colors.secondaryText, mb: 0.5 }}>
                  Amount
                </Typography>
                <TextField
                  fullWidth
                  size="small"
                  value={orderForm.amount}
                  onChange={handleAmountChange}
                  InputProps={{
                    endAdornment: <InputAdornment position="end" sx={{ color: colors.secondaryText }}>BTC</InputAdornment>,
                    style: { color: colors.primaryText }
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      bgcolor: colors.cardBg,
                      '& fieldset': { borderColor: colors.borderColor },
                      '&:hover fieldset': { borderColor: colors.borderColor },
                      '&.Mui-focused fieldset': { borderColor: colors.accentYellow },
                    }
                  }}
                />
                
                {/* Percentage Buttons */}
                {percentageButtonsJsx}
              </Box>
              
              {/* Total Input */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="body2" sx={{ color: colors.secondaryText, mb: 0.5 }}>
                  Total
                </Typography>
                <TextField
                  fullWidth
                  size="small"
                  value={orderForm.total}
                  onChange={handleTotalChange}
                  InputProps={{
                    endAdornment: <InputAdornment position="end" sx={{ color: colors.secondaryText }}>USDT</InputAdornment>,
                    style: { color: colors.primaryText }
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      bgcolor: colors.cardBg,
                      '& fieldset': { borderColor: colors.borderColor },
                      '&:hover fieldset': { borderColor: colors.borderColor },
                      '&.Mui-focused fieldset': { borderColor: colors.accentYellow },
                    }
                  }}
                />
              </Box>
              
              {/* Order Button */}
              <Button
                fullWidth
                variant="contained"
                size="large"
                sx={{
                  bgcolor: orderSide === 'buy' ? colors.buyGreen : colors.sellRed,
                  color: colors.primaryText,
                  fontWeight: 600,
                  py: 1.5,
                  '&:hover': {
                    bgcolor: orderSide === 'buy' ? colors.buyGreen : colors.sellRed,
                    opacity: 0.9
                  }
                }}
                onClick={handlePlaceOrder}
              >
                {orderSide === 'buy' ? 'BUY ' : 'SELL '} BTC
              </Button>
              
              {/* Available Balance */}
              <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" sx={{ color: colors.secondaryText }}>
                  Available Balance:
                </Typography>
                <Typography variant="body2" sx={{ color: colors.primaryText }}>
                  {accountInfo.balance.toFixed(2)} USDT
                </Typography>
              </Box>
            </Box>
            
            {/* Order History Tabs */}
            <Box sx={{ 
              borderTop: `1px solid ${colors.borderColor}`, 
              mt: 'auto'
            }}>
              <Tabs 
                value={0} 
                variant="fullWidth"
                sx={{
                  minHeight: '36px',
                  '& .MuiTab-root': { 
                    minHeight: '36px',
                    color: colors.secondaryText,
                    '&.Mui-selected': { color: colors.primaryText }
                  },
                  '& .MuiTabs-indicator': { backgroundColor: colors.accentYellow }
                }}
              >
                <Tab label="Open Orders (0)" />
                <Tab label="Order History" />
              </Tabs>
              
              {renderOpenOrders()}
            </Box>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
};

export default ShortTermTrading;

// Helper functions for generating mock data
function generateMockHistoricalData(symbol, timeframe) {
  const currencyBasePrices = {
    'EUR/USD': 1.0850,
    'GBP/USD': 1.2650,
    'USD/JPY': 145.80,
    'AUD/USD': 0.6750,
    'USD/CAD': 1.3570,
    'NZD/USD': 0.6150,
    'USD/CHF': 0.8950,
    'EUR/GBP': 0.8550,
    'EUR/JPY': 158.20,
    'GBP/JPY': 184.40
  };

  let basePrice = currencyBasePrices[symbol] || 1.0000;
  const data = [];
  const now = new Date();
  
  // Set volatility based on timeframe and currency pair
  let volatility = 0.001; // Default volatility
  
  // Adjust volatility based on timeframe (shorter timeframes have less volatility)
  switch (timeframe) {
    case '1m': volatility = 0.0005; break;
    case '5m': volatility = 0.001; break;
    case '15m': volatility = 0.0015; break;
    case '1h': volatility = 0.002; break;
    case '4h': volatility = 0.003; break;
    case '1d': volatility = 0.005; break;
    case '1w': volatility = 0.01; break;
    default: volatility = 0.002;
  }
  
  // Adjust volatility based on currency pair (some pairs are more volatile)
  if (symbol.includes('JPY')) {
    volatility *= 2; // JPY pairs tend to have larger pip movements
  } else if (symbol.includes('GBP')) {
    volatility *= 1.5; // GBP pairs tend to be more volatile
  }
  
  // Generate 100 data points
  for (let i = 0; i < 100; i++) {
    // Create a trend with some randomness
    const trendDirection = Math.random() > 0.5 ? 1 : -1;
    const trendBias = trendDirection * volatility * 0.3;
    const randomChange = (Math.random() * volatility * 2) - volatility + trendBias;
    
    // Calculate prices with proper precision
    const open = parseFloat(basePrice.toFixed(4));
    const close = parseFloat((basePrice * (1 + randomChange)).toFixed(4));
    
    // Calculate high and low
    let high, low;
    if (close > open) {
      high = parseFloat((close * (1 + Math.random() * volatility * 0.5)).toFixed(4));
      low = parseFloat((open * (1 - Math.random() * volatility * 0.5)).toFixed(4));
    } else {
      high = parseFloat((open * (1 + Math.random() * volatility * 0.5)).toFixed(4));
      low = parseFloat((close * (1 - Math.random() * volatility * 0.5)).toFixed(4));
    }
    
    // Create timestamp based on timeframe
    const timestamp = new Date(now);
    
    // Adjust timestamp based on timeframe
    const timeMultiplier = {
      '1m': 1, '5m': 5, '15m': 15, '1h': 60, '4h': 240, '1d': 1440, '1w': 10080
    };
    timestamp.setMinutes(timestamp.getMinutes() - (100 - i) * (timeMultiplier[timeframe] || 60));
    
    // Add to data array
    data.push({
      timestamp: timestamp.toISOString(),
      open: open,
      high: high,
      low: low,
      close: close,
      volume: Math.floor(Math.random() * 1000) + 500
    });
    
    // Update base price for next iteration
    basePrice = close;
  }
  
  return data;
}

function generateMockTechnicalIndicators(symbol) {
  // Generate realistic RSI (30-70 range)
  const rsi = (Math.random() * 40 + 30).toFixed(4);
  
  // Generate realistic MACD values
  const macd = (Math.random() * 0.004 - 0.002).toFixed(6);
  const macdSignal = (Math.random() * 0.004 - 0.002).toFixed(6);
  const macdHist = (parseFloat(macd) - parseFloat(macdSignal)).toFixed(6);
  
  // Get the base price for the symbol
  const currencyBasePrices = {
    'EUR/USD': 1.0850,
    'GBP/USD': 1.2650,
    'USD/JPY': 145.80,
    'AUD/USD': 0.6750,
    'USD/CAD': 1.3570,
    'NZD/USD': 0.6150,
    'USD/CHF': 0.8950,
    'EUR/GBP': 0.8550,
    'EUR/JPY': 158.20,
    'GBP/JPY': 184.40
  };
  
  const basePrice = currencyBasePrices[symbol] || 1.0000;
  
  // Generate SMA values close to the base price
  const sma20 = (basePrice * (1 + (Math.random() * 0.01 - 0.005))).toFixed(4);
  const sma50 = (basePrice * (1 + (Math.random() * 0.015 - 0.0075))).toFixed(4);
  const sma200 = (basePrice * (1 + (Math.random() * 0.02 - 0.01))).toFixed(4);
  
  return {
    symbol: symbol,
    rsi: parseFloat(rsi),
    macd: parseFloat(macd),
    macd_signal: parseFloat(macdSignal),
    macd_hist: parseFloat(macdHist),
    sma20: parseFloat(sma20),
    sma50: parseFloat(sma50),
    sma200: parseFloat(sma200),
    updated_at: new Date().toISOString()
  };
}

function generateMockSupportResistance(symbol) {
  const currencyBasePrices = {
    'EUR/USD': 1.0850,
    'GBP/USD': 1.2650,
    'USD/JPY': 145.80,
    'AUD/USD': 0.6750,
    'USD/CAD': 1.3570,
    'NZD/USD': 0.6150,
    'USD/CHF': 0.8950,
    'EUR/GBP': 0.8550,
    'EUR/JPY': 158.20,
    'GBP/JPY': 184.40
  };
  
  const basePrice = currencyBasePrices[symbol] || 1.0000;
  
  // Generate 3 support levels below the base price
  const supportLevels = [
    parseFloat((basePrice * 0.995).toFixed(4)),
    parseFloat((basePrice * 0.990).toFixed(4)),
    parseFloat((basePrice * 0.985).toFixed(4))
  ];
  
  // Generate 3 resistance levels above the base price
  const resistanceLevels = [
    parseFloat((basePrice * 1.005).toFixed(4)),
    parseFloat((basePrice * 1.010).toFixed(4)),
    parseFloat((basePrice * 1.015).toFixed(4))
  ];
  
  return {
    symbol: symbol,
    support: supportLevels,
    resistance: resistanceLevels,
    updated_at: new Date().toISOString()
  };
} 