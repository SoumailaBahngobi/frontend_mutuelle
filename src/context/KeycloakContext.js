import React, { createContext, useContext, useEffect, useState } from 'react';
import authService from '../service/authService';

const KeycloakContext = createContext();

export const useKeycloak = () => {
    const context = useContext(KeycloakContext);
    if (!context) {
        throw new Error('useKeycloak doit être utilisé dans un KeycloakProvider');
    }
    return context;
};

export const KeycloakProvider = ({ children }) => {
    const [authenticated, setAuthenticated] = useState(false);
    const [userInfo, setUserInfo] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkAuth = () => {
            try {
                const isAuth = authService.isAuthenticated();
                setAuthenticated(isAuth);
                
                if (isAuth) {
                    const user = authService.getCurrentUser();
                    setUserInfo(user);
                }
            } catch (error) {
                console.error('Erreur de vérification d\'authentification:', error);
                setAuthenticated(false);
            } finally {
                setLoading(false);
            }
        };

        checkAuth();
    }, []);

    const login = async (email, password) => {
        const result = await authService.login(email, password);
        
        if (result.success) {
            setAuthenticated(true);
            setUserInfo(result.data.userInfo);
            return { success: true };
        }
        
        return result;
    };

    const logout = () => {
        authService.logout();
        setAuthenticated(false);
        setUserInfo(null);
    };

    const hasRole = (role) => {
        if (!userInfo) return false;
        return userInfo.role === role;
    };

    const getToken = () => {
        return authService.getToken();
    };

    const value = {
        authenticated,
        userInfo,
        loading,
        login,
        logout,
        getToken,
        hasRole
    };

    return (
        <KeycloakContext.Provider value={value}>
            {children}
        </KeycloakContext.Provider>
    );
};