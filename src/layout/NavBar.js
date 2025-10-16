// src/layout/Navbar.js
import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';

export default function Navbar() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('currentUser');
    
    if (token && userData) {
      setIsAuthenticated(true);
      setUser(JSON.parse(userData));
    } else {
      setIsAuthenticated(false);
      setUser(null);
    }
  }, [location]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('currentUser');
    setIsAuthenticated(false);
    setUser(null);
    navigate('/');
  };

  const isAdmin = user && (user.role === 'ADMIN' || user.role === 'PRESIDENT' || user.role === 'SECRETARY' || user.role === 'TREASURER');

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-primary shadow-sm">
      <div className="container">
        {/* Brand */}
        <Link className="navbar-brand fw-bold" to="/">
          <i className="fas fa-hand-holding-heart me-2"></i>
          Mutuelle
        </Link>

        {/* Mobile toggle */}
        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarContent"
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        {/* Navbar content */}
        <div className="collapse navbar-collapse" id="navbarContent">
          {/* Navigation links */}
          <ul className="navbar-nav me-auto">
            <li className="nav-item">
              <Link 
                className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}
                to="/"
              >
                <i className="fas fa-home me-1"></i>
                Accueil
              </Link>
            </li>

            {isAuthenticated && (
              <>
                <li className="nav-item">
                  <Link 
                    className={`nav-link ${location.pathname === '/dashboard' ? 'active' : ''}`}
                    to="/dashboard"
                  >
                    <i className="fas fa-tachometer-alt me-1"></i>
                    Tableau de bord
                  </Link>
                </li>

                {/* Menu Prêts */}
                <li className="nav-item dropdown">
                  <a
                    className="nav-link dropdown-toggle"
                    href="#"
                    role="button"
                    data-bs-toggle="dropdown"
                  >
                    <i className="fas fa-hand-holding-usd me-1"></i>
                    Prêts
                  </a>
                  <ul className="dropdown-menu">
                    <li>
                      <Link className="dropdown-item" to="/loans/request">
                        <i className="fas fa-plus-circle me-2"></i>
                        Nouvelle demande
                      </Link>
                    </li>
                    <li>
                      <Link className="dropdown-item" to="/loans/requests">
                        <i className="fas fa-list me-2"></i>
                        Mes demandes
                      </Link>
                    </li>
                    <li>
                      <Link className="dropdown-item" to="/loans/my-loans">
                        <i className="fas fa-file-invoice me-2"></i>
                        Mes prêts
                      </Link>
                    </li>
                    <li>
                      <Link className="dropdown-item" to="/loans/repayment">
                        <i className="fas fa-credit-card me-2"></i>
                        Remboursement
                      </Link>
                    </li>
                    
                    {/* Options admin pour les prêts */}
                    {isAdmin && (
                      <>
                        <li><hr className="dropdown-divider" /></li>
                        <li>
                          <Link className="dropdown-item" to="/loans/approval-dashboard">
                            <i className="fas fa-check-double me-2"></i>
                            Approbation prêts
                          </Link>
                        </li>
                        <li>
                          <Link className="dropdown-item" to="/loans/create">
                            <i className="fas fa-plus me-2"></i>
                            Créer prêt
                          </Link>
                        </li>
                      </>
                    )}
                  </ul>
                </li>

                {/* Menu Cotisations */}
                <li className="nav-item dropdown">
                  <a
                    className="nav-link dropdown-toggle"
                    href="#"
                    role="button"
                    data-bs-toggle="dropdown"
                  >
                    <i className="fas fa-money-bill-wave me-1"></i>
                    Cotisations
                  </a>
                  <ul className="dropdown-menu">
                    <li>
                      <Link className="dropdown-item" to="/mut/contribution/individual">
                        <i className="fas fa-user me-2"></i>
                        Cotisation individuelle
                      </Link>
                    </li>
                    <li>
                      <Link className="dropdown-item" to="/mut/contribution/group">
                        <i className="fas fa-users me-2"></i>
                        Cotisation groupe
                      </Link>
                    </li>
                    <li>
                      <Link className="dropdown-item" to="/mut/contribution/individual/my-contributions">
                        <i className="fas fa-history me-2"></i>
                        Historique
                      </Link>
                    </li>
                    
                    {/* Options admin pour les cotisations */}
                    {isAdmin && (
                      <>
                        <li><hr className="dropdown-divider" /></li>
                        <li>
                          <Link className="dropdown-item" to="/mut/contribution_period">
                            <i className="fas fa-calendar-alt me-2"></i>
                            Périodes cotisation
                          </Link>
                        </li>
                      </>
                    )}
                  </ul>
                </li>

                {/* Menu Administration */}
                {isAdmin && (
                  <li className="nav-item dropdown">
                    <a
                      className="nav-link dropdown-toggle"
                      href="#"
                      role="button"
                      data-bs-toggle="dropdown"
                    >
                      <i className="fas fa-user-shield me-1"></i>
                      Administration
                    </a>
                    <ul className="dropdown-menu">
                      <li>
                        <Link className="dropdown-item" to="/members">
                          <i className="fas fa-user-plus me-2"></i>
                          Gestion membres
                        </Link>
                      </li>
                      <li>
                        <Link className="dropdown-item" to="/loans/approval">
                          <i className="fas fa-check-circle me-2"></i>
                          Validation prêts
                        </Link>
                      </li>
                      <li>
                        <Link className="dropdown-item" to="/mut/contribution_period">
                          <i className="fas fa-calendar me-2"></i>
                          Périodes
                        </Link>
                      </li>
                    </ul>
                  </li>
                )}
              </>
            )}
          </ul>

          {/* User section */}
          <ul className="navbar-nav ms-auto">
            {isAuthenticated ? (
              <li className="nav-item dropdown">
                <a
                  className="nav-link dropdown-toggle d-flex align-items-center"
                  href="#"
                  role="button"
                  data-bs-toggle="dropdown"
                >
                  {user?.photo ? (
                    <img
                      src={user.photo}
                      alt="Profil"
                      className="rounded-circle me-2"
                      width="32"
                      height="32"
                      style={{ objectFit: 'cover' }}
                    />
                  ) : (
                    <i className="fas fa-user-circle me-2"></i>
                  )}
                  <span>{user?.firstName} {user?.name}</span>
                </a>
                <ul className="dropdown-menu dropdown-menu-end">
                  <li>
                    <Link className="dropdown-item" to="/dashboard">
                      <i className="fas fa-tachometer-alt me-2"></i>
                      Tableau de bord
                    </Link>
                  </li>
                  <li>
                    <Link className="dropdown-item" to="/profile">
                      <i className="fas fa-user me-2"></i>
                      Mon profil
                    </Link>
                  </li>
                  <li><hr className="dropdown-divider" /></li>
                  <li>
                    <button className="dropdown-item text-danger" onClick={handleLogout}>
                      <i className="fas fa-sign-out-alt me-2"></i>
                      Déconnexion
                    </button>
                  </li>
                </ul>
              </li>
            ) : (
              <li className="nav-item">
                <Link className="btn btn-outline-light btn-sm" to="/login">
                  <i className="fas fa-sign-in-alt me-1"></i>
                  Connexion
                </Link>
              </li>
            )}
          </ul>
        </div>
      </div>
    </nav>
  );
}