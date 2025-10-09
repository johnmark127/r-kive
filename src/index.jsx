import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import './sidebar-hide-scrollbar.css';
import App from './App.jsx';

// Suppress Supabase multiple instance warning in development
if (import.meta.env.DEV) {
  const originalWarn = console.warn;
  console.warn = (...args) => {
    const message = args.join(' ');
    if (message.includes('Multiple GoTrueClient instances detected')) {
      // Suppress this specific warning in development
      return;
    }
    originalWarn.apply(console, args);
  };
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
