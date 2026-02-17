import React from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';

import { useNavigate, useLocation } from 'react-router-dom';

export default function PublicNavbar() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-gradient-primary shadow">
      <div className="container-fluid">
        <a className="navbar-brand" href="/">
          <i className="fas fa-university mr-2"></i>
          <strong>Mutuelle de Solidarité</strong>
        </a>
        
        <button 
          className="navbar-toggler" 
          type="button" 
          data-toggle="collapse"
          data-target="#navbarPublicContent"
        >
          <span className="navbar-toggler-icon"></span>
        </button>
        
        <div className="collapse navbar-collapse" id="navbarPublicContent">
          <ul className="navbar-nav me-auto mb-2 mb-lg-0">
            <li className="nav-item">
              <a 
                className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}
                href="#"
                onClick={(e) => { e.preventDefault(); navigate('/'); }}
              >
                <i className="fas fa-home mr-1"></i>
                Accueil
              </a>
            </li>
            <li className="nav-item">
              <a className="nav-link" href="#">
                <i className="fas fa-hand-holding-usd mr-1"></i>
                Nos Services
              </a>
            </li>
            <li className="nav-item">
              <a className="nav-link" href="#">
                <i className="fas fa-phone mr-1"></i>
                Contact
              </a>
            </li>
          </ul>
          
          <div className="d-flex">
            <button 
              className="btn btn-outline-light btn-sm me-2"
              onClick={() => navigate('/login')}
            >
              <i className="fas fa-sign-in-alt mr-1"></i>
              Connexion
            </button>
            <button 
              className="btn btn-light btn-sm"
              onClick={() => navigate('/register')}
            >
              <i className="fas fa-user-plus mr-1"></i>
              Inscription
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}