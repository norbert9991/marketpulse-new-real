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
  Tooltip,
  Alert,
  TextField,
  CircularProgress
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
  background: `linear-gradient(rgba(10, 12, 20, 0.9), rgba(10, 12, 20, 0.98)), url(https://images.unsplash.com/photo-1640340434855-6084b1f4901c?ixlib=rb-1.2.1&auto=format&fit=crop&w=1950&q=80)`,
  backgroundSize: 'cover',
  backgroundPosition: 'center',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  alignItems: 'center',
  color: colors.primaryText,
  textAlign: 'center',
  padding: '0 20px',
  position: 'relative',
  overflow: 'hidden',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: `radial-gradient(circle at center, ${colors.accentBlue}10 0%, transparent 70%)`,
    opacity: 0.4,
    zIndex: 1
  },
  '& > *': {
    position: 'relative',
    zIndex: 2
  }
});

const FeatureCard = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(5),
  textAlign: 'center',
  color: colors.primaryText,
  backgroundColor: colors.cardBg,
  height: '100%',
  borderRadius: '16px',
  transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
  border: `1px solid ${colors.borderColor}`,
  position: 'relative',
  overflow: 'hidden',
  '&::after': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '4px',
    background: `linear-gradient(90deg, ${colors.accentBlue}, ${colors.buyGreen})`,
    transform: 'scaleX(0)',
    transformOrigin: 'left',
    transition: 'transform 0.3s ease',
  },
  '&:hover': {
    transform: 'translateY(-8px)',
    boxShadow: `0 15px 30px ${colors.shadowColor}`,
    borderColor: colors.accentBlue,
    '&::after': {
      transform: 'scaleX(1)',
    }
  }
}));

const AnimatedGradientText = styled(Typography)({
  background: `linear-gradient(135deg, ${colors.gradientStart}, ${colors.gradientEnd})`,
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  backgroundSize: '200% 200%',
  animation: 'gradient 8s ease infinite',
  '@keyframes gradient': {
    '0%': { backgroundPosition: '0% 50%' },
    '50%': { backgroundPosition: '100% 50%' },
    '100%': { backgroundPosition: '0% 50%' }
  }
});

const PulsingButton = styled(Button)({
  position: 'relative',
  overflow: 'hidden',
  '&::after': {
    content: '""',
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: '5px',
    height: '5px',
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    opacity: 0,
    borderRadius: '100%',
    transform: 'scale(1, 1) translate(-50%, -50%)',
    transformOrigin: '50% 50%',
  },
  '&:hover::after': {
    animation: 'ripple 1s ease-out',
  },
  '@keyframes ripple': {
    '0%': {
      transform: 'scale(0, 0) translate(-50%, -50%)',
      opacity: 0.5,
    },
    '100%': {
      transform: 'scale(20, 20) translate(-50%, -50%)',
      opacity: 0,
    },
  }
});

const FloatingCard = styled(Box)({
  animation: 'float 6s ease-in-out infinite',
  '@keyframes float': {
    '0%': { transform: 'translateY(0px)' },
    '50%': { transform: 'translateY(-15px)' },
    '100%': { transform: 'translateY(0px)' }
  }
});

// Add styled components for the missing elements
const StyledTextField = styled(TextField)({
  '& .MuiOutlinedInput-root': {
    '& fieldset': {
      borderColor: colors.borderColor,
    },
    '&:hover fieldset': {
      borderColor: colors.accentBlue,
    },
    '&.Mui-focused fieldset': {
      borderColor: colors.accentBlue,
    },
  },
  '& .MuiInputLabel-root': {
    color: colors.secondaryText,
  },
  '& .MuiInputLabel-root.Mui-focused': {
    color: colors.accentBlue,
  },
  '& .MuiInputBase-input': {
    color: colors.primaryText,
  }
});

const AnimatedButton = styled(Button)({
  position: 'relative',
  overflow: 'hidden',
  transition: 'all 0.3s ease',
  '&::after': {
    content: '""',
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: '5px',
    height: '5px',
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    opacity: 0,
    borderRadius: '100%',
    transform: 'scale(1, 1) translate(-50%, -50%)',
    transformOrigin: '50% 50%',
  },
  '&:hover::after': {
    animation: 'ripple 1s ease-out',
  },
  '@keyframes ripple': {
    '0%': {
      transform: 'scale(0, 0) translate(-50%, -50%)',
      opacity: 0.5,
    },
    '100%': {
      transform: 'scale(20, 20) translate(-50%, -50%)',
      opacity: 0,
    },
  }
});

