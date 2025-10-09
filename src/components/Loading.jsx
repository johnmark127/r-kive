import React from 'react';

const Loading = ({ size = 'medium', overlay = false, message = 'Loading...' }) => {
  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return { width: '20px', height: '20px', borderWidth: '2px' };
      case 'large':
        return { width: '60px', height: '60px', borderWidth: '6px' };
      default:
        return { width: '40px', height: '40px', borderWidth: '4px' };
    }
  };

  const spinnerStyles = {
    ...getSizeStyles(),
    border: `${getSizeStyles().borderWidth} solid #f3f3f3`,
    borderTop: `${getSizeStyles().borderWidth} solid #007bff`,
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  };

  const overlayStyles = {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9998,
  };

  const containerStyles = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '12px',
  };

  const messageStyles = {
    color: overlay ? 'white' : '#333',
    fontSize: '14px',
    fontWeight: '500',
  };

  const content = (
    <div style={containerStyles}>
      <div style={spinnerStyles}></div>
      {message && <div style={messageStyles}>{message}</div>}
    </div>
  );

  return (
    <>
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
      {overlay ? (
        <div style={overlayStyles}>
          {content}
        </div>
      ) : (
        content
      )}
    </>
  );
};

export default Loading;
