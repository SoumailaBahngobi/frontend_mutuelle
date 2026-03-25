import httpClient from "./httpClient";
import appConfig from "./appConfig";

class ApiService {
    constructor() {
        this.http = httpClient;
    }

    // ========== AUTHENTIFICATION ==========
    async login(credentials) {
        try {
            const response = await this.http.post('/mutuelle/auth/login', credentials);
            return response.data;
        } catch (error) {
            console.error('❌ Erreur login:', error);
            throw error;
        }
    }

    async register(userData) {
        try {
            const response = await this.http.post('/mutuelle/auth/register', userData);
            return response.data;
        } catch (error) {
            console.error('❌ Erreur register:', error);
            throw error;
        }
    }

    async getCurrentUser() {
        try {
            const response = await this.http.get('/mutuelle/auth/user-info');
            return response.data;
        } catch (error) {
            console.error('❌ Erreur getCurrentUser:', error);
            throw error;
        }
    }

    // ========== PÉRIODES DE COTISATION ==========
    async getContributionPeriods() {
        try {
            const response = await this.http.get('/mutuelle/contribution_period');
            return response.data;
        } catch (error) {
            console.error('❌ Erreur getContributionPeriods:', error);
            throw error;
        }
    }

    async getContributionPeriod(id) {
        try {
            const response = await this.http.get(`/mutuelle/contribution_period/${id}`);
            return response.data;
        } catch (error) {
            console.error(`❌ Erreur getContributionPeriod ${id}:`, error);
            throw error;
        }
    }

    async createContributionPeriod(data) {
        try {
            const response = await this.http.post('/mutuelle/contribution_period', data);
            return response.data;
        } catch (error) {
            console.error('❌ Erreur createContributionPeriod:', error);
            throw error;
        }
    }

    // ========== COTISATIONS ==========
    async addIndividualContribution(data) {
        try {
            const payload = {
                amount: parseFloat(data.amount),
                paymentDate: data.paymentDate,
                paymentMode: data.paymentMode,
                paymentProof: data.paymentProof || "",
                contributionPeriodId: parseInt(data.contributionPeriodId),
                paymentId: data.paymentId || null
            };

            console.log("📤 Payload envoyé à /individual:", JSON.stringify(payload, null, 2));

            const response = await this.http.post('/mutuelle/contribution/individual', payload);
            console.log("✅ Réponse /individual:", response.data);
            return response.data;

        } catch (error) {
            console.error('❌ Erreur addIndividualContribution:', error);
            if (error.response) {
                console.error('📦 Données de la réponse:', error.response.data);
                console.error('📊 Status:', error.response.status);
            }
            throw error;
        }
    }

    async addGroupContribution(data) {
        try {
            const payload = {
                amount: parseFloat(data.amount),
                paymentDate: data.paymentDate,
                paymentMode: data.paymentMode,
                paymentProof: data.paymentProof || "",
                contributionPeriodId: parseInt(data.contributionPeriodId),
                memberIds: data.memberIds.map(id => parseInt(id)),
                paymentId: data.paymentId || null
            };

            console.log("📤 Payload envoyé à /group:", JSON.stringify(payload, null, 2));

            const response = await this.http.post('/mutuelle/contribution/group', payload);
            console.log("✅ Réponse /group:", response.data);
            return response.data;

        } catch (error) {
            console.error('❌ Erreur addGroupContribution:', error);
            if (error.response) {
                console.error('📦 Données de la réponse:', error.response.data);
                console.error('📊 Status:', error.response.status);
            }
            throw error;
        }
    }

    async getMyContributions(type = 'ALL') {
        try {
            let endpoint = '/mutuelle/contribution/my-contributions';
            if (type === 'INDIVIDUAL') {
                endpoint = '/mutuelle/contribution/individual/my-contributions';
            } else if (type === 'GROUP') {
                endpoint = '/mutuelle/contribution/group/my-contributions';
            }

            console.log(`📊 Récupération des contributions: ${endpoint}`);
            const response = await this.http.get(endpoint);
            return response.data;

        } catch (error) {
            console.error('❌ Erreur getMyContributions:', error);
            throw error;
        }
    }

