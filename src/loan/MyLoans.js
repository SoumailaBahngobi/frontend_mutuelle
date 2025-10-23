import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

export default function MyLoans() {
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [exportLoading, setExportLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchMyLoans();
  }, []);

  const fetchMyLoans = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('http://localhost:8080/mut/loan_request/my-requests', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Filtrer les prêts de l'utilisateur connecté
      const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
      const userLoans = res.data.filter(loan => 
        loan.member && loan.member.id === currentUser.id
      );
      
      setLoans(userLoans);
    } catch (error) {
      toast.error('Erreur lors du chargement de vos prêts.', { autoClose: 7000 });
    } finally {
      setLoading(false);
    }
  };

  // Fonction d'exportation Excel
  const exportToExcel = async () => {
    if (loans.length === 0) {
      toast.info('Aucune donnée à exporter en Excel', { autoClose: 5000 });
      return;
    }

    setExportLoading(true);
    try {
      const XLSX = await import('xlsx');
      
      const exportData = loans.map(loan => ({
        'ID': loan.id,
        'Montant Prêt': loan.amount,
        'Montant Remboursé': loan.amount - calculateRemainingAmount(loan),
        'Reste à Payer': calculateRemainingAmount(loan),
        'Progression': `${calculateProgress(loan).toFixed(1)}%`,
        'Date Début': loan.beginDate ? new Date(loan.beginDate).toLocaleDateString() : 'N/A',
        'Date Fin': loan.endDate ? new Date(loan.endDate).toLocaleDateString() : 'N/A',
        'Statut Accord': isLoanGranted(loan) ? '💰 Accordé' : '⏳ En attente',
        'Statut Remboursement': loan.isRepaid ? 'Remboursé' : 'En cours',
        'Jours Restants': calculateRemainingDays(loan.endDate),
        'En Retard': calculateRemainingDays(loan.endDate) < 0 ? 'Oui' : 'Non'
      }));

      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Mes Prêts');
      
      const fileName = `mes_prets_${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(wb, fileName);
      
      toast.success('Exportation Excel réussie !', { autoClose: 5000 });
    } catch (error) {
      console.error('Erreur export Excel:', error);
      toast.error('Erreur lors de l\'exportation Excel', { autoClose: 7000 });
    } finally {
      setExportLoading(false);
    }
  };

  // Fonction d'exportation PDF
  const exportToPDF = () => {
    if (loans.length === 0) {
      toast.info('Aucune donnée à exporter en PDF', { autoClose: 5000 });
      return;
    }

    setExportLoading(true);
    try {
      const totalAmount = loans.reduce((sum, loan) => sum + loan.amount, 0);
      const totalRepaid = loans.reduce((sum, loan) => sum + (loan.amount - calculateRemainingAmount(loan)), 0);
      const totalRemaining = loans.reduce((sum, loan) => sum + calculateRemainingAmount(loan), 0);

      const printContent = `
          <html>
              <head>
                  <title>Mes Prêts</title>
                  <style>
                      body { font-family: Arial, sans-serif; margin: 20px; }
                      h1 { color: #2c3e50; text-align: center; border-bottom: 2px solid #3498db; padding-bottom: 10px; }
                      table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                      th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
                      th { background-color: #f8f9fa; color: #2c3e50; }
                      .summary { margin-top: 30px; padding: 15px; background-color: #f8f9fa; border-radius: 5px; }
                      .stat { display: inline-block; margin-right: 20px; padding: 10px; background-color: white; border-radius: 5px; }
                      .badge { padding: 4px 8px; border-radius: 4px; color: white; font-size: 12px; }
                      .success { background-color: #28a745; }
                      .warning { background-color: #ffc107; color: black; }
                      .danger { background-color: #dc3545; }
                  </style>
              </head>
              <body>
                  <h1>💰 Mes Prêts</h1>
                  <p><strong>Date d'exportation:</strong> ${new Date().toLocaleDateString()}</p>
                  
                  <div class="summary">
                      <h3>📊 Résumé Financier</h3>
                      <div class="stat">
                          <strong>Total prêts:</strong> ${formatCurrency(totalAmount)}
                      </div>
                      <div class="stat">
                          <strong>Total remboursé:</strong> ${formatCurrency(totalRepaid)}
                      </div>
                      <div class="stat">
                          <strong>Reste à payer:</strong> ${formatCurrency(totalRemaining)}
                      </div>
                      <div class="stat">
                          <strong>Prêts en cours:</strong> ${loans.filter(loan => !loan.isRepaid && isLoanGranted(loan)).length}
                      </div>
                  </div>

                  <table>
                      <thead>
                          <tr>
                              <th>Montant</th>
                              <th>Remboursé</th>
                              <th>Reste</th>
                              <th>Date début</th>
                              <th>Date fin</th>
                              <th>Progression</th>
                              <th>Statut Accord</th>
                              <th>Statut</th>
                          </tr>
                      </thead>
                      <tbody>
                          ${loans.map(loan => {
                            const remainingAmount = calculateRemainingAmount(loan);
                            const progress = calculateProgress(loan);
                            const granted = isLoanGranted(loan);
                            return `
                              <tr>
                                  <td><strong>${formatCurrency(loan.amount)}</strong></td>
                                  <td>${formatCurrency(loan.amount - remainingAmount)}</td>
                                  <td>${formatCurrency(remainingAmount)}</td>
                                  <td>${loan.beginDate ? new Date(loan.beginDate).toLocaleDateString() : 'N/A'}</td>
                                  <td>${loan.endDate ? new Date(loan.endDate).toLocaleDateString() : 'N/A'}</td>
                                  <td>${progress.toFixed(1)}%</td>
                                  <td>
                                      <span class="badge ${granted ? 'success' : 'warning'}">
                                          ${granted ? '💰 Accordé' : '⏳ En attente'}
                                      </span>
                                  </td>
                                  <td>
                                      <span class="badge ${loan.isRepaid ? 'success' : 'danger'}">
                                          ${loan.isRepaid ? 'Remboursé' : 'En cours'}
                                      </span>
                                  </td>
                              </tr>
                            `;
                          }).join('')}
                      </tbody>
                  </table>
                  
                  <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;">
                      <p><strong>Information importante:</strong></p>
                      <p>Après l'approbation de votre demande par les responsables, le prêt doit être accordé par le trésorier avant que vous puissiez effectuer des remboursements.</p>
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
    if (loans.length === 0) {
      toast.info('Aucune donnée à exporter en CSV', { autoClose: 5000 });
      return;
    }

    setExportLoading(true);
    try {
      const headers = ['ID', 'Montant Prêt', 'Montant Remboursé', 'Reste à Payer', 'Progression', 'Date Début', 'Date Fin', 'Statut Accord', 'Statut Remboursement', 'Jours Restants'];
      
      const csvData = loans.map(loan => {
        const remainingAmount = calculateRemainingAmount(loan);
        const progress = calculateProgress(loan);
        const granted = isLoanGranted(loan);
        return [
          loan.id,
          loan.amount,
          loan.amount - remainingAmount,
          remainingAmount,
          `${progress.toFixed(1)}%`,
          loan.beginDate ? new Date(loan.beginDate).toLocaleDateString() : 'N/A',
          loan.endDate ? new Date(loan.endDate).toLocaleDateString() : 'N/A',
          granted ? 'Accordé' : 'En attente',
          loan.isRepaid ? 'Remboursé' : 'En cours',
          calculateRemainingDays(loan.endDate)
        ].join(',');
      });

      const csvContent = [headers.join(','), ...csvData].join('\n');
      
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `mes_prets_${new Date().toISOString().split('T')[0]}.csv`);
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

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF'
    }).format(amount || 0);
  };

  const getStatusBadge = (isRepaid) => {
    return isRepaid ? 
      <span className="badge bg-success">Remboursé</span> : 
      <span className="badge bg-warning text-dark">En cours</span>;
  };

  const calculateRemainingAmount = (loan) => {
    const totalRepaid = loan.repayments?.reduce((sum, repayment) => sum + repayment.amount, 0) || 0;
    return loan.amount - totalRepaid;
  };

  const calculateProgress = (loan) => {
    const totalRepaid = loan.repayments?.reduce((sum, repayment) => sum + repayment.amount, 0) || 0;
    return (totalRepaid / loan.amount) * 100;
  };

  const calculateRemainingDays = (endDate) => {
    if (!endDate) return 0;
    const today = new Date();
    const end = new Date(endDate);
    const diffTime = end - today;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  // ✅ NOUVELLE FONCTION : Vérifier si le prêt est accordé
  const isLoanGranted = (loan) => {
    return loan.loanRequest?.loanGranted || false;
  };

  if (loading) {
    return (
      <div className="container mt-4 d-flex justify-content-center align-items-center" style={{ minHeight: '60vh' }}>
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Chargement...</span>
          </div>
          <p className="mt-2 text-muted">Chargement de vos prêts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>
          <i className="fas fa-hand-holding-usd me-2 text-primary"></i>
          Mes Prêts
        </h2>
        <div>
          {/* Boutons d'exportation */}
          <div className="btn-group me-2">
            <button 
              className="btn btn-success btn-sm"
              onClick={exportToExcel}
              disabled={exportLoading || loans.length === 0}
            >
              {exportLoading ? '⏳' : '📊'} Excel
            </button>
            <button 
              className="btn btn-danger btn-sm"
              onClick={exportToPDF}
              disabled={exportLoading || loans.length === 0}
            >
              {exportLoading ? '⏳' : '📄'} PDF
            </button>
            <button 
              className="btn btn-info btn-sm"
              onClick={exportToCSV}
              disabled={exportLoading || loans.length === 0}
            >
              {exportLoading ? '⏳' : '📋'} CSV
            </button>
          </div>

          <button className="btn btn-outline-secondary me-2" onClick={() => navigate('/dashboard')}>
            <i className="fas fa-arrow-left me-2"></i>
            Retour au tableau de bord
          </button>
          <button className="btn btn-primary" onClick={fetchMyLoans}>
            <i className="fas fa-refresh me-2"></i>
            Actualiser
          </button>
        </div>
      </div>

      <div className="row">
        <div className="col-12">
          <div className="card shadow">
            <div className="card-header bg-white border-bottom">
              <h5 className="mb-0">
                <i className="fas fa-list me-2"></i>
                Liste de mes prêts
              </h5>
            </div>
            <div className="card-body p-0">
              {loans.length === 0 ? (
                <div className="text-center py-5">
                  <i className="fas fa-money-bill-wave fa-3x text-muted mb-3"></i>
                  <h4 className="text-muted">Aucun prêt trouvé</h4>
                  <p className="text-muted mb-4">
                    Vous n'avez aucun prêt en cours ou historique.
                  </p>
                  <button 
                    className="btn btn-primary"
                    onClick={() => navigate('/loans/request')}
                  >
                    <i className="fas fa-plus me-2"></i>
                    Demander un prêt
                  </button>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-striped table-hover mb-0">
                    <thead className="table-light">
                      <tr>
                        <th>Statut Accord</th>
                        <th>Montant</th>
                        <th>Montant remboursé</th>
                        <th>Reste à payer</th>
                        <th>Date de début</th>
                        <th>Date d'échéance</th>
                        <th>Progression</th>
                        <th>Statut</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loans.map(loan => {
                        const remainingAmount = calculateRemainingAmount(loan);
                        const progress = calculateProgress(loan);
                        const granted = isLoanGranted(loan);
                        
                        return (
                          <tr key={loan.id}>
                            <td>
                              {granted ? (
                                <span className="badge bg-success">💰 Accordé</span>
                              ) : (
                                <span className="badge bg-warning">⏳ En attente</span>
                              )}
                            </td>
                            <td className="fw-bold text-primary">
                              {formatCurrency(loan.amount)}
                            </td>
                            <td className="text-success">
                              {formatCurrency(loan.amount - remainingAmount)}
                            </td>
                            <td className="fw-bold text-danger">
                              {formatCurrency(remainingAmount)}
                            </td>
                            <td>
                              {loan.beginDate ? new Date(loan.beginDate).toLocaleDateString() : 'N/A'}
                            </td>
                            <td>
                              {loan.endDate ? new Date(loan.endDate).toLocaleDateString() : 'N/A'}
                            </td>
                            <td>
                              <div className="d-flex align-items-center">
                                <div className="progress flex-grow-1 me-2" style={{ height: '8px' }}>
                                  <div 
                                    className="progress-bar" 
                                    style={{ width: `${progress}%` }}
                                  ></div>
                                </div>
                                <small className="text-muted">
                                  {progress.toFixed(1)}%
                                </small>
                              </div>
                            </td>
                            <td>
                              {getStatusBadge(loan.isRepaid)}
                            </td>
                            <td>
                              <div className="btn-group btn-group-sm">
                                <button 
                                  className="btn btn-outline-primary"
                                  onClick={() => navigate('/loans/repayment', { state: { loan } })}
                                  disabled={loan.isRepaid || !granted}
                                  title={!granted ? "Prêt non encore accordé" : "Effectuer un remboursement"}
                                >
                                  <i className="fas fa-credit-card me-1"></i>
                                  Rembourser
                                </button>
                                <button 
                                  className="btn btn-outline-info"
                                  onClick={() => {
                                    alert(`Détails du prêt:\n
                                      Montant: ${formatCurrency(loan.amount)}\n
                                      Reste: ${formatCurrency(remainingAmount)}\n
                                      Progression: ${progress.toFixed(1)}%\n
                                      Statut: ${granted ? 'Prêt accordé' : 'En attente d\'accord'}\n
                                      Date début: ${loan.beginDate ? new Date(loan.beginDate).toLocaleDateString() : 'N/A'}\n
                                      Date fin: ${loan.endDate ? new Date(loan.endDate).toLocaleDateString() : 'N/A'}`
                                    );
                                  }}
                                >
                                  <i className="fas fa-info-circle"></i>
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Cartes de résumé */}
      {loans.length > 0 && (
        <div className="row mt-4">
          <div className="col-md-3 mb-3">
            <div className="card border-primary">
              <div className="card-body text-center">
                <h4 className="text-primary">
                  {formatCurrency(loans.reduce((sum, loan) => sum + loan.amount, 0))}
                </h4>
                <p className="mb-0 text-muted">Total des prêts</p>
              </div>
            </div>
          </div>
          <div className="col-md-3 mb-3">
            <div className="card border-success">
              <div className="card-body text-center">
                <h4 className="text-success">
                  {formatCurrency(loans.reduce((sum, loan) => sum + (loan.amount - calculateRemainingAmount(loan)), 0))}
                </h4>
                <p className="mb-0 text-muted">Total remboursé</p>
              </div>
            </div>
          </div>
          <div className="col-md-3 mb-3">
            <div className="card border-warning">
              <div className="card-body text-center">
                <h4 className="text-warning">
                  {formatCurrency(loans.reduce((sum, loan) => sum + calculateRemainingAmount(loan), 0))}
                </h4>
                <p className="mb-0 text-muted">Reste à payer</p>
              </div>
            </div>
          </div>
          <div className="col-md-3 mb-3">
            <div className="card border-info">
              <div className="card-body text-center">
                <h4 className="text-info">
                  {loans.filter(loan => !loan.isRepaid && isLoanGranted(loan)).length}
                </h4>
                <p className="mb-0 text-muted">Prêts en cours</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Information sur le système d'accord */}
      <div className="row mt-4">
        <div className="col-12">
          <div className="card border-warning">
            <div className="card-header bg-warning text-dark">
              <h5 className="mb-0">
                <i className="fas fa-info-circle me-2"></i>
                Information importante
              </h5>
            </div>
            <div className="card-body">
              <p>
                <strong>Nouveau processus :</strong> Après l'approbation de votre demande par les responsables, 
                le prêt doit être <strong>accordé par le trésorier</strong> avant que vous puissiez effectuer des remboursements.
              </p>
              <ul>
                <li>✅ <strong>Prêt accordé</strong> : Vous pouvez effectuer des remboursements</li>
                <li>⏳ <strong>En attente d'accord</strong> : Votre prêt est approuvé mais en attente de l'accord final du trésorier</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}