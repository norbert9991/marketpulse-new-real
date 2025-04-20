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
  MenuItem,
  Alert
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

// News categories for filter
const newsCategories = [
  { value: 'all', label: 'All News' },
  { value: 'majors', label: 'Major Pairs' },
  { value: 'USD', label: 'USD News' },
  { value: 'EUR', label: 'EUR News' },
  { value: 'GBP', label: 'GBP News' },
  { value: 'JPY', label: 'JPY News' },
  { value: 'economic', label: 'Economic Data' },
  { value: 'central_banks', label: 'Central Banks' }
];

const ForexNews = () => {
  const navigate = useNavigate();
  
  // Get API URL from environment or default to localhost
  const API_URL = 
    process.env.NODE_ENV === 'production' 
      ? 'https://marketpulse-new-real-2-0.onrender.com'
      : (process.env.REACT_APP_API_URL || 'http://localhost:5000');
  
  // State variables
  const [newsData, setNewsData] = useState([]);
  const [savedArticles, setSavedArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentCategory, setCurrentCategory] = useState('all');
  const [refreshCount, setRefreshCount] = useState(0);
  const [anchorEl, setAnchorEl] = useState(null);
  const [apiSource, setApiSource] = useState('');
  
  // Menu handling
  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };
  
  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  // Effect to load saved articles from localStorage
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('saved_forex_articles') || '[]');
      setSavedArticles(saved);
    } catch (error) {
      console.error('Error loading saved articles:', error);
      setSavedArticles([]);
    }
  }, []);

  // Effect to fetch news data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Call the real backend endpoint
        console.log(`Fetching news for category: ${currentCategory}`);
        const response = await fetch(`${API_URL}/api/news/forex?category=${currentCategory}`);
        
        if (!response.ok) {
          throw new Error(`API returned status ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data && data.articles) {
          console.log(`Received ${data.articles.length} articles for category ${currentCategory}`);
          setNewsData(data.articles);
          setApiSource(data.source || 'API');
          setError(null);
        } else {
          throw new Error('Invalid data format returned from API');
        }
      } catch (error) {
        console.error('Error fetching forex news:', error);
        setError('Failed to load forex news. Please try again later.');
        
        // Fallback to client-side mock data if API request fails
        try {
          // Try to use the axiosConfig mock data as a fallback
          const fallbackResponse = await API.news.getForexNews({ category: currentCategory });
          if (fallbackResponse && fallbackResponse.data && fallbackResponse.data.articles) {
            setNewsData(fallbackResponse.data.articles);
            setApiSource('Local Cache');
          } else {
            setNewsData([]);
          }
        } catch (fallbackError) {
          console.error('Failed to get fallback news data:', fallbackError);
          setNewsData([]);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [currentCategory, refreshCount, API_URL]);

  // Format date to be more readable
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Get color based on sentiment
  const getSentimentColor = (sentiment) => {
    switch (sentiment?.toLowerCase()) {
      case 'bullish':
        return colors.buyGreen;
      case 'bearish':
        return colors.sellRed;
      case 'neutral':
        return colors.accentBlue;
      default:
        return colors.secondaryText;
    }
  };

  // Get color based on impact
  const getImpactColor = (impact) => {
    switch (impact?.toLowerCase()) {
      case 'high':
        return colors.sellRed;
      case 'medium':
        return colors.warningOrange;
      case 'low':
        return colors.accentBlue;
      default:
        return colors.secondaryText;
    }
  };

  // Toggle saved status of an article
  const toggleSaveArticle = (article) => {
    const isCurrentlySaved = savedArticles.some(saved => saved.id === article.id);
    let newSaved;
    
    if (isCurrentlySaved) {
      newSaved = savedArticles.filter(saved => saved.id !== article.id);
    } else {
      newSaved = [...savedArticles, article];
    }
    
    setSavedArticles(newSaved);
    
    try {
      localStorage.setItem('saved_forex_articles', JSON.stringify(newSaved));
    } catch (error) {
      console.error('Error saving article to localStorage:', error);
    }
  };

  // Force refresh - bypasses cache completely
  const handleForceRefresh = () => {
    handleMenuClose();
    setLoading(true);
    
    // Remember current position to maintain scroll position after refresh
    const scrollPosition = window.pageYOffset;
    
    // Call API with force=true to bypass cache
    fetch(`${API_URL}/api/news/forex?category=${currentCategory}&force=true`)
      .then(response => {
        if (!response.ok) {
          throw new Error(`API returned status ${response.status}`);
        }
        return response.json();
      })
      .then(data => {
        if (data && data.articles) {
          setNewsData(data.articles);
          setApiSource(data.source || 'API (Force Refresh)');
          setError(null);
          
          // Restore scroll position after refresh
          setTimeout(() => window.scrollTo(0, scrollPosition), 100);
        } else {
          throw new Error('Invalid data format returned from API');
        }
      })
      .catch(error => {
        console.error('Error force refreshing news data:', error);
        setError('Failed to force refresh forex news. Please try again later.');
        
        // Try using the in-component fallback
        try {
          const fallbackResponse = API.news.getForexNews({ category: currentCategory });
          if (fallbackResponse && fallbackResponse.data && fallbackResponse.data.articles) {
            setNewsData(fallbackResponse.data.articles);
            setApiSource('Local Cache (Fallback after Force Refresh Failed)');
          }
        } catch (fallbackError) {
          console.error('Failed to get fallback news data after force refresh failed:', fallbackError);
        }
      })
      .finally(() => {
        setLoading(false);
      });
  };

  // Handle standard refresh with optimistic UI update
  const handleRefresh = () => {
    setLoading(true);
    
    // Remember current position to maintain scroll position after refresh
    const scrollPosition = window.pageYOffset;
    
    // Increment refresh counter to trigger the useEffect
    setRefreshCount(prev => prev + 1);
    
    // Restore scroll position after refresh
    setTimeout(() => window.scrollTo(0, scrollPosition), 100);
  };

  // Share article - in a real app, this would open a share dialog
  const shareArticle = (article) => {
    // Try to use the Web Share API if available
    if (navigator.share) {
      navigator.share({
        title: article.title,
        text: article.summary,
        url: article.url,
      })
      .catch(error => {
        console.log('Error sharing:', error);
        alert(`Sharing article: ${article.title}`);
      });
    } else {
      // Fallback
      alert(`Sharing article: ${article.title}`);
    }
  };

  return (
    <Box sx={{ display: 'flex', bgcolor: colors.darkBg, height: '100vh', overflow: 'hidden' }}>
      <Sidebar activePage="Forex News" />
      <Box sx={{ flexGrow: 1, ml: '250px', overflow: 'auto', height: '100vh' }}>
        {/* Header with title and refresh button */}
        <Box 
          sx={{ 
            p: 3, 
            bgcolor: colors.panelBg,
            borderBottom: `1px solid ${colors.borderColor}`,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="h5" sx={{ color: colors.primaryText, fontWeight: 'bold' }}>
                Forex News
              </Typography>
              <Tooltip title="Latest forex market updates" arrow>
                <IconButton sx={{ color: colors.secondaryText, p: 0.5 }}>
                  <HelpOutlineIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
            <Typography variant="body2" sx={{ color: colors.secondaryText, mt: 0.5 }}>
              Stay updated with the latest news affecting major currency pairs and forex markets
            </Typography>
          </Box>
          <Box>
            <Button
              variant="contained"
              startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <RefreshIcon />}
              onClick={handleRefresh}
              disabled={loading}
              sx={{
                bgcolor: colors.accentBlue,
                borderRadius: '8px',
                px: 2,
                '&:hover': {
                  bgcolor: 'primary.dark',
                }
              }}
            >
              REFRESH
            </Button>
            <IconButton
              onClick={handleMenuOpen}
              sx={{ color: colors.primaryText, ml: 1 }}
            >
              <MoreVertIcon />
            </IconButton>
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleMenuClose}
              PaperProps={{
                sx: {
                  bgcolor: colors.cardBg,
                  color: colors.primaryText,
                  border: `1px solid ${colors.borderColor}`
                }
              }}
            >
              <MenuItem onClick={handleForceRefresh}>Force Refresh (Clear Cache)</MenuItem>
              <MenuItem onClick={handleMenuClose}>View Saved Articles</MenuItem>
              <MenuItem onClick={handleMenuClose}>Manage Notifications</MenuItem>
            </Menu>
          </Box>
        </Box>
        
        {/* Filter chips row */}
        <Box 
          sx={{ 
            display: 'flex', 
            p: 2, 
            bgcolor: colors.panelBg, 
            gap: 1,
            overflowX: 'auto',
            borderBottom: `1px solid ${colors.borderColor}`,
            '&::-webkit-scrollbar': {
              height: '8px',
            },
            '&::-webkit-scrollbar-thumb': {
              backgroundColor: colors.borderColor,
              borderRadius: '4px',
            }
          }}
        >
          {newsCategories.map(category => (
            <Chip
              key={category.value}
              label={category.label}
              onClick={() => {
                setCurrentCategory(category.value);
                setLoading(true);
              }}
              sx={{
                bgcolor: currentCategory === category.value ? colors.accentBlue : colors.cardBg,
                color: colors.primaryText,
                borderRadius: '4px',
                px: 1,
                py: 2.5,
                fontWeight: currentCategory === category.value ? 'bold' : 'normal',
                '&:hover': {
                  bgcolor: currentCategory === category.value ? colors.accentBlue : colors.hoverBg,
                },
              }}
            />
          ))}
        </Box>
        
        {/* API source info */}
        {apiSource && (
          <Box sx={{ px: 3, pt: 2 }}>
            <Alert 
              severity="info" 
              sx={{ 
                bgcolor: 'rgba(33, 150, 243, 0.1)', 
                color: colors.secondaryText,
                '& .MuiAlert-icon': {
                  color: colors.accentBlue
                }
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                <Typography variant="body2">
                  Data source: <b>{apiSource}</b> 
                  {newsData.length > 0 && ` (${newsData.length} articles)`}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  {currentCategory !== 'all' && (
                    <Typography variant="caption" sx={{ mr: 2 }}>
                      Category: <b>{currentCategory}</b>
                    </Typography>
                  )}
                  {newsData.length > 0 && (
                    <Typography variant="caption">
                      Last updated: {formatDate(new Date().toISOString())}
                    </Typography>
                  )}
                </Box>
              </Box>
            </Alert>
          </Box>
        )}
        
        {/* Main content area */}
        <Box sx={{ p: 3 }}>
          {loading && newsData.length === 0 ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
              <CircularProgress sx={{ color: colors.accentBlue }} />
            </Box>
          ) : error ? (
            <Paper sx={{ p: 3, bgcolor: colors.cardBg, color: colors.primaryText, borderRadius: 2 }}>
              <Typography color="error">{error}</Typography>
              <Button 
                variant="contained" 
                onClick={handleRefresh} 
                sx={{ mt: 2, bgcolor: colors.accentBlue }}
              >
                Try Again
              </Button>
            </Paper>
          ) : (
            <Box sx={{ maxWidth: '100%' }}>
              {newsData.length === 0 ? (
                <Paper sx={{ p: 3, bgcolor: colors.cardBg, color: colors.primaryText, borderRadius: 2, textAlign: 'center' }}>
                  <Typography variant="h6" sx={{ mb: 2 }}>No news articles found</Typography>
                  <Typography variant="body2" sx={{ mb: 3 }}>
                    There are no recent news articles matching the <b>{
                      newsCategories.find(cat => cat.value === currentCategory)?.label || currentCategory
                    }</b> category.
                  </Typography>
                  <Button
                    variant="contained"
                    onClick={handleForceRefresh}
                    sx={{ bgcolor: colors.accentBlue }}
                  >
                    Force Refresh
                  </Button>
                </Paper>
              ) : (
                newsData.map(article => (
                  <Paper
                    key={article.id}
                    elevation={0}
                    sx={{ 
                      bgcolor: colors.cardBg, 
                      color: colors.primaryText,
                      border: `1px solid ${colors.borderColor}`,
                      borderRadius: 2,
                      mb: 3,
                      overflow: 'hidden',
                      width: '100%'
                    }}
                  >
                    {/* Card Header with image */}
                    <Box sx={{ width: '100%', position: 'relative' }}>
                      <CardMedia
                        component="img"
                        height="220"
                        image={article.image || 'https://via.placeholder.com/500x200?text=Forex+News'}
                        alt={article.title}
                        sx={{ width: '100%' }}
                      />
                      <Box sx={{ 
                        position: 'absolute', 
                        bottom: 0, 
                        left: 0, 
                        width: '100%', 
                        bgcolor: 'rgba(10, 12, 20, 0.7)',
                        p: 2
                      }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography variant="caption" sx={{ color: colors.secondaryText }}>
                            {article.source}
                          </Typography>
                          <Typography variant="caption" sx={{ color: colors.secondaryText }}>
                            {formatDate(article.date)}
                          </Typography>
                        </Box>
                      </Box>
                    </Box>
                    
                    {/* Article content */}
                    <Box sx={{ p: 3 }}>
                      <Typography 
                        variant="h6" 
                        sx={{ 
                          fontWeight: 'bold', 
                          mb: 2,
                          lineHeight: 1.3
                        }}
                      >
                        {article.title}
                      </Typography>
                      
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          color: colors.secondaryText, 
                          mb: 3
                        }}
                      >
                        {article.summary}
                      </Typography>
                      
                      {/* Tags and sentiment */}
                      <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          {article.sentiment === 'Bullish' ? (
                            <TrendingUpIcon fontSize="small" sx={{ color: colors.buyGreen }} />
                          ) : article.sentiment === 'Bearish' ? (
                            <TrendingDownIcon fontSize="small" sx={{ color: colors.sellRed }} />
                          ) : (
                            <HelpOutlineIcon fontSize="small" sx={{ color: colors.secondaryText }} />
                          )}
                          <Typography 
                            variant="body2" 
                            sx={{ 
                              color: getSentimentColor(article.sentiment),
                              fontWeight: 'bold'
                            }}
                          >
                            {article.sentiment || 'Neutral'}
                          </Typography>
                        </Box>
                        
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography 
                            variant="body2" 
                            sx={{ 
                              color: getImpactColor(article.impact),
                              fontWeight: 'bold'
                            }}
                          >
                            Impact: {article.impact || 'Medium'}
                          </Typography>
                        </Box>
                      </Box>
                      
                      {/* Currency tags */}
                      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
                        {article.relatedCurrencies && article.relatedCurrencies.map(currency => (
                          <Chip 
                            key={currency} 
                            label={currency} 
                            size="small"
                            sx={{ 
                              bgcolor: colors.panelBg,
                              color: colors.secondaryText,
                              borderRadius: '4px',
                              height: '24px'
                            }}
                          />
                        ))}
                      </Box>
                    </Box>
                    
                    {/* Action buttons */}
                    <Box sx={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      borderTop: `1px solid ${colors.borderColor}`,
                      p: 2
                    }}>
                      <Box>
                        <Tooltip title={savedArticles.some(saved => saved.id === article.id) ? "Remove from Saved" : "Save Article"}>
                          <IconButton 
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              toggleSaveArticle(article);
                            }}
                            sx={{ color: savedArticles.some(saved => saved.id === article.id) ? colors.accentBlue : colors.secondaryText }}
                          >
                            {savedArticles.some(saved => saved.id === article.id) ? <BookmarkIcon /> : <BookmarkBorderIcon />}
                          </IconButton>
                        </Tooltip>
                        
                        <Tooltip title="Share Article">
                          <IconButton 
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              shareArticle(article);
                            }}
                            sx={{ color: colors.secondaryText }}
                          >
                            <ShareIcon />
                          </IconButton>
                        </Tooltip>
                      </Box>
                      
                      <Box>
                        <Button
                          variant="text"
                          endIcon={<OpenInNewIcon />}
                          component="a"
                          href={article.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          sx={{ 
                            color: colors.accentBlue,
                            textTransform: 'none'
                          }}
                        >
                          Read Full Article
                        </Button>
                      </Box>
                    </Box>
                  </Paper>
                ))
              )}
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  );
};

export default ForexNews; 