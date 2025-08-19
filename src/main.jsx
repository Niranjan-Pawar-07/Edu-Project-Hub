import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom' // for routing
import App from './App';
import './index.css'
import { AuthProvider } from './contexts/AuthContext';  // Ensure correct path

ReactDOM.createRoot(document.getElementById('root')).render(
  <AuthProvider>
    <App />
  </AuthProvider>
);
