import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const MyLoanRequests = () => {
    const navigate = useNavigate();
    const [loanRequests, setLoanRequests] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchMyLoanRequests();
    }, []);

    const fetchMyLoanRequests = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get('http://localhost:8080/mut/loan_request/my-requests', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setLoanRequests(response.data);
        } catch (error) {
            console.error('Erreur:', error);
            alert('Erreur lors du chargement des demandes');
        } finally {
            setLoading(false);
        }
    };

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

    const getApprovalProgress = (request) => {
        const approvals = [request.presidentApproved, request.secretaryApproved, request.treasurerApproved];
        const approvedCount = approvals.filter(Boolean).length;
        return `${approvedCount}/3 validations`;
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
                <h2>📄 Mes Demandes de Prêt</h2>
                <div>
                    <button 
                        className="btn btn-primary me-2"
                        onClick={() => navigate('/loans/request')}
                    >
                       ➕ Nouvelle demande
                    </button>
                    <button 
                        className="btn btn-outline-secondary"
                        onClick={() => navigate('/dashboard')}
                    >
                        ↩️ Retour
                    </button>
                </div>
            </div>

            {loanRequests.length === 0 ? (
                <div className="alert alert-info text-center">
                    <h5>📭 Aucune demande de prêt</h5>
                    <p>Vous n'avez pas encore soumis de demande de prêt.</p>
                    <button 
                        className="btn btn-primary"
                        onClick={() => navigate('/loans/request')}
                    >
                        Faire une demande
                    </button>
                </div>
            ) : (
                <div className="row">
                    {loanRequests.map(request => (
                        <div key={request.id} className="col-md-6 mb-3">
                            <div className="card h-100">
                                <div className="card-header d-flex justify-content-between align-items-center">
                                    <strong>{request.requestAmount} FCFA</strong>
                                    {getStatusBadge(request.status)}
                                </div>
                                <div className="card-body">
                                    <p><strong>Durée:</strong> {request.duration} mois</p>
                                    <p><strong>Motif:</strong> {request.reason}</p>
                                    <p><strong>Date:</strong> {new Date(request.requestDate).toLocaleDateString()}</p>
                                    
                                    <div className="mt-3">
                                        <small className="text-muted">Progression de validation:</small>
                                        <div className="progress mb-2">
                                            <div 
                                                className="progress-bar" 
                                                style={{ 
                                                    width: `${(getApprovalProgress(request).split('/')[0] / 3) * 100}%` 
                                                }}
                                            >
                                                {getApprovalProgress(request)}
                                            </div>
                                        </div>
                                        <div className="small">
                                            <span>Président: {request.presidentApproved ? '✅' : '❌'}</span> | 
                                            <span> Secrétaire: {request.secretaryApproved ? '✅' : '❌'}</span> | 
                                            <span> Trésorier: {request.treasurerApproved ? '✅' : '❌'}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default MyLoanRequests;