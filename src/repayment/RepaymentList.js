import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const RepaymentList = () => {
    const [repayments, setRepayments] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [pagination, setPagination] = useState({
        page: 0,
        size: 20,
        totalPages: 0,
        totalElements: 0
    });
    const [filters, setFilters] = useState({
        status: '',
        memberId: '',
        loanRequestId: '',
        loanId: ''
    });

    const loadRepayments = useCallback(async (page = pagination.page, size = pagination.size) => {
        setLoading(true);
        setError(null);
        try {
            const token = localStorage.getItem('token');
            
            // Utiliser l'endpoint filtré avec pagination
            let url = 'http://localhost:8080/mut/repayment/filters';
            const params = {
                page,
                size,
                _t: Date.now() // Cache buster
            };

            // Ajouter les filtres s'ils sont définis
            if (filters.status) params.status = filters.status;
            if (filters.memberId) params.memberId = filters.memberId;
            if (filters.loanRequestId) params.loanRequestId = filters.loanRequestId;
            if (filters.loanId) params.loanId = filters.loanId;

            console.log('Chargement des remboursements avec params:', params);

            const response = await axios.get(url, {
                params,
                headers: { 
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                    'Cache-Control': 'no-cache'
                }
            });

            console.log('Réponse API reçue:', response.data);

            // Gestion de la réponse paginée Spring
            if (response.data && response.data.content) {
                // Structure paginée Spring Data
                const pageData = response.data;
                setRepayments(pageData.content || []);
                setPagination({
                    page: pageData.number || 0,
                    size: pageData.size || size,
                    totalPages: pageData.totalPages || 1,
                    totalElements: pageData.totalElements || 0
                });
            } 
            // Gestion des tableaux simples (fallback)
            else if (Array.isArray(response.data)) {
                setRepayments(response.data);
                setPagination({
                    page: 0,
                    size: response.data.length,
                    totalPages: 1,
                    totalElements: response.data.length
                });
            }
            else {
                console.warn('Format de réponse inattendu:', response.data);
                setRepayments([]);
                setPagination({
                    page: 0,
                    size: 20,
                    totalPages: 0,
                    totalElements: 0
                });
            }

        } catch (err) {
            console.error('Erreur complète:', err);
            
            let errorMessage = 'Erreur lors du chargement des remboursements';
            
            if (err.response) {
                if (err.response.status === 401) {
                    errorMessage = 'Non authentifié - Veuillez vous reconnecter';
                } else if (err.response.status === 403) {
                    errorMessage = 'Accès non autorisé';
                } else if (err.response.status === 404) {
                    errorMessage = 'Endpoint non trouvé';
                } else if (err.response.data) {
                    // Essayer d'extraire le message d'erreur
                    try {
                        if (typeof err.response.data === 'string') {
                            errorMessage = err.response.data;
                        } else if (err.response.data.message) {
                            errorMessage = err.response.data.message;
                        } else {
                            errorMessage = 'Erreur serveur';
                        }
                    } catch (parseError) {
                        errorMessage = 'Erreur de traitement des données';
                    }
                }
            } else if (err.request) {
                errorMessage = 'Erreur réseau - Vérifiez votre connexion';
            } else {
                errorMessage = err.message || errorMessage;
            }
            
            setError(errorMessage);
            setRepayments([]);
        } finally {
            setLoading(false);
        }
    }, [filters, pagination.page, pagination.size]);

    // Recharger quand les filtres changent
    useEffect(() => {
        loadRepayments(0, pagination.size);
    }, [filters]);

    // Recharger quand la pagination change
    useEffect(() => {
        loadRepayments(pagination.page, pagination.size);
    }, [pagination.page, pagination.size]);

    // Chargement initial
    useEffect(() => {
        loadRepayments(0, 20);
    }, []);

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({
            ...prev,
            [key]: value
        }));
    };

    const handlePageChange = (newPage) => {
        if (newPage >= 0 && newPage < pagination.totalPages) {
            setPagination(prev => ({ ...prev, page: newPage }));
        }
    };

    const handleSizeChange = (newSize) => {
        setPagination(prev => ({ ...prev, size: parseInt(newSize), page: 0 }));
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
            currency: 'EUR'
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

    return (
        <div style={{ padding: '20px', maxWidth: '1400px', margin: '0 auto' }}>
            {/* En-tête */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <div>
                    <h1 style={{ margin: 0, color: '#333' }}>Gestion des Remboursements</h1>
                    <p style={{ margin: '5px 0 0 0', color: '#666' }}>
                        {pagination.totalElements} remboursement(s) trouvé(s)
                        {loading && ' • Chargement...'}
                    </p>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <button 
                        onClick={() => loadRepayments(0, 20)}
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
                            <strong>Erreur:</strong> {error}
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
                            <option value="PARTIALLY_PAID">Partiellement payé</option>
                            <option value="CANCELLED">Annulé</option>
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
                        onClick={() => setFilters({ status: '', memberId: '', loanRequestId: '', loanId: '' })}
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

            {/* Pagination en haut */}
            {pagination.totalPages > 1 && (
                <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center', 
                    marginBottom: '15px',
                    padding: '10px',
                    background: '#e9ecef',
                    borderRadius: '4px'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span>Éléments par page:</span>
                        <select 
                            value={pagination.size}
                            onChange={(e) => handleSizeChange(e.target.value)}
                            style={{ padding: '5px', border: '1px solid #ced4da', borderRadius: '4px' }}
                        >
                            <option value="10">10</option>
                            <option value="20">20</option>
                            <option value="50">50</option>
                        </select>
                    </div>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <button 
                            onClick={() => handlePageChange(0)}
                            disabled={pagination.page === 0}
                            style={{ 
                                padding: '5px 10px', 
                                border: '1px solid #007bff',
                                background: pagination.page === 0 ? '#f8f9fa' : 'white',
                                color: pagination.page === 0 ? '#6c757d' : '#007bff',
                                borderRadius: '4px',
                                cursor: pagination.page === 0 ? 'not-allowed' : 'pointer'
                            }}
                        >
                            ⟪
                        </button>
                        <button 
                            onClick={() => handlePageChange(pagination.page - 1)}
                            disabled={pagination.page === 0}
                            style={{ 
                                padding: '5px 10px', 
                                border: '1px solid #007bff',
                                background: pagination.page === 0 ? '#f8f9fa' : 'white',
                                color: pagination.page === 0 ? '#6c757d' : '#007bff',
                                borderRadius: '4px',
                                cursor: pagination.page === 0 ? 'not-allowed' : 'pointer'
                            }}
                        >
                            ⟨
                        </button>
                        
                        <span style={{ margin: '0 10px' }}>
                            Page {pagination.page + 1} sur {pagination.totalPages}
                        </span>
                        
                        <button 
                            onClick={() => handlePageChange(pagination.page + 1)}
                            disabled={pagination.page >= pagination.totalPages - 1}
                            style={{ 
                                padding: '5px 10px', 
                                border: '1px solid #007bff',
                                background: pagination.page >= pagination.totalPages - 1 ? '#f8f9fa' : 'white',
                                color: pagination.page >= pagination.totalPages - 1 ? '#6c757d' : '#007bff',
                                borderRadius: '4px',
                                cursor: pagination.page >= pagination.totalPages - 1 ? 'not-allowed' : 'pointer'
                            }}
                        >
                            ⟩
                        </button>
                        <button 
                            onClick={() => handlePageChange(pagination.totalPages - 1)}
                            disabled={pagination.page >= pagination.totalPages - 1}
                            style={{ 
                                padding: '5px 10px', 
                                border: '1px solid #007bff',
                                background: pagination.page >= pagination.totalPages - 1 ? '#f8f9fa' : 'white',
                                color: pagination.page >= pagination.totalPages - 1 ? '#6c757d' : '#007bff',
                                borderRadius: '4px',
                                cursor: pagination.page >= pagination.totalPages - 1 ? 'not-allowed' : 'pointer'
                            }}
                        >
                            ⟫
                        </button>
                    </div>
                </div>
            )}

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
            ) : repayments.length > 0 ? (
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
                                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #dee2e6', fontWeight: '600' }}>Date Échéance</th>
                                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #dee2e6', fontWeight: '600' }}>Membre</th>
                                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #dee2e6', fontWeight: '600' }}>Prêt</th>
                            </tr>
                        </thead>
                        <tbody>
                            {repayments.map(repayment => {
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
                                        <td style={{ padding: '12px', color: '#495057' }}>
                                            {getSafeValue(repayment, 'memberId') ? `Membre #${getSafeValue(repayment, 'memberId')}` : 'N/A'}
                                        </td>
                                        <td style={{ padding: '12px', color: '#495057' }}>
                                            {getSafeValue(repayment, 'loanId') ? `Prêt #${getSafeValue(repayment, 'loanId')}` : 'N/A'}
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
                        onClick={() => loadRepayments(0, 20)}
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