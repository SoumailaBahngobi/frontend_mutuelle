// src/components/MyLoans.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';

const MyLoans = () => {
    const [loans, setLoans] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchMyLoans();
    }, []);

    const fetchMyLoans = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get('http://localhost:8080/mut/loan', {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            // Filtrer seulement les prêts de l'utilisateur connecté
            const userLoans = response.data.filter(loan => 
                loan.member && loan.member.id === JSON.parse(localStorage.getItem('currentUser'))?.id
            );
            setLoans(userLoans);
        } catch (error) {
            console.error('Erreur:', error);
        } finally {
            setLoading(false);
        }
    };

    const calculateRemainingTime = (endDate) => {
        const end = new Date(endDate);
        const now = new Date();
        const diffTime = end - now;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays > 0 ? `${diffDays} jours` : 'Échu';
    };

    const getStatusBadge = (loan) => {
        if (loan.isRepaid) {
            return <span className="badge bg-success">Remboursé</span>;
        }
        
        const endDate = new Date(loan.endDate);
        const now = new Date();
        
        if (endDate < now) {
            return <span className="badge bg-danger">En retard</span>;
        }
        
        return <span className="badge bg-warning">En cours</span>;
    };

    if (loading) return <div className="container mt-4 text-center">Chargement...</div>;

    const activeLoans = loans.filter(loan => !loan.isRepaid);
    const repaidLoans = loans.filter(loan => loan.isRepaid);

    return (
        <div className="container mt-4">
            <h3 className="mb-4">💰 Mes Prêts</h3>

            {/* Prêts actifs */}
            <div className="card mb-4">
                <div className="card-header bg-warning text-white">
                    <h5 className="mb-0">⏳ Prêts en Cours ({activeLoans.length})</h5>
                </div>
                <div className="card-body">
                    {activeLoans.length === 0 ? (
                        <p className="text-muted mb-0">Aucun prêt en cours</p>
                    ) : (
                        <div className="table-responsive">
                            <table className="table table-striped">
                                <thead>
                                    <tr>
                                        <th>Montant</th>
                                        <th>À rembourser</th>
                                        <th>Durée</th>
                                        <th>Date fin</th>
                                        <th>Temps restant</th>
                                        <th>Statut</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {activeLoans.map(loan => (
                                        <tr key={loan.id}>
                                            <td>
                                                <strong>{loan.amount} FCFA</strong>
                                            </td>
                                            <td>
                                                {loan.repaymentAmount} FCFA
                                                <br/>
                                                <small className="text-muted">
                                                    (Intérêt: {loan.interestRate}%)
                                                </small>
                                            </td>
                                            <td>{loan.duration} mois</td>
                                            <td>{new Date(loan.endDate).toLocaleDateString()}</td>
                                            <td>
                                                <span className={
                                                    calculateRemainingTime(loan.endDate) === 'Échu' 
                                                        ? 'text-danger' 
                                                        : 'text-warning'
                                                }>
                                                    <strong>{calculateRemainingTime(loan.endDate)}</strong>
                                                </span>
                                            </td>
                                            <td>{getStatusBadge(loan)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* Prêts remboursés */}
            <div className="card">
                <div className="card-header bg-success text-white">
                    <h5 className="mb-0">✅ Prêts Remboursés ({repaidLoans.length})</h5>
                </div>
                <div className="card-body">
                    {repaidLoans.length === 0 ? (
                        <p className="text-muted mb-0">Aucun prêt remboursé</p>
                    ) : (
                        <div className="table-responsive">
                            <table className="table table-striped">
                                <thead>
                                    <tr>
                                        <th>Montant</th>
                                        <th>Montant remboursé</th>
                                        <th>Durée</th>
                                        <th>Date fin</th>
                                        <th>Statut</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {repaidLoans.map(loan => (
                                        <tr key={loan.id}>
                                            <td>{loan.amount} FCFA</td>
                                            <td>
                                                <strong>{loan.repaymentAmount} FCFA</strong>
                                            </td>
                                            <td>{loan.duration} mois</td>
                                            <td>{new Date(loan.endDate).toLocaleDateString()}</td>
                                            <td>{getStatusBadge(loan)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* Résumé financier */}
            <div className="row mt-4">
                <div className="col-md-4">
                    <div className="card text-white bg-info">
                        <div className="card-body text-center">
                            <h6>Total Emprunté</h6>
                            <h4>
                                {loans.reduce((sum, loan) => sum + parseFloat(loan.amount), 0)} FCFA
                            </h4>
                        </div>
                    </div>
                </div>
                <div className="col-md-4">
                    <div className="card text-white bg-warning">
                        <div className="card-body text-center">
                            <h6>Intérêts Payés</h6>
                            <h4>
                                {loans.reduce((sum, loan) => 
                                    sum + (parseFloat(loan.repaymentAmount) - parseFloat(loan.amount)), 0
                                )} FCFA
                            </h4>
                        </div>
                    </div>
                </div>
                <div className="col-md-4">
                    <div className="card text-white bg-success">
                        <div className="card-body text-center">
                            <h6>Prêts Clôturés</h6>
                            <h4>{repaidLoans.length}</h4>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MyLoans;