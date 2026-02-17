import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "bootstrap/dist/css/bootstrap.min.css";
import { toast } from "react-toastify";

export default function Dashboard() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [myLoanRequests, setMyLoanRequests] = useState([]);
  const [myLoans, setMyLoans] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [showNotificationsPanel, setShowNotificationsPanel] = useState(false);

  const [stats, setStats] = useState({
    totalRequests: 0,
    activeLoans: 0,
    pendingApprovals: 0,
    totalContributions: 0,
  });

  // ===============================
  // 🔐 AUTH HEADERS
  // ===============================
  const getAuthHeaders = () => {
    const token = localStorage.getItem("token");
    return {
      Authorization: `Bearer ${token}`,
    };
  };

  // ===============================
  // 📥 FETCH DATA
  // ===============================
  useEffect(() => {
    const fetchAll = async () => {
      try {
        const token = localStorage.getItem("token");

        if (!token) {
          navigate("/login");
          return;
        }

        // Profil
        const profileRes = await axios.get(
          "http://localhost:8080/mutuelle/member/profile",
          { headers: getAuthHeaders() }
        );

        setUser(profileRes.data);

        // Mes demandes de prêt
        const requestsRes = await axios.get(
          "http://localhost:8080/mutuelle/loan/my-requests",
          { headers: getAuthHeaders() }
        );

        setMyLoanRequests(requestsRes.data);

        // Mes prêts actifs
        const loansRes = await axios.get(
          "http://localhost:8080/mutuelle/loan/my-loans",
          { headers: getAuthHeaders() }
        );

        setMyLoans(loansRes.data);

        // Notifications
        const notifRes = await axios.get(
          "http://localhost:8080/mutuelle/notifications",
          { headers: getAuthHeaders() }
        );

        setNotifications(notifRes.data);

        // Stats
        setStats({
          totalRequests: requestsRes.data.length,
          activeLoans: loansRes.data.length,
          pendingApprovals: requestsRes.data.filter(
            (r) => r.status === "PENDING"
          ).length,
          totalContributions: profileRes.data.totalContributions || 0,
        });

      } catch (err) {
        console.error(err);
        setError("Erreur lors du chargement des données.");

        if (err.response?.status === 401) {
          localStorage.removeItem("token");
          navigate("/login");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, [navigate]);

  // ===============================
  // 🚪 LOGOUT
  // ===============================
  const handleLogout = () => {
    localStorage.removeItem("token");
    toast.success("Déconnexion réussie !");
    navigate("/login");
  };

  // ===============================
  // ⏳ LOADING
  // ===============================
  if (loading) {
    return (
      <div className="container mt-5 text-center">
        <div className="spinner-border text-primary" role="status" />
        <p className="mt-3">Chargement du dashboard...</p>
      </div>
    );
  }

  // ===============================
  // ❌ ERROR
  // ===============================
  if (error) {
    return (
      <div className="container mt-5">
        <div className="alert alert-danger">{error}</div>
      </div>
    );
  }

  // ===============================
  // 🖥️ UI
  // ===============================
  return (
    <div className="container mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Bienvenue, {user?.firstName} 👋</h2>
        <button className="btn btn-danger" onClick={handleLogout}>
          Déconnexion
        </button>
      </div>

      {/* STATS */}
      <div className="row mb-4">
        <div className="col-md-3">
          <div className="card text-center shadow">
            <div className="card-body">
              <h5>Demandes</h5>
              <h3>{stats.totalRequests}</h3>
            </div>
          </div>
        </div>

        <div className="col-md-3">
          <div className="card text-center shadow">
            <div className="card-body">
              <h5>Prêts Actifs</h5>
              <h3>{stats.activeLoans}</h3>
            </div>
          </div>
        </div>

        <div className="col-md-3">
          <div className="card text-center shadow">
            <div className="card-body">
              <h5>En attente</h5>
              <h3>{stats.pendingApprovals}</h3>
            </div>
          </div>
        </div>

        <div className="col-md-3">
          <div className="card text-center shadow">
            <div className="card-body">
              <h5>Total Cotisations</h5>
              <h3>{stats.totalContributions} FCFA</h3>
            </div>
          </div>
        </div>
      </div>

      {/* MES DEMANDES */}
      <div className="card shadow mb-4">
        <div className="card-header bg-primary text-white">
          Mes demandes de prêt
        </div>
        <div className="card-body">
          {myLoanRequests.length === 0 ? (
            <p>Aucune demande.</p>
          ) : (
            <ul className="list-group">
              {myLoanRequests.map((req) => (
                <li key={req.id} className="list-group-item">
                  {req.amount} FCFA - {req.status}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* MES PRÊTS */}
      <div className="card shadow mb-4">
        <div className="card-header bg-success text-white">
          Mes prêts actifs
        </div>
        <div className="card-body">
          {myLoans.length === 0 ? (
            <p>Aucun prêt actif.</p>
          ) : (
            <ul className="list-group">
              {myLoans.map((loan) => (
                <li key={loan.id} className="list-group-item">
                  {loan.amount} FCFA - Échéance : {loan.endDate}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* NOTIFICATIONS */}
      <div className="card shadow">
        <div className="card-header bg-warning">
          Notifications ({notifications.length})
        </div>
        <div className="card-body">
          {notifications.length === 0 ? (
            <p>Aucune notification.</p>
          ) : (
            <ul className="list-group">
              {notifications.map((notif) => (
                <li key={notif.id} className="list-group-item">
                  {notif.message}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
