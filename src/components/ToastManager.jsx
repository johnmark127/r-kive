import React, { useState, useCallback } from 'react';
import Toast from './Toast';

const ToastManager = () => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info', duration = 5000) => {
    const id = Date.now() + Math.random();
    const newToast = { id, message, type, duration };
    
    setToasts(prevToasts => [...prevToasts, newToast]);
    
    return id;
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prevToasts => prevToasts.filter(toast => toast.id !== id));
  }, []);

  // Expose addToast function globally
  React.useEffect(() => {
    window.showToast = addToast;
    return () => {
      delete window.showToast;
    };
  }, [addToast]);

  return (
    <div style={{ position: 'fixed', top: 0, right: 0, zIndex: 9999 }}>
      {toasts.map((toast, index) => (
        <div
          key={toast.id}
          style={{
            marginBottom: '10px',
            marginTop: index === 0 ? '20px' : '0',
          }}
        >
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => removeToast(toast.id)}
            duration={toast.duration}
          />
        </div>
      ))}
    </div>
  );
};

// Hook to use toast in components
export const useToast = () => {
  return {
    showToast: (message, type = 'info', duration = 5000) => {
      if (window.showToast) {
        return window.showToast(message, type, duration);
      }
      console.warn('ToastManager not initialized');
    }
  };
};

export default ToastManager;
