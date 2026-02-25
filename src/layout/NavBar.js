// src/layout/NavBar.js
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useKeycloak } from '@react-keycloak/web';

export default function Navbar() {
  const { keycloak } = useKeycloak();
  const navigate = useNavigate();

  const handleLogout = () => {
    keycloak.logout({
      redirectUri: window.location.origin
    });
  };

  const getUserInfo = () => {
    if (keycloak.authenticated) {
      return {
        name: keycloak.tokenParsed?.given_name || keycloak.tokenParsed?.name,
        email: keycloak.tokenParsed?.email,
        roles: keycloak.tokenParsed?.realm_access?.roles || []
      };
    }
    return null;
  };

  const userInfo = getUserInfo();

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-primary">
      <div className="container-fluid">
        <Link className="navbar-brand" to="/">
          <i className="bi bi-shield-lock me-2"></i>
          Mutuelle
        </Link>
        
        <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
          <span className="navbar-toggler-icon"></span>
        </button>
        
        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav me-auto">
            <li className="nav-item">
              <Link className="nav-link" to="/dashboard">
                <i className="bi bi-speedometer2 me-1"></i>
                Tableau de bord
              </Link>
            </li>
            
            {userInfo?.roles.includes('TREASURER') && (
              <li className="nav-item">
                <Link className="nav-link" to="/treasurer/loans">
                  <i className="bi bi-cash-coin me-1"></i>
                  Gestion trésorier
                </Link>
              </li>
            )}
            
            <li className="nav-item dropdown">
              <a className="nav-link dropdown-toggle" href="#" role="button" data-bs-toggle="dropdown">
                Cotisations
              </a>
              <ul className="dropdown-menu">
                <li><Link className="dropdown-item" to="/mutuelle/contribution/individual">Cotisation individuelle</Link></li>
                <li><Link className="dropdown-item" to="/mutuelle/contribution/group">Cotisation groupe</Link></li>
                <li><hr className="dropdown-divider" /></li>
                <li><Link className="dropdown-item" to="/mutuelle/contribution/individual/my-contributions">Mes cotisations</Link></li>
              </ul>
            </li>
            
            <li className="nav-item dropdown">
              <a className="nav-link dropdown-toggle" href="#" role="button" data-bs-toggle="dropdown">
                Prêts
              </a>
              <ul className="dropdown-menu">
                <li><Link className="dropdown-item" to="/loans/request">Demander un prêt</Link></li>
                <li><Link className="dropdown-item" to="/loans/my-loans">Mes prêts</Link></li>
                <li><Link className="dropdown-item" to="/loans/requests">Mes demandes</Link></li>
                {userInfo?.roles.some(role => ['PRESIDENT', 'SECRETARY', 'TREASURER'].includes(role)) && (
                  <>
                    <li><hr className="dropdown-divider" /></li>
                    <li><Link className="dropdown-item" to="/loans/approval-dashboard">Approbations</Link></li>
                  </>
                )}
              </ul>
            </li>
            
            <li className="nav-item">
              <Link className="nav-link" to="/members/list">
                <i className="bi bi-people me-1"></i>
                Membres
              </Link>
            </li>
          </ul>
          
          <ul className="navbar-nav">
            <li className="nav-item dropdown">
              <a className="nav-link dropdown-toggle" href="#" role="button" data-bs-toggle="dropdown">
                <i className="bi bi-person-circle me-1"></i>
                {userInfo?.name || 'Profil'}
              </a>
              <ul className="dropdown-menu dropdown-menu-end">
                <li><span className="dropdown-item-text text-muted small">{userInfo?.email}</span></li>
                <li><hr className="dropdown-divider" /></li>
                <li><button className="dropdown-item text-danger" onClick={handleLogout}>
                  <i className="bi bi-box-arrow-right me-2"></i>
                  Déconnexion
                </button></li>
              </ul>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
}