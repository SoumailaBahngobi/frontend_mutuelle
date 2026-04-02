<<<<<<< HEAD
import React, { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "react-toastify";
import "bootstrap/dist/css/bootstrap.min.css";

export default function Login() {
  const [form, setForm] = useState({
    email: "",
    password: "",
=======
import React, { useState } from 'react';
import axios from 'axios';
import apiClient from '../apiConfig'; // use shared axios instance
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';

export default function Login() {
  const [form, setForm] = useState({
    email: '',
    password: ''
>>>>>>> 0ca80779bd2df063c6c22313cd408bc6f07a9320
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState("");
  const [forgotPasswordLoading, setForgotPasswordLoading] = useState(false);

  const navigate = useNavigate();

  // =============================
  // 🔄 Handle Change
  // =============================
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (error) setError("");
  };

  // =============================
  // 🔐 LOGIN
  // =============================
  const handleSubmit = async (e) => {
    e.preventDefault();
<<<<<<< HEAD
=======
    setError('');
>>>>>>> 0ca80779bd2df063c6c22313cd408bc6f07a9320

    if (!form.email || !form.password) {
      toast.error("Veuillez remplir tous les champs");
      return;
    }

    setLoading(true);

    try {
<<<<<<< HEAD
      const res = await axios.post(
        "http://localhost:8080/mutuelle/login",
        form
      );

      if (res.data?.token) {
        localStorage.setItem("token", res.data.token);

        toast.success("Connexion réussie !");
        navigate("/dashboard");
=======
      // try the authentication endpoint consistent with registration
      const res = await apiClient.post('/mutuelle/auth/login', form);
      console.log('login response', res);

      if (res.data && res.data.token) {
        localStorage.setItem('token', res.data.token);
        let userData = null;
        if (res.data.user) {
          userData = res.data.user;
        } else if (res.data.member) {
          userData = res.data.member;
        } else {
          userData = await fetchUserProfile(res.data.token);
        }

        if (userData) {
          localStorage.setItem('currentUser', JSON.stringify(userData));
          toast.success('Connexion réussie !');
          navigate('/dashboard');
        } else {
          toast.error("Connexion réussie, mais accès au profil refusé. Contactez l'administrateur.");
        }
>>>>>>> 0ca80779bd2df063c6c22313cd408bc6f07a9320
      } else {
        toast.error("Réponse invalide du serveur");
      }
    } catch (err) {
      if (err.response?.status === 401) {
        setError("Email ou mot de passe incorrect");
        toast.error("Email ou mot de passe incorrect");
      } else if (err.response?.status >= 500) {
        toast.error("Erreur serveur. Veuillez réessayer.");
      } else {
        toast.error("Erreur de connexion.");
      }
    } finally {
      setLoading(false);
    }
  };

<<<<<<< HEAD
  // =============================
  // 🔑 FORGOT PASSWORD
  // =============================
  const handleForgotPassword = async (e) => {
    e.preventDefault();

=======
  const fetchUserProfile = async (token) => {
    try {
      const response = await apiClient.get('/mutuelle/member/profile', {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      toast.error('Erreur lors de la récupération du profil. Veuillez réessayer.');
      return null;
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();

    // Validation de l'email
>>>>>>> 0ca80779bd2df063c6c22313cd408bc6f07a9320
    if (!forgotPasswordEmail) {
      toast.error("Veuillez entrer votre email");
      return;
    }

    setForgotPasswordLoading(true);

    try {
<<<<<<< HEAD
      await axios.post(
        "http://localhost:8080/mutuelle/member/forgot-password",
        { email: forgotPasswordEmail }
      );
=======
      const response = await apiClient.post('/mutuelle/member/forgot-password', {
        email: forgotPasswordEmail
      });
>>>>>>> 0ca80779bd2df063c6c22313cd408bc6f07a9320

      toast.success(
        "Un email de réinitialisation a été envoyé."
      );

      setShowForgotPassword(false);
      setForgotPasswordEmail("");
    } catch (error) {
<<<<<<< HEAD
=======
      console.error('Erreur mot de passe oublié:', error);

      // Gestion détaillée des erreurs
>>>>>>> 0ca80779bd2df063c6c22313cd408bc6f07a9320
      if (error.response?.status === 404) {
        toast.error("Aucun compte trouvé avec cet email.");
      } else {
        toast.error("Erreur lors de la demande.");
      }
    } finally {
      setForgotPasswordLoading(false);
    }
  };

  // =============================
  // 🖥️ UI
  // =============================
  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light">
<<<<<<< HEAD
      <div className="col-md-5">

        {/* MODAL MOT DE PASSE OUBLIE */}
        {showForgotPassword && (
          <div className="modal fade show d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content p-4">
                <h5>Mot de passe oublié</h5>
                <form onSubmit={handleForgotPassword}>
                  <input
                    type="email"
                    className="form-control my-3"
                    placeholder="Votre email"
                    value={forgotPasswordEmail}
                    onChange={(e) => setForgotPasswordEmail(e.target.value)}
                    required
                  />
                  <button
                    className="btn btn-primary w-100"
                    disabled={forgotPasswordLoading}
                  >
                    {forgotPasswordLoading
                      ? "Envoi..."
                      : "Envoyer le lien"}
                  </button>
=======
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-md-6 col-lg-5">

            {/* Modal Mot de passe oublié */}
            {showForgotPassword && (
              <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} tabIndex="-1">
                <div className="modal-dialog modal-dialog-centered">
                  <div className="modal-content">
                    <div className="modal-header">
                      <h5 className="modal-title">
                        <i className="bi bi-key me-2"></i>
                        Mot de passe oublié
                      </h5>
                      <button
                        type="button"
                        className="btn-close"
                        onClick={() => {
                          setShowForgotPassword(false);
                          setForgotPasswordEmail('');
                        }}
                        disabled={forgotPasswordLoading}
                      ></button>
                    </div>
                    <div className="modal-body">
                      <p className="text-muted mb-3">
                        Entrez votre adresse email pour recevoir un lien de réinitialisation.
                      </p>
                      <form onSubmit={handleForgotPassword}>
                        <div className="form-group mb-3">
                          <label htmlFor="forgotPasswordEmail" className="form-label">
                            Email
                          </label>
                          <input
                            type="email"
                            className="form-control"
                            id="forgotPasswordEmail"
                            value={forgotPasswordEmail}
                            onChange={(e) => setForgotPasswordEmail(e.target.value)}
                            placeholder="votre@email.com"
                            required
                            disabled={forgotPasswordLoading}
                          />
                        </div>
                        <div className="d-grid gap-2">
                          <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={forgotPasswordLoading}
                          >
                            {forgotPasswordLoading ? (
                              <>
                                <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                                Envoi en cours...
                              </>
                            ) : (
                              <>
                                <i className="bi bi-send me-2"></i>
                                Envoyer le lien
                              </>
                            )}
                          </button>
                          <button
                            type="button"
                            className="btn btn-outline-secondary"
                            onClick={() => {
                              setShowForgotPassword(false);
                              setForgotPasswordEmail('');
                            }}
                            disabled={forgotPasswordLoading}
                          >
                            Annuler
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Carte de connexion principale */}
            <div className="card shadow-lg border-0 rounded-3">

              <div className="card-header bg-primary text-white text-center py-3 rounded-top-3">
                <h4 className="fw-bold mb-0">
                  <i className="bi bi-shield-lock me-2"></i>
                  Connexion
                </h4>
              </div>
              <div className="card-body p-4 p-md-5">
                <form onSubmit={handleSubmit} noValidate>
                  <div className="form-group mb-3">
                    <label htmlFor="email" className="form-label fw-semibold">
                      <i className="bi bi-envelope me-2"></i>
                      Email
                    </label>
                    <input
                      type="email"
                      className={`form-control ${error ? 'is-invalid' : ''}`}
                      id="email"
                      name="email"
                      value={form.email}
                      onChange={handleChange}
                      placeholder="votre@email.com"
                      required
                      disabled={loading}
                    />
                  </div>

                  <div className="form-group mb-3">
                    <label htmlFor="password" className="form-label fw-semibold">
                      <i className="bi bi-lock me-2"></i>
                      Mot de passe
                    </label>
                    <input
                      type="password"
                      className={`form-control ${error ? 'is-invalid' : ''}`}
                      id="password"
                      name="password"
                      value={form.password}
                      onChange={handleChange}
                      placeholder="Votre mot de passe"
                      required
                      disabled={loading}
                    />
                  </div>
                  <div className="text-end mb-4">
                    <button
                      type="button"
                      className="btn btn-link p-0 text-decoration-none"
                      onClick={() => setShowForgotPassword(true)}
                      disabled={loading}
                    >
                      <small>
                        <i className="bi bi-question-circle me-1"></i>
                        Mot de passe oublié ?
                      </small>
                    </button>
                  </div>

                  {error && (
                    <div className="alert alert-warning d-flex align-items-center mb-4" role="alert">
                      <i className="bi bi-exclamation-triangle me-2"></i>
                      <div className="small">
                        <strong>Identifiants incorrects</strong>
                        <div className="mt-1">
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-primary"
                            onClick={() => setShowForgotPassword(true)}
                          >
                            <i className="bi bi-key me-1"></i>
                            Réinitialiser le mot de passe
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="d-grid mb-4">
                    <button
                      type="submit"
                      className="btn btn-primary fw-semibold py-2"
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                          Connexion...
                        </>
                      ) : (
                        <>
                          <i className="bi bi-box-arrow-in-right me-2"></i>
                          Se connecter
                        </>
                      )}
                    </button>
                  </div>

                  <div className="text-center">
                    <p className="mb-3 text-muted small">Vous n'avez pas de compte ?</p>
                    <Link
                      to="/register"
                      className="btn btn-outline-primary btn-sm"
                      disabled={loading}
                    >
                      <i className="bi bi-person-plus me-2"></i>
                      Créer un compte
                    </Link>
                  </div>
>>>>>>> 0ca80779bd2df063c6c22313cd408bc6f07a9320
                </form>
                <button
                  className="btn btn-link mt-2"
                  onClick={() => setShowForgotPassword(false)}
                >
                  Annuler
                </button>
              </div>
<<<<<<< HEAD
            </div>
          </div>
        )}

        {/* CARTE LOGIN */}
        <div className="card shadow-lg">
          <div className="card-header bg-primary text-white text-center">
            <h4>Connexion</h4>
          </div>

          <div className="card-body p-4">
            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label>Email</label>
                <input
                  type="email"
                  name="email"
                  className={`form-control ${error ? "is-invalid" : ""}`}
                  value={form.email}
                  onChange={handleChange}
                  disabled={loading}
                />
=======
              <div className="card-footer text-center py-2 bg-light rounded-bottom-3">
                <small className="text-muted">
                  <i className="bi bi-shield-check me-1"></i>
                  Sécurisé et confidentiel
                </small>
>>>>>>> 0ca80779bd2df063c6c22313cd408bc6f07a9320
              </div>

              <div className="mb-3">
                <label>Mot de passe</label>
                <input
                  type="password"
                  name="password"
                  className={`form-control ${error ? "is-invalid" : ""}`}
                  value={form.password}
                  onChange={handleChange}
                  disabled={loading}
                />
              </div>

              <div className="text-end mb-3">
                <button
                  type="button"
                  className="btn btn-link p-0"
                  onClick={() => setShowForgotPassword(true)}
                >
                  Mot de passe oublié ?
                </button>
              </div>

              <button
                type="submit"
                className="btn btn-primary w-100"
                disabled={loading}
              >
                {loading ? "Connexion..." : "Se connecter"}
              </button>
            </form>

            <div className="text-center mt-4">
              <small>Pas encore de compte ?</small>
              <br />
              <Link to="/register" className="btn btn-outline-primary btn-sm mt-2">
                Créer un compte
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
