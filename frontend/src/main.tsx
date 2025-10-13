import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Add debugging
console.log('main.tsx: Starting app');

// Check if root element exists
const rootElement = document.getElementById('root');
if (!rootElement) {
  console.error('main.tsx: Root element not found!');
} else {
  console.log('main.tsx: Root element found');
  createRoot(rootElement).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
}