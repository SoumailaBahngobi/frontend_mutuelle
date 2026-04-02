<<<<<<< HEAD
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "bootstrap/dist/css/bootstrap.min.css";

function AddIndividualContribution() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    amount: "",
    paymentDate: new Date().toISOString().split("T")[0],
    contributionPeriodId: "",
    paymentMode: "ESPECES",
    paymentProof: null,
  });

  const [contributionPeriods, setContributionPeriods] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [fileName, setFileName] = useState("");
  const [error, setError] = useState("");

  // ===========================
  // INIT
  // ===========================
  useEffect(() => {
    checkUser();
    fetchContributionPeriods();
  }, []);

  const getAuthHeaders = () => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return {};
    }
    return { Authorization: `Bearer ${token}` };
  };

  const checkUser = () => {
    const userData = localStorage.getItem("currentUser");
    if (!userData) {
      navigate("/login");
      return;
    }
    setCurrentUser(JSON.parse(userData));
  };

  // ===========================
  // FETCH PERIODS
  // ===========================
  const fetchContributionPeriods = async () => {
    try {
      const response = await axios.get(
        "http://localhost:8080/mutuelle/contribution_period",
        { headers: getAuthHeaders() }
      );
      setContributionPeriods(
        Array.isArray(response.data) ? response.data : []
      );
    } catch (err) {
      setError("Erreur lors du chargement des campagnes.");
    } finally {
      setLoading(false);
    }
  };

  // ===========================
  // HANDLE CHANGE
  // ===========================
  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "contributionPeriodId") {
      const selected = contributionPeriods.find(
        (p) => p.id === parseInt(value)
      );

      setForm({
        ...form,
        contributionPeriodId: value,
        amount: selected
          ? selected.individualAmount || selected.amount || ""
          : "",
      });
    } else {
      setForm({ ...form, [name]: value });
    }
  };

  // ===========================
  // FILE HANDLING
  // ===========================
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert("Fichier trop volumineux (max 5MB)");
      return;
    }

    const allowed = [
      "image/jpeg",
      "image/png",
      "application/pdf",
    ];

    if (!allowed.includes(file.type)) {
      alert("Format non supporté (JPG, PNG, PDF)");
      return;
    }

    setForm({ ...form, paymentProof: file });
    setFileName(file.name);
  };

  const removeFile = () => {
    setForm({ ...form, paymentProof: null });
    setFileName("");
  };

  // ===========================
  // UPLOAD FILE
  // ===========================
  const uploadPaymentProof = async (file) => {
    const formData = new FormData();
    formData.append("file", file);

    const response = await axios.post(
      "http://localhost:8080/mutuelle/contribution/upload/payment-proof",
      formData,
      {
        headers: {
          ...getAuthHeaders(),
          "Content-Type": "multipart/form-data",
        },
      }
    );

    return response.data;
  };

  // ===========================
  // SUBMIT
  // ===========================
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!form.contributionPeriodId) {
      setError("Veuillez sélectionner une campagne.");
      return;
    }

    if (!form.amount || parseFloat(form.amount) <= 0) {
      setError("Montant invalide.");
      return;
    }

    try {
      setUploading(true);

      let proofFileName = null;

      if (form.paymentProof) {
        proofFileName = await uploadPaymentProof(form.paymentProof);
      }

      const contributionData = {
        amount: parseFloat(form.amount),
        paymentDate: form.paymentDate + "T00:00:00",
        paymentMode: form.paymentMode,
        paymentProof: proofFileName,
        member: {
          id: currentUser.id || currentUser.memberId,
        },
        contributionPeriod: {
          id: parseInt(form.contributionPeriodId),
        },
        contributionType: "INDIVIDUAL",
      };

      await axios.post(
        "http://localhost:8080/mutuelle/contribution/individual",
        contributionData,
        { headers: getAuthHeaders() }
      );

      alert("Cotisation ajoutée avec succès !");
      navigate("/dashboard");

    } catch (err) {
      console.error(err);
      setError(
        err.response?.data?.message ||
          "Erreur lors de l'enregistrement."
      );
    } finally {
      setUploading(false);
    }
  };

  if (!currentUser) return null;

  // ===========================
  // RENDER
  // ===========================
  return (
    <div className="container mt-4">
      <div className="card shadow">
        <div className="card-header bg-primary text-white">
          <h5>Ajouter une cotisation individuelle</h5>
        </div>

        <div className="card-body">

          {error && (
            <div className="alert alert-danger">{error}</div>
          )}

          <form onSubmit={handleSubmit}>

            <div className="mb-3">
              <label>Campagne *</label>
              <select
                className="form-select"
                name="contributionPeriodId"
                value={form.contributionPeriodId}
                onChange={handleChange}
                required
              >
                <option value="">Choisir...</option>
                {contributionPeriods.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.description} - {p.individualAmount || p.amount} FCFA
                  </option>
                ))}
              </select>
            </div>

            <div className="mb-3">
              <label>Montant *</label>
              <input
                type="number"
                className="form-control"
                name="amount"
                value={form.amount}
                readOnly
              />
            </div>

            <div className="mb-3">
              <label>Date *</label>
              <input
                type="date"
                className="form-control"
                name="paymentDate"
                value={form.paymentDate}
                onChange={handleChange}
                required
              />
            </div>

            <div className="mb-3">
              <label>Mode de paiement *</label>
              <select
                className="form-select"
                name="paymentMode"
                value={form.paymentMode}
                onChange={handleChange}
              >
                <option value="ESPECES">Espèces</option>
                <option value="CHEQUE">Chèque</option>
                <option value="VIREMENT">Virement</option>
                <option value="MOBILE_MONEY">Mobile Money</option>
                <option value="CARTE">Carte</option>
              </select>
            </div>

            <div className="mb-3">
              <label>Preuve de paiement</label>
              <input
                type="file"
                className="form-control"
                onChange={handleFileChange}
                accept=".jpg,.jpeg,.png,.pdf"
              />
              {fileName && (
                <div className="mt-2 text-muted">
                  {fileName}
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-danger ms-2"
                    onClick={removeFile}
                  >
                    Supprimer
                  </button>
                </div>
              )}
            </div>

            <div className="d-flex justify-content-between">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => navigate("/dashboard")}
              >
                Annuler
              </button>

              <button
                type="submit"
                className="btn btn-primary"
                disabled={uploading}
              >
                {uploading ? "Enregistrement..." : "Valider"}
              </button>
            </div>

          </form>
        </div>
      </div>
    </div>
  );
}
=======
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
    const [isCreatingContribution, setIsCreatingContribution] = useState(false);

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
        if (!authLoading && !user) {
            navigate('/login');
            return;
        }
        loadPeriods();
    }, [user, authLoading, navigate]);

    // Vérifier si on revient d'un paiement réussi
    useEffect(() => {
        if (location.state?.paymentVerified && location.state?.paymentId) {
            console.log("🔄 Retour de paiement réussi, création de la cotisation...");
            setPaymentStep('processing');
            setIsCreatingContribution(true);
            
            // Créer la cotisation immédiatement
            createContributionAfterPayment({
                id: location.state.paymentId,
                transactionId: location.state.transactionId,
                amount: values.amount
            });
        }
    }, [location]);

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

    /**
     * Gestion du succès du paiement - VERSION CORRIGÉE
     * Crée la cotisation immédiatement après le paiement
     */
    const handlePaymentSuccess = async (paymentResponse) => {
        console.log('✅ Paiement réussi:', paymentResponse);
        toast.success('Paiement réussi, enregistrement de votre cotisation...');

        setPaymentStep('processing');
        setPaymentInfo(paymentResponse);
        setIsCreatingContribution(true);

        try {
            // Récupérer le paymentId
            const paymentId = paymentResponse.payment?.id || paymentResponse.id || paymentResponse.paymentId;
            
            if (!paymentId) {
                console.error('❌ Aucun paymentId trouvé dans:', paymentResponse);
                throw new Error('ID de paiement non trouvé');
            }

            console.log('💰 Payment ID utilisé:', paymentId);
            
            // Créer la cotisation directement
            await createContributionAfterPayment({
                id: paymentId,
                transactionId: paymentResponse.transactionId,
                amount: paymentResponse.amount
            });

            setPaymentStep('done');
            
        } catch (error) {
            console.error('❌ Erreur:', error);
            toast.error('Erreur lors de l\'enregistrement: ' + (error.response?.data || error.message));
            setPaymentStep('payment');
        } finally {
            setIsCreatingContribution(false);
        }
    };

    /**
     * Création de la cotisation avec retry
     */
    const createContributionAfterPayment = async (payment) => {
        let retryCount = 0;
        const maxRetries = 3;

        const contributionData = {
            amount: parseFloat(values.amount),
            paymentDate: values.paymentDate,
            paymentMode: 'KKIAPAY',
            paymentProof: null,
            contributionPeriodId: parseInt(values.contributionPeriodId),
            paymentId: payment.id
        };

        console.log('📦 Données cotisation à envoyer:', contributionData);

        while (retryCount < maxRetries) {
            try {
                console.log(`📝 Tentative ${retryCount + 1}/${maxRetries} de création de cotisation...`);
                toast.info(`Enregistrement de votre cotisation (tentative ${retryCount + 1}/${maxRetries})...`);

                const response = await ApiService.addIndividualContribution(contributionData);
                console.log('✅ Cotisation créée avec succès:', response);

                toast.success('✅ Cotisation enregistrée avec succès !');

                await new Promise(resolve => setTimeout(resolve, 1500));
                navigate('/mutuelle/contribution/individual/my-contributions');

                return;

            } catch (error) {
                retryCount++;
                console.error(`❌ Tentative ${retryCount} échouée:`, error);
                
                if (error.response) {
                    console.error('📦 Réponse erreur:', error.response.data);
                    console.error('📊 Status:', error.response.status);
                    toast.error(`Erreur: ${error.response.data}`);
                } else {
                    toast.error(`Erreur lors de l'enregistrement (tentative ${retryCount}/${maxRetries})`);
                }

                if (retryCount >= maxRetries) {
                    toast.error('Erreur lors de l\'enregistrement de la cotisation après ' + maxRetries + ' tentatives');
                    savePendingContribution(payment.id, contributionData);
                    
                    navigate('/pending-contributions', {
                        state: {
                            paymentId: payment.id,
                            contributionData: contributionData,
                            error: error.response?.data || error.message
                        }
                    });
                } else {
                    await new Promise(resolve => setTimeout(resolve, 2000));
                }
            }
        }
    };

    const savePendingContribution = (paymentId, data) => {
        try {
            const pendingContributions = JSON.parse(localStorage.getItem('pendingContributions') || '[]');
            pendingContributions.push({
                paymentId: paymentId,
                data: data,
                timestamp: new Date().toISOString(),
                userId: user?.id
            });
            localStorage.setItem('pendingContributions', JSON.stringify(pendingContributions));
            console.log('💾 Cotisation sauvegardée pour reprise manuelle');
            toast.info('Votre cotisation a été sauvegardée pour reprise manuelle.');
        } catch (e) {
            console.error('Erreur sauvegarde cotisation:', e);
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
                                {paymentStep === 'processing' && (
                                    <span>
                                        Traitement en cours...
                                        {isCreatingContribution && ' (Création de la cotisation)'}
                                    </span>
                                )}
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
                                        <label className="form-label fw-semibold">Période de cotisation *</label>
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
                                        <label className="form-label fw-semibold">Montant (FCFA) *</label>
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
                                            <small className="text-success">Montant automatique basé sur la période</small>
                                        )}
                                        {errors.amount && touched.amount && (
                                            <div className="invalid-feedback d-block">{errors.amount}</div>
                                        )}
                                    </div>

                                    <div className="mb-3">
                                        <label className="form-label fw-semibold">Date de paiement *</label>
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
                                        <label className="form-label fw-semibold">Numéro de téléphone (Mobile Money) *</label>
                                        <div className="input-group">
                                            <span className="input-group-text"><i className="bi bi-phone"></i></span>
                                            <input
                                                type="tel"
                                                className={`form-control ${errors.phoneNumber && touched.phoneNumber ? 'is-invalid' : ''}`}
                                                name="phoneNumber"
                                                value={values.phoneNumber}
                                                onChange={handleChange}
                                                placeholder="Ex: 01 97 00 00 00"
                                                disabled={isSubmitting}
                                            />
                                        </div>
                                        <small className="text-muted">Numéro Mobile Money pour le paiement</small>
                                        {errors.phoneNumber && touched.phoneNumber && (
                                            <div className="invalid-feedback d-block">{errors.phoneNumber}</div>
                                        )}
                                    </div>

                                    <div className="d-flex justify-content-end gap-2">
                                        <button type="button" className="btn btn-outline-secondary" onClick={() => navigate('/dashboard')} disabled={isSubmitting}>
                                            Annuler
                                        </button>
                                        <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                                            <i className="bi bi-credit-card me-2"></i> Procéder au paiement
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
                                            console.error('Erreur paiement:', error);
                                            toast.error('Erreur de paiement');
                                            setPaymentStep('form');
                                        }}
                                        onClose={handleCancelPayment}
                                        buttonText="Confirmer le paiement"
                                    />

                                    <button type="button" className="btn btn-link text-muted mt-3" onClick={handleCancelPayment}>
                                        Retour au formulaire
                                    </button>
                                </div>
                            )}

                            {paymentStep === 'processing' && (
                                <div className="text-center py-5">
                                    <div className="spinner-border text-primary mb-3" style={{ width: '4rem', height: '4rem' }}>
                                        <span className="visually-hidden">Chargement...</span>
                                    </div>
                                    <h5>
                                        {isCreatingContribution ? 'Enregistrement de votre cotisation...' : 'Traitement de votre paiement en cours...'}
                                    </h5>
                                    <p className="text-muted">
                                        {isCreatingContribution ? 'Veuillez patienter, votre cotisation est en cours de création.' : 'Veuillez patienter un instant'}
                                    </p>
                                    {isCreatingContribution && (
                                        <div className="mt-3">
                                            <div className="progress" style={{ height: '5px' }}>
                                                <div className="progress-bar progress-bar-striped progress-bar-animated" style={{ width: '100%' }}></div>
                                            </div>
                                        </div>
                                    )}
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
                                    <p className="text-success fw-bold">✓ Cotisation enregistrée avec succès !</p>
                                    <p className="text-muted small">Redirection vers l'historique...</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
>>>>>>> 0ca80779bd2df063c6c22313cd408bc6f07a9320

export default AddIndividualContribution;
