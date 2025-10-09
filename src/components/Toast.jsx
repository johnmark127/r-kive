import React, { useState, useEffect } from 'react';

const Toast = ({ message, type, onClose, duration = 5000 }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 300); // Wait for animation to complete
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const getIcon = () => {
    switch (type) {
      case 'success':
        return '✓';
      case 'error':
        return '✕';
      case 'warning':
        return '⚠';
      case 'info':
        return 'ℹ';
      default:
        return '✓';
    }
  };

  const getColor = () => {
    switch (type) {
      case 'success':
        return '#4CAF50';
      case 'error':
        return '#f44336';
      case 'warning':
        return '#ff9800';
      case 'info':
        return '#2196f3';
      default:
        return '#4CAF50';
    }
  };

  return (
    <div
      className={`toast ${type} ${isVisible ? 'show' : ''}`}
      style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        background: 'white',
        color: '#333',
        padding: '16px 24px',
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        zIndex: 9999,
        borderLeft: `4px solid ${getColor()}`,
        display: 'flex',
        alignItems: 'center',
        minWidth: '300px',
        maxWidth: '500px',
        transform: isVisible ? 'translateX(0)' : 'translateX(120%)',
        transition: 'transform 0.3s ease-in-out',
      }}
    >
      <span
        style={{
          marginRight: '12px',
          color: getColor(),
          fontSize: '18px',
          fontWeight: 'bold',
        }}
      >
        {getIcon()}
      </span>
      <span style={{ flexGrow: 1, fontSize: '14px' }}>{message}</span>
      <button
        onClick={() => {
          setIsVisible(false);
          setTimeout(onClose, 300);
        }}
        style={{
          background: 'none',
          border: 'none',
          color: '#666',
          cursor: 'pointer',
          fontSize: '18px',
          padding: '0',
          marginLeft: '12px',
        }}
      >
        ×
      </button>
    </div>
  );
};

export default Toast;
