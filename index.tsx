
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import AdminApp from './AdminApp';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);

// Simple client-side routing check
const path = window.location.pathname;

if (path.startsWith('/admin')) {
    root.render(
        <React.StrictMode>
            <AdminApp />
        </React.StrictMode>
    );
} else {
    root.render(
        <React.StrictMode>
            <App />
        </React.StrictMode>
    );
}
