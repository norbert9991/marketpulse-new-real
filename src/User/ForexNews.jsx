import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Grid,
  IconButton,
  Tooltip,
  Chip,
  Divider,
  Button,
  CircularProgress,
  Card,
  CardContent,
  CardMedia,
  CardActionArea,
  Avatar,
  Link,
  Menu,
  MenuItem
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import { API } from '../axiosConfig';
import RefreshIcon from '@mui/icons-material/Refresh';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import BookmarkBorderIcon from '@mui/icons-material/BookmarkBorder';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import ShareIcon from '@mui/icons-material/Share';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import MoreVertIcon from '@mui/icons-material/MoreVert';

// Reuse the same color palette to maintain UI consistency
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

// Mock news data for fallback when API fails
const mockNewsData = [
  {
    id: 1,
    title: 'Fed Signals Rate Cuts on Horizon, USD Weakens Against Major Currencies',
    summary: 'The Federal Reserve indicated potential interest rate cuts as inflation pressures ease, leading to a weakening of the US dollar against major currencies, particularly the Euro and British Pound.',
    source: 'Financial Times',
    date: '2023-11-15',
    image: 'https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=500&q=80',
    url: '#',
    impact: 'High',
    sentiment: 'Bearish',
    relatedCurrencies: ['USD', 'EUR', 'GBP']
  },
  {
    id: 2,
    title: 'Bank of Japan Maintains Ultra-Low Interest Rates, Yen Continues to Struggle',
    summary: 'The Bank of Japan maintained its ultra-low interest rate policy despite rising inflation, causing the yen to continue its downward trend against major currencies.',
    source: 'Bloomberg',
    date: '2023-11-14',
    image: 'https://images.unsplash.com/photo-1524673450801-b5aa9b621b76?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=500&q=80',
    url: '#',
    impact: 'Medium',
    sentiment: 'Bearish',
    relatedCurrencies: ['JPY', 'USD']
  },
  {
    id: 3,
    title: 'European Central Bank Hints at Tighter Monetary Policy, Euro Strengthens',
    summary: 'The ECB suggested it may tighten monetary policy further to combat persistent inflation, leading to a strengthening of the Euro against most major currencies.',
    source: 'Reuters',
    date: '2023-11-13',
    image: 'https://images.unsplash.com/photo-1561414927-6d86591d0c4f?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=500&q=80',
    url: '#',
    impact: 'High',
    sentiment: 'Bullish',
    relatedCurrencies: ['EUR', 'USD', 'GBP']
  },
  {
    id: 4,
    title: 'UK GDP Shows Unexpected Growth, Pound Surges',
    summary: 'The UK economy showed unexpected growth in the third quarter, beating analyst expectations and causing the pound to surge against major currencies.',
    source: 'The Guardian',
    date: '2023-11-12',
    image: 'https://images.unsplash.com/photo-1589262804704-c5aa9e6def89?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=500&q=80',
    url: '#',
    impact: 'Medium',
    sentiment: 'Bullish',
    relatedCurrencies: ['GBP', 'EUR', 'USD']
  },
  {
    id: 5,
    title: 'Australian Employment Data Exceeds Expectations, AUD Strengthens',
    summary: 'Australian employment data came in stronger than expected, prompting speculation about potential rate hikes by the RBA and strengthening the Australian dollar.',
    source: 'Sydney Morning Herald',
    date: '2023-11-11',
    image: 'https://images.unsplash.com/photo-1523482580672-f109ba8cb9be?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=500&q=80',
    url: '#',
    impact: 'Medium',
    sentiment: 'Bullish',
    relatedCurrencies: ['AUD', 'USD']
  },
  {
    id: 6,
    title: 'Oil Prices Surge as OPEC+ Announces Production Cuts, CAD Benefits',
    summary: 'Oil prices surged after OPEC+ announced deeper production cuts, leading to strength in commodity-linked currencies, particularly the Canadian dollar.',
    source: 'CNBC',
    date: '2023-11-10',
    image: 'https://images.unsplash.com/photo-1544654803-b69140b285a1?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=500&q=80',
    url: '#',
    impact: 'High',
    sentiment: 'Bullish',
    relatedCurrencies: ['CAD', 'USD', 'NOK']
  }
];

