

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

export default function LoanApprovalDashboard() {
  const [loanRequests, setLoanRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [comment, setComment] = useState('');
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    setUser(currentUser);
    fetchLoanRequests();
  }, []);

  const fetchLoanRequests = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('http://localhost:8080/mut/loan_request', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setLoanRequests(res.data);
    } catch (error) {
      console.error('Erreur chargement demandes:', error);
      alert('Erreur lors du chargement des demandes');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (requestId, role) => {
    try {
      const token = localStorage.getItem('token');
      const endpoint = `http://localhost:8080/mut/loan_request/${requestId}/approve/${role.toLowerCase()}`;

      const response = await axios.post(endpoint,
        { comment },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      console.log('[LoanApprovalDashboard] approve response:', response.status, response.data);

      alert('Demande approuvée avec succès!');
      setSelectedRequest(null);
      setComment('');
      fetchLoanRequests();
    } catch (error) {
      console.error('Erreur approbation:', error);
      alert('Erreur lors de l\'approbation: ' + (error.response?.data || error.message));
    }
  };

  const handleReject = async (requestId, role) => {
    const reason = prompt('Raison du rejet:');
    if (!reason) return;

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`http://localhost:8080/mut/loan_request/${requestId}/reject`,
        {
          rejectionReason: reason,
          rejectedByRole: role
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      console.log('[LoanApprovalDashboard] reject response:', response.status, response.data);

      alert('Demande rejetée!');
      fetchLoanRequests();
    } catch (error) {
      console.error('Erreur rejet:', error);
      alert('Erreur lors du rejet');
    }
  };

  const getApprovalBadge = (approved, date, comment) => {
    if (approved) {
      return (
        <span className="badge bg-success">
          <i className="fas fa-check me-1"></i>
          Approuvé {date && new Date(date).toLocaleDateString()}
          {comment && <i className="fas fa-comment ms-1" title={comment}></i>}
        </span>
      );
    }
    return <span className="badge bg-warning text-dark">En attente</span>;
  };

  const canApprove = (request, userRole) => {
    if (request.status === 'REJECTED' || request.status === 'APPROVED') return false;

    switch (userRole) {
      case 'PRESIDENT':
        return !request.presidentApproved;
      case 'SECRETARY':
        return !request.secretaryApproved;
      case 'TREASURER':
        return !request.treasurerApproved;
      default:
        return false;
    }
  };

  const getStatusBadge = (status) => {
    const config = {
      PENDING: { class: 'bg-warning text-dark', label: 'En attente' },
      IN_REVIEW: { class: 'bg-info text-white', label: 'En examen' },
      APPROVED: { class: 'bg-success text-white', label: 'Approuvé' },
      REJECTED: { class: 'bg-danger text-white', label: 'Rejeté' }
    }[status] || { class: 'bg-secondary', label: status };

    return <span className={`badge ${config.class}`}>{config.label}</span>;
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF'
    }).format(amount || 0);
  };

  if (loading) {
    return (
      <div className="container mt-4 d-flex justify-content-center align-items-center" style={{ minHeight: '60vh' }}>
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Chargement...</span>
          </div>
          <p className="mt-2 text-muted">Chargement des demandes...</p>
        </div>
      </div>
    );
  }

  const fetchDetailedStats = async () => {
  try {
    const token = localStorage.getItem('token');
    const res = await axios.get('http://localhost:8080/mut/loan-validator/dashboard', {
      headers: { Authorization: `Bearer ${token}` }
    });
    return res.data;
  } catch (error) {
    console.error('Erreur stats détaillées:', error);
    return null;
  }
};

const filterRequestsByStatus = (requests, status) => {
  if (status === 'ALL') return requests;
  return requests.filter(request => request.status === status);
};

