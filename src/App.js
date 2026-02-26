// src/App.js
import './App.css';
import { Routes, Route } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useKeycloak } from './context/KeycloakContext';
import Navbar from './layout/NavBar';
import ProtectedRoute from './component/ProtectedRoute';
import Home from './pages/Home';
import Login from './configuration/Login';
import AddMember from './members/AddMember';
import Dashboard from './pages/Dashboard';
import AddIndividualContribution from './contributions/AddIndividualContribution';
import AddGroupContribution from './contributions/AddGroupContribution';
import ContributionHistory from './contributions/ContributionHistory';
import AddLoanRequest from './loanRequest/AddLoanRequest';
import AddLoan from './loan/AddLoan';
import AddRepayment from './repayment/AddRepayment';
import LoanApproval from './loan/LoanApproval';
import MyLoanRequests from './loanRequest/MyLoanRequest';
import AddContributionPeriod from './contributionPeriod/AddContributionPeriod';
import LoanApprovalDashboard from './loan/LoanApprovalDashboard';
import MyLoans from './loan/MyLoans';
import TreasurerLoanDashboard from './treasurer/TreasurerLoanDashboard';
import RoleProtectedRoute from './treasurer/RoleProtectedRoute';
import AddEvent from './evenement/AddEvent';
import RepaymentList from './repayment/RepaymentList';
import LoanList from './loan/LoanList';
import EventList from './evenement/EventList';
import ViewMember from './members/ViewMember';
import EditMember from './members/EditMember';
import ResetPassword from './configuration/ResetPassword';
import EmailHandler from './configuration/EmailHandler';
import LoanApprovalList from './loan/LoanApprovalList';
import LoanHistory from './loan/LoanHistory';
import LoanRequestDetails from './loan/LoanRequestDetails';
import LoanDetails from './loan/LoanDetails';
import Footer from './layout/Footer';

function App() {
  const { loading } = useKeycloak();

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Chargement...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="d-flex flex-column min-vh-100">
      <Navbar />
      <main className="flex-grow-1">
        <Routes>
          {/* Routes publiques */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<AddMember />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/email-handler" element={<EmailHandler />} />

          {/* Routes protégées */}
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />
          <Route path="/mutuelle/contribution/individual" element={
            <ProtectedRoute>
              <AddIndividualContribution />
            </ProtectedRoute>
          } />
          <Route path="/mutuelle/contribution/group" element={
            <ProtectedRoute>
              <AddGroupContribution />
            </ProtectedRoute>
          } />
          <Route path="/mutuelle/contribution/individual/my-contributions" element={
            <ProtectedRoute>
              <ContributionHistory />
            </ProtectedRoute>
          } />
          <Route path="/mutuelle/contribution_period" element={
            <ProtectedRoute>
              <AddContributionPeriod />
            </ProtectedRoute>
          } />
          <Route path="/mutuelle/event" element={
            <ProtectedRoute>
              <AddEvent />
            </ProtectedRoute>
          } />
          <Route path="/mutuelle/event/list" element={
            <ProtectedRoute>
              <EventList />
            </ProtectedRoute>
          } />

          {/* Routes prêts */}
          <Route path="/loans/request" element={
            <ProtectedRoute>
              <AddLoanRequest />
            </ProtectedRoute>
          } />
          <Route path="/loans/requests" element={
            <ProtectedRoute>
              <MyLoanRequests />
            </ProtectedRoute>
          } />
          <Route path="/loans/my-loans" element={
            <ProtectedRoute>
              <MyLoans />
            </ProtectedRoute>
          } />
          <Route path="/loans/repayment" element={
            <ProtectedRoute>
              <AddRepayment />
            </ProtectedRoute>
          } />
          <Route path="/loans/repayment-history" element={
            <ProtectedRoute>
              <RepaymentList />
            </ProtectedRoute>
          } />
          <Route path="/loans/create" element={
            <ProtectedRoute>
              <AddLoan />
            </ProtectedRoute>
          } />
          <Route path="/loans/approval" element={
            <ProtectedRoute>
              <LoanApproval />
            </ProtectedRoute>
          } />
          <Route path="/loans/approval-dashboard" element={
            <ProtectedRoute>
              <LoanApprovalDashboard />
            </ProtectedRoute>
          } />
          <Route path="/loans/list" element={
            <ProtectedRoute>
              <LoanList />
            </ProtectedRoute>
          } />

          {/* Routes administration */}
          <Route path="/members" element={
            <ProtectedRoute>
              <AddMember />
            </ProtectedRoute>
          } />
          <Route path="/members/add" element={
            <ProtectedRoute>
              <AddMember />
            </ProtectedRoute>
          } />
          <Route path="/members/list" element={
            <ProtectedRoute>
              <ViewMember />
            </ProtectedRoute>
          } />
          <Route path="/members/edit/:id" element={
            <ProtectedRoute>
              <EditMember />
            </ProtectedRoute>
          } />

          {/* Routes avec rôles spécifiques */}
          <Route path="/treasurer/loans" element={
            <ProtectedRoute requiredRole="TREASURER">
              <TreasurerLoanDashboard />
            </ProtectedRoute>
          } />

          {/* Route profil utilisateur */}
          <Route path="/profile" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />

          {/* Route liste approbation prêts */}
          <Route path="/loans/approval-list" element={
            <ProtectedRoute>
              <LoanApprovalList />
            </ProtectedRoute>
          } />

          {/* Routes détails prêts */}
          <Route path="/loans/request-details/:id" element={
            <ProtectedRoute>
              <LoanRequestDetails />
            </ProtectedRoute>
          } />
          <Route path="/loans/details/:id" element={
            <ProtectedRoute>
              <LoanDetails />
            </ProtectedRoute>
          } />

          {/* Route 404 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
     <Footer /> 
      <ToastContainer position="top-right" autoClose={5000} />
    </div>
  );
}

function NotFound() {
  return (
    <div className="container mt-5 text-center">
      <h1 className="display-1">404</h1>
      <h2>Page non trouvée</h2>
      <p className="text-muted">La page que vous recherchez n'existe pas.</p>
    </div>
  );
}

export default App;