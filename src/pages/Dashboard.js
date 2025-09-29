import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef();
  const [showContributionModal, setShowContributionModal] = useState(false);
  
  const navigate = useNavigate();

  // Upload photo handler
  const handlePhotoChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('file', file);
      const res = await axios.post('http://localhost:8080/mut/member/profile/photo', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
      });
      // Met à jour la photo dans le profil utilisateur
      // Ajoute un timestamp pour forcer le rafraîchissement de l'image
      const newPhotoUrl = res.data + '?t=' + Date.now();
      setUser((prev) => ({ ...prev, photo: newPhotoUrl }));
    } catch (err) {
      alert("Erreur lors de l'upload de la photo");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        // Récupère le token du localStorage si besoin
        const token = localStorage.getItem('token');
        const res = await axios.get('http://localhost:8080/mut/member/profile', {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
        setUser(res.data);
      } catch (err) {
        let backendMsg = '';
        if (err.response) {
          backendMsg = ` (Code: ${err.response.status})\nMessage: ${err.response.data && typeof err.response.data === 'string' ? err.response.data : JSON.stringify(err.response.data)}`;
        }
        setError("Impossible de charger le profil utilisateur." + backendMsg);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleContributionType = (type) => {
    if (type === 'individuelle') {
      navigate('/mut/contribution/individual');
    } else if (type === 'groupe') {
      navigate('/mut/contribution/group');
    }
    setShowContributionModal(false);
  };

  const handleLogout = () => {
    // Supprimer le token et les données utilisateur du localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('currentUser');
    // Rediriger vers la page de connexion
    navigate('/login');
  };

  if (loading) return <div className="container mt-4">Chargement...</div>;
  if (error) return <div className="container mt-4 alert alert-danger">{error}</div>;
  if (!user) return null;

  return (
    <div className="container mt-4">
      <div className="d-flex align-items-center mb-4">
        <img 
          src={user.photo || 'https://via.placeholder.com/100'} 
          alt="Profil" 
          className="rounded-circle me-3" 
          width={100} 
          height={100} 
        />
        <div>
          <h3>{user.name}</h3>
          <p className="mb-1"><strong>Rôle :</strong> {user.role}</p>
          <p className="mb-1"><strong>Email :</strong> {user.email}</p>
          <p className="mb-1"><strong>NPI :</strong> {user.npi}</p>
          <p className="mb-1"><strong>Téléphone :</strong> {user.phone}</p>
          <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            style={{ display: 'none' }}
            onChange={handlePhotoChange}
          />
          <button
            className="btn btn-outline-primary btn-sm mt-2"
            onClick={() => fileInputRef.current && fileInputRef.current.click()}
            disabled={uploading}
          >
            {uploading ? 'Envoi...' : 'Changer la photo'}
          </button>
        </div>
      </div>

      <div className="row mb-4">
        <div className="col-md-6 mb-3">
          <div className="card">
            <div className="card-body">
              <h5 className="card-title">Demandes</h5>
              <button className="btn btn-warning">Demander une assistance</button>
            </div>
          </div>
        </div>
       
        <div className="col-md-6 mb-3">
          <div className="card">
            <div className="card-body">
              <h5 className="card-title">Cotisations</h5>
              
              {/* Bouton pour ouvrir la modal de sélection */}
              <button 
                className="btn btn-primary w-100 mb-2" 
                onClick={() => setShowContributionModal(true)}
              >
                Faire une cotisation
              </button>
              
              <button 
                className="btn btn-secondary w-100" 
                onClick={() => navigate('/mut/contribution/individual/my-contributions')}
              >
                Voir historique de mes cotisations
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de sélection du type de cotisation */}
      {showContributionModal && (
        <div 
          className="modal fade show" 
          style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}
          onClick={() => setShowContributionModal(false)}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h5 className="modal-title">Choisir le type de cotisation</h5>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={() => setShowContributionModal(false)}
                ></button>
              </div>
              <div className="modal-body">
                <p>Veuillez sélectionner le type de cotisation :</p>
                <div className="d-grid gap-3">
                  <button 
                    className="btn btn-primary btn-lg"
                    onClick={() => handleContributionType('individuelle')}
                  >
                    <strong>Cotisation Individuelle</strong>
                    <br />
                    <small className="text-light">Pour un seul membre</small>
                  </button>
                  
                  <button 
                    className="btn btn-success btn-lg"
                    onClick={() => handleContributionType('groupe')}
                  >
                    <strong>Cotisation de Groupe</strong>
                    <br />
                    <small className="text-light">Pour plusieurs membres</small>
                  </button>
                </div>
              </div>
              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => setShowContributionModal(false)}
                >
                  Annuler
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="row mb-4">
        <div className="col-md-6 mb-3">
          <div className="card">
            <div className="card-body">
              <h5 className="card-title">Notifications</h5>
              <ul className="list-group">
                <li className="list-group-item">Aucune notification pour le moment.</li>
              </ul>
            </div>
          </div>
        </div>
        <div className="col-md-6 mb-3 d-flex align-items-end">
          <button 
            className="btn btn-danger w-100"
            onClick={handleLogout}
          >
            Déconnexion
          </button>
        </div>
      </div>
    </div>
  );
}