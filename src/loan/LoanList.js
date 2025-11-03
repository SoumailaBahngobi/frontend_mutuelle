import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import 'bootstrap/dist/css/bootstrap.min.css';
import { toast } from 'react-toastify';

function LoanList() {
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [exportLoading, setExportLoading] = useState(false);

  const navigate = useNavigate();

  // Fonction pour parser les données selon la structure réelle de votre API
  const parseLoanData = (loanData) => {
    // Déterminer les différents statuts basés sur votre structure
    const isRepaid = loanData.repaid || loanData.status === 'REPAID' || false;
    const isApproved = loanData.status === 'APPROVED' || loanData.status === 'VALIDÉ' || false;
    const isPending = loanData.status === 'PENDING' || loanData.status === 'EN_ATTENTE' || true; // Par défaut en attente
    const isRejected = loanData.status === 'REJECTED' || loanData.status === 'REJETÉ' || false;

    const parsedLoan = {
      id: loanData.id || loanData.loanId,
      amount: loanData.amount || loanData.loanAmount || 0,
      beginDate: loanData.beginDate || loanData.startDate,
      endDate: loanData.endDate || loanData.dueDate,
      isRepaid: isRepaid,
      isApproved: isApproved,
      isPending: isPending,
      isRejected: isRejected,
      status: loanData.status || (isRepaid ? 'REPAID' : (isPending ? 'PENDING' : (isRejected ? 'REJECTED' : 'APPROVED'))),
      duration: loanData.duration || 0,
      interestRate: loanData.interestRate || 0,
      repaymentAmount: loanData.repaymentAmount || 0,
      description: loanData.description || 'Prêt personnel',
      
      // Données du membre
      member: {
        id: loanData.member?.id,
        firstName: loanData.member?.firstName || loanData.member?.firstname || 'Prénom',
        name: loanData.member?.name || loanData.member?.lastname || 'Nom',
        npi: loanData.member?.npi || loanData.member?.matricule || 'N/A',
        email: loanData.member?.email || 'email@exemple.com',
        role: loanData.member?.role || 'Membre'
      },
      
      repayments: loanData.repayments || [],
      createdAt: loanData.createdAt,
      updatedAt: loanData.updatedAt
    };

    return parsedLoan;
  };

  const fetchLoans = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Token d\'authentification manquant');
        navigate('/login');
        return;
      }

      setLoading(true);
      setError('');
      
      const response = await axios.get('http://localhost:8080/mut/loans', {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        timeout: 15000
      });
     
      let loansData = [];
      
      if (Array.isArray(response.data)) {
        loansData = response.data.map(parseLoanData);
      } else if (response.data && typeof response.data === 'object') {
        if (Array.isArray(response.data.content)) {
          loansData = response.data.content.map(parseLoanData);
        } else if (Array.isArray(response.data.loans)) {
          loansData = response.data.loans.map(parseLoanData);
        } else if (Array.isArray(response.data.data)) {
          loansData = response.data.data.map(parseLoanData);
        } else {
          loansData = [parseLoanData(response.data)];
        }
      }
      
      if (loansData.length === 0) {
        toast.warning('Aucun prêt trouvé dans la base de données');
      } else {
        toast.success(`${loansData.length} prêt(s) chargé(s) avec succès`);
      }
      
      setLoans(loansData);
      
    } catch (error) {
      console.error('❌ Erreur lors du chargement:', error);
      
      let errorMessage = 'Erreur lors du chargement des prêts';
      
      if (axios.isAxiosError(error)) {
        const status = error.response?.status;
        
        switch (status) {
          case 401:
            errorMessage = 'Session expirée - Veuillez vous reconnecter';
            localStorage.removeItem('token');
            navigate('/login');
            break;
          case 404:
            errorMessage = 'Endpoint non trouvé';
            break;
          default:
            if (!error.response) {
              errorMessage = 'Erreur de connexion réseau';
            }
        }
      }
      
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [navigate]);


