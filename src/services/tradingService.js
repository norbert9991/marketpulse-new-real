import { API } from '../axiosConfig';

/**
 * Trading service for handling forex data and trading operations
 */
export const tradingService = {
  /**
   * Get current price and data for a forex symbol
   * @param {string} symbol - The forex pair symbol (e.g., 'EUR/USD')
   * @returns {Promise} - The market data response
   */
  getMarketData: async (symbol) => {
    // Convert symbol format from EUR/USD to EURUSD=X for API
    const formattedSymbol = symbol.replace('/', '') + '=X';
    try {
      const response = await API.markets.getPairData(formattedSymbol);
      return response.data;
    } catch (error) {
      console.error('Error fetching market data:', error);
      // Return mock data as fallback
      return generateMockMarketData(symbol);
    }
  },

  /**
   * Get historical price data for a symbol
   * @param {string} symbol - The forex pair symbol
   * @param {string} timeframe - The timeframe for data
   * @returns {Promise} - The historical data response
   */
  getHistoricalData: async (symbol, timeframe) => {
    const formattedSymbol = symbol.replace('/', '') + '=X';
    try {
      const interval = convertTimeframeToInterval(timeframe);
      const response = await API.markets.getHistoricalData(formattedSymbol, interval);
      return response.data;
    } catch (error) {
      console.error('Error fetching historical data:', error);
      // Return mock historical data as fallback
      return generateMockHistoricalData(symbol, timeframe);
    }
  },

  /**
   * Get technical indicators for a symbol
   * @param {string} symbol - The forex pair symbol
   * @returns {Promise} - The technical indicators response
   */
  getTechnicalIndicators: async (symbol) => {
    const formattedSymbol = symbol.replace('/', '') + '=X';
    try {
      const response = await API.markets.getTechnicalIndicators(formattedSymbol);
      return response.data;
    } catch (error) {
      console.error('Error fetching technical indicators:', error);
      // Return mock technical indicators as fallback
      return generateMockTechnicalIndicators(symbol);
    }
  },

  /**
   * Get support and resistance levels for a symbol
   * @param {string} symbol - The forex pair symbol
   * @returns {Promise} - The support/resistance levels response
   */
  getSupportResistance: async (symbol) => {
    const formattedSymbol = symbol.replace('/', '') + '=X';
    try {
      const response = await API.markets.getSupportResistance(formattedSymbol);
      return response.data;
    } catch (error) {
      console.error('Error fetching support/resistance levels:', error);
      // Return mock support/resistance levels as fallback
      return generateMockSupportResistance(symbol);
    }
  },

  /**
   * Place a trade order in the database
   * @param {Object} order - The order details
   * @returns {Promise} - The order response
   */
  placeOrder: async (order) => {
    try {
      const response = await API.trading.placeOrder(order);
      return response.data;
    } catch (error) {
      console.error('Error placing order:', error);
      // For demo purposes, mock successful order placement
      return {
        success: true,
        order: {
          ...order,
          id: Math.floor(Math.random() * 1000000),
          status: order.type === 'market' ? 'filled' : 'open',
          date: new Date().toISOString()
        }
      };
    }
  },

  /**
   * Get user's open orders
   * @returns {Promise} - The open orders response
   */
  getOpenOrders: async () => {
    try {
      const response = await API.trading.getOpenOrders();
      return response.data;
    } catch (error) {
      console.error('Error fetching open orders:', error);
      return { orders: [] };
    }
  },

  /**
   * Get user's order history
   * @returns {Promise} - The order history response
   */
  getOrderHistory: async () => {
    try {
      const response = await API.trading.getOrderHistory();
      return response.data;
    } catch (error) {
      console.error('Error fetching order history:', error);
      return { orders: [] };
    }
  },

  /**
   * Cancel an open order
   * @param {number} orderId - The ID of the order to cancel
   * @returns {Promise} - The cancel order response
   */
  cancelOrder: async (orderId) => {
    try {
      const response = await API.trading.cancelOrder(orderId);
      return response.data;
    } catch (error) {
      console.error('Error canceling order:', error);
      return { success: true };
    }
  },

  /**
   * Get user account information
   * @returns {Promise} - The account info response
   */
  getAccountInfo: async () => {
    try {
      const response = await API.user.getAccountInfo();
      return response.data;
    } catch (error) {
      console.error('Error fetching account info:', error);
      return {
        balance: 10000,
        currency: 'USD'
      };
    }
  }
};

