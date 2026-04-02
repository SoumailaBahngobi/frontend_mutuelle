import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import ApiService from '../../service/api';
const AdminRoleManagement = () => {
    const navigate = useNavigate();
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedMember, setSelectedMember] = useState(null);
    const [selectedRole, setSelectedRole] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [updating, setUpdating] = useState(false);

    const roles = [
        { value: 'MEMBER', label: 'Membre', color: 'secondary' },
        { value: 'PRESIDENT', label: 'Président', color: 'danger' },
        { value: 'SECRETARY', label: 'Secrétaire', color: 'warning' },
        { value: 'TREASURER', label: 'Trésorier', color: 'info' },
        { value: 'ADMIN', label: 'Administrateur', color: 'dark' }
    ];

    useEffect(() => {
        fetchMembers();
    }, []);

    const fetchMembers = async () => {
        setLoading(true);
        try {
            const data = await ApiService.getAllMembers();
            setMembers(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Erreur:', error);
            toast.error('Erreur lors du chargement des membres');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (member) => {
        setSelectedMember(member);
        setSelectedRole(member.role || 'MEMBER');
        setShowModal(true);
    };

    const handleAssignRole = async () => {
        if (!selectedMember || !selectedRole) return;

        setUpdating(true);
        try {
            const response = await ApiService.assignRole(selectedMember.id, selectedRole);
            
            if (response.success) {
                toast.success(`Rôle "${selectedRole}" attribué à ${selectedMember.firstName} ${selectedMember.name}`);
                fetchMembers();
                setShowModal(false);
            } else {
                toast.error(response.error || 'Erreur');
            }
        } catch (error) {
            toast.error('Erreur lors de l\'attribution');
        } finally {
            setUpdating(false);
        }
    };

    const getRoleBadge = (role) => {
        const config = {
            PRESIDENT: { class: 'bg-danger', label: 'Président' },
            SECRETARY: { class: 'bg-warning text-dark', label: 'Secrétaire' },
            TREASURER: { class: 'bg-info text-dark', label: 'Trésorier' },
            ADMIN: { class: 'bg-dark', label: 'Admin' },
            MEMBER: { class: 'bg-secondary', label: 'Membre' }
        };
        const c = config[role] || config.MEMBER;
        return <span className={`badge ${c.class} px-3 py-2`}>{c.label}</span>;
    };

    if (loading) {
        return (
            <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '60vh' }}>
                <div className="spinner-border text-primary" role="status"></div>
            </div>
        );
    }

    return (
        <div className="container mt-4">
            <div className="card shadow">
                <div className="card-header bg-primary text-white d-flex justify-content-between align-items-center">
                    <h4 className="mb-0">
                        <i className="bi bi-person-badge me-2"></i>
                        Gestion des rôles
                    </h4>
                    <button className="btn btn-light btn-sm" onClick={() => navigate('/dashboard')}>
                        Retour
                    </button>
                </div>

                <div className="card-body">
                    <div className="table-responsive">
                        <table className="table table-striped table-hover">
                            <thead className="table-dark">
                                <tr>
                                    <th>ID</th>
                                    <th>Nom</th>
                                    <th>Prénom</th>
                                    <th>Email</th>
                                    <th>Rôle actuel</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {members.map(member => (
                                    <tr key={member.id}>
                                        <td>{member.id}</td>
                                        <td>{member.name}</td>
                                        <td>{member.firstName}</td>
                                        <td>{member.email}</td>
                                        <td>{getRoleBadge(member.role)}</td>
                                        <td>
                                            <button
                                                className="btn btn-sm btn-outline-primary"
                                                onClick={() => handleOpenModal(member)}
                                            >
                                                <i className="bi bi-pencil-square me-1"></i>
                                                Attribuer un rôle
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Modal */}
            {showModal && selectedMember && (
                <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content">
                            <div className="modal-header bg-primary text-white">
                                <h5 className="modal-title">Attribuer un rôle</h5>
                                <button className="btn-close btn-close-white" onClick={() => setShowModal(false)}></button>
                            </div>
                            <div className="modal-body">
                                <p><strong>{selectedMember.firstName} {selectedMember.name}</strong></p>
                                <p className="text-muted">{selectedMember.email}</p>
                                
                                <label className="form-label">Nouveau rôle</label>
                                <select
                                    className="form-select"
                                    value={selectedRole}
                                    onChange={(e) => setSelectedRole(e.target.value)}
                                >
                                    {roles.map(role => (
                                        <option key={role.value} value={role.value}>{role.label}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="modal-footer">
                                <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Annuler</button>
                                <button className="btn btn-primary" onClick={handleAssignRole} disabled={updating}>
                                    {updating ? 'Attribution...' : 'Attribuer'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminRoleManagement;