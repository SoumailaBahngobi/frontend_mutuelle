import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import 'bootstrap/dist/css/bootstrap.min.css';

const AddContributionPeriod = () => {
    const [form, setForm] = useState({
        startDate: '', 
        endDate: '',
        name: '',
        amount: '',
        status: '',
        description: ''   
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [authChecked, setAuthChecked] = useState(false);

    const navigate = useNavigate();

    useEffect(() => {
        checkAuthentication();
    }, []);

    const checkAuthentication = () => {
        const token = localStorage.getItem('token');
        
        if (!token || token === 'undefined' || token === 'null') {
            setError('Authentification requise. Redirection...');
            setTimeout(() => {
                navigate('/login');
            }, 2000);
            return false;
        }
        
        setAuthChecked(true);
        return true;
    };

    const handleChange = (e) => {
        setForm({ 
            ...form, 
            [e.target.name]: e.target.value 
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!checkAuthentication()) {
            return;
        }

        setLoading(true);
        setError('');

        try {
            const token = localStorage.getItem('token');

            if (!token) {
                setError('Token d\'authentification manquant');
                setLoading(false);
                return;
            }

            // ✅ CORRECTION : individualAmount au lieu de amount
            const apiData = {
                startDate: form.startDate,
                endDate: form.endDate,
                individualAmount: parseFloat(form.amount), // 🔥 Changement ici
                status: form.status,
                description: form.description
            };

            console.log('📤 Données envoyées:', apiData);

            const response = await axios.post(
                'http://localhost:8080/mut/contribution_period', 
                apiData,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );
            
            console.log('✅ Réponse reçue:', response.data);
            
            alert('Période de cotisation ajoutée avec succès !');
            setForm({
                startDate: '', 
                endDate: '',
                name: '', 
                amount: '',
                status: '',
                description: ''
            });
            navigate('/dashboard');
            
        } catch (error) {
            console.error('❌ Erreur détaillée:', error);
            
            if (error.response?.status === 401) {
                setError('Session expirée. Veuillez vous reconnecter.');
                localStorage.removeItem('token');
                setTimeout(() => {
                    navigate('/login');
                }, 3000);
                return;
            }
            
            let errorMessage = 'Erreur lors de l\'ajout de la période de cotisation';
            
            if (error.response?.data) {
                // Afficher le message d'erreur spécifique du backend
                if (typeof error.response.data === 'string') {
                    errorMessage = error.response.data;
                } else if (error.response.data.message) {
                    errorMessage = error.response.data.message;
                } else {
                    errorMessage = JSON.stringify(error.response.data);
                }
            } else if (error.message) {
                errorMessage = error.message;
            }
            
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    if (!authChecked) {
        return (
            <div className="container mt-4">
                <div className="row justify-content-center">
                    <div className="col-md-8">
                        <div className="card">
                            <div className="card-body text-center">
                                <div className="spinner-border text-primary" role="status">
                                    <span className="visually-hidden">Vérification de l'authentification...</span>
                                </div>
                                <p className="mt-3">Vérification de l'authentification...</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="container mt-4">
            <div className="row justify-content-center">
                <div className="col-md-8">
                    <div className="card">
                        <div className="card-header bg-primary text-white">
                            <h3 className="mb-0">Ajouter une Période de Cotisation</h3>
                        </div>
                        <div className="card-body">
                            {error && (
                                <div className="alert alert-danger" role="alert">
                                    <strong>Erreur:</strong> {error}
                                </div>
                            )}
                            
                            <form onSubmit={handleSubmit}>
                                <div className="row">
                                    <div className="col-md-6">
                                        <div className="form-group mb-3">
                                            <label htmlFor="startDate" className="form-label">
                                                Date de Début *
                                            </label>
                                            <input 
                                                type="date" 
                                                className="form-control" 
                                                id="startDate" 
                                                name="startDate" 
                                                value={form.startDate} 
                                                onChange={handleChange} 
                                                required 
                                            />
                                        </div>
                                    </div>
                                    <div className="col-md-6">
                                        <div className="form-group mb-3">
                                            <label htmlFor="endDate" className="form-label">
                                                Date de Fin *
                                            </label>
                                            <input 
                                                type="date" 
                                                className="form-control" 
                                                id="endDate" 
                                                name="endDate" 
                                                value={form.endDate} 
                                                onChange={handleChange} 
                                                required 
                                            />  
                                        </div>
                                    </div>
                                </div>

                                <div className="form-group mb-3">
                                    <label htmlFor="name" className="form-label">
                                        Nom de la Période (Optionnel)
                                    </label>
                                    <input 
                                        type="text" 
                                        className="form-control" 
                                        id="name" 
                                        name="name" 
                                        value={form.name} 
                                        onChange={handleChange} 
                                        placeholder="Ex: Période de Cotisation 2024"
                                    />
                                </div>

                                <div className="row">
                                    <div className="col-md-6">
                                        <div className="form-group mb-3">
                                            <label htmlFor="amount" className="form-label">
                                                Montant Individuel * {/* ✅ Mise à jour du label */}
                                            </label>
                                            <input 
                                                type="number" 
                                                step="0.01"
                                                min="0"
                                                className="form-control" 
                                                id="amount" 
                                                name="amount" 
                                                value={form.amount} 
                                                onChange={handleChange} 
                                                placeholder="0.00" 
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div className="col-md-6">
                                        <div className="form-group mb-3">
                                            <label htmlFor="status" className="form-label">
                                                Statut *
                                            </label>
                                            <select 
                                                className="form-control" 
                                                id="status"
                                                name="status"
                                                value={form.status}
                                                onChange={handleChange}
                                                required
                                            >
                                                <option value="">Sélectionner le statut</option>
                                                <option value="ACTIVE">Active</option>
                                                <option value="INACTIVE">Inactive</option>
                                                <option value="PENDING">En attente</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="form-group mb-4">
                                    <label htmlFor="description" className="form-label">
                                        Description *
                                    </label>
                                    <textarea 
                                        className="form-control" 
                                        id="description" 
                                        name="description" 
                                        value={form.description} 
                                        onChange={handleChange} 
                                        placeholder="Description de la période de cotisation..." 
                                        rows="3"
                                        required
                                    />
                                </div>
                                
                                <div className="d-grid gap-2 d-md-flex justify-content-md-end">
                                    <button 
                                        type="button" 
                                        className="btn btn-secondary me-md-2"
                                        onClick={() => navigate('/dashboard')}
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
                                                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                                Ajout en cours...
                                            </>
                                        ) : (
                                            'Ajouter la Période de Cotisation'
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

export default AddContributionPeriod;