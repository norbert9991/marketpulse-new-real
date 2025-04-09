import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Grid, 
  CircularProgress, 
  Chip, 
  Divider,
  Button,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  IconButton
} from '@mui/material';
import { 
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Refresh as RefreshIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip as ChartTooltip,
  Legend,
  Filler
} from 'chart.js';
import { API } from '../axiosConfig';

// Get the base API URL for logging
const API_URL = 
  process.env.NODE_ENV === 'production' 
    ? 'https://marketpulse-new-real.onrender.com'
    : (process.env.REACT_APP_API_URL || 'http://localhost:5000');

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  ChartTooltip,
  Legend,
  Filler
);

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

// Chart.js options for the dark theme
const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  interaction: {
    mode: 'index',
    intersect: false,
  },
  plugins: {
    legend: {
      display: true,
      position: 'top',
      labels: {
        color: '#A0A5B8',
        font: {
          family: "'Roboto', sans-serif",
          size: 12
        },
        boxWidth: 12,
        usePointStyle: true,
      }
    },
    tooltip: {
      mode: 'index',
      intersect: false,
      backgroundColor: '#1E2235',
      titleColor: '#FFFFFF',
      bodyColor: '#A0A5B8',
      borderColor: '#2A2F45',
      borderWidth: 1,
      padding: 12,
      displayColors: true,
      callbacks: {
        label: function(context) {
          return `${context.dataset.label}: ${context.parsed.y.toFixed(5)}`;
        }
      }
    }
  },
  scales: {
    x: {
      grid: {
        color: 'rgba(42, 47, 69, 0.5)',
        drawBorder: false,
      },
      ticks: {
        color: '#A0A5B8',
        maxRotation: 0,
        font: {
          size: 10
        }
      }
    },
    y: {
      grid: {
        color: 'rgba(42, 47, 69, 0.5)',
        drawBorder: false,
      },
      ticks: {
        color: '#A0A5B8',
        font: {
          size: 10
        }
      }
    }
  }
};

