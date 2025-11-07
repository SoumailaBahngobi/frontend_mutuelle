import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';

export default function Login() {
  const [form, setForm] = useState({ 
    email: '', 
    password: '' 
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');
  const [forgotPasswordLoading, setForgotPasswordLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!form.email || !form.password) {
      toast.error('Veuillez remplir tous les champs');
      return;
    }

    setLoading(true);

    try {
      const res = await axios.post('http://localhost:8080/mutuelle/login', form);
      
      if (res.data && res.data.token) {
        localStorage.setItem('token', res.data.token);
        
        let userData = null;
        if (res.data.user) {
          userData = res.data.user;
        } else if (res.data.member) {
          userData = res.data.member;
        } else {
          userData = await fetchUserProfile(res.data.token);
        }
        
        if (userData) {
          localStorage.setItem('currentUser', JSON.stringify(userData));
          toast.success('Connexion réussie !');
          navigate('/dashboard');
        } else {
          toast.error("Connexion réussie, mais accès au profil refusé. Contactez l'administrateur.");
        }
      } else {
        toast.error("Réponse invalide du serveur");
      }
    } catch (err) {
      console.error('Erreur de connexion:', err);
      if (err.response?.status === 401) {
        const errorMessage = "Email ou mot de passe incorrect";
        setError(errorMessage);
        toast.error(errorMessage);
      } else if (err.response?.status === 400) {
        toast.error("Données de connexion invalides");
      } else if (err.response?.status >= 500) {
        toast.error("Erreur serveur. Veuillez réessayer.");
      } else {
        toast.error("Erreur de connexion. Vérifiez votre réseau.");
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchUserProfile = async (token) => {
    try {
      const response = await axios.get('http://localhost:8080/mutuelle/member/profile', {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      toast.error('Erreur lors de la récupération du profil. Veuillez réessayer.');
      return null;
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    
    // Validation de l'email
    if (!forgotPasswordEmail) {
      toast.error('Veuillez entrer votre adresse email');
      return;
    }

    // Validation du format email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(forgotPasswordEmail)) {
      toast.error('Veuillez entrer une adresse email valide');
      return;
    }

    setForgotPasswordLoading(true);

    try {
      const response = await axios.post('http://localhost:8080/mutuelle/member/forgot-password', {
        email: forgotPasswordEmail
      });

      if (response.status >= 200 && response.status < 300) {
        const token = response.data.token;
        toast.success('Redirection vers la page de réinitialisation...');
        
        // Fermer la modal
        setShowForgotPassword(false);
        setForgotPasswordEmail('');
        
        // Rediriger directement vers la page de réinitialisation
        navigate(`/reset-password?token=${token}`);
      } else {
        toast.error('Réponse inattendue du serveur');
      }
    } catch (error) {
      console.error('Erreur mot de passe oublié:', error);
      
      if (error.response?.status === 404) {
        toast.error('Aucun compte trouvé avec cette adresse email');
      } else if (error.response?.status === 500) {
        toast.error('Erreur serveur lors de la génération du token');
      } else if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else if (error.code === 'NETWORK_ERROR' || !error.response) {
        toast.error('Erreur de connexion. Vérifiez votre réseau.');
      } else {
        toast.error('Erreur lors de la demande de réinitialisation');
      }
    } finally {
      setForgotPasswordLoading(false);
    }
  };

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-md-6 col-lg-5">
            
            {/* Modal Mot de passe oublié */}
            {showForgotPassword && (
              <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} tabIndex="-1">
                <div className="modal-dialog modal-dialog-centered">
                  <div className="modal-content">
                    <div className="modal-header">
                      <h5 className="modal-title">
                        <i className="bi bi-key me-2"></i>
                        Mot de passe oublié
                      </h5>
                      <button
                        type="button"
                        className="btn-close"
                        onClick={() => {
                          setShowForgotPassword(false);
                          setForgotPasswordEmail('');
                        }}
                        disabled={forgotPasswordLoading}
                      ></button>
                    </div>
                    <div className="modal-body">
                      <p className="text-muted mb-3">
                        Entrez votre adresse email pour accéder à la page de réinitialisation.
                      </p>
                      <form onSubmit={handleForgotPassword}>
                        <div className="form-group mb-3">
                          <label htmlFor="forgotPasswordEmail" className="form-label">
                            Email
                          </label>
                          <input 
                            type="email" 
                            className="form-control"
                            id="forgotPasswordEmail" 
                            value={forgotPasswordEmail} 
                            onChange={(e) => setForgotPasswordEmail(e.target.value)}
                            placeholder="votre@email.com"
                            required
                            disabled={forgotPasswordLoading}
                          />
                        </div>
                        <div className="d-grid gap-2">
                          <button 
                            type="submit" 
                            className="btn btn-primary"
                            disabled={forgotPasswordLoading}
                          >
                            {forgotPasswordLoading ? (
                              <>
                                <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                                Vérification...
                              </>
                            ) : (
                              <>
                                <i className="bi bi-arrow-right me-2"></i>
                                Continuer
                              </>
                            )}
                          </button>
                          <button 
                            type="button" 
                            className="btn btn-outline-secondary"
                            onClick={() => {
                              setShowForgotPassword(false);
                              setForgotPasswordEmail('');
                            }}
                            disabled={forgotPasswordLoading}
                          >
                            Annuler
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Le reste du code JSX reste identique */}
            <div className="card shadow-lg border-0 rounded-3">
              
              <div className="card-header bg-primary text-white text-center py-3 rounded-top-3">
                <h4 className="fw-bold mb-0">
                  <i className="bi bi-shield-lock me-2"></i>
                  Connexion
                </h4>
              </div>
              
              <div className="card-body p-4 p-md-5">
                <form onSubmit={handleSubmit} noValidate>
                  <div className="form-group mb-3">
                    <label htmlFor="email" className="form-label fw-semibold">
                      <i className="bi bi-envelope me-2"></i>
                      Email
                    </label>
                    <input 
                      type="email" 
                      className={`form-control ${error ? 'is-invalid' : ''}`}
                      id="email" 
                      name="email" 
                      value={form.email} 
                      onChange={handleChange}
                      placeholder="votre@email.com"
                      required
                      disabled={loading}
                    />
                  </div>

                  <div className="form-group mb-3">
                    <label htmlFor="password" className="form-label fw-semibold">
                      <i className="bi bi-lock me-2"></i>
                      Mot de passe
                    </label>
                    <input 
                      type="password" 
                      className={`form-control ${error ? 'is-invalid' : ''}`}
                      id="password" 
                      name="password" 
                      value={form.password} 
                      onChange={handleChange}
                      placeholder="Votre mot de passe"
                      required
                      disabled={loading}
                    />
                  </div>

                  {/* Lien Mot de passe oublié */}
                  <div className="text-end mb-4">
                    <button
                      type="button"
                      className="btn btn-link p-0 text-decoration-none"
                      onClick={() => setShowForgotPassword(true)}
                      disabled={loading}
                    >
                      <small>
                        <i className="bi bi-question-circle me-1"></i>
                        Mot de passe oublié ?
                      </small>
                    </button>
                  </div>

                  {error && (
                    <div className="alert alert-warning d-flex align-items-center mb-4" role="alert">
                      <i className="bi bi-exclamation-triangle me-2"></i>
                      <div className="small">
                        <strong>Identifiants incorrects</strong>
                        <div className="mt-1">
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-primary"
                            onClick={() => setShowForgotPassword(true)}
                          >
                            <i className="bi bi-key me-1"></i>
                            Réinitialiser le mot de passe
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="d-grid mb-4">
                    <button 
                      type="submit" 
                      className="btn btn-primary fw-semibold py-2"
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                          Connexion...
                        </>
                      ) : (
                        <>
                          <i className="bi bi-box-arrow-in-right me-2"></i>
                          Se connecter
                        </>
                      )}
                    </button>
                  </div>

                  <div className="text-center">
                    <p className="mb-3 text-muted small">Vous n'avez pas de compte ?</p>
                    <Link 
                      to="/register" 
                      className="btn btn-outline-primary btn-sm"
                      disabled={loading}
                    >
                      <i className="bi bi-person-plus me-2"></i>
                      Créer un compte
                    </Link>
                  </div>
                </form>
              </div>
              
              <div className="card-footer text-center py-2 bg-light rounded-bottom-3">
                <small className="text-muted">
                  <i className="bi bi-shield-check me-1"></i>
                  Sécurisé et confidentiel
                </small>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}