const sortRequests = (requests, sortBy) => {
  return [...requests].sort((a, b) => {
    switch (sortBy) {
      case 'date-desc':
        return new Date(b.requestDate) - new Date(a.requestDate);
      case 'date-asc':
        return new Date(a.requestDate) - new Date(b.requestDate);
      case 'amount-desc':
        return b.requestAmount - a.requestAmount;
      case 'amount-asc':
        return a.requestAmount - b.requestAmount;
      default:
        return 0;
    }
  });
};

  return (
    <div className="container-fluid">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>
          <i className="fas fa-list-check me-2 text-primary"></i>
          Liste des Demandes de Prêt
        </h2>
        <div>
          <button className="btn btn-outline-secondary me-2" onClick={() => navigate('/dashboard')}>
            <i className="fas fa-arrow-left me-2"></i>
            Retour au tableau de bord
          </button>
          <button className="btn btn-primary" onClick={fetchLoanRequests}>
            <i className="fas fa-refresh me-2"></i>
            Actualiser
          </button>
        </div>
      </div>

      <div className="row mb-4">
        <div className="col-12">
          <div className="card border-0 shadow-sm">
            <div className="card-header bg-primary text-white">
              <h5 className="mb-0">
                <i className="fas fa-chart-bar me-2"></i>
                Statistiques des approbations
              </h5>
            </div>
            <div className="card-body">
              <div className="row text-center">
                <div className="col-md-3 mb-3">
                  <div className="card bg-light">
                    <div className="card-body">
                      <h3 className="text-primary">{loanRequests.length}</h3>
                      <p className="mb-0 text-muted">Total demandes</p>
                    </div>
                  </div>
                </div>
                <div className="col-md-3 mb-3">
                  <div className="card bg-light">
                    <div className="card-body">
                      <h3 className="text-warning">
                        {loanRequests.filter(r => r.status === 'PENDING' || r.status === 'IN_REVIEW').length}
                      </h3>
                      <p className="mb-0 text-muted">En attente</p>
                    </div>
                  </div>
                </div>
                <div className="col-md-3 mb-3">
                  <div className="card bg-light">
                    <div className="card-body">
                      <h3 className="text-success">
                        {loanRequests.filter(r => r.status === 'APPROVED').length}
                      </h3>
                      <p className="mb-0 text-muted">Approuvées</p>
                    </div>
                  </div>
                </div>
                <div className="col-md-3 mb-3">
                  <div className="card bg-light">
                    <div className="card-body">
                      <h3 className="text-danger">
                        {loanRequests.filter(r => r.status === 'REJECTED').length}
                      </h3>
                      <p className="mb-0 text-muted">Rejetées</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="row">
        <div className="col-12">
          <div className="card shadow">
            <div className="card-header bg-white border-bottom">
              <h5 className="mb-0">
                <i className="fas fa-list-check me-2"></i>
                Demandes de Prêt ({loanRequests.length})
              </h5>
            </div>
            <div className="card-body p-0">
              <div className="table-responsive">
                <table className="table table-striped table-hover mb-0">
                  <thead className="table-light">
                    <tr>
                      <th>Membre</th>
                      <th>Montant</th>
                      <th>Motif</th>
                      <th>Date demande</th>
                      <th>Statut</th>
                      <th>Président</th>
                      <th>Secrétaire</th>
                      <th>Trésorier</th>
                      <th>Progression</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loanRequests.length === 0 ? (
                      <tr>
                        <td colSpan="10" className="text-center py-4 text-muted">
                          <i className="fas fa-inbox fa-2x mb-2"></i>
                          <br />
                          Aucune demande de prêt trouvée
                        </td>
                      </tr>
                    ) : (
                      loanRequests.map(request => (
                        <tr key={request.id}>
                          <td>
                            <strong>{request.member?.firstName} {request.member?.name}</strong>
                            <br />
                            <small className="text-muted">{request.member?.npi}</small>
                          </td>
                          <td className="fw-bold text-primary">{formatCurrency(request.requestAmount)}</td>
                          <td>
                            <span title={request.reason}>
                              {request.reason?.length > 50 ? request.reason.substring(0, 50) + '...' : request.reason}
                            </span>
                          </td>
                          <td>
                            {request.requestDate ? new Date(request.requestDate).toLocaleDateString() : 'N/A'}
                          </td>
                          <td>{getStatusBadge(request.status)}</td>
                          <td>{getApprovalBadge(request.presidentApproved, request.presidentApprovalDate, request.presidentComment)}</td>
                          <td>{getApprovalBadge(request.secretaryApproved, request.secretaryApprovalDate, request.secretaryComment)}</td>
                          <td>{getApprovalBadge(request.treasurerApproved, request.treasurerApprovalDate, request.treasurerComment)}</td>
                          <td>
                            <div className="d-flex align-items-center">
                              <div className="progress flex-grow-1 me-2" style={{ height: '8px' }}>
                                <div
                                  className="progress-bar"
                                  style={{
                                    width: `${request.approvalProgress?.approvalPercentage || 0}%`
                                  }}
                                ></div>
                              </div>
                              <small className="text-muted">
                                {request.approvalProgress?.approvedCount || 0}/3
                              </small>
                            </div>
                          </td>
                          <td>
                            <div className="btn-group btn-group-sm">
                              <button
                                className="btn btn-outline-primary"
                                onClick={() => setSelectedRequest(request)}
                                title="Voir les détails"
                              >
                                <i className="fas fa-eye"></i>
                              </button>

                              {/* Actions d'approbation selon le rôle */}
                              {user && canApprove(request, user.role) && (
                                <>
                                  <button
                                    className="btn btn-outline-success"
                                    onClick={() => handleApprove(request.id, user.role)}
                                    title="Approuver"
                                  >
                                    <i className="fas fa-check"></i>
                                  </button>
                                  <button
                                    className="btn btn-outline-danger"
                                    onClick={() => handleReject(request.id, user.role)}
                                    title="Rejeter"
                                  >
                                    <i className="fas fa-times"></i>
                                  </button>
                                </>
                              )}

                              {/* Forcer création prêt */}
                              {request.status === 'APPROVED' && !request.loanCreated && (
                                <button
                                  className="btn btn-outline-warning"
                                  onClick={() => axios.post(`http://localhost:8080/mut/loan_request/${request.id}/force-create-loan`, {}, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }).then(res => { console.log('force create', res.status); fetchLoanRequests(); }).catch(err => console.error(err))}
                                  title="Forcer création prêt"
                                >
                                  <i className="fas fa-bolt"></i>
                                </button>
                              )}

                              {request.loanCreated && (
                                <button
                                  className="btn btn-outline-success"
                                  onClick={() => navigate('/loans/list')}
                                  title="Voir le prêt créé"
                                >
                                  <i className="fas fa-hand-holding-usd"></i>
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
            </div>
          </div>
        </div>
      </div>

      {/* Modal d'approbation */}
      {selectedRequest && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header bg-primary text-white">
                <h5 className="modal-title">
                  <i className="fas fa-file-invoice-dollar me-2"></i>
                  Détails de la demande de prêt
                </h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => {
                  setSelectedRequest(null);
                  setComment('');
                }}></button>
              </div>
              <div className="modal-body">
                <div className="row">
                  <div className="col-md-6">
                    <h6>Informations du membre</h6>
                    <p><strong>Nom:</strong> {selectedRequest.member?.firstName} {selectedRequest.member?.name}</p>
                    <p><strong>NPI:</strong> {selectedRequest.member?.npi}</p>
                    <p><strong>Email:</strong> {selectedRequest.member?.email}</p>
                    <p><strong>Téléphone:</strong> {selectedRequest.member?.phone}</p>
                  </div>
                  <div className="col-md-6">
                    <h6>Détails du prêt</h6>
                    <p><strong>Montant demandé:</strong> {formatCurrency(selectedRequest.requestAmount)}</p>
                    <p><strong>Motif:</strong> {selectedRequest.reason}</p>
                    <p><strong>Date demande:</strong> {selectedRequest.requestDate ? new Date(selectedRequest.requestDate).toLocaleDateString() : 'N/A'}</p>
                    <p><strong>Statut:</strong> {getStatusBadge(selectedRequest.status)}</p>
                  </div>
                </div>

                <div className="row mt-3">
                  <div className="col-12">
                    <h6>État des approbations</h6>
                    <div className="table-responsive">
                      <table className="table table-sm table-bordered">
                        <thead>
                          <tr>
                            <th>Validateur</th>
                            <th>Statut</th>
                            <th>Date</th>
                            <th>Commentaire</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td>Président</td>
                            <td>{getApprovalBadge(selectedRequest.presidentApproved)}</td>
                            <td>{selectedRequest.presidentApprovalDate ? new Date(selectedRequest.presidentApprovalDate).toLocaleDateString() : '-'}</td>
                            <td>{selectedRequest.presidentComment || '-'}</td>
                          </tr>
                          <tr>
                            <td>Secrétaire</td>
                            <td>{getApprovalBadge(selectedRequest.secretaryApproved)}</td>
                            <td>{selectedRequest.secretaryApprovalDate ? new Date(selectedRequest.secretaryApprovalDate).toLocaleDateString() : '-'}</td>
                            <td>{selectedRequest.secretaryComment || '-'}</td>
                          </tr>
                          <tr>
                            <td>Trésorier</td>
                            <td>{getApprovalBadge(selectedRequest.treasurerApproved)}</td>
                            <td>{selectedRequest.treasurerApprovalDate ? new Date(selectedRequest.treasurerApprovalDate).toLocaleDateString() : '-'}</td>
                            <td>{selectedRequest.treasurerComment || '-'}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                {user && canApprove(selectedRequest, user.role) && (
                  <div className="mt-3">
                    <label className="form-label fw-bold">Commentaire (optionnel)</label>
                    <textarea
                      className="form-control"
                      rows="3"
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      placeholder="Ajouter un commentaire pour cette approbation..."
                    />
                  </div>
                )}
              </div>
              <div className="modal-footer">
                {user && canApprove(selectedRequest, user.role) ? (
                  <>
                    <button
                      className="btn btn-success"
                      onClick={() => handleApprove(selectedRequest.id, user.role)}
                    >
                      <i className="fas fa-check me-2"></i>
                      Approuver la demande
                    </button>
                    <button
                      className="btn btn-danger"
                      onClick={() => handleReject(selectedRequest.id, user.role)}
                    >
                      <i className="fas fa-times me-2"></i>
                      Rejeter
                    </button>
                  </>
                ) : (
                  <button
                    className="btn btn-secondary"
                    onClick={() => {
                      setSelectedRequest(null);
                      setComment('');
                    }}
                  >
                    Fermer
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}