import axios from 'axios';
import appConfig from './appConfig';
import tokenService from '../service/tokenService';

class HttpClient {
    constructor() {
        this.client = axios.create({
            baseURL: appConfig.api.baseUrl,
            timeout: appConfig.api.timeout,
            headers: {
                'Content-Type': 'application/json',
            },
        });

        this.setupInterceptors();
    }

    setupInterceptors() {
        // Intercepteur pour ajouter le token
        this.client.interceptors.request.use(
            config => {
                const token = tokenService.getToken();
                if (token) {
                    config.headers.Authorization = `Bearer ${token}`;
                }
                
                // Logging dynamique
                if (process.env.NODE_ENV === 'development') {
                    console.log(`🚀 ${config.method.toUpperCase()} ${config.url}`, config.data || '');
                }
                
                return config;
            },
            error => Promise.reject(error)
        );

        // Intercepteur pour gérer les erreurs
        this.client.interceptors.response.use(
            response => {
                if (process.env.NODE_ENV === 'development') {
                    console.log(`✅ ${response.status} ${response.config.url}`, response.data);
                }
                return response;
            },
            async error => {
                const originalRequest = error.config;

                // Gestion 401 - Token expiré
                if (error.response?.status === 401 && !originalRequest._retry) {
                    originalRequest._retry = true;

                    try {
                        const refreshResult = await tokenService.refreshToken();
                        if (refreshResult.success) {
                            originalRequest.headers.Authorization = `Bearer ${refreshResult.token}`;
                            return this.client(originalRequest);
                        }
                    } catch (refreshError) {
                        console.error('❌ Refresh token failed:', refreshError);
                    }

                    // Redirection vers login
                    window.location.href = appConfig.routes.login;
                }

                // Gestion 403 - Accès interdit
                if (error.response?.status === 403) {
                    console.error('⛔ Accès interdit');
                }

                // Gestion 413 - Fichier trop volumineux
                if (error.response?.status === 413) {
                    console.error('📁 Fichier trop volumineux');
                }

                return Promise.reject(error);
            }
        );
    }

    get(url, config = {}) {
        return this.client.get(url, config);
    }

    post(url, data, config = {}) {
        return this.client.post(url, data, config);
    }

    put(url, data, config = {}) {
        return this.client.put(url, data, config);
    }

    delete(url, config = {}) {
        return this.client.delete(url, config);
    }

    upload(url, file, onProgress = null) {
        const formData = new FormData();
        formData.append('file', file);

        const config = {
            headers: { 'Content-Type': 'multipart/form-data' },
        };

        if (onProgress) {
            config.onUploadProgress = (progressEvent) => {
                const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                onProgress(percentCompleted);
            };
        }

        return this.client.post(url, formData, config);
    }
}

export default new HttpClient();