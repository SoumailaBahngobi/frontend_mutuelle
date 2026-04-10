import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useKeycloak } from '../context/KeycloakContext';
import axios from 'axios';
import { toast } from 'react-toastify';
import 'bootstrap/dist/css/bootstrap.min.css';
import {
  LayoutDashboard, Users, HandCoins, CalendarRange,
  BellRing, LogOut, ChevronRight, ChevronLeft,
  FileText, CreditCard, TrendingUp, Wallet, BarChart3,
  Activity, Clock, CheckCircle, XCircle, AlertCircle, UserCheck,
  RefreshCw, PercentCircle, Globe, User
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';

export default function Dashboard() {
  const { authenticated, userProfile, getToken, logout, loading: keycloakLoading } = useKeycloak();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeMenu, setActiveMenu] = useState('dashboard');
  const [allMembers, setAllMembers] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [selectedMemberId, setSelectedMemberId] = useState(null);
  const [selectedMemberName, setSelectedMemberName] = useState('');
  const [showMemberSelector, setShowMemberSelector] = useState(false);
  
  // États pour les données du dashboard
  const [stats, setStats] = useState({
    totalRequests: 0,
    activeLoans: 0,
    pendingApprovals: 0,
    totalContributions: 0,
    totalAmountLoaned: 0,
    totalRepaid: 0,
    membersCount: 0,
    totalInterest: 0,
    repaymentRate: 0,
    balance: 0
  });
  
  const [monthlyData, setMonthlyData] = useState([]);
  const [loanStatusData, setLoanStatusData] = useState([]);
  const [recentActivities, setRecentActivities] = useState([]);
  const [topMembers, setTopMembers] = useState([]);
  const [yearlyData, setYearlyData] = useState([]);
  const [myLoanRequests, setMyLoanRequests] = useState([]);
  const [allLoans, setAllLoans] = useState([]);
  const [contributions, setContributions] = useState([]);

  const navigate = useNavigate();

  // Déterminer si l'utilisateur a un rôle admin ou manager
  const adminRoles = ['ADMIN', 'PRESIDENT', 'SECRETARY', 'TREASURER'];
  const isAdminRole = user && adminRoles.includes(user?.role);
  const unreadCount = notifications.filter(notif => !notif.read).length;

  useEffect(() => {
    if (!authenticated && !keycloakLoading) {
      navigate('/login');
    }
  }, [authenticated, keycloakLoading, navigate]);

  useEffect(() => {
    const fetchUserAndData = async () => {
      if (authenticated && getToken()) {
        try {
          const token = getToken();
          if (!token) {
            console.error('Token non disponible');
            setLoading(false);
            return;
          }

          // 1. Récupérer les informations utilisateur
          const userInfoResponse = await axios.get('http://localhost:8081/mutuelle/auth/user-info', {
            headers: { Authorization: `Bearer ${token}` }
          });

          let userData = {
            id: userInfoResponse.data?.id,
            firstName: userInfoResponse.data?.firstName || userProfile?.firstName || '',
            name: userInfoResponse.data?.name || userProfile?.lastName || '',
            email: userInfoResponse.data?.email || userProfile?.email || '',
            role: userInfoResponse.data?.role || 'MEMBER'
          };

          // Si pas d'ID, essayer de récupérer via auto-link
          if (!userData.id) {
            try {
              const autoLinkResponse = await axios.post(
                'http://localhost:8081/mutuelle/member/auto-link',
                {},
                { headers: { Authorization: `Bearer ${token}` } }
              );
              if (autoLinkResponse.data?.member?.id) {
                userData.id = autoLinkResponse.data.member.id;
                userData.firstName = autoLinkResponse.data.member.firstName || userData.firstName;
                userData.name = autoLinkResponse.data.member.name || userData.name;
                userData.role = autoLinkResponse.data.member.role || 'MEMBER';
              }
            } catch (error) {
              console.log('Auto-link non disponible');
            }
          }

          setUser(userData);

          // 2. Charger les données du dashboard
          if (userData.id) {
            await loadDashboardData(token, userData.id);
          } else {
            console.error('ID utilisateur non trouvé');
            setLoading(false);
          }

        } catch (error) {
          console.error('Erreur chargement profil:', error);
          toast.error('Erreur lors du chargement du profil');
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    };

    fetchUserAndData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authenticated, getToken]);

  const loadDashboardData = async (token, userId) => {
    try {
      setLoading(true);
      
      // Récupérer toutes les données en parallèle
      const [
        loanRequestsRes,
        loansRes,
        contributionsRes,
        notificationsRes,
        membersRes
      ] = await Promise.allSettled([
        axios.get('http://localhost:8081/mutuelle/loan_request/my-requests', {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get('http://localhost:8081/mutuelle/loans', {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get('http://localhost:8081/mutuelle/contribution/my-contributions', {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get('http://localhost:8081/mutuelle/notification', {
          headers: { Authorization: `Bearer ${token}` }
        }),
        isAdminRole ? axios.get('http://localhost:8081/mutuelle/member', {
          headers: { Authorization: `Bearer ${token}` }
        }) : Promise.resolve({ data: [] })
      ]);

      // Traitement des données
      const loanRequests = loanRequestsRes.status === 'fulfilled' && Array.isArray(loanRequestsRes.value.data) 
        ? loanRequestsRes.value.data : [];
      
      let loansData = [];
      if (loansRes.status === 'fulfilled') {
        loansData = Array.isArray(loansRes.value.data) ? loansRes.value.data :
          (loansRes.value.data?.content || loansRes.value.data?.loans || []);
      }
      
      let contributionsData = [];
      if (contributionsRes.status === 'fulfilled') {
        contributionsData = Array.isArray(contributionsRes.value.data) ? contributionsRes.value.data : [];
      }
      
      const notificationsData = notificationsRes.status === 'fulfilled' && Array.isArray(notificationsRes.value.data)
        ? notificationsRes.value.data : [];
      
      const membersData = membersRes.status === 'fulfilled' && Array.isArray(membersRes.value.data)
        ? membersRes.value.data : [];

      // Mise à jour des states
      setMyLoanRequests(loanRequests);
      setAllLoans(loansData);
      setContributions(contributionsData);
      setNotifications(notificationsData);
      setAllMembers(membersData);

      // Calculer les statistiques
      calculateStatsFromData(loanRequests, loansData, contributionsData, membersData);
      
      // Générer les données des graphiques
      generateChartData(loansData, loanRequests, contributionsData, membersData);
      
      // Générer les activités récentes
      generateRecentActivities(loanRequests, loansData, contributionsData, user);

    } catch (error) {
      console.error('Erreur chargement données dashboard:', error);
      toast.error('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const calculateStatsFromData = (loanRequests, allLoans, contributionsData, membersData) => {
    const pendingRequests = loanRequests.filter(req => req.status === 'PENDING');
    const activeLoans = allLoans.filter(loan => !loan.isRepaid && loan.status !== 'REJECTED');

    const totalAmountLoaned = allLoans.reduce((sum, loan) => sum + (parseFloat(loan.amount) || 0), 0);
    const totalRepaid = allLoans
      .filter(loan => loan.isRepaid)
      .reduce((sum, loan) => sum + (parseFloat(loan.repaidAmount) || parseFloat(loan.amount) || 0), 0);

    const totalContributions = contributionsData.reduce((sum, c) => sum + (parseFloat(c.amount) || 0), 0);
    const repaymentRate = totalAmountLoaned > 0 ? (totalRepaid / totalAmountLoaned) * 100 : 0;
    const balance = totalContributions - totalAmountLoaned + totalRepaid;

    setStats({
      totalRequests: loanRequests.length,
      activeLoans: activeLoans.length,
      pendingApprovals: pendingRequests.length,
      totalContributions: totalContributions,
      totalAmountLoaned: totalAmountLoaned,
      totalRepaid: totalRepaid,
      membersCount: membersData.length,
      totalInterest: 0,
      repaymentRate: Math.round(repaymentRate),
      balance: balance
    });
  };

  const generateChartData = (loansData, requestsData, contributionsData, membersData) => {
    // Créer les 12 derniers mois
    const monthlyMap = new Map();
    const now = new Date();

    for (let i = 11; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = `${date.getFullYear()}-${date.getMonth() + 1}`;
      const monthName = date.toLocaleString('fr-FR', { month: 'short' });
      monthlyMap.set(monthKey, {
        month: monthName,
        year: date.getFullYear(),
        monthNum: date.getMonth() + 1,
        contributions: 0,
        loans: 0,
        reimbursements: 0,
        balance: 0
      });
    }

    // Ajouter les cotisations
    contributionsData.forEach(contribution => {
      if (contribution.paymentDate) {
        const date = new Date(contribution.paymentDate);
        if (!isNaN(date.getTime())) {
          const monthKey = `${date.getFullYear()}-${date.getMonth() + 1}`;
          if (monthlyMap.has(monthKey)) {
            const data = monthlyMap.get(monthKey);
            data.contributions += parseFloat(contribution.amount) || 0;
            monthlyMap.set(monthKey, data);
          }
        }
      }
    });

    // Ajouter les prêts
    loansData.forEach(loan => {
      if (loan.beginDate) {
        const date = new Date(loan.beginDate);
        if (!isNaN(date.getTime())) {
          const monthKey = `${date.getFullYear()}-${date.getMonth() + 1}`;
          if (monthlyMap.has(monthKey)) {
            const data = monthlyMap.get(monthKey);
            data.loans += parseFloat(loan.amount) || 0;
            monthlyMap.set(monthKey, data);
          }
        }
      }
    });

    // Ajouter les remboursements
    loansData.forEach(loan => {
      if (loan.lastRepaymentDate && loan.isRepaid) {
        const date = new Date(loan.lastRepaymentDate);
        if (!isNaN(date.getTime())) {
          const monthKey = `${date.getFullYear()}-${date.getMonth() + 1}`;
          if (monthlyMap.has(monthKey)) {
            const data = monthlyMap.get(monthKey);
            data.reimbursements += parseFloat(loan.repaidAmount) || parseFloat(loan.amount) || 0;
            monthlyMap.set(monthKey, data);
          }
        }
      }
    });

    // Calculer le solde cumulé
    let runningBalance = 0;
    const monthlyArray = Array.from(monthlyMap.values()).sort((a, b) => {
      if (a.year !== b.year) return a.year - b.year;
      return a.monthNum - b.monthNum;
    });

    monthlyArray.forEach(data => {
      runningBalance += data.contributions - data.loans + data.reimbursements;
      data.balance = runningBalance;
    });

    setMonthlyData(monthlyArray.length ? monthlyArray : getDefaultMonthlyData());

    // Données annuelles
    const yearlyMap = new Map();
    monthlyArray.forEach(data => {
      if (!yearlyMap.has(data.year)) {
        yearlyMap.set(data.year, {
          year: data.year,
          contributions: 0,
          loans: 0,
          reimbursements: 0
        });
      }
      const yearly = yearlyMap.get(data.year);
      yearly.contributions += data.contributions;
      yearly.loans += data.loans;
      yearly.reimbursements += data.reimbursements;
    });

    setYearlyData(Array.from(yearlyMap.values()).sort((a, b) => a.year - b.year));

    // Statistiques des statuts de prêts
    const statusMap = new Map();
    
    // Ajouter les demandes de prêt
    requestsData.forEach(req => {
      const statusKey = req.status;
      let label = '';
      let color = '';
      
      switch(statusKey) {
        case 'PENDING':
          label = 'En attente';
          color = '#f59e0b';
          break;
        case 'APPROVED':
          label = 'Approuvés';
          color = '#10b981';
          break;
        case 'REJECTED':
          label = 'Rejetés';
          color = '#ef4444';
          break;
        default:
          return;
      }
      
      if (statusMap.has(statusKey)) {
        statusMap.get(statusKey).count++;
      } else {
        statusMap.set(statusKey, { name: label, value: 1, color: color, status: statusKey });
      }
    });
    
    // Ajouter les prêts actifs et remboursés
    loansData.forEach(loan => {
      if (!loan.isRepaid && loan.status !== 'REJECTED') {
        if (statusMap.has('ACTIVE')) {
          statusMap.get('ACTIVE').count++;
        } else {
          statusMap.set('ACTIVE', { name: 'En cours', value: 1, color: '#3b82f6', status: 'ACTIVE' });
        }
      }
      if (loan.isRepaid) {
        if (statusMap.has('REPAID')) {
          statusMap.get('REPAID').count++;
        } else {
          statusMap.set('REPAID', { name: 'Remboursés', value: 1, color: '#8b5cf6', status: 'REPAID' });
        }
      }
    });
    
    const statusData = Array.from(statusMap.values())
      .map(item => ({ ...item, value: item.count || item.value }))
      .filter(item => item.value > 0);
    
    setLoanStatusData(statusData.length ? statusData : getDefaultStatusData());

    // Top membres par emprunt
    if (isAdminRole && membersData.length > 0) {
      const memberLoanMap = new Map();
      loansData.forEach(loan => {
        if (loan.memberId) {
          const member = membersData.find(m => m.id === loan.memberId);
          const memberName = member ? `${member.firstName || ''} ${member.name || ''}`.trim() : `Membre ${loan.memberId}`;
          const current = memberLoanMap.get(loan.memberId) || { name: memberName, amount: 0, count: 0 };
          current.amount += parseFloat(loan.amount) || 0;
          current.count++;
          memberLoanMap.set(loan.memberId, current);
        }
      });

      const topMembersList = Array.from(memberLoanMap.values())
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 5);
      setTopMembers(topMembersList);
    }
  };

  const generateRecentActivities = (requests, loansData, contributionsData, user) => {
    const activities = [];

    // Ajouter les demandes de prêt
    requests.slice(0, 3).forEach(req => {
      activities.push({
        id: `req-${req.id}`,
        action: 'Demande de prêt',
        user: `${user?.firstName || ''} ${user?.name || ''}`.trim() || 'Utilisateur',
        amount: parseFloat(req.requestAmount) || 0,
        status: req.status === 'PENDING' ? 'pending' : req.status === 'APPROVED' ? 'approved' : 'rejected',
        date: req.requestDate,
        icon: 'FileText'
      });
    });

    // Ajouter les remboursements
    const completedRepayments = loansData.filter(loan => loan.lastRepaymentDate && loan.isRepaid).slice(0, 2);
    completedRepayments.forEach(loan => {
      activities.push({
        id: `repay-${loan.id}`,
        action: 'Remboursement',
        user: `${user?.firstName || ''} ${user?.name || ''}`.trim() || 'Utilisateur',
        amount: parseFloat(loan.repaidAmount) || parseFloat(loan.amount) * 0.1 || 0,
        status: 'completed',
        date: loan.lastRepaymentDate,
        icon: 'CreditCard'
      });
    });

    // Ajouter les cotisations
    contributionsData.slice(0, 3).forEach(contribution => {
      activities.push({
        id: `contrib-${contribution.id}`,
        action: 'Cotisation',
        user: `${user?.firstName || ''} ${user?.name || ''}`.trim() || 'Utilisateur',
        amount: parseFloat(contribution.amount) || 0,
        status: 'completed',
        date: contribution.paymentDate,
        icon: 'Wallet'
      });
    });

    const sortedActivities = activities
      .filter(a => a.date)
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 5);

    setRecentActivities(sortedActivities);
  };

  const getDefaultMonthlyData = () => {
    const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
    return months.slice(-6).map(month => ({
      month: month,
      contributions: 0,
      loans: 0,
      reimbursements: 0,
      balance: 0
    }));
  };

  const getDefaultStatusData = () => {
    return [
      { name: 'En attente', value: 0, color: '#f59e0b' },
      { name: 'Approuvés', value: 0, color: '#10b981' },
      { name: 'En cours', value: 0, color: '#3b82f6' },
      { name: 'Remboursés', value: 0, color: '#8b5cf6' },
    ];
  };

  const refreshData = async () => {
    setRefreshing(true);
    const token = getToken();
    if (token && user?.id) {
      await loadDashboardData(token, user.id);
      toast.success('Données actualisées');
    }
    setRefreshing(false);
  };

  const handleMemberSelect = (memberId, memberName) => {
    setSelectedMemberId(memberId);
    setSelectedMemberName(memberName);
    setShowMemberSelector(false);
    toast.info(`Affichage des données pour ${memberName}`);
    // Ici vous pouvez charger les données spécifiques du membre
  };

  const handleShowMyData = () => {
    setSelectedMemberId(null);
    setSelectedMemberName('');
    const token = getToken();
    if (token && user?.id) {
      loadDashboardData(token, user.id);
      toast.info('Affichage de vos données personnelles');
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  const getStatusBadge = (status) => {
    const config = {
      PENDING: { class: 'bg-warning bg-opacity-10 text-warning', label: 'En attente', icon: Clock },
      pending: { class: 'bg-warning bg-opacity-10 text-warning', label: 'En attente', icon: Clock },
      completed: { class: 'bg-success bg-opacity-10 text-success', label: 'Complété', icon: CheckCircle },
      approved: { class: 'bg-success bg-opacity-10 text-success', label: 'Approuvé', icon: CheckCircle },
      rejected: { class: 'bg-danger bg-opacity-10 text-danger', label: 'Rejeté', icon: XCircle },
      ACTIVE: { class: 'bg-info bg-opacity-10 text-info', label: 'Actif', icon: Activity },
      REPAID: { class: 'bg-purple bg-opacity-10 text-purple', label: 'Remboursé', icon: CheckCircle }
    };
    const c = config[status] || config.PENDING;
    const Icon = c.icon;
    return (
      <span className={`badge ${c.class} px-3 py-1 rounded-pill d-inline-flex align-items-center gap-1`}>
        <Icon size={12} /> {c.label}
      </span>
    );
  };

  const menuItems = [
    { id: 'dashboard', label: 'Tableau de bord', icon: LayoutDashboard, path: '/dashboard' },
    { id: 'loans', label: 'Demandes de prêt', icon: FileText, path: '/loans/request' },
    { id: 'my-loans', label: 'Mes prêts', icon: HandCoins, path: '/loans/requests' },
    { id: 'repayments', label: 'Remboursements', icon: CreditCard, path: '/loans/repayment' },
    { id: 'contributions', label: 'Cotisations', icon: Wallet, path: '/mutuelle/contribution/individual' },
    { id: 'events', label: 'Événements', icon: CalendarRange, path: '/mutuelle/event' },
    { id: 'statistics', label: 'Statistiques', icon: BarChart3, path: '/statistics' }
  ];

  const adminMenuItems = [
    { id: 'approvals', label: 'Etat des approbations', icon: CheckCircle, path: '/loans/approval-dashboard' },
    { id: 'approvals', label: 'Validation des prêts', icon: CheckCircle, path: '/loans/approval' },
    { id: 'members', label: 'Gestion membres', icon: Users, path: '/members/list' },
    { id: 'campaign', label: 'Campagne cotisation', icon: CalendarRange, path: '/mutuelle/contribution_period' },
    { id: 'reports', label: 'Rapports', icon: TrendingUp, path: '/reports' }
  ];

  if (keycloakLoading || loading) {
    return (
      <div className="min-vh-100 d-flex justify-content-center align-items-center bg-light">
        <div className="text-center">
          <div className="spinner-border text-primary mb-3" style={{ width: '3rem', height: '3rem' }} role="status">
            <span className="visually-hidden">Chargement...</span>
          </div>
          <p className="text-muted">Chargement de votre tableau de bord...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-vh-100 d-flex justify-content-center align-items-center bg-light">
        <div className="text-center">
          <AlertCircle size={48} className="text-warning mb-3" />
          <p className="text-muted">Impossible de charger les informations utilisateur</p>
          <button className="btn btn-primary" onClick={() => window.location.reload()}>
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="d-flex bg-light" style={{ minHeight: '100vh' }}>
      {/* Sidebar */}
      <div className={`bg-dark text-white position-relative ${sidebarCollapsed ? 'collapsed' : ''}`}
        style={{ width: sidebarCollapsed ? '80px' : '280px', transition: 'all 0.3s', minHeight: '100vh' }}>
        <div className="p-3 border-bottom border-secondary">
          <div className="d-flex align-items-center justify-content-between">
            {!sidebarCollapsed && (
              <div>
                <h5 className="mb-0 fw-bold">Mutuelle</h5>
                <small className="text-secondary">Gestion de crédit</small>
              </div>
            )}
            <button className="btn btn-link text-white p-0" onClick={() => setSidebarCollapsed(!sidebarCollapsed)}>
              {sidebarCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
            </button>
          </div>
        </div>

        <div className="p-3">
          {!sidebarCollapsed && (
            <div className="mb-4 p-3 bg-primary bg-opacity-10 rounded-3">
              <div className="d-flex align-items-center gap-2 mb-2">
                <UserCheck size={24} className="text-primary" />
                <div>
                  <p className="mb-0 fw-semibold">{user.firstName} {user.name}</p>
                  <small className="text-secondary">{user.email}</small>
                </div>
              </div>
              <div className="mt-2">
                <span className="badge bg-primary px-3 py-1 rounded-pill">{user.role}</span>
              </div>
            </div>
          )}

          <nav>
            <p className={`text-secondary small mb-2 ${sidebarCollapsed ? 'text-center' : ''}`}>
              {!sidebarCollapsed && 'Menu principal'}
            </p>
            {menuItems.map(item => (
              <button
                key={item.id}
                className={`btn w-100 text-start mb-1 ${activeMenu === item.id ? 'bg-primary text-white' : 'text-white hover-bg-secondary'}`}
                style={{ borderRadius: '12px', padding: '10px 12px' }}
                onClick={() => {
                  setActiveMenu(item.id);
                  navigate(item.path);
                }}
              >
                <div className="d-flex align-items-center gap-3">
                  <item.icon size={20} />
                  {!sidebarCollapsed && <span>{item.label}</span>}
                </div>
              </button>
            ))}

            {isAdminRole && (
              <>
                <p className={`text-secondary small mt-3 mb-2 ${sidebarCollapsed ? 'text-center' : ''}`}>
                  {!sidebarCollapsed && 'Manager'}
                </p>
                {adminMenuItems.map(item => (
                  <button
                    key={item.id}
                    className={`btn w-100 text-start mb-1 ${activeMenu === item.id ? 'bg-primary text-white' : 'text-white hover-bg-secondary'}`}
                    style={{ borderRadius: '12px', padding: '10px 12px' }}
                    onClick={() => {
                      setActiveMenu(item.id);
                      navigate(item.path);
                    }}
                  >
                    <div className="d-flex align-items-center gap-3">
                      <item.icon size={20} />
                      {!sidebarCollapsed && <span>{item.label}</span>}
                    </div>
                  </button>
                ))}
              </>
            )}

            <hr className="border-secondary my-3" />
            <button
              className={`btn w-100 text-start text-danger ${sidebarCollapsed ? 'text-center' : ''}`}
              style={{ borderRadius: '12px', padding: '10px 12px' }}
              onClick={() => logout()}
            >
              <div className="d-flex align-items-center gap-3">
                <LogOut size={20} />
                {!sidebarCollapsed && <span>Déconnexion</span>}
              </div>
            </button>
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-grow-1" style={{ overflowX: 'auto' }}>
        {/* Header */}
        <div className="bg-white shadow-sm sticky-top px-4 py-3 d-flex justify-content-between align-items-center">
          <div className="d-flex align-items-center gap-3">
            <h4 className="mb-0 fw-semibold">
              Tableau de bord
            </h4>
            {isAdminRole && (
              <div className="dropdown">
                <button
                  className="btn btn-outline-primary btn-sm dropdown-toggle d-flex align-items-center gap-2"
                  onClick={() => setShowMemberSelector(!showMemberSelector)}
                >
                  {selectedMemberName ? (
                    <>
                      <User size={16} />
                      {selectedMemberName}
                    </>
                  ) : (
                    <>
                      <Globe size={16} />
                      Tous les membres
                    </>
                  )}
                </button>
                {showMemberSelector && (
                  <div className="dropdown-menu show p-2"
                   style={
                    { 
                    position: 'absolute', top: '40px', left: '0', minWidth: '250px', maxHeight: '400px', overflowY: 'auto' 
                    }
                    }>
                    <div className="dropdown-item" onClick={handleShowMyData} style={{ cursor: 'pointer' }}>
                      <strong>👤 Mes données personnelles</strong>
                    </div>
                    <div className="dropdown-divider"></div>
                    <div className="dropdown-header">Autres membres</div>
                    {allMembers.filter(m => m.id !== user?.id).slice(0, 10).map(member => (
                      <div
                        key={member.id}
                        className="dropdown-item d-flex justify-content-between align-items-center"
                        onClick={() => handleMemberSelect(member.id, `${member.firstName} ${member.name}`)}
                        style={{ cursor: 'pointer' }}
                      >
                        <span>{member.firstName} {member.name}</span>
                        <small className="text-muted">{member.role}</small>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
          <div className="d-flex align-items-center gap-3">
            <button className="btn btn-light btn-sm rounded-circle p-2" onClick={refreshData} disabled={refreshing}>
              <RefreshCw size={18} className={refreshing ? 'spin' : ''} />
            </button>
            <div className="position-relative">
              <button className="btn btn-light rounded-circle p-2 position-relative" onClick={() => setShowNotifications(!showNotifications)}>
                <BellRing size={20} />
                {unreadCount > 0 && (
                  <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger border border-2 border-white">
                    {unreadCount}
                  </span>
                )}
              </button>
              {showNotifications && (
                <div className="position-absolute end-0 mt-2 bg-white rounded-3 shadow-lg" style={{ width: '320px', zIndex: 1000 }}>
                  <div className="p-3 border-bottom">
                    <h6 className="mb-0 fw-semibold">Notifications</h6>
                  </div>
                  <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                    {notifications.length === 0 ? (
                      <p className="text-muted text-center py-4 mb-0">Aucune notification</p>
                    ) : (
                      notifications.slice(0, 5).map(notif => (
                        <div key={notif.id} className={`p-3 border-bottom ${!notif.read ? 'bg-light' : ''}`}>
                          <p className="mb-1 fw-semibold">{notif.title}</p>
                          <small className="text-muted">{notif.message}</small>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
            <div className="d-flex align-items-center gap-2">
              <div className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center"
                style={{ width: '40px', height: '40px' }}>
                {user.firstName?.charAt(0)}{user.name?.charAt(0)}
              </div>
            </div>
          </div>
        </div>

        {/* Dashboard Content */}
        <div className="p-4">
          {/* Indicateur de vue pour admin */}
          {isAdminRole && selectedMemberName && (
            <div className="alert alert-info mb-4 d-flex align-items-center justify-content-between">
              <div>
                <i className="bi bi-eye me-2"></i>
                <strong>Vue personnalisée:</strong> Données de <strong>{selectedMemberName}</strong>
              </div>
              <button className="btn btn-sm btn-outline-primary" onClick={handleShowMyData}>
                Voir mes données
              </button>
            </div>
          )}

          {/* KPI Cards */}
          <div className="row g-3 mb-4">
            <div className="col-md-6 col-lg-3">
              <div className="bg-white rounded-4 p-3 shadow-sm">
                <div className="d-flex align-items-center justify-content-between mb-2">
                  <div className="bg-primary bg-opacity-10 p-2 rounded-3">
                    <Wallet size={24} className="text-primary" />
                  </div>
                  <span className="text-muted small">Cotisations</span>
                </div>
                <h3 className="mb-0 fw-bold text-success">{formatCurrency(stats.totalContributions)}</h3>
                <small className="text-muted">Total des cotisations</small>
              </div>
            </div>
            <div className="col-md-6 col-lg-3">
              <div className="bg-white rounded-4 p-3 shadow-sm">
                <div className="d-flex align-items-center justify-content-between mb-2">
                  <div className="bg-danger bg-opacity-10 p-2 rounded-3">
                    <HandCoins size={24} className="text-danger" />
                  </div>
                  <span className="text-muted small">Prêts</span>
                </div>
                <h3 className="mb-0 fw-bold text-danger">{formatCurrency(stats.totalAmountLoaned)}</h3>
                <small className="text-muted">Montant total prêté</small>
              </div>
            </div>
            <div className="col-md-6 col-lg-3">
              <div className="bg-white rounded-4 p-3 shadow-sm">
                <div className="d-flex align-items-center justify-content-between mb-2">
                  <div className="bg-info bg-opacity-10 p-2 rounded-3">
                    <CreditCard size={24} className="text-info" />
                  </div>
                  <span className="text-muted small">Remboursements</span>
                </div>
                <h3 className="mb-0 fw-bold text-info">{formatCurrency(stats.totalRepaid)}</h3>
                <small className="text-muted">Montant remboursé</small>
              </div>
            </div>
            <div className="col-md-6 col-lg-3">
              <div className="bg-white rounded-4 p-3 shadow-sm">
                <div className="d-flex align-items-center justify-content-between mb-2">
                  <div className="bg-success bg-opacity-10 p-2 rounded-3">
                    <PercentCircle size={24} className="text-success" />
                  </div>
                  <span className="text-muted small">Solde</span>
                </div>
                <h3 className={`mb-0 fw-bold ${stats.balance >= 0 ? 'text-success' : 'text-danger'}`}>
                  {formatCurrency(stats.balance)}
                </h3>
                <small className="text-muted">Cotisations - Prêts + Remboursements</small>
              </div>
            </div>
          </div>

          {/* Statistiques supplémentaires */}
          <div className="row g-3 mb-4">
            <div className="col-md-4">
              <div className="bg-white rounded-4 p-3 shadow-sm">
                <div className="d-flex align-items-center gap-3">
                  <div className="bg-warning bg-opacity-10 p-3 rounded-3">
                    <FileText size={24} className="text-warning" />
                  </div>
                  <div>
                    <small className="text-muted">Demandes totales</small>
                    <h4 className="mb-0 fw-bold">{stats.totalRequests}</h4>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-md-4">
              <div className="bg-white rounded-4 p-3 shadow-sm">
                <div className="d-flex align-items-center gap-3">
                  <div className="bg-info bg-opacity-10 p-3 rounded-3">
                    <Activity size={24} className="text-info" />
                  </div>
                  <div>
                    <small className="text-muted">Prêts actifs</small>
                    <h4 className="mb-0 fw-bold">{stats.activeLoans}</h4>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-md-4">
              <div className="bg-white rounded-4 p-3 shadow-sm">
                <div className="d-flex align-items-center gap-3">
                  <div className="bg-success bg-opacity-10 p-3 rounded-3">
                    <TrendingUp size={24} className="text-success" />
                  </div>
                  <div>
                    <small className="text-muted">Taux de remboursement</small>
                    <h4 className="mb-0 fw-bold">{stats.repaymentRate}%</h4>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Graphique en barres - Évolution mensuelle */}
          <div className="row g-3 mb-4">
            <div className="col-12">
              <div className="bg-white rounded-4 p-3 shadow-sm">
                <h6 className="fw-semibold mb-3">
                   Évolution mensuelle des cotisations, prêts et remboursements
                  {selectedMemberName && ` - ${selectedMemberName}`}
                </h6>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={monthlyData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`} />
                    <Tooltip formatter={(value) => formatCurrency(value)} />
                    <Legend />
                    <Bar dataKey="contributions" fill="#10b981" name="Cotisations" />
                    <Bar dataKey="loans" fill="#ef4444" name="Prêts" />
                    <Bar dataKey="reimbursements" fill="#3b82f6" name="Remboursements" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Graphique du solde */}
          <div className="row g-3 mb-4">
            <div className="col-12">
              <div className="bg-white rounded-4 p-3 shadow-sm">
                <h6 className="fw-semibold mb-3">💰 Évolution du solde</h6>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`} />
                    <Tooltip formatter={(value) => formatCurrency(value)} />
                    <Legend />
                    <Bar dataKey="balance" fill="#8b5cf6" name="Solde" />
                  </BarChart>
                </ResponsiveContainer>
                <div className="mt-2 text-muted small text-center">
                  Solde = Σ(Cotisations - Prêts + Remboursements)
                </div>
              </div>
            </div>
          </div>

          {/* Répartition des prêts et activités récentes */}
          <div className="row g-3 mb-4">
            <div className="col-lg-4">
              <div className="bg-white rounded-4 p-3 shadow-sm h-100">
                <h6 className="fw-semibold mb-3">🥧 Répartition des prêts</h6>
                {loanStatusData.every(d => d.value === 0) ? (
                  <div className="text-center py-5">
                    <p className="text-muted">Aucune donnée disponible</p>
                  </div>
                ) : (
                  <>
                    <ResponsiveContainer width="100%" height={250}>
                      <PieChart>
                        <Pie
                          data={loanStatusData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        >
                          {loanStatusData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => `${value} prêt(s)`} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="d-flex flex-wrap justify-content-center gap-3 mt-3">
                      {loanStatusData.map((item, idx) => (
                        <div key={idx} className="d-flex align-items-center gap-2">
                          <div style={{ width: '12px', height: '12px', backgroundColor: item.color, borderRadius: '50%' }}></div>
                          <small>{item.name} ({item.value})</small>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
            <div className="col-lg-8">
              <div className="bg-white rounded-4 p-3 shadow-sm h-100">
                <h6 className="fw-semibold mb-3"> Dernières activités</h6>
                {recentActivities.length === 0 ? (
                  <div className="text-center py-5">
                    <p className="text-muted">Aucune activité récente</p>
                  </div>
                ) : (
                  <div className="list-group list-group-flush">
                    {recentActivities.map(activity => {
                      let IconComponent = FileText;
                      if (activity.icon === 'CreditCard') IconComponent = CreditCard;
                      if (activity.icon === 'Wallet') IconComponent = Wallet;
                      return (
                        <div key={activity.id} className="list-group-item d-flex align-items-center gap-3 border-0 py-3">
                          <div className={`bg-${activity.status === 'completed' ? 'success' : activity.status === 'pending' ? 'warning' : 'danger'} bg-opacity-10 p-2 rounded-3`}>
                            <IconComponent size={20} className="text-primary" />
                          </div>
                          <div className="flex-grow-1">
                            <p className="mb-0 fw-semibold">{activity.action}</p>
                            <small className="text-muted">
                              {activity.user} • {activity.date ? new Date(activity.date).toLocaleDateString('fr-FR') : 'Date inconnue'}
                            </small>
                          </div>
                          <div className="text-end">
                            <span className="fw-bold">{formatCurrency(activity.amount)}</span>
                            <br />
                            {getStatusBadge(activity.status)}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Top Members Section pour Admin */}
          {isAdminRole && !selectedMemberId && topMembers.length > 0 && (
            <div className="row g-3 mt-2">
              <div className="col-12">
                <div className="bg-white rounded-4 p-3 shadow-sm">
                  <h6 className="fw-semibold mb-3"> Top emprunteurs</h6>
                  <div className="row g-2">
                    {topMembers.map((member, idx) => (
                      <div key={idx} className="col-md-6 col-lg-4">
                        <div className="d-flex align-items-center justify-content-between p-2 bg-light rounded-3">
                          <div>
                            <p className="mb-0 fw-semibold">{member.name}</p>
                            <small className="text-muted">{member.count} prêt(s)</small>
                          </div>
                          <span className="fw-bold text-primary">{formatCurrency(member.amount)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Recent Loans Section */}
          <div className="row g-3 mt-2">
            <div className="col-12">
              <div className="bg-white rounded-4 p-3 shadow-sm">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h6 className="fw-semibold mb-0">Mes demandes de prêt récentes</h6>
                  <button className="btn btn-link text-primary p-0" onClick={() => navigate('/loans/requests')}>
                    Voir tout <ChevronRight size={16} />
                  </button>
                </div>
                {myLoanRequests.length === 0 ? (
                  <div className="text-center py-4">
                    <FileText size={48} className="text-muted mb-2" />
                    <p className="text-muted mb-0">Aucune demande de prêt</p>
                    <button className="btn btn-primary btn-sm mt-2" onClick={() => navigate('/loans/request')}>
                      Faire une demande
                    </button>
                  </div>
                ) : (
                  <div className="table-responsive">
                    <table className="table table-hover">
                      <thead>
                        <tr>
                          <th>Montant</th>
                          <th>Motif</th>
                          <th>Date</th>
                          <th>Statut</th>
                        </tr>
                      </thead>
                      <tbody>
                        {myLoanRequests.slice(0, 5).map(request => (
                          <tr key={request.id}>
                            <td className="fw-semibold">{formatCurrency(request.requestAmount)}</td>
                            <td>{request.reason?.substring(0, 50)}...</td>
                            <td>{request.requestDate ? new Date(request.requestDate).toLocaleDateString() : '-'}</td>
                            <td>{getStatusBadge(request.status)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx="true">{`
        .hover-bg-secondary:hover {
          background-color: rgba(255, 255, 255, 0.1);
        }
        .collapsed .btn span {
          display: none;
        }
        .collapsed .btn {
          text-align: center;
          justify-content: center;
        }
        .collapsed .btn div {
          justify-content: center;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .spin {
          animation: spin 1s linear infinite;
        }
        .dropdown-menu {
          border-radius: 12px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        }
        .dropdown-item {
          border-radius: 8px;
          transition: all 0.2s;
        }
        .dropdown-item:hover {
          background-color: #f0f0f0;
        }
        .bg-purple {
          background-color: #8b5cf6;
        }
        .text-purple {
          color: #8b5cf6;
        }
      `}</style>
    </div>
  );
}