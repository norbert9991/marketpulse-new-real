import axios from 'axios';

// Get API URL from environment variable or use the production URL
const API_URL = 
  process.env.NODE_ENV === 'production' 
    ? 'https://marketpulse-new-real-2-0.onrender.com'
    : (process.env.REACT_APP_API_URL || 'http://localhost:5000');

console.log('Using API URL:', API_URL); // Debug log

// Create a global API cache to reduce redundant calls across components
const apiCache = {
  data: {},
  
  // Get data from cache
  get: (key) => {
    const cachedItem = apiCache.data[key];
    if (!cachedItem) return null;
    
    const now = Date.now();
    if (now - cachedItem.timestamp > cachedItem.expiryMs) {
      // Cache expired, clean up
      delete apiCache.data[key];
      return null;
    }
    
    return cachedItem.data;
  },
  
  // Set data in cache with expiry time
  set: (key, data, expiryMs = 15 * 60 * 1000) => {
    apiCache.data[key] = {
      data,
      timestamp: Date.now(),
      expiryMs
    };
  },
  
  // Clear entire cache or specific key
  clear: (key) => {
    if (key) {
      delete apiCache.data[key];
    } else {
      apiCache.data = {};
    }
  },
  
  // Get cache keys for management
  getKeys: () => Object.keys(apiCache.data)
};

