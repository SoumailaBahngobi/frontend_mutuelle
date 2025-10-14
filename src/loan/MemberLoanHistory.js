// src/components/MemberLoanHistory.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const MemberLoanHistory = () => {
    const [loanRequests, setLoanRequests] = useState([]);
    const [loans, setLoans] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        fetchMemberData();
    }, []);

    const fetchMemberData = async () => {
        try {
            const token = localStorage.getItem('token');
            
            // Récupérer mes demandes
            const requestsRes = await axios.get('http://localhost:8080/mut/loan_request/my-requests', {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            // Récupérer mes prêts
            const loansRes = await axios.get('http://localhost:8080/mut/loan', {
                headers: { Authorization: `Bearer ${token}` }
            });

            const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
            const userLoans = loansRes.data.filter(loan => 
                loan.member && loan.member.id === currentUser.id
            );

            setLoanRequests(requestsRes.data);
            setLoans(userLoans);
        } catch (error) {
            console.error('Erreur:', error);
        } finally {
            setLoading(false);
        }
    };

    const getStatusBadge = (status) => {
        const statusConfig = {
            PENDING: { class: 'bg-warning text-dark', label: '⏳ En attente' },
            IN_REVIEW: { class: 'bg-info text-white', label: '📋 En examen' },
            APPROVED: { class: 'bg-success text-white', label: '✅ Approuvé' },
            REJECTED: { class: 'bg-danger text-white', label: '❌ Rejeté' }
        };
        const config = statusConfig[status] || { class: 'bg-secondary', label: status };
        return <span className={`badge ${config.class}`}>{config.label}</span>;
    };

    const getLoanStatusBadge = (isRepaid) => {
        return isRepaid ? 
            <span className="badge bg-success">✅ Remboursé</span> : 
            <span className="badge bg-warning text-dark">🔄 En cours</span>;
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
                <h2>📊 Mon Historique Complet des Prêts</h2>
                <button 
                    className="btn btn-outline-secondary"
                    onClick={() => navigate('/dashboard')}
                >
                    ↩️ Retour
                </button>
            </div>

            {/* Mes demandes de prêt */}
            <div className="card mb-4">
                <div className="card-header bg-primary text-white">
                    <h5 className="mb-0">📄 Mes Demandes de Prêt</h5>
                </div>
                <div className="card-body">
                    {loanRequests.length === 0 ? (
                        <p className="text-muted">Aucune demande de prêt.</p>
                    ) : (
                        <div className="table-responsive">
                            <table className="table table-striped">
                                <thead>
                                    <tr>
                                        <th>Montant</th>
                                        <th>Motif</th>
                                        <th>Date</th>
                                        <th>Statut</th>
                                        <th>Progression</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loanRequests.map(request => (
                                        <tr key={request.id}>
                                            <td className="fw-bold text-primary">
                                                {new Intl.NumberFormat('fr-FR', {
                                                    style: 'currency',
                                                    currency: 'XOF'
                                                }).format(request.requestAmount)}
                                            </td>
                                            <td>{request.reason}</td>
                                            <td>{new Date(request.requestDate).toLocaleDateString()}</td>
                                            <td>{getStatusBadge(request.status)}</td>
                                            <td>
                                                <div className="progress" style={{ height: '15px' }}>
                                                    <div 
                                                        className="progress-bar" 
                                                        style={{ 
                                                            width: `${((request.presidentApproved + request.secretaryApproved + request.treasurerApproved) / 3) * 100}%` 
                                                        }}
                                                    ></div>
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

            {/* Mes prêts */}
            <div className="card">
                <div className="card-header bg-success text-white">
                    <h5 className="mb-0">💰 Mes Prêts</h5>
                </div>
                <div className="card-body">
                    {loans.length === 0 ? (
                        <p className="text-muted">Aucun prêt.</p>
                    ) : (
                        <div className="table-responsive">
                            <table className="table table-striped">
                                <thead>
                                    <tr>
                                        <th>Montant</th>
                                        <th>Date début</th>
                                        <th>Date fin</th>
                                        <th>À rembourser</th>
                                        <th>Statut</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loans.map(loan => (
                                        <tr key={loan.id}>
                                            <td className="fw-bold text-primary">
                                                {new Intl.NumberFormat('fr-FR', {
                                                    style: 'currency',
                                                    currency: 'XOF'
                                                }).format(loan.amount)}
                                            </td>
                                            <td>{new Date(loan.beginDate).toLocaleDateString()}</td>
                                            <td>{new Date(loan.endDate).toLocaleDateString()}</td>
                                            <td className="fw-bold">
                                                {new Intl.NumberFormat('fr-FR', {
                                                    style: 'currency',
                                                    currency: 'XOF'
                                                }).format(loan.repaymentAmount)}
                                            </td>
                                            <td>{getLoanStatusBadge(loan.isRepaid)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default MemberLoanHistory;