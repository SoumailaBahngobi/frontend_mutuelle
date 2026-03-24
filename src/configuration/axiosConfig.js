import axios from 'axios';
import authService from '../service/authService';

const setupAxiosInterceptors = () => {
    // Intercepteur pour les requêtes
    axios.interceptors.request.use(
        (config) => {
            const token = authService.getToken();
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
                console.log('Token ajouté au header:', token.substring(0, 20) + '...');
            } else {
                console.warn(' Aucun token trouvé dans localStorage');
            }
            return config;
        },
        (error) => {
            console.error('Erreur intercepteur requête:', error);
            return Promise.reject(error);
        }
    );

    // Intercepteur pour les réponses
    axios.interceptors.response.use(
        (response) => response,
        async (error) => {
            const originalRequest = error.config;
            console.error('Erreur axios:', error.response?.status, error.config?.url);

            // Si erreur 401 et pas déjà tenté de rafraîchir
            if (error.response?.status === 401 && !originalRequest._retry) {
                console.warn('Token expiré (401), tentative de rafraîchissement...');
                originalRequest._retry = true;

                try {
                    // Tenter de rafraîchir le token
                    const refreshResult = await authService.refreshToken();
                    
                    if (refreshResult.success) {
                        console.log('Token rafraîchi avec succès');
                        // Mettre à jour le token dans la requête originale
                        originalRequest.headers.Authorization = `Bearer ${refreshResult.token}`;
                        // Réessayer la requête
                        return axios(originalRequest);
                    }
                } catch (refreshError) {
                    console.error('Erreur de rafraîchissement:', refreshError);
                }

                // Si le rafraîchissement échoue, déconnecter l'utilisateur
                console.error('Déconnexion de l\'utilisateur - redirection vers /login');
                authService.logout();
                window.location.href = '/login';
            }

            return Promise.reject(error);
        }
    );
};

export default setupAxiosInterceptors;
