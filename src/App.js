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

function App() {
  return (
    <>
      <Navbar />
      <Routes>
        {/* Routes d'authentification et accueil */}
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<AddMember />} />
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        
        {/* Routes pour les cotisations */}
        <Route path="/mut/contribution_period" element={<AddContributionPeriod />} />
        <Route path="/mut/contribution/individual" element={<AddIndividualContribution />} />
        <Route path="/mut/contribution/group" element={<AddGroupContribution />} />
        <Route path="/contribution-history" element={<ContributionHistory />} />
        <Route path="/mut/contribution/individual/my-contributions" element={<ContributionHistory />} />
        
        {/* Routes pour la gestion des prêts */}
        <Route path="/loans/request" element={<AddLoanRequest />} />
        <Route path="/loans/create" element={<AddLoan />} />
        <Route path="/loans/repayment" element={<AddRepayment />} />
        <Route path="/loans/approval" element={<LoanApproval />} />
        <Route path="/loans/approval-dashboard" element={<LoanApprovalDashboard />} />
        <Route path="/loans/requests" element={<MyLoanRequests />} />
        <Route path="/loans/list" element={<MyLoans />} />
        <Route path="/loans/my-loans" element={<MyLoans />} />
        
        {/* Routes pour les membres (administration) */}
        <Route path="/members" element={<AddMember />} />
        <Route path="/members/add" element={<AddMember />} />
        <Route path="/members/list" element={<AddMember />} />
        
        {/* Routes pour le remboursement */}
        <Route path="/repayment" element={<AddRepayment />} />
        <Route path="/loans/repayment/history" element={<AddRepayment />} />
        
        {/* Routes pour les périodes de cotisation */}
        <Route path="/contribution-period" element={<AddContributionPeriod />} />
        <Route path="/admin/contribution-period" element={<AddContributionPeriod />} />
        
        {/* Routes fallback et erreur 404 */}
        <Route path="*" element={
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
        } />
      </Routes>
    </>
  );
}

export default App;