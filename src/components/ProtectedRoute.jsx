import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ element: Component, requiredRole }) => {
  const user = JSON.parse(localStorage.getItem('user'));
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && user.role !== requiredRole) {
    return <Navigate to="/home" replace />;
  }

  return <Component />;
};

export default ProtectedRoute; 