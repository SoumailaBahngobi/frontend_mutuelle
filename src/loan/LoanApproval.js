import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';

const LoanApproval = () => {
    const [loanRequests, setLoanRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [filter, setFilter] = useState('all');
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
            
            const res = await axios.get('http://localhost:8080/mut/loan_request/all-with-approval', {
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

    const getLoanCreationBadge = (loanRequest) => {
        if (loanRequest.loanCreated) {
            return <span className="badge bg-success">✅ Prêt créé</span>;
        } else if (loanRequest.status === 'APPROVED') {
            return <span className="badge bg-warning">🔄 Prêt en création...</span>;
        } else {
            return <span className="badge bg-secondary">⏳ En attente</span>;
        }
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
            
            const response = await axios.post(endpoint, 
                { comment: comment || '' },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            console.log('[LoanApproval] approve response:', response.status, response.data);

            toast.success('Demande approuvée avec succès! Le prêt sera créé automatiquement.');
            fetchLoanRequests(); // Rafraîchir la liste
        } catch (err) {
            console.error('Erreur approbation:', err);
            toast.error('Erreur lors de l\'approbation: ' + (err.response?.data?.message || err.message));
        }
    };

    const handleReject = async (loanRequestId) => {
        try {
            const token = localStorage.getItem('token');
            const reason = prompt('Raison du rejet:');
            
            if (!reason) {
                toast.warning('Veuillez saisir une raison de rejet');
                return;
            }
            
            await axios.post(`http://localhost:8080/mut/loan_request/${loanRequestId}/reject`, 
                { 
                    rejectionReason: reason,
                    rejectedByRole: userRole
                },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            
            toast.success('Demande rejetée avec succès!');
            fetchLoanRequests();
        } catch (err) {
            console.error('Erreur rejet:', err);
            toast.error('Erreur lors du rejet: ' + (err.response?.data?.message || err.message));
        }
    };

    // ✅ NOUVELLE FONCTION : Forcer la création du prêt
    const handleForceCreateLoan = async (loanRequestId) => {
        try {
            const token = localStorage.getItem('token');
            await axios.post(`http://localhost:8080/mut/loan_request/${loanRequestId}/force-create-loan`, 
                {},
                { headers: { Authorization: `Bearer ${token}` } }
            );
            
            toast.success('Prêt créé avec succès!');
            fetchLoanRequests();
        } catch (err) {
            console.error('Erreur création forcée:', err);
            toast.error('Erreur lors de la création du prêt: ' + (err.response?.data?.message || err.message));
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
                                        Gestion et suivi des approbations de prêt - Création automatique des prêts
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
                                                <th>Création Prêt</th>
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
                                                    <td>
                                                        {getLoanCreationBadge(request)}
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

                                                            {/* ✅ BOUTON POUR FORCER LA CRÉATION DU PRÊT */}
                                                            {request.status === 'APPROVED' && !request.loanCreated && (
                                                                <button
                                                                    className="btn btn-outline-warning"
                                                                    onClick={() => handleForceCreateLoan(request.id)}
                                                                    title="Forcer la création du prêt"
                                                                >
                                                                    <i className="fas fa-bolt"></i>
                                                                </button>
                                                            )}

                                                            {/* ✅ LIEN VERS LE PRÊT SI CRÉÉ */}
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
                            <h6 className="card-title">Légende:</h6>
                            <div className="row">
                                <div className="col-md-3">
                                    <span className="badge bg-success me-2">✅ Prêt créé</span>
                                    <small>Prêt créé automatiquement</small>
                                </div>
                                <div className="col-md-3">
                                    <span className="badge bg-warning me-2">🔄 Prêt en création...</span>
                                    <small>Approuvé, prêt en cours de création</small>
                                </div>
                                <div className="col-md-3">
                                    <span className="badge bg-secondary me-2">⏳ En attente</span>
                                    <small>En attente d'approbation</small>
                                </div>
                                <div className="col-md-3">
                                    <button className="btn btn-outline-warning btn-sm me-2">
                                        <i className="fas fa-bolt"></i>
                                    </button>
                                    <small>Forcer création prêt</small>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default LoanApproval;