import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

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
            const response = await axios.get('http://localhost:8080/mut/loan_request', {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            // Filtrer seulement les demandes approuvées
            const approved = response.data.filter(request => 
                request.status === 'APPROVED' && !request.isRepaid
            );
            setApprovedRequests(approved);
        } catch (error) {
            setError('Erreur lors du chargement des demandes approuvées');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!selectedRequest) {
            setError('Veuillez sélectionner une demande de prêt');
            return;
        }

        setLoading(true);
        setError('');
        setSuccess('');

        try {
            const token = localStorage.getItem('token');
            
            // Récupérer les détails de la demande sélectionnée
            // const request = approvedRequests.find(req => req.id == selectedRequest);
            const request = approvedRequests.find(req => req.id === parseInt(selectedRequest));
            
            if (!request) {
                setError('Demande de prêt non trouvée');
                return;
            }

            // Calculer le montant à rembourser avec intérêts
            const interest = request.requestAmount * (request.interestRate / 100);
            const repaymentAmount = request.requestAmount + interest;

            // Créer l'objet loan
            const loanData = {
                amount: request.requestAmount,
                duration: request.duration,
                beginDate: new Date().toISOString().split('T')[0],
                repaymentAmount: repaymentAmount,
                interestRate: request.interestRate,
                isRepaid: false,
                member: request.member,
                loanRequest: request
            };

            await axios.post('http://localhost:8080/mut/loan', loanData, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setSuccess('Prêt créé avec succès !');
            
            setTimeout(() => {
                navigate('/loans/list');
            }, 2000);
        } catch (error) {
            setError(error.response?.data || 'Erreur lors de la création du prêt');
        } finally {
            setLoading(false);
        }
    };

    const calculateRepaymentAmount = (requestAmount, interestRate) => {
        const interest = requestAmount * (interestRate / 100);
        return requestAmount + interest;
    };

    return (
        <div className="container mt-4">
            <div className="row justify-content-center">
                <div className="col-md-8">
                    <div className="card">
                        <div className="card-header bg-success text-white">
                            <h3 className="card-title mb-0">💰 Créer un Prêt</h3>
                        </div>
                        <div className="card-body">
                            <div className="alert alert-info">
                                <strong>ℹ️ Information:</strong> Cette interface permet de créer un prêt à partir d'une demande approuvée.
                            </div>

                            {error && <div className="alert alert-danger">{error}</div>}
                            {success && <div className="alert alert-success">{success}</div>}

                            {approvedRequests.length === 0 ? (
                                <div className="alert alert-warning">
                                    Aucune demande de prêt approuvée disponible.
                                </div>
                            ) : (
                                <form onSubmit={handleSubmit}>
                                    <div className="mb-3">
                                        <label className="form-label">
                                            <strong>Sélectionner une demande approuvée *</strong>
                                        </label>
                                        <select
                                            className="form-select"
                                            value={selectedRequest}
                                            onChange={(e) => setSelectedRequest(e.target.value)}
                                            required
                                        >
                                            <option value="">Choisir une demande...</option>
                                            {approvedRequests.map(request => (
                                                <option key={request.id} value={request.id}>
                                                    {request.member.name} {request.member.firstName} - 
                                                    {request.requestAmount}€ - 
                                                    {request.duration} mois - 
                                                    {request.reason.substring(0, 50)}...
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    {selectedRequest && (
                                        <div className="mb-4">
                                            <div className="card border-primary">
                                                <div className="card-header bg-primary text-white">
                                                    <strong>Détails du prêt</strong>
                                                </div>
                                                <div className="card-body">
                                                    {(() => {
                                                        // const request = approvedRequests.find(req => req.id == selectedRequest);
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
                                                                    <div className="col-md-6">
                                                                        <strong>Membre:</strong><br/>
                                                                        {request.member.name} {request.member.firstName}
                                                                    </div>
                                                                    <div className="col-md-6">
                                                                        <strong>Montant:</strong><br/>
                                                                        {request.requestAmount} €
                                                                    </div>
                                                                </div>
                                                                <hr/>
                                                                <div className="row">
                                                                    <div className="col-md-6">
                                                                        <strong>Durée:</strong><br/>
                                                                        {request.duration} mois
                                                                    </div>
                                                                    <div className="col-md-6">
                                                                        <strong>Taux d'intérêt:</strong><br/>
                                                                        {request.interestRate}%
                                                                    </div>
                                                                </div>
                                                                <hr/>
                                                                <div className="row">
                                                                    <div className="col-md-6">
                                                                        <strong>Montant à rembourser:</strong><br/>
                                                                        <span className="text-success fw-bold">
                                                                            {repaymentAmount.toFixed(2)} €
                                                                        </span>
                                                                    </div>
                                                                    <div className="col-md-6">
                                                                        <strong>Mensualité estimée:</strong><br/>
                                                                        <span className="text-info fw-bold">
                                                                            {monthlyPayment.toFixed(2)} €/mois
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            </>
                                                        );
                                                    })()}
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    <div className="d-grid gap-2 d-md-flex justify-content-md-end">
                                        <button
                                            type="button"
                                            className="btn btn-secondary me-md-2"
                                            onClick={() => navigate('/dashboard')}
                                        >
                                            Annuler
                                        </button>
                                        <button
                                            type="submit"
                                            className="btn btn-success"
                                            disabled={loading || !selectedRequest}
                                        >
                                            {loading ? (
                                                <>
                                                    <span className="spinner-border spinner-border-sm me-2" />
                                                    Création en cours...
                                                </>
                                            ) : (
                                                'Créer le prêt'
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