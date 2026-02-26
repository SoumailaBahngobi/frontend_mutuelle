import React, { useState, useEffect } from 'react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import axios from 'axios';
import apiClient from '../apiConfig'; // use configured instance for CORS proxy
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

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
  const getCurrentUser = () => {
    try {
      const userData = localStorage.getItem("currentUser");
      if (userData) {
        const user = JSON.parse(userData);
        setCurrentUser(user);
      } else {
        navigate('/login');
      }
    } catch (error) {
      console.error('Erreur récupération utilisateur:', error);
      navigate('/login');
    }
  };

  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('Token non disponible');
    }
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  };

  // ===========================
  // FETCH CONTRIBUTIONS
  // ===========================
  const fetchContributions = async () => {
    try {
      setLoading(true);
      setError('');
      
      const headers = getAuthHeaders();
      // use proxy via relative paths so CRA forwards to backend
      let path = '/mutuelle/contribution/my-contributions';
      if (filter === 'INDIVIDUAL') {
        path = '/mutuelle/contribution/individual/my-contributions';
      } else if (filter === 'GROUP') {
        path = '/mutuelle/contribution/group/my-contributions';
      }

      const response = await apiClient.get(path, {
        headers: headers,
        timeout: 10000
      });

      let filteredContributions = Array.isArray(response.data) ? response.data : [];
      
      if (periodFilter) {
        filteredContributions = filteredContributions.filter(
          contribution => contribution.contributionPeriod?.id?.toString() === periodFilter
        );
      }

      filteredContributions.sort((a, b) => new Date(b.paymentDate) - new Date(a.paymentDate));
      setContributions(filteredContributions);
      
    } catch (error) {
      console.error('❌ Erreur détaillée:', error);
      
      if (error.response?.status === 403) {
        setError('Accès refusé. Votre session a peut-être expiré. Veuillez vous reconnecter.');
        setTimeout(() => navigate('/login'), 2000);
      } else if (error.response?.status === 401) {
        setError('Non authentifié. Veuillez vous reconnecter.');
        navigate('/login');
      } else if (error.code === 'NETWORK_ERROR' || !error.response) {
        setError('Erreur de connexion au serveur. Vérifiez votre connexion internet.');
      } else {
        setError(`Erreur serveur: ${error.response?.status} - ${error.response?.data?.message || 'Erreur inconnue'}`);
      }
    } finally {
      setLoading(false);
    }
  };

  // ===========================
  // FETCH PERIODS
  // ===========================
  const fetchContributionPeriods = async () => {
    try {
      const headers = getAuthHeaders();
      const response = await apiClient.get('/mutuelle/contribution_period', {
        headers: headers
      });
      setContributionPeriods(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Erreur récupération périodes:', error);
    }
  };

  // ===========================
  // UTILS
  // ===========================
  const getStatusText = (contribution) => {
    if (!contribution.paymentDate) return 'en attente';
    
    const paymentDate = new Date(contribution.paymentDate);
    const now = new Date();
    const contributionPeriod = contribution.contributionPeriod;
    
    if (contributionPeriod && contributionPeriod.startDate && contributionPeriod.endDate) {
      const startDate = new Date(contributionPeriod.startDate);
      const endDate = new Date(contributionPeriod.endDate);
      
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const periodStart = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
      const periodEnd = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
      
      if (today < periodStart) {
        return 'en attente';
      } else if (today >= periodStart && today <= periodEnd) {
        return 'en cours';
      } else {
        return 'passé';
      }
    }
    
    const diffTime = Math.abs(now - paymentDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays <= 0) return 'en cours';
    if (diffDays <= 30) return 'en cours';
    return 'passé';
  };

  const getStatusBadge = (contribution) => {
    const status = getStatusText(contribution);
    switch (status) {
      case 'en attente':
        return <span className="badge bg-warning text-dark">En attente</span>;
      case 'en cours':
        return <span className="badge bg-success">En cours</span>;
      case 'passé':
        return <span className="badge bg-secondary">Passé</span>;
      default:
        return <span className="badge bg-light text-dark">Inconnu</span>;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'en attente':
        return [255, 193, 7];
      case 'en cours':
        return [40, 167, 69];
      case 'passé':
        return [108, 117, 125];
      default:
        return [200, 200, 200];
    }
  };

  const getTotalAmount = () => {
    return contributions.reduce((total, contribution) => {
      const amount = parseFloat(contribution.amount) || 0;
      return total + amount;
    }, 0);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('fr-FR');
    } catch (error) {
      return 'Date invalide';
    }
  };

  const formatAmount = (amount) => {
    const numAmount = parseFloat(amount) || 0;
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF'
    }).format(numAmount);
  };

  const formatAmountNoSlash = (amount) => {
    const numAmount = parseFloat(amount) || 0;
    return `${numAmount.toFixed(2)} FCFA`;
  };

  const getPaymentModeText = (paymentMode) => {
    const modes = {
      'ESPECES': 'Espèces',
      'CHEQUE': 'Chèque',
      'VIREMENT': 'Virement',
      'MOBILE_MONEY': 'Mobile Money',
      'CARTE': 'Carte'
    };
    return modes[paymentMode] || paymentMode || 'Non spécifié';
  };

  // ===========================
  // EXPORT PDF
  // ===========================
  const exportPDF = () => {
    if (contributions.length === 0) {
      toast.warning('Aucune donnée à exporter');
      return;
    }

    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      
      // En-tête
      doc.setFillColor(41, 128, 185);
      doc.rect(0, 0, pageWidth, 40, 'F');
      
      doc.setFontSize(20);
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.text('HISTORIQUE DES COTISATIONS', pageWidth / 2, 25, { align: 'center' });
      
      // Informations membre
      let yPosition = 55;
      
      doc.setFillColor(245, 245, 245);
      doc.roundedRect(14, yPosition, pageWidth - 28, 35, 3, 3, 'F');
      
      doc.setFontSize(12);
      doc.setTextColor(41, 128, 185);
      doc.setFont('helvetica', 'bold');
      doc.text('INFORMATIONS MEMBRE', 20, yPosition + 8);
      
      doc.setFontSize(10);
      doc.setTextColor(80, 80, 80);
      doc.setFont('helvetica', 'normal');
      doc.text(`• Nom: ${currentUser.name} ${currentUser.firstName || ''}`, 20, yPosition + 18);
      doc.text(`• Date d'export: ${new Date().toLocaleDateString('fr-FR')}`, 20, yPosition + 26);
      doc.text(`• Total cotisations: ${contributions.length}`, 110, yPosition + 18);
      doc.text(`• Montant total: ${formatAmountNoSlash(getTotalAmount())}`, 110, yPosition + 26);
      
      yPosition += 45;

      // Tableau
      const tableColumn = [
        { header: "DATE", dataKey: "date" },
        { header: "TYPE", dataKey: "type" },
        { header: "PÉRIODE", dataKey: "period" },
        { header: "MONTANT", dataKey: "amount" },
        { header: "PAIEMENT", dataKey: "payment" },
        { header: "STATUT", dataKey: "status" }
      ];

      const tableRows = contributions.map(contribution => ({
        date: formatDate(contribution.paymentDate),
        type: contribution.contributionType === 'INDIVIDUAL' ? 'Individuelle' : 'Groupée',
        period: contribution.contributionPeriod?.description || 'N/A',
        amount: formatAmountNoSlash(contribution.amount),
        payment: getPaymentModeText(contribution.paymentMode),
        status: getStatusText(contribution)
      }));

      doc.autoTable({
        startY: yPosition,
        head: [tableColumn.map(col => col.header)],
        body: tableRows.map(row => tableColumn.map(col => row[col.dataKey])),
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
        columnStyles: {
          0: { cellWidth: 25, halign: 'center' },
          1: { cellWidth: 25, halign: 'center' },
          2: { cellWidth: 45 },
          3: { cellWidth: 25, halign: 'right', fontStyle: 'bold' },
          4: { cellWidth: 30, halign: 'center' },
          5: { cellWidth: 20, halign: 'center' }
        },
        didDrawCell: (data) => {
          if (data.column.index === 3 && data.cell.section === 'body') {
            doc.setTextColor(39, 174, 96);
          }
          if (data.column.index === 5 && data.cell.section === 'body') {
            const status = data.cell.raw;
            const [r, g, b] = getStatusColor(status);
            doc.setTextColor(r, g, b);
          }
        },
        margin: { top: 10 }
      });

      // Pied de page
      const finalY = doc.lastAutoTable.finalY + 15;
      
      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(0.5);
      doc.line(14, finalY, pageWidth - 14, finalY);
      
      doc.setFontSize(12);
      doc.setTextColor(41, 128, 185);
      doc.setFont('helvetica', 'bold');
      doc.text(`TOTAL GÉNÉRAL: ${formatAmountNoSlash(getTotalAmount())}`, 14, finalY + 10);
      
      const individualCount = contributions.filter(c => c.contributionType === 'INDIVIDUAL').length;
      const groupCount = contributions.filter(c => c.contributionType === 'GROUP').length;
      
      const pendingCount = contributions.filter(c => getStatusText(c) === 'en attente').length;
      const currentCount = contributions.filter(c => getStatusText(c) === 'en cours').length;
      const pastCount = contributions.filter(c => getStatusText(c) === 'passé').length;
      
      doc.setFontSize(9);
      doc.setTextColor(100, 100, 100);
      doc.setFont('helvetica', 'normal');
      doc.text(
        `Récapitulatif: ${individualCount} individuelle(s) • ${groupCount} groupée(s)`, 
        pageWidth - 14, 
        finalY + 10, 
        { align: 'right' }
      );

      doc.text(
        `Statuts: ${pendingCount} en attente • ${currentCount} en cours • ${pastCount} passé(s)`, 
        pageWidth - 14, 
        finalY + 16, 
        { align: 'right' }
      );

      const signatureY = finalY + 30;
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text('Document généré automatiquement - Mutuelle WBF', pageWidth / 2, signatureY, { align: 'center' });
      doc.text('© 2024 Tous droits réservés', pageWidth / 2, signatureY + 5, { align: 'center' });

      const fileName = `cotisations_${currentUser.name}_${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(fileName);
      
      toast.success('PDF des cotisations généré avec succès !');
      
    } catch (error) {
      console.error('❌ Erreur génération PDF:', error);
      toast.error('Erreur lors de la génération du PDF: ' + error.message);
    }
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

  if (!currentUser) {
    return (
      <div className="container text-center mt-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Chargement...</span>
        </div>
      </div>
    );
  }

  // ===========================
  // RENDER
  // ===========================
  return (
    <div className="container mt-4">
      <div className="card shadow">
        <div className="card-header bg-primary text-white d-flex justify-content-between align-items-center">
          <h5 className="mb-0">Historique de mes cotisations</h5>
          <button
            className="btn btn-light btn-sm"
            onClick={() => navigate("/dashboard")}
          >
            Retour
          </button>
        </div>

        <div className="card-body">
          {error && (
            <div className="alert alert-danger">
              {error}
              <div className="mt-2">
                <button className="btn btn-sm btn-outline-danger me-2" onClick={handleRetry}>
                  Réessayer
                </button>
                <button className="btn btn-sm btn-outline-secondary" onClick={handleReconnect}>
                  Se reconnecter
                </button>
              </div>
            </div>
          )}

          {/* FILTRES */}
          <div className="row mb-3">
            <div className="col-md-4">
              <label className="form-label fw-bold">Type</label>
              <select
                className="form-select"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
              >
                <option value="ALL">Toutes les cotisations</option>
                <option value="INDIVIDUAL">Cotisations individuelles</option>
                <option value="GROUP">Cotisations groupées</option>
              </select>
            </div>

            <div className="col-md-4">
              <label className="form-label fw-bold">Période</label>
              <select
                className="form-select"
                value={periodFilter}
                onChange={(e) => setPeriodFilter(e.target.value)}
              >
                <option value="">Toutes les périodes</option>
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
                disabled={!contributions.length || loading}
              >
                <i className="bi bi-file-pdf me-2"></i>
                Exporter PDF
              </button>
            </div>
          </div>

          {/* TABLE */}
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary mb-3" role="status">
                <span className="visually-hidden">Chargement...</span>
              </div>
              <p className="text-muted">Chargement des cotisations...</p>
            </div>
          ) : contributions.length === 0 ? (
            <div className="text-center py-5 text-muted">
              <i className="bi bi-inbox fs-1 d-block mb-3"></i>
              <p className="h5">Aucune cotisation trouvée</p>
              <p>Essayez de modifier vos filtres ou de vérifier vos paramètres</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-striped table-hover">
                <thead className="table-dark">
                  <tr>
                    <th>Date</th>
                    <th>Type</th>
                    <th>Période</th>
                    <th>Montant</th>
                    <th>Paiement</th>
                    <th>Statut</th>
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
                      <td>{getStatusBadge(c)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="table-light fw-bold">
                  <tr>
                    <td colSpan="3" className="text-end">
                      Total général :
                    </td>
                    <td className="text-success">
                      {formatAmount(getTotalAmount())}
                    </td>
                    <td colSpan="2"></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>

        <div className="card-footer text-muted d-flex justify-content-between align-items-center">
          <span>
            <i className="bi bi-info-circle me-2"></i>
            {contributions.length} cotisation(s) trouvée(s)
          </span>
          {!loading && contributions.length > 0 && (
            <span className="small">
              Dernière mise à jour : {new Date().toLocaleTimeString('fr-FR')}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export default ContributionHistory;