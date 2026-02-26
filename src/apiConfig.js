// src/config/apiConfig.js
import axios from 'axios';

// Utilisez la variable d'environnement avec fallback à 8081 (pas 8080)
// leave baseURL blank so we rely on CRA proxy configuration
const API_BASE_URL = process.env.REACT_APP_API_URL || '';

// Créer une instance Axios avec configuration par défaut
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Intercepteur pour les requêtes
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Empêcher le cache pour les requêtes GET
    if (config.method === 'get') {
      config.params = {
        ...config.params,
        _t: Date.now(), // Timestamp pour éviter le cache
      };
      config.headers['Cache-Control'] = 'no-cache';
      config.headers['Pragma'] = 'no-cache';
    }
    
    console.log(`Making ${config.method?.toUpperCase()} request to: ${config.baseURL}${config.url}`);
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Intercepteur pour les réponses
apiClient.interceptors.response.use(
  (response) => {
    console.log(`Response received: ${response.status} from ${response.config.url}`);
    return response;
  },
  (error) => {
    console.error('API Error:', error.response?.status, error.response?.data);
    
    if (error.response?.status === 304) {
      console.log('304 Not Modified - C\'est normal pour les requêtes conditionnelles');
      return Promise.resolve(error.response);
    }
    
    if (error.response?.status === 401) {
      console.log('Token expiré ou invalide, redirection vers login');
      localStorage.removeItem('token');
      localStorage.removeItem('currentUser');
      window.location.href = '/login';
    }
    
    return Promise.reject(error);
  }
);

export default apiClient;