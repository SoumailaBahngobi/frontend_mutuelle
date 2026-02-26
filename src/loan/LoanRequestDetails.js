// src/loan/LoanRequestDetails.js
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';

const LoanRequestDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [request, setRequest] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchRequest = async () => {
            try {
                const token = localStorage.getItem('token');
                const res = await axios.get(`http://localhost:8080/mutuelle/loan_request/${id}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setRequest(res.data);
            } catch (err) {
                console.error('Erreur chargement demande:', err);
                toast.error('Impossible de charger la demande de prêt');
            } finally {
                setLoading(false);
            }
        };
        fetchRequest();
    }, [id]);

    if (loading) return <div className="text-center">Chargement...</div>;
    if (!request) return <div className="text-center">Demande introuvable</div>;

    return (
        <div className="container mt-4">
            <button className="btn btn-outline-secondary mb-3" onClick={() => navigate(-1)}>
                &larr; Retour
            </button>
            <div className="card">
                <div className="card-header">
                    <h4>Détails de la demande #{request.id}</h4>
                </div>
                <div className="card-body">
                    <p><strong>Membre :</strong> {request.member?.firstName} {request.member?.name}</p>
                    <p><strong>Montant demandé :</strong> {request.requestAmount} FCFA</p>
                    <p><strong>Durée :</strong> {request.duration} mois</p>
                    <p><strong>Motif :</strong> {request.reason}</p>
                    <p><strong>Statut :</strong> {request.status}</p>
                    {/* ajouter plus de champs si nécessaire */}
                </div>
            </div>
        </div>
    );
};

export default LoanRequestDetails;
