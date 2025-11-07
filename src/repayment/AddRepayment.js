import React, { useState, useEffect, useCallback } from 'react';
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
    const [paymentMode, setPaymentMode] = useState('single');
    const [installments, setInstallments] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // CORRECTION : Utiliser useCallback pour mémoriser la fonction
    const fetchActiveLoans = useCallback(async () => {
        try {
            setLoading(true);
            setError('');
            const token = localStorage.getItem('token');
            
            const response = await axios.get('http://localhost:8080/mutuelle/loans/active', {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                timeout: 10000
            });

            console.log('API Response:', response);
            console.log('API Response data:', response.data);
            console.log('Type of response data:', typeof response.data);

            // CORRECTION : La réponse peut être une chaîne JSON qui doit être parsée
            let responseData = response.data;
            
            // Si c'est une chaîne, la parser en objet
            if (typeof responseData === 'string') {
                console.log('Parsing JSON string...');
                try {
                    responseData = JSON.parse(responseData);
                } catch (parseError) {
                    console.error('JSON parsing failed:', parseError);
                    throw new Error('Format de réponse invalide du serveur');
                }
            }

            // Maintenant traiter les données
            if (Array.isArray(responseData)) {
                console.log('Setting activeLoans as array with', responseData.length, 'items');
                
                // Nettoyer les données pour éviter la récursion
                const cleanedLoans = responseData.map(loan => {
                    // Créer un objet nettoyé sans récursion
                    const cleanLoan = {
                        id: loan.id,
                        amount: loan.amount,
                        duration: loan.duration,
                        beginDate: loan.beginDate,
                        endDate: loan.endDate,
                        interestRate: loan.interestRate,
                        isRepaid: loan.isRepaid,
                        member: loan.member ? {
                            id: loan.member.id,
                            name: loan.member.name,
                            firstName: loan.member.firstName,
                            email: loan.member.email
                        } : null,
                        loanRequest: loan.loanRequest ? {
                            id: loan.loanRequest.id,
                            requestAmount: loan.loanRequest.requestAmount,
                            duration: loan.loanRequest.duration,
                            status: loan.loanRequest.status
                        } : null
                    };

                    // Traiter les remboursements sans récursion
                    if (loan.repayments && Array.isArray(loan.repayments)) {
                        cleanLoan.repayments = loan.repayments.map(repayment => ({
                            id: repayment.id,
                            amount: repayment.amount,
                            status: repayment.status,
                            repaymentDate: repayment.repaymentDate,
                            dueDate: repayment.dueDate,
                            installmentNumber: repayment.installmentNumber,
                            totalInstallments: repayment.totalInstallments
                            // Ne pas inclure loan pour éviter la récursion
                        }));
                    } else {
                        cleanLoan.repayments = [];
                    }

                    return cleanLoan;
                });
                
                setActiveLoans(cleanedLoans);
                console.log('Cleaned loans:', cleanedLoans);
            } else {
                console.warn('Expected array but got:', typeof responseData, responseData);
                setActiveLoans([]);
                setError('Format de données inattendu du serveur');
            }

        } catch (error) {
            console.error('Erreur lors du chargement des prêts:', error);
            handleFetchError(error);
        } finally {
            setLoading(false);
        }
    }, []); // CORRECTION : Tableau de dépendances vide car la fonction ne dépend d'aucune variable externe

    const handleFetchError = (error) => {
        if (error.code === 'ERR_NETWORK' || error.message?.includes('Network Error')) {
            setError('Impossible de joindre le serveur backend. Vérifiez que le serveur est démarré sur le port 8080.');
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
        if (status === 404) {
            setError('Aucun endpoint de prêts actifs trouvé. Vérifiez la configuration du backend.');
            return;
        }

        setError('Erreur lors du chargement des prêts actifs: ' + (error.message || 'Erreur inconnue'));
        setActiveLoans([]);
    };

    // CORRECTION : useEffect avec fetchActiveLoans dans les dépendances
    useEffect(() => {
        fetchActiveLoans();
    }, [fetchActiveLoans]); // CORRECTION : Ajouter fetchActiveLoans comme dépendance

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
            toast.error('Veuillez sélectionner un prêt');
            return false;
        }

        if (!repaymentData.amount || parseFloat(repaymentData.amount) <= 0) {
            setError('Le montant doit être supérieur à 0');
            toast.error('Le montant doit être supérieur à 0');
            return false;
        }

        // Vérifier que le montant ne dépasse pas le montant restant
        const loanDetails = getSelectedLoanDetails();
        if (loanDetails) {
            const remainingAmount = parseFloat(calculateRemainingAmount(loanDetails));
            const repaymentAmount = parseFloat(repaymentData.amount);
            
            if (repaymentAmount > remainingAmount) {
                setError(`Le montant du remboursement (${repaymentAmount} FCFA) dépasse le montant restant (${remainingAmount} FCFA)`);
                toast.error('Le montant dépasse le montant restant du prêt');
                return false;
            }
        }

        if (paymentMode === 'installment') {
            if (!repaymentData.installmentNumber || !repaymentData.totalInstallments) {
                setError('Pour un paiement échelonné, veuillez spécifier le numéro et le total des échéances');
                toast.error('Renseignez le numéro et le total des échéances');
                return false;
            }
        }

        setError('');
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
                amount: parseFloat(repaymentData.amount),
                repaymentDate: repaymentData.repaymentDate,
                status: repaymentData.status,
                loan: { id: parseInt(selectedLoan) }
            };

            // Ajouter les champs conditionnels
            if (repaymentData.dueDate) submitData.dueDate = repaymentData.dueDate;
            if (repaymentData.installmentNumber) submitData.installmentNumber = parseInt(repaymentData.installmentNumber);
            if (repaymentData.totalInstallments) submitData.totalInstallments = parseInt(repaymentData.totalInstallments);
            if (repaymentData.paymentMethod) submitData.paymentMethod = repaymentData.paymentMethod;
            if (repaymentData.transactionReference) submitData.transactionReference = repaymentData.transactionReference;
            if (repaymentData.notes) submitData.notes = repaymentData.notes;

            console.log('Données envoyées:', submitData);

            const response = await axios.post('http://localhost:8080/mutuelle/repayment', submitData, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            console.log('Réponse du serveur:', response.data);

            setSuccess('Remboursement enregistré avec succès !');
            toast.success('Remboursement enregistré avec succès !');

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
            setInstallments([]);

            // Recharger la liste des prêts actifs
            setTimeout(() => {
                fetchActiveLoans();
            }, 1000);

        } catch (error) {
            console.error('Erreur détaillée:', error);
            let errorMessage = 'Erreur lors de l\'enregistrement du remboursement';

            if (error.response?.status === 403) {
                errorMessage = 'Accès refusé. Vérifiez vos permissions.';
            } else if (error.response?.status === 404) {
                errorMessage = 'Endpoint non trouvé. Contactez l\'administrateur.';
            } else if (error.response?.data) {
                const errorData = error.response.data;
                if (typeof errorData === 'string') {
                    errorMessage = errorData;
                } else if (errorData.message) {
                    errorMessage = errorData.message;
                } else {
                    errorMessage = JSON.stringify(errorData);
                }
            } else if (error.code === 'ERR_NETWORK') {
                errorMessage = 'Erreur réseau - Vérifiez la connexion au serveur';
            } else {
                errorMessage = error.message || errorMessage;
            }

            setError(errorMessage);
            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const getSelectedLoanDetails = () => {
        if (!activeLoans || !Array.isArray(activeLoans)) {
            return null;
        }
        return activeLoans.find(loan => loan.id === parseInt(selectedLoan));
    };

    const loanDetails = getSelectedLoanDetails();

    // Calculer le montant total à rembourser
    const calculateTotalAmount = (loan) => {
        if (!loan || !loan.amount) return 0;
        return parseFloat(loan.amount);
    };

    // Calculer le montant restant
    const calculateRemainingAmount = (loan) => {
        if (!loan) return 0;
        const totalAmount = calculateTotalAmount(loan);
        
        // Calculer le total déjà remboursé
        let totalRepaid = 0;
        if (loan.repayments && Array.isArray(loan.repayments)) {
            totalRepaid = loan.repayments.reduce((sum, repayment) => {
                if (repayment.status === 'PAID') {
                    return sum + (parseFloat(repayment.amount) || 0);
                }
                return sum;
            }, 0);
        }
        
        const remaining = totalAmount - totalRepaid;
        return remaining > 0 ? remaining : 0;
    };

    // Générer un plan d'échéances
    const generateInstallmentPlan = () => {
        if (!loanDetails) return;

        const remainingAmount = calculateRemainingAmount(loanDetails);
        const totalInstallments = parseInt(loanDetails.duration) || 12;

        if (remainingAmount <= 0) {
            toast.info('Ce prêt est déjà entièrement remboursé');
            return;
        }

        const installmentAmount = (remainingAmount / totalInstallments).toFixed(0);
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
        toast.success(`Plan de ${totalInstallments} échéances généré`);
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
        toast.info(`Échéance ${installment.installmentNumber}/${installment.totalInstallments} sélectionnée`);
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

    // Formater la monnaie
    const formatCurrency = (amount) => {
        if (!amount && amount !== 0) return '0';
        return new Intl.NumberFormat('fr-FR', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount);
    };

    // Vérifier si activeLoans est un tableau valide
    const isValidActiveLoans = activeLoans && Array.isArray(activeLoans);
    const activeLoansCount = isValidActiveLoans ? activeLoans.length : 0;

    return (
        <div className="container mt-4">
            <div className="row justify-content-center">
                <div className="col-md-10">
                    <div className="card">
                        <div className="card-header bg-primary text-white">
                            <h3 className="card-title mb-0">
                                <i className="fas fa-money-bill-wave me-2"></i>
                                Nouveau Remboursement
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

                            {loading && !isValidActiveLoans ? (
                                <div className="text-center">
                                    <div className="spinner-border text-primary" role="status">
                                        <span className="visually-hidden">Chargement...</span>
                                    </div>
                                    <p className="mt-2">Chargement des prêts actifs...</p>
                                </div>
                            ) : !isValidActiveLoans ? (
                                <div className="alert alert-danger">
                                    <i className="fas fa-exclamation-circle me-2"></i>
                                    Erreur de chargement des données des prêts.
                                    <div className="mt-3">
                                        <button
                                            type="button"
                                            className="btn btn-outline-primary"
                                            onClick={fetchActiveLoans}
                                        >
                                            <i className="fas fa-refresh me-2"></i>
                                            Réessayer
                                        </button>
                                        <button
                                            type="button"
                                            className="btn btn-outline-secondary ms-2"
                                            onClick={() => navigate('/dashboard')}
                                        >
                                            <i className="fas fa-arrow-left me-2"></i>
                                            Retour
                                        </button>
                                    </div>
                                </div>
                            ) : activeLoansCount === 0 ? (
                                <div className="alert alert-warning">
                                    <i className="fas fa-exclamation-circle me-2"></i>
                                    Aucun prêt actif disponible pour le remboursement.
                                    <div className="mt-3">
                                        <button
                                            type="button"
                                            className="btn btn-outline-secondary"
                                            onClick={() => navigate('/dashboard')}
                                        >
                                            <i className="fas fa-arrow-left me-2"></i>
                                            Retour
                                        </button>
                                    </div>
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
                                                setInstallments([]);
                                            }}
                                            required
                                        >
                                            <option value="">Choisir un prêt...</option>
                                            {activeLoans.map(loan => (
                                                <option key={loan.id} value={loan.id}>
                                                    {loan.member?.name || 'N/A'} {loan.member?.firstName || ''} -
                                                    Montant: {formatCurrency(loan.amount)} FCFA -
                                                    Restant: {formatCurrency(calculateRemainingAmount(loan))} FCFA
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
                                                            <strong>Membre:</strong><br />
                                                            {loanDetails.member?.name || 'N/A'} {loanDetails.member?.firstName || ''}
                                                        </div>
                                                        <div className="col-md-4">
                                                            <strong>Montant du prêt:</strong><br />
                                                            {formatCurrency(loanDetails.amount)} FCFA
                                                        </div>
                                                        <div className="col-md-4">
                                                            <strong>Montant restant:</strong><br />
                                                            <span className="text-warning fw-bold">
                                                                {formatCurrency(calculateRemainingAmount(loanDetails))} FCFA
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <hr />
                                                    <div className="row">
                                                        <div className="col-md-4">
                                                            <strong>Durée:</strong><br />
                                                            {loanDetails.duration || 'N/A'} mois
                                                        </div>
                                                        <div className="col-md-4">
                                                            <strong>Taux d'intérêt:</strong><br />
                                                            {loanDetails.interestRate?.toFixed(0) || '0'}%
                                                        </div>
                                                        <div className="col-md-4">
                                                            <strong>Remboursements:</strong><br />
                                                            <span className="badge bg-info">
                                                                {loanDetails.repayments?.length || 0} effectué(s)
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Génération du plan d'échéances */}
                                            {calculateRemainingAmount(loanDetails) > 0 && (
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
                                            )}

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
                                                                        <td>{formatCurrency(installment.amount)} FCFA</td>
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
                                                    min="1000"
                                                    step="500"
                                                    required
                                                    placeholder="Montant à rembourser"
                                                />
                                                {selectedLoan && loanDetails && (
                                                    <div className="form-text">
                                                        Montant restant: <strong>{formatCurrency(calculateRemainingAmount(loanDetails))} FCFA</strong>
                                                    </div>
                                                )}
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
                                        <label className="form-label"><strong>Type de remboursement</strong></label>
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