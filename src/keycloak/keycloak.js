// src/keycloak/keycloak.js
import Keycloak from 'keycloak-js';

// Configuration Keycloak
const keycloakConfig = {
    url: 'http://localhost:8088',
    realm: 'mutuelle-realm',      // À VÉRIFIER dans votre interface Keycloak
    clientId: 'mutuelle-client'       // À VÉRIFIER dans votre interface Keycloak
};

// Pattern Singleton strict
let keycloakInstance = null;

export const initKeycloak = () => {
    if (!keycloakInstance) {
        console.log(' Création de l\'instance Keycloak');
        keycloakInstance = new Keycloak(keycloakConfig);
    } else {
        console.log(' Instance Keycloak déjà existante');
    }
    return keycloakInstance;
};

const keycloak = initKeycloak();
export default keycloak;