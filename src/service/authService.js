// Service unifié pour l'authentification
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8081';
const KEYCLOAK_URL = process.env.REACT_APP_KEYCLOAK_URL || 'http://localhost:8088';
const REALM = process.env.REACT_APP_KEYCLOAK_REALM || 'mutuelle-realm';
const CLIENT_ID = process.env.REACT_APP_KEYCLOAK_CLIENT_ID || 'mutuelle-client';

class AuthService {
    constructor() {
        this.KEYCLOAK_URL = KEYCLOAK_URL;
        this.REALM = REALM;
        this.CLIENT_ID = CLIENT_ID;
        this.API_URL = API_URL;
    }

    // ========== GESTION DES TOKENS ==========
    getToken() {
        return localStorage.getItem('token');
    }

    getRefreshToken() {
        return localStorage.getItem('refresh_token');
    }

    setTokens(accessToken, refreshToken) {
        if (accessToken) localStorage.setItem('token', accessToken);
        if (refreshToken) localStorage.setItem('refresh_token', refreshToken);
    }

    setUserInfo(userInfo) {
        localStorage.setItem('userInfo', JSON.stringify(userInfo));
    }

    getUserInfo() {
        const userInfo = localStorage.getItem('userInfo');
        return userInfo ? JSON.parse(userInfo) : null;
    }

    clearAll() {
        localStorage.removeItem('token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('userInfo');
    }

    isTokenExpired() {
        const token = this.getToken();
        if (!token) return true;

        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            return Date.now() >= payload.exp * 1000;
        } catch {
            return true;
        }
    }

    isAuthenticated() {
        return !!this.getToken() && !this.isTokenExpired();
    }

    // ========== AUTHENTIFICATION ==========
    async login(email, password) {
        try {
            const response = await fetch(`${this.KEYCLOAK_URL}/realms/${this.REALM}/protocol/openid-connect/token`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: new URLSearchParams({
                    client_id: this.CLIENT_ID,
                    grant_type: 'password',
                    username: email,
                    password: password
                })
            });

            if (!response.ok) {
                return { success: false, message: 'Email ou mot de passe incorrect' };
            }

            const data = await response.json();
            this.setTokens(data.access_token, data.refresh_token);

            // Récupérer les infos utilisateur
            const userResponse = await fetch(`${this.API_URL}/mutuelle/auth/user-info`, {
                headers: { 'Authorization': `Bearer ${data.access_token}` }
            });

            if (userResponse.ok) {
                const userData = await userResponse.json();
                this.setUserInfo(userData);
            }

            return { success: true, user: this.getUserInfo() };

        } catch (error) {
            console.error('Erreur login:', error);
            return { success: false, message: 'Erreur de connexion' };
        }
    }

    async refreshToken() {
        const refreshToken = this.getRefreshToken();
        if (!refreshToken) {
            this.clearAll();
            return { success: false };
        }

        try {
            const response = await fetch(`${this.KEYCLOAK_URL}/realms/${this.REALM}/protocol/openid-connect/token`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: new URLSearchParams({
                    client_id: this.CLIENT_ID,
                    grant_type: 'refresh_token',
                    refresh_token: refreshToken
                })
            });

            if (!response.ok) throw new Error('Refresh failed');

            const data = await response.json();
            this.setTokens(data.access_token, data.refresh_token);
            
            return { success: true, token: data.access_token };

        } catch {
            this.clearAll();
            return { success: false };
        }
    }

    logout() {
        this.clearAll();
        window.location.href = '/login';
    }
}

// Créer une instance unique
const authService = new AuthService();
export default authService;