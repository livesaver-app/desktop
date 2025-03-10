import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './main.css'
import { AuthProvider } from './hooks/use-auth'

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </React.StrictMode>
)
