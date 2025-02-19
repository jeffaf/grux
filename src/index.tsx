import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css'; // Import global styles

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);
root.render(<App />); // Removed StrictMode temporarily for debugging