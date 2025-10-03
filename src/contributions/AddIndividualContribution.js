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
        paymentProof: null
    });
    
    const [contributionPeriods, setContributionPeriods] = React.useState([]);
    const [currentUser, setCurrentUser] = React.useState(null);
    const [loading, setLoading] = React.useState(true);
    const [uploading, setUploading] = React.useState(false);
    const [fileName, setFileName] = React.useState('');
    
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
            console.error('Erreur lors de la récupération des campagnes de cotisation', error);
            alert('Erreur lors du chargement des campagnes de cotisation');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        
        if (name === 'contributionPeriodId') {
            // Trouver la période sélectionnée
            const selectedPeriod = contributionPeriods.find(period => period.id === parseInt(value));
            
            if (selectedPeriod) {
                // Mettre à jour le montant automatiquement
                setForm({ 
                    ...form, 
                    [name]: value,
                    amount: selectedPeriod.individualAmount || selectedPeriod.amount || ''
                });
            } else {
                setForm({ ...form, [name]: value });
            }
        } else {
            setForm({ ...form, [name]: value });
        }
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            // Vérifier la taille du fichier (max 5MB)
            if (file.size > 5 * 1024 * 1024) {
                alert('Le fichier est trop volumineux. Taille maximale: 5MB');
                e.target.value = ''; // Reset l'input file
                return;
            }
            
            // Vérifier le type de fichier
            const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
            if (!allowedTypes.includes(file.type)) {
                alert('Type de fichier non supporté. Formats acceptés: JPEG, PNG, PDF');
                e.target.value = ''; // Reset l'input file
                return;
            }
            
            setForm({ ...form, paymentProof: file });
            setFileName(file.name);
        }
    };

    const uploadPaymentProof = async (file) => {
        try {
            const token = localStorage.getItem('token');
            const formData = new FormData();
            formData.append('file', file);
            
            console.log(' Début upload du fichier:', file.name);
            
            const response = await axios.post(
                'http://localhost:8080/mut/contribution/upload/payment-proof', 
                formData,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'multipart/form-data'
                    },
                    timeout: 30000 // 30 secondes timeout
                }
            );
            
            console.log('✅ Upload réussi:', response.data);
            return response.data; // Retourne le nom du fichier
            
        } catch (error) {
            console.error('Erreur upload:', error);
            
            if (error.response) {
                // Le serveur a répondu avec un code d'erreur
                throw new Error(error.response.data || 'Erreur lors de l\'upload');
            } else if (error.request) {
                // La requête a été faite mais aucune réponse n'a été reçue
                throw new Error('Serveur non accessible. Vérifiez votre connexion.');
            } else {
                // Quelque chose s'est mal passé lors de la configuration de la requête
                throw new Error('Erreur de configuration: ' + error.message);
            }
        }
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
            setUploading(true);
            
            let paymentProofFileName = null;
            
            // Upload du fichier de preuve de paiement si présent
            if (form.paymentProof) {
                try {
                    paymentProofFileName = await uploadPaymentProof(form.paymentProof);
                } catch (uploadError) {
                    alert('Erreur lors de l\'upload du fichier: ' + uploadError.message);
                    setUploading(false);
                    return;
                }
            }

            // Format des données compatible avec Spring/Jackson
            const contributionData = {
                amount: form.amount,
                paymentDate: form.paymentDate + "T00:00:00",
                paymentMode: form.paymentMode,
                paymentProof: paymentProofFileName, // Nom du fichier uploadé
                member: { 
                    id: currentUser.id || currentUser.memberId
                },
                contributionPeriod: { 
                    id: parseInt(form.contributionPeriodId) 
                },
                contributionType: "INDIVIDUAL"
            };
            
            console.log('📤 DONNEES COTISATION:', contributionData);
            
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
            
            console.log('✅ COTISATION CREEE:', response.data);
            
            alert('Cotisation ajoutée avec succès !');  
            
            // Réinitialiser
            setForm({
                amount: '', 
                paymentDate: new Date().toISOString().split('T')[0],
                contributionPeriodId: '',
                paymentMode: 'ESPECES',
                paymentProof: null
            });
            setFileName('');
            
            navigate('/dashboard');
            
        } catch (error) {
            console.error('❌ ERREUR COMPLETE:', error);
            
            if (error.response?.status === 400) {
                alert('Erreur de validation: ' + 
                    (error.response.data.message || JSON.stringify(error.response.data)));
            } else if (error.response?.status === 500) {
                alert('Erreur serveur. Veuillez contacter l\'administrateur.');
            } else {
                alert('Erreur: ' + (error.message || 'Veuillez réessayer'));
            }
        } finally {
            setUploading(false);
        }
    };

    const removeFile = () => {
        setForm({ ...form, paymentProof: null });
        setFileName('');
        // Reset l'input file
        const fileInput = document.getElementById('paymentProof');
        if (fileInput) fileInput.value = '';
    };

    // Fonction pour obtenir le montant de la période sélectionnée
    const getSelectedPeriodAmount = () => {
        if (!form.contributionPeriodId) return null;
        const selectedPeriod = contributionPeriods.find(period => period.id === parseInt(form.contributionPeriodId));
        return selectedPeriod ? (selectedPeriod.individualAmount || selectedPeriod.amount) : null;
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
                                        <label htmlFor="amount" className="form-label">
                                            Montant (FCFA) *
                                            {getSelectedPeriodAmount() && (
                                                <span className="text-success ms-2">
                                                    (Montant automatique: {getSelectedPeriodAmount()} FCFA)
                                                </span>
                                            )}
                                        </label>
                                        <input 
                                            type="number" 
                                            className="form-control" 
                                            id="amount" 
                                            name="amount" 
                                            value={form.amount} 
                                            onChange={handleChange} 
                                            placeholder="Le montant est automaitique selon la période sélectionnée " 
                                            required
                                            min="1"
                                            step="1"
                                            readOnly={!!getSelectedPeriodAmount()} // Rendre le champ en lecture seule si le montant est automatique
                                        />
                                        {getSelectedPeriodAmount() && (
                                            <small className="form-text text-muted">
                                                Le montant est automatiquement défini selon la période sélectionnée
                                            </small>
                                        )}
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
                                        <div className="input-group">
                                            <input 
                                                type="file" 
                                                className="form-control" 
                                                id="paymentProof" 
                                                name="paymentProof" 
                                                onChange={handleFileChange}
                                                accept=".jpg,.jpeg,.png,.pdf,.JPG,.JPEG,.PNG,.PDF"
                                            />
                                        </div>
                                        <small className="form-text text-muted">
                                            Formats acceptés: JPG, PNG, PDF (max 5MB)
                                        </small>
                                        
                                        {/* Affichage du fichier sélectionné */}
                                        {fileName && (
                                            <div className="mt-2 p-2 border rounded bg-light">
                                                <div className="d-flex justify-content-between align-items-center">
                                                    <span>
                                                        <i className="fas fa-file me-2"></i>
                                                        {fileName}
                                                    </span>
                                                    <button 
                                                        type="button" 
                                                        className="btn btn-sm btn-outline-danger"
                                                        onClick={removeFile}
                                                    >
                                                        <i className="fas fa-times"></i>
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                            
                            <div className="form-group mb-4">
                                <label htmlFor="contributionPeriodId" className="form-label">Campagne de Cotisation *</label>
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
                                        <option value="">Choisir une campagne de cotisation</option>
                                        {contributionPeriods.map((period) => (
                                            <option key={period.id} value={period.id}>
                                                {period.description} 
                                                ({new Date(period.startDate).toLocaleDateString()} - {new Date(period.endDate).toLocaleDateString()})
                                                - Montant: {period.individualAmount || period.amount} FCFA
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
                                    disabled={loading || uploading}
                                >
                                    {uploading ? 'Upload en cours...' : (loading ? 'En cours...' : 'Valider la cotisation')}
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