// Expose globally for debugging if needed
window.marketPulseApiCache = apiCache;

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
  
  // News endpoints
  news: {
    getForexNews: (params = {}) => {
      try {
        console.log('[API] Getting forex news with params:', params);
        
        // Generate cache key based on params
        const cacheKey = `forex_news_${params.category || 'all'}`;
        
        // First check our global runtime cache (faster than localStorage)
        const cachedData = apiCache.get(cacheKey);
        if (cachedData) {
          console.log(`[API] Using runtime-cached news data for ${cacheKey}`);
          return Promise.resolve({ data: cachedData });
        }
        
        // Then check localStorage as fallback
        const localStorageData = localStorage.getItem(cacheKey);
        if (localStorageData) {
          try {
            const { data, timestamp } = JSON.parse(localStorageData);
            const cacheAge = Date.now() - timestamp;
            const cacheExpiryMs = 15 * 60 * 1000; // 15 minutes
            
            // If cache is fresh, use it and also update runtime cache
            if (cacheAge < cacheExpiryMs) {
              console.log(`[API] Using localStorage-cached news data (${Math.round(cacheAge / 1000 / 60)}min old)`);
              apiCache.set(cacheKey, data, cacheExpiryMs - cacheAge); // Add to runtime cache with remaining time
              return Promise.resolve({ data });
            }
            
            console.log(`[API] Cache expired (${Math.round(cacheAge / 1000 / 60)}min old), fetching fresh data`);
          } catch (e) {
            console.warn('[API] Failed to parse localStorage cache:', e);
          }
        }
        
        // Mock news data - in a real app, this would be an API call
        const mockNewsData = [
          {
            id: 1,
            title: 'Fed Signals Further Rate Cuts, USD Weakens Against Major Currencies',
            summary: 'The Federal Reserve indicated additional interest rate cuts are likely as inflation continues to moderate, leading to a weakening of the US dollar against major currencies, particularly the Euro and British Pound.',
            source: 'Financial Times',
            date: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString().split('T')[0], // Yesterday
            image: 'https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=500&q=80',
            url: 'https://ft.com/markets/forex/usd-weakens',
            impact: 'High',
            sentiment: 'Bearish',
            relatedCurrencies: ['USD', 'EUR', 'GBP']
          },
          {
            id: 2,
            title: 'Bank of Japan Raises Rates, Yen Strengthens to Three-Year High',
            summary: 'The Bank of Japan raised interest rates for the second time this year, causing the yen to surge to a three-year high against the dollar as Japan moves away from its ultra-loose monetary policy.',
            source: 'Bloomberg',
            date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString().split('T')[0], // 3 days ago
            image: 'https://images.unsplash.com/photo-1524673450801-b5aa9b621b76?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=500&q=80',
            url: 'https://bloomberg.com/markets/currencies/jpy-policy',
            impact: 'High',
            sentiment: 'Bullish',
            relatedCurrencies: ['JPY', 'USD']
          },
          {
            id: 3,
            title: 'ECB Holds Rates Steady Amid Economic Growth Concerns, Euro Dips',
            summary: 'The European Central Bank maintained its current interest rate levels despite earlier expectations of a cut, citing concerns about persistent inflation. However, the euro still weakened against major currencies as growth forecasts were revised downward.',
            source: 'Reuters',
            date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString().split('T')[0], // 5 days ago
            image: 'https://images.unsplash.com/photo-1561414927-6d86591d0c4f?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=500&q=80',
            url: 'https://reuters.com/markets/ecb-policy',
            impact: 'Medium',
            sentiment: 'Bearish',
            relatedCurrencies: ['EUR', 'USD', 'GBP']
          },
          {
            id: 4,
            title: 'UK Inflation Drops to 2.2%, Pound Weakens on Rate Cut Expectations',
            summary: 'British inflation fell to its lowest level in three years at 2.2%, increasing expectations for the Bank of England to cut interest rates at its next meeting. The pound weakened against the dollar and euro on the news.',
            source: 'The Guardian',
            date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString().split('T')[0], // 1 week ago
            image: 'https://images.unsplash.com/photo-1589262804704-c5aa9e6def89?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=500&q=80',
            url: 'https://guardian.co.uk/business/inflation-drops',
            impact: 'Medium',
            sentiment: 'Bearish',
            relatedCurrencies: ['GBP', 'EUR', 'USD']
          },
          {
            id: 5,
            title: 'RBA Surprises with Rate Hike, Australian Dollar Surges',
            summary: 'The Reserve Bank of Australia unexpectedly raised interest rates by 25 basis points to combat persistent inflation, catching markets off guard and sending the Australian dollar sharply higher against most major currencies.',
            source: 'Sydney Morning Herald',
            date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10).toISOString().split('T')[0], // 10 days ago
            image: 'https://images.unsplash.com/photo-1523482580672-f109ba8cb9be?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=500&q=80',
            url: 'https://smh.com.au/markets/rba-hikes',
            impact: 'High',
            sentiment: 'Bullish',
            relatedCurrencies: ['AUD', 'USD']
          },
          {
            id: 6,
            title: 'Oil Prices Stabilize After OPEC+ Meeting, CAD Strengthens',
            summary: 'Oil prices stabilized around $85 per barrel after OPEC+ announced it would maintain current production levels. The Canadian dollar strengthened against the USD due to Canada\'s status as a major oil exporter.',
            source: 'CNBC',
            date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 14).toISOString().split('T')[0], // 2 weeks ago
            image: 'https://images.unsplash.com/photo-1544654803-b69140b285a1?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=500&q=80',
            url: 'https://cnbc.com/energy/opec-meeting',
            impact: 'Medium',
            sentiment: 'Bullish',
            relatedCurrencies: ['CAD', 'USD', 'NOK']
          },
          {
            id: 7,
            title: 'RBNZ Cuts Rates, New Zealand Dollar Falls to 8-Month Low',
            summary: 'The Reserve Bank of New Zealand cut interest rates for the first time in over four years, citing slowing economic growth. The New Zealand dollar dropped to an 8-month low against the US dollar following the announcement.',
            source: 'NZ Herald',
            date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 21).toISOString().split('T')[0], // 3 weeks ago
            image: 'https://images.unsplash.com/photo-1507699622108-4be3abd695ad?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=500&q=80',
            url: 'https://nzherald.co.nz/business/rbnz-cuts-rates',
            impact: 'Medium',
            sentiment: 'Bearish',
            relatedCurrencies: ['NZD', 'AUD', 'USD']
          },
          {
            id: 8,
            title: 'Swiss National Bank Intervenes as Franc Hits Record High',
            summary: 'The Swiss National Bank has reportedly intervened in the foreign exchange market to weaken the Swiss franc, which had reached a record high against the euro due to its safe-haven status amid global economic uncertainty.',
            source: 'Financial Times',
            date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 28).toISOString().split('T')[0], // 4 weeks ago
            image: 'https://images.unsplash.com/photo-1578596247888-9e584f19a188?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=500&q=80',
            url: 'https://ft.com/markets/currencies/snb-intervention',
            impact: 'High',
            sentiment: 'Bearish',
            relatedCurrencies: ['CHF', 'EUR', 'USD']
          },
          {
            id: 9,
            title: 'US Employment Data Exceeds Expectations, Dollar Rallies',
            summary: 'The latest US jobs report showed employment growth significantly above forecasts, with 350,000 jobs added last month compared to the 220,000 expected. The dollar strengthened against all major currencies as expectations for rate cuts diminished.',
            source: 'Wall Street Journal',
            date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString().split('T')[0], // 2 days ago
            image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=500&q=80',
            url: 'https://wsj.com/economy/jobs-report',
            impact: 'High',
            sentiment: 'Bullish',
            relatedCurrencies: ['USD', 'EUR', 'JPY']
          },
          {
            id: 10,
            title: 'Bank of Canada Unexpectedly Holds Rates, CAD Strengthens',
            summary: 'The Bank of Canada kept its benchmark interest rate unchanged at 3.75%, surprising markets that had expected a 25 basis point cut. The Canadian dollar strengthened immediately following the announcement.',
            source: 'CBC News',
            date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 4).toISOString().split('T')[0], // 4 days ago
            image: 'https://images.unsplash.com/photo-1509909756405-be0199881695?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=500&q=80',
            url: 'https://cbc.ca/news/business/boc-rate-decision',
            impact: 'Medium',
            sentiment: 'Bullish',
            relatedCurrencies: ['CAD', 'USD']
          }
        ];
        
        // Simulate API response format with a delay
        return new Promise((resolve) => {
          setTimeout(() => {
            // Filter by category if provided
            let filteredNews = [...mockNewsData];
            if (params.category && params.category !== 'all') {
              if (params.category === 'majors') {
                filteredNews = mockNewsData.filter(news => 
                  news.relatedCurrencies.includes('USD') || 
                  news.relatedCurrencies.includes('EUR') || 
                  news.relatedCurrencies.includes('GBP') || 
                  news.relatedCurrencies.includes('JPY')
                );
              } else if (params.category === 'economic') {
                filteredNews = mockNewsData.filter(news => 
                  news.title.includes('GDP') || 
                  news.title.includes('Employment') || 
                  news.title.includes('Inflation') ||
                  news.summary.includes('economic')
                );
              } else if (params.category === 'central-banks') {
                filteredNews = mockNewsData.filter(news => 
                  news.title.includes('Fed') || 
                  news.title.includes('ECB') || 
                  news.title.includes('Bank of Japan') ||
                  news.title.includes('Bank of England') ||
                  news.summary.includes('central bank')
                );
              } else {
                // Filter by currency
                const currency = params.category.toUpperCase();
                filteredNews = mockNewsData.filter(news => 
                  news.relatedCurrencies.includes(currency)
                );
              }
            }
            
            const responseData = {
              articles: filteredNews,
              totalCount: filteredNews.length,
              lastUpdated: new Date().toISOString()
            };
            
            // Update both runtime cache and localStorage
            apiCache.set(cacheKey, responseData);
            console.log(`[API] News data added to runtime cache with key: ${cacheKey}`);
            
            // Try to update localStorage too as a fallback
            try {
              localStorage.setItem(cacheKey, JSON.stringify({
                data: responseData,
                timestamp: Date.now()
              }));
              console.log(`[API] News data cached in localStorage with key: ${cacheKey}`);
            } catch (error) {
              console.warn('[API] Failed to cache news data in localStorage:', error.message);
            }
            
            resolve({
              data: responseData
            });
          }, 200); // Reduced timeout for better UX when cache is missing
        });
      } catch (error) {
        console.error('[API] Error getting forex news:', error);
        return Promise.reject(error);
      }
    },
    
    // Add method to clear cache if needed (e.g., for admin force refresh)
    clearCache: (category) => {
      const cacheKey = category ? `forex_news_${category}` : null;
      
      // Clear specific key or all news cache if no category specified
      if (cacheKey) {
        apiCache.clear(cacheKey);
        localStorage.removeItem(cacheKey);
        console.log(`[API] Cleared news cache for category: ${category}`);
      } else {
        // Clear all news cache entries
        apiCache.getKeys().forEach(key => {
          if (key.startsWith('forex_news_')) {
            apiCache.clear(key);
            localStorage.removeItem(key);
          }
        });
        console.log('[API] Cleared all news cache');
      }
      
      return Promise.resolve({ success: true });
    }
  },
  
  // Market endpoints
  market: {
    analyze: (data) => {
      try {
        // Get the original symbol
        const originalSymbol = data.symbol;
        let formattedSymbol = data.symbol;
        const forceRefresh = data.force_refresh === true;
        
        if (typeof data.symbol === 'string') {
          // Format for API - keep both "-X" and "=X" formats as our backend handles both
          if (data.symbol.includes('-X')) {
            formattedSymbol = data.symbol;
          } else if (data.symbol.includes('=X')) {
            formattedSymbol = data.symbol;
          }
          
          // Safety check: Make sure we don't send an empty string
          if (!formattedSymbol) {
            formattedSymbol = originalSymbol;
          }
        }
        
        // Debug logging
        console.log('[API] analyze - Original Symbol:', originalSymbol);
        console.log('[API] analyze - Formatted Symbol:', formattedSymbol);
        console.log('[API] analyze - Force Refresh:', forceRefresh);
        
        // Build the URL with optional force_refresh parameter
        const url = `/api/market-analysis/${formattedSymbol}${forceRefresh ? '?force_refresh=true' : ''}`;
        console.log('[API] analyze - Full URL:', `${API_URL}${url}`);
        
        return axiosInstance.get(url)
          .catch(error => {
            // Handle 404 errors gracefully
            if (error.response && error.response.status === 404) {
              console.log(`[API] No analysis data found for ${formattedSymbol}, returning default data`);
              // Generate a default price for the symbol
              const defaultPrice = 1.0;
              
              // Return basic data structure
              return {
                data: {
                  symbol: originalSymbol,
                  current_price: defaultPrice,
                  trend: 'Neutral',
                  technical_indicators: {
                    rsi: 50,
                    macd: 0,
                    macd_signal: 0,
                    macd_hist: 0,
                    sma20: defaultPrice,
                    sma50: defaultPrice,
                    sma200: defaultPrice
                  },
                  support_resistance: {
                    support: [],
                    resistance: []
                  },
                  sentiment: {
                    overall: 'Neutral',
                    confidence: 50
                  },
                  predictions: [defaultPrice, defaultPrice, defaultPrice, defaultPrice, defaultPrice],
                  prediction_dates: ['Day 1', 'Day 2', 'Day 3', 'Day 4', 'Day 5'],
                  last_updated: new Date().toISOString()
                }
              };
            }
            // For other errors, continue with the rejection
            return Promise.reject(error);
          });
      } catch (error) {
        console.error('[API] Error in analyze:', error);
        return Promise.reject(error);
      }
    },
    getHistory: (symbol, options = {}) => {
      try {
        // Get options with defaults
        const days = options.days || 30;
        const forceRefresh = options.force_refresh === true;
        
        // Carefully clean the symbol by removing the "-X" suffix if present
        const originalSymbol = symbol;
        let formattedSymbol = symbol;
        
        if (typeof symbol === 'string') {
          // We'll pass the symbol as-is since our backend can handle both formats
          formattedSymbol = symbol;
          
          // Safety check: Make sure we don't send an empty string
          if (!formattedSymbol) {
            formattedSymbol = originalSymbol;
          }
        }
        
        // Debug logging
        console.log('[API] getHistory - Original Symbol:', originalSymbol);
        console.log('[API] getHistory - Formatted Symbol:', formattedSymbol);
        console.log('[API] getHistory - Days:', days);
        console.log('[API] getHistory - Force Refresh:', forceRefresh);
        
        // Build URL with query parameters
        const params = new URLSearchParams();
        if (days !== 30) params.append('days', days);
        if (forceRefresh) params.append('force_refresh', 'true');
        
        const queryString = params.toString();
        const url = `/api/market-analysis/${formattedSymbol}/history${queryString ? `?${queryString}` : ''}`;
        
        console.log('[API] getHistory - Full URL:', `${API_URL}${url}`);
        
        return axiosInstance.get(url)
          .catch(error => {
            // Handle 404 errors gracefully
            if (error.response && error.response.status === 404) {
              console.log(`[API] No history data found for ${formattedSymbol}, returning empty data`);
              // Return empty data structure for better UI handling
              return {
                data: {
                  symbol: originalSymbol,
                  history: []
                }
              };
            }
            // For other errors, continue with the rejection
            return Promise.reject(error);
          });
      } catch (error) {
        console.error('[API] Error in getHistory:', error);
        return Promise.reject(error);
      }
    },
    refresh: (symbol) => {
      try {
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
        console.log('[API] refresh - Original Symbol:', originalSymbol);
        console.log('[API] refresh - Cleaned Symbol:', cleanSymbol);
        console.log('[API] refresh - Full URL:', `${API_URL}/api/market-analysis/refresh/${cleanSymbol}`);
        
        return axiosInstance.post(`/api/market-analysis/refresh/${cleanSymbol}`, {});
      } catch (error) {
        console.error('[API] Error in refresh:', error);
        return Promise.reject(error);
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