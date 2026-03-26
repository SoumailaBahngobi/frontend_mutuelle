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
        console.log("📤 addIndividualContribution - Données reçues:", data);
        
        // 🔑 Structure exacte attendue par ContributionController.ContributionRequest
        const payload = {
            amount: parseFloat(data.amount),
            paymentDate: data.paymentDate,
            paymentMode: data.paymentMode || "KKIAPAY",
            paymentProof: data.paymentProof || "",
            contributionPeriodId: parseInt(data.contributionPeriodId),
            paymentId: data.paymentId || null  // ⚠️ Important: c'est paymentId, pas payment_id
        };

        console.log("📤 Payload envoyé à /mutuelle/contribution/individual:", JSON.stringify(payload, null, 2));

        const response = await apiClient.post('/mutuelle/contribution/individual', payload);
        console.log("✅ Réponse /individual:", response.data);
        return response.data;
    }

    static async addGroupContribution(data) {
        const payload = {
            amount: parseFloat(data.amount),
            paymentDate: data.paymentDate,
            paymentMode: data.paymentMode || "KKIAPAY",
            paymentProof: data.paymentProof || "",
            contributionPeriodId: parseInt(data.contributionPeriodId),
            memberIds: data.memberIds.map(id => parseInt(id)),
            paymentId: data.paymentId || null
        };

        console.log("📤 Payload envoyé à /group:", JSON.stringify(payload, null, 2));

        const response = await apiClient.post('/mutuelle/contribution/group', payload);
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
    // MÉTHODES KKIAPAY - ADAPTÉES AU BACKEND
    // =============================================
    
    /**
     * Initie un paiement - correspond à POST /mutuelle/payments/initiate
     */
    static async initiatePayment(paymentData) {
        try {
            console.log("📤 Initiation paiement vers /mutuelle/payments/initiate:", paymentData);
            const response = await apiClient.post('/mutuelle/payments/initiate', paymentData);
            console.log("✅ Réponse initiation:", response.data);
            return response.data;
        } catch (error) {
            console.error('❌ Erreur initiation paiement:', error);
            if (error.response) {
                console.error('📦 Données erreur:', error.response.data);
                console.error('📊 Status:', error.response.status);
            }
            throw error;
        }
    }

    /**
     * Vérifie le statut d'une transaction - correspond à GET /mutuelle/payments/verify/{transactionId}
     */
    static async verifyPayment(transactionId) {
        try {
            console.log(`🔍 Vérification paiement vers /mutuelle/payments/verify/${transactionId}`);
            const response = await apiClient.get(`/mutuelle/payments/verify/${transactionId}`);
            console.log("✅ Réponse vérification:", response.data);
            return response.data;
        } catch (error) {
            console.error('❌ Erreur vérification paiement:', error);
            if (error.response) {
                console.error('📦 Données erreur:', error.response.data);
            }
            throw error;
        }
    }

    /**
     * Récupère tous les paiements d'un membre - GET /mutuelle/payments/member/{memberId}
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
     * Récupère les paiements réussis d'un membre - GET /mutuelle/payments/member/{memberId}/successful
     */
    static async getSuccessfulPayments(memberId) {
        try {
            const response = await apiClient.get(`/mutuelle/payments/member/${memberId}/successful`);
            return response.data;
        } catch (error) {
            console.error('❌ Erreur récupération paiements réussis:', error);
            throw error;
        }
    }

    // =============================================
    // MÉTHODES ADMIN
    // =============================================

    static async verifyAdminSecret(secret) {
        const response = await apiClient.post('/mutuelle/admin/verify-secret', null, {
            headers: { 'X-Admin-Secret': secret }
        });
        return response.data;
    }

    static async registerAdmin(userData, adminSecret) {
        const response = await apiClient.post('/mutuelle/admin/register', userData, {
            headers: { 'X-Admin-Secret': adminSecret }
        });
        return response.data;
    }

    static async getAllMembersForAdmin() {
        const response = await apiClient.get('/mutuelle/admin/members');
        return response.data;
    }

    static async assignRoleByAdmin(memberId, role) {
        const response = await apiClient.put(`/mutuelle/admin/members/${memberId}/role`, { role });
        return response.data;
    }

    static getAuthHeaders() {
        const token = localStorage.getItem('token');
        return {
            'Authorization': token ? `Bearer ${token}` : '',
            'Content-Type': 'application/json'
        };
    }
}

export default ApiService;