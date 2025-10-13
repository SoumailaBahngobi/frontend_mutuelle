import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const MyLoanRequests = () => {
    const navigate = useNavigate();
    const [loanRequests, setLoanRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [exportLoading, setExportLoading] = useState(false);

    useEffect(() => {
        fetchMyLoanRequests();
    }, []);

    const fetchMyLoanRequests = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get('http://localhost:8080/mut/loan_request', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setLoanRequests(response.data);
        } catch (error) {
            console.error('Erreur:', error);
            alert('Erreur lors du chargement des demandes');
        } finally {
            setLoading(false);
        }
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
            const exportData = loanRequests.map(request => ({
                'ID': request.id,
                'Membre': getMemberName(request),
                'Email': getMemberEmail(request),
                'Montant (FCFA)': request.loanAmount || request.requestAmount,
                'Durée (mois)': request.duration,
                'Motif': request.reason,
                'Statut': request.status,
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
                                    <th>Date</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${loanRequests.map(request => `
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
        setExportLoading(true);
        try {
            // Préparer les données CSV
            const headers = [
                'ID', 'Membre', 'Email', 'Montant (FCFA)', 'Durée (mois)', 
                'Motif', 'Statut', 'Date de demande', 'Président approuvé',
                'Secrétaire approuvé', 'Trésorier approuvé'
            ].join(',');

            const csvData = loanRequests.map(request => [
                request.id,
                `"${getMemberName(request)}"`,
                `"${getMemberEmail(request)}"`,
                request.loanAmount || request.requestAmount,
                request.duration,
                `"${request.reason}"`,
                request.status,
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
                            disabled={exportLoading || loanRequests.length === 0}
                        >
                            {exportLoading ? '⏳' : '📊'} Excel
                        </button>
                        <button 
                            className="btn btn-danger"
                            onClick={exportToPDF}
                            disabled={exportLoading || loanRequests.length === 0}
                        >
                            {exportLoading ? '⏳' : '📄'} PDF
                        </button>
                        <button 
                            className="btn btn-info"
                            onClick={exportToCSV}
                            disabled={exportLoading || loanRequests.length === 0}
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
            {loanRequests.length > 0 && (
                <div className="row mb-4">
                    <div className="col-md-3">
                        <div className="card text-white bg-primary">
                            <div className="card-body">
                                <h5 className="card-title">{loanRequests.length}</h5>
                                <p className="card-text">Total demandes</p>
                            </div>
                        </div>
                    </div>
                    <div className="col-md-3">
                        <div className="card text-white bg-warning">
                            <div className="card-body">
                                <h5 className="card-title">
                                    {loanRequests.filter(r => r.status === 'PENDING').length}
                                </h5>
                                <p className="card-text">En attente</p>
                            </div>
                        </div>
                    </div>
                    <div className="col-md-3">
                        <div className="card text-white bg-success">
                            <div className="card-body">
                                <h5 className="card-title">
                                    {loanRequests.filter(r => r.status === 'APPROVED').length}
                                </h5>
                                <p className="card-text">Approuvées</p>
                            </div>
                        </div>
                    </div>
                    <div className="col-md-3">
                        <div className="card text-white bg-danger">
                            <div className="card-body">
                                <h5 className="card-title">
                                    {loanRequests.filter(r => r.status === 'REJECTED').length}
                                </h5>
                                <p className="card-text">Rejetées</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {loanRequests.length === 0 ? (
                <div className="alert alert-info text-center">
                    <h5>📭 Aucune demande de prêt</h5>
                    <p>Aucune demande de prêt n'a été trouvée.</p>
                </div>
            ) : (
                <>
                    <div className="row">
                        {loanRequests.map(request => (
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