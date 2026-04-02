import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "bootstrap/dist/css/bootstrap.min.css";

export default function AddContributionPeriod() {
  const navigate = useNavigate();

<<<<<<< HEAD
  const [form, setForm] = useState({
    startDate: "",
    endDate: "",
    name: "",
    amount: "",
    status: "",
    description: "",
  });
=======
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [authChecked, setAuthChecked] = useState(false);
    const [success, setSuccess] = useState('');
>>>>>>> 0ca80779bd2df063c6c22313cd408bc6f07a9320

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [authChecked, setAuthChecked] = useState(false);

<<<<<<< HEAD
  // =============================
  // 🔐 Vérification Auth
  // =============================
  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token || token === "undefined" || token === "null") {
      setError("Authentification requise. Redirection...");
      setTimeout(() => navigate("/login"), 2000);
    } else {
      setAuthChecked(true);
=======
    // URL de base de l'API
    const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8081';

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

    const validateForm = () => {
        if (!form.startDate) {
            setError('La date de début est obligatoire');
            return false;
        }
        if (!form.endDate) {
            setError('La date de fin est obligatoire');
            return false;
        }
        if (new Date(form.startDate) >= new Date(form.endDate)) {
            setError('La date de fin doit être postérieure à la date de début');
            return false;
        }
        if (!form.amount || parseFloat(form.amount) <= 0) {
            setError('Le montant doit être supérieur à 0');
            return false;
        }
        if (!form.status) {
            setError('Le statut est obligatoire');
            return false;
        }
        if (!form.description.trim()) {
            setError('La description est obligatoire');
            return false;
        }
        return true;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!checkAuthentication()) {
            return;
        }

        if (!validateForm()) {
            return;
        }

        setLoading(true);
        setError('');
        setSuccess('');

        try {
            const token = localStorage.getItem('token');

            if (!token) {
                setError('Token d\'authentification manquant');
                setLoading(false);
                return;
            }

            const isActive = form.status === 'ACTIVE';

            // Préparation des données pour l'API
            const apiData = {
                startDate: form.startDate,
                endDate: form.endDate,
                name: form.name || `Campagne ${new Date(form.startDate).toLocaleDateString()} - ${new Date(form.endDate).toLocaleDateString()}`,
                individualAmount: parseFloat(form.amount),
               // status: form.status,
               active: isActive,
                description: form.description
            };

            console.log('📤 Données envoyées:', apiData);

            // ✅ CORRECTION : Utilisation du bon endpoint et de l'URL de base
            const response = await axios.post(
                `${API_URL}/mutuelle/contribution_period`,  // ← CORRIGÉ : /mutuelle/ au lieu de /mut/
                apiData,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );
            
            console.log(' Réponse reçue:', response.data);
            
            setSuccess('Campagne de cotisation ajoutée avec succès !');
            
            // Réinitialiser le formulaire
            setForm({
                startDate: '', 
                endDate: '',
                name: '', 
                amount: '',
                status: '',
                description: ''
            });

            // Redirection après 2 secondes
            setTimeout(() => {
                navigate('/dashboard');
            }, 2000);
            
        } catch (error) {
            console.error(' Erreur détaillée:', error);
            
            if (error.response?.status === 401) {
                setError('Session expirée. Veuillez vous reconnecter.');
                localStorage.removeItem('token');
                setTimeout(() => {
                    navigate('/login');
                }, 3000);
                return;
            }
            
            if (error.response?.status === 403) {
                setError('Vous n\'avez pas les permissions nécessaires pour créer une campagne de cotisation.');
                return;
            }
            
            let errorMessage = 'Erreur lors de l\'ajout de la campagne de cotisation';
            
            if (error.response?.data) {
                if (typeof error.response.data === 'string') {
                    errorMessage = error.response.data;
                } else if (error.response.data.message) {
                    errorMessage = error.response.data.message;
                } else if (error.response.data.error) {
                    errorMessage = error.response.data.error;
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
>>>>>>> 0ca80779bd2df063c6c22313cd408bc6f07a9320
    }
  }, [navigate]);

  const getAuthHeaders = () => {
    const token = localStorage.getItem("token");
    return {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };
  };

  // =============================
  // 🔄 Handle Change
  // =============================
  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  // =============================
  // 📤 Submit
  // =============================
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const apiData = {
        startDate: form.startDate,
        endDate: form.endDate,
        name: form.name,
        individualAmount: parseFloat(form.amount),
        status: form.status,
        description: form.description,
      };

      await axios.post(
        "http://localhost:8080/mutuelle/contribution_period",
        apiData,
        { headers: getAuthHeaders() }
      );

      alert("Campagne de cotisation ajoutée avec succès !");
      navigate("/dashboard");

    } catch (err) {
      console.error(err);

      if (err.response?.status === 401) {
        setError("Session expirée. Veuillez vous reconnecter.");
        localStorage.removeItem("token");
        setTimeout(() => navigate("/login"), 2000);
        return;
      }

      setError(
        err.response?.data?.message ||
          "Erreur lors de l'ajout de la campagne."
      );
    } finally {
      setLoading(false);
    }
  };

  // =============================
  // ⏳ Loader Auth
  // =============================
  if (!authChecked) {
    return (
<<<<<<< HEAD
      <div className="container mt-4 text-center">
        <div className="spinner-border text-primary" role="status" />
        <p className="mt-3">Vérification de l'authentification...</p>
      </div>
=======
        <div className="container mt-4">
            <div className="row justify-content-center">
                <div className="col-md-8">
                    <div className="card shadow">
                        <div className="card-header bg-primary text-white">
                            <h3 className="mb-0">
                                <i className="bi bi-calendar-plus me-2"></i>
                                Ajouter une campagne de Cotisation
                            </h3>
                        </div>
                        <div className="card-body p-4">
                            {error && (
                                <div className="alert alert-danger alert-dismissible fade show" role="alert">
                                    <i className="bi bi-exclamation-triangle-fill me-2"></i>
                                    <strong>Erreur:</strong> {error}
                                    <button type="button" className="btn-close" onClick={() => setError('')}></button>
                                </div>
                            )}
                            
                            {success && (
                                <div className="alert alert-success alert-dismissible fade show" role="alert">
                                    <i className="bi bi-check-circle-fill me-2"></i>
                                    <strong>Succès:</strong> {success}
                                    <button type="button" className="btn-close" onClick={() => setSuccess('')}></button>
                                </div>
                            )}
                            
                            <form onSubmit={handleSubmit}>
                                <div className="row">
                                    <div className="col-md-6">
                                        <div className="form-group mb-3">
                                            <label htmlFor="startDate" className="form-label fw-semibold">
                                                Date de Début <span className="text-danger">*</span>
                                            </label>
                                            <input 
                                                type="date" 
                                                className="form-control" 
                                                id="startDate" 
                                                name="startDate" 
                                                value={form.startDate} 
                                                onChange={handleChange} 
                                                required 
                                                disabled={loading}
                                            />
                                            <small className="text-muted">Date de début de la campagne</small>
                                        </div>
                                    </div>
                                    <div className="col-md-6">
                                        <div className="form-group mb-3">
                                            <label htmlFor="endDate" className="form-label fw-semibold">
                                                Date de Fin <span className="text-danger">*</span>
                                            </label>
                                            <input 
                                                type="date" 
                                                className="form-control" 
                                                id="endDate" 
                                                name="endDate" 
                                                value={form.endDate} 
                                                onChange={handleChange} 
                                                required 
                                                disabled={loading}
                                            />  
                                            <small className="text-muted">Date de fin de la campagne</small>
                                        </div>
                                    </div>
                                </div>

                                <div className="form-group mb-3">
                                    <label htmlFor="name" className="form-label fw-semibold">
                                        Nom de la campagne
                                    </label>
                                    <input 
                                        type="text" 
                                        className="form-control" 
                                        id="name" 
                                        name="name" 
                                        value={form.name} 
                                        onChange={handleChange} 
                                        placeholder="Ex: Campagne du premier trimestre 2024"
                                        disabled={loading}
                                    />
                                    <small className="text-muted">Optionnel - Si vide, un nom sera généré automatiquement</small>
                                </div>

                                <div className="row">
                                    <div className="col-md-6">
                                        <div className="form-group mb-3">
                                            <label htmlFor="amount" className="form-label fw-semibold">
                                                Montant Individuel (FCFA) <span className="text-danger">*</span>
                                            </label>
                                            <div className="input-group">
                                                <span className="input-group-text">FCFA</span>
                                                <input 
                                                    type="number" 
                                                    step="100"
                                                    min="100"
                                                    className="form-control" 
                                                    id="amount" 
                                                    name="amount" 
                                                    value={form.amount} 
                                                    onChange={handleChange} 
                                                    placeholder="1000" 
                                                    required
                                                    disabled={loading}
                                                />
                                            </div>
                                            <small className="text-muted">Montant que chaque membre doit payer</small>
                                        </div>
                                    </div>
                                    <div className="col-md-6">
                                        <div className="form-group mb-3">
                                            <label htmlFor="status" className="form-label fw-semibold">
                                                Statut <span className="text-danger">*</span>
                                            </label>
                                            <select 
                                                className="form-control" 
                                                id="status"
                                                name="status"
                                                value={form.status}
                                                onChange={handleChange}
                                                required
                                                disabled={loading}
                                            >
                                                <option value="">Sélectionner le statut</option>
                                                <option value="ACTIVE">Active</option>
                                                <option value="INACTIVE">Inactive</option>
                                                <option value="PENDING">En attente</option>
                                            </select>
                                            <small className="text-muted">Statut de la campagne</small>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="form-group mb-4">
                                    <label htmlFor="description" className="form-label fw-semibold">
                                        Description <span className="text-danger">*</span>
                                    </label>
                                    <textarea 
                                        className="form-control" 
                                        id="description" 
                                        name="description" 
                                        value={form.description} 
                                        onChange={handleChange} 
                                        placeholder="Description détaillée de la campagne de cotisation..." 
                                        rows="3"
                                        required
                                        disabled={loading}
                                    />
                                    <small className="text-muted">Description claire de l'objectif de la campagne</small>
                                </div>
                                
                                <div className="d-grid gap-2 d-md-flex justify-content-md-end">
                                    <button 
                                        type="button" 
                                        className="btn btn-outline-secondary me-md-2 px-4"
                                        onClick={() => navigate('/dashboard')}
                                        disabled={loading}
                                    >
                                        <i className="bi bi-x-circle me-2"></i>
                                        Annuler
                                    </button>
                                    <button 
                                        type="submit" 
                                        className="btn btn-primary px-4"
                                        disabled={loading}
                                    >
                                        {loading ? (
                                            <>
                                                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                                Ajout en cours...
                                            </>
                                        ) : (
                                            <>
                                                <i className="bi bi-check-circle me-2"></i>
                                                Ajouter la campagne
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>

                            {/* Instructions */}
                            <div className="alert alert-info mt-4 mb-0">
                                <i className="bi bi-info-circle-fill me-2"></i>
                                <strong>Note :</strong> Une fois la campagne créée, les membres pourront effectuer leurs cotisations pendant la période définie.
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
>>>>>>> 0ca80779bd2df063c6c22313cd408bc6f07a9320
    );
  }

<<<<<<< HEAD
  // =============================
  // 🖥️ UI
  // =============================
  return (
    <div className="container mt-4">
      <div className="row justify-content-center">
        <div className="col-md-8">
          <div className="card shadow">
            <div className="card-header bg-primary text-white">
              <h3 className="mb-0">
                Ajouter une campagne de Cotisation
              </h3>
            </div>

            <div className="card-body">
              {error && (
                <div className="alert alert-danger">
                  <strong>Erreur :</strong> {error}
                </div>
              )}

              <form onSubmit={handleSubmit}>
                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label className="form-label">
                      Date de Début *
                    </label>
                    <input
                      type="date"
                      name="startDate"
                      className="form-control"
                      value={form.startDate}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="col-md-6 mb-3">
                    <label className="form-label">
                      Date de Fin *
                    </label>
                    <input
                      type="date"
                      name="endDate"
                      className="form-control"
                      value={form.endDate}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>

                <div className="mb-3">
                  <label className="form-label">
                    Nom de la campagne
                  </label>
                  <input
                    type="text"
                    name="name"
                    className="form-control"
                    value={form.name}
                    onChange={handleChange}
                    placeholder="Campagne T1 2026"
                  />
                </div>

                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label className="form-label">
                      Montant Individuel *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      name="amount"
                      className="form-control"
                      value={form.amount}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="col-md-6 mb-3">
                    <label className="form-label">
                      Statut *
                    </label>
                    <select
                      name="status"
                      className="form-control"
                      value={form.status}
                      onChange={handleChange}
                      required
                    >
                      <option value="">
                        Sélectionner
                      </option>
                      <option value="ACTIVE">
                        Active
                      </option>
                      <option value="INACTIVE">
                        Inactive
                      </option>
                      <option value="PENDING">
                        En attente
                      </option>
                    </select>
                  </div>
                </div>

                <div className="mb-4">
                  <label className="form-label">
                    Description *
                  </label>
                  <textarea
                    name="description"
                    className="form-control"
                    rows="3"
                    value={form.description}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="d-flex justify-content-end gap-2">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => navigate("/dashboard")}
                    disabled={loading}
                  >
                    Annuler
                  </button>

                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={loading}
                  >
                    {loading
                      ? "Ajout en cours..."
                      : "Ajouter la campagne"}
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
=======
export default AddContributionPeriod;
>>>>>>> 0ca80779bd2df063c6c22313cd408bc6f07a9320
