import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';

const AddRepayment = () => {
    const navigate = useNavigate();
    const [activeLoans, setActiveLoans] = useState([]);
    const [selectedLoan, setSelectedLoan] = useState('');
    const [repaymentData, setRepaymentData] = useState({
        amount: '',
        repaymentDate: new Date().toISOString().split('T')[0],
        dueDate: '',
        installmentNumber: '',
        totalInstallments: '',
        status: 'PENDING',
        paymentMethod: '',
        transactionReference: '',
        notes: ''
    });
    const [paymentMode, setPaymentMode] = useState('single'); // 'single' ou 'installment'
    const [installments, setInstallments] = useState([]);
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
            
            const activeLoans = response.data.filter(loan => 
                !loan.isRepaid && loan.status === 'APPROVED'
            );
            
            setActiveLoans(activeLoans);
        } catch (error) {
            // console.error('Erreur lors du chargement des prêts:', error);
            toast.error('Erreur lors du chargement des prêts. Voir la console pour plus de détails.');
            
            if (error.code === 'ERR_NETWORK') {
                setError('Impossible de joindre le serveur backend. Vérifiez que le serveur est démarré.');
                return;
            }

            const status = error.response?.status;
            if (status === 401) {
                setError('Accès non autorisé — reconnectez-vous.');
                localStorage.removeItem('token');
                localStorage.removeItem('currentUser');
                navigate('/login');
                return;
            }
            if (status === 403) {
                setError('Accès refusé — vous n\'avez pas la permission d\'accéder à ces prêts.');
                return;
            }

            setError('Erreur lors du chargement des prêts actifs.');
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setRepaymentData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const validateForm = () => {
        if (!selectedLoan) {
            setError('Veuillez sélectionner un prêt');
            return false;
        }

        if (!repaymentData.amount || parseFloat(repaymentData.amount) <= 0) {
            setError('Le montant doit être supérieur à 0');
            return false;
        }

        if (paymentMode === 'installment') {
            if (!repaymentData.installmentNumber || !repaymentData.totalInstallments) {
                setError('Pour un paiement échelonné, veuillez spécifier le numéro et le total des échéances');
                return false;
            }
        }

        return true;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!validateForm()) return;

        setLoading(true);
        setError('');
        setSuccess('');

        try {
            const token = localStorage.getItem('token');
            const submitData = {
                ...repaymentData,
                amount: parseFloat(repaymentData.amount),
                installmentNumber: repaymentData.installmentNumber ? parseInt(repaymentData.installmentNumber) : null,
                totalInstallments: repaymentData.totalInstallments ? parseInt(repaymentData.totalInstallments) : null,
                loanRequest: { id: parseInt(selectedLoan) }
            };

            // Nettoyer les champs non remplis
            if (!submitData.dueDate) delete submitData.dueDate;
            if (!submitData.installmentNumber) delete submitData.installmentNumber;
            if (!submitData.totalInstallments) delete submitData.totalInstallments;
            if (!submitData.paymentMethod) delete submitData.paymentMethod;
            if (!submitData.transactionReference) delete submitData.transactionReference;
            if (!submitData.notes) delete submitData.notes;

            console.log('Données envoyées:', submitData);

            const response = await axios.post('http://localhost:8080/mut/repayment', submitData, {
                headers: { 
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            setSuccess('Remboursement enregistré avec succès !');
            
            // Réinitialiser le formulaire
            setSelectedLoan('');
            setRepaymentData({
                amount: '',
                repaymentDate: new Date().toISOString().split('T')[0],
                dueDate: '',
                installmentNumber: '',
                totalInstallments: '',
                status: 'PENDING',
                paymentMethod: '',
                transactionReference: '',
                notes: ''
            });

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
    };

    const loanDetails = getSelectedLoanDetails();

    // Calculer le montant total à rembourser
    const calculateTotalAmount = (loan) => {
        if (!loan || !loan.requestAmount || !loan.interestRate) return 0;
        
        const principal = parseFloat(loan.requestAmount);
        const interestRate = parseFloat(loan.interestRate) / 100;
        const total = principal + (principal * interestRate);
        
        return total.toFixed(2);
    };

    // Calculer le montant restant
    const calculateRemainingAmount = (loan) => {
        if (!loan) return 0;

        const totalAmount = parseFloat(calculateTotalAmount(loan));
        const totalRepaid = loan.repayments?.reduce((sum, r) => sum + (parseFloat(r.amount) || 0), 0) || 0;

        const remaining = totalAmount - totalRepaid;
        return remaining > 0 ? remaining.toFixed(2) : '0.00';
    };

    // Générer un plan d'échéances
    const generateInstallmentPlan = () => {
        if (!loanDetails) return;

        const remainingAmount = parseFloat(calculateRemainingAmount(loanDetails));
        const totalInstallments = parseInt(loanDetails.duration) || 12;
        
        const installmentAmount = (remainingAmount / totalInstallments).toFixed(2);
        const today = new Date();
        
        const plan = [];
        for (let i = 1; i <= totalInstallments; i++) {
            const dueDate = new Date(today.getFullYear(), today.getMonth() + i, today.getDate());
            plan.push({
                installmentNumber: i,
                totalInstallments: totalInstallments,
                amount: installmentAmount,
                dueDate: dueDate.toISOString().split('T')[0],
                status: 'PENDING'
            });
        }
        
        setInstallments(plan);
    };

    const handleUseInstallment = (installment) => {
        setRepaymentData(prev => ({
            ...prev,
            amount: installment.amount,
            dueDate: installment.dueDate,
            installmentNumber: installment.installmentNumber,
            totalInstallments: installment.totalInstallments,
            status: 'PENDING'
        }));
        setPaymentMode('installment');
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
                <div className="col-md-10">
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
                                    {/* Sélection du prêt */}
                                    <div className="mb-4">
                                        <label className="form-label">
                                            <strong>Sélectionner un prêt *</strong>
                                        </label>
                                        <select
                                            className="form-select"
                                            value={selectedLoan}
                                            onChange={(e) => {
                                                setSelectedLoan(e.target.value);
                                                setRepaymentData(prev => ({ ...prev, amount: '' }));
                                            }}
                                            required
                                        >
                                            <option value="">Choisir un prêt...</option>
                                            {activeLoans.map(loan => (
                                                <option key={loan.id} value={loan.id}>
                                                    {loan.member?.name || 'N/A'} {loan.member?.firstName || ''} - 
                                                    Montant: {loan.requestAmount?.toFixed(2) || ''} FCFA - 
                                                    Durée: {loan.duration} mois
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Détails du prêt sélectionné */}
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
                                                        <div className="col-md-4">
                                                            <strong>Membre:</strong><br/>
                                                            {loanDetails.member?.name || 'N/A'} {loanDetails.member?.firstName || ''}
                                                        </div>
                                                        <div className="col-md-4">
                                                            <strong>Montant demandé:</strong><br/>
                                                            {loanDetails.requestAmount?.toFixed(2) || '0000'} FCFA
                                                        </div>
                                                        <div className="col-md-4">
                                                            <strong>Montant total à rembourser:</strong><br/>
                                                            <span className="text-success fw-bold">
                                                                {calculateTotalAmount(loanDetails)} FCFA
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <hr/>
                                                    <div className="row">
                                                        <div className="col-md-4">
                                                            <strong>Montant restant:</strong><br/>
                                                            <span className="text-warning fw-bold">
                                                                {calculateRemainingAmount(loanDetails)} FCFA
                                                            </span>
                                                        </div>
                                                        <div className="col-md-4">
                                                            <strong>Durée:</strong><br/>
                                                            {loanDetails.duration} mois
                                                        </div>
                                                        <div className="col-md-4">
                                                            <strong>Taux d'intérêt:</strong><br/>
                                                            {loanDetails.interestRate?.toFixed(1) || '00'}%
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Génération du plan d'échéances */}
                                            <div className="mt-3">
                                                <button 
                                                    type="button" 
                                                    className="btn btn-outline-primary btn-sm"
                                                    onClick={generateInstallmentPlan}
                                                >
                                                    <i className="fas fa-calendar-alt me-2"></i>
                                                    Générer le plan d'échéances
                                                </button>
                                            </div>

                                            {installments.length > 0 && (
                                                <div className="mt-3">
                                                    <h6>Plan d'échéances suggéré:</h6>
                                                    <div className="table-responsive">
                                                        <table className="table table-sm table-bordered">
                                                            <thead>
                                                                <tr>
                                                                    <th>Échéance</th>
                                                                    <th>Montant</th>
                                                                    <th>Date d'échéance</th>
                                                                    <th>Action</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                {installments.map((installment, index) => (
                                                                    <tr key={index}>
                                                                        <td>{installment.installmentNumber}/{installment.totalInstallments}</td>
                                                                        <td>{installment.amount} FCFA</td>
                                                                        <td>{formatDate(installment.dueDate)}</td>
                                                                        <td>
                                                                            <button
                                                                                type="button"
                                                                                className="btn btn-success btn-sm"
                                                                                onClick={() => handleUseInstallment(installment)}
                                                                            >
                                                                                Utiliser
                                                                            </button>
                                                                        </td>
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Informations de remboursement */}
                                    <div className="row">
                                        <div className="col-md-6">
                                            <div className="mb-3">
                                                <label className="form-label">
                                                    <strong>Montant du remboursement (FCFA) *</strong>
                                                </label>
                                                <input
                                                    type="number"
                                                    className="form-control"
                                                    name="amount"
                                                    value={repaymentData.amount}
                                                    onChange={handleInputChange}
                                                    min="0.01"
                                                    step="0.01"
                                                    required
                                                    placeholder="Montant à rembourser"
                                                />
                                            </div>
                                        </div>

                                        <div className="col-md-6">
                                            <div className="mb-3">
                                                <label className="form-label">
                                                    <strong>Date de remboursement *</strong>
                                                </label>
                                                <input
                                                    type="date"
                                                    className="form-control"
                                                    name="repaymentDate"
                                                    value={repaymentData.repaymentDate}
                                                    onChange={handleInputChange}
                                                    required
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Mode de paiement */}
                                    <div className="mb-3">
                                        <label className="form-label"><strong>Mode de paiement</strong></label>
                                        <div>
                                            <div className="form-check form-check-inline">
                                                <input 
                                                    className="form-check-input" 
                                                    type="radio" 
                                                    name="paymentMode" 
                                                    id="single" 
                                                    value="single" 
                                                    checked={paymentMode === 'single'} 
                                                    onChange={() => setPaymentMode('single')} 
                                                />
                                                <label className="form-check-label" htmlFor="single">
                                                    Paiement unique
                                                </label>
                                            </div>
                                            <div className="form-check form-check-inline">
                                                <input 
                                                    className="form-check-input" 
                                                    type="radio" 
                                                    name="paymentMode" 
                                                    id="installment" 
                                                    value="installment" 
                                                    checked={paymentMode === 'installment'} 
                                                    onChange={() => setPaymentMode('installment')} 
                                                />
                                                <label className="form-check-label" htmlFor="installment">
                                                    Échéance
                                                </label>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Champs spécifiques aux échéances */}
                                    {paymentMode === 'installment' && (
                                        <div className="row">
                                            <div className="col-md-4">
                                                <div className="mb-3">
                                                    <label className="form-label">
                                                        <strong>Numéro de l'échéance *</strong>
                                                    </label>
                                                    <input
                                                        type="number"
                                                        className="form-control"
                                                        name="installmentNumber"
                                                        value={repaymentData.installmentNumber}
                                                        onChange={handleInputChange}
                                                        min="1"
                                                        placeholder="1"
                                                    />
                                                </div>
                                            </div>
                                            <div className="col-md-4">
                                                <div className="mb-3">
                                                    <label className="form-label">
                                                        <strong>Total des échéances *</strong>
                                                    </label>
                                                    <input
                                                        type="number"
                                                        className="form-control"
                                                        name="totalInstallments"
                                                        value={repaymentData.totalInstallments}
                                                        onChange={handleInputChange}
                                                        min="1"
                                                        placeholder="12"
                                                    />
                                                </div>
                                            </div>
                                            <div className="col-md-4">
                                                <div className="mb-3">
                                                    <label className="form-label">
                                                        <strong>Date d'échéance</strong>
                                                    </label>
                                                    <input
                                                        type="date"
                                                        className="form-control"
                                                        name="dueDate"
                                                        value={repaymentData.dueDate}
                                                        onChange={handleInputChange}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Informations supplémentaires */}
                                    <div className="row">
                                        <div className="col-md-6">
                                            <div className="mb-3">
                                                <label className="form-label">
                                                    <strong>Méthode de paiement</strong>
                                                </label>
                                                <select
                                                    className="form-select"
                                                    name="paymentMethod"
                                                    value={repaymentData.paymentMethod}
                                                    onChange={handleInputChange}
                                                >
                                                    <option value="">Choisir une méthode...</option>
                                                    <option value="CASH">Espèces</option>
                                                    <option value="BANK_TRANSFER">Virement bancaire</option>
                                                    <option value="MOBILE_MONEY">Mobile Money</option>
                                                    <option value="CHECK">Chèque</option>
                                                    <option value="OTHER">Autre</option>
                                                </select>
                                            </div>
                                        </div>
                                        <div className="col-md-6">
                                            <div className="mb-3">
                                                <label className="form-label">
                                                    <strong>Référence de transaction</strong>
                                                </label>
                                                <input
                                                    type="text"
                                                    className="form-control"
                                                    name="transactionReference"
                                                    value={repaymentData.transactionReference}
                                                    onChange={handleInputChange}
                                                    placeholder="Numéro de référence"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mb-3">
                                        <label className="form-label">
                                            <strong>Statut *</strong>
                                        </label>
                                        <select
                                            className="form-select"
                                            name="status"
                                            value={repaymentData.status}
                                            onChange={handleInputChange}
                                            required
                                        >
                                            <option value="PENDING">En attente</option>
                                            <option value="PAID">Payé</option>
                                            <option value="OVERDUE">En retard</option>
                                        </select>
                                    </div>

                                    <div className="mb-3">
                                        <label className="form-label">
                                            <strong>Notes</strong>
                                        </label>
                                        <textarea
                                            className="form-control"
                                            name="notes"
                                            value={repaymentData.notes}
                                            onChange={handleInputChange}
                                            rows="3"
                                            placeholder="Notes supplémentaires..."
                                        />
                                    </div>

                                    {/* Boutons d'action */}
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
                                            disabled={loading || !selectedLoan || !repaymentData.amount}
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