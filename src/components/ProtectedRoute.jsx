import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ element: Component, requiredRole, children }) => {
  // Try to get the user from localStorage
  let user;
  try {
    user = JSON.parse(localStorage.getItem('user'));
  } catch (e) {
    // If parsing fails, set user to null
    user = null;
  }
  
  if (!user) {
    return <Navigate to="/" replace />;
  }

  if (requiredRole && user.role !== requiredRole) {
    // Redirect to appropriate dashboard based on role
    if (user.role === 'admin') {
      return <Navigate to="/admin-dashboard" replace />;
    } else {
      return <Navigate to="/user-dashboard" replace />;
    }
  }

  // Return either the children or the Component based on what was provided
  return children ? children : <Component />;
};

export default ProtectedRoute; 