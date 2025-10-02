import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import 'bootstrap/dist/css/bootstrap.min.css';


export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [loanEligibility, setLoanEligibility] = useState(null);
  const [myLoanRequests, setMyLoanRequests] = useState([]);
  const [myLoans, setMyLoans] = useState([]);
  const fileInputRef = useRef();
  const [showContributionModal, setShowContributionModal] = useState(false);

  const navigate = useNavigate();

  // Upload photo handler
  const handlePhotoChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
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
    } catch (err) {
      alert("Erreur lors de l'upload de la photo");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get('http://localhost:8080/mut/member/profile', {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
        setUser(res.data);
        // Charger les données des prêts
        await fetchLoanData(token);
      } catch (err) {
        let backendMsg = '';
        if (err.response) {
          backendMsg = ` (Code: ${err.response.status})\nMessage: ${err.response.data && typeof err.response.data === 'string' ? err.response.data : JSON.stringify(err.response.data)}`;
        }
        setError("Impossible de charger le profil utilisateur." + backendMsg);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);



  const fetchLoanData = async (token) => {
    try {
      // Charger mes demandes de prêt
      const requestsRes = await axios.get('http://localhost:8080/mut/loan_request/my-requests', {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      setMyLoanRequests(requestsRes.data);

      // Charger mes prêts
      const loansRes = await axios.get('http://localhost:8080/mut/loan', {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      // Filtrer seulement les prêts de l'utilisateur connecté
      const userLoans = loansRes.data.filter(loan =>
        loan.member && loan.member.id === user?.id
      );
      setMyLoans(userLoans);

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

  const handleContributionPeriod = () => {
    navigate('/mut/contribution_period');
  };


  const getStatusBadge = (status) => {
    const statusClasses = {
      PENDING: 'bg-warning',
      IN_REVIEW: 'bg-info',
      APPROVED: 'bg-success',
      REJECTED: 'bg-danger'
    };
    return statusClasses[status] || 'bg-secondary';
  };

  const getLoanStatusBadge = (isRepaid) => {
    return isRepaid ? 'bg-success' : 'bg-warning';
  };

  if (loading) return <div className="container mt-4">Chargement...</div>;
  if (error) return <div className="container mt-4 alert alert-danger">{error}</div>;
  if (!user) return null;

  return (
    <div className="container mt-4">
      <div className="d-flex align-items-center mb-4">
        <img
          src={user.photo || 'https://via.placeholder.com/100'}
          alt="Profil"
          className="rounded-circle me-3"
          width={100}
          height={100}
        />
        <div>
          <h3>{user.name} {user.firstName}</h3>
          <p className="mb-1"><strong>Rôle :</strong> {user.role}</p>
          <p className="mb-1"><strong>Email :</strong> {user.email}</p>
          <p className="mb-1"><strong>NPI :</strong> {user.npi}</p>
          <p className="mb-1"><strong>Téléphone :</strong> {user.phone}</p>

          <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            style={{ display: 'none' }}
            onChange={handlePhotoChange}
          />
          <button
            className="btn btn-outline-primary btn-sm mt-2"
            onClick={() => fileInputRef.current && fileInputRef.current.click()}
            disabled={uploading}
          >
            {uploading ? 'Envoi...' : 'Changer la photo'}
          </button>
        </div>
      </div>

      {/* Section Prêts */}
      <div className="row mb-4">
        <div className="col-md-6 mb-3">
          <div className="card h-100">
            <div className="card-header bg-primary text-white">
              <h5 className="card-title mb-0">💰 Gestion des Prêts</h5>
            </div>
            <div className="card-body">
              <div className="alert alert-success mb-3">
                <strong>✅ Prêts accessibles à tous les membres !</strong>
              </div>

              <div className="d-grid gap-2">
                <button
                  className="btn btn-success"
                  onClick={() => navigate('/loans/request')}
                >
                  📋 Demander un prêt
                </button>

                <button
                  className="btn btn-info text-white"
                  onClick={() => navigate('/loans/requests')}
                >
                  📄 Mes demandes de prêt
                </button>

                <button
                  className="btn btn-warning"
                  onClick={() => navigate('/loans/list')}
                >
                  💰 Mes prêts en cours
                </button>

                {/* Options pour les administrateurs */}
                {(user.role === 'ADMIN' || user.role === 'PRESIDENT' || user.role === 'TREASURER' || user.role === 'SECRETARY') && (
                  <>
                    <hr />

                    <button
                      className="btn btn-outline-secondary btn-sm"
                      onClick={() => navigate('/mut/contribution_period')}
                    >
                      🗓️ Gérer les périodes de cotisation
                    </button>

                    <button
                      className="btn btn-outline-primary btn-sm"
                      onClick={() => navigate('/loans/approval')}
                    >
                      ✅ Validation des prêts
                    </button>

                    <button
                      className="btn btn-outline-success btn-sm"
                      onClick={() => navigate('/loans/create')}
                    >
                      ➕ Créer un prêt
                    </button>
                    {/* mut/contribution_period/add */}
                    <button
                      className="btn btn-outline-info btn-sm"
                      onClick={() => navigate('/loans/repayment')}
                    >
                      💳 Enregistrer remboursement
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-6 mb-3">
          <div className="card h-100">
            <div className="card-header bg-success text-white">
              <h5 className="card-title mb-0">📊 Aperçu des Prêts</h5>
            </div>
            <div className="card-body">
              {/* Statistiques rapides */}
              <div className="row text-center mb-3">
                <div className="col-6">
                  <div className="border rounded p-2 bg-light">
                    <h6 className="mb-0">{myLoanRequests.length}</h6>
                    <small>Demandes</small>
                  </div>
                </div>
                <div className="col-6">
                  <div className="border rounded p-2 bg-light">
                    <h6 className="mb-0">{myLoans.filter(loan => !loan.isRepaid).length}</h6>
                    <small>Prêts actifs</small>
                  </div>
                </div>
              </div>

              {/* Dernières demandes de prêt */}
              <h6>Dernières demandes :</h6>
              {myLoanRequests.length === 0 ? (
                <p className="text-muted small">Aucune demande de prêt</p>
              ) : (
                <div className="small">
                  {myLoanRequests.slice(0, 3).map(request => (
                    <div key={request.id} className="d-flex justify-content-between align-items-center border-bottom py-1">
                      <span>{request.requestAmount} FCFA</span>
                      <span className={`badge ${getStatusBadge(request.status)}`}>
                        {request.status}
                      </span>
                    </div>
                  ))}
                  {myLoanRequests.length > 3 && (
                    <button
                      className="btn btn-link btn-sm p-0 mt-1"
                      onClick={() => navigate('/loans/requests')}
                    >
                      Voir toutes ({myLoanRequests.length})
                    </button>
                  )}
                </div>
              )}

              {/* Prêts en cours */}
              <h6 className="mt-3">Prêts en cours :</h6>
              {myLoans.filter(loan => !loan.isRepaid).length === 0 ? (
                <p className="text-muted small">Aucun prêt en cours</p>
              ) : (
                <div className="small">
                  {myLoans.filter(loan => !loan.isRepaid).slice(0, 2).map(loan => (
                    <div key={loan.id} className="d-flex justify-content-between align-items-center border-bottom py-1">
                      <span>{loan.amount} FCFA</span>
                      <span className={`badge ${getLoanStatusBadge(loan.isRepaid)}`}>
                        {loan.isRepaid ? 'Remboursé' : 'En cours'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Section Validation des Prêts pour les administrateurs */}
      {(user.role === 'ADMIN' || user.role === 'PRESIDENT' || user.role === 'SECRETARY' || user.role === 'TREASURER') && (
        <div className="row mb-4">
          <div className="col-12">
            <div className="card">
              <div className="card-header bg-warning text-white">
                <h5 className="card-title mb-0">⚡ Panel de Validation des Prêts</h5>
              </div>
              <div className="card-body">
                <div className="row">
                  <div className="col-md-8">
                    <h6>Fonctions de validation disponibles :</h6>
                    <div className="row">
                      {(user.role === 'PRESIDENT' || user.role === 'ADMIN') && (
                        <div className="col-md-4 mb-2">
                          <div className="card border-primary">
                            <div className="card-body text-center">
                              <h6>👑 Président</h6>
                              <small className="text-muted">Validation stratégique</small>
                            </div>
                          </div>
                        </div>
                      )}
                      {(user.role === 'SECRETARY' || user.role === 'ADMIN') && (
                        <div className="col-md-4 mb-2">
                          <div className="card border-info">
                            <div className="card-body text-center">
                              <h6>📝 Secrétaire</h6>
                              <small className="text-muted">Vérification administrative</small>
                            </div>
                          </div>
                        </div>
                      )}
                      {(user.role === 'TREASORIER' || user.role === 'ADMIN') && (
                        <div className="col-md-4 mb-2">
                          <div className="card border-success">
                            <div className="card-body text-center">
                              <h6>💰 Trésorier</h6>
                              <small className="text-muted">Analyse financière</small>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="col-md-4 d-flex align-items-center">
                    <button
                      className="btn btn-warning w-100"
                      onClick={() => navigate('/loans/approval')}
                    >
                      📋 Accéder aux validations
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="row mb-4">
        <div className="col-md-6 mb-3">
          <div className="card">
            <div className="card-body">
              <h5 className="card-title">📋 Cotisations</h5>

              <button
                className="btn btn-primary w-100 mb-2"
                onClick={() => setShowContributionModal(true)}
              >
                Faire une cotisation
              </button>

              <button
                className="btn btn-secondary w-100"
                onClick={() => navigate('/mut/contribution/individual/my-contributions')}
              >
                Voir historique de mes cotisations
              </button>
            </div>
          </div>
        </div>

        <div className="col-md-6 mb-3">
          <div className="card">
            <div className="card-body">
              <h5 className="card-title">🔔 Notifications</h5>
              <ul className="list-group">
                {/* Notifications de prêt */}
                {myLoanRequests.some(req => req.status === 'APPROVED') && (
                  <li className="list-group-item list-group-item-success">
                    ✅ Vous avez des demandes de prêt approuvées !
                  </li>
                )}

                {myLoanRequests.some(req => req.status === 'REJECTED') && (
                  <li className="list-group-item list-group-item-danger">
                    ❌ Certaines demandes de prêt ont été rejetées
                  </li>
                )}

                {myLoans.some(loan => !loan.isRepaid && new Date(loan.endDate) < new Date()) && (
                  <li className="list-group-item list-group-item-warning">
                    ⚠️ Vous avez des prêts en retard de remboursement
                  </li>
                )}

                {myLoanRequests.length === 0 && myLoans.length === 0 && (
                  <li className="list-group-item">Aucune notification pour le moment.</li>
                )}
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de sélection du type de cotisation */}
      {showContributionModal && (
        <div
          className="modal fade show"
          style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}
          onClick={() => setShowContributionModal(false)}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h5 className="modal-title">Choisir le type de cotisation</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowContributionModal(false)}
                ></button>
              </div>
              <div className="modal-body">
                <p>Veuillez sélectionner le type de cotisation :</p>
                <div className="d-grid gap-3">
                  <button
                    className="btn btn-primary btn-lg"
                    onClick={() => handleContributionType('individuelle')}
                  >
                    <strong>Cotisation Individuelle</strong>
                    <br />
                    <small className="text-light">Pour un seul membre</small>
                  </button>

                  <button
                    className="btn btn-success btn-lg"
                    onClick={() => handleContributionType('groupe')}
                  >
                    <strong>Cotisation de Groupe</strong>
                    <br />
                    <small className="text-light">Pour plusieurs membres</small>
                  </button>
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

      <div className="row">
        <div className="col-md-6 mb-3">
          <div className="card">
            <div className="card-body">
              <h5 className="card-title">📞 Assistance</h5>
              <button className="btn btn-warning w-100">Demander une assistance</button>
            </div>
          </div>
        </div>
        <div className="col-md-6 mb-3 d-flex align-items-end">
          <button
            className="btn btn-danger w-100"
            onClick={handleLogout}
          >
            🚪 Déconnexion
          </button>
        </div>
      </div>
    </div>
  );
}