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
            
            // ✅ CORRECTION : S'assurer que loanRequests est toujours un tableau
            const data = res.data;
            console.log('📊 Données reçues:', data);
            
            if (Array.isArray(data)) {
                setLoanRequests(data);
            } else if (data && typeof data === 'object') {
                // Si c'est un objet unique, le mettre dans un tableau
                setLoanRequests([data]);
            } else {
                // Si null, undefined ou autre type, utiliser un tableau vide
                console.warn('Réponse inattendue du serveur:', data);
                setLoanRequests([]);
            }
            
        } catch (err) {
            console.error('Erreur chargement demandes:', err);
            setError('Impossible de charger les demandes de prêt');
            setLoanRequests([]); // ✅ S'assurer que c'est un tableau même en cas d'erreur
        } finally {
            setLoading(false);
        }
    };

    // ✅ CORRECTION : Toujours s'assurer que loanRequests est un tableau avant filter
    const getFilteredRequests = () => {
        const requests = Array.isArray(loanRequests) ? loanRequests : [];
        
        if (filter === 'all') return requests;
        if (filter === 'pending_grant') {
            return requests.filter(request => request.status === 'APPROVED' && !request.loanGranted);
        }
        return requests.filter(request => request.status === filter.toUpperCase());
    };

    // ✅ CORRECTION : Fonctions de statistiques sécurisées
    const getPendingCount = () => {
        const requests = Array.isArray(loanRequests) ? loanRequests : [];
        return requests.filter(request => request.status === 'PENDING').length;
    };

    const getInReviewCount = () => {
        const requests = Array.isArray(loanRequests) ? loanRequests : [];
        return requests.filter(request => request.status === 'IN_REVIEW').length;
    };

    const getApprovedCount = () => {
        const requests = Array.isArray(loanRequests) ? loanRequests : [];
        return requests.filter(request => request.status === 'APPROVED').length;
    };

    const getRejectedCount = () => {
        const requests = Array.isArray(loanRequests) ? loanRequests : [];
        return requests.filter(request => request.status === 'REJECTED').length;
    };

    const getPendingGrantCount = () => {
        const requests = Array.isArray(loanRequests) ? loanRequests : [];
        return requests.filter(request => request.status === 'APPROVED' && !request.loanGranted).length;
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

    // ✅ NOUVELLE FONCTION : Badge pour l'accord du prêt
    const getLoanGrantBadge = (loanRequest) => {
        if (loanRequest.loanGranted) {
            return <span className="badge bg-success">💰 Prêt accordé</span>;
        } else if (loanRequest.status === 'APPROVED') {
            return <span className="badge bg-warning">⏳ En attente d'accord</span>;
        } else {
            return <span className="badge bg-secondary">📝 En validation</span>;
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

            if (userRole === 'TREASURER') {
                toast.success('✅ Demande approuvée ! Le prêt est maintenant prêt à être accordé.');
            } else {
                toast.success('✅ Demande approuvée ! En attente des autres validations.');
            }
            
            fetchLoanRequests();
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

    // ✅ NOUVELLE FONCTION : Rediriger vers l'accord du trésorier
    const handleTreasurerGrant = (request) => {
        if (userRole === 'TREASURER') {
            navigate('/treasurer/loans');
        } else {
            toast.info('Seul le trésorier peut accorder les prêts');
        }
    };

    // ✅ NOUVELLE FONCTION : Voir les détails de l'accord
    const handleViewGrantDetails = (request) => {
        if (request.loanGranted) {
            navigate('/loans/list');
        } else if (request.status === 'APPROVED') {
            toast.info('Ce prêt est approuvé et en attente d\'accord par le trésorier');
        }
    };

    // ✅ CORRECTION : Utiliser un tableau sécurisé pour l'affichage
    const displayRequests = Array.isArray(loanRequests) ? loanRequests : [];
    const filteredRequests = getFilteredRequests();

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
                                        Gestion et suivi des approbations de prêt - Système d'accord par le trésorier
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
                                    Toutes ({displayRequests.length})
                                </button>
                                <button
                                    type="button"
                                    className={`btn ${filter === 'pending' ? 'btn-warning' : 'btn-outline-warning'}`}
                                    onClick={() => setFilter('pending')}
                                >
                                    En attente ({getPendingCount()})
                                </button>
                                <button
                                    type="button"
                                    className={`btn ${filter === 'in_review' ? 'btn-info' : 'btn-outline-info'}`}
                                    onClick={() => setFilter('in_review')}
                                >
                                    En examen ({getInReviewCount()})
                                </button>
                                <button
                                    type="button"
                                    className={`btn ${filter === 'approved' ? 'btn-success' : 'btn-outline-success'}`}
                                    onClick={() => setFilter('approved')}
                                >
                                    Approuvées ({getApprovedCount()})
                                </button>
                                <button
                                    type="button"
                                    className={`btn ${filter === 'pending_grant' ? 'btn-warning' : 'btn-outline-warning'}`}
                                    onClick={() => setFilter('pending_grant')}
                                >
                                    ⏳ À accorder ({getPendingGrantCount()})
                                </button>
                                <button
                                    type="button"
                                    className={`btn ${filter === 'rejected' ? 'btn-danger' : 'btn-outline-danger'}`}
                                    onClick={() => setFilter('rejected')}
                                >
                                    Rejetées ({getRejectedCount()})
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
                            {userRole === 'TREASURER' && (
                                <div className="mt-2">
                                    <button 
                                        className="btn btn-warning btn-sm"
                                        onClick={() => navigate('/treasurer/loans')}
                                    >
                                        <i className="fas fa-coins me-1"></i>
                                        Gestion des prêts
                                    </button>
                                </div>
                            )}
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
                                            : `Aucune demande avec le filtre "${filter}" n'a été trouvée.`
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
                                                <th>Accord Prêt</th>
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
                                                        {getLoanGrantBadge(request)}
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

                                                            {/* ✅ BOUTON POUR L'ACCORD DU TRÉSORIER */}
                                                            {request.status === 'APPROVED' && !request.loanGranted && userRole === 'TREASURER' && (
                                                                <button
                                                                    className="btn btn-outline-warning"
                                                                    onClick={() => handleTreasurerGrant(request)}
                                                                    title="Accorder le prêt"
                                                                >
                                                                    <i className="fas fa-hand-holding-usd"></i>
                                                                </button>
                                                            )}

                                                            {/* ✅ BOUTON POUR VOIR LE PRÊT ACCORDÉ */}
                                                            {request.loanGranted && (
                                                                <button
                                                                    className="btn btn-outline-success"
                                                                    onClick={() => handleViewGrantDetails(request)}
                                                                    title="Voir le prêt accordé"
                                                                >
                                                                    <i className="fas fa-file-contract"></i>
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
                                    <span className="badge bg-success me-2">💰 Prêt accordé</span>
                                    <small>Prêt accordé par le trésorier</small>
                                </div>
                                <div className="col-md-3">
                                    <span className="badge bg-warning me-2">⏳ En attente d'accord</span>
                                    <small>Approuvé, en attente d'accord</small>
                                </div>
                                <div className="col-md-3">
                                    <span className="badge bg-secondary me-2">📝 En validation</span>
                                    <small>En cours de validation</small>
                                </div>
                                <div className="col-md-3">
                                    <button className="btn btn-outline-warning btn-sm me-2">
                                        <i className="fas fa-hand-holding-usd"></i>
                                    </button>
                                    <small>Accorder le prêt (Trésorier)</small>
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