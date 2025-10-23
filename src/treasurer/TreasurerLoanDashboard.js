import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';

const TreasurerLoanDashboard = () => {
    const [pendingGrants, setPendingGrants] = useState([]);
    const [grantedLoans, setGrantedLoans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [grantComment, setGrantComment] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        fetchTreasurerData();
    }, []);

    const fetchTreasurerData = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            
            // Récupérer les demandes approuvées en attente d'accord
            const pendingResponse = await axios.get(
                'http://localhost:8080/mut/loan_request/treasurer/pending-grant',
                { headers: { Authorization: `Bearer ${token}` } }
            );
            // Ensure we're setting an array
            setPendingGrants(Array.isArray(pendingResponse.data) ? pendingResponse.data : []);

            // Récupérer les prêts déjà accordés
            const grantedResponse = await axios.get(
                'http://localhost:8080/mut/loan_request/treasurer/granted-loans',
                { headers: { Authorization: `Bearer ${token}` } }
            );
            
            // Debug: log the response to see the actual structure
            console.log('Granted loans API response:', grantedResponse.data);
            console.log('Type of response:', typeof grantedResponse.data);
            console.log('Is array?', Array.isArray(grantedResponse.data));
            
            // Ensure we're setting an array, handle different response structures
            const grantedData = grantedResponse.data;
            if (Array.isArray(grantedData)) {
                setGrantedLoans(grantedData);
            } else if (grantedData && Array.isArray(grantedData.loans)) {
                setGrantedLoans(grantedData.loans);
            } else if (grantedData && grantedData.content && Array.isArray(grantedData.content)) {
                setGrantedLoans(grantedData.content);
            } else if (grantedData && grantedData.data && Array.isArray(grantedData.data)) {
                setGrantedLoans(grantedData.data);
            } else {
                console.warn('Unexpected granted loans response structure:', grantedData);
                setGrantedLoans([]);
            }

        } catch (error) {
            console.error('Erreur chargement données trésorier:', error);
            toast.error('Erreur lors du chargement des données');
            // Set empty arrays on error to prevent map errors
            setPendingGrants([]);
            setGrantedLoans([]);
        } finally {
            setLoading(false);
        }
    };

    const handleGrantLoan = async (loanRequestId) => {
        try {
            const token = localStorage.getItem('token');
            
            const response = await axios.post(
                `http://localhost:8080/mut/loan_request/${loanRequestId}/treasurer/grant`,
                { comment: grantComment },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            toast.success('✅ Prêt accordé avec succès !');
            setGrantComment('');
            setSelectedRequest(null);
            fetchTreasurerData();
            
        } catch (error) {
            console.error('Erreur accord prêt:', error);
            toast.error('Erreur lors de l\'accord du prêt: ' + (error.response?.data?.error || error.message));
        }
    };

    const handleCancelGrant = async (loanRequestId) => {
        const reason = prompt('Raison de l\'annulation:');
        if (!reason) return;

        try {
            const token = localStorage.getItem('token');
            
            await axios.post(
                `http://localhost:8080/mut/loan_request/${loanRequestId}/treasurer/cancel-grant`,
                { reason },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            toast.success('Accord de prêt annulé');
            fetchTreasurerData();
            
        } catch (error) {
            console.error('Erreur annulation:', error);
            toast.error('Erreur lors de l\'annulation: ' + (error.response?.data?.error || error.message));
        }
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

    if (loading) {
        return (
            <div className="container mt-4 d-flex justify-content-center align-items-center" style={{ minHeight: '60vh' }}>
                <div className="text-center">
                    <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Chargement...</span>
                    </div>
                    <p className="mt-2 text-muted">Chargement du tableau de bord trésorier...</p>
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
                                        <i className="fas fa-coins me-2 text-warning"></i>
                                        Tableau de Bord - Gestion des Prêts
                                    </h2>
                                    <p className="text-muted mb-0">
                                        Interface trésorier - Accord et gestion des prêts approuvés
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

            {/* Cartes de statistiques */}
            <div className="row mb-4">
                <div className="col-md-4 mb-3">
                    <div className="card border-warning">
                        <div className="card-body text-center">
                            <h3 className="text-warning">{pendingGrants.length}</h3>
                            <p className="mb-0 text-muted">En attente d'accord</p>
                        </div>
                    </div>
                </div>
                <div className="col-md-4 mb-3">
                    <div className="card border-success">
                        <div className="card-body text-center">
                            <h3 className="text-success">{grantedLoans && Array.isArray(grantedLoans) ? grantedLoans.length : 0}</h3>
                            <p className="mb-0 text-muted">Prêts accordés</p>
                        </div>
                    </div>
                </div>
                <div className="col-md-4 mb-3">
                    <div className="card border-primary">
                        <div className="card-body text-center">
                            <h3 className="text-primary">{pendingGrants.length + (grantedLoans && Array.isArray(grantedLoans) ? grantedLoans.length : 0)}</h3>
                            <p className="mb-0 text-muted">Total à gérer</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Demandes en attente d'accord */}
            <div className="row mb-4">
                <div className="col-12">
                    <div className="card shadow">
                        <div className="card-header bg-warning text-dark">
                            <h5 className="mb-0">
                                <i className="fas fa-clock me-2"></i>
                                Demandes Approuvées en Attente d'Accord ({pendingGrants.length})
                            </h5>
                        </div>
                        <div className="card-body">
                            {pendingGrants.length === 0 ? (
                                <div className="text-center py-4 text-muted">
                                    <i className="fas fa-check-circle fa-2x mb-3"></i>
                                    <p>Aucune demande en attente d'accord</p>
                                </div>
                            ) : (
                                <div className="table-responsive">
                                    <table className="table table-striped">
                                        <thead>
                                            <tr>
                                                <th>Membre</th>
                                                <th>Montant</th>
                                                <th>Durée</th>
                                                <th>Motif</th>
                                                <th>Date approbation</th>
                                                <th>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {pendingGrants.map(request => (
                                                <tr key={request.id}>
                                                    <td>
                                                        <strong>{request.member?.firstName} {request.member?.name}</strong>
                                                        <br />
                                                        <small className="text-muted">{request.member?.email}</small>
                                                    </td>
                                                    <td className="fw-bold text-primary">
                                                        {formatCurrency(request.requestAmount)}
                                                    </td>
                                                    <td>{request.duration} mois</td>
                                                    <td>{request.reason}</td>
                                                    <td>
                                                        {formatDate(request.treasurerApprovalDate)}
                                                    </td>
                                                    <td>
                                                        <div className="btn-group btn-group-sm">
                                                            <button
                                                                className="btn btn-outline-primary"
                                                                onClick={() => setSelectedRequest(request)}
                                                            >
                                                                <i className="fas fa-eye me-1"></i>
                                                                Détails
                                                            </button>
                                                            <button
                                                                className="btn btn-success"
                                                                onClick={() => setSelectedRequest(request)}
                                                            >
                                                                <i className="fas fa-check me-1"></i>
                                                                Accorder
                                                            </button>
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

            {/* Prêts accordés */}
            <div className="row">
                <div className="col-12">
                    <div className="card shadow">
                        <div className="card-header bg-success text-white">
                            <h5 className="mb-0">
                                <i className="fas fa-hand-holding-usd me-2"></i>
                                Prêts Accordés ({grantedLoans && Array.isArray(grantedLoans) ? grantedLoans.length : 0})
                            </h5>
                        </div>
                        <div className="card-body">
                            {(!grantedLoans || !Array.isArray(grantedLoans)) ? (
                                <div className="text-center py-4 text-danger">
                                    <i className="fas fa-exclamation-triangle fa-2x mb-3"></i>
                                    <p>Erreur de chargement des données des prêts accordés</p>
                                    <button className="btn btn-primary mt-2" onClick={fetchTreasurerData}>
                                        <i className="fas fa-refresh me-2"></i>
                                        Réessayer
                                    </button>
                                </div>
                            ) : grantedLoans.length === 0 ? (
                                <div className="text-center py-4 text-muted">
                                    <i className="fas fa-money-bill-wave fa-2x mb-3"></i>
                                    <p>Aucun prêt accordé pour le moment</p>
                                </div>
                            ) : (
                                <div className="table-responsive">
                                    <table className="table table-striped">
                                        <thead>
                                            <tr>
                                                <th>Membre</th>
                                                <th>Montant prêt</th>
                                                <th>Montant à rembourser</th>
                                                <th>Date début</th>
                                                <th>Date fin</th>
                                                <th>Statut</th>
                                                <th>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {grantedLoans.map(loan => (
                                                <tr key={loan.id}>
                                                    <td>
                                                        <strong>{loan.member?.firstName} {loan.member?.name}</strong>
                                                    </td>
                                                    <td className="fw-bold text-primary">
                                                        {formatCurrency(loan.amount)}
                                                    </td>
                                                    <td className="fw-bold text-success">
                                                        {formatCurrency(loan.repaymentAmount)}
                                                    </td>
                                                    <td>{formatDate(loan.beginDate)}</td>
                                                    <td>{formatDate(loan.endDate)}</td>
                                                    <td>
                                                        {loan.isRepaid ? 
                                                            <span className="badge bg-success">Remboursé</span> : 
                                                            <span className="badge bg-warning">En cours</span>
                                                        }
                                                    </td>
                                                    <td>
                                                        <button
                                                            className="btn btn-outline-info btn-sm"
                                                            onClick={() => navigate(`/loans/details/${loan.id}`)}
                                                        >
                                                            <i className="fas fa-chart-line me-1"></i>
                                                            Suivi
                                                        </button>
                                                        <button
                                                            className="btn btn-outline-danger btn-sm ms-1"
                                                            onClick={() => handleCancelGrant(loan.id)}
                                                            title="Annuler l'accord"
                                                        >
                                                            <i className="fas fa-times me-1"></i>
                                                            Annuler
                                                        </button>
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

            {/* Modal d'accord de prêt */}
            {selectedRequest && (
                <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <div className="modal-dialog modal-lg">
                        <div className="modal-content">
                            <div className="modal-header bg-success text-white">
                                <h5 className="modal-title">
                                    <i className="fas fa-hand-holding-usd me-2"></i>
                                    Accorder le Prêt
                                </h5>
                                <button 
                                    type="button" 
                                    className="btn-close btn-close-white"
                                    onClick={() => {
                                        setSelectedRequest(null);
                                        setGrantComment('');
                                    }}
                                ></button>
                            </div>
                            <div className="modal-body">
                                <div className="row">
                                    <div className="col-md-6">
                                        <h6>Informations du membre</h6>
                                        <p><strong>Nom:</strong> {selectedRequest.member?.firstName} {selectedRequest.member?.name}</p>
                                        <p><strong>Email:</strong> {selectedRequest.member?.email}</p>
                                        <p><strong>Téléphone:</strong> {selectedRequest.member?.phone || 'Non renseigné'}</p>
                                    </div>
                                    <div className="col-md-6">
                                        <h6>Détails du prêt</h6>
                                        <p><strong>Montant:</strong> {formatCurrency(selectedRequest.requestAmount)}</p>
                                        <p><strong>Durée:</strong> {selectedRequest.duration} mois</p>
                                        <p><strong>Motif:</strong> {selectedRequest.reason}</p>
                                        <p><strong>Taux intérêt:</strong> {selectedRequest.interestRate}%</p>
                                    </div>
                                </div>

                                <div className="row mt-3">
                                    <div className="col-12">
                                        <h6>Calcul du remboursement</h6>
                                        <div className="alert alert-info">
                                            <strong>Montant à rembourser:</strong>{' '}
                                            {formatCurrency(
                                                selectedRequest.requestAmount + 
                                                (selectedRequest.requestAmount * selectedRequest.interestRate / 100)
                                            )}
                                            <br />
                                            <small>
                                                (Capital: {formatCurrency(selectedRequest.requestAmount)} + 
                                                Intérêts: {formatCurrency(selectedRequest.requestAmount * selectedRequest.interestRate / 100)})
                                            </small>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-3">
                                    <label className="form-label fw-bold">
                                        <i className="fas fa-comment me-1"></i>
                                        Commentaire (optionnel)
                                    </label>
                                    <textarea
                                        className="form-control"
                                        rows="3"
                                        value={grantComment}
                                        onChange={(e) => setGrantComment(e.target.value)}
                                        placeholder="Ajouter un commentaire pour cet accord de prêt..."
                                    />
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button
                                    type="button"
                                    className="btn btn-secondary"
                                    onClick={() => {
                                        setSelectedRequest(null);
                                        setGrantComment('');
                                    }}
                                >
                                    Annuler
                                </button>
                                <button
                                    type="button"
                                    className="btn btn-success"
                                    onClick={() => handleGrantLoan(selectedRequest.id)}
                                >
                                    <i className="fas fa-check me-2"></i>
                                    Confirmer l'accord du prêt
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TreasurerLoanDashboard;