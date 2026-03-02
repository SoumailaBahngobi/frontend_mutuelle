import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';

const AddLoan = () => {
    const navigate = useNavigate();
    const [approvedRequests, setApprovedRequests] = useState([]);
    const [selectedRequest, setSelectedRequest] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        fetchApprovedRequests();
    }, []);

    const fetchApprovedRequests = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get('http://localhost:8081/mutuelle/loan_request/approved', {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            console.log('Demandes approuvées récupérées:', response.data);
            
            // CORRECTION : Filtrer les demandes approuvées qui n'ont pas encore été accordées (loanGranted = false)
            const approved = response.data.filter(request => 
                !request.loanGranted // ✅ Changé de loanCreated à loanGranted
            );
            
            console.log('Demandes approuvées non accordées:', approved);
            setApprovedRequests(approved);
            
        } catch (error) {
            console.error('Erreur chargement demandes approuvées:', error);
            setError('Erreur lors du chargement des demandes approuvées');
            toast.error('Erreur lors du chargement des demandes approuvées');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!selectedRequest) {
            setError('Veuillez sélectionner une demande de prêt');
            toast.warning('Veuillez sélectionner une demande de prêt');
            return;
        }

        setLoading(true);
        setError('');
        setSuccess('');

        try {
            const token = localStorage.getItem('token');
            
            console.log('Création du prêt pour la demande ID:', selectedRequest);
            
            const response = await axios.post(
                `http://localhost:8081/mutuelle/loans/from-request/${selectedRequest}`, 
                {},
                { 
                    headers: { 
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    } 
                }
            );

            console.log('Prêt créé avec succès:', response.data);
            
            setSuccess('Prêt créé avec succès !');
            toast.success('✅ Prêt créé avec succès !');
            
            // Réinitialiser et recharger la liste
            setSelectedRequest('');
            fetchApprovedRequests(); // Recharger la liste pour mettre à jour
            
        } catch (error) {
            const errorMessage = error.response?.data || error.message || 'Erreur lors de la création du prêt';
            setError(errorMessage);
            console.error('Erreur création prêt:', error);
            toast.error(`❌ ${errorMessage}`);
        } finally {
            setLoading(false);
        }
    };

    const calculateRepaymentAmount = (requestAmount, interestRate) => {
        const interest = requestAmount * (interestRate / 100);
        return requestAmount + interest;
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('fr-FR', {
            style: 'currency',
            currency: 'XOF'
        }).format(amount);
    };

    const getMemberName = (member) => {
        if (!member) return 'Membre inconnu';
        return `${member.firstName || ''} ${member.name || ''}`.trim();
    };

    // Fonction pour forcer le rechargement des données
    const handleRefresh = () => {
        fetchApprovedRequests();
        toast.info('🔄 Actualisation des demandes...');
    };

    return (
        <div className="container mt-4">
            <div className="row justify-content-center">
                <div className="col-md-10">
                    <div className="card shadow-lg">
                        <div className="card-header bg-success text-white text-center py-3">
                            <div className="d-flex justify-content-between align-items-center">
                                <button 
                                    className="btn btn-outline-light btn-sm"
                                    onClick={() => navigate('/dashboard')}
                                >
                                    <i className="fas fa-arrow-left me-1"></i>
                                    Retour
                                </button>
                                <h3 className="card-title mb-0">
                                    <i className="fas fa-hand-holding-usd me-2"></i>
                                    Créer un Prêt
                                </h3>
                                <button 
                                    className="btn btn-outline-light btn-sm"
                                    onClick={handleRefresh}
                                    disabled={loading}
                                >
                                    <i className="fas fa-sync-alt me-1"></i>
                                    Actualiser
                                </button>
                            </div>
                        </div>
                        <div className="card-body p-4">
                            <div className="alert alert-info">
                                <strong>ℹ️ Information:</strong> Cette interface permet de créer un prêt automatiquement 
                                à partir d'une demande approuvée mais non encore accordée.
                            </div>

                            {error && (
                                <div className="alert alert-danger">
                                    <i className="fas fa-exclamation-triangle me-2"></i>
                                    {error}
                                </div>
                            )}
                            {success && (
                                <div className="alert alert-success">
                                    <i className="fas fa-check-circle me-2"></i>
                                    {success}
                                </div>
                            )}

                            {approvedRequests.length === 0 ? (
                                <div className="alert alert-warning text-center">
                                    <i className="fas fa-inbox fa-2x mb-3"></i>
                                    <h5>Aucune demande de prêt approuvée disponible</h5>
                                    <p className="mb-3">
                                        Toutes les demandes approuvées ont déjà un prêt créé ou sont en attente d'approbation.
                                    </p>
                                    <div className="d-flex justify-content-center gap-2">
                                        <button 
                                            className="btn btn-outline-primary"
                                            onClick={handleRefresh}
                                        >
                                            <i className="fas fa-sync-alt me-2"></i>
                                            Actualiser
                                        </button>
                                        <button 
                                            className="btn btn-primary"
                                            onClick={() => navigate('/loans/approval')}
                                        >
                                            <i className="fas fa-list-check me-2"></i>
                                            Voir les approbations
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <form onSubmit={handleSubmit}>
                                    <div className="mb-4">
                                        <label className="form-label fw-bold">
                                            <i className="fas fa-list me-2 text-primary"></i>
                                            Sélectionner une demande approuvée non accordée *
                                        </label>
                                        <select
                                            className="form-select form-select-lg"
                                            value={selectedRequest}
                                            onChange={(e) => {
                                                setSelectedRequest(e.target.value);
                                                setError('');
                                            }}
                                            required
                                            disabled={loading}
                                        >
                                            <option value="">Choisir une demande approuvée...</option>
                                            {approvedRequests.map(request => (
                                                <option key={request.id} value={request.id}>
                                                    #{request.id} - {getMemberName(request.member)} - 
                                                    {formatCurrency(request.requestAmount)} - 
                                                    {request.duration} mois - 
                                                    {request.reason}
                                                </option>
                                            ))}
                                        </select>
                                        <div className="form-text">
                                            {approvedRequests.length} demande(s) approuvée(s) disponible(s)
                                        </div>
                                    </div>

                                    {selectedRequest && (
                                        <div className="mb-4">
                                            <div className="card border-primary">
                                                <div className="card-header bg-primary text-white d-flex justify-content-between align-items-center">
                                                    <strong>
                                                        <i className="fas fa-file-invoice-dollar me-2"></i>
                                                        Détails du prêt à créer
                                                    </strong>
                                                    <div>
                                                        <span className="badge bg-success me-2">APPROUVÉ</span>
                                                        <span className="badge bg-warning">NON ACCORDÉ</span>
                                                    </div>
                                                </div>
                                                <div className="card-body">
                                                    {(() => {
                                                        const request = approvedRequests.find(req => req.id === parseInt(selectedRequest));
                                                        if (!request) return null;
                                                        
                                                        const repaymentAmount = calculateRepaymentAmount(
                                                            request.requestAmount, 
                                                            request.interestRate
                                                        );
                                                        const monthlyPayment = repaymentAmount / request.duration;
                                                        
                                                        return (
                                                            <>
                                                                <div className="row">
                                                                    <div className="col-md-6 mb-3">
                                                                        <h6 className="text-primary">
                                                                            <i className="fas fa-user me-2"></i>
                                                                            Informations du membre
                                                                        </h6>
                                                                        <p className="mb-1">
                                                                            <strong>Nom:</strong> {getMemberName(request.member)}
                                                                        </p>
                                                                        <p className="mb-1">
                                                                            <strong>Email:</strong> {request.member?.email || 'Non renseigné'}
                                                                        </p>
                                                                        <p className="mb-0">
                                                                            <strong>Téléphone:</strong> {request.member?.phone || 'Non renseigné'}
                                                                        </p>
                                                                    </div>
                                                                    <div className="col-md-6 mb-3">
                                                                        <h6 className="text-primary">
                                                                            <i className="fas fa-money-bill-wave me-2"></i>
                                                                            Détails financiers
                                                                        </h6>
                                                                        <p className="mb-1">
                                                                            <strong>Montant demandé:</strong> {formatCurrency(request.requestAmount)}
                                                                        </p>
                                                                        <p className="mb-1">
                                                                            <strong>Durée:</strong> {request.duration} mois
                                                                        </p>
                                                                        <p className="mb-0">
                                                                            <strong>Taux d'intérêt:</strong> {request.interestRate}%
                                                                        </p>
                                                                        <p className="mb-0">
                                                                            <strong>Statut accord:</strong> 
                                                                            {request.loanGranted ? 
                                                                                <span className="badge bg-success ms-2">Accordé</span> : 
                                                                                <span className="badge bg-warning ms-2">En attente</span>
                                                                            }
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                                
                                                                <hr/>
                                                                
                                                                <div className="row">
                                                                    <div className="col-md-6 mb-3">
                                                                        <h6 className="text-success">
                                                                            <i className="fas fa-calculator me-2"></i>
                                                                            Calculs automatiques
                                                                        </h6>
                                                                        <p className="mb-1">
                                                                            <strong>Montant à rembourser:</strong>
                                                                        </p>
                                                                        <h5 className="text-success fw-bold">
                                                                            {formatCurrency(repaymentAmount)}
                                                                        </h5>
                                                                        <small className="text-muted">
                                                                            Capital: {formatCurrency(request.requestAmount)} + 
                                                                            Intérêts: {formatCurrency(repaymentAmount - request.requestAmount)}
                                                                        </small>
                                                                    </div>
                                                                    <div className="col-md-6 mb-3">
                                                                        <h6 className="text-info">
                                                                            <i className="fas fa-calendar-alt me-2"></i>
                                                                            Échéancier
                                                                        </h6>
                                                                        <p className="mb-1">
                                                                            <strong>Mensualité estimée:</strong>
                                                                        </p>
                                                                        <h5 className="text-info fw-bold">
                                                                            {formatCurrency(monthlyPayment)}/mois
                                                                        </h5>
                                                                        <small className="text-muted">
                                                                            Sur {request.duration} mois
                                                                        </small>
                                                                    </div>
                                                                </div>
                                                            </>
                                                        );
                                                    })()}
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    <div className="d-grid gap-2 d-md-flex justify-content-md-end mt-4">
                                        <button
                                            type="button"
                                            className="btn btn-outline-secondary btn-lg me-md-2"
                                            onClick={() => navigate('/dashboard')}
                                            disabled={loading}
                                        >
                                            <i className="fas fa-arrow-left me-2"></i>
                                            Annuler
                                        </button>
                                        <button
                                            type="submit"
                                            className="btn btn-success btn-lg"
                                            disabled={loading || !selectedRequest}
                                        >
                                            {loading ? (
                                                <>
                                                    <span className="spinner-border spinner-border-sm me-2" />
                                                    <span>Création en cours...</span>
                                                </>
                                            ) : (
                                                <>
                                                    <i className="fas fa-plus-circle me-2"></i>
                                                    Créer le prêt
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </form>
                            )}

                        
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AddLoan;
