// App.js (version complète)
import './App.css';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useKeycloak } from '@react-keycloak/web';

// Layout components
import Navbar from './layout/NavBar';
import Footer from './pages/layout/footer';

// Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Unauthorized from './pages/Unauthorized';
import ResetPassword from './pages/ResetPassword';
import EmailHandler from './pages/EmailHandler';

// Components
import PrivateRoute from './component/PrivateRoute';
import LoadingSpinner from './component/LoadingSpinner';

function App() {
  const { keycloak, initialized } = useKeycloak();

  if (!initialized) {
    return <LoadingSpinner message="Initialisation de Keycloak..." />;
  }

  if (!keycloak.authenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="d-flex flex-column min-vh-100">
      <Navbar />
      <main className="flex-grow-1">
        <Routes>
          <Route path="/" element={<Navigate to="/login" />} />
          <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
          <Route path="/unauthorized" element={<Unauthorized />} />
          <Route path="*" element={<Navigate to="/dashboard" />} />
        </Routes>
      </main>
      <Footer />
      <ToastContainer position="top-right" autoClose={5000} />
    </div>
  );
}

export default App;