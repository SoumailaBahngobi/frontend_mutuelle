// src/layout/Navbar.js
<<<<<<< HEAD
import React, { useState, useEffect, useMemo } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";

export default function Navbar() {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const syncAuth = () => {
      const token = localStorage.getItem("token");
      const userData = localStorage.getItem("currentUser");

      if (token && userData && token !== "undefined") {
        setUser(JSON.parse(userData));
      } else {
        setUser(null);
      }
    };

    syncAuth();

    window.addEventListener("storage", syncAuth);
    return () => window.removeEventListener("storage", syncAuth);
  }, [location]);

  const isAuthenticated = !!user;

  const isAdmin = useMemo(() => {
    if (!user?.role) return false;
    return ["ADMIN", "PRESIDENT", "SECRETARY", "TREASURER"].includes(
      user.role
    );
  }, [user]);

  
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("currentUser");
    setUser(null);
    navigate("/");
  };
=======
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useKeycloak } from '../context/KeycloakContext';
import 'bootstrap/dist/css/bootstrap.min.css';
import { LogInIcon,DiamondPlus, Grid2x2Check,HandCoins,LogOut,House, HistoryIcon,DatabaseZap } from 'lucide-react';

export default function Navbar() {
  const { authenticated, userProfile, logout, loading } = useKeycloak();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
  };

  if (loading) {
    return (
      <nav className="navbar navbar-expand-lg navbar-dark bg-primary shadow-sm">
        <div className="container">
          <Link className="navbar-brand fw-bold" to="/">
            <i className="fas fa-hand-holding-heart me-2"></i>
            Mutuelle
          </Link>
          <div className="ms-auto">
            <span className="text-white">Chargement...</span>
          </div>
        </div>
      </nav>
    );
  }

  // Déterminer le rôle pour les menus admin
  const isAdmin = userProfile &&
    (userProfile.role === 'ADMIN' ||
      userProfile.role === 'PRESIDENT' ||
      userProfile.role === 'SECRETARY' ||
      userProfile.role === 'TREASURER');
>>>>>>> 0ca80779bd2df063c6c22313cd408bc6f07a9320

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-primary shadow-sm">
      <div className="container">

        {/* Brand */}
        <Link className="navbar-brand fw-bold" to="/">
          <i className="fas fa-hand-holding-heart me-2"></i>
         <HandCoins /> Mutuelle
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

        <div className="collapse navbar-collapse" id="navbarContent">

          {/* Left menu */}
          <ul className="navbar-nav me-auto">

            <li className="nav-item">
              <Link
<<<<<<< HEAD
                className={`nav-link ${
                  location.pathname === "/" ? "active" : ""
                }`}
=======
                className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}
