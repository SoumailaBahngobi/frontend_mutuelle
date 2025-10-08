import React, { useState, useEffect, useCallback } from 'react';
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

    const reasons = [
        'Achat immobilier',
        'Achat véhicule',
        'Frais médicaux',
        'Éducation',
        'Projet professionnel',
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
                console.log('Aucun token trouvé');
                return null;
            }
            
            // Décoder le token JWT (partie payload)
            const payload = JSON.parse(atob(token.split('.')[1]));
            console.log('Token décodé:', payload);
            
            return {
                id: payload.id || payload.userId || payload.sub,
                firstName: payload.firstName || payload.given_name || 'Utilisateur',
                lastName: payload.lastName || payload.family_name || '',
                email: payload.email || payload.sub
            };
        } catch (error) {
            console.error('Erreur lors du décodage du token:', error);
            return null;
        }
    }, []);

    // Récupérer les informations du membre connecté
    const fetchCurrentUser = useCallback(async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                console.log('Token non disponible');
                const userFromToken = getCurrentUserFromToken();
                if (userFromToken) {
                    setCurrentUser(userFromToken);
                }
                return;
            }

            // console.log('Tentative de récupération des infos utilisateur...');
            toast.info('Chargement de vos informations...', { autoClose: 2000 });
            
            // Essayer l'endpoint /current
            let response = await fetch('http://localhost:8080/mut/members/current', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            // Si l'endpoint /current ne fonctionne pas, essayer /me ou autre
            if (!response.ok) {
                // console.log('Endpoint /current non disponible, tentative avec /me...');
                toast.info('Tentative de récupération alternative de vos informations...', { autoClose: 2000 });
                response = await fetch('http://localhost:8080/mut/members/me', {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });
            }

            if (response.ok) {
                const text = await response.text();
                // console.log('Réponse brute:', text);
                toast.dismiss();
                toast.success('Informations utilisateur chargées avec succès', { autoClose: 2000 });
                
                if (text) {
                    const userData = JSON.parse(text);
                    // console.log('Données utilisateur:', userData);
                    toast.success(`Bienvenue ${userData.firstName} ${userData.lastName}`, { autoClose: 3000 });
                    setCurrentUser(userData);
                } else {
                    throw new Error('Réponse vide');
                }
            } else {
                console.warn('Endpoints API non disponibles, utilisation du token');
                const userFromToken = getCurrentUserFromToken();
                if (userFromToken) {
                    setCurrentUser(userFromToken);
                }
            }
        } catch (error) {
            console.error('Erreur lors du chargement des informations:', error);
            // Fallback: récupérer depuis le token
            const userFromToken = getCurrentUserFromToken();
            if (userFromToken) {
                // console.log('Utilisation des informations du token comme fallback');
                toast.warning('Utilisation des informations du token', { autoClose: 3000 });
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

        // Effacer l'erreur du champ modifié
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

        // Vérifier que l'utilisateur est connecté
        if (!currentUser) {
            alert('Erreur: Utilisateur non connecté. Veuillez vous reconnecter.');
            return;
        }

        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const loanRequestData = {
                requestAmount: parseFloat(formData.requestAmount),
                duration: parseInt(formData.duration),
                reason: formData.reason,
                acceptTerms: formData.acceptTerms,
                memberId: currentUser.id,
                status: "PENDING",
                requestDate: new Date().toISOString().split('T')[0]
            };

            // console.log('Données envoyées:', loanRequestData);
            toast.info('Soumission de votre demande...', { autoClose: 2000 });

            const response = await fetch('http://localhost:8080/mut/loan_request', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(loanRequestData)
            });

            console.log('Statut de la réponse:', response.status);
            console.log('Headers de la réponse:', response.headers);

            // Vérifier d'abord si la réponse a du contenu
            const responseText = await response.text();
            console.log('Réponse brute:', responseText);

            if (response.ok) {
                let result;
                if (responseText) {
                    try {
                        result = JSON.parse(responseText);
                    } catch (parseError) {
                        console.warn('La réponse n\'est pas du JSON valide, utilisation de la réponse texte');
                        result = { message: responseText };
                    }
                } else {
                    result = { message: 'Demande créée avec succès' };
                }
                
                console.log('Demande créée:', result);
                
                setSuccess(true);
                setFormData({
                    requestAmount: '',
                    duration: '',
                    reason: '',
                    acceptTerms: false
                });
                
                setTimeout(() => setSuccess(false), 5000);
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
            console.error('Erreur complète:', error);
            alert(`Erreur: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    // Fonction pour annuler et réinitialiser le formulaire
    const handleCancel = () => {
        if (window.confirm('Êtes-vous sûr de vouloir annuler ? Toutes les données saisies seront perdues.')) {
            setFormData({
                requestAmount: '',
                duration: '',
                reason: '',
                acceptTerms: false
            });
            setErrors({});
            // console.log('Formulaire annulé et réinitialisé');
            toast.info('Formulaire réinitialisé', { autoClose: 2000 });
            handleBack();
        }
    };

    // Fonction pour retourner à la page précédente
    const handleBack = () => {
        window.history.back();
    };

    const calculateLoanDetails = () => {
        if (!formData.requestAmount || !formData.duration) return null;

        const amount = parseFloat(formData.requestAmount);
        const duration = parseInt(formData.duration);
        const interestRate = 0.0;
        
        const monthlyInterest = (amount * interestRate) / 100 / 12;
        const totalInterest = monthlyInterest * duration;
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
                            <p className="mb-0 opacity-75">
                                Remplissez le formulaire ci-dessous pour soumettre votre demande de prêt
                            </p>
                        </div>

                        <div className="card-body p-4">
                            {/* Affichage du membre connecté */}
                            {currentUser ? (
                                <div className="alert alert-info d-flex align-items-center" role="alert">
                                    <i className="fas fa-user me-2"></i>
                                    <div>
                                        <strong>Membre connecté:</strong> {currentUser.firstName} {currentUser.lastName} 
                                        {currentUser.email && ` - ${currentUser.email}`}
                                    </div>
                                </div>
                            ) : (
                                <div className="alert alert-warning d-flex align-items-center" role="alert">
                                    <i className="fas fa-exclamation-triangle me-2"></i>
                                    <div>
                                        <strong>Attention:</strong> Impossible de récupérer vos informations. 
                                        Vérifiez que vous êtes connecté.
                                    </div>
                                </div>
                            )}

                            {success && (
                                <div className="alert alert-success alert-dismissible fade show" role="alert">
                                    <i className="fas fa-check-circle me-2"></i>
                                    Votre demande de prêt a été soumise avec succès ! 
                                    Vous serez notifié dès qu'elle sera traitée par les responsables.
                                    <button 
                                        type="button" 
                                        className="btn-close" 
                                        onClick={() => setSuccess(false)}
                                    ></button>
                                </div>
                            )}

                            <form onSubmit={handleSubmit}>
                                <div className="row">
                                    <div className="col-md-6 mb-3">
                                        <label htmlFor="requestAmount" className="form-label fw-semibold">
                                            Montant demandé en FCFA *
                                        </label>
                                        <div className="input-group">
                                            <span className="input-group-text bg-light">
                                                <i className="fas fa-money-bill-wave text-muted"></i>
                                            </span>
                                            <input
                                                id="requestAmount"
                                                type="number"
                                                className={`form-control ${errors.requestAmount ? 'is-invalid' : ''}`}
                                                value={formData.requestAmount}
                                                onChange={handleInputChange('requestAmount')}
                                                min="1000"
                                                step="1000"
                                                placeholder="Entrez le montant"
                                            />
                                        </div>
                                        {errors.requestAmount && (
                                            <div className="invalid-feedback d-block">
                                                {errors.requestAmount}
                                            </div>
                                        )}
                                    </div>

                                    <div className="col-md-6 mb-3">
                                        <label htmlFor="duration" className="form-label fw-semibold">
                                            Durée du prêt *
                                        </label>
                                        <select
                                            id="duration"
                                            className={`form-select ${errors.duration ? 'is-invalid' : ''}`}
                                            value={formData.duration}
                                            onChange={handleInputChange('duration')}
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

                                {loanDetails && (
                                    <div className="card border-primary mb-4">
                                        <div className="card-header bg-light">
                                            <h5 className="card-title mb-0">
                                                <i className="fas fa-calculator text-primary me-2"></i>
                                                Simulation du prêt
                                            </h5>
                                        </div>
                                        <div className="card-body">
                                            <div className="row text-center">
                                                <div className="col-6 col-md-3 mb-3">
                                                    <div className="border-end border-secondary">
                                                        <small className="text-muted d-block">Montant emprunté</small>
                                                        <strong className="text-primary h6">
                                                            {formatCurrency(loanDetails.amount)}
                                                        </strong>
                                                    </div>
                                                </div>
                                                <div className="col-6 col-md-3 mb-3">
                                                    <div className="border-end border-secondary">
                                                        <small className="text-muted d-block">Intérêts totaux</small>
                                                        <strong className="text-success h6">
                                                            {formatCurrency(loanDetails.totalInterest)}
                                                        </strong>
                                                    </div>
                                                </div>
                                                <div className="col-6 col-md-3 mb-3">
                                                    <div className="border-end border-secondary">
                                                        <small className="text-muted d-block">Mensualité</small>
                                                        <strong className="text-info h6">
                                                            {formatCurrency(loanDetails.monthlyPayment)}
                                                        </strong>
                                                    </div>
                                                </div>
                                                <div className="col-6 col-md-3 mb-3">
                                                    <small className="text-muted d-block">Total à rembourser</small>
                                                    <strong className="text-dark h6">
                                                        {formatCurrency(loanDetails.totalRepayment)}
                                                    </strong>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div className="mb-3">
                                    <label htmlFor="reason" className="form-label fw-semibold">
                                        Raison du prêt *
                                    </label>
                                    <select
                                        id="reason"
                                        className={`form-select ${errors.reason ? 'is-invalid' : ''}`}
                                        value={formData.reason}
                                        onChange={handleInputChange('reason')}
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

                                {formData.reason === 'Autres dépenses personnelles' && (
                                    <div className="mb-3">
                                        <label htmlFor="detailedReason" className="form-label fw-semibold">
                                            Précisez la raison
                                        </label>
                                        <textarea
                                            id="detailedReason"
                                            className="form-control"
                                            rows="3"
                                            placeholder="Décrivez en détail l'utilisation prévue du prêt..."
                                        />
                                    </div>
                                )}

                                <div className="mb-3">
                                    <label htmlFor="detailedDescription" className="form-label fw-semibold">
                                        Description détaillée
                                    </label>
                                    <textarea
                                        id="detailedDescription"
                                        className="form-control"
                                        rows="4"
                                        placeholder="Fournissez plus de détails sur votre projet et votre situation..."
                                        onChange={handleInputChange('detailedDescription')}
                                    />
                                    <div className="form-text">
                                        Cette information aidera les responsables à mieux comprendre votre demande.
                                    </div>
                                </div>

                                <div className="mb-4">
                                    <div className="form-check">
                                        <input
                                            type="checkbox"
                                            className={`form-check-input ${errors.acceptTerms ? 'is-invalid' : ''}`}
                                            id="acceptTerms"
                                            checked={formData.acceptTerms}
                                            onChange={handleInputChange('acceptTerms')}
                                        />
                                        <label className="form-check-label" htmlFor="acceptTerms">
                                            J'accepte les conditions générales du prêt et m'engage à rembourser 
                                            selon les échéances convenues. *
                                        </label>
                                        {errors.acceptTerms && (
                                            <div className="invalid-feedback d-block">
                                                {errors.acceptTerms}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Boutons Soumettre et Annuler */}
                                <div className="d-grid gap-2 d-md-flex justify-content-md-end">
                                    <button 
                                        type="button"
                                        className="btn btn-outline-secondary btn-lg me-md-2"
                                        onClick={handleCancel}
                                        disabled={loading}
                                    >
                                        <i className="fas fa-times me-2"></i>
                                        Annuler
                                    </button>
                                    <button 
                                        type="submit" 
                                        className={`btn btn-primary btn-lg ${loading ? 'disabled' : ''}`}
                                        disabled={loading || !currentUser}
                                    >
                                        {loading ? (
                                            <>
                                                <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                                                Soumission en cours...
                                            </>
                                        ) : (
                                            <>
                                                <i className="fas fa-paper-plane me-2"></i>
                                                Soumettre la demande
                                            </>
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