import React from 'react';
import ReactDOM from 'react-dom/client';
import AuthCallback from './AuthCallback';

const root = ReactDOM.createRoot(document.getElementById('root')!);
root.render(
  <React.StrictMode>
    <AuthCallback />
  </React.StrictMode>
);