const ForexNews = () => {
  const [user, setUser] = useState(null);
  const [newsData, setNewsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [savedArticles, setSavedArticles] = useState([]);
  const [currentCategory, setCurrentCategory] = useState('all');
  const [pageLoading, setPageLoading] = useState(true);
  const [refreshCount, setRefreshCount] = useState(0); // Track refreshes for analytics
  const [menuAnchorEl, setMenuAnchorEl] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const navigate = useNavigate();

  // Categories for news filtering
  const categories = [
    { value: 'all', label: 'All News' },
    { value: 'majors', label: 'Major Pairs' },
    { value: 'usd', label: 'USD News' },
    { value: 'eur', label: 'EUR News' },
    { value: 'gbp', label: 'GBP News' },
    { value: 'jpy', label: 'JPY News' },
    { value: 'economic', label: 'Economic Data' },
    { value: 'central-banks', label: 'Central Banks' }
  ];

  // Fetch user and initial data
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await API.auth.me();
        setUser(response.data.user);
        // Check if user has admin privileges
        setIsAdmin(response.data.user?.role === 'admin');
      } catch (error) {
        console.error('Error fetching user data:', error);
      } finally {
        setPageLoading(false);
      }
    };
    
    fetchUser();
  }, [navigate]);

  // Toggle article bookmark status
  const toggleSaveArticle = (articleId) => {
    if (savedArticles.includes(articleId)) {
      setSavedArticles(savedArticles.filter(id => id !== articleId));
    } else {
      setSavedArticles([...savedArticles, articleId]);
    }
    
    // Persist saved articles to localStorage
    try {
      const updatedSavedArticles = savedArticles.includes(articleId) 
        ? savedArticles.filter(id => id !== articleId)
        : [...savedArticles, articleId];
      localStorage.setItem('saved_news_articles', JSON.stringify(updatedSavedArticles));
    } catch (error) {
      console.error('Error saving articles to localStorage:', error);
    }
  };

  // Load saved articles from localStorage on mount
  useEffect(() => {
    try {
      const savedArticlesData = localStorage.getItem('saved_news_articles');
      if (savedArticlesData) {
        setSavedArticles(JSON.parse(savedArticlesData));
      }
    } catch (error) {
      console.error('Error loading saved articles from localStorage:', error);
    }
  }, []);

  // Fetch news data with staggered loading to avoid hitting rate limits
  useEffect(() => {
    const fetchNews = async () => {
      setLoading(true);
      
      // Check if we have cached data to show immediately while we fetch
      const cacheKey = `forex_news_${currentCategory || 'all'}`;
      const cachedData = localStorage.getItem(cacheKey);
      
      if (cachedData) {
        try {
          const { data, timestamp } = JSON.parse(cachedData);
          // Show cached data immediately for better UX
          setNewsData(data.articles);
          setLoading(false);
          
          const cacheAge = Date.now() - timestamp;
          const cacheExpiryMs = 15 * 60 * 1000; // 15 minutes
          
          // If cache is still fresh, don't refetch
          if (cacheAge < cacheExpiryMs) {
            console.log(`Using fresh cached news data (${Math.round(cacheAge / 1000 / 60)}min old)`);
            return;
          }
          
          // If cache is stale, we'll continue to fetch updated data
          console.log(`Using stale cached data while fetching (${Math.round(cacheAge / 1000 / 60)}min old)`);
        } catch (e) {
          console.error('Error parsing cached news data:', e);
        }
      }
      
      try {
        // Add a small random delay (0-5 seconds) to stagger requests when many users access at once
        const randomDelay = Math.floor(Math.random() * 5000);
        if (randomDelay > 0) {
          console.log(`Applying staggered loading delay: ${randomDelay}ms`);
          await new Promise(resolve => setTimeout(resolve, randomDelay));
        }
        
        // Use the news API endpoint
        const response = await API.news.getForexNews({ category: currentCategory });
        setNewsData(response.data.articles);
        setError(null);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching news data:', error);
        
        // Only show error if we don't already have data from cache
        if (newsData.length === 0) {
          setError('Failed to load forex news. Please try again later.');
          setNewsData(mockNewsData); // Fallback to mock data if API fails
        }
        
        setLoading(false);
      }
    };
    
    fetchNews();
  }, [currentCategory]);

  // Format date for display
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', options);
  };

  // Get sentiment color
  const getSentimentColor = (sentiment) => {
    if (sentiment === 'Bullish') return colors.buyGreen;
    if (sentiment === 'Bearish') return colors.sellRed;
    return colors.secondaryText;
  };

  // Get impact color
  const getImpactColor = (impact) => {
    if (impact === 'High') return colors.sellRed;
    if (impact === 'Medium') return colors.warningOrange;
    return colors.secondaryText;
  };

  // Handle menu open/close
  const handleMenuOpen = (event) => {
    setMenuAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setMenuAnchorEl(null);
  };

  // Force refresh - bypasses cache completely
  const handleForceRefresh = () => {
    handleMenuClose();
    setLoading(true);
    
    // Clear the cache first
    API.news.clearCache(currentCategory)
      .then(() => {
        // Then fetch fresh data
        return API.news.getForexNews({ category: currentCategory });
      })
      .then(response => {
        setNewsData(response.data.articles);
        setError(null);
        setLoading(false);
        setRefreshCount(prev => prev + 1);
      })
      .catch(error => {
        console.error('Error force refreshing news data:', error);
        setError('Failed to force refresh forex news. Please try again later.');
        setLoading(false);
      });
  };

  // Handle standard refresh with optimistic UI update
  const handleRefresh = () => {
    setLoading(true);
    
    // Remember current position to maintain scroll position after refresh
    const scrollPosition = window.pageYOffset;
    
    // Fetch fresh data using the API
    API.news.getForexNews({ category: currentCategory })
      .then(response => {
        setNewsData(response.data.articles);
        setError(null);
        setLoading(false);
        setRefreshCount(prev => prev + 1);
        
        // Restore scroll position after refresh
        setTimeout(() => window.scrollTo(0, scrollPosition), 100);
      })
      .catch(error => {
        console.error('Error refreshing news data:', error);
        setError('Failed to refresh forex news. Please try again later.');
        setLoading(false);
      });
  };

  if (pageLoading) {
    return (
      <Box sx={{ 
        display: 'flex', 
        minHeight: '100vh', 
        backgroundColor: colors.darkBg,
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'column',
        gap: 2
      }}>
        <CircularProgress size={60} sx={{ color: colors.accentBlue }} />
        <Typography variant="h6" sx={{ color: colors.primaryText }}>
          Loading Forex News...
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', backgroundColor: colors.darkBg }}>
      <Sidebar />
      
      {/* Main Content */}
      <Box sx={{ 
        flex: 1, 
        p: { xs: 2, md: 3 },
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
        ml: '250px'
      }}>
        {/* Header Section */}
        <Paper 
          sx={{ 
            p: 2,
            backgroundColor: colors.cardBg,
            border: `1px solid ${colors.borderColor}`,
            borderRadius: '12px',
            boxShadow: `0 4px 12px ${colors.shadowColor}`
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Typography variant="h5" sx={{ color: colors.primaryText, fontWeight: 'bold' }}>
                Forex News
              </Typography>
              <Tooltip title="Latest news and updates that affect the forex market" arrow>
                <IconButton sx={{ color: colors.secondaryText }}>
                  <HelpOutlineIcon />
                </IconButton>
              </Tooltip>
            </Box>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button 
                variant="contained" 
                startIcon={<RefreshIcon />}
                onClick={handleRefresh}
                disabled={loading}
                sx={{ 
                  backgroundColor: colors.accentBlue,
                  '&:hover': { backgroundColor: colors.gradientStart }
                }}
              >
                {loading ? <CircularProgress size={24} /> : 'Refresh'}
              </Button>
              
              {/* Options menu with admin functions */}
              <IconButton
                sx={{ color: colors.secondaryText }}
                onClick={handleMenuOpen}
                disabled={loading}
              >
                <MoreVertIcon />
              </IconButton>
              
              <Menu
                anchorEl={menuAnchorEl}
                open={Boolean(menuAnchorEl)}
                onClose={handleMenuClose}
                PaperProps={{
                  sx: {
                    backgroundColor: colors.panelBg,
                    border: `1px solid ${colors.borderColor}`,
                  }
                }}
              >
                <MenuItem 
                  onClick={handleForceRefresh}
                  sx={{ 
                    color: colors.primaryText,
                    '&:hover': { backgroundColor: colors.hoverBg }
                  }}
                >
                  <Typography variant="body2">Force Refresh {isAdmin && "(Admin)"}</Typography>
                </MenuItem>
              </Menu>
            </Box>
          </Box>
          <Typography variant="body2" sx={{ color: colors.secondaryText }}>
            Stay updated with the latest news affecting major currency pairs and forex markets
          </Typography>
        </Paper>

        {/* Categories Filter */}
        <Box sx={{ 
          display: 'flex', 
          gap: 1, 
          flexWrap: 'wrap',
          p: 1,
          backgroundColor: colors.panelBg,
          borderRadius: '12px',
          border: `1px solid ${colors.borderColor}`
        }}>
          {categories.map((category) => (
            <Chip 
              key={category.value}
              label={category.label}
              onClick={() => setCurrentCategory(category.value)}
              sx={{ 
                backgroundColor: currentCategory === category.value ? colors.accentBlue : colors.cardBg,
                color: currentCategory === category.value ? colors.primaryText : colors.secondaryText,
                '&:hover': { 
                  backgroundColor: currentCategory === category.value ? colors.accentBlue : colors.hoverBg
                }
              }}
            />
          ))}
        </Box>

        {/* News Content Grid */}
        <Box sx={{ mt: 2 }}>
          {loading ? (
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'center', 
              minHeight: '300px'
            }}>
              <CircularProgress sx={{ color: colors.accentBlue }} />
            </Box>
          ) : error ? (
            <Paper sx={{ 
              p: 3, 
              textAlign: 'center',
              backgroundColor: colors.cardBg,
              border: `1px solid ${colors.borderColor}`,
              borderRadius: '12px'
            }}>
              <Typography variant="h6" sx={{ color: colors.sellRed, mb: 2 }}>
                {error}
              </Typography>
              <Button 
                variant="outlined" 
                onClick={handleRefresh}
                sx={{ 
                  borderColor: colors.accentBlue, 
                  color: colors.accentBlue
                }}
              >
                Try Again
              </Button>
            </Paper>
          ) : (
            <Grid container spacing={2}>
              {newsData.map((article) => (
                <Grid item xs={12} md={6} lg={4} key={article.id}>
                  <Card sx={{ 
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    backgroundColor: colors.cardBg,
                    border: `1px solid ${colors.borderColor}`,
                    borderRadius: '12px',
                    overflow: 'hidden',
                    transition: 'transform 0.2s ease',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: `0 8px 16px ${colors.shadowColor}`
                    }
                  }}>
                    <CardActionArea 
                      component="a" 
                      href={article.url} 
                      target="_blank"
                      sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', alignItems: 'stretch' }}
                    >
                      <CardMedia
                        component="img"
                        height="160"
                        image={article.image}
                        alt={article.title}
                        sx={{ objectFit: 'cover' }}
                      />
                      <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                          <Typography variant="caption" sx={{ color: colors.secondaryText }}>
                            {article.source}
                          </Typography>
                          <Typography variant="caption" sx={{ color: colors.secondaryText }}>
                            {formatDate(article.date)}
                          </Typography>
                        </Box>
                        
                        <Typography variant="subtitle1" sx={{ 
                          color: colors.primaryText, 
                          fontWeight: 'bold',
                          mb: 1
                        }}>
                          {article.title}
                        </Typography>
                        
                        <Typography variant="body2" sx={{ 
                          color: colors.secondaryText,
                          mb: 2,
                          flexGrow: 1
                        }}>
                          {article.summary}
                        </Typography>
                        
                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 1 }}>
                          <Chip 
                            icon={article.sentiment === 'Bullish' ? <TrendingUpIcon /> : <TrendingDownIcon />}
                            label={article.sentiment} 
                            size="small"
                            sx={{ 
                              backgroundColor: `${getSentimentColor(article.sentiment)}20`,
                              color: getSentimentColor(article.sentiment),
                              borderRadius: '4px',
                              '& .MuiChip-icon': {
                                color: getSentimentColor(article.sentiment)
                              }
                            }}
                          />
                          <Chip 
                            label={`Impact: ${article.impact}`} 
                            size="small"
                            sx={{ 
                              backgroundColor: `${getImpactColor(article.impact)}20`,
                              color: getImpactColor(article.impact),
                              borderRadius: '4px'
                            }}
                          />
                        </Box>
                        
                        <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                          {article.relatedCurrencies.map(currency => (
                            <Chip 
                              key={currency} 
                              label={currency} 
                              size="small"
                              sx={{ 
                                backgroundColor: colors.panelBg,
                                color: colors.secondaryText,
                                fontSize: '0.7rem',
                                height: '20px'
                              }}
                            />
                          ))}
                        </Box>
                      </CardContent>
                    </CardActionArea>
                    
                    <Divider sx={{ backgroundColor: colors.borderColor }} />
                    
                    <Box sx={{ 
                      display: 'flex', 
                      justifyContent: 'space-between',
                      p: 1
                    }}>
                      <IconButton 
                        size="small" 
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          toggleSaveArticle(article.id);
                        }}
                        sx={{ color: savedArticles.includes(article.id) ? colors.accentBlue : colors.secondaryText }}
                      >
                        {savedArticles.includes(article.id) ? <BookmarkIcon /> : <BookmarkBorderIcon />}
                      </IconButton>
                      
                      <IconButton 
                        size="small"
                        component="a"
                        href={article.url}
                        target="_blank"
                        sx={{ color: colors.secondaryText }}
                      >
                        <OpenInNewIcon />
                      </IconButton>
                      
                      <IconButton 
                        size="small"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          // In a real app, you would implement share functionality here
                          alert(`Sharing article: ${article.title}`);
                        }}
                        sx={{ color: colors.secondaryText }}
                      >
                        <ShareIcon />
                      </IconButton>
                    </Box>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </Box>
      </Box>
    </Box>
  );
};

export default ForexNews; 