const MarketAnalysis = ({ selectedSymbol }) => {
  const [analysisData, setAnalysisData] = useState(null);
  const [historyData, setHistoryData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [error, setError] = useState(null);
  const [historyError, setHistoryError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    if (selectedSymbol) {
      fetchMarketAnalysis(selectedSymbol);
      fetchPriceHistory(selectedSymbol);
    }
  }, [selectedSymbol]);

  const fetchMarketAnalysis = async (symbol) => {
    setLoading(true);
    setError(null);
    try {
      const response = await API.market.analyze({ symbol });
      console.log('Market analysis response:', response.status);
      setAnalysisData(response.data);
      // Reset retry count on successful fetch
      setRetryCount(0);
    } catch (err) {
      console.error('Error fetching market analysis:', err);
      
      // Handle specific error cases
      if (err.response?.status === 500) {
        console.log('Server error encountered when fetching market analysis');
        if (retryCount < 2) {
          // Try again after a delay for server errors
          console.log(`Retrying market analysis fetch (attempt ${retryCount + 1})`);
          setTimeout(() => {
            setRetryCount(prev => prev + 1);
            fetchMarketAnalysis(symbol);
          }, 2000);
        } else {
          setError('The server encountered an error processing this request. Please try again later.');
        }
      } else {
        setError(err.response?.data?.error || 'Failed to fetch market analysis data');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchPriceHistory = async (symbol) => {
    setHistoryLoading(true);
    setHistoryError(null);
    try {
      // Try to strip the -X suffix for troubleshooting
      // Even though this is now also handled in axiosConfig.js
      const plainSymbol = symbol.includes('-X') ? symbol.split('-X')[0] : symbol;
      
      console.log('Fetching price history for symbol:', symbol);
      console.log('Plain symbol (without -X):', plainSymbol);
      
      // First try with the original symbol
      try {
        const response = await API.market.getHistory(symbol);
        console.log('Price history response:', response.status);
        setHistoryData(response.data);
        return; // Exit the function if successful
      } catch (firstErr) {
        console.error('Error with original symbol, trying plain symbol:', firstErr);
        
        // If that fails, try with the plain symbol without -X as a fallback
        if (symbol !== plainSymbol) {
          try {
            const plainResponse = await API.market.getHistory(plainSymbol);
            console.log('Price history response with plain symbol:', plainResponse.status);
            setHistoryData(plainResponse.data);
            return; // Exit the function if successful
          } catch (secondErr) {
            console.error('Error with plain symbol too:', secondErr);
            // Continue to the final catch block
            throw secondErr;
          }
        } else {
          // If symbols are identical, just throw the original error
          throw firstErr;
        }
      }
    } catch (err) {
      console.error('Error fetching price history (all attempts failed):', err);
      
      // Create a helpful error message
      let errorMessage = 'No historical data is available for this symbol';
      if (err.response?.status === 404) {
        errorMessage = `No historical data available for ${symbol}. The data may not exist in our database.`;
      } else if (err.response?.status === 500) {
        errorMessage = 'Server error while retrieving historical data. Please try again later.';
      }
      
      setHistoryError(errorMessage);
      
      // Create empty history data structure for a better UX
      setHistoryData({
        symbol: symbol,
        history: []
      });
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleRefresh = () => {
    if (selectedSymbol) {
      setLoading(true);
      setError(null);
      
      // Symbol cleaning is now handled in axiosConfig.js
      console.log('Refreshing data for symbol:', selectedSymbol);
      
      API.market.refresh(selectedSymbol)
        .then(response => {
          console.log('Market refresh response:', response.status);
          setAnalysisData(response.data);
          // Refresh history data too
          fetchPriceHistory(selectedSymbol);
        })
        .catch(err => {
          console.error('Error refreshing market analysis:', err);
          
          // Handle specific error cases
          if (err.response?.status === 500) {
            setError('The server encountered an error. This could be due to temporary issues, please try again later.');
          } else {
            setError(err.response?.data?.error || 'Failed to refresh market analysis data');
          }
        })
        .finally(() => {
          setLoading(false);
        });
    }
  };

  const renderPredictionChart = () => {
    if (!analysisData || !analysisData.predictions || !analysisData.prediction_dates) return null;

    // Ensure predictions are numbers
    const numericPredictions = analysisData.predictions.map(pred => 
      typeof pred === 'number' ? pred : parseFloat(pred)
    );

    const chartData = {
      labels: analysisData.prediction_dates,
      datasets: [
        {
          label: 'Predicted Price',
          data: numericPredictions,
          borderColor: colors.buyGreen,
          backgroundColor: 'rgba(0, 230, 118, 0.1)',
          fill: true,
          tension: 0.4,
          borderWidth: 2,
          pointRadius: 0,
          pointHoverRadius: 5,
          borderDash: [5, 5]
        }
      ]
    };

    const options = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          mode: 'index',
          intersect: false,
          backgroundColor: colors.panelBg,
          titleColor: colors.primaryText,
          bodyColor: colors.primaryText,
          borderColor: colors.borderColor,
          borderWidth: 1
        }
      },
      scales: {
        x: {
          grid: {
            display: false,
            color: colors.borderColor
          },
          ticks: {
            color: colors.secondaryText
          }
        },
        y: {
          grid: {
            color: colors.borderColor
          },
          ticks: {
            color: colors.secondaryText
          }
        }
      }
    };

    return (
      <Box sx={{ height: 300, mt: 2 }}>
        <Line data={chartData} options={options} />
      </Box>
    );
  };

  const renderPriceChart = () => {
    if (!historyData || !historyData.history || historyData.history.length === 0) {
      return null;
    }

    const sortedHistory = [...historyData.history].sort((a, b) => 
      new Date(a.timestamp) - new Date(b.timestamp)
    );

    const chartData = {
      labels: sortedHistory.map(item => {
        const date = new Date(item.timestamp);
        return date.toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric'
        });
      }),
      datasets: [
        {
          label: 'Close Price',
          data: sortedHistory.map(item => item.close_price),
          borderColor: colors.accentBlue,
          backgroundColor: 'rgba(33, 150, 243, 0.1)',
          fill: true,
          tension: 0.4,
          borderWidth: 2,
          pointRadius: 0,
          pointHoverRadius: 4,
          z: 1
        },
        {
          label: 'High Price',
          data: sortedHistory.map(item => item.high_price),
          borderColor: 'rgba(0, 230, 118, 0.5)',
          borderDash: [5, 5],
          tension: 0.4,
          borderWidth: 1,
          pointRadius: 0,
          pointHoverRadius: 4,
          fill: false
        },
        {
          label: 'Low Price',
          data: sortedHistory.map(item => item.low_price),
          borderColor: 'rgba(255, 61, 87, 0.5)',
          borderDash: [5, 5],
          tension: 0.4,
          borderWidth: 1,
          pointRadius: 0,
          pointHoverRadius: 4,
          fill: false
        }
      ]
    };

    return (
      <Box sx={{ height: '400px', mb: 4 }}>
        <Line data={chartData} options={chartOptions} />
      </Box>
    );
  };

  const renderTechnicalIndicators = () => {
    if (!analysisData || !analysisData.technical_indicators) return null;
    
    const indicators = analysisData.technical_indicators;
    
    // Helper function to safely convert values to numbers
    const safeNumber = (value) => {
      if (value === null || value === undefined) return 0;
      return typeof value === 'number' ? value : parseFloat(value);
    };
    
    // Convert all indicator values to numbers
    const rsi = safeNumber(indicators.rsi);
    const macd = safeNumber(indicators.macd);
    const macdSignal = safeNumber(indicators.macd_signal);
    const macdHist = safeNumber(indicators.macd_hist);
    const sma20 = safeNumber(indicators.sma20);
    const sma50 = safeNumber(indicators.sma50);
    const sma200 = safeNumber(indicators.sma200);
    
    return (
      <Box sx={{ 
        display: 'flex', 
        flexWrap: 'wrap', 
        gap: 1,
        justifyContent: 'space-between'
      }}>
        {/* RSI Indicator */}
        <Box sx={{ 
          flex: '1 1 calc(33.333% - 8px)', 
          minWidth: '150px',
          maxWidth: 'calc(33.333% - 8px)'
        }}>
          <Paper 
            sx={{ 
              p: 1.5,
              backgroundColor: colors.cardBg,
              border: `1px solid ${colors.borderColor}`,
              borderRadius: '6px',
              height: '100%'
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Typography variant="body2" sx={{ color: colors.secondaryText }}>
                RSI (14)
              </Typography>
              <Tooltip title="Relative Strength Index (RSI) measures the speed and magnitude of recent price changes to evaluate overbought or oversold conditions. Values above 70 indicate overbought conditions, while values below 30 indicate oversold conditions." arrow>
                <IconButton size="small" sx={{ color: colors.secondaryText }}>
                  <InfoIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
            <Typography variant="h6" sx={{ 
              color: rsi > 70 ? colors.sellRed : 
                     rsi < 30 ? colors.buyGreen : 
                     colors.primaryText 
            }}>
              {rsi.toFixed(2)}
            </Typography>
            <Typography variant="caption" sx={{ color: colors.secondaryText }}>
              {rsi > 70 ? 'Overbought' : 
               rsi < 30 ? 'Oversold' : 
               'Neutral'}
            </Typography>
          </Paper>
        </Box>
        
        {/* MACD Indicator */}
        <Box sx={{ 
          flex: '1 1 calc(33.333% - 8px)', 
          minWidth: '150px',
          maxWidth: 'calc(33.333% - 8px)'
        }}>
          <Paper 
            sx={{ 
              p: 1.5,
              backgroundColor: colors.cardBg,
              border: `1px solid ${colors.borderColor}`,
              borderRadius: '6px',
              height: '100%'
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Typography variant="body2" sx={{ color: colors.secondaryText }}>
                MACD
              </Typography>
              <Tooltip title="Moving Average Convergence Divergence (MACD) is a trend-following momentum indicator that shows the relationship between two moving averages of an asset's price. Positive values indicate bullish momentum, while negative values indicate bearish momentum." arrow>
                <IconButton size="small" sx={{ color: colors.secondaryText }}>
                  <InfoIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
            <Typography variant="h6" sx={{ 
              color: macd > 0 ? colors.buyGreen : colors.sellRed 
            }}>
              {macd.toFixed(4)}
            </Typography>
            <Typography variant="caption" sx={{ color: colors.secondaryText }}>
              Signal: {macdSignal.toFixed(4)}
            </Typography>
          </Paper>
        </Box>
        
        {/* MACD Histogram */}
        <Box sx={{ 
          flex: '1 1 calc(33.333% - 8px)', 
          minWidth: '150px',
          maxWidth: 'calc(33.333% - 8px)'
        }}>
          <Paper 
            sx={{ 
              p: 1.5,
              backgroundColor: colors.cardBg,
              border: `1px solid ${colors.borderColor}`,
              borderRadius: '6px',
              height: '100%'
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Typography variant="body2" sx={{ color: colors.secondaryText }}>
                MACD Histogram
              </Typography>
              <Tooltip title="MACD Histogram represents the difference between the MACD line and the Signal line. Positive values indicate increasing bullish momentum, while negative values indicate increasing bearish momentum." arrow>
                <IconButton size="small" sx={{ color: colors.secondaryText }}>
                  <InfoIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
            <Typography variant="h6" sx={{ 
              color: macdHist > 0 ? colors.buyGreen : colors.sellRed 
            }}>
              {macdHist.toFixed(4)}
            </Typography>
            <Typography variant="caption" sx={{ color: colors.secondaryText }}>
              {macdHist > 0 ? 'Bullish momentum' : 'Bearish momentum'}
            </Typography>
          </Paper>
        </Box>
        
        {/* SMA 20 */}
        <Box sx={{ 
          flex: '1 1 calc(33.333% - 8px)', 
          minWidth: '150px',
          maxWidth: 'calc(33.333% - 8px)'
        }}>
          <Paper 
            sx={{ 
              p: 1.5,
              backgroundColor: colors.cardBg,
              border: `1px solid ${colors.borderColor}`,
              borderRadius: '6px',
              height: '100%'
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Typography variant="body2" sx={{ color: colors.secondaryText }}>
                SMA (20)
              </Typography>
              <Tooltip title="Simple Moving Average (SMA) is the average price of an asset over a specific period. The 20-day SMA is used to identify short-term trends. When price is above the SMA, it's considered bullish; when below, bearish." arrow>
                <IconButton size="small" sx={{ color: colors.secondaryText }}>
                  <InfoIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
            <Typography variant="h6" sx={{ color: colors.primaryText }}>
              {sma20.toFixed(5)}
            </Typography>
            <Typography variant="caption" sx={{ color: colors.secondaryText }}>
              Short-term trend
            </Typography>
          </Paper>
        </Box>
        
        {/* SMA 50 */}
        <Box sx={{ 
          flex: '1 1 calc(33.333% - 8px)', 
          minWidth: '150px',
          maxWidth: 'calc(33.333% - 8px)'
        }}>
          <Paper 
            sx={{ 
              p: 1.5,
              backgroundColor: colors.cardBg,
              border: `1px solid ${colors.borderColor}`,
              borderRadius: '6px',
              height: '100%'
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Typography variant="body2" sx={{ color: colors.secondaryText }}>
                SMA (50)
              </Typography>
              <Tooltip title="The 50-day Simple Moving Average is used to identify medium-term trends. It's a key level for traders as it often acts as support or resistance. Crossovers with the 20-day SMA can signal trend changes." arrow>
                <IconButton size="small" sx={{ color: colors.secondaryText }}>
                  <InfoIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
            <Typography variant="h6" sx={{ color: colors.primaryText }}>
              {sma50.toFixed(5)}
            </Typography>
            <Typography variant="caption" sx={{ color: colors.secondaryText }}>
              Medium-term trend
            </Typography>
          </Paper>
        </Box>
        
        {/* SMA 200 */}
        <Box sx={{ 
          flex: '1 1 calc(33.333% - 8px)', 
          minWidth: '150px',
          maxWidth: 'calc(33.333% - 8px)'
        }}>
          <Paper 
            sx={{ 
              p: 1.5,
              backgroundColor: colors.cardBg,
              border: `1px solid ${colors.borderColor}`,
              borderRadius: '6px',
              height: '100%'
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Typography variant="body2" sx={{ color: colors.secondaryText }}>
                SMA (200)
              </Typography>
              <Tooltip title="The 200-day Simple Moving Average is a major indicator of long-term market trends. It's often used to determine if a market is in a bull or bear trend. When price is above the 200-day SMA, the market is considered bullish; when below, bearish." arrow>
                <IconButton size="small" sx={{ color: colors.secondaryText }}>
                  <InfoIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
            <Typography variant="h6" sx={{ color: colors.primaryText }}>
              {sma200.toFixed(5)}
            </Typography>
            <Typography variant="caption" sx={{ color: colors.secondaryText }}>
              Long-term trend
            </Typography>
          </Paper>
        </Box>
      </Box>
    );
  };

  if (!selectedSymbol) {
    return (
      <Paper 
        sx={{ 
          p: 3,
          backgroundColor: colors.cardBg,
          border: `1px solid ${colors.borderColor}`,
          borderRadius: '12px',
          boxShadow: `0 4px 12px ${colors.shadowColor}`,
          height: '100%',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center'
        }}
      >
        <Typography variant="h6" sx={{ color: colors.secondaryText }}>
          Select a currency pair from your favorites to view market analysis
        </Typography>
      </Paper>
    );
  }

  if (loading) {
    return (
      <Paper 
        sx={{ 
          p: 3,
          backgroundColor: colors.cardBg,
          border: `1px solid ${colors.borderColor}`,
          borderRadius: '12px',
          boxShadow: `0 4px 12px ${colors.shadowColor}`,
          height: '100%',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center'
        }}
      >
        <CircularProgress />
      </Paper>
    );
  }

  if (error) {
    return (
      <Paper 
        sx={{ 
          p: 3,
          backgroundColor: colors.cardBg,
          border: `1px solid ${colors.borderColor}`,
          borderRadius: '12px',
          boxShadow: `0 4px 12px ${colors.shadowColor}`,
          height: '100%'
        }}
      >
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button 
          variant="contained" 
          startIcon={<RefreshIcon />}
          onClick={handleRefresh}
          sx={{ 
            backgroundColor: colors.accentBlue,
            '&:hover': { backgroundColor: colors.accentBlue }
          }}
        >
          Try Again
        </Button>
      </Paper>
    );
  }

  if (!analysisData) {
    return null;
  }

  return (
    <Box sx={{ width: '100%' }}>
      <Paper 
        sx={{ 
          p: 3,
          backgroundColor: colors.cardBg,
          border: `1px solid ${colors.borderColor}`,
          borderRadius: '12px',
          boxShadow: `0 4px 12px ${colors.shadowColor}`
        }}
      >
        {/* Header with Current Price and Last Updated */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
          <Box>
            <Typography variant="h6" sx={{ color: colors.primaryText }}>
              Price History
            </Typography>
          </Box>
          <Box sx={{ textAlign: 'right' }}>
            <Typography variant="h5" sx={{ color: colors.primaryText, mb: 0.5 }}>
              {analysisData?.current_price?.toFixed(5)}
            </Typography>
            <Typography variant="caption" sx={{ color: colors.secondaryText }}>
              Last updated: {new Date().toLocaleString()}
            </Typography>
          </Box>
        </Box>

        {/* Price Chart */}
        {historyLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          renderPriceChart()
        )}

        {/* Support & Resistance Levels */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="subtitle1" sx={{ color: colors.secondaryText, mb: 2 }}>
            Support & Resistance Levels
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <Box sx={{ p: 2, backgroundColor: colors.panelBg, borderRadius: '10px' }}>
                <Typography variant="subtitle2" sx={{ color: colors.secondaryText, mb: 1 }}>
                  Support
                </Typography>
                {analysisData?.support_resistance?.support?.map((level, index) => (
                  <Typography key={index} variant="body1" sx={{ color: colors.buyGreen }}>
                    {level.toFixed(5)}
                  </Typography>
                ))}
              </Box>
            </Grid>
            <Grid item xs={6}>
              <Box sx={{ p: 2, backgroundColor: colors.panelBg, borderRadius: '10px' }}>
                <Typography variant="subtitle2" sx={{ color: colors.secondaryText, mb: 1 }}>
                  Resistance
                </Typography>
                {analysisData?.support_resistance?.resistance?.map((level, index) => (
                  <Typography key={index} variant="body1" sx={{ color: colors.sellRed }}>
                    {level.toFixed(5)}
                  </Typography>
                ))}
              </Box>
            </Grid>
          </Grid>
        </Box>

        {/* Technical Indicators */}
        <Box>
          <Typography variant="subtitle1" sx={{ color: colors.secondaryText, mb: 2 }}>
            Technical Indicators
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <Box sx={{ p: 2, backgroundColor: colors.panelBg, borderRadius: '10px' }}>
                <Typography variant="subtitle2" sx={{ color: colors.secondaryText, mb: 1 }}>
                  RSI (14)
                </Typography>
                <Typography variant="h6" sx={{ color: colors.primaryText }}>
                  {analysisData?.technical_indicators?.rsi?.toFixed(2)}
                </Typography>
                <Typography variant="caption" sx={{ color: colors.secondaryText }}>
                  {analysisData?.technical_indicators?.rsi > 70 ? 'Overbought' : 
                   analysisData?.technical_indicators?.rsi < 30 ? 'Oversold' : 'Neutral'}
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={4}>
              <Box sx={{ p: 2, backgroundColor: colors.panelBg, borderRadius: '10px' }}>
                <Typography variant="subtitle2" sx={{ color: colors.secondaryText, mb: 1 }}>
                  MACD
                </Typography>
                <Typography variant="h6" sx={{ color: colors.primaryText }}>
                  {analysisData?.technical_indicators?.macd?.toFixed(4)}
                </Typography>
                <Typography variant="caption" sx={{ color: colors.secondaryText }}>
                  Signal: {analysisData?.technical_indicators?.macd_signal?.toFixed(4)}
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={4}>
              <Box sx={{ p: 2, backgroundColor: colors.panelBg, borderRadius: '10px' }}>
                <Typography variant="subtitle2" sx={{ color: colors.secondaryText, mb: 1 }}>
                  SMA (20)
                </Typography>
                <Typography variant="h6" sx={{ color: colors.primaryText }}>
                  {analysisData?.technical_indicators?.sma20?.toFixed(4)}
                </Typography>
                <Typography variant="caption" sx={{ color: colors.secondaryText }}>
                  Short-term trend
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </Box>
      </Paper>
    </Box>
  );
};

export default MarketAnalysis; 