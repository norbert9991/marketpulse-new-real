import React, { useState, useEffect, useRef } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Grid, 
  Tabs, 
  Tab, 
  TextField, 
  Button, 
  Select, 
  MenuItem,
  FormControl,
  InputLabel,
  InputAdornment,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Chip,
  Divider,
  IconButton,
  Tooltip
} from '@mui/material';
import Sidebar from './Sidebar';
import { API } from '../axiosConfig';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import RefreshIcon from '@mui/icons-material/Refresh';
import DeleteIcon from '@mui/icons-material/Delete';
import HistoryIcon from '@mui/icons-material/History';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import { createChart } from 'lightweight-charts';
import CloseIcon from '@mui/icons-material/Close';

// Color palette matching the system
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

const ShortTermTrading = () => {
  // Chart refs
  const chartContainerRef = useRef(null);
  const chartRef = useRef(null);
  const candleSeriesRef = useRef(null);
  const lastCandleTimeRef = useRef(null);
  
  // State variables
  const [selectedPair, setSelectedPair] = useState('EURUSD');
  const [orderType, setOrderType] = useState('market');
  const [tabValue, setTabValue] = useState(0);
  const [amount, setAmount] = useState(1000);
  const [price, setPrice] = useState(0);
  const [stopPrice, setStopPrice] = useState(0);
  const [limitPrice, setLimitPrice] = useState(0);
  const [openOrders, setOpenOrders] = useState([]);
  const [orderHistory, setOrderHistory] = useState([]);
  const [tradeHistory, setTradeHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [balance, setBalance] = useState(10000);
  const [currentPrice, setCurrentPrice] = useState({ bid: 0, ask: 0 });
  const [sessionId, setSessionId] = useState(null);
  const [error, setError] = useState(null);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [initialBalance, setInitialBalance] = useState(10000);
  const [marketData, setMarketData] = useState(null);

  // Available currency pairs
  const currencyPairs = [
    { value: 'EURUSD', label: 'EUR/USD' },
    { value: 'GBPUSD', label: 'GBP/USD' },
    { value: 'USDJPY', label: 'USD/JPY' },
    { value: 'AUDUSD', label: 'AUD/USD' },
    { value: 'USDCAD', label: 'USD/CAD' },
    { value: 'NZDUSD', label: 'NZD/USD' },
    { value: 'USDCHF', label: 'USD/CHF' }
  ];

  // Handle tab changes
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
    
    // Update order type based on tab
    if (newValue === 0) {
      setOrderType('market');
    } else if (newValue === 1) {
      setOrderType('limit');
    } else if (newValue === 2) {
      setOrderType('stop-limit');
    }
  };

  // Place an order
  const placeOrder = async (direction) => {
    if (!sessionId) {
      setError("No active trading session");
      return;
    }
    
    // Validate input
    if (amount <= 0) {
      setError("Amount must be greater than 0");
      return;
    }
    
    // For limit and stop-limit orders, validate prices
    if (orderType === 'limit' && (!limitPrice || limitPrice <= 0)) {
      setError("Limit price must be set");
      return;
    }
    
    if (orderType === 'stop-limit' && (!stopPrice || stopPrice <= 0 || !limitPrice || limitPrice <= 0)) {
      setError("Stop and limit prices must be set");
      return;
    }
    
    try {
      setLoading(true);
      
      // Prepare order data
      const orderData = {
        symbol: selectedPair,
        order_type: orderType,
        direction,
        amount,
        price: currentPrice.ask, // Current market price
        status: 'open'
      };
      
      // Add additional fields based on order type
      if (orderType === 'limit') {
        orderData.target_price = limitPrice;
      } else if (orderType === 'stop-limit') {
        orderData.stop_price = stopPrice;
        orderData.target_price = limitPrice;
      }
      
      // Create order in database
      const response = await API.simulation.createOrder(sessionId, orderData);
      
      if (response.data && response.data.order) {
        const newOrder = response.data.order;
        
        // Add to open orders if not a market order (which executes immediately)
        if (orderType !== 'market') {
          setOpenOrders([...openOrders, newOrder]);
        }
        
        // Add to order history
        setOrderHistory([newOrder, ...orderHistory]);
        
        // If it's a market order, execute immediately
        if (orderType === 'market') {
          await executeMarketOrder(newOrder);
        }
        
        // Reset form fields
        if (orderType === 'limit') {
          setLimitPrice(currentPrice.ask);
        } else if (orderType === 'stop-limit') {
          setStopPrice(currentPrice.ask);
          setLimitPrice(currentPrice.ask);
        }
        
        // Refresh data
        loadOpenOrders();
        loadOrderHistory();
        loadTradeHistory();
        
        // Refresh balance
        updateBalance();
      } else {
        setError("Failed to place order");
      }
    } catch (error) {
      console.error("Error placing order:", error);
      setError("Failed to place order: " + (error.response?.data?.error || error.message));
    } finally {
      setLoading(false);
    }
  };
  
  // Execute a market order
  const executeMarketOrder = async (order) => {
    if (!sessionId) return;
    
    try {
      // Determine execution price based on direction
      const executionPrice = order.direction === 'buy' ? currentPrice.ask : currentPrice.bid;
      
      // Calculate profit/loss for already executed orders
      let profitLoss = 0;
      
      // Create trade record in database
      const tradeData = {
        order_id: order.order_id,
        symbol: order.symbol,
        direction: order.direction,
        order_type: order.order_type,
        open_price: executionPrice,
        close_price: executionPrice, // Same for market orders
        amount: order.amount,
        profit_loss: profitLoss
      };
      
      // Record the trade
      const tradeResponse = await API.simulation.createTrade(sessionId, tradeData);
      
      if (tradeResponse.data && tradeResponse.data.trade) {
        const newTrade = tradeResponse.data.trade;
        
        // Add to trade history
        setTradeHistory([newTrade, ...tradeHistory]);
        
        // Update balance based on trade
        updateBalance();
      }
      
      // Remove from open orders if it was a limit or stop-limit order
      if (order.order_type !== 'market') {
        setOpenOrders(openOrders.filter(o => o.order_id !== order.order_id));
      }
      
      // Update order status in history
      setOrderHistory(orderHistory.map(o => {
        if (o.order_id === order.order_id) {
          return { ...o, status: 'filled', executed_at: new Date().toISOString() };
        }
        return o;
      }));
    } catch (error) {
      console.error("Error executing market order:", error);
      setError("Failed to execute order: " + (error.response?.data?.error || error.message));
    }
  };
  
  // Cancel an open order
  const cancelOrder = async (orderId) => {
    if (!sessionId) return;
    
    try {
      setLoading(true);
      
      // Cancel order in database
      await API.simulation.cancelOrder(sessionId, orderId);
      
      // Remove from open orders
      setOpenOrders(openOrders.filter(o => o.order_id !== orderId));
      
      // Update order history
      setOrderHistory(orderHistory.map(o => {
        if (o.order_id === orderId) {
          return { ...o, status: 'canceled', canceled_at: new Date().toISOString() };
        }
        return o;
      }));
    } catch (error) {
      console.error("Error canceling order:", error);
      setError("Failed to cancel order: " + (error.response?.data?.error || error.message));
    } finally {
      setLoading(false);
    }
  };
  
  // Update account balance
  const updateBalance = async () => {
    if (!sessionId) return;
    
    try {
      const response = await API.simulation.getBalance(sessionId);
      if (response.data && response.data.balance) {
        setBalance(response.data.balance);
      }
    } catch (error) {
      console.error("Error updating balance:", error);
    }
  };
  
  // Function to check and execute pending orders based on price changes
  const checkPendingOrders = (price) => {
    if (!openOrders.length || !sessionId) return;
    
    // Copy the current orders to avoid modifying during iteration
    const orders = [...openOrders];
    
    // Check each order
    orders.forEach(order => {
      // For limit buy orders: execute if price falls below limit price
      if (order.order_type === 'limit' && order.direction === 'buy' && price.ask <= order.target_price) {
        executeMarketOrder({...order, limitReached: true});
      }
      // For limit sell orders: execute if price rises above limit price
      else if (order.order_type === 'limit' && order.direction === 'sell' && price.bid >= order.target_price) {
        executeMarketOrder({...order, limitReached: true});
      }
      // For stop-limit orders
      else if (order.order_type === 'stop-limit') {
        // Buy stop-limit: trigger limit order if price rises above stop price
        if (order.direction === 'buy' && price.ask >= order.stop_price) {
          // Convert to a limit order
          setOpenOrders(prev => prev.map(o => 
            o.order_id === order.order_id ? {...o, order_type: 'limit', stopTriggered: true} : o
          ));
        } 
        // Sell stop-limit: trigger limit order if price falls below stop price
        else if (order.direction === 'sell' && price.bid <= order.stop_price) {
          // Convert to a limit order
          setOpenOrders(prev => prev.map(o => 
            o.order_id === order.order_id ? {...o, order_type: 'limit', stopTriggered: true} : o
          ));
        }
      }
    });
  };

  // Initialize lightweight chart
  useEffect(() => {
    if (!chartContainerRef.current || !selectedPair) return;
    
    // Clear previous chart if it exists
    if (chartRef.current) {
      chartRef.current.remove();
      chartRef.current = null;
    }
    
    // Create new chart
    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { color: colors.cardBg },
        textColor: colors.secondaryText,
      },
      grid: {
        vertLines: { color: colors.borderColor, style: 1 },
        horzLines: { color: colors.borderColor, style: 1 },
      },
      crosshair: {
        mode: 1, // CrosshairMode.Magnet
        vertLine: {
          color: colors.accentBlue,
          width: 1,
          style: 0, // LineStyle.Solid
          labelBackgroundColor: colors.cardBg,
        },
        horzLine: {
          color: colors.accentBlue,
          width: 1,
          style: 0, // LineStyle.Solid
          labelBackgroundColor: colors.cardBg,
        },
      },
      timeScale: {
        borderColor: colors.borderColor,
        timeVisible: true,
        secondsVisible: false,
      },
      rightPriceScale: {
        borderColor: colors.borderColor,
      },
      width: chartContainerRef.current.clientWidth,
      height: 400,
    });
    
    // Create candlestick series
    const candlestickSeries = chart.addCandlestickSeries({
      upColor: colors.buyGreen,
      downColor: colors.sellRed,
      borderUpColor: colors.buyGreen,
      borderDownColor: colors.sellRed,
      wickUpColor: colors.buyGreen,
      wickDownColor: colors.sellRed,
    });
    
    // Save candlestick series reference
    candleSeriesRef.current = candlestickSeries;
    
    // Get the Yahoo Finance symbol format
    const pair = currencyPairs.find(p => p.value === selectedPair);
    const yahooSymbol = pair ? pair.yahooSymbol : `${selectedPair}=X`;
    
    // Fetch historical data
    const fetchHistoricalData = async () => {
      try {
        const response = await API.market.getHistory(yahooSymbol);
        
        if (response.data && response.data.history && response.data.history.length > 0) {
          // Convert history to candlestick format
          const candles = response.data.history.map(item => ({
            time: new Date(item.date).getTime() / 1000,
            open: parseFloat(item.open),
            high: parseFloat(item.high),
            low: parseFloat(item.low),
            close: parseFloat(item.close)
          }));
          
          // Set chart data
          candlestickSeries.setData(candles);
          
          // Save the last candle time for updates
          if (candles.length > 0) {
            lastCandleTimeRef.current = candles[candles.length - 1].time;
            
            // Update current price based on the latest candle
            const lastCandle = candles[candles.length - 1];
            const spread = 0.0002; // 2 pips spread
            setCurrentPrice({
              bid: lastCandle.close - spread / 2,
              ask: lastCandle.close + spread / 2
            });
          }
          
          // Add moving average
          const maSeries = chart.addLineSeries({
            color: colors.accentBlue,
            lineWidth: 2,
          });
          
          // Calculate simple 7-day MA for candles
          if (candles.length > 7) {
            const maData = [];
            for (let i = 6; i < candles.length; i++) {
              let sum = 0;
              for (let j = 0; j < 7; j++) {
                sum += candles[i - j].close;
              }
              maData.push({
                time: candles[i].time,
                value: sum / 7
              });
            }
            
            maSeries.setData(maData);
          }
        } else {
          // If no history, create sample data
          generateSampleData(candlestickSeries);
        }
      } catch (error) {
        console.error("Error fetching historical data:", error);
        // If error, create sample data
        generateSampleData(candlestickSeries);
      }
    };
    
    // Helper function to generate sample data if API fails
    const generateSampleData = (series) => {
      const currentDate = new Date();
      const sampleData = [];
      
      // Determine base price based on currency pair
      let basePrice = 1.10; // Default for EURUSD
      if (selectedPair === 'GBPUSD') basePrice = 1.26;
      else if (selectedPair === 'USDJPY') basePrice = 151.50;
      else if (selectedPair === 'AUDUSD') basePrice = 0.65;
      else if (selectedPair === 'USDCAD') basePrice = 1.36;
      else if (selectedPair === 'NZDUSD') basePrice = 0.59;
      else if (selectedPair === 'USDCHF') basePrice = 0.90;
      
      for (let i = 30; i >= 0; i--) {
        const time = new Date(currentDate);
        time.setDate(time.getDate() - i);
        
        // Generate random candle
        const volatility = 0.02;
        const open = basePrice + (Math.random() - 0.5) * volatility;
        const high = open + Math.random() * volatility / 2;
        const low = open - Math.random() * volatility / 2;
        const close = (low + Math.random() * (high - low));
        
        sampleData.push({
          time: time.getTime() / 1000,
          open,
          high,
          low,
          close,
        });
      }
      
      // Set chart data
      series.setData(sampleData);
      
      // Save the last candle time for updates
      if (sampleData.length > 0) {
        lastCandleTimeRef.current = sampleData[sampleData.length - 1].time;
        
        // Update current price based on the latest candle
        const lastCandle = sampleData[sampleData.length - 1];
        const spread = 0.0002; // 2 pips spread
        setCurrentPrice({
          bid: lastCandle.close - spread / 2,
          ask: lastCandle.close + spread / 2
        });
      }
      
      // Add moving average
      const maSeries = chart.addLineSeries({
        color: colors.accentBlue,
        lineWidth: 2,
      });
      
      // Calculate simple 7-day MA
      const maData = [];
      for (let i = 6; i < sampleData.length; i++) {
        let sum = 0;
        for (let j = 0; j < 7; j++) {
          sum += sampleData[i - j].close;
        }
        maData.push({
          time: sampleData[i].time,
          value: sum / 7
        });
      }
      
      maSeries.setData(maData);
    };
    
    // Fetch data
    fetchHistoricalData();
    
    // Handle resize
    const handleResize = () => {
      if (chartRef.current) {
        chartRef.current.applyOptions({
          width: chartContainerRef.current.clientWidth,
        });
      }
    };
    
    window.addEventListener('resize', handleResize);
    
    // Save references
    chartRef.current = chart;
    
    // Clean up
    return () => {
      window.removeEventListener('resize', handleResize);
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
      }
    };
  }, [selectedPair]);
  
  // Simulated real-time price updates - keep this until real-time API is available
  useEffect(() => {
    if (!candleSeriesRef.current || !lastCandleTimeRef.current) return;
    
    // Function to update the latest candle or create a new one
    const updateCandles = () => {
      const now = new Date().getTime() / 1000;
      const lastCandleTime = lastCandleTimeRef.current;
      
      // If more than 5 minutes have passed, create a new candle
      if (now - lastCandleTime > 300) {
        // New candle time (rounded to minute)
        const newTime = Math.floor(now / 60) * 60;
        lastCandleTimeRef.current = newTime;
        
        // Generate a new candle based on the last price
        const lastPrice = currentPrice.ask;
        const volatility = 0.0005;
        const open = lastPrice;
        const high = open + Math.random() * volatility;
        const low = open - Math.random() * volatility;
        const close = open + (Math.random() - 0.5) * volatility;
        
        // Add the new candle
        candleSeriesRef.current.update({
          time: newTime,
          open,
          high,
          low,
          close
        });
        
        // Update current price
        const spread = 0.0002; // 2 pips spread
        setCurrentPrice({
          bid: close - spread / 2,
          ask: close + spread / 2
        });
        
        // Check if any pending orders should be executed
        checkPendingOrders({
          bid: close - spread / 2,
          ask: close + spread / 2
        });
      } else {
        // Update the current candle
        const currentCandle = candleSeriesRef.current.dataByIndex(
          candleSeriesRef.current.dataSize() - 1
        );
        
        if (currentCandle) {
          // Create a small price change
          const priceMove = (Math.random() - 0.5) * 0.0002;
          let close = currentCandle.close + priceMove;
          
          // Update highs and lows if needed
          const high = Math.max(currentCandle.high, close);
          const low = Math.min(currentCandle.low, close);
          
          // Update the candle
          candleSeriesRef.current.update({
            time: currentCandle.time,
            open: currentCandle.open,
            high,
            low,
            close
          });
          
          // Update current price
          const spread = 0.0002; // 2 pips spread
          setCurrentPrice({
            bid: close - spread / 2,
            ask: close + spread / 2
          });
          
          // Check if any pending orders should be executed
          checkPendingOrders({
            bid: close - spread / 2,
            ask: close + spread / 2
          });
        }
      }
    };
    
    // Update every second
    const intervalId = setInterval(updateCandles, 1000);
    
    return () => clearInterval(intervalId);
  }, [currentPrice]);

  return (
    <Box sx={{ display: 'flex', bgcolor: colors.darkBg, height: '100vh', overflow: 'hidden' }}>
      <Sidebar activePage="Trading" />
      <Box sx={{ flexGrow: 1, ml: '250px', overflow: 'auto', height: '100vh', p: 3 }}>
        {/* Header with session info */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" sx={{ color: colors.primaryText }}>
            Short Term Trading
          </Typography>
          
          {sessionLoading ? (
            <CircularProgress size={24} sx={{ color: colors.accentBlue }} />
          ) : sessionId ? (
            <Chip 
              label={`Session #${sessionId}`} 
              variant="outlined" 
              size="small"
              sx={{ 
                color: colors.secondaryText,
                borderColor: colors.borderColor,
                '& .MuiChip-label': { px: 1 }
              }} 
            />
          ) : null}
        </Box>
        
        {/* Error display */}
        {error && (
          <Paper 
            sx={{ 
              bgcolor: 'rgba(255, 61, 87, 0.1)', 
              color: colors.sellRed,
              p: 2,
              mb: 3,
              borderRadius: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <Typography>{error}</Typography>
            <IconButton size="small" onClick={() => setError(null)} sx={{ color: colors.sellRed }}>
              <CloseIcon fontSize="small" />
            </IconButton>
          </Paper>
        )}
        
        {sessionLoading ? (
          <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            justifyContent: 'center',
            height: 'calc(100vh - 200px)'
          }}>
            <CircularProgress size={60} sx={{ color: colors.accentBlue, mb: 3 }} />
            <Typography variant="h6" sx={{ color: colors.primaryText }}>
              Initializing Trading Session...
            </Typography>
          </Box>
        ) : (
          <Grid container spacing={3}>
            {/* Left side - Chart and Trading interface */}
            <Grid item xs={12} md={8}>
              {/* Price chart */}
              <Paper 
                sx={{ 
                  bgcolor: colors.cardBg, 
                  mb: 3, 
                  height: '400px',
                  border: `1px solid ${colors.borderColor}`,
                  borderRadius: 2,
                  overflow: 'hidden',
                  position: 'relative'
                }}
                ref={chartContainerRef}
              >
                {loading && (
                  <Box sx={{ 
                    position: 'absolute', 
                    top: 0, 
                    left: 0, 
                    right: 0, 
                    bottom: 0, 
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: 'rgba(30, 34, 53, 0.7)',
                    zIndex: 10
                  }}>
                    <CircularProgress size={40} sx={{ color: colors.accentBlue }} />
                  </Box>
                )}
              </Paper>
              
              {/* Trading pair info */}
              {marketData && (
                <Paper 
                  sx={{ 
                    bgcolor: colors.cardBg, 
                    mb: 3, 
                    p: 2,
                    border: `1px solid ${colors.borderColor}`,
                    borderRadius: 2
                  }}
                >
                  <Grid container spacing={2} alignItems="center">
                    <Grid item xs={6} md={3}>
                      <Typography variant="caption" sx={{ color: colors.secondaryText, display: 'block' }}>
                        Current Price
                      </Typography>
                      <Typography variant="h6" sx={{ color: colors.primaryText, fontWeight: 'bold' }}>
                        {currentPrice.ask.toFixed(5)}
                      </Typography>
                    </Grid>
                    
                    <Grid item xs={6} md={3}>
                      <Typography variant="caption" sx={{ color: colors.secondaryText, display: 'block' }}>
                        24h Change
                      </Typography>
                      <Typography 
                        variant="h6" 
                        sx={{ 
                          color: marketData.change_percentage >= 0 ? colors.buyGreen : colors.sellRed,
                          display: 'flex',
                          alignItems: 'center'
                        }}
                      >
                        {Math.abs(marketData.change_percentage).toFixed(2)}%
                      </Typography>
                    </Grid>
                    
                    <Grid item xs={6} md={3}>
                      <Typography variant="caption" sx={{ color: colors.secondaryText, display: 'block' }}>
                        Spread
                      </Typography>
                      <Typography variant="h6" sx={{ color: colors.primaryText }}>
                        {((currentPrice.ask - currentPrice.bid) * 10000).toFixed(1)} pips
                      </Typography>
                    </Grid>
                    
                    <Grid item xs={6} md={3}>
                      <Typography variant="caption" sx={{ color: colors.secondaryText, display: 'block' }}>
                        Trend
                      </Typography>
                      <Chip 
                        label={marketData.trend || "Neutral"} 
                        size="small"
                        sx={{ 
                          bgcolor: marketData.trend === 'Bullish' 
                            ? 'rgba(0, 230, 118, 0.2)' 
                            : marketData.trend === 'Bearish' 
                              ? 'rgba(255, 61, 87, 0.2)'
                              : 'rgba(33, 150, 243, 0.2)',
                          color: marketData.trend === 'Bullish' 
                            ? colors.buyGreen 
                            : marketData.trend === 'Bearish' 
                              ? colors.sellRed
                              : colors.accentBlue
                        }}
                      />
                    </Grid>
                  </Grid>
                </Paper>
              )}
              
              {/* Trading interface */}
              <Paper sx={{ bgcolor: colors.cardBg, p: 2, border: `1px solid ${colors.borderColor}`, borderRadius: 2 }}>
                <Tabs 
                  value={tabValue} 
                  onChange={handleTabChange}
                  sx={{ 
                    mb: 2,
                    '& .MuiTabs-indicator': { bgcolor: colors.accentBlue },
                    '& .MuiTab-root': { color: colors.secondaryText },
                    '& .Mui-selected': { color: colors.primaryText }
                  }}
                >
                  <Tab label="Market" />
                  <Tab label="Limit" />
                  <Tab label="Stop Limit" />
                </Tabs>
                
                <Box sx={{ mb: 2 }}>
                  <Grid container spacing={2} alignItems="center">
                    {/* Currency pair selector */}
                    <Grid item xs={12} sm={6}>
                      <FormControl fullWidth variant="outlined">
                        <InputLabel id="pair-select-label" sx={{ color: colors.secondaryText }}>
                          Currency Pair
                        </InputLabel>
                        <Select
                          labelId="pair-select-label"
                          value={selectedPair}
                          onChange={(e) => setSelectedPair(e.target.value)}
                          label="Currency Pair"
                          sx={{ 
                            color: colors.primaryText,
                            '.MuiOutlinedInput-notchedOutline': { borderColor: colors.borderColor },
                            '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: colors.accentBlue },
                          }}
                          disabled={loading}
                        >
                          {currencyPairs.map((pair) => (
                            <MenuItem key={pair.value} value={pair.value}>
                              {pair.label}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                    
                    {/* Amount input */}
                    <Grid item xs={12} sm={6}>
                      <TextField
                        label="Amount"
                        variant="outlined"
                        type="number"
                        value={amount}
                        onChange={(e) => setAmount(Number(e.target.value))}
                        fullWidth
                        InputProps={{
                          startAdornment: <InputAdornment position="start">$</InputAdornment>,
                        }}
                        sx={{ 
                          input: { color: colors.primaryText },
                          label: { color: colors.secondaryText },
                          '.MuiOutlinedInput-notchedOutline': { borderColor: colors.borderColor },
                          '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: colors.accentBlue },
                        }}
                        disabled={loading}
                      />
                    </Grid>
                    
                    {/* Current price info */}
                    <Grid item xs={12}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1, mb: 2 }}>
                        <Typography sx={{ color: colors.secondaryText }}>
                          Bid: <span style={{ color: colors.sellRed }}>{currentPrice.bid.toFixed(5)}</span>
                        </Typography>
                        <Typography sx={{ color: colors.secondaryText }}>
                          Ask: <span style={{ color: colors.buyGreen }}>{currentPrice.ask.toFixed(5)}</span>
                        </Typography>
                      </Box>
                    </Grid>
                    
                    {/* Additional fields based on order type */}
                    {tabValue === 1 && (
                      <Grid item xs={12}>
                        <TextField
                          label="Limit Price"
                          variant="outlined"
                          type="number"
                          value={limitPrice}
                          onChange={(e) => setLimitPrice(Number(e.target.value))}
                          fullWidth
                          sx={{ 
                            input: { color: colors.primaryText },
                            label: { color: colors.secondaryText },
                            '.MuiOutlinedInput-notchedOutline': { borderColor: colors.borderColor },
                            '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: colors.accentBlue },
                          }}
                          disabled={loading}
                        />
                      </Grid>
                    )}
                    
                    {tabValue === 2 && (
                      <>
                        <Grid item xs={12} sm={6}>
                          <TextField
                            label="Stop Price"
                            variant="outlined"
                            type="number"
                            value={stopPrice}
                            onChange={(e) => setStopPrice(Number(e.target.value))}
                            fullWidth
                            sx={{ 
                              input: { color: colors.primaryText },
                              label: { color: colors.secondaryText },
                              '.MuiOutlinedInput-notchedOutline': { borderColor: colors.borderColor },
                              '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: colors.accentBlue },
                            }}
                            disabled={loading}
                          />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <TextField
                            label="Limit Price"
                            variant="outlined"
                            type="number"
                            value={limitPrice}
                            onChange={(e) => setLimitPrice(Number(e.target.value))}
                            fullWidth
                            sx={{ 
                              input: { color: colors.primaryText },
                              label: { color: colors.secondaryText },
                              '.MuiOutlinedInput-notchedOutline': { borderColor: colors.borderColor },
                              '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: colors.accentBlue },
                            }}
                            disabled={loading}
                          />
                        </Grid>
                      </>
                    )}
                    
                    {/* Action buttons */}
                    <Grid item xs={6}>
                      <Button
                        variant="contained"
                        fullWidth
                        onClick={() => placeOrder('buy')}
                        sx={{ 
                          bgcolor: colors.buyGreen,
                          '&:hover': { bgcolor: 'success.dark' },
                          py: 1.5
                        }}
                        disabled={loading || !sessionId}
                      >
                        {loading ? <CircularProgress size={24} sx={{ color: '#fff' }} /> : "BUY"}
                      </Button>
                    </Grid>
                    <Grid item xs={6}>
                      <Button
                        variant="contained"
                        fullWidth
                        onClick={() => placeOrder('sell')}
                        sx={{ 
                          bgcolor: colors.sellRed,
                          '&:hover': { bgcolor: 'error.dark' },
                          py: 1.5
                        }}
                        disabled={loading || !sessionId}
                      >
                        {loading ? <CircularProgress size={24} sx={{ color: '#fff' }} /> : "SELL"}
                      </Button>
                    </Grid>
                  </Grid>
                </Box>
              </Paper>
            </Grid>
            
            {/* Right side - Balance, Open Orders, History */}
            <Grid item xs={12} md={4}>
              {/* Account balance */}
              <Paper sx={{ bgcolor: colors.cardBg, p: 2, mb: 3, border: `1px solid ${colors.borderColor}`, borderRadius: 2 }}>
                <Typography variant="h6" sx={{ color: colors.primaryText, mb: 1 }}>
                  Account Balance
                </Typography>
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="h4" sx={{ color: colors.accentBlue, fontWeight: 'bold' }}>
                    ${balance.toFixed(2)}
                  </Typography>
                  
                  <Box>
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        color: balance >= initialBalance ? colors.buyGreen : colors.sellRed,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'flex-end'
                      }}
                    >
                      {balance >= initialBalance ? (
                        <TrendingUpIcon fontSize="small" sx={{ mr: 0.5 }} />
                      ) : (
                        <TrendingDownIcon fontSize="small" sx={{ mr: 0.5 }} />
                      )}
                      {((balance / initialBalance - 1) * 100).toFixed(2)}%
                    </Typography>
                    <Typography variant="caption" sx={{ color: colors.secondaryText, display: 'block', textAlign: 'right' }}>
                      Initial: ${initialBalance.toFixed(2)}
                    </Typography>
                  </Box>
                </Box>
              </Paper>
              
              {/* Open Orders */}
              <Paper sx={{ bgcolor: colors.cardBg, p: 2, mb: 3, border: `1px solid ${colors.borderColor}`, borderRadius: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6" sx={{ color: colors.primaryText }}>
                    Open Orders
                  </Typography>
                  
                  <IconButton 
                    size="small" 
                    onClick={() => loadOpenOrders()}
                    sx={{ color: colors.secondaryText }}
                    disabled={loading || !sessionId}
                  >
                    <RefreshIcon fontSize="small" />
                  </IconButton>
                </Box>
                
                {openOrders.length === 0 ? (
                  <Typography sx={{ color: colors.secondaryText, textAlign: 'center', py: 2 }}>
                    No open orders
                  </Typography>
                ) : (
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell sx={{ color: colors.secondaryText }}>Pair</TableCell>
                          <TableCell sx={{ color: colors.secondaryText }}>Type</TableCell>
                          <TableCell sx={{ color: colors.secondaryText }}>Direction</TableCell>
                          <TableCell sx={{ color: colors.secondaryText }}>Amount</TableCell>
                          <TableCell align="center" sx={{ color: colors.secondaryText }}>Action</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {openOrders.map((order) => (
                          <TableRow key={order.order_id || order.id}>
                            <TableCell sx={{ color: colors.primaryText }}>
                              {order.symbol}
                            </TableCell>
                            <TableCell sx={{ color: colors.primaryText }}>
                              {order.order_type || order.type}
                            </TableCell>
                            <TableCell>
                              <Chip 
                                label={(order.direction || "").toUpperCase()} 
                                size="small"
                                sx={{ 
                                  bgcolor: order.direction === 'buy' ? 'rgba(0, 230, 118, 0.2)' : 'rgba(255, 61, 87, 0.2)',
                                  color: order.direction === 'buy' ? colors.buyGreen : colors.sellRed
                                }}
                              />
                            </TableCell>
                            <TableCell sx={{ color: colors.primaryText }}>
                              ${order.amount}
                            </TableCell>
                            <TableCell align="center">
                              <IconButton 
                                size="small" 
                                onClick={() => cancelOrder(order.order_id || order.id)}
                                sx={{ color: colors.secondaryText }}
                                disabled={loading}
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
              
              {/* Tabs for Order History and Trade History */}
              <Paper sx={{ bgcolor: colors.cardBg, p: 2, border: `1px solid ${colors.borderColor}`, borderRadius: 2 }}>
                <Tabs 
                  value={tabValue >= 3 ? tabValue - 3 : 0} 
                  onChange={(e, val) => setTabValue(val + 3)}
                  sx={{ 
                    mb: 2,
                    '& .MuiTabs-indicator': { bgcolor: colors.accentBlue },
                    '& .MuiTab-root': { color: colors.secondaryText },
                    '& .Mui-selected': { color: colors.primaryText }
                  }}
                >
                  <Tab label="Order History" />
                  <Tab label="Trade History" />
                </Tabs>
                
                {(tabValue === 3 || tabValue < 3) && (
                  <Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                      <Typography variant="subtitle1" sx={{ color: colors.primaryText }}>
                        Order History
                      </Typography>
                      
                      <IconButton 
                        size="small" 
                        onClick={() => loadOrderHistory()}
                        sx={{ color: colors.secondaryText }}
                        disabled={loading || !sessionId}
                      >
                        <RefreshIcon fontSize="small" />
                      </IconButton>
                    </Box>
                    
                    {orderHistory.length === 0 ? (
                      <Typography sx={{ color: colors.secondaryText, textAlign: 'center', py: 2 }}>
                        No order history
                      </Typography>
                    ) : (
                      <TableContainer sx={{ maxHeight: 240 }}>
                        <Table size="small" stickyHeader>
                          <TableHead>
                            <TableRow>
                              <TableCell sx={{ color: colors.secondaryText, bgcolor: colors.cardBg }}>Date</TableCell>
                              <TableCell sx={{ color: colors.secondaryText, bgcolor: colors.cardBg }}>Pair</TableCell>
                              <TableCell sx={{ color: colors.secondaryText, bgcolor: colors.cardBg }}>Type</TableCell>
                              <TableCell sx={{ color: colors.secondaryText, bgcolor: colors.cardBg }}>Status</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {orderHistory.map((order) => (
                              <TableRow key={order.order_id || order.id}>
                                <TableCell sx={{ color: colors.primaryText }}>
                                  {new Date(order.created_at || order.timestamp || order.createdAt).toLocaleString()}
                                </TableCell>
                                <TableCell sx={{ color: colors.primaryText }}>
                                  {order.symbol || order.pair}
                                </TableCell>
                                <TableCell sx={{ color: colors.primaryText }}>
                                  {order.order_type || order.type}
                                </TableCell>
                                <TableCell>
                                  <Chip 
                                    label={order.status} 
                                    size="small"
                                    sx={{ 
                                      bgcolor: 
                                        order.status === 'filled' || order.status === 'executed' ? 'rgba(0, 230, 118, 0.2)' : 
                                        order.status === 'canceled' || order.status === 'cancelled' ? 'rgba(255, 61, 87, 0.2)' :
                                        'rgba(33, 150, 243, 0.2)',
                                      color: 
                                        order.status === 'filled' || order.status === 'executed' ? colors.buyGreen : 
                                        order.status === 'canceled' || order.status === 'cancelled' ? colors.sellRed :
                                        colors.accentBlue
                                    }}
                                  />
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    )}
                  </Box>
                )}
                
                {tabValue === 4 && (
                  <Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                      <Typography variant="subtitle1" sx={{ color: colors.primaryText }}>
                        Trade History
                      </Typography>
                      
                      <IconButton 
                        size="small" 
                        onClick={() => loadTradeHistory()}
                        sx={{ color: colors.secondaryText }}
                        disabled={loading || !sessionId}
                      >
                        <RefreshIcon fontSize="small" />
                      </IconButton>
                    </Box>
                    
                    {tradeHistory.length === 0 ? (
                      <Typography sx={{ color: colors.secondaryText, textAlign: 'center', py: 2 }}>
                        No trade history
                      </Typography>
                    ) : (
                      <TableContainer sx={{ maxHeight: 240 }}>
                        <Table size="small" stickyHeader>
                          <TableHead>
                            <TableRow>
                              <TableCell sx={{ color: colors.secondaryText, bgcolor: colors.cardBg }}>Date</TableCell>
                              <TableCell sx={{ color: colors.secondaryText, bgcolor: colors.cardBg }}>Pair</TableCell>
                              <TableCell sx={{ color: colors.secondaryText, bgcolor: colors.cardBg }}>Direction</TableCell>
                              <TableCell sx={{ color: colors.secondaryText, bgcolor: colors.cardBg }}>Price</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {tradeHistory.map((trade) => (
                              <TableRow key={trade.trade_id || trade.id}>
                                <TableCell sx={{ color: colors.primaryText }}>
                                  {new Date(trade.trade_time || trade.timestamp || trade.created_at).toLocaleString()}
                                </TableCell>
                                <TableCell sx={{ color: colors.primaryText }}>
                                  {trade.symbol || trade.pair}
                                </TableCell>
                                <TableCell>
                                  <Chip 
                                    label={(trade.direction || "").toUpperCase()} 
                                    size="small"
                                    sx={{ 
                                      bgcolor: trade.direction === 'buy' ? 'rgba(0, 230, 118, 0.2)' : 'rgba(255, 61, 87, 0.2)',
                                      color: trade.direction === 'buy' ? colors.buyGreen : colors.sellRed
                                    }}
                                  />
                                </TableCell>
                                <TableCell sx={{ color: colors.primaryText }}>
                                  {trade.open_price ? trade.open_price.toFixed(5) : trade.price ? trade.price.toFixed(5) : 'N/A'}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    )}
                  </Box>
                )}
              </Paper>
            </Grid>
          </Grid>
        )}
      </Box>
    </Box>
  );
};

export default ShortTermTrading; 