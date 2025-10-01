import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const AddRepayment = () => {
    const navigate = useNavigate();
    const [activeLoans, setActiveLoans] = useState([]);
    const [selectedLoan, setSelectedLoan] = useState('');
    const [repaymentAmount, setRepaymentAmount] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        fetchActiveLoans();
    }, []);

    const fetchActiveLoans = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get('http://localhost:8080/mut/loan/active', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setActiveLoans(response.data);
        } catch (error) {
            setError('Erreur lors du chargement des prêts actifs');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!selectedLoan || !repaymentAmount) {
            setError('Veuillez remplir tous les champs');
            return;
        }

        setLoading(true);
        setError('');
        setSuccess('');

        try {
            const token = localStorage.getItem('token');
            const repaymentData = {
                amount: parseFloat(repaymentAmount),
                repaymentDate: new Date().toISOString().split('T')[0],
                status: 'COMPLETED',
                loan: { id: parseInt(selectedLoan) }
            };

            await axios.post('http://localhost:8080/mut/repayment', repaymentData, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setSuccess('Remboursement enregistré avec succès !');
            setSelectedLoan('');
            setRepaymentAmount('');
            
            // Recharger la liste des prêts actifs
            fetchActiveLoans();
            
        } catch (error) {
            setError(error.response?.data || 'Erreur lors de l\'enregistrement du remboursement');
        } finally {
            setLoading(false);
        }
    };

   
    const getSelectedLoanDetails = () => {
        return activeLoans.find(loan => loan.id === parseInt(selectedLoan));
    }

    const loanDetails = getSelectedLoanDetails();

    return (
        <div className="container mt-4">
            <div className="row justify-content-center">
                <div className="col-md-8">
                    <div className="card">
                        <div className="card-header bg-info text-white">
                            <h3 className="card-title mb-0">💳 Enregistrer un Remboursement</h3>
                        </div>
                        <div className="card-body">
                            {error && <div className="alert alert-danger">{error}</div>}
                            {success && <div className="alert alert-success">{success}</div>}

                            {activeLoans.length === 0 ? (
                                <div className="alert alert-warning">
                                    Aucun prêt actif disponible pour le remboursement.
                                </div>
                            ) : (
                                <form onSubmit={handleSubmit}>
                                    <div className="mb-3">
                                        <label className="form-label">
                                            <strong>Sélectionner un prêt *</strong>
                                        </label>
                                        <select
                                            className="form-select"
                                            value={selectedLoan}
                                            onChange={(e) => setSelectedLoan(e.target.value)}
                                            required
                                        >
                                            <option value="">Choisir un prêt...</option>
                                            {activeLoans.map(loan => (
                                                <option key={loan.id} value={loan.id}>
                                                    {loan.member.name} {loan.member.firstName} - 
                                                    {loan.amount}€ - 
                                                    Reste: {(loan.repaymentAmount - loan.amountPaid || 0).toFixed(2)}€
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    {selectedLoan && loanDetails && (
                                        <div className="mb-4">
                                            <div className="card border-info">
                                                <div className="card-header bg-info text-white">
                                                    <strong>Détails du prêt sélectionné</strong>
                                                </div>
                                                <div className="card-body">
                                                    <div className="row">
                                                        <div className="col-md-6">
                                                            <strong>Membre:</strong><br/>
                                                            {loanDetails.member.name} {loanDetails.member.firstName}
                                                        </div>
                                                        <div className="col-md-6">
                                                            <strong>Montant initial:</strong><br/>
                                                            {loanDetails.amount} €
                                                        </div>
                                                    </div>
                                                    <hr/>
                                                    <div className="row">
                                                        <div className="col-md-6">
                                                            <strong>Montant à rembourser:</strong><br/>
                                                            <span className="text-success fw-bold">
                                                                {loanDetails.repaymentAmount} €
                                                            </span>
                                                        </div>
                                                        <div className="col-md-6">
                                                            <strong>Date de début:</strong><br/>
                                                            {new Date(loanDetails.beginDate).toLocaleDateString()}
                                                        </div>
                                                    </div>
                                                    <hr/>
                                                    <div className="row">
                                                        <div className="col-md-6">
                                                            <strong>Date de fin:</strong><br/>
                                                            {new Date(loanDetails.endDate).toLocaleDateString()}
                                                        </div>
                                                        <div className="col-md-6">
                                                            <strong>Taux d'intérêt:</strong><br/>
                                                            {loanDetails.interestRate}%
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    <div className="mb-3">
                                        <label className="form-label">
                                            <strong>Montant du remboursement (€) *</strong>
                                        </label>
                                        <input
                                            type="number"
                                            className="form-control"
                                            value={repaymentAmount}
                                            onChange={(e) => setRepaymentAmount(e.target.value)}
                                            min="1"
                                            step="0.01"
                                            required
                                            placeholder="Ex: 500.50"
                                        />
                                        <div className="form-text">
                                            Entrez le montant du remboursement effectué
                                        </div>
                                    </div>

                                    <div className="mb-3">
                                        <div className="card border-secondary">
                                            <div className="card-body">
                                                <h6 className="card-title">📅 Informations</h6>
                                                <ul className="small mb-0">
                                                    <li>Date du remboursement: <strong>{new Date().toLocaleDateString()}</strong></li>
                                                    <li>Statut: <span className="badge bg-success">COMPLETED</span></li>
                                                    <li>Le remboursement sera enregistré immédiatement</li>
                                                </ul>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="d-grid gap-2 d-md-flex justify-content-md-end">
                                        <button
                                            type="button"
                                            className="btn btn-secondary me-md-2"
                                            onClick={() => navigate('/dashboard')}
                                        >
                                            Annuler
                                        </button>
                                        <button
                                            type="submit"
                                            className="btn btn-info text-white"
                                            disabled={loading}
                                        >
                                            {loading ? (
                                                <>
                                                    <span className="spinner-border spinner-border-sm me-2" />
                                                    Enregistrement...
                                                </>
                                            ) : (
                                                'Enregistrer le remboursement'
                                            )}
                                        </button>
                                    </div>
                                </form>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AddRepayment;