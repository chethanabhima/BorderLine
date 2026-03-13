import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import { AuthProvider } from './context/AuthContext';
import './index.css';

console.log("Loading main.jsx");

const rootElement = document.getElementById('root');
if (!rootElement) {
  console.error("Failed to find the root element");
} else {
  console.log("Found root element, calling createRoot");
  try {
    const root = createRoot(rootElement);
    root.render(
      <React.StrictMode>
        <AuthProvider>
          <App />
        </AuthProvider>
      </React.StrictMode>
    );
    console.log("Render function called successfully");
  } catch (err) {
    console.error("Error during React mount:", err);
  }
}
