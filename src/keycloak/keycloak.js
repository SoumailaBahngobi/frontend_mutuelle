// keycloak.js
import Keycloak from 'keycloak-js';

const keycloakConfig = {
    url: 'http://localhost:9090/',
    realm: 'frontend_mutuelle',
    clientId: 'mutuelle-frontend'
};

// Pattern Singleton pour éviter les instances multiples
let keycloakInstance = null;

const initKeycloak = () => {
    if (!keycloakInstance) {
        keycloakInstance = new Keycloak(keycloakConfig);
        console.log('Nouvelle instance Keycloak créée');
    }
    return keycloakInstance;
};

// Configuration d'initialisation optimisée
export const keycloakInitOptions = {
    onLoad: 'check-sso',
    checkLoginIframe: false, // Désactiver la vérification iframe qui cause le timeout
    pkceMethod: 'S256',
    flow: 'standard'
};

// Exporter l'instance initialisée
export const getKeycloak = () => {
    if (!keycloakInstance) {
        throw new Error('Keycloak non initialisé. Appelez initKeycloak() d\'abord.');
    }
    return keycloakInstance;
};

// Exporter la fonction d'initialisation
export default initKeycloak;