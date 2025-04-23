import React, { createContext, useContext, useState } from 'react';
import { Snackbar, Alert } from '@mui/material';

// Create the context
const ToastContext = createContext();

// Hook to use the toast context
export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

// Toast provider component
export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  // Add a new toast
  const addToast = (type, message, duration = 3000) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, type, message, duration, open: true }]);
    return id;
  };

  // Remove a toast
  const removeToast = (id) => {
    setToasts(prev => prev.map(toast => 
      toast.id === id ? { ...toast, open: false } : toast
    ));
  };

  // Helper functions for different toast types
  const toast = {
    success: (message, duration) => addToast('success', message, duration),
    error: (message, duration) => addToast('error', message, duration),
    warning: (message, duration) => addToast('warning', message, duration),
    info: (message, duration) => addToast('info', message, duration),
  };

  // Handle toast close
  const handleClose = (id) => {
    removeToast(id);
    
    // Remove from state after animation completes
    setTimeout(() => {
      setToasts(prev => prev.filter(toast => toast.id !== id));
    }, 300);
  };

  // Test toast function definitions to be used during development
  const testToast = () => {
    toast.success("This is a test success message");
    toast.error("This is a test error message");
    toast.warning("This is a test warning message");
    toast.info("This is a test info message");
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      
      {/* Render all active toasts */}
      {toasts.map((toast) => (
        <Snackbar
          key={toast.id}
          open={toast.open}
          autoHideDuration={toast.duration}
          onClose={() => handleClose(toast.id)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          sx={{ mb: toasts.indexOf(toast) * 8 }}
        >
          <Alert 
            onClose={() => handleClose(toast.id)} 
            severity={toast.type} 
            variant="filled"
            sx={{ width: '100%' }}
          >
            {toast.message}
          </Alert>
        </Snackbar>
      ))}
    </ToastContext.Provider>
  );
};

export default ToastContext; 