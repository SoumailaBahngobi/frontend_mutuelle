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
        paymentProof: null // Changé pour stocker le fichier
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
            const response = await axios.get('http://localhost:8080/mut/contribution_period');
            setContributionPeriods(response.data);
        } catch (error) {
            console.error('Erreur lors de la récupération des périodes de cotisation', error);
            alert('Erreur lors du chargement des périodes de cotisation');
        } finally {
            setLoading(false);
        }
    };

    const fetchAllMembers = async () => {
        try {
            setMembersLoading(true);
            const token = localStorage.getItem('token');
            const response = await axios.get('http://localhost:8080/mut/member', {
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
        setForm({ ...form, [e.target.name]: e.target.value });
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
                'http://localhost:8080/mut/upload/payment-proof', 
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
            alert('Veuillez sélectionner une période de cotisation');
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

            // Créer une cotisation pour chaque membre sélectionné
            const contributionPromises = selectedMembers.map(memberId => {
                const contributionData = {
                    amount: individualAmount,
                    paymentDate: form.paymentDate + "T00:00:00",
                    paymentMode: form.paymentMode,
                    paymentProof: paymentProofUrl, // URL du fichier uploadé
                    member: { 
                        id: memberId
                    },
                    contributionPeriod: { 
                        id: parseInt(form.contributionPeriodId) 
                    },
                    contributionType: "INDIVIDUAL"
                };

                return axios.post(
                    'http://localhost:8080/mut/contribution/individual', 
                    contributionData,
                    {
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        }
                    }
                );
            });

            const results = await Promise.all(contributionPromises);
            
            console.log(`${results.length} cotisation(s) créée(s) avec succès`);
            
            alert(`${selectedMembers.length} cotisation(s) individuelle(s) ajoutée(s) avec succès !`);  
            
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
            console.error('ERREUR COMPLETE:', error);
            
            if (error.response?.status === 400) {
                alert('Erreur de validation: ' + 
                    (error.response.data.message || JSON.stringify(error.response.data)));
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
                        <small className="text-muted">Sélectionnez un ou plusieurs membres</small>
                    </div>
                    <div className="card-body">
                        <div className="alert alert-info">
                            <strong>Utilisateur :</strong> {currentUser.name} {currentUser.firstName}
                            <br />
                            <small>ID: {currentUser.id || currentUser.memberId}</small>
                        </div>
                        
                        <form onSubmit={handleSubmit}>
                            {/* Section Sélection des membres */}
                            <div className="mb-4">
                                <div className="d-flex justify-content-between align-items-center mb-3">
                                    <label className="form-label fw-bold">Sélection des membres *</label>
                                    <button 
                                        type="button"
                                        className="btn btn-outline-primary btn-sm"
                                        onClick={selectAllMembers}
                                    >
                                        {selectedMembers.length === allMembers.length ? 
                                            'Tout désélectionner' : 'Tout sélectionner'}
                                    </button>
                                </div>
                                
                                {membersLoading ? (
                                    <div className="alert alert-info text-center">
                                        Chargement de la liste des membres...
                                    </div>
                                ) : (
                                    <div className="border rounded p-3" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                                        {allMembers.length === 0 ? (
                                            <div className="text-center text-muted">
                                                Aucun membre trouvé
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
                                                        {member.npi && ` - NPI: ${member.npi}`}
                                                        {member.phone && ` - Tél: ${member.phone}`}
                                                    </label>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                )}
                                
                                <div className="mt-2">
                                    <strong>
                                        {selectedMembers.length} membre(s) sélectionné(s)
                                    </strong>
                                </div>
                            </div>

                            <div className="row">
                                <div className="col-md-6">
                                    <div className="form-group mb-3">
                                        <label htmlFor="individualAmount" className="form-label">
                                            Montant par membre (FCFA) *
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
                                        />
                                    </div>
                                </div>
                                
                                <div className="col-md-6">
                                    <div className="form-group mb-3">
                                        <label htmlFor="totalAmount" className="form-label">
                                            Montant total calculé (FCFA)
                                        </label>
                                        <input 
                                            type="text" 
                                            className="form-control" 
                                            id="totalAmount" 
                                            name="totalAmount" 
                                            value={form.totalAmount} 
                                            readOnly
                                            style={{ backgroundColor: '#f8f9fa', fontWeight: 'bold' }}
                                        />
                                        <small className="form-text text-muted">
                                            {selectedMembers.length} × {form.individualAmount || 0} = {form.totalAmount || 0} FCFA
                                        </small>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="row">
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
                            </div>
                            
                            <div className="row">
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
                                
                                <div className="col-md-6">
                                    <div className="form-group mb-3">
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
                                </div>
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
                                    disabled={loading || membersLoading || uploading || selectedMembers.length === 0}
                                >
                                    {uploading ? 'Upload en cours...' : (loading ? 'En cours...' : `Valider ${selectedMembers.length} cotisation(s)`)}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default AddGroupContribution;