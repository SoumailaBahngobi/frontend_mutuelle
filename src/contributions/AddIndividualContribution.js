import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ContributionForm from './ContributionForm';
import axios from 'axios';

function AddIndividualContribution() {
  const [currentUser, setCurrentUser] = useState(null);
  const [contributionPeriods, setContributionPeriods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
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
      setError('Erreur lors du chargement des périodes de cotisation');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (formData) => {
    if (!currentUser) {
      alert('Vous devez être connecté pour ajouter une cotisation');
      navigate('/login');
      return;
    }
    if (!formData.amount || formData.amount <= 0) {
      alert('Veuillez saisir un montant valide');
      return;
    }
    // Ici, il faudrait aussi gérer la période de cotisation et autres champs spécifiques si besoin
    try {
      const contributionData = {
        amount: formData.amount,
        paymentDate: formData.paymentDate,
        member: { id: currentUser.id || currentUser.memberId },
        contributionType: 'INDIVIDUAL',
        // Ajoute ici d'autres champs si besoin (période, mode, preuve...)
      };
      const token = localStorage.getItem('token');
      await axios.post('http://localhost:8080/mut/contribution/individual', contributionData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      alert('Cotisation ajoutée avec succès !');
      navigate('/dashboard');
    } catch (error) {
      alert('Erreur lors de l\'ajout de la cotisation');
    }
  };

  if (!currentUser) {
    return (
      <div className="container">
        <div className="alert alert-warning text-center">
          <h4>Accès non autorisé</h4>
          <p>Vous devez être connecté pour accéder à cette page.</p>
          <button className="btn btn-primary" onClick={() => navigate('/login')}>Se connecter</button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mt-4">
      <div className="card">
        <div className="card-header bg-primary text-white">
          <h3>Ajouter une Cotisation Individuelle</h3>
        </div>
        <div className="card-body">
          <ContributionForm mode="individual" onSubmit={handleSubmit} />
        </div>
      </div>
    </div>
  );
}

export default AddIndividualContribution;