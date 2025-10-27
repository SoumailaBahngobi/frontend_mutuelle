import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import 'bootstrap/dist/css/bootstrap.min.css';
import { toast } from 'react-toastify';

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [myLoanRequests, setMyLoanRequests] = useState([]);
  const [myLoans, setMyLoans] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [showNotificationsPanel, setShowNotificationsPanel] = useState(false);
  const [stats, setStats] = useState({
    totalRequests: 0,
    activeLoans: 0,
    pendingApprovals: 0,
    totalContributions: 0
  });
  const [showContributionModal, setShowContributionModal] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/login');
          return;
        }

        const res = await axios.get('http://localhost:8080/mut/member/profile', {
          headers: { Authorization: `Bearer ${token}` }
        });

        setUser(res.data);
        await fetchLoanData(token, res.data.id);
        await fetchNotifications(token);

      } catch (err) {
        console.error('Erreur chargement profil:', err);
        let backendMsg = '';
        if (err.response) {
          backendMsg = ` (Code: ${err.response.status})`;
        }
        setError("Impossible de charger le profil utilisateur." + backendMsg);

        if (err.response?.status === 401) {
          localStorage.removeItem('token');
          navigate('/login');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [navigate]);

  const fetchNotifications = async (token) => {
    try {
      const response = await axios.get('http://localhost:8080/mut/notification', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications(response.data);
    } catch (error) {
      setNotifications([
        {
          id: 1,
          title: 'Bienvenue sur votre dashboard',
          message: 'Vous pouvez consulter ici toutes vos activités récentes',
          type: 'INFO',
          read: false,
          createdDate: new Date()
        }
      ]);
    }
  };

  const fetchLoanData = async (token, userId) => {
    try {
      const requestsRes = await axios.get('http://localhost:8080/mut/loan_request/my-requests', {
        headers: { Authorization: `Bearer ${token}` }
      });

      const loanRequests = Array.isArray(requestsRes.data) ? requestsRes.data : [];
      setMyLoanRequests(loanRequests);

      const loansRes = await axios.get('http://localhost:8080/mut/loans', {
        headers: { Authorization: `Bearer ${token}` }
      });

      let loansData = [];

      if (Array.isArray(loansRes.data)) {
        loansData = loansRes.data;
      } else if (loansRes.data && typeof loansRes.data === 'object') {
        loansData = loansRes.data.content || loansRes.data.loans || loansRes.data.data || [];
      }

      const userLoans = loansData.filter(loan =>
        loan && loan.member && loan.member.id === userId
      );
      setMyLoans(userLoans);

      setStats({
        totalRequests: loanRequests.length,
        activeLoans: userLoans.filter(loan => !loan.isRepaid).length,
        pendingApprovals: loanRequests.filter(req => req.status === 'PENDING').length,
        totalContributions: 0
      });

    } catch (error) {
      toast.error('Erreur lors du chargement des données de prêt.');
    }
  };

  const handleContributionType = (type) => {
    if (type === 'individuelle') {
      navigate('/mut/contribution/individual');
    } else if (type === 'groupe') {
      navigate('/mut/contribution/group');
    }
    setShowContributionModal(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('currentUser');
    navigate('/login');
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

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF'
    }).format(amount);
  };

  const unreadCount = notifications.filter(notif => !notif.read).length;
  const isAdmin = user && (user.role === 'ADMIN' || user.role === 'PRESIDENT' || user.role === 'SECRETARY' || user.role === 'TREASURER');

  if (loading) {
    return (
      <div className="container mt-4 d-flex justify-content-center align-items-center" style={{ minHeight: '60vh' }}>
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Chargement...</span>
          </div>
          <p className="mt-2 text-muted">Chargement de votre tableau de bord...</p>
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
        <button className="btn btn-primary" onClick={() => window.location.reload()}>
          Réessayer
        </button>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="container-fluid py-2">
      {/* Header ultra compact */}
      <div className="row mb-2">
        <div className="col-12">
          <div className="card shadow-sm border-0">
            <div className="card-body py-2">
              <div className="row align-items-center">
                <div className="col">
                  <h6 className="mb-0 fw-bold">{user.firstName} {user.name}</h6>
                  <div className="text-muted small">
                    <span className="me-2">Email:{user.email}</span>
                    <span className="badge bg-primary small"> Rôle:{user.role}</span>
                  </div>
                </div>
                <div className="col-auto">
                  <button
                    className="btn btn-warning btn-sm position-relative me-1"
                    onClick={() => setShowNotificationsPanel(!showNotificationsPanel)}
                  >
                    <i className="fas fa-bell"></i>
                    {unreadCount > 0 && (
                      <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger small">
                        {unreadCount}
                      </span>
                    )}
                  </button>
                  <button
                    className="btn btn-outline-danger btn-sm"
                    onClick={handleLogout}
                  >
                    <i className="fas fa-sign-out-alt"></i>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Cartes de statistiques ultra compactes */}
      <div className="row mb-2">
        <div className="col-3 px-1">
          <div>
            <div className="card-body p-2 text-center">
              <div className="text-xs fw-bold text-primary">Demandes</div>
              <div className="h6 mb-0 fw-bold">{stats.totalRequests}</div>
            </div>
          </div>
        </div>

        <div className="col-3 px-1">
          <div>
            <div className="card-body p-2 text-center">
              <div className="text-xs fw-bold text-success">Prêts actifs</div>
              <div className="h6 mb-0 fw-bold">{stats.activeLoans}</div>
            </div>
          </div>
        </div>

        <div className="col-3 px-1">
          <div>
            <div className="card-body p-2 text-center">
              <div className="text-xs fw-bold text-warning">En attente</div>
              <div className="h6 mb-0 fw-bold">{stats.pendingApprovals}</div>
            </div>
          </div>
        </div>

        <div className="col-3 px-1">
          <div>
            <div className="card-body p-2 text-center">
              <div className="text-xs fw-bold text-info">Cotisations</div>
              <div className="h6 mb-0 fw-bold">{stats.totalContributions}</div>
            </div>
          </div>
        </div>
      </div>

      <hr/>
      <hr/>

      {/* Ligne des cartes d'actions */}
      <div className="row g-2 mb-2">
        {/* Panel de Prêt */}
        <div className="col-md-1">
          <div className="card shadow-sm h-100">
            <div className="card-header bg-primary text-white py-1 px-2">
              <small className="fw-bold">
                <i className="fas fa-hand-holding-usd me-1"></i>
                Prêts
              </small>
            </div>
            <div className="card-body p-2">
              <div>
                <button
                  className="btn btn-sm"
                  onClick={() => navigate('/loans/request')}
                >
                  Nouvelle
                </button>
                <hr/>
                <button
                  className="btn btn-sm"
                  onClick={() => navigate('/loans/requests')}
                >
                  <i className="fas fa-list me-1"></i>
                  Mes Demandes
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Panel de Remboursement */}
        <div className="col-md-1">
          <div className="card shadow-sm h-100">
            <div className="card-header bg-info text-white py-1 px-2">
              <small className="fw-bold">
                <i className="fas fa-credit-card me-1"></i>
                Remboursement
              </small>
            </div>
            <div>
              <div >
                <button
                  className='btn btn-sm'
                  onClick={() => navigate('/loans/repayment')}
                >
                  Faire un remboursement
                </button>
                <hr/>
                <button
                  className="btn btn-sm"
                  onClick={() => navigate('/loans/repayment-history')}
                >
                  <i className="fas fa-history me-1"></i>
                  Mes remboursements
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Panel de Cotisation */}
        <div className="col-md-1">
          <div className="card shadow-sm h-100">
            <div className="card-header bg-success text-white py-1 px-2">
              <small className="fw-bold">
                <i className="fas fa-money-bill-wave me-1"></i>
                Cotisations
              </small>
            </div>
            <div className="card-body p-2">
              <div className="d-grid gap-1">
                <button
                  className="btn btn-sm"
                  onClick={() => setShowContributionModal(true)}
                >
                  <i className="fas fa-plus me-1"></i>
                  Nouvelle
                </button>
                <hr/>
                <button
                  className="btn btn-sm"
                  onClick={() => navigate('/mut/contribution/individual/my-contributions')}
                >
                  <i className="fas fa-history me-1"></i>
                  Historique
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Panel Événements */}
        <div className="col-md-1">
          <div className="card shadow-sm h-100">
            <div className="card-header bg-warning text-dark py-1 px-2">
              <small className="fw-bold">
                <i className="fas fa-calendar me-1"></i>
                Événements
              </small>
            </div>
            <div className="card-body p-1">
              <div className="d-grid gap-1">
                <button 
                className="btn btn-sm"
                  onClick={() => navigate('/mut/event')}>
                  <i className="fas fa-plus me-1"></i>
                  Nouvel Événement
                </button>
                <hr/>
                <button
                 className="btn btn-sm"
                  onClick={() => navigate('/mut/event/list')}
                >
                  <i className="fas fa-list me-1"></i>
                  Voir Événements
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Cartes Dernières demandes et Prêts en cours alignées avec les autres */}
        <div className="col-md-4">
          <div className="row h-100 g-2">
            {/* Carte Dernières demandes */}
            <div className="col-md-6">
              <div className="card shadow-sm h-100">
                <div className="card-header py-1 px-2 bg-light">
                  <small className="fw-bold text-muted">
                    <i className="fas fa-history me-1"></i>
                    Dernières demandes
                  </small>
                </div>
                <div className="card-body p-1">
                  {myLoanRequests.length === 0 ? (
                    <p className="text-muted small mb-0 text-center">Aucune demande</p>
                  ) : (
                    <div className="small">
                      {myLoanRequests.slice(0, 3).map(request => (
                        <div key={request.id} className="d-flex justify-content-between align-items-center border-bottom py-1">
                          <div>
                            <div className="fw-medium">{formatCurrency(request.requestAmount)}</div>
                            <small className="text-muted">{request.reason?.substring(0, 30)}...</small>
                          </div>
                          {getStatusBadge(request.status)}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Carte Prêts en cours */}
            <div className="col-md-6">
              <div className="card shadow-sm h-100">
                <div className="card-header py-1 px-2 bg-light">
                  <small className="fw-bold text-muted">
                    <i className="fas fa-chart-line me-1"></i>
                    Prêts en cours
                  </small>
                </div>
                <div className="card-body p-2">
                  {myLoans.filter(loan => !loan.isRepaid).length === 0 ? (
                    <p className="text-muted small mb-0 text-center">Aucun prêt en cours</p>
                  ) : (
                    <div className="small">
                      {myLoans.filter(loan => !loan.isRepaid).slice(0, 3).map(loan => (
                        <div key={loan.id} className="d-flex justify-content-between align-items-center border-bottom py-1">
                          <div>
                            <div className="fw-medium">{formatCurrency(loan.amount)}</div>
                            <small className="text-muted">
                              Échéance: {loan.endDate ? new Date(loan.endDate).toLocaleDateString() : 'N/A'}
                            </small>
                          </div>
                          <span className="badge bg-warning text-dark">En cours</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Panel de Validation (Admin seulement) */}
        {isAdmin && (
          <div className="col-md-3">
            <div className="card shadow-sm h-100">
              <div className="card-header bg-secondary text-white py-1 px-2">
                <small className="fw-bold">
                  <i className="fas fa-user-shield me-1"></i>
                  Administration
                </small>
              </div>
              <div className="card-body p-2">
                <div className="d-grid gap-1">
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => navigate('/loans/approval-dashboard')}
                  >
                    <i className="fas fa-list-check me-1"></i>
                    Approbation
                  </button>
                  <button
                    className="btn btn-outline-secondary btn-sm"
                    onClick={() => navigate('/loans/approval')}
                  >
                    <i className="fas fa-check-circle me-1"></i>
                    Validation
                  </button>
                  <button
                    className="btn btn-outline-secondary btn-sm"
                    onClick={() => navigate('/mut/contribution_period')}
                  >
                    <i className="fas fa-calendar-alt me-1"></i>
                    Périodes
                  </button>

                  {/* NOUVEAUX BOUTONS GESTION DES MEMBRES */}
                  <div className="dropdown">
                    <button
                      className="btn btn-outline-secondary btn-sm dropdown-toggle w-100"
                      type="button"
                      data-bs-toggle="dropdown"
                      aria-expanded="false"
                    >
                      <i className="fas fa-users me-1"></i>
                      Gérer Membres
                    </button>
                    <ul className="dropdown-menu w-100">
                      <li>
                        <button
                          className="dropdown-item"
                          onClick={() => navigate('/members/add')}
                        >
                          <i className="fas fa-user-plus me-2 text-success"></i>
                          Ajouter Membre
                        </button>
                      </li>
                      <li>
                        <button
                          className="dropdown-item"
                          onClick={() => navigate('/members/list')}
                        >
                          <i className="fas fa-list me-2 text-primary"></i>
                          Voir Tous les Membres
                        </button>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Panel des notifications */}
      {showNotificationsPanel && (
        <div className="card mt-2">
          <div className="card-header py-1 px-2 d-flex justify-content-between align-items-center">
            <small className="fw-bold">
              <i className="fas fa-bell me-1"></i>
              Notifications ({notifications.length})
            </small>
            <button
              className="btn btn-sm btn-outline-primary"
              onClick={() => setShowNotificationsPanel(false)}
            >
              <i className="fas fa-times"></i>
            </button>
          </div>
          <div className="card-body p-2">
            {notifications.length === 0 ? (
              <p className="text-muted text-center small py-2 mb-0">Aucune notification</p>
            ) : (
              <div className="small">
                {notifications.slice(0, 5).map(notification => (
                  <div
                    key={notification.id}
                    className={`p-2 border-bottom ${notification.read ? '' : 'bg-light'}`}
                  >
                    <div className="d-flex justify-content-between">
                      <div>
                        <strong className="small">{notification.title}</strong>
                        <div className="text-muted small">{notification.message}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal de sélection du type de cotisation */}
      {showContributionModal && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} tabIndex="-1">
          <div className="modal-dialog modal-dialog-centered modal-sm">
            <div className="modal-content">
              <div className="modal-header py-2">
                <h6 className="modal-title">Type de Cotisation</h6>
                <button
                  type="button"
                  className="btn-close btn-sm"
                  onClick={() => setShowContributionModal(false)}
                ></button>
              </div>
              <div className="modal-body p-3">
                <div className="d-grid gap-2">
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => handleContributionType('individuelle')}
                  >
                    <i className="fas fa-user me-1"></i>
                    Individuelle
                  </button>
                  <button
                    className="btn btn-success btn-sm"
                    onClick={() => handleContributionType('groupe')}
                  >
                    <i className="fas fa-users me-1"></i>
                    Groupe
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}