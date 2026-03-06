// Service de gestion des tokens - Version simplifiée
class TokenService {
    constructor() {
        this.KEYCLOAK_URL = process.env.REACT_APP_KEYCLOAK_URL || 'http://localhost:8088';
        this.REALM = process.env.REACT_APP_KEYCLOAK_REALM || 'mutuelle-realm';
        this.CLIENT_ID = process.env.REACT_APP_KEYCLOAK_CLIENT_ID || 'mutuelle-client';
    }

    // Récupérer le token d'accès
    getToken() {
        return localStorage.getItem('token');
    }

    // Récupérer le refresh token
    getRefreshToken() {
        return localStorage.getItem('refresh_token');
    }

    // Sauvegarder les tokens
    setTokens(accessToken, refreshToken) {
        if (accessToken) localStorage.setItem('token', accessToken);
        if (refreshToken) localStorage.setItem('refresh_token', refreshToken);
    }

    // Sauvegarder les infos utilisateur
    setUserInfo(userInfo) {
        localStorage.setItem('userInfo', JSON.stringify(userInfo));
    }

    // Récupérer les infos utilisateur
    getUserInfo() {
        const userInfo = localStorage.getItem('userInfo');
        return userInfo ? JSON.parse(userInfo) : null;
    }

    // Supprimer toutes les données
    clearAll() {
        localStorage.removeItem('token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('userInfo');
    }

    // Vérifier si le token est expiré
    isTokenExpired() {
        const token = this.getToken();
        if (!token) return true;

        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            return Date.now() >= payload.exp * 1000;
        } catch (e) {
            console.error('Erreur décodage token:', e);
            return true;
        }
    }

    // Vérifier si l'utilisateur est authentifié
    isAuthenticated() {
        const token = this.getToken();
        return !!token && !this.isTokenExpired();
    }

    // Rafraîchir le token
    async refreshToken() {
        const refreshToken = this.getRefreshToken();
        if (!refreshToken) {
            this.clearAll();
            return { success: false, error: 'No refresh token' };
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

            if (!response.ok) {
                throw new Error('Refresh failed');
            }

            const data = await response.json();
            this.setTokens(data.access_token, data.refresh_token);
            
            return { success: true, token: data.access_token };

        } catch (error) {
            console.error('Erreur refresh token:', error);
            this.clearAll();
            return { success: false, error: error.message };
        }
    }
}

// ✅ EXPORT - Créer une instance unique
const tokenService = new TokenService();
export default tokenService;