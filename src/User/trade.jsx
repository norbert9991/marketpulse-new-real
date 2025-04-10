import React, { useState, useEffect, useRef } from 'react';
import { Box, Typography, Button, Paper, TextField, Select, MenuItem, FormControl, InputLabel, Tabs, Tab, Grid, Divider, IconButton, Chip, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Switch, Tooltip } from '@mui/material';
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

const Trade = () => {
  // Chart references
  const chartContainerRef = useRef(null);
  const chartRef = useRef(null);
  const candleSeriesRef = useRef(null);
  const lineSeriesRef = useRef(null);
  
  // Trading state
  const [selectedPair, setSelectedPair] = useState('EUR/USD');
  const [orderType, setOrderType] = useState('market');
  const [amount, setAmount] = useState(1000);
  const [leverage, setLeverage] = useState(10);
  const [position, setPosition] = useState(null);
  const [availableBalance, setAvailableBalance] = useState(10000);
  const [lockedMargin, setLockedMargin] = useState(0);
  const [priceData, setPriceData] = useState([]);
  const [currentPrice, setCurrentPrice] = useState(null);
  const [isBuying, setIsBuying] = useState(true);
  const [trades, setTrades] = useState([]);
  const [simulationAmount, setSimulationAmount] = useState(10000);
  const [tradingType, setTradingType] = useState('short-term');
  const [step, setStep] = useState(1); // 1: Set amount, 2: Choose type, 3: Trading interface

  // Additional state for enhanced trading features
  const [openOrders, setOpenOrders] = useState([]);
  const [selectedTimeframe, setSelectedTimeframe] = useState('1m');
  const [showIndicators, setShowIndicators] = useState(true);
  const [chartType, setChartType] = useState('candles');
  const [sessionId, setSessionId] = useState(null);
  const [activeTradingTab, setActiveTradingTab] = useState(0);
  const [pendingOrder, setPendingOrder] = useState({
    type: 'limit',
    price: null,
    amount: 1000,
    direction: 'buy',
    stopLoss: null,
    takeProfit: null
  });
  
  // Indicator series references
  const maSeriesRef = useRef(null);
  const rsiSeriesRef = useRef(null);
  const macdSeriesRef = useRef(null);
  const volumeSeriesRef = useRef(null);
  const supportLevelsRef = useRef([]);
  const resistanceLevelsRef = useRef([]);
  
  // Technical indicators state
  const [indicators, setIndicators] = useState({
    rsi: { value: 50, visible: true },
    macd: { value: 0, signal: 0, histogram: 0, visible: true },
    ma: { fast: [], slow: [], visible: true },
    volume: { data: [], visible: true },
    supportResistance: { 
      support: [1.075, 1.080], 
      resistance: [1.090, 1.095],
      visible: true 
    }
  });

  const totalBalance = availableBalance + lockedMargin;

  // Format time without date-fns
  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit',
      hour12: false 
    });
  };

  // Forex pairs to trade
  const forexPairs = [
    'EUR/USD', 'USD/JPY', 'GBP/USD', 'USD/CHF', 
    'AUD/USD', 'USD/CAD', 'NZD/USD', 'EUR/GBP'
  ];

  // Initialize chart with advanced features
  useEffect(() => {
    if (!chartContainerRef.current || step !== 3) return;

    const container = chartContainerRef.current;
    
    // Clear previous chart if exists
    if (chartRef.current) {
      chartRef.current.remove();
      chartRef.current = null;
    }

    // Ensure container has dimensions
    container.style.width = '100%';
    container.style.height = '400px';
    container.style.minHeight = '400px';

    // Create chart with TradingView-like appearance
    const chart = createChart(container, {
      width: container.clientWidth,
      height: container.clientHeight,
      layout: {
        backgroundColor: colors.cardBg,
        textColor: colors.primaryText,
        fontSize: 12,
        fontFamily: 'Roboto, sans-serif',
      },
      grid: {
        vertLines: { color: 'rgba(42, 47, 69, 0.6)', style: LineStyle.Dotted },
        horzLines: { color: 'rgba(42, 47, 69, 0.6)', style: LineStyle.Dotted },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: {
          color: colors.accentBlue,
          width: 1,
          style: LineStyle.Solid,
          labelBackgroundColor: colors.accentBlue,
        },
        horzLine: {
          color: colors.accentBlue,
          width: 1,
          style: LineStyle.Solid,
          labelBackgroundColor: colors.accentBlue,
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
      watermark: {
        color: 'rgba(33, 150, 243, 0.1)',
        visible: true,
        text: 'MarketPulse Simulation',
        fontSize: 36,
        fontFamily: 'Roboto, sans-serif',
        horzAlign: 'center',
        vertAlign: 'center',
      },
    });

    chartRef.current = chart;

    // Add main price series (candlestick or line based on user preference)
    if (chartType === 'candles') {
      candleSeriesRef.current = chart.addCandlestickSeries({
        upColor: colors.buyGreen,
        downColor: colors.sellRed,
        borderVisible: false,
        wickUpColor: colors.buyGreen,
        wickDownColor: colors.sellRed,
      });
    } else {
      lineSeriesRef.current = chart.addLineSeries({
        color: colors.accentBlue,
        lineWidth: 2,
        crosshairMarkerVisible: true,
        crosshairMarkerRadius: 4,
        crosshairMarkerBorderColor: colors.primaryText,
        crosshairMarkerBackgroundColor: colors.accentBlue,
      });
    }

    // Add volume series (in separate pane)
    if (showIndicators) {
      const volumePane = chart.addHistogramSeries({
        color: colors.accentBlue,
        priceFormat: {
          type: 'volume',
        },
        priceScaleId: 'volume',
      });
      
      chart.priceScale('volume').applyOptions({
        scaleMargins: {
          top: 0.85, // Position at the bottom of the chart
          bottom: 0,
        },
        borderVisible: false,
      });
      
      volumeSeriesRef.current = volumePane;
      
      // Add Moving Average series
      maSeriesRef.current = {
        fast: chart.addLineSeries({
          color: '#F44336',
          lineWidth: 1,
          priceLineVisible: false,
        }),
        slow: chart.addLineSeries({
          color: '#2196F3',
          lineWidth: 1,
          priceLineVisible: false,
        }),
      };
      
      // Create sub-charts for RSI and MACD
      const mainScaleOptions = {
        scaleMargins: {
          top: 0.1,
          bottom: 0.4, // Leave space for indicators
        },
      };
      
      // Get the main price scale
      chart.priceScale('right').applyOptions(mainScaleOptions);
    }

    // Handle chart interactions for TradingView-like feel
    chart.subscribeClick((param) => {
      if (!param.point || !candleSeriesRef.current) return;
      
      const price = candleSeriesRef.current.coordinateToPrice(param.point.y);
      
      // If we're placing an order, set the price
      if (activeTradingTab === 1) {
        setPendingOrder(prev => ({
          ...prev,
          price: parseFloat(price.toFixed(5))
        }));
      }
    });

    // Handle resize
    const handleResize = () => {
      chart.applyOptions({ 
        width: container.clientWidth,
        height: container.clientHeight 
      });
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
      }
    };
  }, [step, showIndicators, chartType, activeTradingTab]);

  // Simulate rapid market changes for short-term trading with realistic data
  useEffect(() => {
    if (!chartRef.current || !candleSeriesRef.current || tradingType !== 'short-term' || step !== 3) return;

    let intervalId;
    let lastClose = 1.08; // Starting price for EUR/USD
    let lastVolume = 1000;
    let trend = 0; // 0 is neutral, positive is uptrend, negative is downtrend
    let trendStrength = 0;
    let lastRsi = 50;
    let lastMacdLine = 0;
    let lastMacdSignal = 0;
    let lastMacdHistogram = 0;
    
    // Fast and slow moving averages
    const fastMAPeriod = 9;
    const slowMAPeriod = 21;
    let fastMAValues = [];
    let slowMAValues = [];
    let priceHistory = [];
    let volumeHistory = [];
    
    // Support and resistance levels (dynamically calculated)
    let supportLevels = [1.075, 1.080];
    let resistanceLevels = [1.090, 1.095];
    
    // Generate data with trends and patterns
    const generateRandomCandle = () => {
      // Update trend and strength
      if (Math.random() > 0.95) { // 5% chance to change trend direction
        trend = Math.random() > 0.5 ? 1 : -1;
        trendStrength = Math.random() * 0.6 + 0.2; // Between 0.2 and 0.8
      }
      
      // Calculate price change based on trend
      const trendBias = trend * trendStrength * 0.002;
      const volatility = 0.003 * (1 + trendStrength); // More volatility during strong trends
      const randomChange = (Math.random() - 0.5) * volatility;
      const totalChange = trendBias + randomChange;
      
      const open = lastClose;
      const close = Math.max(0.1, open + totalChange);
      
      // Create more realistic candles
      let high, low;
      if (close > open) {
        high = close + Math.random() * 0.001;
        low = open - Math.random() * 0.001;
      } else {
        high = open + Math.random() * 0.001;
        low = close - Math.random() * 0.001;
      }
      
      // Generate volume (higher during trend changes or volatility)
      const volumeChange = Math.abs(totalChange) * 20000 + Math.random() * 1000;
      const volume = Math.max(100, lastVolume + volumeChange - 500);
      
      // Update last values
      lastClose = close;
      lastVolume = volume;
      
      // Add to history arrays for indicators
      priceHistory.push(close);
      volumeHistory.push(volume);
      
      // Keep history limited
      if (priceHistory.length > 100) {
        priceHistory.shift();
        volumeHistory.shift();
      }
      
      // Calculate moving averages
      if (priceHistory.length >= fastMAPeriod) {
        const fastMA = priceHistory.slice(-fastMAPeriod).reduce((a, b) => a + b, 0) / fastMAPeriod;
        fastMAValues.push(fastMA);
        if (fastMAValues.length > 100) fastMAValues.shift();
      }
      
      if (priceHistory.length >= slowMAPeriod) {
        const slowMA = priceHistory.slice(-slowMAPeriod).reduce((a, b) => a + b, 0) / slowMAPeriod;
        slowMAValues.push(slowMA);
        if (slowMAValues.length > 100) slowMAValues.shift();
      }
      
      // Calculate RSI (simplified)
      const rsiPeriod = 14;
      let rsi = lastRsi;
      if (priceHistory.length >= rsiPeriod + 1) {
        const prices = priceHistory.slice(-rsiPeriod - 1);
        let gains = 0;
        let losses = 0;
        
        for (let i = 1; i < prices.length; i++) {
          const change = prices[i] - prices[i - 1];
          if (change >= 0) gains += change;
          else losses -= change;
        }
        
        const avgGain = gains / rsiPeriod;
        const avgLoss = losses / rsiPeriod;
        
        if (avgLoss === 0) {
          rsi = 100;
        } else {
          const rs = avgGain / avgLoss;
          rsi = 100 - (100 / (1 + rs));
        }
      }
      lastRsi = rsi;
      
      // Calculate MACD (simplified)
      const macdFast = 12;
      const macdSlow = 26;
      const macdSignal = 9;
      
      let macdLine = lastMacdLine;
      let signalLine = lastMacdSignal;
      
      if (priceHistory.length >= macdSlow) {
        const emaFast = priceHistory.slice(-macdFast).reduce((a, b) => a + b, 0) / macdFast;
        const emaSlow = priceHistory.slice(-macdSlow).reduce((a, b) => a + b, 0) / macdSlow;
        macdLine = emaFast - emaSlow;
        
        // Update signal line (EMA of MACD line)
        const alpha = 2 / (macdSignal + 1);
        signalLine = macdLine * alpha + lastMacdSignal * (1 - alpha);
      }
      
      const histogram = macdLine - signalLine;
      
      lastMacdLine = macdLine;
      lastMacdSignal = signalLine;
      lastMacdHistogram = histogram;
      
      // Dynamically update support/resistance levels (5% chance)
      if (Math.random() > 0.95) {
        // Detect if we're breaking through a level
        const breakingResistance = close > resistanceLevels[0];
        const breakingSupport = close < supportLevels[0];
        
        if (breakingResistance) {
          // Move the lowest resistance to become the highest support
          supportLevels.push(resistanceLevels.shift());
          // Add a new resistance level
          resistanceLevels.push(close + 0.01 + Math.random() * 0.01);
        } else if (breakingSupport) {
          // Move the highest support to become the lowest resistance
          resistanceLevels.unshift(supportLevels.pop());
          // Add a new support level
          supportLevels.unshift(close - 0.01 - Math.random() * 0.01);
        }
        
        // Keep only top 2 levels
        supportLevels = supportLevels.slice(-2);
        resistanceLevels = resistanceLevels.slice(0, 2);
      }
      
      // Update indicators state
      setIndicators({
        rsi: { value: rsi, visible: true },
        macd: { 
          value: macdLine, 
          signal: signalLine, 
          histogram: histogram, 
          visible: true 
        },
        ma: { fast: fastMAValues, slow: slowMAValues, visible: true },
        volume: { data: volumeHistory, visible: true },
        supportResistance: { 
          support: supportLevels, 
          resistance: resistanceLevels,
          visible: true 
        }
      });
      
      return {
        open,
        high,
        low,
        close,
        volume
      };
    };

    const generateData = () => {
      const now = new Date();
      const time = now.getTime() / 1000;
      
      const newCandle = {
        time,
        ...generateRandomCandle(),
      };
      
      setCurrentPrice(newCandle.close);
      
      setPriceData(prev => {
        const newData = [...prev, newCandle];
        if (newData.length > 100) newData.shift();
        return newData;
      });
      
      // Update chart with new data
      if (chartType === 'candles' && candleSeriesRef.current) {
        candleSeriesRef.current.update(newCandle);
      } else if (lineSeriesRef.current) {
        lineSeriesRef.current.update({ time, value: newCandle.close });
      }
      
      // Update MA series if visible
      if (showIndicators && maSeriesRef.current) {
        if (fastMAValues.length > 0) {
          maSeriesRef.current.fast.update({ 
            time, 
            value: fastMAValues[fastMAValues.length - 1] 
          });
        }
        
        if (slowMAValues.length > 0) {
          maSeriesRef.current.slow.update({ 
            time, 
            value: slowMAValues[slowMAValues.length - 1] 
          });
        }
      }
      
      // Update volume series if visible
      if (showIndicators && volumeSeriesRef.current) {
        volumeSeriesRef.current.update({
          time,
          value: newCandle.volume,
          color: newCandle.close >= newCandle.open ? colors.buyGreen : colors.sellRed
        });
      }
      
      // Check if any pending orders should be executed
      checkPendingOrders(newCandle.close);
      
      // Update PnL for open positions
      if (position) {
        const pnl = calculatePnl(position, newCandle.close);
        
        // Check if stop loss or take profit hit
        if (position.stopLoss && 
            ((position.type === 'buy' && newCandle.close <= position.stopLoss) || 
             (position.type === 'sell' && newCandle.close >= position.stopLoss))) {
          closePosition(position.stopLoss);
        } else if (position.takeProfit && 
                  ((position.type === 'buy' && newCandle.close >= position.takeProfit) || 
                   (position.type === 'sell' && newCandle.close <= position.takeProfit))) {
          closePosition(position.takeProfit);
        }
      }
    };

    // Start with initial data
    const initialData = [];
    const now = new Date();
    
    // Generate historical data
    for (let i = 100; i >= 0; i--) {
      const time = (now.getTime() / 1000) - i * 60; // One minute candles
      initialData.push({
        time,
        ...generateRandomCandle(),
      });
    }
    
    setPriceData(initialData);
    
    // Update chart with initial data
    if (chartType === 'candles' && candleSeriesRef.current) {
      candleSeriesRef.current.setData(initialData);
    } else if (lineSeriesRef.current) {
      lineSeriesRef.current.setData(initialData.map(d => ({ time: d.time, value: d.close })));
    }
    
    // Update MA series with initial data
    if (showIndicators && maSeriesRef.current) {
      const fastData = [];
      const slowData = [];
      
      for (let i = 0; i < fastMAValues.length; i++) {
        const time = (now.getTime() / 1000) - (fastMAValues.length - i) * 60;
        fastData.push({ time, value: fastMAValues[i] });
      }
      
      for (let i = 0; i < slowMAValues.length; i++) {
        const time = (now.getTime() / 1000) - (slowMAValues.length - i) * 60;
        slowData.push({ time, value: slowMAValues[i] });
      }
      
      maSeriesRef.current.fast.setData(fastData);
      maSeriesRef.current.slow.setData(slowData);
    }
    
    // Update volume series with initial data
    if (showIndicators && volumeSeriesRef.current) {
      volumeSeriesRef.current.setData(
        initialData.map(d => ({
          time: d.time,
          value: d.volume,
          color: d.close >= d.open ? colors.buyGreen : colors.sellRed
        }))
      );
    }
    
    // Set current price
    if (initialData.length > 0) {
      setCurrentPrice(initialData[initialData.length - 1].close);
    }
    
    // Start live updates
    intervalId = setInterval(generateData, 1000); // 1 second updates for short-term
    
    return () => clearInterval(intervalId);
  }, [selectedPair, tradingType, step, chartType, showIndicators]);

  // Check if any pending orders should be executed based on current price
  const checkPendingOrders = (currentPrice) => {
    if (!openOrders.length) return;
    
    const newOpenOrders = [...openOrders];
    let ordersExecuted = false;
    
    for (let i = newOpenOrders.length - 1; i >= 0; i--) {
      const order = newOpenOrders[i];
      
      // Check if limit or stop orders should be executed
      if (order.type === 'limit') {
        if ((order.direction === 'buy' && currentPrice <= order.price) || 
            (order.direction === 'sell' && currentPrice >= order.price)) {
          // Execute the order
          executeOrder(order, currentPrice);
          newOpenOrders.splice(i, 1);
          ordersExecuted = true;
        }
      } else if (order.type === 'stop') {
        if ((order.direction === 'buy' && currentPrice >= order.price) || 
            (order.direction === 'sell' && currentPrice <= order.price)) {
          // Execute the order
          executeOrder(order, currentPrice);
          newOpenOrders.splice(i, 1);
          ordersExecuted = true;
        }
      }
    }
    
    if (ordersExecuted) {
      setOpenOrders(newOpenOrders);
    }
  };

  // Execute an order (convert to position)
  const executeOrder = (order, execPrice) => {
    if (availableBalance < order.amount) {
      alert("Not enough available balance!");
      return;
    }
    
    const newPosition = {
      pair: selectedPair,
      type: order.direction,
      orderType: order.type,
      amount: order.amount,
      leverage: order.leverage || leverage,
      price: execPrice,
      marginUsed: order.amount,
      time: new Date().toISOString(),
      stopLoss: order.stopLoss,
      takeProfit: order.takeProfit
    };
    
    setPosition(newPosition);
    setAvailableBalance(prev => prev - order.amount);
    setLockedMargin(order.amount);
    
    // Add to database if connected
    if (sessionId) {
      // API call to record the position would go here
    }
  };

  // Place a new order
  const placeOrder = () => {
    if (!pendingOrder.price || availableBalance < pendingOrder.amount) {
      alert("Please set a valid price and amount!");
      return;
    }
    
    const newOrder = {
      ...pendingOrder,
      pair: selectedPair,
      leverage: leverage,
      id: Date.now(), // Temporary ID
      time: new Date().toISOString()
    };
    
    // For market orders, execute immediately
    if (pendingOrder.type === 'market') {
      executeOrder(newOrder, currentPrice);
    } else {
      // For limit and stop orders, add to open orders
      setOpenOrders(prev => [...prev, newOrder]);
    }
    
    // Reset pending order form
    setPendingOrder({
      type: 'limit',
      price: null,
      amount: 1000,
      direction: 'buy',
      stopLoss: null,
      takeProfit: null
    });
    
    // Add to database if connected
    if (sessionId) {
      // API call to record the order would go here
    }
  };

  // Cancel an open order
  const cancelOrder = (orderId) => {
    setOpenOrders(prev => prev.filter(order => order.id !== orderId));
    
    // Update database if connected
    if (sessionId) {
      // API call to cancel the order would go here
    }
  };

  // Enhanced close position function with specified price
  const closePosition = (closePrice = currentPrice) => {
    if (!position) return;
    
    const pnl = calculatePnl(position, closePrice);
    const closedTrade = {
      ...position,
      exitPrice: closePrice,
      exitTime: new Date().toISOString(),
      pnl,
    };
    
    setTrades(prev => [...prev, closedTrade]);
    setAvailableBalance(prev => prev + position.marginUsed + pnl);
    setLockedMargin(0);
    setPosition(null);
    
    // Update database if connected
    if (sessionId) {
      // API call to record the closed trade would go here
    }
  };

  const calculatePnl = (position, currentPrice) => {
    const priceDiff = position.type === 'buy' 
      ? currentPrice - position.price 
      : position.price - currentPrice;
    return priceDiff * position.amount * position.leverage;
  };

  // Quick trade execution logic
  const handleTrade = () => {
    if (!currentPrice) return;
    
    if (position) {
      // Close existing position
      const pnl = calculatePnl(position, currentPrice);
      const closedTrade = {
        ...position,
        exitPrice: currentPrice,
        exitTime: new Date().toISOString(),
        pnl,
      };
      
      setTrades(prev => [...prev, closedTrade]);
      setAvailableBalance(prev => prev + position.marginUsed + pnl);
      setLockedMargin(0);
      setPosition(null);
    } else {
      // Open new position
      if (availableBalance < amount) {
        alert("Not enough available balance!");
        return;
      }

      const trade = {
        pair: selectedPair,
        type: isBuying ? 'buy' : 'sell',
        orderType,
        amount,
        leverage,
        price: currentPrice,
        marginUsed: amount,
        time: new Date().toISOString(),
      };

      setPosition(trade);
      setAvailableBalance(prev => prev - amount);
      setLockedMargin(amount);
    }
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', backgroundColor: colors.darkBg }}>
      <Sidebar />
      
      <Box sx={{ flex: 1, p: 3, overflow: 'auto', ml: '250px' }}>
        {step === 1 && (
          // Step 1: Set simulation amount
          <Box sx={{ maxWidth: '600px', mx: 'auto', textAlign: 'center', mt: 5 }}>
            <Typography 
              variant="h4" 
              gutterBottom 
              sx={{ 
                color: colors.primaryText,
                fontWeight: 'bold',
                mb: 4
              }}
            >
              Set Your Simulation Amount
            </Typography>
            
            <Paper 
              sx={{ 
                p: 4, 
                backgroundColor: colors.cardBg,
                border: `1px solid ${colors.borderColor}`,
                borderRadius: '12px',
                boxShadow: `0 8px 16px ${colors.shadowColor}`,
                mb: 4
              }}
            >
              <Typography variant="h5" sx={{ color: colors.primaryText, mb: 3 }}>
                ${simulationAmount.toFixed(0)}
              </Typography>
              
              <Box sx={{ px: 3, mb: 4 }}>
                <input
                  type="range"
                  min="1000"
                  max="100000"
                  step="1000"
                  value={simulationAmount}
                  onChange={(e) => setSimulationAmount(parseFloat(e.target.value))}
                  style={{ 
                    width: '100%',
                    accentColor: colors.accentBlue,
                  }}
                />
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                  <Typography variant="body2" sx={{ color: colors.secondaryText }}>$1,000</Typography>
                  <Typography variant="body2" sx={{ color: colors.secondaryText }}>$100,000</Typography>
                </Box>
              </Box>
              
              <Button 
                variant="contained" 
                color="primary" 
                size="large"
                onClick={() => {
                  setAvailableBalance(simulationAmount);
                  setStep(2);
                }}
                sx={{
                  backgroundColor: colors.accentBlue,
                  px: 4,
                  py: 1.5,
                  '&:hover': {
                    backgroundColor: colors.accentBlue,
                    opacity: 0.9
                  }
                }}
              >
                Continue
              </Button>
            </Paper>
          </Box>
        )}
        
        {step === 2 && (
          // Step 2: Choose trading type
          <Box sx={{ maxWidth: '600px', mx: 'auto', textAlign: 'center', mt: 5 }}>
            <Typography 
              variant="h4" 
              gutterBottom 
              sx={{ 
                color: colors.primaryText,
                fontWeight: 'bold',
                mb: 4
              }}
            >
              Choose Your Trading Type
            </Typography>
            
            <Box sx={{ display: 'flex', gap: 3, justifyContent: 'center' }}>
              <Paper 
                sx={{ 
                  p: 4, 
                  backgroundColor: colors.cardBg,
                  border: `1px solid ${colors.borderColor}`,
                  borderRadius: '12px',
                  boxShadow: `0 8px 16px ${colors.shadowColor}`,
                  flex: 1,
                  cursor: 'pointer',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  '&:hover': {
                    transform: 'translateY(-5px)',
                    boxShadow: `0 12px 20px ${colors.shadowColor}`,
                  }
                }}
                onClick={() => {
                  setTradingType('short-term');
                  setStep(3);
                }}
              >
                <Typography 
                  variant="h5" 
                  gutterBottom
                  sx={{ 
                    color: colors.accentBlue,
                    fontWeight: 'bold',
                    mb: 2
                  }}
                >
                  Short Term
                </Typography>
                <Typography variant="body1" sx={{ color: colors.secondaryText, mb: 3 }}>
                  Quick trades with rapid price movements
                </Typography>
                <Box sx={{ color: colors.buyGreen, fontSize: '3rem', mb: 2 }}>
                  ⚡
                </Box>
                <Button 
                  variant="outlined" 
                  color="primary"
                  sx={{
                    borderColor: colors.accentBlue,
                    color: colors.accentBlue,
                    '&:hover': {
                      borderColor: colors.accentBlue,
                      backgroundColor: `${colors.accentBlue}20`
                    }
                  }}
                >
                  Select
                </Button>
              </Paper>
              
              <Paper 
                sx={{ 
                  p: 4, 
                  backgroundColor: colors.cardBg,
                  border: `1px solid ${colors.borderColor}`,
                  borderRadius: '12px',
                  boxShadow: `0 8px 16px ${colors.shadowColor}`,
                  flex: 1,
                  cursor: 'pointer',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  '&:hover': {
                    transform: 'translateY(-5px)',
                    boxShadow: `0 12px 20px ${colors.shadowColor}`,
                  }
                }}
                onClick={() => {
                  setTradingType('long-term');
                  setStep(3);
                }}
              >
                <Typography 
                  variant="h5" 
                  gutterBottom
                  sx={{ 
                    color: colors.accentBlue,
                    fontWeight: 'bold',
                    mb: 2
                  }}
                >
                  Long Term
                </Typography>
                <Typography variant="body1" sx={{ color: colors.secondaryText, mb: 3 }}>
                  Strategic positions with sustained growth
                </Typography>
                <Box sx={{ color: colors.warningOrange, fontSize: '3rem', mb: 2 }}>
                  📈
                </Box>
                <Button 
                  variant="outlined" 
                  color="primary"
                  sx={{
                    borderColor: colors.accentBlue,
                    color: colors.accentBlue,
                    '&:hover': {
                      borderColor: colors.accentBlue,
                      backgroundColor: `${colors.accentBlue}20`
                    }
                  }}
                >
                  Select
                </Button>
              </Paper>
            </Box>
          </Box>
        )}
        
        {step === 3 && (
          <>
            <Typography 
              variant="h4" 
              gutterBottom 
              sx={{ 
                color: colors.primaryText,
                fontWeight: 'bold',
                mb: 3
              }}
            >
              Forex Market Simulation {tradingType === 'short-term' ? '(Short Term)' : '(Long Term)'}
            </Typography>
            
            <Box sx={{ display: 'flex', gap: 3, height: 'calc(100vh - 180px)' }}>
              {/* Left Column - Chart and Trading Controls */}
              <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 3 }}>
                {/* Chart Section */}
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
                  {/* Chart Controls */}
                  <Box sx={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center', 
                    mb: 1,
                    pb: 1,
                    borderBottom: `1px solid ${colors.borderColor}`
                  }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Typography sx={{ color: colors.primaryText, fontWeight: 'bold', mr: 2 }}>
                        {selectedPair} - {currentPrice ? currentPrice.toFixed(5) : '-.-----'}
                      </Typography>
                      <Chip 
                        size="small" 
                        icon={<TrendingUpIcon />} 
                        label="Bullish" 
                        sx={{ 
                          backgroundColor: colors.buyGreen,
                          color: colors.primaryText,
                          mr: 1
                        }}
                      />
                    </Box>
                    
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {/* Timeframe Selector */}
                      <Select
                        value={selectedTimeframe}
                        onChange={(e) => setSelectedTimeframe(e.target.value)}
                        size="small"
                        sx={{ 
                          minWidth: 70,
                          height: 30,
                          color: colors.primaryText,
                          '.MuiOutlinedInput-notchedOutline': {
                            borderColor: colors.borderColor,
                          },
                          '&:hover .MuiOutlinedInput-notchedOutline': {
                            borderColor: colors.accentBlue,
                          },
                          '.MuiSelect-select': {
                            padding: '2px 14px',
                          }
                        }}
                        MenuProps={{
                          PaperProps: {
                            sx: {
                              backgroundColor: colors.panelBg,
                              border: `1px solid ${colors.borderColor}`,
                              '& .MuiMenuItem-root': {
                                color: colors.primaryText,
                                fontSize: '0.875rem',
                                minHeight: 'auto',
                                '&:hover': {
                                  backgroundColor: colors.hoverBg,
                                },
                                '&.Mui-selected': {
                                  backgroundColor: colors.accentBlue,
                                  '&:hover': {
                                    backgroundColor: colors.accentBlue,
                                  },
                                }
                              }
                            }
                          }
                        }}
                      >
                        <MenuItem value="1m">1m</MenuItem>
                        <MenuItem value="5m">5m</MenuItem>
                        <MenuItem value="15m">15m</MenuItem>
                        <MenuItem value="1h">1h</MenuItem>
                        <MenuItem value="4h">4h</MenuItem>
                        <MenuItem value="1d">1D</MenuItem>
                      </Select>
                      
                      {/* Chart Type */}
                      <Tooltip title="Candlestick Chart">
                        <IconButton 
                          size="small"
                          onClick={() => setChartType('candles')}
                          sx={{ 
                            color: chartType === 'candles' ? colors.accentBlue : colors.secondaryText,
                            padding: '4px'
                          }}
                        >
                          <CandlestickChartIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      
                      <Tooltip title="Line Chart">
                        <IconButton 
                          size="small"
                          onClick={() => setChartType('line')}
                          sx={{ 
                            color: chartType === 'line' ? colors.accentBlue : colors.secondaryText,
                            padding: '4px'
                          }}
                        >
                          <ShowChartIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      
                      {/* Indicators Toggle */}
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Typography variant="caption" sx={{ color: colors.secondaryText, mr: 1 }}>
                          Indicators
                        </Typography>
                        <Switch
                          size="small"
                          checked={showIndicators}
                          onChange={() => setShowIndicators(!showIndicators)}
                          sx={{
                            '& .MuiSwitch-track': {
                              backgroundColor: showIndicators ? `${colors.accentBlue}80` : colors.borderColor,
                            },
                            '& .MuiSwitch-thumb': {
                              backgroundColor: showIndicators ? colors.accentBlue : colors.secondaryText,
                            }
                          }}
                        />
                      </Box>
                    </Box>
                  </Box>
                  
                  {/* Chart Container */}
                  <Box 
                    ref={chartContainerRef} 
                    sx={{ 
                      flex: 1,
                      width: '100%', 
                      minHeight: '300px'
                    }}
                  />
                  
                  {/* Indicators Panel */}
                  {showIndicators && (
                    <Box sx={{ 
                      mt: 1, 
                      pt: 1, 
                      borderTop: `1px solid ${colors.borderColor}`,
                      display: 'flex',
                      gap: 2
                    }}>
                      <Chip 
                        size="small" 
                        label={`RSI: ${indicators.rsi.value.toFixed(2)}`} 
                        sx={{ 
                          backgroundColor: 
                            indicators.rsi.value > 70 ? colors.sellRed :
                            indicators.rsi.value < 30 ? colors.buyGreen :
                            colors.panelBg,
                          color: colors.primaryText
                        }}
                      />
                      
                      <Chip 
                        size="small" 
                        label={`MACD: ${indicators.macd.value.toFixed(4)}`} 
                        sx={{ 
                          backgroundColor: indicators.macd.value >= 0 ? colors.buyGreen : colors.sellRed,
                          color: colors.primaryText
                        }}
                      />
                      
                      <Chip 
                        size="small" 
                        label={`MA9: ${fastMAValues[fastMAValues.length - 1]?.toFixed(5) || '-.-----'}`} 
                        sx={{ 
                          backgroundColor: colors.panelBg,
                          border: '1px solid #F44336',
                          color: colors.primaryText
                        }}
                      />
                      
                      <Chip 
                        size="small" 
                        label={`MA21: ${slowMAValues[slowMAValues.length - 1]?.toFixed(5) || '-.-----'}`} 
                        sx={{ 
                          backgroundColor: colors.panelBg,
                          border: '1px solid #2196F3',
                          color: colors.primaryText
                        }}
                      />
                      
                      <Box sx={{ flex: 1 }} />
                      
                      <Chip 
                        size="small" 
                        label={`Support: ${indicators.supportResistance.support[0]?.toFixed(5) || '-.-----'}`}
                        sx={{ 
                          backgroundColor: colors.panelBg,
                          border: `1px solid ${colors.buyGreen}`,
                          color: colors.primaryText
                        }}
                      />
                      
                      <Chip 
                        size="small" 
                        label={`Resistance: ${indicators.supportResistance.resistance[0]?.toFixed(5) || '-.-----'}`}
                        sx={{ 
                          backgroundColor: colors.panelBg,
                          border: `1px solid ${colors.sellRed}`,
                          color: colors.primaryText
                        }}
                      />
                    </Box>
                  )}
                </Paper>
                
                {/* Trading Controls */}
                <Paper 
                  sx={{ 
                    p: 3, 
                    backgroundColor: colors.cardBg,
                    border: `1px solid ${colors.borderColor}`,
                    borderRadius: '12px',
                    boxShadow: `0 4px 12px ${colors.shadowColor}`
                  }}
                >
                  <Typography 
                    variant="h6" 
                    gutterBottom 
                    sx={{ 
                      color: colors.primaryText,
                      fontWeight: 'bold',
                      mb: 2
                    }}
                  >
                    Short-Term Trading
                  </Typography>
                  
                  <Tabs
                    value={activeTradingTab}
                    onChange={(e, newValue) => setActiveTradingTab(newValue)}
                    sx={{
                      mb: 2,
                      borderBottom: `1px solid ${colors.borderColor}`,
                      '& .MuiTabs-indicator': {
                        backgroundColor: colors.accentBlue,
                      },
                      '& .MuiTab-root': {
                        color: colors.secondaryText,
                        '&.Mui-selected': {
                          color: colors.accentBlue,
                        }
                      }
                    }}
                  >
                    <Tab label="Market" sx={{ minWidth: 80 }} />
                    <Tab label="Limit/Stop" sx={{ minWidth: 80 }} />
                    <Tab label="Open Orders" sx={{ minWidth: 80 }} />
                  </Tabs>
                  
                  {/* Tab Panels */}
                  {activeTradingTab === 0 && (
                    <Box>
                      <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                        <FormControl sx={{ flex: 1 }}>
                          <InputLabel id="pair-select-label" sx={{ color: colors.secondaryText }}>
                            Currency Pair
                          </InputLabel>
                          <Select
                            labelId="pair-select-label"
                            value={selectedPair}
                            label="Currency Pair"
                            onChange={(e) => setSelectedPair(e.target.value)}
                            sx={{ 
                              color: colors.primaryText,
                              '.MuiOutlinedInput-notchedOutline': {
                                borderColor: colors.borderColor,
                              },
                              '&:hover .MuiOutlinedInput-notchedOutline': {
                                borderColor: colors.accentBlue,
                              },
                              '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                borderColor: colors.accentBlue,
                              },
                            }}
                            MenuProps={{
                              PaperProps: {
                                sx: {
                                  backgroundColor: colors.panelBg,
                                  border: `1px solid ${colors.borderColor}`,
                                  '& .MuiMenuItem-root': {
                                    color: colors.primaryText,
                                    '&:hover': {
                                      backgroundColor: colors.hoverBg,
                                    },
                                    '&.Mui-selected': {
                                      backgroundColor: colors.accentBlue,
                                      '&:hover': {
                                        backgroundColor: colors.accentBlue,
                                      },
                                    }
                                  }
                                }
                              }
                            }}
                          >
                            {forexPairs.map(pair => (
                              <MenuItem key={pair} value={pair}>
                                {pair}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>

                        <FormControl sx={{ flex: 1 }}>
                          <InputLabel id="order-type-label" sx={{ color: colors.secondaryText }}>
                            Order Type
                          </InputLabel>
                          <Select
                            labelId="order-type-label"
                            value={orderType}
                            label="Order Type"
                            onChange={(e) => setOrderType(e.target.value)}
                            sx={{ 
                              color: colors.primaryText,
                              '.MuiOutlinedInput-notchedOutline': {
                                borderColor: colors.borderColor,
                              },
                              '&:hover .MuiOutlinedInput-notchedOutline': {
                                borderColor: colors.accentBlue,
                              },
                              '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                borderColor: colors.accentBlue,
                              },
                            }}
                            MenuProps={{
                              PaperProps: {
                                sx: {
                                  backgroundColor: colors.panelBg,
                                  border: `1px solid ${colors.borderColor}`,
                                  '& .MuiMenuItem-root': {
                                    color: colors.primaryText,
                                    '&:hover': {
                                      backgroundColor: colors.hoverBg,
                                    },
                                    '&.Mui-selected': {
                                      backgroundColor: colors.accentBlue,
                                      '&:hover': {
                                        backgroundColor: colors.accentBlue,
                                      },
                                    }
                                  }
                                }
                              }
                            }}
                          >
                            <MenuItem value="market">Market</MenuItem>
                            <MenuItem value="limit">Limit</MenuItem>
                            <MenuItem value="stop">Stop</MenuItem>
                          </Select>
                        </FormControl>
                      </Box>

                      <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                        <Button 
                          variant={isBuying ? 'contained' : 'outlined'} 
                          color="success"
                          onClick={() => setIsBuying(true)}
                          sx={{
                            flex: 1,
                            backgroundColor: isBuying ? colors.buyGreen : 'transparent',
                            borderColor: colors.buyGreen,
                            color: isBuying ? colors.primaryText : colors.buyGreen,
                            '&:hover': {
                              backgroundColor: isBuying ? colors.buyGreen : `${colors.buyGreen}20`,
                              borderColor: colors.buyGreen,
                            }
                          }}
                        >
                          Buy
                        </Button>
                        <Button 
                          variant={!isBuying ? 'contained' : 'outlined'} 
                          color="error"
                          onClick={() => setIsBuying(false)}
                          sx={{
                            flex: 1,
                            backgroundColor: !isBuying ? colors.sellRed : 'transparent',
                            borderColor: colors.sellRed,
                            color: !isBuying ? colors.primaryText : colors.sellRed,
                            '&:hover': {
                              backgroundColor: !isBuying ? colors.sellRed : `${colors.sellRed}20`,
                              borderColor: colors.sellRed,
                            }
                          }}
                        >
                          Sell
                        </Button>
                      </Box>

                      <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                        <TextField
                          label="Amount"
                          type="number"
                          value={amount}
                          onChange={(e) => setAmount(parseFloat(e.target.value))}
                          sx={{ flex: 1 }}
                          InputLabelProps={{
                            sx: { color: colors.secondaryText },
                          }}
                          InputProps={{
                            sx: {
                              color: colors.primaryText,
                              '& .MuiOutlinedInput-notchedOutline': {
                                borderColor: colors.borderColor,
                              },
                              '&:hover .MuiOutlinedInput-notchedOutline': {
                                borderColor: colors.accentBlue,
                              },
                              '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                borderColor: colors.accentBlue,
                              },
                            },
                          }}
                        />
                        
                        <FormControl sx={{ flex: 1 }}>
                          <InputLabel id="leverage-label" sx={{ color: colors.secondaryText }}>
                            Leverage
                          </InputLabel>
                          <Select
                            labelId="leverage-label"
                            value={leverage}
                            label="Leverage"
                            onChange={(e) => setLeverage(parseInt(e.target.value))}
                            sx={{ 
                              color: colors.primaryText,
                              '.MuiOutlinedInput-notchedOutline': {
                                borderColor: colors.borderColor,
                              },
                              '&:hover .MuiOutlinedInput-notchedOutline': {
                                borderColor: colors.accentBlue,
                              },
                              '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                borderColor: colors.accentBlue,
                              },
                            }}
                            MenuProps={{
                              PaperProps: {
                                sx: {
                                  backgroundColor: colors.panelBg,
                                  border: `1px solid ${colors.borderColor}`,
                                  '& .MuiMenuItem-root': {
                                    color: colors.primaryText,
                                    '&:hover': {
                                      backgroundColor: colors.hoverBg,
                                    },
                                    '&.Mui-selected': {
                                      backgroundColor: colors.accentBlue,
                                      '&:hover': {
                                        backgroundColor: colors.accentBlue,
                                      },
                                    }
                                  }
                                }
                              }
                            }}
                          >
                            {[1, 5, 10, 20, 30, 50, 100].map(val => (
                              <MenuItem key={val} value={val}>{val}x</MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </Box>
                      
                      <Button 
                        variant="contained" 
                        color="primary" 
                        fullWidth 
                        size="large"
                        onClick={handleTrade}
                        sx={{
                          backgroundColor: isBuying ? colors.buyGreen : colors.sellRed,
                          '&:hover': {
                            backgroundColor: isBuying ? colors.buyGreen : colors.sellRed,
                            opacity: 0.9
                          }
                        }}
                      >
                        {position ? 'Close Position' : `${isBuying ? 'Buy' : 'Sell'} ${selectedPair}`}
                      </Button>
                    </Box>
                  )}
                  
                  {activeTradingTab === 1 && (
                    <Box>
                      <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                        <FormControl sx={{ flex: 1 }}>
                          <InputLabel id="pending-order-type-label" sx={{ color: colors.secondaryText }}>
                            Order Type
                          </InputLabel>
                          <Select
                            labelId="pending-order-type-label"
                            value={pendingOrder.type}
                            label="Order Type"
                            onChange={(e) => setPendingOrder(prev => ({ ...prev, type: e.target.value }))}
                            sx={{ 
                              color: colors.primaryText,
                              '.MuiOutlinedInput-notchedOutline': {
                                borderColor: colors.borderColor,
                              },
                              '&:hover .MuiOutlinedInput-notchedOutline': {
                                borderColor: colors.accentBlue,
                              },
                              '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                borderColor: colors.accentBlue,
                              },
                            }}
                          >
                            <MenuItem value="limit">Limit</MenuItem>
                            <MenuItem value="stop">Stop</MenuItem>
                          </Select>
                        </FormControl>
                        
                        <Box sx={{ flex: 1, display: 'flex', gap: 1 }}>
                          <Button 
                            variant={pendingOrder.direction === 'buy' ? 'contained' : 'outlined'} 
                            color="success"
                            onClick={() => setPendingOrder(prev => ({ ...prev, direction: 'buy' }))}
                            fullWidth
                            sx={{
                              backgroundColor: pendingOrder.direction === 'buy' ? colors.buyGreen : 'transparent',
                              borderColor: colors.buyGreen,
                              color: pendingOrder.direction === 'buy' ? colors.primaryText : colors.buyGreen,
                              '&:hover': {
                                backgroundColor: pendingOrder.direction === 'buy' ? colors.buyGreen : `${colors.buyGreen}20`,
                                borderColor: colors.buyGreen,
                              }
                            }}
                          >
                            Buy
                          </Button>
                          <Button 
                            variant={pendingOrder.direction === 'sell' ? 'contained' : 'outlined'} 
                            color="error"
                            onClick={() => setPendingOrder(prev => ({ ...prev, direction: 'sell' }))}
                            fullWidth
                            sx={{
                              backgroundColor: pendingOrder.direction === 'sell' ? colors.sellRed : 'transparent',
                              borderColor: colors.sellRed,
                              color: pendingOrder.direction === 'sell' ? colors.primaryText : colors.sellRed,
                              '&:hover': {
                                backgroundColor: pendingOrder.direction === 'sell' ? colors.sellRed : `${colors.sellRed}20`,
                                borderColor: colors.sellRed,
                              }
                            }}
                          >
                            Sell
                          </Button>
                        </Box>
                      </Box>
                      
                      <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                        <TextField
                          label="Price"
                          type="number"
                          value={pendingOrder.price || ''}
                          onChange={(e) => setPendingOrder(prev => ({ ...prev, price: parseFloat(e.target.value) }))}
                          sx={{ flex: 1 }}
                          InputLabelProps={{
                            sx: { color: colors.secondaryText },
                          }}
                          InputProps={{
                            sx: {
                              color: colors.primaryText,
                              '& .MuiOutlinedInput-notchedOutline': {
                                borderColor: colors.borderColor,
                              },
                              '&:hover .MuiOutlinedInput-notchedOutline': {
                                borderColor: colors.accentBlue,
                              },
                              '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                borderColor: colors.accentBlue,
                              },
                            },
                          }}
                        />
                        
                        <TextField
                          label="Amount"
                          type="number"
                          value={pendingOrder.amount}
                          onChange={(e) => setPendingOrder(prev => ({ ...prev, amount: parseFloat(e.target.value) }))}
                          sx={{ flex: 1 }}
                          InputLabelProps={{
                            sx: { color: colors.secondaryText },
                          }}
                          InputProps={{
                            sx: {
                              color: colors.primaryText,
                              '& .MuiOutlinedInput-notchedOutline': {
                                borderColor: colors.borderColor,
                              },
                              '&:hover .MuiOutlinedInput-notchedOutline': {
                                borderColor: colors.accentBlue,
                              },
                              '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                borderColor: colors.accentBlue,
                              },
                            },
                          }}
                        />
                      </Box>
                      
                      <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                        <TextField
                          label="Stop Loss"
                          type="number"
                          value={pendingOrder.stopLoss || ''}
                          onChange={(e) => setPendingOrder(prev => ({ ...prev, stopLoss: parseFloat(e.target.value) }))}
                          sx={{ flex: 1 }}
                          InputLabelProps={{
                            sx: { color: colors.secondaryText },
                          }}
                          InputProps={{
                            sx: {
                              color: colors.primaryText,
                              '& .MuiOutlinedInput-notchedOutline': {
                                borderColor: colors.borderColor,
                              },
                              '&:hover .MuiOutlinedInput-notchedOutline': {
                                borderColor: colors.accentBlue,
                              },
                              '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                borderColor: colors.accentBlue,
                              },
                            },
                          }}
                        />
                        
                        <TextField
                          label="Take Profit"
                          type="number"
                          value={pendingOrder.takeProfit || ''}
                          onChange={(e) => setPendingOrder(prev => ({ ...prev, takeProfit: parseFloat(e.target.value) }))}
                          sx={{ flex: 1 }}
                          InputLabelProps={{
                            sx: { color: colors.secondaryText },
                          }}
                          InputProps={{
                            sx: {
                              color: colors.primaryText,
                              '& .MuiOutlinedInput-notchedOutline': {
                                borderColor: colors.borderColor,
                              },
                              '&:hover .MuiOutlinedInput-notchedOutline': {
                                borderColor: colors.accentBlue,
                              },
                              '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                borderColor: colors.accentBlue,
                              },
                            },
                          }}
                        />
                      </Box>
                      
                      <Button 
                        variant="contained" 
                        color="primary" 
                        fullWidth 
                        size="large"
                        onClick={placeOrder}
                        sx={{
                          backgroundColor: pendingOrder.direction === 'buy' ? colors.buyGreen : colors.sellRed,
                          '&:hover': {
                            backgroundColor: pendingOrder.direction === 'buy' ? colors.buyGreen : colors.sellRed,
                            opacity: 0.9
                          }
                        }}
                      >
                        Place {pendingOrder.type.charAt(0).toUpperCase() + pendingOrder.type.slice(1)} Order
                      </Button>
                    </Box>
                  )}
                  
                  {activeTradingTab === 2 && (
                    <Box>
                      {openOrders.length === 0 ? (
                        <Typography sx={{ color: colors.secondaryText, textAlign: 'center', py: 3 }}>
                          No open orders
                        </Typography>
                      ) : (
                        <TableContainer 
                          component={Paper}
                          sx={{ 
                            backgroundColor: 'transparent',
                            maxHeight: 240,
                            '&::-webkit-scrollbar': {
                              width: '8px',
                            },
                            '&::-webkit-scrollbar-track': {
                              backgroundColor: colors.panelBg,
                            },
                            '&::-webkit-scrollbar-thumb': {
                              backgroundColor: colors.borderColor,
                              borderRadius: '4px',
                            },
                          }}
                        >
                          <Table size="small" stickyHeader>
                            <TableHead>
                              <TableRow>
                                <TableCell sx={{ backgroundColor: colors.panelBg, color: colors.primaryText }}>Type</TableCell>
                                <TableCell sx={{ backgroundColor: colors.panelBg, color: colors.primaryText }}>Direction</TableCell>
                                <TableCell sx={{ backgroundColor: colors.panelBg, color: colors.primaryText }}>Price</TableCell>
                                <TableCell sx={{ backgroundColor: colors.panelBg, color: colors.primaryText }}>Amount</TableCell>
                                <TableCell sx={{ backgroundColor: colors.panelBg, color: colors.primaryText }}>Actions</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {openOrders.map((order) => (
                                <TableRow key={order.id}>
                                  <TableCell sx={{ color: colors.primaryText }}>
                                    {order.type.charAt(0).toUpperCase() + order.type.slice(1)}
                                  </TableCell>
                                  <TableCell sx={{ 
                                    color: order.direction === 'buy' ? colors.buyGreen : colors.sellRed,
                                    fontWeight: 'bold'
                                  }}>
                                    {order.direction.toUpperCase()}
                                  </TableCell>
                                  <TableCell sx={{ color: colors.primaryText }}>
                                    {order.price.toFixed(5)}
                                  </TableCell>
                                  <TableCell sx={{ color: colors.primaryText }}>
                                    ${order.amount}
                                  </TableCell>
                                  <TableCell>
                                    <IconButton 
                                      size="small" 
                                      onClick={() => cancelOrder(order.id)}
                                      sx={{ color: colors.sellRed }}
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
                    </Box>
                  )}
                </Paper>
              </Box>
              
              {/* Right Column - Account Summary */}
              <Paper 
                sx={{ 
                  p: 3, 
                  width: 300, 
                  backgroundColor: colors.cardBg,
                  border: `1px solid ${colors.borderColor}`,
                  borderRadius: '12px',
                  boxShadow: `0 4px 12px ${colors.shadowColor}`,
                  display: 'flex',
                  flexDirection: 'column'
                }}
              >
                <Typography 
                  variant="h6" 
                  gutterBottom 
                  sx={{ 
                    color: colors.primaryText,
                    fontWeight: 'bold',
                    mb: 3
                  }}
                >
                  Account Summary
                </Typography>
                
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" sx={{ color: colors.secondaryText }}>Available</Typography>
                  <Typography variant="h5" sx={{ color: colors.primaryText }}>
                    ${availableBalance.toFixed(2)}
                  </Typography>
                </Box>
                
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" sx={{ color: colors.secondaryText }}>Locked Margin</Typography>
                  <Typography variant="h6" sx={{ color: colors.secondaryText }}>
                    ${lockedMargin.toFixed(2)}
                  </Typography>
                </Box>
                
                <Box sx={{ mb: 3 }}>
                  <Typography variant="body2" sx={{ color: colors.secondaryText }}>Total Balance</Typography>
                  <Typography variant="h5" sx={{ color: colors.accentBlue }}>
                    ${totalBalance.toFixed(2)}
                  </Typography>
                </Box>
                
                {position && (
                  <Box 
                    sx={{ 
                      mb: 3, 
                      p: 2, 
                      backgroundColor: colors.panelBg, 
                      borderRadius: '8px',
                      border: `1px solid ${colors.borderColor}`
                    }}
                  >
                    <Typography 
                      variant="subtitle2" 
                      gutterBottom 
                      sx={{ color: colors.primaryText }}
                    >
                      Open Position
                    </Typography>
                    <Typography variant="body2" sx={{ color: colors.secondaryText }}>
                      {position.type.toUpperCase()} {position.pair} @ {position.price.toFixed(5)}
                    </Typography>
                    <Typography variant="body2" sx={{ color: colors.secondaryText }}>
                      Amount: ${position.amount} (x{position.leverage})
                    </Typography>
                    
                    {position.stopLoss && (
                      <Typography variant="body2" sx={{ color: colors.sellRed }}>
                        Stop Loss: {position.stopLoss.toFixed(5)}
                      </Typography>
                    )}
                    
                    {position.takeProfit && (
                      <Typography variant="body2" sx={{ color: colors.buyGreen }}>
                        Take Profit: {position.takeProfit.toFixed(5)}
                      </Typography>
                    )}
                    
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        color: calculatePnl(position, currentPrice) >= 0 ? colors.profitGreen : colors.lossRed,
                        fontWeight: 'bold',
                        mt: 1
                      }}
                    >
                      Current PnL: ${calculatePnl(position, currentPrice).toFixed(2)} 
                      ({(calculatePnl(position, currentPrice) / position.amount * 100).toFixed(2)}%)
                    </Typography>
                    
                    <Button 
                      variant="outlined" 
                      color="error" 
                      fullWidth 
                      size="small"
                      onClick={() => closePosition()}
                      sx={{ 
                        mt: 1,
                        borderColor: colors.sellRed,
                        color: colors.sellRed,
                        '&:hover': {
                          borderColor: colors.sellRed,
                          backgroundColor: `${colors.sellRed}20`
                        }
                      }}
                    >
                      Close Position
                    </Button>
                  </Box>
                )}
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography 
                    variant="subtitle2" 
                    sx={{ color: colors.primaryText }}
                  >
                    Latest Trades
                  </Typography>
                  
                  <Chip 
                    label={`${trades.length} trade${trades.length !== 1 ? 's' : ''}`}
                    size="small"
                    sx={{ 
                      backgroundColor: colors.panelBg,
                      color: colors.secondaryText,
                      fontSize: '0.7rem'
                    }}
                  />
                </Box>
                
                <Box sx={{ flex: 1, overflow: 'auto' }}>
                  {trades.length === 0 ? (
                    <Typography variant="body2" sx={{ color: colors.secondaryText, textAlign: 'center', py: 2 }}>
                      No trades yet
                    </Typography>
                  ) : (
                    trades.slice(-5).reverse().map((trade, i) => (
                      <Box 
                        key={i} 
                        sx={{ 
                          mb: 1, 
                          p: 1, 
                          backgroundColor: colors.panelBg, 
                          borderRadius: '8px',
                          border: `1px solid ${colors.borderColor}`
                        }}
                      >
                        <Typography variant="caption" sx={{ color: colors.secondaryText, display: 'flex', justifyContent: 'space-between' }}>
                          <span>{formatTime(trade.time)}</span>
                          <span>{trade.type.toUpperCase()} {trade.pair}</span>
                        </Typography>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography variant="body2" sx={{ color: colors.secondaryText }}>
                            {trade.price.toFixed(5)} → {trade.exitPrice.toFixed(5)}
                          </Typography>
                          <Typography 
                            variant="body2" 
                            sx={{ 
                              color: trade.pnl >= 0 ? colors.profitGreen : colors.lossRed,
                              fontWeight: 'bold'
                            }}
                          >
                            ${trade.pnl.toFixed(2)}
                          </Typography>
                        </Box>
                      </Box>
                    ))
                  )}
                </Box>
                
                <Button 
                  variant="outlined"
                  size="small"
                  onClick={() => {
                    // This would be where we'd save the simulation to the database
                    // For now, we'll just clear the trades
                    alert(`Simulation complete! Profit/Loss: $${(totalBalance - simulationAmount).toFixed(2)}`);
                    setTrades([]);
                  }}
                  sx={{
                    mt: 2,
                    borderColor: colors.accentBlue,
                    color: colors.accentBlue,
                    '&:hover': {
                      borderColor: colors.accentBlue,
                      backgroundColor: `${colors.accentBlue}20`
                    }
                  }}
                >
                  Save Simulation
                </Button>
              </Paper>
            </Box>
          </>
        )}
      </Box>
    </Box>
  );
};

export default Trade;