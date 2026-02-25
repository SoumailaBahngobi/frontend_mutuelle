// src/components/PrivateRoute.js
import { useKeycloak } from '@react-keycloak/web';
import { Navigate } from 'react-router-dom';
import LoadingSpinner from './LoadingSpinner';

const PrivateRoute = ({ children, requiredRole = null }) => {
  const { keycloak, initialized } = useKeycloak();

  if (!initialized) {
    return <LoadingSpinner message="Vérification de l'authentification..." />;
  }

  if (!keycloak.authenticated) {
    keycloak.login();
    return <LoadingSpinner message="Redirection vers la page de connexion..." />;
  }

  // Vérification du rôle si nécessaire
  if (requiredRole) {
    const hasRole = keycloak.hasRealmRole(requiredRole) || 
                    keycloak.hasResourceRole(requiredRole);
    
    if (!hasRole) {
      return <Navigate to="/unauthorized" replace />;
    }
  }

  return children;
};

export default PrivateRoute;