import axios from 'axios';
import authService from '../service/authService';
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8081';

const apiClient = axios.create({
    baseURL: API_URL,
    timeout: 30000,
    headers: { 'Content-Type': 'application/json' }
});

// Intercepteur pour ajouter le token
apiClient.interceptors.request.use(
    config => {
        const token = authService.getToken();
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    error => Promise.reject(error)
);

// Intercepteur pour gérer les erreurs
apiClient.interceptors.response.use(
    response => response,
    async error => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            try {
                const refreshResult = await authService.refreshToken();
                if (refreshResult.success) {
                    originalRequest.headers.Authorization = `Bearer ${refreshResult.token}`;
                    return apiClient(originalRequest);
                }
            } catch (refreshError) {
                console.error('Refresh failed:', refreshError);
            }

            authService.logout();
        }

        return Promise.reject(error);
    }
);

export default apiClient;