import React from 'react';
import { useNavigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import axios from 'axios';

function AddIndividualContribution() {
    const [form, setForm] = React.useState({
        amount: '', 
        paymentDate: new Date().toISOString().split('T')[0],
        contributionPeriodId: '',
        paymentMode: 'ESPECES',
        paymentProof: ''
    });
    
    const [contributionPeriods, setContributionPeriods] = React.useState([]);
    const [currentUser, setCurrentUser] = React.useState(null);
    const [loading, setLoading] = React.useState(true);
    
    const navigate = useNavigate();

    React.useEffect(() => {
        getCurrentUser();
        fetchContributionPeriods();
    }, []);

    const getCurrentUser = () => {
        let user = null;
        
        try {
            const userData = localStorage.getItem('currentUser');
            if (userData) {
                user = JSON.parse(userData);
            }
        } catch (error) {
            console.log('Erreur localStorage:', error);
        }

        if (user) {
            setCurrentUser(user);
        } else {
            navigate('/login');
        }
    };

    const fetchContributionPeriods = async () => {
        try {
            setLoading(true);
            const response = await axios.get('http://localhost:8080/mut/contribution_period');
            setContributionPeriods(response.data);
        } catch (error) {
            console.error('Erreur lors de la récupération des périodes de cotisation', error);
            alert('Erreur lors du chargement des périodes de cotisation');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!currentUser) {
            alert('Vous devez être connecté pour ajouter une cotisation');
            navigate('/login');
            return;
        }

        if (!form.contributionPeriodId) {
            alert('Veuillez sélectionner une période de cotisation');
            return;
        }

        if (!form.amount || parseFloat(form.amount) <= 0) {
            alert('Veuillez saisir un montant valide');
            return;
        }

        try {
            // Format des données compatible avec Spring/Jackson
            const contributionData = {
                amount: form.amount, // Laisser en string, Spring convertira en BigDecimal
                paymentDate: form.paymentDate + "T00:00:00", // Format datetime complet
                paymentMode: form.paymentMode,
                paymentProof: form.paymentProof || null,
                member: { 
                    id: currentUser.id || currentUser.memberId
                },
                contributionPeriod: { 
                    id: parseInt(form.contributionPeriodId) 
                },
                contributionType: "INDIVIDUAL"
            };
            
            console.log('📤 DONNEES ENVOYEES:', contributionData);
            
            const token = localStorage.getItem('token');
            
            const response = await axios.post(
                'http://localhost:8080/mut/contribution/individual', 
                contributionData,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );
            
            console.log('✅ REPONSE:', response.data);
            
            // Vérifier les données retournées
            if (response.data) {
                const savedContribution = response.data;
                console.log('💾 COTISATION SAUVEE:', {
                    id: savedContribution.id,
                    amount: savedContribution.amount,
                    paymentDate: savedContribution.paymentDate,
                    paymentMode: savedContribution.paymentMode,
                    paymentProof: savedContribution.paymentProof
                });
            }
            
            alert('Cotisation ajoutée avec succès !');  
            
            // Réinitialiser
            setForm({
                amount: '', 
                paymentDate: new Date().toISOString().split('T')[0],
                contributionPeriodId: '',
                paymentMode: 'ESPECES',
                paymentProof: ''
            });
            
            navigate('/dashboard');
            
        } catch (error) {
            console.error('❌ ERREUR COMPLETE:', error);
            console.error('❌ DONNEES ERREUR:', error.response?.data);
            
            if (error.response?.status === 400) {
                alert('Erreur de validation: ' + 
                    (error.response.data.message || JSON.stringify(error.response.data)));
            } else {
                alert('Erreur serveur: ' + (error.message || 'Veuillez réessayer'));
            }
        }
    };

    if (!currentUser) {
        return (
            <div className="container">
                <div className="alert alert-warning text-center">
                    <h4>Accès non autorisé</h4>
                    <p>Vous devez être connecté pour accéder à cette page.</p>
                    <button 
                        className="btn btn-primary" 
                        onClick={() => navigate('/login')}
                    >
                        Se connecter
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div>
            <div className='container'>
                <div className="card">
                    <div className="card-header">
                        <h3>Ajouter une Cotisation Individuelle</h3>
                    </div>
                    <div className="card-body">
                        <div className="alert alert-info">
                            <strong>Utilisateur :</strong> {currentUser.name} {currentUser.firstName}
                            <br />
                            <small>ID: {currentUser.id || currentUser.memberId}</small>
                        </div>
                        
                        <form onSubmit={handleSubmit}>
                            <div className="row">
                                <div className="col-md-6">
                                    <div className="form-group mb-3">
                                        <label htmlFor="amount" className="form-label">Montant (FCFA) *</label>
                                        <input 
                                            type="number" 
                                            className="form-control" 
                                            id="amount" 
                                            name="amount" 
                                            value={form.amount} 
                                            onChange={handleChange} 
                                            placeholder="Ex: 5000" 
                                            required
                                            min="1"
                                            step="1"
                                        />
                                    </div>
                                </div>
                                
                                <div className="col-md-6">
                                    <div className="form-group mb-3">
                                        <label htmlFor="paymentDate" className="form-label">Date de paiement *</label>
                                        <input 
                                            type="date" 
                                            className="form-control" 
                                            id="paymentDate" 
                                            name="paymentDate" 
                                            value={form.paymentDate} 
                                            onChange={handleChange} 
                                            required
                                        />  
                                    </div>
                                </div>
                            </div>
                            
                            <div className="row">
                                <div className="col-md-6">
                                    <div className="form-group mb-3">
                                        <label htmlFor="paymentMode" className="form-label">Mode de paiement *</label>
                                        <select 
                                            id="paymentMode" 
                                            name="paymentMode" 
                                            className="form-control" 
                                            value={form.paymentMode} 
                                            onChange={handleChange}
                                            required
                                        >
                                            <option value="ESPECES">Espèces</option>
                                            <option value="CHEQUE">Chèque</option>
                                            <option value="VIREMENT">Virement</option>
                                            <option value="MOBILE_MONEY">Mobile Money</option>
                                            <option value="CARTE">Carte bancaire</option>
                                        </select>
                                    </div>
                                </div>
                                
                                <div className="col-md-6">
                                    <div className="form-group mb-3">
                                        <label htmlFor="paymentProof" className="form-label">Preuve de paiement</label>
                                        <input 
                                            type="text" 
                                            className="form-control" 
                                            id="paymentProof" 
                                            name="paymentProof" 
                                            value={form.paymentProof} 
                                            onChange={handleChange} 
                                            placeholder="Référence, numéro de chèque..."
                                        />
                                    </div>
                                </div>
                            </div>
                            
                            <div className="form-group mb-4">
                                <label htmlFor="contributionPeriodId" className="form-label">Période *</label>
                                {loading ? (
                                    <div className="form-control">Chargement...</div>
                                ) : (
                                    <select 
                                        id="contributionPeriodId" 
                                        name="contributionPeriodId" 
                                        className="form-control" 
                                        value={form.contributionPeriodId} 
                                        onChange={handleChange}
                                        required
                                    >
                                        <option value="">Choisir une période</option>
                                        {contributionPeriods.map((period) => (
                                            <option key={period.id} value={period.id}>
                                                {period.description} 
                                                ({new Date(period.startDate).toLocaleDateString()} - {new Date(period.endDate).toLocaleDateString()})
                                            </option>
                                        ))}
                                    </select>
                                )}
                            </div>
                            
                            <div className="d-grid gap-2 d-md-flex justify-content-md-end">
                                <button 
                                    type="button" 
                                    className="btn btn-secondary me-md-2" 
                                    onClick={() => navigate('/dashboard')}
                                >
                                    Annuler
                                </button>
                                <button 
                                    type="submit" 
                                    className="btn btn-primary" 
                                    disabled={loading}
                                >
                                    {loading ? 'En cours...' : 'Valider la cotisation'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default AddIndividualContribution;