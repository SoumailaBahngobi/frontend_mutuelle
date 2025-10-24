import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const RepaymentList = () => {
    const [repayments, setRepayments] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [filters, setFilters] = useState({
        status: '',
        memberId: '',
        loanId: ''
    });

    const loadRepayments = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const token = localStorage.getItem('token');
            
            // D'abord tester l'endpoint
            try {
                const testResponse = await axios.get('http://localhost:8080/mut/repayment', {
                    headers: { 
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });
                console.log('Test endpoint response:', testResponse.data);
            } catch (testError) {
                console.warn('Test endpoint failed, continuing anyway...');
            }

            // Essayer d'abord l'endpoint simplifié
            let url = 'http://localhost:8080/mut/repayment/simple';
            
            console.log('Chargement des remboursements depuis:', url);

            const response = await axios.get(url, {
                headers: { 
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                timeout: 10000
            });

            console.log('Réponse API reçue:', response.data);

            let responseData = response.data;
            
            // Traitement des données
            if (Array.isArray(responseData)) {
                setRepayments(responseData);
            } else if (responseData && Array.isArray(responseData.content)) {
                setRepayments(responseData.content);
            } else if (responseData && typeof responseData === 'object') {
                setRepayments([responseData]);
            } else {
                console.warn('Format de réponse inattendu:', responseData);
                setRepayments([]);
            }

        } catch (err) {
            console.error('Erreur complète:', err);
            
            let errorMessage = 'Erreur lors du chargement des remboursements';
            
            if (err.response) {
                console.log('Status:', err.response.status);
                console.log('Data:', err.response.data);
                
                if (err.response.status === 500) {
                    errorMessage = 'Erreur serveur - Vérifiez les logs du backend';
                } else if (err.response.status === 401) {
                    errorMessage = 'Non authentifié - Veuillez vous reconnecter';
                    localStorage.removeItem('token');
                    localStorage.removeItem('currentUser');
                    window.location.href = '/login';
                } else if (err.response.status === 403) {
                    errorMessage = 'Accès non autorisé';
                } else if (err.response.status === 404) {
                    errorMessage = 'Endpoint non trouvé - Vérifiez l\'URL';
                }
            } else if (err.code === 'ERR_NETWORK') {
                errorMessage = 'Erreur réseau - Vérifiez que le serveur backend est démarré';
            } else if (err.code === 'ECONNABORTED') {
                errorMessage = 'Timeout - Le serveur met trop de temps à répondre';
            } else {
                errorMessage = err.message || errorMessage;
            }
            
            setError(errorMessage);
            setRepayments([]);
        } finally {
            setLoading(false);
        }
    }, []);

    // Chargement initial
    useEffect(() => {
        loadRepayments();
    }, [loadRepayments]);

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({
            ...prev,
            [key]: value
        }));
    };

    const getStatusStyle = (status) => {
        const styles = {
            PENDING: { background: '#fff3cd', color: '#856404', label: 'En attente' },
            PAID: { background: '#d4edda', color: '#155724', label: 'Payé' },
            OVERDUE: { background: '#f8d7da', color: '#721c24', label: 'En retard' },
            PARTIALLY_PAID: { background: '#cce7ff', color: '#004085', label: 'Partiellement payé' },
            CANCELLED: { background: '#e2e3e5', color: '#383d41', label: 'Annulé' }
        };
        return styles[status] || { background: '#f8f9fa', color: '#6c757d', label: status };
    };

    const formatCurrency = (amount) => {
        if (!amount && amount !== 0) return 'N/A';
        return new Intl.NumberFormat('fr-FR', {
            style: 'currency',
            currency: 'XOF'
        }).format(amount);
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        try {
            return new Date(dateString).toLocaleDateString('fr-FR');
        } catch (error) {
            return 'Date invalide';
        }
    };

    // Fonction pour extraire les données de manière sécurisée
    const getSafeValue = (repayment, key, defaultValue = 'N/A') => {
        if (!repayment || typeof repayment !== 'object') return defaultValue;
        
        const value = repayment[key];
        if (value === null || value === undefined) return defaultValue;
        
        return value;
    };

    // Filtrer les remboursements côté client
    const filteredRepayments = repayments.filter(repayment => {
        if (filters.status && getSafeValue(repayment, 'status') !== filters.status) return false;
        if (filters.memberId) {
            const memberId = repayment.member?.id || repayment.loan?.member?.id || repayment.loanRequest?.member?.id;
            if (!memberId || memberId.toString() !== filters.memberId) return false;
        }
        if (filters.loanId) {
            const loanId = repayment.loan?.id;
            if (!loanId || loanId.toString() !== filters.loanId) return false;
        }
        return true;
    });

    return (
        <div style={{ padding: '20px', maxWidth: '1400px', margin: '0 auto' }}>
            {/* En-tête */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <div>
                    <h1 style={{ margin: 0, color: '#333' }}>Gestion des Remboursements</h1>
                    <p style={{ margin: '5px 0 0 0', color: '#666' }}>
                        {filteredRepayments.length} remboursement(s) trouvé(s)
                        {loading && ' • Chargement...'}
                    </p>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <button 
                        onClick={loadRepayments}
                        disabled={loading}
                        style={{ 
                            padding: '10px 20px', 
                            background: '#28a745', 
                            color: 'white', 
                            border: 'none', 
                            borderRadius: '4px',
                            cursor: loading ? 'not-allowed' : 'pointer',
                            fontWeight: 'bold',
                            opacity: loading ? 0.6 : 1
                        }}
                    >
                        {loading ? '⏳' : '🔄'} Recharger
                    </button>
                </div>
            </div>

            {/* Message d'erreur */}
            {error && (
                <div style={{ 
                    background: '#f8d7da', 
                    color: '#721c24', 
                    padding: '15px', 
                    borderRadius: '4px', 
                    marginBottom: '20px',
                    border: '1px solid #f5c6cb'
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <strong>Information:</strong> {error}
                        </div>
                        <button 
                            onClick={() => setError(null)}
                            style={{ 
                                background: 'none', 
                                border: 'none', 
                                color: '#721c24', 
                                cursor: 'pointer',
                                fontSize: '16px'
                            }}
                        >
                            ✕
                        </button>
                    </div>
                </div>
            )}

            {/* Filtres */}
            <div style={{ 
                background: '#f8f9fa', 
                padding: '20px', 
                borderRadius: '8px', 
                marginBottom: '20px',
                border: '1px solid #dee2e6'
            }}>
                <h3 style={{ marginTop: 0, color: '#495057' }}>Filtres</h3>
                <div style={{ display: 'flex', gap: '20px', alignItems: 'end', flexWrap: 'wrap' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Statut</label>
                        <select 
                            value={filters.status}
                            onChange={(e) => handleFilterChange('status', e.target.value)}
                            style={{ 
                                padding: '8px 12px', 
                                border: '1px solid #ced4da',
                                borderRadius: '4px',
                                minWidth: '150px'
                            }}
                        >
                            <option value="">Tous les statuts</option>
                            <option value="PENDING">En attente</option>
                            <option value="PAID">Payé</option>
                            <option value="OVERDUE">En retard</option>
                        </select>
                    </div>
                    
                    <div>
                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>ID Membre</label>
                        <input 
                            type="number"
                            placeholder="Filtrer par membre"
                            value={filters.memberId}
                            onChange={(e) => handleFilterChange('memberId', e.target.value)}
                            style={{ 
                                padding: '8px 12px', 
                                border: '1px solid #ced4da',
                                borderRadius: '4px',
                                minWidth: '150px'
                            }}
                        />
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>ID Prêt</label>
                        <input 
                            type="number"
                            placeholder="Filtrer par prêt"
                            value={filters.loanId}
                            onChange={(e) => handleFilterChange('loanId', e.target.value)}
                            style={{ 
                                padding: '8px 12px', 
                                border: '1px solid #ced4da',
                                borderRadius: '4px',
                                minWidth: '150px'
                            }}
                        />
                    </div>

                    <button 
                        onClick={() => setFilters({ status: '', memberId: '', loanId: '' })}
                        style={{ 
                            padding: '8px 16px', 
                            background: '#6c757d', 
                            color: 'white', 
                            border: 'none', 
                            borderRadius: '4px',
                            cursor: 'pointer'
                        }}
                    >
                        🔄 Réinitialiser
                    </button>
                </div>
            </div>

            {/* Tableau */}
            {loading ? (
                <div style={{ textAlign: 'center', padding: '40px' }}>
                    <div style={{
                        border: '4px solid #f3f3f3',
                        borderTop: '4px solid #007bff',
                        borderRadius: '50%',
                        width: '40px',
                        height: '40px',
                        animation: 'spin 2s linear infinite',
                        margin: '0 auto 20px'
                    }}></div>
                    <p style={{ color: '#6c757d' }}>Chargement des remboursements...</p>
                </div>
            ) : filteredRepayments.length > 0 ? (
                <div style={{ 
                    background: 'white', 
                    borderRadius: '8px', 
                    overflow: 'hidden', 
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                    overflowX: 'auto'
                }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '800px' }}>
                        <thead>
                            <tr style={{ background: '#f8f9fa' }}>
                                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #dee2e6', fontWeight: '600' }}>ID</th>
                                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #dee2e6', fontWeight: '600' }}>Montant</th>
                                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #dee2e6', fontWeight: '600' }}>Statut</th>
                                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #dee2e6', fontWeight: '600' }}>Date d'échéance</th>
                                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #dee2e6', fontWeight: '600' }}>Date de paiement</th>
                                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #dee2e6', fontWeight: '600' }}>Prêt</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredRepayments.map(repayment => {
                                const statusStyle = getStatusStyle(getSafeValue(repayment, 'status', 'PENDING'));
                                return (
                                    <tr key={getSafeValue(repayment, 'id')} style={{ borderBottom: '1px solid #dee2e6' }}>
                                        <td style={{ padding: '12px', fontWeight: '500' }}>
                                            #{getSafeValue(repayment, 'id')}
                                        </td>
                                        <td style={{ padding: '12px', fontWeight: '600' }}>
                                            {formatCurrency(getSafeValue(repayment, 'amount', 0))}
                                        </td>
                                        <td style={{ padding: '12px' }}>
                                            <span style={{
                                                padding: '6px 12px',
                                                borderRadius: '20px',
                                                fontSize: '12px',
                                                fontWeight: 'bold',
                                                background: statusStyle.background,
                                                color: statusStyle.color,
                                                display: 'inline-block',
                                                minWidth: '120px',
                                                textAlign: 'center'
                                            }}>
                                                {statusStyle.label}
                                            </span>
                                        </td>
                                        <td style={{ padding: '12px' }}>
                                            {formatDate(getSafeValue(repayment, 'dueDate'))}
                                        </td>
                                        <td style={{ padding: '12px' }}>
                                            {formatDate(getSafeValue(repayment, 'repaymentDate'))}
                                        </td>
                                        <td style={{ padding: '12px', color: '#495057' }}>
                                            {repayment.loan?.id ? `Prêt #${repayment.loan.id}` : 
                                             repayment.loanRequest?.id ? `Demande #${repayment.loanRequest.id}` : 'N/A'}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div style={{ 
                    textAlign: 'center', 
                    padding: '60px 40px', 
                    color: '#6c757d',
                    background: 'white',
                    borderRadius: '8px',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }}>
                    <div style={{ fontSize: '48px', marginBottom: '20px' }}>📄</div>
                    <h3 style={{ margin: '0 0 10px 0', color: '#495057' }}>Aucun remboursement trouvé</h3>
                    <p style={{ margin: '0 0 20px 0' }}>
                        {Object.values(filters).some(f => f) 
                            ? 'Aucun remboursement ne correspond à vos critères de filtrage.' 
                            : 'Aucun remboursement disponible pour le moment.'
                        }
                    </p>
                    <button 
                        onClick={loadRepayments}
                        style={{ 
                            padding: '10px 20px', 
                            background: '#007bff', 
                            color: 'white', 
                            border: 'none', 
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontWeight: 'bold'
                        }}
                    >
                        🔄 Recharger
                    </button>
                </div>
            )}

            <style>{`
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
                
                tr:hover {
                    background-color: #f8f9fa !important;
                }
            `}</style>
        </div>
    );
};

export default RepaymentList;