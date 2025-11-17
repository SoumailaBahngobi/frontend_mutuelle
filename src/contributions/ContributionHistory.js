import React, { useState, useEffect } from 'react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

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
            let url = 'http://localhost:8080/mutuelle/contribution/my-contributions';
            
            if (filter === 'INDIVIDUAL') {
                url = 'http://localhost:8080/mutuelle/contribution/individual/my-contributions';
            } else if (filter === 'GROUP') {
                url = 'http://localhost:8080/mutuelle/contribution/group/my-contributions';
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
            const response = await axios.get('http://localhost:8080/mutuelle/contribution_period', {
                headers: headers
            });
            setContributionPeriods(Array.isArray(response.data) ? response.data : []);
        } catch (error) {
            console.error('Erreur récupération périodes:', error);
        }
    };

    const getStatusText = (contribution) => {
        if (!contribution.paymentDate) return 'en attente';
        
        const paymentDate = new Date(contribution.paymentDate);
        const now = new Date();
        const contributionPeriod = contribution.contributionPeriod;
        
        // Si nous avons les informations de période
        if (contributionPeriod && contributionPeriod.startDate && contributionPeriod.endDate) {
            const startDate = new Date(contributionPeriod.startDate);
            const endDate = new Date(contributionPeriod.endDate);
            
            // Définir les dates pour comparaison (sans heures)
            const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            const periodStart = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
            const periodEnd = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
            
            if (today < periodStart) {
                return 'en attente';
            } else if (today >= periodStart && today <= periodEnd) {
                return 'en cours';
            } else {
                return 'passé';
            }
        }
        
        // Fallback basé sur la date de paiement si pas de période
        const diffTime = Math.abs(now - paymentDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays <= 0) return 'en cours';
        if (diffDays <= 30) return 'en cours';
        return 'passé';
    };

    const getStatusBadge = (contribution) => {
        const status = getStatusText(contribution);
        switch (status) {
            case 'en attente':
                return <span className="badge bg-warning text-dark">En attente</span>;
            case 'en cours':
                return <span className="badge bg-success">En cours</span>;
            case 'passé':
                return <span className="badge bg-secondary">Passé</span>;
            default:
                return <span className="badge bg-light text-dark">Inconnu</span>;
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'en attente':
                return [255, 193, 7]; // Orange
            case 'en cours':
                return [40, 167, 69]; // Vert
            case 'passé':
                return [108, 117, 125]; // Gris
            default:
                return [200, 200, 200]; // Gris clair
        }
    };

    const exportPDF = () => {
        if (contributions.length === 0) {
            alert('Aucune donnée à exporter');
            return;
        }

        try {
            const doc = new jsPDF();
            const pageWidth = doc.internal.pageSize.getWidth();
            
            // =====================
            // EN-TÊTE AVEC STYLE
            // =====================
            doc.setFillColor(41, 128, 185);
            doc.rect(0, 0, pageWidth, 40, 'F');
            
            // Titre principal
            doc.setFontSize(20);
            doc.setTextColor(255, 255, 255);
            doc.setFont('helvetica', 'bold');
            doc.text('HISTORIQUE DES COTISATIONS', pageWidth / 2, 25, { align: 'center' });
            
            // =====================
            // INFORMATIONS MEMBRE
            // =====================
            let yPosition = 55;
            
            // Carte d'information membre
            doc.setFillColor(245, 245, 245);
            doc.roundedRect(14, yPosition, pageWidth - 28, 35, 3, 3, 'F');
            
            doc.setFontSize(12);
            doc.setTextColor(41, 128, 185);
            doc.setFont('helvetica', 'bold');
            doc.text('INFORMATIONS MEMBRE', 20, yPosition + 8);
            
            doc.setFontSize(10);
            doc.setTextColor(80, 80, 80);
            doc.setFont('helvetica', 'normal');
            doc.text(`• Nom: ${currentUser.name} ${currentUser.firstName}`, 20, yPosition + 18);
            doc.text(`• Date d'export: ${new Date().toLocaleDateString('fr-FR')}`, 20, yPosition + 26);
            doc.text(`• Total cotisations: ${contributions.length}`, 110, yPosition + 18);
            doc.text(`• Montant total: ${formatAmountNoSlash(getTotalAmount())}`, 110, yPosition + 26);
            
            yPosition += 45;

            // =====================
            // TABLEAU AVEC STYLE AMÉLIORÉ
            // =====================
            const tableColumn = [
                { header: "DATE", dataKey: "date" },
                { header: "TYPE", dataKey: "type" },
                { header: "PÉRIODE", dataKey: "period" },
                { header: "MONTANT", dataKey: "amount" },
                { header: "PAIEMENT", dataKey: "payment" },
                { header: "STATUT", dataKey: "status" }
            ];

            const tableRows = contributions.map(contribution => ({
                date: formatDate(contribution.paymentDate),
                type: contribution.contributionType === 'INDIVIDUAL' ? 'Individuelle' : 'Groupée',
                period: contribution.contributionPeriod?.description || 'N/A',
                amount: formatAmountNoSlash(contribution.amount),
                payment: getPaymentModeText(contribution.paymentMode),
                status: getStatusText(contribution)
            }));

            doc.autoTable({
                startY: yPosition,
                head: [tableColumn.map(col => col.header)],
                body: tableRows.map(row => tableColumn.map(col => row[col.dataKey])),
                styles: { 
                    fontSize: 9,
                    cellPadding: 4,
                    lineColor: [200, 200, 200],
                    lineWidth: 0.1
                },
                headStyles: {
                    fillColor: [52, 152, 219],
                    textColor: 255,
                    fontStyle: 'bold',
                    fontSize: 10,
                    cellPadding: 5
                },
                alternateRowStyles: {
                    fillColor: [248, 248, 248]
                },
                columnStyles: {
                    0: { cellWidth: 25, halign: 'center' },
                    1: { cellWidth: 25, halign: 'center' },
                    2: { cellWidth: 45 },
                    3: { cellWidth: 25, halign: 'right', fontStyle: 'bold' },
                    4: { cellWidth: 30, halign: 'center' },
                    5: { cellWidth: 20, halign: 'center' }
                },
                didDrawCell: (data) => {
                    // Colorer les montants en vert
                    if (data.column.index === 3 && data.cell.section === 'body') {
                        doc.setTextColor(39, 174, 96);
                    }
                    // Colorer les statuts selon leur type
                    if (data.column.index === 5 && data.cell.section === 'body') {
                        const status = data.cell.raw;
                        const [r, g, b] = getStatusColor(status);
                        doc.setTextColor(r, g, b);
                    }
                },
                margin: { top: 10 }
            });

            // =====================
            // PIED DE PAGE AVEC TOTAL
            // =====================
            const finalY = doc.lastAutoTable.finalY + 15;
            
            // Ligne de séparation
            doc.setDrawColor(200, 200, 200);
            doc.setLineWidth(0.5);
            doc.line(14, finalY, pageWidth - 14, finalY);
            
            // Total général
            doc.setFontSize(12);
            doc.setTextColor(41, 128, 185);
            doc.setFont('helvetica', 'bold');
            doc.text(`TOTAL GÉNÉRAL: ${formatAmountNoSlash(getTotalAmount())}`, 14, finalY + 10);
            
            // Statistiques résumées
            const individualCount = contributions.filter(c => c.contributionType === 'INDIVIDUAL').length;
            const groupCount = contributions.filter(c => c.contributionType === 'GROUP').length;
            
            // Statistiques par statut
            const pendingCount = contributions.filter(c => getStatusText(c) === 'en attente').length;
            const currentCount = contributions.filter(c => getStatusText(c) === 'en cours').length;
            const pastCount = contributions.filter(c => getStatusText(c) === 'passé').length;
            
            doc.setFontSize(9);
            doc.setTextColor(100, 100, 100);
            doc.setFont('helvetica', 'normal');
            doc.text(
                `Récapitulatif: ${individualCount} individuelle(s) • ${groupCount} groupée(s)`, 
                pageWidth - 14, 
                finalY + 10, 
                { align: 'right' }
            );

            // Ligne supplémentaire pour les statuts
            doc.text(
                `Statuts: ${pendingCount} en attente • ${currentCount} en cours • ${pastCount} passé(s)`, 
                pageWidth - 14, 
                finalY + 16, 
                { align: 'right' }
            );

            // =====================
            // SIGNATURE ET MENTIONS
            // =====================
            const signatureY = finalY + 30;
            doc.setFontSize(8);
            doc.setTextColor(150, 150, 150);
            doc.text('Document généré automatiquement - Mutuelle WBF', pageWidth / 2, signatureY, { align: 'center' });
            doc.text('© 2024 Tous droits réservés', pageWidth / 2, signatureY + 5, { align: 'center' });

            // =====================
            // SAUVEGARDE
            // =====================
            const fileName = `cotisations_${currentUser.name}_${new Date().toISOString().split('T')[0]}.pdf`;
            doc.save(fileName);
            
            //console.log('✅ PDF généré avec style !');
            toast.success('PDF des cotisations généré avec succès !');
            
        } catch (error) {
           // console.error('❌ Erreur génération PDF:', error);
            //alert('Erreur lors de la génération du PDF: ' + error.message);
            toast.error('Erreur lors de la génération du PDF: ' + error.message);
        }
    };

    // Nouvelle fonction sans séparateurs de milliers
    const formatAmountNoSlash = (amount) => {
        const numAmount = parseFloat(amount) || 0;
        return `${numAmount.toFixed(2)} FCFA`;
    };

    // Fonction utilitaire pour les modes de paiement
    const getPaymentModeText = (paymentMode) => {
        const modes = {
            'ESPECES': 'Espèces',
            'CHEQUE': 'Chèque',
            'VIREMENT': 'Virement',
            'MOBILE_MONEY': ' Mobile',
            'CARTE': 'Carte'
        };
        return modes[paymentMode] || paymentMode || 'Non spécifié';
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

                    {/* Statistiques résumées */}
                    <div className="row mb-4">
                        <div className="col-md-3">
                            <div className="card bg-light">
                                <div className="card-body text-center">
                                    <h5 className="card-title text-primary">{contributions.length}</h5>
                                    <p className="card-text small">Total des cotisations</p>
                                </div>
                            </div>
                        </div>
                        <div className="col-md-3">
                            <div className="card bg-light">
                                <div className="card-body text-center">
                                    <h5 className="card-title text-success">{formatAmount(getTotalAmount())}</h5>
                                    <p className="card-text small">Montant total</p>
                                </div>
                            </div>
                        </div>
                        <div className="col-md-3">
                            <div className="card bg-light">
                                <div className="card-body text-center">
                                    <h5 className="card-title text-info">
                                        {currentUser.name} {currentUser.firstName}
                                    </h5>
                                    <p className="card-text small">Membre</p>
                                </div>
                            </div>
                        </div>
                        <div className="col-md-3">
                            <div className="card bg-light">
                                <div className="card-body text-center">
                                    <h5 className="card-title text-warning">
                                        {contributions.filter(c => getStatusText(c) === 'en cours').length}
                                    </h5>
                                    <p className="card-text small">En cours</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Filtres */}
                    <div className="row mb-4">
                        <div className="col-md-4">
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
                        <div className="col-md-4">
                            <label className="form-label fw-semibold">Campagne de cotisation</label>
                            <select 
                                className="form-select"
                                value={periodFilter}
                                onChange={(e) => setPeriodFilter(e.target.value)}
                            >
                                <option value="">Toutes les campagnes de cotisation</option>
                                {contributionPeriods.map(period => (
                                    <option key={period.id} value={period.id}>
                                        {period.description} 
                                        ({formatDate(period.startDate)} - {formatDate(period.endDate)})
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="col-md-4">
                            <label className="form-label fw-semibold">Statut</label>
                            <select 
                                className="form-select"
                                onChange={(e) => {
                                    // Filtrage supplémentaire par statut si nécessaire
                                    const status = e.target.value;
                                    // Implémentation du filtrage par statut
                                }}
                            >
                                <option value="">Tous les statuts</option>
                                <option value="en attente">En attente</option>
                                <option value="en cours">En cours</option>
                                <option value="passé">Passé</option>
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
                                        onClick={() => navigate('/mutuelle/contribution/individual')}
                                    >
                                        Cotisation individuelle
                                    </button>
                                    <button
                                        className="btn btn-outline-warning"
                                        onClick={() => navigate('/mutuelle/contribution/group')}
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
                                        {/* <th>Type</th> */}
                                        <th>Campagne de cotisation</th>
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
                                            {/* <td>
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
                                            </td> */}
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