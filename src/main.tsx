// 🛡️ Double-safety self-healing wrapper to prevent "Cannot set property fetch of #<Window> which has only a getter"
try {
  const descriptor = Object.getOwnPropertyDescriptor(window, 'fetch');
  if (window && (!descriptor || !descriptor.writable)) {
    let customFetch = window.fetch;
    Object.defineProperty(window, 'fetch', {
      get: () => customFetch,
      set: (val) => { customFetch = val; },
      configurable: true,
      enumerable: true
    });
  }
} catch (e) {
  console.warn("[Self-Heal Web] Unable to redefine window.fetch. Active guard established to prevent crashing.", e);
}

import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
