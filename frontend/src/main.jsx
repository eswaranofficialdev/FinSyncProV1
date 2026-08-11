import React from 'react';
import ReactDOM from 'react-dom/client';

import App from './App.jsx';

import './styles/variables.css';
import './styles/global.css';


/*
 * Prevent number inputs from changing
 * when using the mouse wheel.
 */
window.addEventListener(
  'wheel',
  () => {
    if (document.activeElement?.type === 'number') {
      document.activeElement.blur();
    }
  },
  { passive: true }
);


ReactDOM.createRoot(
  document.getElementById('root')
).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);