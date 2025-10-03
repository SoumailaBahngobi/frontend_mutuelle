import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const AddLoanRequest = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        requestAmount: '',
        duration: '',
        reason: '',
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

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        // Seule validation : accepter les termes
        if (!formData.acceptTerms) {
            setError('Vous devez accepter les conditions de remboursement');
            setLoading(false);
            return;
        }

        try {
            const token = localStorage.getItem('token');
            
            if (!token) {
                setError('Vous devez être connecté pour demander un prêt');
                setLoading(false);
                return;
            }

            const loanRequest = {
                requestAmount: parseFloat(formData.requestAmount),
                duration: parseInt(formData.duration),
                reason: formData.reason,
                acceptTerms: formData.acceptTerms
            };

            console.log('Envoi demande de prêt:', loanRequest);

            const response = await axios.post('http://localhost:8080/mut/loan_request', loanRequest, {
                headers: { 
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            setSuccess('✅ Demande de prêt envoyée avec succès !');
            
            // Réinitialiser le formulaire
            setFormData({
                requestAmount: '',
                duration: '',
                reason: '',
                acceptTerms: false
            });
            
            // Redirection après 2 secondes
            setTimeout(() => {
                navigate('/dashboard');
            }, 2000);
            
        } catch (error) {
            console.error('Erreur:', error);
            setError(error.response?.data?.message || error.response?.data || 'Erreur lors de la création de la demande');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container mt-4">
            <div className="row justify-content-center">
                <div className="col-md-8">
                    <div className="card">
                        <div className="card-header bg-primary text-white">
                            <h3 className="card-title mb-0">💰 Demande de Prêt</h3>
                        </div>
                        <div className="card-body">
                            <div className="alert alert-info">
                                <strong>📋 Nouvelle demande de prêt</strong>
                                <p className="mb-0 mt-1">
                                    Remplissez ce formulaire pour soumettre votre demande de prêt.
                                    <strong className="text-success"> Aucune condition préalable requise !</strong>
                                </p>
                            </div>

                            <form onSubmit={handleSubmit}>
                                {error && (
                                    <div className="alert alert-danger">
                                        <strong>Erreur:</strong> {error}
                                    </div>
                                )}
                                {success && (
                                    <div className="alert alert-success">
                                        <strong>Succès!</strong> {success}
                                    </div>
                                )}

                                <div className="mb-3">
                                    <label className="form-label">
                                        <strong>Montant demandé (FCFA) *</strong>
                                    </label>
                                    <input
                                        type="number"
                                        className="form-control"
                                        name="requestAmount"
                                        value={formData.requestAmount}
                                        onChange={handleChange}
                                        min="100"
                                        max="100000"
                                        step="100"
                                        required
                                        placeholder="Ex: 5000"
                                    />
                                    <div className="form-text">
                                        Montant entre 2000fcfa et 100 000fcfa
                                    </div>
                                </div>

                                <div className="mb-3">
                                    <label className="form-label">
                                        <strong>Durée de remboursement (mois) *</strong>
                                    </label>
                                    <input
                                        type="number"
                                        className="form-control"
                                        name="duration"
                                        value={formData.duration}
                                        onChange={handleChange}
                                        min="1"
                                        max="120"
                                        required
                                        placeholder="Ex: 12"
                                    />
                                    <div className="form-text">
                                        Durée entre 1 et 6 mois (6 mois maximum)
                                    </div>
                                </div>

                                <div className="mb-3">
                                    <label className="form-label">
                                        <strong>Motif du prêt *</strong>
                                    </label>
                                    <textarea
                                        className="form-control"
                                        name="reason"
                                        value={formData.reason}
                                        onChange={handleChange}
                                        rows="4"
                                        required
                                        placeholder="Décrivez l'utilisation prévue du prêt..."
                                    />
                                    <div className="form-text">
                                        Soyez précis sur l'utilisation des fonds
                                    </div>
                                </div>

                                <div className="mb-4">
                                    <div className="card border-success">
                                        <div className="card-body">
                                            <h6 className="card-title text-success">
                                                📝 Conditions de remboursement
                                            </h6>
                                            <ul className="small mb-0">
                                                <li>✅ Taux d'intérêt: <strong>3%</strong></li>
                                                <li>✅ Remboursement mensuel</li>
                                                <li>✅ Validation par le comité</li>
                                                <li>✅ Aucune condition préalable</li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>

                                <div className="mb-3 form-check">
                                    <input
                                        type="checkbox"
                                        className="form-check-input"
                                        name="acceptTerms"
                                        checked={formData.acceptTerms}
                                        onChange={handleChange}
                                        required
                                    />
                                    <label className="form-check-label">
                                        <strong>
                                            J'accepte les conditions de remboursement avec intérêts de 5%
                                        </strong>
                                    </label>
                                </div>

                                <div className="d-grid gap-2 d-md-flex justify-content-md-end">
                                    <button
                                        type="button"
                                        className="btn btn-secondary me-md-2"
                                        onClick={() => navigate('/dashboard')}
                                    >
                                        ↩️ Retour
                                    </button>
                                    <button
                                        type="submit"
                                        className="btn btn-success"
                                        disabled={loading}
                                    >
                                        {loading ? (
                                            <>
                                                <span className="spinner-border spinner-border-sm me-2" />
                                                Envoi en cours...
                                            </>
                                        ) : (
                                            '🚀 Soumettre la demande'
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