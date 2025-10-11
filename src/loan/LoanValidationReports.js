import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

export default function LoanValidationReports() {
  const [stats, setStats] = useState({});
  const [validationHistory, setValidationHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null); // Ajout de l'état user
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });
  const navigate = useNavigate();

  useEffect(() => {
    fetchUserProfile();
    fetchReports();
  }, [dateRange]);

  // Fonction pour récupérer le profil utilisateur
  const fetchUserProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:8080/mut/member/profile', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUser(response.data);
    } catch (error) {
      console.error('Erreur chargement profil:', error);
      // Fallback: récupérer depuis localStorage
      const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
      setUser(currentUser);
    }
  };

  const fetchReports = async () => {
    try {
      const token = localStorage.getItem('token');
      
      // Récupérer les statistiques
      const statsRes = await axios.get('http://localhost:8080/mut/loan-validator/dashboard', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStats(statsRes.data);

      // Récupérer l'historique des validations
      const historyRes = await axios.get('http://localhost:8080/mut/loan-validator/my-approval-history', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setValidationHistory(historyRes.data);

    } catch (error) {
      console.error('Erreur rapports:', error);
      alert('Erreur lors du chargement des rapports');
    } finally {
      setLoading(false);
    }
  };

  const exportToExcel = () => {
    // Implémentez l'export Excel ici
    alert('Fonctionnalité d\'export à implémenter');
  };

  const getApproverActions = (request) => {
    const actions = [];
    const userRole = user?.role; // Utilisation sécurisée de user.role
    
    if (!userRole) return "Rôle non défini";

    if (userRole === 'PRESIDENT' && request.presidentApprovalDate) {
      actions.push(`Président: ${new Date(request.presidentApprovalDate).toLocaleDateString()}`);
    }
    if (userRole === 'SECRETARY' && request.secretaryApprovalDate) {
      actions.push(`Secrétaire: ${new Date(request.secretaryApprovalDate).toLocaleDateString()}`);
    }
    if (userRole === 'TREASURER' && request.treasurerApprovalDate) {
      actions.push(`Trésorier: ${new Date(request.treasurerApprovalDate).toLocaleDateString()}`);
    }
    
    return actions.length > 0 ? actions.join(' | ') : "Aucune action";
  };

  // Fonction pour obtenir la date de validation la plus récente
  const getLatestValidationDate = (request) => {
    const dates = [];
    if (request.presidentApprovalDate) dates.push(new Date(request.presidentApprovalDate));
    if (request.secretaryApprovalDate) dates.push(new Date(request.secretaryApprovalDate));
    if (request.treasurerApprovalDate) dates.push(new Date(request.treasurerApprovalDate));
    
    if (dates.length === 0) return "N/A";
    
    const latestDate = new Date(Math.max(...dates));
    return latestDate.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="container mt-4 d-flex justify-content-center align-items-center" style={{ minHeight: '60vh' }}>
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Chargement...</span>
          </div>
          <p className="mt-2 text-muted">Chargement des rapports...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>
          <i className="fas fa-chart-bar me-2 text-primary"></i>
          Rapports de Validation des Prêts
        </h2>
        <div>
          <button className="btn btn-outline-secondary me-2" onClick={() => navigate('/dashboard')}>
            <i className="fas fa-arrow-left me-2"></i>
            Retour
          </button>
          <button className="btn btn-success me-2" onClick={exportToExcel}>
            <i className="fas fa-file-excel me-2"></i>
            Exporter Excel
          </button>
          <button className="btn btn-primary" onClick={fetchReports}>
            <i className="fas fa-refresh me-2"></i>
            Actualiser
          </button>
        </div>
      </div>

      {/* Informations utilisateur */}
      {user && (
        <div className="row mb-4">
          <div className="col-12">
            <div className="card bg-light">
              <div className="card-body py-3">
                <div className="row align-items-center">
                  <div className="col-md-6">
                    <strong>Validateur:</strong> {user.firstName} {user.name}
                  </div>
                  <div className="col-md-6">
                    <strong>Rôle:</strong> <span className="badge bg-primary">{user.role}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filtres par date */}
      <div className="row mb-4">
        <div className="col-md-6">
          <div className="card">
            <div className="card-body">
              <h6 className="card-title">Période</h6>
              <div className="row">
                <div className="col-md-6">
                  <label className="form-label">Date début</label>
                  <input
                    type="date"
                    className="form-control"
                    value={dateRange.startDate}
                    onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Date fin</label>
                  <input
                    type="date"
                    className="form-control"
                    value={dateRange.endDate}
                    onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="col-md-6">
          <div className="card">
            <div className="card-body">
              <h6 className="card-title">Statistiques globales</h6>
              <div className="row text-center">
                <div className="col-4">
                  <h4 className="text-primary">{stats.totalRequests || 0}</h4>
                  <small className="text-muted">Total</small>
                </div>
                <div className="col-4">
                  <h4 className="text-success">{stats.approvedRequests || 0}</h4>
                  <small className="text-muted">Approuvés</small>
                </div>
                <div className="col-4">
                  <h4 className="text-danger">{stats.rejectedRequests || 0}</h4>
                  <small className="text-muted">Rejetés</small>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Historique des validations */}
      <div className="row">
        <div className="col-12">
          <div className="card shadow">
            <div className="card-header bg-white">
              <h5 className="mb-0">
                <i className="fas fa-history me-2"></i>
                Historique de mes validations
              </h5>
            </div>
            <div className="card-body">
              {validationHistory.length === 0 ? (
                <div className="text-center py-4 text-muted">
                  <i className="fas fa-inbox fa-2x mb-2"></i>
                  <p>Aucune validation trouvée</p>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-striped">
                    <thead>
                      <tr>
                        <th>Membre</th>
                        <th>Montant</th>
                        <th>Date demande</th>
                        <th>Statut final</th>
                        <th>Mes actions</th>
                        <th>Date validation</th>
                      </tr>
                    </thead>
                    <tbody>
                      {validationHistory.map(request => (
                        <tr key={request.id}>
                          <td>
                            <strong>{request.member?.firstName} {request.member?.name}</strong>
                          </td>
                          <td className="fw-bold text-primary">
                            {new Intl.NumberFormat('fr-FR', {
                              style: 'currency',
                              currency: 'XOF'
                            }).format(request.requestAmount)}
                          </td>
                          <td>
                            {request.requestDate ? new Date(request.requestDate).toLocaleDateString() : 'N/A'}
                          </td>
                          <td>
                            <span className={`badge ${
                              request.status === 'APPROVED' ? 'bg-success' :
                              request.status === 'REJECTED' ? 'bg-danger' :
                              request.status === 'PENDING' ? 'bg-warning' : 'bg-info'
                            }`}>
                              {request.status}
                            </span>
                          </td>
                          <td>
                            <small className="text-muted">
                              {getApproverActions(request)}
                            </small>
                          </td>
                          <td>
                            {getLatestValidationDate(request)}
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
    </div>
  );
}