import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

export default function EmailHandler() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const token = searchParams.get('token');
  const action = searchParams.get('action');

  useEffect(() => {
    if (action === 'reset-password' && token) {
      // Rediriger vers la page de réinitialisation
      navigate(`/reset-password?token=${token}`);
    } else {
      // Redirection par défaut
      navigate('/login');
    }
  }, [token, action, navigate]);

  return (
    <div className="d-flex justify-content-center align-items-center min-vh-100">
      <div className="spinner-border text-primary" role="status">
        <span className="visually-hidden">Chargement...</span>
      </div>
      <span className="ms-2">Redirection en cours...</span>
    </div>
  );
}