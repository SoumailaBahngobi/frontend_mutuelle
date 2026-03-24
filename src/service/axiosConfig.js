import axios from 'axios';
import tokenService from '../service/tokenService';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8081';

const apiClient = axios.create({
    baseURL: API_URL,
    timeout: 30000,
    headers: {
        'Content-Type': 'application/json',
    },
});

// File d'attente pour les requêtes pendant le rafraîchissement
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
    failedQueue.forEach(prom => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve(token);
        }
    });
    failedQueue = [];
};

// Intercepteur pour les requêtes
apiClient.interceptors.request.use(
    async (config) => {
        // Vérifier si le token est expiré
        if (tokenService.isTokenExpired()) {
            const timeUntilExpiry = tokenService.getTimeUntilExpiry();
            
            // Si le token est expiré ou va expirer dans moins de 30 secondes
            if (timeUntilExpiry <= 30000) {
                try {
                    const result = await tokenService.refreshToken();
                    if (result.success) {
                        config.headers.Authorization = `Bearer ${result.token}`;
                    } else {
                        tokenService.logout();
                        throw new Error('Session expirée');
                    }
                } catch (error) {
                    return Promise.reject(error);
                }
            }
        } else {
            // Token valide, ajouter l'en-tête
            const token = tokenService.getToken();
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
        }
        
        return config;
    },
    (error) => Promise.reject(error)
);

// Intercepteur pour les réponses
apiClient.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // Si erreur 401 et pas déjà tenté de rafraîchir
        if (error.response?.status === 401 && !originalRequest._retry) {
            
            // Vérifier si c'est une erreur d'expiration
            if (tokenService.isTokenExpired()) {
                
                if (isRefreshing) {
                    // Si déjà en train de rafraîchir, mettre en file d'attente
                    return new Promise((resolve, reject) => {
                        failedQueue.push({ resolve, reject });
                    })
                    .then(token => {
                        originalRequest.headers.Authorization = `Bearer ${token}`;
                        return apiClient(originalRequest);
                    })
                    .catch(err => Promise.reject(err));
                }

                originalRequest._retry = true;
                isRefreshing = true;

                try {
                    const refreshResult = await tokenService.refreshToken();
                    
                    if (refreshResult.success) {
                        processQueue(null, refreshResult.token);
                        originalRequest.headers.Authorization = `Bearer ${refreshResult.token}`;
                        return apiClient(originalRequest);
                    } else {
                        processQueue(new Error('Refresh token failed'), null);
                        tokenService.logout();
                        return Promise.reject(error);
                    }
                } catch (refreshError) {
                    processQueue(refreshError, null);
                    tokenService.logout();
                    return Promise.reject(refreshError);
                } finally {
                    isRefreshing = false;
                }
            }
        }

        return Promise.reject(error);
    }
);

export default apiClient;