import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "bootstrap/dist/css/bootstrap.min.css";

function AddIndividualContribution() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    amount: "",
    paymentDate: new Date().toISOString().split("T")[0],
    contributionPeriodId: "",
    paymentMode: "ESPECES",
    paymentProof: null,
  });

  const [contributionPeriods, setContributionPeriods] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [fileName, setFileName] = useState("");
  const [error, setError] = useState("");

  // ===========================
  // INIT
  // ===========================
  useEffect(() => {
    checkUser();
    fetchContributionPeriods();
  }, []);

  const getAuthHeaders = () => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return {};
    }
    return { Authorization: `Bearer ${token}` };
  };

  const checkUser = () => {
    const userData = localStorage.getItem("currentUser");
    if (!userData) {
      navigate("/login");
      return;
    }
    setCurrentUser(JSON.parse(userData));
  };

  // ===========================
  // FETCH PERIODS
  // ===========================
  const fetchContributionPeriods = async () => {
    try {
      const response = await axios.get(
        "http://localhost:8080/mutuelle/contribution_period",
        { headers: getAuthHeaders() }
      );
      setContributionPeriods(
        Array.isArray(response.data) ? response.data : []
      );
    } catch (err) {
      setError("Erreur lors du chargement des campagnes.");
    } finally {
      setLoading(false);
    }
  };

  // ===========================
  // HANDLE CHANGE
  // ===========================
  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "contributionPeriodId") {
      const selected = contributionPeriods.find(
        (p) => p.id === parseInt(value)
      );

      setForm({
        ...form,
        contributionPeriodId: value,
        amount: selected
          ? selected.individualAmount || selected.amount || ""
          : "",
      });
    } else {
      setForm({ ...form, [name]: value });
    }
  };

  // ===========================
  // FILE HANDLING
  // ===========================
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert("Fichier trop volumineux (max 5MB)");
      return;
    }

    const allowed = [
      "image/jpeg",
      "image/png",
      "application/pdf",
    ];

    if (!allowed.includes(file.type)) {
      alert("Format non supporté (JPG, PNG, PDF)");
      return;
    }

    setForm({ ...form, paymentProof: file });
    setFileName(file.name);
  };

  const removeFile = () => {
    setForm({ ...form, paymentProof: null });
    setFileName("");
  };

  // ===========================
  // UPLOAD FILE
  // ===========================
  const uploadPaymentProof = async (file) => {
    const formData = new FormData();
    formData.append("file", file);

    const response = await axios.post(
      "http://localhost:8080/mutuelle/contribution/upload/payment-proof",
      formData,
      {
        headers: {
          ...getAuthHeaders(),
          "Content-Type": "multipart/form-data",
        },
      }
    );

    return response.data;
  };

  // ===========================
  // SUBMIT
  // ===========================
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!form.contributionPeriodId) {
      setError("Veuillez sélectionner une campagne.");
      return;
    }

    if (!form.amount || parseFloat(form.amount) <= 0) {
      setError("Montant invalide.");
      return;
    }

    try {
      setUploading(true);

      let proofFileName = null;

      if (form.paymentProof) {
        proofFileName = await uploadPaymentProof(form.paymentProof);
      }

      const contributionData = {
        amount: parseFloat(form.amount),
        paymentDate: form.paymentDate + "T00:00:00",
        paymentMode: form.paymentMode,
        paymentProof: proofFileName,
        member: {
          id: currentUser.id || currentUser.memberId,
        },
        contributionPeriod: {
          id: parseInt(form.contributionPeriodId),
        },
        contributionType: "INDIVIDUAL",
      };

      await axios.post(
        "http://localhost:8080/mutuelle/contribution/individual",
        contributionData,
        { headers: getAuthHeaders() }
      );

      alert("Cotisation ajoutée avec succès !");
      navigate("/dashboard");

    } catch (err) {
      console.error(err);
      setError(
        err.response?.data?.message ||
          "Erreur lors de l'enregistrement."
      );
    } finally {
      setUploading(false);
    }
  };

  if (!currentUser) return null;

  // ===========================
  // RENDER
  // ===========================
  return (
    <div className="container mt-4">
      <div className="card shadow">
        <div className="card-header bg-primary text-white">
          <h5>Ajouter une cotisation individuelle</h5>
        </div>

        <div className="card-body">

          {error && (
            <div className="alert alert-danger">{error}</div>
          )}

          <form onSubmit={handleSubmit}>

            <div className="mb-3">
              <label>Campagne *</label>
              <select
                className="form-select"
                name="contributionPeriodId"
                value={form.contributionPeriodId}
                onChange={handleChange}
                required
              >
                <option value="">Choisir...</option>
                {contributionPeriods.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.description} - {p.individualAmount || p.amount} FCFA
                  </option>
                ))}
              </select>
            </div>

            <div className="mb-3">
              <label>Montant *</label>
              <input
                type="number"
                className="form-control"
                name="amount"
                value={form.amount}
                readOnly
              />
            </div>

            <div className="mb-3">
              <label>Date *</label>
              <input
                type="date"
                className="form-control"
                name="paymentDate"
                value={form.paymentDate}
                onChange={handleChange}
                required
              />
            </div>

            <div className="mb-3">
              <label>Mode de paiement *</label>
              <select
                className="form-select"
                name="paymentMode"
                value={form.paymentMode}
                onChange={handleChange}
              >
                <option value="ESPECES">Espèces</option>
                <option value="CHEQUE">Chèque</option>
                <option value="VIREMENT">Virement</option>
                <option value="MOBILE_MONEY">Mobile Money</option>
                <option value="CARTE">Carte</option>
              </select>
            </div>

            <div className="mb-3">
              <label>Preuve de paiement</label>
              <input
                type="file"
                className="form-control"
                onChange={handleFileChange}
                accept=".jpg,.jpeg,.png,.pdf"
              />
              {fileName && (
                <div className="mt-2 text-muted">
                  {fileName}
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-danger ms-2"
                    onClick={removeFile}
                  >
                    Supprimer
                  </button>
                </div>
              )}
            </div>

            <div className="d-flex justify-content-between">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => navigate("/dashboard")}
              >
                Annuler
              </button>

              <button
                type="submit"
                className="btn btn-primary"
                disabled={uploading}
              >
                {uploading ? "Enregistrement..." : "Valider"}
              </button>
            </div>

          </form>
        </div>
      </div>
    </div>
  );
}

export default AddIndividualContribution;
