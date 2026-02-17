// src/components/LoanHistory.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';

const LoanHistory = () => {
    const [loans, setLoans] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchLoans();
    }, []);

    const fetchLoans = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get('http://localhost:8080/mutuelle/loan', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setLoans(response.data);
        } catch (error) {
            console.error('Erreur:', error);
        } finally {
            setLoading(false);
        }
    };

    const getStatusBadge = (loan) => {
        if (loan.isRepaid) return <span className="badge bg-success">Remboursé</span>;
        return <span className="badge bg-warning">En cours</span>;
    };

    if (loading) return <div className="text-center">Chargement...</div>;

    return (
        <div className="container mt-4">
            <div className="card">
                <div className="card-header bg-info text-white">
                    <h4>📈 Historique des prêts</h4>
                </div>
                <div className="card-body">
                    <div className="table-responsive">
                        <table className="table table-striped">
                            <thead>
                                <tr>
                                    <th>Membre</th>
                                    <th>Montant</th>
                                    <th>Durée</th>
                                    <th>Date début</th>
                                    <th>Date fin</th>
                                    <th>À rembourser</th>
                                    <th>Statut</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loans.map(loan => (
                                    <tr key={loan.id}>
                                        <td>{loan.member?.firstName} {loan.member?.name}</td>
                                        <td>{loan.amount} FCFA</td>
                                        <td>{loan.duration} mois</td>
                                        <td>{new Date(loan.beginDate).toLocaleDateString()}</td>
                                        <td>{new Date(loan.endDate).toLocaleDateString()}</td>
                                        <td>
                                            <strong>{loan.repaymentAmount} FCFA</strong>
                                            <br/>
                                            <small className="text-muted">
                                                (Intérêt: {loan.interestRate}%)
                                            </small>
                                        </td>
                                        <td>{getStatusBadge(loan)}</td>
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

export default LoanHistory;