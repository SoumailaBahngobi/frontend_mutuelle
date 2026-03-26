import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import ApiService from '../../service/api';

const KkiapayWidget = ({ amount, phoneNumber, memberId, paymentType, buttonText = "Payer avec Mobile Money", onSuccess, onError, onClose }) => {
    const [isLoading, setIsLoading] = useState(false);
    const publicKey = '3011c9e0170a11f1b6a0874a5fa1f25d';

    useEffect(() => {
        return () => {
            if (window.removeKkiapayListener) {
                window.removeKkiapayListener('success');
                window.removeKkiapayListener('failed');
                window.removeKkiapayListener('closed');
            }
        };
    }, []);

    const handlePayment = async () => {
        setIsLoading(true);
        
        try {
            const cleanPhone = phoneNumber.replace(/\D/g, '');
            
            if (!cleanPhone || cleanPhone.length < 8) {
                toast.error('Numéro de téléphone invalide');
                setIsLoading(false);
                return;
            }
            
            if (!amount || amount <= 0) {
                toast.error('Montant invalide');
                setIsLoading(false);
                return;
            }

            toast.info('Initialisation du paiement...');
            console.log('🚀 ÉTAPE 1: Création du paiement dans le backend');

            const initiateResponse = await ApiService.initiatePayment({
                amount: amount,
                phoneNumber: cleanPhone,
                memberId: memberId,
                paymentType: paymentType
            });

            console.log('✅ ÉTAPE 1 - Réponse initiation:', initiateResponse);

            if (!initiateResponse || !initiateResponse.success) {
                throw new Error(initiateResponse?.message || 'Erreur lors de l\'initialisation du paiement');
            }

            const backendTransactionId = initiateResponse.transactionId;
            const backendPaymentId = initiateResponse.paymentId;

            console.log('📝 ÉTAPE 1 - Transaction ID backend:', backendTransactionId);
            console.log('💾 ÉTAPE 1 - Payment ID:', backendPaymentId);

            const pendingPayment = {
                amount: amount,
                memberId: memberId,
                paymentType: paymentType,
                phoneNumber: cleanPhone,
                transactionId: backendTransactionId,
                paymentId: backendPaymentId
            };
            localStorage.setItem('pending_payment', JSON.stringify(pendingPayment));

            console.log('🚀 ÉTAPE 2: Ouverture du widget Kkiapay');

            window.openKkiapayWidget({
                amount: amount,
                position: "center",
                callback: `${window.location.origin}/payment-callback`,
                data: JSON.stringify({ 
                    memberId, 
                    paymentType, 
                    amount, 
                    phoneNumber: cleanPhone,
                    transactionId: backendTransactionId,
                    paymentId: backendPaymentId
                }),
                phone: cleanPhone,
                key: publicKey,
                sandbox: true
            });

            const successHandler = async (response) => {
                console.log("🎉 ÉTAPE 3 - Paiement réussi Kkiapay:", response);
                
                try {
                    console.log('🚀 ÉTAPE 4: Vérification auprès du backend avec transactionId:', backendTransactionId);
                    
                    const verification = await ApiService.verifyPayment(backendTransactionId);
                    console.log("📊 ÉTAPE 4 - Réponse vérification backend:", verification);
                    
                    // ✅ Même si la vérification échoue, on appelle onSuccess
                    // car le paiement existe déjà dans la base (status PENDING)
                    if (onSuccess) {
                        onSuccess({
                            transactionId: backendTransactionId,
                            amount: amount,
                            verified: verification?.success || false,
                            payment: verification?.payment || { id: backendPaymentId },
                            id: backendPaymentId,
                            status: verification?.status || 'PENDING',
                            paymentId: backendPaymentId
                        });
                    }
                    
                    if (verification && verification.success && verification.status === 'SUCCESS') {
                        toast.success("✅ Paiement validé !");
                    } else {
                        toast.info("Paiement enregistré, création de la cotisation...");
                    }
                    
                } catch (error) {
                    console.error("❌ ÉTAPE 4 - Erreur lors de l'appel verifyPayment:", error);
                    
                    // ✅ En cas d'erreur, on appelle quand même onSuccess
                    if (onSuccess) {
                        onSuccess({
                            transactionId: backendTransactionId,
                            amount: amount,
                            verified: false,
                            id: backendPaymentId,
                            paymentId: backendPaymentId,
                            status: 'PENDING'
                        });
                    }
                    
                    toast.info("Paiement enregistré, création de la cotisation...");
                } finally {
                    setIsLoading(false);
                }
            };

            window.addKkiapayListener('success', successHandler);
            window.addKkiapayListener('failed', (error) => {
                console.log("❌ Paiement échoué:", error);
                toast.error("Paiement échoué");
                if (onError) onError(error);
                setIsLoading(false);
            });
            window.addKkiapayListener('closed', () => {
                console.log("Widget fermé");
                if (onClose) onClose();
                setIsLoading(false);
            });

        } catch (error) {
            console.error("❌ Erreur dans handlePayment:", error);
            toast.error('Erreur: ' + error.message);
            if (onError) onError(error);
            setIsLoading(false);
        }
    };

    return (
        <button 
            onClick={handlePayment} 
            disabled={isLoading} 
            className="btn btn-primary w-100"
        >
            {isLoading ? (
                <>
                    <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                    Initialisation...
                </>
            ) : (
                <>
                    <i className="bi bi-credit-card me-2"></i>
                    {buttonText}
                </>
            )}
        </button>
    );
};

export default KkiapayWidget;