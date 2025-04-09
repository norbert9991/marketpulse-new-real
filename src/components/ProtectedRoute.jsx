import React, { useEffect } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';

const ProtectedRoute = ({ element: Component, requiredRole, children }) => {
  const navigate = useNavigate();
  
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
    
    // Handle redirection with useEffect for problematic cases
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
  }, [user, requiredRole, navigate]);
  
  if (!user) {
    console.log("ProtectedRoute - Rendering Navigate to /");
    // Fallback to direct location change if router navigate fails
    if (window.location.pathname !== '/') {
      window.location.href = window.location.origin + '/#/';
    }
    return <Navigate to="/" replace />;
  }

  if (requiredRole && user.role !== requiredRole) {
    console.log(`ProtectedRoute - Rendering Navigate to ${user.role === 'admin' ? '/admin-dashboard' : '/user-dashboard'}`);
    // Redirect to appropriate dashboard based on role
    const redirectPath = user.role === 'admin' ? '/admin-dashboard' : '/user-dashboard';
    
    // Fallback to direct location change if router navigate fails
    if (window.location.pathname !== redirectPath) {
      window.location.href = window.location.origin + '/#' + redirectPath;
    }
    
    return <Navigate to={redirectPath} replace />;
  }

  // Return either the children or the Component based on what was provided
  console.log("ProtectedRoute - Rendering protected content");
  return children ? children : <Component />;
};

export default ProtectedRoute; 