// src/config/axiosConfig.js
import axios from 'axios';
import authService from '../services/authService';

const setupAxiosInterceptors = () => {
    // Intercepteur pour les requêtes
    axios.interceptors.request.use(
        (config) => {
            const token = authService.getToken();
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
            return config;
        },
        (error) => {
            return Promise.reject(error);
        }
    );

    // Intercepteur pour les réponses
    axios.interceptors.response.use(
        (response) => response,
        async (error) => {
            const originalRequest = error.config;

            // Si erreur 401 et pas déjà tenté de rafraîchir
            if (error.response?.status === 401 && !originalRequest._retry) {
                originalRequest._retry = true;

                try {
                    // Tenter de rafraîchir le token
                    const refreshResult = await authService.refreshToken();
                    
                    if (refreshResult.success) {
                        // Mettre à jour le token dans la requête originale
                        originalRequest.headers.Authorization = `Bearer ${refreshResult.token}`;
                        // Réessayer la requête
                        return axios(originalRequest);
                    }
                } catch (refreshError) {
                    console.error('Erreur de rafraîchissement:', refreshError);
                }

                // Si le rafraîchissement échoue, déconnecter l'utilisateur
                authService.logout();
                window.location.href = '/login';
            }

            return Promise.reject(error);
        }
    );
};

export default setupAxiosInterceptors;
