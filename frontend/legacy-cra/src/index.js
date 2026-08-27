import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

// Обработчик ошибок для предотвращения крашей
// eslint-disable-next-line no-unused-vars
const handleError = (error, errorInfo) => {
  console.error('React Error Boundary caught an error:', error, errorInfo);
};

// Обработчик необработанных ошибок
window.addEventListener('error', (event) => {
  console.error('Unhandled error:', event.error);
});

// Обработчик необработанных промисов
window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
});

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);