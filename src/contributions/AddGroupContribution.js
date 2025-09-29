import React from 'react';
import { useNavigate } from 'react-router-dom';
import ContributionForm from './ContributionForm';
import axios from 'axios';

function AddGroupContribution() {
  const navigate = useNavigate();
  const handleSubmit = async (formData) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post('http://localhost:8080/mut/contribution/group', formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('Cotisation groupée enregistrée avec succès !');
      navigate('/dashboard');
    } catch (err) {
      alert("Erreur lors de l'enregistrement de la cotisation groupée");
    }
  };

  return (
    <div className="container mt-4">
      <div className="card">
        <div className="card-header bg-primary text-white">
          <h4>Nouvelle Cotisation Groupée</h4>
        </div>
        <div className="card-body">
          <ContributionForm mode="group" onSubmit={handleSubmit} />
        </div>
      </div>
    </div>
  );
}

export default AddGroupContribution;
