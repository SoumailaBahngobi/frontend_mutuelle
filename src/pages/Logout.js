// src/pages/Logout.js
import { useEffect } from 'react';
import { useKeycloak } from '@react-keycloak/web';
import LoadingSpinner from '../components/LoadingSpinner';

export default function Logout() {
  const { keycloak } = useKeycloak();

  useEffect(() => {
    keycloak.logout({
      redirectUri: window.location.origin
    });
  }, [keycloak]);

  return <LoadingSpinner message="Déconnexion en cours..." />;
}