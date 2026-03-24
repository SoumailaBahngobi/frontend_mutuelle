import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import useAuth from '../hook/useAuth';
import ApiService from '../service/api';
import KkiapayWidget from '../component/Paiement/KkiapayWidget';
import { useForm } from '../hook/useForm';
import { toast } from 'react-toastify';

const AddIndividualContribution = () => {
    const { user, loading: authLoading } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    
    const [periods, setPeriods] = useState([]);
    const [loading, setLoading] = useState(true);
    const [paymentStep, setPaymentStep] = useState('form');
    const [paymentInfo, setPaymentInfo] = useState(null);

    const { values, errors, touched, isSubmitting, setIsSubmitting, handleChange, setValues, validateForm } = useForm(
        {
            amount: '',
            paymentDate: new Date().toISOString().split('T')[0],
            contributionPeriodId: '',
            paymentMode: 'KKIAPAY',
            phoneNumber: user?.phone || '',
            paymentProof: null
        },
        {
            amount: {
                required: true,
                min: 1,
                message: 'Montant requis',
                minMessage: 'Le montant doit être supérieur à 0'
            },
            contributionPeriodId: {
                required: true,
                message: 'Sélectionnez une période'
            },
            paymentDate: {
                required: true,
                message: 'Date de paiement requise'
            },
            phoneNumber: {
                required: true,
                pattern: /^[0-9]{8,12}$/,
                message: 'Numéro de téléphone requis (8-12 chiffres)'
            }
        }
    );

    useEffect(() => {
        if (location.state?.paymentVerified && location.state?.paymentId) {
            setPaymentStep('payment');
            fetchPaymentInfo(location.state.paymentId);
        }
    }, [location]);

    useEffect(() => {
        if (!authLoading && !user) {
            navigate('/login');
            return;
        }
        loadPeriods();
    }, [user, authLoading, navigate]);

    const loadPeriods = async () => {
        try {
            const data = await ApiService.getContributionPeriods();
            setPeriods(data);
        } catch (error) {
            console.error('❌ Erreur chargement périodes:', error);
            toast.error('Impossible de charger les périodes');
        } finally {
            setLoading(false);
        }
    };

    const fetchPaymentInfo = async (paymentId) => {
        try {
            const payments = await ApiService.getMemberPayments(user?.id);
            const payment = payments.find(p => p.id === paymentId);
            if (payment) {
                setPaymentInfo(payment);
                setValues({
                    ...values,
                    amount: payment.amount,
                    phoneNumber: payment.phoneNumber
                });
            }
        } catch (error) {
            console.error('Erreur récupération paiement:', error);
        }
    };

    const handlePeriodChange = (e) => {
        const periodId = e.target.value;
        const selectedPeriod = periods.find(p => p.id === parseInt(periodId));
        
        handleChange({
            target: {
                name: 'contributionPeriodId',
                value: periodId
            }
        });

        if (selectedPeriod) {
            handleChange({
                target: {
                    name: 'amount',
                    value: selectedPeriod.individualAmount || selectedPeriod.amount || ''
                }
            });
        }
    };

    const handlePaymentSuccess = async (paymentResponse) => {
        console.log('Paiement réussi:', paymentResponse);
        
        setPaymentStep('processing');
        setPaymentInfo(paymentResponse);
        
        try {
            const verification = paymentResponse.verified ? 
                paymentResponse : 
                await ApiService.verifyPayment(paymentResponse.transactionId);
            
            if (verification.success && verification.status === 'SUCCESS') {
                setPaymentStep('done');
                await createContributionAfterPayment(verification.payment);
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

    const createContributionAfterPayment = async (payment) => {
        try {
            const contributionData = {
                amount: parseFloat(values.amount),
                paymentDate: values.paymentDate,
                paymentMode: 'KKIAPAY',
                paymentProof: null,
                contributionPeriodId: parseInt(values.contributionPeriodId),
                paymentId: payment.id
            };

            await ApiService.addIndividualContribution(contributionData);
            
            toast.success('✅ Cotisation enregistrée avec succès !');
            
            setTimeout(() => {
                navigate('/mutuelle/contribution/individual/my-contributions');
            }, 2000);
            
        } catch (error) {
            console.error('❌ Erreur création cotisation:', error);
            toast.error('Erreur lors de l\'enregistrement de la cotisation');
            setPaymentStep('payment');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!validateForm()) {
            toast.error('Veuillez corriger les erreurs');
            return;
        }

        setPaymentStep('payment');
    };

    const handleCancelPayment = () => {
        setPaymentStep('form');
    };

    if (authLoading || loading) {
        return (
            <div className="d-flex justify-content-center align-items-center" style={{ height: '50vh' }}>
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Chargement...</span>
                </div>
            </div>
        );
    }

    const selectedPeriod = periods.find(p => p.id === parseInt(values.contributionPeriodId));

    return (
        <div className="container mt-4">
            <div className="row justify-content-center">
                <div className="col-md-8 col-lg-6">
                    <div className="card shadow">
                        <div className="card-header bg-primary text-white">
                            <h4 className="mb-0">
                                {paymentStep === 'form' && 'Cotisation Individuelle'}
                                {paymentStep === 'payment' && 'Paiement de la cotisation'}
                                {paymentStep === 'processing' && 'Traitement en cours...'}
                                {paymentStep === 'done' && 'Paiement réussi !'}
                            </h4>
                        </div>
                        
                        <div className="card-body">
                            
                            <div className="alert alert-info d-flex align-items-center">
                                <i className="bi bi-person-circle fs-4 me-3"></i>
                                <div>
                                    <strong>{user?.firstName} {user?.name}</strong>
                                    <br />
                                    <small>{user?.email}</small>
                                </div>
                            </div>

                            {paymentStep === 'form' && (
                                <form onSubmit={handleSubmit}>
                                    
                                    <div className="mb-3">
                                        <label className="form-label fw-semibold">
                                            Période de cotisation *
                                        </label>
                                        <select
                                            className={`form-control ${errors.contributionPeriodId && touched.contributionPeriodId ? 'is-invalid' : ''}`}
                                            name="contributionPeriodId"
                                            value={values.contributionPeriodId}
                                            onChange={handlePeriodChange}
                                            disabled={isSubmitting}
                                        >
                                            <option value="">Sélectionnez...</option>
                                            {periods.map(p => (
                                                <option key={p.id} value={p.id}>
                                                    {p.description || p.name} - {p.individualAmount || p.amount} FCFA
                                                </option>
                                            ))}
                                        </select>
                                        {errors.contributionPeriodId && touched.contributionPeriodId && (
                                            <div className="invalid-feedback">{errors.contributionPeriodId}</div>
                                        )}
                                    </div>

                                    <div className="mb-3">
                                        <label className="form-label fw-semibold">
                                            Montant (FCFA) *
                                        </label>
                                        <div className="input-group">
                                            <span className="input-group-text">FCFA</span>
                                            <input
                                                type="number"
                                                className={`form-control ${errors.amount && touched.amount ? 'is-invalid' : ''}`}
                                                name="amount"
                                                value={values.amount}
                                                onChange={handleChange}
                                                readOnly={!!selectedPeriod}
                                                disabled={isSubmitting}
                                            />
                                        </div>
                                        {selectedPeriod && (
                                            <small className="text-success">
                                                Montant automatique basé sur la période
                                            </small>
                                        )}
                                        {errors.amount && touched.amount && (
                                            <div className="invalid-feedback d-block">{errors.amount}</div>
                                        )}
                                    </div>

                                    <div className="mb-3">
                                        <label className="form-label fw-semibold">
                                            Date de paiement *
                                        </label>
                                        <input
                                            type="date"
                                            className={`form-control ${errors.paymentDate && touched.paymentDate ? 'is-invalid' : ''}`}
                                            name="paymentDate"
                                            value={values.paymentDate}
                                            onChange={handleChange}
                                            disabled={isSubmitting}
                                        />
                                        {errors.paymentDate && touched.paymentDate && (
                                            <div className="invalid-feedback">{errors.paymentDate}</div>
                                        )}
                                    </div>

                                    <div className="mb-3">
                                        <label className="form-label fw-semibold">
                                            Numéro de téléphone (Mobile Money) *
                                        </label>
                                        <div className="input-group">
                                            <span className="input-group-text">
                                                <i className="bi bi-phone"></i>
                                            </span>
                                            <input
                                                type="tel"
                                                className={`form-control ${errors.phoneNumber && touched.phoneNumber ? 'is-invalid' : ''}`}
                                                name="phoneNumber"
                                                value={values.phoneNumber}
                                                onChange={handleChange}
                                                placeholder="Ex: 97000000"
                                                disabled={isSubmitting}
                                            />
                                        </div>
                                        <small className="text-muted">
                                            Numéro Mobile Money pour le paiement
                                        </small>
                                        {errors.phoneNumber && touched.phoneNumber && (
                                            <div className="invalid-feedback d-block">{errors.phoneNumber}</div>
                                        )}
                                    </div>

                                    <div className="d-flex justify-content-end gap-2">
                                        <button
                                            type="button"
                                            className="btn btn-outline-secondary"
                                            onClick={() => navigate('/dashboard')}
                                            disabled={isSubmitting}
                                        >
                                            Annuler
                                        </button>
                                        <button
                                            type="submit"
                                            className="btn btn-primary"
                                            disabled={isSubmitting}
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
                                        <p className="mb-1">Montant: <strong>{parseFloat(values.amount).toLocaleString()} FCFA</strong></p>
                                        <p className="mb-1">Période: <strong>{selectedPeriod?.description}</strong></p>
                                        <p className="mb-0">Téléphone: <strong>{values.phoneNumber}</strong></p>
                                    </div>

                                    <KkiapayWidget
                                        amount={parseFloat(values.amount)}
                                        phoneNumber={values.phoneNumber}
                                        memberId={user?.id}
                                        paymentType="INDIVIDUAL_CONTRIBUTION"
                                        onSuccess={handlePaymentSuccess}
                                        onError={(error) => {
                                            toast.error('Erreur de paiement');
                                            console.error(error);
                                        }}
                                        onClose={handleCancelPayment}
                                        buttonText="Confirmer le paiement"
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
                                        Enregistrement de votre cotisation en cours...
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AddIndividualContribution;