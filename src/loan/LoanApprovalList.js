import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import 'bootstrap/dist/css/bootstrap.min.css';

export default function LoanApprovalList() {
  const [loanRequests, setLoanRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all'); // all, pending, in_review, approved, rejected
  const [userRole, setUserRole] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchLoanRequests();
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('http://localhost:8080/mut/member/profile', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUserRole(res.data.role);
    } catch (err) {
      console.error('Erreur chargement profil:', err);
    }
  };

  const fetchLoanRequests = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const res = await axios.get('http://localhost:8080/mut/loan_request', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setLoanRequests(res.data);
    } catch (err) {
      console.error('Erreur chargement demandes:', err);
      setError('Impossible de charger les demandes de prêt');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      PENDING: { class: 'bg-warning text-dark', label: 'En attente' },
      IN_REVIEW: { class: 'bg-info text-white', label: 'En examen' },
      APPROVED: { class: 'bg-success text-white', label: 'Approuvé' },
      REJECTED: { class: 'bg-danger text-white', label: 'Rejeté' }
    };

    const config = statusConfig[status] || { class: 'bg-secondary text-white', label: status };
    return (
      <span className={`badge ${config.class}`}>
        {config.label}
      </span>
    );
  };

  const getApprovalBadge = (approved) => {
    return approved ? 
      <span className="badge bg-success">✓</span> : 
      <span className="badge bg-secondary">✗</span>;
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF'
    }).format(amount);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('fr-FR');
  };

  const getApprovalProgress = (loanRequest) => {
    if (!loanRequest.approvalProgress) return null;
    
    const progress = loanRequest.approvalProgress;
    return (
      <div className="d-flex align-items-center">
        <div className="progress flex-grow-1 me-2" style={{ height: '8px' }}>
          <div 
            className="progress-bar" 
            style={{ width: `${progress.approvalPercentage}%` }}
            title={`${progress.approvalPercentage}% approuvé`}
          ></div>
        </div>
        <small className="text-muted">
          {progress.approvedCount}/{progress.totalApprovers}
        </small>
      </div>
    );
  };

  const getApprovalDetails = (loanRequest) => {
    return (
      <div className="row small text-muted mt-2">
        <div className="col-md-4">
          <strong>Président:</strong><br />
          {getApprovalBadge(loanRequest.presidentApproved)}
          {loanRequest.presidentApprovalDate && 
            ` le ${formatDate(loanRequest.presidentApprovalDate)}`
          }
          {loanRequest.presidentComment && 
            <div className="fst-italic">"{loanRequest.presidentComment}"</div>
          }
        </div>
        <div className="col-md-4">
          <strong>Secrétaire:</strong><br />
          {getApprovalBadge(loanRequest.secretaryApproved)}
          {loanRequest.secretaryApprovalDate && 
            ` le ${formatDate(loanRequest.secretaryApprovalDate)}`
          }
          {loanRequest.secretaryComment && 
            <div className="fst-italic">"{loanRequest.secretaryComment}"</div>
          }
        </div>
        <div className="col-md-4">
          <strong>Trésorier:</strong><br />
          {getApprovalBadge(loanRequest.treasurerApproved)}
          {loanRequest.treasurerApprovalDate && 
            ` le ${formatDate(loanRequest.treasurerApprovalDate)}`
          }
          {loanRequest.treasurerComment && 
            <div className="fst-italic">"{loanRequest.treasurerComment}"</div>
          }
        </div>
      </div>
    );
  };

  const canApprove = (loanRequest) => {
    if (!userRole) return false;
    
    const userRoles = {
      'PRESIDENT': !loanRequest.presidentApproved,
      'SECRETARY': !loanRequest.secretaryApproved,
      'TREASURER': !loanRequest.treasurerApproved
    };

    return userRoles[userRole] && 
           (loanRequest.status === 'PENDING' || loanRequest.status === 'IN_REVIEW');
  };

  const handleApprove = async (loanRequestId) => {
    try {
      const token = localStorage.getItem('token');
      const endpoint = `http://localhost:8080/mut/loan_request/${loanRequestId}/approve/${userRole.toLowerCase()}`;
      
      const comment = prompt('Ajouter un commentaire (optionnel):');
      
      await axios.post(endpoint, 
        { comment: comment || '' },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      alert('Demande approuvée avec succès!');
      fetchLoanRequests(); // Rafraîchir la liste
    } catch (err) {
      console.error('Erreur approbation:', err);
      alert('Erreur lors de l\'approbation: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleReject = async (loanRequestId) => {
    try {
      const token = localStorage.getItem('token');
      const reason = prompt('Raison du rejet:');
      
      if (!reason) {
        alert('Veuillez saisir une raison de rejet');
        return;
      }
      
      await axios.post(`http://localhost:8080/mut/loan_request/${loanRequestId}/reject`, 
        { 
          rejectionReason: reason,
          rejectedByRole: userRole
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      alert('Demande rejetée avec succès!');
      fetchLoanRequests(); // Rafraîchir la liste
    } catch (err) {
      console.error('Erreur rejet:', err);
      alert('Erreur lors du rejet: ' + (err.response?.data?.message || err.message));
    }
  };

  const filteredRequests = loanRequests.filter(request => {
    if (filter === 'all') return true;
    return request.status === filter.toUpperCase();
  });

  if (loading) {
    return (
      <div className="container mt-4 d-flex justify-content-center align-items-center" style={{ minHeight: '60vh' }}>
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Chargement...</span>
          </div>
          <p className="mt-2 text-muted">Chargement des demandes de prêt...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mt-4">
        <div className="alert alert-danger d-flex align-items-center" role="alert">
          <i className="fas fa-exclamation-triangle me-2"></i>
          <div>{error}</div>
        </div>
        <button className="btn btn-primary" onClick={fetchLoanRequests}>
          Réessayer
        </button>
      </div>
    );
  }

  return (
    <div className="container-fluid py-4">
      {/* En-tête */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="card shadow-sm border-0">
            <div className="card-body">
              <div className="row align-items-center">
                <div className="col">
                  <h2 className="h4 mb-2">
                    <i className="fas fa-list-check me-2 text-primary"></i>
                    Liste des Demandes de Prêt
                  </h2>
                  <p className="text-muted mb-0">
                    Gestion et suivi des approbations de prêt
                  </p>
                </div>
                <div className="col-auto">
                  <button
                    className="btn btn-outline-secondary"
                    onClick={() => navigate('/dashboard')}
                  >
                    <i className="fas fa-arrow-left me-2"></i>
                    Retour
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filtres et statistiques */}
      <div className="row mb-4">
        <div className="col-md-8">
          <div className="card shadow-sm">
            <div className="card-body">
              <div className="btn-group" role="group">
                <button
                  type="button"
                  className={`btn ${filter === 'all' ? 'btn-primary' : 'btn-outline-primary'}`}
                  onClick={() => setFilter('all')}
                >
                  Toutes ({loanRequests.length})
                </button>
                <button
                  type="button"
                  className={`btn ${filter === 'pending' ? 'btn-warning' : 'btn-outline-warning'}`}
                  onClick={() => setFilter('pending')}
                >
                  En attente ({loanRequests.filter(r => r.status === 'PENDING').length})
                </button>
                <button
                  type="button"
                  className={`btn ${filter === 'in_review' ? 'btn-info' : 'btn-outline-info'}`}
                  onClick={() => setFilter('in_review')}
                >
                  En examen ({loanRequests.filter(r => r.status === 'IN_REVIEW').length})
                </button>
                <button
                  type="button"
                  className={`btn ${filter === 'approved' ? 'btn-success' : 'btn-outline-success'}`}
                  onClick={() => setFilter('approved')}
                >
                  Approuvées ({loanRequests.filter(r => r.status === 'APPROVED').length})
                </button>
                <button
                  type="button"
                  className={`btn ${filter === 'rejected' ? 'btn-danger' : 'btn-outline-danger'}`}
                  onClick={() => setFilter('rejected')}
                >
                  Rejetées ({loanRequests.filter(r => r.status === 'REJECTED').length})
                </button>
              </div>
            </div>
          </div>
        </div>
        
        <div className="col-md-4">
          <div className="card shadow-sm bg-light">
            <div className="card-body text-center">
              <h6 className="card-title">Rôle actuel</h6>
              <span className="badge bg-primary fs-6">{userRole || 'Membre'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Liste des demandes */}
      <div className="row">
        <div className="col-12">
          <div className="card shadow">
            <div className="card-header bg-white py-3">
              <h5 className="m-0 font-weight-bold text-primary">
                <i className="fas fa-file-alt me-2"></i>
                Demandes de Prêt ({filteredRequests.length})
              </h5>
            </div>
            <div className="card-body">
              {filteredRequests.length === 0 ? (
                <div className="text-center py-5">
                  <i className="fas fa-folder-open fa-3x text-muted mb-3"></i>
                  <h5 className="text-muted">Aucune demande trouvée</h5>
                  <p className="text-muted">
                    {filter === 'all' 
                      ? "Aucune demande de prêt n'a été soumise pour le moment."
                      : `Aucune demande avec le statut "${filter}" n'a été trouvée.`
                    }
                  </p>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead className="table-light">
                      <tr>
                        <th>ID</th>
                        <th>Membre</th>
                        <th>Montant</th>
                        <th>Motif</th>
                        <th>Date demande</th>
                        <th>Statut</th>
                        <th>Progression</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredRequests.map(request => (
                        <tr key={request.id}>
                          <td>
                            <strong>#{request.id}</strong>
                          </td>
                          <td>
                            {request.member ? (
                              <div>
                                <div className="fw-medium">
                                  {request.member.firstName} {request.member.name}
                                </div>
                                <small className="text-muted">{request.member.email}</small>
                              </div>
                            ) : (
                              <span className="text-muted">Membre inconnu</span>
                            )}
                          </td>
                          <td className="fw-bold text-primary">
                            {formatCurrency(request.requestAmount)}
                          </td>
                          <td>
                            <div className="text-truncate" style={{ maxWidth: '200px' }} 
                                 title={request.reason}>
                              {request.reason}
                            </div>
                          </td>
                          <td>
                            {formatDate(request.requestDate)}
                          </td>
                          <td>
                            {getStatusBadge(request.status)}
                          </td>
                          <td style={{ minWidth: '120px' }}>
                            {getApprovalProgress(request)}
                          </td>
                          <td>
                            <div className="btn-group btn-group-sm">
                              <button
                                className="btn btn-outline-info"
                                onClick={() => navigate(`/loans/request-details/${request.id}`)}
                                title="Voir détails"
                              >
                                <i className="fas fa-eye"></i>
                              </button>
                              
                              {canApprove(request) && (
                                <>
                                  <button
                                    className="btn btn-outline-success"
                                    onClick={() => handleApprove(request.id)}
                                    title="Approuver"
                                  >
                                    <i className="fas fa-check"></i>
                                  </button>
                                  <button
                                    className="btn btn-outline-danger"
                                    onClick={() => handleReject(request.id)}
                                    title="Rejeter"
                                  >
                                    <i className="fas fa-times"></i>
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Légende */}
      <div className="row mt-4">
        <div className="col-12">
          <div className="card shadow-sm">
            <div className="card-body">
              <h6 className="card-title">Légende des statuts d'approbation:</h6>
              <div className="row">
                <div className="col-md-3">
                  <span className="badge bg-success me-2">✓</span>
                  <small>Approuvé</small>
                </div>
                <div className="col-md-3">
                  <span className="badge bg-secondary me-2">✗</span>
                  <small>En attente</small>
                </div>
                <div className="col-md-3">
                  <span className="badge bg-warning me-2"></span>
                  <small>En attente globale</small>
                </div>
                <div className="col-md-3">
                  <span className="badge bg-info me-2"></span>
                  <small>En examen</small>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}