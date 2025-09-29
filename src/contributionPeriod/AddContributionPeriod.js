import React from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import 'bootstrap/dist/css/bootstrap.min.css';

export default function AddContributionPeriod() {
    const [form, setForm] = React.useState({
        startDate: '', 
        endDate: '', 
        description: ''   
    });
    
    const navigate = useNavigate();

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await axios.post('http://localhost:8080/mut/contribution_period', form);
            alert('Période de cotisation ajoutée avec succès !');
            setForm({
                startDate: '', 
                endDate: '', 
                description: ''   
            });
            navigate('/dashboard');
        } catch (error) {
            alert('Erreur lors de l\'ajout de la période de cotisation');
        }   
    };

    return (
        <div>
            <div className='container'>
                <div className="card">
                    <div className="card-header">
                        <h3>Ajouter une Période de Cotisation</h3>
                    </div>
                    <div className="card-body">
                        <form onSubmit={handleSubmit}>
                            <div className="form-group mb-3">
                                <label htmlFor="startDate" className="form-label">Date de Début</label>
                                <input 
                                    type="date" 
                                    className="form-control" 
                                    id="startDate" 
                                    name="startDate" 
                                    value={form.startDate} 
                                    onChange={handleChange} 
                                    required 
                                />
                            </div>
                            <div className="form-group mb-3">
                                <label htmlFor="endDate" className="form-label">Date de Fin</label>
                                <input 
                                    type="date" 
                                    className="form-control" 
                                    id="endDate" 
                                    name="endDate" 
                                    value={form.endDate} 
                                    onChange={handleChange} 
                                    required 
                                />  
                            </div>
                            <div className="form-group mb-3">
                                <label htmlFor="description" className="form-label">Description</label>
                                <input 
                                    type="text" 
                                    className="form-control" 
                                    id="description" 
                                    name="description" 
                                    value={form.description} 
                                    onChange={handleChange} 
                                    placeholder="Description de la période" 
                                    required
                                />
                            </div>
                            <button type="submit" className="btn btn-primary">
                                Ajouter la Période de Cotisation
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}