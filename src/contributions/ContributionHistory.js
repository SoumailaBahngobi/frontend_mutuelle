import React, { useState, useEffect } from 'react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

function ContributionHistory() {
    const [contributions, setContributions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentUser, setCurrentUser] = useState(null);
    const [filter, setFilter] = useState('ALL');
    const [periodFilter, setPeriodFilter] = useState('');
    const [contributionPeriods, setContributionPeriods] = useState([]);
    const [showTypeChoice, setShowTypeChoice] = useState(false);
    const [error, setError] = useState('');
    
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
            const token = localStorage.getItem('token');
            
            if (!token) {
                console.error('❌ Token non trouvé');
                navigate('/login');
                return;
            }

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

    const getAuthHeaders = () => {
        const token = localStorage.getItem('token');
        if (!token) {
            throw new Error('Token non disponible');
        }
        return {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        };
    };

    const fetchContributions = async () => {
        try {
            setLoading(true);
            setError('');
            
            const headers = getAuthHeaders();
            let url = 'http://localhost:8080/mut/contribution/my-contributions';
            
            if (filter === 'INDIVIDUAL') {
                url = 'http://localhost:8080/mut/contribution/individual/my-contributions';
            } else if (filter === 'GROUP') {
                url = 'http://localhost:8080/mut/contribution/group/my-contributions';
            }

            console.log('🔍 Fetching from:', url);
            console.log('🔑 Headers:', headers);

            const response = await axios.get(url, {
                headers: headers,
                timeout: 10000
            });

            console.log('✅ Réponse reçue:', response.data);

            let filteredContributions = Array.isArray(response.data) ? response.data : [];
            
            if (periodFilter) {
                filteredContributions = filteredContributions.filter(
                    contribution => contribution.contributionPeriod?.id?.toString() === periodFilter
                );
            }

            filteredContributions.sort((a, b) => new Date(b.paymentDate) - new Date(a.paymentDate));
            setContributions(filteredContributions);
            
        } catch (error) {
            console.error('❌ Erreur détaillée:', error);
            
            if (error.response?.status === 403) {
                setError('Accès refusé. Votre session a peut-être expiré. Veuillez vous reconnecter.');
                // Rediriger vers login après 2 secondes
                setTimeout(() => navigate('/login'), 2000);
            } else if (error.response?.status === 401) {
                setError('Non authentifié. Veuillez vous reconnecter.');
                navigate('/login');
            } else if (error.code === 'NETWORK_ERROR' || !error.response) {
                setError('Erreur de connexion au serveur. Vérifiez votre connexion internet.');
            } else {
                setError(`Erreur serveur: ${error.response?.status} - ${error.response?.data?.message || 'Erreur inconnue'}`);
            }
        } finally {
            setLoading(false);
        }
    };

    const fetchContributionPeriods = async () => {
        try {
            const headers = getAuthHeaders();
            const response = await axios.get('http://localhost:8080/mut/contribution_period', {
                headers: headers
            });
            setContributionPeriods(Array.isArray(response.data) ? response.data : []);
        } catch (error) {
            console.error('Erreur récupération périodes:', error);
        }
    };

    const exportPDF = () => {
        if (contributions.length === 0) {
            alert('Aucune donnée à exporter');
            return;
        }

        try {
            const doc = new jsPDF();
            
            doc.setFontSize(16);
            doc.text('Historique des Cotisations', 105, 15, { align: 'center' });
            
            doc.setFontSize(10);
            if (currentUser) {
                doc.text(`Membre: ${currentUser.name} ${currentUser.firstName}`, 14, 25);
            }
            doc.text(`Date d'édition: ${new Date().toLocaleDateString('fr-FR')}`, 14, 32);
            doc.text(`Filtre: ${getFilterText()}`, 14, 39);
            
            const tableColumn = ['Date', 'Type', 'Période', 'Montant', 'Mode Paiement', 'Statut'];
            const tableRows = contributions.map(contribution => [
                formatDate(contribution.paymentDate),
                contribution.contributionType === 'INDIVIDUAL' ? 'Individuelle' : 'Groupée',
                contribution.contributionPeriod?.description || 'N/A',
                formatAmount(contribution.amount),
                contribution.paymentMode || 'Non spécifié',
                getStatusText(contribution)
            ]);
            
            doc.autoTable({
                head: [tableColumn],
                body: tableRows,
                startY: 45,
                styles: { fontSize: 8 },
                headStyles: { fillColor: [66, 139, 202] }
            });
            
            const finalY = doc.lastAutoTable.finalY + 10;
            doc.setFontSize(10);
            doc.text(`Total: ${formatAmount(getTotalAmount())}`, 14, finalY);
            
            doc.save(`historique_cotisations_${new Date().toISOString().split('T')[0]}.pdf`);
            
        } catch (error) {
            console.error('Erreur génération PDF:', error);
            alert('Erreur lors de la génération du PDF');
        }
    };

    const getFilterText = () => {
        switch(filter) {
            case 'ALL': return 'Toutes les cotisations';
            case 'INDIVIDUAL': return 'Cotisations individuelles';
            case 'GROUP': return 'Cotisations groupées';
            default: return 'Toutes';
        }
    };

    const getStatusText = (contribution) => {
        if (!contribution.paymentDate) return 'Inconnu';
        const paymentDate = new Date(contribution.paymentDate);
        const today = new Date();
        const isRecent = (today - paymentDate) / (1000 * 60 * 60 * 24) < 7;
        return isRecent ? 'Récent' : 'Ancien';
    };

    const getTotalAmount = () => {
        return contributions.reduce((total, contribution) => {
            const amount = parseFloat(contribution.amount) || 0;
            return total + amount;
        }, 0);
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        try {
            return new Date(dateString).toLocaleDateString('fr-FR');
        } catch (error) {
            return 'Date invalide';
        }
    };

    const formatAmount = (amount) => {
        const numAmount = parseFloat(amount) || 0;
        return new Intl.NumberFormat('fr-FR', {
            style: 'currency',
            currency: 'XOF'
        }).format(numAmount);
    };

    const getStatusBadge = (contribution) => {
        const status = getStatusText(contribution);
        if (status === 'Récent') {
            return <span className="badge bg-success">Récent</span>;
        } else if (status === 'Ancien') {
            return <span className="badge bg-secondary">Ancien</span>;
        }
        return <span className="badge bg-warning">Inconnu</span>;
    };

    const handleRetry = () => {
        setError('');
        fetchContributions();
    };

    const handleReconnect = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('currentUser');
        navigate('/login');
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
                        <div>
                            <button 
                                className="btn btn-success btn-sm me-2"
                                onClick={exportPDF}
                                disabled={contributions.length === 0}
                            >
                                <i className="bi bi-file-earmark-pdf me-1"></i>
                                Exporter PDF
                            </button>
                            <button 
                                className="btn btn-light btn-sm"
                                onClick={() => navigate('/dashboard')}
                            >
                                <i className="bi bi-arrow-left me-1"></i>
                                Retour
                            </button>
                        </div>
                    </div>
                </div>

                <div className="card-body">
                    {/* Message d'erreur */}
                    {error && (
                        <div className="alert alert-danger alert-dismissible fade show" role="alert">
                            <i className="bi bi-exclamation-triangle me-2"></i>
                            {error}
                            <div className="mt-2">
                                <button 
                                    className="btn btn-sm btn-outline-danger me-2"
                                    onClick={handleRetry}
                                >
                                    Réessayer
                                </button>
                                <button 
                                    className="btn btn-sm btn-outline-warning me-2"
                                    onClick={handleReconnect}
                                >
                                    Se reconnecter
                                </button>
                                <button 
                                    type="button" 
                                    className="btn-close" 
                                    onClick={() => setError('')}
                                ></button>
                            </div>
                        </div>
                    )}

                    {/* Le reste du code reste inchangé */}
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
                    ) : contributions.length === 0 && !error ? (
                        <div className="text-center py-5">
                            <i className="bi bi-inbox display-1 text-muted"></i>
                            <h5 className="mt-3 text-muted">Aucune cotisation trouvée</h5>
                            <p className="text-muted">
                                {filter === 'ALL' 
                                    ? "Vous n'avez effectué aucune cotisation pour le moment."
                                    : `Aucune cotisation ${filter === 'INDIVIDUAL' ? 'individuelle' : 'groupée'} trouvée.`
                                }
                            </p>
                            {showTypeChoice ? (
                                <div className="d-flex flex-column align-items-center gap-2 mt-2">
                                    <button
                                        className="btn btn-outline-primary"
                                        onClick={() => navigate('/mut/contribution/individual')}
                                    >
                                        Cotisation individuelle
                                    </button>
                                    <button
                                        className="btn btn-outline-warning"
                                        onClick={() => navigate('/mut/contribution/group')}
                                    >
                                        Cotisation groupée
                                    </button>
                                    <button
                                        className="btn btn-link text-danger"
                                        onClick={() => setShowTypeChoice(false)}
                                    >
                                        Annuler
                                    </button>
                                </div>
                            ) : (
                                <button
                                    className="btn btn-primary mt-2"
                                    onClick={() => setShowTypeChoice(true)}
                                >
                                    <i className="bi bi-plus-circle me-2"></i>
                                    Faire une cotisation
                                </button>
                            )}
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
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default ContributionHistory;