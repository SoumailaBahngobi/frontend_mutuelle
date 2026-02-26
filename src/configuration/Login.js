// src/configuration/Login.js
import React, { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useKeycloak } from '../context/KeycloakContext';

export default function Login() {
  const { login, authenticated, loading } = useKeycloak();
  const navigate = useNavigate();

  useEffect(() => {
    if (authenticated) {
      navigate('/dashboard');
    }
  }, [authenticated, navigate]);

  if (loading) {
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light">
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Chargement...</span>
          </div>
          <p className="mt-3">Connexion au serveur d'authentification...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-md-6 col-lg-5">
            <div className="card shadow-lg border-0 rounded-3">
              <div className="card-header bg-primary text-white text-center py-3 rounded-top-3">
                <h4 className="fw-bold mb-0">
                  <i className="bi bi-shield-lock me-2"></i>
                  Connexion
                </h4>
              </div>
              
              <div className="card-body p-4 p-md-5 text-center">
                <div className="mb-4">
                  <img 
                    src="/logo192.png" 
                    alt="Logo" 
                    style={{ width: '80px', height: '80px' }}
                    className="mb-3"
                  />
                  <h5>Mutuelle de Solidarité</h5>
                  <p className="text-muted">
                    Connectez-vous avec votre compte institutionnel
                  </p>
                </div>

                <button 
                  onClick={login}
                  className="btn btn-primary btn-lg w-100 mb-4"
                >
                  <i className="bi bi-box-arrow-in-right me-2"></i>
                  Se connecter avec Keycloak
                </button>

                <div className="text-center">
                  <p className="mb-3 text-muted small">
                    Vous n'avez pas de compte ? Contactez l'administration.
                  </p>
                  <Link 
                    to="/register" 
                    className="btn btn-outline-primary btn-sm"
                  >
                    <i className="bi bi-person-plus me-2"></i>
                    Créer un compte
                  </Link>
                </div>
              </div>
              
              <div className="card-footer text-center py-2 bg-light rounded-bottom-3">
                <small className="text-muted">
                  <i className="bi bi-shield-check me-1"></i>
                  Authentification sécurisée via Keycloak
                </small>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}