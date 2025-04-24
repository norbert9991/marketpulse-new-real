import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Box, Typography, Button, Paper, TextField, Select, MenuItem, FormControl, InputLabel, Tabs, Tab, Grid, Divider, IconButton, Chip, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Switch, Tooltip } from '@mui/material';
import Sidebar from './Sidebar';
import BarChartIcon from '@mui/icons-material/BarChart';
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
  
  // Trading state - remove short-term trading specific state
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
      description: 'Conservative trend-following strategy using major currency pairs',
      tooltip: 'Triumph follows market trends with minimal risk. It uses a combination of moving averages and momentum indicators to identify sustained trends across major forex pairs, particularly EUR/USD and USD/JPY. Ideal for stable, consistent returns.',
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
      description: 'Momentum-based strategy focusing on breakouts and pullbacks',
      tooltip: 'Legacy capitalizes on strong market momentum and breakouts. It identifies key support/resistance levels and trades when price breaks through these levels with volume. Good performance in volatile markets with clear directional movement.',
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
      description: 'Range-trading strategy exploiting overbought and oversold conditions',
      tooltip: 'Alpine excels in range-bound markets by identifying overbought and oversold conditions. It uses oscillators like RSI and Stochastic to find potential reversal points. Most effective during sideways market conditions with predictable trading ranges.',
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
      description: 'Contrarian strategy that trades against extreme market movements',
      tooltip: 'Ivory is a contrarian strategy that trades against extreme market moves. It looks for overextended price actions and takes positions in the opposite direction. Higher risk but potentially rewarding during market reversals after strong trends.',
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
      description: 'High-frequency scalping algorithm targeting small price movements',
      tooltip: 'Quantum employs high-frequency trading techniques to capture small price movements across multiple currency pairs. It makes many rapid trades with tight profit targets. Highest risk profile but potential for steady returns in all market conditions.',
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
                  
                  <Box sx={{ 
                    position: 'absolute', 
                    top: '50%', 
                    left: 0,
                    width: `${(Math.min(simulationAmount, 100000) - 1000) / (100000 - 1000) * 100}%`, 
                    height: '6px', 
                    transform: 'translateY(-50%)',
                    background: `linear-gradient(90deg, ${colors.accentBlue}, ${colors.buyGreen})`,
                    borderRadius: '3px',
                    transition: 'width 0.3s ease',
                    ml: 4,
                    maxWidth: 'calc(100% - 32px)'
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

              {/* Replace the layout for the first row of panels */}
              <Grid container spacing={3} sx={{ mb: 3 }}>
                {/* Balance Panel */}
                <Grid item xs={12} md={4}>
                  <Paper 
                    sx={{ 
                      p: 3, 
                      backgroundColor: colors.panelBg,
                      border: `1px solid ${colors.borderColor}`,
                      borderRadius: '12px',
                      height: '100%',
                      minHeight: '320px'
                    }}
                  >
                    <Typography variant="h6" sx={{ color: colors.primaryText, mb: 2, fontWeight: 'bold' }}>
                      Balance
                    </Typography>
                    
                    <Box sx={{ position: 'relative', mb: 3, height: '180px' }}>
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
                      <Box sx={{ height: '100%', position: 'relative' }}>
                        <svg width="100%" height="100%" viewBox="0 0 300 180" preserveAspectRatio="none">
                          {/* Path for the balance curve */}
                          <path 
                            d="M0,150 C30,140 60,130 90,120 S150,100 180,80 S240,40 300,30"
                            fill="none"
                            stroke={colors.accentBlue}
                            strokeWidth="3"
                          />
                          
                          {/* Fill gradient below the line */}
                          <linearGradient id="balanceGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor={colors.accentBlue} stopOpacity="0.3" />
                            <stop offset="100%" stopColor={colors.accentBlue} stopOpacity="0.0" />
                          </linearGradient>
                          
                          <path 
                            d="M0,150 C30,140 60,130 90,120 S150,100 180,80 S240,40 300,30 L300,180 L0,180 Z"
                            fill="url(#balanceGradient)"
                          />
                          
                          {/* Starting point label */}
                          <text x="0" y="170" fontSize="12" fill={colors.secondaryText}>
                            $10,000
                          </text>
                          
                          {/* Ending point label */}
                          <text x="280" y="40" fontSize="12" fill={colors.primaryText} fontWeight="bold">
                            $11,210
                          </text>
                        </svg>
                      </Box>
                    </Box>
                    
                    {/* Balance details */}
                    <Box sx={{ mt: 2 }}>
                      <Grid container spacing={2}>
                        <Grid item xs={6}>
                          <Typography variant="caption" sx={{ color: colors.secondaryText }}>
                            Starting Balance
                          </Typography>
                          <Typography variant="body2" sx={{ color: colors.primaryText, fontWeight: 'bold' }}>
                            ${simulationResults.startingBalance.toLocaleString()}
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="caption" sx={{ color: colors.secondaryText }}>
                            Ending Balance
                          </Typography>
                          <Typography variant="body2" sx={{ color: colors.primaryText, fontWeight: 'bold' }}>
                            ${simulationResults.endingBalance.toLocaleString()}
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="caption" sx={{ color: colors.secondaryText }}>
                            Total Profit
                          </Typography>
                          <Typography variant="body2" sx={{ color: colors.profitGreen, fontWeight: 'bold' }}>
                            ${simulationResults.totalProfit.toLocaleString()} ({simulationResults.profitPercentage}%)
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="caption" sx={{ color: colors.secondaryText }}>
                            Total Trades
                          </Typography>
                          <Typography variant="body2" sx={{ color: colors.primaryText, fontWeight: 'bold' }}>
                            {simulationResults.totalTrades.toLocaleString()}
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="caption" sx={{ color: colors.secondaryText }}>
                            Win Rate
                          </Typography>
                          <Typography variant="body2" sx={{ color: colors.primaryText, fontWeight: 'bold' }}>
                            {simulationResults.winRate}%
                          </Typography>
                        </Grid>
                      </Grid>
                    </Box>
                  </Paper>
                </Grid>
                
                {/* Monthly P/L Panel */}
                <Grid item xs={12} md={8}>
                  <Paper 
                    sx={{ 
                      p: 3, 
                      backgroundColor: colors.panelBg,
                      border: `1px solid ${colors.borderColor}`,
                      borderRadius: '12px',
                      height: '100%',
                      minHeight: '320px'
                    }}
                  >
                    <Typography variant="h6" sx={{ color: colors.primaryText, mb: 2, fontWeight: 'bold' }}>
                      Monthly P/L
                    </Typography>
                    
                    {/* Monthly chart */}
                    <Box sx={{ height: '220px' }}>
                      <svg width="100%" height="180" viewBox="0 0 600 180" preserveAspectRatio="none">
                        {/* Grid lines */}
                        <line x1="0" y1="140" x2="600" y2="140" stroke={colors.borderColor} strokeDasharray="4" strokeWidth="1" />
                        <line x1="0" y1="100" x2="600" y2="100" stroke={colors.borderColor} strokeDasharray="4" strokeWidth="1" />
                        <line x1="0" y1="60" x2="600" y2="60" stroke={colors.borderColor} strokeDasharray="4" strokeWidth="1" />
                        <line x1="0" y1="20" x2="600" y2="20" stroke={colors.borderColor} strokeDasharray="4" strokeWidth="1" />
                        
                        {/* Bars for each month */}
                        {simulationResults.monthlyData.map((month, i) => {
                          const maxProfit = Math.max(...simulationResults.monthlyData.map(m => parseFloat(m.profit)));
                          const barHeight = (parseFloat(month.profit) / maxProfit) * 120;
                          const barWidth = 35;
                          const spacing = 12;
                          const totalWidth = simulationResults.monthlyData.length * (barWidth + spacing);
                          const startX = (600 - totalWidth) / 2;
                          const x = startX + i * (barWidth + spacing);
                          
                          const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                          
                          return (
                            <g key={i}>
                              <rect 
                                x={x} 
                                y={150 - barHeight} 
                                width={barWidth} 
                                height={barHeight}
                                rx={4}
                                fill={colors.buyGreen}
                              />
                              
                              <text
                                x={x + barWidth/2}
                                y={160}
                                textAnchor="middle"
                                fontSize="11"
                                fill={colors.secondaryText}
                              >
                                {monthNames[month.date.getMonth()]}
                              </text>
                              
                              <text
                                x={x + barWidth/2}
                                y={145 - barHeight}
                                textAnchor="middle"
                                fontSize="10"
                                fill={colors.buyGreen}
                              >
                                ${parseFloat(month.profit).toFixed(0)}
                              </text>
                            </g>
                          );
                        })}
                      </svg>
                    </Box>
                    
                    {/* Monthly details */}
                    <Box sx={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      mt: 1,
                      pt: 1,
                      borderTop: `1px solid ${colors.borderColor}`
                    }}>
                      <Box>
                        <Typography variant="caption" sx={{ color: colors.secondaryText }}>
                          Avg. Monthly P/L
                        </Typography>
                        <Typography variant="body2" sx={{ color: colors.buyGreen, fontWeight: 'bold' }}>
                          +${(simulationResults.totalProfit / simulationResults.monthlyData.length).toFixed(2)}
                        </Typography>
                      </Box>
                      
                      <Box sx={{ textAlign: 'right' }}>
                        <Typography variant="caption" sx={{ color: colors.secondaryText }}>
                          Monthly Trades
                        </Typography>
                        <Typography variant="body2" sx={{ color: colors.primaryText, fontWeight: 'bold' }}>
                          {(simulationResults.totalTrades / simulationResults.monthlyData.length).toFixed(0)}
                        </Typography>
                      </Box>
                    </Box>
                  </Paper>
                </Grid>
              </Grid>
              
              {/* Replace layout for the second row with Symbols and Symbols P/L */}
              <Grid container spacing={4} sx={{ mt: 2 }}>
                {/* Symbols Panel */}
                <Grid item xs={12} md={6}>
                  <Paper sx={{ 
                    p: 4, 
                    backgroundColor: colors.panelBg,
                    border: `1px solid ${colors.borderColor}`,
                    borderRadius: '12px',
                    height: '100%'
                  }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                      <Typography variant="h6" sx={{ color: colors.primaryText, fontWeight: 'bold' }}>
                        Symbols
                      </Typography>
                      <Button 
                        variant="text" 
                        size="small"
                        sx={{ 
                          color: colors.accentBlue,
                          fontSize: '0.75rem',
                          py: 0.5
                        }}
                      >
                        All Symbols
                      </Button>
                    </Box>
                    
                    {/* Revert to donut/pie chart display */}
                    <Box sx={{ display: 'flex', height: 250 }}>
                      {/* Donut chart */}
                      <Box sx={{ 
                        width: 240, 
                        height: 240, 
                        position: 'relative',
                        margin: '0 auto'
                      }}>
                        <svg width="240" height="240" viewBox="0 0 240 240">
                          <g transform="translate(120, 120)">
                            {simulationResults.symbols.map((symbol, i) => {
                              const startAngle = i > 0 
                                ? simulationResults.symbols.slice(0, i).reduce((sum, s) => sum + s.weight, 0) / 100 * Math.PI * 2 
                                : 0;
                              const endAngle = startAngle + (symbol.weight / 100) * Math.PI * 2;
                              
                              const x1 = Math.sin(startAngle) * 100;
                              const y1 = -Math.cos(startAngle) * 100;
                              const x2 = Math.sin(endAngle) * 100;
                              const y2 = -Math.cos(endAngle) * 100;
                              
                              const largeArcFlag = endAngle - startAngle > Math.PI ? 1 : 0;
                              
                              const pathData = [
                                `M ${x1} ${y1}`,
                                `A 100 100 0 ${largeArcFlag} 1 ${x2} ${y2}`,
                                `L 0 0`,
                                `Z`
                              ].join(' ');
                              
                              const chartColors = [
                                '#00E676', // Green
                                '#2196F3', // Blue
                                '#FF9800', // Orange
                                '#E91E63', // Pink
                                '#9C27B0', // Purple
                                '#FFEB3B', // Yellow
                                '#00BCD4'  // Cyan
                              ];
                              
                              return (
                                <path 
                                  key={symbol.symbol}
                                  d={pathData}
                                  fill={chartColors[i % chartColors.length]}
                                  stroke={colors.cardBg}
                                  strokeWidth="1"
                                />
                              );
                            })}
                            <circle cx="0" cy="0" r="60" fill={colors.cardBg} />
                          </g>
                        </svg>
                      </Box>
                      
                      {/* Legend */}
                      <Box sx={{ 
                        display: 'flex',
                        flexDirection: 'column',
                        mt: 2, 
                        ml: 2, 
                        maxHeight: 240, 
                        overflow: 'auto',
                        justifyContent: 'center'
                      }}>
                        {simulationResults.symbols.map((symbol, i) => {
                          const chartColors = [
                            '#00E676', // Green
                            '#2196F3', // Blue
                            '#FF9800', // Orange
                            '#E91E63', // Pink
                            '#9C27B0', // Purple
                            '#FFEB3B', // Yellow
                            '#00BCD4'  // Cyan
                          ];
                          
                          return (
                            <Box key={symbol.symbol} sx={{ 
                              display: 'flex', 
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              mb: 1,
                              width: '100%'
                            }}>
                              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <Box 
                                  sx={{ 
                                    width: 12, 
                                    height: 12, 
                                    borderRadius: '2px', 
                                    backgroundColor: chartColors[i % chartColors.length],
                                    mr: 1
                                  }} 
                                />
                                <Typography variant="body2" sx={{ mr: 1, color: colors.primaryText }}>
                                  {symbol.symbol}
                                </Typography>
                              </Box>
                              
                              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                                <Typography variant="body2" sx={{ color: colors.primaryText, fontWeight: 'bold' }}>
                                  {symbol.weight.toFixed(1)}%
                                </Typography>
                                <Typography variant="caption" sx={{ color: colors.secondaryText }}>
                                  {symbol.trades} trades
                                </Typography>
                              </Box>
                            </Box>
                          );
                        })}
                      </Box>
                    </Box>
                  </Paper>
                </Grid>
                
                {/* Symbols P/L Panel */}
                <Grid item xs={12} md={6}>
                  <Paper sx={{ 
                    p: 4, 
                    backgroundColor: colors.panelBg,
                    border: `1px solid ${colors.borderColor}`,
                    borderRadius: '12px',
                    height: '100%'
                  }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                      <Typography variant="h6" sx={{ color: colors.primaryText, fontWeight: 'bold' }}>
                        Symbols P/L
                      </Typography>
                      <Button 
                        variant="text" 
                        size="small"
                        sx={{ 
                          color: colors.accentBlue,
                          fontSize: '0.75rem',
                          py: 0.5
                        }}
                      >
                        All Symbols
                      </Button>
                    </Box>
                    
                    {/* Bar chart styled similar to Monthly P/L */}
                    <Box sx={{ height: 250, position: 'relative' }}>
                      <svg width="100%" height="210" viewBox="0 0 600 210" preserveAspectRatio="none">
                        {/* Background grid lines */}
                        <line x1="0" y1="180" x2="600" y2="180" stroke={colors.borderColor} strokeWidth="1" strokeDasharray="4,4" />
                        <line x1="0" y1="140" x2="600" y2="140" stroke={colors.borderColor} strokeWidth="1" strokeDasharray="4,4" />
                        <line x1="0" y1="100" x2="600" y2="100" stroke={colors.borderColor} strokeWidth="1" strokeDasharray="4,4" />
                        <line x1="0" y1="60" x2="600" y2="60" stroke={colors.borderColor} strokeWidth="1" strokeDasharray="4,4" />
                        
                        <g>
                          {simulationResults.symbols.map((symbol, i) => {
                            const maxProfit = Math.max(...simulationResults.symbols.map(s => s.pl));
                            const barHeight = (symbol.pl / maxProfit) * 160; // Scale to match grid
                            
                            // Calculate spacing based on number of items
                            const totalBars = simulationResults.symbols.length;
                            const availableWidth = 500;
                            const barWidth = Math.min(Math.floor(availableWidth / totalBars / 2), 50);
                            const spacing = Math.floor((availableWidth - (barWidth * totalBars)) / totalBars);
                            
                            // Center the bars
                            const startX = 50; // Start 50px from left edge
                            const x = startX + i * (barWidth + spacing);
                            
                            return (
                              <g key={symbol.symbol}>
                                {/* Bar */}
                                <rect
                                  x={x}
                                  y={180 - barHeight}
                                  width={barWidth}
                                  height={barHeight}
                                  rx={4}
                                  fill={colors.buyGreen}
                                  opacity={0.85}
                                />
                                
                                {/* Value */}
                                <text
                                  x={x + barWidth / 2}
                                  y={180 - barHeight - 10}
                                  textAnchor="middle"
                                  fontSize="12"
                                  fill={colors.buyGreen}
                                  fontWeight="bold"
                                >
                                  +${symbol.pl.toFixed(0)}
                                </text>
                                
                                {/* Symbol */}
                                <text
                                  x={x + barWidth / 2}
                                  y={200}
                                  textAnchor="middle"
                                  fontSize="10"
                                  fill={colors.secondaryText}
                                >
                                  {symbol.symbol.replace('USD', '')}
                                </text>
                              </g>
                            );
                          })}
                        </g>
                      </svg>
                      
                      {/* Display Average P/L and Total Trades at bottom like in Monthly P/L */}
                      <Box sx={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        mt: 1,
                        pt: 1,
                        borderTop: `1px solid ${colors.borderColor}`
                      }}>
                        <Box>
                          <Typography variant="caption" sx={{ color: colors.secondaryText, display: 'block' }}>
                            Avg. Symbol P/L
                          </Typography>
                          <Typography 
                            variant="body2" 
                            sx={{ 
                              color: colors.buyGreen, 
                              fontWeight: 'bold' 
                            }}
                          >
                            +${(simulationResults.symbols.reduce((sum, s) => sum + s.pl, 0) / simulationResults.symbols.length).toFixed(2)}
                          </Typography>
                        </Box>
                        
                        <Box sx={{ textAlign: 'right' }}>
                          <Typography variant="caption" sx={{ color: colors.secondaryText, display: 'block' }}>
                            Total Trades
                          </Typography>
                          <Typography variant="body2" sx={{ color: colors.primaryText, fontWeight: 'bold' }}>
                            {simulationResults.symbols.reduce((sum, s) => sum + s.trades, 0)}
                          </Typography>
                        </Box>
                      </Box>
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