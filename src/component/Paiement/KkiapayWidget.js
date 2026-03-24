import React, { useState } from 'react';
import { toast } from 'react-toastify';
import ApiService from '../../service/api';
const KkiapayWidget = ({ 
    amount, 
    phoneNumber,
    memberId,
    paymentType,
    onSuccess,
    buttonText = "Payer avec Mobile Money"
}) => {
    const [isLoading, setIsLoading] = useState(false);
    
    // Clé publique Kkiapay
    const publicKey = '69a6eae91dfe93dd00cc51a7';

    const handlePayment = async () => {
        setIsLoading(true);
        
        try {
            // 1. VALIDATIONS
            if (!amount || amount <= 0) {
                toast.error('Montant invalide');
                setIsLoading(false);
                return;
            }

            if (!phoneNumber || phoneNumber.length < 8) {
                toast.error('Numéro de téléphone invalide');
                setIsLoading(false);
                return;
            }

            // Nettoyer le numéro (garder uniquement les chiffres)
            const cleanPhone = phoneNumber.replace(/\D/g, '');
            
            // 2. INITIER LE PAIEMENT SUR VOTRE BACKEND
            console.log('Initialisation paiement Momo...');
            const initiation = await ApiService.initiatePayment({
                memberId,
                amount,
                phoneNumber: cleanPhone,
                paymentType
            });

            if (!initiation || !initiation.success) {
                throw new Error(initiation?.message || 'Échec de l\'initialisation');
            }

            const transactionId = initiation.transactionId;
            
            // 3. SAUVEGARDER LA TRANSACTION EN COURS
            localStorage.setItem('pending_payment', JSON.stringify({
                transactionId,
                amount,
                paymentType,
                phoneNumber: cleanPhone,
                timestamp: Date.now()
            }));

            // 4. REDIRECTION VERS LA PAGE DE PAIEMENT MOMO KKIAPAY
            // Construction de l'URL avec paramètres
            const paymentParams = new URLSearchParams({
                'public_key': publicKey,
                'amount': amount,
                'phone': cleanPhone,
                'reason': paymentType === 'INDIVIDUAL_CONTRIBUTION' ? 'Cotisation individuelle' : 'Cotisation groupée',
                'transaction_id': transactionId,
                'firstname': 'Membre',
                'lastname': 'Mutuelle',
                'email': 'membre@mutuelle.com',
                'callback_url': `${window.location.origin}/payment/callback`,
                'sandbox': 'true'
            });

            // URL de paiement Mobile Money
            const paymentUrl = `https://api-sandbox.kkiapay.me/paiement-direct?${paymentParams.toString()}`;
            
            console.log('Redirection vers:', paymentUrl);
            
            // Rediriger l'utilisateur vers la page de paiement
            window.location.href = paymentUrl;

        } catch (error) {
            console.error('Erreur:', error);
            toast.error('Erreur: ' + error.message);
            setIsLoading(false);
        }
    };

    return (
        <button
            type="button"
            onClick={handlePayment}
            disabled={isLoading}
            className="btn btn-primary w-100"
            style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                border: 'none',
                padding: '12px 24px',
                borderRadius: '8px',
                color: 'white',
                fontWeight: 'bold',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                opacity: isLoading ? 0.6 : 1
            }}
        >
            {isLoading ? (
                <>
                    <span className="spinner-border spinner-border-sm me-2"></span>
                    Redirection vers Mobile Money...
                </>
            ) : (
                <>
                    <i className="bi bi-phone me-2"></i>
                    {buttonText}
                </>
            )}
        </button>
    );
};

export default KkiapayWidget;