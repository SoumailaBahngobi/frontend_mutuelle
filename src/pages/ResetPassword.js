import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';

export default function ResetPassword() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const token = searchParams.get('token');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!password || !confirmPassword) {
      toast.error('Veuillez remplir tous les champs');
      return;
    }
    
    if (password !== confirmPassword) {
      toast.error('Les mots de passe ne correspondent pas');
      return;
    }
    
    if (password.length < 6) {
      toast.error('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post('http://localhost:8080/mutuelle/member/reset-password', {
        token: token,
        newPassword: password
      });

      if (response.status === 200) {
        toast.success('Mot de passe réinitialisé avec succès !');
        navigate('/login');
      }
    } catch (error) {
      console.error('Erreur réinitialisation:', error);
      if (error.response?.status === 400) {
        toast.error('Token invalide ou expiré');
      } else {
        toast.error('Erreur lors de la réinitialisation du mot de passe');
      }
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="container mt-5">
        <div className="alert alert-danger text-center">
          <h4>Lien invalide</h4>
          <p>Le lien de réinitialisation est invalide ou a expiré.</p>
          <button className="btn btn-primary" onClick={() => navigate('/login')}>
            Retour à la connexion
          </button>
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
              <div className="card-header bg-success text-white text-center py-3 rounded-top-3">
                <h4 className="fw-bold mb-0">
                  <i className="bi bi-key me-2"></i>
                  Nouveau mot de passe
                </h4>
              </div>
              
              <div className="card-body p-4 p-md-5">
                <form onSubmit={handleSubmit}>
                  <div className="alert alert-info mb-4">
                    <i className="bi bi-info-circle me-2"></i>
                    Entrez votre nouveau mot de passe
                  </div>

                  <div className="form-group mb-3">
                    <label htmlFor="password" className="form-label fw-semibold">
                      <i className="bi bi-lock me-2"></i>
                      Nouveau mot de passe
                    </label>
                    <input 
                      type="password" 
                      className="form-control"
                      id="password" 
                      value={password} 
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Minimum 6 caractères"
                      required
                      disabled={loading}
                    />
                  </div>

                  <div className="form-group mb-4">
                    <label htmlFor="confirmPassword" className="form-label fw-semibold">
                      <i className="bi bi-lock-fill me-2"></i>
                      Confirmer le mot de passe
                    </label>
                    <input 
                      type="password" 
                      className="form-control"
                      id="confirmPassword" 
                      value={confirmPassword} 
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Retapez votre mot de passe"
                      required
                      disabled={loading}
                    />
                  </div>

                  <div className="d-grid mb-3">
                    <button 
                      type="submit" 
                      className="btn btn-success fw-semibold py-2"
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                          Réinitialisation...
                        </>
                      ) : (
                        <>
                          <i className="bi bi-check-lg me-2"></i>
                          Réinitialiser le mot de passe
                        </>
                      )}
                    </button>
                  </div>

                  <div className="text-center">
                    <button 
                      type="button"
                      className="btn btn-link text-decoration-none"
                      onClick={() => navigate('/login')}
                    >
                      <i className="bi bi-arrow-left me-2"></i>
                      Retour à la connexion
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}