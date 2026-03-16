import React, { useState } from 'react';
import { toast } from 'react-toastify';
import ApiService from '../../service/api';

const KkiapayWidget = ({ amount, phoneNumber, memberId, paymentType, buttonText = "Payer avec Mobile Money" }) => {
    const [isLoading, setIsLoading] = useState(false);
    const publicKey = '3011c9e0170a11f1b6a0874a5fa1f25d';

    const handlePayment = async () => {
        setIsLoading(true);
        try {
            // 1. Tes validations existantes...
            const cleanPhone = phoneNumber.replace(/\D/g, '');

            // 2. Initialisation sur ton backend (Optionnel si tu gères tout après le succès)
            // Note: Kkiapay génère son propre transactionId, mais tu peux passer le tien en 'data'
            
            // 3. Appel du Widget (Assure-toi que <script src="https://cdn.kkiapay.me"></script> est dans ton index.html)
            window.openKkiapayWidget({
                amount: amount,
                position: "center",
                callback: `${window.location.origin}/dashboard`, // Optionnel si tu utilises listener
                data: JSON.stringify({ memberId, paymentType }), // Stocker tes infos personnalisées
                phone: cleanPhone,
                key: publicKey,
                sandbox: true
            });

            // 4. Écouter le succès
            window.addKkiapayListener('success', async (response) => {
                console.log("Paiement réussi:", response.transactionId);
                // Envoyer la confirmation à ton backend ici
                await ApiService.verifyPayment(response.transactionId); 
                toast.success("Paiement validé !");
                setIsLoading(false);
            });

        } catch (error) {
            toast.error('Erreur: ' + error.message);
            setIsLoading(false);
        }
    };

    return (
        <button onClick={handlePayment} disabled={isLoading} className="btn btn-primary w-100">
            {isLoading ? "Chargement..." : buttonText}
        </button>
    );
};
export default KkiapayWidget;