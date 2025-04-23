import React, { useState, useEffect, useRef } from 'react';
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
  ButtonGroup
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

// Binance-inspired color palette
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
  const [balance, setBalance] = useState(10000);
  const [tabValue, setTabValue] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [orderForm, setOrderForm] = useState({
    price: currencyBasePrices['EUR/USD'] || 1.0850,
    amount: 0.1,
    total: (currencyBasePrices['EUR/USD'] || 1.0850) * 0.1,
    stopPrice: '',
    limitPrice: ''
  });
  
  // Popular forex pairs
  const forexPairs = [
    { symbol: 'EUR/USD', price: 1.0850, change: 0.12 },
    { symbol: 'GBP/USD', price: 1.2650, change: -0.25 },
    { symbol: 'USD/JPY', price: 145.80, change: 0.33 },
    { symbol: 'AUD/USD', price: 0.6750, change: -0.48 },
    { symbol: 'USD/CAD', price: 1.3570, change: 0.10 },
    { symbol: 'NZD/USD', price: 0.6150, change: -0.15 },
    { symbol: 'USD/CHF', price: 0.8950, change: 0.05 }
  ];
  
  // Available timeframes for chart
  const timeframes = ['1m', '5m', '15m', '1h', '4h', '1d', '1w'];

  // Initialize chart
  useEffect(() => {
    if (chartContainerRef.current && !chartRef.current) {
      const container = chartContainerRef.current;
      
      // Ensure container has dimensions
      container.style.width = '100%';
      container.style.height = '100%';
      
      // Create chart with Binance-like appearance
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
        },
        rightPriceScale: {
          borderColor: colors.borderColor,
        },
      });
      
      // Add candlestick series
      candleSeriesRef.current = chart.addCandlestickSeries({
        upColor: colors.buyGreen,
        downColor: colors.sellRed,
        borderVisible: false,
        wickUpColor: colors.buyGreen,
        wickDownColor: colors.sellRed,
      });
      
      // Generate and set initial data
      const data = generateCandlestickData(100);
      candleSeriesRef.current.setData(data);
      
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
      setIsLoading(false);
      
      // Set current price
      if (data.length > 0) {
        setPrice(data[data.length - 1].close);
        setOrderForm(prev => ({
          ...prev,
          price: data[data.length - 1].close,
          total: data[data.length - 1].close * prev.amount
        }));
      }
      
      // Set up price updates for live chart effect
      const priceUpdateInterval = setInterval(() => {
        if (!candleSeriesRef.current) return;
        
        // Get the last candle data
        const lastCandle = data[data.length - 1];
        
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
        
        // Create a new candle for the latest data point
        const currentTime = Math.floor(Date.now() / 1000);
        const newCandle = {
          time: currentTime,
          open: lastCandle.close,
          high: Math.max(lastCandle.close, newPrice),
          low: Math.min(lastCandle.close, newPrice),
          close: newPrice
        };
        
        // Update the last candle
        data[data.length - 1] = newCandle;
        
        // Add a new data point every 5 seconds for more realistic chart movement
        if (currentTime % 5 === 0) {
          data.push({
            time: currentTime + 60,
            open: newPrice,
            high: newPrice * (1 + Math.random() * 0.0005),
            low: newPrice * (1 - Math.random() * 0.0005),
            close: newPrice * (1 + (Math.random() - 0.5) * 0.001)
          });
          
          // Remove the oldest data point to keep the array size consistent
          if (data.length > 100) {
            data.shift();
          }
        }
        
        // Update the chart with the new data
        candleSeriesRef.current.update(newCandle);
        
        // Update order form price for market orders
        if (orderType === 'market') {
          setOrderForm(prev => ({
            ...prev,
            total: newPrice * prev.amount
          }));
        }
      }, 1000); // Update every second for more fluid movement
      
      return () => {
        window.removeEventListener('resize', handleResize);
        clearInterval(priceUpdateInterval);
        if (chartRef.current) {
          chartRef.current.remove();
          chartRef.current = null;
        }
      };
    }
  }, []);
  
  // Handle timeframe changes
  useEffect(() => {
    if (candleSeriesRef.current) {
      // Generate new data based on timeframe
      const data = generateCandlestickData(100, timeframe);
      candleSeriesRef.current.setData(data);
      
      // Update current price
      if (data.length > 0) {
        setPrice(data[data.length - 1].close);
      }
    }
  }, [timeframe]);
  
  // Handle symbol changes
  useEffect(() => {
    if (!candleSeriesRef.current) return;
    
    // Get base price for selected symbol
    const basePrice = currencyBasePrices[symbol] || 1.0850;
    setPrice(basePrice);
    
    // Generate new data based on the symbol's typical price range
    const data = generateCandlestickData(100, timeframe, symbol);
    candleSeriesRef.current.setData(data);
    
    // Update order form with new price
    setOrderForm(prev => ({
      ...prev,
      price: basePrice,
      total: basePrice * prev.amount
    }));
  }, [symbol]);
  
  // Generate realistic candlestick data based on currency pair
  const generateCandlestickData = (count, timeframe = '1h', pairSymbol = symbol) => {
    const data = [];
    // Get base price for the selected currency pair
    let basePrice = currencyBasePrices[pairSymbol] || 1.0850;
    
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
    if (pairSymbol.includes('JPY')) {
      volatility *= 2; // JPY pairs tend to have larger pip movements
    } else if (pairSymbol.includes('GBP')) {
      volatility *= 1.5; // GBP pairs tend to be more volatile
    }
    
    // Starting time based on timeframe
    const now = new Date();
    let time = new Date(now);
    const timeFrameInMinutes = {
      '1m': 1, '5m': 5, '15m': 15, '1h': 60, '4h': 240, '1d': 1440, '1w': 10080
    };
    
    // Subtract the appropriate amount of time to start from
    time.setMinutes(time.getMinutes() - count * timeFrameInMinutes[timeframe]);
    
    // Create a trend pattern with cycles
    const trendCycles = Math.floor(count / 20); // Cycle every ~20 candles
    let trendDirection = 1;
    
    for (let i = 0; i < count; i++) {
      // Change trend direction occasionally
      if (i % 20 === 0) {
        trendDirection = Math.random() > 0.5 ? 1 : -1;
      }
      
      // Calculate price change with trend bias
      const trendBias = trendDirection * volatility * 0.3;
      const randomChange = (Math.random() * volatility * 2) - volatility + trendBias;
      
      // Calculate prices with 4 decimal precision for most forex pairs
      const open = parseFloat(basePrice.toFixed(4));
      const close = parseFloat((basePrice * (1 + randomChange)).toFixed(4));
      let high, low;
      
      if (close > open) {
        high = parseFloat((close * (1 + Math.random() * volatility * 0.5)).toFixed(4));
        low = parseFloat((open * (1 - Math.random() * volatility * 0.5)).toFixed(4));
      } else {
        high = parseFloat((open * (1 + Math.random() * volatility * 0.5)).toFixed(4));
        low = parseFloat((close * (1 - Math.random() * volatility * 0.5)).toFixed(4));
      }
      
      // Create candle
      data.push({
        time: Math.floor(time.getTime() / 1000),
        open,
        high,
        low,
        close
      });
      
      // Update base price for next candle
      basePrice = close;
      
      // Move time forward based on timeframe
      time.setMinutes(time.getMinutes() + timeFrameInMinutes[timeframe]);
    }
    
    return data;
  };
  
  // Handler for order type tabs
  const handleOrderTabChange = (event, newValue) => {
    setTabValue(newValue);
    
    // Reset form when changing tabs
    if (newValue === 0) {
      setOrderType('limit');
    } else if (newValue === 1) {
      setOrderType('market');
    } else if (newValue === 2) {
      setOrderType('stop_limit');
    }
  };
  
  // Handle pair tab change
  const handlePairTabChange = (event, newValue) => {
    setSymbol(forexPairs[newValue].symbol);
  };
  
  // Handle order placement for forex
  const handlePlaceOrder = () => {
    // Validate inputs
    if (orderForm.amount <= 0) {
      alert("Please enter a valid amount");
      return;
    }
    
    if (orderType !== 'market' && orderForm.price <= 0) {
      alert("Please enter a valid price");
      return;
    }
    
    if (orderForm.total > balance && orderSide === 'buy') {
      alert("Insufficient balance");
      return;
    }
    
    const newOrder = {
      id: Date.now(),
      symbol: symbol,
      type: orderType,
      side: orderSide,
      price: orderType === 'market' ? price : orderForm.price,
      amount: orderForm.amount,
      total: orderForm.total,
      status: orderType === 'market' ? 'filled' : 'open',
      date: new Date().toISOString()
    };
    
    if (orderType === 'market') {
      // Execute market order immediately
      executeOrder(newOrder);
    } else {
      // Add limit/stop order to open orders
      setOpenOrders(prev => [...prev, newOrder]);
      
      // Show confirmation
      alert(`${orderSide.toUpperCase()} ${orderForm.amount} ${symbol} order placed successfully!`);
    }
    
    // Reset form
    setOrderForm({
      ...orderForm,
      amount: 0,
      total: 0
    });
  };
  
  // Execute an order (for market orders or when limit orders are triggered)
  const executeOrder = (order) => {
    // Calculate execution price (for market orders, use current price)
    const execPrice = order.type === 'market' ? price : order.price;
    
    // Process the order
    if (order.side === 'buy') {
      // Deduct funds
      const cost = order.amount * execPrice;
      if (cost > balance) {
        alert("Insufficient balance to execute order");
        return false;
      }
      
      setBalance(prev => prev - cost);
      
      // Add to order history
      const filledOrder = {
        ...order,
        status: 'filled',
        filledPrice: execPrice,
        filledTime: new Date().toISOString()
      };
      
      setOrderHistory(prev => [filledOrder, ...prev]);
      
      // Show notification
      alert(`BUY order executed: ${order.amount} ${symbol.split('/')[0]} at ${execPrice} USDT`);
      return true;
      
    } else if (order.side === 'sell') {
      // Add funds
      const proceeds = order.amount * execPrice;
      setBalance(prev => prev + proceeds);
      
      // Add to order history
      const filledOrder = {
        ...order,
        status: 'filled',
        filledPrice: execPrice,
        filledTime: new Date().toISOString()
      };
      
      setOrderHistory(prev => [filledOrder, ...prev]);
      
      // Show notification
      alert(`SELL order executed: ${order.amount} ${symbol.split('/')[0]} at ${execPrice} USDT`);
      return true;
    }
    
    return false;
  };
  
  // Cancel an open order
  const cancelOrder = (orderId) => {
    setOpenOrders(prev => prev.filter(order => order.id !== orderId));
    
    // Add to order history with canceled status
    const canceledOrder = openOrders.find(order => order.id === orderId);
    if (canceledOrder) {
      setOrderHistory(prev => [{
        ...canceledOrder,
        status: 'canceled',
        cancelTime: new Date().toISOString()
      }, ...prev]);
      
      alert(`Order canceled successfully`);
    }
  };
  
  // Check if limit orders should be triggered
  useEffect(() => {
    if (openOrders.length === 0 || !price) return;
    
    // Check each open order
    const ordersToProcess = [...openOrders];
    const triggeredOrders = [];
    
    ordersToProcess.forEach(order => {
      if (order.type === 'limit') {
        // For limit buy, trigger if price falls below order price
        if (order.side === 'buy' && price <= order.price) {
          const success = executeOrder(order);
          if (success) triggeredOrders.push(order.id);
        }
        // For limit sell, trigger if price rises above order price
        else if (order.side === 'sell' && price >= order.price) {
          const success = executeOrder(order);
          if (success) triggeredOrders.push(order.id);
        }
      }
      else if (order.type === 'stop_limit') {
        // Implementation for stop-limit orders would go here
        // For simplicity, we're not implementing the full logic
      }
    });
    
    // Remove triggered orders from open orders
    if (triggeredOrders.length > 0) {
      setOpenOrders(prev => prev.filter(order => !triggeredOrders.includes(order.id)));
    }
  }, [price]);
  
  // Handler for amount percentage buttons
  const handleAmountPercentage = (percent) => {
    if (orderSide === 'buy') {
      // Calculate amount based on available balance
      const maxTotal = balance * (percent / 100);
      const newAmount = orderForm.price > 0 ? maxTotal / orderForm.price : 0;
      
      setOrderForm({
        ...orderForm,
        amount: newAmount,
        total: maxTotal
      });
    } else {
      // For sell orders, this would use available token balance
      // For the demo, we'll just use a simulated balance of 1 BTC
      const availableTokens = 1;
      const newAmount = availableTokens * (percent / 100);
      
      setOrderForm({
        ...orderForm,
        amount: newAmount,
        total: newAmount * orderForm.price
      });
    }
  };
  
  // Add the missing handler functions
  const handlePriceChange = (e) => {
    const newPrice = parseFloat(e.target.value) || 0;
    setOrderForm({
      ...orderForm,
      price: newPrice,
      total: newPrice * orderForm.amount
    });
  };

  const handleAmountChange = (e) => {
    const newAmount = parseFloat(e.target.value) || 0;
    const currentPrice = orderType === 'market' ? price : orderForm.price;
    setOrderForm({
      ...orderForm,
      amount: newAmount,
      total: newAmount * currentPrice
    });
  };

  const handleTotalChange = (e) => {
    const newTotal = parseFloat(e.target.value) || 0;
    const currentPrice = orderType === 'market' ? price : orderForm.price;
    setOrderForm({
      ...orderForm,
      total: newTotal,
      amount: currentPrice > 0 ? newTotal / currentPrice : 0
    });
  };
  
  // Update the JSX for percentage buttons to use the handler
  const percentageButtonsJsx = (
    <Box sx={{ display: 'flex', gap: 0.5, mt: 1 }}>
      {[25, 50, 75, 100].map((percent) => (
        <Button
          key={percent}
          size="small"
          variant="outlined"
          sx={{
            flexGrow: 1,
            color: colors.secondaryText,
            borderColor: colors.borderColor,
            '&:hover': { borderColor: colors.accentYellow, bgcolor: 'transparent' }
          }}
          onClick={() => handleAmountPercentage(percent)}
        >
          {percent}%
        </Button>
      ))}
    </Box>
  );
  
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
  
  // Render order history for forex
  const renderOrderHistory = () => {
    if (orderHistory.length === 0) {
      return (
        <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', height: '200px' }}>
          <Typography sx={{ color: colors.secondaryText }}>No order history</Typography>
        </Box>
      );
    }
    
    return (
      <TableContainer component={Box} sx={{ maxHeight: 200, overflow: 'auto' }}>
        <Table size="small" sx={{ '& td, & th': { borderColor: 'transparent', py: 0.5 } }}>
          <TableHead>
            <TableRow sx={{ '& th': { color: colors.secondaryText, fontWeight: 500 } }}>
              <TableCell>Date</TableCell>
              <TableCell>Pair</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Side</TableCell>
              <TableCell align="right">Price</TableCell>
              <TableCell align="right">Amount</TableCell>
              <TableCell>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {orderHistory.map((order) => (
              <TableRow key={order.id}>
                <TableCell sx={{ color: colors.secondaryText }}>
                  {new Date(order.date).toLocaleTimeString()}
                </TableCell>
                <TableCell sx={{ color: colors.primaryText }}>{order.symbol}</TableCell>
                <TableCell sx={{ color: colors.secondaryText }}>{order.type}</TableCell>
                <TableCell sx={{ 
                  color: order.side === 'buy' ? colors.buyGreen : colors.sellRed 
                }}>
                  {order.side.toUpperCase()}
                </TableCell>
                <TableCell align="right" sx={{ color: colors.primaryText }}>
                  {formatPrice(order.price)}
                </TableCell>
                <TableCell align="right" sx={{ color: colors.primaryText }}>
                  {order.amount.toFixed(2)}
                </TableCell>
                <TableCell>
                  <Chip 
                    size="small" 
                    label={order.status}
                    sx={{ 
                      bgcolor: order.status === 'filled' 
                        ? 'rgba(14, 203, 129, 0.2)' 
                        : 'rgba(240, 185, 11, 0.2)',
                      color: order.status === 'filled' 
                        ? colors.buyGreen 
                        : colors.accentYellow,
                      height: 20,
                      fontSize: 10
                    }} 
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    );
  };
  
  // Render open orders for forex
  const renderOpenOrders = () => {
    if (openOrders.length === 0) {
      return (
        <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', height: '200px' }}>
          <Typography sx={{ color: colors.secondaryText }}>No open orders</Typography>
        </Box>
      );
    }
    
    return (
      <TableContainer component={Box} sx={{ maxHeight: 200, overflow: 'auto' }}>
        <Table size="small" sx={{ '& td, & th': { borderColor: 'transparent', py: 0.5 } }}>
          <TableHead>
            <TableRow sx={{ '& th': { color: colors.secondaryText, fontWeight: 500 } }}>
              <TableCell>Date</TableCell>
              <TableCell>Pair</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Side</TableCell>
              <TableCell align="right">Price</TableCell>
              <TableCell align="right">Amount</TableCell>
              <TableCell>Action</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {openOrders.map((order) => (
              <TableRow key={order.id}>
                <TableCell sx={{ color: colors.secondaryText }}>
                  {new Date(order.date).toLocaleTimeString()}
                </TableCell>
                <TableCell sx={{ color: colors.primaryText }}>{order.symbol}</TableCell>
                <TableCell sx={{ color: colors.secondaryText }}>{order.type}</TableCell>
                <TableCell sx={{ 
                  color: order.side === 'buy' ? colors.buyGreen : colors.sellRed 
                }}>
                  {order.side.toUpperCase()}
                </TableCell>
                <TableCell align="right" sx={{ color: colors.primaryText }}>
                  {formatPrice(order.price)}
                </TableCell>
                <TableCell align="right" sx={{ color: colors.primaryText }}>
                  {order.amount.toFixed(2)}
                </TableCell>
                <TableCell>
                  <IconButton 
                    size="small" 
                    onClick={() => cancelOrder(order.id)}
                    sx={{ color: colors.sellRed }}
                  >
                    <CloseIcon fontSize="small" />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
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
          <Grid item xs={2} sx={{ borderRight: `1px solid ${colors.borderColor}`, height: '100%', overflow: 'auto' }}>
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
          <Grid item xs={7} sx={{ borderRight: `1px solid ${colors.borderColor}`, height: '100%', display: 'flex', flexDirection: 'column' }}>
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
                  {balance.toFixed(2)} USDT
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