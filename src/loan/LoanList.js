import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';

const LoanList = () => {
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
            const res = await axios.get('http://localhost:8081/mutuelle/member/profile', {
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
            
            const res = await axios.get('http://localhost:8081/mutuelle/loan_request/all-with-approval', {
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

    // ✅ NOUVELLES FONCTIONS : Calcul des montants totaux
    const getTotalAmount = () => {
        const requests = Array.isArray(loanRequests) ? loanRequests : [];
        return requests.reduce((total, request) => {
            return total + (request.requestAmount || 0);
        }, 0);
    };

    const getPendingAmount = () => {
        const requests = Array.isArray(loanRequests) ? loanRequests : [];
        return requests
            .filter(request => request.status === 'PENDING' || request.status === 'IN_REVIEW')
            .reduce((total, request) => {
                return total + (request.requestAmount || 0);
            }, 0);
    };

    const getApprovedAmount = () => {
        const requests = Array.isArray(loanRequests) ? loanRequests : [];
        return requests
            .filter(request => request.status === 'APPROVED')
            .reduce((total, request) => {
                return total + (request.requestAmount || 0);
            }, 0);
    };

    const getRejectedAmount = () => {
        const requests = Array.isArray(loanRequests) ? loanRequests : [];
        return requests
            .filter(request => request.status === 'REJECTED')
            .reduce((total, request) => {
                return total + (request.requestAmount || 0);
            }, 0);
    };

    const getPendingGrantAmount = () => {
        const requests = Array.isArray(loanRequests) ? loanRequests : [];
        return requests
            .filter(request => request.status === 'APPROVED' && !request.loanGranted)
            .reduce((total, request) => {
                return total + (request.requestAmount || 0);
            }, 0);
    };

    const getGrantedAmount = () => {
        const requests = Array.isArray(loanRequests) ? loanRequests : [];
        return requests
            .filter(request => request.loanGranted)
            .reduce((total, request) => {
                return total + (request.requestAmount || 0);
            }, 0);
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
            const endpoint = `http://localhost:8081/mutuelle/loan_request/${loanRequestId}/approve/${userRole.toLowerCase()}`;
            
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
            
            await axios.post(`http://localhost:8081/mutuelle/loan_request/${loanRequestId}/reject`, 
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
                                        Statistique des Prêts
                                    </h2>
                                    <p className="text-muted mb-0">
                                        Système de gestion de mutuelle de solidarité
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

            {/* ✅ NOUVELLE SECTION : Cartes de statistiques des montants */}
            <div className="row mb-4">
                <div className="col-12">
                    <div className="card shadow-sm">
                        <div className="card-header bg-white">
                            <h5 className="mb-0 text-primary">
                                <i className="fas fa-chart-bar me-2"></i>
                                Statistiques des Montants
                            </h5>
                        </div>
                        <div className="card-body">
                            <div className="row">
                                {/* Carte Montant Total */}
                                <div className="col-xl-2 col-md-4 mb-3">
                                    <div className="card border-primary h-100">
                                        <div className="card-body text-center py-3">
                                            <div className="bg-primary text-white rounded-circle mx-auto mb-2 d-flex align-items-center justify-content-center" 
                                                 style={{ width: '50px', height: '50px' }}>
                                                <i className="fas fa-money-bill-wave fa-lg"></i>
                                            </div>
                                            <h6 className="card-title text-primary mb-1">Total Prêts</h6>
                                            <h4 className="text-primary mb-1">{formatCurrency(getTotalAmount())}</h4>
                                            <small className="text-muted">{displayRequests.length} demandes</small>
                                        </div>
                                    </div>
                                </div>

                                {/* Carte Montant En Attente */}
                                <div className="col-xl-2 col-md-4 mb-3">
                                    <div className="card border-warning h-100">
                                        <div className="card-body text-center py-3">
                                            <div className="bg-warning text-dark rounded-circle mx-auto mb-2 d-flex align-items-center justify-content-center" 
                                                 style={{ width: '50px', height: '50px' }}>
                                                <i className="fas fa-clock fa-lg"></i>
                                            </div>
                                            <h6 className="card-title text-warning mb-1">En Attente</h6>
                                            <h4 className="text-warning mb-1">{formatCurrency(getPendingAmount())}</h4>
                                            <small className="text-muted">{getPendingCount() + getInReviewCount()} demandes</small>
                                        </div>
                                    </div>
                                </div>

                                {/* Carte Montant Approuvé */}
                                <div className="col-xl-2 col-md-4 mb-3">
                                    <div className="card border-success h-100">
                                        <div className="card-body text-center py-3">
                                            <div className="bg-success text-white rounded-circle mx-auto mb-2 d-flex align-items-center justify-content-center" 
                                                 style={{ width: '50px', height: '50px' }}>
                                                <i className="fas fa-check-circle fa-lg"></i>
                                            </div>
                                            <h6 className="card-title text-success mb-1">Approuvés</h6>
                                            <h4 className="text-success mb-1">{formatCurrency(getApprovedAmount())}</h4>
                                            <small className="text-muted">{getApprovedCount()} demandes</small>
                                        </div>
                                    </div>
                                </div>

                                {/* Carte Montant Rejeté */}
                                <div className="col-xl-2 col-md-4 mb-3">
                                    <div className="card border-danger h-100">
                                        <div className="card-body text-center py-3">
                                            <div className="bg-danger text-white rounded-circle mx-auto mb-2 d-flex align-items-center justify-content-center" 
                                                 style={{ width: '50px', height: '50px' }}>
                                                <i className="fas fa-times-circle fa-lg"></i>
                                            </div>
                                            <h6 className="card-title text-danger mb-1">Rejetés</h6>
                                            <h4 className="text-danger mb-1">{formatCurrency(getRejectedAmount())}</h4>
                                            <small className="text-muted">{getRejectedCount()} demandes</small>
                                        </div>
                                    </div>
                                </div>

                                {/* Carte À Accorder */}
                                <div className="col-xl-2 col-md-4 mb-3">
                                    <div className="card border-warning h-100">
                                        <div className="card-body text-center py-3">
                                            <div className="bg-warning text-dark rounded-circle mx-auto mb-2 d-flex align-items-center justify-content-center" 
                                                 style={{ width: '50px', height: '50px' }}>
                                                <i className="fas fa-hand-holding-usd fa-lg"></i>
                                            </div>
                                            <h6 className="card-title text-warning mb-1">À Accorder</h6>
                                            <h4 className="text-warning mb-1">{formatCurrency(getPendingGrantAmount())}</h4>
                                            <small className="text-muted">{getPendingGrantCount()} demandes</small>
                                        </div>
                                    </div>
                                </div>

                                {/* Carte Accordés */}
                                <div className="col-xl-2 col-md-4 mb-3">
                                    <div className="card border-info h-100">
                                        <div className="card-body text-center py-3">
                                            <div className="bg-info text-white rounded-circle mx-auto mb-2 d-flex align-items-center justify-content-center" 
                                                 style={{ width: '50px', height: '50px' }}>
                                                <i className="fas fa-file-contract fa-lg"></i>
                                            </div>
                                            <h6 className="card-title text-info mb-1">Accordés</h6>
                                            <h4 className="text-info mb-1">{formatCurrency(getGrantedAmount())}</h4>
                                            <small className="text-muted">
                                                {displayRequests.filter(req => req.loanGranted).length} prêts
                                            </small>
                                        </div>
                                    </div>
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
                    <div className="card shadow-sm">
                        <div className="card-body text-center">
                            <div className="d-flex justify-content-around align-items-center">
                                <div>
                                    <small className="text-muted d-block">Total demandes</small>
                                    <strong className="text-primary">{displayRequests.length}</strong>
                                </div>
                                
                            </div>
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

export default LoanList;
