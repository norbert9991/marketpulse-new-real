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

// News categories for filter
const newsCategories = [
  { value: 'all', label: 'All News' },
  { value: 'majors', label: 'Major Pairs' },
  { value: 'usd', label: 'USD News' },
  { value: 'eur', label: 'EUR News' },
  { value: 'gbp', label: 'GBP News' },
  { value: 'jpy', label: 'JPY News' },
  { value: 'economic', label: 'Economic Data' },
  { value: 'central_banks', label: 'Central Banks' }
];

const ForexNews = () => {
  const navigate = useNavigate();
  
  // State variables
  const [newsData, setNewsData] = useState([]);
  const [savedArticles, setSavedArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentCategory, setCurrentCategory] = useState('all');
  const [refreshCount, setRefreshCount] = useState(0);
  const [anchorEl, setAnchorEl] = useState(null);
  
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
        const response = await API.news.getForexNews({ category: currentCategory });
        setNewsData(response.data.articles);
        setError(null);
      } catch (error) {
        console.error('Error fetching forex news:', error);
        setError('Failed to load forex news. Please try again later.');
        // Set mock data as fallback
        setNewsData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [currentCategory, refreshCount]);

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
    
    // Clear the cache first
    localStorage.removeItem(`forex_news_${currentCategory}`);
    
    // Then fetch fresh data
    API.news.getForexNews({ category: currentCategory })
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

  // Share article - in a real app, this would open a share dialog
  const shareArticle = (article) => {
    alert(`Sharing article: ${article.title}`);
    // In a real app, you'd use the Web Share API or a share library
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
              onClick={() => setCurrentCategory(category.value)}
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
            <Grid container spacing={3}>
              {newsData.map(article => (
                <Grid item xs={12} md={6} lg={4} key={article.id}>
                  <Card sx={{ 
                    bgcolor: colors.cardBg, 
                    color: colors.primaryText,
                    border: `1px solid ${colors.borderColor}`,
                    borderRadius: 2,
                    boxShadow: `0 4px 12px ${colors.shadowColor}`,
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: `0 8px 16px ${colors.shadowColor}`,
                    }
                  }}>
                    <CardMedia
                      component="img"
                      height="160"
                      image={article.image || 'https://via.placeholder.com/500x200?text=Forex+News'}
                      alt={article.title}
                    />
                    <CardContent sx={{ flexGrow: 1, p: 2, pb: 1 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="caption" sx={{ color: colors.secondaryText }}>
                          {article.source}
                        </Typography>
                        <Typography variant="caption" sx={{ color: colors.secondaryText }}>
                          {formatDate(article.date)}
                        </Typography>
                      </Box>
                      
                      <Typography 
                        variant="subtitle1" 
                        sx={{ 
                          fontWeight: 'bold', 
                          lineHeight: 1.3, 
                          mb: 1,
                          height: '52px',
                          overflow: 'hidden',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          textOverflow: 'ellipsis'
                        }}
                      >
                        {article.title}
                      </Typography>
                      
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          color: colors.secondaryText, 
                          mb: 2,
                          height: '60px',
                          overflow: 'hidden',
                          display: '-webkit-box',
                          WebkitLineClamp: 3,
                          WebkitBoxOrient: 'vertical',
                          textOverflow: 'ellipsis'
                        }}
                      >
                        {article.summary}
                      </Typography>
                      
                      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 1 }}>
                        <Chip 
                          icon={article.sentiment === 'Bullish' ? <TrendingUpIcon /> : <TrendingDownIcon />}
                          label={article.sentiment}
                          size="small"
                          sx={{ 
                            bgcolor: `${getSentimentColor(article.sentiment)}20`,
                            color: getSentimentColor(article.sentiment),
                            borderRadius: '4px',
                            height: '24px',
                            '& .MuiChip-icon': {
                              color: getSentimentColor(article.sentiment)
                            }
                          }} 
                        />
                        <Chip 
                          label={`Impact: ${article.impact}`}
                          size="small"
                          sx={{ 
                            bgcolor: `${getImpactColor(article.impact)}20`,
                            color: getImpactColor(article.impact),
                            borderRadius: '4px',
                            height: '24px'
                          }} 
                        />
                      </Box>
                      
                      <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                        {article.relatedCurrencies && article.relatedCurrencies.map(currency => (
                          <Chip 
                            key={currency} 
                            label={currency} 
                            size="small"
                            sx={{ 
                              bgcolor: colors.panelBg,
                              color: colors.secondaryText,
                              fontSize: '0.7rem',
                              height: '20px'
                            }}
                          />
                        ))}
                      </Box>
                    </CardContent>
                    
                    <Divider sx={{ bgcolor: colors.borderColor }} />
                    
                    <Box sx={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      p: 1
                    }}>
                      <Box>
                        <Tooltip title={savedArticles.some(saved => saved.id === article.id) ? "Remove from Saved" : "Save Article"}>
                          <IconButton 
                            size="small" 
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
                            size="small"
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
                      
                      <Tooltip title="Read Full Article">
                        <IconButton 
                          size="small" 
                          component="a" 
                          href={article.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          sx={{ color: colors.secondaryText }}
                        >
                          <OpenInNewIcon />
                        </IconButton>
                      </Tooltip>
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