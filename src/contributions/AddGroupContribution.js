import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import ApiService from '../service/api';
import useAuth from '../hook/useAuth';
import KkiapayWidget from '../component/Paiement/KkiapayWidget';
import { toast } from 'react-toastify';

function AddGroupContribution() {
    const { user, loading: authLoading } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    
    const [form, setForm] = useState({
        individualAmount: '',
        paymentDate: new Date().toISOString().split('T')[0],
        contributionPeriodId: '',
        paymentMode: 'KKIAPAY',
        phoneNumber: user?.phone || '',
        paymentProof: null,
        totalAmount: ''
    });
    
    const [periods, setPeriods] = useState([]);
    const [members, setMembers] = useState([]);
    const [selectedMembers, setSelectedMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [fileName, setFileName] = useState('');
    
    // États pour le paiement
    const [paymentStep, setPaymentStep] = useState('form'); // form, payment, processing, done
    const [paymentInfo, setPaymentInfo] = useState(null);

    useEffect(() => {
        if (!authLoading && !user) {
            navigate('/login');
        }
    }, [user, authLoading, navigate]);

    useEffect(() => {
        fetchData();
    }, []);

    useEffect(() => {
        const amount = parseFloat(form.individualAmount) || 0;
        const total = selectedMembers.length * amount;
        setForm(prev => ({
            ...prev,
            totalAmount: total > 0 ? total.toString() : ''
        }));
    }, [selectedMembers, form.individualAmount]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [periodsData, membersData] = await Promise.all([
                ApiService.getContributionPeriods(),
                ApiService.getMembers()
            ]);
            setPeriods(periodsData);
            setMembers(membersData);
        } catch (error) {
            toast.error('Erreur lors du chargement des données');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        
        if (name === 'contributionPeriodId') {
            const selectedPeriod = periods.find(p => p.id === parseInt(value));
            if (selectedPeriod) {
                setForm({ 
                    ...form, 
                    [name]: value,
                    individualAmount: selectedPeriod.individualAmount || selectedPeriod.amount || ''
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
            if (file.size > 10 * 1024 * 1024) {
                toast.error('Fichier trop volumineux (max 10MB)');
                return;
            }
            setForm({ ...form, paymentProof: file });
            setFileName(file.name);
        }
    };

    const handleMemberSelection = (memberId) => {
        setSelectedMembers(prev => 
            prev.includes(memberId) 
                ? prev.filter(id => id !== memberId)
                : [...prev, memberId]
        );
    };

    const selectAllMembers = () => {
        if (selectedMembers.length === members.length) {
            setSelectedMembers([]);
        } else {
            setSelectedMembers(members.map(m => m.id));
        }
    };

    const handlePaymentSuccess = async (paymentResponse) => {
        console.log('Paiement réussi:', paymentResponse);
        
        setPaymentStep('processing');
        setPaymentInfo(paymentResponse);
        
        try {
            // Vérifier le paiement
            const verification = paymentResponse.verified ? 
                paymentResponse : 
                await ApiService.verifyPayment(paymentResponse.transactionId);
            
            if (verification.success && verification.status === 'SUCCESS') {
                setPaymentStep('done');
                
                // Créer les cotisations après paiement
                await createGroupContributionsAfterPayment(verification.payment);
            } else {
                toast.error('Échec de la vérification du paiement');
                setPaymentStep('form');
            }
        } catch (error) {
            console.error('Erreur:', error);
            toast.error('Erreur lors du traitement du paiement');
            setPaymentStep('form');
        }
    };

    const createGroupContributionsAfterPayment = async (payment) => {
        setUploading(true);
        try {
            let paymentProofUrl = null;
            if (form.paymentProof) {
                paymentProofUrl = await ApiService.uploadPaymentProof(form.paymentProof);
            }

            await ApiService.addGroupContribution({
                amount: parseFloat(form.individualAmount),
                paymentDate: form.paymentDate,
                paymentMode: 'KKIAPAY',
                paymentProof: paymentProofUrl,
                contributionPeriodId: parseInt(form.contributionPeriodId),
                memberIds: selectedMembers,
                paymentId: payment.id
            });

            toast.success(`${selectedMembers.length} cotisation(s) ajoutée(s) avec succès !`);
            
            setTimeout(() => {
                navigate('/mutuelle/contribution/individual/my-contributions');
            }, 2000);
            
        } catch (error) {
            console.error('Erreur:', error);
            toast.error(error.response?.data?.message || 'Erreur lors de l\'ajout');
            setPaymentStep('payment');
        } finally {
            setUploading(false);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        
        if (!user) {
            toast.error('Vous devez être connecté');
            return;
        }

        if (selectedMembers.length === 0) {
            toast.error('Sélectionnez au moins un membre');
            return;
        }

        if (!form.contributionPeriodId) {
            toast.error('Sélectionnez une période');
            return;
        }

        if (!form.phoneNumber) {
            toast.error('Numéro de téléphone requis pour le paiement');
            return;
        }

        // Passer à l'étape de paiement
        setPaymentStep('payment');
    };

    const handleCancelPayment = () => {
        setPaymentStep('form');
    };

    const totalAmount = parseFloat(form.totalAmount) || 0;
    const selectedPeriod = periods.find(p => p.id === parseInt(form.contributionPeriodId));

    if (authLoading || loading) {
        return (
            <div className="text-center py-5">
                <div className="spinner-border text-primary" role="status"></div>
                <p className="mt-3">Chargement...</p>
            </div>
        );
    }

    if (!user) {
        return null;
    }

    return (
        <div className="container mt-4">
            <div className="card">
                <div className="card-header bg-primary text-white">
                    <h3>
                        {paymentStep === 'form' && 'Cotisation Groupée'}
                        {paymentStep === 'payment' && 'Paiement de la cotisation groupée'}
                        {paymentStep === 'processing' && 'Traitement en cours...'}
                        {paymentStep === 'done' && 'Paiement réussi !'}
                    </h3>
                </div>
                <div className="card-body">
                    
                    {/* Informations utilisateur */}
                    <div className="alert alert-info d-flex align-items-center mb-4">
                        <i className="bi bi-person-circle fs-4 me-3"></i>
                        <div>
                            <strong>{user?.firstName} {user?.name}</strong>
                            <br />
                            <small>{user?.email}</small>
                        </div>
                    </div>

                    {paymentStep === 'form' && (
                        <form onSubmit={handleSubmit}>
                            {/* Sélection des membres */}
                            <div className="mb-4">
                                <div className="d-flex justify-content-between align-items-center mb-3">
                                    <label className="fw-bold">Membres sélectionnés ({selectedMembers.length})</label>
                                    <button 
                                        type="button"
                                        className="btn btn-sm btn-outline-primary"
                                        onClick={selectAllMembers}
                                    >
                                        {selectedMembers.length === members.length ? 'Tout désélectionner' : 'Tout sélectionner'}
                                    </button>
                                </div>
                                <div className="border rounded p-3" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                                    {members.map(member => (
                                        <div key={member.id} className="form-check mb-2">
                                            <input
                                                className="form-check-input"
                                                type="checkbox"
                                                id={`member-${member.id}`}
                                                checked={selectedMembers.includes(member.id)}
                                                onChange={() => handleMemberSelection(member.id)}
                                            />
                                            <label className="form-check-label" htmlFor={`member-${member.id}`}>
                                                {member.firstName} {member.name}
                                            </label>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Montant et période */}
                            <div className="row">
                                <div className="col-md-6 mb-3">
                                    <label className="form-label">Montant par membre (FCFA) *</label>
                                    <input
                                        type="number"
                                        className="form-control"
                                        name="individualAmount"
                                        value={form.individualAmount}
                                        onChange={handleChange}
                                        required
                                        min="1"
                                        readOnly={!!selectedPeriod}
                                    />
                                </div>
                                <div className="col-md-6 mb-3">
                                    <label className="form-label">Période de cotisation *</label>
                                    <select
                                        className="form-control"
                                        name="contributionPeriodId"
                                        value={form.contributionPeriodId}
                                        onChange={handleChange}
                                        required
                                    >
                                        <option value="">Sélectionner</option>
                                        {periods.map(p => (
                                            <option key={p.id} value={p.id}>
                                                {p.description} - {p.individualAmount} FCFA
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Date et téléphone */}
                            <div className="row">
                                <div className="col-md-6 mb-3">
                                    <label className="form-label">Date de paiement *</label>
                                    <input
                                        type="date"
                                        className="form-control"
                                        name="paymentDate"
                                        value={form.paymentDate}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                                <div className="col-md-6 mb-3">
                                    <label className="form-label">Téléphone Mobile Money *</label>
                                    <input
                                        type="tel"
                                        className="form-control"
                                        name="phoneNumber"
                                        value={form.phoneNumber}
                                        onChange={handleChange}
                                        placeholder="Ex: 97000000"
                                        required
                                    />
                                </div>
                            </div>

                            {/* Montant total */}
                            {totalAmount > 0 && (
                                <div className="alert alert-info mb-3">
                                    <strong>Montant total à payer: {totalAmount.toLocaleString()} FCFA</strong>
                                    <br />
                                    <small>({selectedMembers.length} membre(s) × {parseFloat(form.individualAmount).toLocaleString()} FCFA)</small>
                                </div>
                            )}

                            {/* Preuve de paiement (optionnel) */}
                            <div className="mb-4">
                                <label className="form-label">Preuve de paiement (optionnel)</label>
                                <input
                                    type="file"
                                    className="form-control"
                                    onChange={handleFileChange}
                                    accept=".jpg,.jpeg,.png,.pdf"
                                />
                                {fileName && (
                                    <div className="mt-2">
                                        <span>{fileName}</span>
                                        <button
                                            type="button"
                                            className="btn btn-sm btn-link text-danger"
                                            onClick={() => {
                                                setForm({ ...form, paymentProof: null });
                                                setFileName('');
                                            }}
                                        >
                                            Supprimer
                                        </button>
                                    </div>
                                )}
                            </div>

                            <div className="d-flex justify-content-end gap-2">
                                <button
                                    type="button"
                                    className="btn btn-secondary"
                                    onClick={() => navigate('/dashboard')}
                                >
                                    Annuler
                                </button>
                                <button
                                    type="submit"
                                    className="btn btn-primary"
                                    disabled={selectedMembers.length === 0}
                                >
                                    <i className="bi bi-credit-card me-2"></i>
                                    Procéder au paiement
                                </button>
                            </div>
                        </form>
                    )}

                    {paymentStep === 'payment' && (
                        <div className="text-center py-4">
                            <h5 className="mb-4">Récapitulatif du paiement</h5>
                            
                            <div className="alert alert-secondary mb-4">
                                <p className="mb-1">Montant total: <strong>{totalAmount.toLocaleString()} FCFA</strong></p>
                                <p className="mb-1">Période: <strong>{selectedPeriod?.description}</strong></p>
                                <p className="mb-1">Membres: <strong>{selectedMembers.length}</strong></p>
                                <p className="mb-0">Téléphone: <strong>{form.phoneNumber}</strong></p>
                            </div>

                            <KkiapayWidget
                                amount={totalAmount}
                                phoneNumber={form.phoneNumber}
                                memberId={user?.id}
                                paymentType="GROUP_CONTRIBUTION"
                                onSuccess={handlePaymentSuccess}
                                onError={(error) => {
                                    toast.error('Erreur de paiement');
                                    console.error(error);
                                }}
                                onClose={handleCancelPayment}
                                buttonText="Confirmer le paiement groupé"
                                className="mb-3"
                            />

                            <button
                                type="button"
                                className="btn btn-link text-muted"
                                onClick={handleCancelPayment}
                            >
                                Retour au formulaire
                            </button>
                        </div>
                    )}

                    {paymentStep === 'processing' && (
                        <div className="text-center py-5">
                            <div className="spinner-border text-primary mb-3" style={{ width: '4rem', height: '4rem' }}>
                                <span className="visually-hidden">Chargement...</span>
                            </div>
                            <h5>Traitement de votre paiement en cours...</h5>
                            <p className="text-muted">Veuillez patienter un instant</p>
                        </div>
                    )}

                    {paymentStep === 'done' && paymentInfo && (
                        <div className="text-center py-4">
                            <div className="text-success mb-4">
                                <i className="bi bi-check-circle-fill" style={{ fontSize: '5rem' }}></i>
                            </div>
                            <h5 className="mb-3">✅ Paiement réussi !</h5>
                            <div className="alert alert-success">
                                <p className="mb-1">Transaction: {paymentInfo.transactionId}</p>
                                <p className="mb-1">Montant: {paymentInfo.amount?.toLocaleString()} FCFA</p>
                                <p className="mb-0">Statut: Confirmé</p>
                            </div>
                            <p className="text-muted">
                                Enregistrement des cotisations en cours...
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default AddGroupContribution;