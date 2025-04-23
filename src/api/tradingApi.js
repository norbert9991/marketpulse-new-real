import { API_BASE_URL } from './config';
import axios from 'axios';

// Create a configured axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add request interceptor to include auth token
api.interceptors.request.use(
  config => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  error => {
    return Promise.reject(error);
  }
);

export const tradingApi = {
  // Market data endpoints
  markets: {
    // Get current price for a symbol
    getPairData: async (symbol) => {
      return await api.get(`/api/markets/pairs/${symbol}`);
    },
    
    // Get historical data for a symbol
    getHistoricalData: async (symbol, interval = '1h', limit = 100) => {
      return await api.get(`/api/markets/history/${symbol}`, {
        params: { interval, limit }
      });
    },
    
    // Get technical indicators for a symbol
    getTechnicalIndicators: async (symbol) => {
      return await api.get(`/api/markets/indicators/${symbol}`);
    },
    
    // Get support and resistance levels for a symbol
    getSupportResistance: async (symbol) => {
      return await api.get(`/api/markets/levels/${symbol}`);
    },
    
    // Get all available trading pairs
    getAllPairs: async () => {
      return await api.get('/api/markets/pairs');
    },
    
    // Get top performing pairs
    getTopPerformers: async (limit = 5) => {
      return await api.get('/api/markets/top-performers', {
        params: { limit }
      });
    }
  },
  
  // Trading endpoints
  trading: {
    // Place a new order
    placeOrder: async (orderData) => {
      return await api.post('/api/trading/orders', orderData);
    },
    
    // Get all open orders
    getOpenOrders: async () => {
      return await api.get('/api/trading/orders/open');
    },
    
    // Get order history
    getOrderHistory: async (limit = 50, offset = 0) => {
      return await api.get('/api/trading/orders/history', {
        params: { limit, offset }
      });
    },
    
    // Cancel an order
    cancelOrder: async (orderId) => {
      return await api.delete(`/api/trading/orders/${orderId}`);
    },
    
    // Get all open positions
    getOpenPositions: async () => {
      return await api.get('/api/trading/positions/open');
    },
    
    // Close a position
    closePosition: async (positionId, price) => {
      return await api.post(`/api/trading/positions/${positionId}/close`, { price });
    },
    
    // Get position history
    getPositionHistory: async (limit = 50, offset = 0) => {
      return await api.get('/api/trading/positions/history', {
        params: { limit, offset }
      });
    },
    
    // Set take profit for a position
    setTakeProfit: async (positionId, price) => {
      return await api.patch(`/api/trading/positions/${positionId}/take-profit`, { price });
    },
    
    // Set stop loss for a position
    setStopLoss: async (positionId, price) => {
      return await api.patch(`/api/trading/positions/${positionId}/stop-loss`, { price });
    },
    
    // Get trade history
    getTradeHistory: async (limit = 50, offset = 0) => {
      return await api.get('/api/trading/history', {
        params: { limit, offset }
      });
    },
    
    // Get trading performance statistics
    getPerformanceStats: async (period = '1m') => {
      return await api.get('/api/trading/stats', {
        params: { period }
      });
    }
  },
  
  // User trading preferences
  preferences: {
    // Get user's trading preferences
    getPreferences: async () => {
      return await api.get('/api/trading/preferences');
    },
    
    // Update user's trading preferences
    updatePreferences: async (preferences) => {
      return await api.patch('/api/trading/preferences', preferences);
    },
    
    // Get favorite pairs
    getFavoritePairs: async () => {
      return await api.get('/api/trading/preferences/favorites');
    },
    
    // Add favorite pair
    addFavoritePair: async (symbol) => {
      return await api.post('/api/trading/preferences/favorites', { symbol });
    },
    
    // Remove favorite pair
    removeFavoritePair: async (symbol) => {
      return await api.delete(`/api/trading/preferences/favorites/${symbol}`);
    }
  },
  
  // Price alerts
  alerts: {
    // Get all active alerts
    getActiveAlerts: async () => {
      return await api.get('/api/trading/alerts');
    },
    
    // Create a new price alert
    createAlert: async (alertData) => {
      return await api.post('/api/trading/alerts', alertData);
    },
    
    // Delete an alert
    deleteAlert: async (alertId) => {
      return await api.delete(`/api/trading/alerts/${alertId}`);
    },
    
    // Update an alert
    updateAlert: async (alertId, alertData) => {
      return await api.patch(`/api/trading/alerts/${alertId}`, alertData);
    }
  },
  
  // Account information
  account: {
    // Get account information
    getAccountInfo: async () => {
      return await api.get('/api/trading/account');
    },
    
    // Get account balance history
    getBalanceHistory: async (period = '1m') => {
      return await api.get('/api/trading/account/balance-history', {
        params: { period }
      });
    },
    
    // Get account transactions
    getTransactions: async (limit = 50, offset = 0) => {
      return await api.get('/api/trading/account/transactions', {
        params: { limit, offset }
      });
    }
  }
};

export default tradingApi; 