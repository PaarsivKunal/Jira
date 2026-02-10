import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <App />
)

// Service worker registration is handled automatically by vite-plugin-pwa
// The plugin will inject the registration code during build

