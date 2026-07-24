import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.tsx'

// Applique le mode sombre au chargement (préférence système par défaut, sinon choix persisté)
const themeStocke = localStorage.getItem('nutriscan-theme')
const preferesombre = window.matchMedia('(prefers-color-scheme: dark)').matches
if (themeStocke === 'dark' || (!themeStocke && preferesombre)) {
  document.documentElement.classList.add('dark')
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