/**
 * Convert timeframe to API interval parameter
 * @param {string} timeframe - UI timeframe format
 * @returns {string} - API interval parameter
 */
function convertTimeframeToInterval(timeframe) {
  const mapping = {
    '1m': '1min',
    '5m': '5min',
    '15m': '15min',
    '1h': '1hour',
    '4h': '4hour',
    '1d': '1day',
    '1w': '1week'
  };
  return mapping[timeframe] || '1hour';
}

/**
 * Generate mock market data for a symbol
 * @param {string} symbol - The forex pair symbol
 * @returns {Object} - Mock market data
 */
function generateMockMarketData(symbol) {
  // Currency pair base price mappings for realistic values
  const currencyBasePrices = {
    'EUR/USD': 1.0850,
    'GBP/USD': 1.2650,
    'USD/JPY': 145.80,
    'AUD/USD': 0.6750,
    'USD/CAD': 1.3570,
    'NZD/USD': 0.6150,
    'USD/CHF': 0.8950,
    'EUR/GBP': 0.8550,
    'EUR/JPY': 158.20,
    'GBP/JPY': 184.40
  };

  const basePrice = currencyBasePrices[symbol] || 1.0000;
  const changePercentage = (Math.random() * 0.6 - 0.3).toFixed(2); // -0.3% to 0.3%
  
  return {
    symbol: symbol,
    current_price: basePrice,
    change_percentage: changePercentage,
    trend: parseFloat(changePercentage) >= 0 ? 'Bullish' : 'Bearish',
    updated_at: new Date().toISOString()
  };
}

/**
 * Generate mock historical data for a symbol
 * @param {string} symbol - The forex pair symbol
 * @param {string} timeframe - The timeframe for data
 * @returns {Array} - Mock historical data
 */
function generateMockHistoricalData(symbol, timeframe) {
  const currencyBasePrices = {
    'EUR/USD': 1.0850,
    'GBP/USD': 1.2650,
    'USD/JPY': 145.80,
    'AUD/USD': 0.6750,
    'USD/CAD': 1.3570,
    'NZD/USD': 0.6150,
    'USD/CHF': 0.8950,
    'EUR/GBP': 0.8550,
    'EUR/JPY': 158.20,
    'GBP/JPY': 184.40
  };

  let basePrice = currencyBasePrices[symbol] || 1.0000;
  const data = [];
  const now = new Date();
  
  // Set volatility based on timeframe and currency pair
  let volatility = 0.001; // Default volatility
  
  // Adjust volatility based on timeframe (shorter timeframes have less volatility)
  switch (timeframe) {
    case '1m': volatility = 0.0005; break;
    case '5m': volatility = 0.001; break;
    case '15m': volatility = 0.0015; break;
    case '1h': volatility = 0.002; break;
    case '4h': volatility = 0.003; break;
    case '1d': volatility = 0.005; break;
    case '1w': volatility = 0.01; break;
    default: volatility = 0.002;
  }
  
  // Adjust volatility based on currency pair (some pairs are more volatile)
  if (symbol.includes('JPY')) {
    volatility *= 2; // JPY pairs tend to have larger pip movements
  } else if (symbol.includes('GBP')) {
    volatility *= 1.5; // GBP pairs tend to be more volatile
  }
  
  // Generate 100 data points
  for (let i = 0; i < 100; i++) {
    // Create a trend with some randomness
    const trendDirection = Math.random() > 0.5 ? 1 : -1;
    const trendBias = trendDirection * volatility * 0.3;
    const randomChange = (Math.random() * volatility * 2) - volatility + trendBias;
    
    // Calculate prices with proper precision
    const open = parseFloat(basePrice.toFixed(4));
    const close = parseFloat((basePrice * (1 + randomChange)).toFixed(4));
    
    // Calculate high and low
    let high, low;
    if (close > open) {
      high = parseFloat((close * (1 + Math.random() * volatility * 0.5)).toFixed(4));
      low = parseFloat((open * (1 - Math.random() * volatility * 0.5)).toFixed(4));
    } else {
      high = parseFloat((open * (1 + Math.random() * volatility * 0.5)).toFixed(4));
      low = parseFloat((close * (1 - Math.random() * volatility * 0.5)).toFixed(4));
    }
    
    // Create timestamp based on timeframe
    const timestamp = new Date(now);
    
    // Adjust timestamp based on timeframe
    const timeMultiplier = {
      '1m': 1, '5m': 5, '15m': 15, '1h': 60, '4h': 240, '1d': 1440, '1w': 10080
    };
    timestamp.setMinutes(timestamp.getMinutes() - (100 - i) * (timeMultiplier[timeframe] || 60));
    
    // Add to data array
    data.push({
      timestamp: timestamp.toISOString(),
      open: open,
      high: high,
      low: low,
      close: close,
      volume: Math.floor(Math.random() * 1000) + 500
    });
    
    // Update base price for next iteration
    basePrice = close;
  }
  
  return data;
}

