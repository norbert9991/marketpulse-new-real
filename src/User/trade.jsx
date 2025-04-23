import React, { useState, useEffect, useRef, useContext } from 'react';
import { Box, Typography, Button, Paper, TextField, Select, MenuItem, FormControl, InputLabel, Tabs, Tab, Grid, Divider, IconButton, Chip, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Switch, Tooltip, Container, Card, CardContent, CircularProgress, Backdrop, Snackbar, Alert } from '@mui/material';
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
import { useNavigate } from 'react-router-dom';

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
  const navigate = useNavigate();
  const [userState, setUserState] = useState(null);
  
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

  // Add state variables for the moving average values
  const [fastMAValues, setFastMAValues] = useState([]);
  const [slowMAValues, setSlowMAValues] = useState([]);

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

  // Add tutorial state
  const [showTutorial, setShowTutorial] = useState(false);
  const [tutorialStep, setTutorialStep] = useState(1);
  const maxTutorialSteps = 7;

  // Tutorial component
  const TutorialOverlay = () => {
    // Tutorial content for each step
    const tutorialContent = [
      {
        title: "Welcome to Trading Simulation!",
        content: "This short tutorial will guide you through the basics of using the trading simulator. Click 'Next' to continue or 'Skip' to exit the tutorial.",
        position: { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }
      },
      {
        title: "Chart Overview",
        content: "This is your price chart. It shows the historical and current price movements of your selected currency pair. You can switch between candlestick and line views using the controls at the top.",
        position: { top: '30%', left: '50%', transform: 'translate(-50%, -50%)' }
      },
      {
        title: "Technical Indicators",
        content: "Below the chart are technical indicators like RSI and MACD that help you analyze price movements. These can signal potential buy or sell opportunities.",
        position: { top: '70%', left: '50%', transform: 'translate(-50%, -50%)' }
      },
      {
        title: "Market Orders",
        content: "Use the Market tab to place immediate buy or sell orders at the current market price. Select your amount and leverage, then click the buy or sell button.",
        position: { top: '50%', left: '25%', transform: 'translate(-50%, -50%)' }
      },
      {
        title: "Limit & Stop Orders",
        content: "Use the Limit/Stop tab to set orders that execute when the price reaches a specific level. Limit orders are used to buy low or sell high, while stop orders help manage risk.",
        position: { top: '50%', left: '25%', transform: 'translate(-50%, -50%)' }
      },
      {
        title: "Account Summary",
        content: "The right panel shows your account balance, open positions, and trading history. Monitor your profits and losses here.",
        position: { top: '30%', right: '20%', transform: 'translate(0, -50%)' }
      },
      {
        title: "Ready to Trade!",
        content: "You're all set to start trading! Remember this is a simulation, so feel free to experiment with different strategies without any real financial risk.",
        position: { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }
      }
    ];

    const currentTutorial = tutorialContent[tutorialStep - 1];

    return (
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          zIndex: 9999,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <Paper
          sx={{
            position: 'absolute',
            maxWidth: 400,
            p: 3,
            backgroundColor: colors.cardBg,
            border: `1px solid ${colors.borderColor}`,
            borderRadius: '12px',
            boxShadow: `0 8px 24px rgba(0, 0, 0, 0.5)`,
            ...currentTutorial.position
          }}
        >
          <Typography variant="h6" sx={{ color: colors.primaryText, mb: 2, display: 'flex', alignItems: 'center' }}>
            <BarChartIcon sx={{ mr: 1, color: colors.accentBlue }} />
            {currentTutorial.title}
          </Typography>
          <Typography sx={{ color: colors.secondaryText, mb: 3 }}>
            {currentTutorial.content}
          </Typography>
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Button
              variant="text"
              onClick={() => setShowTutorial(false)}
              sx={{ color: colors.secondaryText }}
            >
              {tutorialStep === maxTutorialSteps ? 'Close' : 'Skip'}
            </Button>
            <Box>
              {tutorialStep > 1 && (
                <Button
                  variant="outlined"
                  onClick={() => setTutorialStep(prev => prev - 1)}
                  sx={{ mr: 1, borderColor: colors.borderColor, color: colors.primaryText }}
                >
                  Back
                </Button>
              )}
              {tutorialStep < maxTutorialSteps ? (
                <Button
                  variant="contained"
                  onClick={() => setTutorialStep(prev => prev + 1)}
                  sx={{ backgroundColor: colors.accentBlue }}
                >
                  Next
                </Button>
              ) : (
                <Button
                  variant="contained"
                  onClick={() => setShowTutorial(false)}
                  sx={{ backgroundColor: colors.accentBlue }}
                >
                  Start Trading
                </Button>
              )}
            </Box>
          </Box>
        </Paper>
      </Box>
    );
  };

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
  }, [step, showIndicators, chartType]);

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
        setFastMAValues([...fastMAValues]);
      }
      
      if (priceHistory.length >= slowMAPeriod) {
        const slowMA = priceHistory.slice(-slowMAPeriod).reduce((a, b) => a + b, 0) / slowMAPeriod;
        slowMAValues.push(slowMA);
        if (slowMAValues.length > 100) slowMAValues.shift();
        setSlowMAValues([...slowMAValues]);
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
    
    // Start live updates with faster refresh for short-term trading
    intervalId = setInterval(generateData, 500); // 500ms updates for more responsive short-term trading
    
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
      console.log("Adding order to open orders:", newOrder);
      setOpenOrders(prev => [...prev, newOrder]);
      
      // Show confirmation
      alert(`${newOrder.type.toUpperCase()} ${newOrder.direction.toUpperCase()} order placed at ${newOrder.price.toFixed(5)}`);
    }
    
    // Reset pending order form
    setPendingOrder({
      type: 'limit',
      price: currentPrice, // Set default to current price
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

  // Add a useEffect to set price when currentPrice changes or when switching to limit/stop tab
  useEffect(() => {
    if (currentPrice && activeTradingTab === 1) {
      setPendingOrder(prev => ({
        ...prev,
        price: currentPrice
      }));
    }
  }, [currentPrice, activeTradingTab]);

  // Make sure we update pendingOrder when switching tabs
  const handleTabChange = (event, newValue) => {
    setActiveTradingTab(newValue);
    
    // When switching to limit/stop tab, initialize with current price
    if (newValue === 1 && currentPrice) {
      setPendingOrder(prev => ({
        ...prev,
        price: currentPrice
      }));
    }
  };

  // Add tooltip components to make chart section more beginner-friendly
  const renderTooltip = (content) => {
    return (
      <Tooltip
        title={content}
        arrow
        placement="top"
        sx={{ 
          '& .MuiTooltip-tooltip': {
            backgroundColor: colors.panelBg,
            color: colors.primaryText,
            border: `1px solid ${colors.borderColor}`,
            fontSize: '0.8rem',
            maxWidth: 300
          }
        }}
      >
        <IconButton 
          size="small"
          sx={{ padding: 0, color: colors.secondaryText }}
        >
          <TrendingUpIcon fontSize="small" />
        </IconButton>
      </Tooltip>
    );
  };

  // Add effect to show tutorial for first-time users
  useEffect(() => {
    if (step === 3 && tradingType === 'short-term') {
      // Check if this is the first time (could use localStorage in a real app)
      const hasSeenTutorial = localStorage.getItem('hasSeenShortTermTutorial');
      if (!hasSeenTutorial) {
        setShowTutorial(true);
        localStorage.setItem('hasSeenShortTermTutorial', 'true');
      }
    }
  }, [step, tradingType]);

  // Add price alert state
  const [priceAlerts, setPriceAlerts] = useState([]);
  const [alertPrice, setAlertPrice] = useState('');
  const [alertActive, setAlertActive] = useState(false);
  const audioRef = useRef(null);
  
  // Quick-trade preset amounts
  const quickAmounts = [100, 500, 1000, 5000];
  
  // Function to add price alert
  const addPriceAlert = () => {
    if (!alertPrice) return;
    
    const newAlert = {
      id: Date.now(),
      price: parseFloat(alertPrice),
      created: new Date().toISOString()
    };
    
    setPriceAlerts(prev => [...prev, newAlert]);
    setAlertPrice('');
    setAlertActive(true);
  };

  // Function to remove price alert
  const removeAlert = (id) => {
    setPriceAlerts(prev => prev.filter(alert => alert.id !== id));
    if (priceAlerts.length <= 1) {
      setAlertActive(false);
    }
  };

  // Check for price alerts
  useEffect(() => {
    if (!currentPrice || !alertActive || priceAlerts.length === 0) return;
    
    priceAlerts.forEach(alert => {
      const prevPrice = priceData[priceData.length - 2]?.close;
      if (prevPrice && currentPrice) {
        // Alert when price crosses the alert level
        if ((prevPrice < alert.price && currentPrice >= alert.price) || 
            (prevPrice > alert.price && currentPrice <= alert.price)) {
          // Play sound
          if (audioRef.current) {
            audioRef.current.play().catch(e => console.log("Audio play prevented:", e));
          }
          // Show notification
          const direction = prevPrice < alert.price ? "above" : "below";
          const message = `Price Alert: ${selectedPair} is now ${direction} ${alert.price.toFixed(5)}`;
          
          // Browser notification if supported
          if (Notification.permission === "granted") {
            new Notification("MarketPulse Price Alert", { body: message });
          }
          
          // Alert dialog
          alert(message);
        }
      }
    });
  }, [currentPrice, priceAlerts, alertActive, selectedPair, priceData]);

  // Function for quick trade with preset amount
  const quickTrade = (amount, isBuy) => {
    if (!currentPrice) return;
    
    if (availableBalance < amount) {
      alert("Not enough available balance!");
      return;
    }

    const trade = {
      pair: selectedPair,
      type: isBuy ? 'buy' : 'sell',
      orderType: 'market',
      amount,
      leverage,
      price: currentPrice,
      marginUsed: amount,
      time: new Date().toISOString(),
    };

    setPosition(trade);
    setAvailableBalance(prev => prev - amount);
    setLockedMargin(amount);
    setIsBuying(isBuy);
  };

  // Long-term trading state
  const [strategies, setStrategies] = useState([
    { 
      id: 1, 
      name: 'Triumph', 
      totalNetPL: 121, 
      oneYearNetPL: 121, 
      allocatedFunds: 0, 
      copyRatio: 0,
      performanceData: Array.from({length: 30}, (_, i) => ({
        x: new Date(Date.now() - (30-i) * 24 * 60 * 60 * 1000),
        y: 10000 * (1 + 0.121 * (i/30))
      }))
    },
    { 
      id: 2, 
      name: 'Legacy', 
      totalNetPL: 538, 
      oneYearNetPL: 102, 
      allocatedFunds: 0, 
      copyRatio: 0,
      performanceData: Array.from({length: 30}, (_, i) => ({
        x: new Date(Date.now() - (30-i) * 24 * 60 * 60 * 1000),
        y: 10000 * (1 + 0.538 * (i/30))
      }))
    },
    { 
      id: 3, 
      name: 'Alpine', 
      totalNetPL: 317, 
      oneYearNetPL: 77, 
      allocatedFunds: 0, 
      copyRatio: 0,
      performanceData: Array.from({length: 30}, (_, i) => ({
        x: new Date(Date.now() - (30-i) * 24 * 60 * 60 * 1000),
        y: 10000 * (1 + 0.317 * (i/30))
      }))
    },
    { 
      id: 4, 
      name: 'Ivory', 
      totalNetPL: 125, 
      oneYearNetPL: -13, 
      allocatedFunds: 0, 
      copyRatio: 0,
      performanceData: Array.from({length: 30}, (_, i) => ({
        x: new Date(Date.now() - (30-i) * 24 * 60 * 60 * 1000),
        y: 10000 * (1 + 0.125 * (i/30))
      }))
    },
    { 
      id: 5, 
      name: 'Quantum', 
      totalNetPL: 87, 
      oneYearNetPL: 24, 
      allocatedFunds: 0, 
      copyRatio: 0,
      performanceData: Array.from({length: 30}, (_, i) => ({
        x: new Date(Date.now() - (30-i) * 24 * 60 * 60 * 1000),
        y: 10000 * (1 + 0.087 * (i/30))
      }))
    }
  ]);
  
  const [simulationPeriod, setSimulationPeriod] = useState('1 Year');
  const [simulationResults, setSimulationResults] = useState(null);
  
  // Calculate total allocated funds
  const totalAllocatedFunds = strategies.reduce((sum, strategy) => sum + (strategy.allocatedFunds || 0), 0);
  
  // Handle allocation change
  const handleAllocationChange = (index, value) => {
    const numValue = parseFloat(value) || 0;
    const newStrategies = [...strategies];
    
    // Don't allow negative values or values that exceed available balance
    if (numValue < 0 || totalAllocatedFunds - newStrategies[index].allocatedFunds + numValue > availableBalance) {
      return;
    }
    
    newStrategies[index].allocatedFunds = numValue;
    
    // Automatically update copy ratio based on allocation percentage
    if (numValue > 0) {
      newStrategies[index].copyRatio = Math.max(1, Math.round((numValue / availableBalance) * 10));
    } else {
      newStrategies[index].copyRatio = 0;
    }
    
    setStrategies(newStrategies);
  };
  
  // Handle copy ratio change (kept for compatibility, but not used with the slider interface)
  const handleCopyRatioChange = (index, value) => {
    const numValue = parseInt(value) || 0;
    
    // Don't allow negative values or values over 10
    if (numValue < 0 || numValue > 10) {
      return;
    }
    
    const newStrategies = [...strategies];
    newStrategies[index].copyRatio = numValue;
    setStrategies(newStrategies);
  };
  
  // Start simulation
  const startSimulation = () => {
    // Only include strategies with allocated funds
    const selectedStrategies = strategies.filter(strategy => 
      strategy.allocatedFunds > 0
    );
    
    if (selectedStrategies.length === 0) {
      alert('Please allocate funds to at least one strategy.');
      return;
    }
    
    // Generate simulation results
    const startBalance = availableBalance;
    const endBalance = startBalance * 1.121; // 12.1% increase
    const totalTrades = 3573;
    const months = 12;
    
    // Generate monthly data
    const monthlyData = Array.from({length: months}, (_, i) => {
      const month = new Date();
      month.setMonth(month.getMonth() - (months - i - 1));
      
      return {
        date: month,
        balance: startBalance + ((endBalance - startBalance) * ((i+1) / months)),
        profit: ((endBalance - startBalance) / months).toFixed(2),
        trades: Math.floor(totalTrades / months)
      };
    });
    
    // Generate symbol performance
    const symbols = [
      { symbol: 'EURUSD', trades: 1246, winRate: 60, pl: 5380.00, weight: 44.8 },
      { symbol: 'EURJPY', trades: 854, winRate: 62, pl: 3840.00, weight: 32.0 },
      { symbol: 'GBPUSD', trades: 564, winRate: 58.5, pl: 580.00, weight: 4.8 },
      { symbol: 'EURNZD', trades: 432, winRate: 57.8, pl: 390.00, weight: 3.3 },
      { symbol: 'EURCAD', trades: 230, winRate: 60.8, pl: 947.07, weight: 7.9 },
      { symbol: 'EURCHF', trades: 95, winRate: 54.7, pl: 670.00, weight: 5.5 },
      { symbol: 'AUDUSD', trades: 152, winRate: 52.6, pl: 290.00, weight: 2.4 }
    ];
    
    setSimulationResults({
      startingBalance: startBalance,
      endingBalance: endBalance,
      totalProfit: endBalance - startBalance,
      profitPercentage: ((endBalance - startBalance) / startBalance * 100).toFixed(2),
      totalTrades,
      winRate: 61.5,
      monthlyData,
      symbols,
      insights: [
        'Alpine was the best performing in this simulation with 12.10% Net P/L',
        'Triumph achieved 14.37% Net P/L over 1y but was not in the simulation',
        'Alpine achieved a better result of 12.26% Net P/L over 6m'
      ]
    });
    
    setStep(4);
  };
  
  // Reset simulation
  const resetSimulation = () => {
    setSimulationResults(null);
    setStrategies(strategies.map(strategy => ({
      ...strategy,
      allocatedFunds: 0,
      copyRatio: 0
    })));
    setStep(3);
  };

  return (
    <div className="trade-container">
      <Sidebar activePage="Trading" />
      <div className="main-content">
        <Container>
          <Typography variant="h4" component="h1" className="page-title">
            Trading Simulation
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card className="tool-card">
                <CardContent>
                  <Typography variant="h5" component="h2" gutterBottom>
                    Long-Term Trading
                  </Typography>
                  <Typography variant="body1" paragraph>
                    Simulate long-term trading strategies based on fundamental analysis and technical indicators.
                    Set up a portfolio and track performance over time.
                  </Typography>
                  <Button
                    variant="contained"
                    color="primary"
                    className="action-button"
                    onClick={() => setActiveView("longTerm")}
                  >
                    Access Long-Term Trading
                  </Button>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Card className="tool-card">
                <CardContent>
                  <Typography variant="h5" component="h2" gutterBottom>
                    Short-Term Trading
                  </Typography>
                  <Typography variant="body1" paragraph>
                    Execute spot trading with different order types including market, limit, and stop-limit orders.
                    Track your orders and trade history in real-time.
                  </Typography>
                  <Button
                    variant="contained"
                    color="primary"
                    className="action-button"
                    onClick={() => navigate("/short-term-trading")}
                  >
                    Access Short-Term Trading
                  </Button>
                </CardContent>
              </Card>
            </Grid>
            
            {/* ... existing code ... */}
          </Grid>
          
          {/* ... existing code ... */}
        </Container>
      </div>
      {/* ... existing code ... */}
    </div>
  );
};

export default Trade;