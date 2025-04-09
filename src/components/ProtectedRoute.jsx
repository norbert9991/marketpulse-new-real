import React, { useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { Box, Typography, CircularProgress } from '@mui/material';

const ProtectedRoute = ({ element: Component, requiredRole, children }) => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  
  // Try to get the user from localStorage
  let user;
  try {
    user = JSON.parse(localStorage.getItem('user'));
  } catch (e) {
    // If parsing fails, set user to null
    console.error("Failed to parse user from localStorage:", e);
    user = null;
  }
  
  useEffect(() => {
    // Log current route and authentication for debugging
    console.log("ProtectedRoute - Current path:", window.location.pathname);
    console.log("ProtectedRoute - User authenticated:", !!user);
    if (user) {
      console.log("ProtectedRoute - User role:", user.role);
    }
    
    // Set a small delay to let transitions happen more naturally
    const timer = setTimeout(() => {
      setIsLoading(false);
      
      // Handle redirection with useEffect
      if (!user) {
        console.log("ProtectedRoute - No user, redirecting to home");
        navigate('/', { replace: true });
      } else if (requiredRole && user.role !== requiredRole) {
        console.log(`ProtectedRoute - User role ${user.role} doesn't match required role ${requiredRole}`);
        if (user.role === 'admin') {
          navigate('/admin-dashboard', { replace: true });
        } else {
          navigate('/user-dashboard', { replace: true });
        }
      }
    }, 200);
    
    return () => clearTimeout(timer);
  }, [user, requiredRole, navigate]);
  
  // Show loading indicator while checking auth
  if (isLoading) {
    return (
      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column',
        alignItems: 'center', 
        justifyContent: 'center', 
        height: '100vh',
        backgroundColor: '#121212'
      }}>
        <CircularProgress />
        <Typography sx={{ mt: 2, color: '#fff' }}>
          Verifying access...
        </Typography>
      </Box>
    );
  }

  if (!user) {
    console.log("ProtectedRoute - Redirecting to /");
    return <Navigate to="/" replace />;
  }

  if (requiredRole && user.role !== requiredRole) {
    console.log(`ProtectedRoute - Redirecting to appropriate dashboard`);
    const redirectPath = user.role === 'admin' ? '/admin-dashboard' : '/user-dashboard';
    return <Navigate to={redirectPath} replace />;
  }

  // Return either the children or the Component based on what was provided
  console.log("ProtectedRoute - Rendering protected content");
  return children ? children : <Component />;
};

export default ProtectedRoute; 