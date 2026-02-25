// src/services/api.js
import keycloak from '../keycloak/keycloak';

const API_BASE_URL = 'http://localhost:8082'; // URL de votre backend

class ApiService {
  async getAuthHeader() {
    if (!keycloak.authenticated) {
      throw new Error('Non authentifié');
    }
    
    try {
      // Rafraîchir le token si nécessaire
      await keycloak.updateToken(30);
      return {
        'Authorization': `Bearer ${keycloak.token}`,
        'Content-Type': 'application/json'
      };
    } catch (error) {
      console.error('Erreur de rafraîchissement du token:', error);
      throw error;
    }
  }

  async get(endpoint) {
    try {
      const headers = await this.getAuthHeader();
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'GET',
        headers
      });
      
      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Erreur API GET:', error);
      throw error;
    }
  }

  async post(endpoint, data) {
    try {
      const headers = await this.getAuthHeader();
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers,
        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Erreur API POST:', error);
      throw error;
    }
  }

  async put(endpoint, data) {
    try {
      const headers = await this.getAuthHeader();
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Erreur API PUT:', error);
      throw error;
    }
  }

  async delete(endpoint) {
    try {
      const headers = await this.getAuthHeader();
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'DELETE',
        headers
      });
      
      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Erreur API DELETE:', error);
      throw error;
    }
  }
}

export default new ApiService();