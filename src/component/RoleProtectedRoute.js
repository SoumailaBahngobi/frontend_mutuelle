// src/components/RoleProtectedRoute.js
import { useKeycloak } from '@react-keycloak/web';
import { Navigate } from 'react-router-dom';
import LoadingSpinner from './LoadingSpinner';

const RoleProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { keycloak, initialized } = useKeycloak();

  if (!initialized) {
    return <LoadingSpinner message="Vérification des droits..." />;
  }

  if (!keycloak.authenticated) {
    keycloak.login();
    return null;
  }

  // Vérifier si l'utilisateur a au moins un des rôles autorisés
  const hasAllowedRole = allowedRoles.some(role => 
    keycloak.hasRealmRole(role) || keycloak.hasResourceRole(role)
  );

  if (!hasAllowedRole) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
};

export default RoleProtectedRoute;