import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import ApiService from '../../service/api'; // CORRIGÉ: chemin d'import

const PaymentSuccess = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [verifying, setVerifying] = useState(true);
    const [paymentDetails, setPaymentDetails] = useState(null);

    useEffect(() => {
        const verifyPayment = async () => {
            // Récupérer les paramètres de l'URL (Kkiapay peut retourner transaction_id ou transactionId)
            const params = new URLSearchParams(location.search);
            const transactionId = params.get('transaction_id') || params.get('transactionId');
            const status = params.get('status');

            console.log('Callback reçu:', { transactionId, status, search: location.search });

            if (!transactionId) {
                toast.error('ID de transaction manquant');
                setTimeout(() => navigate('/dashboard'), 3000);
                return;
            }

            try {
                // Vérifier le paiement auprès de votre backend
                const response = await ApiService.verifyPayment(transactionId);
                
                if (response.success) {
                    setPaymentDetails(response.payment);
                    
                    if (response.status === 'SUCCESS') {
                        toast.success('✅ Paiement Mobile Money réussi !');
                        
                        // Récupérer la transaction en attente
                        const pendingPayment = localStorage.getItem('pending_payment');
                        
                        // Rediriger vers la page de création de cotisation
                        setTimeout(() => {
                            if (pendingPayment) {
                                const payment = JSON.parse(pendingPayment);
                                if (payment.paymentType === 'INDIVIDUAL_CONTRIBUTION') {
                                    navigate('/mutuelle/contribution/individual', {
                                        state: { 
                                            paymentVerified: true, 
                                            transactionId: transactionId,
                                            paymentId: response.payment?.id
                                        }
                                    });
                                } else if (payment.paymentType === 'GROUP_CONTRIBUTION') {
                                    navigate('/mutuelle/contribution/group', {
                                        state: { 
                                            paymentVerified: true, 
                                            transactionId: transactionId,
                                            paymentId: response.payment?.id
                                        }
                                    });
                                } else {
                                    navigate('/dashboard');
                                }
                                // Nettoyer le stockage
                                localStorage.removeItem('pending_payment');
                            } else {
                                navigate('/dashboard');
                            }
                        }, 2000);
                        
                    } else if (response.status === 'PENDING') {
                        toast.info('Paiement en cours de traitement');
                        setTimeout(() => navigate('/dashboard'), 3000);
                    } else {
                        toast.warning(`Paiement ${response.status?.toLowerCase() || 'échoué'}`);
                        setTimeout(() => navigate('/dashboard'), 3000);
                    }
                } else {
                    toast.error('Échec de la vérification du paiement');
                    setTimeout(() => navigate('/dashboard'), 3000);
                }
            } catch (error) {
              //  console.error('Erreur vérification:', error);
                toast.error('Erreur lors de la vérification du paiement');
                setTimeout(() => navigate('/dashboard'), 3000);
            } finally {
                setVerifying(false);
            }
        };

        verifyPayment();
    }, [location, navigate]);

    return (
        <div className="container mt-5">
            <div className="row justify-content-center">
                <div className="col-md-6">
                    <div className="card shadow text-center">
                        <div className="card-body p-5">
                            {verifying ? (
                                <>
                                    <div className="spinner-border text-primary mb-4" style={{ width: '4rem', height: '4rem' }}>
                                        <span className="visually-hidden">Chargement...</span>
                                    </div>
                                    <h3>Vérification de votre paiement Mobile Money...</h3>
                                    <p className="text-muted">Veuillez patienter un instant</p>
                                    <p className="text-muted small">Vous allez recevoir une notification sur votre téléphone</p>
                                </>
                            ) : paymentDetails ? (
                                <>
                                    <div className="text-success mb-4">
                                        <i className="bi bi-check-circle-fill" style={{ fontSize: '5rem' }}></i>
                                    </div>
                                    <h3 className="mb-3">✅ Paiement Mobile Money confirmé !</h3>
                                    <div className="alert alert-success text-start">
                                        <p className="mb-2"><strong>Montant :</strong> {paymentDetails.amount?.toLocaleString()} FCFA</p>
                                        <p className="mb-2"><strong>Transaction :</strong> {paymentDetails.transactionId}</p>
                                        <p className="mb-2"><strong>Téléphone :</strong> {paymentDetails.phoneNumber}</p>
                                        <p className="mb-0"><strong>Date :</strong> {new Date(paymentDetails.paymentDate).toLocaleString()}</p>
                                    </div>
                                    <div className="alert alert-info mt-4">
                                        <i className="bi bi-info-circle me-2"></i>
                                        Redirection vers le formulaire de cotisation...
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="text-warning mb-4">
                                        <i className="bi bi-exclamation-triangle-fill" style={{ fontSize: '5rem' }}></i>
                                    </div>
                                    <h3 className="mb-3">⚠️ Paiement en attente</h3>
                                    <p>Votre paiement Mobile Money est en cours de traitement</p>
                                    <p className="text-muted small">Vous recevrez une notification sur votre téléphone</p>
                                    <button 
                                        className="btn btn-primary mt-3"
                                        onClick={() => navigate('/dashboard')}
                                    >
                                        Retour au tableau de bord
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PaymentSuccess;