<<<<<<< HEAD
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import axios from "axios";
import { toast } from "react-toastify";

function AddMember() {
  const [form, setForm] = useState({
    name: "",
    firstName: "",
    email: "",
    password: "",
    npi: "",
    phone: "",
    role: "",
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();

  // =============================
  // 🔄 Handle Change
  // =============================
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };
=======
// src/members/AddMember.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useKeycloak } from '../context/KeycloakContext';

function AddMember() {
    const { authenticated, getToken } = useKeycloak();
    const [form, setForm] = useState({
        name: '',
        firstName: '',
        email: '',
        password: '',
        npi: '',
        phone: '',
        role: 'MEMBER' // Toujours MEMBER à l'inscription
    });

    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});
    const navigate = useNavigate();

    // Vérifier si l'utilisateur est admin pour afficher les options d'admin
    const isAdmin = authenticated && getToken() &&
        (localStorage.getItem('userRole') === 'ADMIN' ||
            localStorage.getItem('userRole') === 'PRESIDENT' ||
            localStorage.getItem('userRole') === 'SECRETARY' ||
            localStorage.getItem('userRole') === 'TREASURER');

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
>>>>>>> 0ca80779bd2df063c6c22313cd408bc6f07a9320

  // =============================
  // ✅ Validation
  // =============================
  const validateForm = () => {
    const newErrors = {};

<<<<<<< HEAD
    if (!form.name.trim()) newErrors.name = "Le nom est obligatoire";
    if (!form.firstName.trim()) newErrors.firstName = "Le prénom est obligatoire";

    if (!form.email.trim()) newErrors.email = "L'email est obligatoire";
    else if (!/\S+@\S+\.\S+/.test(form.email))
      newErrors.email = "Format d'email invalide";

    if (!form.password) newErrors.password = "Le mot de passe est obligatoire";
    else if (form.password.length < 6)
      newErrors.password = "Le mot de passe doit contenir au moins 6 caractères";

    if (!form.npi) newErrors.npi = "Le NPI est obligatoire";

    if (!form.phone.trim()) newErrors.phone = "Le téléphone est obligatoire";
    else if (!/^[0-9+\-\s()]{10,}$/.test(form.phone))
      newErrors.phone = "Format de téléphone invalide";

    if (!form.role) newErrors.role = "Le rôle est obligatoire";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // =============================
  // 🔐 Submit
  // =============================
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    try {
      const response = await axios.post("http://localhost:8080/mutuelle/register", form);
      if (response.status === 200 || response.status === 201) {
        toast.success("Membre inscrit avec succès !");
        setForm({
          name: "",
          firstName: "",
          email: "",
          password: "",
          npi: "",
          phone: "",
          role: "",
        });
        setErrors({});
        navigate("/login");
      }
    } catch (error) {
      if (error.response?.status === 400) {
        toast.error(error.response.data?.message || "Données invalides");
      } else if (error.response?.status === 409) {
        toast.error("Cet email ou NPI est déjà utilisé");
      } else {
        toast.error("Erreur lors de l'inscription. Veuillez réessayer.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mt-5">
      <div className="row justify-content-center">
        <div className="col-md-8 col-lg-6">
          <div className="card shadow">
            <div className="card-header bg-primary text-white">
              <h4 className="card-title mb-0">
                <i className="bi bi-person-plus me-2"></i>
                Inscription d'un Nouveau Membre
              </h4>
=======
    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        setLoading(true);

        // Préparer les données - le rôle est toujours MEMBER
        const userData = {
            name: form.name,
            firstName: form.firstName,
            email: form.email,
            password: form.password,
            npi: form.npi,
            phone: form.phone,
            role: 'MEMBER' // Forcé à MEMBER
        };

        try {
            //console.log('Données envoyées:', JSON.stringify(userData, null, 2));
            toast.info('Envoi de l\'inscription en cours...', { autoClose: 2000 });

            const response = await axios.post('http://localhost:8081/mutuelle/auth/register', userData, {
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            console.log('Réponse:', response.data);

            if (response.status === 200 || response.status === 201) {
                toast.success('Inscription réussie ! Vous êtes maintenant membre.');
                setTimeout(() => {
                    navigate('/login');
                }, 2000);
            }
        } catch (error) {
            console.error('Erreur d\'inscription:', error);

            if (error.response) {
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
                console.error('Pas de réponse du serveur:', error.request);
                toast.error('Le serveur ne répond pas. Vérifiez que le backend est démarré.');
            } else {
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
                                Inscription - Devenir Membre
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
                                            placeholder="Numéro  d'Identification personnel"
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
                                            placeholder="Ex: +229 01 00 00 00 00"
                                            disabled={loading}
                                        />
                                        {errors.phone && (
                                            <div className="invalid-feedback">{errors.phone}</div>
                                        )}
                                    </div>
                                </div>

                                {/* Le champ rôle est caché car toujours MEMBER */}
                                <input type="hidden" name="role" value="MEMBER" />

                                <div className="d-flex justify-content-end gap-2 mt-4">
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
                                                S'inscrire comme Membre
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
>>>>>>> 0ca80779bd2df063c6c22313cd408bc6f07a9320
            </div>
            <div className="card-body p-4">
              <form onSubmit={handleSubmit} noValidate>
                {/* Nom & Prénom */}
                <div className="row">
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label fw-semibold">Nom *</label>
                      <input
                        type="text"
                        name="name"
                        value={form.name}
                        onChange={handleChange}
                        className={`form-control ${errors.name ? "is-invalid" : ""}`}
                        disabled={loading}
                      />
                      {errors.name && <div className="invalid-feedback">{errors.name}</div>}
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label fw-semibold">Prénom *</label>
                      <input
                        type="text"
                        name="firstName"
                        value={form.firstName}
                        onChange={handleChange}
                        className={`form-control ${errors.firstName ? "is-invalid" : ""}`}
                        disabled={loading}
                      />
                      {errors.firstName && (
                        <div className="invalid-feedback">{errors.firstName}</div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Email & Password */}
                <div className="mb-3">
                  <label className="form-label fw-semibold">Email *</label>
                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    className={`form-control ${errors.email ? "is-invalid" : ""}`}
                    disabled={loading}
                  />
                  {errors.email && <div className="invalid-feedback">{errors.email}</div>}
                </div>
                <div className="mb-3">
                  <label className="form-label fw-semibold">Mot de passe *</label>
                  <input
                    type="password"
                    name="password"
                    value={form.password}
                    onChange={handleChange}
                    className={`form-control ${errors.password ? "is-invalid" : ""}`}
                    disabled={loading}
                  />
                  {errors.password && <div className="invalid-feedback">{errors.password}</div>}
                </div>

                {/* NPI & Phone */}
                <div className="row">
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label fw-semibold">NPI *</label>
                      <input
                        type="number"
                        name="npi"
                        value={form.npi}
                        onChange={handleChange}
                        className={`form-control ${errors.npi ? "is-invalid" : ""}`}
                        disabled={loading}
                      />
                      {errors.npi && <div className="invalid-feedback">{errors.npi}</div>}
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label fw-semibold">Téléphone *</label>
                      <input
                        type="tel"
                        name="phone"
                        value={form.phone}
                        onChange={handleChange}
                        className={`form-control ${errors.phone ? "is-invalid" : ""}`}
                        disabled={loading}
                      />
                      {errors.phone && <div className="invalid-feedback">{errors.phone}</div>}
                    </div>
                  </div>
                </div>

                {/* Role */}
                <div className="mb-4">
                  <label className="form-label fw-semibold">Rôle *</label>
                  <select
                    name="role"
                    value={form.role}
                    onChange={handleChange}
                    className={`form-control ${errors.role ? "is-invalid" : ""}`}
                    disabled={loading}
                  >
                    <option value="">Sélectionner un rôle</option>
                    <option value="MEMBER">Membre</option>
                    <option value="SECRETARY">Secrétaire</option>
                    <option value="PRESIDENT">Président</option>
                    <option value="TREASURER">Trésorier</option>
                  </select>
                  {errors.role && <div className="invalid-feedback">{errors.role}</div>}
                </div>

                {/* Buttons */}
                <div className="d-grid gap-2 d-md-flex justify-content-md-end">
                  <button
                    type="button"
                    className="btn btn-outline-secondary me-md-2"
                    onClick={() => navigate("/dashboard")}
                    disabled={loading}
                  >
                    Annuler
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={loading}>
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