>>>>>>> 0ca80779bd2df063c6c22313cd408bc6f07a9320
                to="/"
              >
                <i className="fas fa-home me-1"></i>
               <House /> Accueil
              </Link>
            </li>

            {authenticated && (
              <>
                <li className="nav-item">
                  <Link
<<<<<<< HEAD
                    className={`nav-link ${
                      location.pathname === "/dashboard" ? "active" : ""
                    }`}
=======
                    className={`nav-link ${location.pathname === '/dashboard' ? 'active' : ''}`}
>>>>>>> 0ca80779bd2df063c6c22313cd408bc6f07a9320
                    to="/dashboard"
                  >
                    <i className="fas fa-tachometer-alt me-1"></i>
                   <Grid2x2Check /> Tableau de bord
                  </Link>
                </li>

                {/* ================= PRÊTS ================= */}
                <li className="nav-item dropdown">
                  <button
                    className="nav-link dropdown-toggle btn btn-link text-white"
                    data-bs-toggle="dropdown"
                  >
                    <i className="fas fa-hand-holding-usd me-1"></i>
<<<<<<< HEAD
                    Prêts
                  </button>

                  <ul className="dropdown-menu">
                    <li>
                      <Link className="dropdown-item" to="/loans/request">
                        Nouvelle demande
=======
                  <HandCoins />  Prêts
                  </a>
                  <ul className="dropdown-menu">
                    <li>
                      <Link className="dropdown-item" to="/loans/request">
                        <i className="fas fa-plus-circle me-2"></i>
                       <DiamondPlus /> Nouvelle demande
>>>>>>> 0ca80779bd2df063c6c22313cd408bc6f07a9320
                      </Link>
                    </li>
                    <li>
                      <Link className="dropdown-item" to="/loans/requests">
                        Mes demandes
                      </Link>
                    </li>
                    <li>
                      <Link className="dropdown-item" to="/loans/my-loans">
                        Mes prêts
                      </Link>
                    </li>
                    <li>
                      <Link className="dropdown-item" to="/loans/repayment">
                        Remboursement
                      </Link>
                    </li>
<<<<<<< HEAD

=======
                    <li>
                      <Link className="dropdown-item" to="/loans/repayment-history">
                        <i className="fas fa-history me-2"></i>
                        <HistoryIcon /> Historique remboursements
                      </Link>
                    </li>

                    {/* Options admin ou manager pour les prêts */}
>>>>>>> 0ca80779bd2df063c6c22313cd408bc6f07a9320
                    {isAdmin && (
                      <>
                        <li><hr className="dropdown-divider" /></li>
                        <li>
                          <Link
                            className="dropdown-item"
                            to="/loans/approval-dashboard"
                          >
                            Approbation prêts
                          </Link>
                        </li>
                        <li>
                          <Link className="dropdown-item" to="/loans/create">
                            Créer prêt
                          </Link>
                        </li>
                      </>
                    )}
                  </ul>
                </li>

                <li className="nav-item dropdown">
                  <button
                    className="nav-link dropdown-toggle btn btn-link text-white"
                    data-bs-toggle="dropdown"
                  >
                    <i className="fas fa-money-bill-wave me-1"></i>
<<<<<<< HEAD
                    Cotisations
                  </button>

=======
                    <DatabaseZap /> Cotisations
                  </a>
>>>>>>> 0ca80779bd2df063c6c22313cd408bc6f07a9320
                  <ul className="dropdown-menu">
                    <li>
                      <Link
                        className="dropdown-item"
                        to="/mutuelle/contribution/individual"
                      >
                        Cotisation individuelle
                      </Link>
                    </li>
                    <li>
                      <Link
                        className="dropdown-item"
                        to="/mutuelle/contribution/group"
                      >
                        Cotisation groupe
                      </Link>
                    </li>
                    <li>
                      <Link
                        className="dropdown-item"
                        to="/mutuelle/contribution/individual/my-contributions"
                      >
                        Historique
                      </Link>
                    </li>

<<<<<<< HEAD
=======
                    {/* Options admin pour les cotisations */}
>>>>>>> 0ca80779bd2df063c6c22313cd408bc6f07a9320
                    {isAdmin && (
                      <>
                        <li><hr className="dropdown-divider" /></li>
                        <li>
                          <Link
                            className="dropdown-item"
                            to="/mutuelle/contribution_period"
                          >
                            Périodes cotisation
                          </Link>
                        </li>
                      </>
                    )}
                  </ul>
                </li>

<<<<<<< HEAD
                {/* ================= ADMIN ================= */}
=======
                {/* Menu Administration  ou manager*/}
>>>>>>> 0ca80779bd2df063c6c22313cd408bc6f07a9320
                {isAdmin && (
                  <li className="nav-item dropdown">
                    <button
                      className="nav-link dropdown-toggle btn btn-link text-white"
                      data-bs-toggle="dropdown"
                    >
<<<<<<< HEAD
                      Administration
                    </button>

                    <ul className="dropdown-menu">
                      <li>
                        <Link className="dropdown-item" to="/members">
=======
                      <i className="fas fa-user-shield me-1"></i>
                      Manager
                    </a>
                    <ul className="dropdown-menu">
                      <li>
                        <Link className="dropdown-item" to="/members/list">
                          <i className="fas fa-user-plus me-2"></i>
>>>>>>> 0ca80779bd2df063c6c22313cd408bc6f07a9320
                          Gestion membres
                        </Link>
                      </li>
                      <li>
                        <Link className="dropdown-item" to="/loans/approval">
                          Validation prêts
                        </Link>
                      </li>
                      <li>
                        <Link
                          className="dropdown-item"
                          to="/mutuelle/contribution_period"
                        >
                          Périodes
                        </Link>
                      </li>
                    </ul>
                  </li>
                )}
              </>
            )}
          </ul>

          {/* ================= USER SECTION ================= */}
          <ul className="navbar-nav ms-auto">
            {authenticated ? (
              <li className="nav-item dropdown">
                <button
                  className="nav-link dropdown-toggle btn btn-link text-white d-flex align-items-center"
                  data-bs-toggle="dropdown"
                >
                  {userProfile?.photo ? (
                    <img
                      src={userProfile.photo}
                      alt="Profil"
                      className="rounded-circle me-2"
                      width="32"
                      height="32"
                      style={{ objectFit: "cover" }}
                    />
                  ) : (
                    <i className="fas fa-user-circle me-2 fs-5"></i>
                  )}
<<<<<<< HEAD
                  {user?.firstName} {user?.name}
                </button>

                <ul className="dropdown-menu dropdown-menu-end">
                  <li>
                    <Link className="dropdown-item" to="/dashboard">
                      Tableau de bord
=======
                  <span>{userProfile?.firstName} {userProfile?.lastName}</span>
                </a>
                <ul className="dropdown-menu dropdown-menu-end">
                  <li>
                    <Link className="dropdown-item" to="/dashboard">
                      <i className="fas fa-tachometer-alt me-2"></i>
                    <Grid2x2Check />  Tableau de bord
>>>>>>> 0ca80779bd2df063c6c22313cd408bc6f07a9320
                    </Link>
                  </li>
                  <li>
                    <Link className="dropdown-item" to="/profile">
                      Mon profil
                    </Link>
                  </li>
                  <Link className="dropdown-item" to="/change-password">
                    <i className="bi bi-shield-lock me-2"></i>Changer mot de passe
                  </Link>
                  <li><hr className="dropdown-divider" /></li>
                  <li>
<<<<<<< HEAD
                    <button
                      className="dropdown-item text-danger"
                      onClick={handleLogout}
                    >
                      Déconnexion
=======
                    <button className="dropdown-item text-danger" onClick={handleLogout}>
                      <i className="fas fa-sign-out-alt me-2"></i>
                     <LogOut /> Déconnexion
>>>>>>> 0ca80779bd2df063c6c22313cd408bc6f07a9320
                    </button>
                  </li>
                </ul>
              </li>
            ) : (
              <li className="nav-item">
<<<<<<< HEAD
                <Link
                  className="btn btn-outline-light btn-sm"
                  to="/login"
                >
                  Connexion
=======
                <Link className="btn btn-outline-light btn-sm" to="/login">
                  <i className="fas fa-sign-in-alt me-1"></i>
                  <LogInIcon /> Connexion
>>>>>>> 0ca80779bd2df063c6c22313cd408bc6f07a9320
                </Link>
              </li>
            )}
          </ul>
        </div>
      </div>
    </nav>
  );
}
