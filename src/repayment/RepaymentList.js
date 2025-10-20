import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import 'bootstrap/dist/css/bootstrap.min.css';
import { toast } from 'react-toastify';

function RepaymentList() {
  const [repayments, setRepayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('');

  const navigate = useNavigate();

  useEffect(() => {
    fetchRepayments();
  }, []);

  const fetchRepayments = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:8080/mut/repayment', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // S'assurer que c'est un tableau
      let repaymentsData = [];
      if (Array.isArray(response.data)) {
        repaymentsData = response.data;
      } else if (response.data && typeof response.data === 'object') {
        repaymentsData = response.data.content || response.data.repayments || response.data.data || [];
      }
      
      setRepayments(repaymentsData);
    } catch (error) {
      console.error('Erreur lors du chargement des remboursements:', error);
      setError('Impossible de charger la liste des remboursements');
    } finally {
      setLoading(false);
    }
  };

  const deleteRepayment = async (repaymentId) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cet enregistrement de remboursement ?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:8080/mut/repayment/${repaymentId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setRepayments(repayments.filter(repayment => repayment.id !== repaymentId));
      //alert('Remboursement supprimé avec succès');
      toast.success('Remboursement supprimé avec succès', { autoClose: 5000 });
    } catch (error) {
      //console.error('Erreur lors de la suppression:', error);
      //alert('Erreur lors de la suppression du remboursement');
      toast.error('Erreur lors de la suppression du remboursement. Veuillez réessayer.', { autoClose: 7000 });
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF'
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatDateTime = (dateString) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      'COMPLETED': { class: 'bg-success', label: 'Complété' },
      'PARTIAL': { class: 'bg-warning text-dark', label: 'Partiel' },
      'PENDING': { class: 'bg-secondary', label: 'En attente' },
      'FAILED': { class: 'bg-danger', label: 'Échoué' }
    };

    const config = statusConfig[status] || { class: 'bg-secondary', label: status };
    return <span className={`badge ${config.class}`}>{config.label}</span>;
  };

  const getPaymentMethodBadge = (method) => {
    const methodConfig = {
      'CASH': { class: 'bg-primary', label: 'Espèces' },
      'BANK_TRANSFER': { class: 'bg-info', label: 'Virement' },
      'MOBILE_MONEY': { class: 'bg-success', label: 'Mobile Money' },
      'CHECK': { class: 'bg-warning text-dark', label: 'Chèque' }
    };

    const config = methodConfig[method] || { class: 'bg-secondary', label: method };
    return <span className={`badge ${config.class}`}>{config.label}</span>;
  };

  // Générer les mois pour le filtre
  const generateMonthOptions = () => {
    const months = [];
    const currentDate = new Date();
    
    for (let i = 0; i < 12; i++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const label = date.toLocaleDateString('fr-FR', { year: 'numeric', month: 'long' });
      months.push({ value, label });
    }
    
    return months;
  };

  // Filtrer les remboursements
  const filteredRepayments = repayments.filter(repayment => {
    const matchesFilter = filter === 'all' || repayment.status === filter;
    
    const matchesSearch = 
      repayment.member?.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      repayment.member?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      repayment.member?.npi?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      repayment.loan?.id?.toString().includes(searchTerm);
    
    const matchesMonth = !selectedMonth || 
      repayment.paymentDate?.startsWith(selectedMonth);
    
    return matchesFilter && matchesSearch && matchesMonth;
  });

  // Calculer les statistiques
  const calculateStats = () => {
    const totalAmount = filteredRepayments.reduce((sum, r) => sum + r.amount, 0);
    const completedAmount = filteredRepayments
      .filter(r => r.status === 'COMPLETED')
      .reduce((sum, r) => sum + r.amount, 0);
    
    return {
      totalAmount,
      completedAmount,
      totalCount: filteredRepayments.length,
      completedCount: filteredRepayments.filter(r => r.status === 'COMPLETED').length,
      pendingCount: filteredRepayments.filter(r => r.status === 'PENDING').length
    };
  };

  const stats = calculateStats();

  if (loading) {
    return (
      <div className="container mt-4 d-flex justify-content-center align-items-center" style={{ minHeight: '60vh' }}>
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Chargement...</span>
          </div>
          <p className="mt-2 text-muted">Chargement des remboursements...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid py-4">
      <div className="row">
        <div className="col-12">
          <div className="card shadow">
            <div className="card-header bg-info text-white d-flex justify-content-between align-items-center">
              <h4 className="mb-0">
                <i className="fas fa-credit-card me-2"></i>
                Historique des Remboursements
              </h4>
              <div>
                <button
                  className="btn btn-light btn-sm me-2"
                  onClick={() => navigate('/loans/repayment')}
                >
                  <i className="fas fa-plus me-1"></i>
                  Nouveau Remboursement
                </button>
                <button
                  className="btn btn-outline-light btn-sm"
                  onClick={fetchRepayments}
                >
                  <i className="fas fa-sync-alt me-1"></i>
                  Actualiser
                </button>
              </div>
            </div>

            <div className="card-body">
              {/* Filtres et recherche */}
              <div className="row mb-4">
                <div className="col-md-4">
                  <div className="input-group">
                    <span className="input-group-text">
                      <i className="fas fa-search"></i>
                    </span>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Rechercher par membre, NPI ou prêt..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>
                <div className="col-md-3">
                  <select
                    className="form-select"
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                  >
                    <option value="all">Tous les statuts</option>
                    <option value="COMPLETED">Complétés</option>
                    <option value="PARTIAL">Partiels</option>
                    <option value="PENDING">En attente</option>
                    <option value="FAILED">Échoués</option>
                  </select>
                </div>
                <div className="col-md-3">
                  <select
                    className="form-select"
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                  >
                    <option value="">Tous les mois</option>
                    {generateMonthOptions().map(month => (
                      <option key={month.value} value={month.value}>
                        {month.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-md-2">
                  <button
                    className="btn btn-outline-secondary w-100"
                    onClick={() => {
                      setFilter('all');
                      setSearchTerm('');
                      setSelectedMonth('');
                    }}
                  >
                    <i className="fas fa-times me-1"></i>
                    Réinitialiser
                  </button>
                </div>
              </div>

              {error && (
                <div className="alert alert-danger d-flex align-items-center">
                  <i className="fas fa-exclamation-triangle me-2"></i>
                  <div>{error}</div>
                </div>
              )}

              {/* Statistiques rapides */}
              <div className="row mb-4">
                <div className="col-md-3">
                  <div className="card bg-primary text-white">
                    <div className="card-body text-center py-3">
                      <h5 className="mb-1">{stats.totalCount}</h5>
                      <small>Total remboursements</small>
                    </div>
                  </div>
                </div>
                <div className="col-md-3">
                  <div className="card bg-success text-white">
                    <div className="card-body text-center py-3">
                      <h5 className="mb-1">{stats.completedCount}</h5>
                      <small>Remboursements complétés</small>
                    </div>
                  </div>
                </div>
                <div className="col-md-3">
                  <div className="card bg-warning text-dark">
                    <div className="card-body text-center py-3">
                      <h5 className="mb-1">{stats.pendingCount}</h5>
                      <small>En attente</small>
                    </div>
                  </div>
                </div>
                <div className="col-md-3">
                  <div className="card bg-info text-white">
                    <div className="card-body text-center py-3">
                      <h5 className="mb-1">{formatCurrency(stats.completedAmount)}</h5>
                      <small>Montant total perçu</small>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tableau des remboursements */}
              <div className="table-responsive">
                <table className="table table-striped table-hover">
                  <thead className="table-dark">
                    <tr>
                      <th>Membre</th>
                      <th>Prêt</th>
                      <th>Montant</th>
                      <th>Date de paiement</th>
                      <th>Méthode</th>
                      <th>Statut</th>
                      <th>Référence</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRepayments.length === 0 ? (
                      <tr>
                        <td colSpan="8" className="text-center py-4">
                          <i className="fas fa-credit-card fa-2x text-muted mb-2"></i>
                          <p className="text-muted">Aucun remboursement trouvé</p>
                          <button
                            className="btn btn-primary btn-sm"
                            onClick={() => navigate('/loans/repayment')}
                          >
                            <i className="fas fa-plus me-1"></i>
                            Effectuer un remboursement
                          </button>
                        </td>
                      </tr>
                    ) : (
                      filteredRepayments.map(repayment => (
                        <tr key={repayment.id}>
                          <td>
                            <div>
                              <strong>{repayment.member?.firstName} {repayment.member?.name}</strong>
                            </div>
                            <small className="text-muted">NPI: {repayment.member?.npi}</small>
                          </td>
                          <td>
                            <div>
                              <strong>Prêt #{repayment.loan?.id}</strong>
                            </div>
                            <small className="text-muted">
                              {repayment.loan && formatCurrency(repayment.loan.amount)}
                            </small>
                          </td>
                          <td>
                            <span className="fw-bold text-success">
                              {formatCurrency(repayment.amount)}
                            </span>
                          </td>
                          <td>
                            <small className="text-muted">
                              {repayment.paymentDate ? formatDateTime(repayment.paymentDate) : 'Non définie'}
                            </small>
                          </td>
                          <td>
                            {getPaymentMethodBadge(repayment.paymentMethod)}
                          </td>
                          <td>
                            {getStatusBadge(repayment.status)}
                          </td>
                          <td>
                            <code className="small">
                              {repayment.referenceNumber || 'N/A'}
                            </code>
                          </td>
                          <td>
                            <div className="btn-group btn-group-sm">
                              <button
                                className="btn btn-outline-info"
                                onClick={() => navigate(`mut/repayments/view/${repayment.id}`)}
                                title="Voir détails"
                              >
                                <i className="fas fa-eye"></i>
                              </button>
                              <button
                                className="btn btn-outline-warning"
                                onClick={() => navigate(`/repayments/edit/${repayment.id}`)}
                                title="Modifier"
                              >
                                <i className="fas fa-edit"></i>
                              </button>
                              <button
                                className="btn btn-outline-danger"
                                onClick={() => deleteRepayment(repayment.id)}
                                title="Supprimer"
                              >
                                <i className="fas fa-trash"></i>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Résumé détaillé */}
              <div className="row mt-4">
                <div className="col-12">
                  <div className="card border-info">
                    <div className="card-header bg-info text-white">
                      <h6 className="mb-0">
                        <i className="fas fa-chart-pie me-2"></i>
                        Analyse des Remboursements
                      </h6>
                    </div>
                    <div className="card-body">
                      <div className="row text-center">
                        <div className="col-md-3">
                          <h5 className="text-primary">
                            {formatCurrency(stats.totalAmount)}
                          </h5>
                          <small className="text-muted">Montant total des remboursements</small>
                        </div>
                        <div className="col-md-3">
                          <h5 className="text-success">
                            {formatCurrency(stats.completedAmount)}
                          </h5>
                          <small className="text-muted">Montant perçu</small>
                        </div>
                        <div className="col-md-3">
                          <h5 className="text-warning">
                            {formatCurrency(stats.totalAmount - stats.completedAmount)}
                          </h5>
                          <small className="text-muted">Montant en attente</small>
                        </div>
                        <div className="col-md-3">
                          <h5 className="text-info">
                            {stats.completedCount > 0 ? Math.round((stats.completedCount / stats.totalCount) * 100) : 0}%
                          </h5>
                          <small className="text-muted">Taux de complétion</small>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Export et actions groupées */}
              <div className="row mt-4">
                <div className="col-12">
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <span className="text-muted">
                        Affichage de {filteredRepayments.length} remboursement(s) sur {repayments.length}
                      </span>
                    </div>
                    <div>
                      <button className="btn btn-outline-primary btn-sm me-2">
                        <i className="fas fa-download me-1"></i>
                        Exporter en Excel
                      </button>
                      <button className="btn btn-outline-secondary btn-sm">
                        <i className="fas fa-print me-1"></i>
                        Imprimer
                      </button>
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

export default RepaymentList;