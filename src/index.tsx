import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// Enable more detailed console logging in development
if (process.env.NODE_ENV === 'development') {
  console.warn = (...args) => {
    const stack = new Error().stack;
    console.log('%c[WARN]', 'color: orange; font-weight: bold', ...args);
    console.log('%c[STACK]', 'color: gray', stack);
  };
}

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);
root.render(<App />);