import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Toast } from 'bootstrap/dist/js/bootstrap.bundle.min';

const LoanApprovalDashboard = () => {
    const [loanRequests, setLoanRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [userRole, setUserRole] = useState('');

    useEffect(() => {
        fetchLoanRequests();
        fetchUserRole();
    }, []);

    const fetchLoanRequests = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get('http://localhost:8080/mut/loan-requests', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setLoanRequests(response.data);
        } catch (error) {
            console.error('Erreur:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchUserRole = async () => {
        // Récupérer le rôle de l'utilisateur connecté
        // À adapter selon votre système d'authentification
        const role = localStorage.getItem('userRole');
        setUserRole(role);
    };

    const handleApprove = async (loanId, roleType) => {
        try {
            const token = localStorage.getItem('token');
            let endpoint = '';
            
            switch(roleType) {
                case 'PRESIDENT':
                    endpoint = `http://localhost:8080/mut/loan-requests/${loanId}/approve/president`;
                    break;
                case 'SECRETARY':
                    endpoint = `http://localhost:8080/mut/loan-requests/${loanId}/approve/secretary`;
                    break;
                case 'TREASURER':
                    endpoint = `http://localhost:8080/mut/loan-requests/${loanId}/approve/treasurer`;
                    break;
            }

            await axios.put(endpoint, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            fetchLoanRequests(); // Rafraîchir la liste
            // alert('Demande approuvée avec succès !');
            Toast.success('Demande approuvée avec succès !', { delay: 3000 }).show();
        } catch (error) {
            console.error('Erreur:', error);
            // alert('Erreur lors de l\'approbation');
            Toast.error('Erreur lors de l\'approbation', { delay: 3000 }).show();
        }
    };

    const handleReject = async (loanId) => {
        try {
            const token = localStorage.getItem('token');
            await axios.put(`http://localhost:8080/mut/loan-requests/${loanId}/reject`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchLoanRequests();
            // alert('Demande rejetée !');
            Toast.success('Demande rejetée !', { delay: 3000 }).show(); 
        } catch (error) {
            console.error('Erreur:', error);
            // alert('Erreur lors du rejet');
            Toast.error('Erreur lors du rejet', { delay: 3000 }).show();

        }
    };

    const canApprove = (request, role) => {
        switch(role) {
            case 'PRESIDENT': return !request.presidentApproved;
            case 'SECRETARY': return !request.secretaryApproved;
            case 'TREASURER': return !request.treasurerApproved;
            default: return false;
        }
    };

    const getStatusBadge = (request) => {
        if (request.status === 'APPROVED') return <span className="badge bg-success">Approuvé</span>;
        if (request.status === 'REJECTED') return <span className="badge bg-danger">Rejeté</span>;
        if (request.isFullyApproved) return <span className="badge bg-success">Prêt créé</span>;
        return <span className="badge bg-warning">En attente</span>;
    };

    const getApprovalProgress = (request) => {
        const approvals = [request.presidentApproved, request.secretaryApproved, request.treasurerApproved];
        const approvedCount = approvals.filter(Boolean).length;
        return `${approvedCount}/3 approbations`;
    };

    if (loading) return <div className="text-center">Chargement...</div>;

    return (
        <div className="container mt-4">
            <div className="card">
                <div className="card-header bg-primary text-white">
                    <h4>📋 Tableau de bord d'approbation des prêts</h4>
                </div>
                <div className="card-body">
                    <div className="table-responsive">
                        <table className="table table-striped">
                            <thead>
                                <tr>
                                    <th>Membre</th>
                                    <th>Montant</th>
                                    <th>Durée</th>
                                    <th>Motif</th>
                                    <th>Statut</th>
                                    <th>Progression</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loanRequests.map(request => (
                                    <tr key={request.id}>
                                        <td>{request.member?.firstName} {request.member?.name}</td>
                                        <td>{request.requestAmount} FCFA</td>
                                        <td>{request.duration} mois</td>
                                        <td>{request.reason}</td>
                                        <td>{getStatusBadge(request)}</td>
                                        <td>
                                            <small>{getApprovalProgress(request)}</small>
                                            <div className="progress mt-1" style={{height: '5px'}}>
                                                <div 
                                                    className="progress-bar" 
                                                    style={{width: `${(getApprovalProgress(request).split('/')[0]/3)*100}%`}}
                                                />
                                            </div>
                                        </td>
                                        <td>
                                            <div className="btn-group btn-group-sm">
                                                {userRole === 'PRESIDENT' && canApprove(request, 'PRESIDENT') && (
                                                    <button 
                                                        className="btn btn-outline-success"
                                                        onClick={() => handleApprove(request.id, 'PRESIDENT')}
                                                    >
                                                        ✅ Président
                                                    </button>
                                                )}
                                                {userRole === 'SECRETARY' && canApprove(request, 'SECRETARY') && (
                                                    <button 
                                                        className="btn btn-outline-info"
                                                        onClick={() => handleApprove(request.id, 'SECRETARY')}
                                                    >
                                                        📝 Secrétaire
                                                    </button>
                                                )}
                                                {userRole === 'TREASURER' && canApprove(request, 'TREASURER') && (
                                                    <button 
                                                        className="btn btn-outline-warning"
                                                        onClick={() => handleApprove(request.id, 'TREASURER')}
                                                    >
                                                        💰 Trésorier
                                                    </button>
                                                )}
                                                {(userRole === 'ADMIN' || userRole === 'PRESIDENT') && (
                                                    <button 
                                                        className="btn btn-outline-danger"
                                                        onClick={() => handleReject(request.id)}
                                                    >
                                                        ❌ Rejeter
                                                    </button>
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
        </div>
    );
};

export default LoanApprovalDashboard;