// src/configuration/ForgotPassword.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import 'bootstrap/dist/css/bootstrap.min.css';

function ForgotPassword() {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [emailSent, setEmailSent] = useState(false);
    const navigate = useNavigate();

    const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8081';

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const response = await axios.post(`${API_URL}/mutuelle/auth/forgot-password`, { email });
            
            if (response.data.success) {
                setEmailSent(true);
                toast.success(response.data.message);
            } else {
                toast.error(response.data.message);
            }
        } catch (error) {
            console.error('Erreur:', error);
            toast.error(error.response?.data?.message || 'Erreur lors de l\'envoi de l\'email');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container mt-5">
            <div className="row justify-content-center">
                <div className="col-md-6 col-lg-4">
                    <div className="card shadow">
                        <div className="card-header bg-primary text-white text-center py-3">
                            <h4 className="mb-0">
                                <i className="bi bi-key me-2"></i>
                                Mot de passe oublié
                            </h4>
                        </div>
                        <div className="card-body p-4">
                            {!emailSent ? (
                                <>
                                    <p className="text-muted mb-4">
                                        Saisissez votre adresse email. Vous recevrez un lien pour réinitialiser votre mot de passe.
                                    </p>
                                    <form onSubmit={handleSubmit}>
                                        <div className="mb-3">
                                            <label htmlFor="email" className="form-label fw-semibold">
                                                Email
                                            </label>
                                            <div className="input-group">
                                                <span className="input-group-text">
                                                    <i className="bi bi-envelope"></i>
                                                </span>
                                                <input
                                                    type="email"
                                                    className="form-control"
                                                    id="email"
                                                    value={email}
                                                    onChange={(e) => setEmail(e.target.value)}
                                                    placeholder="votre@email.com"
                                                    required
                                                    disabled={loading}
                                                />
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
                                                        Envoi en cours...
                                                    </>
                                                ) : (
                                                    <>
                                                        <i className="bi bi-send me-2"></i>
                                                        Envoyer le lien
                                                    </>
                                                )}
                                            </button>
                                            <button
                                                type="button"
                                                className="btn btn-outline-secondary"
                                                onClick={() => navigate('/login')}
                                                disabled={loading}
                                            >
                                                <i className="bi bi-arrow-left me-2"></i>
                                                Retour à la connexion
                                            </button>
                                        </div>
                                    </form>
                                </>
                            ) : (
                                <div className="text-center">
                                    <div className="mb-4">
                                        <i className="bi bi-envelope-check text-success" style={{ fontSize: '4rem' }}></i>
                                    </div>
                                    <h5 className="mb-3">Email envoyé !</h5>
                                    <p className="text-muted">
                                        Un email a été envoyé à <strong>{email}</strong>.<br/>
                                        Vérifiez votre boîte de réception et suivez les instructions pour réinitialiser votre mot de passe.
                                    </p>
                                    <button
                                        className="btn btn-primary mt-3"
                                        onClick={() => navigate('/login')}
                                    >
                                        <i className="bi bi-box-arrow-in-right me-2"></i>
                                        Retour à la connexion
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ForgotPassword;