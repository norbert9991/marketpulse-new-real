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
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import { alpha } from '@mui/material/styles';

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
    <Box sx={{ display: 'flex', minHeight: '100vh', backgroundColor: colors.darkBg }}>
      <Sidebar />
      
      <Box sx={{ flex: 1, p: 3, overflow: 'auto', ml: '250px', position: 'relative' }}>
        {showTutorial && <TutorialOverlay />}
        
        {step === 1 && (
          // Step 1: Set simulation amount
          <Box sx={{ maxWidth: '800px', mx: 'auto', mt: 5 }}>
            <Paper 
              sx={{ 
                p: 4, 
                backgroundColor: colors.cardBg,
                border: `1px solid ${colors.borderColor}`,
                borderRadius: '16px',
                boxShadow: `0 12px 24px ${colors.shadowColor}`,
              }}
            >
        <Typography 
          variant="h4" 
          sx={{ 
            color: colors.primaryText,
            fontWeight: 'bold',
                  mb: 1,
                  textAlign: 'center'
          }}
        >
                Set Your Simulation Amount
        </Typography>
        
              <Typography 
                variant="body1" 
              sx={{ 
                  color: colors.secondaryText,
                  mb: 4,
                  textAlign: 'center'
                }}
              >
                Choose how much virtual capital you want to start with
              </Typography>
              
              <Box sx={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 4 }}>
              <Typography 
                  variant="h3" 
                sx={{ 
                    color: colors.accentBlue,
                  fontWeight: 'bold',
                    mb: 2,
                    textShadow: '0 2px 8px rgba(33, 150, 243, 0.3)'
                }}
              >
                  ${simulationAmount.toLocaleString()}
              </Typography>
              
                <Box sx={{ width: '100%', px: 4, position: 'relative', mt: 2 }}>
                  {/* Progress fill effect */}
                  <Box sx={{ 
                    position: 'absolute', 
                    top: '50%', 
                    left: 40, 
                    right: 40, 
                    height: '6px', 
                    transform: 'translateY(-50%)',
                    backgroundColor: colors.borderColor,
                    borderRadius: '3px',
                  }} />
                  
                  <Box sx={{ 
                    position: 'absolute', 
                    top: '50%', 
                    left: 40, 
                    width: `${(simulationAmount - 1000) / 990}%`,
                    height: '6px', 
                    transform: 'translateY(-50%)',
                    background: `linear-gradient(90deg, ${colors.accentBlue}, ${colors.buyGreen})`,
                    borderRadius: '3px',
                    transition: 'width 0.3s ease'
                  }} />
                  
                  <input
                    type="range"
                    min="1000"
                    max="100000"
                    step="1000"
                    value={simulationAmount}
                    onChange={(e) => setSimulationAmount(parseFloat(e.target.value))}
                    style={{ 
                      width: '100%',
                      height: '24px',
                      appearance: 'none',
                      background: 'transparent',
                      cursor: 'pointer',
                      position: 'relative',
                      zIndex: 2
                    }}
                  />
                  <style jsx>{`
                    input[type=range] {
                      -webkit-appearance: none;
                      margin: 0;
                    }
                    input[type=range]:focus {
                      outline: none;
                    }
                    input[type=range]::-webkit-slider-thumb {
                      -webkit-appearance: none;
                      height: 22px;
                      width: 22px;
                      border-radius: 50%;
                      background: ${colors.accentBlue};
                      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
                      cursor: pointer;
                      margin-top: -8px;
                    }
                    input[type=range]::-moz-range-thumb {
                      height: 22px;
                      width: 22px;
                      border-radius: 50%;
                      background: ${colors.accentBlue};
                      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
                      cursor: pointer;
                      border: none;
                    }
                    input[type=range]::-ms-thumb {
                      height: 22px;
                      width: 22px;
                      border-radius: 50%;
                      background: ${colors.accentBlue};
                      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
                      cursor: pointer;
                    }
                    input[type=range]::-webkit-slider-runnable-track {
                      height: 6px;
                      cursor: pointer;
                      background: transparent;
                      border-radius: 3px;
                    }
                    input[type=range]::-moz-range-track {
                      height: 6px;
                      cursor: pointer;
                      background: transparent;
                      border-radius: 3px;
                    }
                    input[type=range]::-ms-track {
                      height: 6px;
                      cursor: pointer;
                      background: transparent;
                      border-radius: 3px;
                    }
                  `}</style>
                </Box>
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', px: 4, mt: 1 }}>
                  <Typography variant="body2" sx={{ color: colors.secondaryText }}>$1,000</Typography>
                  <Typography variant="body2" sx={{ color: colors.secondaryText }}>$100,000</Typography>
                </Box>
              </Box>
              
              {/* Preset Buttons */}
              <Typography variant="subtitle2" sx={{ color: colors.primaryText, mb: 2, textAlign: 'center' }}>
                Popular Starting Amounts
              </Typography>
              
              <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mb: 5, flexWrap: 'wrap' }}>
                {[5000, 10000, 25000, 50000].map(amount => (
                  <Button 
                    key={amount}
                    variant={simulationAmount === amount ? "contained" : "outlined"}
                    onClick={() => setSimulationAmount(amount)}
                    sx={{ 
                        borderColor: colors.borderColor,
                      color: simulationAmount === amount ? colors.primaryText : colors.secondaryText,
                      backgroundColor: simulationAmount === amount ? colors.accentBlue : 'transparent',
                      '&:hover': {
                        backgroundColor: simulationAmount === amount ? colors.accentBlue : colors.panelBg,
                        borderColor: colors.accentBlue,
                      },
                      transition: 'all 0.2s ease',
                      minWidth: '100px'
                    }}
                  >
                    ${amount.toLocaleString()}
                  </Button>
                ))}
              </Box>
              
              {/* Risk Level Indicator */}
              <Box sx={{ mb: 4, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <Typography variant="subtitle2" sx={{ color: colors.primaryText, mb: 1 }}>
                  Suggested Risk Level
                </Typography>
                
                <Box sx={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center', 
                  width: '100%', 
                  maxWidth: '500px',
                  px: 2
                }}>
                  <Box sx={{ textAlign: 'center', flex: 1 }}>
                    <Box sx={{ 
                      height: '8px', 
                      backgroundColor: simulationAmount <= 10000 ? colors.buyGreen : colors.borderColor,
                      borderTopLeftRadius: '4px',
                      borderBottomLeftRadius: '4px',
                      transition: 'background-color 0.3s ease'
                    }} />
                    <Typography variant="caption" sx={{ color: colors.secondaryText, mt: 0.5, display: 'block' }}>
                      Conservative
                    </Typography>
                  </Box>
                  
                  <Box sx={{ textAlign: 'center', flex: 1 }}>
                    <Box sx={{ 
                      height: '8px', 
                      backgroundColor: simulationAmount > 10000 && simulationAmount <= 50000 ? colors.accentBlue : colors.borderColor,
                      transition: 'background-color 0.3s ease'
                    }} />
                    <Typography variant="caption" sx={{ color: colors.secondaryText, mt: 0.5, display: 'block' }}>
                      Moderate
                    </Typography>
                  </Box>
                  
                  <Box sx={{ textAlign: 'center', flex: 1 }}>
                    <Box sx={{ 
                      height: '8px', 
                      backgroundColor: simulationAmount > 50000 ? colors.sellRed : colors.borderColor,
                      borderTopRightRadius: '4px',
                      borderBottomRightRadius: '4px',
                      transition: 'background-color 0.3s ease'
                    }} />
                    <Typography variant="caption" sx={{ color: colors.secondaryText, mt: 0.5, display: 'block' }}>
                      Aggressive
                    </Typography>
                  </Box>
                </Box>
                
                <Typography variant="body2" sx={{ color: colors.secondaryText, mt: 2, textAlign: 'center', maxWidth: '600px' }}>
                  {simulationAmount <= 10000 
                    ? "Perfect for beginners. Practice basic strategies with minimal risk." 
                    : simulationAmount <= 50000 
                      ? "Balanced approach. Good for intermediate traders testing various methods." 
                      : "Advanced simulation. Experience high-stakes trading and complex strategies."}
                </Typography>
              </Box>
              
              <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2 }}>
                <Button 
                  variant="outlined" 
                  color="primary" 
                  size="large"
                  onClick={() => window.history.back()}
                    sx={{ 
                        borderColor: colors.borderColor,
                    color: colors.secondaryText,
                    px: 3,
                    py: 1.5,
                    '&:hover': {
                        borderColor: colors.accentBlue,
                      backgroundColor: 'transparent',
                    }
                  }}
                >
                  Cancel
                </Button>
                
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
                      opacity: 0.9,
                      transform: 'translateY(-2px)',
                      boxShadow: `0 6px 12px rgba(33, 150, 243, 0.3)`
                    },
                    transition: 'all 0.2s ease',
                  }}
                >
                  Start Trading
                </Button>
              </Box>
            </Paper>
          </Box>
        )}
        
        {step === 2 && (
          <Box sx={{ maxWidth: '800px', mx: 'auto', mt: 5 }}>
            <Paper 
                  sx={{
                p: 4, 
                backgroundColor: colors.cardBg,
                border: `1px solid ${colors.borderColor}`,
                borderRadius: '16px',
                boxShadow: `0 12px 24px ${colors.shadowColor}`,
                mb: 4
              }}
            >
              <Typography 
                variant="h4" 
                  sx={{
                  color: colors.primaryText,
                  fontWeight: 'bold',
                  mb: 1,
                  textAlign: 'center'
                }}
              >
                Select Trading Type
              </Typography>
              
              <Typography 
                variant="body1" 
                sx={{ 
                  color: colors.secondaryText,
                  mb: 4,
                  textAlign: 'center'
                }}
              >
                Choose how you want to trade
              </Typography>
              
              <Grid container spacing={3} justifyContent="center">
                <Grid item xs={12} sm={6}>
                  <Paper 
                    onClick={() => {
                      setTradingType('short-term');
                      setStep(3);
                    }}
                    sx={{ 
                      p: 3, 
                      backgroundColor: colors.panelBg,
                      border: `1px solid ${tradingType === 'short-term' ? colors.accentBlue : colors.borderColor}`,
                      borderRadius: '12px',
                      cursor: 'pointer',
                      transition: 'transform 0.2s, box-shadow 0.2s',
                    '&:hover': {
                        transform: 'translateY(-5px)',
                        boxShadow: `0 8px 16px ${colors.shadowColor}`,
                      }
                    }}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
                      <ShowChartIcon 
                        sx={{ 
                          fontSize: 60, 
                          color: colors.accentBlue
                        }} 
                      />
              </Box>
                    <Typography 
                      variant="h5" 
                      sx={{ 
                        color: colors.primaryText,
                        fontWeight: 'bold',
                        mb: 2,
                        textAlign: 'center'
                      }}
                    >
                      Short-Term Trading
                    </Typography>
                    <Typography variant="body2" sx={{ color: colors.secondaryText, textAlign: 'center' }}>
                      Trade actively with direct control over entries and exits. Suitable for day trading and scalping.
                    </Typography>
                  </Paper>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <Paper 
                    onClick={() => {
                      setTradingType('long-term');
                      setStep(3);
                    }}
                    sx={{ 
                      p: 3, 
                      backgroundColor: colors.panelBg,
                      border: `1px solid ${tradingType === 'long-term' ? colors.accentBlue : colors.borderColor}`,
                      borderRadius: '12px',
                      cursor: 'pointer',
                      transition: 'transform 0.2s, box-shadow 0.2s',
                      '&:hover': {
                        transform: 'translateY(-5px)',
                        boxShadow: `0 8px 16px ${colors.shadowColor}`,
                      }
                    }}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
                      <BarChartIcon 
                        sx={{ 
                          fontSize: 60, 
                          color: colors.accentBlue
                        }} 
                      />
                    </Box>
                    <Typography 
                      variant="h5" 
                    sx={{ 
                      color: colors.primaryText,
                        fontWeight: 'bold',
                        mb: 2,
                        textAlign: 'center'
                      }}
                    >
                      Long-Term Strategy
                    </Typography>
                    <Typography variant="body2" sx={{ color: colors.secondaryText, textAlign: 'center' }}>
                      Allocate funds to proven trading strategies. Ideal for passive investing with algorithmic trading.
                    </Typography>
                  </Paper>
                </Grid>
              </Grid>
            </Paper>
          </Box>
        )}
        {step === 4 && tradingType === 'long-term' && simulationResults && (
          <Box sx={{ maxWidth: '1200px', mx: 'auto', mt: 5 }}>
            <Paper 
              sx={{ 
                p: 4, 
                backgroundColor: colors.cardBg,
                border: `1px solid ${colors.borderColor}`,
                borderRadius: '16px',
                boxShadow: `0 12px 24px ${colors.shadowColor}`,
                mb: 4
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                <Typography 
                  variant="h4" 
                  sx={{ 
                    color: colors.primaryText,
                    fontWeight: 'bold'
                  }}
                >
                  Simulation Results
                </Typography>
                
                <Box>
                  <Button 
                    variant="contained" 
                    onClick={resetSimulation}
                    sx={{
                      backgroundColor: colors.accentBlue,
                      '&:hover': {
                        backgroundColor: colors.accentBlue,
                        opacity: 0.9,
                      }
                    }}
                  >
                    NEW SIMULATION
                  </Button>
                </Box>
              </Box>

              {/* Simulation Results Section */}
              {simulationResults && (
                <Box sx={{ 
                  p: 3, 
                  backgroundColor: colors.panelBackground, 
                  borderRadius: '10px',
                  width: '100%',
                  mt: 2
                }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                    <Typography variant="h5" sx={{ fontWeight: 'bold', color: colors.primaryText }}>
                      Simulation Results
                    </Typography>
                    <Button
                      variant="contained"
                      onClick={resetSimulation}
                      sx={{
                        backgroundColor: colors.accentBlue,
                        '&:hover': { backgroundColor: alpha(colors.accentBlue, 0.9) },
                        fontWeight: 'bold',
                        borderRadius: '5px',
                        textTransform: 'uppercase'
                      }}
                    >
                      NEW SIMULATION
                    </Button>
                  </Box>

                  {/* Main panels container */}
                  <Grid container spacing={2}>
                    {/* Balance Panel */}
                    <Grid item xs={12} md={4}>
                      <Box sx={{ 
                        backgroundColor: alpha(colors.borderColor, 0.2), 
                        borderRadius: '10px',
                        p: 2,
                        height: '100%',
                        border: `1px dashed ${colors.borderColor}`
                      }}>
                        <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1, color: colors.primaryText }}>
                          Balance
                        </Typography>
                        
                        {/* Balance Chart */}
                        <Box sx={{ height: '180px', position: 'relative', mb: 2 }}>
                          <svg width="100%" height="100%" viewBox="0 0 350 180" preserveAspectRatio="none">
                            <defs>
                              <linearGradient id="balanceGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                                <stop offset="0%" stopColor={colors.accentBlue} stopOpacity="0.4" />
                                <stop offset="100%" stopColor={colors.accentBlue} stopOpacity="0.05" />
                              </linearGradient>
                            </defs>
                            
                            {/* Gradient background */}
                            <path
                              d={`M0,180 L0,100 C70,80 140,120 210,90 C280,60 350,70 350,70 L350,180 Z`}
                              fill="url(#balanceGradient)"
                            />
                            
                            {/* Line */}
                            <path
                              d={`M0,100 C70,80 140,120 210,90 C280,60 350,70 350,70`}
                              fill="none"
                              stroke={colors.accentBlue}
                              strokeWidth="3"
                            />
                            
                            {/* Start marker */}
                            <circle cx="0" cy="100" r="4" fill={colors.accentBlue} />
                            <text x="10" y="120" fontSize="14" fill={colors.secondaryText}>$10,000</text>
                            
                            {/* End marker */}
                            <circle cx="350" cy="70" r="4" fill={colors.buyGreen} />
                            <text x="290" y="60" fontSize="14" fill={colors.buyGreen} fontWeight="bold">$11,210</text>
                          </svg>
                        </Box>
                        
                        {/* Balance Details */}
                        <Box sx={{ mt: 1 }}>
                          <Grid container spacing={1}>
                            <Grid item xs={6}>
                              <Typography variant="body2" sx={{ color: colors.secondaryText }}>
                                Starting Balance
                              </Typography>
                            </Grid>
                            <Grid item xs={6}>
                              <Typography variant="body2" sx={{ textAlign: 'right', fontWeight: 'medium', color: colors.primaryText }}>
                                $10,000
                              </Typography>
                            </Grid>
                            
                            <Grid item xs={6}>
                              <Typography variant="body2" sx={{ color: colors.secondaryText }}>
                                Ending Balance
                              </Typography>
                            </Grid>
                            <Grid item xs={6}>
                              <Typography variant="body2" sx={{ textAlign: 'right', fontWeight: 'medium', color: colors.primaryText }}>
                                $11,210
                              </Typography>
                            </Grid>
                            
                            <Grid item xs={6}>
                              <Typography variant="body2" sx={{ color: colors.secondaryText }}>
                                Total Profit
                              </Typography>
                            </Grid>
                            <Grid item xs={6}>
                              <Typography variant="body2" sx={{ textAlign: 'right', fontWeight: 'medium', color: colors.buyGreen }}>
                                $1,210 (12.10%)
                              </Typography>
                            </Grid>
                            
                            <Grid item xs={6}>
                              <Typography variant="body2" sx={{ color: colors.secondaryText }}>
                                Total Trades
                              </Typography>
                            </Grid>
                            <Grid item xs={6}>
                              <Typography variant="body2" sx={{ textAlign: 'right', fontWeight: 'medium', color: colors.primaryText }}>
                                3,573
                              </Typography>
                            </Grid>
                            
                            <Grid item xs={6}>
                              <Typography variant="body2" sx={{ color: colors.secondaryText }}>
                                Win Rate
                              </Typography>
                            </Grid>
                            <Grid item xs={6}>
                              <Typography variant="body2" sx={{ textAlign: 'right', fontWeight: 'medium', color: colors.primaryText }}>
                                61.5%
                              </Typography>
                            </Grid>
                          </Grid>
                        </Box>
                      </Box>
                    </Grid>
                    
                    {/* Monthly P/L Panel */}
                    <Grid item xs={12} md={4}>
                      <Box sx={{ 
                        backgroundColor: alpha(colors.borderColor, 0.2),
                        borderRadius: '10px',
                        p: 2,
                        height: '100%',
                        border: `1px dashed ${colors.borderColor}`
                      }}>
                        <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1, color: colors.primaryText }}>
                          Monthly P/L
                        </Typography>
                        
                        {/* Monthly P/L Chart */}
                        <Box sx={{ height: '180px', position: 'relative', mb: 2 }}>
                          <svg width="100%" height="100%" viewBox="0 0 350 180" preserveAspectRatio="none">
                            {/* X Axis */}
                            <line x1="25" y1="150" x2="325" y2="150" stroke={colors.borderColor} strokeWidth="1" />
                            
                            {/* Months */}
                            {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map((month, i) => (
                              <text 
                                key={month} 
                                x={25 + i * 25} 
                                y="170" 
                                fontSize="10" 
                                fill={colors.secondaryText}
                                textAnchor="middle"
                              >
                                {month}
                              </text>
                            ))}
                            
                            {/* Bars */}
                            <rect x="30" y="110" width="15" height="40" fill={colors.accentBlue} rx="2" />
                            <rect x="55" y="100" width="15" height="50" fill={colors.accentBlue} rx="2" />
                            <rect x="80" y="90" width="15" height="60" fill={colors.accentBlue} rx="2" />
                            <rect x="105" y="80" width="15" height="70" fill={colors.accentBlue} rx="2" />
                            <rect x="130" y="70" width="15" height="80" fill={colors.accentBlue} rx="2" />
                            <rect x="155" y="60" width="15" height="90" fill={colors.accentBlue} rx="2" />
                            <rect x="180" y="60" width="15" height="90" fill={colors.accentBlue} rx="2" />
                            <rect x="205" y="50" width="15" height="100" fill={colors.accentBlue} rx="2" />
                            <rect x="230" y="50" width="15" height="100" fill={colors.accentBlue} rx="2" />
                            <rect x="255" y="40" width="15" height="110" fill={colors.accentBlue} rx="2" />
                            <rect x="280" y="40" width="15" height="110" fill={colors.accentBlue} rx="2" />
                            <rect x="305" y="30" width="15" height="120" fill={colors.accentBlue} rx="2" />
                            
                            {/* Y Axis Values */}
                            <text x="15" y="150" fontSize="10" fill={colors.secondaryText} textAnchor="end">$10</text>
                            <text x="15" y="120" fontSize="10" fill={colors.secondaryText} textAnchor="end">$30</text>
                            <text x="15" y="90" fontSize="10" fill={colors.secondaryText} textAnchor="end">$50</text>
                            <text x="15" y="60" fontSize="10" fill={colors.secondaryText} textAnchor="end">$70</text>
                            <text x="15" y="30" fontSize="10" fill={colors.secondaryText} textAnchor="end">$90</text>
                            <text x="15" y="15" fontSize="10" fill={colors.secondaryText} textAnchor="end">$110</text>
                          </svg>
                        </Box>
                        
                        {/* Monthly P/L Details */}
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                          <Box>
                            <Typography variant="body2" sx={{ color: colors.secondaryText, mb: 0.5 }}>
                              Avg. Monthly P/L
                            </Typography>
                            <Typography variant="h6" sx={{ color: colors.buyGreen, fontWeight: 'bold' }}>
                              $100.83
                            </Typography>
                          </Box>
                          <Box>
                            <Typography variant="body2" sx={{ color: colors.secondaryText, mb: 0.5, textAlign: 'right' }}>
                              Monthly Trades
                            </Typography>
                            <Typography variant="h6" sx={{ color: colors.primaryText, fontWeight: 'bold', textAlign: 'right' }}>
                              298
                            </Typography>
                          </Box>
                        </Box>
                      </Box>
                    </Grid>
                    
                    {/* Simulation Results Details Panel */}
                    <Grid item xs={12} md={4}>
                      <Box sx={{ 
                        backgroundColor: alpha(colors.borderColor, 0.2),
                        borderRadius: '10px',
                        p: 2,
                        height: '100%',
                        border: `1px dashed ${colors.borderColor}`
                      }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                          <Typography variant="h6" sx={{ fontWeight: 'bold', color: colors.primaryText }}>
                            Simulation Results
                          </Typography>
                          <Box sx={{ 
                            backgroundColor: colors.accentBlue, 
                            borderRadius: '4px', 
                            px: 1, 
                            py: 0.5 
                          }}>
                            <Typography variant="caption" sx={{ color: 'white', fontWeight: 'medium' }}>
                              1 Year
                            </Typography>
                          </Box>
                        </Box>
                        
                        {/* Results Details */}
                        <Box sx={{ mt: 2 }}>
                          <Grid container spacing={2}>
                            <Grid item xs={6}>
                              <Typography variant="body2" sx={{ color: colors.secondaryText }}>
                                Starting Balance
                              </Typography>
                              <Typography variant="h6" sx={{ color: colors.primaryText, fontWeight: 'medium' }}>
                                $ 10,000
                              </Typography>
                            </Grid>
                            <Grid item xs={6}>
                              <Typography variant="body2" sx={{ color: colors.secondaryText }}>
                                Ending Balance
                              </Typography>
                              <Typography variant="h6" sx={{ color: colors.primaryText, fontWeight: 'medium' }}>
                                $ 11,210
                              </Typography>
                            </Grid>
                            
                            <Grid item xs={6}>
                              <Typography variant="body2" sx={{ color: colors.secondaryText }}>
                                # Trades
                              </Typography>
                              <Typography variant="h6" sx={{ color: colors.primaryText, fontWeight: 'medium' }}>
                                3,573
                              </Typography>
                            </Grid>
                            <Grid item xs={6}>
                              <Typography variant="body2" sx={{ color: colors.secondaryText }}>
                                Avg Monthly P/L
                              </Typography>
                              <Typography variant="h6" sx={{ color: colors.buyGreen, fontWeight: 'medium' }}>
                                $ 100.83 (1.01%)
                              </Typography>
                            </Grid>
                          </Grid>
                        </Box>
                        
                        {/* Total Profit */}
                        <Box sx={{ mt: 4, mb: 1 }}>
                          <Typography variant="body2" sx={{ color: colors.secondaryText }}>
                            Total Profit
                          </Typography>
                          <Typography variant="h5" sx={{ color: colors.buyGreen, fontWeight: 'bold' }}>
                            $1,210 (12.10%)
                          </Typography>
                        </Box>
                        
                        {/* More Stats Button */}
                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
                          <Button
                            variant="text"
                            sx={{
                              color: colors.accentBlue,
                              textTransform: 'none',
                              fontWeight: 'medium'
                            }}
                          >
                            More Stats
                          </Button>
                        </Box>
                      </Box>
                    </Grid>
                  </Grid>

                  {/* Second row panels container */}
                  <Grid container spacing={2} sx={{ mt: 2 }}>
                    {/* Symbols Panel */}
                    <Grid item xs={12} md={6}>
                      <Box sx={{ 
                        backgroundColor: alpha(colors.borderColor, 0.2),
                        borderRadius: '10px',
                        p: 2,
                        height: '100%',
                        border: `1px dashed ${colors.borderColor}`
                      }}>
                        <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2, color: colors.primaryText }}>
                          Symbols
                        </Typography>
                        
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          {/* Donut Chart */}
                          <Box sx={{ width: '40%' }}>
                            <svg width="100%" height="150" viewBox="0 0 100 100">
                              <circle cx="50" cy="50" r="45" fill="transparent" stroke={colors.borderColor} strokeWidth="1" />
                              
                              {/* Donut segments - add up to 100% */}
                              <circle 
                                cx="50" 
                                cy="50" 
                                r="35" 
                                fill="transparent" 
                                stroke={colors.buyGreen} 
                                strokeWidth="15" 
                                strokeDasharray="137.5 219.8" 
                                strokeDashoffset="0" 
                                transform="rotate(-90 50 50)" 
                              />
                              <circle 
                                cx="50" 
                                cy="50" 
                                r="35" 
                                fill="transparent" 
                                stroke="#3080E8" 
                                strokeWidth="15" 
                                strokeDasharray="82.5 219.8" 
                                strokeDashoffset="-137.5" 
                                transform="rotate(-90 50 50)" 
                              />
                              <circle 
                                cx="50" 
                                cy="50" 
                                r="35" 
                                fill="transparent" 
                                stroke="#FFB746" 
                                strokeWidth="15" 
                                strokeDasharray="18.3 219.8" 
                                strokeDashoffset="-220" 
                                transform="rotate(-90 50 50)" 
                              />
                              <circle 
                                cx="50" 
                                cy="50" 
                                r="35" 
                                fill="transparent" 
                                stroke="#FF6B6B" 
                                strokeWidth="15" 
                                strokeDasharray="13.8 219.8" 
                                strokeDashoffset="-238.3" 
                                transform="rotate(-90 50 50)" 
                              />
                              <circle 
                                cx="50" 
                                cy="50" 
                                r="35" 
                                fill="transparent" 
                                stroke="#9C6EFF" 
                                strokeWidth="15" 
                                strokeDasharray="27.5 219.8" 
                                strokeDashoffset="-252.1" 
                                transform="rotate(-90 50 50)" 
                              />
                              <circle 
                                cx="50" 
                                cy="50" 
                                r="35" 
                                fill="transparent" 
                                stroke="#EBCB37" 
                                strokeWidth="15" 
                                strokeDasharray="20.9 219.8" 
                                strokeDashoffset="-279.6" 
                                transform="rotate(-90 50 50)" 
                              />
                              
                              {/* Center hole */}
                              <circle cx="50" cy="50" r="27" fill={alpha(colors.panelBackground, 0.9)} />
                            </svg>
                          </Box>
                          
                          {/* Symbol List */}
                          <Box sx={{ width: '55%' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                              <Box sx={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: colors.buyGreen, mr: 1 }} />
                              <Typography variant="body2" sx={{ color: colors.primaryText, mr: 1 }}>EURUSD</Typography>
                              <Typography variant="body2" sx={{ color: colors.secondaryText }}>44.5%</Typography>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                              <Box sx={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#3080E8', mr: 1 }} />
                              <Typography variant="body2" sx={{ color: colors.primaryText, mr: 1 }}>EURJPY</Typography>
                              <Typography variant="body2" sx={{ color: colors.secondaryText }}>32%</Typography>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                              <Box sx={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#FFB746', mr: 1 }} />
                              <Typography variant="body2" sx={{ color: colors.primaryText, mr: 1 }}>GBPUSD</Typography>
                              <Typography variant="body2" sx={{ color: colors.secondaryText }}>4.3%</Typography>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                              <Box sx={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#FF6B6B', mr: 1 }} />
                              <Typography variant="body2" sx={{ color: colors.primaryText, mr: 1 }}>EURNZD</Typography>
                              <Typography variant="body2" sx={{ color: colors.secondaryText }}>3.3%</Typography>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                              <Box sx={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#9C6EFF', mr: 1 }} />
                              <Typography variant="body2" sx={{ color: colors.primaryText, mr: 1 }}>EURCAD</Typography>
                              <Typography variant="body2" sx={{ color: colors.secondaryText }}>7.9%</Typography>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <Box sx={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#EBCB37', mr: 1 }} />
                              <Typography variant="body2" sx={{ color: colors.primaryText, mr: 1 }}>EURCHF</Typography>
                              <Typography variant="body2" sx={{ color: colors.secondaryText }}>8.0%</Typography>
                            </Box>
                          </Box>
                        </Box>
                      </Box>
                    </Grid>
                    
                    {/* Symbols P/L Panel */}
                    <Grid item xs={12} md={6}>
                      <Box sx={{ 
                        backgroundColor: alpha(colors.borderColor, 0.2),
                        borderRadius: '10px',
                        p: 2,
                        height: '100%',
                        border: `1px dashed ${colors.borderColor}`
                      }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                          <Typography variant="h6" sx={{ fontWeight: 'bold', color: colors.primaryText }}>
                            Symbols P/L
                          </Typography>
                          <Button
                            variant="text"
                            size="small"
                            sx={{
                              color: colors.accentBlue,
                              textTransform: 'none',
                              fontWeight: 'medium'
                            }}
                          >
                            All Symbols
                          </Button>
                        </Box>
                        
                        {/* Symbol P/L Chart */}
                        <Box sx={{ height: '150px', mt: 1 }}>
                          <svg width="100%" height="100%" viewBox="0 0 380 150" preserveAspectRatio="none">
                            {/* X Axis */}
                            <line x1="30" y1="120" x2="370" y2="120" stroke={colors.borderColor} strokeWidth="1" />
                            
                            {/* Bars */}
                            <g>
                              <rect x="45" y="40" width="30" height="80" fill={colors.buyGreen} rx="2" />
                              <text x="60" y="135" fontSize="10" fill={colors.secondaryText} textAnchor="middle">EURUSD</text>
                              <text x="60" y="35" fontSize="10" fill={colors.buyGreen} textAnchor="middle">+$530</text>
                            </g>
                            
                            <g>
                              <rect x="95" y="50" width="30" height="70" fill={colors.buyGreen} rx="2" />
                              <text x="110" y="135" fontSize="10" fill={colors.secondaryText} textAnchor="middle">EURJPY</text>
                              <text x="110" y="45" fontSize="10" fill={colors.buyGreen} textAnchor="middle">+$380</text>
                            </g>
                            
                            <g>
                              <rect x="145" y="90" width="30" height="30" fill={colors.buyGreen} rx="2" />
                              <text x="160" y="135" fontSize="10" fill={colors.secondaryText} textAnchor="middle">GBPUSD</text>
                              <text x="160" y="85" fontSize="10" fill={colors.buyGreen} textAnchor="middle">+$260</text>
                            </g>
                            
                            <g>
                              <rect x="195" y="80" width="30" height="40" fill={colors.buyGreen} rx="2" />
                              <text x="210" y="135" fontSize="10" fill={colors.secondaryText} textAnchor="middle">EURNZD</text>
                              <text x="210" y="75" fontSize="10" fill={colors.buyGreen} textAnchor="middle">+$300</text>
                            </g>
                            
                            <g>
                              <rect x="245" y="75" width="30" height="45" fill={colors.buyGreen} rx="2" />
                              <text x="260" y="135" fontSize="10" fill={colors.secondaryText} textAnchor="middle">EURCAD</text>
                              <text x="260" y="70" fontSize="10" fill={colors.buyGreen} textAnchor="middle">+$347</text>
                            </g>
                            
                            <g>
                              <rect x="295" y="85" width="30" height="35" fill={colors.buyGreen} rx="2" />
                              <text x="310" y="135" fontSize="10" fill={colors.secondaryText} textAnchor="middle">EURCHF</text>
                              <text x="310" y="80" fontSize="10" fill={colors.buyGreen} textAnchor="middle">+$270</text>
                            </g>
                            
                            <g>
                              <rect x="345" y="85" width="30" height="35" fill={colors.buyGreen} rx="2" />
                              <text x="360" y="135" fontSize="10" fill={colors.secondaryText} textAnchor="middle">AUDUSD</text>
                              <text x="360" y="80" fontSize="10" fill={colors.buyGreen} textAnchor="middle">+$260</text>
                            </g>
                          </svg>
                        </Box>
                      </Box>
                    </Grid>
                  </Grid>

                  {/* Insights Panel */}
                  <Grid container spacing={2} sx={{ mt: 2 }}>
                    <Grid item xs={12}>
                      <Box sx={{ 
                        backgroundColor: alpha(colors.borderColor, 0.2),
                        borderRadius: '10px',
                        p: 2,
                        border: `1px dashed ${colors.borderColor}`
                      }}>
                        <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2, color: colors.primaryText }}>
                          Insights
                        </Typography>
                        
                        <Grid container spacing={2}>
                          <Grid item xs={12} md={4}>
                            <Box sx={{ 
                              p: 1.5, 
                              backgroundColor: alpha(colors.panelBackground, 0.5),
                              borderRadius: '5px',
                              borderLeft: `4px solid ${colors.buyGreen}`
                            }}>
                              <Typography variant="body2" sx={{ color: colors.primaryText, fontWeight: 'medium' }}>
                                EURUSD was your best performing pair with +$530 profit
                              </Typography>
                            </Box>
                          </Grid>
                          <Grid item xs={12} md={4}>
                            <Box sx={{ 
                              p: 1.5, 
                              backgroundColor: alpha(colors.panelBackground, 0.5),
                              borderRadius: '5px',
                              borderLeft: `4px solid ${colors.accentBlue}`
                            }}>
                              <Typography variant="body2" sx={{ color: colors.primaryText, fontWeight: 'medium' }}>
                                You had 61.5% winning trades and a profit factor of 1.8
                              </Typography>
                            </Box>
                          </Grid>
                          <Grid item xs={12} md={4}>
                            <Box sx={{ 
                              p: 1.5, 
                              backgroundColor: alpha(colors.panelBackground, 0.5),
                              borderRadius: '5px',
                              borderLeft: `4px solid ${colors.warningYellow}`
                            }}>
                              <Typography variant="body2" sx={{ color: colors.primaryText, fontWeight: 'medium' }}>
                                Average trade duration was 3.2 days with max drawdown of 3.4%
                              </Typography>
                            </Box>
                          </Grid>
                        </Grid>
                      </Box>
                    </Grid>
                  </Grid>
                </Box>
              )}
            </Paper>
          </Box>
        )}
        {step === 3 && tradingType === 'long-term' && (
          <Box sx={{ maxWidth: '1200px', mx: 'auto', mt: 5 }}>
            <Paper 
              sx={{ 
                p: 4, 
                backgroundColor: colors.cardBg,
                border: `1px solid ${colors.borderColor}`,
                borderRadius: '16px',
                boxShadow: `0 12px 24px ${colors.shadowColor}`,
                mb: 4
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
            <Typography 
                  variant="h4" 
                  sx={{ 
                    color: colors.primaryText,
                    fontWeight: 'bold'
                  }}
                >
                  Long-Term Strategy Allocation
            </Typography>
                
                <Box>
                  <Button 
                    variant="outlined"
                    onClick={() => setStep(2)}
                  sx={{ 
                      borderColor: colors.borderColor,
                      color: colors.secondaryText,
                      mr: 2,
                      '&:hover': {
                        borderColor: colors.accentBlue,
                        backgroundColor: 'transparent',
                      }
                    }}
                  >
                    Back
                  </Button>
                  
                  <Button 
                    variant="contained"
                    onClick={startSimulation}
                    disabled={strategies.filter(s => s.allocatedFunds > 0 && s.copyRatio > 0).length === 0}
                    sx={{
                      backgroundColor: colors.accentBlue,
                      '&:hover': {
                        backgroundColor: colors.accentBlue,
                        opacity: 0.9,
                      },
                      '&.Mui-disabled': {
                        backgroundColor: colors.borderColor,
                        color: colors.secondaryText
                      }
                    }}
                  >
                    Run Simulation
                  </Button>
                </Box>
              </Box>
              
              <Box sx={{ mb: 4 }}>
                <Typography variant="h6" sx={{ color: colors.primaryText, mb: 2 }}>
                  Your Simulation Balance: ${availableBalance.toLocaleString()}
                </Typography>
                <Typography variant="body2" sx={{ color: colors.secondaryText }}>
                  Allocate your funds to different trading strategies and set a copy ratio for each one.
                  The copy ratio determines how closely you follow each strategy's trades.
                </Typography>
              </Box>
              
              <Box sx={{ mb: 4 }}>
                <FormControl fullWidth variant="outlined" sx={{ mb: 3 }}>
                  <InputLabel id="simulation-period-label" sx={{ color: colors.secondaryText }}>Simulation Period</InputLabel>
                  <Select
                    labelId="simulation-period-label"
                    value={simulationPeriod}
                    onChange={(e) => setSimulationPeriod(e.target.value)}
                    label="Simulation Period"
                    sx={{ 
                      color: colors.primaryText,
                    backgroundColor: colors.panelBg, 
                      '.MuiOutlinedInput-notchedOutline': {
                        borderColor: colors.borderColor
                      },
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: colors.accentBlue
                      },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: colors.accentBlue
                      }
                    }}
                  >
                    <MenuItem value="1 Month">1 Month</MenuItem>
                    <MenuItem value="3 Months">3 Months</MenuItem>
                    <MenuItem value="6 Months">6 Months</MenuItem>
                    <MenuItem value="1 Year">1 Year</MenuItem>
                    <MenuItem value="2 Years">2 Years</MenuItem>
                  </Select>
                </FormControl>
              </Box>
              
              <TableContainer component={Paper} sx={{ backgroundColor: colors.panelBg, mb: 4 }}>
                <Table sx={{ minWidth: 650 }}>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ color: colors.secondaryText, borderBottom: `1px solid ${colors.borderColor}` }}>Strategy</TableCell>
                      <TableCell align="right" sx={{ color: colors.secondaryText, borderBottom: `1px solid ${colors.borderColor}` }}>Total Net P/L</TableCell>
                      <TableCell align="right" sx={{ color: colors.secondaryText, borderBottom: `1px solid ${colors.borderColor}` }}>1Y Net P/L</TableCell>
                      <TableCell align="right" sx={{ color: colors.secondaryText, borderBottom: `1px solid ${colors.borderColor}` }}>Allocated Funds ($)</TableCell>
                      <TableCell align="right" sx={{ color: colors.secondaryText, borderBottom: `1px solid ${colors.borderColor}` }}>Copy Ratio (1-10)</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {strategies.map((strategy, index) => (
                      <TableRow key={strategy.id} sx={{ '&:hover': { backgroundColor: colors.hoverBg } }}>
                        <TableCell sx={{ color: colors.primaryText, borderBottom: `1px solid ${colors.borderColor}` }}>
                          {strategy.name}
                        </TableCell>
                        <TableCell align="right" sx={{ 
                          color: strategy.totalNetPL >= 0 ? colors.profitGreen : colors.lossRed,
                          fontWeight: 'bold',
                          borderBottom: `1px solid ${colors.borderColor}` 
                        }}>
                          {strategy.totalNetPL >= 0 ? '+' : ''}{strategy.totalNetPL}%
                        </TableCell>
                        <TableCell align="right" sx={{ 
                          color: strategy.oneYearNetPL >= 0 ? colors.profitGreen : colors.lossRed,
                          fontWeight: 'bold',
                          borderBottom: `1px solid ${colors.borderColor}` 
                        }}>
                          {strategy.oneYearNetPL >= 0 ? '+' : ''}{strategy.oneYearNetPL}%
                        </TableCell>
                        <TableCell align="right" sx={{ borderBottom: `1px solid ${colors.borderColor}` }}>
                          <Box sx={{ width: '100%', px: 1 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                              <Typography variant="caption" sx={{ color: colors.secondaryText }}>$0</Typography>
                              <Typography variant="caption" sx={{ color: colors.primaryText, fontWeight: 'bold' }}>
                                ${strategy.allocatedFunds.toLocaleString()}
                              </Typography>
                              <Typography variant="caption" sx={{ color: colors.secondaryText }}>${availableBalance.toLocaleString()}</Typography>
                            </Box>
                            <Box sx={{ position: 'relative' }}>
                              {/* Track background */}
                              <Box sx={{ 
                                position: 'absolute', 
                                height: '4px', 
                                width: '100%', 
                                backgroundColor: colors.borderColor,
                                borderRadius: '2px',
                                top: '50%',
                                transform: 'translateY(-50%)'
                              }} />
                              
                              {/* Filled portion */}
                              <Box sx={{ 
                                position: 'absolute', 
                                height: '4px', 
                                width: `${(strategy.allocatedFunds / availableBalance) * 100}%`, 
                                background: `linear-gradient(90deg, ${colors.accentBlue}, ${colors.buyGreen})`,
                                borderRadius: '2px',
                                top: '50%',
                                transform: 'translateY(-50%)'
                              }} />
                              
                              <input
                                type="range"
                                min="0"
                                max={availableBalance}
                                step="100"
                                value={strategy.allocatedFunds}
                                onChange={(e) => handleAllocationChange(index, e.target.value)}
                                className="allocation-slider"
                                style={{ 
                                  width: '100%',
                                  height: '24px',
                                  appearance: 'none',
                                  background: 'transparent',
                                  cursor: 'pointer',
                                  position: 'relative',
                                  zIndex: 2
                                }}
                              />
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell align="right" sx={{ borderBottom: `1px solid ${colors.borderColor}` }}>
                  <Typography 
                    variant="body2" 
                    sx={{ 
                              color: colors.primaryText,
                              fontWeight: 'bold'
                    }}
                  >
                            {/* Calculate copy ratio based on allocation percentage */}
                            {strategy.allocatedFunds > 0 ? 
                              Math.max(1, Math.round((strategy.allocatedFunds / availableBalance) * 10)) 
                              : 0}
                  </Typography>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                p: 3, 
                backgroundColor: colors.panelBg, 
                borderRadius: '12px',
                border: `1px solid ${colors.borderColor}`
              }}>
                <Typography variant="h6" sx={{ color: colors.primaryText }}>
                  Total Allocated: ${totalAllocatedFunds.toLocaleString()}
                </Typography>
                <Typography variant="h6" sx={{ color: colors.primaryText }}>
                  Remaining: ${(availableBalance - totalAllocatedFunds).toLocaleString()}
                </Typography>
            </Box>
          </Paper>
        </Box>
        )}
      </Box>
    </Box>
  );
};

export default Trade;