    // ========== UPLOAD ==========
    async uploadPaymentProof(file, onProgress = null) {
        try {
            if (file.size > appConfig.upload.maxSize) {
                throw new Error(`Fichier trop volumineux. Maximum: ${appConfig.upload.maxSize / 1024 / 1024}MB`);
            }

            if (!appConfig.upload.allowedTypes.includes(file.type)) {
                throw new Error(`Type de fichier non supporté. Types acceptés: ${appConfig.upload.allowedTypes.join(', ')}`);
            }

            console.log(`📤 Upload du fichier: ${file.name} (${(file.size / 1024).toFixed(2)} KB)`);

            const response = await this.http.upload('/mutuelle/contribution/upload/payment-proof', file, onProgress);

            console.log("✅ Fichier uploadé avec succès:", response.data);
            return response.data;

        } catch (error) {
            console.error('❌ Erreur uploadPaymentProof:', error);
            throw error;
        }
    }

    // ========== MEMBRES ==========
    async getMembers() {
        try {
            const response = await this.http.get('/mutuelle/member');
            return response.data;
        } catch (error) {
            console.error('❌ Erreur getMembers:', error);
            throw error;
        }
    }

    async getMemberById(id) {
        try {
            const response = await this.http.get(`/mutuelle/member/${id}`);
            return response.data;
        } catch (error) {
            console.error(`❌ Erreur getMemberById ${id}:`, error);
            throw error;
        }
    }

    async updateMember(id, data) {
        try {
            const response = await this.http.put(`/mutuelle/member/${id}`, data);
            return response.data;
        } catch (error) {
            console.error(`❌ Erreur updateMember ${id}:`, error);
            throw error;
        }
    }

    async deleteMember(id) {
        try {
            const response = await this.http.delete(`/mutuelle/member/${id}`);
            return response.data;
        } catch (error) {
            console.error(`❌ Erreur deleteMember ${id}:`, error);
            throw error;
        }
    }

    // ========== GESTION DES RÔLES (ADMIN) ==========

    /**
     * Vérifier le code secret administrateur
     */
    async verifyAdminSecret(secret) {
        try {
            console.log('🔑 Vérification du code secret...');
            const response = await this.http.post('/mutuelle/admin/verify-secret', null, {
                headers: { 'X-Admin-Secret': secret }
            });
            console.log('✅ Réponse vérification:', response.data);
            return response.data;
        } catch (error) {
            console.error('❌ Erreur verifyAdminSecret:', error);
            throw error;
        }
    }

    /**
     * Inscription d'un administrateur
     */
    async registerAdmin(userData, adminSecret) {
        try {
            console.log('📝 Inscription administrateur...');
            const response = await this.http.post('/mutuelle/admin/register', userData, {
                headers: { 'X-Admin-Secret': adminSecret }
            });
            console.log('✅ Réponse inscription:', response.data);
            return response.data;
        } catch (error) {
            console.error('❌ Erreur registerAdmin:', error);
            throw error;
        }
    }

    /**
     * Récupérer tous les membres (pour l'admin)
     */
    async getAllMembersForAdmin() {
        try {
            const response = await this.http.get('/mutuelle/admin/members');
            return response.data;
        } catch (error) {
            console.error('❌ Erreur getAllMembersForAdmin:', error);
            throw error;
        }
    }

    /**
     * Attribuer un rôle à un membre
     * @param {number} memberId - ID du membre
     * @param {string} role - Rôle à attribuer (PRESIDENT, SECRETARY, TREASURER, ADMIN, MEMBER)
     */
    async assignRoleByAdmin(memberId, role) {
        try {
            const response = await this.http.put(`/mutuelle/admin/members/${memberId}/role`, { role });
            return response.data;
        } catch (error) {
            console.error('❌ Erreur assignRoleByAdmin:', error);
            throw error;
        }
    }

    /**
     * Récupérer les membres par rôle
     * @param {string} role - Rôle (PRESIDENT, SECRETARY, TREASURER, ADMIN, MEMBER)
     */
    async getMembersByRole(role) {
        try {
            const response = await this.http.get(`/mutuelle/admin/members/role/${role}`);
            return response.data;
        } catch (error) {
            console.error('❌ Erreur getMembersByRole:', error);
            throw error;
        }
    }

    // ========== DEMANDES DE PRÊT ==========

    async getAllLoanRequests() {
        try {
            const response = await this.http.get('/mutuelle/loan_request');
            return response.data;
        } catch (error) {
            console.error('❌ Erreur getAllLoanRequests:', error);
            throw error;
        }
    }

    async getMyLoanRequests() {
        try {
            const response = await this.http.get('/mutuelle/loan_request/my-requests');
            return response.data;
        } catch (error) {
            console.error('❌ Erreur getMyLoanRequests:', error);
            throw error;
        }
    }

    async createLoanRequest(data) {
        try {
            const response = await this.http.post('/mutuelle/loan_request', data);
            return response.data;
        } catch (error) {
            console.error('❌ Erreur createLoanRequest:', error);
            throw error;
        }
    }