/**
 * Generate mock technical indicators for a symbol
 * @param {string} symbol - The forex pair symbol
 * @returns {Object} - Mock technical indicators
 */
function generateMockTechnicalIndicators(symbol) {
  // Generate realistic RSI (30-70 range)
  const rsi = (Math.random() * 40 + 30).toFixed(4);
  
  // Generate realistic MACD values
  const macd = (Math.random() * 0.004 - 0.002).toFixed(6);
  const macdSignal = (Math.random() * 0.004 - 0.002).toFixed(6);
  const macdHist = (parseFloat(macd) - parseFloat(macdSignal)).toFixed(6);
  
  // Get the base price for the symbol
  const currencyBasePrices = {
    'EUR/USD': 1.0850,
    'GBP/USD': 1.2650,
    'USD/JPY': 145.80,
    'AUD/USD': 0.6750,
    'USD/CAD': 1.3570,
    'NZD/USD': 0.6150,
    'USD/CHF': 0.8950,
    'EUR/GBP': 0.8550,
    'EUR/JPY': 158.20,
    'GBP/JPY': 184.40
  };
  
  const basePrice = currencyBasePrices[symbol] || 1.0000;
  
  // Generate SMA values close to the base price
  const sma20 = (basePrice * (1 + (Math.random() * 0.01 - 0.005))).toFixed(4);
  const sma50 = (basePrice * (1 + (Math.random() * 0.015 - 0.0075))).toFixed(4);
  const sma200 = (basePrice * (1 + (Math.random() * 0.02 - 0.01))).toFixed(4);
  
  return {
    symbol: symbol,
    rsi: parseFloat(rsi),
    macd: parseFloat(macd),
    macd_signal: parseFloat(macdSignal),
    macd_hist: parseFloat(macdHist),
    sma20: parseFloat(sma20),
    sma50: parseFloat(sma50),
    sma200: parseFloat(sma200),
    updated_at: new Date().toISOString()
  };
}

/**
 * Generate mock support and resistance levels
 * @param {string} symbol - The forex pair symbol
 * @returns {Object} - Mock support and resistance levels
 */
function generateMockSupportResistance(symbol) {
  const currencyBasePrices = {
    'EUR/USD': 1.0850,
    'GBP/USD': 1.2650,
    'USD/JPY': 145.80,
    'AUD/USD': 0.6750,
    'USD/CAD': 1.3570,
    'NZD/USD': 0.6150,
    'USD/CHF': 0.8950,
    'EUR/GBP': 0.8550,
    'EUR/JPY': 158.20,
    'GBP/JPY': 184.40
  };
  
  const basePrice = currencyBasePrices[symbol] || 1.0000;
  
  // Generate 3 support levels below the base price
  const supportLevels = [
    parseFloat((basePrice * 0.995).toFixed(4)),
    parseFloat((basePrice * 0.990).toFixed(4)),
    parseFloat((basePrice * 0.985).toFixed(4))
  ];
  
  // Generate 3 resistance levels above the base price
  const resistanceLevels = [
    parseFloat((basePrice * 1.005).toFixed(4)),
    parseFloat((basePrice * 1.010).toFixed(4)),
    parseFloat((basePrice * 1.015).toFixed(4))
  ];
  
  return {
    symbol: symbol,
    support: supportLevels,
    resistance: resistanceLevels,
    updated_at: new Date().toISOString()
  };
}

export default tradingService; 