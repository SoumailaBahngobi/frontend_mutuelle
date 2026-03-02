import React from 'react'
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

function AddGroupContribution() {
    const [form, setForm] = React.useState({
        individualAmount: '',
        totalAmount: '',
        paymentDate: new Date().toISOString().split('T')[0],
        contributionPeriodId: '',
        paymentMode: 'ESPECES',
        paymentProof: null
    });
    
    const [contributionPeriods, setContributionPeriods] = React.useState([]);
    const [allMembers, setAllMembers] = React.useState([]);
    const [selectedMembers, setSelectedMembers] = React.useState([]);
    const [currentUser, setCurrentUser] = React.useState(null);
    const [loading, setLoading] = React.useState(true);
    const [membersLoading, setMembersLoading] = React.useState(false);
    const [uploading, setUploading] = React.useState(false);
    const [fileName, setFileName] = React.useState('');
    
    const navigate = useNavigate();

    React.useEffect(() => {
        getCurrentUser();
        fetchContributionPeriods();
        fetchAllMembers();
    }, []);

    // Calculer le montant total quand la sélection ou le montant individuel change
    React.useEffect(() => {
        const individualAmount = parseFloat(form.individualAmount) || 0;
        const total = selectedMembers.length * individualAmount;
        setForm(prev => ({
            ...prev,
            totalAmount: total > 0 ? total.toString() : ''
        }));
    }, [selectedMembers, form.individualAmount]);

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
            const response = await axios.get('http://localhost:8081/mutuelle/contribution_period');
            setContributionPeriods(response.data);
        } catch (error) {
            console.error('Erreur lors de la récupération des campagnes de cotisation', error);
            alert('Erreur lors du chargement des campagnes de cotisation');
        } finally {
            setLoading(false);
        }
    };

    const fetchAllMembers = async () => {
        try {
            setMembersLoading(true);
            const token = localStorage.getItem('token');
            const response = await axios.get('http://localhost:8081/mutuelle/member', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            setAllMembers(response.data);
        } catch (error) {
            console.error('Erreur lors de la récupération des membres', error);
            alert('Erreur lors du chargement de la liste des membres');
        } finally {
            setMembersLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        
        if (name === 'contributionPeriodId') {
            // Trouver les campagnes sélectionnée
            const selectedPeriod = contributionPeriods.find(period => period.id === parseInt(value));
            
            if (selectedPeriod) {
                // Mettre à jour le montant individuel automatiquement
                const periodAmount = selectedPeriod.individualAmount || selectedPeriod.amount || '';
                setForm({ 
                    ...form, 
                    [name]: value,
                    individualAmount: periodAmount
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
                return;
            }
            
            // Vérifier le type de fichier
            const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
            if (!allowedTypes.includes(file.type)) {
                alert('Type de fichier non supporté. Formats acceptés: JPEG, PNG, PDF');
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
            
            const response = await axios.post(
                'http://localhost:8081/mutuelle/contribution/upload/payment-proof', 
                formData,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'multipart/form-data'
                    }
                }
            );
            
            return response.data;
        } catch (error) {
            console.error('Erreur upload:', error);
            throw new Error('Erreur lors de l\'upload du fichier');
        }
    };

    const handleMemberSelection = (memberId) => {
        setSelectedMembers(prev => {
            if (prev.includes(memberId)) {
                return prev.filter(id => id !== memberId);
            } else {
                return [...prev, memberId];
            }
        });
    };

    const selectAllMembers = () => {
        if (selectedMembers.length === allMembers.length) {
            setSelectedMembers([]);
        } else {
            const allMemberIds = allMembers.map(member => member.id);
            setSelectedMembers(allMemberIds);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!currentUser) {
            alert('Vous devez être connecté pour ajouter une cotisation');
            navigate('/login');
            return;
        }

        if (selectedMembers.length === 0) {
            alert('Veuillez sélectionner au moins un membre');
            return;
        }

        if (!form.individualAmount || parseFloat(form.individualAmount) <= 0) {
            alert('Veuillez saisir un montant individuel valide');
            return;
        }

        if (!form.contributionPeriodId) {
            alert('Veuillez sélectionner une campagne de cotisation');
            return;
        }

        try {
            setUploading(true);
            
            let paymentProofUrl = null;
            
            // Upload du fichier de preuve de paiement si présent
            if (form.paymentProof) {
                paymentProofUrl = await uploadPaymentProof(form.paymentProof);
            }

            const token = localStorage.getItem('token');
            const individualAmount = parseFloat(form.individualAmount);

            // STRUCTURE CORRIGÉE POUR LE BACKEND
            const groupContributionData = {
                amount: individualAmount,
                paymentDate: form.paymentDate + "T00:00:00",
                paymentMode: form.paymentMode,
                paymentProof: paymentProofUrl,
                contributionPeriodId: parseInt(form.contributionPeriodId), // ID seulement, pas l'objet complet
                memberIds: selectedMembers
            };

            console.log('📤 Données envoyées pour cotisation groupée:', groupContributionData);

            const response = await axios.post(
                'http://localhost:8081/mutuelle/contribution/group', 
                groupContributionData,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );
            
            console.log('✅ Réponse reçue:', response.data);
            
            alert(`${selectedMembers.length} cotisation(s) individuelle(s) créée(s) avec succès ! Chaque membre verra sa cotisation dans son historique.`);
            
            // Réinitialiser le formulaire
            setForm({
                individualAmount: '',
                totalAmount: '',
                paymentDate: new Date().toISOString().split('T')[0],
                contributionPeriodId: '',
                paymentMode: 'ESPECES',
                paymentProof: null
            });
            setSelectedMembers([]);
            setFileName('');
            
            navigate('/dashboard');
            
        } catch (error) {
            console.error('❌ ERREUR COMPLETE:', error);
            
            if (error.response?.status === 400) {
                alert('Erreur de validation: ' + 
                    (error.response.data.message || JSON.stringify(error.response.data)));
            } else if (error.response?.status === 500) {
                alert('Erreur serveur: ' + (error.response.data || 'Veuillez contacter l\'administrateur'));
            } else {
                alert('Erreur lors de la création des cotisations: ' + 
                    (error.message || 'Veuillez réessayer'));
            }
        } finally {
            setUploading(false);
        }
    };

    const removeFile = () => {
        setForm({ ...form, paymentProof: null });
        setFileName('');
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
                    <div className="card-header bg-primary text-white">
                        <h3>Ajouter des Cotisations Groupées</h3>
                        <small className="text-light">
                            Sélectionnez un ou plusieurs membres - Chaque membre recevra une cotisation individuelle
                        </small>
                    </div>
                    <div className="card-body">
                        <div className="alert alert-info">
                            <div className="d-flex justify-content-between align-items-center">
                                <div>
                                    <strong>Utilisateur :</strong> {currentUser.name} {currentUser.firstName}
                                    <br />
                                    <small>ID: {currentUser.id || currentUser.memberId}</small>
                                </div>
                                <div className="text-end">
                                    <small className="text-muted">
                                        <i className="bi bi-info-circle me-1"></i>
                                        Chaque membre sélectionné verra sa propre cotisation
                                    </small>
                                </div>
                            </div>
                        </div>
                        
                        <form onSubmit={handleSubmit}>
                            {/* Section Sélection des membres */}
                            <div className="mb-4">
                                <div className="d-flex justify-content-between align-items-center mb-3">
                                    <label className="form-label fw-bold">Sélection des membres *</label>
                                    <div>
                                        <span className="badge bg-primary me-2">
                                            {selectedMembers.length} sélectionné(s)
                                        </span>
                                        <button 
                                            type="button"
                                            className="btn btn-outline-primary btn-sm"
                                            onClick={selectAllMembers}
                                        >
                                            {selectedMembers.length === allMembers.length ? 
                                                'Tout désélectionner' : 'Tout sélectionner'}
                                        </button>
                                    </div>
                                </div>
                                
                                {membersLoading ? (
                                    <div className="alert alert-info text-center">
                                        <div className="spinner-border spinner-border-sm me-2" role="status"></div>
                                        Chargement de la liste des membres...
                                    </div>
                                ) : (
                                    <div className="border rounded p-3" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                                        {allMembers.length === 0 ? (
                                            <div className="text-center text-muted py-3">
                                                <i className="bi bi-people display-4"></i>
                                                <p className="mt-2">Aucun membre trouvé</p>
                                            </div>
                                        ) : (
                                            allMembers.map((member) => (
                                                <div key={member.id} className="form-check mb-2">
                                                    <input
                                                        className="form-check-input"
                                                        type="checkbox"
                                                        id={`member-${member.id}`}
                                                        checked={selectedMembers.includes(member.id)}
                                                        onChange={() => handleMemberSelection(member.id)}
                                                    />
                                                    <label className="form-check-label" htmlFor={`member-${member.id}`}>
                                                        <strong>{member.name} {member.firstName}</strong>
                                                        {member.npi && <span className="text-muted"> - NPI: {member.npi}</span>}
                                                        {member.phone && <span className="text-muted"> - Tél: {member.phone}</span>}
                                                    </label>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                )}
                            </div>

                            <div className="row">
                                <div className="col-md-6">
                                    <div className="form-group mb-3">
                                        <label htmlFor="individualAmount" className="form-label">
                                            Montant par membre (FCFA) *
                                            {getSelectedPeriodAmount() && (
                                                <span className="text-success ms-2">
                                                    <i className="bi bi-check-circle me-1"></i>
                                                    Montant automatique: {getSelectedPeriodAmount()} FCFA
                                                </span>
                                            )}
                                        </label>
                                        <input 
                                            type="number" 
                                            className="form-control" 
                                            id="individualAmount" 
                                            name="individualAmount" 
                                            value={form.individualAmount} 
                                            onChange={handleChange} 
                                            placeholder="Ex: 5000" 
                                            required
                                            min="1"
                                            step="1"
                                            readOnly={!!getSelectedPeriodAmount()}
                                        />
                                        {getSelectedPeriodAmount() && (
                                            <small className="form-text text-muted">
                                                <i className="bi bi-info-circle me-1"></i>
                                                Le montant est automatiquement défini selon la campagne sélectionnée
                                            </small>
                                        )}
                                    </div>
                                </div>
                                
                                <div className="col-md-6">
                                    <div className="form-group mb-3">
                                        <label htmlFor="totalAmount" className="form-label">
                                            <i className="bi bi-calculator me-1"></i>
                                            Montant total calculé (FCFA)
                                        </label>
                                        <input 
                                            type="text" 
                                            className="form-control bg-light" 
                                            id="totalAmount" 
                                            name="totalAmount" 
                                            value={form.totalAmount ? `${form.totalAmount} FCFA` : ''} 
                                            readOnly
                                            style={{ fontWeight: 'bold', fontSize: '1.1em' }}
                                        />
                                        <small className="form-text text-muted">
                                            Calcul: {selectedMembers.length} membre(s) × {form.individualAmount || 0} FCFA = {form.totalAmount || 0} FCFA
                                        </small>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="row">
                                <div className="col-md-6">
                                    <div className="form-group mb-3">
                                        <label htmlFor="paymentDate" className="form-label">
                                            <i className="bi bi-calendar me-1"></i>
                                            Date de paiement *
                                        </label>
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
                                
                                <div className="col-md-6">
                                    <div className="form-group mb-3">
                                        <label htmlFor="paymentMode" className="form-label">
                                            <i className="bi bi-credit-card me-1"></i>
                                            Mode de paiement *
                                        </label>
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
                            </div>
                            
                            <div className="row">
                                <div className="col-md-6">
                                    <div className="form-group mb-3">
                                        <label htmlFor="paymentProof" className="form-label">
                                            <i className="bi bi-paperclip me-1"></i>
                                            Preuve de paiement
                                        </label>
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
                                                        <i className="bi bi-file-earmark me-2"></i>
                                                        {fileName}
                                                    </span>
                                                    <button 
                                                        type="button" 
                                                        className="btn btn-sm btn-outline-danger"
                                                        onClick={removeFile}
                                                    >
                                                        <i className="bi bi-x"></i>
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                
                                <div className="col-md-6">
                                    <div className="form-group mb-3">
                                        <label htmlFor="contributionPeriodId" className="form-label">
                                            <i className="bi bi-clock me-1"></i>
                                            Campagnes de cotisation *
                                        </label>
                                        {loading ? (
                                            <div className="form-control">
                                                <div className="spinner-border spinner-border-sm me-2" role="status"></div>
                                                Chargement des campagnes de cotisation...
                                            </div>
                                        ) : (
                                            <select 
                                                id="contributionPeriodId" 
                                                name="contributionPeriodId" 
                                                className="form-control" 
                                                value={form.contributionPeriodId} 
                                                onChange={handleChange}
                                                required
                                            >
                                                <option value="">Choisir la campagne  de cotisation</option>
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
                                </div>
                            </div>
                            
                            <div className="d-grid gap-2 d-md-flex justify-content-md-end mt-4">
                                <button 
                                    type="button" 
                                    className="btn btn-secondary me-md-2" 
                                    onClick={() => navigate('/dashboard')}
                                    disabled={uploading}
                                >
                                    <i className="bi bi-arrow-left me-1"></i>
                                    Annuler
                                </button>
                                <button 
                                    type="submit" 
                                    className="btn btn-primary" 
                                    disabled={loading || membersLoading || uploading || selectedMembers.length === 0}
                                >
                                    {uploading ? (
                                        <>
                                            <div className="spinner-border spinner-border-sm me-2" role="status"></div>
                                            Création en cours...
                                        </>
                                    ) : (
                                        <>
                                            <i className="bi bi-check-circle me-1"></i>
                                            {selectedMembers.length > 0 
                                                ? `Créer ${selectedMembers.length} cotisation(s) individuelle(s)`
                                                : 'Créer les cotisations'
                                            }
                                        </>
                                    )}
                                </button>
                            </div>

                            {/* Information sur le processus */}
                            <div className="alert alert-warning mt-3">
                                <h6 className="alert-heading">
                                    <i className="bi bi-lightbulb me-1"></i>
                                    Comment ça marche ?
                                </h6>
                                <ul className="mb-0 small">
                                    <li>Chaque membre sélectionné recevra une <strong>cotisation individuelle</strong></li>
                                    <li>Le montant sera le même pour tous les membres sélectionnés</li>
                                    <li>Chaque membre verra sa cotisation dans son historique personnel</li>
                                    <li>La preuve de paiement sera associée à chaque cotisation</li>
                                </ul>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default AddGroupContribution;
