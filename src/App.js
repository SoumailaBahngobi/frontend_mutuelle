
import './App.css';
import { Routes, Route } from 'react-router-dom';
import Navbar from './layout/NavBar.js';
import AddMember from './members/AddMember.js';
import Login from './pages/Login.js';
import Dashboard from './pages/Dashboard.js';
import AddIndividualContribution from './contributions/AddIndividualContribution.js';
import AddGroupContribution from './contributions/AddGroupContribution.js';
import ContributionHistory from './contributions/ContributionHistory.js';
import AddLoanRequest from './loanRequest/AddLoanRequest.js';
import AddLoan from './loan/AddLoan.js';
import AddRepayment from './repayment/AddRepayment.js';
import LoanApproval from './loan/LoanApproval.js';
import MyLoanRequests from './loanRequest/MyLoanRequest.js';
import AddContributionPeriod from './contributionPeriod/AddContributionPeriod.js';
import LoanApprovalDashboard from './loan/LoanApprovalDashboard.js';
import MyLoans from './loan/MyLoans.js';
import Home from './pages/Home.js';
import TreasurerLoanDashboard from './treasurer/TreasurerLoanDashboard.js';
import RoleProtectedRoute from './treasurer/RoleProtectedRoute.js';

function App() {
  return (
    <>
      <Navbar />
      <Routes>
        {/* Routes publiques */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<AddMember />} />

        {/* Routes protégées - Tableau de bord */}
        <Route path="/dashboard" element={<Dashboard />} />

        {/* Routes cotisations */}
        <Route path="/mut/contribution_period" element={<AddContributionPeriod />} />
        <Route path="/mut/contribution/individual" element={<AddIndividualContribution />} />
        <Route path="/mut/contribution/group" element={<AddGroupContribution />} />
        <Route path="/mut/contribution/individual/my-contributions" element={<ContributionHistory />} />

        {/* Routes prêts */}
        <Route path="/loans/request" element={<AddLoanRequest />} />
        <Route path="/loans/create" element={<AddLoan />} />
        <Route path="/loans/repayment" element={<AddRepayment />} />
        <Route path="/loans/approval" element={<LoanApproval />} />
        <Route path="/loans/approval-dashboard" element={<LoanApprovalDashboard />} />
        <Route path="/loans/requests" element={<MyLoanRequests />} />
        <Route path="/loans/my-loans" element={<MyLoans />} />

        {/* Routes administration */}
        <Route path="/members" element={<AddMember />} />
        <Route path="/repayment" element={<AddRepayment />} />
        <Route path="/contribution-period" element={<AddContributionPeriod />} />

        <Route path="/treasurer/loans" element={
            <RoleProtectedRoute allowedRoles={['TREASURER', 'ADMIN']}>
              <TreasurerLoanDashboard />
            </RoleProtectedRoute>
          } />

        {/* Route 404 */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
}

// Composant 404 séparé pour meilleure lisibilité
function NotFound() {
  return (
    <div className="container mt-5">
      <div className="row justify-content-center">
        <div className="col-md-6 text-center">
          <h1 className="display-1 text-muted">404</h1>
          <h2 className="mb-3">Page non trouvée</h2>
          <p className="text-muted mb-4">
            La page que vous recherchez n'existe pas ou a été déplacée.
          </p>
          <button 
            className="btn btn-primary"
            onClick={() => window.history.back()}
          >
            <i className="fas fa-arrow-left me-2"></i>
            Retour
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;