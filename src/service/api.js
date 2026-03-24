import apiClient from '../service/axiosConfig';

class ApiService {
    // =============================================
    // PÉRIODES DE COTISATION
    // =============================================
    static async getContributionPeriods() {
        const response = await apiClient.get('/mutuelle/contribution_period');
        return response.data;
    }

    // =============================================
    // MEMBRES
    // =============================================
    static async getMembers() {
        const response = await apiClient.get('/mutuelle/member');
        return response.data;
    }

    // =============================================
    // COTISATIONS
    // =============================================
    static async addIndividualContribution(data) {
        const response = await apiClient.post('/mutuelle/contribution/individual', data);
        return response.data;
    }

    static async addGroupContribution(data) {
        const response = await apiClient.post('/mutuelle/contribution/group', data);
        return response.data;
    }

    static async getMyContributions(filter = 'ALL') {
        let endpoint = '/mutuelle/contribution/my-contributions';
        if (filter === 'INDIVIDUAL') {
            endpoint = '/mutuelle/contribution/individual/my-contributions';
        } else if (filter === 'GROUP') {
            endpoint = '/mutuelle/contribution/group/my-contributions';
        }
        const response = await apiClient.get(endpoint);
        return response.data;
    }

    // =============================================
    // UPLOAD PREUVE DE PAIEMENT
    // =============================================
    static async uploadPaymentProof(file) {
        const formData = new FormData();
        formData.append('file', file);
        const response = await apiClient.post('/mutuelle/contribution/upload/payment-proof', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data;
    }

    // =============================================
    // NOUVELLES MÉTHODES KKIAPAY
    // =============================================
    
    /**
     * Initie un paiement avec Kkiapay
     */
    static async initiatePayment(paymentData) {
        try {
            const response = await apiClient.post('/mutuelle/payments/initiate', paymentData);
            return response.data;
        } catch (error) {
            console.error('❌ Erreur initiation paiement:', error);
            throw error;
        }
    }

    /**
     * Vérifie le statut d'une transaction
     */
    static async verifyPayment(transactionId) {
        try {
            const response = await apiClient.get(`/mutuelle/payments/verify/${transactionId}`);
            return response.data;
        } catch (error) {
            console.error('❌ Erreur vérification paiement:', error);
            throw error;
        }
    }

    /**
     * Récupère tous les paiements d'un membre
     */
    static async getMemberPayments(memberId) {
        try {
            const response = await apiClient.get(`/mutuelle/payments/member/${memberId}`);
            return response.data;
        } catch (error) {
            console.error('❌ Erreur récupération paiements:', error);
            throw error;
        }
    }

    /**
     * Rembourse une transaction
     */
    static async refundPayment(transactionId) {
        try {
            const response = await apiClient.post(`/mutuelle/payments/refund/${transactionId}`, {});
            return response.data;
        } catch (error) {
            console.error('❌ Erreur remboursement:', error);
            throw error;
        }
    }

    /**
     * Récupère les paiements réussis d'un membre
     */
    static async getSuccessfulPayments(memberId) {
        try {
            const payments = await this.getMemberPayments(memberId);
            return payments.filter(p => p.status === 'SUCCESS');
        } catch (error) {
            console.error('❌ Erreur récupération paiements réussis:', error);
            throw error;
        }
    }

    /**
     * Calcule le total des paiements d'un membre
     */
    static async getTotalPaymentsAmount(memberId) {
        try {
            const payments = await this.getMemberPayments(memberId);
            return payments
                .filter(p => p.status === 'SUCCESS')
                .reduce((total, p) => total + (p.amount || 0), 0);
        } catch (error) {
            console.error('❌ Erreur calcul total paiements:', error);
            return 0;
        }
    }

    // =============================================
    // MÉTHODES UTILITAIRES POUR LES HEADERS
    // =============================================
    
    /**
     * Récupère les headers d'authentification
     */
    static getAuthHeaders() {
        const token = localStorage.getItem('token');
        return {
            'Authorization': token ? `Bearer ${token}` : '',
            'Content-Type': 'application/json'
        };
    }
}

export default ApiService;