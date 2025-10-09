import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const LoanApprovalDashboard = () => {
    const [loanRequests, setLoanRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentUser, setCurrentUser] = useState(null);
    const [filter, setFilter] = useState('ALL');
    const [actionLoading, setActionLoading] = useState(null);
    const [debugInfo, setDebugInfo] = useState('');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setDebugInfo('Début du chargement...');
            const token = localStorage.getItem('token');
            setDebugInfo(`Token présent: ${!!token}`);

            if (!token) {
                toast.error('Aucun token trouvé. Veuillez vous reconnecter.');
                setLoading(false);
                return;
            }

            // DEBUG: Test de la connexion API
            setDebugInfo('Test de connexion API...');
            
            // Récupérer toutes les demandes de prêt
            try {
                setDebugInfo('Tentative de récupération des demandes...');
                const requestsResponse = await axios.get('http://localhost:8080/mut/loan_request', {
                    headers: { 
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    timeout: 10000
                });
                
                setDebugInfo(`Réponse reçue, status: ${requestsResponse.status}`);
                console.log('Données reçues:', requestsResponse.data);
                
                if (Array.isArray(requestsResponse.data)) {
                    setLoanRequests(requestsResponse.data);
                    setDebugInfo(`✅ ${requestsResponse.data.length} demandes chargées`);
                } else {
                    setDebugInfo('❌ Les données ne sont pas un tableau');
                    toast.error('Format de données invalide');
                }
            } catch (apiError) {
                setDebugInfo(`❌ Erreur API: ${apiError.message}`);
                console.error('Erreur API:', apiError);
                toast.error(`Erreur API: ${apiError.message}`);
            }

            // Récupérer le profil utilisateur
            try {
                setDebugInfo('Tentative de récupération du profil...');
                const profileResponse = await axios.get('http://localhost:8080/mut/members/current', {
                    headers: { 
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });
                setCurrentUser(profileResponse.data);
                setDebugInfo(prev => prev + ' | ✅ Profil chargé');
            } catch (profileError) {
                setDebugInfo(prev => prev + ' | ⚠️ Profil non chargé');
                console.warn('Impossible de récupérer le profil:', profileError);
                
                // Fallback: décoder le token JWT
                try {
                    const tokenData = JSON.parse(atob(token.split('.')[1]));
                    setCurrentUser({
                        id: tokenData.id,
                        firstName: tokenData.firstName,
                        lastName: tokenData.lastName,
                        email: tokenData.email,
                        president: tokenData.president,
                        secretary: tokenData.secretary,
                        treasurer: tokenData.treasurer,
                        admin: tokenData.admin
                    });
                    setDebugInfo(prev => prev + ' | ✅ Profil depuis token');
                } catch (tokenError) {
                    setDebugInfo(prev => prev + ' | ❌ Erreur token');
                }
            }

        } catch (error) {
            setDebugInfo(`❌ Erreur générale: ${error.message}`);
            console.error('Erreur générale:', error);
            toast.error('Erreur lors du chargement des données');
        } finally {
            setLoading(false);
        }
    };

    // Déterminer le rôle de l'utilisateur actuel
    const getUserRole = () => {
        if (!currentUser) return 'MEMBER';
        
        if (currentUser.admin) return 'ADMIN';
        if (currentUser.president) return 'PRESIDENT';
        if (currentUser.secretary) return 'SECRETARY';
        if (currentUser.treasurer) return 'TREASURER';
        
        return 'MEMBER';
    };

    // Vérifier si l'utilisateur est un responsable
    const isValidator = () => {
        const role = getUserRole();
        return role === 'PRESIDENT' || role === 'SECRETARY' || role === 'TREASURER' || role === 'ADMIN';
    };

    const handleApprove = async (requestId, roleType) => {
    setActionLoading(`${requestId}-${roleType}`);
    try {
        const token = localStorage.getItem('token');
        let endpoint = '';
        
        switch(roleType) {
            case 'PRESIDENT':
                endpoint = `president`;
                break;
            case 'SECRETARY':
                endpoint = `secretary`;
                break;
            case 'TREASURER':
                endpoint = `treasurer`;
                break;
            default:
                return;
        }

        // CORRECTION: Envoyer un objet vide ou avec commentaire si nécessaire
        const approvalData = {
            comment: "" // ou laisser vide si pas de commentaire
        };

        const response = await axios.post(
            `http://localhost:8080/mut/loan_request/${requestId}/approve/${endpoint}`, 
            approvalData, // CORRECTION: envoyer un objet
            {
                headers: { 
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            }
        );
        
        // Mettre à jour la demande spécifique
        setLoanRequests(prev => 
            prev.map(req => req.id === requestId ? response.data : req)
        );
        
        toast.success(`✅ Validation ${roleType.toLowerCase()} effectuée !`);
    } catch (error) {
        console.error('Erreur approbation:', error);
        const errorMessage = error.response?.data || error.message || 'Erreur lors de l\'approbation';
        toast.error(errorMessage);
    } finally {
        setActionLoading(null);
    }
};

    const handleReject = async (requestId) => {
        const rejectionReason = window.prompt('Veuillez saisir la raison du rejet:');
        if (!rejectionReason) {
            toast.warning('Le rejet a été annulé');
            return;
        }

        if (!window.confirm('Êtes-vous sûr de vouloir rejeter cette demande ?')) {
            return;
        }

        setActionLoading(`${requestId}-reject`);
        try {
            const token = localStorage.getItem('token');
            const userRole = getUserRole();
            
            const response = await axios.post(
                `http://localhost:8080/mut/loan_request/${requestId}/reject`,
                {
                    rejectionReason: rejectionReason,
                    rejectedByRole: userRole
                },
                {
                    headers: { 
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            // Mettre à jour la demande rejetée
            setLoanRequests(prev => 
                prev.map(req => req.id === requestId ? response.data : req)
            );
            
            toast.success('❌ Demande rejetée avec succès !');
        } catch (error) {
            console.error('Erreur rejet:', error);
            const errorMessage = error.response?.data || error.message || 'Erreur lors du rejet';
            toast.error(errorMessage);
        } finally {
            setActionLoading(null);
        }
    };

    // Vérifier si l'utilisateur peut approuver une demande spécifique
    const canApproveRequest = (request, role) => {
        if (!request) return false;
        
        // Ne pas permettre l'approbation si la demande est rejetée ou déjà approuvée
        if (request.status === 'REJECTED' || request.status === 'APPROVED') {
            return false;
        }

        switch (role) {
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

    const canUserReject = (request) => {
        if (!request) return false;
        
        const userRole = getUserRole();
        // Tous les responsables peuvent rejeter
        return (userRole === 'PRESIDENT' || userRole === 'SECRETARY' || userRole === 'TREASURER' || userRole === 'ADMIN') &&
               request.status !== 'REJECTED' && 
               request.status !== 'APPROVED';
    };

    // Filtrer les demandes selon le statut
    const filteredRequests = loanRequests.filter(request => {
        if (filter === 'ALL') return true;
        return request.status === filter;
    });

    const getStatusBadge = (status) => {
        if (!status) return <span className="badge bg-secondary">Inconnu</span>;
        
        const statusConfig = {
            PENDING: { class: 'bg-warning', text: '⏳ En attente' },
            IN_REVIEW: { class: 'bg-info', text: '📋 En examen' },
            APPROVED: { class: 'bg-success', text: '✅ Approuvé' },
            REJECTED: { class: 'bg-danger', text: '❌ Rejeté' }
        };
        const config = statusConfig[status] || { class: 'bg-secondary', text: status };
        return <span className={`badge ${config.class}`}>{config.text}</span>;
    };

    const getApprovalProgress = (request) => {
        if (!request) return '0/3';
        
        const approvals = [request.presidentApproved, request.secretaryApproved, request.treasurerApproved];
        const approvedCount = approvals.filter(Boolean).length;
        return `${approvedCount}/3`;
    };

    const getProgressWidth = (request) => {
        if (!request) return 0;
        
        const approvedCount = [request.presidentApproved, request.secretaryApproved, request.treasurerApproved].filter(Boolean).length;
        return (approvedCount / 3) * 100;
    };

    const formatCurrency = (amount) => {
        if (!amount) return '0 FCFA';
        return new Intl.NumberFormat('fr-FR', {
            style: 'currency',
            currency: 'XOF'
        }).format(amount);
    };

    if (loading) {
        return (
            <div className="container mt-4">
                <div className="d-flex justify-content-center align-items-center" style={{ height: '400px' }}>
                    <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Chargement...</span>
                    </div>
                </div>
                <div className="text-center mt-3">
                    <small className="text-muted">Debug: {debugInfo}</small>
                </div>
            </div>
        );
    }

    // Vérifier si l'utilisateur a les droits d'accès
    if (!isValidator()) {
        return (
            <div className="container mt-4">
                <div className="alert alert-danger text-center">
                    <h4>🚫 Accès Refusé</h4>
                    <p>Vous n'avez pas les permissions nécessaires pour accéder à cette page.</p>
                    <p className="mb-0">
                        Seuls le président, le secrétaire, le trésorier et l'administrateur peuvent valider les demandes de prêt.
                    </p>
                </div>
                <div className="text-center mt-3">
                    <small className="text-muted">Debug: {debugInfo}</small>
                </div>
            </div>
        );
    }

    const userRole = getUserRole();

    return (
        <div className="container mt-4">
            {/* En-tête avec info debug */}
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h2>📋 Validation des Demandes de Prêt</h2>
                    <p className="text-muted mb-0">
                        Connecté en tant que: <strong>{currentUser?.firstName} {currentUser?.lastName}</strong> | 
                        Rôle: <strong className="text-primary">{userRole}</strong>
                    </p>
                </div>
            </div>

            {/* Info Debug */}
            <div className="alert alert-info small">
                <strong>Debug:</strong> {debugInfo} | 
                <strong> Demandes:</strong> {loanRequests.length} | 
                <strong> Filtrées:</strong> {filteredRequests.length}
            </div>

            {/* Filtres et Statistiques */}
            <div className="row mb-4">
                <div className="col-md-8">
                    <div className="card">
                        <div className="card-body">
                            <div className="row align-items-center">
                                <div className="col-md-4">
                                    <h6 className="mb-0">Filtrer par statut:</h6>
                                </div>
                                <div className="col-md-8">
                                    <select 
                                        className="form-select"
                                        value={filter}
                                        onChange={(e) => setFilter(e.target.value)}
                                    >
                                        <option value="ALL">📁 Toutes les demandes</option>
                                        <option value="PENDING">⏳ En attente</option>
                                        <option value="IN_REVIEW">📋 En examen</option>
                                        <option value="APPROVED">✅ Approuvées</option>
                                        <option value="REJECTED">❌ Rejetées</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="col-md-4">
                    <div className="card bg-primary text-white">
                        <div className="card-body text-center">
                            <h4>{filteredRequests.length}</h4>
                            <small>Demandes {filter === 'ALL' ? 'au total' : 'filtrées'}</small>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tableau des demandes */}
            {filteredRequests.length === 0 ? (
                <div className="alert alert-warning text-center">
                    <h5>📭 Aucune demande trouvée</h5>
                    <p className="mb-0">
                        {loanRequests.length === 0 
                            ? 'Aucune demande de prêt n\'a été trouvée dans le système.' 
                            : 'Aucune demande ne correspond aux critères de filtre.'
                        }
                    </p>
                    <button 
                        className="btn btn-primary mt-2"
                        onClick={fetchData}
                    >
                        🔄 Recharger
                    </button>
                </div>
            ) : (
                <div className="card shadow">
                    <div className="card-header bg-light">
                        <h5 className="mb-0">
                            📊 Liste des Demandes ({filteredRequests.length})
                        </h5>
                    </div>
                    <div className="card-body p-0">
                        <div className="table-responsive">
                            <table className="table table-hover mb-0">
                                <thead className="table-light">
                                    <tr>
                                        <th>Membre</th>
                                        <th>Montant</th>
                                        <th>Durée</th>
                                        <th>Motif</th>
                                        <th>Date</th>
                                        <th>Statut</th>
                                        <th>Progression</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredRequests.map(request => (
                                        <tr key={request.id}>
                                            <td>
                                                <div>
                                                    <strong>{request.member?.firstName} {request.member?.lastName}</strong>
                                                    <br />
                                                    <small className="text-muted">{request.member?.email}</small>
                                                </div>
                                            </td>
                                            <td>
                                                <strong className="text-primary">
                                                    {formatCurrency(request.requestAmount)}
                                                </strong>
                                            </td>
                                            <td>{request.duration} mois</td>
                                            <td>
                                                <span title={request.reason}>
                                                    {request.reason}
                                                </span>
                                            </td>
                                            <td>
                                                {request.requestDate ? new Date(request.requestDate).toLocaleDateString('fr-FR') : 'N/A'}
                                            </td>
                                            <td>
                                                {getStatusBadge(request.status)}
                                            </td>
                                            <td>
                                                <div className="d-flex align-items-center">
                                                    <small className="me-2">{getApprovalProgress(request)}</small>
                                                    <div className="progress flex-grow-1" style={{height: '8px'}}>
                                                        <div 
                                                            className="progress-bar" 
                                                            style={{width: `${getProgressWidth(request)}%`}}
                                                        />
                                                    </div>
                                                </div>
                                                <div className="small text-muted mt-1">
                                                    P: {request.presidentApproved ? '✅' : '❌'} | 
                                                    S: {request.secretaryApproved ? '✅' : '❌'} | 
                                                    T: {request.treasurerApproved ? '✅' : '❌'}
                                                </div>
                                            </td>
                                            <td>
                                                <div className="btn-group-vertical btn-group-sm">
                                                    {/* Le président peut approuver en tant que président */}
                                                    {(userRole === 'PRESIDENT' || userRole === 'ADMIN') && canApproveRequest(request, 'PRESIDENT') && (
                                                        <button
                                                            className="btn btn-outline-success btn-sm mb-1"
                                                            onClick={() => handleApprove(request.id, 'PRESIDENT')}
                                                            disabled={actionLoading === `${request.id}-PRESIDENT`}
                                                            title="Approuver en tant que Président"
                                                        >
                                                            {actionLoading === `${request.id}-PRESIDENT` ? (
                                                                <span className="spinner-border spinner-border-sm" />
                                                            ) : (
                                                                '✅ Président'
                                                            )}
                                                        </button>
                                                    )}
                                                    
                                                    {/* Le secrétaire peut approuver en tant que secrétaire */}
                                                    {(userRole === 'SECRETARY' || userRole === 'ADMIN') && canApproveRequest(request, 'SECRETARY') && (
                                                        <button
                                                            className="btn btn-outline-info btn-sm mb-1"
                                                            onClick={() => handleApprove(request.id, 'SECRETARY')}
                                                            disabled={actionLoading === `${request.id}-SECRETARY`}
                                                            title="Approuver en tant que Secrétaire"
                                                        >
                                                            {actionLoading === `${request.id}-SECRETARY` ? (
                                                                <span className="spinner-border spinner-border-sm" />
                                                            ) : (
                                                                '📝 Secrétaire'
                                                            )}
                                                        </button>
                                                    )}
                                                    
                                                    {/* Le trésorier peut approuver en tant que trésorier */}
                                                    {(userRole === 'TREASURER' || userRole === 'ADMIN') && canApproveRequest(request, 'TREASURER') && (
                                                        <button
                                                            className="btn btn-outline-warning btn-sm mb-1"
                                                            onClick={() => handleApprove(request.id, 'TREASURER')}
                                                            disabled={actionLoading === `${request.id}-TREASURER`}
                                                            title="Approuver en tant que Trésorier"
                                                        >
                                                            {actionLoading === `${request.id}-TREASURER` ? (
                                                                <span className="spinner-border spinner-border-sm" />
                                                            ) : (
                                                                '💰 Trésorier'
                                                            )}
                                                        </button>
                                                    )}
                                                    
                                                    {/* Tous les responsables peuvent rejeter */}
                                                    {canUserReject(request) && (
                                                        <button
                                                            className="btn btn-outline-danger btn-sm"
                                                            onClick={() => handleReject(request.id)}
                                                            disabled={actionLoading === `${request.id}-reject`}
                                                            title="Rejeter la demande"
                                                        >
                                                            {actionLoading === `${request.id}-reject` ? (
                                                                <span className="spinner-border spinner-border-sm" />
                                                            ) : (
                                                                '❌ Rejeter'
                                                            )}
                                                        </button>
                                                    )}
                                                    
                                                    {request.status === 'REJECTED' && (
                                                        <span className="badge bg-danger">Rejetée</span>
                                                    )}
                                                    
                                                    {request.status === 'APPROVED' && (
                                                        <span className="badge bg-success">✓ Terminé</span>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* Bouton de rechargement */}
            <div className="text-center mt-3">
                <button 
                    className="btn btn-outline-primary"
                    onClick={fetchData}
                    disabled={loading}
                >
                    {loading ? (
                        <>
                            <span className="spinner-border spinner-border-sm me-2" />
                            Chargement...
                        </>
                    ) : (
                        '🔄 Recharger les données'
                    )}
                </button>
            </div>
        </div>
    );
};

export default LoanApprovalDashboard;