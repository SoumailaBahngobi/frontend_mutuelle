import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import 'bootstrap/dist/css/bootstrap.min.css';
import { toast } from 'react-toastify';

function LoanList() {
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [exportLoading, setExportLoading] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    fetchLoans();
  }, []);

  const fetchLoans = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:8080/mut/loan', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // S'assurer que c'est un tableau
      let loansData = [];
      if (Array.isArray(response.data)) {
        loansData = response.data;
      } else if (response.data && typeof response.data === 'object') {
        loansData = response.data.content || response.data.loans || response.data.data || [];
      }
      
      setLoans(loansData);
    } catch (error) {
      console.error('Erreur lors du chargement des prêts:', error);
      setError('Impossible de charger la liste des prêts');
    } finally {
      setLoading(false);
    }
  };

  // Fonction d'exportation Excel pour les prêts
  const exportToExcel = async () => {
    if (filteredLoans.length === 0) {
      toast.info('Aucune donnée à exporter en Excel', { autoClose: 5000 });
      return;
    }

    setExportLoading(true);
    try {
      const XLSX = await import('xlsx');
      
      const exportData = filteredLoans.map(loan => ({
        'ID': loan.id,
        'Membre': `${loan.member?.firstName} ${loan.member?.name}`,
        'NPI': loan.member?.npi,
        'Email': loan.member?.email,
        'Rôle': loan.member?.role,
        'Montant Prêt': loan.amount,
        'Montant Remboursé': loan.amount - calculateRemainingAmount(loan),
        'Reste à Payer': calculateRemainingAmount(loan),
        'Progression': `${calculateProgress(loan).toFixed(1)}%`,
        'Date Début': formatDate(loan.beginDate),
        'Date Fin': formatDate(loan.endDate),
        'Jours Restants': calculateRemainingDays(loan.endDate, loan.isRepaid),
        'Statut': loan.isRepaid ? 'Remboursé' : 'En cours',
        'En Retard': calculateRemainingDays(loan.endDate, loan.isRepaid) < 0 ? 'Oui' : 'Non'
      }));

      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Prêts');
      
      const fileName = `prets_${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(wb, fileName);
      
      toast.success('Exportation Excel réussie !', { autoClose: 5000 });
    } catch (error) {
      console.error('Erreur export Excel:', error);
      toast.error('Erreur lors de l\'exportation Excel', { autoClose: 7000 });
    } finally {
      setExportLoading(false);
    }
  };

  // Fonction d'exportation PDF pour les prêts
  const exportToPDF = () => {
    if (filteredLoans.length === 0) {
      toast.info('Aucune donnée à exporter en PDF', { autoClose: 5000 });
      return;
    }

    setExportLoading(true);
    try {
      const totalAmount = loans.reduce((sum, loan) => sum + loan.amount, 0);
      const activeAmount = loans.filter(l => !l.isRepaid).reduce((sum, loan) => sum + loan.amount, 0);
      const repaidAmount = loans.filter(l => l.isRepaid).reduce((sum, loan) => sum + loan.amount, 0);
      const overdueCount = loans.filter(l => !l.isRepaid && calculateRemainingDays(l.endDate, l.isRepaid) < 0).length;

      const printContent = `
          <html>
              <head>
                  <title>Liste des Prêts</title>
                  <style>
                      body { font-family: Arial, sans-serif; margin: 20px; }
                      h1 { color: #2c3e50; text-align: center; border-bottom: 2px solid #28a745; padding-bottom: 10px; }
                      table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                      th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
                      th { background-color: #f8f9fa; color: #2c3e50; }
                      .summary { margin-top: 30px; padding: 15px; background-color: #f8f9fa; border-radius: 5px; }
                      .stat { display: inline-block; margin-right: 20px; padding: 10px; background-color: white; border-radius: 5px; }
                      .badge { padding: 4px 8px; border-radius: 4px; color: white; font-size: 12px; }
                      .success { background-color: #28a745; }
                      .warning { background-color: #ffc107; color: black; }
                      .danger { background-color: #dc3545; }
                      .secondary { background-color: #6c757d; }
                  </style>
              </head>
              <body>
                  <h1>💰 Liste des Prêts Accordés</h1>
                  <p><strong>Date d'exportation:</strong> ${new Date().toLocaleDateString()}</p>
                  <p><strong>Total prêts:</strong> ${filteredLoans.length}</p>
                  
                  <div class="summary">
                      <h3>📊 Résumé Financier</h3>
                      <div class="stat">
                          <strong>Total prêts:</strong> ${formatCurrency(totalAmount)}
                      </div>
                      <div class="stat">
                          <strong>Prêts actifs:</strong> ${formatCurrency(activeAmount)}
                      </div>
                      <div class="stat">
                          <strong>Prêts remboursés:</strong> ${formatCurrency(repaidAmount)}
                      </div>
                      <div class="stat">
                          <strong>Prêts en retard:</strong> ${overdueCount}
                      </div>
                  </div>

                  <table>
                      <thead>
                          <tr>
                              <th>Membre</th>
                              <th>NPI</th>
                              <th>Montant</th>
                              <th>Date début</th>
                              <th>Date fin</th>
                              <th>Statut</th>
                              <th>Progression</th>
                              <th>Jours restants</th>
                          </tr>
                      </thead>
                      <tbody>
                          ${filteredLoans.map(loan => {
                            const remainingAmount = calculateRemainingAmount(loan);
                            const progress = calculateProgress(loan);
                            const daysRemaining = calculateRemainingDays(loan.endDate, loan.isRepaid);
                            return `
                              <tr>
                                  <td>${loan.member?.firstName} ${loan.member?.name}</td>
                                  <td>${loan.member?.npi}</td>
                                  <td><strong>${formatCurrency(loan.amount)}</strong></td>
                                  <td>${formatDate(loan.beginDate)}</td>
                                  <td>${formatDate(loan.endDate)}</td>
                                  <td>
                                      <span class="badge ${loan.isRepaid ? 'success' : 'warning'}">
                                          ${loan.isRepaid ? 'Remboursé' : 'En cours'}
                                      </span>
                                  </td>
                                  <td>${progress.toFixed(1)}%</td>
                                  <td>
                                      <span class="badge ${
                                        loan.isRepaid ? 'secondary' : 
                                        daysRemaining < 0 ? 'danger' : 
                                        daysRemaining <= 7 ? 'warning' : 'success'
                                      }">
                                          ${loan.isRepaid ? 'Terminé' : 
                                            daysRemaining < 0 ? `${Math.abs(daysRemaining)}j retard` : 
                                            `${daysRemaining}j restant`}
                                      </span>
                                  </td>
                              </tr>
                            `;
                          }).join('')}
                      </tbody>
                  </table>
                  
                  <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;">
                      <p><strong>Légende des statuts:</strong></p>
                      <p><span class="badge success">Remboursé</span> - Prêt entièrement remboursé</p>
                      <p><span class="badge warning">En cours</span> - Prêt en cours de remboursement</p>
                      <p><span class="badge danger">En retard</span> - Prêt avec échéance dépassée</p>
                  </div>
              </body>
          </html>
      `;

      const printWindow = window.open('', '_blank');
      printWindow.document.write(printContent);
      printWindow.document.close();
      
      printWindow.onload = function() {
        printWindow.print();
      };

    } catch (error) {
      console.error('Erreur export PDF:', error);
      toast.error('Erreur lors de l\'exportation PDF', { autoClose: 7000 });
    } finally {
      setExportLoading(false);
    }
  };

  // Fonction d'exportation CSV
  const exportToCSV = () => {
    if (filteredLoans.length === 0) {
      toast.info('Aucune donnée à exporter en CSV', { autoClose: 5000 });
      return;
    }

    setExportLoading(true);
    try {
      const headers = ['Membre', 'NPI', 'Email', 'Rôle', 'Montant Prêt', 'Montant Remboursé', 'Reste à Payer', 'Progression', 'Date Début', 'Date Fin', 'Statut', 'Jours Restants'];
      
      const csvData = filteredLoans.map(loan => {
        const remainingAmount = calculateRemainingAmount(loan);
        const progress = calculateProgress(loan);
        return [
          `"${loan.member?.firstName} ${loan.member?.name}"`,
          loan.member?.npi,
          `"${loan.member?.email}"`,
          `"${loan.member?.role}"`,
          loan.amount,
          loan.amount - remainingAmount,
          remainingAmount,
          `${progress.toFixed(1)}%`,
          formatDate(loan.beginDate),
          formatDate(loan.endDate),
          loan.isRepaid ? 'Remboursé' : 'En cours',
          calculateRemainingDays(loan.endDate, loan.isRepaid)
        ].join(',');
      });

      const csvContent = [headers.join(','), ...csvData].join('\n');
      
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `prets_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success('Exportation CSV réussie !', { autoClose: 5000 });
    } catch (error) {
      console.error('Erreur export CSV:', error);
      toast.error('Erreur lors de l\'exportation CSV', { autoClose: 7000 });
    } finally {
      setExportLoading(false);
    }
  };

  const getStatusBadge = (isRepaid) => {
    return isRepaid ? 
      <span className="badge bg-success">Remboursé</span> : 
      <span className="badge bg-warning text-dark">En cours</span>;
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF'
    }).format(amount);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('fr-FR');
  };

  const calculateRemainingAmount = (loan) => {
    const totalRepaid = loan.repayments?.reduce((sum, repayment) => sum + repayment.amount, 0) || 0;
    return loan.amount - totalRepaid;
  };

  const calculateProgress = (loan) => {
    const totalRepaid = loan.repayments?.reduce((sum, repayment) => sum + repayment.amount, 0) || 0;
    return (totalRepaid / loan.amount) * 100;
  };

  const calculateRemainingDays = (endDate, isRepaid) => {
    if (isRepaid || !endDate) return 0;
    const today = new Date();
    const end = new Date(endDate);
    const diffTime = end - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getRemainingDaysBadge = (endDate, isRepaid) => {
    if (isRepaid) return <span className="badge bg-secondary">Terminé</span>;
    
    const days = calculateRemainingDays(endDate, isRepaid);
    
    if (days < 0) {
      return <span className="badge bg-danger">En retard ({Math.abs(days)}j)</span>;
    } else if (days <= 7) {
      return <span className="badge bg-warning text-dark">{days}j restant(s)</span>;
    } else {
      return <span className="badge bg-success">{days}j restant(s)</span>;
    }
  };

  // Filtrer les prêts
  const filteredLoans = loans.filter(loan => {
    const matchesFilter = filter === 'all' || 
                         (filter === 'active' && !loan.isRepaid) ||
                         (filter === 'repaid' && loan.isRepaid);
    
    const matchesSearch = loan.member?.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         loan.member?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         loan.member?.npi?.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesFilter && matchesSearch;
  });

  if (loading) {
    return (
      <div className="container mt-4 d-flex justify-content-center align-items-center" style={{ minHeight: '60vh' }}>
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Chargement...</span>
          </div>
          <p className="mt-2 text-muted">Chargement des prêts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid py-4">
      <div className="row">
        <div className="col-12">
          <div className="card shadow">
            <div className="card-header bg-success text-white d-flex justify-content-between align-items-center">
              <h4 className="mb-0">
                <i className="fas fa-hand-holding-usd me-2"></i>
                Liste des Prêts Accordés
              </h4>
              <div>
                {/* Boutons d'exportation */}
                <div className="btn-group me-2">
                  <button
                    className="btn btn-light btn-sm"
                    onClick={exportToExcel}
                    disabled={exportLoading || filteredLoans.length === 0}
                  >
                    {exportLoading ? '⏳' : '📊'} Excel
                  </button>
                  <button
                    className="btn btn-light btn-sm"
                    onClick={exportToPDF}
                    disabled={exportLoading || filteredLoans.length === 0}
                  >
                    {exportLoading ? '⏳' : '📄'} PDF
                  </button>
                  <button
                    className="btn btn-light btn-sm"
                    onClick={exportToCSV}
                    disabled={exportLoading || filteredLoans.length === 0}
                  >
                    {exportLoading ? '⏳' : '📋'} CSV
                  </button>
                </div>

                <button
                  className="btn btn-light btn-sm me-2"
                  onClick={() => navigate('/loans/request')}
                >
                  <i className="fas fa-plus me-1"></i>
                  Nouvelle Demande
                </button>
                <button
                  className="btn btn-outline-light btn-sm"
                  onClick={fetchLoans}
                >
                  <i className="fas fa-sync-alt me-1"></i>
                  Actualiser
                </button>
              </div>
            </div>

            <div className="card-body">
              {/* Filtres et recherche */}
              <div className="row mb-4">
                <div className="col-md-6">
                  <div className="input-group">
                    <span className="input-group-text">
                      <i className="fas fa-search"></i>
                    </span>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Rechercher par nom, prénom ou NPI..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>
                <div className="col-md-6">
                  <select
                    className="form-select"
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                  >
                    <option value="all">Tous les prêts</option>
                    <option value="active">Prêts actifs</option>
                    <option value="repaid">Prêts remboursés</option>
                  </select>
                </div>
              </div>

              {error && (
                <div className="alert alert-danger d-flex align-items-center">
                  <i className="fas fa-exclamation-triangle me-2"></i>
                  <div>{error}</div>
                </div>
              )}

              {/* Tableau des prêts */}
              <div className="table-responsive">
                <table className="table table-striped table-hover">
                  <thead className="table-dark">
                    <tr>
                      <th>Membre</th>
                      <th>NPI</th>
                      <th>Montant</th>
                      <th>Date de début</th>
                      <th>Date de fin</th>
                      <th>Statut</th>
                      <th>Jours restants</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLoans.length === 0 ? (
                      <tr>
                        <td colSpan="8" className="text-center py-4">
                          <i className="fas fa-money-bill-wave fa-2x text-muted mb-2"></i>
                          <p className="text-muted">Aucun prêt trouvé</p>
                        </td>
                      </tr>
                    ) : (
                      filteredLoans.map(loan => (
                        <tr key={loan.id}>
                          <td>
                            <div>
                              <strong>{loan.member?.firstName} {loan.member?.name}</strong>
                            </div>
                            <small className="text-muted">{loan.member?.role}</small>
                          </td>
                          <td>
                            <code>{loan.member?.npi}</code>
                          </td>
                          <td>
                            <span className="fw-bold text-primary">
                              {formatCurrency(loan.amount)}
                            </span>
                          </td>
                          <td>
                            <small className="text-muted">
                              {formatDate(loan.startDate)}
                            </small>
                          </td>
                          <td>
                            <small className="text-muted">
                              {formatDate(loan.endDate)}
                            </small>
                          </td>
                          <td>
                            {getStatusBadge(loan.isRepaid)}
                          </td>
                          <td>
                            {getRemainingDaysBadge(loan.endDate, loan.isRepaid)}
                          </td>
                          <td>
                            <div className="btn-group btn-group-sm">
                              <button
                                className="btn btn-outline-info"
                                onClick={() => navigate(`/loans/view/${loan.id}`)}
                                title="Voir détails"
                              >
                                <i className="fas fa-eye"></i>
                              </button>
                              {!loan.isRepaid && (
                                <button
                                  className="btn btn-outline-success"
                                  onClick={() => navigate(`/loans/repayment/${loan.id}`)}
                                  title="Rembourser"
                                >
                                  <i className="fas fa-credit-card"></i>
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Statistiques */}
              <div className="row mt-4">
                <div className="col-md-3">
                  <div className="card bg-light">
                    <div className="card-body text-center">
                      <h5 className="text-primary">{loans.length}</h5>
                      <small className="text-muted">Total prêts</small>
                    </div>
                  </div>
                </div>
                <div className="col-md-3">
                  <div className="card bg-light">
                    <div className="card-body text-center">
                      <h5 className="text-warning">
                        {loans.filter(l => !l.isRepaid).length}
                      </h5>
                      <small className="text-muted">Prêts actifs</small>
                    </div>
                  </div>
                </div>
                <div className="col-md-3">
                  <div className="card bg-light">
                    <div className="card-body text-center">
                      <h5 className="text-success">
                        {loans.filter(l => l.isRepaid).length}
                      </h5>
                      <small className="text-muted">Prêts remboursés</small>
                    </div>
                  </div>
                </div>
                <div className="col-md-3">
                  <div className="card bg-light">
                    <div className="card-body text-center">
                      <h5 className="text-danger">
                        {loans.filter(l => !l.isRepaid && calculateRemainingDays(l.endDate, l.isRepaid) < 0).length}
                      </h5>
                      <small className="text-muted">Prêts en retard</small>
                    </div>
                  </div>
                </div>
              </div>

              {/* Résumé financier */}
              <div className="row mt-4">
                <div className="col-12">
                  <div className="card border-primary">
                    <div className="card-header bg-primary text-white">
                      <h6 className="mb-0">
                        <i className="fas fa-chart-bar me-2"></i>
                        Résumé Financier
                      </h6>
                    </div>
                    <div className="card-body">
                      <div className="row text-center">
                        <div className="col-md-4">
                          <h5 className="text-primary">
                            {formatCurrency(loans.reduce((sum, loan) => sum + loan.amount, 0))}
                          </h5>
                          <small className="text-muted">Montant total des prêts</small>
                        </div>
                        <div className="col-md-4">
                          <h5 className="text-warning">
                            {formatCurrency(
                              loans
                                .filter(l => !l.isRepaid)
                                .reduce((sum, loan) => sum + loan.amount, 0)
                            )}
                          </h5>
                          <small className="text-muted">Montant des prêts actifs</small>
                        </div>
                        <div className="col-md-4">
                          <h5 className="text-success">
                            {formatCurrency(
                              loans
                                .filter(l => l.isRepaid)
                                .reduce((sum, loan) => sum + loan.amount, 0)
                            )}
                          </h5>
                          <small className="text-muted">Montant remboursé</small>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoanList;