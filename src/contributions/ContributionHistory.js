import React, { useState, useEffect } from "react";
import jsPDF from "jspdf";
import "jspdf-autotable";
import axios from "axios";
import { useNavigate } from "react-router-dom";

function ContributionHistory() {
  const [contributions, setContributions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [filter, setFilter] = useState("ALL");
  const [periodFilter, setPeriodFilter] = useState("");
  const [contributionPeriods, setContributionPeriods] = useState([]);
  const [error, setError] = useState("");

  const navigate = useNavigate();

  // ===========================
  // INIT
  // ===========================
  useEffect(() => {
    getCurrentUser();
    fetchContributionPeriods();
  }, []);

  useEffect(() => {
    if (currentUser) fetchContributions();
  }, [currentUser, filter, periodFilter]);

  // ===========================
  // AUTH
  // ===========================
  const getAuthHeaders = () => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return {};
    }
    return { Authorization: `Bearer ${token}` };
  };

  const getCurrentUser = () => {
    const userData = localStorage.getItem("currentUser");
    if (!userData) {
      navigate("/login");
      return;
    }
    setCurrentUser(JSON.parse(userData));
  };

  // ===========================
  // FETCH CONTRIBUTIONS
  // ===========================
  const fetchContributions = async () => {
    try {
      setLoading(true);
      setError("");

      let url = "http://localhost:8080/mutuelle/contribution/my-contributions";

      if (filter === "INDIVIDUAL") {
        url =
          "http://localhost:8080/mutuelle/contribution/individual/my-contributions";
      }

      if (filter === "GROUP") {
        url =
          "http://localhost:8080/mutuelle/contribution/group/my-contributions";
      }

      const response = await axios.get(url, {
        headers: getAuthHeaders(),
      });

      let data = Array.isArray(response.data) ? response.data : [];

      if (periodFilter) {
        data = data.filter(
          (c) =>
            c.contributionPeriod?.id?.toString() === periodFilter.toString()
        );
      }

      data.sort(
        (a, b) => new Date(b.paymentDate) - new Date(a.paymentDate)
      );

      setContributions(data);
    } catch (err) {
      console.error(err);
      setError("Erreur lors du chargement des cotisations.");
    } finally {
      setLoading(false);
    }
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
      console.error(err);
    }
  };

  // ===========================
  // UTILS
  // ===========================
  const getTotalAmount = () =>
    contributions.reduce(
      (total, c) => total + (parseFloat(c.amount) || 0),
      0
    );

  const formatDate = (date) =>
    date ? new Date(date).toLocaleDateString("fr-FR") : "N/A";

  const formatAmount = (amount) =>
    new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "XOF",
    }).format(amount || 0);

  const getPaymentModeText = (mode) => {
    const modes = {
      ESPECES: "Espèces",
      CHEQUE: "Chèque",
      VIREMENT: "Virement",
      MOBILE_MONEY: "Mobile Money",
      CARTE: "Carte",
    };
    return modes[mode] || "Non spécifié";
  };

  // ===========================
  // EXPORT PDF
  // ===========================
  const exportPDF = () => {
    if (contributions.length === 0) return;

    const doc = new jsPDF();

    doc.setFontSize(16);
    doc.text("Historique des cotisations", 14, 20);

    const rows = contributions.map((c) => [
      formatDate(c.paymentDate),
      c.contributionType === "INDIVIDUAL"
        ? "Individuelle"
        : "Groupée",
      c.contributionPeriod?.description || "N/A",
      formatAmount(c.amount),
      getPaymentModeText(c.paymentMode),
    ]);

    doc.autoTable({
      head: [["Date", "Type", "Période", "Montant", "Paiement"]],
      body: rows,
      startY: 30,
    });

    doc.save("historique_cotisations.pdf");
  };

  if (!currentUser) return null;

  // ===========================
  // RENDER
  // ===========================
  return (
    <div className="container mt-4">
      <div className="card shadow">
        <div className="card-header bg-primary text-white d-flex justify-content-between">
          <h5>Historique de mes cotisations</h5>
          <button
            className="btn btn-light btn-sm"
            onClick={() => navigate("/dashboard")}
          >
            Retour
          </button>
        </div>

        <div className="card-body">

          {error && (
            <div className="alert alert-danger">{error}</div>
          )}

          {/* FILTRES */}
          <div className="row mb-3">
            <div className="col-md-4">
              <label>Type</label>
              <select
                className="form-select"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
              >
                <option value="ALL">Toutes</option>
                <option value="INDIVIDUAL">Individuelles</option>
                <option value="GROUP">Groupées</option>
              </select>
            </div>

            <div className="col-md-4">
              <label>Période</label>
              <select
                className="form-select"
                value={periodFilter}
                onChange={(e) => setPeriodFilter(e.target.value)}
              >
                <option value="">Toutes</option>
                {contributionPeriods.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.description}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-md-4 d-flex align-items-end">
              <button
                className="btn btn-success w-100"
                onClick={exportPDF}
                disabled={!contributions.length}
              >
                Exporter PDF
              </button>
            </div>
          </div>

          {/* TABLE */}
          {loading ? (
            <div className="text-center">Chargement...</div>
          ) : contributions.length === 0 ? (
            <div className="text-center text-muted">
              Aucune cotisation trouvée
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-striped">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Type</th>
                    <th>Période</th>
                    <th>Montant</th>
                    <th>Paiement</th>
                  </tr>
                </thead>
                <tbody>
                  {contributions.map((c) => (
                    <tr key={c.id}>
                      <td>{formatDate(c.paymentDate)}</td>
                      <td>
                        <span
                          className={`badge ${
                            c.contributionType === "INDIVIDUAL"
                              ? "bg-primary"
                              : "bg-warning text-dark"
                          }`}
                        >
                          {c.contributionType === "INDIVIDUAL"
                            ? "Individuelle"
                            : "Groupée"}
                        </span>
                      </td>
                      <td>{c.contributionPeriod?.description || "N/A"}</td>
                      <td className="fw-bold text-success">
                        {formatAmount(c.amount)}
                      </td>
                      <td>{getPaymentModeText(c.paymentMode)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan="3" className="text-end fw-bold">
                      Total :
                    </td>
                    <td className="fw-bold text-success">
                      {formatAmount(getTotalAmount())}
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>

        <div className="card-footer text-muted small text-end">
          {contributions.length} cotisation(s)
        </div>
      </div>
    </div>
  );
}

export default ContributionHistory;
