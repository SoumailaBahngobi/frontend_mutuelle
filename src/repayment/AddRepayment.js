import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const AddRepayment = () => {
    const navigate = useNavigate();
    const [activeLoans, setActiveLoans] = useState([]);
    const [selectedLoan, setSelectedLoan] = useState('');
    const [repaymentAmount, setRepaymentAmount] = useState('');
    const [paymentMode, setPaymentMode] = useState('single'); // 'single' or 'installments'
    const [installments, setInstallments] = useState([]); // generated installments
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
            console.log('[fetchActiveLoans] token present?', !!token);
            if (token && process.env.NODE_ENV !== 'production') console.log('[fetchActiveLoans] token:', token.substring(0,20) + '...');
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
            const status = error.response?.status;
            const resp = error.response?.data;
            console.error('[fetchActiveLoans] response status:', status, 'data:', resp);
            // Erreur réseau (backend inaccessible)
            if (error.code === 'ERR_NETWORK' || (error.message && error.message.toLowerCase().includes('network error')) || (!error.response && error.request)) {
                setError('Impossible de joindre le serveur backend (http://localhost:8080). Vérifiez que le serveur est démarré.');
                return;
            }

            if (status === 401) {
                setError('Accès non autorisé (401) — reconnectez-vous.');
                localStorage.removeItem('token');
                localStorage.removeItem('currentUser');
                navigate('/login');
                return;
            }
            if (status === 403) {
                setError('Accès refusé (403) — vous n\'avez pas la permission d\'accéder à ces prêts.');
                return;
            }

            setError('Erreur lors du chargement des prêts actifs. Voir la console pour plus de détails.');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!selectedLoan) {
            setError('Veuillez sélectionner un prêt');
            return;
        }

        if (paymentMode === 'single' && !repaymentAmount) {
            setError('Veuillez renseigner le montant pour un paiement en une seule fois');
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
            if (paymentMode === 'single') {
                // Confirmation avant paiement unique
                const ok = window.confirm(`Confirmer le paiement unique de ${amount} € pour ce prêt ?`);
                if (!ok) {
                    setLoading(false);
                    return;
                }
                const repaymentData = {
                    amount: amount,
                    repaymentDate: new Date().toISOString().split('T')[0],
                    status: 'PAID',
                    loanRequest: { id: parseInt(selectedLoan) }
                };

                console.log('Données envoyées (single):', repaymentData);

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
            } else {
                setError('Utilisez le bouton de paiement sur une échéance pour les paiements échelonnés.');
            }
            
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

        const totalAmount = parseFloat(calculateTotalAmount(loan));
        // Somme des remboursements déjà effectués si fournie
        const totalRepaid = loan.repayments?.reduce((sum, r) => sum + (parseFloat(r.amount) || 0), 0) || 0;

        const remaining = totalAmount - totalRepaid;
        return remaining > 0 ? remaining.toFixed(2) : '0.00';
    };

    // Générer des échéances basées sur la durée restante du prêt
    const generateInstallments = (loan) => {
        if (!loan) return [];
        const remaining = parseFloat(calculateRemainingAmount(loan)) || 0;
        const months = parseInt(loan.duration) || 1;
        const per = +(remaining / months).toFixed(2);
        const arr = [];
        const today = new Date();
        for (let i = 0; i < months; i++) {
            const due = new Date(today.getFullYear(), today.getMonth() + i + 1, today.getDate());
            arr.push({
                index: i,
                dueDate: due.toISOString().split('T')[0],
                suggestedAmount: per,
                amount: per,
                paid: false
            });
        }
        return arr;
    };

    const handleGenerateInstallments = (loan) => {
        const inst = generateInstallments(loan);
        setInstallments(inst);
    };

    // Payer une échéance spécifique (paiement immédiat d'une tranche)
    const handlePayInstallment = async (index) => {
        const inst = installments[index];
        if (!inst) return;
        const amountToPay = parseFloat(inst.amount);
        if (!amountToPay || amountToPay <= 0) {
            setError('Le montant de l\'échéance doit être supérieur à 0');
            return;
        }
        // Confirmation avant paiement d'une échéance
        const ok = window.confirm(`Confirmer le paiement de l\'échéance #${index + 1} pour ${amountToPay} € ?`);
        if (!ok) return;
        setLoading(true);
        setError('');
        setSuccess('');
        try {
            const token = localStorage.getItem('token');
            const repaymentData = {
                amount: amountToPay,
                repaymentDate: new Date().toISOString().split('T')[0],
                status: 'PAID',
                loanRequest: { id: parseInt(selectedLoan) }
            };
            console.log('Paiement échéance:', repaymentData);
            const response = await axios.post('http://localhost:8080/mut/repayment', repaymentData, {
                headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
            });
            // Marquer échéance comme payée localement
            const updated = installments.map((it, idx) => idx === index ? { ...it, paid: true } : it);
            setInstallments(updated);
            setSuccess(`Échéance #${index + 1} payée (${amountToPay} €)`);
            // Recharger prêts
            setTimeout(() => fetchActiveLoans(), 1000);
        } catch (error) {
            console.error('Erreur paiement échéance:', error);
            const errorMessage = error.response?.data?.message || error.message || 'Erreur lors du paiement de l\'échéance';
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
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
                                                    Montant: {loan.requestAmount?.toFixed(2) || ''}FCFA - 
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
                                                            {loanDetails.requestAmount?.toFixed(2) || '0000'} FCFA
                                                        </div>
                                                    </div>
                                                    <hr/>
                                                    <div className="row">
                                                        <div className="col-md-6">
                                                            <strong>Montant total à rembourser:</strong><br/>
                                                            <span className="text-success fw-bold">
                                                                {calculateTotalAmount(loanDetails)} FCFA
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
                                                            {loanDetails.interestRate?.toFixed(1) || '00'}%
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
                                            <strong>Montant du remboursement FCFA</strong>
                                        </label>
                                        <input
                                            type="number"
                                            className="form-control"
                                            value={repaymentAmount}
                                            onChange={(e) => setRepaymentAmount(e.target.value)}
                                            min="500"
                                            step="500"
                                            required
                                            placeholder="Montant a rembourser"
                                            disabled={!selectedLoan}
                                        />
                                        <div className="form-text">
                                            Entrez le montant du remboursement effectué
                                        </div>
                                        {selectedLoan && loanDetails && (
                                            <div className="form-text text-info">
                                                Montant total du prêt: {calculateTotalAmount(loanDetails)} FCFA
                                            </div>
                                        )}
                                    </div>

                                    {selectedLoan && loanDetails && (
                                        <div className="mb-3">
                                            <label className="form-label"><strong>Mode de paiement</strong></label>
                                            <div>
                                                <div className="form-check form-check-inline">
                                                    <input className="form-check-input" type="radio" name="paymentMode" id="single" value="single" checked={paymentMode === 'single'} onChange={() => setPaymentMode('single')} />
                                                    <label className="form-check-label" htmlFor="single">En une fois</label>
                                                </div>
                                                <div className="form-check form-check-inline">
                                                    <input className="form-check-input" type="radio" name="paymentMode" id="installments" value="installments" checked={paymentMode === 'installments'} onChange={() => setPaymentMode('installments')} />
                                                    <label className="form-check-label" htmlFor="installments">Échelonné</label>
                                                </div>
                                            </div>

                                            {paymentMode === 'installments' && (
                                                <div className="mt-3">
                                                    <div className="d-flex justify-content-between align-items-center mb-2">
                                                        <strong>Échéances suggérées</strong>
                                                        <div>
                                                            <button type="button" className="btn btn-sm btn-outline-primary me-2" onClick={() => handleGenerateInstallments(loanDetails)}>Générer échéances</button>
                                                            <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => setInstallments([])}>Réinitialiser</button>
                                                        </div>
                                                    </div>

                                                    {installments.length === 0 ? (
                                                        <div className="text-muted">Aucune échéance générée</div>
                                                    ) : (
                                                        <div className="list-group">
                                                            {installments.map((it, idx) => (
                                                                <div key={idx} className="list-group-item d-flex justify-content-between align-items-center">
                                                                    <div>
                                                                        <div><strong>Échéance #{idx + 1}</strong></div>
                                                                        <div className="small text-muted">Date due: {formatDate(it.dueDate)}</div>
                                                                        <div className="small">Montant suggéré: {it.suggestedAmount} FCFA</div>
                                                                    </div>
                                                                    <div className="text-end">
                                                                        <input type="number" className="form-control form-control-sm mb-2" value={it.amount} onChange={(e) => {
                                                                            const updated = installments.map((el, i) => i === idx ? { ...el, amount: e.target.value } : el);
                                                                            setInstallments(updated);
                                                                        }} />
                                                                        <div>
                                                                            <button className="btn btn-sm btn-success me-2" disabled={it.paid || loading} onClick={() => handlePayInstallment(idx)}>{it.paid ? 'Payée' : 'Payer cette échéance'}</button>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    )}

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