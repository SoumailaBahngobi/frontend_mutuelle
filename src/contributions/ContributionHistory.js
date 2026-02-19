import React, { useState, useEffect } from 'react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

function ContributionHistory() 
{
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
    try {
      if (contributions.length === 0) return;

      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();

      doc.setFontSize(16);
      doc.text("Historique des cotisations", 14, 20);

      const tableColumn = ["Date", "Type", "Période", "Montant", "Paiement"];
      const tableRows = contributions.map((c) => ({
        0: formatDate(c.paymentDate),
        1: c.contributionType === "INDIVIDUAL" ? "Individuelle" : "Groupée",
        2: c.contributionPeriod?.description || "N/A",
        3: formatAmount(c.amount),
        4: getPaymentModeText(c.paymentMode),
      }));

      doc.autoTable({
        startY: 30,
        head: [tableColumn],
        body: tableRows.map(row => tableColumn.map((_, i) => row[i])),
        styles: {
          fontSize: 9,
          cellPadding: 4,
          lineColor: [200, 200, 200],
          lineWidth: 0.1
        },
        headStyles: {
          fillColor: [52, 152, 219],
          textColor: 255,
          fontStyle: 'bold',
          fontSize: 10,
          cellPadding: 5
        },
        alternateRowStyles: {
          fillColor: [248, 248, 248]
        },
        margin: { top: 10 }
      });

      const finalY = doc.lastAutoTable.finalY + 15;

      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(0.5);
      doc.line(14, finalY, pageWidth - 14, finalY);

      doc.setFontSize(12);
      doc.setTextColor(41, 128, 185);
      doc.setFont('helvetica', 'bold');
      doc.text(`TOTAL GÉNÉRAL: ${formatAmountNoSlash(getTotalAmount())}`, 14, finalY + 10);

      const signatureY = finalY + 30;
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text('Document généré automatiquement - Mutuelle WBF', pageWidth / 2, signatureY, { align: 'center' });

      const fileName = `cotisations_${currentUser.name}_${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(fileName);

      toast.success('PDF des cotisations généré avec succès !');
    } catch (error) {
      console.error('Erreur génération PDF:', error);
      toast.error('Erreur lors de la génération du PDF: ' + error.message);
    }
  };

  const formatAmountNoSlash = (amount) => {
    const numAmount = parseFloat(amount) || 0;
    return `${numAmount.toFixed(2)} FCFA`;
  };

    const handleRetry = () => {
      setError('');
      fetchContributions();
    };
  
    const handleReconnect = () => {
      localStorage.removeItem('token');
      localStorage.removeItem('currentUser');
      navigate('/login');
    };
  
    const getStatusColor = (status) => {
      return [100, 100, 100];
    };
  
    const getStatusText = (contribution) => {
      return 'en attente';
    };

    if (!currentUser) {
        return (
            <div className="container text-center">
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Chargement...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="container">
            <div className="card shadow">
                <div className="card-header bg-primary text-white">
                    <div className="d-flex justify-content-between align-items-center">
                        <h4 className="mb-0">
                            <i className="bi bi-clock-history me-2"></i>
                            Historique de mes Cotisations
                        </h4>
                        <div>
                            <button 
                                className="btn btn-success btn-sm me-2"
                                onClick={exportPDF}
                                disabled={contributions.length === 0}
                            >
                                <i className="bi bi-file-earmark-pdf me-1"></i>
                                Exporter PDF
                            </button>
                            <button 
                                className="btn btn-light btn-sm"
                                onClick={() => navigate('/dashboard')}
                            >
                                <i className="bi bi-arrow-left me-1"></i>
                                Retour
                            </button>
                        </div>
                    </div>
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
