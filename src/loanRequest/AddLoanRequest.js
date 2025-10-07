import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
// import { Toast } from 'bootstrap/dist/js/bootstrap.bundle.min';


const AddLoanRequest = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        requestAmount: '',
        duration: '',
        reason: '',
        status: '',
        is_repaid: false,
        request_date: new Date().toISOString().split('T')[0],
        president_approved: false,
        secretary_approved: false,
        treasurer_approved: false,
        interest_rate: 5,
        acceptTerms: false
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const validateForm = () => {
        // Validation du montant
        const amount = parseFloat(formData.requestAmount);
        if (!amount || amount < 2000 || amount > 100000) {
            setError('Le montant doit être entre 2 000 FCFA et 100 000 FCFA');
            return false;
        }

        // Validation de la durée
        const duration = parseInt(formData.duration);
        if (!duration || duration < 1 || duration > 6) {
            setError('La durée doit être entre 1 et 6 mois');
            return false;
        }

        // Validation du motif
        if (!formData.reason.trim() || formData.reason.length < 10) {
            setError('Le motif doit contenir au moins 10 caractères');
            return false;
        }

        // Validation des termes
        if (!formData.acceptTerms) {
            setError('Vous devez accepter les conditions de remboursement');
            return false;
        }
        if (formData.request_date > new Date().toISOString().split('T')[0]) {
            setError('La date de la demande ne peut pas être dans le futur');
            return false;
        }

        return true;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');

        // Validation côté client
        if (!validateForm()) {
            setLoading(false);
            return;
        }
        try {
            const token = localStorage.getItem('token');
            
            if (!token) {
                // setError('Vous devez être connecté pour demander un prêt');
            toast.error('Vous devez être connecté pour demander un prêt', { delay: 3000 }).show();
                setLoading(false);
                return;
            }

            const loanRequest = {
                requestAmount: parseFloat(formData.requestAmount),
                duration: parseInt(formData.duration),
                reason: formData.reason.trim(),
                acceptTerms: formData.acceptTerms
            };

            console.log('Envoi demande de prêt:', loanRequest);

            const response = await axios.post(
                'http://localhost:8080/mut/loan_request', 
                loanRequest, 
                {
                    headers: { 
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            if (response.status === 200) {
                // setSuccess('✅ Demande de prêt envoyée avec succès ! En attente de validation par le com
                // toast.success('Demande de prêt envoyée avec succès ! En attente de validation par le comité.', { delay: 3000 }).show();
                                // setSuccess('✅ Demande de prêt envoyée avec succès ! En attente de validation par le com
                setSuccess('Demande de prêt envoyée avec succès ! En attente de validation par le comité.');
                // Réinitialiser le formulaire
                setFormData({
                    requestAmount: '',
                    duration: '',
                    reason: '',
                    status: '',
                    is_repaid: 'false',
                    request_date: new Date().toISOString().split('T')[0],
                    president_approved: 'false',
                    secretary_approved: 'false',
                    treasurer_approved: 'false',
                    interest_rate: 5,
                    acceptTerms: false
                });
                
                // Redirection après 3 secondes
                setTimeout(() => {
                    navigate('/dashboard');
                }, 3000);
            }
            
        } catch (error) {
            console.error('Erreur détaillée:', error);
            
            // Gestion des erreurs plus précise
            if (error.response) {
                // Erreur du serveur avec réponse
                const errorMessage = error.response.data?.message || 
                                   error.response.data || 
                                  'Erreur lors de la création de la demande';
                            //    toast.error('Erreur lors de la création de la demande', { delay: 3000 });
                setError(`❌ ${errorMessage}`);
            } else if (error.request) {
                // Pas de réponse du serveur
                 setError('❌ Impossible de contacter le serveur. Vérifiez votre connexion.');
            } else {
                // Autre erreur
                 setError('❌ Une erreur inattendue est survenue');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        if (window.confirm('Voulez-vous vraiment annuler ? Les données saisies seront perdues.')) {
            navigate('/dashboard');
        }
    };

    return (
        <div className="container mt-4">
            <div className="row justify-content-center">
                <div className="col-md-8">
                    <div className="card shadow">
                        <div className="card-header bg-primary text-white">
                            <h3 className="card-title mb-0">
                                <i className="fas fa-hand-holding-usd me-2"></i>
                                Demande de Prêt
                            </h3>
                        </div>
                        <div className="card-body">
                            {/* Alertes informatives */}
                            <div className="alert alert-info">
                                <strong>
                                    <i className="fas fa-info-circle me-2"></i>
                                    Informations importantes
                                </strong>
                                <ul className="mb-0 mt-2">
                                    <li>Votre demande sera examinée par le président, secrétaire et trésorier</li>
                                    <li>Le taux d'intérêt est de <strong>5%</strong></li>
                                    <li>Vous recevrez une notification lorsque votre demande sera traitée</li>
                                </ul>
                            </div>

                            <form onSubmit={handleSubmit}>
                                {/* Alertes d'erreur et succès */}
                                {error && (
                                    <div className="alert alert-danger d-flex align-items-center">
                                        <i className="fas fa-exclamation-triangle me-2"></i>
                                        <div>{error}</div>
                                    </div>
                                )}
                                
                                {success && (
                                    <div className="alert alert-success d-flex align-items-center">
                                        <i className="fas fa-check-circle me-2"></i>
                                        <div>{success}</div>
                                    </div>
                                )}

                                {/* Champ Montant */}
                                <div className="mb-3">
                                    <label htmlFor="requestAmount" className="form-label">
                                        <strong>Montant demandé (FCFA) *</strong>
                                    </label>
                                    <div className="input-group">
                                        <span className="input-group-text">FCFA</span>
                                        <input
                                            type="number"
                                            id="requestAmount"
                                            className="form-control"
                                            name="requestAmount"
                                            value={formData.requestAmount}
                                            onChange={handleChange}
                                            min="2000"
                                            max="100000"
                                            step="100"
                                            required
                                            placeholder="Ex: 50000"
                                            disabled={loading}
                                        />
                                    </div>
                                    <div className="form-text">
                                        Entre le montant
                                    </div>
                                </div>

                                {/* Champ Durée */}
                                <div className="mb-3">
                                    <label htmlFor="duration" className="form-label">
                                        <strong>Durée de remboursement (mois) *</strong>
                                    </label>
                                    <div className="input-group">
                                        <span className="input-group-text">
                                            <i className="fas fa-calendar-alt"></i>
                                        </span>
                                        <input
                                            type="number"
                                            id="duration"
                                            className="form-control"
                                            name="duration"
                                            value={formData.duration}
                                            onChange={handleChange}
                                            min="1"
                                            max="6"
                                            required
                                            placeholder="Ex: 3"
                                            disabled={loading}
                                        />
                                        <span className="input-group-text">mois</span>
                                    </div>
                                    <div className="form-text">
                                        Durée entre 1 et 6 mois maximum
                                    </div>
                                </div>

                                <div className="mb-3">
                                    <label className="form-label">
                                        <strong>Date de la demande</strong>
                                    </label>
                                    <input
                                        type="date "
                                        className="form-control"
                                        value={formData.request_date}
                                        disabled
                                    />  
                                </div>

                                {/* Champ Motif */}
                                <div className="mb-3">
                                    <label htmlFor="reason" className="form-label">
                                        <strong>Motif du prêt *</strong>
                                    </label>
                                    <textarea
                                        id="reason"
                                        className="form-control"
                                        name="reason"
                                        value={formData.reason}
                                        onChange={handleChange}
                                        rows="4"
                                        required
                                        placeholder="Décrivez en détail l'utilisation prévue du prêt..."
                                        disabled={loading}
                                        maxLength="500"
                                    />
                                    <div className="form-text">
                                        {formData.reason.length}/500 caractères - Soyez précis sur l'utilisation des fonds
                                    </div>
                                </div>

                                {/* Conditions */}
                                <div className="mb-4">
                                    <div className="card border-warning">
                                        <div className="card-header bg-warning bg-opacity-25">
                                            <h6 className="card-title mb-0 text-dark">
                                                <i className="fas fa-file-contract me-2"></i>
                                                Conditions de remboursement
                                            </h6>
                                        </div>
                                        <div className="card-body">
                                            <ul className="list-unstyled mb-0">
                                                <li className="mb-2">
                                                    <i className="fas fa-percentage text-success me-2"></i>
                                                    <strong>Taux d'intérêt :</strong> 5%
                                                </li>
                                                <li className="mb-2">
                                                    <i className="fas fa-users text-info me-2"></i>
                                                    <strong>Validation :</strong> Requise par les 3 responsables
                                                </li>
                                                <li className="mb-2">
                                                    <i className="fas fa-clock text-warning me-2"></i>
                                                    <strong>Délai :</strong> Remboursement sur la durée choisie
                                                </li>
                                                <li>
                                                    <i className="fas fa-exclamation-triangle text-danger me-2"></i>
                                                    <strong>Important :</strong> Engagement contractuel
                                                </li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>

                                {/* Checkbox Acceptation */}
                                <div className="mb-4">
                                    <div className="form-check">
                                        <input
                                            type="checkbox"
                                            id="acceptTerms"
                                            className="form-check-input"
                                            name="acceptTerms"
                                            checked={formData.acceptTerms}
                                            onChange={handleChange}
                                            required
                                            disabled={loading}
                                        />
                                        <label htmlFor="acceptTerms" className="form-check-label">
                                            <strong>
                                                Je reconnais avoir pris connaissance et j'accepte les conditions 
                                                de remboursement avec intérêts de 5%
                                            </strong>
                                        </label>
                                    </div>
                                </div>

                                {/* Boutons */}
                                <div className="d-grid gap-2 d-md-flex justify-content-md-end">
                                    <button
                                        type="button"
                                        className="btn btn-outline-secondary me-md-2"
                                        onClick={handleCancel}
                                        disabled={loading}
                                    >
                                        <i className="fas fa-arrow-left me-2"></i>
                                        Retour
                                    </button>
                                    <button
                                        type="submit"
                                        className="btn btn-success px-4"
                                        disabled={loading}
                                    >
                                        {loading ? (
                                            <>
                                                <span className="spinner-border spinner-border-sm me-2" />
                                                Envoi en cours...
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