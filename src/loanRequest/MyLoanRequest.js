import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const MyLoanRequests = () => {
    const navigate = useNavigate();
    const [loanRequests, setLoanRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [exportLoading, setExportLoading] = useState(false);

    // ✅ CORRECTION : Utilisation de useCallback pour stabiliser la fonction
    const fetchMyLoanRequests = useCallback(async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            console.log('[fetchMyLoanRequests] token present?', !!token);
            if (!token) {
                alert('Vous devez être connecté pour voir vos demandes');
                navigate('/login');
                return;
            }

            // Endpoint qui retourne les demandes du membre connecté
            const response = await axios.get('http://localhost:8080/mut/loan_request/my-requests', {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            // ✅ CORRECTION : S'assurer que loanRequests est toujours un tableau
            const data = response.data;
            if (Array.isArray(data)) {
                setLoanRequests(data);
            } else if (data && typeof data === 'object') {
                // Si c'est un objet unique, le mettre dans un tableau
                setLoanRequests([data]);
            } else {
                // Si la réponse est null, undefined ou autre, utiliser un tableau vide
                console.warn('Réponse inattendue du serveur:', data);
                setLoanRequests([]);
            }
            
        } catch (error) {
            console.error('Erreur fetching my loan requests:', error);
            const status = error.response?.status;
            const data = error.response?.data;
            console.error('[fetchMyLoanRequests] status:', status, 'data:', data);

            if (error.code === 'ERR_NETWORK' || (!error.response && error.request)) {
                alert('Impossible de joindre le serveur backend. Vérifiez qu\'il est démarré.');
                return;
            }

            if (status === 401) {
                alert('Non authentifié. Veuillez vous reconnecter.');
                localStorage.removeItem('token');
                localStorage.removeItem('currentUser');
                navigate('/login');
                return;
            }

            if (status === 403) {
                alert('Accès refusé (403). Vous ne pouvez pas voir ces demandes.');
                return;
            }

            alert('Erreur lors du chargement des demandes');
            setLoanRequests([]); // ✅ S'assurer que c'est un tableau même en cas d'erreur
        } finally {
            setLoading(false);
        }
    }, [navigate]); // ✅ navigate est une dépendance car utilisé dans la fonction

    useEffect(() => {
        fetchMyLoanRequests();
    }, [fetchMyLoanRequests]); // ✅ Maintenant fetchMyLoanRequests est stable grâce à useCallback

    // ✅ CORRECTION : Fonctions sécurisées pour les statistiques
    const getTotalRequests = () => {
        return Array.isArray(loanRequests) ? loanRequests.length : 0;
    };

    const getPendingCount = () => {
        return Array.isArray(loanRequests) ? loanRequests.filter(r => r.status === 'PENDING').length : 0;
    };

    const getApprovedCount = () => {
        return Array.isArray(loanRequests) ? loanRequests.filter(r => r.status === 'APPROVED').length : 0;
    };

    const getGrantedCount = () => {
        return Array.isArray(loanRequests) ? loanRequests.filter(r => r.loanGranted).length : 0;
    };

    const getStatusBadge = (status) => {
        const statusConfig = {
            PENDING: { class: 'bg-warning', text: '⏳ En attente' },
            IN_REVIEW: { class: 'bg-info', text: '📋 En examen' },
            APPROVED: { class: 'bg-success', text: '✅ Approuvé' },
            REJECTED: { class: 'bg-danger', text: '❌ Rejeté' }
        };
        const config = statusConfig[status] || { class: 'bg-secondary', text: status };
        return <span className={`badge ${config.class}`}>{config.text}</span>;
    };

    // ✅ NOUVELLE FONCTION : Statut d'accord du prêt
    const getGrantStatus = (request) => {
        if (request.loanGranted) {
            return <span className="badge bg-success">💰 Prêt accordé</span>;
        } else if (request.status === 'APPROVED') {
            return <span className="badge bg-warning">⏳ En attente d'accord</span>;
        }
        return null;
    };

    const getApprovalProgress = (request) => {
        const approvals = [request.presidentApproved, request.secretaryApproved, request.treasurerApproved];
        const approvedCount = approvals.filter(Boolean).length;
        return `${approvedCount}/3 validations`;
    };

    const getMemberName = (request) => {
        if (request.member) {
            return `${request.member.firstName || ''} ${request.member.lastName || ''}`.trim();
        }
        return 'Membre inconnu';
    };

    const getMemberEmail = (request) => {
        return request.member?.email || 'Email non disponible';
    };

    // Fonction pour exporter en Excel (avec vérification de la dépendance)
    const exportToExcel = async () => {
        // ✅ CORRECTION : Vérifier que loanRequests est un tableau non vide
        const requests = Array.isArray(loanRequests) ? loanRequests : [];
        
        if (requests.length === 0) {
            alert('Aucune donnée à exporter');
            return;
        }

        setExportLoading(true);
        try {
            // Vérifier si xlsx est disponible
            let XLSX;
            try {
                XLSX = await import('xlsx');
            } catch (error) {
                console.error('Bibliothèque xlsx non disponible:', error);
                alert('La fonctionnalité Excel nécessite l\'installation de la bibliothèque xlsx. Exécutez: npm install xlsx');
                return;
            }

            // Préparer les données pour l'export
            const exportData = requests.map(request => ({
                'ID': request.id,
                'Membre': getMemberName(request),
                'Email': getMemberEmail(request),
                'Montant (FCFA)': request.loanAmount || request.requestAmount,
                'Durée (mois)': request.duration,
                'Motif': request.reason,
                'Statut': request.status,
                'Statut Accord': request.loanGranted ? 'Accordé' : 'En attente',
                'Date de demande': new Date(request.requestDate).toLocaleDateString(),
                'Président approuvé': request.presidentApproved ? 'Oui' : 'Non',
                'Secrétaire approuvé': request.secretaryApproved ? 'Oui' : 'Non',
                'Trésorier approuvé': request.treasurerApproved ? 'Oui' : 'Non',
                'Commentaire président': request.presidentComment || '',
                'Commentaire secrétaire': request.secretaryComment || '',
                'Commentaire trésorier': request.treasurerComment || '',
                'Raison du rejet': request.rejectionReason || ''
            }));

            // Créer un workbook et une feuille
            const ws = XLSX.utils.json_to_sheet(exportData);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, 'Demandes de Prêt');

            // Générer le fichier Excel
            const fileName = `demandes_pret_${new Date().toISOString().split('T')[0]}.xlsx`;
            XLSX.writeFile(wb, fileName);

            alert('Exportation Excel réussie !');
        } catch (error) {
            console.error('Erreur lors de l\'exportation Excel:', error);
            alert('Erreur lors de l\'exportation Excel');
        } finally {
            setExportLoading(false);
        }
    };

    // Fonction pour exporter en PDF (version simple)
    const exportToPDF = () => {
        // ✅ CORRECTION : Vérifier que loanRequests est un tableau non vide
        const requests = Array.isArray(loanRequests) ? loanRequests : [];
        
        if (requests.length === 0) {
            alert('Aucune donnée à exporter');
            return;
        }

        setExportLoading(true);
        try {
            // Créer le contenu HTML pour le PDF
            const printContent = `
                <html>
                    <head>
                        <title>Demandes de Prêt</title>
                        <style>
                            body { font-family: Arial, sans-serif; margin: 20px; }
                            h1 { color: #2c3e50; text-align: center; }
                            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                            th { background-color: #f2f2f2; }
                            .badge { padding: 4px 8px; border-radius: 4px; color: white; }
                            .pending { background-color: #ffc107; }
                            .approved { background-color: #28a745; }
                            .rejected { background-color: #dc3545; }
                            .in-review { background-color: #17a2b8; }
                            .granted { background-color: #20c997; }
                        </style>
                    </head>
                    <body>
                        <h1>Demandes de Prêt</h1>
                        <table>
                            <thead>
                                <tr>
                                    <th>Membre</th>
                                    <th>Email</th>
                                    <th>Montant</th>
                                    <th>Durée</th>
                                    <th>Statut</th>
                                    <th>Accord</th>
                                    <th>Date</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${requests.map(request => `
                                    <tr>
                                        <td>${getMemberName(request)}</td>
                                        <td>${getMemberEmail(request)}</td>
                                        <td>${request.loanAmount || request.requestAmount} FCFA</td>
                                        <td>${request.duration} mois</td>
                                        <td>
                                            <span class="badge ${
                                                request.status === 'PENDING' ? 'pending' :
                                                request.status === 'APPROVED' ? 'approved' :
                                                request.status === 'REJECTED' ? 'rejected' : 'in-review'
                                            }">
                                                ${request.status}
                                            </span>
                                        </td>
                                        <td>
                                            <span class="badge ${
                                                request.loanGranted ? 'granted' : 'pending'
                                            }">
                                                ${request.loanGranted ? 'Accordé' : 'En attente'}
                                            </span>
                                        </td>
                                        <td>${new Date(request.requestDate).toLocaleDateString()}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                        <p style="margin-top: 20px; text-align: center; color: #666;">
                            Généré le ${new Date().toLocaleDateString()}
                        </p>
                    </body>
                </html>
            `;

            // Ouvrir une nouvelle fenêtre pour l'impression/PDF
            const printWindow = window.open('', '_blank');
            printWindow.document.write(printContent);
            printWindow.document.close();
            
            // Attendre que le contenu soit chargé puis imprimer
            printWindow.onload = function() {
                printWindow.print();
            };

        } catch (error) {
            console.error('Erreur lors de l\'export PDF:', error);
            alert('Erreur lors de l\'export PDF');
        } finally {
            setExportLoading(false);
        }
    };

    // Fonction pour exporter en CSV
    const exportToCSV = () => {
        // ✅ CORRECTION : Vérifier que loanRequests est un tableau non vide
        const requests = Array.isArray(loanRequests) ? loanRequests : [];
        
        if (requests.length === 0) {
            alert('Aucune donnée à exporter');
            return;
        }

        setExportLoading(true);
        try {
            // Préparer les données CSV
            const headers = [
                'ID', 'Membre', 'Email', 'Montant (FCFA)', 'Durée (mois)', 
                'Motif', 'Statut', 'Statut Accord', 'Date de demande', 'Président approuvé',
                'Secrétaire approuvé', 'Trésorier approuvé'
            ].join(',');

            const csvData = requests.map(request => [
                request.id,
                `"${getMemberName(request)}"`,
                `"${getMemberEmail(request)}"`,
                request.loanAmount || request.requestAmount,
                request.duration,
                `"${request.reason}"`,
                request.status,
                request.loanGranted ? 'Accordé' : 'En attente',
                new Date(request.requestDate).toLocaleDateString(),
                request.presidentApproved ? 'Oui' : 'Non',
                request.secretaryApproved ? 'Oui' : 'Non',
                request.treasurerApproved ? 'Oui' : 'Non'
            ].join(','));

            const csvContent = [headers, ...csvData].join('\n');
            
            // Créer et télécharger le fichier CSV
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', `demandes_pret_${new Date().toISOString().split('T')[0]}.csv`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            alert('Export CSV réussi !');
        } catch (error) {
            console.error('Erreur lors de l\'export CSV:', error);
            alert('Erreur lors de l\'export CSV');
        } finally {
            setExportLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="container mt-4">
                <div className="d-flex justify-content-center">
                    <div className="spinner-border" role="status">
                        <span className="visually-hidden">Chargement...</span>
                    </div>
                </div>
            </div>
        );
    }

    // ✅ CORRECTION : S'assurer que loanRequests est un tableau pour le rendu
    const displayRequests = Array.isArray(loanRequests) ? loanRequests : [];

    return (
        <div className="container mt-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2>📄 Toutes les Demandes de Prêt</h2>
                <div>
                    {/* Boutons d'exportation */}
                    <div className="btn-group me-2">
                        <button 
                            className="btn btn-success"
                            onClick={exportToExcel}
                            disabled={exportLoading || displayRequests.length === 0}
                        >
                            {exportLoading ? '⏳' : '📊'} Excel
                        </button>
                        <button 
                            className="btn btn-danger"
                            onClick={exportToPDF}
                            disabled={exportLoading || displayRequests.length === 0}
                        >
                            {exportLoading ? '⏳' : '📄'} PDF
                        </button>
                        <button 
                            className="btn btn-info"
                            onClick={exportToCSV}
                            disabled={exportLoading || displayRequests.length === 0}
                        >
                            {exportLoading ? '⏳' : '📋'} CSV
                        </button>
                    </div>

                    <button 
                        className="btn btn-primary me-2"
                        onClick={() => navigate('/loans/request')}
                    >
                       ➕ Nouvelle demande
                    </button>
                    <button 
                        className="btn btn-outline-secondary"
                        onClick={() => navigate('/dashboard')}
                    >
                        ↩️ Retour
                    </button>
                </div>
            </div>

            {/* Statistiques */}
            {displayRequests.length > 0 && (
                <div className="row mb-4">
                    <div className="col-md-3">
                        <div className="card text-white bg-primary">
                            <div className="card-body">
                                <h5 className="card-title">{getTotalRequests()}</h5>
                                <p className="card-text">Total demandes</p>
                            </div>
                        </div>
                    </div>
                    <div className="col-md-3">
                        <div className="card text-white bg-warning">
                            <div className="card-body">
                                <h5 className="card-title">
                                    {getPendingCount()}
                                </h5>
                                <p className="card-text">En attente</p>
                            </div>
                        </div>
                    </div>
                    <div className="col-md-3">
                        <div className="card text-white bg-success">
                            <div className="card-body">
                                <h5 className="card-title">
                                    {getApprovedCount()}
                                </h5>
                                <p className="card-text">Approuvées</p>
                            </div>
                        </div>
                    </div>
                    <div className="col-md-3">
                        <div className="card text-white bg-info">
                            <div className="card-body">
                                <h5 className="card-title">
                                    {getGrantedCount()}
                                </h5>
                                <p className="card-text">Prêts accordés</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {displayRequests.length === 0 ? (
                <div className="alert alert-info text-center">
                    <h5>📭 Aucune demande de prêt</h5>
                    <p>Aucune demande de prêt n'a été trouvée.</p>
                </div>
            ) : (
                <>
                    <div className="row">
                        {displayRequests.map(request => (
                            <div key={request.id} className="col-md-6 mb-3">
                                <div className="card h-100">
                                    <div className="card-header d-flex justify-content-between align-items-center">
                                        <strong>{request.loanAmount || request.requestAmount} FCFA</strong>
                                        {getStatusBadge(request.status)}
                                    </div>
                                    <div className="card-body">
                                        {/* Informations du membre */}
                                        <div className="mb-3 p-2 bg-light rounded">
                                            <h6 className="mb-2">👤 Informations du membre</h6>
                                            <p className="mb-1"><strong>Nom:</strong> {getMemberName(request)}</p>
                                            <p className="mb-0"><strong>Email:</strong> {getMemberEmail(request)}</p>
                                        </div>

                                        <p><strong>Durée:</strong> {request.duration} mois</p>
                                        <p><strong>Motif:</strong> {request.reason}</p>
                                        <p><strong>Date de demande:</strong> {new Date(request.requestDate).toLocaleDateString()}</p>
                                        
                                        {/* ✅ Statut d'accord du prêt */}
                                        {getGrantStatus(request) && (
                                            <div className="mb-3">
                                                <strong>Statut du prêt:</strong> {getGrantStatus(request)}
                                                {request.loanGrantedDate && (
                                                    <div className="small text-muted">
                                                        Accordé le: {new Date(request.loanGrantedDate).toLocaleDateString()}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                        
                                        {/* Progression de validation */}
                                        <div className="mt-3">
                                            <small className="text-muted">Progression de validation:</small>
                                            <div className="progress mb-2">
                                                <div 
                                                    className="progress-bar" 
                                                    style={{ 
                                                        width: `${(getApprovalProgress(request).split('/')[0] / 3) * 100}%` 
                                                    }}
                                                >
                                                    {getApprovalProgress(request)}
                                                </div>
                                            </div>
                                            <div className="small">
                                                <span>Président: {request.presidentApproved ? '✅' : '❌'}</span> | 
                                                <span> Secrétaire: {request.secretaryApproved ? '✅' : '❌'}</span> | 
                                                <span> Trésorier: {request.treasurerApproved ? '✅' : '❌'}</span>
                                            </div>
                                        </div>

                                        {/* Commentaires d'approbation */}
                                        {(request.presidentComment || request.secretaryComment || request.treasurerComment) && (
                                            <div className="mt-3">
                                                <h6>💬 Commentaires:</h6>
                                                {request.presidentComment && (
                                                    <p className="mb-1 small"><strong>Président:</strong> {request.presidentComment}</p>
                                                )}
                                                {request.secretaryComment && (
                                                    <p className="mb-1 small"><strong>Secrétaire:</strong> {request.secretaryComment}</p>
                                                )}
                                                {request.treasurerComment && (
                                                    <p className="mb-0 small"><strong>Trésorier:</strong> {request.treasurerComment}</p>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
};

export default MyLoanRequests;