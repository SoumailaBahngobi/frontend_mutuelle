import React from 'react';
import { Navigate } from 'react-router-dom';
import { toast } from 'react-toastify';


const RoleProtectedRoute = ({ 
  children, 
  allowedRoles = [], 
  redirectTo = '/dashboard',
  requireAuth = true,
  fallback = null
}) => {
  // Récupérer le token JWT depuis le localStorage
  const token = localStorage.getItem('token');
  
  // Récupérer les informations de l'utilisateur connecté
  const getCurrentUser = () => {
    try {
      const userData = localStorage.getItem('currentUser');
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
     // console.error('Erreur lors de la récupération des données utilisateur:', error);
     toast.error('Erreur lors de la récupération des données utilisateur.', { autoClose: 7000 });
      return null;
    }
  };

  // Vérifier si l'utilisateur a le rôle requis
  const hasRequiredRole = (user) => {
    if (!allowedRoles || allowedRoles.length === 0) {
      return true; // Aucune restriction de rôle
    }
    
    if (!user || !user.role) {
      return false; // Utilisateur sans rôle
    }
    
    return allowedRoles.includes(user.role);
  };

  // Vérifier l'authentification
  const isAuthenticated = () => {
    if (!requireAuth) {
      return true; // Authentification non requise
    }
    
    if (!token) {
      return false; // Pas de token
    }
    
    // Vérifier si le token est expiré (optionnel)
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const isExpired = payload.exp * 1000 < Date.now();
      
      if (isExpired) {
        // Token expiré, nettoyer le localStorage
        localStorage.removeItem('token');
        localStorage.removeItem('currentUser');
        return false;
      }
      
      return true;
    } catch (error) {
      //console.error('Erreur de décodage du token:', error);
      toast.error('Erreur de décodage du token. Veuillez vous reconnecter.', { autoClose: 7000 });
      return false;
    }
  };

  // Récupérer l'utilisateur courant
  const currentUser = getCurrentUser();
  
  // Vérifications principales
  if (requireAuth && !isAuthenticated()) {
    // Utilisateur non authentifié
   // console.warn('Accès refusé: utilisateur non authentifié');
    toast.error('Vous devez être connecté pour accéder à cette page.', { autoClose: 7000 });
    return <Navigate to="/login" replace />;
  }

  if (requireAuth && !hasRequiredRole(currentUser)) {
    // Utilisateur authentifié mais sans le rôle requis
   // console.warn(`Accès refusé: rôle ${currentUser?.role} non autorisé. Rôles requis:`, allowedRoles);
    toast.error('Accès refusé: vous n\'avez pas les permissions nécessaires pour accéder à cette page.', { autoClose: 7000 });
    
    // Afficher le composant de fallback si fourni
    if (fallback) {
      return fallback;
    }
    
    // Rediriger vers la page spécifiée
    return <Navigate to={redirectTo} replace />;
  }

  // Utilisateur autorisé, afficher les enfants
  return children;
};

export default RoleProtectedRoute;

// Version alternative avec HOC (Higher Order Component)
export const withRoleProtection = (Component, allowedRoles = [], options = {}) => {
  return function RoleProtectedComponent(props) {
    return (
      <RoleProtectedRoute 
        allowedRoles={allowedRoles} 
        redirectTo={options.redirectTo}
        requireAuth={options.requireAuth !== false}
        fallback={options.fallback}
      >
        <Component {...props} />
      </RoleProtectedRoute>
    );
  };
};

// Hook personnalisé pour la vérification des rôles
export const useRoleCheck = () => {
  const getCurrentUser = () => {
    try {
      const userData = localStorage.getItem('currentUser');
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
     // console.error('Erreur lors de la récupération des données utilisateur:', error);
     toast.error('Erreur lors de la récupération des données utilisateur.', { autoClose: 7000 });
      return null;
    }
  };

  const hasRole = (requiredRoles) => {
    const user = getCurrentUser();
    
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }
    
    if (!user || !user.role) {
      return false;
    }
    
    return requiredRoles.includes(user.role);
  };

  const getCurrentRole = () => {
    const user = getCurrentUser();
    return user?.role || null;
  };

  const isAuthenticated = () => {
    const token = localStorage.getItem('token');
    
    if (!token) {
      return false;
    }
    
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.exp * 1000 > Date.now();
    } catch (error) {
      return false;
    }
  };

  return {
    hasRole,
    getCurrentRole,
    isAuthenticated,
    currentUser: getCurrentUser()
  };
};

// Composant pour afficher conditionnellement du contenu basé sur les rôles
export const ShowForRoles = ({ roles, children, fallback = null }) => {
  const { hasRole } = useRoleCheck();
  
  if (hasRole(roles)) {
    return children;
  }
  
  return fallback;
};
