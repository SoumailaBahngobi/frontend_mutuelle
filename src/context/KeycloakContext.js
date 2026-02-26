// src/context/KeycloakContext.js
import React, { createContext, useContext, useEffect, useState } from 'react';
import initKeycloak, { keycloakInitOptions } from '../keycloak/keycloak';

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
        const keycloakInstance = initKeycloak();

        keycloakInstance.init(keycloakInitOptions)
            .then((auth) => {
                setAuthenticated(auth);
                setKeycloak(keycloakInstance);

                if (auth) {
                    keycloakInstance.loadUserProfile()
                        .then((profile) => {
                            setUserProfile(profile);
                            localStorage.setItem('token', keycloakInstance.token);
                            localStorage.setItem('currentUser', JSON.stringify(profile));
                        })
                        .catch(console.error);

                    setInterval(() => {
                        keycloakInstance.updateToken(70)
                            .then((refreshed) => {
                                if (refreshed) {
                                    localStorage.setItem('token', keycloakInstance.token);
                                }
                            })
                            .catch(() => {
                                keycloakInstance.logout();
                            });
                    }, 60000);
                } else {
                    localStorage.removeItem('token');
                    localStorage.removeItem('currentUser');
                }
            })
            .catch((error) => {
                console.error('Erreur d\'initialisation Keycloak:', error);
            })
            .finally(() => {
                setLoading(false);
            });

        return () => {};
    }, []);

    const login = () => {
        keycloak?.login();
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('currentUser');
        keycloak?.logout({ redirectUri: window.location.origin });
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