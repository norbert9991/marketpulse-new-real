import React, { useState, useEffect } from 'react';
import { 
  AppBar, 
  Toolbar, 
  Typography, 
  Button, 
  Box, 
  Grid, 
  Paper,
  CssBaseline,
  Container,
  Link,
  Divider,
  IconButton,
  Menu,
  MenuItem,
  useTheme,
  useMediaQuery,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton as MuiIconButton,
  Tooltip
} from '@mui/material';
import { styled } from '@mui/system';
import LoginDialog from '../Log/Login';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';
import ShowChartIcon from '@mui/icons-material/ShowChart';

// Forex Trading Color Palette
const colors = {
  darkBg: '#0A0C14',           // Darker background for better contrast
  panelBg: '#141620',          // Slightly lighter than darkBg for panels
  cardBg: '#1E2235',           // Even lighter for cards and interactive elements
  primaryText: '#FFFFFF',      // Pure white for primary text
  secondaryText: '#A0A5B8',    // Lighter secondary text for better readability
  buyGreen: '#00E676',         // Brighter green for buy actions
  sellRed: '#FF3D57',          // Brighter red for sell actions
  accentBlue: '#2196F3',       // Brighter blue for accents
  warningOrange: '#FFA726',    // Brighter orange for warnings
  profitGreen: '#00C853',      // Slightly darker green for hover states
  lossRed: '#D50000',          // Slightly darker red for hover states
  gradientStart: '#2196F3',    // Gradient start color
  gradientEnd: '#00E676',      // Gradient end color
  hoverBg: 'rgba(33, 150, 243, 0.1)',  // Subtle hover background
  borderColor: '#2A2F45',      // Subtle border color
  shadowColor: 'rgba(0, 0, 0, 0.3)'    // Shadow color for depth
};

// Styled components with trading theme
const HeroSection = styled('div')({
  height: '100vh',
  background: `linear-gradient(rgba(10, 12, 20, 0.95), rgba(10, 12, 20, 0.95)), url(https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?ixlib=rb-1.2.1&auto=format&fit=crop&w=1950&q=80)`,
  backgroundSize: 'cover',
  backgroundPosition: 'center',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  alignItems: 'center',
  color: colors.primaryText,
  textAlign: 'center',
  padding: '0 20px'
});

const FeatureCard = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(4),
  textAlign: 'center',
  color: colors.primaryText,
  backgroundColor: colors.cardBg,
  height: '100%',
  borderRadius: '12px',
  transition: 'all 0.3s ease',
  border: `1px solid ${colors.borderColor}`,
  '&:hover': {
    transform: 'translateY(-5px)',
    boxShadow: `0 10px 20px ${colors.shadowColor}`,
    borderColor: colors.accentBlue
  }
}));