///////////////////////////////////////
  useEffect(() => {
    fetchLoans();
  }, [fetchLoans]);

  // Fonctions utilitaires
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF'
    }).format(amount || 0);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return isNaN(date.getTime()) ? 'Date invalide' : date.toLocaleDateString('fr-FR');
    } catch {
      return 'Date invalide';
    }
  };

  const calculateRemainingAmount = (loan) => {
    if (!loan.repayments || !Array.isArray(loan.repayments)) {
      return loan.amount || 0;
    }
    
    const totalRepaid = loan.repayments.reduce((sum, repayment) => {
      const amount = typeof repayment === 'object' ? 
        (repayment.amount || repayment.paymentAmount || 0) : 
        Number(repayment) || 0;
      return sum + amount;
    }, 0);
    
    return Math.max(0, (loan.amount || 0) - totalRepaid);
  };

  const calculateProgress = (loan) => {
    const totalRepaid = (loan.repayments || []).reduce((sum, repayment) => {
      const amount = typeof repayment === 'object' ? 
        (repayment.amount || repayment.paymentAmount || 0) : 
        Number(repayment) || 0;
      return sum + amount;
    }, 0);
    
    const loanAmount = loan.amount || 1;
    return Math.min(100, (totalRepaid / loanAmount) * 100);
  };

  const calculateRemainingDays = (endDate, isRepaid) => {
    if (isRepaid || !endDate) return 0;
    
    try {
      const today = new Date();
      const end = new Date(endDate);
      
      if (isNaN(end.getTime())) return 0;
      
      const diffTime = end - today;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays;
    } catch {
      return 0;
    }
  };

  // CALCUL DES STATISTIQUES DÉTAILLÉES
  const calculateStatistics = () => {
    const stats = {
      // Statistiques par statut
      byStatus: {
        pending: loans.filter(loan => loan.isPending && !loan.isApproved && !loan.isRejected),
        approved: loans.filter(loan => loan.isApproved && !loan.isRepaid),
        repaid: loans.filter(loan => loan.isRepaid),
        rejected: loans.filter(loan => loan.isRejected),
        active: loans.filter(loan => !loan.isRepaid && loan.isApproved),
        overdue: loans.filter(loan => !loan.isRepaid && calculateRemainingDays(loan.endDate, loan.isRepaid) < 0)
      }, 
      // Montants totaux par statut
      amounts: {
        total: loans.reduce((sum, loan) => sum + (loan.amount || 0), 0),
        pending: loans.filter(loan => loan.isPending && !loan.isApproved && !loan.isRejected)
          .reduce((sum, loan) => sum + (loan.amount || 0), 0),
        approved: loans.filter(loan => loan.isApproved && !loan.isRepaid)
          .reduce((sum, loan) => sum + (loan.amount || 0), 0),
        repaid: loans.filter(loan => loan.isRepaid)
          .reduce((sum, loan) => sum + (loan.amount || 0), 0),
        rejected: loans.filter(loan => loan.isRejected)
          .reduce((sum, loan) => sum + (loan.amount || 0), 0),
        active: loans.filter(loan => !loan.isRepaid && loan.isApproved)
          .reduce((sum, loan) => sum + (loan.amount || 0), 0),
        overdue: loans.filter(loan => !loan.isRepaid && calculateRemainingDays(loan.endDate, loan.isRepaid) < 0)
          .reduce((sum, loan) => sum + (loan.amount || 0), 0)
      },
      
      // Statistiques financières
      financial: {
        totalRepaid: loans.reduce((sum, loan) => sum + (loan.amount || 0) - calculateRemainingAmount(loan), 0),
        totalRemaining: loans.reduce((sum, loan) => sum + calculateRemainingAmount(loan), 0),
        averageLoan: loans.length > 0 ? loans.reduce((sum, loan) => sum + (loan.amount || 0), 0) / loans.length : 0,
        interestEarned: loans.reduce((sum, loan) => sum + ((loan.repaymentAmount || 0) - (loan.amount || 0)), 0),
        totalRequested: loans.reduce((sum, loan) => sum + (loan.amount || 0), 0)
      },
      
      // Statistiques temporelles
      temporal: {
        upcomingDue: loans.filter(loan => 
          !loan.isRepaid && 
          calculateRemainingDays(loan.endDate, loan.isRepaid) <= 30 && 
          calculateRemainingDays(loan.endDate, loan.isRepaid) > 0
        ),
        recentLoans: loans.filter(loan => {
          const created = new Date(loan.createdAt);
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
          return created > thirtyDaysAgo;
        })
      }
    };
    return stats;
  };

  // FONCTIONS D'EXPORT
  const exportToExcel = async () => {
    if (filteredLoans.length === 0) {
      toast.info('Aucune donnée à exporter en Excel', { autoClose: 5000 });
      return;
    }

    setExportLoading(true);
    try {
      const XLSX = await import('xlsx');
      
      const exportData = filteredLoans.map(loan => ({
        'ID Prêt': loan.id,
        'Membre': `${loan.member?.firstName} ${loan.member?.name}`,
        'NPI': loan.member?.npi,
        'Email': loan.member?.email,
        'Rôle': loan.member?.role,
        'Montant Prêt': loan.amount,
        'Taux Intérêt': `${loan.interestRate}%`,
        'Montant à Rembourser': loan.repaymentAmount,
        'Montant Remboursé': loan.amount - calculateRemainingAmount(loan),
        'Reste à Payer': calculateRemainingAmount(loan),
        'Progression': `${calculateProgress(loan).toFixed(1)}%`,
        'Date Début': formatDate(loan.beginDate),
        'Date Fin': formatDate(loan.endDate),
        'Durée (mois)': loan.duration,
        'Jours Restants': calculateRemainingDays(loan.endDate, loan.isRepaid),
        'Statut': getStatusLabel(loan),
        'Description': loan.description
      }));

      // Créer un classeur avec plusieurs feuilles
      const wb = XLSX.utils.book_new();
      
      // Feuille des prêts
      const wsLoans = XLSX.utils.json_to_sheet(exportData);
      XLSX.utils.book_append_sheet(wb, wsLoans, 'Prêts');
      
      // Feuille des statistiques
      const stats = calculateStatistics();
      const statsData = [
        { 'Statistique': 'Total Prêts Demandés', 'Nombre': loans.length, 'Montant': formatCurrency(stats.amounts.total) },
        { 'Statistique': 'Prêts En Attente', 'Nombre': stats.byStatus.pending.length, 'Montant': formatCurrency(stats.amounts.pending) },
        { 'Statistique': 'Prêts Accordés', 'Nombre': stats.byStatus.approved.length, 'Montant': formatCurrency(stats.amounts.approved) },
        { 'Statistique': 'Prêts Rejetés', 'Nombre': stats.byStatus.rejected.length, 'Montant': formatCurrency(stats.amounts.rejected) },
        { 'Statistique': 'Prêts Remboursés', 'Nombre': stats.byStatus.repaid.length, 'Montant': formatCurrency(stats.amounts.repaid) },
        { 'Statistique': 'Prêts En Retard', 'Nombre': stats.byStatus.overdue.length, 'Montant': formatCurrency(stats.amounts.overdue) },
        { 'Statistique': 'Total Remboursé', 'Nombre': '', 'Montant': formatCurrency(stats.financial.totalRepaid) },
        { 'Statistique': 'Reste à Payer', 'Nombre': '', 'Montant': formatCurrency(stats.financial.totalRemaining) },
        { 'Statistique': 'Intérêts Perçus', 'Nombre': '', 'Montant': formatCurrency(stats.financial.interestEarned) }
      ];
      const wsStats = XLSX.utils.json_to_sheet(statsData);
      XLSX.utils.book_append_sheet(wb, wsStats, 'Statistiques');
      
      const fileName = `export_prets_${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(wb, fileName);
      
      toast.success('Exportation Excel réussie !', { autoClose: 5000 });
    } catch (error) {
     // console.error('Erreur export Excel:', error);
      toast.error('Erreur lors de l\'exportation Excel', { autoClose: 7000 });
    } finally {
      setExportLoading(false);
    }
  };

  const exportToPDF = () => {
    if (filteredLoans.length === 0) {
      toast.info('Aucune donnée à exporter en PDF', { autoClose: 5000 });
      return;
    }

    setExportLoading(true);
    try {
      const stats = calculateStatistics();
      
      const printContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <title>Rapport des Prêts - Mutuelle</title>
            <style>
              body { 
                font-family: 'Arial', sans-serif; 
                margin: 20px; 
                color: #333;
                font-size: 12px;
              }
              .header { 
                text-align: center; 
                margin-bottom: 30px; 
                border-bottom: 2px solid #28a745;
                padding-bottom: 20px; 
              }
              .summary { 
                margin: 20px 0; 
                padding: 15px; 
                background-color: #f8f9fa; 
                border-radius: 5px; 
                border-left: 4px solid #007bff;
              }
              .stats-grid { 
                display: grid; 
                grid-template-columns: repeat(4, 1fr); 
                gap: 10px; 
                margin: 20px 0;
              }
              .stat-card { 
                background: white; 
                padding: 10px; 
                border-radius: 5px; 
                text-align: center;
                border: 1px solid #dee2e6;
              }
              table { 
                width: 100%; 
                border-collapse: collapse; 
                margin-top: 20px; 
                font-size: 10px;
              }
              th, td { 
                border: 1px solid #ddd; 
                padding: 6px; 
                text-align: left; 
              }
              th { 
                background-color: #343a40; 
                color: white;
                font-weight: bold;
              }
              tr:nth-child(even) {
                background-color: #f8f9fa;
              }
              .footer {
                margin-top: 30px;
                text-align: center;
                color: #666;
                font-size: 10px;
                border-top: 1px solid #ddd;
                padding-top: 10px;
              }
              .status-badge {
                padding: 2px 6px;
                border-radius: 3px;
                color: white;
                font-size: 9px;
                font-weight: bold;
              }
              .status-pending { background-color: #ffc107; color: black; }
              .status-approved { background-color: #28a745; }
              .status-rejected { background-color: #dc3545; }
              .status-repaid { background-color: #6c757d; }
            </style>
          </head>
          <body>
            <div class="header">
              <h1 style="color: #28a745; margin-bottom: 5px;">Rapport des Prêts</h1>
              <h3 style="color: #666; margin-top: 0;">Mutuelle</h3>
              <p>Exporté le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}</p>
              <p style="color: #6c757d;">Filtre: ${getFilterLabel(filter)} | ${filteredLoans.length} prêt(s)</p>
            </div>
            
            <div class="summary">
              <h3 style="color: #007bff; margin-top: 0;">Résumé Financier</h3>
              <div class="stats-grid">
                <div class="stat-card">
                  <strong>En Attente</strong><br>
                  ${stats.byStatus.pending.length}<br>
                  <small>${formatCurrency(stats.amounts.pending)}</small>
                </div>
                <div class="stat-card">
                  <strong>Accordés</strong><br>
                  ${stats.byStatus.approved.length}<br>
                  <small>${formatCurrency(stats.amounts.approved)}</small>
                </div>
                <div class="stat-card">
                  <strong>Rejetés</strong><br>
                  ${stats.byStatus.rejected.length}<br>
                  <small>${formatCurrency(stats.amounts.rejected)}</small>
                </div>
                <div class="stat-card">
                  <strong>Remboursés</strong><br>
                  ${stats.byStatus.repaid.length}<br>
                  <small>${formatCurrency(stats.amounts.repaid)}</small>
                </div>
              </div>
            </div>

            <table>
              <thead>
                <tr>
                  <th>Membre</th>
                  <th>Montant</th>
                  <th>Date début</th>
                  <th>Date fin</th>
                  <th>Statut</th>
                  <th>Progression</th>
                  <th>Reste à payer</th>
                </tr>
              </thead>
              <tbody>
                ${filteredLoans.map(loan => {
                  const remainingAmount = calculateRemainingAmount(loan);
                  const progress = calculateProgress(loan);
                  const statusClass = getStatusClass(loan);
                  const statusLabel = getStatusLabel(loan);
                  
                  return `
                    <tr>
                      <td>${loan.member?.firstName} ${loan.member?.name}</td>
                      <td>${formatCurrency(loan.amount)}</td>
                      <td>${formatDate(loan.beginDate)}</td>
                      <td>${formatDate(loan.endDate)}</td>
                      <td><span class="status-badge ${statusClass}">${statusLabel}</span></td>
                      <td>${progress.toFixed(1)}%</td>
                      <td>${formatCurrency(remainingAmount)}</td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
            
            <div class="footer">
              <p>Généré automatiquement par le système de gestion des prêts | ${filteredLoans.length} prêt(s) exporté(s)</p>
            </div>
          </body>
        </html>
      `;

      const printWindow = window.open('', '_blank');
      printWindow.document.write(printContent);
      printWindow.document.close();
      
      printWindow.onload = function() {
        printWindow.print();
        printWindow.onafterprint = function() {
          printWindow.close();
        };
      };

      toast.success('PDF généré avec succès !', { autoClose: 5000 });
    } catch (error) {
      console.error('Erreur export PDF:', error);
      toast.error('Erreur lors de l\'exportation PDF', { autoClose: 7000 });
    } finally {
      setExportLoading(false);
    }
  };

  const exportToCSV = () => {
    if (filteredLoans.length === 0) {
      toast.info('Aucune donnée à exporter en CSV', { autoClose: 5000 });
      return;
    }

    setExportLoading(true);
    try {
      const headers = [
        'ID Prêt', 'Membre', 'NPI', 'Email', 'Rôle', 
        'Montant Prêt', 'Taux Intérêt', 'Montant à Rembourser', 
        'Montant Remboursé', 'Reste à Payer', 'Progression',
        'Date Début', 'Date Fin', 'Durée (mois)', 'Jours Restants', 'Statut', 'Description'
      ];
      
      const csvData = filteredLoans.map(loan => {
        const remainingAmount = calculateRemainingAmount(loan);
        const progress = calculateProgress(loan);
        const status = getStatusLabel(loan);
        
        return [
          loan.id,
          `"${loan.member?.firstName} ${loan.member?.name}"`,
          `"${loan.member?.npi || ''}"`,
          `"${loan.member?.email || ''}"`,
          `"${loan.member?.role || ''}"`,
          loan.amount,
          `${loan.interestRate}%`,
          loan.repaymentAmount,
          loan.amount - remainingAmount,
          remainingAmount,
          `${progress.toFixed(1)}%`,
          `"${formatDate(loan.beginDate)}"`,
          `"${formatDate(loan.endDate)}"`,
          loan.duration,
          calculateRemainingDays(loan.endDate, loan.isRepaid),
          `"${status}"`,
          `"${loan.description || ''}"`
        ].join(',');
      });

      const csvContent = [headers.join(','), ...csvData].join('\n');
      
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `export_prets_${new Date().toISOString().split('T')[0]}.csv`);
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

  const exportToJSON = () => {
    if (filteredLoans.length === 0) {
      toast.info('Aucune donnée à exporter en JSON', { autoClose: 5000 });
      return;
    }

    setExportLoading(true);
    try {
      const exportData = {
        metadata: {
          exportDate: new Date().toISOString(),
          totalLoans: filteredLoans.length,
          filter: filter,
          searchTerm: searchTerm
        },
        statistics: calculateStatistics(),
        loans: filteredLoans.map(loan => ({
          ...loan,
          remainingAmount: calculateRemainingAmount(loan),
          progress: calculateProgress(loan),
          remainingDays: calculateRemainingDays(loan.endDate, loan.isRepaid)
        }))
      };

      const dataStr = JSON.stringify(exportData, null, 2);
      const blob = new Blob([dataStr], { type: 'application/json' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `export_prets_${new Date().toISOString().split('T')[0]}.json`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success('Exportation JSON réussie !', { autoClose: 5000 });
    } catch (error) {
      console.error('Erreur export JSON:', error);
      toast.error('Erreur lors de l\'exportation JSON', { autoClose: 7000 });
    } finally {
      setExportLoading(false);
    }
  };

  // Fonctions utilitaires pour les statuts
  const getStatusLabel = (loan) => {
    if (loan.isRepaid) return 'Remboursé';
    if (loan.isRejected) return 'Rejeté';
    if (loan.isApproved) return 'Accordé';
    if (loan.isPending) return 'En attente';
    return 'Inconnu';
  };

  const getStatusClass = (loan) => {
    if (loan.isRepaid) return 'status-repaid';
    if (loan.isRejected) return 'status-rejected';
    if (loan.isApproved) return 'status-approved';
    if (loan.isPending) return 'status-pending';
    return 'status-pending';
  };

  const getStatusBadge = (loan) => {
    if (loan.isRepaid) {
      return <span className="badge bg-success">Remboursé</span>;
    }
    if (loan.isRejected) {
      return <span className="badge bg-danger">Rejeté</span>;
    }
    if (loan.isApproved) {
      const daysRemaining = calculateRemainingDays(loan.endDate, loan.isRepaid);
      if (daysRemaining < 0) {
        return <span className="badge bg-warning text-dark">En retard</span>;
      }
      return <span className="badge bg-primary">Accordé</span>;
    }
    if (loan.isPending) {
      return <span className="badge bg-secondary">En attente</span>;
    }
    return <span className="badge bg-light text-dark">Inconnu</span>;
  };

  const getFilterLabel = (filterValue) => {
    switch (filterValue) {
      case 'all': return 'Tous les prêts';
      case 'pending': return 'En attente';
      case 'approved': return 'Accordés';
      case 'repaid': return 'Remboursés';
      case 'rejected': return 'Rejetés';
      case 'overdue': return 'En retard';
      default: return 'Tous les prêts';
    }
  };

  // Filtrage des prêts
  const filteredLoans = loans.filter(loan => {
    const matchesFilter = 
      filter === 'all' || 
      (filter === 'pending' && loan.isPending) ||
      (filter === 'approved' && loan.isApproved && !loan.isRepaid) ||
      (filter === 'repaid' && loan.isRepaid) ||
      (filter === 'rejected' && loan.isRejected) ||
      (filter === 'overdue' && !loan.isRepaid && calculateRemainingDays(loan.endDate, loan.isRepaid) < 0);
    
    if (!matchesFilter) return false;
    
    if (!searchTerm.trim()) return true;
    
    const searchLower = searchTerm.toLowerCase().trim();
    const memberName = `${loan.member?.firstName || ''} ${loan.member?.name || ''}`.toLowerCase();
    const memberNPI = (loan.member?.npi || '').toString().toLowerCase();
    
    return memberName.includes(searchLower) || memberNPI.includes(searchLower);
  });

  const resetFilters = () => {
    setFilter('all');
    setSearchTerm('');
  };

  const stats = calculateStatistics();

  // Fonction pour générer des diagrammes simples en CSS
  const renderStatusChart = () => {
    const total = loans.length || 1;
    const pendingPercent = (stats.byStatus.pending.length / total) * 100;
    const approvedPercent = (stats.byStatus.approved.length / total) * 100;
    const rejectedPercent = (stats.byStatus.rejected.length / total) * 100;
    const repaidPercent = (stats.byStatus.repaid.length / total) * 100;

    return (
      <div className="card mt-4">
        <div className="card-header bg-info text-white">
          <h6 className="mb-0">
            <i className="fas fa-chart-pie me-2"></i>
            Répartition des Prêts par Statut
          </h6>
        </div>
        <div className="card-body">
          <div className="row">
            <div className="col-md-8">
              <div className="chart-container" style={{ height: '200px', position: 'relative' }}>
                <div className="d-flex align-items-center justify-content-center h-100">
                  <div className="chart-bars d-flex align-items-end" style={{ height: '150px', gap: '10px' }}>
                    <div className="d-flex flex-column align-items-center">
                      <div 
                        className="bg-warning rounded-top" 
                        style={{ 
                          width: '40px', 
                          height: `${pendingPercent * 1.5}px`,
                          transition: 'height 0.5s ease'
                        }}
                        title={`En attente: ${stats.byStatus.pending.length} prêts`}
                      ></div>
                      <small className="mt-1">En attente</small>
                    </div>
                    <div className="d-flex flex-column align-items-center">
                      <div 
                        className="bg-primary rounded-top" 
                        style={{ 
                          width: '40px', 
                          height: `${approvedPercent * 1.5}px`,
                          transition: 'height 0.5s ease'
                        }}
                        title={`Accordés: ${stats.byStatus.approved.length} prêts`}
                      ></div>
                      <small className="mt-1">Accordés</small>
                    </div>
                    <div className="d-flex flex-column align-items-center">
                      <div 
                        className="bg-danger rounded-top" 
                        style={{ 
                          width: '40px', 
                          height: `${rejectedPercent * 1.5}px`,
                          transition: 'height 0.5s ease'
                        }}
                        title={`Rejetés: ${stats.byStatus.rejected.length} prêts`}
                      ></div>
                      <small className="mt-1">Rejetés</small>
                    </div>
                    <div className="d-flex flex-column align-items-center">
                      <div 
                        className="bg-success rounded-top" 
                        style={{ 
                          width: '40px', 
                          height: `${repaidPercent * 1.5}px`,
                          transition: 'height 0.5s ease'
                        }}
                        title={`Remboursés: ${stats.byStatus.repaid.length} prêts`}
                      ></div>
                      <small className="mt-1">Remboursés</small>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-md-4">
              <div className="legend">
                <div className="d-flex align-items-center mb-2">
                  <div className="bg-warning me-2" style={{ width: '15px', height: '15px', borderRadius: '3px' }}></div>
                  <small>En attente: {stats.byStatus.pending.length} ({pendingPercent.toFixed(1)}%)</small>
                </div>
                <div className="d-flex align-items-center mb-2">
                  <div className="bg-primary me-2" style={{ width: '15px', height: '15px', borderRadius: '3px' }}></div>
                  <small>Accordés: {stats.byStatus.approved.length} ({approvedPercent.toFixed(1)}%)</small>
                </div>
                <div className="d-flex align-items-center mb-2">
                  <div className="bg-danger me-2" style={{ width: '15px', height: '15px', borderRadius: '3px' }}></div>
                  <small>Rejetés: {stats.byStatus.rejected.length} ({rejectedPercent.toFixed(1)}%)</small>
                </div>
                <div className="d-flex align-items-center mb-2">
                  <div className="bg-success me-2" style={{ width: '15px', height: '15px', borderRadius: '3px' }}></div>
                  <small>Remboursés: {stats.byStatus.repaid.length} ({repaidPercent.toFixed(1)}%)</small>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="container mt-4 d-flex justify-content-center align-items-center" style={{ minHeight: '60vh' }}>
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Chargement...</span>
          </div>
          <p className="mt-2 text-muted">Chargement des prêts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid py-4">
      <div className="row">
        <div className="col-12">
          <div className="card shadow">
            <div className="card-header bg-success text-white d-flex justify-content-between align-items-center">
              <h4 className="mb-0">
                <i className="fas fa-chart-line me-2"></i>
                Tableau de Bord des Prêts
              </h4>
              <div>
                {/* MENU D'EXPORTATION */}
                <div className="dropdown me-2 d-inline-block">
                  <button 
                    className="btn btn-light btn-sm dropdown-toggle" 
                    type="button" 
                    data-bs-toggle="dropdown"
                    disabled={exportLoading || filteredLoans.length === 0}
                  >
                    <i className="fas fa-download me-1"></i>
                    {exportLoading ? 'Export...' : 'Exporter'}
                  </button>
                  <ul className="dropdown-menu">
                    <li>
                      <button className="dropdown-item" onClick={exportToExcel}>
                        <i className="fas fa-file-excel text-success me-2"></i>
                        Excel (.xlsx)
                      </button>
                    </li>
                    <li>
                      <button className="dropdown-item" onClick={exportToPDF}>
                        <i className="fas fa-file-pdf text-danger me-2"></i>
                        PDF (.pdf)
                      </button>
                    </li>
                    <li>
                      <button className="dropdown-item" onClick={exportToCSV}>
                        <i className="fas fa-file-csv text-info me-2"></i>
                        CSV (.csv)
                      </button>
                    </li>
                    <li>
                      <button className="dropdown-item" onClick={exportToJSON}>
                        <i className="fas fa-file-code text-warning me-2"></i>
                        JSON (.json)
                      </button>
                    </li>
                  </ul>
                </div>

                <button className="btn btn-light btn-sm me-2" onClick={() => navigate('/loans/request')}>
                  <i className="fas fa-plus me-1"></i>Nouveau Prêt
                </button>
                <button className="btn btn-outline-light btn-sm" onClick={fetchLoans}>
                  <i className="fas fa-sync-alt me-1"></i>Actualiser
                </button>
              </div>
            </div>

            {/* STATISTIQUES DÉTAILLÉES */}
            <div className="card-body bg-light">
              <h5 className="mb-4">
                <i className="fas fa-chart-bar me-2 text-primary"></i>
                Aperçu des Statistiques des Prêts
              </h5>
              
              {/* Tableau des statistiques par statut */}
              <div className="row mb-4">
                <div className="col-12">
                  <div className="card">
                    <div className="card-header bg-dark text-white">
                      <h6 className="mb-0">
                        <i className="fas fa-table me-2"></i>
                        Statistiques par Statut
                      </h6>
                    </div>
                    <div className="card-body p-0">
                      <div className="table-responsive">
                        <table className="table table-bordered mb-0">
                          <thead className="table-secondary">
                            <tr>
                              <th className="text-center">Statut</th>
                              <th className="text-center">Nombre de Prêts</th>
                              <th className="text-center">Montant Total</th>
                              <th className="text-center">Pourcentage</th>
                              <th className="text-center">Montant Moyen</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr className={stats.byStatus.pending.length > 0 ? 'table-warning' : ''}>
                              <td className="text-center fw-bold">En Attente</td>
                              <td className="text-center">{stats.byStatus.pending.length}</td>
                              <td className="text-center fw-bold text-warning">{formatCurrency(stats.amounts.pending)}</td>
                              <td className="text-center">{((stats.byStatus.pending.length / loans.length) * 100 || 0).toFixed(1)}%</td>
                              <td className="text-center">{formatCurrency(stats.amounts.pending / (stats.byStatus.pending.length || 1))}</td>
                            </tr>
                            <tr className={stats.byStatus.approved.length > 0 ? 'table-primary' : ''}>
                              <td className="text-center fw-bold">Accordés</td>
                              <td className="text-center">{stats.byStatus.approved.length}</td>
                              <td className="text-center fw-bold text-primary">{formatCurrency(stats.amounts.approved)}</td>
                              <td className="text-center">{((stats.byStatus.approved.length / loans.length) * 100 || 0).toFixed(1)}%</td>
                              <td className="text-center">{formatCurrency(stats.amounts.approved / (stats.byStatus.approved.length || 1))}</td>
                            </tr>
                            <tr className={stats.byStatus.rejected.length > 0 ? 'table-danger' : ''}>
                              <td className="text-center fw-bold">Rejetés</td>
                              <td className="text-center">{stats.byStatus.rejected.length}</td>
                              <td className="text-center fw-bold text-danger">{formatCurrency(stats.amounts.rejected)}</td>
                              <td className="text-center">{((stats.byStatus.rejected.length / loans.length) * 100 || 0).toFixed(1)}%</td>
                              <td className="text-center">{formatCurrency(stats.amounts.rejected / (stats.byStatus.rejected.length || 1))}</td>
                            </tr>
                            <tr className={stats.byStatus.repaid.length > 0 ? 'table-success' : ''}>
                              <td className="text-center fw-bold">Remboursés</td>
                              <td className="text-center">{stats.byStatus.repaid.length}</td>
                              <td className="text-center fw-bold text-success">{formatCurrency(stats.amounts.repaid)}</td>
                              <td className="text-center">{((stats.byStatus.repaid.length / loans.length) * 100 || 0).toFixed(1)}%</td>
                              <td className="text-center">{formatCurrency(stats.amounts.repaid / (stats.byStatus.repaid.length || 1))}</td>
                            </tr>
                            <tr className="table-info">
                              <td className="text-center fw-bold">TOTAL</td>
                              <td className="text-center fw-bold">{loans.length}</td>
                              <td className="text-center fw-bold text-info">{formatCurrency(stats.amounts.total)}</td>
                              <td className="text-center fw-bold">100%</td>
                              <td className="text-center fw-bold">{formatCurrency(stats.financial.averageLoan)}</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Cartes de statistiques principales */}
              <div className="row">
                <div className="col-xl-3 col-md-6 mb-4">
                  <div className="card border-warning h-100">
                    <div className="card-body text-center">
                      <div className="d-flex justify-content-between align-items-center">
                        <div>
                          <h6 className="card-title text-warning">En Attente</h6>
                          <h3 className="mb-1 text-warning">{stats.byStatus.pending.length}</h3>
                          <small className="text-muted">{formatCurrency(stats.amounts.pending)}</small>
                        </div>
                        <div className="align-self-center">
                          <i className="fas fa-clock fa-2x text-warning"></i>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="col-xl-3 col-md-6 mb-4">
                  <div className="card border-primary h-100">
                    <div className="card-body text-center">
                      <div className="d-flex justify-content-between align-items-center">
                        <div>
                          <h6 className="card-title text-primary">Accordés</h6>
                          <h3 className="mb-1 text-primary">{stats.byStatus.approved.length}</h3>
                          <small className="text-muted">{formatCurrency(stats.amounts.approved)}</small>
                        </div>
                        <div className="align-self-center">
                          <i className="fas fa-check-circle fa-2x text-primary"></i>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="col-xl-3 col-md-6 mb-4">
                  <div className="card border-danger h-100">
                    <div className="card-body text-center">
                      <div className="d-flex justify-content-between align-items-center">
                        <div>
                          <h6 className="card-title text-danger">Rejetés</h6>
                          <h3 className="mb-1 text-danger">{stats.byStatus.rejected.length}</h3>
                          <small className="text-muted">{formatCurrency(stats.amounts.rejected)}</small>
                        </div>
                        <div className="align-self-center">
                          <i className="fas fa-times-circle fa-2x text-danger"></i>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="col-xl-3 col-md-6 mb-4">
                  <div className="card border-success h-100">
                    <div className="card-body text-center">
                      <div className="d-flex justify-content-between align-items-center">
                        <div>
                          <h6 className="card-title text-success">Remboursés</h6>
                          <h3 className="mb-1 text-success">{stats.byStatus.repaid.length}</h3>
                          <small className="text-muted">{formatCurrency(stats.amounts.repaid)}</small>
                        </div>
                        <div className="align-self-center">
                          <i className="fas fa-hand-holding-usd fa-2x text-success"></i>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Diagramme de répartition */}
              {renderStatusChart()}

              {/* Statistiques financières */}
              <div className="row mt-4">
                <div className="col-md-4">
                  <div className="card bg-white border">
                    <div className="card-body text-center">
                      <i className="fas fa-money-bill-wave text-primary fa-2x mb-2"></i>
                      <h5 className="text-primary">{formatCurrency(stats.financial.totalRepaid)}</h5>
                      <small className="text-muted">Total Remboursé</small>
                    </div>
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="card bg-white border">
                    <div className="card-body text-center">
                      <i className="fas fa-balance-scale text-warning fa-2x mb-2"></i>
                      <h5 className="text-warning">{formatCurrency(stats.financial.totalRemaining)}</h5>
                      <small className="text-muted">Reste à Payer</small>
                    </div>
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="card bg-white border">
                    <div className="card-body text-center">
                      <i className="fas fa-percentage text-info fa-2x mb-2"></i>
                      <h5 className="text-info">{formatCurrency(stats.financial.interestEarned)}</h5>
                      <small className="text-muted">Intérêts Perçus</small>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* FILTRES ET TABLEAU */}
            <div className="card-body">
              <div className="row mb-4">
                <div className="col-md-6">
                  <div className="input-group">
                    <span className="input-group-text bg-light">
                      <i className="fas fa-search"></i>
                    </span>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Rechercher par nom ou NPI..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>
                <div className="col-md-4">
                  <select className="form-select" value={filter} onChange={(e) => setFilter(e.target.value)}>
                    <option value="all">Tous les prêts ({loans.length})</option>
                    <option value="pending">En attente ({stats.byStatus.pending.length})</option>
                    <option value="approved">Accordés ({stats.byStatus.approved.length})</option>
                    <option value="rejected">Rejetés ({stats.byStatus.rejected.length})</option>
                    <option value="repaid">Remboursés ({stats.byStatus.repaid.length})</option>
                    <option value="overdue">En retard ({stats.byStatus.overdue.length})</option>
                  </select>
                </div>
                <div className="col-md-2">
                  <button className="btn btn-outline-secondary w-100" onClick={resetFilters}>
                    Réinitialiser
                  </button>
                </div>
              </div>

              {error && (
                <div className="alert alert-danger d-flex align-items-center">
                  <i className="fas fa-exclamation-triangle me-2"></i>
                  <div>{error}</div>
                </div>
              )}

              {/* Tableau des prêts */}
              <div className="table-responsive">
                <table className="table table-striped table-hover">
                  <thead className="table-dark">
                    <tr>
                      <th>Membre</th>
                      <th>Montant</th>
                      <th>Date début</th>
                      <th>Date fin</th>
                      <th>Statut</th>
                      <th>Progression</th>
                      <th>Jours restants</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLoans.length === 0 ? (
                      <tr>
                        <td colSpan="8" className="text-center py-4">
                          <i className="fas fa-search fa-2x text-muted mb-2"></i>
                          <p className="text-muted">Aucun prêt trouvé avec les critères actuels</p>
                        </td>
                      </tr>
                    ) : (
                      filteredLoans.map(loan => (
                        <tr key={loan.id}>
                          <td>
                            <div>
                              <strong>{loan.member?.firstName} {loan.member?.name}</strong>
                            </div>
                            <small className="text-muted">{loan.member?.npi}</small>
                          </td>
                          <td>
                            <strong>{formatCurrency(loan.amount)}</strong>
                            <br />
                            <small className="text-muted">
                              Reste: {formatCurrency(calculateRemainingAmount(loan))}
                            </small>
                          </td>
                          <td>{formatDate(loan.beginDate)}</td>
                          <td>{formatDate(loan.endDate)}</td>
                          <td>{getStatusBadge(loan)}</td>
                          <td>
                            <div className="d-flex align-items-center">
                              <div className="progress flex-grow-1 me-2" style={{ height: '8px' }}>
                                <div 
                                  className={`progress-bar ${calculateProgress(loan) === 100 ? 'bg-success' : 'bg-info'}`}
                                  style={{ width: `${calculateProgress(loan)}%` }}
                                ></div>
                              </div>
                              <small>{calculateProgress(loan).toFixed(1)}%</small>
                            </div>
                          </td>
                          <td>
                            {loan.isRepaid ? (
                              <span className="badge bg-secondary">Terminé</span>
                            ) : loan.isPending ? (
                              <span className="badge bg-secondary">En attente</span>
                            ) : loan.isRejected ? (
                              <span className="badge bg-danger">Rejeté</span>
                            ) : (
                              <span className={`badge ${
                                calculateRemainingDays(loan.endDate, loan.isRepaid) < 0 ? 'bg-danger' :
                                calculateRemainingDays(loan.endDate, loan.isRepaid) <= 7 ? 'bg-warning text-dark' : 'bg-success'
                              }`}>
                                {calculateRemainingDays(loan.endDate, loan.isRepaid)}j
                              </span>
                            )}
                          </td>
                          <td>
                            <div className="btn-group btn-group-sm">
                              <button
                                className="btn btn-outline-primary"
                                onClick={() => navigate(`/loans/view/${loan.id}`)}
                              >
                                <i className="fas fa-eye"></i>
                              </button>
                              {!loan.isRepaid && loan.isApproved && (
                                <button
                                  className="btn btn-outline-success"
                                  onClick={() => navigate(`/loans/repayment/${loan.id}`)}
                                >
                                  <i className="fas fa-credit-card"></i>
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoanList;