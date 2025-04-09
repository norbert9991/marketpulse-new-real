import axios from 'axios';

// Get API URL from environment variable or use the production URL
const API_URL = 
  process.env.NODE_ENV === 'production' 
    ? 'https://marketpulse-new-real.onrender.com'
    : (process.env.REACT_APP_API_URL || 'http://localhost:5000');

console.log('Using API URL:', API_URL); // Debug log

// List of common currency pairs for proper Yahoo Finance formatting
const currencyPairsList = [
  'EURUSD', 'GBPUSD', 'USDJPY', 'AUDUSD', 
  'USDCAD', 'NZDUSD', 'USDCHF', 'GBPJPY', 
  'EURGBP', 'EURJPY'
];

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
      // IMPORTANT: Always ensure token has the "Bearer " prefix
      // Backend requires the "Bearer " prefix for authentication
      const formattedToken = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
      console.log('Using authorization header:', formattedToken.substring(0, 20) + '...'); // Log partial token
      config.headers.Authorization = formattedToken;
    }
    
    return config;
  },
  error => {
    console.error('Request interceptor error:', error);
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
    // Check if the request was made and the server responded
    if (error.response) {
      console.error(`API Error [${error.config?.method}] ${error.config?.url}:`, 
        error.response?.status, error.response?.data);
      
      // Handle 401 Unauthorized errors
      if (error.response.status === 401) {
        console.log('Received 401 error - possible token expiration');
        
        // Check if token is explicitly marked as expired by the server
        const isExpired = error.response.data?.expired === true;
        
        // If we're not already on the login page and not trying to log in
        const isLoginPage = window.location.hash.includes('/login');
        const isLoginRequest = error.config.url.includes('/api/auth/login');
        
        if (!isLoginPage && !isLoginRequest) {
          console.log('Auth failure detected, handling session...');
          
          // If token is explicitly expired, clear it
          if (isExpired) {
            console.log('Token expired, clearing authentication data');
            localStorage.removeItem('token');
          }
          
          // On 401 errors, we should either redirect to login or 
          // rely on the fallback to localStorage user data
          console.log('Redirecting to login page due to auth failure');
          window.location.href = window.location.origin + '/#/';
        }
      }
    } else if (error.request) {
      // The request was made but no response was received
      console.error('No response received from API:', error.request);
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error('Error setting up request:', error.message);
    }
    
    return Promise.reject(error);
  }
);

// Helper API functions
export const API = {
  // Export base URL for components that need it
  baseURL: API_URL,
  
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
    analyze: async ({ symbol }) => {
      try {
        const response = await axiosInstance.post('/api/market-analysis', { symbol });
        return response.data;
      } catch (error) {
        console.error('Market analysis API error:', error.response?.data || error.message);
        throw error;
      }
    },
    getHistory: async (symbol) => {
      // Carefully clean the symbol by removing the "-X" suffix if present
      const originalSymbol = symbol;
      let cleanSymbol = symbol;
      
      if (typeof symbol === 'string') {
        // First method: Split at -X and take first part
        if (symbol.includes('-X')) {
          cleanSymbol = symbol.split('-X')[0];
        }
        
        // Safety check: Make sure we don't send an empty string
        if (!cleanSymbol) {
          cleanSymbol = originalSymbol;
        }
      }
      
      // Extensive debug logging
      console.log('[API] getHistory - Original Symbol:', originalSymbol);
      console.log('[API] getHistory - Cleaned Symbol:', cleanSymbol);
      console.log('[API] getHistory - Full URL:', `${API_URL}/api/market-analysis/${cleanSymbol}/history`);
      
      try {
        // First try with the cleaned symbol
        const response = await axiosInstance.get(`/api/market-analysis/${cleanSymbol}/history`);
        return response;
      } catch (error) {
        console.error('[API] Error in getHistory with cleaned symbol:', error);
        
        // If it failed and we modified the symbol, try with the original
        if (cleanSymbol !== originalSymbol) {
          try {
            console.log('[API] Trying fallback with original symbol:', originalSymbol);
            const fallbackResponse = await axiosInstance.get(`/api/market-analysis/${originalSymbol}/history`);
            return fallbackResponse;
          } catch (fallbackError) {
            console.error('[API] Error in getHistory with original symbol:', fallbackError);
            // Both attempts failed, reject with the original error
            return Promise.reject(error);
          }
        }
        
        // If we didn't modify the symbol or both attempts failed
        return Promise.reject(error);
      }
    },
    refresh: async (symbol) => {
      try {
        const response = await axiosInstance.post('/api/market-analysis/refresh', { symbol });
        return response.data;
      } catch (error) {
        console.error('Market refresh API error:', error.response?.data || error.message);
        throw error;
      }
    },
    getPriceHistory: async (symbol, timeframe = '1mo') => {
      try {
        // Clean symbol for API endpoint format
        const cleanedSymbol = symbol.replace(/[/]/g, '-').toUpperCase();
        const originalSymbol = symbol;
        
        console.log(`Attempting to fetch price history for symbol: ${symbol}`);
        console.log(`Cleaned symbol for API request: ${cleanedSymbol}`);
        
        try {
          // First try with the cleaned symbol
          const url = `/api/market-analysis/${cleanedSymbol}/history?timeframe=${timeframe}`;
          console.log(`Making API request to: ${url}`);
          
          const response = await axiosInstance.get(url);
          console.log('Price history response:', response.data);
          return response.data;
        } catch (err) {
          // If failed with cleaned symbol, try with original symbol as fallback
          if (err.response && err.response.status === 404) {
            console.log(`404 error with cleaned symbol. Trying original symbol: ${originalSymbol}`);
            
            const fallbackUrl = `/api/market-analysis/${originalSymbol}/history?timeframe=${timeframe}`;
            console.log(`Making fallback API request to: ${fallbackUrl}`);
            
            const fallbackResponse = await axiosInstance.get(fallbackUrl);
            console.log('Fallback price history response:', fallbackResponse.data);
            return fallbackResponse.data;
          }
          
          // If it's not a 404 or the fallback failed, rethrow the error
          throw err;
        }
      } catch (error) {
        console.error('Price history API error:', error.response?.data || error.message);
        console.error('Error details:', error);
        
        // Return empty array to prevent app crashes, UI can handle empty state
        return [];
      }
    },
  },
  
  // Favorites endpoints
  favorites: {
    getAll: () => axiosInstance.get('/api/favorites'),
    toggle: (data) => {
      try {
        // Clean the symbol as a precaution
        let cleanData = {...data};
        
        if (data.symbol && typeof data.symbol === 'string' && data.symbol.includes('-X')) {
          cleanData.symbol = data.symbol.split('-X')[0];
          console.log('[API] toggle favorite - Original Symbol:', data.symbol, 'Cleaned to:', cleanData.symbol);
        }
        
        return axiosInstance.post('/api/favorites/toggle', cleanData);
      } catch (error) {
        console.error('[API] Error in favorites.toggle:', error);
        return Promise.reject(error);
      }
    },
    check: (symbol) => {
      try {
        // Clean the symbol for checking favorites
        let cleanSymbol = symbol;
        
        if (typeof symbol === 'string' && symbol.includes('-X')) {
          cleanSymbol = symbol.split('-X')[0];
          console.log('[API] check favorite - Original Symbol:', symbol, 'Cleaned to:', cleanSymbol);
        }
        
        return axiosInstance.get(`/api/favorites/check/${cleanSymbol}`);
      } catch (error) {
        console.error('[API] Error in favorites.check:', error);
        return Promise.reject(error);
      }
    },
  },
  
  // Admin endpoints
  admin: {
    getUsers: () => axiosInstance.get('/api/admin/users'),
    getUserGrowth: () => axiosInstance.get('/api/admin/user-growth'),
    getFavoriteSymbols: () => axiosInstance.get('/api/admin/favorite-symbols'),
    getMarketTrends: () => axiosInstance.get('/api/market-trends'),
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
    getRequests: () => axiosInstance.get('/api/balance-requests'),
    getHistory: (accountId) => axiosInstance.get(`/api/performance-history/${accountId}`),
    approve: (data) => axiosInstance.post('/api/balance-requests/approve', data),
    reject: (data) => axiosInstance.post('/api/balance-requests/reject', data),
  },
};

export default axiosInstance; 