import axios from 'axios';

const API_BASE_URL = 'http://localhost:8080/mut';

class LoanService {
  constructor() {
    this.token = localStorage.getItem('token');
  }

  getAuthHeaders() {
    return {
      Authorization: `Bearer ${this.token}`,
      'Content-Type': 'application/json'
    };
  }

  async getLoanRequests() {
    const response = await axios.get(`${API_BASE_URL}/loan_request`, {
      headers: this.getAuthHeaders()
    });
    return response.data;
  }

  async approveLoan(requestId, role) {
    const endpoint = `${API_BASE_URL}/loan_request/${requestId}/approve/${role.toLowerCase()}`;
    const response = await axios.post(endpoint, {}, {
      headers: this.getAuthHeaders()
    });
    return response.data;
  }

  async rejectLoan(requestId, rejectionReason, rejectedByRole) {
    const response = await axios.post(
      `${API_BASE_URL}/loan_request/${requestId}/reject`,
      { rejectionReason, rejectedByRole },
      { headers: this.getAuthHeaders() }
    );
    return response.data;
  }

  async getCurrentUser() {
    try {
      const response = await axios.get(`${API_BASE_URL}/members/current`, {
        headers: this.getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      // Fallback: décoder le token JWT
      const token = localStorage.getItem('token');
      if (token) {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return {
          id: payload.id,
          firstName: payload.firstName,
          lastName: payload.lastName,
          email: payload.email,
          role: payload.role || 'MEMBER'
        };
      }
      throw error;
    }
  }
}
export const loanService = new LoanService();