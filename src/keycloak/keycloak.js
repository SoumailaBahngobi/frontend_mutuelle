// src/keycloak/keycloak.js
import Keycloak from 'keycloak-js';

const keycloakConfig = {
    url: 'http://localhost:8088',  // CORRIGÉ: 8088 au lieu de 9090
    realm: 'mutuelle-realm',     // Votre realm
    clientId: 'mutuelle-client'   // Votre client
};

// Pattern Singleton pour éviter les instances multiples
let keycloakInstance = null;

const initKeycloak = () => {
    if (!keycloakInstance) {
        keycloakInstance = new Keycloak(keycloakConfig);
        console.log('Nouvelle instance Keycloak créée avec URL:', keycloakConfig.url);
    }
    return keycloakInstance;
};

// Configuration d'initialisation optimisée
export const keycloakInitOptions = {
    onLoad: 'check-sso',           // Vérifie la session SSO au chargement
    checkLoginIframe: false,       // Évite les timeouts
    pkceMethod: 'S256',            // PKCE pour plus de sécurité
    flow: 'standard',              // Standard OpenID Connect
    silentCheckSsoRedirectUri: window.location.origin + '/silent-check-sso.html' // Optionnel
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