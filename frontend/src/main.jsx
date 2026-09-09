import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { VSMProvider } from './context/Context';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <VSMProvider>
      <App />
    </VSMProvider>
  </React.StrictMode>
);