    async approveLoanRequest(requestId, comment) {
        try {
            const response = await this.http.put(`/mutuelle/loan_request/${requestId}/approve`, { comment });
            return response.data;
        } catch (error) {
            console.error('❌ Erreur approveLoanRequest:', error);
            throw error;
        }
    }

    async rejectLoanRequest(requestId, reason) {
        try {
            const response = await this.http.put(`/mutuelle/loan_request/${requestId}/reject`, { reason });
            return response.data;
        } catch (error) {
            console.error('❌ Erreur rejectLoanRequest:', error);
            throw error;
        }
    }

    // ========== PRÊTS ==========

    async getAllLoans() {
        try {
            const response = await this.http.get('/mutuelle/loans');
            return response.data;
        } catch (error) {
            console.error('❌ Erreur getAllLoans:', error);
            throw error;
        }
    }

    async getMyLoans() {
        try {
            const response = await this.http.get('/mutuelle/loans/my-loans');
            return response.data;
        } catch (error) {
            console.error('❌ Erreur getMyLoans:', error);
            throw error;
        }
    }

    // ========== REMBOURSEMENTS ==========

    async createRepayment(data) {
        try {
            const response = await this.http.post('/mutuelle/repayment', data);
            return response.data;
        } catch (error) {
            console.error('❌ Erreur createRepayment:', error);
            throw error;
        }
    }

    async getMyRepayments() {
        try {
            const response = await this.http.get('/mutuelle/repayment/my-repayments');
            return response.data;
        } catch (error) {
            console.error('❌ Erreur getMyRepayments:', error);
            throw error;
        }
    }

    // ========== PAIEMENTS ==========

    /**
     * Vérifier un paiement Kkiapay
     * @param {string} transactionId - ID de transaction Kkiapay
     */
    async verifyPayment(transactionId) {
        try {
            const response = await this.http.get(`/mutuelle/payment/verify/${transactionId}`);
            return response.data;
        } catch (error) {
            console.error('❌ Erreur verifyPayment:', error);
            if (error.response) {
                console.error('📦 Données de la réponse:', error.response.data);
            }
            throw error;
        }
    }

    async getMemberPayments(memberId) {
        try {
            const response = await this.http.get(`/mutuelle/payment/member/${memberId}`);
            return response.data;
        } catch (error) {
            console.error('❌ Erreur getMemberPayments:', error);
            throw error;
        }
    }

    // ========== NOTIFICATIONS ==========

    async getNotifications() {
        try {
            const response = await this.http.get('/mutuelle/notification');
            return response.data;
        } catch (error) {
            console.error('❌ Erreur getNotifications:', error);
            throw error;
        }
    }

    async markNotificationAsRead(id) {
        try {
            const response = await this.http.put(`/mutuelle/notification/${id}/read`);
            return response.data;
        } catch (error) {
            console.error('❌ Erreur markNotificationAsRead:', error);
            throw error;
        }
    }

    // ========== ÉVÉNEMENTS ==========

    async getEvents() {
        try {
            const response = await this.http.get('/mutuelle/event');
            return response.data;
        } catch (error) {
            console.error('❌ Erreur getEvents:', error);
            throw error;
        }
    }

    async createEvent(data) {
        try {
            const response = await this.http.post('/mutuelle/event', data);
            return response.data;
        } catch (error) {
            console.error('❌ Erreur createEvent:', error);
            throw error;
        }
    }

    // ========== STATISTIQUES ==========

    async getContributionStatistics() {
        try {
            const response = await this.http.get('/mutuelle/contribution/statistics');
            return response.data;
        } catch (error) {
            console.error('❌ Erreur getContributionStatistics:', error);
            throw error;
        }
    }

    async getMyTotalContributions() {
        try {
            const response = await this.http.get('/mutuelle/contribution/my-total-amount');
            return response.data;
        } catch (error) {
            console.error('❌ Erreur getMyTotalContributions:', error);
            throw error;
        }
    }

    // ========== UTILITAIRES ==========

    async healthCheck() {
        try {
            const response = await this.http.get('/actuator/health');
            return response.data;
        } catch (error) {
            console.error('❌ Erreur healthCheck:', error);
            return { status: 'DOWN' };
        }
    }

    async getAppConfig() {
        try {
            const response = await this.http.get('/api/config');
            return response.data;
        } catch (error) {
            console.error('❌ Erreur getAppConfig:', error);
            return appConfig;
        }
    }
}

// Création et export de l'instance unique
const apiService = new ApiService();
export default apiService;