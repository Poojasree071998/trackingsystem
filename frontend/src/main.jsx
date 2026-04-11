import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { ThemeProvider } from './context/ThemeContext.jsx'
import './index.css'
import ErrorBoundary from './components/ErrorBoundary.jsx'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <ThemeProvider>
        {/* PROD SYNC: 2026-04-10-STABLE */}
        <App />
      </ThemeProvider>
    </ErrorBoundary>
  </React.StrictMode>,
)
