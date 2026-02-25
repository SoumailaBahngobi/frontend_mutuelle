// src/pages/Unauthorized.js
import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function Unauthorized() {
  const navigate = useNavigate();

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light">
      <div className="card shadow-lg border-0 rounded-3" style={{ maxWidth: '400px' }}>
        <div className="card-body text-center p-5">
          <i className="bi bi-shield-exclamation text-danger display-4 mb-3"></i>
          <h4 className="card-title mb-3">Accès non autorisé</h4>
          <p className="text-muted mb-4">
            Vous n'avez pas les droits nécessaires pour accéder à cette page.
          </p>
          <button 
            className="btn btn-primary"
            onClick={() => navigate('/dashboard')}
          >
            <i className="bi bi-speedometer2 me-2"></i>
            Retour au tableau de bord
          </button>
        </div>
      </div>
    </div>
  );
}