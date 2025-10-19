import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import 'bootstrap/dist/css/bootstrap.min.css';

function EventList() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const navigate = useNavigate();

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:8080/mut/event', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setEvents(response.data);
    } catch (error) {
      console.error('Erreur lors du chargement des événements:', error);
      setError('Impossible de charger la liste des événements');
    } finally {
      setLoading(false);
    }
  };

  const deleteEvent = async (eventId) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cet événement ?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:8080/mut/event/${eventId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setEvents(events.filter(event => event.id !== eventId));
      alert('Événement supprimé avec succès');
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      alert('Erreur lors de la suppression de l\'événement');
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

  const getCategoryBadge = (category) => {
    const badgeClasses = {
      'COTISATION': 'bg-primary',
      'REUNION': 'bg-info',
      'ASSEMBLEE_GENERALE': 'bg-warning text-dark',
      'FORMATION': 'bg-success',
      'EVENEMENT_SOCIAL': 'bg-purple text-white',
      'PROJET_COMMUN': 'bg-orange text-white',
      'AUTRE': 'bg-secondary'
    };

    return (
      <span className={`badge ${badgeClasses[category] || 'bg-secondary'}`}>
        {getCategoryLabel(category)}
      </span>
    );
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF'
    }).format(amount);
  };

  // Filtrer les événements
  const filteredEvents = events.filter(event => {
    const matchesFilter = filter === 'all' || event.category === filter;
    const matchesSearch = event.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         getCategoryLabel(event.category).toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesFilter && matchesSearch;
  });

  if (loading) {
    return (
      <div className="container mt-4 d-flex justify-content-center align-items-center" style={{ minHeight: '60vh' }}>
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Chargement...</span>
          </div>
          <p className="mt-2 text-muted">Chargement des événements...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid py-4">
      <div className="row">
        <div className="col-12">
          <div className="card shadow">
            <div className="card-header bg-primary text-white d-flex justify-content-between align-items-center">
              <h4 className="mb-0">
                <i className="fas fa-calendar-alt me-2"></i>
                Liste des Événements
              </h4>
              <button
                className="btn btn-light btn-sm"
                onClick={() => navigate('/events/add')}
              >
                <i className="fas fa-plus me-1"></i>
                Nouvel Événement
              </button>
            </div>

            <div className="card-body">
              {/* Filtres et recherche */}
              <div className="row mb-4">
                <div className="col-md-6">
                  <div className="input-group">
                    <span className="input-group-text">
                      <i className="fas fa-search"></i>
                    </span>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Rechercher un événement..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>
                <div className="col-md-6">
                  <select
                    className="form-select"
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                  >
                    <option value="all">Tous les événements</option>
                    <option value="COTISATION">Cotisations</option>
                    <option value="REUNION">Réunions</option>
                    <option value="ASSEMBLEE_GENERALE">Assemblées Générales</option>
                    <option value="FORMATION">Formations</option>
                    <option value="EVENEMENT_SOCIAL">Événements Sociaux</option>
                    <option value="PROJET_COMMUN">Projets Communs</option>
                    <option value="AUTRE">Autres</option>
                  </select>
                </div>
              </div>

              {error && (
                <div className="alert alert-danger d-flex align-items-center">
                  <i className="fas fa-exclamation-triangle me-2"></i>
                  <div>{error}</div>
                </div>
              )}

              {/* Tableau des événements */}
              <div className="table-responsive">
                <table className="table table-striped table-hover">
                  <thead className="table-dark">
                    <tr>
                      <th>Catégorie</th>
                      <th>Montant</th>
                      <th>Date</th>
                      <th>Participants</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredEvents.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="text-center py-4">
                          <i className="fas fa-calendar-times fa-2x text-muted mb-2"></i>
                          <p className="text-muted">Aucun événement trouvé</p>
                          <button
                            className="btn btn-primary btn-sm"
                            onClick={() => navigate('/events/add')}
                          >
                            <i className="fas fa-plus me-1"></i>
                            Créer le premier événement
                          </button>
                        </td>
                      </tr>
                    ) : (
                      filteredEvents.map(event => (
                        <tr key={event.id}>
                          <td>
                            <div className="d-flex align-items-center">
                              {getCategoryBadge(event.category)}
                            </div>
                          </td>
                          <td>
                            {event.amount > 0 ? (
                              <span className="fw-bold text-success">
                                {formatCurrency(event.amount)}
                              </span>
                            ) : (
                              <span className="text-muted">-</span>
                            )}
                          </td>
                          <td>
                            <small className="text-muted">
                              {formatDate(event.event_date)}
                            </small>
                          </td>
                          <td>
                            <span className="badge bg-secondary">
                              {event.members ? event.members.length : 0} membre(s)
                            </span>
                          </td>
                          <td>
                            <div className="btn-group btn-group-sm">
                              <button
                                className="btn btn-outline-primary"
                                onClick={() => navigate(`/events/edit/${event.id}`)}
                                title="Modifier"
                              >
                                <i className="fas fa-edit"></i>
                              </button>
                              <button
                                className="btn btn-outline-info"
                                onClick={() => navigate(`/events/view/${event.id}`)}
                                title="Voir détails"
                              >
                                <i className="fas fa-eye"></i>
                              </button>
                              <button
                                className="btn btn-outline-danger"
                                onClick={() => deleteEvent(event.id)}
                                title="Supprimer"
                              >
                                <i className="fas fa-trash"></i>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Statistiques */}
              <div className="row mt-4">
                <div className="col-md-3">
                  <div className="card bg-light">
                    <div className="card-body text-center">
                      <h5 className="text-primary">{events.length}</h5>
                      <small className="text-muted">Total événements</small>
                    </div>
                  </div>
                </div>
                <div className="col-md-3">
                  <div className="card bg-light">
                    <div className="card-body text-center">
                      <h5 className="text-success">
                        {events.filter(e => e.amount > 0).length}
                      </h5>
                      <small className="text-muted">Événements payants</small>
                    </div>
                  </div>
                </div>
                <div className="col-md-3">
                  <div className="card bg-light">
                    <div className="card-body text-center">
                      <h5 className="text-info">
                        {events.filter(e => e.category === 'COTISATION').length}
                      </h5>
                      <small className="text-muted">Cotisations</small>
                    </div>
                  </div>
                </div>
                <div className="col-md-3">
                  <div className="card bg-light">
                    <div className="card-body text-center">
                      <h5 className="text-warning">
                        {events.filter(e => new Date(e.event_date) > new Date()).length}
                      </h5>
                      <small className="text-muted">Événements futurs</small>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default EventList;