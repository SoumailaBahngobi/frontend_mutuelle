import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();
  
  const [form, setForm] = useState({
    newPassword: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [memberInfo, setMemberInfo] = useState(null);

  useEffect(() => {
    const validateToken = async () => {
      if (!token) {
        toast.error('Token manquant');
        setValidating(false);
        return;
      }

      try {
        // Valider le token
        const response = await axios.get(`http://localhost:8080/mutuelle/member/validate-reset-token?token=${token}`);
        if (response.status === 200) {
          setTokenValid(true);
          
          // Récupérer les informations du membre
          const memberResponse = await axios.get(`http://localhost:8080/mutuelle/member/member-by-token?token=${token}`);
          setMemberInfo(memberResponse.data);
        }
      } catch (error) {
        toast.error('Token invalide ou expiré');
        setTokenValid(false);
      } finally {
        setValidating(false);
      }
    };

    validateToken();
  }, [token]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!form.newPassword || !form.confirmPassword) {
      toast.error('Veuillez remplir tous les champs');
      return;
    }

    if (form.newPassword.length < 6) {
      toast.error('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }

    if (form.newPassword !== form.confirmPassword) {
      toast.error('Les mots de passe ne correspondent pas');
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post('http://localhost:8080/mutuelle/member/reset-password', {
        token: token,
        newPassword: form.newPassword
      });

      if (response.status === 200) {
        toast.success('Mot de passe réinitialisé avec succès !');
        navigate('/login');
      }
    } catch (error) {
      console.error('Erreur réinitialisation:', error);
      if (error.response?.status === 400) {
        toast.error(error.response.data);
      } else {
        toast.error('Erreur lors de la réinitialisation du mot de passe');
      }
    } finally {
      setLoading(false);
    }
  };

  if (validating) {
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light">
        <div className="text-center">
          <div className="spinner-border text-primary mb-3" role="status"></div>
          <p>Validation du token en cours...</p>
        </div>
      </div>
    );
  }

  if (!tokenValid) {
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light">
        <div className="card shadow-lg border-0 rounded-3" style={{ maxWidth: '400px' }}>
          <div className="card-body text-center p-5">
            <i className="bi bi-exclamation-triangle text-warning display-4 mb-3"></i>
            <h4 className="card-title mb-3">Lien invalide</h4>
            <p className="text-muted mb-4">
              Ce lien de réinitialisation est invalide ou a expiré.
            </p>
            <button 
              className="btn btn-primary"
              onClick={() => navigate('/login')}
            >
              Retour à la connexion
            </button>
          </div>
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
                  Nouveau mot de passe
                </h4>
              </div>
              
              <div className="card-body p-4 p-md-5">
                {memberInfo && (
                  <div className="alert alert-info mb-4">
                    <i className="bi bi-person me-2"></i>
                    <strong>{memberInfo.firstName} {memberInfo.lastName}</strong>
                    <br />
                    <small className="text-muted">{memberInfo.email}</small>
                  </div>
                )}
                
                <form onSubmit={handleSubmit}>
                  <div className="form-group mb-3">
                    <label htmlFor="newPassword" className="form-label fw-semibold">
                      <i className="bi bi-lock me-2"></i>
                      Nouveau mot de passe
                    </label>
                    <input 
                      type="password" 
                      className="form-control"
                      id="newPassword" 
                      name="newPassword" 
                      value={form.newPassword} 
                      onChange={handleChange}
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
                      name="confirmPassword" 
                      value={form.confirmPassword} 
                      onChange={handleChange}
                      placeholder="Retapez votre mot de passe"
                      required
                      disabled={loading}
                    />
                  </div>

                  <div className="d-grid mb-3">
                    <button 
                      type="submit" 
                      className="btn btn-primary fw-semibold py-2"
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                          Réinitialisation...
                        </>
                      ) : (
                        <>
                          <i className="bi bi-check-circle me-2"></i>
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