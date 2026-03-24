import httpClient from "./httpClient";
import appConfig from "./appConfig";

class ApiService {
    constructor() {
        this.http = httpClient;
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
            // Structure exacte attendue par le backend
            const payload = {
                amount: parseFloat(data.amount),
                paymentDate: data.paymentDate,
                paymentMode: data.paymentMode,
                paymentProof: data.paymentProof || "",  // Chaîne vide si pas de fichier
                contributionPeriod: {
                    id: parseInt(data.contributionPeriodId)
                }
                // Ne pas inclure member ici, il sera ajouté par le backend via JWT
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
                console.error('🔧 Headers:', error.response.headers);
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
                memberIds: data.memberIds.map(id => parseInt(id))
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
            
            console.log(`📤 Récupération des contributions: ${endpoint}`);
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
            // Validation de la taille
            if (file.size > appConfig.upload.maxSize) {
                throw new Error(`Fichier trop volumineux. Maximum: ${appConfig.upload.maxSize / 1024 / 1024}MB`);
            }

            // Validation du type
            if (!appConfig.upload.allowedTypes.includes(file.type)) {
                throw new Error(`Type de fichier non supporté. Types acceptés: ${appConfig.upload.allowedTypes.join(', ')}`);
            }

            console.log(`📤 Upload du fichier: ${file.name} (${(file.size / 1024).toFixed(2)} KB)`);

            const response = await this.http.upload('/mutuelle/contribution/upload/payment-proof', file, onProgress);
            
            console.log("✅ Fichier uploadé avec succès:", response.data);
            return response.data; // Retourne le nom du fichier
            
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

    async getCurrentUser() {
        try {
            const response = await this.http.get('/mutuelle/auth/user-info');
            return response.data;
        } catch (error) {
            console.error('❌ Erreur getCurrentUser:', error);
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
}

// Création et export de l'instance unique
const apiService = new ApiService();
export default apiService;