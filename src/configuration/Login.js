import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useKeycloak } from '../context/KeycloakContext';
import { toast } from 'react-toastify';

function Login() {
    const [form, setForm] = useState({
        email: '',
        password: ''
    });
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});
    const { authenticated, login } = useKeycloak();
    const navigate = useNavigate();

    useEffect(() => {
        if (authenticated) {
            navigate('/dashboard');
        }
    }, [authenticated, navigate]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const validateForm = () => {
        const newErrors = {};
        
        if (!form.email.trim()) {
            newErrors.email = "L'email est obligatoire";
        } else if (!/\S+@\S+\.\S+/.test(form.email)) {
            newErrors.email = "Format d'email invalide";
        }
        
        if (!form.password) {
            newErrors.password = "Le mot de passe est obligatoire";
        } else if (form.password.length < 6) {
            newErrors.password = "Le mot de passe doit contenir au moins 6 caractères";
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
            const result = await login(form.email, form.password);
            
            if (result.success) {
                toast.success('Connexion réussie !');
                navigate('/dashboard');
            } else {
                toast.error(result.message || 'Erreur de connexion');
            }
        } catch (error) {
            console.error('Erreur de connexion:', error);
            toast.error('Erreur de connexion. Veuillez réessayer.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container mt-5">
            <div className="row justify-content-center">
                <div className="col-md-6 col-lg-4">
                    <div className="card shadow border-0">
                        <div className="card-header bg-primary text-white text-center py-4">
                            <h4 className="mb-0">
                                <i className="bi bi-shield-lock me-2"></i>
                                Connexion
                            </h4>
                        </div>
                        <div className="card-body p-4">
                            <div className="text-center mb-4">
                                <i className="bi bi-person-circle text-primary" style={{ fontSize: '4rem' }}></i>
                            </div>
                            
                            <form onSubmit={handleSubmit} noValidate>
                                <div className="form-group mb-3">
                                    <label htmlFor="email" className="form-label fw-semibold">
                                        Email
                                    </label>
                                    <div className="input-group">
                                        <span className="input-group-text">
                                            <i className="bi bi-envelope"></i>
                                        </span>
                                        <input
                                            type="email"
                                            className={`form-control ${errors.email ? 'is-invalid' : ''}`}
                                            id="email"
                                            name="email"
                                            value={form.email}
                                            onChange={handleChange}
                                            placeholder="Entrez votre email"
                                            disabled={loading}
                                            autoComplete="username"
                                        />
                                        {errors.email && (
                                            <div className="invalid-feedback">{errors.email}</div>
                                        )}
                                    </div>
                                </div>

                                <div className="form-group mb-3">
                                    <label htmlFor="password" className="form-label fw-semibold">
                                        Mot de passe
                                    </label>
                                    <div className="input-group">
                                        <span className="input-group-text">
                                            <i className="bi bi-lock"></i>
                                        </span>
                                        <input
                                            type="password"
                                            className={`form-control ${errors.password ? 'is-invalid' : ''}`}
                                            id="password"
                                            name="password"
                                            value={form.password}
                                            onChange={handleChange}
                                            placeholder="Entrez votre mot de passe"
                                            disabled={loading}
                                            autoComplete="current-password"
                                        />
                                        {errors.password && (
                                            <div className="invalid-feedback">{errors.password}</div>
                                        )}
                                    </div>
                                </div>

                                <div className="d-flex justify-content-between align-items-center mb-3">
                                    <div className="form-check">
                                        <input
                                            type="checkbox"
                                            className="form-check-input"
                                            id="rememberMe"
                                            autoComplete="off"
                                        />
                                        <label className="form-check-label" htmlFor="rememberMe">
                                            Se souvenir de moi
                                        </label>
                                    </div>
                                    <a href="/forgot-password" className="text-decoration-none text-primary small">
                                        Mot de passe oublié ?
                                    </a>
                                </div>

                                <button
                                    type="submit"
                                    className="btn btn-primary w-100 mb-3"
                                    disabled={loading}
                                >
                                    {loading ? (
                                        <>
                                            <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                            Connexion en cours...
                                        </>
                                    ) : (
                                        <>
                                            <i className="bi bi-box-arrow-in-right me-2"></i>
                                            Se connecter
                                        </>
                                    )}
                                </button>
                            </form>

                            <hr className="my-4" />

                            <div className="text-center">
                                <p className="text-muted mb-2">
                                    Pas encore de compte ?
                                </p>
                                <a href="/register" className="btn btn-outline-primary w-100">
                                    <i className="bi bi-person-plus me-2"></i>
                                    Créer un compte
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Login;
