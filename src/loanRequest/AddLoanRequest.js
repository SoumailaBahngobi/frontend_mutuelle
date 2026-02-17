import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import { toast } from 'react-toastify';

const AddLoanRequest = () => {
    const [formData, setFormData] = useState({
        requestAmount: '',
        duration: '',
        reason: '',
        acceptTerms: false
    });
    
    const [errors, setErrors] = useState({});
    const [success, setSuccess] = useState(false);
    const [loading, setLoading] = useState(false);
    const [currentUser, setCurrentUser] = useState(null);

    const navigate = useNavigate();

    const reasons = [
        'Achat immobilier',
        'Achat véhicule',
        'Frais médicaux',
        'Éducation',
        'Projet professionnel',
        'funerailles',
        'bapteme',
        'Mariage',
        'Vacances',
        'Autres dépenses personnelles'
    ];

    const durationOptions = [
        { value: 1, label: '1 mois' },
        { value: 2, label: '2 mois' },
        { value: 3, label: '3 mois' },
        { value: 4, label: '4 mois' },
        { value: 5, label: '5 mois' },
        { value: 6, label: '6 mois' }
    ];

    // Fonction pour extraire les infos utilisateur du token JWT
    const getCurrentUserFromToken = useCallback(() => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                return null;
            }
            
            const payload = JSON.parse(atob(token.split('.')[1]));
            
            return {
                id: payload.id || payload.userId || payload.sub,
                firstName: payload.firstName || payload.given_name || 'Utilisateur',
                lastName: payload.lastName || payload.family_name || '',
                email: payload.email || payload.sub
            };
        } catch (error) {
            toast.error('Erreur lors de la lecture des informations utilisateur. Certaines fonctionnalités peuvent être limitées.', { autoClose: 7000 });
            return null;
        }
    }, []);

    // Récupérer les informations du membre connecté
    const fetchCurrentUser = useCallback(async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                console.warn('Aucun token trouvé');
                const userFromToken = getCurrentUserFromToken();
                if (userFromToken) {
                    setCurrentUser(userFromToken);
                }
                return;
            }

            let response = await fetch('http://localhost:8080/mutuelle/member/profile', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const userData = await response.json();
                console.log('👤 User data:', userData);
                setCurrentUser(userData);
            } else {
                toast.warn('⚠️ Impossible de récupérer le profil complet. Certaines fonctionnalités peuvent être limitées.', { autoClose: 7000 });    
                const userFromToken = getCurrentUserFromToken();
                if (userFromToken) {
                    setCurrentUser(userFromToken);
                }
            }
        } catch (error) {
            toast.error('❌ Erreur lors de la récupération des informations utilisateur. Certaines fonctionnalités peuvent être limitées.', { autoClose: 7000 }); 
            const userFromToken = getCurrentUserFromToken();
            if (userFromToken) {
                setCurrentUser(userFromToken);
            }
        }
    }, [getCurrentUserFromToken]);

    // Récupérer les informations du membre connecté au chargement du composant
    useEffect(() => {
        fetchCurrentUser();
    }, [fetchCurrentUser]);

    const validateForm = () => {
        const newErrors = {};

        if (!formData.requestAmount || formData.requestAmount <= 0) {
            newErrors.requestAmount = 'Le montant doit être supérieur à 0';
        }

        if (!formData.duration) {
            newErrors.duration = 'Veuillez sélectionner une durée';
        }

        if (!formData.reason) {
            newErrors.reason = 'Veuillez sélectionner une raison';
        }

        if (!formData.acceptTerms) {
            newErrors.acceptTerms = 'Vous devez accepter les conditions';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleInputChange = (field) => (event) => {
        const value = field === 'acceptTerms' ? event.target.checked : event.target.value;
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));

        if (errors[field]) {
            setErrors(prev => ({
                ...prev,
                [field]: ''
            }));
        }
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        
        if (!validateForm()) return;

        if (!currentUser) {
            toast.error('Erreur: Utilisateur non connecté. Veuillez vous reconnecter.', { autoClose: 5000 });
            return;
        }

        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            
            const loanRequestData = {
                requestAmount: parseFloat(formData.requestAmount),
                duration: parseInt(formData.duration),
                reason: formData.reason
            };

            const response = await fetch('http://localhost:8080/mutuelle/loan_request', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(loanRequestData)
            });

            const responseText = await response.text();

            if (response.ok) {
                toast.success('✅ Demande de prêt soumise avec succès !', { autoClose: 3000 });
                
                setSuccess(true);
                setFormData({
                    requestAmount: '',
                    duration: '',
                    reason: '',
                    acceptTerms: false
                });
                
                // Redirection après succès
                setTimeout(() => {
                    navigate('/loans/requests');
                }, 2000);
            } else {
                let errorMessage = 'Erreur lors de la création de la demande';
                if (responseText) {
                    try {
                        const errorData = JSON.parse(responseText);
                        errorMessage = errorData.message || errorMessage;
                    } catch {
                        errorMessage = responseText || errorMessage;
                    }
                }
                throw new Error(errorMessage);
            }
        } catch (error) {
            toast.error(`❌ Erreur: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        if (window.confirm('Êtes-vous sûr de vouloir annuler ? Toutes les données saisies seront perdues.')) {
            setFormData({
                requestAmount: '',
                duration: '',
                reason: '',
                acceptTerms: false
            });
            setErrors({});
            navigate('/dashboard');
        }
    };

    const viewMyRequests = () => {
        navigate('/loans/requests');
    };

    const calculateLoanDetails = () => {
        if (!formData.requestAmount || !formData.duration) return null;

        const amount = parseFloat(formData.requestAmount);
        const duration = parseInt(formData.duration);
        const interestRate = 0; // Taux d'intérêt mensuel de 0%
        
        const totalInterest = (amount * interestRate * duration) / 100 / 12;
        const totalRepayment = amount + totalInterest;
        const monthlyPayment = totalRepayment / duration;

        return {
            amount,
            duration,
            interestRate,
            totalInterest,
            totalRepayment,
            monthlyPayment
        };
    };

    const loanDetails = calculateLoanDetails();

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('fr-FR', {
            style: 'currency',
            currency: 'XOF'
        }).format(amount);
    };

    return (
        <div className="container mt-4">
            <div className="row justify-content-center">
                <div className="col-md-10 col-lg-8">
                    <div className="card shadow-lg border-0">
                        <div className="card-header bg-primary text-white text-center py-4">
                            <h1 className="h3 mb-0">Nouvelle Demande de Prêt</h1>
                        </div>

                        <div className="card-body p-4">
                            {/* Affichage du membre connecté */}
                            {currentUser ? (
                                <div className="alert alert-info">
                                    <strong>👤 Membre connecté:</strong> {currentUser.firstName} {currentUser.lastName} 
                                    {currentUser.email && ` (${currentUser.email})`}
                                </div>
                            ) : (
                                <div className="alert alert-warning">
                                    <strong>⚠️ Attention:</strong> Impossible de récupérer vos informations.
                                </div>
                            )}

                            {success && (
                                <div className="alert alert-success">
                                    <div className="d-flex align-items-center">
                                        <span className="me-2">✅</span>
                                        <div>
                                            <strong>Votre demande de prêt a été soumise avec succès !</strong>
                                            <br />
                                            <small>Redirection vers la liste de vos demandes...</small>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <form onSubmit={handleSubmit}>
                                <div className="row">
                                    <div className="col-md-6 mb-3">
                                        <label htmlFor="requestAmount" className="form-label fw-semibold">
                                            💰 Montant demandé en FCFA *
                                        </label>
                                        <input
                                            id="requestAmount"
                                            type="number"
                                            className={`form-control ${errors.requestAmount ? 'is-invalid' : ''}`}
                                            value={formData.requestAmount}
                                            onChange={handleInputChange('requestAmount')}
                                            min="1000"
                                            step="500"
                                            placeholder="Entrez le montant"
                                            disabled={loading}
                                        />
                                        {errors.requestAmount && (
                                            <div className="invalid-feedback d-block">
                                                {errors.requestAmount}
                                            </div>
                                        )}
                                    </div>

                                    <div className="col-md-6 mb-3">
                                        <label htmlFor="duration" className="form-label fw-semibold">
                                            📅 Durée du prêt *
                                        </label>
                                        <select
                                            id="duration"
                                            className={`form-select ${errors.duration ? 'is-invalid' : ''}`}
                                            value={formData.duration}
                                            onChange={handleInputChange('duration')}
                                            disabled={loading}
                                        >
                                            <option value="">Sélectionnez une durée</option>
                                            {durationOptions.map((option) => (
                                                <option key={option.value} value={option.value}>
                                                    {option.label}
                                                </option>
                                            ))}
                                        </select>
                                        {errors.duration && (
                                            <div className="invalid-feedback d-block">
                                                {errors.duration}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="mb-3">
                                    <label htmlFor="reason" className="form-label fw-semibold">
                                        🎯 Raison du prêt *
                                    </label>
                                    <select
                                        id="reason"
                                        className={`form-select ${errors.reason ? 'is-invalid' : ''}`}
                                        value={formData.reason}
                                        onChange={handleInputChange('reason')}
                                        disabled={loading}
                                    >
                                        <option value="">Sélectionnez une raison</option>
                                        {reasons.map((reason) => (
                                            <option key={reason} value={reason}>
                                                {reason}
                                            </option>
                                        ))}
                                    </select>
                                    {errors.reason && (
                                        <div className="invalid-feedback d-block">
                                            {errors.reason}
                                        </div>
                                    )}
                                </div>

                                {/* Détails du prêt calculés */}
                                {loanDetails && (
                                    <div className="card bg-light mb-4">
                                        <div className="card-body">
                                            <h6 className="card-title text-primary">📊 Détails du prêt calculés</h6>
                                            <div className="row small">
                                                <div className="col-md-6">
                                                    <p><strong>Montant:</strong> {formatCurrency(loanDetails.amount)}</p>
                                                    <p><strong>Durée:</strong> {loanDetails.duration} mois</p>
                                                    <p><strong>Taux d'intérêt:</strong> {loanDetails.interestRate}%</p>
                                                </div>
                                                <div className="col-md-6">
                                                    <p><strong>Intérêt total:</strong> {formatCurrency(loanDetails.totalInterest)}</p>
                                                    <p><strong>Montant total à rembourser:</strong> {formatCurrency(loanDetails.totalRepayment)}</p>
                                                    <p><strong>Mensualité:</strong> {formatCurrency(loanDetails.monthlyPayment)}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div className="mb-4">
                                    <div className="form-check">
                                        <input
                                            type="checkbox"
                                            className={`form-check-input ${errors.acceptTerms ? 'is-invalid' : ''}`}
                                            id="acceptTerms"
                                            checked={formData.acceptTerms}
                                            onChange={handleInputChange('acceptTerms')}
                                            disabled={loading}
                                        />
                                        <label className="form-check-label" htmlFor="acceptTerms">
                                            J'accepte les conditions générales du prêt *
                                        </label>
                                        {errors.acceptTerms && (
                                            <div className="invalid-feedback d-block">
                                                {errors.acceptTerms}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="d-grid gap-2 d-md-flex justify-content-md-end">
                                    <button 
                                        type="button"
                                        className="btn btn-outline-secondary btn-lg me-md-2"
                                        onClick={handleCancel}
                                        disabled={loading}
                                    >
                                        ❌ Annuler
                                    </button>
                                    <button 
                                        type="submit" 
                                        className="btn btn-primary btn-lg"
                                        disabled={loading || !currentUser || !formData.acceptTerms}
                                    >
                                        {loading ? (
                                            <>
                                                <span className="spinner-border spinner-border-sm me-2" />
                                                📤 Soumission...
                                            </>
                                        ) : (
                                            '✅ Soumettre la demande'
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AddLoanRequest;