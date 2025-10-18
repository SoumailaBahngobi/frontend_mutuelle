import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import 'bootstrap/dist/css/bootstrap.min.css';

function AddEvent() {
  const [formData, setFormData] = useState({
    category: '',
    amount: '',
    event_date: '',
    memberIds: []
  });
  const [members, setMembers] = useState([]);
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const navigate = useNavigate();

  // Catégories d'événements prédéfinies
  const eventCategories = [
    'COTISATION',
    'REUNION',
    'ASSEMBLEE_GENERALE',
    'FORMATION',
    'EVENEMENT_SOCIAL',
    'PROJET_COMMUN',
    'AUTRE'
  ];

  useEffect(() => {
    fetchMembers();
  }, []);

  const fetchMembers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:8080/mut/member', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMembers(response.data);
    } catch (error) {
      console.error('Erreur lors du chargement des membres:', error);
      setError('Impossible de charger la liste des membres');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleMemberSelection = (memberId) => {
    setSelectedMembers(prev => {
      const isSelected = prev.includes(memberId);
      if (isSelected) {
        return prev.filter(id => id !== memberId);
      } else {
        return [...prev, memberId];
      }
    });
  };

  const selectAllMembers = () => {
    const allMemberIds = members.map(member => member.id);
    setSelectedMembers(allMemberIds);
  };

  const clearAllMembers = () => {
    setSelectedMembers([]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('token');
      
      // Préparer les données de l'événement
      const eventData = {
        category: formData.category,
        amount: formData.amount ? parseFloat(formData.amount) : 0,
        event_date: formData.event_date,
        members: selectedMembers.map(id => ({ id }))
      };

      const response = await axios.post('http://localhost:8080/mut/event', eventData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      setSuccess('Événement créé avec succès !');
      
      // Réinitialiser le formulaire
      setFormData({
        category: '',
        amount: '',
        event_date: '',
        memberIds: []
      });
      setSelectedMembers([]);
      
      // Redirection après 2 secondes
      setTimeout(() => {
        navigate('/events');
      }, 2000);

    } catch (error) {
      console.error('Erreur lors de la création de l\'événement:', error);
      const errorMessage = error.response?.data?.message || 'Erreur lors de la création de l\'événement';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const getCategoryLabel = (category) => {
    const labels = {
      'COTISATION': 'Cotisation',
      'REUNION': 'Réunion',
      'ASSEMBLEE_GENERALE': 'Assemblée Générale',
      'FORMATION': 'Formation',
      'EVENEMENT_SOCIAL': 'Événement Social',
      'PROJET_COMMUN': 'Projet Commun',
      'AUTRE': 'Autre'
    };
    return labels[category] || category;
  };

  return (
    <div className="container-fluid py-4">
      <div className="row justify-content-center">
        <div className="col-lg-8">
          <div className="card shadow">
            <div className="card-header bg-primary text-white">
              <div className="d-flex justify-content-between align-items-center">
                <h4 className="mb-0">
                  <i className="fas fa-calendar-plus me-2"></i>
                  Créer un Nouvel Événement
                </h4>
                <button
                  className="btn btn-light btn-sm"
                  onClick={() => navigate('/events')}
                >
                  <i className="fas fa-arrow-left me-1"></i>
                  Retour
                </button>
              </div>
            </div>

            <div className="card-body">
              {/* Messages d'alerte */}
              {error && (
                <div className="alert alert-danger d-flex align-items-center">
                  <i className="fas fa-exclamation-triangle me-2"></i>
                  <div>{error}</div>
                </div>
              )}

              {success && (
                <div className="alert alert-success d-flex align-items-center">
                  <i className="fas fa-check-circle me-2"></i>
                  <div>{success}</div>
                </div>
              )}

              <form onSubmit={handleSubmit}>
                {/* Catégorie de l'événement */}
                <div className="row mb-3">
                  <div className="col-md-6">
                    <label htmlFor="category" className="form-label">
                      <strong>Catégorie d'événement *</strong>
                    </label>
                    <select
                      className="form-select"
                      id="category"
                      name="category"
                      value={formData.category}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="">Sélectionnez une catégorie</option>
                      {eventCategories.map(category => (
                        <option key={category} value={category}>
                          {getCategoryLabel(category)}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Montant */}
                  <div className="col-md-6">
                    <label htmlFor="amount" className="form-label">
                      <strong>Montant (FCFA)</strong>
                    </label>
                    <input
                      type="number"
                      className="form-control"
                      id="amount"
                      name="amount"
                      value={formData.amount}
                      onChange={handleInputChange}
                      placeholder="0.00"
                      min="0"
                      step="0.01"
                    />
                    <div className="form-text">
                      Laissez 0 si l'événement n'a pas de coût financier
                    </div>
                  </div>
                </div>

                {/* Date de l'événement */}
                <div className="row mb-4">
                  <div className="col-md-6">
                    <label htmlFor="event_date" className="form-label">
                      <strong>Date de l'événement *</strong>
                    </label>
                    <input
                      type="datetime-local"
                      className="form-control"
                      id="event_date"
                      name="event_date"
                      value={formData.event_date}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>

                {/* Sélection des membres */}
                <div className="row mb-4">
                  <div className="col-12">
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <label className="form-label">
                        <strong>Membres participants *</strong>
                      </label>
                      <div>
                        <button
                          type="button"
                          className="btn btn-outline-primary btn-sm me-2"
                          onClick={selectAllMembers}
                        >
                          <i className="fas fa-check-double me-1"></i>
                          Tout sélectionner
                        </button>
                        <button
                          type="button"
                          className="btn btn-outline-secondary btn-sm"
                          onClick={clearAllMembers}
                        >
                          <i className="fas fa-times me-1"></i>
                          Tout désélectionner
                        </button>
                      </div>
                    </div>

                    <div className="border rounded p-3" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                      {members.length === 0 ? (
                        <div className="text-center text-muted py-3">
                          <i className="fas fa-users fa-2x mb-2"></i>
                          <div>Aucun membre disponible</div>
                        </div>
                      ) : (
                        <div className="row">
                          {members.map(member => (
                            <div key={member.id} className="col-md-6 col-lg-4 mb-2">
                              <div className="form-check">
                                <input
                                  className="form-check-input"
                                  type="checkbox"
                                  id={`member-${member.id}`}
                                  checked={selectedMembers.includes(member.id)}
                                  onChange={() => handleMemberSelection(member.id)}
                                />
                                <label className="form-check-label" htmlFor={`member-${member.id}`}>
                                  {member.firstName} {member.name}
                                  {member.role && (
                                    <small className="text-muted ms-1">
                                      ({member.role})
                                    </small>
                                  )}
                                </label>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="form-text">
                      {selectedMembers.length} membre(s) sélectionné(s) sur {members.length}
                    </div>
                  </div>
                </div>

                {/* Boutons d'action */}
                <div className="row">
                  <div className="col-12">
                    <div className="d-flex justify-content-end gap-2">
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={() => navigate('/events')}
                        disabled={loading}
                      >
                        <i className="fas fa-times me-1"></i>
                        Annuler
                      </button>
                      <button
                        type="submit"
                        className="btn btn-primary"
                        disabled={loading || selectedMembers.length === 0}
                      >
                        {loading ? (
                          <>
                            <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                            Création...
                          </>
                        ) : (
                          <>
                            <i className="fas fa-save me-1"></i>
                            Créer l'événement
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </form>
            </div>
          </div>

          {/* Informations supplémentaires */}
          <div className="card mt-4">
            <div className="card-header bg-light">
              <h6 className="mb-0">
                <i className="fas fa-info-circle me-2"></i>
                Informations sur les événements
              </h6>
            </div>
            <div className="card-body">
              <div className="row">
                <div className="col-md-6">
                  <h6>Types d'événements :</h6>
                  <ul className="small">
                    <li><strong>Cotisation</strong> : Événement lié aux contributions financières</li>
                    <li><strong>Réunion</strong> : Réunion régulière des membres</li>
                    <li><strong>Assemblée Générale</strong> : Réunion officielle de tous les membres</li>
                    <li><strong>Formation</strong> : Session de formation ou d'information</li>
                  </ul>
                </div>
                <div className="col-md-6">
                  <h6>Conseils :</h6>
                  <ul className="small">
                    <li>Sélectionnez tous les membres concernés par l'événement</li>
                    <li>Précisez le montant si l'événement implique des frais</li>
                    <li>La date et l'heure sont obligatoires</li>
                    <li>Vous pourrez modifier l'événement après sa création</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AddEvent;