const Home = () => {
  const [openLogin, setOpenLogin] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [anchorEl, setAnchorEl] = useState(null);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [selectedPair, setSelectedPair] = useState(null);
  const [pairs] = useState([
    { symbol: 'EUR/USD', name: 'Euro / US Dollar', spread: '0.0002', buy: '1.0856', sell: '1.0854' },
    { symbol: 'GBP/USD', name: 'British Pound / US Dollar', spread: '0.0003', buy: '1.2634', sell: '1.2631' },
    { symbol: 'USD/JPY', name: 'US Dollar / Japanese Yen', spread: '0.0002', buy: '148.12', sell: '148.10' },
    { symbol: 'USD/CAD', name: 'US Dollar / Canadian Dollar', spread: '0.0003', buy: '1.3456', sell: '1.3453' },
    { symbol: 'AUD/USD', name: 'Australian Dollar / US Dollar', spread: '0.0003', buy: '0.6578', sell: '0.6575' },
    { symbol: 'NZD/USD', name: 'New Zealand Dollar / US Dollar', spread: '0.0003', buy: '0.6123', sell: '0.6120' }
  ]);
  const [expandedPair, setExpandedPair] = useState(null);

  const handleOpenLogin = () => {
    setOpenLogin(true);
    setIsLogin(true);
  };

  const handleOpenRegister = () => {
    setOpenLogin(true);
    setIsLogin(false);
  };

  const handleClose = () => {
    setOpenLogin(false);
  };

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleScroll = (sectionId) => {
    document.getElementById(sectionId).scrollIntoView({ behavior: 'smooth' });
    handleMenuClose();
  };

  const handleToggleChart = (pair) => {
    setExpandedPair(expandedPair === pair.symbol ? null : pair.symbol);
  };

  return (
    <>
      <CssBaseline />
      {/* Navigation Bar - Dark Theme */}
      <AppBar 
        position="fixed" 
        elevation={0} 
        sx={{ 
          backgroundColor: colors.panelBg,
          backdropFilter: 'blur(10px)',
          borderBottom: `1px solid ${colors.borderColor}`,
          transition: 'all 0.3s ease'
        }}
      >
        <Container maxWidth="xl">
          <Toolbar sx={{ justifyContent: 'space-between' }}>
            <Typography 
              variant="h6" 
              component="div" 
              sx={{ 
                fontWeight: 'bold', 
                color: colors.accentBlue,
                letterSpacing: '1px',
                cursor: 'pointer',
                '&:hover': {
                  color: colors.buyGreen,
                  transform: 'scale(1.05)',
                  transition: 'all 0.3s ease'
                }
              }}
            >
              MARKEPULSE
            </Typography>

            {isMobile ? (
              <>
                <IconButton
                  edge="end"
                  color="inherit"
                  aria-label="menu"
                  onClick={handleMenuOpen}
                  sx={{ color: colors.primaryText }}
                >
                  <MenuIcon />
                </IconButton>
                <Menu
                  anchorEl={anchorEl}
                  open={Boolean(anchorEl)}
                  onClose={handleMenuClose}
                  PaperProps={{
                    sx: {
                      backgroundColor: colors.panelBg,
                      border: `1px solid ${colors.borderColor}`,
                      borderRadius: '10px',
                      mt: 1
                    }
                  }}
                >
                  <MenuItem 
                    onClick={() => handleScroll('markets-section')}
                    sx={{ 
                      color: colors.secondaryText,
                      '&:hover': { 
                        backgroundColor: colors.cardBg,
                        color: colors.primaryText
                      }
                    }}
                  >
                    Markets
                  </MenuItem>
                  <MenuItem 
                    onClick={() => handleScroll('analytics-section')}
                    sx={{ 
                      color: colors.secondaryText,
                      '&:hover': { 
                        backgroundColor: colors.cardBg,
                        color: colors.primaryText
                      }
                    }}
                  >
                    Analytics
                  </MenuItem>
                  <MenuItem 
                    onClick={handleOpenLogin}
                    sx={{ 
                      color: colors.secondaryText,
                      '&:hover': { 
                        backgroundColor: colors.cardBg,
                        color: colors.primaryText
                      }
                    }}
                  >
                    Login
                  </MenuItem>
                  <MenuItem 
                    onClick={handleOpenRegister}
                    sx={{ 
                      color: colors.secondaryText,
                      '&:hover': { 
                        backgroundColor: colors.cardBg,
                        color: colors.primaryText
                      }
                    }}
                  >
                    Register
                  </MenuItem>
                </Menu>
              </>
            ) : (
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center',
                gap: 2
              }}>
                <Button 
                  color="inherit" 
                  sx={{ 
                    color: colors.secondaryText,
                    position: 'relative',
                    '&:hover': { 
                      color: colors.primaryText,
                      backgroundColor: 'transparent'
                    },
                    '&::after': {
                      content: '""',
                      position: 'absolute',
                      width: '0%',
                      height: '2px',
                      bottom: 0,
                      left: '50%',
                      backgroundColor: colors.accentBlue,
                      transition: 'all 0.3s ease',
                      transform: 'translateX(-50%)'
                    },
                    '&:hover::after': {
                      width: '100%'
                    }
                  }}
                  onClick={() => handleScroll('markets-section')}
                >
                  Markets
                </Button>
                <Button 
                  color="inherit" 
                  sx={{ 
                    color: colors.secondaryText,
                    position: 'relative',
                    '&:hover': { 
                      color: colors.primaryText,
                      backgroundColor: 'transparent'
                    },
                    '&::after': {
                      content: '""',
                      position: 'absolute',
                      width: '0%',
                      height: '2px',
                      bottom: 0,
                      left: '50%',
                      backgroundColor: colors.accentBlue,
                      transition: 'all 0.3s ease',
                      transform: 'translateX(-50%)'
                    },
                    '&:hover::after': {
                      width: '100%'
                    }
                  }}
                  onClick={() => handleScroll('analytics-section')}
                >
                  Analytics
                </Button>
                <Button 
                  variant="outlined" 
                  sx={{ 
                    color: colors.accentBlue,
                    borderColor: colors.accentBlue,
                    '&:hover': { 
                      backgroundColor: colors.accentBlue,
                      color: colors.primaryText,
                      transform: 'translateY(-2px)',
                      boxShadow: `0 4px 8px ${colors.accentBlue}40`
                    },
                    transition: 'all 0.3s ease'
                  }} 
                  onClick={handleOpenLogin}
                >
                  Login
                </Button>
                <Button 
                  variant="contained" 
                  sx={{ 
                    backgroundColor: colors.buyGreen,
                    '&:hover': { 
                      backgroundColor: colors.profitGreen,
                      transform: 'translateY(-2px)',
                      boxShadow: `0 4px 12px ${colors.buyGreen}40`
                    },
                    transition: 'all 0.3s ease',
                    fontWeight: 'bold'
                  }} 
                  onClick={handleOpenRegister}
                >
                  Register
                </Button>
              </Box>
            )}
          </Toolbar>
        </Container>
      </AppBar>

      {/* Hero Section */}
      <HeroSection>
        <Toolbar /> {/* For spacing under fixed appbar */}
        <Container maxWidth="md">
          <Typography variant="h2" component="h1" gutterBottom sx={{ 
            fontWeight: 'bold', 
            mb: 4,
            background: `linear-gradient(135deg, ${colors.gradientStart}, ${colors.gradientEnd})`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            Advanced Market Analytics & Forecasting
          </Typography>
          <Typography variant="h5" component="p" sx={{ 
            maxWidth: '800px', 
            mb: 6,
            color: colors.secondaryText,
            lineHeight: 1.6
          }}>
            Markepulse provides institutional-grade market analysis, predictive modeling, and real-time forecasting to help you make data-driven investment decisions.
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', justifyContent: 'center' }}>
            <Button 
              variant="contained" 
              size="large" 
              sx={{ 
                px: 4, 
                py: 1.5, 
                fontSize: '1.1rem',
                backgroundColor: colors.buyGreen,
                '&:hover': { backgroundColor: colors.profitGreen },
                fontWeight: 'bold'
              }}
              onClick={handleOpenRegister}
            >
              Get Started
            </Button>
            <Button 
              variant="outlined" 
              size="large" 
              sx={{ 
                px: 4, 
                py: 1.5, 
                fontSize: '1.1rem',
                color: colors.accentBlue,
                borderColor: colors.accentBlue,
                '&:hover': { 
                  backgroundColor: `${colors.accentBlue}20`,
                  borderColor: colors.accentBlue
                }
              }}
              onClick={handleOpenLogin}
            >
              Explore Analytics
            </Button>
          </Box>
        </Container>
      </HeroSection>

      {/* Features Section */}
      <Box sx={{ 
        py: 10, 
        px: 4, 
        backgroundColor: colors.darkBg,
        backgroundImage: 'radial-gradient(circle at 50% 50%, #2A2C36 0%, #1E1F26 100%)'
      }}>
        <Container maxWidth="lg">
          <Typography variant="h4" component="h2" align="center" sx={{ 
            mb: 8, 
            fontWeight: 'bold',
            color: colors.primaryText,
            position: 'relative',
            '&:after': {
              content: '""',
              display: 'block',
              width: '80px',
              height: '4px',
              background: `linear-gradient(90deg, ${colors.accentBlue}, ${colors.buyGreen})`,
              margin: '20px auto 0',
              borderRadius: '2px'
            }
          }}>
            Why Choose Markepulse Analytics?
          </Typography>
          <Box sx={{ 
            display: 'flex', 
            flexWrap: 'wrap', 
            gap: 4, 
            justifyContent: 'center'
          }}>
            {[
              {
                title: "Advanced Predictive Models",
                description: "Our proprietary algorithms analyze historical data patterns to forecast market movements with high accuracy."
              },
              {
                title: "Real-time Market Analysis",
                description: "Stay ahead with real-time market analysis, sentiment tracking, and trend identification across multiple timeframes."
              },
              {
                title: "Comprehensive Data Coverage",
                description: "Access comprehensive market data across forex, stocks, commodities, and cryptocurrencies with detailed technical indicators."
              }
            ].map((feature, index) => (
              <Box key={index} sx={{ flex: { xs: '1 1 100%', md: '1 1 calc(33.333% - 32px)' } }}>
                <FeatureCard>
                  <Box sx={{
                    width: '60px',
                    height: '60px',
                    backgroundColor: `${colors.accentBlue}20`,
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 20px',
                    color: colors.accentBlue
                  }}>
                    {index === 0 && (
                      <svg width="30" height="30" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" fill="currentColor"/>
                      </svg>
                    )}
                    {index === 1 && (
                      <svg width="30" height="30" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M3 3V19H21V21H3C1.89543 21 1 20.1046 1 19V3H3ZM22 3H6C5.44772 3 5 3.44772 5 4V16C5 16.5523 5.44772 17 6 17H22C22.5523 17 23 16.5523 23 16V4C23 3.44772 22.5523 3 22 3ZM8 5H12V7H8V5ZM8 9H20V11H8V9ZM8 13H14V15H8V13Z" fill="currentColor"/>
                      </svg>
                    )}
                    {index === 2 && (
                      <svg width="30" height="30" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 1L15 7H21L16.5 11.25L18.5 17L12 14.25L5.5 17L7.5 11.25L3 7H9L12 1ZM12 6C11.4477 6 11 6.44772 11 7C11 7.55228 11.4477 8 12 8C12.5523 8 13 7.55228 13 7C13 6.44772 12.5523 6 12 6ZM8 9C7.44772 9 7 9.44772 7 10C7 10.5523 7.44772 11 8 11C8.55228 11 9 10.5523 9 10C9 9.44772 8.55228 9 8 9ZM16 9C15.4477 9 15 9.44772 15 10C15 10.5523 15.4477 11 16 11C16.5523 11 17 10.5523 17 10C17 9.44772 16.5523 9 16 9ZM12 12C11.4477 12 11 12.4477 11 13C11 13.5523 11.4477 14 12 14C12.5523 14 13 13.5523 13 13C13 12.4477 12.5523 12 12 12Z" fill="currentColor"/>
                      </svg>
                    )}
                  </Box>
                  <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold', color: colors.primaryText }}>
                    {feature.title}
                  </Typography>
                  <Typography sx={{ color: colors.secondaryText }}>
                    {feature.description}
                  </Typography>
                </FeatureCard>
              </Box>
            ))}
          </Box>
        </Container>
      </Box>

      {/* Market Analytics Visualization Section */}
      <Box 
        id="markets-section"
        sx={{ 
          py: 10, 
          px: 4, 
          backgroundColor: colors.panelBg,
          backgroundImage: 'radial-gradient(circle at 50% 50%, #3D404B 0%, #2A2C36 100%)'
        }}
      >
        <Container maxWidth="lg">
          <Typography variant="h4" component="h2" align="center" sx={{ 
            mb: 8, 
            fontWeight: 'bold',
            color: colors.primaryText,
            position: 'relative',
            '&:after': {
              content: '""',
              display: 'block',
              width: '80px',
              height: '4px',
              background: `linear-gradient(90deg, ${colors.accentBlue}, ${colors.buyGreen})`,
              margin: '20px auto 0',
              borderRadius: '2px'
            }
          }}>
            Advanced Market Analytics
          </Typography>

          <Box sx={{
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
            gap: 6,
            alignItems: 'center',
            mb: 6
          }}>
            {/* Image Container */}
            <Box sx={{
              flex: '1 1 60%',
              borderRadius: '12px',
              overflow: 'hidden',
              border: `1px solid ${colors.borderColor}`,
              boxShadow: `0 4px 20px ${colors.shadowColor}`,
              backgroundColor: colors.cardBg,
              p: 2
            }}>
              <img 
                src="/market-analytics.png" 
                alt="Market Analytics Dashboard"
                style={{
                  width: '100%',
                  height: 'auto',
                  borderRadius: '8px'
                }}
              />
            </Box>

            {/* Analysis Description */}
            <Box sx={{
              flex: '1 1 40%',
              display: 'flex',
              flexDirection: 'column',
              gap: 3
            }}>
              <Typography variant="h5" sx={{ 
                color: colors.primaryText,
                fontWeight: 'bold',
                background: `linear-gradient(135deg, ${colors.accentBlue}, ${colors.buyGreen})`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}>
                Real-time Technical Analysis
              </Typography>
              
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
                  <Box sx={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    backgroundColor: `${colors.accentBlue}20`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mt: 0.5
                  }}>
                    <Typography sx={{ color: colors.accentBlue, fontWeight: 'bold' }}>1</Typography>
                  </Box>
                  <Typography sx={{ color: colors.secondaryText }}>
                    Advanced price history visualization with multiple timeframe analysis and trend identification
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
                  <Box sx={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    backgroundColor: `${colors.accentBlue}20`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mt: 0.5
                  }}>
                    <Typography sx={{ color: colors.accentBlue, fontWeight: 'bold' }}>2</Typography>
                  </Box>
                  <Typography sx={{ color: colors.secondaryText }}>
                    Dynamic support and resistance levels calculated using machine learning algorithms
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
                  <Box sx={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    backgroundColor: `${colors.accentBlue}20`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mt: 0.5
                  }}>
                    <Typography sx={{ color: colors.accentBlue, fontWeight: 'bold' }}>3</Typography>
                  </Box>
                  <Typography sx={{ color: colors.secondaryText }}>
                    Technical indicators including RSI, MACD, and custom algorithms for market sentiment analysis
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
                  <Box sx={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    backgroundColor: `${colors.accentBlue}20`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mt: 0.5
                  }}>
                    <Typography sx={{ color: colors.accentBlue, fontWeight: 'bold' }}>4</Typography>
                  </Box>
                  <Typography sx={{ color: colors.secondaryText }}>
                    Price prediction models with AI-powered trend forecasting and market movement analysis
                  </Typography>
                </Box>
              </Box>

              <Button 
                variant="contained" 
                sx={{ 
                  mt: 2,
                  backgroundColor: colors.buyGreen,
                  '&:hover': { backgroundColor: colors.profitGreen },
                  fontWeight: 'bold',
                  alignSelf: 'flex-start'
                }}
                onClick={handleOpenRegister}
              >
                Explore Analytics Platform
              </Button>
            </Box>
          </Box>
        </Container>
      </Box>

      {/* Analytics Section */}
      <Box 
        id="analytics-section"
        sx={{ 
          py: 10, 
          px: 4, 
          backgroundColor: colors.darkBg,
          backgroundImage: 'radial-gradient(circle at 50% 50%, #2A2C36 0%, #1E1F26 100%)'
        }}
      >
        <Container maxWidth="lg">
          <Typography variant="h4" component="h2" align="center" sx={{ 
            mb: 8, 
            fontWeight: 'bold',
            color: colors.primaryText,
            position: 'relative',
            '&:after': {
              content: '""',
              display: 'block',
              width: '80px',
              height: '4px',
              background: `linear-gradient(90deg, ${colors.accentBlue}, ${colors.buyGreen})`,
              margin: '20px auto 0',
              borderRadius: '2px'
            }
          }}>
            Advanced Market Analytics
          </Typography>
          <Box sx={{ 
            display: 'flex', 
            flexWrap: 'wrap', 
            gap: 4, 
            alignItems: 'center'
          }}>
            <Box sx={{ 
              flex: { xs: '1 1 100%', md: '1 1 50%' },
              display: 'flex',
              flexDirection: 'column',
              gap: 3
            }}>
              <Typography variant="h5" sx={{ color: colors.primaryText, fontWeight: 'bold' }}>
                Predictive Market Analysis
              </Typography>
              <Typography sx={{ color: colors.secondaryText }}>
                Our advanced analytics platform combines technical analysis, sentiment analysis, and machine learning algorithms to forecast market movements with high accuracy. Identify trends, predict reversals, and make informed decisions based on comprehensive market data.
              </Typography>
              <Button 
                variant="contained" 
                size="large" 
                sx={{ 
                  backgroundColor: colors.buyGreen,
                  '&:hover': { backgroundColor: colors.profitGreen },
                  fontWeight: 'bold',
                  alignSelf: 'flex-start'
                }}
                onClick={handleOpenRegister}
              >
                Access Analytics
              </Button>
            </Box>
            <Box sx={{ 
              flex: { xs: '1 1 100%', md: '1 1 50%' },
              p: 4, 
              backgroundColor: colors.cardBg, 
              borderRadius: '12px',
              boxShadow: `0 10px 20px ${colors.shadowColor}`,
              border: `1px solid ${colors.borderColor}`
            }}>
              <Typography variant="h6" gutterBottom sx={{ color: colors.primaryText, fontWeight: 'bold' }}>
                Analytics Features
              </Typography>
              <ul style={{ color: colors.secondaryText, paddingLeft: '20px' }}>
                <li>Machine learning-based price predictions</li>
                <li>Sentiment analysis across multiple data sources</li>
                <li>Technical indicator analysis and signals</li>
                <li>Market trend identification and forecasting</li>
                <li>Customizable alerts and notifications</li>
              </ul>
            </Box>
          </Box>
        </Container>
      </Box>

      {/* Footer */}
      <Box sx={{ 
        backgroundColor: colors.panelBg,
        color: colors.secondaryText,
        py: 6,
        mt: 'auto',
        borderTop: `1px solid ${colors.borderColor}`
      }}>
        <Container maxWidth="lg">
          <Box sx={{ 
            display: 'flex', 
            flexWrap: 'wrap', 
            gap: 4,
            mb: 4
          }}>
            <Box sx={{ 
              flex: { xs: '1 1 100%', md: '1 1 33.333%' },
              display: 'flex',
              flexDirection: 'column',
              gap: 2
            }}>
              <Typography variant="h6" sx={{ color: colors.primaryText, fontWeight: 'bold' }}>
                MARKEPULSE
              </Typography>
              <Typography variant="body2">
                Your trusted partner in market analytics and forecasting. We provide cutting-edge technology and professional tools for successful market analysis.
              </Typography>
            </Box>
            <Box sx={{ 
              flex: { xs: '1 1 100%', md: '1 1 33.333%' },
              display: 'flex',
              flexDirection: 'column',
              gap: 2
            }}>
              <Typography variant="h6" sx={{ color: colors.primaryText, fontWeight: 'bold' }}>
                Quick Links
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Link href="#" sx={{ color: colors.secondaryText, textDecoration: 'none', '&:hover': { color: colors.primaryText } }}>
                  About Us
                </Link>
                <Link href="#" sx={{ color: colors.secondaryText, textDecoration: 'none', '&:hover': { color: colors.primaryText } }}>
                  Market Analysis
                </Link>
                <Link href="#" sx={{ color: colors.secondaryText, textDecoration: 'none', '&:hover': { color: colors.primaryText } }}>
                  FAQ
                </Link>
              </Box>
            </Box>
            <Box sx={{ 
              flex: { xs: '1 1 100%', md: '1 1 33.333%' },
              display: 'flex',
              flexDirection: 'column',
              gap: 2
            }}>
              <Typography variant="h6" sx={{ color: colors.primaryText, fontWeight: 'bold' }}>
                Contact Us
              </Typography>
              <Typography variant="body2">
                Email: support@markepulse.com<br />
                Phone: +1 (555) 123-4567<br />
                Address: 123 Trading Street, Financial District, NY 10004
              </Typography>
            </Box>
          </Box>
          <Divider sx={{ my: 4, backgroundColor: colors.borderColor }} />
          <Typography variant="body2" align="center">
            © {new Date().getFullYear()} Markepulse. All rights reserved.
          </Typography>
        </Container>
      </Box>

      {/* Login/Register Dialog */}
      <LoginDialog 
        open={openLogin} 
        onClose={handleClose} 
        isLogin={isLogin} 
        toggleForm={() => setIsLogin(!isLogin)}
      />
    </>
  );
};

export default Home;