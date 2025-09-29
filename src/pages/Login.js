import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';

export default function Login() {
  const [form, setForm] = useState({ 
    email: '', 
    password: '' 
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
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
      setError('Veuillez remplir tous les champs');
      return;
    }

    setLoading(true);

    try {
      const res = await axios.post('http://localhost:8080/mut/login', form);
      // Affichage temporaire pour debug
      alert('Réponse backend: ' + JSON.stringify(res.data));
      if (res.data && res.data.token) {
        localStorage.setItem('token', res.data.token);
        alert('Token stocké: ' + localStorage.getItem('token'));
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
          navigate('/dashboard');
        } else {
          setError("Connexion réussie, mais accès au profil refusé (403). Contactez l'administrateur.");
        }
      } else {
        setError("Réponse invalide du serveur");
      }
    } catch (err) {
      console.error('Erreur de connexion:', err);
      if (err.response?.status === 401) {
        setError("Email ou mot de passe incorrect");
      } else if (err.response?.status === 400) {
        setError("Données de connexion invalides");
      } else if (err.response?.status >= 500) {
        setError("Erreur serveur. Veuillez réessayer.");
      } else {
        setError("Erreur de connexion. Vérifiez votre réseau.");
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchUserProfile = async (token) => {
    try {
      const response = await axios.get('http://localhost:8080/mut/member/profile', {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération du profil:', error);
      return null;
    }
  };

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

                  <div className="form-group mb-4">
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

                  {error && (
                    <div className="alert alert-danger d-flex align-items-center mb-4" role="alert">
                      <i className="bi bi-exclamation-triangle me-2"></i>
                      <div className="small">{error}</div>
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