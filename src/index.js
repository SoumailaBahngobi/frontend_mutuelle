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
<<<<<<< HEAD

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
=======
>>>>>>> 0ca80779bd2df063c6c22313cd408bc6f07a9320
