// src/members/AddMember.js
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useKeycloak } from '../context/KeycloakContext';
import 'bootstrap/dist/css/bootstrap.min.css';

function AddMember() {
    const { login, authenticated } = useKeycloak();
    const navigate = useNavigate();

    // Si déjà authentifié, rediriger vers dashboard
    useEffect(() => {
        if (authenticated) {
            navigate('/dashboard');
        }
    }, [authenticated, navigate]);

    const handleRegisterWithKeycloak = () => {
        // URL d'inscription Keycloak
        const keycloakRegisterUrl = 
            `${process.env.REACT_APP_KEYCLOAK_URL || 'http://localhost:8088'}/realms/${process.env.REACT_APP_KEYCLOAK_REALM || 'mutuelle-realm'}/protocol/openid-connect/registrations` +
            `?client_id=${process.env.REACT_APP_KEYCLOAK_CLIENT_ID || 'mutuelle-frontend'}` +
            `&response_type=code` +
            `&scope=openid%20profile%20email` +
            `&redirect_uri=${encodeURIComponent(window.location.origin + '/dashboard')}` +
            `&kc_action=register`;

        // Rediriger vers Keycloak
        window.location.href = keycloakRegisterUrl;
    };

    return (
        <div className="container">
            <div className="row justify-content-center">
                <div className="col-md-8 col-lg-6">
                    <div className="card shadow">
                        <div className="card-header bg-primary text-white text-center py-3">
                            <h4 className="card-title mb-0">
                                <i className="bi bi-person-plus me-2"></i>
                                Inscription
                            </h4>
                        </div>
                        <div className="card-body p-4 text-center">
                            
                            <div className="mb-4">
                                <img 
                                    src="/logo192.png" 
                                    alt="Logo" 
                                    style={{ width: '100px', height: '100px' }}
                                    className="mb-3 rounded-circle bg-light p-2"
                                />
                                <h5>Mutuelle de Solidarité</h5>
                                <p className="text-muted">
                                    Créez votre compte pour accéder à tous nos services
                                </p>
                            </div>

                            <div className="alert alert-info text-start mb-4">
                                <i className="bi bi-shield-lock me-2"></i>
                                <strong>Inscription sécurisée</strong>
                                <p className="mb-0 mt-2 small">
                                    Vous allez être redirigé vers notre plateforme d'authentification sécurisée Keycloak.
                                    Vos informations personnelles seront protégées.
                                </p>
                            </div>

                            <div className="d-grid gap-3">
                                <button 
                                    className="btn btn-primary btn-lg"
                                    onClick={handleRegisterWithKeycloak}
                                >
                                    <i className="bi bi-person-plus-fill me-2"></i>
                                    Créer un compte avec Keycloak
                                </button>

                                <div className="text-center my-3">
                                    <span className="text-muted">ou</span>
                                </div>

                                <button 
                                    className="btn btn-outline-secondary"
                                    onClick={() => login()}
                                >
                                    <i className="bi bi-box-arrow-in-right me-2"></i>
                                    J'ai déjà un compte
                                </button>
                            </div>

                            <hr className="my-4" />

                            <div className="text-muted small">
                                <i className="bi bi-check-circle-fill text-success me-2"></i>
                                Authentification sécurisée
                                <span className="mx-2">•</span>
                                <i className="bi bi-shield-check text-primary me-2"></i>
                                Protection des données
                            </div>
                        </div>
                        
                        <div className="card-footer bg-light py-3">
                            <div className="text-center">
                                <button 
                                    className="btn btn-link text-decoration-none"
                                    onClick={() => navigate('/')}
                                >
                                    <i className="bi bi-arrow-left me-2"></i>
                                    Retour à l'accueil
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Section d'information supplémentaire */}
                    <div className="row mt-4 g-4">
                        <div className="col-md-4">
                            <div className="text-center">
                                <div className="bg-primary bg-opacity-10 rounded-circle p-3 d-inline-block mb-2">
                                    <i className="bi bi-shield-check text-primary fs-4"></i>
                                </div>
                                <h6 className="fw-bold">Sécurisé</h6>
                                <small className="text-muted">
                                    Authentification robuste
                                </small>
                            </div>
                        </div>
                        <div className="col-md-4">
                            <div className="text-center">
                                <div className="bg-success bg-opacity-10 rounded-circle p-3 d-inline-block mb-2">
                                    <i className="bi bi-person-badge text-success fs-4"></i>
                                </div>
                                <h6 className="fw-bold">Simple</h6>
                                <small className="text-muted">
                                    Inscription en quelques clics
                                </small>
                            </div>
                        </div>
                        <div className="col-md-4">
                            <div className="text-center">
                                <div className="bg-info bg-opacity-10 rounded-circle p-3 d-inline-block mb-2">
                                    <i className="bi bi-arrow-repeat text-info fs-4"></i>
                                </div>
                                <h6 className="fw-bold">Centralisé</h6>
                                <small className="text-muted">
                                    Un compte pour tout
                                </small>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default AddMember;