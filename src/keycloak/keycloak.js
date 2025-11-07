import Keycloak from 'keycloak-js';

const keycloak = new Keycloak({
    url: 'http://localhost:8080/mutuelle',
    realm: 'frontend_mutuelle',
    clientId: '',
});

export default keycloak;