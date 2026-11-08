import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { applyTheme, getTheme } from './theme'

// Peint le theme avant le premier rendu : sans cela, une console sombre ouvre un fond blanc le temps
// que React monte, et l'iframe clignote a chaque rechargement.
applyTheme(getTheme())

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
