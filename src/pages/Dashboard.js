import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import 'bootstrap/dist/css/bootstrap.min.css';

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [myLoanRequests, setMyLoanRequests] = useState([]);
  const [myLoans, setMyLoans] = useState([]);
  const [stats, setStats] = useState({
    totalRequests: 0,
    activeLoans: 0,
    pendingApprovals: 0,
    totalContributions: 0
  });
  const fileInputRef = useRef();
  const [showContributionModal, setShowContributionModal] = useState(false);

  const navigate = useNavigate();

  // Upload photo handler
  const handlePhotoChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validation du fichier
    if (!file.type.startsWith('image/')) {
      alert('Veuillez sélectionner une image valide');
      return;
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB max
      alert('La taille de l\'image ne doit pas dépasser 5MB');
      return;
    }

    setUploading(true);
    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('file', file);

      const res = await axios.post('http://localhost:8080/mut/member/profile/photo', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
      });

      const newPhotoUrl = res.data + '?t=' + Date.now();
      setUser((prev) => ({ ...prev, photo: newPhotoUrl }));

      // Mettre à jour le localStorage si nécessaire
      const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
      localStorage.setItem('currentUser', JSON.stringify({
        ...currentUser,
        photo: newPhotoUrl
      }));

    } catch (err) {
      console.error('Erreur upload:', err);
      alert("Erreur lors de l'upload de la photo. Veuillez réessayer.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

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

      } catch (err) {
        console.error('Erreur chargement profil:', err);
        let backendMsg = '';
        if (err.response) {
          backendMsg = ` (Code: ${err.response.status})`;
        }
        setError("Impossible de charger le profil utilisateur." + backendMsg);

        // Redirection si token invalide
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

  const fetchLoanData = async (token, userId) => {
    try {
      // Charger mes demandes de prêt
      const requestsRes = await axios.get('http://localhost:8080/mut/loan_request/my-requests', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMyLoanRequests(requestsRes.data);

      // Charger mes prêts
      const loansRes = await axios.get('http://localhost:8080/mut/loan', {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Filtrer seulement les prêts de l'utilisateur connecté
      const userLoans = loansRes.data.filter(loan =>
        loan.member && loan.member.id === userId
      );
      setMyLoans(userLoans);

      // Calculer les statistiques
      setStats({
        totalRequests: requestsRes.data.length,
        activeLoans: userLoans.filter(loan => !loan.isRepaid).length,
        pendingApprovals: requestsRes.data.filter(req => req.status === 'PENDING').length,
        totalContributions: 0 // À implémenter selon votre API
      });

    } catch (error) {
      console.error('Erreur lors du chargement des données de prêt:', error);
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

  const getLoanStatusBadge = (isRepaid) => {
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
    <div className="container-fluid py-4">
      {/* Header avec informations utilisateur */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="card shadow-sm border-0">
            <div className="card-body">
              <div className="row align-items-center">
                <div className="col-auto">
                  <div className="position-relative">
                    <img
                      src={user.photo || '/default-avatar.png'}
                      alt={`Profil de ${user.firstName} ${user.name}`}
                      className="rounded-circle shadow"
                      width={120}
                      height={120}
                      style={{ objectFit: 'cover' }}
                    />
                    <input
                      type="file"
                      accept="image/*"
                      ref={fileInputRef}
                      style={{ display: 'none' }}
                      onChange={handlePhotoChange}
                    />
                    <button
                      className="btn btn-primary btn-sm position-absolute bottom-0 end-0 rounded-circle"
                      style={{ width: '36px', height:'36px' }}
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                      title="Changer la photo"
                    >
                      <i className={`fas ${uploading ? 'fa-spinner fa-spin' : 'fa-camera'}`}></i>
                    </button>
                  </div>
                </div>

                <div className="col">
                  <h2 className="h4 mb-2">Bienvenue, {user.firstName} {user.name}!</h2>
                  <div className="row text-muted">
                    <div className="col-md-6">
                      <p className="mb-1">
                        <i className="fas fa-envelope me-2"></i>
                        {user.email}
                      </p>
                      <p className="mb-1">
                        <i className="fas fa-id-card me-2"></i>
                        NPI: {user.npi}
                      </p>
                    </div>
                    <div className="col-md-6">
                      <p className="mb-1">
                        <i className="fas fa-phone me-2"></i>
                        {user.phone}
                      </p>
                      <p className="mb-1">
                        <i className="fas fa-user-tag me-2"></i>
                        <span className="badge bg-primary">{user.role}</span>
                      </p>
                    </div>
                  </div>
                </div>

                <div className="col-auto">
                  <button
                    className="btn btn-outline-danger"
                    onClick={handleLogout}
                  >
                    <i className="fas fa-sign-out-alt me-2"></i>
                    Déconnexion
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Cartes de statistiques */}
      <div className="row mb-4">
        <div className="col-xl-3 col-md-6 mb-4">
          <div className="card border-left-primary shadow h-100 py-2">
            <div className="card-body">
              <div className="row no-gutters align-items-center">
                <div className="col mr-2">
                  <div className="text-xs font-weight-bold text-primary text-uppercase mb-1">
                    Demandes de prêt
                  </div>
                  <div className="h5 mb-0 font-weight-bold text-gray-800">
                    {stats.totalRequests}
                  </div>
                </div>
                <div className="col-auto">
                  <i className="fas fa-file-alt fa-2x text-gray-300"></i>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-xl-3 col-md-6 mb-4">
          <div className="card border-left-success shadow h-100 py-2">
            <div className="card-body">
              <div className="row no-gutters align-items-center">
                <div className="col mr-2">
                  <div className="text-xs font-weight-bold text-success text-uppercase mb-1">
                    Prêts actifs
                  </div>
                  <div className="h5 mb-0 font-weight-bold text-gray-800">
                    {stats.activeLoans}
                  </div>
                </div>
                <div className="col-auto">
                  <i className="fas fa-hand-holding-usd fa-2x text-gray-300"></i>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-xl-3 col-md-6 mb-4">
          <div className="card border-left-warning shadow h-100 py-2">
            <div className="card-body">
              <div className="row no-gutters align-items-center">
                <div className="col mr-2">
                  <div className="text-xs font-weight-bold text-warning text-uppercase mb-1">
                    En attente
                  </div>
                  <div className="h5 mb-0 font-weight-bold text-gray-800">
                    {stats.pendingApprovals}
                  </div>
                </div>
                <div className="col-auto">
                  <i className="fas fa-clock fa-2x text-gray-300"></i>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-xl-3 col-md-6 mb-4">
          <div className="card border-left-info shadow h-100 py-2">
            <div className="card-body">
              <div className="row no-gutters align-items-center">
                <div className="col mr-2">
                  <div className="text-xs font-weight-bold text-info text-uppercase mb-1">
                    Cotisations
                  </div>
                  <div className="h5 mb-0 font-weight-bold text-gray-800">
                    {stats.totalContributions}
                  </div>
                </div>
                <div className="col-auto">
                  <i className="fas fa-chart-pie fa-2x text-gray-300"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Section principale */}
      <div className="row">
        {/* Gestion des prêts */}
        <div className="col-lg-8 mb-4">
          <div className="card shadow mb-4">
            <div className="card-header bg-white py-3">
              <h5 className="m-0 font-weight-bold text-primary">
                <i className="fas fa-hand-holding-usd me-2"></i>
                Gestion des Prêts
              </h5>
            </div>
            <div className="card-body">
              <div className="row">
                <div className="col-md-6 mb-3">
                  <div className="card border-left-primary h-100">
                    <div className="card-body">
                      <h6 className="card-title text-primary">
                        <i className="fas fa-plus-circle me-2"></i>
                        Nouvelle Demande
                      </h6>
                      <p className="card-text small text-muted">
                        Soumettez une nouvelle demande de prêt pour votre projet
                      </p>
                      <button
                        className="btn btn-primary btn-sm w-100"
                        onClick={() => navigate('/loans/request')}
                      >
                        Demander un prêt
                      </button>
                    </div>
                  </div>
                </div>

                <div className="col-md-6 mb-3">
                  <div className="card border-left-info h-100">
                    <div className="card-body">
                      <h6 className="card-title text-info">
                        <i className="fas fa-list me-2"></i>
                        Mes Demandes
                      </h6>
                      <p className="card-text small text-muted">
                        Consultez l'état de vos demandes de prêt
                      </p>
                      <button
                        className="btn btn-info btn-sm w-100 text-white"
                        onClick={() => navigate('/loans/requests')}
                      >
                        Voir mes demandes
                      </button>
                    </div>
                  </div>
                </div>

                <div className="col-md-6 mb-3">
                  <div className="card border-left-warning h-100">
                    <div className="card-body">
                      <h6 className="card-title text-warning">
                        <i className="fas fa-chart-line me-2"></i>
                        Mes Prêts
                      </h6>
                      <p className="card-text small text-muted">
                        Suivez vos prêts en cours et leur statut
                      </p>
                      <button
                        className="btn btn-warning btn-sm w-100"
                        onClick={() => navigate('/loans/list')}
                      >
                        Mes prêts en cours
                      </button>
                    </div>
                  </div>
                </div>

                <div className="col-md-6 mb-3">
                  <div className="card border-left-success h-100">
                    <div className="card-body">
                      <h6 className="card-title text-success">
                        <i className="fas fa-money-bill-wave me-2"></i>
                        Cotisations
                      </h6>
                      <p className="card-text small text-muted">
                        Gérez vos cotisations individuelles ou de groupe
                      </p>
                      <button
                        className="btn btn-success btn-sm w-100"
                        onClick={() => setShowContributionModal(true)}
                      >
                        Faire une cotisation
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Aperçu rapide */}
              <div className="row mt-4">
                <div className="col-md-6">
                  <h6 className="text-muted mb-3">
                    <i className="fas fa-history me-2"></i>
                    Dernières demandes
                  </h6>
                  {myLoanRequests.length === 0 ? (
                    <p className="text-muted small">Aucune demande de prêt</p>
                  ) : (
                    <div className="small">
                      {myLoanRequests.slice(0, 3).map(request => (
                        <div key={request.id} className="d-flex justify-content-between align-items-center border-bottom py-2">
                          <div>
                            <div className="fw-medium">{formatCurrency(request.requestAmount)}</div>
                            <small className="text-muted">{request.reason}</small>
                          </div>
                          {getStatusBadge(request.status)}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="col-md-6">
                  <h6 className="text-muted mb-3">
                    <i className="fas fa-chart-line me-2"></i>
                    Prêts en cours
                  </h6>
                  {myLoans.filter(loan => !loan.isRepaid).length === 0 ? (
                    <p className="text-muted small">Aucun prêt en cours</p>
                  ) : (
                    <div className="small">
                      {myLoans.filter(loan => !loan.isRepaid).slice(0, 2).map(loan => (
                        <div key={loan.id} className="d-flex justify-content-between align-items-center border-bottom py-2">
                          <div>
                            <div className="fw-medium">{formatCurrency(loan.amount)}</div>
                            <small className="text-muted">Échéance: {new Date(loan.endDate).toLocaleDateString()}</small>
                          </div>
                          {getLoanStatusBadge(loan.isRepaid)}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Panel administrateur */}
          {isAdmin && (
            <div className="card shadow mb-4">
              <div className="card-header bg-warning text-white py-3">
                <h5 className="m-0 font-weight-bold">
                  <i className="fas fa-user-shield me-2"></i>
                  Panel Validation des Prêts
                </h5>
              </div>
              <div className="card-body">
                <div className="row">
                  <div className="col-md-4 mb-3">
                    <div className="card border-primary h-100">
                      <div className="card-body text-center">
                        <i className="fas fa-list-check fa-2x text-primary mb-2"></i>
                        <h6>Tableau d'approbation</h6>
                        <p className="small text-muted">Vue complète avec statistiques</p>
                        <button
                          className="btn btn-primary btn-sm mt-2"
                          onClick={() => navigate('/loans/approval-dashboard')}
                        >
                          Accéder
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="col-md-4 mb-3">
                    <div className="card border-warning h-100">
                      <div className="card-body text-center">
                        <i className="fas fa-check-circle fa-2x text-warning mb-2"></i>
                        <h6>Validation rapide</h6>
                        <p className="small text-muted">Approbations en attente</p>
                        <button
                          className="btn btn-warning btn-sm mt-2"
                          onClick={() => navigate('/loans/approval')}
                        >
                          Valider
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="col-md-4 mb-3">
                    <div className="card border-info h-100">
                      <div className="card-body text-center">
                        <i className="fas fa-chart-bar fa-2x text-info mb-2"></i>
                        <h6>Rapports validation</h6>
                        <p className="small text-muted">Statistiques et historique</p>
                        <button
                          className="btn btn-info btn-sm mt-2 text-white"
                          onClick={() => navigate('/loans/validation-reports')}
                        >
                          Voir rapports
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar - Notifications et Actions rapides */}
        <div className="col-lg-4 mb-4">
          {/* Notifications */}
          <div className="card shadow mb-4">
            <div className="card-header bg-white py-3">
              <h5 className="m-0 font-weight-bold text-primary">
                <i className="fas fa-bell me-2"></i>
                Notifications
              </h5>
            </div>
            <div className="card-body">
              {myLoanRequests.some(req => req.status === 'APPROVED') && (
                <div className="alert alert-success d-flex align-items-center mb-3">
                  <i className="fas fa-check-circle me-2"></i>
                  <div>
                    <strong>Félicitations!</strong>
                    <div className="small">Vous avez des demandes de prêt approuvées</div>
                  </div>
                </div>
              )}

              {myLoanRequests.some(req => req.status === 'REJECTED') && (
                <div className="alert alert-danger d-flex align-items-center mb-3">
                  <i className="fas fa-times-circle me-2"></i>
                  <div>
                    <strong>Demandes rejetées</strong>
                    <div className="small">Certaines demandes ont été rejetées</div>
                  </div>
                </div>
              )}

              {myLoans.some(loan => !loan.isRepaid && new Date(loan.endDate) < new Date()) && (
                <div className="alert alert-warning d-flex align-items-center mb-3">
                  <i className="fas fa-exclamation-triangle me-2"></i>
                  <div>
                    <strong>Retard de remboursement</strong>
                    <div className="small">Vous avez des prêts en retard</div>
                  </div>
                </div>
              )}

              {!myLoanRequests.some(req => req.status === 'APPROVED') &&
                !myLoanRequests.some(req => req.status === 'REJECTED') &&
                !myLoans.some(loan => !loan.isRepaid && new Date(loan.endDate) < new Date()) && (
                  <div className="text-center text-muted py-3">
                    <i className="fas fa-check-circle fa-2x mb-2"></i>
                    <div>Aucune notification</div>
                  </div>
                )}
            </div>
          </div>

          {/* Actions rapides */}
          <div className="card shadow">
            <div className="card-header bg-white py-3">
              <h5 className="m-0 font-weight-bold text-primary">
                <i className="fas fa-bolt me-2"></i>
                Actions Rapides
              </h5>
            </div>
            <div className="card-body">
              <div className="d-grid gap-2">
                <button
                  className="btn btn-outline-primary btn-sm"
                  onClick={() => navigate('/mut/contribution/individual/my-contributions')}
                >
                  <i className="fas fa-history me-2"></i>
                  Historique cotisations
                </button>

                <button
                  className="btn btn-outline-info btn-sm"
                  onClick={() => navigate('/loans/repayment')}
                >
                  <i className="fas fa-credit-card me-2"></i>
                  Remboursement
                </button>

                <button className="btn btn-outline-warning btn-sm">
                  <i className="fas fa-headset me-2"></i>
                  Assistance
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de sélection du type de cotisation */}
      {showContributionModal && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  <i className="fas fa-money-bill-wave me-2"></i>
                  Type de Cotisation
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowContributionModal(false)}
                ></button>
              </div>
              <div className="modal-body">
                <p className="text-muted mb-4">Sélectionnez le type de cotisation que vous souhaitez effectuer :</p>
                <div className="row g-3">
                  <div className="col-md-6">
                    <div className="card h-100 border-primary">
                      <div className="card-body text-center">
                        <i className="fas fa-user fa-3x text-primary mb-3"></i>
                        <h6 className="card-title">Individuelle</h6>
                        <p className="card-text small text-muted">Pour un seul membre</p>
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={() => handleContributionType('individuelle')}
                        >
                          Choisir
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="card h-100 border-success">
                      <div className="card-body text-center">
                        <i className="fas fa-users fa-3x text-success mb-3"></i>
                        <h6 className="card-title">Groupe</h6>
                        <p className="card-text small text-muted">Pour plusieurs membres</p>
                        <button
                          className="btn btn-success btn-sm"
                          onClick={() => handleContributionType('groupe')}
                        >
                          Choisir
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowContributionModal(false)}
                >
                  Annuler
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}