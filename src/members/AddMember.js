// src/members/AddMember.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import axios from 'axios';
import { toast } from 'react-toastify';

function AddMember() {
    const [form, setForm] = useState({
        name: '',
        firstName: '',
        email: '',
        password: '',
        npi: '',
        phone: '',
        role: 'MEMBER'
    });

    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});
    const navigate = useNavigate();

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const validateForm = () => {
        const newErrors = {};

        if (!form.name.trim()) newErrors.name = 'Le nom est obligatoire';
        if (!form.firstName.trim()) newErrors.firstName = 'Le prénom est obligatoire';
        if (!form.email.trim()) {
            newErrors.email = 'L\'email est obligatoire';
        } else if (!/\S+@\S+\.\S+/.test(form.email)) {
            newErrors.email = 'Format d\'email invalide';
        }
        if (!form.password) {
            newErrors.password = 'Le mot de passe est obligatoire';
        } else if (form.password.length < 6) {
            newErrors.password = 'Le mot de passe doit contenir au moins 6 caractères';
        }
        if (!form.npi) newErrors.npi = 'Le NPI est obligatoire';
        if (!form.phone.trim()) {
            newErrors.phone = 'Le téléphone est obligatoire';
        } else if (!/^[0-9+\-\s()]{10,}$/.test(form.phone)) {
            newErrors.phone = 'Format de téléphone invalide';
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
            // Log pour voir ce qui est envoyé
            console.log('Données envoyées:', JSON.stringify(form, null, 2));
            
            const response = await axios.post('http://localhost:8081/mutuelle/auth/register', form, {
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            console.log('Réponse:', response.data);

            if (response.status === 200 || response.status === 201) {
                toast.success('Inscription réussie ! Vous pouvez maintenant vous connecter.');
                setTimeout(() => {
                    navigate('/login');
                }, 2000);
            }
        } catch (error) {
            console.error('Erreur d\'inscription:', error);
            
            if (error.response) {
                // Le serveur a répondu avec une erreur
                console.error('Détails de l\'erreur:', {
                    status: error.response.status,
                    data: error.response.data,
                    headers: error.response.headers
                });
                
                const errorMessage = error.response.data?.message || 
                                    error.response.data?.error || 
                                    'Erreur lors de l\'inscription';
                
                toast.error(`Erreur ${error.response.status}: ${errorMessage}`);
            } else if (error.request) {
                // La requête a été faite mais pas de réponse
                console.error('Pas de réponse du serveur:', error.request);
                toast.error('Le serveur ne répond pas. Vérifiez que le backend est démarré.');
            } else {
                // Erreur de configuration
                toast.error('Erreur: ' + error.message);
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container mt-4">
            <div className="row justify-content-center">
                <div className="col-md-8 col-lg-6">
                    <div className="card shadow">
                        <div className="card-header bg-primary text-white">
                            <h4 className="card-title mb-0">
                                <i className="bi bi-person-plus me-2"></i>
                                Inscription
                            </h4>
                        </div>
                        <div className="card-body p-4">
                            <form onSubmit={handleSubmit} noValidate>
                                <div className="row">
                                    <div className="col-md-6 mb-3">
                                        <label htmlFor="name" className="form-label fw-semibold">
                                            Nom *
                                        </label>
                                        <input
                                            type="text"
                                            className={`form-control ${errors.name ? 'is-invalid' : ''}`}
                                            id="name"
                                            name="name"
                                            value={form.name}
                                            onChange={handleChange}
                                            placeholder="Entrez le nom"
                                            disabled={loading}
                                        />
                                        {errors.name && (
                                            <div className="invalid-feedback">{errors.name}</div>
                                        )}
                                    </div>
                                    <div className="col-md-6 mb-3">
                                        <label htmlFor="firstName" className="form-label fw-semibold">
                                            Prénom *
                                        </label>
                                        <input
                                            type="text"
                                            className={`form-control ${errors.firstName ? 'is-invalid' : ''}`}
                                            id="firstName"
                                            name="firstName"
                                            value={form.firstName}
                                            onChange={handleChange}
                                            placeholder="Entrez le prénom"
                                            disabled={loading}
                                        />
                                        {errors.firstName && (
                                            <div className="invalid-feedback">{errors.firstName}</div>
                                        )}
                                    </div>
                                </div>

                                <div className="mb-3">
                                    <label htmlFor="email" className="form-label fw-semibold">
                                        Email *
                                    </label>
                                    <input
                                        type="email"
                                        className={`form-control ${errors.email ? 'is-invalid' : ''}`}
                                        id="email"
                                        name="email"
                                        value={form.email}
                                        onChange={handleChange}
                                        placeholder="exemple@email.com"
                                        disabled={loading}
                                    />
                                    {errors.email && (
                                        <div className="invalid-feedback">{errors.email}</div>
                                    )}
                                </div>

                                <div className="mb-3">
                                    <label htmlFor="password" className="form-label fw-semibold">
                                        Mot de passe *
                                    </label>
                                    <input
                                        type="password"
                                        className={`form-control ${errors.password ? 'is-invalid' : ''}`}
                                        id="password"
                                        name="password"
                                        value={form.password}
                                        onChange={handleChange}
                                        placeholder="Minimum 6 caractères"
                                        disabled={loading}
                                    />
                                    {errors.password && (
                                        <div className="invalid-feedback">{errors.password}</div>
                                    )}
                                </div>

                                <div className="row">
                                    <div className="col-md-6 mb-3">
                                        <label htmlFor="npi" className="form-label fw-semibold">
                                            NPI *
                                        </label>
                                        <input
                                            type="text"
                                            className={`form-control ${errors.npi ? 'is-invalid' : ''}`}
                                            id="npi"
                                            name="npi"
                                            value={form.npi}
                                            onChange={handleChange}
                                            placeholder="Numéro personnel"
                                            disabled={loading}
                                        />
                                        {errors.npi && (
                                            <div className="invalid-feedback">{errors.npi}</div>
                                        )}
                                    </div>
                                    <div className="col-md-6 mb-3">
                                        <label htmlFor="phone" className="form-label fw-semibold">
                                            Téléphone *
                                        </label>
                                        <input
                                            type="tel"
                                            className={`form-control ${errors.phone ? 'is-invalid' : ''}`}
                                            id="phone"
                                            name="phone"
                                            value={form.phone}
                                            onChange={handleChange}
                                            placeholder="Ex: +229 01 00 00 00"
                                            disabled={loading}
                                        />
                                        {errors.phone && (
                                            <div className="invalid-feedback">{errors.phone}</div>
                                        )}
                                    </div>
                                </div>

                                <div className="mb-4">
                                    <label htmlFor="role" className="form-label fw-semibold">
                                        Rôle
                                    </label>
                                    <select
                                        id="role"
                                        name="role"
                                        className="form-control"
                                        value={form.role}
                                        onChange={handleChange}
                                        disabled={loading}
                                    >
                                        <option value="MEMBER">Membre</option>
                                        <option value="SECRETARY">Secrétaire</option>
                                        <option value="PRESIDENT">Président</option>
                                        <option value="TREASURER">Trésorier</option>
                                    </select>
                                </div>

                                <div className="d-flex justify-content-end gap-2">
                                    <button
                                        type="button"
                                        className="btn btn-outline-secondary"
                                        onClick={() => navigate('/')}
                                        disabled={loading}
                                    >
                                        Annuler
                                    </button>
                                    <button
                                        type="submit"
                                        className="btn btn-primary"
                                        disabled={loading}
                                    >
                                        {loading ? (
                                            <>
                                                <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                                                Inscription...
                                            </>
                                        ) : (
                                            <>
                                                <i className="bi bi-check-lg me-2"></i>
                                                S'inscrire
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
}

export default AddMember;