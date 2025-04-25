import React, { useState, useEffect, useRef } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  TextField, 
  Button, 
  Avatar, 
  List,
  ListItem,
  ListItemText,
  Divider,
  Grid, 
  IconButton,
  Chip,
  CircularProgress
} from '@mui/material';
import { styled } from '@mui/system';
import Sidebar from './Sidebar';
import { 
  Search as SearchIcon,
  QuestionAnswer as QuestionIcon,
  AdminPanelSettings as AdminIcon,
  Person as PersonIcon,
  Settings as SettingsIcon,
  Security as SecurityIcon,
  BarChart as AnalyticsIcon,
  Send as SendIcon
} from '@mui/icons-material';
import { API } from '../axiosConfig';
import axios from 'axios';

// Define theme colors to match the user components
const colors = {
  primary: '#1976d2',
  secondary: '#9c27b0',
  background: '#121212',
  cardBg: '#1e1e1e',
  primaryText: '#ffffff',
  secondaryText: '#b3b3b3',
  borderColor: '#333333',
  buyGreen: '#4caf50',
  sellRed: '#f44336',
  hoverBg: '#2a2a2a',
  warningOrange: '#ffa500',
  accentBlue: '#2196f3'
};

const PageContainer = styled('div')({
  display: 'flex',
  minHeight: '100vh',
  backgroundColor: colors.background,
  color: colors.primaryText
});

const MainContent = styled('div')({
  flexGrow: 1,
  padding: '20px',
  marginLeft: '250px' // Match sidebar width
});

const StyledCard = styled(Paper)({
  padding: '20px',
  backgroundColor: colors.cardBg,
  border: `1px solid ${colors.borderColor}`,
  borderRadius: '10px',
  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  transition: 'transform 0.2s ease',
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15)'
  }
});

const ChatContainer = styled(Paper)({
  padding: '20px',
  backgroundColor: colors.cardBg,
  border: `1px solid ${colors.borderColor}`,
  borderRadius: '10px',
  height: '400px',
  display: 'flex',
  flexDirection: 'column'
});

const MessageBubble = styled(Box)(({ isUser }) => ({
  backgroundColor: isUser ? `${colors.primary}33` : `${colors.secondary}33`,
  padding: '12px 16px',
  borderRadius: isUser ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
  maxWidth: '80%',
  marginBottom: '10px',
  alignSelf: isUser ? 'flex-end' : 'flex-start',
  position: 'relative',
  border: `1px solid ${isUser ? `${colors.primary}44` : `${colors.secondary}44`}`,
  wordBreak: 'break-word'
}));

const MessagesArea = styled(Box)({
  flexGrow: 1,
  overflowY: 'auto',
  display: 'flex',
  flexDirection: 'column',
  padding: '10px',
  marginBottom: '10px',
  '&::-webkit-scrollbar': {
    width: '8px'
  },
  '&::-webkit-scrollbar-track': {
    background: colors.background
  },
  '&::-webkit-scrollbar-thumb': {
    background: colors.borderColor,
    borderRadius: '4px'
  }
});

const FAQSection = styled(Box)({
  marginBottom: '20px'
});

const FAQCard = styled(Paper)({
  padding: '16px',
  backgroundColor: colors.cardBg,
  border: `1px solid ${colors.borderColor}`,
  borderRadius: '10px',
  marginBottom: '12px',
  cursor: 'pointer',
  transition: 'all 0.2s ease',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: `0 6px 12px rgba(0, 0, 0, 0.15)`,
    backgroundColor: `${colors.hoverBg}`
  }
});

