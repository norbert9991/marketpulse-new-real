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
  Alert,
  Pagination,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar
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
  const [apiSource, setApiSource] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pageSize] = useState(5); // Fixed page size
  
  // Add new state for viewing saved articles
  const [showSavedArticles, setShowSavedArticles] = useState(false);
  // Add state for save success dialog
  const [saveNotification, setSaveNotification] = useState({ open: false, message: '', type: 'success' });
  
  // Menu handling
  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };
  
  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  // Pagination handling
  const handlePageChange = (event, newPage) => {
    setPage(newPage);
    // Keep scroll position when changing pages
    window.scrollTo(0, 0);
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
    // Skip fetching news if we're showing saved articles
    if (showSavedArticles) {
      setLoading(false);
      return;
    }
    
    const fetchData = async () => {
      setLoading(true);
      try {
        // Call the real backend endpoint with pagination
        const response = await fetch(`${API_URL}/api/news/forex?category=${currentCategory}&page=${page}&pageSize=${pageSize}`);
        
        if (!response.ok) {
          throw new Error(`API returned status ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data && data.articles) {
          setNewsData(data.articles);
          setApiSource(data.source || 'API');
          setTotalPages(data.totalPages || 1);
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
            setTotalPages(1);
          } else {
            setNewsData([]);
            setTotalPages(1);
          }
        } catch (fallbackError) {
          console.error('Failed to get fallback news data:', fallbackError);
          setNewsData([]);
          setTotalPages(1);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [currentCategory, refreshCount, page, pageSize, showSavedArticles]);

  // Handle view saved articles
  const handleViewSavedArticles = () => {
    setShowSavedArticles(true);
    handleMenuClose();
  };

  // Handle return to all news
  const handleReturnToNews = () => {
    setShowSavedArticles(false);
  };

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
      // Show notification
      setSaveNotification({
        open: true,
        message: 'Article removed from bookmarks',
        type: 'info'
      });
    } else {
      newSaved = [...savedArticles, article];
      // Show notification
      setSaveNotification({
        open: true,
        message: 'Article saved to bookmarks',
        type: 'success'
      });
    }
    
    setSavedArticles(newSaved);
    
    try {
      localStorage.setItem('saved_forex_articles', JSON.stringify(newSaved));
    } catch (error) {
      console.error('Error saving article to localStorage:', error);
      // Show error notification
      setSaveNotification({
        open: true,
        message: 'Failed to save article',
        type: 'error'
      });
    }
    
    // If in saved view and removing an article, refresh the view
    if (showSavedArticles && isCurrentlySaved) {
      setSavedArticles(newSaved);
    }
  };

  // Close notification
  const handleCloseNotification = () => {
    setSaveNotification({ ...saveNotification, open: false });
  };

  // Force refresh - bypasses cache completely
  const handleForceRefresh = () => {
    handleMenuClose();
    setLoading(true);
    
    // Reset to first page when force refreshing
    setPage(1);
    
    // Clear the cache first
    localStorage.removeItem(`forex_news_${currentCategory}`);
    
    // Make sure we're viewing news, not saved articles
    setShowSavedArticles(false);
    
    // Then fetch fresh data by incrementing the refresh counter
    setRefreshCount(prev => prev + 1);
  };

  // Handle standard refresh with optimistic UI update
  const handleRefresh = () => {
    // If showing saved articles, just refresh from localStorage
    if (showSavedArticles) {
      try {
        const saved = JSON.parse(localStorage.getItem('saved_forex_articles') || '[]');
        setSavedArticles(saved);
        return;
      } catch (error) {
        console.error('Error refreshing saved articles:', error);
      }
    }
    
    setLoading(true);
    
    // Increment refresh counter to trigger the useEffect
    setRefreshCount(prev => prev + 1);
  };

  // Clear all saved articles
  const handleClearSavedArticles = () => {
    setSavedArticles([]);
    localStorage.removeItem('saved_forex_articles');
    handleMenuClose();
    
    // Show notification
    setSaveNotification({
      open: true,
      message: 'All bookmarks cleared',
      type: 'info'
    });
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

  // Handle category change
  const handleCategoryChange = (category) => {
    setCurrentCategory(category);
    setPage(1); // Reset to first page when changing category
    setShowSavedArticles(false); // Return to news view when changing category
  };

  // Get API URL from environment or default to localhost
  const API_URL = 
    process.env.NODE_ENV === 'production' 
      ? 'https://marketpulse-new-real-3-web.onrender.com'
      : (process.env.REACT_APP_API_URL || 'http://localhost:5000');

  // Determine which articles to display
  const displayedArticles = showSavedArticles ? savedArticles : newsData;

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
                {showSavedArticles ? 'Saved Articles' : 'Forex News'}
              </Typography>
              <Tooltip title={showSavedArticles ? "Your saved articles" : "Latest forex market updates"} arrow>
                <IconButton sx={{ color: colors.secondaryText, p: 0.5 }}>
                  <HelpOutlineIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
            <Typography variant="body2" sx={{ color: colors.secondaryText, mt: 0.5 }}>
              {showSavedArticles 
                ? `You have ${savedArticles.length} saved article${savedArticles.length !== 1 ? 's' : ''}` 
                : 'Stay updated with the latest news affecting major currency pairs and forex markets'
              }
            </Typography>
          </Box>
          <Box>
            {showSavedArticles && (
              <Button
                variant="outlined"
                onClick={handleReturnToNews}
                sx={{
                  borderColor: colors.borderColor,
                  color: colors.primaryText,
                  mr: 2,
                  '&:hover': {
                    borderColor: colors.accentBlue,
                    bgcolor: 'rgba(33, 150, 243, 0.1)',
                  }
                }}
              >
                Back to News
              </Button>
            )}
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
              {showSavedArticles ? (
                <MenuItem onClick={handleClearSavedArticles}>Clear All Bookmarks</MenuItem>
              ) : (
                <MenuItem onClick={handleViewSavedArticles}>View Saved Articles ({savedArticles.length})</MenuItem>
              )}
              <MenuItem onClick={handleMenuClose}>Filter by Date</MenuItem>
            </Menu>
          </Box>
        </Box>
        
        {/* Filter chips row - only show when not in saved articles view */}
        {!showSavedArticles && (
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
                onClick={() => handleCategoryChange(category.value)}
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
        )}
        
        {/* API source info - only show when not in saved articles view */}
        {apiSource && !showSavedArticles && (
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
              Data source: {apiSource} {page > 1 && `- Page ${page} of ${totalPages}`}
            </Alert>
          </Box>
        )}
        
        {/* Main content area */}
        <Box sx={{ p: 3 }}>
          {loading && displayedArticles.length === 0 ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
              <CircularProgress sx={{ color: colors.accentBlue }} />
            </Box>
          ) : error && !showSavedArticles ? (
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
              {displayedArticles.length === 0 ? (
                <Paper sx={{ p: 3, bgcolor: colors.cardBg, color: colors.primaryText, borderRadius: 2, textAlign: 'center' }}>
                  <Typography>
                    {showSavedArticles 
                      ? "You don't have any saved articles yet. Bookmark articles to see them here."
                      : "No news articles found for the selected category."}
                  </Typography>
                  {showSavedArticles && (
                    <Button
                      variant="contained"
                      onClick={handleReturnToNews}
                      sx={{ mt: 2, bgcolor: colors.accentBlue }}
                    >
                      Browse News
                    </Button>
                  )}
                </Paper>
              ) : (
                <>
                  {displayedArticles.map(article => (
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
                  ))}
                  
                  {/* Pagination controls - only show when not in saved articles view */}
                  {totalPages > 1 && !showSavedArticles && (
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'center',
                        mt: 4,
                        mb: 2
                      }}
                    >
                      <Stack spacing={2}>
                        <Pagination
                          count={totalPages}
                          page={page}
                          onChange={handlePageChange}
                          color="primary"
                          size="large"
                          showFirstButton
                          showLastButton
                          sx={{
                            '& .MuiPaginationItem-root': {
                              color: colors.secondaryText,
                              '&.Mui-selected': {
                                bgcolor: colors.accentBlue,
                                color: colors.primaryText,
                                '&:hover': {
                                  bgcolor: 'primary.dark',
                                },
                              },
                              '&:hover': {
                                bgcolor: colors.hoverBg,
                              },
                            },
                          }}
                        />
                      </Stack>
                    </Box>
                  )}
                </>
              )}
            </Box>
          )}
        </Box>
      </Box>

      {/* Save/Remove notification */}
      <Snackbar
        open={saveNotification.open}
        autoHideDuration={3000}
        onClose={handleCloseNotification}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleCloseNotification} 
          severity={saveNotification.type} 
          sx={{ 
            bgcolor: saveNotification.type === 'success' ? 'rgba(0, 230, 118, 0.9)' : 
                   saveNotification.type === 'error' ? 'rgba(255, 61, 87, 0.9)' : 
                   'rgba(33, 150, 243, 0.9)',
            color: '#fff'
          }}
        >
          {saveNotification.message}
        </Alert>
      </Snackbar>
      
    </Box>
  );
};

export default ForexNews; 