// src/layout/Navbar.js
import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';

const Navbar = () => {
  const [currentUser, setCurrentUser] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('currentUser') || '{}');
    setCurrentUser(user);
  }, [location]);

  const isValidator = currentUser && (
    currentUser.role === 'PRESIDENT' || 
    currentUser.role === 'SECRETARY' || 
    currentUser.role === 'TREASURER' || 
    currentUser.role === 'ADMIN'
  );

  const isAdmin = currentUser && (
    currentUser.role === 'ADMIN' || 
    currentUser.role === 'PRESIDENT' || 
    currentUser.role === 'SECRETARY' || 
    currentUser.role === 'TREASURER'
  );

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('currentUser');
    navigate('/login');
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-primary shadow">
      <div className="container-fluid">
        <Link className="navbar-brand fw-bold" to="/dashboard">
          <i className="fas fa-hand-holding-usd me-2"></i>
          Mutuelle WBF
        </Link>
        
        <button 
          className="navbar-toggler" 
          type="button" 
          data-bs-toggle="collapse" 
          data-bs-target="#navbarMain"
        >
          <span className="navbar-toggler-icon"></span>
        </button>
        
        <div className="collapse navbar-collapse" id="navbarMain">
          <ul className="navbar-nav me-auto">
            <li className="nav-item">
              <Link 
                className={`nav-link ${location.pathname === '/dashboard' ? 'active' : ''}`} 
                to="/dashboard"
              >
                <i className="fas fa-home me-1"></i>
                Accueil
              </Link>
            </li>

            {/* Menu Validation pour les validateurs */}
            {isValidator && (
              <li className="nav-item dropdown">
                <a className="nav-link dropdown-toggle" href="#" role="button" data-bs-toggle="dropdown">
                  <i className="fas fa-check-circle me-1"></i>
                  Validation Prêts
                </a>
                <ul className="dropdown-menu">
                  <li>
                    <Link 
                      className={`dropdown-item ${location.pathname === '/loans/approval-dashboard' ? 'active' : ''}`} 
                      to="/loans/approval-dashboard"
                    >
                      <i className="fas fa-tachometer-alt me-2"></i>
                      Tableau de bord
                    </Link>
                  </li>
                  <li>
                    <Link 
                      className={`dropdown-item ${location.pathname === '/loans/approval' ? 'active' : ''}`} 
                      to="/loans/approval"
                    >
                      <i className="fas fa-check me-2"></i>
                      Approbations
                    </Link>
                  </li>
                  <li>
                    <Link 
                      className={`dropdown-item ${location.pathname === '/loans/validation-reports' ? 'active' : ''}`} 
                      to="/loans/validation-reports"
                    >
                      <i className="fas fa-chart-bar me-2"></i>
                      Rapports
                    </Link>
                  </li>
                </ul>
              </li>
            )}
          </ul>

          {/* Section utilisateur */}
          <ul className="navbar-nav">
            {currentUser ? (
              <li className="nav-item dropdown">
                <a className="nav-link dropdown-toggle" href="#" role="button" data-bs-toggle="dropdown">
                  <i className="fas fa-user-circle me-1"></i>
                  {currentUser.firstName} {currentUser.name}
                  <span className="badge bg-light text-primary ms-2 small">
                    {currentUser.role}
                  </span>
                </a>
                <ul className="dropdown-menu dropdown-menu-end">
                  <li>
                    <span className="dropdown-item-text small">
                      <i className="fas fa-envelope me-2"></i>
                      {currentUser.email}
                    </span>
                  </li>
                  <li><hr className="dropdown-divider" /></li>
                  <li>
                    <button className="dropdown-item" onClick={handleLogout}>
                      <i className="fas fa-sign-out-alt me-2"></i>
                      Déconnexion
                    </button>
                  </li>
                </ul>
              </li>
            ) : (
              <li className="nav-item">
                <Link className="nav-link" to="/login">
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
};

export default Navbar;