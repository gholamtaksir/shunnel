import React from 'react'
import { createRoot } from 'react-dom/client'

// Self-hosted fonts (offline-friendly): Inter for Latin, Vazirmatn for Persian.
import '@fontsource/inter/400.css'
import '@fontsource/inter/500.css'
import '@fontsource/inter/600.css'
import '@fontsource/vazirmatn/400.css'
import '@fontsource/vazirmatn/500.css'
import '@fontsource/vazirmatn/600.css'

import './style.css'
import './i18n'
import App from './App'

const container = document.getElementById('root')!
const root = createRoot(container)

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
