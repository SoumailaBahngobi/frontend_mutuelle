// src/configuration/ChangePassword.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import 'bootstrap/dist/css/bootstrap.min.css';

function ChangePassword() {
    const [form, setForm] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});
    const navigate = useNavigate();

    const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8081';

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const validateForm = () => {
        const newErrors = {};

        if (!form.currentPassword) {
            newErrors.currentPassword = 'Le mot de passe actuel est obligatoire';
        }

        if (!form.newPassword) {
            newErrors.newPassword = 'Le nouveau mot de passe est obligatoire';
        } else if (form.newPassword.length < 6) {
            newErrors.newPassword = 'Le mot de passe doit contenir au moins 6 caractères';
        }

        if (form.newPassword !== form.confirmPassword) {
            newErrors.confirmPassword = 'Les mots de passe ne correspondent pas';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        setLoading(true);

        try {
            const token = localStorage.getItem('token');

            const response = await axios.post(
                `${API_URL}/mutuelle/auth/change-password`,
                {
                    currentPassword: form.currentPassword,
                    newPassword: form.newPassword
                },
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            if (response.data.success) {
                toast.success('Mot de passe modifié avec succès !');
                
                // Réinitialiser le formulaire
                setForm({
                    currentPassword: '',
                    newPassword: '',
                    confirmPassword: ''
                });

                // Rediriger vers le dashboard après 2 secondes
                setTimeout(() => {
                    navigate('/dashboard');
                }, 2000);
            } else {
                toast.error(response.data.message);
            }
        } catch (error) {
            console.error('Erreur:', error);
            
            if (error.response?.status === 401) {
                toast.error('Session expirée. Veuillez vous reconnecter.');
                setTimeout(() => navigate('/login'), 3000);
            } else if (error.response?.status === 400) {
                toast.error(error.response.data?.message || 'Mot de passe actuel incorrect');
            } else {
                toast.error('Erreur lors du changement de mot de passe');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container mt-4">
            <div className="row justify-content-center">
                <div className="col-md-6">
                    <div className="card shadow">
                        <div className="card-header bg-primary text-white">
                            <h4 className="mb-0">
                                <i className="bi bi-shield-lock me-2"></i>
                                Changer mon mot de passe
                            </h4>
                        </div>
                        <div className="card-body p-4">
                            <form onSubmit={handleSubmit}>
                                <div className="mb-3">
                                    <label htmlFor="currentPassword" className="form-label fw-semibold">
                                        Mot de passe actuel <span className="text-danger">*</span>
                                    </label>
                                    <div className="input-group">
                                        <span className="input-group-text">
                                            <i className="bi bi-lock"></i>
                                        </span>
                                        <input
                                            type="password"
                                            className={`form-control ${errors.currentPassword ? 'is-invalid' : ''}`}
                                            id="currentPassword"
                                            name="currentPassword"
                                            value={form.currentPassword}
                                            onChange={handleChange}
                                            placeholder="Votre mot de passe actuel"
                                            disabled={loading}
                                        />
                                        {errors.currentPassword && (
                                            <div className="invalid-feedback">{errors.currentPassword}</div>
                                        )}
                                    </div>
                                </div>

                                <div className="mb-3">
                                    <label htmlFor="newPassword" className="form-label fw-semibold">
                                        Nouveau mot de passe <span className="text-danger">*</span>
                                    </label>
                                    <div className="input-group">
                                        <span className="input-group-text">
                                            <i className="bi bi-key"></i>
                                        </span>
                                        <input
                                            type="password"
                                            className={`form-control ${errors.newPassword ? 'is-invalid' : ''}`}
                                            id="newPassword"
                                            name="newPassword"
                                            value={form.newPassword}
                                            onChange={handleChange}
                                            placeholder="Minimum 6 caractères"
                                            disabled={loading}
                                        />
                                        {errors.newPassword && (
                                            <div className="invalid-feedback">{errors.newPassword}</div>
                                        )}
                                    </div>
                                </div>

                                <div className="mb-4">
                                    <label htmlFor="confirmPassword" className="form-label fw-semibold">
                                        Confirmer le nouveau mot de passe <span className="text-danger">*</span>
                                    </label>
                                    <div className="input-group">
                                        <span className="input-group-text">
                                            <i className="bi bi-key-fill"></i>
                                        </span>
                                        <input
                                            type="password"
                                            className={`form-control ${errors.confirmPassword ? 'is-invalid' : ''}`}
                                            id="confirmPassword"
                                            name="confirmPassword"
                                            value={form.confirmPassword}
                                            onChange={handleChange}
                                            placeholder="Confirmez votre nouveau mot de passe"
                                            disabled={loading}
                                        />
                                        {errors.confirmPassword && (
                                            <div className="invalid-feedback">{errors.confirmPassword}</div>
                                        )}
                                    </div>
                                </div>

                                <div className="d-grid gap-2">
                                    <button
                                        type="submit"
                                        className="btn btn-primary"
                                        disabled={loading}
                                    >
                                        {loading ? (
                                            <>
                                                <span className="spinner-border spinner-border-sm me-2"></span>
                                                Modification en cours...
                                            </>
                                        ) : (
                                            <>
                                                <i className="bi bi-check-circle me-2"></i>
                                                Changer le mot de passe
                                            </>
                                        )}
                                    </button>
                                    <button
                                        type="button"
                                        className="btn btn-outline-secondary"
                                        onClick={() => navigate('/dashboard')}
                                        disabled={loading}
                                    >
                                        <i className="bi bi-x-circle me-2"></i>
                                        Annuler
                                    </button>
                                </div>
                            </form>

                            <div className="alert alert-info mt-4 mb-0">
                                <i className="bi bi-info-circle-fill me-2"></i>
                                <strong>Conseil de sécurité :</strong> Utilisez un mot de passe fort, avec au moins 8 caractères, mélangeant lettres majuscules, minuscules, chiffres et symboles.
                            </div>
                        </div>
                    </div>
                  </div>
            </div>
        </div>
    );
}

export default ChangePassword;