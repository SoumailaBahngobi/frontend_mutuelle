// src/components/AllLoanRequests.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const AllLoanRequests = () => {
    const [loanRequests, setLoanRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('ALL');
    const navigate = useNavigate();

    useEffect(() => {
        fetchAllLoanRequests();
    }, []);

    const fetchAllLoanRequests = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get('http://localhost:8080/mut/loan_request/all-with-approval', {
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
            PENDING: { class: 'bg-warning text-dark', label: '⏳ En attente' },
            IN_REVIEW: { class: 'bg-info text-white', label: '📋 En examen' },
            APPROVED: { class: 'bg-success text-white', label: '✅ Approuvé' },
            REJECTED: { class: 'bg-danger text-white', label: '❌ Rejeté' }
        };
        const config = statusConfig[status] || { class: 'bg-secondary', label: status };
        return <span className={`badge ${config.class}`}>{config.label}</span>;
    };

    const getApprovalProgress = (request) => {
        const approvals = [request.presidentApproved, request.secretaryApproved, request.treasurerApproved];
        const approvedCount = approvals.filter(Boolean).length;
        return `${approvedCount}/3`;
    };

    const filteredRequests = loanRequests.filter(request => {
        if (filter === 'ALL') return true;
        return request.status === filter;
    });

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
                <h2>📋 Toutes les Demandes de Prêt</h2>
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
                    <div className="btn-group" role="group">
                        <button 
                            type="button" 
                            className={`btn ${filter === 'ALL' ? 'btn-primary' : 'btn-outline-primary'}`}
                            onClick={() => setFilter('ALL')}
                        >
                            Toutes ({loanRequests.length})
                        </button>
                        <button 
                            type="button" 
                            className={`btn ${filter === 'PENDING' ? 'btn-warning' : 'btn-outline-warning'}`}
                            onClick={() => setFilter('PENDING')}
                        >
                            En attente ({loanRequests.filter(r => r.status === 'PENDING').length})
                        </button>
                        <button 
                            type="button" 
                            className={`btn ${filter === 'IN_REVIEW' ? 'btn-info' : 'btn-outline-info'}`}
                            onClick={() => setFilter('IN_REVIEW')}
                        >
                            En examen ({loanRequests.filter(r => r.status === 'IN_REVIEW').length})
                        </button>
                        <button 
                            type="button" 
                            className={`btn ${filter === 'APPROVED' ? 'btn-success' : 'btn-outline-success'}`}
                            onClick={() => setFilter('APPROVED')}
                        >
                            Approuvées ({loanRequests.filter(r => r.status === 'APPROVED').length})
                        </button>
                        <button 
                            type="button" 
                            className={`btn ${filter === 'REJECTED' ? 'btn-danger' : 'btn-outline-danger'}`}
                            onClick={() => setFilter('REJECTED')}
                        >
                            Rejetées ({loanRequests.filter(r => r.status === 'REJECTED').length})
                        </button>
                    </div>
                </div>
            </div>

            {/* Tableau des demandes */}
            {filteredRequests.length === 0 ? (
                <div className="alert alert-info text-center">
                    <h5>📭 Aucune demande trouvée</h5>
                    <p>Aucune demande ne correspond aux critères sélectionnés.</p>
                </div>
            ) : (
                <div className="card">
                    <div className="card-body p-0">
                        <div className="table-responsive">
                            <table className="table table-striped table-hover mb-0">
                                <thead className="table-light">
                                    <tr>
                                        <th>Membre</th>
                                        <th>Montant</th>
                                        <th>Motif</th>
                                        <th>Date</th>
                                        <th>Statut</th>
                                        <th>Progression</th>
                                        <th>Président</th>
                                        <th>Secrétaire</th>
                                        <th>Trésorier</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredRequests.map(request => (
                                        <tr key={request.id}>
                                            <td>
                                                <div>
                                                    <strong>{request.member?.firstName} {request.member?.name}</strong>
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
                                            <td>
                                                <div style={{ maxWidth: '200px' }}>
                                                    <small>{request.reason}</small>
                                                </div>
                                            </td>
                                            <td>
                                                {new Date(request.requestDate).toLocaleDateString('fr-FR')}
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
                                            <td>
                                                {request.presidentApproved ? '✅' : '❌'}
                                            </td>
                                            <td>
                                                {request.secretaryApproved ? '✅' : '❌'}
                                            </td>
                                            <td>
                                                {request.treasurerApproved ? '✅' : '❌'}
                                            </td>
                                            <td>
                                                <button 
                                                    className="btn btn-sm btn-outline-primary"
                                                    onClick={() => navigate(`/loans/approval-list`)}
                                                >
                                                    👁️ Voir
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AllLoanRequests;