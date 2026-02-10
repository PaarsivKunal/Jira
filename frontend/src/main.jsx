import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { registerSW } from 'virtual:pwa-register'

ReactDOM.createRoot(document.getElementById('root')).render(
  <App />
)

// Register service worker for PWA
const updateSW = registerSW({
  immediate: true,
  onNeedRefresh() {
    // New content available, will be handled by UpdateNotification component
    console.log('New content available, refresh needed');
  },
  onOfflineReady() {
    console.log('App ready to work offline');
  },
  onRegistered(registration) {
    if (import.meta.env.DEV) {
      console.log('Service Worker registered:', registration);
    }
  },
  onRegisterError(error) {
    console.error('Service Worker registration error:', error);
  },
})

