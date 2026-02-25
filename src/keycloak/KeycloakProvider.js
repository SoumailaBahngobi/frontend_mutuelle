// src/keycloak/KeycloakProvider.js
import { ReactKeycloakProvider } from '@react-keycloak/web';
import keycloak from './keycloak';

const KeycloakProvider = ({ children }) => {
  const initOptions = {
    onLoad: 'login-required',
    checkLoginIframe: false
    // Pas de pkceMethod du tout
  };

  return (
    <ReactKeycloakProvider authClient={keycloak} initOptions={initOptions}>
      {children}
    </ReactKeycloakProvider>
  );
};

export default KeycloakProvider;