const AdminFAQ = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [messages, setMessages] = useState([
    { 
      id: 1, 
      text: "Hello! I'm your MarketPulse Admin Assistant. How can I help you today?", 
      isUser: false 
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const messagesAreaRef = useRef(null);
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);
  const [faqData, setFaqData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Fetch FAQ data from API
  useEffect(() => {
    const fetchFAQData = async () => {
      setLoading(true);
      try {
        // Here we would call an actual API endpoint
        // For example: const response = await API.admin.getFAQs();
        
        // Since we don't have a specific FAQ API endpoint yet, 
        // we'll use existing API endpoints to populate our data
        const [usersResponse, trendsResponse, symbolsResponse] = await Promise.all([
          API.admin.getUsers(),
          API.admin.getMarketTrends(),
          API.admin.getFavoriteSymbols()
        ]);
        
        // Construct the FAQ data using real data from the API
        const fetchedData = {
          user: [
            { 
              id: 'user-1', 
              question: 'How do I suspend or activate a user account?', 
              answer: 'In the User Management page, find the user in the table and click the "Suspend" or "Activate" button in the Actions column. This will immediately change their account status.'
            },
            { 
              id: 'user-2', 
              question: 'How many users are currently registered?', 
              answer: `There are currently ${usersResponse.data.users ? usersResponse.data.users.length : 'N/A'} users registered in the system.`
            },
            { 
              id: 'user-3', 
              question: 'How do I filter users by role?', 
              answer: 'In the User Management page, use the "Filter by Role" buttons to show All users, only regular Users, or only Admins.'
            }
          ],
          system: [
            { 
              id: 'system-1', 
              question: 'How do I access system health metrics?', 
              answer: 'On the Admin Dashboard, the System Health & Status cards show the current state of server, API, database, and security components. Click on "System Settings" in the quick actions for more detailed options.'
            },
            { 
              id: 'system-2', 
              question: 'What is the current market trend?', 
              answer: trendsResponse.data?.data ? 
                `The current overall market trend is ${trendsResponse.data.data.overall_trend}. The market currently shows ${trendsResponse.data.data.bullish_percentage}% bullish, ${trendsResponse.data.data.bearish_percentage}% bearish, and ${trendsResponse.data.data.neutral_percentage}% neutral sentiment across ${trendsResponse.data.data.total_symbols} currency pairs.` : 
                'Market trend data is currently unavailable. Please check the Admin Dashboard for updates.'
            }
          ],
          security: [
            { 
              id: 'security-1', 
              question: 'How do I review login activity?', 
              answer: 'In the User Management page, the "Last Login" column shows when each user last accessed the platform. The color indicator shows their activity status - green for recently active, yellow for moderately active, and gray for inactive users.'
            },
            { 
              id: 'security-2', 
              question: 'What happens when I suspend a user account?', 
              answer: 'When you suspend a user account, they will be immediately logged out and unable to log back in. Their status indicator will turn red, and all trading functions will be disabled for their account until reactivated.'
            }
          ],
          analytics: [
            { 
              id: 'analytics-1', 
              question: 'Where can I see user growth statistics?', 
              answer: 'The Admin Dashboard displays user growth statistics in the Users card. It shows a line chart of user registrations over time. For more detailed analytics, check the User Management page metrics.'
            },
            { 
              id: 'analytics-2', 
              question: 'What are the most popular currency pairs?', 
              answer: symbolsResponse.data?.data && symbolsResponse.data.data.length > 0 ? 
                `The most popular currency pairs are: ${symbolsResponse.data.data.slice(0, 3).map(item => item.symbol).join(', ')}. You can view the complete list on the Admin Dashboard in the Favorite Symbols card.` : 
                'Currency pair popularity data is currently unavailable. Please check the Admin Dashboard for updates.'
            }
          ]
        };
        
        setFaqData(fetchedData);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching FAQ data:', err);
        setError('Failed to load FAQ data. Please try refreshing the page.');
        setLoading(false);
        
        // Fallback to predefined data if API fails
        setFaqData({
          user: [
            { 
              id: 'user-1', 
              question: 'How do I suspend or activate a user account?', 
              answer: 'In the User Management page, find the user in the table and click the "Suspend" or "Activate" button in the Actions column. This will immediately change their account status.'
            },
            { 
              id: 'user-2', 
              question: 'Where can I see new user registrations?', 
              answer: 'The User Management dashboard displays a "New Users (7d)" metric at the top that shows how many users registered in the past week. For more details, use the search and filter options in the user table.'
            },
            { 
              id: 'user-3', 
              question: 'How do I filter users by role?', 
              answer: 'In the User Management page, use the "Filter by Role" buttons to show All users, only regular Users, or only Admins.'
            }
          ],
          system: [
            { 
              id: 'system-1', 
              question: 'How do I access system health metrics?', 
              answer: 'On the Admin Dashboard, the System Health & Status cards show the current state of server, API, database, and security components. Click on "System Settings" in the quick actions for more detailed options.'
            },
            { 
              id: 'system-2', 
              question: 'Where can I find market trends data?', 
              answer: 'Market trends data is available in the Admin Dashboard under the Market Trends card. It shows bullish, neutral, and bearish percentages, as well as the overall market sentiment.'
            }
          ],
          security: [
            { 
              id: 'security-1', 
              question: 'How do I review login activity?', 
              answer: 'In the User Management page, the "Last Login" column shows when each user last accessed the platform. The color indicator shows their activity status - green for recently active, yellow for moderately active, and gray for inactive users.'
            },
            { 
              id: 'security-2', 
              question: 'What happens when I suspend a user account?', 
              answer: 'When you suspend a user account, they will be immediately logged out and unable to log back in. Their status indicator will turn red, and all trading functions will be disabled for their account until reactivated.'
            }
          ],
          analytics: [
            { 
              id: 'analytics-1', 
              question: 'Where can I see user growth statistics?', 
              answer: 'The Admin Dashboard displays user growth statistics in the Users card. It shows a line chart of user registrations over time. For more detailed analytics, check the User Management page metrics.'
            },
            { 
              id: 'analytics-2', 
              question: 'How can I view the most popular currency pairs?', 
              answer: 'The Admin Dashboard includes a Favorite Symbols card that shows which currency pairs are most popular among users, displayed as a bar chart for easy visualization.'
            }
          ]
        });
      }
    };
    
    fetchFAQData();
  }, []);
  
  // More intelligent scroll handling
  useEffect(() => {
    if (shouldAutoScroll && messagesEndRef.current) {
      // Use a small timeout to ensure DOM updates are complete
      const scrollTimeout = setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
      }, 100);
      
      return () => clearTimeout(scrollTimeout);
    }
  }, [messages, shouldAutoScroll]);

  // Detect if user has manually scrolled up
  const handleScroll = () => {
    if (messagesAreaRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = messagesAreaRef.current;
      // If user scrolled up (not at bottom), disable auto-scroll
      // But if they scrolled back to bottom, re-enable it
      const isAtBottom = scrollHeight - scrollTop - clientHeight < 50; // 50px threshold
      setShouldAutoScroll(isAtBottom);
    }
  };

  // Define FAQ categories
  const faqCategories = [
    { 
      id: 'user', 
      title: 'User Management', 
      icon: <PersonIcon sx={{ color: colors.primary }} />,
      color: colors.primary
    },
    { 
      id: 'system', 
      title: 'System Settings', 
      icon: <SettingsIcon sx={{ color: colors.secondary }} />,
      color: colors.secondary
    },
    { 
      id: 'security', 
      title: 'Security & Access', 
      icon: <SecurityIcon sx={{ color: colors.buyGreen }} />,
      color: colors.buyGreen
    },
    { 
      id: 'analytics', 
      title: 'Analytics & Reporting', 
      icon: <AnalyticsIcon sx={{ color: colors.accentBlue }} />,
      color: colors.accentBlue
    }
  ];
  
  // Filter FAQs based on search query
  const filteredFAQs = {};
  if (faqData && searchQuery) {
    Object.keys(faqData).forEach(category => {
      filteredFAQs[category] = faqData[category].filter(
        item => item.question.toLowerCase().includes(searchQuery.toLowerCase()) || 
               item.answer.toLowerCase().includes(searchQuery.toLowerCase())
      );
    });
  } else if (faqData) {
    Object.keys(faqData).forEach(category => {
      filteredFAQs[category] = faqData[category];
    });
  }

  // Send message to help desk API
  const sendMessageToAPI = async (message) => {
    try {
      // This would connect to a real API endpoint
      // For now, we'll simulate an API response with a more advanced algorithm

      // For simplicity here, we're mimicking an API response locally
      // In a real implementation, you would use something like:
      // const response = await axios.post('/api/admin/help-center/chat', { message });
      // return response.data;

      // Find matching FAQs using more advanced matching
      let bestMatch = null;
      let bestScore = 0;
      let suggestions = [];

      if (!faqData) return null;
      
      // Simple NLP-like processing
      const userWords = message.toLowerCase().split(/\s+/);
      const questionWords = ['how', 'what', 'where', 'when', 'why', 'who', 'can', 'do'];
      const isQuestion = userWords.some(word => questionWords.includes(word));
      
      // Search through all categories and questions
      Object.keys(faqData).forEach(category => {
        faqData[category].forEach(item => {
          // Calculate similarity score (simple word matching)
          let score = 0;
          const questionWords = item.question.toLowerCase().split(/\s+/);
          
          // Count matching words
          userWords.forEach(word => {
            if (word.length > 3 && questionWords.includes(word)) {
              score += 1;
            }
          });
          
          // Boost score for exact phrases
          if (item.question.toLowerCase().includes(message.toLowerCase())) {
            score += 3;
          }
          
          // Collect potential matches
          if (score > 0) {
            suggestions.push({
              question: item.question,
              answer: item.answer,
              score
            });
          }
          
          // Track best match
          if (score > bestScore) {
            bestScore = score;
            bestMatch = item;
          }
        });
      });
      
      // Sort suggestions by score
      suggestions.sort((a, b) => b.score - a.score);
      
      // Determine response based on match quality
      if (bestScore >= 2) {
        return {
          text: bestMatch.answer,
          confidence: 'high'
        };
      } else if (suggestions.length > 0) {
        // Format suggestions for display
        const suggestionsText = `I'm not sure I understand completely. Did you mean one of these?\n\n${suggestions.slice(0, 3).map(s => `• ${s.question}`).join('\n')}`;
        return {
          text: suggestionsText,
          confidence: 'medium',
          suggestions: suggestions.slice(0, 3)
        };
      } else if (isQuestion) {
        return {
          text: "I don't have specific information about that in my knowledge base. Would you like me to connect you with a live admin or try rephrasing your question?",
          confidence: 'low'
        };
      } else {
        return {
          text: "I don't have enough information to help with that. Try asking a question about user management, system settings, security, or analytics.",
          confidence: 'low'
        };
      }
    } catch (error) {
      console.error('Error sending message to API:', error);
      return {
        text: "I'm sorry, but I'm having trouble processing your request right now. Please try again later.",
        confidence: 'error'
      };
    }
  };
  
  // Generate response via API
  const generateResponse = async (question) => {
    setIsTyping(true);
    
    try {
      // Get response from API
      const apiResponse = await sendMessageToAPI(question);
      
      if (!apiResponse) {
        setMessages(prev => [
          ...prev, 
          { 
            id: Date.now(), 
            text: "Sorry, I'm having trouble connecting to the help center. Please try again later.", 
            isUser: false 
          }
        ]);
      } else {
        // Add the response to chat
        setMessages(prev => [
          ...prev, 
          { id: Date.now(), text: apiResponse.text, isUser: false }
        ]);
      }
      
      // Re-enable auto-scroll for the response
      setShouldAutoScroll(true);
    } catch (error) {
      console.error('Error generating response:', error);
      setMessages(prev => [
        ...prev, 
        { 
          id: Date.now(), 
          text: "I apologize, but I encountered an error while processing your request.", 
          isUser: false 
        }
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!inputValue.trim()) return;
    
    // Add user message
    const userMessage = { id: Date.now(), text: inputValue, isUser: true };
    setMessages(prev => [...prev, userMessage]);
    
    // Ensure scrolling is enabled for user messages
    setShouldAutoScroll(true);
    
    // Generate response
    generateResponse(inputValue);
    
    // Clear input
    setInputValue('');
  };

  const handleFAQClick = (question, answer) => {
    // Add the question as if user asked it
    setMessages(prev => [
      ...prev, 
      { id: Date.now(), text: question, isUser: true }
    ]);
    
    // Ensure scrolling is enabled for FAQ clicks
    setShouldAutoScroll(true);
    
    // Simulate response with slight delay
    setIsTyping(true);
    setTimeout(() => {
      setMessages(prev => [
        ...prev, 
        { id: Date.now(), text: answer, isUser: false }
      ]);
      setIsTyping(false);
    }, 800);
  };

  // Loading state
  if (loading) {
    return (
      <PageContainer>
        <Sidebar />
        <MainContent>
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
            <CircularProgress size={60} sx={{ color: colors.primary }} />
            <Typography variant="h6" sx={{ ml: 2, color: colors.primaryText }}>
              Loading Help Center...
            </Typography>
          </Box>
        </MainContent>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <Sidebar />
      <MainContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" sx={{ color: colors.primaryText, display: 'flex', alignItems: 'center', gap: 1 }}>
            <QuestionIcon sx={{ color: colors.secondary }} /> Admin Help Center
          </Typography>
        </Box>
        
        {error && (
          <Box sx={{ 
            p: 2, 
            mb: 3, 
            backgroundColor: `${colors.sellRed}22`,
            border: `1px solid ${colors.sellRed}`,
            borderRadius: '8px',
            color: colors.primaryText
          }}>
            <Typography>{error}</Typography>
          </Box>
        )}
        
        <Grid container spacing={3}>
          {/* Chat section */}
          <Grid item xs={12} lg={7}>
            <ChatContainer>
              <Box sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                <Avatar sx={{ bgcolor: colors.secondary, mr: 1.5 }}>
                  <AdminIcon />
                </Avatar>
                <Typography variant="h6">Admin Assistant</Typography>
              </Box>
              
              <MessagesArea 
                ref={messagesAreaRef} 
                onScroll={handleScroll}
              >
                {messages.map((message) => (
                  <MessageBubble key={message.id} isUser={message.isUser}>
                    <Typography variant="body2" sx={{ color: colors.primaryText, whiteSpace: 'pre-line' }}>
                      {message.text}
                    </Typography>
                  </MessageBubble>
                ))}
                {isTyping && (
                  <MessageBubble isUser={false}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <CircularProgress size={16} sx={{ mr: 1, color: colors.primaryText }} />
                      <Typography variant="body2" sx={{ color: colors.primaryText }}>
                        Typing...
                      </Typography>
                    </Box>
                  </MessageBubble>
                )}
                <div ref={messagesEndRef} />
              </MessagesArea>
              
              <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', position: 'relative', zIndex: 2 }}>
                <TextField
                  fullWidth
                  variant="outlined"
                  placeholder="Ask an admin-related question..."
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      color: colors.primaryText,
                      backgroundColor: `${colors.background}80`,
                      '& fieldset': {
                        borderColor: colors.borderColor
                      },
                      '&:hover fieldset': {
                        borderColor: colors.primary
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: colors.primary
                      }
                    }
                  }}
                  InputProps={{
                    endAdornment: (
                      <IconButton 
                        type="submit" 
                        disabled={!inputValue.trim() || isTyping}
                        sx={{ color: colors.primary }}
                      >
                        <SendIcon />
                      </IconButton>
                    )
                  }}
                />
              </Box>
            </ChatContainer>
          </Grid>
          
          {/* FAQ section */}
          <Grid item xs={12} lg={5}>
            <StyledCard sx={{ height: '400px', overflowY: 'auto' }}>
              <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <QuestionIcon fontSize="small" sx={{ color: colors.secondary }} />
                Frequently Asked Questions
              </Typography>
              
              <TextField
                fullWidth
                variant="outlined"
                placeholder="Search FAQs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                sx={{ mb: 3 }}
                InputProps={{
                  startAdornment: <SearchIcon sx={{ mr: 1, color: colors.secondaryText }} />,
                  sx: {
                    color: colors.primaryText,
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: colors.borderColor
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: colors.primary
                    }
                  }
                }}
              />
              
              {faqData && faqCategories.map((category) => {
                // Skip empty categories after filtering
                if (!filteredFAQs[category.id] || filteredFAQs[category.id].length === 0) return null;
                
                return (
                  <FAQSection key={category.id}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <Avatar sx={{ bgcolor: `${category.color}22`, width: 32, height: 32, mr: 1 }}>
                        {category.icon}
                      </Avatar>
                      <Typography variant="h6" sx={{ color: category.color, fontSize: '1rem' }}>
                        {category.title}
                      </Typography>
                      <Chip 
                        label={filteredFAQs[category.id].length} 
                        size="small" 
                        sx={{ 
                          ml: 1, 
                          backgroundColor: `${category.color}22`,
                          color: category.color,
                          fontWeight: 'bold'
                        }} 
                      />
                    </Box>
                    
                    {filteredFAQs[category.id].map((item) => (
                      <FAQCard 
                        key={item.id} 
                        onClick={() => handleFAQClick(item.question, item.answer)}
                      >
                        <Typography variant="body1" sx={{ fontWeight: 500, mb: 0.5, color: colors.primaryText }}>
                          {item.question}
                        </Typography>
                        <Typography variant="body2" sx={{ color: colors.secondaryText }}>
                          {item.answer.length > 80 ? `${item.answer.substring(0, 80)}...` : item.answer}
                        </Typography>
                      </FAQCard>
                    ))}
                  </FAQSection>
                );
              })}
              
              {(!faqData || Object.values(filteredFAQs).every(items => !items || items.length === 0)) && (
                <Box sx={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  height: '200px',
                  color: colors.secondaryText
                }}>
                  <SearchIcon sx={{ fontSize: 48, mb: 2, opacity: 0.6 }} />
                  <Typography>No matching FAQs found</Typography>
                  <Typography variant="body2">Try different search terms</Typography>
                </Box>
              )}
            </StyledCard>
          </Grid>
          
          {/* Quick guides section */}
          <Grid item xs={12} sx={{ mt: 3 }}>
            <Typography variant="h5" sx={{ mb: 2, color: colors.primaryText }}>
              Admin Quick Guides
            </Typography>
            
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6} md={4}>
                <StyledCard>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Avatar sx={{ bgcolor: `${colors.primary}22`, mr: 1.5 }}>
                      <PersonIcon sx={{ color: colors.primary }} />
                    </Avatar>
                    <Typography variant="h6">User Management Guide</Typography>
                  </Box>
                  
                  <Typography variant="body2" sx={{ color: colors.secondaryText, mb: 2 }}>
                    Learn how to effectively manage users on the MarketPulse platform.
                  </Typography>
                  
                  <List sx={{ bgcolor: `${colors.background}50`, borderRadius: '8px', p: 1 }}>
                    <ListItem dense>
                      <ListItemText 
                        primary="Suspending problematic users" 
                        primaryTypographyProps={{ color: colors.primaryText }}
                        secondary="Ban users who violate platform rules"
                        secondaryTypographyProps={{ color: colors.secondaryText, fontSize: '0.8rem' }}
                      />
                    </ListItem>
                    <Divider sx={{ backgroundColor: colors.borderColor }} />
                    <ListItem dense>
                      <ListItemText 
                        primary="Monitoring user activity" 
                        primaryTypographyProps={{ color: colors.primaryText }}
                        secondary="Track login frequency and engagement"
                        secondaryTypographyProps={{ color: colors.secondaryText, fontSize: '0.8rem' }}
                      />
                    </ListItem>
                    <Divider sx={{ backgroundColor: colors.borderColor }} />
                    <ListItem dense>
                      <ListItemText 
                        primary="Managing user roles" 
                        primaryTypographyProps={{ color: colors.primaryText }}
                        secondary="Assign user permissions appropriately"
                        secondaryTypographyProps={{ color: colors.secondaryText, fontSize: '0.8rem' }}
                      />
                    </ListItem>
                  </List>
                </StyledCard>
              </Grid>
              
              <Grid item xs={12} sm={6} md={4}>
                <StyledCard>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Avatar sx={{ bgcolor: `${colors.secondary}22`, mr: 1.5 }}>
                      <SettingsIcon sx={{ color: colors.secondary }} />
                    </Avatar>
                    <Typography variant="h6">System Management</Typography>
                  </Box>
                  
                  <Typography variant="body2" sx={{ color: colors.secondaryText, mb: 2 }}>
                    Understand how to monitor and maintain system performance.
                  </Typography>
                  
                  <List sx={{ bgcolor: `${colors.background}50`, borderRadius: '8px', p: 1 }}>
                    <ListItem dense>
                      <ListItemText 
                        primary="Checking system health" 
                        primaryTypographyProps={{ color: colors.primaryText }}
                        secondary="Monitor server and API status"
                        secondaryTypographyProps={{ color: colors.secondaryText, fontSize: '0.8rem' }}
                      />
                    </ListItem>
                    <Divider sx={{ backgroundColor: colors.borderColor }} />
                    <ListItem dense>
                      <ListItemText 
                        primary="Managing market data" 
                        primaryTypographyProps={{ color: colors.primaryText }}
                        secondary="Ensure currency pairs are up to date"
                        secondaryTypographyProps={{ color: colors.secondaryText, fontSize: '0.8rem' }}
                      />
                    </ListItem>
                    <Divider sx={{ backgroundColor: colors.borderColor }} />
                    <ListItem dense>
                      <ListItemText 
                        primary="System configuration" 
                        primaryTypographyProps={{ color: colors.primaryText }}
                        secondary="Adjust platform settings and parameters"
                        secondaryTypographyProps={{ color: colors.secondaryText, fontSize: '0.8rem' }}
                      />
                    </ListItem>
                  </List>
                </StyledCard>
              </Grid>
              
              <Grid item xs={12} sm={6} md={4}>
                <StyledCard>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Avatar sx={{ bgcolor: `${colors.accentBlue}22`, mr: 1.5 }}>
                      <AnalyticsIcon sx={{ color: colors.accentBlue }} />
                    </Avatar>
                    <Typography variant="h6">Analytics Overview</Typography>
                  </Box>
                  
                  <Typography variant="body2" sx={{ color: colors.secondaryText, mb: 2 }}>
                    Learn how to interpret platform analytics and usage statistics.
                  </Typography>
                  
                  <List sx={{ bgcolor: `${colors.background}50`, borderRadius: '8px', p: 1 }}>
                    <ListItem dense>
                      <ListItemText 
                        primary="User growth tracking" 
                        primaryTypographyProps={{ color: colors.primaryText }}
                        secondary="Analyze registration patterns"
                        secondaryTypographyProps={{ color: colors.secondaryText, fontSize: '0.8rem' }}
                      />
                    </ListItem>
                    <Divider sx={{ backgroundColor: colors.borderColor }} />
                    <ListItem dense>
                      <ListItemText 
                        primary="Popular symbols analysis" 
                        primaryTypographyProps={{ color: colors.primaryText }}
                        secondary="Identify most-watched currency pairs"
                        secondaryTypographyProps={{ color: colors.secondaryText, fontSize: '0.8rem' }}
                      />
                    </ListItem>
                    <Divider sx={{ backgroundColor: colors.borderColor }} />
                    <ListItem dense>
                      <ListItemText 
                        primary="Market trends overview" 
                        primaryTypographyProps={{ color: colors.primaryText }}
                        secondary="Track overall market sentiment"
                        secondaryTypographyProps={{ color: colors.secondaryText, fontSize: '0.8rem' }}
                      />
                    </ListItem>
                  </List>
                </StyledCard>
              </Grid>
            </Grid>
          </Grid>
        </Grid>
      </MainContent>
    </PageContainer>
  );
};

export default AdminFAQ; 