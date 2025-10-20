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
        role: ''
    });
    
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});
    const navigate = useNavigate();

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
        // Effacer l'erreur du champ quand l'utilisateur modifie
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
        if (!form.role) newErrors.role = 'Le rôle est obligatoire';

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
            const response = await axios.post('http://localhost:8080/mut/register', form);
            
            if (response.status === 200 || response.status === 201) {
               // alert('Membre inscrit avec succès !');
               toast.success('Membre inscrit avec succès !');
                // Réinitialiser le formulaire
                setForm({
                    name: '', 
                    firstName: '', 
                    email: '', 
                    password: '', 
                    npi: '', 
                    phone: '', 
                    role: ''
                });
                setErrors({});
                navigate('/login');
            }
        } catch (error) {
           // console.error('Erreur d\'inscription:', error);
         //  toast.error('Erreur d\'inscription. Veuillez réessayer.');
            
            if (error.response?.status === 400) {
                const errorMessage = error.response.data?.message || 'Données invalides';
               // alert(`Erreur: ${errorMessage}`);
               toast.error(`Erreur: ${errorMessage}`);
            } else if (error.response?.status === 409) {
               // alert('Cet email ou NPI est déjà utilisé');
                toast.error('Cet email ou NPI est déjà utilisé');
            } else {
              //  alert('Erreur lors de l\'inscription. Veuillez réessayer.');
                toast.error('Erreur lors de l\'inscription. Veuillez réessayer.');
            }
        } finally {
            setLoading(false);
        }
    };

    const getRoleLabel = (role) => {
        const roles = {
            'MEMBER': 'Membre',
            'SECRETARY': 'Secrétaire',
            'PRESIDENT': 'Président',
            'TREASURER': 'Trésorier'
        };
        return roles[role] || role;
    };

    return (
        <div className="container">
            <div className="row justify-content-center">
                <div className="col-md-8 col-lg-6">
                    <div className="card shadow">
                        <div className="card-header bg-primary text-white">
                            <h4 className="card-title mb-0">
                                <i className="bi bi-person-plus me-2"></i>
                                Inscription d'un Nouveau Membre
                            </h4>
                        </div>
                        <div className="card-body p-4">
                            <form onSubmit={handleSubmit} noValidate>
                                <div className="row">
                                    <div className="col-md-6">
                                        <div className="form-group mb-3">
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
                                    </div>
                                    <div className="col-md-6">
                                        <div className="form-group mb-3">
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
                                </div>

                                <div className="form-group mb-3">
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

                                <div className="form-group mb-3">
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
                                    <div className="col-md-6">
                                        <div className="form-group mb-3">
                                            <label htmlFor="npi" className="form-label fw-semibold">
                                                NPI *
                                            </label>
                                            <input 
                                                type="number" 
                                                className={`form-control ${errors.npi ? 'is-invalid' : ''}`}
                                                id="npi" 
                                                name="npi" 
                                                value={form.npi} 
                                                onChange={handleChange}
                                                placeholder="Numéro personnel d'identification"
                                                disabled={loading}
                                            />
                                            {errors.npi && (
                                                <div className="invalid-feedback">{errors.npi}</div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="col-md-6">
                                        <div className="form-group mb-3">
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
                                </div>

                                <div className="form-group mb-4">
                                    <label htmlFor="role" className="form-label fw-semibold">
                                        Rôle *
                                    </label>
                                    <select 
                                        id="role" 
                                        name="role" 
                                        className={`form-control ${errors.role ? 'is-invalid' : ''}`}
                                        value={form.role} 
                                        onChange={handleChange}
                                        disabled={loading}
                                    >
                                        <option value="">Sélectionner un rôle</option>
                                        <option value="MEMBER">Membre</option>
                                        <option value="SECRETARY">Secrétaire</option>
                                        <option value="PRESIDENT">Président</option>
                                        <option value="TREASURER">Trésorier</option>
                                    </select>
                                    {errors.role && (
                                        <div className="invalid-feedback">{errors.role}</div>
                                    )}
                                </div>

                                <div className="d-grid gap-2 d-md-flex justify-content-md-end">
                                    <button 
                                        type="button" 
                                        className="btn btn-outline-secondary me-md-2"
                                        onClick={() => navigate('/login')}
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
                                                Inscrire le membre
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