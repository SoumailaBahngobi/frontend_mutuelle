import React, { createContext, useContext } from 'react';
import useAuth from '../hook/useAuth';
const KeycloakContext = createContext();

export const useKeycloak = () => {
    const context = useContext(KeycloakContext);
    if (!context) {
        throw new Error('useKeycloak doit être utilisé dans un KeycloakProvider');
    }
    return context;
};

export const KeycloakProvider = ({ children }) => {
    const auth = useAuth();

    return (
        <KeycloakContext.Provider value={auth}>
            {children}
        </KeycloakContext.Provider>
    );
};