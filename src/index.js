import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { KeycloakProvider } from './context/KeycloakContext';
import setupAxiosInterceptors from './configuration/axiosConfig';
import App from './App';
import './index.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';

// Configurer les intercepteurs Axios
setupAxiosInterceptors();

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <KeycloakProvider>
        <App />
      </KeycloakProvider>
    </BrowserRouter>
  </React.StrictMode>
);