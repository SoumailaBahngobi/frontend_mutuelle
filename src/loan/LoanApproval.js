import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const LoanApproval = () => {
    const navigate = useNavigate();
    const [loanRequests, setLoanRequests] = useState([]);
    const [currentUser, setCurrentUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(null);
    const [filter, setFilter] = useState('ALL'); // ALL, PENDING, IN_REVIEW, APPROVED, REJECTED

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
            
            // Récupérer le profil utilisateur
            const profileResponse = await axios.get('http://localhost:8080/mut/member/profile', {
                headers: { Authorization: `Bearer ${token}` }
            });

            setLoanRequests(requestsResponse.data);
            setCurrentUser(profileResponse.data);
        } catch (error) {
            console.error('Erreur:', error);
            alert('Erreur lors du chargement des données');
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

            const response = await axios.post(
                `http://localhost:8080/mut/loan_request/${requestId}/approve/${endpoint}`, 
                {},
                { headers: { Authorization: `Bearer ${token}` } }
            );

            // Mettre à jour la liste
            const updatedRequests = loanRequests.map(req => 
                req.id === requestId ? response.data : req
            );
            setLoanRequests(updatedRequests);
            
            alert(`✅ Validation ${role.toLowerCase()} effectuée avec succès !`);
        } catch (error) {
            console.error('Erreur approbation:', error);
            alert(error.response?.data || 'Erreur lors de l\'approbation');
        } finally {
            setActionLoading(null);
        }
    };

    const handleReject = async (requestId) => {
        if (!window.confirm('Êtes-vous sûr de vouloir rejeter cette demande ? Cette action est irréversible.')) {
            return;
        }

        setActionLoading(requestId);
        try {
            const token = localStorage.getItem('token');
            await axios.post(
                `http://localhost:8080/mut/loan_request/${requestId}/reject`,
                {},
                { headers: { Authorization: `Bearer ${token}` } }
            );

            // Retirer la demande rejetée de la liste
            const updatedRequests = loanRequests.filter(req => req.id !== requestId);
            setLoanRequests(updatedRequests);
            
            alert('✅ Demande rejetée avec succès !');
        } catch (error) {
            console.error('Erreur rejet:', error);
            alert(error.response?.data || 'Erreur lors du rejet');
        } finally {
            setActionLoading(null);
        }
    };

    // Filtrer les demandes selon le statut
    const filteredRequests = loanRequests.filter(request => {
        if (filter === 'ALL') return true;
        return request.status === filter;
    });

    // Vérifier les permissions
    const canApproveAsPresident = currentUser?.role === 'PRESIDENT' || currentUser?.role === 'ADMIN';
    const canApproveAsSecretary = currentUser?.role === 'SECRETARY' || currentUser?.role === 'ADMIN';
    const canApproveAsTreasurer = currentUser?.role === 'TREASURER' || currentUser?.role === 'ADMIN';
    const canReject = currentUser?.role === 'PRESIDENT' || currentUser?.role === 'ADMIN';

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
        return approved ? '✅' : '❌';
    };

    if (loading) {
        return (
            <div className="container mt-4">
                <div className="d-flex justify-content-center">
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
                        Gérer les validations des demandes de prêt par le comité
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
                                                    <strong>{request.member?.name} {request.member?.firstName}</strong>
                                                    <br />
                                                    <small className="text-muted">{request.member?.email}</small>
                                                </div>
                                            </td>
                                            <td>
                                                <strong className="text-primary">{request.requestAmount} €</strong>
                                            </td>
                                            <td>{request.duration} mois</td>
                                            <td>
                                                <div style={{ maxWidth: '200px' }}>
                                                    <small>{request.reason}</small>
                                                </div>
                                            </td>
                                            <td>
                                                {new Date(request.requestDate).toLocaleDateString()}
                                            </td>
                                            <td>
                                                {getStatusBadge(request.status)}
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
                                                    {canApproveAsPresident && !request.presidentApproved && request.status !== 'REJECTED' && (
                                                        <button
                                                            className="btn btn-outline-success btn-sm mb-1"
                                                            onClick={() => handleApprove(request.id, 'PRESIDENT')}
                                                            disabled={actionLoading === request.id}
                                                            title="Approuver en tant que Président"
                                                        >
                                                            {actionLoading === request.id ? '...' : '✅ Président'}
                                                        </button>
                                                    )}
                                                    
                                                    {canApproveAsSecretary && !request.secretaryApproved && request.status !== 'REJECTED' && (
                                                        <button
                                                            className="btn btn-outline-info btn-sm mb-1"
                                                            onClick={() => handleApprove(request.id, 'SECRETARY')}
                                                            disabled={actionLoading === request.id}
                                                            title="Approuver en tant que Secrétaire"
                                                        >
                                                            {actionLoading === request.id ? '...' : '📝 Secrétaire'}
                                                        </button>
                                                    )}
                                                    
                                                    {canApproveAsTreasurer && !request.treasurerApproved && request.status !== 'REJECTED' && (
                                                        <button
                                                            className="btn btn-outline-warning btn-sm mb-1"
                                                            onClick={() => handleApprove(request.id, 'TREASURER')}
                                                            disabled={actionLoading === request.id}
                                                            title="Approuver en tant que Trésorier"
                                                        >
                                                            {actionLoading === request.id ? '...' : '💰 Trésorier'}
                                                        </button>
                                                    )}
                                                    
                                                    {/* Bouton de rejet */}
                                                    {canReject && request.status !== 'REJECTED' && (
                                                        <button
                                                            className="btn btn-outline-danger btn-sm"
                                                            onClick={() => handleReject(request.id)}
                                                            disabled={actionLoading === request.id}
                                                            title="Rejeter la demande"
                                                        >
                                                            {actionLoading === request.id ? '...' : '❌ Rejeter'}
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
                        <h6>📋 Légende des validations:</h6>
                        <div className="row">
                            <div className="col-md-4">
                                <strong>Président:</strong> Validation stratégique et approbation finale
                            </div>
                            <div className="col-md-4">
                                <strong>Secrétaire:</strong> Vérification administrative et documentation
                            </div>
                            <div className="col-md-4">
                                <strong>Trésorier:</strong> Analyse financière et capacité de remboursement
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LoanApproval;