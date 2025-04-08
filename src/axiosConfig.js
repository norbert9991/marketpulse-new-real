import axios from 'axios';

// Get API URL from environment variable or use the production URL
const API_URL = 
  process.env.NODE_ENV === 'production' 
    ? 'https://marketpulse-new-real.onrender.com'
    : (process.env.REACT_APP_API_URL || 'http://localhost:5000');

console.log('Using API URL:', API_URL); // Debug log

// Create a custom axios instance
const axiosInstance = axios.create({
  baseURL: API_URL,
  withCredentials: false, // Set to false for cross-domain requests without credentials
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  }
});

// Add a request interceptor
axiosInstance.interceptors.request.use(
  config => {
    // Get token from localStorage for authenticated requests
    const token = localStorage.getItem('token');
    console.log('Token from localStorage:', token ? token.substring(0, 20) + '...' : 'none'); // Log partial token for debugging
    
    if (token) {
      // IMPORTANT: Backend requires the Bearer prefix for tokens
      // Format token properly for the backend
      let formattedToken;
      
      // If token already has Bearer prefix, use it as is
      if (token.startsWith('Bearer ')) {
        formattedToken = token;
      } else {
        // Add Bearer prefix if it doesn't have it
        formattedToken = `Bearer ${token}`;
      }
      
      console.log('Using authorization header:', formattedToken.substring(0, 20) + '...'); // Log partial token
      config.headers.Authorization = formattedToken;
    }
    
    return config;
  },
  error => {
    return Promise.reject(error);
  }
);

// Add a response interceptor to log API responses for debugging
axiosInstance.interceptors.response.use(
  response => {
    console.log(`API Response [${response.config.method}] ${response.config.url}:`, response.status);
    return response;
  },
  error => {
    console.error(`API Error [${error.config?.method}] ${error.config?.url}:`, 
      error.response?.status, error.response?.data);
    return Promise.reject(error);
  }
);

// Helper API functions
export const API = {
  // Auth endpoints
  auth: {
    login: (data) => axiosInstance.post('/api/auth/login', data),
    register: (data) => axiosInstance.post('/api/auth/register', data),
    me: () => axiosInstance.get('/api/auth/me'),
  },
  
  // Settings endpoints
  settings: {
    updateEmail: (data) => axiosInstance.put('/api/settings/update-email', data),
    updatePassword: (data) => axiosInstance.put('/api/settings/update-password', data),
    deleteAccount: () => axiosInstance.delete('/api/settings/delete-account'),
  },
  
  // Market endpoints
  market: {
    analyze: (data) => axiosInstance.post('/api/market/analyze', data),
    getHistoricalData: (symbol) => axiosInstance.get(`/api/market/history/${symbol}`),
    saveTrade: (tradeData) => axiosInstance.post('/api/market/trades', tradeData),
    getTradeHistory: () => axiosInstance.get('/api/market/trades'),
    getTrade: (tradeId) => axiosInstance.get(`/api/market/trades/${tradeId}`),
  },
  
  // Favorites endpoints
  favorites: {
    getAll: () => axiosInstance.get('/api/favorites'),
    toggle: (data) => axiosInstance.post('/api/favorites/toggle', data),
    check: (symbol) => axiosInstance.get(`/api/favorites/check/${symbol}`),
  },
  
  // Admin endpoints
  admin: {
    getUsers: () => axiosInstance.get('/api/admin/users'),
    getUserGrowth: () => axiosInstance.get('/api/admin/users/growth'),
    getFavoriteSymbols: () => axiosInstance.get('/api/admin/favorites/popular'),
    getMarketTrends: () => axiosInstance.get('/api/admin/market/trends'),
    updateUserStatus: (userId, status) => 
      axiosInstance.put(`/api/admin/users/${userId}/status`, { status }),
    getProfile: () => axiosInstance.get('/api/admin/profile'),
    getAdmins: () => axiosInstance.get('/api/admin/admins'),
    updateProfile: (data) => axiosInstance.put('/api/admin/update-profile', data),
    addAdmin: (data) => axiosInstance.post('/api/admin/add-admin', data),
    deleteAdmin: (adminId) => axiosInstance.delete(`/api/admin/delete-admin/${adminId}`),
  },
  
  // Balance requests
  balance: {
    get: () => axiosInstance.get('/api/balance'),
    update: (data) => axiosInstance.put('/api/balance', data),
    deposit: (data) => axiosInstance.post('/api/balance/deposit', data),
    withdraw: (data) => axiosInstance.post('/api/balance/withdraw', data),
    getRequests: () => axiosInstance.get('/api/balance/requests'),
    getHistory: (accountId) => axiosInstance.get(`/api/balance/history/${accountId}`),
    approve: (requestId) => axiosInstance.put(`/api/balance/requests/${requestId}/approve`),
    reject: (requestId) => axiosInstance.put(`/api/balance/requests/${requestId}/reject`),
  },
};

export default axiosInstance; 