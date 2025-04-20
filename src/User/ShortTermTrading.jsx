import React from 'react';
import { 
  Box, 
  Paper, 
  Typography, 
  FormControl, 
  Select, 
  MenuItem, 
  Button, 
  TextField, 
  IconButton,
  Switch
} from '@mui/material';
import CandlestickChartIcon from '@mui/icons-material/CandlestickChart';
import ShowChartIcon from '@mui/icons-material/ShowChart';

const ShortTermTrading = ({ 
  colors,
  selectedPair,
  setSelectedPair,
  forexPairs,
  currentPrice,
  position,
  calculatePnl,
  chartType,
  setChartType,
  showIndicators,
  setShowIndicators,
  totalBalance,
  availableBalance,
  chartContainerRef,
  leverage,
  setLeverage,
  amount,
  setAmount,
  quickAmounts,
  quickTrade,
  closePosition
}) => {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 80px)' }}>
      {/* Trading Interface Header */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        mb: 2, 
        p: 2,
        backgroundColor: colors.panelBg,
        borderRadius: '8px',
        border: `1px solid ${colors.borderColor}`
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <FormControl variant="outlined" size="small" sx={{ minWidth: 150, mr: 2 }}>
            <Select
              value={selectedPair}
              onChange={(e) => setSelectedPair(e.target.value)}
              sx={{ 
                bgcolor: colors.cardBg,
                color: colors.primaryText,
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
              {forexPairs.map(pair => (
                <MenuItem key={pair} value={pair} sx={{ bgcolor: colors.cardBg, color: colors.primaryText }}>
                  {pair}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Box>
            <Typography variant="h6" sx={{ color: colors.primaryText, fontWeight: 'bold' }}>
              {currentPrice ? currentPrice.toFixed(5) : '0.00000'}
            </Typography>
            <Typography variant="caption" sx={{ 
              color: position ? 
                (calculatePnl(position, currentPrice) >= 0 ? colors.buyGreen : colors.sellRed) 
                : colors.secondaryText 
            }}>
              {position && `P/L: ${calculatePnl(position, currentPrice).toFixed(2)}`}
            </Typography>
          </Box>
        </Box>
        
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          {/* Chart Type Selector */}
          <Box sx={{ mr: 2 }}>
            <IconButton 
              onClick={() => setChartType('candles')} 
              sx={{ 
                color: chartType === 'candles' ? colors.accentBlue : colors.secondaryText,
                p: 1
              }}
            >
              <CandlestickChartIcon />
            </IconButton>
            <IconButton 
              onClick={() => setChartType('line')} 
              sx={{ 
                color: chartType === 'line' ? colors.accentBlue : colors.secondaryText,
                p: 1
              }}
            >
              <ShowChartIcon />
            </IconButton>
          </Box>
          
          {/* Indicators Toggle */}
          <Box sx={{ display: 'flex', alignItems: 'center', mr: 2 }}>
            <Typography variant="body2" sx={{ color: colors.secondaryText, mr: 1 }}>
              Indicators
            </Typography>
            <Switch 
              checked={showIndicators} 
              onChange={(e) => setShowIndicators(e.target.checked)}
              sx={{
                '.MuiSwitch-track': {
                  backgroundColor: showIndicators ? colors.accentBlue : colors.borderColor,
                },
                '.MuiSwitch-thumb': {
                  backgroundColor: colors.primaryText,
                }
              }}
            />
          </Box>
          
          {/* Account Summary */}
          <Box>
            <Typography variant="body2" sx={{ color: colors.secondaryText, textAlign: 'right' }}>
              Balance: ${totalBalance.toFixed(2)}
            </Typography>
            <Typography variant="body2" sx={{ color: colors.secondaryText, textAlign: 'right' }}>
              Available: ${availableBalance.toFixed(2)}
            </Typography>
          </Box>
        </Box>
      </Box>
      
      {/* Main Trading Area */}
      <Box sx={{ display: 'flex', flex: 1, gap: 2 }}>
        {/* Left Panel - Chart */}
        <Box sx={{ flex: 3, borderRadius: '8px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          {/* Price Chart */}
          <Paper sx={{ 
            flex: 1, 
            bgcolor: colors.panelBg, 
            p: 2,
            border: `1px solid ${colors.borderColor}`,
            borderRadius: '8px',
            mb: 1,
            overflow: 'hidden'
          }}>
            <Box 
              ref={chartContainerRef} 
              sx={{ 
                width: '100%', 
                height: '100%',
                '.tv-lightweight-charts': {
                  backgroundColor: 'transparent !important',
                },
                'canvas': {
                  backgroundColor: 'transparent !important',
                }
              }} 
            />
          </Paper>
        </Box>
        
        {/* Right Panel - Orders and Positions */}
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
          {/* Quick Trade Panel */}
          <Paper sx={{ 
            p: 2, 
            bgcolor: colors.panelBg, 
            border: `1px solid ${colors.borderColor}`,
            borderRadius: '8px'
          }}>
            <Typography variant="subtitle1" sx={{ color: colors.primaryText, mb: 2, fontWeight: 'bold' }}>
              Quick Trade
            </Typography>
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="body2" sx={{ color: colors.secondaryText }}>
                Leverage:
              </Typography>
              <FormControl variant="outlined" size="small" sx={{ minWidth: 80 }}>
                <Select
                  value={leverage}
                  onChange={(e) => setLeverage(e.target.value)}
                  sx={{ 
                    bgcolor: colors.cardBg,
                    color: colors.primaryText,
                    height: '30px',
                    '.MuiOutlinedInput-notchedOutline': {
                      borderColor: colors.borderColor
                    }
                  }}
                >
                  {[1, 5, 10, 20, 50, 100].map(lev => (
                    <MenuItem key={lev} value={lev} sx={{ bgcolor: colors.cardBg, color: colors.primaryText }}>
                      {lev}x
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
            
            {/* Amount Buttons */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="body2" sx={{ color: colors.secondaryText, mb: 1 }}>
                Amount:
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {quickAmounts.map(amt => (
                  <Button 
                    key={amt}
                    variant={amount === amt ? "contained" : "outlined"}
                    size="small"
                    onClick={() => setAmount(amt)}
                    sx={{ 
                      minWidth: '60px',
                      borderColor: colors.borderColor,
                      color: amount === amt ? colors.primaryText : colors.secondaryText,
                      bgcolor: amount === amt ? colors.accentBlue : 'transparent',
                      '&:hover': {
                        bgcolor: amount === amt ? colors.accentBlue : colors.hoverBg,
                      }
                    }}
                  >
                    ${amt}
                  </Button>
                ))}
                <TextField
                  size="small"
                  placeholder="Custom"
                  value={amount !== quickAmounts[0] && amount !== quickAmounts[1] && 
                        amount !== quickAmounts[2] && amount !== quickAmounts[3] ? amount : ''}
                  onChange={(e) => {
                    const value = parseFloat(e.target.value);
                    if (!isNaN(value) && value > 0) {
                      setAmount(value);
                    } else if (e.target.value === '') {
                      setAmount('');
                    }
                  }}
                  InputProps={{
                    startAdornment: <Typography sx={{ color: colors.secondaryText, mr: 0.5 }}>$</Typography>
                  }}
                  sx={{ 
                    maxWidth: '100px',
                    bgcolor: colors.cardBg,
                    '.MuiOutlinedInput-root': {
                      color: colors.primaryText,
                      borderColor: colors.borderColor,
                    },
                    '.MuiOutlinedInput-notchedOutline': {
                      borderColor: colors.borderColor
                    }
                  }}
                />
              </Box>
            </Box>
            
            {/* Buy/Sell Buttons */}
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button
                fullWidth
                variant="contained"
                onClick={() => quickTrade(amount, true)}
                sx={{
                  bgcolor: colors.buyGreen,
                  color: colors.primaryText,
                  '&:hover': {
                    bgcolor: '#00c853',  // Darker green
                  }
                }}
              >
                BUY
              </Button>
              <Button
                fullWidth
                variant="contained"
                onClick={() => quickTrade(amount, false)}
                sx={{
                  bgcolor: colors.sellRed,
                  color: colors.primaryText,
                  '&:hover': {
                    bgcolor: '#d50000',  // Darker red
                  }
                }}
              >
                SELL
              </Button>
            </Box>
          </Paper>
          
          {/* Current Position Panel */}
          <Paper sx={{ 
            p: 2, 
            bgcolor: colors.panelBg, 
            border: `1px solid ${colors.borderColor}`,
            borderRadius: '8px',
            flex: 1
          }}>
            <Typography variant="subtitle1" sx={{ color: colors.primaryText, mb: 2, fontWeight: 'bold' }}>
              Current Position
            </Typography>
            
            {position ? (
              <>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2" sx={{ color: colors.secondaryText }}>
                    Symbol:
                  </Typography>
                  <Typography variant="body2" sx={{ color: colors.primaryText, fontWeight: 'bold' }}>
                    {position.pair}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2" sx={{ color: colors.secondaryText }}>
                    Direction:
                  </Typography>
                  <Typography variant="body2" sx={{ 
                    color: position.type === 'buy' ? colors.buyGreen : colors.sellRed,
                    fontWeight: 'bold'
                  }}>
                    {position.type.toUpperCase()}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2" sx={{ color: colors.secondaryText }}>
                    Open Price:
                  </Typography>
                  <Typography variant="body2" sx={{ color: colors.primaryText }}>
                    {position.price.toFixed(5)}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2" sx={{ color: colors.secondaryText }}>
                    Current Price:
                  </Typography>
                  <Typography variant="body2" sx={{ color: colors.primaryText }}>
                    {currentPrice?.toFixed(5) || '0.00000'}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2" sx={{ color: colors.secondaryText }}>
                    Size:
                  </Typography>
                  <Typography variant="body2" sx={{ color: colors.primaryText }}>
                    ${position.amount.toFixed(2)}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2" sx={{ color: colors.secondaryText }}>
                    Leverage:
                  </Typography>
                  <Typography variant="body2" sx={{ color: colors.primaryText }}>
                    {position.leverage}x
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                  <Typography variant="body2" sx={{ color: colors.secondaryText }}>
                    Profit/Loss:
                  </Typography>
                  <Typography variant="body2" sx={{ 
                    color: calculatePnl(position, currentPrice) >= 0 ? colors.buyGreen : colors.sellRed,
                    fontWeight: 'bold'
                  }}>
                    ${calculatePnl(position, currentPrice).toFixed(2)}
                  </Typography>
                </Box>
                <Button
                  fullWidth
                  variant="contained"
                  onClick={() => closePosition()}
                  sx={{ 
                    bgcolor: colors.accentBlue,
                    '&:hover': {
                      bgcolor: colors.accentBlue,
                      opacity: 0.9
                    }
                  }}
                >
                  Close Position
                </Button>
              </>
            ) : (
              <Box sx={{ 
                height: '100%', 
                display: 'flex', 
                flexDirection: 'column', 
                justifyContent: 'center', 
                alignItems: 'center',
                opacity: 0.7
              }}>
                <Typography variant="body2" sx={{ color: colors.secondaryText, mb: 2, textAlign: 'center' }}>
                  No active positions
                </Typography>
                <Typography variant="caption" sx={{ color: colors.secondaryText, textAlign: 'center' }}>
                  Use the Quick Trade panel to open a position
                </Typography>
              </Box>
            )}
          </Paper>
        </Box>
      </Box>
    </Box>
  );
};

export default ShortTermTrading; 