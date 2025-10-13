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
            setLoading(true);
            const token = localStorage.getItem('token');
            const response = await axios.get('http://localhost:8080/mut/loan-requests/approved', {
                headers: { 
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            // Filtrer les prêts qui ne sont pas encore entièrement remboursés
            const activeLoans = response.data.filter(loan => 
                !loan.isRepaid && loan.status === 'APPROVED'
            );
            
            setActiveLoans(activeLoans);
        } catch (error) {
            console.error('Erreur lors du chargement des prêts:', error);
            setError('Erreur lors du chargement des prêts actifs');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!selectedLoan || !repaymentAmount) {
            setError('Veuillez remplir tous les champs');
            return;
        }

        const amount = parseFloat(repaymentAmount);
        if (amount <= 0) {
            setError('Le montant doit être supérieur à 0');
            return;
        }

        setLoading(true);
        setError('');
        setSuccess('');

        try {
            const token = localStorage.getItem('token');
            const repaymentData = {
                amount: amount,
                repaymentDate: new Date().toISOString().split('T')[0],
                status: 'PAID',
                loanRequest: { id: parseInt(selectedLoan) }
            };

            console.log('Données envoyées:', repaymentData);

            const response = await axios.post('http://localhost:8080/mut/repayment', repaymentData, {
                headers: { 
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            setSuccess('Remboursement enregistré avec succès !');
            setSelectedLoan('');
            setRepaymentAmount('');
            
            // Recharger la liste des prêts actifs
            setTimeout(() => {
                fetchActiveLoans();
            }, 1000);
            
        } catch (error) {
            console.error('Erreur détaillée:', error);
            const errorMessage = error.response?.data?.message 
                || error.response?.data 
                || error.message 
                || 'Erreur lors de l\'enregistrement du remboursement';
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const getSelectedLoanDetails = () => {
        return activeLoans.find(loan => loan.id === parseInt(selectedLoan));
    }

    const loanDetails = getSelectedLoanDetails();

    // Calculer le montant total à rembourser (capital + intérêts)
    const calculateTotalAmount = (loan) => {
        if (!loan || !loan.requestAmount || !loan.interestRate) return 0;
        
        const principal = parseFloat(loan.requestAmount);
        const interestRate = parseFloat(loan.interestRate) / 100;
        const total = principal + (principal * interestRate);
        
        return total.toFixed(2);
    };

    // Calculer le montant restant (vous devrez adapter cette logique)
    const calculateRemainingAmount = (loan) => {
        if (!loan) return 0;
        
        // Si vous avez un système pour suivre les remboursements déjà effectués
        // Vous devrez peut-être appeler une API pour obtenir le montant déjà remboursé
        const totalAmount = parseFloat(calculateTotalAmount(loan));
        
        // Pour l'instant, on retourne le montant total si le prêt n'est pas marqué comme remboursé
        return loan.isRepaid ? 0 : totalAmount;
    };

    // Formater les dates
    const formatDate = (dateString) => {
        if (!dateString) return 'Non définie';
        try {
            return new Date(dateString).toLocaleDateString('fr-FR');
        } catch (error) {
            return 'Date invalide';
        }
    };

    return (
        <div className="container mt-4">
            <div className="row justify-content-center">
                <div className="col-md-8">
                    <div className="card">
                        <div className="card-header bg-primary text-white">
                            <h3 className="card-title mb-0">
                                <i className="fas fa-money-bill-wave me-2"></i>
                                Enregistrer un Remboursement
                            </h3>
                        </div>
                        <div className="card-body">
                            {error && (
                                <div className="alert alert-danger d-flex align-items-center">
                                    <i className="fas fa-exclamation-triangle me-2"></i>
                                    {error}
                                </div>
                            )}
                            {success && (
                                <div className="alert alert-success d-flex align-items-center">
                                    <i className="fas fa-check-circle me-2"></i>
                                    {success}
                                </div>
                            )}

                            {loading && activeLoans.length === 0 ? (
                                <div className="text-center">
                                    <div className="spinner-border text-primary" role="status">
                                        <span className="visually-hidden">Chargement...</span>
                                    </div>
                                    <p className="mt-2">Chargement des prêts actifs...</p>
                                </div>
                            ) : activeLoans.length === 0 ? (
                                <div className="alert alert-warning">
                                    <i className="fas fa-exclamation-circle me-2"></i>
                                    Aucun prêt approuvé et actif disponible pour le remboursement.
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
                                            onChange={(e) => {
                                                setSelectedLoan(e.target.value);
                                                setRepaymentAmount(''); // Réinitialiser le montant
                                            }}
                                            required
                                        >
                                            <option value="">Choisir un prêt...</option>
                                            {activeLoans.map(loan => (
                                                <option key={loan.id} value={loan.id}>
                                                    {loan.member?.name || 'N/A'} {loan.member?.firstName || ''} - 
                                                    Montant: {loan.requestAmount?.toFixed(2) || '0.00'}€ - 
                                                    Durée: {loan.duration} mois
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    {selectedLoan && loanDetails && (
                                        <div className="mb-4">
                                            <div className="card border-primary">
                                                <div className="card-header bg-primary text-white">
                                                    <strong>
                                                        <i className="fas fa-info-circle me-2"></i>
                                                        Détails du prêt sélectionné
                                                    </strong>
                                                </div>
                                                <div className="card-body">
                                                    <div className="row">
                                                        <div className="col-md-6">
                                                            <strong>Membre:</strong><br/>
                                                            {loanDetails.member?.name || 'N/A'} {loanDetails.member?.firstName || ''}
                                                        </div>
                                                        <div className="col-md-6">
                                                            <strong>Montant demandé:</strong><br/>
                                                            {loanDetails.requestAmount?.toFixed(2) || '0.00'} €
                                                        </div>
                                                    </div>
                                                    <hr/>
                                                    <div className="row">
                                                        <div className="col-md-6">
                                                            <strong>Montant total à rembourser:</strong><br/>
                                                            <span className="text-success fw-bold">
                                                                {calculateTotalAmount(loanDetails)} €
                                                            </span>
                                                        </div>
                                                        <div className="col-md-6">
                                                            <strong>Date de demande:</strong><br/>
                                                            {formatDate(loanDetails.requestDate)}
                                                        </div>
                                                    </div>
                                                    <hr/>
                                                    <div className="row">
                                                        <div className="col-md-6">
                                                            <strong>Durée:</strong><br/>
                                                            {loanDetails.duration} mois
                                                        </div>
                                                        <div className="col-md-6">
                                                            <strong>Taux d'intérêt:</strong><br/>
                                                            {loanDetails.interestRate?.toFixed(1) || '0.0'}%
                                                        </div>
                                                    </div>
                                                    <hr/>
                                                    <div className="row">
                                                        <div className="col-md-6">
                                                            <strong>Statut:</strong><br/>
                                                            <span className={`badge ${
                                                                loanDetails.status === 'APPROVED' ? 'bg-success' : 
                                                                loanDetails.status === 'PENDING' ? 'bg-warning' : 'bg-secondary'
                                                            }`}>
                                                                {loanDetails.status || 'N/A'}
                                                            </span>
                                                        </div>
                                                        <div className="col-md-6">
                                                            <strong>Remboursé:</strong><br/>
                                                            <span className={`badge ${
                                                                loanDetails.isRepaid ? 'bg-success' : 'bg-warning'
                                                            }`}>
                                                                {loanDetails.isRepaid ? 'Oui' : 'Non'}
                                                            </span>
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
                                            min="0.01"
                                            step="0.01"
                                            required
                                            placeholder="Ex: 500.50"
                                            disabled={!selectedLoan}
                                        />
                                        <div className="form-text">
                                            Entrez le montant du remboursement effectué
                                        </div>
                                        {selectedLoan && loanDetails && (
                                            <div className="form-text text-info">
                                                Montant total du prêt: {calculateTotalAmount(loanDetails)} €
                                            </div>
                                        )}
                                    </div>

                                    <div className="mb-3">
                                        <div className="card border-secondary">
                                            <div className="card-body">
                                                <h6 className="card-title">
                                                    <i className="fas fa-calendar-alt me-2"></i>
                                                    Informations
                                                </h6>
                                                <ul className="small mb-0">
                                                    <li>Date du remboursement: <strong>{new Date().toLocaleDateString('fr-FR')}</strong></li>
                                                    <li>Statut: <span className="badge bg-success">PAID</span></li>
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
                                            disabled={loading}
                                        >
                                            <i className="fas fa-arrow-left me-2"></i>
                                            Retour
                                        </button>
                                        <button
                                            type="submit"
                                            className="btn btn-primary"
                                            disabled={loading || !selectedLoan || !repaymentAmount}
                                        >
                                            {loading ? (
                                                <>
                                                    <span className="spinner-border spinner-border-sm me-2" />
                                                    Enregistrement...
                                                </>
                                            ) : (
                                                <>
                                                    <i className="fas fa-save me-2"></i>
                                                    Enregistrer le remboursement
                                                </>
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