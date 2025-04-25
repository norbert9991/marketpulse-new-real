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
  
  // Sample FAQ categories
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
  
  // Sample FAQ items based on existing platform features
  const faqItems = {
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
  };
  
  // Filter FAQs based on search query
  const filteredFAQs = {};
  if (searchQuery) {
    Object.keys(faqItems).forEach(category => {
      filteredFAQs[category] = faqItems[category].filter(
        item => item.question.toLowerCase().includes(searchQuery.toLowerCase()) || 
               item.answer.toLowerCase().includes(searchQuery.toLowerCase())
      );
    });
  } else {
    Object.keys(faqItems).forEach(category => {
      filteredFAQs[category] = faqItems[category];
    });
  }

  // Scroll to bottom of chat on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Simulate AI response
  const generateResponse = (question) => {
    setIsTyping(true);
    
    // Find matching FAQs
    let foundAnswer = null;
    let matchingQuestions = [];
    
    Object.keys(faqItems).forEach(category => {
      faqItems[category].forEach(item => {
        // Exact match
        if (item.question.toLowerCase() === question.toLowerCase()) {
          foundAnswer = item.answer;
        }
        // Partial match for suggestions
        else if (item.question.toLowerCase().includes(question.toLowerCase()) ||
                question.toLowerCase().includes(item.question.toLowerCase().split(' ').filter(word => word.length > 3).join(' '))) {
          matchingQuestions.push(item.question);
        }
      });
    });
    
    // Simulate thinking time
    setTimeout(() => {
      if (foundAnswer) {
        // Direct answer
        setMessages(prev => [
          ...prev, 
          { id: Date.now(), text: foundAnswer, isUser: false }
        ]);
      } else if (matchingQuestions.length > 0) {
        // Suggestions
        const suggestionsText = `I'm not sure I understand completely. Are you asking about one of these?\n\n${matchingQuestions.map(q => `• ${q}`).join('\n')}`;
        setMessages(prev => [
          ...prev, 
          { id: Date.now(), text: suggestionsText, isUser: false }
        ]);
      } else {
        // No match
        const noMatchText = "I don't have specific information about that. Please try to rephrase your question or browse the FAQ categories below.";
        setMessages(prev => [
          ...prev, 
          { id: Date.now(), text: noMatchText, isUser: false }
        ]);
      }
      setIsTyping(false);
    }, 1500);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!inputValue.trim()) return;
    
    // Add user message
    const userMessage = { id: Date.now(), text: inputValue, isUser: true };
    setMessages(prev => [...prev, userMessage]);
    
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

  return (
    <PageContainer>
      <Sidebar />
      <MainContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" sx={{ color: colors.primaryText, display: 'flex', alignItems: 'center', gap: 1 }}>
            <QuestionIcon sx={{ color: colors.secondary }} /> Admin Help Center
          </Typography>
        </Box>
        
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
              
              <MessagesArea>
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
              
              <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex' }}>
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
              
              {faqCategories.map((category) => {
                // Skip empty categories after filtering
                if (filteredFAQs[category.id] && filteredFAQs[category.id].length === 0) return null;
                
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
              
              {Object.values(filteredFAQs).every(items => items.length === 0) && (
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