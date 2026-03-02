// src/services/authService.js
import axios from 'axios';

const KEYCLOAK_URL = process.env.REACT_APP_KEYCLOAK_URL || 'http://localhost:8088';
const REALM = process.env.REACT_APP_KEYCLOAK_REALM || 'mutuelle-realm';
const CLIENT_ID = process.env.REACT_APP_KEYCLOAK_CLIENT_ID || 'mutuelle-client';
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8081';

class AuthService {
    async login(email, password) {
        try {
            // 1. Obtenir le token de Keycloak
            const tokenResponse = await axios.post(
                `${KEYCLOAK_URL}/realms/${REALM}/protocol/openid-connect/token`,
                new URLSearchParams({
                    'client_id': CLIENT_ID,
                    'grant_type': 'password',
                    'username': email,
                    'password': password
                }),
                {
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded'
                    }
                }
            );

            const { access_token, refresh_token, expires_in } = tokenResponse.data;

            // 2. Stocker les tokens
            localStorage.setItem('token', access_token);
            localStorage.setItem('refresh_token', refresh_token);
            
            // 3. Décoder le token pour les infos de base
            const tokenData = JSON.parse(atob(access_token.split('.')[1]));
            
            // 4. Récupérer les infos détaillées depuis votre backend
            const userInfoResponse = await axios.get(
                `${API_URL}/mutuelle/auth/user-info`,
                {
                    headers: { Authorization: `Bearer ${access_token}` }
                }
            );
            
            localStorage.setItem('userInfo', JSON.stringify(userInfoResponse.data));
            
            return {
                success: true,
                data: {
                    token: access_token,
                    refreshToken: refresh_token,
                    expiresIn: expires_in,
                    userInfo: userInfoResponse.data,
                    tokenData
                }
            };
        } catch (error) {
            console.error('Erreur de connexion:', error);
            
            let message = 'Erreur de connexion';
            if (error.response?.status === 401) {
                message = 'Email ou mot de passe incorrect';
            } else if (error.response?.status === 400) {
                message = 'Données invalides';
            }
            
            return {
                success: false,
                message
            };
        }
    }

    async refreshToken() {
        const refreshToken = localStorage.getItem('refresh_token');
        
        if (!refreshToken) {
            return { success: false };
        }

        try {
            const response = await axios.post(
                `${KEYCLOAK_URL}/realms/${REALM}/protocol/openid-connect/token`,
                new URLSearchParams({
                    'client_id': CLIENT_ID,
                    'grant_type': 'refresh_token',
                    'refresh_token': refreshToken
                }),
                {
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded'
                    }
                }
            );

            const { access_token, refresh_token } = response.data;
            
            localStorage.setItem('token', access_token);
            if (refresh_token) {
                localStorage.setItem('refresh_token', refresh_token);
            }
            
            return {
                success: true,
                token: access_token
            };
        } catch (error) {
            console.error('Erreur de rafraîchissement token:', error);
            this.logout();
            return { success: false };
        }
    }

    logout() {
        localStorage.removeItem('token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('userInfo');
        localStorage.removeItem('currentUser');
    }

    getCurrentUser() {
        const userInfo = localStorage.getItem('userInfo');
        return userInfo ? JSON.parse(userInfo) : null;
    }

    isAuthenticated() {
        const token = localStorage.getItem('token');
        if (!token) return false;

        try {
            // Vérifier si le token est expiré
            const tokenData = JSON.parse(atob(token.split('.')[1]));
            const expirationTime = tokenData.exp * 1000; // Convertir en millisecondes
            return Date.now() < expirationTime;
        } catch {
            return false;
        }
    }

    getToken() {
        return localStorage.getItem('token');
    }
}

export default new AuthService();