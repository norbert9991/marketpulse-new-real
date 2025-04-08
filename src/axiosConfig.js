import axios from 'axios';

// Set the API URL based on environment
const API_URL = process.env.NODE_ENV === 'production' 
  ? 'https://marketpulse-new-real.onrender.com'
  : 'http://localhost:5000';

console.log('Using API URL:', API_URL);

// Create axios instance with base URL
const instance = axios.create({
  baseURL: API_URL,
  timeout: 10000
});

// Request interceptor to add auth token
instance.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token');
    if (token) {
      console.log('Using token:', token);
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  error => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
instance.interceptors.response.use(
  response => {
    return response;
  },
  error => {
    // Handle errors centrally here if needed
    return Promise.reject(error);
  }
);

// API utility object with helper functions for different endpoints
export const API = {
  // Auth endpoints
  auth: {
    login: (credentials) => instance.post('/api/auth/login', credentials),
    register: (userData) => instance.post('/api/auth/register', userData),
    me: () => instance.get('/api/auth/me')
  },
  
  // Settings endpoints
  settings: {
    updateEmail: (data) => instance.put('/api/users/email', data),
    updatePassword: (data) => instance.put('/api/users/password', data),
    deleteAccount: () => instance.delete('/api/users')
  },
  
  // Market analysis endpoints
  market: {
    analyze: (params) => instance.get(`/api/market-analysis/${params.symbol}`),
    refresh: (symbol) => instance.post(`/api/market-analysis/${symbol}/refresh`),
    getHistory: (symbol) => instance.get(`/api/market-analysis/${symbol}/history`),
    getAll: () => instance.get('/api/market-analysis')
  },
  
  // Favorites endpoints
  favorites: {
    getAll: () => instance.get('/api/favorites'),
    toggle: (data) => instance.post('/api/favorites/toggle', data),
    check: (symbol) => instance.get(`/api/favorites/check/${symbol}`)
  },
  
  // Admin endpoints
  admin: {
    getUsers: () => instance.get('/api/admin/users'),
    updateUserStatus: (userId, status) => instance.put(`/api/admin/users/${userId}/status`, { status }),
    getUserGrowth: () => instance.get('/api/admin/users/growth'),
    getFavoriteSymbols: () => instance.get('/api/admin/favorites/popular'),
    getMarketTrends: () => instance.get('/api/admin/market/trends')
  },
  
  // Balance endpoints
  balance: {
    getBalance: () => instance.get('/api/balance'),
    deposit: (amount) => instance.post('/api/balance/deposit', { amount }),
    withdraw: (amount) => instance.post('/api/balance/withdraw', { amount }),
    getRequests: () => instance.get('/api/balance/requests'),
    getHistory: (accountId) => instance.get(`/api/balance/history/${accountId}`),
    approve: (requestId) => instance.post(`/api/balance/requests/${requestId}/approve`),
    reject: (requestId) => instance.post(`/api/balance/requests/${requestId}/reject`)
  }
};

export default instance;