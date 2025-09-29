import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

function ContributionHistory() {
    const [contributions, setContributions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentUser, setCurrentUser] = useState(null);
    const [filter, setFilter] = useState('ALL'); // ALL, INDIVIDUAL, GROUP
    const [periodFilter, setPeriodFilter] = useState('');
    const [contributionPeriods, setContributionPeriods] = useState([]);
    
    const navigate = useNavigate();

    useEffect(() => {
        getCurrentUser();
        fetchContributionPeriods();
    }, []);

    useEffect(() => {
        if (currentUser) {
            fetchContributions();
        }
    }, [currentUser, filter, periodFilter]);

    const getCurrentUser = () => {
        try {
            const userData = localStorage.getItem('currentUser');
            if (userData) {
                const user = JSON.parse(userData);
                setCurrentUser(user);
            } else {
                navigate('/login');
            }
        } catch (error) {
            console.error('Erreur récupération utilisateur:', error);
            navigate('/login');
        }
    };

    const fetchContributions = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            
            let url = 'http://localhost:8080/mut/contribution/individual/my-contributions';
            if (filter === 'GROUP') {
                url = 'http://localhost:8080/mut/contribution/group/my_contributions';
            } else if (filter === 'ALL') {
                // Pour toutes les contributions, on va devoir faire deux appels
                await fetchAllContributions();
                return;
            }

            const response = await axios.get(url, {
                headers: { Authorization: `Bearer ${token}` }
            });

            let filteredContributions = response.data;
            
            // Filtrer par période si sélectionnée
            if (periodFilter) {
                filteredContributions = filteredContributions.filter(
                    contribution => contribution.contributionPeriod?.id?.toString() === periodFilter
                );
            }

            setContributions(filteredContributions);
        } catch (error) {
            console.error('Erreur récupération cotisations:', error);
            alert('Erreur lors du chargement de l\'historique');
        } finally {
            setLoading(false);
        }
    };

    const fetchAllContributions = async () => {
        try {
            const token = localStorage.getItem('token');
            const [individualResponse, groupResponse] = await Promise.all([
                axios.get('http://localhost:8080/mut/contribution/individual/my-contributions', {
                    headers: { Authorization: `Bearer ${token}` }
                }),
                axios.get('http://localhost:8080/mut/contribution/group/my_contributions', {
                    headers: { Authorization: `Bearer ${token}` }
                })
            ]);

            let allContributions = [
                ...individualResponse.data,
                ...groupResponse.data
            ];

            // Trier par date décroissante
            allContributions.sort((a, b) => new Date(b.paymentDate) - new Date(a.paymentDate));

            // Filtrer par période si sélectionnée
            if (periodFilter) {
                allContributions = allContributions.filter(
                    contribution => contribution.contributionPeriod?.id?.toString() === periodFilter
                );
            }

            setContributions(allContributions);
        } catch (error) {
            console.error('Erreur récupération toutes les cotisations:', error);
        }
    };

    const fetchContributionPeriods = async () => {
        try {
            const response = await axios.get('http://localhost:8080/mut/contribution_period');
            setContributionPeriods(response.data);
        } catch (error) {
            console.error('Erreur récupération périodes:', error);
        }
    };

    const getTotalAmount = () => {
        return contributions.reduce((total, contribution) => total + parseFloat(contribution.amount || 0), 0);
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('fr-FR');
    };

    const formatAmount = (amount) => {
        return new Intl.NumberFormat('fr-FR', {
            style: 'currency',
            currency: 'XOF'
        }).format(amount);
    };

    const getStatusBadge = (contribution) => {
        const paymentDate = new Date(contribution.paymentDate);
        const today = new Date();
        const isRecent = (today - paymentDate) / (1000 * 60 * 60 * 24) < 7; // Moins de 7 jours
        
        if (isRecent) {
            return <span className="badge bg-success">Récent</span>;
        }
        return <span className="badge bg-secondary">Ancien</span>;
    };

    if (!currentUser) {
        return (
            <div className="container text-center">
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Chargement...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="container">
            <div className="card shadow">
                <div className="card-header bg-primary text-white">
                    <div className="d-flex justify-content-between align-items-center">
                        <h4 className="mb-0">
                            <i className="bi bi-clock-history me-2"></i>
                            Historique de mes Cotisations
                        </h4>
                        <button 
                            className="btn btn-light btn-sm"
                            onClick={() => navigate('/dashboard')}
                        >
                            <i className="bi bi-arrow-left me-1"></i>
                            Retour
                        </button>
                    </div>
                </div>

                <div className="card-body">
                    {/* En-tête avec statistiques */}
                    <div className="row mb-4">
                        <div className="col-md-4">
                            <div className="card bg-light">
                                <div className="card-body text-center">
                                    <h5 className="card-title text-primary">{contributions.length}</h5>
                                    <p className="card-text small">Total des cotisations</p>
                                </div>
                            </div>
                        </div>
                        <div className="col-md-4">
                            <div className="card bg-light">
                                <div className="card-body text-center">
                                    <h5 className="card-title text-success">{formatAmount(getTotalAmount())}</h5>
                                    <p className="card-text small">Montant total</p>
                                </div>
                            </div>
                        </div>
                        <div className="col-md-4">
                            <div className="card bg-light">
                                <div className="card-body text-center">
                                    <h5 className="card-title text-info">
                                        {currentUser.name} {currentUser.firstName}
                                    </h5>
                                    <p className="card-text small">Membre</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Filtres */}
                    <div className="row mb-4">
                        <div className="col-md-6">
                            <label className="form-label fw-semibold">Type de cotisation</label>
                            <select 
                                className="form-select"
                                value={filter}
                                onChange={(e) => setFilter(e.target.value)}
                            >
                                <option value="ALL">Toutes les cotisations</option>
                                <option value="INDIVIDUAL">Cotisations individuelles</option>
                                <option value="GROUP">Cotisations groupées</option>
                            </select>
                        </div>
                        <div className="col-md-6">
                            <label className="form-label fw-semibold">Période</label>
                            <select 
                                className="form-select"
                                value={periodFilter}
                                onChange={(e) => setPeriodFilter(e.target.value)}
                            >
                                <option value="">Toutes les périodes</option>
                                {contributionPeriods.map(period => (
                                    <option key={period.id} value={period.id}>
                                        {period.description} 
                                        ({formatDate(period.startDate)} - {formatDate(period.endDate)})
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Liste des cotisations */}
                    {loading ? (
                        <div className="text-center py-5">
                            <div className="spinner-border text-primary" role="status">
                                <span className="visually-hidden">Chargement...</span>
                            </div>
                            <p className="mt-2 text-muted">Chargement de l'historique...</p>
                        </div>
                    ) : contributions.length === 0 ? (
                        <div className="text-center py-5">
                            <i className="bi bi-inbox display-1 text-muted"></i>
                            <h5 className="mt-3 text-muted">Aucune cotisation trouvée</h5>
                            <p className="text-muted">
                                {filter === 'ALL' 
                                    ? "Vous n'avez effectué aucune cotisation pour le moment."
                                    : `Aucune cotisation ${filter === 'INDIVIDUAL' ? 'individuelle' : 'groupée'} trouvée.`
                                }
                            </p>
                            <button 
                                className="btn btn-primary mt-2"
                                onClick={() => navigate('/add-contribution')}
                            >
                                <i className="bi bi-plus-circle me-2"></i>
                                Faire une cotisation
                            </button>
                        </div>
                    ) : (
                        <div className="table-responsive">
                            <table className="table table-striped table-hover">
                                <thead className="table-light">
                                    <tr>
                                        <th>Date</th>
                                        <th>Type</th>
                                        <th>Période</th>
                                        <th>Montant</th>
                                        <th>Mode de paiement</th>
                                        <th>Statut</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {contributions.map(contribution => (
                                        <tr key={contribution.id}>
                                            <td>
                                                <strong>{formatDate(contribution.paymentDate)}</strong>
                                            </td>
                                            <td>
                                                <span className={`badge ${
                                                    contribution.contributionType === 'INDIVIDUAL' 
                                                        ? 'bg-primary' 
                                                        : 'bg-warning text-dark'
                                                }`}>
                                                    {contribution.contributionType === 'INDIVIDUAL' 
                                                        ? 'Individuelle' 
                                                        : 'Groupée'
                                                    }
                                                </span>
                                            </td>
                                            <td>
                                                {contribution.contributionPeriod?.description || 'N/A'}
                                            </td>
                                            <td className="fw-bold text-success">
                                                {formatAmount(contribution.amount)}
                                            </td>
                                            <td>
                                                <small className="text-muted">
                                                    {contribution.paymentMode || 'Non spécifié'}
                                                </small>
                                            </td>
                                            <td>
                                                {getStatusBadge(contribution)}
                                            </td>
                                            <td>
                                                <button 
                                                    className="btn btn-sm btn-outline-primary"
                                                    onClick={() => {/* Voir détails */}}
                                                    title="Voir détails"
                                                >
                                                    <i className="bi bi-eye"></i>
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot className="table-light">
                                    <tr>
                                        <td colSpan="3" className="text-end fw-bold">Total:</td>
                                        <td className="fw-bold text-success">
                                            {formatAmount(getTotalAmount())}
                                        </td>
                                        <td colSpan="3"></td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    )}
                </div>

                <div className="card-footer text-muted small">
                    <div className="row">
                        <div className="col-md-6">
                            Dernière mise à jour: {new Date().toLocaleDateString('fr-FR')}
                        </div>
                        <div className="col-md-6 text-end">
                            {contributions.length} cotisation(s) affichée(s)
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ContributionHistory;