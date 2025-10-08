import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';

const LoanApproval = () => {
    const navigate = useNavigate();
    const [loanRequests, setLoanRequests] = useState([]);
    const [currentUser, setCurrentUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(null);
    const [filter, setFilter] = useState('ALL');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const token = localStorage.getItem('token');
            
            // Récupérer les demandes de prêt
            const requestsResponse = await axios.get('http://localhost:8080/mut/loan_request', {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            // Récupérer le profil utilisateur - CORRECTION ICI
            try {
                const profileResponse = await axios.get('http://localhost:8080/mut/members/current', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setCurrentUser(profileResponse.data);
            } catch (profileError) {
                console.warn('Impossible de récupérer le profil, utilisation du token');
                // Récupérer les infos du token JWT
                const tokenData = JSON.parse(atob(token.split('.')[1]));
                setCurrentUser({
                    id: tokenData.id,
                    firstName: tokenData.firstName,
                    lastName: tokenData.lastName,
                    email: tokenData.email,
                    role: tokenData.role || 'MEMBER'
                });
            }

            setLoanRequests(requestsResponse.data);
        } catch (error) {
            console.error('Erreur:', error);
            toast.error('Erreur lors du chargement des données');
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (requestId, role) => {
        setActionLoading(requestId);
        try {
            const token = localStorage.getItem('token');
            let endpoint = '';

            switch (role) {
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

            // CORRECTION : Envoyer un objet vide dans le body
            const response = await axios.post(
                `http://localhost:8080/mut/loan_request/${requestId}/approve/${endpoint}`, 
                {}, // Body vide car votre backend n'attend pas de données
                { 
                    headers: { 
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    } 
                }
            );

            // Mettre à jour la liste
            const updatedRequests = loanRequests.map(req => 
                req.id === requestId ? response.data : req
            );
            setLoanRequests(updatedRequests);
            
            toast.success(`Validation ${role.toLowerCase()} effectuée avec succès !`);
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

        setActionLoading(requestId);
        try {
            const token = localStorage.getItem('token');
            
            // CORRECTION : Envoyer les données dans le format attendu
            const response = await axios.post(
                `http://localhost:8080/mut/loan_request/${requestId}/reject`,
                {
                    rejectionReason: rejectionReason,
                    rejectedByRole: getCurrentUserRole() // Déterminer le rôle actuel
                },
                { 
                    headers: { 
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    } 
                }
            );

            // Mettre à jour la demande rejetée
            const updatedRequests = loanRequests.map(req => 
                req.id === requestId ? response.data : req
            );
            setLoanRequests(updatedRequests);
            
            toast.success('Demande rejetée avec succès !');
        } catch (error) {
            console.error('Erreur rejet:', error);
            const errorMessage = error.response?.data || error.message || 'Erreur lors du rejet';
            toast.error(errorMessage);
        } finally {
            setActionLoading(null);
        }
    };

    // Déterminer le rôle de l'utilisateur actuel
    const getCurrentUserRole = () => {
        if (!currentUser) return 'MEMBER';
        
        if (currentUser.president || currentUser.role === 'PRESIDENT') return 'PRESIDENT';
        if (currentUser.secretary || currentUser.role === 'SECRETARY') return 'SECRETARY';
        if (currentUser.treasurer || currentUser.role === 'TREASURER') return 'TREASURER';
        if (currentUser.admin || currentUser.role === 'ADMIN') return 'ADMIN';
        
        return 'MEMBER';
    };

    // Vérifier les permissions - CORRECTION ICI
    const userRole = getCurrentUserRole();
    const canApproveAsPresident = (userRole === 'PRESIDENT' || userRole === 'ADMIN');
    const canApproveAsSecretary = (userRole === 'SECRETARY' || userRole === 'ADMIN');
    const canApproveAsTreasurer = (userRole === 'TREASURER' || userRole === 'ADMIN');
    const canReject = (userRole === 'PRESIDENT' || userRole === 'SECRETARY' || userRole === 'TREASURER' || userRole === 'ADMIN');

    // Vérifier si l'utilisateur peut approuver une demande spécifique
    const canUserApproveRequest = (request, role) => {
        if (request.status === 'REJECTED' || request.status === 'APPROVED') return false;
        
        switch (role) {
            case 'PRESIDENT':
                return canApproveAsPresident && !request.presidentApproved;
            case 'SECRETARY':
                return canApproveAsSecretary && !request.secretaryApproved;
            case 'TREASURER':
                return canApproveAsTreasurer && !request.treasurerApproved;
            default:
                return false;
        }
    };

    // Filtrer les demandes selon le statut
    const filteredRequests = loanRequests.filter(request => {
        if (filter === 'ALL') return true;
        return request.status === filter;
    });

    const getStatusBadge = (status) => {
        const statusConfig = {
            PENDING: { class: 'bg-warning', text: '⏳ En attente' },
            IN_REVIEW: { class: 'bg-info', text: '📋 En examen' },
            APPROVED: { class: 'bg-success', text: '✅ Approuvé' },
            REJECTED: { class: 'bg-danger', text: '❌ Rejeté' }
        };
        const config = statusConfig[status] || { class: 'bg-secondary', text: status };
        return <span className={`badge ${config.class}`}>{config.text}</span>;
    };

    const getApprovalBadge = (approved) => {
        return approved ? 
            <span className="badge bg-success">✅</span> : 
            <span className="badge bg-secondary">❌</span>;
    };

    const getApprovalProgress = (request) => {
        const approvals = [
            request.presidentApproved,
            request.secretaryApproved, 
            request.treasurerApproved
        ];
        const approvedCount = approvals.filter(Boolean).length;
        return `${approvedCount}/3`;
    };

    if (loading) {
        return (
            <div className="container mt-4">
                <div className="d-flex justify-content-center align-items-center" style={{ height: '400px' }}>
                    <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Chargement...</span>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="container mt-4">
            {/* En-tête */}
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h2>📋 Validation des Demandes de Prêt</h2>
                    <p className="text-muted">
                        Rôle actuel: <strong>{userRole}</strong> | 
                        Connecté en tant que: <strong>{currentUser?.firstName} {currentUser?.lastName}</strong>
                    </p>
                </div>
                <button 
                    className="btn btn-outline-secondary"
                    onClick={() => navigate('/dashboard')}
                >
                    ↩️ Retour
                </button>
            </div>

            {/* Filtres */}
            <div className="card mb-4">
                <div className="card-body">
                    <div className="row align-items-center">
                        <div className="col-md-6">
                            <h6 className="mb-0">Filtrer par statut:</h6>
                        </div>
                        <div className="col-md-6">
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

            {/* Statistiques */}
            <div className="row mb-4">
                <div className="col-md-3">
                    <div className="card text-white bg-primary">
                        <div className="card-body text-center">
                            <h4>{loanRequests.length}</h4>
                            <small>Total demandes</small>
                        </div>
                    </div>
                </div>
                <div className="col-md-3">
                    <div className="card text-white bg-warning">
                        <div className="card-body text-center">
                            <h4>{loanRequests.filter(r => r.status === 'PENDING').length}</h4>
                            <small>En attente</small>
                        </div>
                    </div>
                </div>
                <div className="col-md-3">
                    <div className="card text-white bg-info">
                        <div className="card-body text-center">
                            <h4>{loanRequests.filter(r => r.status === 'IN_REVIEW').length}</h4>
                            <small>En examen</small>
                        </div>
                    </div>
                </div>
                <div className="col-md-3">
                    <div className="card text-white bg-success">
                        <div className="card-body text-center">
                            <h4>{loanRequests.filter(r => r.status === 'APPROVED').length}</h4>
                            <small>Approuvées</small>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tableau des demandes */}
            {filteredRequests.length === 0 ? (
                <div className="alert alert-info text-center">
                    <h5>📭 Aucune demande trouvée</h5>
                    <p className="mb-0">Aucune demande de prêt ne correspond aux critères sélectionnés.</p>
                </div>
            ) : (
                <div className="card">
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
                                        <th>Validations</th>
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
                                                    {new Intl.NumberFormat('fr-FR', {
                                                        style: 'currency',
                                                        currency: 'XOF'
                                                    }).format(request.requestAmount)}
                                                </strong>
                                            </td>
                                            <td>{request.duration} mois</td>
                                            <td>
                                                <div style={{ maxWidth: '200px' }}>
                                                    <small>{request.reason}</small>
                                                </div>
                                            </td>
                                            <td>
                                                {new Date(request.requestDate).toLocaleDateString('fr-FR')}
                                            </td>
                                            <td>
                                                {getStatusBadge(request.status)}
                                                <br />
                                                <small className="text-muted">
                                                    {getApprovalProgress(request)}
                                                </small>
                                            </td>
                                            <td>
                                                <div className="small">
                                                    <div>Président: {getApprovalBadge(request.presidentApproved)}</div>
                                                    <div>Secrétaire: {getApprovalBadge(request.secretaryApproved)}</div>
                                                    <div>Trésorier: {getApprovalBadge(request.treasurerApproved)}</div>
                                                </div>
                                            </td>
                                            <td>
                                                <div className="btn-group-vertical btn-group-sm">
                                                    {/* Boutons d'approbation */}
                                                    {canUserApproveRequest(request, 'PRESIDENT') && (
                                                        <button
                                                            className="btn btn-outline-success btn-sm mb-1"
                                                            onClick={() => handleApprove(request.id, 'PRESIDENT')}
                                                            disabled={actionLoading === request.id}
                                                            title="Approuver en tant que Président"
                                                        >
                                                            {actionLoading === request.id ? (
                                                                <span className="spinner-border spinner-border-sm" />
                                                            ) : (
                                                                '✅ Président'
                                                            )}
                                                        </button>
                                                    )}
                                                    
                                                    {canUserApproveRequest(request, 'SECRETARY') && (
                                                        <button
                                                            className="btn btn-outline-info btn-sm mb-1"
                                                            onClick={() => handleApprove(request.id, 'SECRETARY')}
                                                            disabled={actionLoading === request.id}
                                                            title="Approuver en tant que Secrétaire"
                                                        >
                                                            {actionLoading === request.id ? (
                                                                <span className="spinner-border spinner-border-sm" />
                                                            ) : (
                                                                '📝 Secrétaire'
                                                            )}
                                                        </button>
                                                    )}
                                                    
                                                    {canUserApproveRequest(request, 'TREASURER') && (
                                                        <button
                                                            className="btn btn-outline-warning btn-sm mb-1"
                                                            onClick={() => handleApprove(request.id, 'TREASURER')}
                                                            disabled={actionLoading === request.id}
                                                            title="Approuver en tant que Trésorier"
                                                        >
                                                            {actionLoading === request.id ? (
                                                                <span className="spinner-border spinner-border-sm" />
                                                            ) : (
                                                                '💰 Trésorier'
                                                            )}
                                                        </button>
                                                    )}
                                                    
                                                    {/* Bouton de rejet */}
                                                    {canReject && request.status !== 'REJECTED' && request.status !== 'APPROVED' && (
                                                        <button
                                                            className="btn btn-outline-danger btn-sm"
                                                            onClick={() => handleReject(request.id)}
                                                            disabled={actionLoading === request.id}
                                                            title="Rejeter la demande"
                                                        >
                                                            {actionLoading === request.id ? (
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

            {/* Légende */}
            <div className="mt-4">
                <div className="card">
                    <div className="card-body">
                        <h6>📋 Légende:</h6>
                        <div className="row">
                            <div className="col-md-4">
                                <strong>Président:</strong> Validation stratégique
                            </div>
                            <div className="col-md-4">
                                <strong>Secrétaire:</strong> Vérification administrative
                            </div>
                            <div className="col-md-4">
                                <strong>Trésorier:</strong> Analyse financière
                            </div>
                        </div>
                        <div className="mt-2 text-muted">
                            <small>
                                <strong>Note:</strong> Les 3 validations sont nécessaires pour l'approbation finale.
                            </small>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LoanApproval;