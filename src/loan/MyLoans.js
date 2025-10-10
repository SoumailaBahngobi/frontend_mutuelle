import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

export default function MyLoans() {
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchMyLoans();
  }, []);

  const fetchMyLoans = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('http://localhost:8080/mut/loan', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Filtrer les prêts de l'utilisateur connecté
      const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
      const userLoans = res.data.filter(loan => 
        loan.member && loan.member.id === currentUser.id
      );
      
      setLoans(userLoans);
    } catch (error) {
      console.error('Erreur chargement prêts:', error);
      alert('Erreur lors du chargement de vos prêts');
    } finally {
      setLoading(false);
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
                        
                        return (
                          <tr key={loan.id}>
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
                              {loan.startDate ? new Date(loan.startDate).toLocaleDateString() : 'N/A'}
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
                                  disabled={loan.isRepaid}
                                >
                                  <i className="fas fa-credit-card me-1"></i>
                                  Rembourser
                                </button>
                                <button 
                                  className="btn btn-outline-info"
                                  onClick={() => {
                                    // Voir les détails du remboursement
                                    alert(`Détails du prêt:\nMontant: ${formatCurrency(loan.amount)}\nReste: ${formatCurrency(remainingAmount)}\nProgression: ${progress.toFixed(1)}%`);
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
                  {loans.filter(loan => !loan.isRepaid).length}
                </h4>
                <p className="mb-0 text-muted">Prêts en cours</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}