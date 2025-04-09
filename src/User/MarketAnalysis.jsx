import React, { useState, useEffect, useCallback } from 'react';
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
  IconButton,
  useTheme
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

// Get the base API URL for logging if needed
const API_URL = API.baseURL;

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

// Theme constants
const lightThemeColors = {
  primaryText: '#333333',
  secondaryText: '#666666',
  background: '#ffffff',
  cardBackground: '#f5f7fa',
  positiveColor: '#4caf50',
  negativeColor: '#f44336',
  neutralColor: '#757575',
  chartLine: '#1976d2'
};

// Dark theme colors
const darkThemeColors = {
  primaryText: '#ffffff',
  secondaryText: '#cccccc',
  background: '#1c2025',
  cardBackground: '#2d333b',
  positiveColor: '#81c784',
  negativeColor: '#e57373',
  neutralColor: '#b0bec5',
  chartLine: '#64b5f6'
};

const MarketAnalysis = ({ selectedSymbol, darkMode = false }) => {
  const theme = useTheme();
  const [analysisData, setAnalysisData] = useState(null);
  const [historyData, setHistoryData] = useState({ priceHistory: [] });
  const [loading, setLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [error, setError] = useState(null);
  const [historyError, setHistoryError] = useState(null);
  const [timeframe, setTimeframe] = useState('1mo');
  const colors = darkMode ? darkThemeColors : lightThemeColors;

  // Clean symbol to ensure consistent API calls
  const cleanSymbol = useCallback((symbol) => {
    if (!symbol) return '';
    
    // Handle case where symbol might be an object
    let symbolString = symbol;
    if (typeof symbol === 'object' && symbol !== null) {
      symbolString = symbol.value || '';
      console.warn('Symbol is an object, using value property:', symbolString);
    }
    
    // Remove -X suffix if present
    if (typeof symbolString === 'string' && symbolString.includes('-X')) {
      console.log(`Cleaning symbol: ${symbolString} -> ${symbolString.split('-X')[0]}`);
      return symbolString.split('-X')[0];
    }
    
    return symbolString;
  }, []);

  // Memoized fetch functions to prevent unnecessary rerenders
  const fetchMarketAnalysis = useCallback(async () => {
    if (!selectedSymbol) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Clean the symbol before API call
      const cleanedSymbol = cleanSymbol(selectedSymbol);
      console.log(`Fetching market analysis for: ${cleanedSymbol} (original: ${selectedSymbol})`);
      
      const response = await API.market.analyze({ symbol: cleanedSymbol });
      console.log('Analysis data received:', response);
      
      // Ensure we have a proper data structure
      const data = response.data || response;
      
      // Create a comprehensive data object with fallbacks for missing properties
      const processedData = {
        ...data,
        technical_indicators: data.technical_indicators || {},
        support_resistance: data.support_resistance || { support: [], resistance: [] },
        sentiment: data.sentiment || {},
        historical_data: data.historical_data || { prices: [], dates: [] }
      };
      
      // Process support/resistance data if available
      if (processedData.support_resistance) {
        console.log('Support/resistance data:', processedData.support_resistance);
        
        // Extract support values if they're in objects with level_value property
        if (Array.isArray(processedData.support_resistance.support)) {
          processedData.support_resistance.support = processedData.support_resistance.support.map(item => 
            typeof item === 'object' && item.level_value ? parseFloat(item.level_value) : parseFloat(item)
          );
        }
        
        // Extract resistance values if they're in objects with level_value property
        if (Array.isArray(processedData.support_resistance.resistance)) {
          processedData.support_resistance.resistance = processedData.support_resistance.resistance.map(item => 
            typeof item === 'object' && item.level_value ? parseFloat(item.level_value) : parseFloat(item)
          );
        }
      }
      
      console.log('Processed analysis data:', processedData);
      setAnalysisData(processedData);
    } catch (err) {
      console.error('Error fetching market analysis:', err);
      setError('Failed to load market analysis. Please try again later.');
    } finally {
      setLoading(false);
    }
  }, [selectedSymbol, cleanSymbol]);

  const fetchPriceHistory = useCallback(async () => {
    if (!selectedSymbol) return;
    
    setHistoryLoading(true);
    setHistoryError(null);
    
    try {
      // Clean the symbol before API call
      const cleanedSymbol = cleanSymbol(selectedSymbol);
      console.log(`Fetching price history for: ${cleanedSymbol} (original: ${selectedSymbol})`);
      
      const response = await API.market.getPriceHistory(cleanedSymbol, timeframe);
      console.log('Price history received:', response);
      
      // Check if response has the expected format
      if (!response || !response.history || response.history.length === 0) {
        console.warn('No price history data available for this symbol');
        setHistoryError('No historical data available for this pair');
        setHistoryData({ priceHistory: [] });
        return;
      }
      
      // Format the data for the chart
      const formattedHistory = {
        priceHistory: response.history.map(item => ({
          date: item.date,
          open: parseFloat(item.open),
          high: parseFloat(item.high),
          low: parseFloat(item.low),
          close: parseFloat(item.close)
        }))
      };
      
      console.log('Processed history data:', formattedHistory);
      setHistoryData(formattedHistory);
    } catch (err) {
      console.error('Error fetching price history:', err);
      setHistoryError('Failed to load historical data. Please try again later.');
      setHistoryData({ priceHistory: [] });
    } finally {
      setHistoryLoading(false);
    }
  }, [selectedSymbol, timeframe, cleanSymbol]);

  // Fetch data when component mounts or when selectedSymbol changes
  useEffect(() => {
    if (selectedSymbol) {
      fetchMarketAnalysis();
      fetchPriceHistory();
    }
  }, [selectedSymbol, timeframe, fetchMarketAnalysis, fetchPriceHistory]);

  // Handle refresh button click
  const handleRefresh = async () => {
    if (!selectedSymbol) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Clean the symbol before API call
      const cleanedSymbol = cleanSymbol(selectedSymbol);
      console.log(`Refreshing analysis for: ${cleanedSymbol} (original: ${selectedSymbol})`);
      
      // Refresh market analysis data
      await API.market.refresh(cleanedSymbol);
      
      // Fetch updated data
      await fetchMarketAnalysis();
      await fetchPriceHistory();
    } catch (err) {
      console.error('Error during refresh:', err);
      setError('Failed to refresh data. Please try again later.');
    } finally {
      setLoading(false);
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
          borderColor: colors.positiveColor,
          backgroundColor: 'rgba(76, 175, 80, 0.1)',
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
          backgroundColor: colors.background,
          titleColor: colors.primaryText,
          bodyColor: colors.primaryText,
          borderColor: colors.chartLine,
          borderWidth: 1
        }
      },
      scales: {
        x: {
          grid: {
            display: false,
            color: colors.chartLine
          },
          ticks: {
            color: colors.secondaryText
          }
        },
        y: {
          grid: {
            color: colors.chartLine
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
    if (historyLoading) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', p: 4, height: '300px' }}>
          <CircularProgress size={40} thickness={4} sx={{ color: colors.chartLine }} />
        </Box>
      );
    }
    
    if (historyError) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', p: 4, height: '300px' }}>
          <Typography variant="body1" color="text.secondary">
            {historyError}
          </Typography>
        </Box>
      );
    }

    if (!historyData || !historyData.priceHistory || historyData.priceHistory.length === 0) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', p: 4, height: '300px' }}>
          <Typography variant="body1" color="text.secondary">
            No historical data available for this currency pair
          </Typography>
        </Box>
      );
    }

    // Sort history data by date in ascending order
    const sortedHistory = [...historyData.priceHistory].sort((a, b) => 
      new Date(a.date) - new Date(b.date)
    );

    const chartData = {
      labels: sortedHistory.map(item => item.date),
      datasets: [
        {
          label: 'Close Price',
          data: sortedHistory.map(item => item.close),
          borderColor: colors.chartLine,
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
          borderColor: colors.positiveColor,
          backgroundColor: 'rgba(76, 175, 80, 0.1)',
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
          borderColor: colors.negativeColor,
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
          borderColor: colors.neutralColor,
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
          backgroundColor: colors.background,
          titleColor: colors.primaryText,
          bodyColor: colors.primaryText,
          borderColor: colors.chartLine,
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
            color: colors.chartLine
          },
          ticks: {
            color: colors.secondaryText,
            maxRotation: 45,
            minRotation: 45
          }
        },
        y: {
          grid: {
            color: colors.chartLine
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
              backgroundColor: colors.background,
              border: `1px solid ${colors.chartLine}`,
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
              color: rsi > 70 ? colors.negativeColor : 
                     rsi < 30 ? colors.positiveColor : 
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
              backgroundColor: colors.background,
              border: `1px solid ${colors.chartLine}`,
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
              color: macd > 0 ? colors.positiveColor : colors.negativeColor 
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
              backgroundColor: colors.background,
              border: `1px solid ${colors.chartLine}`,
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
              color: macdHist > 0 ? colors.positiveColor : colors.negativeColor 
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
              backgroundColor: colors.background,
              border: `1px solid ${colors.chartLine}`,
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
              backgroundColor: colors.background,
              border: `1px solid ${colors.chartLine}`,
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
              backgroundColor: colors.background,
              border: `1px solid ${colors.chartLine}`,
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
          backgroundColor: colors.background,
          border: `1px solid ${colors.chartLine}`,
          borderRadius: '12px',
          boxShadow: `0 4px 12px ${colors.chartLine}`,
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
          backgroundColor: colors.background,
          border: `1px solid ${colors.chartLine}`,
          borderRadius: '12px',
          boxShadow: `0 4px 12px ${colors.chartLine}`,
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
          backgroundColor: colors.background,
          border: `1px solid ${colors.chartLine}`,
          borderRadius: '12px',
          boxShadow: `0 4px 12px ${colors.chartLine}`,
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
            backgroundColor: colors.chartLine,
            '&:hover': { backgroundColor: colors.chartLine }
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
        backgroundColor: colors.background,
        border: `1px solid ${colors.chartLine}`,
        borderRadius: '12px',
        boxShadow: `0 4px 12px ${colors.chartLine}`
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6" sx={{ color: colors.primaryText }}>
          Market Analysis: {selectedSymbol}
        </Typography>
        <Button 
          variant="outlined" 
          startIcon={loading ? <CircularProgress size={20} /> : <RefreshIcon />}
          onClick={handleRefresh}
          disabled={loading}
          sx={{ 
            color: colors.chartLine,
            borderColor: colors.chartLine,
            '&:hover': {
              backgroundColor: `${colors.chartLine}22`,
              borderColor: colors.chartLine
            }
          }}
        >
          {loading ? 'Refreshing...' : 'Refresh Data'}
        </Button>
      </Box>
      
      {historyError && (
        <Alert 
          severity="error" 
          action={
            <Button color="inherit" size="small" onClick={() => fetchPriceHistory(selectedSymbol)}>
              Retry
            </Button>
          }
          sx={{ 
            mb: 2,
            backgroundColor: `${colors.negativeColor}10`,
            borderColor: colors.negativeColor,
            color: colors.negativeColor
          }}
        >
          {historyError}
        </Alert>
      )}
      
      {historyLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress size={40} sx={{ color: colors.chartLine }} />
        </Box>
      ) : historyData ? (
        <>
          {/* Price Prediction */}
          <Paper sx={{ 
            p: 2, 
            mb: 3, 
            backgroundColor: colors.background,
            border: `1px solid ${colors.chartLine}`,
            borderRadius: '8px'
          }}>
            <Typography variant="h6" sx={{ mb: 2, color: colors.primaryText }}>
              Price Prediction (5 Days)
            </Typography>
            {renderPredictionChart()}
          </Paper>
          
          {/* Price History */}
          <Paper sx={{ 
            p: 2, 
            mb: 3, 
            backgroundColor: colors.background,
            border: `1px solid ${colors.chartLine}`,
            borderRadius: '8px'
          }}>
            <Typography variant="h6" sx={{ mb: 2, color: colors.primaryText }}>
              Price History (30 Days)
            </Typography>
            
            {renderPriceHistoryChart()}
          </Paper>
          
          {/* Rest of your component remains unchanged */}
        </>
      ) : (
        <Box sx={{ textAlign: 'center', p: 4 }}>
          <Typography sx={{ color: colors.secondaryText }}>
            Select a market pair to view analysis
          </Typography>
        </Box>
      )}
    </Paper>
  );
};

export default MarketAnalysis; 