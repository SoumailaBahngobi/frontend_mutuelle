import React, { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "react-toastify";
import "bootstrap/dist/css/bootstrap.min.css";

export default function Login() {
  const [form, setForm] = useState({
    email: "",
    password: "",
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

    if (!form.email || !form.password) {
      toast.error("Veuillez remplir tous les champs");
      return;
    }

    setLoading(true);

    try {
      const res = await axios.post(
        "http://localhost:8080/mutuelle/login",
        form
      );

      if (res.data?.token) {
        localStorage.setItem("token", res.data.token);

        toast.success("Connexion réussie !");
        navigate("/dashboard");
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

  // =============================
  // 🔑 FORGOT PASSWORD
  // =============================
  const handleForgotPassword = async (e) => {
    e.preventDefault();

    if (!forgotPasswordEmail) {
      toast.error("Veuillez entrer votre email");
      return;
    }

    setForgotPasswordLoading(true);

    try {
      await axios.post(
        "http://localhost:8080/mutuelle/member/forgot-password",
        { email: forgotPasswordEmail }
      );

      toast.success(
        "Un email de réinitialisation a été envoyé."
      );

      setShowForgotPassword(false);
      setForgotPasswordEmail("");
    } catch (error) {
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
                </form>
                <button
                  className="btn btn-link mt-2"
                  onClick={() => setShowForgotPassword(false)}
                >
                  Annuler
                </button>
              </div>
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
