import React, { useState, useEffect, useRef, useMemo } from 'react';
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
  
  // Trading state - remove short-term trading specific state
  const [selectedPair, setSelectedPair] = useState('EUR/USD');
  const [availableBalance, setAvailableBalance] = useState(10000);
  const [simulationAmount, setSimulationAmount] = useState(10000);
  const [tradingType, setTradingType] = useState('long-term'); // Set default to long-term
  const [step, setStep] = useState(1); // 1: Set amount, 3: Long-term strategy interface, 4: Results

  // Additional state for enhanced trading features
  const [selectedTimeframe, setSelectedTimeframe] = useState('1m');
  const [showIndicators, setShowIndicators] = useState(true);
  const [chartType, setChartType] = useState('candles');
  const [sessionId, setSessionId] = useState(null);
  
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
        title: "Welcome to Long-Term Trading Simulation!",
        content: "This tutorial will guide you through using the long-term trading simulator. Here you'll allocate funds to trading strategies rather than manual trading.",
        position: { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }
      },
      {
        title: "Strategy Allocation",
        content: "The main feature is allocating your funds to different trading strategies. Each strategy has its own performance metrics and risk profile.",
        position: { top: '30%', left: '50%', transform: 'translate(-50%, -50%)' }
      },
      {
        title: "Performance Metrics",
        content: "Evaluate strategies based on historical performance data, risk levels, and other metrics to make informed allocation decisions.",
        position: { top: '70%', left: '50%', transform: 'translate(-50%, -50%)' }
      },
      {
        title: "Fund Allocation",
        content: "Use the sliders to allocate portions of your capital to each strategy. The system automatically sets appropriate copy ratios.",
        position: { top: '50%', left: '25%', transform: 'translate(-50%, -50%)' }
      },
      {
        title: "Simulation Period",
        content: "Select how long you want the simulation to run. Different time periods may yield different results based on market conditions.",
        position: { top: '50%', left: '25%', transform: 'translate(-50%, -50%)' }
      },
      {
        title: "Results Analysis",
        content: "After running the simulation, you'll see detailed performance metrics including monthly returns, currency pair breakdown, and key insights.",
        position: { top: '30%', right: '20%', transform: 'translate(0, -50%)' }
      },
      {
        title: "Ready to Begin!",
        content: "You're all set to start your long-term trading simulation. Remember, this is risk-free - experiment with different allocation strategies to find what works best.",
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
                  Get Started
                </Button>
              )}
            </Box>
          </Box>
        </Paper>
      </Box>
    );
  };

  // Chart initialization code - kept for compatibility
  useEffect(() => {
    if (step === 3 && chartContainerRef.current && !chartRef.current) {
      // Initialize chart code
    const handleResize = () => {
      if (chartRef.current) {
          chartRef.current.applyOptions({ 
            width: chartContainerRef.current.clientWidth,
            height: chartContainerRef.current.clientHeight
          });
        }
      };
      
      // Keep chart functionality but remove live trading related code
      // ... existing chart setup code ...
    }
  }, [step]);

  // Remove short-term trading specific functions (checkPendingOrders, executeOrder, placeOrder, etc.)
  
  // Add missing state variable needed for compatibility
  const [activeTradingTab, setActiveTradingTab] = useState(0);
  
  // Keep the handleTabChange for UI compatibility
  const handleTabChange = (event, newValue) => {
    setActiveTradingTab(newValue);
  };
  
  // Tooltip renderer for UI elements
  const renderTooltip = (content) => {
    return (
      <Box sx={{ 
        maxWidth: 300, 
        p: 1.5,
        backgroundColor: 'rgba(33, 33, 33, 0.95)',
        borderRadius: '8px',
        boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)',
        border: `1px solid ${colors.borderColor}`
      }}>
        <Typography variant="body2" sx={{ color: colors.primaryText }}>
          {content}
        </Typography>
      </Box>
    );
  };

  // Long-term trading state
  const [simulationPeriod, setSimulationPeriod] = useState('1 Year');
  const [simulationResults, setSimulationResults] = useState(null);
  const [strategies, setStrategies] = useState([
    { 
      id: 1, 
      name: 'Triumph', 
      description: 'Trend-following strategy with linear regression predictions',
      tooltip: 'Triumph uses linear regression and advanced trend analysis to identify sustainable market movements. The algorithm calculates the slope coefficient to determine trend strength and direction, then applies moving averages to filter out market noise. Particularly effective with EUR/USD and USD/JPY pairs.',
      totalNetPL: 121.00,
      oneYearNetPL: 14.37,
      sixMonthNetPL: 8.24,
      threeMonthNetPL: 4.56,
      riskLevel: 'low',
      avgDuration: '3-5 days',
      maxDrawdown: 15.20,
      sharpeRatio: 1.75,
      allocatedFunds: 0, 
      copyRatio: 0
    },
    { 
      id: 2, 
      name: 'Legacy', 
      description: 'Momentum detection with support/resistance breakouts',
      tooltip: 'Legacy implements a momentum detection algorithm that identifies key price levels using computational geometry. When price approaches these levels with increasing volume, the system calculates breakout probability using a statistical model. Particularly effective in trending markets with clear support and resistance zones.',
      totalNetPL: 538.00,
      oneYearNetPL: 10.29,
      sixMonthNetPL: 6.40,
      threeMonthNetPL: 3.55,
      riskLevel: 'medium',
      avgDuration: '1-3 days',
      maxDrawdown: 22.40,
      sharpeRatio: 1.95,
      allocatedFunds: 0, 
      copyRatio: 0
    },
    { 
      id: 3, 
      name: 'Alpine', 
      description: 'Mean reversion with RSI and stochastic oscillators',
      tooltip: 'Alpine implements a sophisticated mean reversion algorithm that utilizes RSI and stochastic oscillators to identify overbought and oversold conditions. The system calculates statistical deviation from historical mean prices and triggers entries when the algorithm detects high probability reversal points during range-bound market conditions.',
      totalNetPL: 317.00,
      oneYearNetPL: 12.10,
      sixMonthNetPL: 12.26,
      threeMonthNetPL: 4.95,
      riskLevel: 'medium',
      avgDuration: '2-4 days',
      maxDrawdown: 18.60,
      sharpeRatio: 1.82,
      allocatedFunds: 0, 
      copyRatio: 0
    },
    { 
      id: 4, 
      name: 'Ivory', 
      description: 'Contrarian algorithm with sentiment analysis',
      tooltip: 'Ivory utilizes a contrarian approach combining technical and sentiment analysis. The algorithm analyzes news sentiment and social media data, then correlates this with technical indicators to identify market extremes. When sentiment reaches peak levels coinciding with overextended price action, the algorithm takes positions in the opposite direction.',
      totalNetPL: 125.00,
      oneYearNetPL: -1.30,
      sixMonthNetPL: 2.50,
      threeMonthNetPL: 3.50,
      riskLevel: 'high',
      avgDuration: '1-2 days',
      maxDrawdown: 27.50,
      sharpeRatio: 1.45,
      allocatedFunds: 0, 
      copyRatio: 0
    },
    { 
      id: 5, 
      name: 'Quantum', 
      description: 'High-frequency trading with linear pattern recognition',
      tooltip: 'Quantum employs advanced pattern recognition algorithms to identify micro-trends in price data. The system analyzes tick-by-tick data using linear regression on small time segments to detect statistically significant patterns. Multiple regression models run in parallel across different timeframes to find the highest probability short-term price movements.',
      totalNetPL: 87.00,
      oneYearNetPL: 2.40,
      sixMonthNetPL: 1.20,
      threeMonthNetPL: 0.80,
      riskLevel: 'high',
      avgDuration: '1-4 hours',
      maxDrawdown: 32.10,
      sharpeRatio: 1.25,
      allocatedFunds: 0, 
      copyRatio: 0
    }
  ]);
  
  // Calculate total allocated funds
  const totalAllocatedFunds = useMemo(() => {
    return strategies.reduce((sum, strategy) => sum + strategy.allocatedFunds, 0);
  }, [strategies]);
  
  // Handle allocation change
  const handleAllocationChange = (index, value) => {
    const numValue = parseFloat(value) || 0;
    
    // Calculate current total without this strategy
    const otherAllocations = strategies.reduce((sum, strategy, idx) => 
      idx === index ? sum : sum + strategy.allocatedFunds, 0);
    
    // Don't allow allocating more than available
    if (numValue + otherAllocations > availableBalance) {
      return;
    }
    
    const newStrategies = [...strategies];
    newStrategies[index].allocatedFunds = numValue;
    
    // Automatically update copy ratio based on allocation percentage
    const allocPercentage = numValue / availableBalance;
    newStrategies[index].copyRatio = numValue > 0 ? Math.max(1, Math.round(allocPercentage * 10)) : 0;
    
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
    
    // Generate simulation results based on selected strategies
    const startBalance = availableBalance;
    
    // Calculate weighted return based on selected strategies
    let weightedReturn = 0;
    let strategyInsights = [];
    
    selectedStrategies.forEach(strategy => {
      const allocation = strategy.allocatedFunds / availableBalance;
      // Use appropriate timeframe return based on simulation period
      let returnRate = 0;
      
      if (simulationPeriod === '1 Year') {
        returnRate = strategy.oneYearNetPL / 100;
        
        // Add strategy-specific insight
        if (strategy.oneYearNetPL > 5) {
          strategyInsights.push(`${strategy.name} performed well with ${strategy.oneYearNetPL}% return over 1 year`);
        }
      } else if (simulationPeriod === '6 Months') {
        returnRate = strategy.sixMonthNetPL / 100;
        
        // Add strategy-specific insight
        if (strategy.sixMonthNetPL > 5) {
          strategyInsights.push(`${strategy.name} yielded ${strategy.sixMonthNetPL}% return over 6 months`);
        }
      } else if (simulationPeriod === '3 Months') {
        returnRate = strategy.threeMonthNetPL / 100;
      } else {
        // Default to one year rate adjusted for time
        if (simulationPeriod === '2 Years') {
          returnRate = strategy.oneYearNetPL * 1.8 / 100; // Not exactly 2x to account for compounding
        } else if (simulationPeriod === '1 Month') {
          returnRate = strategy.oneYearNetPL / 12 / 100;
        }
      }
      
      weightedReturn += (allocation * returnRate);
    });
    
    // Add a small random factor for realism (-1% to +1%)
    const randomFactor = 1 + (Math.random() * 0.02 - 0.01);
    weightedReturn *= randomFactor;
    
    // Calculate end balance
    const endBalance = startBalance * (1 + weightedReturn);
    
    // Generate realistic trade count based on strategies and period
    let baseTradeCount = 0;
    selectedStrategies.forEach(strategy => {
      // Estimate monthly trades based on average duration
      let monthlyTrades = 0;
      if (strategy.avgDuration === '1-4 hours') monthlyTrades = 80;
      else if (strategy.avgDuration === '1-2 days') monthlyTrades = 20;
      else if (strategy.avgDuration === '2-4 days') monthlyTrades = 10;
      else if (strategy.avgDuration === '3-5 days') monthlyTrades = 6;
      
      // Scale by copy ratio and allocation percentage
      const allocation = strategy.allocatedFunds / availableBalance;
      baseTradeCount += monthlyTrades * (strategy.copyRatio / 10) * allocation;
    });
    
    // Scale by simulation period
    let totalTrades = 0;
    if (simulationPeriod === '1 Month') totalTrades = Math.round(baseTradeCount);
    else if (simulationPeriod === '3 Months') totalTrades = Math.round(baseTradeCount * 3);
    else if (simulationPeriod === '6 Months') totalTrades = Math.round(baseTradeCount * 6);
    else if (simulationPeriod === '2 Years') totalTrades = Math.round(baseTradeCount * 24);
    else if (simulationPeriod === '1 Year') totalTrades = Math.round(baseTradeCount * 12);
    
    // Generate some trading data for symbols
    // Determine which currency pairs were most traded based on strategies
    let symbols = [];
    if (selectedStrategies.some(s => s.name === 'Triumph' || s.name === 'Legacy')) {
      symbols.push({ symbol: 'EURUSD', trades: Math.round(totalTrades * 0.35), winRate: 61, pl: endBalance * 0.38, weight: 38.0 });
    }
    if (selectedStrategies.some(s => s.name === 'Triumph' || s.name === 'Quantum')) {
      symbols.push({ symbol: 'EURJPY', trades: Math.round(totalTrades * 0.28), winRate: 58, pl: endBalance * 0.31, weight: 31.0 });
    }
    if (selectedStrategies.some(s => s.name === 'Alpine' || s.name === 'Ivory')) {
      symbols.push({ symbol: 'GBPUSD', trades: Math.round(totalTrades * 0.12), winRate: 59, pl: endBalance * 0.12, weight: 12.0 });
    }
    if (selectedStrategies.some(s => s.name === 'Legacy')) {
      symbols.push({ symbol: 'EURNZD', trades: Math.round(totalTrades * 0.06), winRate: 55, pl: endBalance * 0.05, weight: 5.0 });
    }
    if (selectedStrategies.some(s => s.name === 'Alpine')) {
      symbols.push({ symbol: 'EURCAD', trades: Math.round(totalTrades * 0.09), winRate: 62, pl: endBalance * 0.08, weight: 8.0 });
    }
    if (selectedStrategies.some(s => s.name === 'Quantum' || s.name === 'Ivory')) {
      symbols.push({ symbol: 'EURCHF', trades: Math.round(totalTrades * 0.04), winRate: 54, pl: endBalance * 0.04, weight: 4.0 });
    }
    if (selectedStrategies.some(s => s.name === 'Legacy' || s.name === 'Ivory')) {
      symbols.push({ symbol: 'AUDUSD', trades: Math.round(totalTrades * 0.06), winRate: 52, pl: endBalance * 0.02, weight: 2.0 });
    }
    
    // If no symbols were added (edge case), add a default
    if (symbols.length === 0) {
      symbols.push({ symbol: 'EURUSD', trades: Math.round(totalTrades * 0.6), winRate: 60, pl: endBalance * 0.6, weight: 60.0 });
      symbols.push({ symbol: 'GBPUSD', trades: Math.round(totalTrades * 0.4), winRate: 58, pl: endBalance * 0.4, weight: 40.0 });
    }
    
    // Make sure weights add up to 100%
    const totalWeight = symbols.reduce((sum, s) => sum + s.weight, 0);
    symbols = symbols.map(s => ({
      ...s,
      weight: parseFloat((s.weight / totalWeight * 100).toFixed(1))
    }));
    
    // Create monthly data
    const months = simulationPeriod === '1 Month' ? 1 : 
                   simulationPeriod === '3 Months' ? 3 : 
                   simulationPeriod === '6 Months' ? 6 : 
                   simulationPeriod === '2 Years' ? 24 : 12;
    
    // Generate monthly data with some variability
    const monthlyData = [];
    
    for (let i = 0; i < months; i++) {
      const month = new Date();
      month.setMonth(month.getMonth() - (months - i - 1));
      
      // Add some randomness to monthly performance
      const monthFactor = 1 + (Math.random() * 0.03 - 0.015);
      const monthlyProfit = ((endBalance - startBalance) / months) * monthFactor;
      
      const previousBalance = i === 0 ? startBalance : monthlyData[i-1].balance;
      
      monthlyData.push({
        date: month,
        balance: previousBalance + monthlyProfit,
        profit: monthlyProfit.toFixed(2),
        trades: Math.floor(totalTrades / months * (0.9 + Math.random() * 0.2))
      });
    }
    
    // Add algorithm-specific insights
    const algorithmInsights = [];
    
    // Add linear regression insight if Triumph or Quantum is used
    if (selectedStrategies.some(s => s.name === 'Triumph' || s.name === 'Quantum')) {
      algorithmInsights.push(
        `Linear regression models identified strong ${weightedReturn > 0 ? 'positive' : 'negative'} trends in ${
          symbols.length > 0 ? symbols[0].symbol : 'currency pairs'
        } with ${weightedReturn > 0 ? 'upward' : 'downward'} slope coefficient`
      );
    }
    
    // Add mean reversion insight if Alpine is used
    if (selectedStrategies.some(s => s.name === 'Alpine')) {
      algorithmInsights.push(
        'Mean reversion algorithm captured price reversals at statistical extremes using RSI oscillators'
      );
    }
    
    // Add sentiment analysis insight if Ivory is used
    if (selectedStrategies.some(s => s.name === 'Ivory')) {
      algorithmInsights.push(
        'Sentiment analysis detected contrarian opportunities when market sentiment reached extreme levels'
      );
    }
    
    // Combine all insights
    const insights = [...strategyInsights, ...algorithmInsights];
    
    // If we don't have enough insights, add some generic ones
    if (insights.length < 3) {
      if (weightedReturn > 0) {
        insights.push(`Portfolio achieved ${(weightedReturn * 100).toFixed(2)}% return using algorithmic trading strategies`);
      } else {
        insights.push(`Market conditions were challenging for selected algorithms in this timeframe`);
      }
    }
    
    // Limit to 3 insights
    const finalInsights = insights.slice(0, 3);
    
    setSimulationResults({
      startingBalance: startBalance,
      endingBalance: endBalance,
      totalProfit: endBalance - startBalance,
      profitPercentage: ((endBalance - startBalance) / startBalance * 100).toFixed(2),
      totalTrades,
      winRate: selectedStrategies.reduce((sum, s) => sum + (s.allocatedFunds / availableBalance) * 60, 0),
      monthlyData,
      symbols,
      insights: finalInsights
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
              
                <Box sx={{ width: '100%', maxWidth: '600px', px: 4, position: 'relative', mt: 2 }}>
                  {/* Progress fill effect - fixed to stay within bounds */}
                  <Box sx={{ 
                    position: 'absolute', 
                    top: '50%', 
                    left: 0, 
                    right: 0, 
                    height: '6px', 
                    transform: 'translateY(-50%)',
                    backgroundColor: colors.borderColor,
                    borderRadius: '3px',
                    mx: 4
                  }} />
                  
                  {/* Filled portion - calculate width based on position */}
                  <Box sx={{ 
                    position: 'absolute', 
                    top: '50%', 
                    left: 0,
                    width: `calc(${(Math.min(simulationAmount, 100000) - 1000) / (100000 - 1000) * 100}% * (1 - 22px/100%))`,
                    height: '6px', 
                    transform: 'translateY(-50%)',
                    background: `linear-gradient(90deg, ${colors.accentBlue}, ${colors.buyGreen})`,
                    borderRadius: '3px',
                    transition: 'width 0.3s ease',
                    ml: 4,
                    maxWidth: 'calc(100% - 32px - 11px)' // Adjust so fill stops at center of thumb
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
                      z-index: 3;
                      position: relative;
                    }
                    input[type=range]::-moz-range-thumb {
                      height: 22px;
                      width: 22px;
                      border-radius: 50%;
                      background: ${colors.accentBlue};
                      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
                      cursor: pointer;
                      border: none;
                      z-index: 3;
                      position: relative;
                    }
                    input[type=range]::-ms-thumb {
                      height: 22px;
                      width: 22px;
                      border-radius: 50%;
                      background: ${colors.accentBlue};
                      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
                      cursor: pointer;
                      z-index: 3;
                      position: relative;
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
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', maxWidth: '600px', px: 4, mt: 1 }}>
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
                    setStep(3); // Skip step 2 and go directly to step 3 (long-term trading)
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
                  Start Strategy Allocation
                </Button>
              </Box>
            </Paper>
          </Box>
        )}
        
        {step === 4 && simulationResults && (
          <Box sx={{ maxWidth: '1600px', mx: 'auto', mt: 5 }}>
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

              {/* First row - 3 main panels */}
              <Grid container spacing={4}>
                <Grid item xs={12} lg={4}>
          <Paper 
            sx={{ 
              p: 4, 
                      backgroundColor: colors.panelBg,
              border: `1px solid ${colors.borderColor}`,
              borderRadius: '12px',
                      height: '100%'
                    }}
                  >
                    <Typography variant="h6" sx={{ color: colors.primaryText, mb: 3, fontWeight: 'bold' }}>
                      Balance
                    </Typography>
                    
                    <Box sx={{ position: 'relative', mb: 3 }}>
                      {/* Balance amount at top right */}
            <Typography 
                        variant="body1" 
              sx={{ 
                          position: 'absolute',
                          top: 5,
                          right: 5,
                color: colors.primaryText,
                          fontWeight: 'bold'
              }}
            >
                        ${simulationResults.endingBalance.toLocaleString()}
            </Typography>
            
                      {/* Main chart */}
                      <Box sx={{ height: '180px', position: 'relative', mt: 2 }}>
                        <svg width="100%" height="100%" viewBox="0 0 300 180" preserveAspectRatio="none">
                          {/* Path for the balance curve */}
                          <path 
                            d="M0,150 C30,140 60,130 90,120 S150,100 180,80 S240,40 300,30"
                            fill="none"
                            stroke={colors.accentBlue}
                            strokeWidth="3"
                          />
                          
                          {/* Gradient fill under the curve */}
                          <linearGradient id="balanceGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor={colors.accentBlue} stopOpacity="0.3" />
                            <stop offset="100%" stopColor={colors.accentBlue} stopOpacity="0.05" />
                          </linearGradient>
                          <path 
                            d="M0,150 C30,140 60,130 90,120 S150,100 180,80 S240,40 300,30 V180 H0 Z"
                            fill="url(#balanceGradient)"
                          />
                        </svg>
                        
                        {/* Starting balance label */}
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            position: 'absolute', 
                            bottom: 5, 
                            left: 5, 
                            color: colors.secondaryText,
                          }}
                        >
                          ${simulationResults.startingBalance.toLocaleString()}
              </Typography>
                      </Box>
            </Box>
            
                    <Box sx={{ mt: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2, borderBottom: `1px dashed ${colors.borderColor}`, pb: 1 }}>
                        <Typography variant="body2" sx={{ color: colors.secondaryText }}>
                          Starting Balance
                        </Typography>
                        <Typography variant="body2" sx={{ color: colors.primaryText, fontWeight: 'bold' }}>
                          ${simulationResults.startingBalance.toLocaleString()}
              </Typography>
            </Box>
            
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2, borderBottom: `1px dashed ${colors.borderColor}`, pb: 1 }}>
                        <Typography variant="body2" sx={{ color: colors.secondaryText }}>
                          Ending Balance
                        </Typography>
                        <Typography variant="body2" sx={{ color: colors.primaryText, fontWeight: 'bold' }}>
                          ${simulationResults.endingBalance.toLocaleString()}
              </Typography>
            </Box>
            
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2, borderBottom: `1px dashed ${colors.borderColor}`, pb: 1 }}>
                        <Typography variant="body2" sx={{ color: colors.secondaryText }}>
                          Total Profit
                        </Typography>
                        <Typography variant="body2" sx={{ color: colors.profitGreen, fontWeight: 'bold' }}>
                          ${simulationResults.totalProfit.toLocaleString()} ({simulationResults.profitPercentage}%)
                        </Typography>
                      </Box>
                      
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2, borderBottom: `1px dashed ${colors.borderColor}`, pb: 1 }}>
                        <Typography variant="body2" sx={{ color: colors.secondaryText }}>
                          Total Trades
                        </Typography>
                        <Typography variant="body2" sx={{ color: colors.primaryText, fontWeight: 'bold' }}>
                          {simulationResults.totalTrades.toLocaleString()}
                        </Typography>
                      </Box>
                      
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" sx={{ color: colors.secondaryText }}>
                          Win Rate
                        </Typography>
                        <Typography variant="body2" sx={{ color: colors.primaryText, fontWeight: 'bold' }}>
                          {simulationResults.winRate}%
                        </Typography>
                      </Box>
                    </Box>
                  </Paper>
                </Grid>
                
                <Grid item xs={12} lg={4}>
                  <Paper 
                sx={{ 
                      p: 4, 
                  backgroundColor: colors.panelBg, 
                      border: `1px solid ${colors.borderColor}`,
                      borderRadius: '12px',
                      height: '100%'
                    }}
                  >
                    <Typography variant="h6" sx={{ color: colors.primaryText, mb: 3, fontWeight: 'bold' }}>
                      Monthly P/L
                    </Typography>
                    
                    <Box sx={{ height: '180px', position: 'relative', mb: 3, width: '100%', overflow: 'hidden' }}>
                      {/* Static SVG chart with built-in month labels for perfect alignment */}
                      <svg width="100%" height="180" viewBox="0 0 420 180" preserveAspectRatio="none">
                        {/* Jan */}
                        <g>
                          <rect x="15" y="150" width="20" height="20" rx="2" fill={colors.buyGreen} />
                          <text x="25" y="145" fill={colors.secondaryText} fontSize="10" textAnchor="middle">$10</text>
                          <text x="25" y="178" fill={colors.secondaryText} fontSize="10" textAnchor="middle">Jan</text>
                        </g>
                        
                        {/* Feb */}
                        <g>
                          <rect x="50" y="130" width="20" height="40" rx="2" fill={colors.buyGreen} />
                          <text x="60" y="125" fill={colors.secondaryText} fontSize="10" textAnchor="middle">$30</text>
                          <text x="60" y="178" fill={colors.secondaryText} fontSize="10" textAnchor="middle">Feb</text>
                        </g>
                        
                        {/* Mar */}
                        <g>
                          <rect x="85" y="110" width="20" height="60" rx="2" fill={colors.buyGreen} />
                          <text x="95" y="105" fill={colors.secondaryText} fontSize="10" textAnchor="middle">$50</text>
                          <text x="95" y="178" fill={colors.secondaryText} fontSize="10" textAnchor="middle">Mar</text>
                        </g>
                        
                        {/* Apr */}
                        <g>
                          <rect x="120" y="90" width="20" height="80" rx="2" fill={colors.buyGreen} />
                          <text x="130" y="85" fill={colors.secondaryText} fontSize="10" textAnchor="middle">$70</text>
                          <text x="130" y="178" fill={colors.secondaryText} fontSize="10" textAnchor="middle">Apr</text>
                        </g>
                        
                        {/* May */}
                        <g>
                          <rect x="155" y="70" width="20" height="100" rx="2" fill={colors.buyGreen} />
                          <text x="165" y="65" fill={colors.secondaryText} fontSize="10" textAnchor="middle">$90</text>
                          <text x="165" y="178" fill={colors.secondaryText} fontSize="10" textAnchor="middle">May</text>
                        </g>
                        
                        {/* Jun */}
                        <g>
                          <rect x="190" y="50" width="20" height="120" rx="2" fill={colors.buyGreen} />
                          <text x="200" y="45" fill={colors.secondaryText} fontSize="10" textAnchor="middle">$110</text>
                          <text x="200" y="178" fill={colors.secondaryText} fontSize="10" textAnchor="middle">Jun</text>
                        </g>
                        
                        {/* Jul */}
                        <g>
                          <rect x="225" y="60" width="20" height="110" rx="2" fill={colors.buyGreen} />
                          <text x="235" y="55" fill={colors.secondaryText} fontSize="10" textAnchor="middle">$100</text>
                          <text x="235" y="178" fill={colors.secondaryText} fontSize="10" textAnchor="middle">Jul</text>
                        </g>
                        
                        {/* Aug */}
                        <g>
                          <rect x="260" y="70" width="20" height="100" rx="2" fill={colors.buyGreen} />
                          <text x="270" y="65" fill={colors.secondaryText} fontSize="10" textAnchor="middle">$90</text>
                          <text x="270" y="178" fill={colors.secondaryText} fontSize="10" textAnchor="middle">Aug</text>
                        </g>
                        
                        {/* Sep */}
                        <g>
                          <rect x="295" y="80" width="20" height="90" rx="2" fill={colors.buyGreen} />
                          <text x="305" y="75" fill={colors.secondaryText} fontSize="10" textAnchor="middle">$80</text>
                          <text x="305" y="178" fill={colors.secondaryText} fontSize="10" textAnchor="middle">Sep</text>
                        </g>
                        
                        {/* Oct */}
                        <g>
                          <rect x="330" y="90" width="20" height="80" rx="2" fill={colors.buyGreen} />
                          <text x="340" y="85" fill={colors.secondaryText} fontSize="10" textAnchor="middle">$70</text>
                          <text x="340" y="178" fill={colors.secondaryText} fontSize="10" textAnchor="middle">Oct</text>
                        </g>
                        
                        {/* Nov */}
                        <g>
                          <rect x="365" y="110" width="20" height="60" rx="2" fill={colors.buyGreen} />
                          <text x="375" y="105" fill={colors.secondaryText} fontSize="10" textAnchor="middle">$50</text>
                          <text x="375" y="178" fill={colors.secondaryText} fontSize="10" textAnchor="middle">Nov</text>
                        </g>
                        
                        {/* Dec */}
                        <g>
                          <rect x="400" y="100" width="20" height="70" rx="2" fill={colors.buyGreen} />
                          <text x="410" y="95" fill={colors.secondaryText} fontSize="10" textAnchor="middle">$60</text>
                          <text x="410" y="178" fill={colors.secondaryText} fontSize="10" textAnchor="middle">Dec</text>
                        </g>
                      </svg>
                    </Box>
                    
                    <Box sx={{ 
                      display: 'flex',
                      justifyContent: 'space-between',
                      mt: 2,
                      borderTop: `1px dashed ${colors.borderColor}`,
                      pt: 2
                    }}>
                      <Box>
                        <Typography variant="body2" sx={{ color: colors.secondaryText, mb: 1 }}>Avg. Monthly P/L</Typography>
                        <Typography variant="h6" sx={{ color: colors.profitGreen, fontWeight: 'bold' }}>
                          +${((simulationResults.totalProfit) / 12).toFixed(2)}
                        </Typography>
                      </Box>
                      
                      <Box sx={{ textAlign: 'right' }}>
                        <Typography variant="body2" sx={{ color: colors.secondaryText, mb: 1 }}>Monthly Trades</Typography>
                        <Typography variant="h6" sx={{ color: colors.primaryText, fontWeight: 'bold' }}>
                          {Math.round(simulationResults.totalTrades / 12)}
                        </Typography>
                      </Box>
                    </Box>
                  </Paper>
                </Grid>
                
                <Grid item xs={12} lg={4}>
                  <Paper 
                    sx={{ 
                      p: 4, 
                      backgroundColor: colors.panelBg,
                      border: `1px solid ${colors.borderColor}`,
                      borderRadius: '12px'
                    }}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                      <Typography variant="h6" sx={{ color: colors.primaryText, fontWeight: 'bold' }}>
                        Simulation Results
                </Typography>
                      <Box sx={{
                          width: 'auto',
                          minWidth: '80px',
                          height: '28px',
                        backgroundColor: colors.accentBlue,
                        color: '#fff',
                        fontSize: '0.75rem',
                        fontWeight: 'bold',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          borderRadius: '4px',
                          px: 2
                        }}>
                          {simulationPeriod}
                      </Box>
                    </Box>
                    
                    <Box sx={{ flex: 1 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2, borderBottom: `1px dashed ${colors.borderColor}`, pb: 1 }}>
                <Typography variant="body2" sx={{ color: colors.secondaryText }}>
                          Starting Balance
                </Typography>
                        <Typography variant="body2" sx={{ color: colors.primaryText, fontWeight: 'bold' }}>
                          ${simulationResults.startingBalance.toLocaleString()}
                        </Typography>
                      </Box>
                      
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2, borderBottom: `1px dashed ${colors.borderColor}`, pb: 1 }}>
                <Typography variant="body2" sx={{ color: colors.secondaryText }}>
                          Ending Balance
                </Typography>
                        <Typography variant="body2" sx={{ color: colors.primaryText, fontWeight: 'bold' }}>
                          ${simulationResults.endingBalance.toLocaleString()}
                        </Typography>
                      </Box>
                      
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2, borderBottom: `1px dashed ${colors.borderColor}`, pb: 1 }}>
                        <Typography variant="body2" sx={{ color: colors.secondaryText }}>
                          # Trades
                        </Typography>
                        <Typography variant="body2" sx={{ color: colors.primaryText, fontWeight: 'bold' }}>
                          {simulationResults.totalTrades.toLocaleString()}
                        </Typography>
                      </Box>
                      
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2, borderBottom: `1px dashed ${colors.borderColor}`, pb: 1 }}>
                        <Typography variant="body2" sx={{ color: colors.secondaryText }}>
                          Avg Monthly P/L
                        </Typography>
                        <Typography variant="body2" sx={{ color: colors.profitGreen, fontWeight: 'bold' }}>
                          ${((simulationResults.totalProfit) / 12).toFixed(2)} ({(simulationResults.profitPercentage / 12).toFixed(2)}%)
                        </Typography>
                      </Box>
                    </Box>
                    
                    <Box sx={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center', 
                      borderTop: `1px dashed ${colors.borderColor}`,
                      pt: 2,
                      mt: 'auto'
                    }}>
                      <Typography variant="body2" sx={{ color: colors.secondaryText }}>
                        Total Profit
                      </Typography>
                      <Typography variant="h5" sx={{ color: colors.profitGreen, fontWeight: 'bold' }}>
                        ${simulationResults.totalProfit.toLocaleString()} ({simulationResults.profitPercentage}%)
                      </Typography>
                    </Box>
                    
                    <Box sx={{ textAlign: 'right', mt: 2 }}>
                      <Button
                        variant="text"
                        size="small"
                        sx={{ 
                          color: colors.accentBlue,
                          textTransform: 'none',
                          '&:hover': {
                            backgroundColor: 'transparent',
                            textDecoration: 'underline'
                          }
                        }}
                      >
                        More Stats
                      </Button>
                    </Box>
                  </Paper>
                </Grid>
                
                {/* Second row - 2 panels for symbols */}
                <Grid container spacing={4} sx={{ mt: 2 }}>
                  <Grid item xs={12} lg={6}>
                    <Paper 
                      sx={{ 
                        p: 4, 
                        backgroundColor: colors.panelBg,
                        border: `1px solid ${colors.borderColor}`,
                        borderRadius: '12px',
                        height: '100%',
                        minHeight: '400px'
                      }}
                    >
                      <Typography variant="h6" sx={{ color: colors.primaryText, mb: 3, fontWeight: 'bold' }}>
                        Symbols Distribution
                      </Typography>
                      
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        {/* Donut chart */}
                        <Box sx={{ width: 400, height: 240, position: 'relative' }}>
                          <svg width="400" height="240" viewBox="0 0 240 240">
                            <defs>
                              <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
                                <feGaussianBlur in="SourceAlpha" stdDeviation="3" />
                                <feOffset dx="0" dy="1" result="offsetblur" />
                                <feComponentTransfer>
                                  <feFuncA type="linear" slope="0.2" />
                                </feComponentTransfer>
                                <feMerge>
                                  <feMergeNode />
                                  <feMergeNode in="SourceGraphic" />
                                </feMerge>
                              </filter>
                            </defs>
                            
                            {/* Ring segments */}
                            <circle cx="120" cy="120" r="80" fill="none" stroke="#00E676" strokeWidth="28" strokeDasharray="200 300" transform="rotate(-90 120 120)" filter="url(#shadow)" />
                            <circle cx="120" cy="120" r="80" fill="none" stroke="#2196F3" strokeWidth="28" strokeDasharray="133 367" transform="rotate(60 120 120)" filter="url(#shadow)" />
                            <circle cx="120" cy="120" r="80" fill="none" stroke="#FFA726" strokeWidth="28" strokeDasharray="40 460" transform="rotate(160 120 120)" filter="url(#shadow)" />
                            <circle cx="120" cy="120" r="80" fill="none" stroke="#FF3D57" strokeWidth="28" strokeDasharray="30 470" transform="rotate(190 120 120)" filter="url(#shadow)" />
                            <circle cx="120" cy="120" r="80" fill="none" stroke="#9C27B0" strokeWidth="28" strokeDasharray="27 473" transform="rotate(213 120 120)" filter="url(#shadow)" />
                            <circle cx="120" cy="120" r="80" fill="none" stroke="#CDDC39" strokeWidth="28" strokeDasharray="20 480" transform="rotate(233 120 120)" filter="url(#shadow)" />
                            
                            {/* Center hole */}
                            <circle cx="120" cy="120" r="55" fill={colors.panelBg} />
                          </svg>
                        </Box>
                        
                        {/* Symbol list */}
                        <Box sx={{ flex: 1, pl: 4 }}>
                          {['EURUSD', 'EURJPY', 'GBPUSD', 'EURNZD', 'EURCAD', 'EURCHF'].map((symbol, i) => {
                            const weights = [44.8, 32.0, 4.8, 3.3, 7.9, 5.5];
                            const colors = ['#00E676', '#2196F3', '#FFA726', '#FF3D57', '#9C27B0', '#CDDC39'];
                            
                            return (
                              <Box key={i} sx={{ 
                                display: 'flex', 
                                justifyContent: 'space-between', 
                                alignItems: 'center', 
                                mb: 2,
                                py: 0.5
                              }}>
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                  <Box sx={{ 
                                    width: 10, 
                                    height: 10, 
                                    borderRadius: '50%', 
                                    backgroundColor: colors[i],
                                    mr: 2
                                  }} />
                                  <Typography variant="body2" sx={{ color: colors.primaryText, fontWeight: 'bold' }}>
                                    {symbol}
                                  </Typography>
                                </Box>
                                <Typography variant="body2" sx={{ color: colors.secondaryText }}>
                                  {weights[i]}%
                                </Typography>
                              </Box>
                            );
                          })}
                        </Box>
                      </Box>
                    </Paper>
                  </Grid>
                  
                  <Grid item xs={12} lg={6}>
                    <Paper 
                      sx={{ 
                        p: 4, 
                        backgroundColor: colors.panelBg,
                        border: `1px solid ${colors.borderColor}`,
                        borderRadius: '12px',
                        height: '100%',
                        minHeight: '400px'
                      }}
                    >
                      <Typography variant="h6" sx={{ color: colors.primaryText, mb: 3, fontWeight: 'bold' }}>
                          Symbols P/L
                        </Typography>
                      
                      <Box sx={{ height: 280, width: 530, position: 'relative', mt: 2 }}>
                        {/* Bar chart matching Monthly P/L style */}
                        <Box sx={{ 
                          display: 'flex',
                          height: '280px',
                          width: '520px',
                          alignItems: 'flex-end',
                          justifyContent: 'space-between',
                          px: 2,
                          position: 'relative',
                          pb: 4 // Space for labels
                        }}>
                          {[
                            { symbol: 'EURUSD', value: 5380 },
                            { symbol: 'EURJPY', value: 3840 },
                            { symbol: 'GBPUSD', value: 580 },
                            { symbol: 'EURNZD', value: 390 },
                            { symbol: 'EURCAD', value: 947 },
                            { symbol: 'EURCHF', value: 670 },
                            { symbol: 'AUDUSD', value: 290 }
                          ].map((item, i) => {
                            const maxValue = 5380;
                            const height = (item.value / maxValue) * 200;
                            
                            return (
                              <Box 
                            key={i} 
                                sx={{ 
                                  display: 'flex', 
                                  flexDirection: 'column', 
                                  alignItems: 'center',
                                  position: 'relative',
                                  width: '40px'
                                }}
                              >
                                <Typography 
                            variant="caption" 
                  sx={{ 
                              color: colors.secondaryText,
                                    position: 'absolute',
                                    top: -20,
                                    fontSize: '11px'
                                  }}
                                >
                                  +${item.value}
                </Typography>
                                <Box 
                                  sx={{ 
                                    height: `${height}px`,
                                    width: '28px',
                                    backgroundColor: colors.buyGreen,
                                    borderRadius: '4px',
                                    transition: 'height 0.3s ease'
                                  }} 
                                />
                                <Typography 
                                  variant="caption" 
                                  sx={{ 
                                    color: colors.secondaryText,
                                    position: 'absolute',
                                    bottom: -25,
                                    fontSize: '11px'
                                  }}
                                >
                                  {item.symbol}
                                </Typography>
                              </Box>
                            );
                          })}
                        </Box>
                      </Box>
                    </Paper>
                  </Grid>
                </Grid>
                
                {/* Insights row - Make it wider */}
                <Grid item xs={12}>
                  <Paper 
                    sx={{ 
                      p: 4, 
                      backgroundColor: colors.panelBg,
                      border: `1px solid ${colors.borderColor}`,
                      borderRadius: '12px',
                      mt: 4,
                      width: '100%'
                    }}
                  >
                    <Typography variant="h6" sx={{ color: colors.primaryText, mb: 3, fontWeight: 'bold' }}>
                      Insights
                    </Typography>
                    
                    <Box sx={{ height: 140, width: 1180, display: 'flex', flexDirection: 'column', gap: 2 }}>
                      {simulationResults.insights.map((insight, index) => (
                        <Typography key={index} variant="body2" sx={{ 
                          color: colors.primaryText,
                          pl: 2,
                          borderLeft: `3px solid ${colors.accentBlue}`
                        }}>
                          {insight}
                        </Typography>
                      ))}
                      
                      <Typography variant="body2" sx={{ 
                        color: colors.primaryText,
                        pl: 2,
                        borderLeft: `3px solid ${colors.profitGreen}`,
                        mt: 1
                      }}>
                        Legacy with a copy ratio of 6 achieved the most profit of 69.24% Net P/L for the simulation amount and {simulationPeriod} selected.
                      </Typography>
                    </Box>
                  </Paper>
                </Grid>
              </Grid>
            </Paper>
          </Box>
        )}
        {step === 3 && tradingType === 'long-term' && (
          <Box sx={{ maxWidth: '1400px', mx: 'auto', mt: 5 }}>
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
                    onClick={() => setStep(1)}
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
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          {strategy.name}
                            <Tooltip
                              title={
                                <Box sx={{ p: 1 }}>
                                  <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>{strategy.name}</Typography>
                                  <Typography variant="body2" sx={{ mb: 1 }}>{strategy.description}</Typography>
                                  <Grid container spacing={1} sx={{ mt: 1 }}>
                                    <Grid item xs={6}>
                                      <Typography variant="caption" sx={{ color: colors.secondaryText }}>Risk Level:</Typography>
                                      <Typography variant="body2">{strategy.riskLevel.charAt(0).toUpperCase() + strategy.riskLevel.slice(1)}</Typography>
                                    </Grid>
                                    <Grid item xs={6}>
                                      <Typography variant="caption" sx={{ color: colors.secondaryText }}>Avg. Duration:</Typography>
                                      <Typography variant="body2">{strategy.avgDuration}</Typography>
                                    </Grid>
                                    <Grid item xs={6}>
                                      <Typography variant="caption" sx={{ color: colors.secondaryText }}>Max Drawdown:</Typography>
                                      <Typography variant="body2">{strategy.maxDrawdown}%</Typography>
                                    </Grid>
                                    <Grid item xs={6}>
                                      <Typography variant="caption" sx={{ color: colors.secondaryText }}>Sharpe Ratio:</Typography>
                                      <Typography variant="body2">{strategy.sharpeRatio}</Typography>
                                    </Grid>
                                  </Grid>
                                </Box>
                              }
                              arrow
                              placement="right"
                            >
                              <IconButton size="small" sx={{ ml: 1, color: colors.secondaryText }}>
                                <HelpOutlineIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </Box>
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
                                width: `calc(${(strategy.allocatedFunds / availableBalance) * 100}% * (1 - 22px/100%))`, 
                                background: `linear-gradient(90deg, ${colors.accentBlue}, ${colors.buyGreen})`,
                                borderRadius: '2px',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                maxWidth: 'calc(100% - 11px)' // Stop at center of thumb
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