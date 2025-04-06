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
import axios from 'axios';
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

const MarketAnalysis = ({ selectedSymbol }) => {
  const [analysisData, setAnalysisData] = useState(null);
  const [historyData, setHistoryData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

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
      const token = localStorage.getItem('token');
      const response = await axios.get(`http://localhost:5000/api/market-analysis/${symbol}`, {
        headers: { 'Authorization': token }
      });
      setAnalysisData(response.data);
    } catch (err) {
      console.error('Error fetching market analysis:', err);
      setError(err.response?.data?.error || 'Failed to fetch market analysis data');
    } finally {
      setLoading(false);
    }
  };

  const fetchPriceHistory = async (symbol) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`http://localhost:5000/api/market-analysis/${symbol}/history`, {
        headers: { 'Authorization': token }
      });
      setHistoryData(response.data);
    } catch (err) {
      console.error('Error fetching price history:', err);
    }
  };

  const handleRefresh = () => {
    if (selectedSymbol) {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('token');
      axios.post(`http://localhost:5000/api/market-analysis/refresh/${selectedSymbol}`, {}, {
        headers: { 'Authorization': token }
      })
      .then(response => {
        setAnalysisData(response.data);
      })
      .catch(err => {
        console.error('Error refreshing market analysis:', err);
        setError(err.response?.data?.error || 'Failed to refresh market analysis data');
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

  const renderPriceHistoryChart = () => {
    if (!historyData || !historyData.history) return null;

    // Sort history data by date in ascending order
    const sortedHistory = [...historyData.history].sort((a, b) => 
      new Date(a.date) - new Date(b.date)
    );

    const chartData = {
      labels: sortedHistory.map(item => item.date),
      datasets: [
        {
          label: 'Close Price',
          data: sortedHistory.map(item => item.close),
          borderColor: colors.accentBlue,
          backgroundColor: 'rgba(33, 150, 243, 0.1)',
          fill: true,
          tension: 0.4,
          borderWidth: 2,
          pointRadius: 0,
          pointHoverRadius: 5
        },
        {
          label: 'High Price',
          data: sortedHistory.map(item => item.high),
          borderColor: colors.buyGreen,
          backgroundColor: 'rgba(0, 230, 118, 0.1)',
          fill: false,
          tension: 0.4,
          borderWidth: 1,
          borderDash: [5, 5],
          pointRadius: 0,
          pointHoverRadius: 5
        },
        {
          label: 'Low Price',
          data: sortedHistory.map(item => item.low),
          borderColor: colors.sellRed,
          backgroundColor: 'rgba(255, 61, 87, 0.1)',
          fill: false,
          tension: 0.4,
          borderWidth: 1,
          borderDash: [5, 5],
          pointRadius: 0,
          pointHoverRadius: 5
        },
        {
          label: 'Open Price',
          data: sortedHistory.map(item => item.open),
          borderColor: colors.warningOrange,
          backgroundColor: 'rgba(255, 167, 38, 0.1)',
          fill: false,
          tension: 0.4,
          borderWidth: 1,
          borderDash: [2, 2],
          pointRadius: 0,
          pointHoverRadius: 5
        }
      ]
    };

    const options = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top',
          labels: {
            color: colors.secondaryText,
            usePointStyle: true,
            pointStyle: 'line'
          }
        },
        tooltip: {
          mode: 'index',
          intersect: false,
          backgroundColor: colors.panelBg,
          titleColor: colors.primaryText,
          bodyColor: colors.primaryText,
          borderColor: colors.borderColor,
          borderWidth: 1,
          callbacks: {
            label: function(context) {
              let label = context.dataset.label || '';
              if (label) {
                label += ': ';
              }
              if (context.parsed.y !== null) {
                label += context.parsed.y.toFixed(5);
              }
              return label;
            }
          }
        }
      },
      scales: {
        x: {
          grid: {
            display: false,
            color: colors.borderColor
          },
          ticks: {
            color: colors.secondaryText,
            maxRotation: 45,
            minRotation: 45
          }
        },
        y: {
          grid: {
            color: colors.borderColor
          },
          ticks: {
            color: colors.secondaryText,
            callback: function(value) {
              return value.toFixed(5);
            }
          }
        }
      },
      interaction: {
        mode: 'nearest',
        axis: 'x',
        intersect: false
      }
    };

    return (
      <Box sx={{ height: 400, mt: 2 }}>
        <Line data={chartData} options={options} />
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
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6" sx={{ color: colors.primaryText }}>
          Market Analysis: {selectedSymbol}
        </Typography>
        <Button 
          variant="outlined" 
          startIcon={<RefreshIcon />}
          onClick={handleRefresh}
          sx={{ 
            color: colors.accentBlue,
            borderColor: colors.accentBlue,
            '&:hover': { 
              borderColor: colors.accentBlue,
              backgroundColor: 'rgba(33, 150, 243, 0.1)'
            }
          }}
        >
          Refresh
        </Button>
      </Box>
      
      <Divider sx={{ backgroundColor: colors.borderColor, mb: 3 }} />
      
      {/* Main content area with flexbox layout */}
      <Box sx={{ display: 'flex', gap: 3, flexDirection: { xs: 'column', lg: 'row' } }}>
        {/* Left side - Charts */}
        <Box sx={{ flex: 2, display: 'flex', flexDirection: 'column', gap: 3 }}>
          {/* Price History Chart */}
          <Paper 
            sx={{ 
              p: 2,
              backgroundColor: colors.panelBg,
              border: `1px solid ${colors.borderColor}`,
              borderRadius: '8px',
              flex: 1
            }}
          >
            <Typography variant="subtitle2" sx={{ color: colors.secondaryText, mb: 2 }}>
              Price History
            </Typography>
            {renderPriceHistoryChart()}
          </Paper>
          
          {/* Price Predictions */}
          <Paper 
            sx={{ 
              p: 2,
              backgroundColor: colors.panelBg,
              border: `1px solid ${colors.borderColor}`,
              borderRadius: '8px',
              flex: 1
            }}
          >
            <Typography variant="subtitle2" sx={{ color: colors.secondaryText }}>
              Price Predictions
            </Typography>
            {renderPredictionChart()}
          </Paper>
        </Box>
        
        {/* Right side - Current Price, Support/Resistance, and Technical Indicators */}
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 3 }}>
          {/* Current Price */}
          <Paper 
            sx={{ 
              p: 2,
              backgroundColor: colors.panelBg,
              border: `1px solid ${colors.borderColor}`,
              borderRadius: '8px'
            }}
          >
            <Typography variant="subtitle2" sx={{ color: colors.secondaryText }}>
              Current Price
            </Typography>
            <Typography variant="h4" sx={{ color: colors.primaryText, mb: 1 }}>
              {typeof analysisData.current_price === 'number' 
                ? analysisData.current_price.toFixed(5) 
                : parseFloat(analysisData.current_price).toFixed(5)}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Chip 
                icon={analysisData.trend === 'Bullish' ? <TrendingUpIcon /> : <TrendingDownIcon />}
                label={analysisData.trend}
                color={analysisData.trend === 'Bullish' ? 'success' : 'error'}
                size="small"
                sx={{ mr: 1 }}
              />
              <Typography variant="body2" sx={{ color: colors.secondaryText }}>
                Last updated: {analysisData.last_updated}
              </Typography>
            </Box>
          </Paper>
          
          {/* Support and Resistance */}
          <Paper 
            sx={{ 
              p: 2,
              backgroundColor: colors.panelBg,
              border: `1px solid ${colors.borderColor}`,
              borderRadius: '8px'
            }}
          >
            <Typography variant="subtitle2" sx={{ color: colors.secondaryText, mb: 1 }}>
              Support & Resistance Levels
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box>
                <Typography variant="body2" sx={{ color: colors.secondaryText }}>
                  Support:
                </Typography>
                {analysisData.support_resistance.support.map((level, index) => (
                  <Typography key={index} variant="body1" sx={{ color: colors.buyGreen }}>
                    {typeof level === 'number' ? level.toFixed(5) : parseFloat(level).toFixed(5)}
                  </Typography>
                ))}
              </Box>
              <Box>
                <Typography variant="body2" sx={{ color: colors.secondaryText }}>
                  Resistance:
                </Typography>
                {analysisData.support_resistance.resistance.map((level, index) => (
                  <Typography key={index} variant="body1" sx={{ color: colors.sellRed }}>
                    {typeof level === 'number' ? level.toFixed(5) : parseFloat(level).toFixed(5)}
                  </Typography>
                ))}
              </Box>
            </Box>
          </Paper>
          
          {/* Technical Indicators */}
          <Paper 
            sx={{ 
              p: 2,
              backgroundColor: colors.panelBg,
              border: `1px solid ${colors.borderColor}`,
              borderRadius: '8px'
            }}
          >
            <Typography variant="subtitle2" sx={{ color: colors.secondaryText, mb: 2 }}>
              Technical Indicators
            </Typography>
            {renderTechnicalIndicators()}
          </Paper>
        </Box>
      </Box>
      
      {/* Sentiment Analysis */}
      {analysisData.sentiment && Object.keys(analysisData.sentiment).length > 0 && (
        <Paper 
          sx={{ 
            p: 2,
            backgroundColor: colors.panelBg,
            border: `1px solid ${colors.borderColor}`,
            borderRadius: '8px',
            mt: 3
          }}
        >
          <Typography variant="subtitle2" sx={{ color: colors.secondaryText, mb: 1 }}>
            Sentiment Analysis
          </Typography>
          <Grid container spacing={2}>
            {Object.entries(analysisData.sentiment).map(([source, data]) => (
              <Grid item xs={12} sm={6} md={4} key={source}>
                <Paper 
                  sx={{ 
                    p: 1.5,
                    backgroundColor: colors.cardBg,
                    border: `1px solid ${colors.borderColor}`,
                    borderRadius: '6px'
                  }}
                >
                  <Typography variant="body2" sx={{ color: colors.secondaryText, textTransform: 'capitalize' }}>
                    {source}
                  </Typography>
                  <Typography variant="h6" sx={{ color: data.sentiment === 'positive' ? colors.buyGreen : data.sentiment === 'negative' ? colors.sellRed : colors.warningOrange }}>
                    {data.sentiment.charAt(0).toUpperCase() + data.sentiment.slice(1)}
                  </Typography>
                  <Typography variant="body2" sx={{ color: colors.secondaryText }}>
                    Score: {data.score.toFixed(2)}
                  </Typography>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </Paper>
      )}
    </Paper>
  );
};

export default MarketAnalysis; 