import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useKeycloak } from '../context/KeycloakContext';
import axios from 'axios';
import { toast } from 'react-toastify';
import 'bootstrap/dist/css/bootstrap.min.css';
import { BrickWallShield, Loader,History,BellRing,ChessQueen,BellOff,ArrowRight,ClipboardClock, Eye,Binoculars, User,
   TicketCheck, LayersPlus, CirclePlus,ChartNoAxesCombined,CalendarRange,Users, Coins, Plus, List, HandCoins} from 'lucide-react';


export default function Dashboard() {
  const { authenticated, userProfile, getToken, logout, loading: keycloakLoading } = useKeycloak();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
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
  const fileInputRef = useRef();
  const navigate = useNavigate();

  // Calculer isAdmin et unreadCount
  const isAdmin = user && (user.role === 'ADMIN' || user.role === 'PRESIDENT' || user.role === 'SECRETARY' || user.role === 'TREASURER');
  const unreadCount = notifications.filter(notif => !notif.read).length;

  useEffect(() => {
    if (!authenticated && !keycloakLoading) {
      navigate('/login');
    }
  }, [authenticated, keycloakLoading, navigate]);

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (authenticated && getToken()) {
        try {
          if (userProfile) {
            setUser({
              ...userProfile,
              firstName: userProfile.firstName,
              name: userProfile.lastName,
              email: userProfile.email
            });
          }

          const response = await axios.get('http://localhost:8081/mutuelle/auth/user-info', {
            headers: { Authorization: `Bearer ${getToken()}` }
          });

          if (response.data) {
            setUser(prev => ({ ...prev, ...response.data }));
            if (response.data.id) {
              await fetchLoanData(getToken(), response.data.id);
              await fetchNotifications(getToken());
            }
          }
        } catch (error) {
          toast.error('Erreur lors du chargement du profil');
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [authenticated, getToken, userProfile]);

  const fetchLoanData = async (token, userId) => {
    try {
      const requestsRes = await axios.get('http://localhost:8081/mutuelle/loan_request/my-requests', {
        headers: { Authorization: `Bearer ${token}` }
      });

      const loanRequests = Array.isArray(requestsRes.data) ? requestsRes.data : [];
      setMyLoanRequests(loanRequests);

      const loansRes = await axios.get('http://localhost:8081/mutuelle/loans', {
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

  const fetchNotifications = async (token) => {
    try {
      const response = await axios.get('http://localhost:8081/mutuelle/notification', {
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

  const handleContributionType = (type) => {
    if (type === 'individuelle') {
      navigate('/mutuelle/contribution/individual');
    } else if (type === 'groupe') {
      navigate('/mutuelle/contribution/group');
    }
    setShowContributionModal(false);
  };

  const handleLogout = () => {
    logout();
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      PENDING: { class: 'bg-warning-subtle text-warning-emphasis border-warning-subtle', label: 'En attente' },
      IN_REVIEW: { class: 'bg-info-subtle text-info-emphasis border-info-subtle', label: 'En examen' },
      APPROVED: { class: 'bg-success-subtle text-success-emphasis border-success-subtle', label: 'Approuvé' },
      REJECTED: { class: 'bg-danger-subtle text-danger-emphasis border-danger-subtle', label: 'Rejeté' }
    };

    const config = statusConfig[status] || { class: 'bg-secondary-subtle text-secondary-emphasis border-secondary-subtle', label: status };
    return (
      <span className={`badge ${config.class} border px-3 py-1 rounded-pill fw-normal`}>
        {config.label}
      </span>
    );
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  if (keycloakLoading || loading) {
    return (
      <div className="min-vh-100 d-flex justify-content-center align-items-center bg-light">
        <div className="text-center">
          <div className="spinner-border text-primary mb-3" style={{ width: '3rem', height: '3rem' }} role="status">
            <span className="visually-hidden">Chargement...</span>
          </div>
          <p className="text-muted">Chargement de votre tableau de bord...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="bg-light min-vh-100 py-4">
      <div className="container-xl">
        {/* Header moderne avec ombre légère */}
        <div className="bg-white rounded-4 shadow-sm p-3 mb-4">
          <div className="d-flex justify-content-between align-items-center">
            <div className="d-flex align-items-center gap-3"><User />
             {/* <div className="bg-primary bg-opacity-10 p-3 rounded-3">
                <i className="fas fa-user-circle text-primary" style={{ fontSize: '2rem' }}></i>
              </div>*/}
              <div>
                <h5 className="mb-1 fw-semibold">  {user.firstName} {user.name}</h5>
                <div className="d-flex align-items-center gap-2">
                 {/* <span className="text-muted small">{user.email}</span>
                  <span className="badge bg-primary-subtle text-primary-emphasis px-3 py-1 rounded-pill">
                    {user.role}
                 </span>*/} 
                </div>
              </div>
            </div>
            <div className="d-flex gap-2">
              <button
                className="btn btn-light position-relative rounded-circle p-2"
                style={{ width: '40px', height: '40px' }}
                onClick={() => setShowNotificationsPanel(!showNotificationsPanel)}
              >
                <i className="fas fa-bell"></i>
                {unreadCount > 0 && (
                  <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger border border-2 border-white" style={{ fontSize: '0.7rem' }}>
                    {unreadCount}
                  </span>
                )}
              </button>
              <button
                className="btn btn-light rounded-circle p-2"
                style={{ width: '40px', height: '40px' }}
                onClick={handleLogout}
              >
                <i className="fas fa-sign-out-alt text-danger"></i>
              </button>
            </div>
          </div>
        </div>

        {/* Statistiques avec design moderne */}
        <div className="row g-3 mb-4">
          <div className="col-6 col-lg-3">
            <div className="bg-white rounded-4 shadow-sm p-3">
              <div className="d-flex align-items-center gap-3">
                <div className="bg-primary bg-opacity-10 p-2 rounded-3">
                  <i className="fas fa-file-alt text-primary"></i>
                </div>
                <div>
                  <span className="text-muted small"> <Binoculars /> Demandes</span>
                  <h4 className="mb-0 fw-bold">{stats.totalRequests}</h4>
                </div>
              </div>
            </div>
          </div>
          
          <div className="col-6 col-lg-3">
            <div className="bg-white rounded-4 shadow-sm p-3">
              <div className="d-flex align-items-center gap-3">
                <div className="bg-success bg-opacity-10 p-2 rounded-3">
                  <i className="fas fa-hand-holding-usd text-success"></i>
                </div>
                <div>
                  <span className="text-muted small">Prêts actifs</span>
                  <h4 className="mb-0 fw-bold">{stats.activeLoans}</h4>
                </div>
              </div>
            </div>
          </div>
          
          <div className="col-6 col-lg-3">
            <div className="bg-white rounded-4 shadow-sm p-3">
              <div className="d-flex align-items-center gap-3">
                <div className="bg-warning bg-opacity-10 p-2 rounded-3">
                  <i className="fas fa-clock text-warning"></i>
                </div>
                <div>
                  <span className="text-muted small">En attente</span>
                  <h4 className="mb-0 fw-bold">{stats.pendingApprovals}</h4>
                </div>
              </div>
            </div>
          </div>
          
          <div className="col-6 col-lg-3">
            <div className="bg-white rounded-4 shadow-sm p-3">
              <div className="d-flex align-items-center gap-3">
                <div className="bg-info bg-opacity-10 p-2 rounded-3">
                  <i className="fas fa-coins text-info"></i>
                </div>
                <div>
                  <span className="text-muted small"> <Coins /> Cotisations</span>
                  <h4 className="mb-0 fw-bold">{stats.totalContributions}</h4>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Cartes d'actions avec design épuré */}
        <div className="row g-3 mb-4">
          <div className="col-lg-8">
            <div className="row g-3">
              {/* Prêts */}
              <div className="col-md-3">
                <div className="bg-white rounded-4 shadow-sm p-3 h-100">
                  <div className="d-flex align-items-center gap-2 mb-3">
                    <div className="bg-primary bg-opacity-10 p-2 rounded-3">
                      <i className="fas fa-hand-holding-usd text-primary"></i>
                    </div>
                    <h6 className="mb-0 fw-semibold">Prêts</h6>
                  </div>
                  <div className="d-flex flex-column gap-2">
                    <button className="btn btn-light w-100 text-start" onClick={() => navigate('/loans/request')}>
                      <i className="fas fa-plus me-2 text-primary"></i>
                      <Plus /> Nouvelle demande
                    </button>
                    <button className="btn btn-light w-100 text-start" onClick={() => navigate('/loans/requests')}>
                      <i className="fas fa-list me-2 text-primary"></i>
                      <List /> Mes demandes
                    </button>
                  </div>
                </div>
              </div>

              {/* Remboursement */}
              <div className="col-md-3">
                <div className="bg-white rounded-4 shadow-sm p-3 h-100">
                  <div className="d-flex align-items-center gap-2 mb-3">
                    <div className="bg-info bg-opacity-10 p-2 rounded-3">
                      <i className="fas fa-credit-card text-info"></i>
                    </div>
                    <h6 className="mb-0 fw-semibold">     <HandCoins />
 Remboursement</h6>
                  </div>
                  <div className="d-flex flex-column gap-2">
                    <button className="btn btn-light w-100 text-start" onClick={() => navigate('/loans/repayment')}>
                      <i className="fas fa-arrow-right me-2 text-info"></i>
                      <ArrowRight /> Effectuer
                    </button>
                    <button className="btn btn-light w-100 text-start" onClick={() => navigate('/loans/repayment-history')}>
                      <i className="fas fa-history me-2 text-info"></i>
                     <History /> Historique
                    </button>
                  </div>
                </div>
              </div>

              {/* Cotisations */}
              <div className="col-md-3">
                <div className="bg-white rounded-4 shadow-sm p-3 h-100">
                  <div className="d-flex align-items-center gap-2 mb-3">
                    <div className="bg-success bg-opacity-10 p-2 rounded-3">
                      <i className="fas fa-coins text-success"></i>
                    </div>
                    <h6 className="mb-0 fw-semibold">     <HandCoins />
Cotisations</h6>
                  </div>
                  <div className="d-flex flex-column gap-2">
                    <button className="btn btn-light w-100 text-start" onClick={() => setShowContributionModal(true)}>
                      <i className="fas fa-plus me-2 text-success"></i>
                     <BrickWallShield /> Nouvelle
                    </button>
                    <button className="btn btn-light w-100 text-start" onClick={() => navigate('/mutuelle/contribution/individual/my-contributions')}>
                      <i className="fas fa-history me-2 text-success"></i>
                     <History /> Historique
                    </button>
                  </div>
                </div>
              </div>

              {/* Événements */}
              <div className="col-md-3">
                <div className="bg-white rounded-4 shadow-sm p-3 h-100">
                  <div className="d-flex align-items-center gap-2 mb-3">
                    <div className="bg-warning bg-opacity-10 p-2 rounded-3">
                      <i className="fas fa-calendar text-warning"></i>
                    </div>
                    <h6 className="mb-0 fw-semibold"> <LayersPlus /> Événements</h6>
                  </div>
                  <div className="d-flex flex-column gap-2">
                    <button className="btn btn-light w-100 text-start" onClick={() => navigate('/mutuelle/event')}>
                      <i className="fas fa-plus me-2 text-warning"></i>
                    <CirclePlus />  Nouvel
                    </button>
                    <button className="btn btn-light w-100 text-start" onClick={() => navigate('/mutuelle/event/list')}>
                      <i className="fas fa-list me-2 text-warning"></i>
                      <Eye /> Voir tout
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Dernières activités */}
        
        </div>

        {/* Section des prêts et demandes */}
        <div className="row g-3 mb-4">
          {/* Dernières demandes */}
          <div className="col-md-6">
            <div className="bg-white rounded-4 shadow-sm p-3">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h6 className="fw-semibold mb-0"> <Binoculars /> Dernières demandes de prêt</h6>
                <button className="btn btn-link text-primary p-0" onClick={() => navigate('/loans/requests')}>
                 <Eye /> Voir tout <i className="fas fa-arrow-right ms-1"></i>
                </button>
              </div>
              {myLoanRequests.length === 0 ? (
                <p className="text-muted text-center py-3 mb-0">  Aucune demande en cours</p>
              ) : (
                <div className="d-flex flex-column gap-2">
                  {myLoanRequests.slice(0, 3).map(request => (
                    <div key={request.id} className="d-flex justify-content-between align-items-center p-2 bg-light rounded-3">
                      <div>
                        <p className="mb-0 fw-medium">{formatCurrency(request.requestAmount)}</p>
                        <small className="text-muted">{request.reason?.substring(0, 30)}...</small>
                      </div>
                      {getStatusBadge(request.status)}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Prêts en cours */}
          <div className="col-md-6">
            <div className="bg-white rounded-4 shadow-sm p-3">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h6 className="fw-semibold mb-0"> <Binoculars /> Prêts en cours</h6>
                <button className="btn btn-link text-primary p-0" onClick={() => navigate('/loans/repayment-history')}>
                   <Eye /> Voir tout <i className="fas fa-arrow-right ms-1"></i>
                </button>
              </div>
              {myLoans.filter(loan => !loan.isRepaid).length === 0 ? (
                <p className="text-muted text-center py-3 mb-0">Aucun prêt en cours</p>
              ) : (
                <div className="d-flex flex-column gap-2">
                  {myLoans.filter(loan => !loan.isRepaid).slice(0, 3).map(loan => (
                    <div key={loan.id} className="d-flex justify-content-between align-items-center p-2 bg-light rounded-3">
                      <div>
                        <p className="mb-0 fw-medium">{formatCurrency(loan.amount)}</p>
                        <small className="text-muted">
                         <ClipboardClock />  Échéance: {loan.endDate ? new Date(loan.endDate).toLocaleDateString() : 'N/A'}
                        </small>
                      </div>
                      <span className="badge bg-warning-subtle text-warning-emphasis border-warning-subtle px-3 py-1 rounded-pill">
                       <Loader /> En cours
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Section Admin */}
        {isAdmin && (
          <div className="bg-white rounded-4 shadow-sm p-3">
            <div className="d-flex align-items-center gap-2 mb-3">
              <div className="bg-secondary bg-opacity-10 p-2 rounded-3">
                <i className="fas fa-user-shield text-secondary"></i>
              </div>
              <h6 className="fw-semibold mb-0"> <BrickWallShield />Administration</h6>
            </div>
            <div className="row g-2">
              <div className="col-md-3">
                <button className="btn btn-outline-secondary btn-sm" onClick={() => navigate('/loans/approval-dashboard')}>
                  <i className="fas fa-list-check me-2"></i>
                  <ChessQueen /> Approbations
                </button>

                 <button
                    className="btn btn-outline-secondary btn-sm"
                    onClick={() => navigate('/loans/approval')}
                  >
                    <i className="fas fa-check-circle me-1"></i>
                    <TicketCheck /> Validation
                  </button>
              </div>
              <div className="col-md-3">
                <button className="btn btn-light w-100 text-start" onClick={() => navigate('/mutuelle/contribution_period')}>
                  <i className="fas fa-calendar-alt me-2"></i>
                  <CalendarRange /> Campagne cotisation
                </button>
              </div>
              <div className="col-md-3">
                <button className="btn btn-light w-100 text-start" onClick={() => navigate('/loans/list')}>
                  <i className="fas fa-chart-bar me-2"></i>
                  <ChartNoAxesCombined /> Statistiques
                </button>
              </div>
              <div className="col-md-3">
                <div className="dropdown w-100">
                  <button className="btn btn-light w-100 text-start dropdown-toggle" type="button" data-bs-toggle="dropdown">
                    <i className="fas fa-users me-2"></i>
                    <Users /> Gérer membres
                  </button>
                  <ul className="dropdown-menu w-100">
                    <li><button className="dropdown-item" onClick={() => navigate('/members/add')}> <CirclePlus /> Ajouter</button></li>
                    <li><button className="dropdown-item" onClick={() => navigate('/members/list')}> <Eye /> Voir tous</button></li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Panel des notifications */}
        {showNotificationsPanel && (
          <div className="position-fixed bottom-0 end-0 m-3" style={{ zIndex: 1050, maxWidth: '400px' }}>
            <div className="bg-white rounded-4 shadow-lg">
              <div className="p-3 border-bottom d-flex justify-content-between align-items-center">
                <h6 className="mb-0 fw-semibold"> <BellRing /> Notifications</h6>
                <button className="btn btn-light btn-sm rounded-circle p-1" onClick={() => setShowNotificationsPanel(false)}>
                  <i className="fas fa-times"></i>
                </button>
              </div>
              <div className="p-3" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                {notifications.length === 0 ? (
                  <p className="text-muted text-center py-3 mb-0"> <BellOff /> Aucune notification</p>
                ) : (
                  notifications.map(notification => (
                    <div key={notification.id} className={`p-3 rounded-3 mb-2 ${notification.read ? '' : 'bg-light'}`}>
                      <div className="d-flex justify-content-between align-items-start">
                        <div>
                          <p className="mb-1 fw-medium">{notification.title}</p>
                          <small className="text-muted">{notification.message}</small>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* Modal de cotisation */}
        {showContributionModal && (
          <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} tabIndex="-1">
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content rounded-4">
                <div className="modal-header border-0 pb-0">
                  <h5 className="modal-title fw-semibold">Type de cotisation</h5>
                  <button type="button" className="btn-close" onClick={() => setShowContributionModal(false)}></button>
                </div>
                <div className="modal-body p-4">
                  <div className="d-flex gap-3">
                    <button className="btn btn-outline-primary flex-fill p-3" onClick={() => handleContributionType('individuelle')}>
                      <i className="fas fa-user fs-3 d-block mb-2"></i>
                      Individuelle
                    </button>
                    <button className="btn btn-outline-success flex-fill p-3" onClick={() => handleContributionType('groupe')}>
                      <i className="fas fa-users fs-3 d-block mb-2"></i>
                      Groupe
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}