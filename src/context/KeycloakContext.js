// src/context/KeycloakContext.js
import React, { createContext, useContext, useEffect, useState } from 'react';
import { initializeKeycloak } from '../keycloak/keycloak';

const KeycloakContext = createContext();

export const useKeycloak = () => {
    const context = useContext(KeycloakContext);
    if (!context) {
        throw new Error('useKeycloak doit être utilisé dans un KeycloakProvider');
    }
    return context;
};

export const KeycloakProvider = ({ children }) => {
    const [keycloak, setKeycloak] = useState(null);
    const [authenticated, setAuthenticated] = useState(false);
    const [userProfile, setUserProfile] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let mounted = true;
        let tokenRefreshInterval;

        const init = async () => {
            try {
                const result = await initializeKeycloak();
                
                if (!mounted) return;

                setKeycloak(result.keycloak);
                setAuthenticated(result.auth);

                if (result.auth) {
                    try {
                        const profile = await result.keycloak.loadUserProfile();
                        if (mounted) {
                            setUserProfile(profile);
                            localStorage.setItem('token', result.keycloak.token);
                            localStorage.setItem('currentUser', JSON.stringify(profile));
                        }
                    } catch (profileError) {
                        console.error('Erreur chargement profil:', profileError);
                    }

                    // Rafraîchir le token
                    tokenRefreshInterval = setInterval(async () => {
                        try {
                            const refreshed = await result.keycloak.updateToken(70);
                            if (refreshed && mounted) {
                                localStorage.setItem('token', result.keycloak.token);
                            }
                        } catch (refreshError) {
                            console.error('Erreur rafraîchissement token:', refreshError);
                        }
                    }, 60000);
                } else {
                    localStorage.removeItem('token');
                    localStorage.removeItem('currentUser');
                }
            } catch (error) {
                console.error('Erreur d\'initialisation Keycloak:', error);
            } finally {
                if (mounted) {
                    setLoading(false);
                }
            }
        };

        init();

        return () => {
            mounted = false;
            if (tokenRefreshInterval) {
                clearInterval(tokenRefreshInterval);
            }
        };
    }, []);

    const login = () => {
        keycloak?.login();
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('currentUser');
        keycloak?.logout({ redirectUri: window.location.origin + '/' });
    };

    const getToken = () => {
        return keycloak?.token;
    };

    const hasRole = (role) => {
        if (!keycloak || !keycloak.tokenParsed) return false;
        const realmRoles = keycloak.tokenParsed.realm_access?.roles || [];
        return realmRoles.includes(role);
    };

    const value = {
        keycloak,
        authenticated,
        userProfile,
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