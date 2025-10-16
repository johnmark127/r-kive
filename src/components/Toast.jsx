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

  // Check if screen is mobile (below 640px)
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 640;

  return (
    <div
      className={`toast ${type} ${isVisible ? 'show' : ''}`}
      style={{
        position: 'fixed',
        top: isMobile ? '12px' : '20px',
        right: isMobile ? '12px' : '20px',
        left: isMobile ? '12px' : 'auto',
        background: 'white',
        color: '#333',
        padding: isMobile ? '12px 16px' : '16px 24px',
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        zIndex: 9999,
        borderLeft: `4px solid ${getColor()}`,
        display: 'flex',
        alignItems: 'center',
        minWidth: isMobile ? 'auto' : '300px',
        maxWidth: isMobile ? 'calc(100vw - 24px)' : '500px',
        transform: isVisible ? 'translateX(0)' : 'translateX(120%)',
        transition: 'transform 0.3s ease-in-out',
      }}
    >
      <span
        style={{
          marginRight: isMobile ? '8px' : '12px',
          color: getColor(),
          fontSize: isMobile ? '16px' : '18px',
          fontWeight: 'bold',
          flexShrink: 0,
        }}
      >
        {getIcon()}
      </span>
      <span style={{ 
        flexGrow: 1, 
        fontSize: isMobile ? '13px' : '14px',
        lineHeight: '1.4',
        wordBreak: 'break-word'
      }}>
        {message}
      </span>
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
          fontSize: isMobile ? '16px' : '18px',
          padding: isMobile ? '4px' : '0',
          marginLeft: isMobile ? '8px' : '12px',
          flexShrink: 0,
          borderRadius: '4px',
          minWidth: isMobile ? '24px' : 'auto',
          minHeight: isMobile ? '24px' : 'auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        ×
      </button>
    </div>
  );
};

export default Toast;
