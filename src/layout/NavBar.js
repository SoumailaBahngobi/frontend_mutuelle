// src/layout/Navbar.js
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

        <div className="collapse navbar-collapse" id="navbarContent">

          {/* Left menu */}
          <ul className="navbar-nav me-auto">

            <li className="nav-item">
              <Link
                className={`nav-link ${
                  location.pathname === "/" ? "active" : ""
                }`}
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
                    className={`nav-link ${
                      location.pathname === "/dashboard" ? "active" : ""
                    }`}
                    to="/dashboard"
                  >
                    <i className="fas fa-tachometer-alt me-1"></i>
                    Tableau de bord
                  </Link>
                </li>

                {/* ================= PRÊTS ================= */}
                <li className="nav-item dropdown">
                  <button
                    className="nav-link dropdown-toggle btn btn-link text-white"
                    data-bs-toggle="dropdown"
                  >
                    <i className="fas fa-hand-holding-usd me-1"></i>
                    Prêts
                  </button>

                  <ul className="dropdown-menu">
                    <li>
                      <Link className="dropdown-item" to="/loans/request">
                        Nouvelle demande
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
                    Cotisations
                  </button>

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

                {/* ================= ADMIN ================= */}
                {isAdmin && (
                  <li className="nav-item dropdown">
                    <button
                      className="nav-link dropdown-toggle btn btn-link text-white"
                      data-bs-toggle="dropdown"
                    >
                      Administration
                    </button>

                    <ul className="dropdown-menu">
                      <li>
                        <Link className="dropdown-item" to="/members">
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
            {isAuthenticated ? (
              <li className="nav-item dropdown">
                <button
                  className="nav-link dropdown-toggle btn btn-link text-white d-flex align-items-center"
                  data-bs-toggle="dropdown"
                >
                  {user?.photo ? (
                    <img
                      src={user.photo}
                      alt="Profil"
                      className="rounded-circle me-2"
                      width="32"
                      height="32"
                      style={{ objectFit: "cover" }}
                    />
                  ) : (
                    <i className="fas fa-user-circle me-2"></i>
                  )}
                  {user?.firstName} {user?.name}
                </button>

                <ul className="dropdown-menu dropdown-menu-end">
                  <li>
                    <Link className="dropdown-item" to="/dashboard">
                      Tableau de bord
                    </Link>
                  </li>
                  <li>
                    <Link className="dropdown-item" to="/profile">
                      Mon profil
                    </Link>
                  </li>
                  <li><hr className="dropdown-divider" /></li>
                  <li>
                    <button
                      className="dropdown-item text-danger"
                      onClick={handleLogout}
                    >
                      Déconnexion
                    </button>
                  </li>
                </ul>
              </li>
            ) : (
              <li className="nav-item">
                <Link
                  className="btn btn-outline-light btn-sm"
                  to="/login"
                >
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
