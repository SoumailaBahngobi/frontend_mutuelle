import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "bootstrap/dist/css/bootstrap.min.css";

export default function AddContributionPeriod() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    startDate: "",
    endDate: "",
    name: "",
    amount: "",
    status: "",
    description: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [authChecked, setAuthChecked] = useState(false);

  // =============================
  // 🔐 Vérification Auth
  // =============================
  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token || token === "undefined" || token === "null") {
      setError("Authentification requise. Redirection...");
      setTimeout(() => navigate("/login"), 2000);
    } else {
      setAuthChecked(true);
    }
  }, [navigate]);

  const getAuthHeaders = () => {
    const token = localStorage.getItem("token");
    return {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };
  };

  // =============================
  // 🔄 Handle Change
  // =============================
  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  // =============================
  // 📤 Submit
  // =============================
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const apiData = {
        startDate: form.startDate,
        endDate: form.endDate,
        name: form.name,
        individualAmount: parseFloat(form.amount),
        status: form.status,
        description: form.description,
      };

      await axios.post(
        "http://localhost:8080/mutuelle/contribution_period",
        apiData,
        { headers: getAuthHeaders() }
      );

      alert("Campagne de cotisation ajoutée avec succès !");
      navigate("/dashboard");

    } catch (err) {
      console.error(err);

      if (err.response?.status === 401) {
        setError("Session expirée. Veuillez vous reconnecter.");
        localStorage.removeItem("token");
        setTimeout(() => navigate("/login"), 2000);
        return;
      }

      setError(
        err.response?.data?.message ||
          "Erreur lors de l'ajout de la campagne."
      );
    } finally {
      setLoading(false);
    }
  };

  // =============================
  // ⏳ Loader Auth
  // =============================
  if (!authChecked) {
    return (
      <div className="container mt-4 text-center">
        <div className="spinner-border text-primary" role="status" />
        <p className="mt-3">Vérification de l'authentification...</p>
      </div>
    );
  }

  // =============================
  // 🖥️ UI
  // =============================
  return (
    <div className="container mt-4">
      <div className="row justify-content-center">
        <div className="col-md-8">
          <div className="card shadow">
            <div className="card-header bg-primary text-white">
              <h3 className="mb-0">
                Ajouter une campagne de Cotisation
              </h3>
            </div>

            <div className="card-body">
              {error && (
                <div className="alert alert-danger">
                  <strong>Erreur :</strong> {error}
                </div>
              )}

              <form onSubmit={handleSubmit}>
                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label className="form-label">
                      Date de Début *
                    </label>
                    <input
                      type="date"
                      name="startDate"
                      className="form-control"
                      value={form.startDate}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="col-md-6 mb-3">
                    <label className="form-label">
                      Date de Fin *
                    </label>
                    <input
                      type="date"
                      name="endDate"
                      className="form-control"
                      value={form.endDate}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>

                <div className="mb-3">
                  <label className="form-label">
                    Nom de la campagne
                  </label>
                  <input
                    type="text"
                    name="name"
                    className="form-control"
                    value={form.name}
                    onChange={handleChange}
                    placeholder="Campagne T1 2026"
                  />
                </div>

                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label className="form-label">
                      Montant Individuel *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      name="amount"
                      className="form-control"
                      value={form.amount}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="col-md-6 mb-3">
                    <label className="form-label">
                      Statut *
                    </label>
                    <select
                      name="status"
                      className="form-control"
                      value={form.status}
                      onChange={handleChange}
                      required
                    >
                      <option value="">
                        Sélectionner
                      </option>
                      <option value="ACTIVE">
                        Active
                      </option>
                      <option value="INACTIVE">
                        Inactive
                      </option>
                      <option value="PENDING">
                        En attente
                      </option>
                    </select>
                  </div>
                </div>

                <div className="mb-4">
                  <label className="form-label">
                    Description *
                  </label>
                  <textarea
                    name="description"
                    className="form-control"
                    rows="3"
                    value={form.description}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="d-flex justify-content-end gap-2">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => navigate("/dashboard")}
                    disabled={loading}
                  >
                    Annuler
                  </button>

                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={loading}
                  >
                    {loading
                      ? "Ajout en cours..."
                      : "Ajouter la campagne"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
