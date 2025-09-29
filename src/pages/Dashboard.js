import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef();
  const [form, setForm] = React.useState({
    amount: '', paymentDate: '', memberId: '',paymentMode: '', paymentProof: '',balance: '', contributionType: ''   
});
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
  const navigate = useNavigate();
  const handleSubmit = async (e) => {
    e.preventDefault();
  
  try {
    await axios.post('http://localhost:8080/mut/contribution/individual', form);
    alert('Cotisation ajoutée avec succès !');
    setForm({
      amount: '', paymentDate: '', memberId: '',paymentMode: '', paymentProof: '',balance: '', contributionType: ''   
  });
    navigate('/dashboard');
  } catch (error) {
    alert('Erreur lors de l\'ajout de la cotisation');
  }
}

  if (loading) return <div className="container mt-4">Chargement...</div>;
  if (error) return <div className="container mt-4 alert alert-danger">{error}</div>;
  if (!user) return null;

  return (
    <div className="container mt-4">
      <div className="d-flex align-items-center mb-4">
        <img src={user.photo || 'https://via.placeholder.com/100'} alt="Profil" className="rounded-circle me-3" width={100} height={100} />
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
              <button className="btn btn-primary me-2" onClick={() => navigate('/mut/contribution/individual')}>Faire une cotisation</button>
                            <button className="btn btn-secondary" onClick={() => navigate('/mut/contribution/individual/my-contributions')}>Voir historique de mes cotisations</button>
              {/*<button className="btn btn-secondary">Voir l'historique</button>*/}
            </div>
          </div>
        </div>
      </div>

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
          <button className="btn btn-danger w-100">Déconnexion</button>
        </div>
      </div>
    </div>
  );
}
