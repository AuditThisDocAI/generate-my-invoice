import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import './i18n.ts';
import App from './App.tsx';
import './index.css';

// Register Service Worker for offline support
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('🚀 offline Service Worker registered:', registration.scope);
      })
      .catch((err) => {
        console.warn('⚠️ Service Worker registration failed:', err);
      });
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
