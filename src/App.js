import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './frontend/LandingPage/Home';
import { CssBaseline, ThemeProvider, createTheme } from '@mui/material';
import AdminDashboard from './Admin/admin-dashboard';
import UserDashboard from './User/user-dashboard';
import UserManagement from './Admin/UserManagement';
import TransactionPage from './Admin/TransactionPage';
import Trade from './User/trade';
import Market from './User/market';
import ProtectedRoute from './components/ProtectedRoute';
import Settings from './User/settings';
import AdminSettings from './Admin/adminsettings';

// Create a custom theme
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2', // Blue color for primary buttons and elements
    },
    secondary: {
      main: '#dc004e', // Pink color for secondary elements
    },
    background: {
      default: '#f5f5f5', // Light gray background
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontWeight: 700,
      fontSize: '2.5rem',
    },
    h2: {
      fontWeight: 600,
      fontSize: '2rem',
    },
    // Add more typography customizations as needed
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline /> {/* Normalize CSS and apply baseline styles */}
      <Router>
        <Routes>
          <Route path="/home" element={<Home />} />
          <Route 
            path="/user-dashboard" 
            element={<ProtectedRoute element={UserDashboard} />} 
          />
          <Route 
            path="/admin-dashboard" 
            element={<ProtectedRoute element={AdminDashboard} requiredRole="admin" />} 
          />
          <Route 
            path="/UserManagement" 
            element={<ProtectedRoute element={UserManagement} requiredRole="admin" />} 
          />
          <Route 
            path="/TransactionPage" 
            element={<ProtectedRoute element={TransactionPage} requiredRole="admin" />} 
          />
          <Route 
            path="/trade" 
            element={<ProtectedRoute element={Trade} />} 
          />
          <Route 
            path="/market" 
            element={<ProtectedRoute element={Market} />} 
          />
          <Route 
            path="/settings" 
            element={<ProtectedRoute element={Settings} />} 
          />
          <Route
            path="/adminsettings"
            element={<ProtectedRoute element={AdminSettings} requiredRole="admin" />}
          />
          {/* Add more routes as needed */}
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;