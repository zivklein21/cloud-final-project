import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { GoogleOAuthProvider } from '@react-oauth/google'

createRoot(document.getElementById('root')!).render(
  <GoogleOAuthProvider
    clientId = "575942882016-fg711rej42mvgcnesm0n0vpt4s591ffr.apps.googleusercontent.com">
    <StrictMode>
      <App />
    </StrictMode>,
  </GoogleOAuthProvider>
)
