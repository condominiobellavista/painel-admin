import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from '@/context/AuthContext'
import { MoradorProvider } from '@/context/MoradorContext'
import App from '@/App'
import '@/index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <MoradorProvider>
          <App />
        </MoradorProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)