const Home = () => {
  const [openLogin, setOpenLogin] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [anchorEl, setAnchorEl] = useState(null);
  const [openForgotPassword, setOpenForgotPassword] = useState(false);
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

  const handleOpenForgotPassword = () => {
    setOpenForgotPassword(true);
    setOpenLogin(false);
  };

  const handleCloseForgotPassword = () => {
    setOpenForgotPassword(false);
  };

  const handleForgotPasswordReturn = () => {
    setOpenForgotPassword(false);
    setOpenLogin(true);
    setIsLogin(true);
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
              MARKETPULSE
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
          <AnimatedGradientText variant="h2" component="h1" gutterBottom sx={{ 
            fontWeight: 900, 
            mb: 4,
            letterSpacing: '0.5px',
            textShadow: '0 5px 15px rgba(0,0,0,0.3)'
          }}>
            Advanced Market Analytics & Forecasting
          </AnimatedGradientText>
          <Typography variant="h5" component="p" sx={{ 
            maxWidth: '800px', 
            mb: 6,
            color: colors.secondaryText,
            lineHeight: 1.6
          }}>
            Marketpulse provides institutional-grade market analysis, predictive modeling, and real-time forecasting to help you make data-driven investment decisions.
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', justifyContent: 'center' }}>
            <PulsingButton 
              variant="contained" 
              size="large" 
              sx={{ 
                px: 5, 
                py: 1.8, 
                fontSize: '1.1rem',
                backgroundColor: colors.buyGreen,
                '&:hover': { 
                  backgroundColor: colors.profitGreen,
                  transform: 'translateY(-3px)',
                  boxShadow: `0 7px 14px rgba(0, 230, 118, 0.4)`,
                },
                borderRadius: '30px',
                fontWeight: 'bold',
                transition: 'all 0.3s ease',
                textTransform: 'none'
              }}
              onClick={handleOpenRegister}
            >
              Get Started
            </PulsingButton>
            <PulsingButton 
              variant="outlined" 
              size="large" 
              sx={{ 
                px: 5, 
                py: 1.8, 
                fontSize: '1.1rem',
                color: colors.accentBlue,
                borderColor: colors.accentBlue,
                borderRadius: '30px',
                fontWeight: 'bold',
                textTransform: 'none',
                transition: 'all 0.3s ease',
                '&:hover': { 
                  backgroundColor: `${colors.accentBlue}20`,
                  borderColor: colors.accentBlue,
                  transform: 'translateY(-3px)',
                  boxShadow: `0 7px 14px rgba(33, 150, 243, 0.4)`,
                }
              }}
              onClick={handleOpenLogin}
            >
              Explore Analytics
            </PulsingButton>
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
            Why Choose Marketpulse Analytics?
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
                <FloatingCard sx={{ height: '100%', animationDelay: `${index * 0.2}s` }}>
                  <FeatureCard elevation={0}>
                    <Box sx={{ mb: 3, height: 60, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Box sx={{ 
                        width: 60, 
                        height: 60, 
                        borderRadius: '50%', 
                        background: `linear-gradient(135deg, ${colors.gradientStart}20, ${colors.gradientEnd}20)`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        {index === 0 && <ShowChartIcon sx={{ fontSize: 30, color: colors.accentBlue }} />}
                        {index === 1 && <ShowChartIcon sx={{ fontSize: 30, color: colors.buyGreen }} />}
                        {index === 2 && <ShowChartIcon sx={{ fontSize: 30, color: colors.warningOrange }} />}
                      </Box>
                    </Box>
                    <Typography variant="h5" component="h3" gutterBottom sx={{ 
                      fontWeight: 'bold',
                      background: `linear-gradient(135deg, ${colors.gradientStart}, ${colors.gradientEnd})`,
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      mb: 2
                    }}>
                      {feature.title}
                    </Typography>
                    <Typography sx={{ color: colors.secondaryText, lineHeight: 1.7 }}>
                      {feature.description}
                    </Typography>
                  </FeatureCard>
                </FloatingCard>
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
                MARKETPULSE
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
                Email: support@marketpulse.com<br />
                Phone: +1 (555) 123-4567<br />
                Address: 123 Trading Street, Financial District, NY 10004
              </Typography>
            </Box>
          </Box>
          <Divider sx={{ my: 4, backgroundColor: colors.borderColor }} />
          <Typography variant="body2" align="center">
            © {new Date().getFullYear()} Marketpulse. All rights reserved.
          </Typography>
        </Container>
      </Box>

      {/* Login/Register Dialog */}
      <LoginDialog 
        open={openLogin} 
        onClose={handleClose} 
        isLogin={isLogin} 
        toggleForm={() => setIsLogin(!isLogin)}
        onForgotPassword={handleOpenForgotPassword}
      />

      {/* Forgot Password Dialog */}
      <Dialog 
        open={openForgotPassword} 
        onClose={handleCloseForgotPassword}
        PaperProps={{
          sx: {
            backgroundColor: colors.cardBg,
            border: `1px solid ${colors.borderColor}`,
            borderRadius: '16px',
            boxShadow: `0 8px 32px ${colors.shadowColor}`
          }
        }}
      >
        <ForgotPasswordForm 
          onClose={handleCloseForgotPassword} 
          onReturn={handleForgotPasswordReturn}
        />
      </Dialog>
    </>
  );
};

// Forgot Password Form Component
const ForgotPasswordForm = ({ onClose, onReturn }) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleResetPassword = async (e) => {
    e.preventDefault();
    
    if (!email) {
      setError('Please enter your email address');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      // This would normally connect to an API endpoint, but we'll simulate it for now
      // In a real implementation, this would call an API endpoint like:
      // await API.auth.forgotPassword({ email });
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Simulated success response
      setSuccess(true);
    } catch (err) {
      console.error('Password reset error:', err);
      setError(err.response?.data?.message || 'Failed to process your request. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ 
      p: 4, 
      width: '400px',
      maxWidth: '100%',
      backgroundColor: colors.cardBg
    }}>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
        <IconButton
          onClick={onClose}
          sx={{ 
            color: colors.secondaryText,
            '&:hover': {
              color: colors.primaryText,
              backgroundColor: colors.hoverBg
            }
          }}
        >
          <CloseIcon />
        </IconButton>
      </Box>
      
      <Typography 
        variant="h5" 
        component="h2" 
        sx={{ 
          fontWeight: 'bold',
          textAlign: 'center',
          background: `linear-gradient(135deg, ${colors.gradientStart}, ${colors.gradientEnd})`,
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          mb: 3
        }}
      >
        Reset Password
      </Typography>
      
      {error && (
        <Alert 
          severity="error" 
          sx={{ 
            mb: 3,
            backgroundColor: `${colors.lossRed}20`,
            color: colors.sellRed,
            border: `1px solid ${colors.sellRed}40`
          }}
        >
          {error}
        </Alert>
      )}
      
      {success ? (
        <>
          <Alert 
            severity="success" 
            sx={{ 
              mb: 3,
              backgroundColor: `${colors.buyGreen}20`,
              color: colors.buyGreen,
              border: `1px solid ${colors.buyGreen}40`
            }}
          >
            Password reset instructions have been sent to your email address.
          </Alert>
          
          <Typography sx={{ color: colors.secondaryText, mb: 3, textAlign: 'center' }}>
            Please check your inbox for instructions to reset your password. If you don't see the email, please check your spam folder.
          </Typography>
          
          <Button 
            variant="outlined" 
            fullWidth 
            onClick={onReturn}
            sx={{ 
              mt: 2,
              py: 1.5,
              borderColor: colors.accentBlue,
              color: colors.accentBlue,
              '&:hover': {
                borderColor: colors.accentBlue,
                backgroundColor: `${colors.accentBlue}20`
              }
            }}
          >
            Return to Login
          </Button>
        </>
      ) : (
        <form onSubmit={handleResetPassword}>
          <Typography sx={{ color: colors.secondaryText, mb: 3 }}>
            Enter your email address and we'll send you instructions to reset your password.
          </Typography>
          
          <StyledTextField 
            label="Email" 
            type="email" 
            fullWidth
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            InputProps={{
              sx: { borderRadius: '12px' }
            }}
            sx={{ mb: 3 }}
          />
          
          <AnimatedButton 
            type="submit"
            variant="contained" 
            size="large" 
            fullWidth 
            sx={{ 
              py: 1.5, 
              mb: 2,
              backgroundColor: colors.buyGreen,
              borderRadius: '12px',
              textTransform: 'none',
              fontSize: '1rem',
              fontWeight: 'bold',
              letterSpacing: '0.5px',
              '&:hover': { 
                backgroundColor: colors.profitGreen,
                boxShadow: `0 6px 20px ${colors.buyGreen}40`
              },
              transition: 'all 0.3s ease'
            }}
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} color="inherit" /> : 'Reset Password'}
          </AnimatedButton>
          
          <Button 
            variant="text" 
            fullWidth 
            onClick={onReturn}
            sx={{ 
              textTransform: 'none', 
              color: colors.secondaryText,
              '&:hover': {
                backgroundColor: 'transparent',
                color: colors.primaryText
              }
            }}
          >
            Back to Login
          </Button>
        </form>
      )}
    </Box>
  );
};

export default Home;