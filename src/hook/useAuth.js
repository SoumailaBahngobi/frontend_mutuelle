import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../service/authService';
export default function useAuth() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [authenticated, setAuthenticated] = useState(false);
    const navigate = useNavigate();


    useEffect(() => {
        checkAuth();
        
        // Rafraîchissement périodique
        const interval = setInterval(async () => {
            if (authService.isAuthenticated()) {
                const token = authService.getToken();
                if (token) {
                    try {
                        const payload = JSON.parse(atob(token.split('.')[1]));
                        const expiresIn = (payload.exp * 1000) - Date.now();
                        
                        if (expiresIn < 300000) { // 5 minutes
                            await authService.refreshToken();
                            setUser(authService.getUserInfo());
                        }
                    } catch (e) {
                        console.error('Erreur vérification expiration:', e);
                    }
                }
            }
        }, 60000);

        return () => clearInterval(interval);
    }, []);

    const checkAuth = async () => {
        if (authService.isAuthenticated()) {
            setUser(authService.getUserInfo());
            setAuthenticated(true);
        } else {
            // Essayer de rafraîchir
            const refreshResult = await authService.refreshToken();
            if (refreshResult.success) {
                setUser(authService.getUserInfo());
                setAuthenticated(true);
            }
        }
        setLoading(false);
    };

    const login = async (email, password) => {
        const result = await authService.login(email, password);
        if (result.success) {
            setUser(result.user);
            setAuthenticated(true);
            navigate('/dashboard');
        }
        return result;
    };

    const logout = () => {
        authService.logout();
        setUser(null);
        setAuthenticated(false);
    };

    const hasRole = (role) => {
        return user?.role === role;
    };

    return {
        user,
        loading,
        authenticated,
        login,
        logout,
        hasRole,
        getToken: authService.getToken.bind(authService)
    };
};