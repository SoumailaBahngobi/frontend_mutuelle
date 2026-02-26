// src/loan/LoanDetails.js
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';

const LoanDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [loan, setLoan] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchLoan = async () => {
            try {
                const token = localStorage.getItem('token');
                const res = await axios.get(`http://localhost:8080/mutuelle/loan/${id}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setLoan(res.data);
            } catch (err) {
                console.error('Erreur chargement prêt:', err);
                toast.error('Impossible de charger le prêt demandé');
            } finally {
                setLoading(false);
            }
        };
        fetchLoan();
    }, [id]);

    if (loading) return <div className="text-center">Chargement...</div>;
    if (!loan) return <div className="text-center">Prêt introuvable</div>;

    return (
        <div className="container mt-4">
            <button className="btn btn-outline-secondary mb-3" onClick={() => navigate(-1)}>
                &larr; Retour
            </button>
            <div className="card">
                <div className="card-header">
                    <h4>Détails du prêt #{loan.id}</h4>
                </div>
                <div className="card-body">
                    <p><strong>Membre :</strong> {loan.member?.firstName} {loan.member?.name}</p>
                    <p><strong>Montant :</strong> {loan.amount} FCFA</p>
                    <p><strong>Durée :</strong> {loan.duration} mois</p>
                    <p><strong>Date début :</strong> {loan.startDate}</p>
                    <p><strong>Date fin :</strong> {loan.endDate}</p>
                    <p><strong>Statut :</strong> {loan.status}</p>
                    {/* autres informations selon besoin */}
                </div>
            </div>
        </div>
    );
};

export default LoanDetails;
