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
  };

  // Basic placeholder function to simulate placing an order
  const placeOrder = (direction) => {
    const now = new Date();
    const id = `order-${Date.now()}`;
    
    let newOrder = {
      id,
      pair: selectedPair,
      type: orderType,
      direction,
      amount,
      status: 'open',
      createdAt: now.toISOString()
    };
    
    if (orderType === 'limit') {
      newOrder.limitPrice = limitPrice;
    } else if (orderType === 'stop-limit') {
      newOrder.stopPrice = stopPrice;
      newOrder.limitPrice = limitPrice;
    }
    
    setOpenOrders([...openOrders, newOrder]);
    
    // Add to order history
    setOrderHistory([
      {
        id,
        pair: selectedPair,
        type: orderType,
        direction,
        amount,
        status: 'placed',
        timestamp: now.toISOString()
      },
      ...orderHistory
    ]);
    
    // If it's a market order, execute immediately
    if (orderType === 'market') {
      executeMarketOrder(newOrder);
    }
  };
  
  // Simulated market order execution
  const executeMarketOrder = (order) => {
    const executionPrice = order.direction === 'buy' ? currentPrice.ask : currentPrice.bid;
    const now = new Date();
    
    // Update order status
    setOpenOrders(openOrders.filter(o => o.id !== order.id));
    
    // Add to trade history
    setTradeHistory([
      {
        id: `trade-${Date.now()}`,
        orderId: order.id,
        pair: order.pair,
        direction: order.direction,
        amount: order.amount,
        price: executionPrice,
        timestamp: now.toISOString()
      },
      ...tradeHistory
    ]);
    
    // Update order history
    setOrderHistory(orderHistory.map(o => {
      if (o.id === order.id) {
        return { ...o, status: 'executed', executedAt: now.toISOString() };
      }
      return o;
    }));
    
    // Update balance (simplified)
    if (order.direction === 'buy') {
      setBalance(balance - order.amount);
    } else {
      setBalance(balance + order.amount);
    }
  };
  
  // Cancel an open order
  const cancelOrder = (orderId) => {
    // Remove from open orders
    setOpenOrders(openOrders.filter(o => o.id !== orderId));
    
    // Update order history
    setOrderHistory(orderHistory.map(o => {
      if (o.id === orderId) {
        return { ...o, status: 'cancelled', cancelledAt: new Date().toISOString() };
      }
      return o;
    }));
  };
  
  // Initialize lightweight chart
  useEffect(() => {
    if (!chartContainerRef.current) return;
    
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
    
    // Generate sample data
    const currentDate = new Date();
    const sampleData = [];
    for (let i = 30; i >= 0; i--) {
      const time = new Date(currentDate);
      time.setDate(time.getDate() - i);
      
      // Generate random candle
      const basePrice = 1.10;
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
    candlestickSeries.setData(sampleData);
    
    // Save the last candle time for updates
    if (sampleData.length > 0) {
      lastCandleTimeRef.current = sampleData[sampleData.length - 1].time;
    }
    
    // Add moving average
    const maSeries = chart.addLineSeries({
      color: '#2196F3',
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
    
    // Update current price based on the latest candle
    if (sampleData.length > 0) {
      const lastCandle = sampleData[sampleData.length - 1];
      setCurrentPrice({
        bid: lastCandle.close - 0.0001,
        ask: lastCandle.close + 0.0001
      });
    }
    
    // Clean up
    return () => {
      window.removeEventListener('resize', handleResize);
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
      }
    };
  }, []);
  
  // Simulated real-time price updates
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
        setCurrentPrice({
          bid: close - 0.0001,
          ask: close + 0.0001
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
          setCurrentPrice({
            bid: close - 0.0001,
            ask: close + 0.0001
          });
          
          // Check if any pending orders should be executed
          if (orderType !== 'market') {
            checkPendingOrders({
              bid: close - 0.0001,
              ask: close + 0.0001
            });
          }
        }
      }
    };
    
    // Update every second
    const intervalId = setInterval(updateCandles, 1000);
    
    return () => clearInterval(intervalId);
  }, [currentPrice]);
  
  // Function to check and execute pending orders based on price changes
  const checkPendingOrders = (price) => {
    if (!openOrders.length) return;
    
    // Copy the current orders to avoid modifying during iteration
    const orders = [...openOrders];
    
    // Check each order
    orders.forEach(order => {
      // For limit buy orders: execute if price falls below limit price
      if (order.type === 'limit' && order.direction === 'buy' && price.ask <= order.limitPrice) {
        executeMarketOrder({...order, limitReached: true});
      }
      // For limit sell orders: execute if price rises above limit price
      else if (order.type === 'limit' && order.direction === 'sell' && price.bid >= order.limitPrice) {
        executeMarketOrder({...order, limitReached: true});
      }
      // For stop-limit orders
      else if (order.type === 'stop-limit') {
        // Buy stop-limit: trigger limit order if price rises above stop price
        if (order.direction === 'buy' && price.ask >= order.stopPrice) {
          // Convert to a limit order
          setOpenOrders(prev => prev.map(o => 
            o.id === order.id ? {...o, type: 'limit', stopTriggered: true} : o
          ));
        } 
        // Sell stop-limit: trigger limit order if price falls below stop price
        else if (order.direction === 'sell' && price.bid <= order.stopPrice) {
          // Convert to a limit order
          setOpenOrders(prev => prev.map(o => 
            o.id === order.id ? {...o, type: 'limit', stopTriggered: true} : o
          ));
        }
      }
    });
  };

  return (
    <Box sx={{ display: 'flex', bgcolor: colors.darkBg, height: '100vh', overflow: 'hidden' }}>
      <Sidebar activePage="Trading" />
      <Box sx={{ flexGrow: 1, ml: '250px', overflow: 'auto', height: '100vh', p: 3 }}>
        {/* Header */}
        <Typography variant="h4" sx={{ color: colors.primaryText, mb: 3 }}>
          Short Term Trading
        </Typography>
        
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
                overflow: 'hidden'
              }}
              ref={chartContainerRef}
            />
            
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
                    >
                      BUY
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
                    >
                      SELL
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
              <Typography variant="h4" sx={{ color: colors.accentBlue, fontWeight: 'bold' }}>
                ${balance.toFixed(2)}
              </Typography>
            </Paper>
            
            {/* Open Orders */}
            <Paper sx={{ bgcolor: colors.cardBg, p: 2, mb: 3, border: `1px solid ${colors.borderColor}`, borderRadius: 2 }}>
              <Typography variant="h6" sx={{ color: colors.primaryText, mb: 2 }}>
                Open Orders
              </Typography>
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
                        <TableCell sx={{ color: colors.secondaryText }}>Action</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {openOrders.map((order) => (
                        <TableRow key={order.id}>
                          <TableCell sx={{ color: colors.primaryText }}>
                            {order.pair}
                          </TableCell>
                          <TableCell sx={{ color: colors.primaryText }}>
                            {order.type}
                          </TableCell>
                          <TableCell>
                            <Chip 
                              label={order.direction.toUpperCase()} 
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
                          <TableCell>
                            <IconButton 
                              size="small" 
                              onClick={() => cancelOrder(order.id)}
                              sx={{ color: colors.secondaryText }}
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
                value={tabValue === 3 ? 0 : tabValue === 4 ? 1 : 0} 
                onChange={(e, val) => setTabValue(val === 0 ? 3 : 4)}
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
                  <Typography variant="subtitle1" sx={{ color: colors.primaryText, mb: 1 }}>
                    Order History
                  </Typography>
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
                            <TableRow key={order.id}>
                              <TableCell sx={{ color: colors.primaryText }}>
                                {new Date(order.timestamp).toLocaleString()}
                              </TableCell>
                              <TableCell sx={{ color: colors.primaryText }}>
                                {order.pair}
                              </TableCell>
                              <TableCell sx={{ color: colors.primaryText }}>
                                {order.type}
                              </TableCell>
                              <TableCell>
                                <Chip 
                                  label={order.status} 
                                  size="small"
                                  sx={{ 
                                    bgcolor: 
                                      order.status === 'executed' ? 'rgba(0, 230, 118, 0.2)' : 
                                      order.status === 'cancelled' ? 'rgba(255, 61, 87, 0.2)' :
                                      'rgba(33, 150, 243, 0.2)',
                                    color: 
                                      order.status === 'executed' ? colors.buyGreen : 
                                      order.status === 'cancelled' ? colors.sellRed :
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
                  <Typography variant="subtitle1" sx={{ color: colors.primaryText, mb: 1 }}>
                    Trade History
                  </Typography>
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
                            <TableRow key={trade.id}>
                              <TableCell sx={{ color: colors.primaryText }}>
                                {new Date(trade.timestamp).toLocaleString()}
                              </TableCell>
                              <TableCell sx={{ color: colors.primaryText }}>
                                {trade.pair}
                              </TableCell>
                              <TableCell>
                                <Chip 
                                  label={trade.direction.toUpperCase()} 
                                  size="small"
                                  sx={{ 
                                    bgcolor: trade.direction === 'buy' ? 'rgba(0, 230, 118, 0.2)' : 'rgba(255, 61, 87, 0.2)',
                                    color: trade.direction === 'buy' ? colors.buyGreen : colors.sellRed
                                  }}
                                />
                              </TableCell>
                              <TableCell sx={{ color: colors.primaryText }}>
                                {trade.price ? trade.price.toFixed(5) : 'N/A'}
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
      </Box>
    </Box>
  );
};

export default ShortTermTrading; 