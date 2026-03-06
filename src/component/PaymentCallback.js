import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import ApiService from '../service/api';

const PaymentCallback = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [status, setStatus] = useState('Traitement en cours...');

    useEffect(() => {
        const handleCallback = async () => {
            // Récupérer les paramètres de l'URL
            const params = new URLSearchParams(location.search);
            const transactionId = params.get('transaction_id') || params.get('transactionId');
            const status_param = params.get('status');
            
            console.log('Callback reçu:', { transactionId, status: status_param });

            // Récupérer la transaction en attente
            const pendingPayment = localStorage.getItem('pending_payment');
            
            if (transactionId) {
                try {
                    // Vérifier le paiement
                    const verification = await ApiService.verifyPayment(transactionId);
                    
                    if (verification.success && verification.status === 'SUCCESS') {
                        setStatus('✅ Paiement réussi !');
                        toast.success('Paiement réussi !');
                        
                        // Rediriger vers la création de cotisation
                        setTimeout(() => {
                            if (pendingPayment) {
                                const payment = JSON.parse(pendingPayment);
                                if (payment.paymentType === 'INDIVIDUAL_CONTRIBUTION') {
                                    navigate('/mutuelle/contribution/individual', {
                                        state: { 
                                            paymentVerified: true, 
                                            transactionId: transactionId 
                                        }
                                    });
                                } else {
                                    navigate('/mutuelle/contribution/group', {
                                        state: { 
                                            paymentVerified: true, 
                                            transactionId: transactionId 
                                        }
                                    });
                                }
                            } else {
                                navigate('/dashboard');
                            }
                        }, 2000);
                    } else {
                        setStatus('⚠️ Paiement en attente');
                        toast.warning('Paiement en attente de confirmation');
                        setTimeout(() => navigate('/dashboard'), 3000);
                    }
                } catch (error) {
                    console.error('Erreur vérification:', error);
                    setStatus('❌ Erreur de vérification');
                    toast.error('Erreur lors de la vérification');
                    setTimeout(() => navigate('/dashboard'), 3000);
                }
            } else {
                setStatus('Aucune transaction trouvée');
                setTimeout(() => navigate('/dashboard'), 2000);
            }
        };

        handleCallback();
    }, [location, navigate]);

    return (
        <div className="container mt-5 text-center">
            <div className="card shadow p-5">
                {status.includes('✅') ? (
                    <div className="text-success mb-4">
                        <i className="bi bi-check-circle-fill" style={{ fontSize: '4rem' }}></i>
                    </div>
                ) : status.includes('❌') ? (
                    <div className="text-danger mb-4">
                        <i className="bi bi-x-circle-fill" style={{ fontSize: '4rem' }}></i>
                    </div>
                ) : (
                    <div className="spinner-border text-primary mb-4" style={{ width: '3rem', height: '3rem' }}></div>
                )}
                
                <h3>{status}</h3>
                <p className="text-muted mt-3">Vous allez être redirigé automatiquement...</p>
            </div>
        </div>
    );
};

export default PaymentCallback;