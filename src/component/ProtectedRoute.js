// src/components/ProtectedRoute.js
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useKeycloak } from '../context/KeycloakContext';

const ProtectedRoute = ({ children, requiredRole }) => {
  const { authenticated, loading, hasRole } = useKeycloak();

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '60vh' }}>
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Chargement...</span>
          </div>
          <p className="mt-3">Vérification de l'authentification...</p>
        </div>
      </div>
    );
  }

  if (!authenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && !hasRole(requiredRole)) {
    return (
      <div className="container mt-5">
        <div className="alert alert-danger text-center">
          <h4>Accès non autorisé</h4>
          <p>Vous n'avez pas les droits nécessaires pour accéder à cette page.</p>
          <button className="btn btn-primary" onClick={() => window.history.back()}>
            Retour
          </button>
        </div>
      </div>
    );
  }

  return children;
};

export default ProtectedRoute;