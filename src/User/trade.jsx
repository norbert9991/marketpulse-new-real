import React, { useState, useEffect, useRef } from 'react';
import { Box, Typography, Button, Paper, TextField, Select, MenuItem, FormControl, InputLabel } from '@mui/material';
import { createChart } from 'lightweight-charts';
import Sidebar from './Sidebar';

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

  // Initialize chart
  useEffect(() => {
    if (!chartContainerRef.current) return;

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

    // Create chart with proper dimensions
    const chart = createChart(container, {
      width: container.clientWidth,
      height: container.clientHeight,
      layout: {
        backgroundColor: '#1E1E1E',
        textColor: 'rgba(255, 255, 255, 0.9)',
      },
      grid: {
        vertLines: { color: '#2B2B43' },
        horzLines: { color: '#2B2B43' },
      },
      crosshair: {
        mode: 1,
      },
    });

    chartRef.current = chart;

    // Add series
    candleSeriesRef.current = chart.addCandlestickSeries({
      upColor: '#26a69a',
      downColor: '#ef5350',
      borderVisible: false,
      wickUpColor: '#26a69a',
      wickDownColor: '#ef5350',
    });

    lineSeriesRef.current = chart.addLineSeries({
      color: '#2962FF',
      lineWidth: 2,
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
  }, []);

  // Simulate live market data
  useEffect(() => {
    if (!chartRef.current || !candleSeriesRef.current) return;

    let intervalId;
    let lastClose = 1.08; // Starting price for EUR/USD
    
    const generateRandomCandle = () => {
      const open = lastClose;
      const change = (Math.random() - 0.5) * 0.005;
      const close = open + change;
      const high = Math.max(open, close) + Math.random() * 0.002;
      const low = Math.min(open, close) - Math.random() * 0.002;
      lastClose = close;
      
      return {
        open,
        high,
        low,
        close,
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
      
      candleSeriesRef.current.update(newCandle);
      lineSeriesRef.current.update({ time, value: newCandle.close });
    };

    // Initial data
    const initialData = [];
    const now = new Date();
    for (let i = 100; i >= 0; i--) {
      const time = (now.getTime() / 1000) - i * 60;
      initialData.push({
        time,
        ...generateRandomCandle(),
      });
    }
    
    setPriceData(initialData);
    candleSeriesRef.current.setData(initialData);
    lineSeriesRef.current.setData(initialData.map(d => ({ time: d.time, value: d.close })));
    
    // Start live updates
    intervalId = setInterval(generateData, 1000);
    
    return () => clearInterval(intervalId);
  }, [selectedPair]);

  const calculatePnl = (position, currentPrice) => {
    const priceDiff = position.type === 'buy' 
      ? currentPrice - position.price 
      : position.price - currentPrice;
    return priceDiff * position.amount * position.leverage;
  };

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

  const closePosition = () => {
    if (!position || !currentPrice) return;
    
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
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', backgroundColor: colors.darkBg }}>
      <Sidebar />
      
      <Box sx={{ flex: 1, p: 3, overflow: 'auto', ml: '250px' }}>
        <Typography 
          variant="h4" 
          gutterBottom 
          sx={{ 
            color: colors.primaryText,
            fontWeight: 'bold',
            mb: 3
          }}
        >
          Forex Market Simulation
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
                boxShadow: `0 4px 12px ${colors.shadowColor}`
              }}
            >
              <Box ref={chartContainerRef} sx={{ width: '100%', height: '100%', minHeight: '300px' }} />
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
                  mb: 3
                }}
              >
                Paper Trading
              </Typography>
              
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
                    <MenuItem value="limit" disabled sx={{ color: colors.secondaryText }}>Limit (Coming Soon)</MenuItem>
                    <MenuItem value="stop" disabled sx={{ color: colors.secondaryText }}>Stop (Coming Soon)</MenuItem>
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
                    {[1, 5, 10, 20, 30, 50].map(val => (
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
                  backgroundColor: colors.accentBlue,
                  '&:hover': {
                    backgroundColor: colors.accentBlue,
                    opacity: 0.9
                  }
                }}
              >
                {position ? 'Close Position' : 'Place Trade'}
              </Button>
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
                <Typography 
                  variant="body2" 
                  sx={{ 
                    color: calculatePnl(position, currentPrice) >= 0 ? colors.profitGreen : colors.lossRed 
                  }}
                >
                  Current PnL: ${calculatePnl(position, currentPrice).toFixed(2)}
                </Typography>
                <Button 
                  variant="outlined" 
                  color="error" 
                  fullWidth 
                  size="small"
                  onClick={closePosition}
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
            
            <Typography 
              variant="subtitle2" 
              gutterBottom 
              sx={{ color: colors.primaryText }}
            >
              Latest Trades
            </Typography>
            <Box sx={{ flex: 1, overflow: 'auto' }}>
              {trades.slice(-5).reverse().map((trade, i) => (
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
                  <Typography variant="caption" sx={{ color: colors.secondaryText }}>
                    {formatTime(trade.time)} - {trade.type.toUpperCase()} {trade.pair}
                  </Typography>
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      color: trade.pnl >= 0 ? colors.profitGreen : colors.lossRed 
                    }}
                  >
                    PnL: ${trade.pnl.toFixed(2)}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Paper>
        </Box>
      </Box>
    </Box>
  );
};

export default Trade;