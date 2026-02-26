// src/keycloak/keycloak.js
import Keycloak from 'keycloak-js';

const keycloakConfig = {
    url: process.env.REACT_APP_KEYCLOAK_URL || 'http://localhost:8088',
    realm: process.env.REACT_APP_KEYCLOAK_REALM || 'mutuelle-realm',
    clientId: process.env.REACT_APP_KEYCLOAK_CLIENT_ID || 'mutuelle-client'
};

// Pattern Singleton pour éviter les instances multiples
let keycloakInstance = null;
let initPromise = null;

const initKeycloak = () => {
    if (!keycloakInstance) {
        keycloakInstance = new Keycloak(keycloakConfig);
        console.log('Nouvelle instance Keycloak créée avec URL:', keycloakConfig.url);
    }
    return keycloakInstance;
};

// Configuration d'initialisation
export const keycloakInitOptions = {
    onLoad: 'check-sso',
    checkLoginIframe: false,
    pkceMethod: 'S256',
    flow: 'standard'
};

// ✅ NOUVEAU: Fonction d'initialisation avec promesse unique
export const initializeKeycloak = () => {
    if (!initPromise) {
        const keycloak = initKeycloak();
        initPromise = keycloak.init(keycloakInitOptions)
            .then((auth) => {
                console.log('Keycloak initialisé, authentifié:', auth);
                return { keycloak, auth };
            })
            .catch((error) => {
                console.error('Erreur init Keycloak:', error);
                initPromise = null; // Reset pour réessayer
                throw error;
            });
    }
    return initPromise;
};

// Exporter l'instance initialisée
export const getKeycloak = () => {
    if (!keycloakInstance) {
        throw new Error('Keycloak non initialisé. Appelez initKeycloak() d\'abord.');
    }
    return keycloakInstance;
};

export default initKeycloak;