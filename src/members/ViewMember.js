import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import axios from 'axios';
import { toast } from 'react-toastify';

export default function ViewMember() {
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterRole, setFilterRole] = useState('');
    const [exportLoading, setExportLoading] = useState(false);
    const navigate = useNavigate();

    useEffect(() => { 
        fetchMembers(); 
    }, []);

    const fetchMembers = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const response = await axios.get("http://localhost:8080/mutuelle/member", {
                headers: { Authorization: `Bearer ${token}` }
            });
            setMembers(response.data);
        } catch (error) {
            //console.error('Erreur lors du chargement des membres:', error);
            toast.error('Erreur lors du chargement des membres');
        } finally {
            setLoading(false);
        }
    };

    // Fonction d'exportation Excel
    const exportToExcel = async () => {
        if (filteredMembers.length === 0) {
            toast.info('Aucune donnée à exporter en Excel', { autoClose: 5000 });
            return;
        }

        setExportLoading(true);
        try {
            const XLSX = await import('xlsx');
            
            const exportData = filteredMembers.map((member, index) => ({
                '#': index + 1,
                'Nom': member.name || '',
                'Prénom': member.firstName || '',
                'Email': member.email || '',
                'NPI': member.npi || '',
                'Téléphone': member.phone || '',
                'Rôle': getRoleLabel(member.role),
                'Date de création': member.creationDate ? new Date(member.creationDate).toLocaleDateString() : '',
                'Statut': member.active ? 'Actif' : 'Inactif'
            }));

            const ws = XLSX.utils.json_to_sheet(exportData);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, 'Membres');
            
            const fileName = `membres_${new Date().toISOString().split('T')[0]}.xlsx`;
            XLSX.writeFile(wb, fileName);
            
            toast.success('Exportation Excel réussie !', { autoClose: 5000 });
        } catch (error) {
            console.error('Erreur export Excel:', error);
            toast.error('Erreur lors de l\'exportation Excel', { autoClose: 7000 });
        } finally {
            setExportLoading(false);
        }
    };

    // Fonction d'exportation PDF
    const exportToPDF = () => {
        if (filteredMembers.length === 0) {
            toast.info('Aucune donnée à exporter en PDF', { autoClose: 5000 });
            return;
        }

        setExportLoading(true);
        try {
            const printContent = `
                <html>
                    <head>
                        <title>Liste des Membres</title>
                        <style>
                            body { font-family: Arial, sans-serif; margin: 20px; }
                            h1 { color: #2c3e50; text-align: center; border-bottom: 2px solid #3498db; padding-bottom: 10px; }
                            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                            th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
                            th { background-color: #f8f9fa; color: #2c3e50; }
                            .badge { padding: 4px 8px; border-radius: 4px; color: white; font-size: 12px; }
                            .info { background-color: #17a2b8; }
                            .success { background-color: #28a745; }
                            .warning { background-color: #ffc107; color: black; }
                            .danger { background-color: #dc3545; }
                            .secondary { background-color: #6c757d; }
                            .summary { margin-top: 30px; padding: 15px; background-color: #f8f9fa; border-radius: 5px; }
                        </style>
                    </head>
                    <body>
                        <h1>📊 Liste des Membres</h1>
                        <p><strong>Date d'exportation:</strong> ${new Date().toLocaleDateString()}</p>
                        <p><strong>Total membres:</strong> ${filteredMembers.length}</p>
                        
                        <table>
                            <thead>
                                <tr>
                                    <th>#</th>
                                    <th>Nom</th>
                                    <th>Prénom</th>
                                    <th>Email</th>
                                    <th>NPI</th>
                                    <th>Téléphone</th>
                                    <th>Rôle</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${filteredMembers.map((member, index) => `
                                    <tr>
                                        <td>${index + 1}</td>
                                        <td>${member.name || ''}</td>
                                        <td>${member.firstName || ''}</td>
                                        <td>${member.email || ''}</td>
                                        <td>${member.npi || ''}</td>
                                        <td>${member.phone || ''}</td>
                                        <td>
                                            <span class="badge ${getRoleBadgeClass(member.role)}">
                                                ${getRoleLabel(member.role)}
                                            </span>
                                        </td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                        
                        <div class="summary">
                            <h3>📈 Statistiques</h3>
                            <p>Membres: ${members.filter(m => m.role === 'MEMBER').length}</p>
                            <p>Secrétaires: ${members.filter(m => m.role === 'SECRETARY').length}</p>
                            <p>Présidents: ${members.filter(m => m.role === 'PRESIDENT').length}</p>
                            <p>Trésoriers: ${members.filter(m => m.role === 'TREASURER').length}</p>
                            <p>Administrateurs: ${members.filter(m => m.role === 'ADMIN').length}</p>
                        </div>
                    </body>
                </html>
            `;

            const printWindow = window.open('', '_blank');
            printWindow.document.write(printContent);
            printWindow.document.close();
            
            printWindow.onload = function() {
                printWindow.print();
            };

        } catch (error) {
            console.error('Erreur export PDF:', error);
            toast.error('Erreur lors de l\'exportation PDF', { autoClose: 7000 });
        } finally {
            setExportLoading(false);
        }
    };

    // Fonction d'exportation CSV
    const exportToCSV = () => {
        if (filteredMembers.length === 0) {
            toast.info('Aucune donnée à exporter en CSV', { autoClose: 5000 });
            return;
        }

        setExportLoading(true);
        try {
            const headers = ['#', 'Nom', 'Prénom', 'Email', 'NPI', 'Téléphone', 'Rôle', 'Statut'];
            
            const csvData = filteredMembers.map((member, index) => [
                index + 1,
                `"${member.name || ''}"`,
                `"${member.firstName || ''}"`,
                `"${member.email || ''}"`,
                member.npi || '',
                `"${member.phone || ''}"`,
                `"${getRoleLabel(member.role)}"`,
                member.active ? 'Actif' : 'Inactif'
            ].join(','));

            const csvContent = [headers.join(','), ...csvData].join('\n');
            
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', `membres_${new Date().toISOString().split('T')[0]}.csv`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            toast.success('Exportation CSV réussie !', { autoClose: 5000 });
        } catch (error) {
            console.error('Erreur export CSV:', error);
            toast.error('Erreur lors de l\'exportation CSV', { autoClose: 7000 });
        } finally {
            setExportLoading(false);
        }
    };

    // Fonctions utilitaires
    const getRoleLabel = (role) => {
        const roleLabels = {
            'MEMBER': 'Membre',
            'SECRETARY': 'Secrétaire',
            'PRESIDENT': 'Président',
            'TREASURER': 'Trésorier',
            'ADMIN': 'Administrateur'
        };
        return roleLabels[role] || role;
    };

    const getRoleBadgeClass = (role) => {
        const roleClasses = {
            'MEMBER': 'secondary',
            'SECRETARY': 'info',
            'PRESIDENT': 'success',
            'TREASURER': 'warning',
            'ADMIN': 'danger'
        };
        return roleClasses[role] || 'secondary';
    };

    const getRoleBadge = (role) => {
        const roleClasses = {
            'MEMBER': 'bg-secondary',
            'SECRETARY': 'bg-info',
            'PRESIDENT': 'bg-success',
            'TREASURER': 'bg-warning text-dark',
            'ADMIN': 'bg-danger'
        };

        const roleLabels = {
            'MEMBER': 'Membre',
            'SECRETARY': 'Secrétaire',
            'PRESIDENT': 'Président',
            'TREASURER': 'Trésorier',
            'ADMIN': 'Administrateur'
        };

        return (
            <span className={`badge ${roleClasses[role] || 'bg-secondary'}`}>
                {roleLabels[role] || role}
            </span>
        );
    };

    const handleEdit = (memberId) => {
        navigate(`/members/edit/${memberId}`);
    };

    const handleDelete = async (memberId, memberName) => {
        if (window.confirm(`Êtes-vous sûr de vouloir supprimer le membre "${memberName}" ? Cette action est irréversible.`)) {
            try {
                const token = localStorage.getItem('token');
                await axios.delete(`http://localhost:8080/mutuelle/member/${memberId}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                toast.success('Membre supprimé avec succès');
                fetchMembers(); // Recharger la liste
            } catch (error) {
                console.error('Erreur lors de la suppression:', error);
                if (error.response?.status === 403) {
                    toast.error('Vous n\'avez pas les permissions pour supprimer ce membre');
                } else if (error.response?.status === 400) {
                    toast.error('Impossible de supprimer ce membre (données liées existantes)');
                } else {
                    toast.error('Erreur lors de la suppression du membre');
                }
            }
        }
    };

    const handleAddMember = () => {
        navigate('/members/add');
    };

    const filteredMembers = members.filter(member => {
        const matchesSearch = 
            member.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            member.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            member.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            member.npi?.toString().includes(searchTerm) ||
            member.phone?.includes(searchTerm);

        const matchesRole = filterRole ? member.role === filterRole : true;

        return matchesSearch && matchesRole;
    });

    if (loading) {
        return (
            <div className="container mt-5">
                <div className="row justify-content-center">
                    <div className="col-md-6 text-center">
                        <div className="spinner-border text-primary" role="status">
                            <span className="visually-hidden">Chargement...</span>
                        </div>
                        <p className="mt-2">Chargement des membres...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="container mt-4">
            <div className="card shadow">
                <div className="card-header bg-primary text-white">
                    <div className="d-flex justify-content-between align-items-center">
                        <h4 className="card-title mb-0">
                            <i className="bi bi-people-fill me-2"></i>
                            Gestion des Membres
                        </h4>
                        <span className="badge bg-light text-dark">
                            {filteredMembers.length} membre(s)
                        </span>
                    </div>
                </div>
                
                <div className="card-body">
                    {/* Barre d'outils */}
                    <div className="row mb-4">
                        <div className="col-md-4">
                            <div className="input-group">
                                <span className="input-group-text">
                                    <i className="bi bi-search"></i>
                                </span>
                                <input
                                    type="text"
                                    className="form-control"
                                    placeholder="Rechercher un membre..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="col-md-3">
                            <select 
                                className="form-select"
                                value={filterRole}
                                onChange={(e) => setFilterRole(e.target.value)}
                            >
                                <option value="">Tous les rôles</option>
                                <option value="MEMBER">Membre</option>
                                <option value="SECRETARY">Secrétaire</option>
                                <option value="PRESIDENT">Président</option>
                                <option value="TREASURER">Trésorier</option>
                                <option value="ADMIN">Administrateur</option>
                            </select>
                        </div>
                        <div className="col-md-5 text-end">
                            {/* Boutons d'exportation */}
                            <div className="btn-group me-2">
                                <button 
                                    className="btn btn-success btn-sm"
                                    onClick={exportToExcel}
                                    disabled={exportLoading || filteredMembers.length === 0}
                                >
                                    {exportLoading ? '⏳' : '📊'} Excel
                                </button>
                                <button 
                                    className="btn btn-danger btn-sm"
                                    onClick={exportToPDF}
                                    disabled={exportLoading || filteredMembers.length === 0}
                                >
                                    {exportLoading ? '⏳' : '📄'} PDF
                                </button>
                                <button 
                                    className="btn btn-info btn-sm"
                                    onClick={exportToCSV}
                                    disabled={exportLoading || filteredMembers.length === 0}
                                >
                                    {exportLoading ? '⏳' : '📋'} CSV
                                </button>
                            </div>

                            <button 
                                className="btn btn-success"
                                onClick={handleAddMember}
                            >
                                <i className="bi bi-person-plus me-2"></i>
                                Ajouter un Membre
                            </button>
                            <button 
                                className="btn btn-outline-secondary ms-2"
                                onClick={fetchMembers}
                            >
                                <i className="bi bi-arrow-clockwise me-2"></i>
                                Actualiser
                            </button>
                            <button 
                                className="btn btn-primary ms-2"
                                onClick={() => navigate('/dashboard')}
                            >
                                <i className="fas fa-arrow-left me-2"></i>
                                Retour
                            </button>
                        </div>
                    </div>

                    {/* Instructions */}
                    <div className="alert alert-info mb-3">
                        <i className="bi bi-info-circle me-2"></i>
                        <strong>Instructions :</strong> Sélectionnez un membre dans la liste pour le modifier ou le supprimer.
                    </div>

                    {/* Tableau des membres */}
                    <div className="table-responsive">
                        <table className="table table-striped table-hover">
                            <thead className="table-dark">
                                <tr>
                                    <th scope="col">#</th>
                                    <th scope="col">Nom</th>
                                    <th scope="col">Prénom</th>
                                    <th scope="col">Email</th>
                                    <th scope="col">NPI</th>
                                    <th scope="col">Téléphone</th>
                                    <th scope="col">Rôle</th>
                                    <th scope="col" className="text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredMembers.length === 0 ? (
                                    <tr>
                                        <td colSpan="8" className="text-center text-muted py-4">
                                            <i className="bi bi-people display-4 d-block mb-2"></i>
                                            Aucun membre trouvé
                                            {searchTerm || filterRole ? (
                                                <div className="mt-2">
                                                    <button 
                                                        className="btn btn-sm btn-outline-primary"
                                                        onClick={() => {
                                                            setSearchTerm('');
                                                            setFilterRole('');
                                                        }}
                                                    >
                                                        Réinitialiser les filtres
                                                    </button>
                                                </div>
                                            ) : null}
                                        </td>
                                    </tr>
                                ) : (
                                    filteredMembers.map((member, index) => (
                                        <tr key={member.id} className="align-middle">
                                            <th scope="row">{index + 1}</th>
                                            <td className="fw-semibold">{member.name}</td>
                                            <td>{member.firstName}</td>
                                            <td>
                                                <a href={`mailto:${member.email}`} className="text-decoration-none">
                                                    {member.email}
                                                </a>
                                            </td>
                                            <td>
                                                <span className="badge bg-light text-dark">{member.npi}</span>
                                            </td>
                                            <td>
                                                <a href={`tel:${member.phone}`} className="text-decoration-none">
                                                    {member.phone}
                                                </a>
                                            </td>
                                            <td>{getRoleBadge(member.role)}</td>
                                            <td className="text-center">
                                                <div className="btn-group btn-group-sm">
                                                    <button 
                                                        className="btn btn-warning"
                                                        onClick={() => handleEdit(member.id)}
                                                        title="Modifier ce membre"
                                                    >
                                                        <i className="bi bi-pencil me-1"></i>
                                                        Modifier
                                                    </button>
                                                    <button 
                                                        className="btn btn-danger"
                                                        onClick={() => handleDelete(member.id, `${member.name} ${member.firstName}`)}
                                                        title="Supprimer ce membre"
                                                        disabled={member.role === 'ADMIN'} // Empêcher la suppression des admins
                                                    >
                                                        <i className="bi bi-trash me-1"></i>
                                                        Supprimer
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
                        <div className="col-12">
                            <div className="card bg-light">
                                <div className="card-body py-3">
                                    <h6 className="card-title text-center mb-3">
                                        <i className="bi bi-graph-up me-2"></i>
                                        Statistiques des Membres
                                    </h6>
                                    <div className="row text-center">
                                        <div className="col">
                                            <h5 className="mb-0 text-primary">{members.filter(m => m.role === 'MEMBER').length}</h5>
                                            <small className="text-muted">Membres</small>
                                        </div>
                                        <div className="col">
                                            <h5 className="mb-0 text-info">{members.filter(m => m.role === 'SECRETARY').length}</h5>
                                            <small className="text-muted">Secrétaires</small>
                                        </div>
                                        <div className="col">
                                            <h5 className="mb-0 text-success">{members.filter(m => m.role === 'PRESIDENT').length}</h5>
                                            <small className="text-muted">Présidents</small>
                                        </div>
                                        <div className="col">
                                            <h5 className="mb-0 text-warning">{members.filter(m => m.role === 'TREASURER').length}</h5>
                                            <small className="text-muted">Trésoriers</small>
                                        </div>
                                        <div className="col">
                                            <h5 className="mb-0 text-danger">{members.filter(m => m.role === 'ADMIN').length}</h5>
                                            <small className="text-muted">Administrateurs</small>
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