import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import 'bootstrap/dist/css/bootstrap.min.css';

function LoanList() {
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

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
    return new Date(dateString).toLocaleDateString('fr-FR');
  };

  const calculateRemainingDays = (endDate) => {
    const today = new Date();
    const end = new Date(endDate);
    const diffTime = end - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getRemainingDaysBadge = (endDate, isRepaid) => {
    if (isRepaid) return null;
    
    const days = calculateRemainingDays(endDate);
    
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
                        {loans.filter(l => !l.isRepaid && calculateRemainingDays(l.endDate) < 0).length}
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