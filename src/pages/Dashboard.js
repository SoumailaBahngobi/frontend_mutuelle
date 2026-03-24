import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useKeycloak } from '../context/KeycloakContext';
import axios from 'axios';
import { toast } from 'react-toastify';
import 'bootstrap/dist/css/bootstrap.min.css';
import {
  LayoutDashboard, Users, HandCoins, CalendarRange, ChartNoAxesCombined,
  BellRing, LogOut, Menu, X, ChevronRight, ChevronLeft, Home,
  FileText, CreditCard, TrendingUp, Wallet, PiggyBank, BarChart3,
  Activity, Clock, CheckCircle, XCircle, AlertCircle, UserCheck,
  Settings, HelpCircle, FolderKanban, Briefcase, BookOpen, Award,
  Loader, RefreshCw, DollarSign, PercentCircle
} from 'lucide-react';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer, ComposedChart
} from 'recharts';

export default function Dashboard() {
  const { authenticated, userProfile, getToken, logout, loading: keycloakLoading } = useKeycloak();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeMenu, setActiveMenu] = useState('dashboard');
  const [myLoanRequests, setMyLoanRequests] = useState([]);
  const [myLoans, setMyLoans] = useState([]);
  const [allLoans, setAllLoans] = useState([]);
  const [allMembers, setAllMembers] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [stats, setStats] = useState({
    totalRequests: 0,
    activeLoans: 0,
    pendingApprovals: 0,
    totalContributions: 0,
    totalAmountLoaned: 0,
    totalRepaid: 0,
    membersCount: 0,
    totalInterest: 0,
    repaymentRate: 0
  });

  const [monthlyData, setMonthlyData] = useState([]);
  const [loanStatusData, setLoanStatusData] = useState([]);
  const [contributionData, setContributionData] = useState([]);
  const [recentActivities, setRecentActivities] = useState([]);
  const [topMembers, setTopMembers] = useState([]);
  
  const navigate = useNavigate();

  const isAdmin = user && (user.role === 'ADMIN' || user.role === 'PRESIDENT' || 
                          user.role === 'SECRETARY' || user.role === 'TREASURER');
  const unreadCount = notifications.filter(notif => !notif.read).length;

  useEffect(() => {
    if (!authenticated && !keycloakLoading) {
      navigate('/login');
    }
  }, [authenticated, keycloakLoading, navigate]);

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (authenticated && getToken()) {
        try {
          if (userProfile) {
            setUser({
              ...userProfile,
              firstName: userProfile.firstName,
              name: userProfile.lastName,
              email: userProfile.email
            });
          }

          const response = await axios.get('http://localhost:8081/mutuelle/auth/user-info', {
            headers: { Authorization: `Bearer ${getToken()}` }
          });

          if (response.data) {
            setUser(prev => ({ ...prev, ...response.data }));
            if (response.data.id) {
              await loadAllData(getToken(), response.data.id);
            }
          }
        } catch (error) {
          toast.error('Erreur lors du chargement du profil');
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [authenticated, getToken, userProfile]);

  const loadAllData = async (token, userId) => {
    try {
      // Charger les demandes de prêt de l'utilisateur
      const requestsRes = await axios.get('http://localhost:8081/mutuelle/loan_request/my-requests', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const loanRequests = Array.isArray(requestsRes.data) ? requestsRes.data : [];
      setMyLoanRequests(loanRequests);

      // Charger tous les prêts
      const loansRes = await axios.get('http://localhost:8081/mutuelle/loans', {
        headers: { Authorization: `Bearer ${token}` }
      });
      let loansData = [];
      if (Array.isArray(loansRes.data)) {
        loansData = loansRes.data;
      } else if (loansRes.data && typeof loansRes.data === 'object') {
        loansData = loansRes.data.content || loansRes.data.loans || loansRes.data.data || [];
      }
      setAllLoans(loansData);

      // Filtrer les prêts de l'utilisateur
      const userLoans = loansData.filter(loan => loan && loan.member && loan.member.id === userId);
      setMyLoans(userLoans);

      // Si admin, charger les membres
      if (isAdmin) {
        const membersRes = await axios.get('http://localhost:8081/mutuelle/members', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const members = Array.isArray(membersRes.data) ? membersRes.data : 
                       membersRes.data.content || membersRes.data.members || [];
        setAllMembers(members);
      }

      // Charger les notifications
      await fetchNotifications(token);

      // Calculer les statistiques à partir des données réelles
      calculateStatsFromData(loanRequests, userLoans, loansData);
      
      // Générer les données des graphiques à partir des données réelles
      generateChartDataFromLoans(loansData, loanRequests);
      
      // Générer les activités récentes
      generateRecentActivities(loanRequests, userLoans, loansData);

      // Charger les données de cotisation
      await fetchContributionData(token);

    } catch (error) {
      console.error('Erreur chargement données:', error);
      toast.error('Erreur lors du chargement des données');
    }
  };

  const fetchNotifications = async (token) => {
    try {
      const response = await axios.get('http://localhost:8081/mutuelle/notification', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications(response.data);
    } catch (error) {
      // Notifications optionnelles, pas d'erreur critique
      console.log('Notifications non disponibles');
    }
  };

  const fetchContributionData = async (token) => {
    try {
      const response = await axios.get('http://localhost:8081/mutuelle/contributions/summary', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data) {
        setContributionData(response.data);
      }
    } catch (error) {
      // Données de démonstration si API non disponible
      setContributionData([
        { category: 'Mensuelles', amount: 1250000, members: 45 },
        { category: 'Spéciales', amount: 680000, members: 28 },
        { category: 'Événements', amount: 450000, members: 32 },
      ]);
    }
  };

  const calculateStatsFromData = (loanRequests, userLoans, allLoans) => {
    const activeLoans = userLoans.filter(loan => !loan.isRepaid);
    const pendingRequests = loanRequests.filter(req => req.status === 'PENDING');
    
    // Calculer le montant total des prêts
    const totalAmountLoaned = allLoans.reduce((sum, loan) => sum + (loan.amount || 0), 0);
    const totalRepaid = allLoans
      .filter(loan => loan.isRepaid)
      .reduce((sum, loan) => sum + (loan.repaidAmount || loan.amount || 0), 0);
    
    // Taux de remboursement
    const repaymentRate = totalAmountLoaned > 0 ? (totalRepaid / totalAmountLoaned) * 100 : 0;
    
    // Intérêts totaux
    const totalInterest = allLoans.reduce((sum, loan) => sum + (loan.interest || 0), 0);

    setStats({
      totalRequests: loanRequests.length,
      activeLoans: activeLoans.length,
      pendingApprovals: pendingRequests.length,
      totalContributions: 0, // À calculer depuis API contributions
      totalAmountLoaned: totalAmountLoaned,
      totalRepaid: totalRepaid,
      membersCount: allMembers.length,
      totalInterest: totalInterest,
      repaymentRate: Math.round(repaymentRate)
    });
  };

  const generateChartDataFromLoans = (loansData, requestsData) => {
    // Grouper les prêts par mois
    const monthlyMap = new Map();
    
    loansData.forEach(loan => {
      if (loan.createdDate) {
        const date = new Date(loan.createdDate);
        const monthKey = `${date.getFullYear()}-${date.getMonth() + 1}`;
        const monthName = date.toLocaleString('fr-FR', { month: 'short' });
        
        if (!monthlyMap.has(monthKey)) {
          monthlyMap.set(monthKey, { month: monthName, loans: 0, contributions: 0, reimbursements: 0 });
        }
        
        const data = monthlyMap.get(monthKey);
        data.loans += loan.amount || 0;
        if (loan.isRepaid) {
          data.reimbursements += loan.repaidAmount || loan.amount || 0;
        }
      }
    });

    const monthlyArray = Array.from(monthlyMap.values()).slice(-6);
    setMonthlyData(monthlyArray.length ? monthlyArray : getDefaultMonthlyData());

    // Statistiques des statuts de prêts
    const statusCount = {
      PENDING: 0,
      APPROVED: 0,
      REJECTED: 0,
      ACTIVE: 0,
      REPAID: 0
    };

    requestsData.forEach(req => {
      if (req.status === 'PENDING') statusCount.PENDING++;
      if (req.status === 'APPROVED') statusCount.APPROVED++;
      if (req.status === 'REJECTED') statusCount.REJECTED++;
    });

    loansData.forEach(loan => {
      if (!loan.isRepaid && loan.status !== 'REJECTED') {
        statusCount.ACTIVE++;
      }
      if (loan.isRepaid) {
        statusCount.REPAID++;
      }
    });

    const statusColors = {
      PENDING: '#f59e0b',
      APPROVED: '#10b981',
      REJECTED: '#ef4444',
      ACTIVE: '#3b82f6',
      REPAID: '#8b5cf6'
    };

    const statusLabels = {
      PENDING: 'En attente',
      APPROVED: 'Approuvés',
      REJECTED: 'Rejetés',
      ACTIVE: 'En cours',
      REPAID: 'Remboursés'
    };

    const statusData = Object.entries(statusCount)
      .filter(([_, count]) => count > 0)
      .map(([status, count]) => ({
        name: statusLabels[status] || status,
        value: count,
        color: statusColors[status]
      }));

    setLoanStatusData(statusData.length ? statusData : getDefaultStatusData());

    // Top membres par emprunt
    const memberLoanMap = new Map();
    loansData.forEach(loan => {
      if (loan.member && loan.member.name) {
        const current = memberLoanMap.get(loan.member.id) || { name: loan.member.name, amount: 0, count: 0 };
        current.amount += loan.amount || 0;
        current.count++;
        memberLoanMap.set(loan.member.id, current);
      }
    });

    const topMembersList = Array.from(memberLoanMap.values())
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);
    setTopMembers(topMembersList);
  };

  const generateRecentActivities = (requests, loans, allLoans) => {
    const activities = [];

    // Ajouter les demandes récentes
    requests.slice(0, 3).forEach(req => {
      activities.push({
        id: `req-${req.id}`,
        action: 'Demande de prêt',
        user: user?.firstName + ' ' + user?.name,
        amount: req.requestAmount,
        status: req.status === 'PENDING' ? 'pending' : req.status === 'APPROVED' ? 'approved' : 'rejected',
        date: req.createdDate,
        icon: FileText
      });
    });

    // Ajouter les remboursements récents
    loans.filter(loan => loan.lastRepaymentDate).slice(0, 2).forEach(loan => {
      activities.push({
        id: `repay-${loan.id}`,
        action: 'Remboursement',
        user: user?.firstName + ' ' + user?.name,
        amount: loan.lastRepaymentAmount || loan.amount * 0.1,
        status: 'completed',
        date: loan.lastRepaymentDate,
        icon: CreditCard
      });
    });

    // Trier par date et prendre les 5 plus récents
    const sortedActivities = activities
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 5);

    setRecentActivities(sortedActivities);
  };

  const getDefaultMonthlyData = () => {
    return [
      { month: 'Jan', loans: 0, contributions: 0, reimbursements: 0 },
      { month: 'Fév', loans: 0, contributions: 0, reimbursements: 0 },
      { month: 'Mar', loans: 0, contributions: 0, reimbursements: 0 },
      { month: 'Avr', loans: 0, contributions: 0, reimbursements: 0 },
      { month: 'Mai', loans: 0, contributions: 0, reimbursements: 0 },
      { month: 'Juin', loans: 0, contributions: 0, reimbursements: 0 },
    ];
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
      await loadAllData(token, user.id);
      toast.success('Données actualisées');
    }
    setRefreshing(false);
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
      IN_REVIEW: { class: 'bg-info bg-opacity-10 text-info', label: 'En examen', icon: Activity },
      APPROVED: { class: 'bg-success bg-opacity-10 text-success', label: 'Approuvé', icon: CheckCircle },
      REJECTED: { class: 'bg-danger bg-opacity-10 text-danger', label: 'Rejeté', icon: XCircle },
      pending: { class: 'bg-warning bg-opacity-10 text-warning', label: 'En attente', icon: Clock },
      completed: { class: 'bg-success bg-opacity-10 text-success', label: 'Complété', icon: CheckCircle },
      approved: { class: 'bg-success bg-opacity-10 text-success', label: 'Approuvé', icon: CheckCircle },
      info: { class: 'bg-info bg-opacity-10 text-info', label: 'Information', icon: AlertCircle }
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
    { id: 'approvals', label: 'Approbations', icon: CheckCircle, path: '/loans/approval-dashboard' },
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

  if (!user) return null;

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

            {isAdmin && (
              <>
                <p className={`text-secondary small mt-3 mb-2 ${sidebarCollapsed ? 'text-center' : ''}`}>
                  {!sidebarCollapsed && 'Administration'}
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
          <h4 className="mb-0 fw-semibold">
            {menuItems.find(m => m.id === activeMenu)?.label || 'Tableau de bord'}
          </h4>
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
          {/* KPI Cards */}
          <div className="row g-3 mb-4">
            <div className="col-md-6 col-lg-3">
              <div className="bg-white rounded-4 p-3 shadow-sm">
                <div className="d-flex align-items-center justify-content-between mb-2">
                  <div className="bg-primary bg-opacity-10 p-2 rounded-3">
                    <FileText size={24} className="text-primary" />
                  </div>
                  <span className="text-muted small">Total</span>
                </div>
                <h3 className="mb-0 fw-bold">{stats.totalRequests}</h3>
                <small className="text-muted">Demandes de prêt</small>
              </div>
            </div>
            <div className="col-md-6 col-lg-3">
              <div className="bg-white rounded-4 p-3 shadow-sm">
                <div className="d-flex align-items-center justify-content-between mb-2">
                  <div className="bg-success bg-opacity-10 p-2 rounded-3">
                    <HandCoins size={24} className="text-success" />
                  </div>
                  <span className="text-muted small">Actifs</span>
                </div>
                <h3 className="mb-0 fw-bold">{stats.activeLoans}</h3>
                <small className="text-muted">Prêts en cours</small>
              </div>
            </div>
            <div className="col-md-6 col-lg-3">
              <div className="bg-white rounded-4 p-3 shadow-sm">
                <div className="d-flex align-items-center justify-content-between mb-2">
                  <div className="bg-warning bg-opacity-10 p-2 rounded-3">
                    <Clock size={24} className="text-warning" />
                  </div>
                  <span className="text-muted small">À traiter</span>
                </div>
                <h3 className="mb-0 fw-bold">{stats.pendingApprovals}</h3>
                <small className="text-muted">En attente</small>
              </div>
            </div>
            <div className="col-md-6 col-lg-3">
              <div className="bg-white rounded-4 p-3 shadow-sm">
                <div className="d-flex align-items-center justify-content-between mb-2">
                  <div className="bg-info bg-opacity-10 p-2 rounded-3">
                    <PercentCircle size={24} className="text-info" />
                  </div>
                  <span className="text-muted small">Taux</span>
                </div>
                <h3 className="mb-0 fw-bold">{stats.repaymentRate}%</h3>
                <small className="text-muted">Remboursement</small>
              </div>
            </div>
          </div>

          {/* Second row - Additional KPIs for admin */}
          {isAdmin && (
            <div className="row g-3 mb-4">
              <div className="col-md-4">
                <div className="bg-white rounded-4 p-3 shadow-sm">
                  <div className="d-flex align-items-center gap-3">
                    <div className="bg-primary bg-opacity-10 p-2 rounded-3">
                      <DollarSign size={24} className="text-primary" />
                    </div>
                    <div>
                      <small className="text-muted">Montant total prêté</small>
                      <h5 className="mb-0 fw-bold">{formatCurrency(stats.totalAmountLoaned)}</h5>
                    </div>
                  </div>
                </div>
              </div>
              <div className="col-md-4">
                <div className="bg-white rounded-4 p-3 shadow-sm">
                  <div className="d-flex align-items-center gap-3">
                    <div className="bg-success bg-opacity-10 p-2 rounded-3">
                      <Wallet size={24} className="text-success" />
                    </div>
                    <div>
                      <small className="text-muted">Montant remboursé</small>
                      <h5 className="mb-0 fw-bold">{formatCurrency(stats.totalRepaid)}</h5>
                    </div>
                  </div>
                </div>
              </div>
              <div className="col-md-4">
                <div className="bg-white rounded-4 p-3 shadow-sm">
                  <div className="d-flex align-items-center gap-3">
                    <div className="bg-warning bg-opacity-10 p-2 rounded-3">
                      <Users size={24} className="text-warning" />
                    </div>
                    <div>
                      <small className="text-muted">Membres actifs</small>
                      <h5 className="mb-0 fw-bold">{stats.membersCount}</h5>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Charts Row */}
          <div className="row g-3 mb-4">
            <div className="col-lg-8">
              <div className="bg-white rounded-4 p-3 shadow-sm">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h6 className="fw-semibold mb-0">Évolution financière</h6>
                  {monthlyData.every(d => d.loans === 0) && (
                    <span className="text-muted small">Aucune donnée disponible</span>
                  )}
                </div>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="month" stroke="#6b7280" />
                    <YAxis stroke="#6b7280" tickFormatter={(value) => `${value / 1000}k`} />
                    <Tooltip formatter={(value) => formatCurrency(value)} />
                    <Legend />
                    <Line type="monotone" dataKey="loans" stroke="#3b82f6" strokeWidth={2} name="Prêts" />
                    <Line type="monotone" dataKey="reimbursements" stroke="#f59e0b" strokeWidth={2} name="Remboursements" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="col-lg-4">
              <div className="bg-white rounded-4 p-3 shadow-sm h-100">
                <h6 className="fw-semibold mb-3">Répartition des prêts</h6>
                {loanStatusData.every(d => d.value === 0) ? (
                  <div className="text-center py-5">
                    <p className="text-muted">Aucune donnée disponible</p>
                  </div>
                ) : (
                  <>
                    <ResponsiveContainer width="100%" height={200}>
                      <PieChart>
                        <Pie
                          data={loanStatusData}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        >
                          {loanStatusData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => `${value} prêts`} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="d-flex flex-wrap justify-content-center gap-2 mt-2">
                      {loanStatusData.map((item, idx) => (
                        <div key={idx} className="d-flex align-items-center gap-1">
                          <div style={{ width: '10px', height: '10px', backgroundColor: item.color, borderRadius: '50%' }}></div>
                          <small>{item.name} ({item.value})</small>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Recent Loans Section */}
          <div className="row g-3">
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
                            <td>{new Date(request.createdDate).toLocaleDateString()}</td>
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

          {/* Top Members Section for Admin */}
          {isAdmin && topMembers.length > 0 && (
            <div className="row g-3 mt-2">
              <div className="col-12">
                <div className="bg-white rounded-4 p-3 shadow-sm">
                  <h6 className="fw-semibold mb-3">Top emprunteurs</h6>
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
      `}</style>
    </div>
  );
}