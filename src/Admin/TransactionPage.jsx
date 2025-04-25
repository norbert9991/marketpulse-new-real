import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper, TextField, Button, CircularProgress, Avatar, Grid, IconButton, Tooltip, Chip, Card, CardContent, Divider, List, ListItem, ListItemText, ListItemIcon } from '@mui/material';
import { styled } from '@mui/system';
import Sidebar from './Sidebar';
import { 
  Search as SearchIcon,
  Send as SendIcon,
  QuestionAnswer as QuestionAnswerIcon,
  Refresh as RefreshIcon,
  HelpOutline as HelpOutlineIcon,
  Settings as SettingsIcon,
  Security as SecurityIcon,
  People as PeopleIcon,
  BarChart as BarChartIcon,
  Dashboard as DashboardIcon,
  MenuBook as MenuBookIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon
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
  userBlue: '#2196f3',
  adminPurple: '#9c27b0'
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

const ChatContainer = styled(Box)({
  display: 'flex',
  flexDirection: 'column',
  height: '60vh',
  backgroundColor: `${colors.background}`,
  borderRadius: '10px',
  border: `1px solid ${colors.borderColor}`,
  padding: '16px',
  marginBottom: '16px',
  overflow: 'hidden'
});

const MessagesContainer = styled(Box)({
  flexGrow: 1,
  overflowY: 'auto',
  marginBottom: '16px',
  padding: '8px',
  '&::-webkit-scrollbar': {
    width: '8px'
  },
  '&::-webkit-scrollbar-track': {
    backgroundColor: colors.background
  },
  '&::-webkit-scrollbar-thumb': {
    backgroundColor: colors.borderColor,
    borderRadius: '4px',
    '&:hover': {
      backgroundColor: colors.primary
    }
  }
});

const MessageBubble = styled(Box)(({ isUser }) => ({
  maxWidth: '75%',
  padding: '12px 16px',
  borderRadius: isUser ? '18px 18px 0 18px' : '18px 18px 18px 0',
  backgroundColor: isUser ? `${colors.primary}22` : colors.cardBg,
  border: `1px solid ${isUser ? colors.primary : colors.borderColor}`,
  marginBottom: '8px',
  alignSelf: isUser ? 'flex-end' : 'flex-start',
  wordBreak: 'break-word',
  position: 'relative'
}));

const FAQItem = styled(Box)({
  border: `1px solid ${colors.borderColor}`,
  borderRadius: '8px',
  marginBottom: '8px',
  overflow: 'hidden',
  transition: 'all 0.3s ease',
  '&:hover': {
    borderColor: colors.primary
  }
});

const FAQQuestion = styled(Box)({
  padding: '12px 16px',
  backgroundColor: colors.cardBg,
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  cursor: 'pointer'
});

const FAQAnswer = styled(Box)({
  padding: '16px',
  borderTop: `1px solid ${colors.borderColor}`,
  backgroundColor: `${colors.hoverBg}50`
});

// Sample FAQ data
const faqData = [
  {
    id: 1,
    question: "How do I manage user accounts?",
    answer: "Navigate to the User Management page from the sidebar. From there, you can view all users, search for specific users, filter by role or status, and suspend or activate accounts as needed.",
    category: "users"
  },
  {
    id: 2,
    question: "How can I monitor platform usage?",
    answer: "The Admin Dashboard provides real-time statistics about platform usage, including user counts, active symbols, and market trends. Check the System Overview section for server and API status.",
    category: "dashboard"
  },
  {
    id: 3,
    question: "How do I handle user support requests?",
    answer: "When users submit support tickets, they will appear in the Support section. You can review, respond, and mark them as resolved from there. Make sure to provide detailed and helpful responses.",
    category: "support"
  },
  {
    id: 4,
    question: "How can I add new forex pairs to the system?",
    answer: "Go to the System Settings page and select the 'Markets' tab. From there, you can add new forex pairs by specifying the base and quote currencies. The system will automatically start tracking the new pair.",
    category: "settings"
  },
  {
    id: 5,
    question: "What security features are available for administrators?",
    answer: "Administrators have access to two-factor authentication, login history tracking, and IP restriction features. Go to your profile settings to enable these security features for your admin account.",
    category: "security"
  },
  {
    id: 6,
    question: "How can I view system performance metrics?",
    answer: "The System Health section in the Admin Dashboard provides real-time information about server status, API response times, database performance, and overall system load.",
    category: "performance"
  },
  {
    id: 7,
    question: "How do I update the platform's terms of service?",
    answer: "Navigate to System Settings → Legal Documents. You can edit the terms of service, privacy policy, and other legal documents from there. Changes will be reflected immediately to all users.",
    category: "settings"
  }
];

// Sample chatbot responses
const botResponses = {
  greeting: "Hello! I'm your Admin Assistant. How can I help you today? You can ask me any questions about managing the MarketPulse platform.",
  fallback: "I'm not sure I understand that question. Could you try rephrasing it or select a topic from the suggestions below?",
  categories: {
    users: "What would you like to know about user management? I can help with account management, permissions, or user data.",
    security: "I can provide information about platform security, permissions, authentication, or data protection measures.",
    dashboard: "The dashboard shows key metrics about platform performance. What specific information are you looking for?",
    settings: "System settings control how the platform operates. What specific setting would you like to learn about?",
    support: "User support requests are managed through the support ticket system. What would you like to know about handling support?",
    performance: "I can help with understanding system performance metrics and optimization techniques."
  }
};

const suggestedQuestions = [
  "How do I add a new administrator?",
  "Where can I see login activity?",
  "How do I update market information?",
  "What analytics are available for user behavior?",
  "How do I reset a user's password?"
];

const AdminFAQ = () => {
  const [messages, setMessages] = useState([
    { text: botResponses.greeting, isUser: false, timestamp: new Date() }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [expandedFaq, setExpandedFaq] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredFaq, setFilteredFaq] = useState(faqData);
  const [activeCategory, setActiveCategory] = useState(null);
  
  const messagesEndRef = React.useRef(null);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (searchTerm) {
      setFilteredFaq(faqData.filter(item => 
        item.question.toLowerCase().includes(searchTerm.toLowerCase()) || 
        item.answer.toLowerCase().includes(searchTerm.toLowerCase())
      ));
    } else if (activeCategory) {
      setFilteredFaq(faqData.filter(item => item.category === activeCategory));
    } else {
      setFilteredFaq(faqData);
    }
  }, [searchTerm, activeCategory]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = () => {
    if (!input.trim()) return;
    
    // Add user message
    const userMessage = { text: input, isUser: true, timestamp: new Date() };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);
    
    // Simulate bot processing
    setTimeout(() => {
      let botResponse;
      
      // Simple keyword matching for demo
      const lowerInput = input.toLowerCase();
      if (lowerInput.includes('user') || lowerInput.includes('account') || lowerInput.includes('suspend')) {
        botResponse = findRelevantFaq('users');
      } else if (lowerInput.includes('security') || lowerInput.includes('password') || lowerInput.includes('authentication')) {
        botResponse = findRelevantFaq('security');
      } else if (lowerInput.includes('dashboard') || lowerInput.includes('metrics') || lowerInput.includes('statistics')) {
        botResponse = findRelevantFaq('dashboard');
      } else if (lowerInput.includes('settings') || lowerInput.includes('configuration') || lowerInput.includes('setup')) {
        botResponse = findRelevantFaq('settings');
      } else if (lowerInput.includes('support') || lowerInput.includes('help') || lowerInput.includes('ticket')) {
        botResponse = findRelevantFaq('support');
      } else if (lowerInput.includes('performance') || lowerInput.includes('speed') || lowerInput.includes('optimization')) {
        botResponse = findRelevantFaq('performance');
      } else {
        botResponse = { text: botResponses.fallback, isUser: false, timestamp: new Date(), showSuggestions: true };
      }
      
      setMessages(prev => [...prev, botResponse]);
      setLoading(false);
    }, 1000);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };

  const findRelevantFaq = (category) => {
    const relevantFaqs = faqData.filter(item => item.category === category);
    if (relevantFaqs.length > 0) {
      const randomIndex = Math.floor(Math.random() * relevantFaqs.length);
      const selectedFaq = relevantFaqs[randomIndex];
      return {
        text: `${selectedFaq.answer}\n\nWould you like to know more about ${category}?`,
        isUser: false,
        timestamp: new Date(),
        category: category
      };
    }
    return { text: botResponses.fallback, isUser: false, timestamp: new Date() };
  };

  const handleSuggestedQuestion = (question) => {
    setInput(question);
    // Auto send after short delay to simulate clicking
    setTimeout(() => {
      handleSendMessage();
    }, 100);
  };

  const handleCategoryClick = (category) => {
    setActiveCategory(category === activeCategory ? null : category);
    setSearchTerm('');
  };

  const toggleFaq = (id) => {
    setExpandedFaq(expandedFaq === id ? null : id);
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const categories = [
    { id: 'users', name: 'User Management', icon: <PeopleIcon /> },
    { id: 'dashboard', name: 'Dashboard', icon: <DashboardIcon /> },
    { id: 'security', name: 'Security', icon: <SecurityIcon /> },
    { id: 'settings', name: 'System Settings', icon: <SettingsIcon /> },
    { id: 'support', name: 'Support', icon: <QuestionAnswerIcon /> },
    { id: 'performance', name: 'Performance', icon: <BarChartIcon /> }
  ];

  return (
    <PageContainer>
      <Sidebar />
      <MainContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" sx={{ color: colors.primaryText, display: 'flex', alignItems: 'center', gap: 1 }}>
            <HelpOutlineIcon fontSize="large" sx={{ color: colors.primary }} />
            Admin FAQ & Support
          </Typography>
          <Tooltip title="Refresh">
            <IconButton 
              sx={{ 
                color: colors.primary,
                '&:hover': { backgroundColor: `${colors.primary}22` }
              }}
            >
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Box>

        <Grid container spacing={3}>
          {/* Left sidebar with categories and FAQ search */}
          <Grid item xs={12} md={3}>
            <Paper sx={{ p: 2, backgroundColor: colors.cardBg, borderRadius: '10px', border: `1px solid ${colors.borderColor}` }}>
              <Typography variant="h6" sx={{ mb: 2, color: colors.primaryText }}>FAQ Categories</Typography>
              
              <List component="nav" sx={{ mb: 3 }}>
                {categories.map((category) => (
                  <ListItem 
                    button 
                    key={category.id}
                    selected={activeCategory === category.id}
                    onClick={() => handleCategoryClick(category.id)}
                    sx={{
                      borderRadius: '8px',
                      mb: 0.5,
                      backgroundColor: activeCategory === category.id ? `${colors.primary}22` : 'transparent',
                      '&:hover': {
                        backgroundColor: activeCategory === category.id ? `${colors.primary}33` : colors.hoverBg
                      }
                    }}
                  >
                    <ListItemIcon sx={{ color: activeCategory === category.id ? colors.primary : colors.secondaryText, minWidth: '40px' }}>
                      {category.icon}
                    </ListItemIcon>
                    <ListItemText 
                      primary={category.name} 
                      primaryTypographyProps={{ 
                        color: activeCategory === category.id ? colors.primary : colors.primaryText,
                        fontWeight: activeCategory === category.id ? 'medium' : 'normal'
                      }} 
                    />
                  </ListItem>
                ))}
              </List>
              
              <Typography variant="h6" sx={{ mt: 3, mb: 2, color: colors.primaryText }}>Popular Questions</Typography>
              <List component="nav">
                {suggestedQuestions.slice(0, 3).map((question, index) => (
                  <ListItem 
                    button 
                    key={index}
                    onClick={() => handleSuggestedQuestion(question)}
                    sx={{
                      borderRadius: '8px',
                      mb: 0.5,
                      '&:hover': {
                        backgroundColor: colors.hoverBg
                      }
                    }}
                  >
                    <ListItemIcon sx={{ color: colors.secondary, minWidth: '40px' }}>
                      <MenuBookIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText 
                      primary={question} 
                      primaryTypographyProps={{ 
                        color: colors.primaryText,
                        fontSize: '0.9rem'
                      }} 
                    />
                  </ListItem>
                ))}
              </List>
            </Paper>
          </Grid>
          
          {/* Middle section with admin assistant chat */}
          <Grid item xs={12} md={5}>
            <Paper sx={{ p: 2, backgroundColor: colors.cardBg, borderRadius: '10px', border: `1px solid ${colors.borderColor}` }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar sx={{ bgcolor: colors.primary, mr: 1.5 }}>
                  <QuestionAnswerIcon />
                </Avatar>
                <Typography variant="h6" sx={{ color: colors.primaryText }}>Admin Assistant</Typography>
              </Box>
              
              <ChatContainer>
                <MessagesContainer>
                  {messages.map((message, index) => (
                    <Box 
                      key={index} 
                      sx={{ 
                        display: 'flex', 
                        flexDirection: 'column',
                        alignItems: message.isUser ? 'flex-end' : 'flex-start',
                        mb: 2
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                        {!message.isUser && (
                          <Avatar 
                            sx={{ 
                              width: 24, 
                              height: 24, 
                              bgcolor: colors.primary,
                              mr: 1,
                              fontSize: '0.8rem'
                            }}
                          >
                            A
                          </Avatar>
                        )}
                        <Typography variant="caption" sx={{ color: colors.secondaryText }}>
                          {message.isUser ? 'You' : 'Assistant'} • {formatTime(message.timestamp)}
                        </Typography>
                        {message.isUser && (
                          <Avatar 
                            sx={{ 
                              width: 24, 
                              height: 24, 
                              bgcolor: colors.secondary,
                              ml: 1,
                              fontSize: '0.8rem'
                            }}
                          >
                            A
                          </Avatar>
                        )}
                      </Box>
                      
                      <MessageBubble isUser={message.isUser}>
                        <Typography variant="body2" sx={{ color: colors.primaryText, whiteSpace: 'pre-line' }}>
                          {message.text}
                        </Typography>
                      </MessageBubble>
                      
                      {message.showSuggestions && (
                        <Box sx={{ alignSelf: 'flex-start', mt: 1, mb: 2 }}>
                          <Typography variant="caption" sx={{ color: colors.secondaryText, mb: 1, display: 'block' }}>
                            Try asking:
                          </Typography>
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                            {suggestedQuestions.map((question, idx) => (
                              <Chip 
                                key={idx}
                                label={question}
                                onClick={() => handleSuggestedQuestion(question)}
                                sx={{ 
                                  backgroundColor: `${colors.primary}22`,
                                  color: colors.primaryText,
                                  borderRadius: '16px',
                                  '&:hover': {
                                    backgroundColor: `${colors.primary}44`
                                  }
                                }}
                              />
                            ))}
                          </Box>
                        </Box>
                      )}
                      
                      {message.category && (
                        <Box sx={{ alignSelf: 'flex-start', mt: 1 }}>
                          <Button 
                            variant="outlined" 
                            size="small"
                            onClick={() => handleCategoryClick(message.category)}
                            sx={{ 
                              borderColor: colors.primary,
                              color: colors.primary,
                              '&:hover': {
                                backgroundColor: `${colors.primary}22`
                              }
                            }}
                          >
                            View related FAQs
                          </Button>
                        </Box>
                      )}
                    </Box>
                  ))}
                  {loading && (
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Avatar 
                        sx={{ 
                          width: 24, 
                          height: 24, 
                          bgcolor: colors.primary,
                          mr: 1,
                          fontSize: '0.8rem'
                        }}
                      >
                        A
                      </Avatar>
                      <Box sx={{ 
                        display: 'flex', 
                        alignItems: 'center',
                        backgroundColor: colors.cardBg,
                        borderRadius: '18px',
                        padding: '8px 16px',
                        border: `1px solid ${colors.borderColor}`
                      }}>
                        <CircularProgress size={16} sx={{ color: colors.primary, mr: 1 }} />
                        <Typography variant="body2" sx={{ color: colors.secondaryText }}>
                          Thinking...
                        </Typography>
                      </Box>
                    </Box>
                  )}
                  <div ref={messagesEndRef} />
                </MessagesContainer>
                
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <TextField
                    fullWidth
                    placeholder="Ask a question about admin features..."
                    variant="outlined"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    InputProps={{
                      sx: {
                        color: colors.primaryText,
                        backgroundColor: colors.hoverBg,
                        borderRadius: '24px',
                        '& .MuiOutlinedInput-notchedOutline': {
                          borderColor: colors.borderColor
                        },
                        '&:hover .MuiOutlinedInput-notchedOutline': {
                          borderColor: colors.primary
                        },
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                          borderColor: colors.primary
                        }
                      }
                    }}
                  />
                  <Button 
                    variant="contained" 
                    color="primary" 
                    onClick={handleSendMessage}
                    disabled={!input.trim()}
                    sx={{ 
                      borderRadius: '24px',
                      minWidth: '50px',
                      width: '50px',
                      height: '50px',
                      padding: 0
                    }}
                  >
                    <SendIcon />
                  </Button>
                </Box>
              </ChatContainer>
            </Paper>
          </Grid>
          
          {/* Right section with FAQ list */}
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 2, backgroundColor: colors.cardBg, borderRadius: '10px', border: `1px solid ${colors.borderColor}` }}>
              <Typography variant="h6" sx={{ mb: 2, color: colors.primaryText }}>
                {activeCategory ? `${categories.find(c => c.id === activeCategory)?.name} FAQs` : 'Frequently Asked Questions'}
              </Typography>
              
              <TextField
                fullWidth
                placeholder="Search FAQs..."
                variant="outlined"
                size="small"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                sx={{ mb: 2 }}
                InputProps={{
                  startAdornment: (
                    <SearchIcon sx={{ color: colors.secondaryText, mr: 1 }} />
                  ),
                  sx: {
                    color: colors.primaryText,
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: colors.borderColor
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: colors.primary
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: colors.primary
                    }
                  }
                }}
              />
              
              <Box sx={{ maxHeight: '60vh', overflowY: 'auto', pr: 1 }}>
                {filteredFaq.length > 0 ? (
                  filteredFaq.map((faq) => (
                    <FAQItem key={faq.id}>
                      <FAQQuestion onClick={() => toggleFaq(faq.id)}>
                        <Typography variant="body1" sx={{ color: colors.primaryText, fontWeight: expandedFaq === faq.id ? 'medium' : 'normal' }}>
                          {faq.question}
                        </Typography>
                        {expandedFaq === faq.id ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                      </FAQQuestion>
                      {expandedFaq === faq.id && (
                        <FAQAnswer>
                          <Typography variant="body2" sx={{ color: colors.secondaryText }}>
                            {faq.answer}
                          </Typography>
                          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                            <Chip 
                              label={faq.category} 
                              size="small"
                              sx={{ 
                                backgroundColor: `${colors.primary}22`,
                                color: colors.primaryText
                              }}
                              onClick={() => handleCategoryClick(faq.category)}
                            />
                          </Box>
                        </FAQAnswer>
                      )}
                    </FAQItem>
                  ))
                ) : (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <Typography variant="body1" sx={{ color: colors.secondaryText }}>
                      No FAQs match your search
                    </Typography>
                  </Box>
                )}
              </Box>
            </Paper>
          </Grid>
        </Grid>
      </MainContent>
    </PageContainer>
  );
};

export default AdminFAQ;