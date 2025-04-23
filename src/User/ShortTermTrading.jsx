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
  Tooltip,
  Alert,
  Snackbar
} from '@mui/material';
import Sidebar from './Sidebar';
import { API } from '../axiosConfig';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import RefreshIcon from '@mui/icons-material/Refresh';
import DeleteIcon from '@mui/icons-material/Delete';
import HistoryIcon from '@mui/icons-material/History';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import StarIcon from '@mui/icons-material/Star';
import StarBorderIcon from '@mui/icons-material/StarBorder';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
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
  const [selectedPair, setSelectedPair] = useState('EURUSD=X');
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
  const [dataLoading, setDataLoading] = useState(true);
  const [balance, setBalance] = useState(10000);
  const [currentPrice, setCurrentPrice] = useState({ bid: 0, ask: 0 });
  const [marketData, setMarketData] = useState(null);
  const [priceHistory, setPriceHistory] = useState([]);
  const [supportLevels, setSupportLevels] = useState([]);
  const [resistanceLevels, setResistanceLevels] = useState([]);
  const [technicalIndicators, setTechnicalIndicators] = useState(null);
  const [user, setUser] = useState(null);
  const [error, setError] = useState(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'info'
  });
  const [isFavorite, setIsFavorite] = useState(false);
  
  // New state variables for enhanced position management
  const [positions, setPositions] = useState([]);
  const [totalPnL, setTotalPnL] = useState(0);
  const [unrealizedPnL, setUnrealizedPnL] = useState(0);
  const [sessionId, setSessionId] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [leverage, setLeverage] = useState(1);
  const [stopLossPrice, setStopLossPrice] = useState(0);
  const [takeProfitPrice, setTakeProfitPrice] = useState(0);
  const [riskPerTrade, setRiskPerTrade] = useState(2); // Default risk: 2% per trade

  // Available currency pairs
  const currencyPairs = [
    { value: 'EURUSD=X', label: 'EUR/USD' },
    { value: 'GBPUSD=X', label: 'GBP/USD' },
    { value: 'USDJPY=X', label: 'USD/JPY' },
    { value: 'AUDUSD=X', label: 'AUD/USD' },
    { value: 'USDCAD=X', label: 'USD/CAD' },
    { value: 'NZDUSD=X', label: 'NZD/USD' },
    { value: 'USDCHF=X', label: 'USD/CHF' }
  ];

  // Fetch user data
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await API.auth.me();
        setUser(response.data.user);
        if (response.data.user && response.data.user.balance) {
          setBalance(response.data.user.balance);
        }
        
        // Initialize or retrieve trading session after getting user data
        if (response.data.user) {
          initializeSession(response.data.user.user_id);
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
        showSnackbar('Failed to fetch user data', 'error');
      }
    };
    
    fetchUserData();
  }, []);

  // Initialize or retrieve active trading session
  const initializeSession = async (userId) => {
    try {
      // Try to get existing active session
      const response = await API.trading.getActiveSession();
      
      if (response.data && response.data.session) {
        // Use existing session
        const activeSession = response.data.session;
        setSessionId(activeSession.session_id);
        
        // Load existing orders and positions
        if (activeSession.session_id) {
          await loadSessionData(activeSession.session_id);
        }
        
        showSnackbar('Resumed existing trading session', 'info');
      } else {
        // Create new session
        const newSessionResponse = await API.trading.createSession({
          user_id: userId,
          trading_type: 'short-term',
          simulation_amount: balance
        });
        
        if (newSessionResponse.data && newSessionResponse.data.session_id) {
          setSessionId(newSessionResponse.data.session_id);
          showSnackbar('New trading session started', 'success');
        }
      }
    } catch (error) {
      console.error('Error initializing session:', error);
      
      // Fallback to local session if API call fails
      setSessionId(`local-${Date.now()}`);
      showSnackbar('Using local session mode', 'warning');
    }
  };
  
  // Load data for existing session
  const loadSessionData = async (sessionId) => {
    try {
      // Load open orders
      const ordersResponse = await API.trading.getOpenOrders(sessionId);
      if (ordersResponse.data && ordersResponse.data.orders) {
        setOpenOrders(ordersResponse.data.orders);
      }
      
      // Load positions
      const positionsResponse = await API.trading.getPositions(sessionId);
      if (positionsResponse.data && positionsResponse.data.positions) {
        setPositions(positionsResponse.data.positions);
      }
      
      // Load order history
      const historyResponse = await API.trading.getOrderHistory(sessionId);
      if (historyResponse.data && historyResponse.data.history) {
        setOrderHistory(historyResponse.data.history);
      }
      
      // Load trade history
      const tradesResponse = await API.trading.getTradeHistory(sessionId);
      if (tradesResponse.data && tradesResponse.data.trades) {
        setTradeHistory(tradesResponse.data.trades);
      }
    } catch (error) {
      console.error('Error loading session data:', error);
      showSnackbar('Failed to load previous trading data', 'error');
    }
  };

  // Check if the current pair is favorited
  useEffect(() => {
    const checkIfFavorite = async () => {
      if (!user) return;
      
      try {
        const response = await API.favorites.check(selectedPair);
        setIsFavorite(response.data.isFavorite);
      } catch (error) {
        console.error('Error checking favorite status:', error);
      }
    };
    
    checkIfFavorite();
  }, [selectedPair, user]);

  // Show snackbar notifications
  const showSnackbar = (message, severity = 'info') => {
    setSnackbar({
      open: true,
      message,
      severity
    });
  };

  // Handle snackbar close
  const handleSnackbarClose = () => {
    setSnackbar({...snackbar, open: false});
  };

  // Toggle favorite status
  const toggleFavorite = async () => {
    if (!user) return;
    
    try {
      const pairName = currencyPairs.find(pair => pair.value === selectedPair)?.label || selectedPair;
      
      const response = await API.favorites.toggle({
        symbol: selectedPair,
        pair_name: pairName
      });
      
      setIsFavorite(response.data.isFavorite);
      showSnackbar(response.data.message);
    } catch (error) {
      console.error('Error toggling favorite status:', error);
      showSnackbar('Failed to update favorites', 'error');
    }
  };

  // Fetch market data for selected pair
  useEffect(() => {
    const fetchMarketData = async () => {
      setDataLoading(true);
      setError(null);
      
      try {
        // Fetch market analysis data
        const response = await API.market.analyze({ symbol: selectedPair });
        setMarketData(response.data);
        
        // Update current price
        if (response.data && response.data.current_price) {
          const price = parseFloat(response.data.current_price);
          const spread = 0.0002; // 2 pips spread
          
          setCurrentPrice({
            bid: price - spread / 2,
            ask: price + spread / 2
          });
        }
        
        // Extract support and resistance levels
        if (response.data && response.data.support_resistance) {
          setSupportLevels(response.data.support_resistance.support || []);
          setResistanceLevels(response.data.support_resistance.resistance || []);
        }
        
        // Extract technical indicators
        if (response.data && response.data.technical_indicators) {
          setTechnicalIndicators(response.data.technical_indicators);
        }
        
        // Fetch price history
        const historyResponse = await API.market.getHistory(selectedPair);
        
        if (historyResponse.data && historyResponse.data.history) {
          setPriceHistory(historyResponse.data.history);
        }
      } catch (error) {
        console.error('Error fetching market data:', error);
        setError('Failed to load market data. Please try again later.');
      } finally {
        setDataLoading(false);
      }
    };
    
    fetchMarketData();
  }, [selectedPair]);

  // Handle tab changes
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

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
          // Create a small price change based on market trend
          const trend = marketData && marketData.trend === 'Bullish' ? 0.2 : -0.2;
          const priceMove = (Math.random() - 0.5 + trend * 0.1) * 0.0002;
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
            checkAndExecutePendingOrders({
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
  }, [currentPrice, marketData]);
  
  // Function to check and execute pending orders based on price changes
  const checkAndExecutePendingOrders = (price) => {
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
          showSnackbar(`Stop triggered for ${order.pair} buy order at ${order.stopPrice}`, 'info');
        } 
        // Sell stop-limit: trigger limit order if price falls below stop price
        else if (order.direction === 'sell' && price.bid <= order.stopPrice) {
          // Convert to a limit order
          setOpenOrders(prev => prev.map(o => 
            o.id === order.id ? {...o, type: 'limit', stopTriggered: true} : o
          ));
          showSnackbar(`Stop triggered for ${order.pair} sell order at ${order.stopPrice}`, 'info');
        }
      }
    });
  };
  
  // Basic placeholder function to simulate placing an order
  const placeOrder = async (direction) => {
    // Validate order parameters
    if (amount <= 0) {
      showSnackbar('Please enter a valid amount', 'error');
      return;
    }
    
    if (orderType === 'limit' && !limitPrice) {
      showSnackbar('Please enter a limit price', 'error');
      return;
    }
    
    if (orderType === 'stop-limit' && (!stopPrice || !limitPrice)) {
      showSnackbar('Please enter both stop and limit prices', 'error');
      return;
    }
    
    // Check if user has enough balance for the order
    const totalAmount = amount * leverage;
    const marginRequired = totalAmount / leverage;
    
    if (marginRequired > balance) {
      showSnackbar('Insufficient balance for this order', 'error');
      return;
    }
    
    // Set loading state
    setLoading(true);
    
    try {
      const now = new Date();
      const id = `order-${Date.now()}`;
      const pairLabel = currencyPairs.find(p => p.value === selectedPair)?.label || selectedPair;
      
      let newOrder = {
        id,
        pair: selectedPair,
        pairLabel,
        type: orderType,
        direction,
        amount,
        quantity,
        leverage,
        status: 'open',
        createdAt: now.toISOString(),
        sessionId
      };
      
      if (orderType === 'limit') {
        newOrder.limitPrice = limitPrice;
      } else if (orderType === 'stop-limit') {
        newOrder.stopPrice = stopPrice;
        newOrder.limitPrice = limitPrice;
      }
      
      // Add stop loss and take profit if set
      if (stopLossPrice > 0) {
        newOrder.stopLoss = stopLossPrice;
      }
      
      if (takeProfitPrice > 0) {
        newOrder.takeProfit = takeProfitPrice;
      }
      
      // Save order to database if session exists
      if (sessionId && !sessionId.startsWith('local-')) {
        try {
          const response = await API.trading.createOrder({
            session_id: sessionId,
            symbol: selectedPair,
            order_type: orderType,
            direction,
            amount,
            price: orderType === 'market' ? null : 
                  orderType === 'limit' ? limitPrice : null,
            stop_price: orderType === 'stop-limit' ? stopPrice : null,
            limit_price: (orderType === 'limit' || orderType === 'stop-limit') ? limitPrice : null,
            leverage,
            stop_loss: stopLossPrice > 0 ? stopLossPrice : null,
            take_profit: takeProfitPrice > 0 ? takeProfitPrice : null,
            quantity
          });
          
          if (response.data && response.data.order_id) {
            newOrder.id = response.data.order_id;
          }
        } catch (error) {
          console.error('Error saving order to database:', error);
          // Continue with local order even if DB save fails
        }
      }
      
      setOpenOrders([...openOrders, newOrder]);
      
      // Add to order history
      const historyEntry = {
        id,
        pair: selectedPair,
        pairLabel,
        type: orderType,
        direction,
        amount,
        quantity,
        leverage,
        status: 'placed',
        timestamp: now.toISOString()
      };
      
      setOrderHistory([historyEntry, ...orderHistory]);
      
      showSnackbar(`${direction.toUpperCase()} order placed for ${pairLabel}`, 'success');
      
      // If it's a market order, execute immediately
      if (orderType === 'market') {
        await executeMarketOrder(newOrder);
      }
    } catch (error) {
      console.error('Error placing order:', error);
      showSnackbar('Failed to place order', 'error');
    } finally {
      setLoading(false);
    }
  };
  
  // Simulated market order execution
  const executeMarketOrder = async (order) => {
    const executionPrice = order.direction === 'buy' ? currentPrice.ask : currentPrice.bid;
    const now = new Date();
    
    try {
      // Update order status
      setOpenOrders(openOrders.filter(o => o.id !== order.id));
      
      // Determine if this creates a new position or closes an existing one
      const existingPosition = positions.find(p => 
        p.pair === order.pair && p.direction === order.direction
      );
      
      let positionId = null;
      let isClosingPosition = false;
      let profitLoss = 0;
      
      if (existingPosition) {
        // Add to existing position
        positionId = existingPosition.id;
        
        // Update the existing position
        const updatedPositions = positions.map(p => {
          if (p.id === positionId) {
            const newQuantity = p.quantity + order.quantity;
            const newAmount = p.amount + order.amount;
            // Calculate average entry price
            const newEntryPrice = (p.entryPrice * p.amount + executionPrice * order.amount) / newAmount;
            
            return {
              ...p,
              quantity: newQuantity,
              amount: newAmount,
              entryPrice: newEntryPrice,
              updatedAt: now.toISOString()
            };
          }
          return p;
        });
        
        setPositions(updatedPositions);
      } else {
        // Check for a position in the opposite direction to close
        const oppositePosition = positions.find(p => 
          p.pair === order.pair && p.direction !== order.direction
        );
        
        if (oppositePosition && oppositePosition.quantity <= order.quantity) {
          // Close the opposite position completely
          isClosingPosition = true;
          positionId = oppositePosition.id;
          
          // Calculate profit/loss
          const priceDiff = oppositePosition.direction === 'buy' ? 
            executionPrice - oppositePosition.entryPrice : 
            oppositePosition.entryPrice - executionPrice;
          
          profitLoss = priceDiff * oppositePosition.quantity * oppositePosition.leverage;
          
          // Update total P&L
          setTotalPnL(prev => prev + profitLoss);
          
          // Remove the closed position
          setPositions(positions.filter(p => p.id !== positionId));
        } else if (oppositePosition) {
          // Partially close the opposite position
          isClosingPosition = true;
          positionId = oppositePosition.id;
          
          // Calculate profit/loss for the closed portion
          const priceDiff = oppositePosition.direction === 'buy' ? 
            executionPrice - oppositePosition.entryPrice : 
            oppositePosition.entryPrice - executionPrice;
          
          profitLoss = priceDiff * order.quantity * oppositePosition.leverage;
          
          // Update total P&L
          setTotalPnL(prev => prev + profitLoss);
          
          // Update the position with reduced quantity
          const updatedPositions = positions.map(p => {
            if (p.id === positionId) {
              const newQuantity = p.quantity - order.quantity;
              return {
                ...p,
                quantity: newQuantity,
                amount: p.amount * (newQuantity / p.quantity),
                updatedAt: now.toISOString()
              };
            }
            return p;
          });
          
          setPositions(updatedPositions);
        } else {
          // Create new position
          const newPosition = {
            id: `position-${Date.now()}`,
            pair: order.pair,
            pairLabel: order.pairLabel,
            direction: order.direction,
            quantity: order.quantity,
            amount: order.amount,
            leverage: order.leverage,
            entryPrice: executionPrice,
            stopLoss: order.stopLoss,
            takeProfit: order.takeProfit,
            openedAt: now.toISOString(),
            updatedAt: now.toISOString()
          };
          
          positionId = newPosition.id;
          setPositions([...positions, newPosition]);
          
          // Save position to database if session exists
          if (sessionId && !sessionId.startsWith('local-')) {
            try {
              await API.trading.createPosition({
                session_id: sessionId,
                symbol: order.pair,
                direction: order.direction,
                open_price: executionPrice,
                amount: order.amount,
                quantity: order.quantity,
                leverage: order.leverage,
                take_profit: order.takeProfit,
                stop_loss: order.stopLoss
              });
            } catch (error) {
              console.error('Error saving position to database:', error);
            }
          }
        }
      }
      
      // Add to trade history
      const newTrade = {
        id: `trade-${Date.now()}`,
        orderId: order.id,
        positionId: positionId,
        pair: order.pair,
        pairLabel: order.pairLabel || currencyPairs.find(p => p.value === order.pair)?.label || order.pair,
        direction: order.direction,
        amount: order.amount,
        quantity: order.quantity,
        price: executionPrice,
        leverage: order.leverage,
        timestamp: now.toISOString(),
        isClosing: isClosingPosition,
        profitLoss: isClosingPosition ? profitLoss : 0
      };
      
      setTradeHistory([newTrade, ...tradeHistory]);
      
      // Save trade to database if session exists
      if (sessionId && !sessionId.startsWith('local-')) {
        try {
          await API.trading.recordTrade({
            session_id: sessionId,
            position_id: positionId,
            order_id: order.id,
            symbol: order.pair,
            direction: order.direction,
            order_type: order.type,
            open_price: executionPrice,
            amount: order.amount,
            leverage: order.leverage,
            profit_loss: isClosingPosition ? profitLoss : 0
          });
        } catch (error) {
          console.error('Error saving trade to database:', error);
        }
      }
      
      // Update order history
      setOrderHistory(orderHistory.map(o => {
        if (o.id === order.id) {
          return { 
            ...o, 
            status: 'executed', 
            executedAt: now.toISOString(), 
            executionPrice,
            positionId
          };
        }
        return o;
      }));
      
      // Update balance based on margin requirement and P&L
      if (isClosingPosition) {
        // When closing, add the margin back plus any profit (or minus any loss)
        setBalance(prev => parseFloat((prev + order.amount / order.leverage + profitLoss).toFixed(2)));
      } else {
        // When opening, subtract the required margin
        setBalance(prev => parseFloat((prev - order.amount / order.leverage).toFixed(2)));
      }
      
      // Show notification
      const orderTypeText = order.limitReached ? 'Limit' : (order.stopTriggered ? 'Stop' : 'Market');
      showSnackbar(
        `${orderTypeText} ${order.direction.toUpperCase()} order executed at ${executionPrice.toFixed(5)}` + 
        (isClosingPosition ? ` (P&L: $${profitLoss.toFixed(2)})` : ''), 
        'success'
      );
      
      // Update balance in database if session exists
      if (sessionId && !sessionId.startsWith('local-')) {
        try {
          await API.trading.updateBalance({
            session_id: sessionId,
            balance: balance,
            profit_loss: isClosingPosition ? profitLoss : 0
          });
        } catch (error) {
          console.error('Error updating balance in database:', error);
        }
      }
    } catch (error) {
      console.error('Error executing order:', error);
      showSnackbar('Failed to execute order', 'error');
    }
  };
  
  // Cancel an open order
  const cancelOrder = (orderId) => {
    // Find the order to get details for the history update
    const orderToCancel = openOrders.find(o => o.id === orderId);
    
    if (!orderToCancel) return;
    
    // Remove from open orders
    setOpenOrders(openOrders.filter(o => o.id !== orderId));
    
    // Update order history
    setOrderHistory(orderHistory.map(o => {
      if (o.id === orderId) {
        return { 
          ...o, 
          status: 'cancelled', 
          cancelledAt: new Date().toISOString() 
        };
      }
      return o;
    }));
    
    showSnackbar(`Order for ${orderToCancel.pairLabel || orderToCancel.pair} cancelled`, 'info');
  };

  // Initialize lightweight chart with real price history data
  useEffect(() => {
    if (!chartContainerRef.current || priceHistory.length === 0) return;
    
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
    
    // Format price history data for the chart
    const formattedData = priceHistory.map(item => {
      // Convert date string to timestamp
      const timestamp = new Date(item.date || item.timestamp).getTime() / 1000;
      return {
        time: timestamp,
        open: parseFloat(item.open_price || item.open),
        high: parseFloat(item.high_price || item.high),
        low: parseFloat(item.low_price || item.low),
        close: parseFloat(item.close_price || item.close),
      };
    });
    
    // Set chart data
    if (formattedData.length > 0) {
      candlestickSeries.setData(formattedData);
      
      // Save the last candle time for updates
      lastCandleTimeRef.current = formattedData[formattedData.length - 1].time;
      
      // Update current price based on the latest candle
      const lastCandle = formattedData[formattedData.length - 1];
      const spread = 0.0002; // 2 pips spread
      
      setCurrentPrice({
        bid: lastCandle.close - spread / 2,
        ask: lastCandle.close + spread / 2
      });
      
      // Update limit and stop prices based on current price
      setLimitPrice(lastCandle.close);
      setStopPrice(lastCandle.close * 0.995); // 0.5% below current price
    }
    
    // Add moving average if technical indicators are available
    if (technicalIndicators && technicalIndicators.sma20) {
      const maSeries = chart.addLineSeries({
        color: colors.accentBlue,
        lineWidth: 2,
        priceLineVisible: false,
      });
      
      // Create MA data points
      const maData = formattedData.map((candle, index) => {
        // For the last 20 points, use the SMA20 value
        if (index >= formattedData.length - 20) {
          return {
            time: candle.time,
            value: parseFloat(technicalIndicators.sma20)
          };
        }
        // For earlier points, approximate the SMA
        return {
          time: candle.time,
          value: candle.close
        };
      });
      
      maSeries.setData(maData);
    }
    
    // Add support and resistance lines if available
    if (supportLevels.length > 0 || resistanceLevels.length > 0) {
      // Add support levels
      supportLevels.slice(0, 2).forEach((level, index) => {
        const supportPrice = parseFloat(level);
        const supportSeries = chart.addLineSeries({
          color: colors.buyGreen,
          lineWidth: 1,
          lineStyle: 2, // Dashed line
          lastValueVisible: false,
          priceLineVisible: false,
        });
        
        // Create data for horizontal line
        const supportData = formattedData.map(candle => ({
          time: candle.time,
          value: supportPrice
        }));
        
        supportSeries.setData(supportData);
      });
      
      // Add resistance levels
      resistanceLevels.slice(0, 2).forEach((level, index) => {
        const resistancePrice = parseFloat(level);
        const resistanceSeries = chart.addLineSeries({
          color: colors.sellRed,
          lineWidth: 1,
          lineStyle: 2, // Dashed line
          lastValueVisible: false,
          priceLineVisible: false,
        });
        
        // Create data for horizontal line
        const resistanceData = formattedData.map(candle => ({
          time: candle.time,
          value: resistancePrice
        }));
        
        resistanceSeries.setData(resistanceData);
      });
    }
    
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
  }, [priceHistory, technicalIndicators, supportLevels, resistanceLevels]);

  useEffect(() => {
    // Create an interval that simulates real-time price updates (every second)
    const intervalId = setInterval(() => {
      if (selectedPair) {
        // Simulate market price fluctuations
        const currentPrice = getUpdatedPrice(selectedPair);
        
        // Check if we need to close any positions based on stop loss/take profit
        checkPositions(currentPrice);
        
        // Check pending orders (limit, stop, etc.)
        checkAndExecutePendingOrders(currentPrice);
        
        // Update price history for charts
        const currentTime = new Date();
        
        // Every 5 minutes, add a new candle
        if (currentTime.getMinutes() % 5 === 0 && currentTime.getSeconds() === 0) {
          setPriceHistory(prev => {
            const newCandle = {
              time: currentTime.getTime(),
              open: prev[prev.length - 1]?.close || currentPrice,
              high: currentPrice,
              low: currentPrice,
              close: currentPrice,
              volume: Math.floor(Math.random() * 1000) + 500
            };
            return [...prev.slice(-99), newCandle]; // Keep last 100 candles
          });
        } 
        // Otherwise update the current candle
        else {
          setPriceHistory(prev => {
            if (prev.length === 0) return prev;
            const lastCandle = prev[prev.length - 1];
            const updatedCandle = {
              ...lastCandle,
              close: currentPrice,
              high: Math.max(lastCandle.high, currentPrice),
              low: Math.min(lastCandle.low, currentPrice)
            };
            return [...prev.slice(0, -1), updatedCandle];
          });
        }
      }
    }, 1000);

    return () => clearInterval(intervalId);
  }, [selectedPair, positions]);
  
  // Check if positions need to be closed due to stop loss or take profit
  const checkPositions = (currentPrice) => {
    if (positions.length === 0) return;
    
    const updatedPositions = [...positions];
    let positionsChanged = false;
    
    // Calculate unrealized P&L for all positions
    let totalUnrealized = 0;
    
    positions.forEach((position, index) => {
      const marketPrice = position.direction === 'buy' ? 
        currentPrice - (currentPrice * 0.0001) : // Simulate a small spread
        currentPrice + (currentPrice * 0.0001);
      
      // Calculate unrealized P&L for this position
      const priceDiff = position.direction === 'buy' ? 
        marketPrice - position.entryPrice : 
        position.entryPrice - marketPrice;
      
      const positionPnL = priceDiff * position.quantity * position.leverage;
      totalUnrealized += positionPnL;
      
      // Update position with current P&L
      updatedPositions[index] = {
        ...position,
        currentPrice: marketPrice,
        unrealizedPnL: positionPnL
      };
      
      // Check for stop loss
      if (position.stopLoss && (
        (position.direction === 'buy' && marketPrice <= position.stopLoss) ||
        (position.direction === 'sell' && marketPrice >= position.stopLoss)
      )) {
        // Create market order to close position at stop loss
        const closeOrder = {
          id: `stop-loss-${Date.now()}`,
          pair: position.pair,
          pairLabel: position.pairLabel,
          type: 'market',
          direction: position.direction === 'buy' ? 'sell' : 'buy',
          amount: position.amount,
          quantity: position.quantity,
          leverage: position.leverage,
          status: 'open',
          createdAt: new Date().toISOString(),
          stopTriggered: true,
          isStopLoss: true,
          positionId: position.id
        };
        
        // Execute market order to close position
        executeMarketOrder(closeOrder);
        positionsChanged = true;
      }
      
      // Check for take profit
      else if (position.takeProfit && (
        (position.direction === 'buy' && marketPrice >= position.takeProfit) ||
        (position.direction === 'sell' && marketPrice <= position.takeProfit)
      )) {
        // Create market order to close position at take profit
        const closeOrder = {
          id: `take-profit-${Date.now()}`,
          pair: position.pair,
          pairLabel: position.pairLabel,
          type: 'market',
          direction: position.direction === 'buy' ? 'sell' : 'buy',
          amount: position.amount,
          quantity: position.quantity,
          leverage: position.leverage,
          status: 'open',
          createdAt: new Date().toISOString(),
          isTakeProfit: true,
          positionId: position.id
        };
        
        // Execute market order to close position
        executeMarketOrder(closeOrder);
        positionsChanged = true;
      }
    });
    
    // Update positions if any changes were made
    if (!positionsChanged) {
      setPositions(updatedPositions);
    }
    
    // Update unrealized P&L
    setUnrealizedPnL(totalUnrealized);
  };

  // Function to simulate updated price with small random fluctuations
  const getUpdatedPrice = (symbol) => {
    // Use current price as base or provide default if not set
    const basePrice = currentPrice.ask || 1.0;
    
    // Generate random price movement (small fluctuation)
    const volatilityFactor = 0.0002; // 0.02% volatility
    const randomChange = (Math.random() - 0.5) * 2 * volatilityFactor * basePrice;
    
    // Apply market sentiment bias if available from market data
    let sentimentBias = 0;
    if (marketData && marketData.trend) {
      sentimentBias = marketData.trend === 'Bullish' ? 0.00002 : -0.00002;
    }
    
    // Calculate new price
    const updatedPrice = basePrice + randomChange + sentimentBias;
    
    return updatedPrice;
  };

  return (
    <Box sx={{ display: 'flex', bgcolor: colors.darkBg, height: '100vh', overflow: 'hidden' }}>
      <Sidebar activePage="Trading" />
      <Box sx={{ flexGrow: 1, ml: '250px', overflow: 'auto', height: '100vh', p: 3 }}>
        {/* Snackbar notifications */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={handleSnackbarClose}
          anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        >
          <Alert onClose={handleSnackbarClose} severity={snackbar.severity} sx={{ width: '100%' }}>
            {snackbar.message}
          </Alert>
        </Snackbar>
        
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" sx={{ color: colors.primaryText }}>
            Short Term Trading
          </Typography>
          
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            {user && (
              <IconButton 
                onClick={toggleFavorite}
                sx={{ color: isFavorite ? colors.warningOrange : colors.secondaryText, mr: 1 }}
              >
                {isFavorite ? <StarIcon /> : <StarBorderIcon />}
              </IconButton>
            )}
            
            <FormControl variant="outlined" size="small" sx={{ width: 140, mr: 2 }}>
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
          </Box>
        </Box>
        
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        
        <Grid container spacing={3}>
          {/* Left side - Chart and Trading interface */}
          <Grid item xs={12} md={8}>
            {/* Market data summary */}
            <Paper sx={{ 
              bgcolor: colors.cardBg, 
              mb: 3, 
              p: 2,
              border: `1px solid ${colors.borderColor}`,
              borderRadius: 2
            }}>
              {dataLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 1 }}>
                  <CircularProgress size={24} sx={{ color: colors.accentBlue }} />
                </Box>
              ) : (
                <Grid container spacing={2} alignItems="center">
                  <Grid item xs={12} sm={3}>
                    <Typography variant="body2" sx={{ color: colors.secondaryText }}>
                      {currencyPairs.find(p => p.value === selectedPair)?.label || selectedPair}
                    </Typography>
                    <Typography variant="h5" sx={{ color: colors.primaryText, fontWeight: 'bold' }}>
                      {currentPrice.ask.toFixed(5)}
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={6} sm={3}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      {marketData && marketData.trend === 'Bullish' ? (
                        <TrendingUpIcon sx={{ color: colors.buyGreen, mr: 1 }} />
                      ) : (
                        <TrendingDownIcon sx={{ color: colors.sellRed, mr: 1 }} />
                      )}
                      <Typography sx={{ color: marketData && marketData.trend === 'Bullish' ? colors.buyGreen : colors.sellRed }}>
                        {marketData && marketData.trend ? marketData.trend : 'Neutral'}
                      </Typography>
                    </Box>
                    {marketData && marketData.change_percentage !== undefined && (
                      <Typography variant="body2" sx={{ 
                        color: parseFloat(marketData.change_percentage) >= 0 ? colors.buyGreen : colors.sellRed 
                      }}>
                        {parseFloat(marketData.change_percentage) >= 0 ? '+' : ''}
                        {parseFloat(marketData.change_percentage).toFixed(2)}%
                      </Typography>
                    )}
                  </Grid>
                  
                  <Grid item xs={6} sm={3}>
                    {technicalIndicators && (
                      <Box>
                        <Typography variant="body2" sx={{ color: colors.secondaryText }}>
                          RSI
                        </Typography>
                        <Typography sx={{ 
                          color: technicalIndicators.rsi > 70 ? colors.sellRed : 
                                 technicalIndicators.rsi < 30 ? colors.buyGreen : 
                                 colors.primaryText
                        }}>
                          {parseFloat(technicalIndicators.rsi).toFixed(1)}
                        </Typography>
                      </Box>
                    )}
                  </Grid>
                  
                  <Grid item xs={12} sm={3}>
                    {supportLevels.length > 0 && resistanceLevels.length > 0 && (
                      <Box>
                        <Typography variant="body2" sx={{ color: colors.secondaryText }}>
                          Support / Resistance
                        </Typography>
                        <Typography sx={{ color: colors.buyGreen }}>
                          {parseFloat(supportLevels[0]).toFixed(5)}
                        </Typography>
                        <Typography sx={{ color: colors.sellRed }}>
                          {parseFloat(resistanceLevels[0]).toFixed(5)}
                        </Typography>
                      </Box>
                    )}
                  </Grid>
                </Grid>
              )}
            </Paper>
            
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
            >
              {dataLoading && (
                <Box sx={{ 
                  position: 'absolute', 
                  top: 0, 
                  left: 0, 
                  right: 0, 
                  bottom: 0, 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  bgcolor: 'rgba(20, 22, 32, 0.7)',
                  zIndex: 10
                }}>
                  <CircularProgress sx={{ color: colors.accentBlue }} />
                </Box>
              )}
              <Box ref={chartContainerRef} sx={{ width: '100%', height: '100%' }} />
            </Paper>
            
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
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
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
                      disabled={loading}
                      sx={{ 
                        bgcolor: colors.buyGreen,
                        '&:hover': { bgcolor: 'success.dark' },
                        py: 1.5
                      }}
                    >
                      {loading ? <CircularProgress size={24} /> : 'BUY'}
                    </Button>
                  </Grid>
                  <Grid item xs={6}>
                    <Button
                      variant="contained"
                      fullWidth
                      onClick={() => placeOrder('sell')}
                      disabled={loading}
                      sx={{ 
                        bgcolor: colors.sellRed,
                        '&:hover': { bgcolor: 'error.dark' },
                        py: 1.5
                      }}
                    >
                      {loading ? <CircularProgress size={24} /> : 'SELL'}
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
            
            {/* Technical Indicators */}
            <Paper sx={{ bgcolor: colors.cardBg, p: 2, mb: 3, border: `1px solid ${colors.borderColor}`, borderRadius: 2 }}>
              <Typography variant="h6" sx={{ color: colors.primaryText, mb: 2 }}>
                Technical Indicators
              </Typography>
              
              {dataLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                  <CircularProgress size={24} sx={{ color: colors.accentBlue }} />
                </Box>
              ) : technicalIndicators ? (
                <Grid container spacing={1}>
                  <Grid item xs={6}>
                    <Paper sx={{ p: 1, bgcolor: colors.panelBg }}>
                      <Typography variant="body2" sx={{ color: colors.secondaryText }}>RSI</Typography>
                      <Typography sx={{ 
                        color: technicalIndicators.rsi > 70 ? colors.sellRed : 
                               technicalIndicators.rsi < 30 ? colors.buyGreen : 
                               colors.primaryText,
                        fontWeight: 'bold'
                      }}>
                        {parseFloat(technicalIndicators.rsi).toFixed(1)}
                      </Typography>
                      <Typography variant="caption" sx={{ 
                        color: technicalIndicators.rsi > 70 ? colors.sellRed : 
                               technicalIndicators.rsi < 30 ? colors.buyGreen : 
                               colors.secondaryText
                      }}>
                        {technicalIndicators.rsi > 70 ? 'Overbought' : 
                         technicalIndicators.rsi < 30 ? 'Oversold' : 'Neutral'}
                      </Typography>
                    </Paper>
                  </Grid>
                  
                  <Grid item xs={6}>
                    <Paper sx={{ p: 1, bgcolor: colors.panelBg }}>
                      <Typography variant="body2" sx={{ color: colors.secondaryText }}>MACD</Typography>
                      <Typography sx={{ 
                        color: technicalIndicators.macd > 0 ? colors.buyGreen : colors.sellRed,
                        fontWeight: 'bold'
                      }}>
                        {parseFloat(technicalIndicators.macd).toFixed(4)}
                      </Typography>
                      <Typography variant="caption" sx={{ 
                        color: technicalIndicators.macd_hist > 0 ? colors.buyGreen : colors.sellRed
                      }}>
                        Hist: {parseFloat(technicalIndicators.macd_hist).toFixed(4)}
                      </Typography>
                    </Paper>
                  </Grid>
                  
                  <Grid item xs={12}>
                    <Paper sx={{ p: 1, bgcolor: colors.panelBg, mt: 1 }}>
                      <Typography variant="body2" sx={{ color: colors.secondaryText }}>Moving Averages</Typography>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
                        <Typography variant="body2" sx={{ color: colors.primaryText }}>
                          SMA20: <span style={{ fontWeight: 'bold' }}>{parseFloat(technicalIndicators.sma20).toFixed(5)}</span>
                        </Typography>
                        <Typography variant="body2" sx={{ color: colors.primaryText }}>
                          SMA50: <span style={{ fontWeight: 'bold' }}>{parseFloat(technicalIndicators.sma50 || 0).toFixed(5)}</span>
                        </Typography>
                      </Box>
                    </Paper>
                  </Grid>
                </Grid>
              ) : (
                <Typography sx={{ color: colors.secondaryText, textAlign: 'center', py: 2 }}>
                  No indicator data available
                </Typography>
              )}
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
                            {order.pairLabel || order.pair}
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
                                {order.pairLabel || order.pair}
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
                                {trade.pairLabel || trade.pair}
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