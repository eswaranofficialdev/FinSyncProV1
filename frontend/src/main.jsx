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


/* ========================================================
   PWA SERVICE WORKER
   ======================================================== */

if ('serviceWorker' in navigator) {

  window.addEventListener('load', async () => {

    try {

      const registration =
        await navigator.serviceWorker.register('/sw.js', {
          scope: '/',
        });

      console.log(
        'ServiceWorker registration successful:',
        registration
      );


      /*
       * Wait until the service worker controls
       * the current page.
       */
      if (!navigator.serviceWorker.controller) {

        console.log(
          '[PWA] Waiting for service worker to control page...'
        );

        navigator.serviceWorker.addEventListener(
          'controllerchange',
          () => {

            console.log(
              '[PWA] Service worker is now controlling the page'
            );

          },
          { once: true }
        );

      } else {

        console.log(
          '[PWA] Service worker is already controlling the page'
        );

      }

    } catch (error) {

      console.error(
        'ServiceWorker registration failed:',
        error
      );

    }

  });

}


/* ========================================================
   REACT
   ======================================================== */

ReactDOM.createRoot(
  document.getElementById('root')
).render(

  <React.StrictMode>
    <App />
  </React.StrictMode>

);
