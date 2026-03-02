import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';

const LoanRequestsValidator = () => {
    const [loanRequests, setLoanRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({});
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [approvalComment, setApprovalComment] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        fetchAllLoanRequests();
        fetchValidatorStats();
    }, []);

    const fetchAllLoanRequests = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get('http://localhost:8081/mutuelle/loan_request/all', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setLoanRequests(response.data);
        } catch (error) {
            toast.error('Erreur lors du chargement des demandes de prêt. Veuillez réessayer plus tard.', { autoClose: 7000 });   
        } finally {
            setLoading(false);
        }
    };

    const fetchValidatorStats = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get('http://localhost:8081/mutuelle/loan_request/validator-stats', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setStats(response.data);
        } catch (error) {
            toast.error('Erreur lors du chargement des statistiques. Veuillez réessayer plus tard.', { autoClose: 7000 });
        }
    };

    const getStatusBadge = (status) => {
        const statusConfig = {
            PENDING: { class: 'bg-warning text-dark', label: '⏳ En attente' },
            IN_REVIEW: { class: 'bg-info text-white', label: '📋 En examen' },
            APPROVED: { class: 'bg-success text-white', label: '✅ Approuvé' },
            REJECTED: { class: 'bg-danger text-white', label: '❌ Rejeté' }
        };
        const config = statusConfig[status] || { class: 'bg-secondary text-white', label: status };
        return <span className={`badge ${config.class}`}>{config.label}</span>;
    };

    const getApprovalProgress = (request) => {
        const approvals = [request.presidentApproved, request.secretaryApproved, request.treasurerApproved];
        const approvedCount = approvals.filter(Boolean).length;
        return `${approvedCount}/3`;
    };

    const getApprovalStatus = (request, role) => {
        switch (role) {
            case 'PRESIDENT':
                return request.presidentApproved ? '✅ Approuvé' : '❌ En attente';
            case 'SECRETARY':
                return request.secretaryApproved ? '✅ Approuvé' : '❌ En attente';
            case 'TREASURER':
                return request.treasurerApproved ? '✅ Approuvé' : '❌ En attente';
            default:
                return 'N/A';
        }
    };

    const handleApprove = async (requestId, role) => {
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
                `http://localhost:8081/mutuelle/loan_request/${requestId}/approve/${endpoint}`,
                { comment: approvalComment },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            toast.info('✅ Approbation en cours de traitement...', { autoClose: 3000 });

            if (response.status >= 200 && response.status < 300) {
                toast.success('Demande approuvée avec succès !', { autoClose: 5000 });
                setApprovalComment('');

                // Mettre à jour l'état local
                setLoanRequests((prev) => prev.map((r) => {
                    if (r.id === requestId) {
                        const updated = { ...r };
                        if (role === 'PRESIDENT') updated.presidentApproved = true;
                        if (role === 'SECRETARY') updated.secretaryApproved = true;
                        if (role === 'TREASURER') updated.treasurerApproved = true;

                        // Si tous ont approuvé, le prêt est automatiquement créé
                        if (updated.presidentApproved && updated.secretaryApproved && updated.treasurerApproved) {
                            updated.status = 'APPROVED';
                            updated.loanGranted = true;
                            toast.info('✅ Prêt accordé automatiquement !', { autoClose: 5000 });
                        } else if (updated.presidentApproved || updated.secretaryApproved || updated.treasurerApproved) {
                            updated.status = 'IN_REVIEW';
                        }
                        return updated;
                    }
                    return r;
                }));

                fetchAllLoanRequests();
                fetchValidatorStats();
                setSelectedRequest(null);
            }
        } catch (error) {
            toast.error('Erreur lors de l\'approbation. Veuillez réessayer.', { autoClose: 7000 });
            const status = error.response?.status;
            if (status === 401) {
                toast.error('Non authentifié. Veuillez vous reconnecter.');
                localStorage.removeItem('token');
                navigate('/login');
                return;
            }
            if (status === 403) {
                toast.error('Accès refusé. Vous n\'avez pas les droits pour approuver.');
                return;
            }
        }
    };

    const handleReject = async (requestId) => {
        const rejectionReason = prompt('Veuillez saisir la raison du rejet:');
        if (!rejectionReason) return;

        try {
            const token = localStorage.getItem('token');
            const response = await axios.post(
                `http://localhost:8080/mutuelle/loan_request/${requestId}/reject`,
                { 
                    rejectionReason: rejectionReason
                },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (response.status === 200) {
                toast.success('Demande rejetée avec succès !', { autoClose: 5000 });
                fetchAllLoanRequests();
                fetchValidatorStats();
            }
        } catch (error) {
            toast.error('Erreur lors du rejet. Veuillez réessayer.', { autoClose: 7000 });
        }
    };

    // Ajouter une colonne pour montrer si le prêt a été accordé
    const isLoanGranted = (request) => {
        return request.loanGranted ? '✅ Accordé' : '❌ En attente';
    };

    if (loading) {
        return (
            <div className="container mt-4">
                <div className="d-flex justify-content-center">
                    <div className="spinner-border" role="status">
                        <span className="visually-hidden">Chargement...</span>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="container mt-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2>📋 Gestion des Demandes de Prêt</h2>
                <button 
                    className="btn btn-outline-secondary"
                    onClick={() => navigate('/dashboard')}
                >
                    ↩️ Retour au tableau de bord
                </button>
            </div>

            {/* Statistiques */}
            <div className="row mb-4">
                <div className="col-md-3">
                    <div className="card text-white bg-primary">
                        <div className="card-body">
                            <h5 className="card-title">Total</h5>
                            <h2>{stats.totalRequests || 0}</h2>
                        </div>
                    </div>
                </div>
                <div className="col-md-3">
                    <div className="card text-white bg-warning">
                        <div className="card-body">
                            <h5 className="card-title">En attente</h5>
                            <h2>{stats.pendingRequests || 0}</h2>
                        </div>
                    </div>
                </div>
                <div className="col-md-3">
                    <div className="card text-white bg-success">
                        <div className="card-body">
                            <h5 className="card-title">Approuvées</h5>
                            <h2>{stats.approvedRequests || 0}</h2>
                        </div>
                    </div>
                </div>
                <div className="col-md-3">
                    <div className="card text-white bg-danger">
                        <div className="card-body">
                            <h5 className="card-title">Rejetées</h5>
                            <h2>{stats.rejectedRequests || 0}</h2>
                        </div>
                    </div>
                </div>
            </div>

            {/* Liste des demandes */}
            <div className="card">
                <div className="card-header">
                    <h5 className="mb-0">📜 Liste des Demandes de Prêt</h5>
                </div>
                <div className="card-body">
                    {loanRequests.length === 0 ? (
                        <div className="alert alert-info text-center">
                            <h5>📭 Aucune demande de prêt</h5>
                            <p>Aucune demande de prêt n'a été soumise pour le moment.</p>
                        </div>
                    ) : (
                        <div className="table-responsive">
                            <table className="table table-striped">
                                <thead>
                                    <tr>
                                        <th>Membre</th>
                                        <th>Montant</th>
                                        <th>Raison</th>
                                        <th>Date</th>
                                        <th>Statut</th>
                                        <th>Progression</th>
                                        <th>Président</th>
                                        <th>Secrétaire</th>
                                        <th>Trésorier</th>
                                        <th>Prêt Accordé</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loanRequests.map(request => (
                                        <tr key={request.id}>
                                            <td>
                                                {request.member?.firstName} {request.member?.name}
                                            </td>
                                            <td>
                                                <strong>{request.requestAmount} FCFA</strong>
                                            </td>
                                            <td>{request.reason}</td>
                                            <td>
                                                {new Date(request.requestDate).toLocaleDateString()}
                                            </td>
                                            <td>{getStatusBadge(request.status)}</td>
                                            <td>
                                                <div className="progress" style={{ height: '20px' }}>
                                                    <div 
                                                        className="progress-bar" 
                                                        style={{ 
                                                            width: `${(getApprovalProgress(request).split('/')[0] / 3) * 100}%` 
                                                        }}
                                                    >
                                                        {getApprovalProgress(request)}
                                                    </div>
                                                </div>
                                            </td>
                                            <td>{getApprovalStatus(request, 'PRESIDENT')}</td>
                                            <td>{getApprovalStatus(request, 'SECRETARY')}</td>
                                            <td>{getApprovalStatus(request, 'TREASURER')}</td>
                                            <td>{isLoanGranted(request)}</td>
                                            <td>
                                                <div className="btn-group">
                                                    <button 
                                                        className="btn btn-sm btn-outline-primary"
                                                        onClick={() => setSelectedRequest(request)}
                                                    >
                                                        👁️ Détails
                                                    </button>
                                                    {request.status === 'PENDING' || request.status === 'IN_REVIEW' ? (
                                                        <>
                                                            <button 
                                                                className="btn btn-sm btn-outline-success"
                                                                onClick={() => handleApprove(request.id, 'PRESIDENT')}
                                                            >
                                                                ✅ Approuver
                                                            </button>
                                                            <button 
                                                                className="btn btn-sm btn-outline-danger"
                                                                onClick={() => handleReject(request.id)}
                                                            >
                                                                ❌ Rejeter
                                                            </button>
                                                        </>
                                                    ) : null}
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

            {/* Modal de détails */}
            {selectedRequest && (
                <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <div className="modal-dialog modal-lg">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">Détails de la demande</h5>
                                <button 
                                    type="button" 
                                    className="btn-close"
                                    onClick={() => setSelectedRequest(null)}
                                ></button>
                            </div>
                            <div className="modal-body">
                                <div className="row">
                                    <div className="col-md-6">
                                        <p><strong>Membre:</strong> {selectedRequest.member?.firstName} {selectedRequest.member?.name}</p>
                                        <p><strong>Email:</strong> {selectedRequest.member?.email}</p>
                                        <p><strong>Montant:</strong> {selectedRequest.requestAmount} FCFA</p>
                                        <p><strong>Durée:</strong> {selectedRequest.duration} mois</p>
                                    </div>
                                    <div className="col-md-6">
                                        <p><strong>Raison:</strong> {selectedRequest.reason}</p>
                                        <p><strong>Date demande:</strong> {new Date(selectedRequest.requestDate).toLocaleDateString()}</p>
                                        <p><strong>Statut:</strong> {getStatusBadge(selectedRequest.status)}</p>
                                        <p><strong>Prêt accordé:</strong> {isLoanGranted(selectedRequest)}</p>
                                    </div>
                                </div>
                                
                                <div className="mt-3">
                                    <h6>Progression d'approbation</h6>
                                    <div className="progress mb-2">
                                        <div 
                                            className="progress-bar" 
                                            style={{ 
                                                width: `${(getApprovalProgress(selectedRequest).split('/')[0] / 3) * 100}%` 
                                            }}
                                        >
                                            {getApprovalProgress(selectedRequest)}
                                        </div>
                                    </div>
                                    <div className="row text-center">
                                        <div className="col-md-4">
                                            <strong>Président:</strong><br />
                                            {selectedRequest.presidentApproved ? '✅ Approuvé' : '❌ En attente'}
                                        </div>
                                        <div className="col-md-4">
                                            <strong>Secrétaire:</strong><br />
                                            {selectedRequest.secretaryApproved ? '✅ Approuvé' : '❌ En attente'}
                                        </div>
                                        <div className="col-md-4">
                                            <strong>Trésorier:</strong><br />
                                            {selectedRequest.treasurerApproved ? '✅ Approuvé' : '❌ En attente'}
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-3">
                                    <label htmlFor="approvalComment" className="form-label">Commentaire (optionnel):</label>
                                    <textarea 
                                        id="approvalComment"
                                        className="form-control"
                                        value={approvalComment}
                                        onChange={(e) => setApprovalComment(e.target.value)}
                                        placeholder="Ajouter un commentaire..."
                                        rows="3"
                                    />
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button 
                                    type="button" 
                                    className="btn btn-secondary"
                                    onClick={() => setSelectedRequest(null)}
                                >
                                    Fermer
                                </button>
                                {(selectedRequest.status === 'PENDING' || selectedRequest.status === 'IN_REVIEW') && (
                                    <>
                                        <button 
                                            type="button" 
                                            className="btn btn-success"
                                            onClick={() => handleApprove(selectedRequest.id, 'PRESIDENT')}
                                        >
                                            ✅ Approuver
                                        </button>
                                        <button 
                                            type="button" 
                                            className="btn btn-danger"
                                            onClick={() => handleReject(selectedRequest.id)}
                                        >
                                            ❌ Rejeter
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LoanRequestsValidator;