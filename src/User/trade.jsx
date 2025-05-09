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
      description: 'Aggressive momentum-based strategy', 
      totalNetPL: '+121%', 
      oneYearNetPL: 14.37,
      threeMonthNetPL: 4.8,
      sixMonthNetPL: 8.9,
      riskLevel: 'high',
      avgDuration: '2-3 days',
      allocatedFunds: 0, 
      copyRatio: 0
    },
    { 
      id: 2, 
      name: 'Legacy', 
      description: 'Long-term trend following strategy', 
      totalNetPL: '+538%', 
      oneYearNetPL: 10.29,
      threeMonthNetPL: 2.1,
      sixMonthNetPL: 5.6,
      riskLevel: 'medium',
      avgDuration: '1-2 weeks',
      allocatedFunds: 0, 
      copyRatio: 0
    },
    { 
      id: 3, 
      name: 'Alpine', 
      description: 'Multi-timeframe swing trading', 
      totalNetPL: '+317%', 
      oneYearNetPL: 12.1, 
      threeMonthNetPL: 3.6,
      sixMonthNetPL: 12.26,
      riskLevel: 'medium-high',
      avgDuration: '3-5 days',
      allocatedFunds: 0, 
      copyRatio: 0
    },
    { 
      id: 4, 
      name: 'Ivory', 
      description: 'Counter-trend reversal strategy', 
      totalNetPL: '+125%', 
      oneYearNetPL: -1.3, 
      threeMonthNetPL: 5.2,
      sixMonthNetPL: 3.8,
      riskLevel: 'high',
      avgDuration: '8-12 hours',
      allocatedFunds: 0, 
      copyRatio: 0
    },
    { 
      id: 5, 
      name: 'Quantum', 
      description: 'Statistical arbitrage modeling', 
      totalNetPL: '+87%', 
      oneYearNetPL: 2.4, 
      threeMonthNetPL: 1.9,
      sixMonthNetPL: 1.4,
      riskLevel: 'low',
      avgDuration: '1-3 days',
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
    
    // Calculate weighted performance based on allocated strategies
    let weightedPerformance = 0;
    let totalAllocated = 0;
    
    // Add some randomness to make results more realistic
    const randomFactor = (Math.random() * 0.04) - 0.02; // Between -2% and +2%
    const marketConditionFactor = (Math.random() * 0.06) - 0.01; // Slightly biased positive
    
    // Calculate weighted performance based on actual selections
    selectedStrategies.forEach(strategy => {
      // Use different metrics based on the selected simulation period
      let performanceMetric;
      
      switch(simulationPeriod) {
        case '1 Month':
          performanceMetric = strategy.threeMonthNetPL / 3 * (1 + (Math.random() * 0.3 - 0.15));
          break;
        case '3 Months':
          performanceMetric = strategy.threeMonthNetPL * (1 + (Math.random() * 0.2 - 0.1));
          break;
        case '6 Months':
          performanceMetric = strategy.sixMonthNetPL * (1 + (Math.random() * 0.15 - 0.05));
          break;
        case '2 Years':
          performanceMetric = strategy.oneYearNetPL * 1.7 * (1 + (Math.random() * 0.2 - 0.05));
          break;
        case '1 Year':
        default:
          performanceMetric = strategy.oneYearNetPL * (1 + (Math.random() * 0.1 - 0.03));
      }
      
      // Apply copy ratio effect
      const copyRatioEffect = (strategy.copyRatio / 10) * 1.2; // Higher copy ratio = more closely follows strategy performance
      
      // Calculate this strategy's contribution
      const adjustedPerformance = performanceMetric * copyRatioEffect;
      weightedPerformance += (adjustedPerformance * strategy.allocatedFunds);
      totalAllocated += strategy.allocatedFunds;
    });
    
    // Calculate overall performance percentage
    const overallPerformancePercent = (weightedPerformance / totalAllocated) + randomFactor + marketConditionFactor;
    
    // Calculate final balance
    const startBalance = availableBalance;
    const endBalance = startBalance * (1 + (overallPerformancePercent / 100));
    
    // Random but plausible number of trades based on simulation period and strategies
    let tradingFrequencyMultiplier = 1;
    selectedStrategies.forEach(strategy => {
      if (strategy.riskLevel === 'high') tradingFrequencyMultiplier += 0.5;
      if (strategy.avgDuration.includes('hours')) tradingFrequencyMultiplier += 0.8;
    });
    
    // Calculate total trades based on period and strategies
    let baseTrades;
    switch(simulationPeriod) {
      case '1 Month':
        baseTrades = 250;
        break;
      case '3 Months':
        baseTrades = 720;
        break;
      case '6 Months':
        baseTrades = 1500;
        break;
      case '2 Years':
        baseTrades = 6500;
        break;
      case '1 Year':
      default:
        baseTrades = 3200;
    }
    
    const totalTrades = Math.round(baseTrades * tradingFrequencyMultiplier * (0.9 + Math.random() * 0.2));
    
    // Calculate realistic win rate based on performance
    const winRateBase = 50 + (overallPerformancePercent * 1.2);
    const winRate = Math.min(Math.max(winRateBase, 48), 68).toFixed(1); // Keep between 48% and 68%
    
    // Extract the number of months from the simulation period
    let months;
    if (simulationPeriod.includes('Month')) {
      months = parseInt(simulationPeriod) || 1;
    } else if (simulationPeriod.includes('Year')) {
      months = (parseInt(simulationPeriod) || 1) * 12;
    } else {
      months = 12; // Default to 1 year
    }
    
    // Generate realistic monthly data with ups and downs
    const monthlyData = [];
    let currentBalance = startBalance;
    
    for (let i = 0; i < months; i++) {
      // Create date object for each month
      const month = new Date();
      month.setMonth(month.getMonth() - (months - i - 1));
      
      // Generate realistic monthly movement with more variance
      // More volatile early on, then trending toward the final result
      const progressRatio = (i + 1) / months;
      const volatility = 0.5 - (progressRatio * 0.3); // Decreases over time
      
      // Random monthly change with some correlation to overall trend
      const randomChange = ((Math.random() * 2 - 1) * volatility * startBalance * 0.03);
      
      // Trend component - pulls toward the eventual end balance
      const trendComponent = ((endBalance - startBalance) / months) * (1 + (Math.random() * 0.3 - 0.15));
      
      // Calculate this month's balance
      const monthBalance = currentBalance + trendComponent + randomChange;
      
      // Ensure we don't go below a reasonable threshold
      currentBalance = Math.max(monthBalance, startBalance * 0.94);
      
      // Random number of trades for this month
      const monthTrades = Math.floor((totalTrades / months) * (0.7 + Math.random() * 0.6));
      
      monthlyData.push({
        date: month,
        balance: currentBalance,
        profit: (currentBalance - (i === 0 ? startBalance : monthlyData[i-1].balance)).toFixed(2),
        trades: monthTrades
      });
    }
    
    // Adjust final month to match the expected end balance
    if (monthlyData.length > 0) {
      monthlyData[monthlyData.length - 1].balance = endBalance;
    }
    
    // Generate realistic symbol performance based on strategies
    const symbolsBase = [
      { symbol: 'EURUSD', tradeWeight: 38, winRateBoost: 2 },
      { symbol: 'EURJPY', tradeWeight: 25, winRateBoost: 3 },
      { symbol: 'GBPUSD', tradeWeight: 12, winRateBoost: 0 },
      { symbol: 'EURNZD', tradeWeight: 8, winRateBoost: -1 },
      { symbol: 'EURCAD', tradeWeight: 7, winRateBoost: 2 },
      { symbol: 'EURCHF', tradeWeight: 6, winRateBoost: 1 },
      { symbol: 'AUDUSD', tradeWeight: 4, winRateBoost: 0 }
    ];
    
    const totalProfit = endBalance - startBalance;
    const symbols = symbolsBase.map(base => {
      // Randomize weight a little
      const weightVar = (Math.random() * 6) - 3;
      const weight = Math.max(1, base.tradeWeight + weightVar);
      
      // Calculate trades for this symbol
      const trades = Math.round((weight / 100) * totalTrades);
      
      // Calculate win rate and P/L for this symbol
      const symbolWinRate = Math.min(Math.max(parseFloat(winRate) + base.winRateBoost + (Math.random() * 6 - 3), 45), 72);
      const plPercentage = weight / 100;
      
      // Profit or loss for this symbol
      const pl = totalProfit * plPercentage * (1 + (Math.random() * 0.3 - 0.15));
      
      return {
        symbol: base.symbol,
        trades,
        winRate: symbolWinRate,
        pl: pl,
        weight: (weight / 100) * 100 // Convert to percentage
      };
    });
    
    // Normalize weights to ensure they sum close to 100%
    const totalWeight = symbols.reduce((sum, s) => sum + s.weight, 0);
    symbols.forEach(s => {
      s.weight = (s.weight / totalWeight) * 100;
    });
    
    // Generate realistic insights based on actual allocated strategies
    const insights = [];
    
    // Find best performing strategy in the simulation
    const bestStrategy = [...selectedStrategies].sort((a, b) => {
      const aPerf = a.oneYearNetPL * (a.copyRatio / 10);
      const bPerf = b.oneYearNetPL * (b.copyRatio / 10);
      return bPerf - aPerf;
    })[0];
    
    if (bestStrategy) {
      insights.push(`${bestStrategy.name} was the best performing in this simulation with ${bestStrategy.oneYearNetPL.toFixed(2)}% Net P/L`);
    }
    
    // Find highest overall P/L strategy that wasn't selected
    const unusedStrategies = strategies.filter(s => !selectedStrategies.some(selected => selected.id === s.id));
    if (unusedStrategies.length > 0) {
      const bestUnusedStrategy = [...unusedStrategies].sort((a, b) => b.oneYearNetPL - a.oneYearNetPL)[0];
      insights.push(`${bestUnusedStrategy.name} achieved ${bestUnusedStrategy.oneYearNetPL.toFixed(2)}% Net P/L over 1y but was not in the simulation`);
    }
    
    // Add insight about a strategy that performs better over a different timeframe
    if (selectedStrategies.length > 0) {
      const randomStrategy = selectedStrategies[Math.floor(Math.random() * selectedStrategies.length)];
      if (randomStrategy.sixMonthNetPL > randomStrategy.oneYearNetPL) {
        insights.push(`${randomStrategy.name} achieved a better result of ${randomStrategy.sixMonthNetPL.toFixed(2)}% Net P/L over 6m`);
      } else if (randomStrategy.threeMonthNetPL > randomStrategy.oneYearNetPL) {
        insights.push(`${randomStrategy.name} achieved a better result of ${randomStrategy.threeMonthNetPL.toFixed(2)}% Net P/L over 3m`);
      }
    }
    
    // Add insight about optimal copy ratio
    if (selectedStrategies.length > 0) {
      const highestCopyRatio = [...selectedStrategies].sort((a, b) => b.copyRatio - a.copyRatio)[0];
      const projectedReturn = ((highestCopyRatio.oneYearNetPL * highestCopyRatio.copyRatio) / 10).toFixed(2);
      insights.push(`${highestCopyRatio.name} with a copy ratio of ${highestCopyRatio.copyRatio} achieved the most profit of ${projectedReturn}% Net P/L for the simulation amount and ${simulationPeriod} selected.`);
    }
    
    setSimulationResults({
      startingBalance: startBalance,
      endingBalance: endBalance,
      totalProfit: endBalance - startBalance,
      profitPercentage: (((endBalance - startBalance) / startBalance) * 100).toFixed(2),
      totalTrades,
      winRate,
      monthlyData,
      symbols,
      insights
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
            
                      {/* Main chart - Dynamic balance graph using actual data */}
                      <Box sx={{ height: '180px', position: 'relative', mt: 2 }}>
                        <svg width="100%" height="100%" viewBox="0 0 300 180" preserveAspectRatio="none">
                          {/* Dynamic path for the balance curve */}
                          <path 
                            d={(() => {
                              // Generate SVG path based on actual monthly data
                              if (!simulationResults.monthlyData || simulationResults.monthlyData.length === 0) {
                                return "M0,150 C30,140 60,130 90,120 S150,100 180,80 S240,40 300,30";
                              }
                              
                              const data = simulationResults.monthlyData;
                              const minBalance = Math.min(simulationResults.startingBalance, ...data.map(d => d.balance));
                              const maxBalance = Math.max(...data.map(d => d.balance));
                              const range = maxBalance - minBalance;
                              
                              // Scale to SVG coordinates (y is inverted in SVG)
                              const scaleX = 300 / (data.length - 1);
                              const scaleY = range > 0 ? 150 / range : 1;
                              
                              // Generate path
                              return data.map((point, i) => {
                                const x = i * scaleX;
                                // Invert Y and add margin at the bottom
                                const y = 160 - ((point.balance - minBalance) * scaleY) + 10;
                                return `${i === 0 ? 'M' : 'L'}${x},${y}`;
                              }).join(' ');
                            })()}
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
                            d={(() => {
                              // Generate SVG path for area under the curve
                              if (!simulationResults.monthlyData || simulationResults.monthlyData.length === 0) {
                                return "M0,150 C30,140 60,130 90,120 S150,100 180,80 S240,40 300,30 V180 H0 Z";
                              }
                              
                              const data = simulationResults.monthlyData;
                              const minBalance = Math.min(simulationResults.startingBalance, ...data.map(d => d.balance));
                              const maxBalance = Math.max(...data.map(d => d.balance));
                              const range = maxBalance - minBalance;
                              
                              // Scale to SVG coordinates
                              const scaleX = 300 / (data.length - 1);
                              const scaleY = range > 0 ? 150 / range : 1;
                              
                              // Generate path and close it at the bottom
                              let path = data.map((point, i) => {
                                const x = i * scaleX;
                                // Invert Y and add margin at the bottom
                                const y = 160 - ((point.balance - minBalance) * scaleY) + 10;
                                return `${i === 0 ? 'M' : 'L'}${x},${y}`;
                              }).join(' ');
                              
                              // Close the path
                              path += ` L300,180 L0,180 Z`;
                              return path;
                            })()}
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
                    
                    <Box sx={{ height: '180px', position: 'relative', mt: 2, mb: 4 }}>
                      {/* Dynamic monthly P/L bar chart */}
                      <svg width="100%" height="100%" viewBox="0 0 300 180" preserveAspectRatio="none">
                        {simulationResults.monthlyData && simulationResults.monthlyData.map((month, index) => {
                          const months = simulationResults.monthlyData.length;
                          const barWidth = 300 / months - 4; // 4px spacing between bars
                          const x = index * (300 / months) + 2; // 2px offset from left
                          
                          // Find max profit across all months for scaling
                          const profits = simulationResults.monthlyData.map(m => parseFloat(m.profit));
                          const maxProfit = Math.max(...profits.map(p => Math.abs(p)));
                          
                          // Scale profit to bar height (max height 150px)
                          const profitValue = parseFloat(month.profit);
                          const height = Math.min(Math.abs(profitValue) / maxProfit * 150, 150);
                          
                          // Position bar - negative values go below centerline
                          const isPositive = profitValue >= 0;
                          const y = isPositive ? 90 - height : 90;
                          
                          // Format month abbreviation
                          const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                                             'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                          const monthName = monthNames[month.date.getMonth()];
                          
                          return (
                            <g key={index}>
                              {/* Bar */}
                              <rect 
                                x={x} 
                                y={y} 
                                width={barWidth} 
                                height={height > 0 ? height : 1} // Minimum height of 1px
                                fill={isPositive ? colors.buyGreen : colors.sellRed}
                                rx={1} // Slightly rounded corners
                              />
                              
                              {/* Month label */}
                              <text 
                                x={x + barWidth/2} 
                                y={175} 
                                textAnchor="middle" 
                                fontSize="8" 
                                fill={colors.secondaryText}
                              >
                                {monthName}
                              </text>
                              
                              {/* Profit label (only for bars tall enough) */}
                              {height > 25 && (
                                <text 
                                  x={x + barWidth/2} 
                                  y={isPositive ? y + 10 : y + height - 5} 
                                  textAnchor="middle" 
                                  fontSize="8" 
                                  fill="white"
                                >
                                  ${Math.abs(profitValue).toFixed(0)}
                                </text>
                              )}
                            </g>
                          );
                        })}
                        
                        {/* Center line for positive/negative separation */}
                        <line x1="0" y1="90" x2="300" y2="90" stroke={colors.borderColor} strokeWidth="1" opacity="0.5" />
                      </svg>
                    </Box>
                    
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="body2" sx={{ color: colors.secondaryText }}>
                        Avg. Monthly P/L
                      </Typography>
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          color: parseFloat(simulationResults.totalProfit / simulationResults.monthlyData.length) >= 0 
                            ? colors.profitGreen 
                            : colors.sellRed,
                          fontWeight: 'bold' 
                        }}
                      >
                        ${(simulationResults.totalProfit / simulationResults.monthlyData.length).toFixed(2)}
                        </Typography>
                      </Box>
                      
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
                      <Typography variant="body2" sx={{ color: colors.secondaryText }}>
                        Monthly Trades
                      </Typography>
                      <Typography variant="body2" sx={{ color: colors.primaryText, fontWeight: 'bold' }}>
                        {(simulationResults.totalTrades / simulationResults.monthlyData.length).toFixed(0)}
                        </Typography>
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
                      
                      {/* Dynamic Pie Chart for Symbol Distribution */}
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Box sx={{ width: '180px', height: '180px', position: 'relative' }}>
                          <svg width="100%" height="100%" viewBox="0 0 100 100">
                            {/* Generate pie chart from symbol data */}
                            {(() => {
                              if (!simulationResults.symbols || simulationResults.symbols.length === 0) return null;
                              
                              // Generate segments
                              const symbolsWithAngles = [];
                              let currentAngle = 0;
                              
                              // Calculate total for percentage
                              const totalWeight = simulationResults.symbols.reduce((sum, s) => sum + s.weight, 0);
                              
                              // Assign colors
                              const symbolColors = [
                                '#4caf50', // EURUSD - Green
                                '#2196f3', // EURJPY - Blue
                                '#ff9800', // GBPUSD - Orange
                                '#e91e63', // EURNZD - Pink
                                '#9c27b0', // EURCAD - Purple
                                '#ffeb3b', // EURCHF - Yellow
                                '#00bcd4'  // AUDUSD - Cyan
                              ];
                              
                              simulationResults.symbols.forEach((symbol, index) => {
                                const percentage = (symbol.weight / totalWeight) * 100;
                                const angle = percentage * 3.6; // Convert percentage to angle (360 degrees = 100%)
                                
                                symbolsWithAngles.push({
                                  ...symbol,
                                  startAngle: currentAngle,
                                  endAngle: currentAngle + angle,
                                  color: symbolColors[index % symbolColors.length]
                                });
                                
                                currentAngle += angle;
                              });
                              
                              // Generate SVG arcs
                              return symbolsWithAngles.map((symbol, index) => {
                                // Convert angles to radians for SVG arc
                                const startAngle = symbol.startAngle * Math.PI / 180;
                                const endAngle = symbol.endAngle * Math.PI / 180;
                                
                                // Calculate points
                                const centerX = 50;
                                const centerY = 50;
                                const radius = 40;
                                
                                // Determine start and end points
                                const startX = centerX + radius * Math.cos(startAngle);
                                const startY = centerY + radius * Math.sin(startAngle);
                                const endX = centerX + radius * Math.cos(endAngle);
                                const endY = centerY + radius * Math.sin(endAngle);
                                
                                // Create arc path - large arc flag is 1 if angle > 180 degrees
                                const largeArcFlag = endAngle - startAngle > Math.PI ? 1 : 0;
                                
                                // For very small segments, use a simple line instead of an arc
                                const path = symbol.weight < 1 
                                  ? `M ${centerX} ${centerY} L ${startX} ${startY} L ${endX} ${endY} Z`
                                  : `M ${centerX} ${centerY} L ${startX} ${startY} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${endX} ${endY} Z`;
                                
                                return <path key={index} d={path} fill={symbol.color} />;
                              });
                            })()}
                            
                            {/* Central circle (empty space) */}
                            <circle cx="50" cy="50" r="25" fill={colors.panelBg} />
                          </svg>
                        </Box>
                        
                        {/* Symbol Legend */}
                        <Box sx={{ flex: 1, ml: 3 }}>
                          {simulationResults.symbols && simulationResults.symbols.map((symbol, index) => (
                            <Box key={index} sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                              <Box 
                                sx={{ 
                                    width: 10, 
                                    height: 10, 
                                    borderRadius: '50%', 
                                  backgroundColor: [
                                    '#4caf50', '#2196f3', '#ff9800', '#e91e63', 
                                    '#9c27b0', '#ffeb3b', '#00bcd4'
                                  ][index % 7],
                                  mr: 1 
                                }} 
                              />
                              <Typography variant="body2" sx={{ color: colors.primaryText, mr: 1 }}>
                                {symbol.symbol}
                                  </Typography>
                                <Typography variant="body2" sx={{ color: colors.secondaryText }}>
                                {symbol.weight.toFixed(1)}%
                                </Typography>
                              </Box>
                          ))}
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
                      
                      <Box sx={{ height: '180px', position: 'relative', mt: 1, mb: 2 }}>
                        <svg width="100%" height="100%" viewBox="0 0 300 180" preserveAspectRatio="none">
                          {(() => {
                            if (!simulationResults.symbols || simulationResults.symbols.length === 0) return null;
                            
                            // Find the max P/L value for scaling
                            const maxPL = Math.max(...simulationResults.symbols.map(s => Math.abs(s.pl)));
                            const barWidth = 300 / simulationResults.symbols.length - 10;
                            
                            return (
                              <>
                                {/* Draw bars */}
                                {simulationResults.symbols.map((symbol, index) => {
                                  const x = index * (300 / simulationResults.symbols.length) + 5;
                                  const barHeight = Math.min((Math.abs(symbol.pl) / maxPL) * 140, 140); // Max height 140
                                  const y = symbol.pl >= 0 ? 160 - barHeight : 160;
                                  
                                  return (
                                    <g key={index}>
                                      {/* Bar */}
                                      <rect 
                                        x={x} 
                                        y={y} 
                                        width={barWidth} 
                                        height={barHeight > 0 ? barHeight : 1}
                                        fill={symbol.pl >= 0 ? colors.buyGreen : colors.sellRed}
                                        rx={2}
                                      />
                                      
                                      {/* Symbol label */}
                                      <text 
                                        x={x + barWidth/2} 
                                        y={175} 
                                        textAnchor="middle" 
                                        fontSize="8" 
                                        fill={colors.secondaryText}
                                      >
                                        {symbol.symbol}
                                      </text>
                                      
                                      {/* P/L value (only for larger bars) */}
                                      {barHeight > 25 && (
                                        <text 
                                          x={x + barWidth/2} 
                                          y={symbol.pl >= 0 ? y + 15 : y + barHeight - 5} 
                                          textAnchor="middle" 
                                          fontSize="8" 
                                          fill="white"
                                        >
                                          ${Math.abs(symbol.pl).toFixed(0)}
                                        </text>
                                      )}
                                    </g>
                            );
                          })}
                                
                                {/* Base line */}
                                <line x1="0" y1="160" x2="300" y2="160" stroke={colors.borderColor} strokeWidth="1" />
                              </>
                            );
                          })()}
                        </svg>
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