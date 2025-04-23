import React from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './frontend/LandingPage/Home';
import { CssBaseline, ThemeProvider, createTheme } from '@mui/material';
import AdminDashboard from './Admin/admin-dashboard';
import UserDashboard from './User/user-dashboard';
import UserManagement from './Admin/UserManagement';
import TransactionPage from './Admin/TransactionPage';
import ReportPage from './Admin/ReportPage';
import Trade from './User/trade';
import Market from './User/market';
import ForexNews from './User/ForexNews';
import ProtectedRoute from './components/ProtectedRoute';
import Settings from './User/settings';
import AdminSettings from './Admin/adminsettings';
import { ToastProvider } from './User/ToastContext';

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
      <ToastProvider>
        <CssBaseline /> {/* Normalize CSS and apply baseline styles */}
        <Router>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/home" element={<Home />} />
            
            {/* Admin Routes */}
            <Route 
              path="/admin-dashboard" 
              element={
                <ProtectedRoute requiredRole="admin">
                  <AdminDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/UserManagement" 
              element={
                <ProtectedRoute requiredRole="admin">
                  <UserManagement />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/TransactionPage" 
              element={
                <ProtectedRoute requiredRole="admin">
                  <TransactionPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/ReportPage" 
              element={
                <ProtectedRoute requiredRole="admin">
                  <ReportPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/adminsettings" 
              element={
                <ProtectedRoute requiredRole="admin">
                  <AdminSettings />
                </ProtectedRoute>
              }
            />
            
            {/* User Routes */}
            <Route 
              path="/user-dashboard" 
              element={
                <ProtectedRoute>
                  <UserDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/trade" 
              element={
                <ProtectedRoute>
                  <Trade />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/market" 
              element={
                <ProtectedRoute>
                  <Market />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/forex-news" 
              element={
                <ProtectedRoute>
                  <ForexNews />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/settings" 
              element={
                <ProtectedRoute>
                  <Settings />
                </ProtectedRoute>
              } 
            />
          </Routes>
        </Router>
      </ToastProvider>
    </ThemeProvider>
  );
}

export default App;