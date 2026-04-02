import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import apiService from '../../configuration/apiService';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';

const AdminRegister = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        email: '',
        firstName: '',
        name: '',
        phone: '',
        npi: '',
        password: '',
        confirmPassword: ''
    });
    const [adminSecret, setAdminSecret] = useState('');
    const [loading, setLoading] = useState(false);
    const [secretVisible, setSecretVisible] = useState(false);
    const [secretValid, setSecretValid] = useState(null);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const verifySecret = async () => {
        if (!adminSecret.trim()) {
            toast.warning('Veuillez entrer le code secret');
            return;
        }

        try {
            const response = await apiService.verifyAdminSecret(adminSecret);
            if (response.valid) {
                setSecretValid(true);
                toast.success('✅ Code secret valide !');
            } else {
                setSecretValid(false);
                toast.error('❌ Code secret invalide');
            }
        } catch (error) {
            console.error('Erreur:', error);
            toast.error('Erreur lors de la vérification');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (formData.password !== formData.confirmPassword) {
            toast.error('Les mots de passe ne correspondent pas');
            return;
        }

        if (formData.password.length < 6) {
            toast.error('Le mot de passe doit contenir au moins 6 caractères');
            return;
        }

        setLoading(true);
        try {
            const response = await apiService.registerAdmin(formData, adminSecret);
            
            if (response.success) {
                toast.success('🎉 Compte administrateur créé avec succès !');
                setTimeout(() => {
                    navigate('/login');
                }, 2000);
            } else {
                toast.error(response.error || 'Erreur lors de la création');
            }
        } catch (error) {
            console.error('Erreur:', error);
            toast.error('Erreur lors de l\'inscription');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container mt-5">
            <div className="row justify-content-center">
                <div className="col-md-8">
                    <div className="card shadow">
                        <div className="card-header bg-danger text-white">
                            <h4 className="mb-0">
                                <i className="bi bi-shield-lock me-2"></i>
                                Inscription Administrateur
                            </h4>
                        </div>
                        
                        <div className="card-body p-4">
                            {/* Section code secret */}
                            <div className="card bg-light mb-4">
                                <div className="card-body">
                                    <h6 className="mb-3">
                                        <i className="bi bi-key me-2"></i>
                                        Code secret administrateur
                                    </h6>
                                    <div className="input-group">
                                        <input
                                            type={secretVisible ? 'text' : 'password'}
                                            className="form-control"
                                            placeholder="Entrez le code secret"
                                            value={adminSecret}
                                            onChange={(e) => setAdminSecret(e.target.value)}
                                        />
                                        <button
                                            className="btn btn-outline-secondary"
                                            type="button"
                                            onClick={() => setSecretVisible(!secretVisible)}
                                        >
                                            <i className={`bi ${secretVisible ? 'bi-eye-slash' : 'bi-eye'}`}></i>
                                        </button>
                                        <button
                                            className="btn btn-primary"
                                            type="button"
                                            onClick={verifySecret}
                                        >
                                            Vérifier
                                        </button>
                                    </div>
                                    
                                    {secretValid === true && (
                                        <div className="alert alert-success mt-2 mb-0 py-2">
                                            <i className="bi bi-check-circle-fill me-2"></i>
                                            Code secret valide !
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Formulaire d'inscription */}
                            {secretValid === true && (
                                <form onSubmit={handleSubmit}>
                                    <div className="row">
                                        <div className="col-md-6 mb-3">
                                            <label className="form-label">Prénom *</label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                name="firstName"
                                                value={formData.firstName}
                                                onChange={handleChange}
                                                required
                                                disabled={loading}
                                            />
                                        </div>
                                        
                                        <div className="col-md-6 mb-3">
                                            <label className="form-label">Nom *</label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                name="name"
                                                value={formData.name}
                                                onChange={handleChange}
                                                required
                                                disabled={loading}
                                            />
                                        </div>
                                    </div>

                                    <div className="mb-3">
                                        <label className="form-label">Email *</label>
                                        <input
                                            type="email"
                                            className="form-control"
                                            name="email"
                                            value={formData.email}
                                            onChange={handleChange}
                                            required
                                            disabled={loading}
                                        />
                                    </div>

                                    <div className="row">
                                        <div className="col-md-6 mb-3">
                                            <label className="form-label">Téléphone</label>
                                            <input
                                                type="tel"
                                                className="form-control"
                                                name="phone"
                                                value={formData.phone}
                                                onChange={handleChange}
                                                disabled={loading}
                                            />
                                        </div>
                                        
                                        <div className="col-md-6 mb-3">
                                            <label className="form-label">NPI</label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                name="npi"
                                                value={formData.npi}
                                                onChange={handleChange}
                                                placeholder="Laissez vide pour auto-génération"
                                                disabled={loading}
                                            />
                                        </div>
                                    </div>

                                    <div className="row">
                                        <div className="col-md-6 mb-3">
                                            <label className="form-label">Mot de passe *</label>
                                            <input
                                                type="password"
                                                className="form-control"
                                                name="password"
                                                value={formData.password}
                                                onChange={handleChange}
                                                required
                                                disabled={loading}
                                            />
                                            <small className="text-muted">Minimum 6 caractères</small>
                                        </div>
                                        
                                        <div className="col-md-6 mb-3">
                                            <label className="form-label">Confirmer le mot de passe *</label>
                                            <input
                                                type="password"
                                                className="form-control"
                                                name="confirmPassword"
                                                value={formData.confirmPassword}
                                                onChange={handleChange}
                                                required
                                                disabled={loading}
                                            />
                                        </div>
                                    </div>

                                    <div className="alert alert-info mt-3">
                                        <i className="bi bi-info-circle-fill me-2"></i>
                                        <strong>Rôle attribué :</strong> ADMINISTRATEUR
                                        <br />
                                        <small>L'administrateur a tous les droits sur la plateforme.</small>
                                    </div>

                                    <div className="d-flex gap-2 mt-4">
                                        <button
                                            type="button"
                                            className="btn btn-outline-secondary"
                                            onClick={() => navigate('/login')}
                                            disabled={loading}
                                        >
                                            <i className="bi bi-arrow-left me-1"></i>
                                            Retour
                                        </button>
                                        <button
                                            type="submit"
                                            className="btn btn-danger flex-grow-1"
                                            disabled={loading}
                                        >
                                            {loading ? (
                                                <>
                                                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                                    Création en cours...
                                                </>
                                            ) : (
                                                <>
                                                    <i className="bi bi-shield-check me-2"></i>
                                                    Créer le compte administrateur
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

export default AdminRegister;