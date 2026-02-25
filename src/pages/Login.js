// src/pages/Login.js
import { useEffect } from 'react';
import { useKeycloak } from '@react-keycloak/web';
import { useNavigate } from 'react-router-dom';
import LoadingSpinner from '../component/LoadingSpinner';

export default function Login() {
  const { keycloak, initialized } = useKeycloak();
  const navigate = useNavigate();

  useEffect(() => {
    if (initialized && !keycloak.authenticated) {
      keycloak.login();
    } else if (keycloak.authenticated) {
      navigate('/dashboard');
    }
  }, [initialized, keycloak, navigate]);

  return <LoadingSpinner message="Redirection vers Keycloak..." />;
}