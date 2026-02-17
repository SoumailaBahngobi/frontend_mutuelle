import './App.css';
import { Routes, Route } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Navbar from './layout/NavBar.js';
import AddMember from './members/AddMember.js';
import Login from './configuration/Login.js';
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
import AddEvent from './evenement/AddEvent.js';
import RepaymentList from './repayment/RepaymentList.js';
import LoanList from './loan/LoanList.js';
import EventList from './evenement/EventList.js';
import ViewMember from './members/ViewMember.js';
import EditMember from './members/EditMember.js';
import ResetPassword from './configuration/ResetPassword.js';
import EmailHandler from './configuration/EmailHandler.js';
import Footer from './pages/layout/Footer.js';
import Keycloak from './keycloak/keycloak.js';

///mutuelle/member/profile/update

function App() {

 
  return (
    <div className="d-flex flex-column min-vh-100">
      <Navbar />

      {/* Contenu principal qui s'étend pour pousser le footer vers le bas */}
      <main className="flex-grow-1">
        <Routes>
          {/* Routes publiques */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<AddMember />} />

          {/* Routes protégées - Tableau de bord */}
          <Route path="/dashboard" element={<Dashboard />} />

          {/* Routes cotisations */}
          <Route path="/mutuelle/contribution_period" element={<AddContributionPeriod />} />
          <Route path="/mutuelle/contribution/individual" element={<AddIndividualContribution />} />
          <Route path="/mutuelle/contribution/group" element={<AddGroupContribution />} />
          <Route path="/mutuelle/contribution/individual/my-contributions" element={<ContributionHistory />} />
          <Route path="/mutuelle/event" element={<AddEvent />} />

          {/* Routes prêts */}
          <Route path="/loans/request" element={<AddLoanRequest />} />
          <Route path="/loans/create" element={<AddLoan />} />
          <Route path="/loans/repayment" element={<AddRepayment />} />
          <Route path="/loans/approval" element={<LoanApproval />} />
          <Route path="/loans/approval-dashboard" element={<LoanApprovalDashboard />} />
          <Route path="/loans/requests" element={<MyLoanRequests />} />
          <Route path="/loans/my-loans" element={<MyLoans />} />

          <Route path='/mutuelle/repayments/view' element={<RepaymentList />} />
          <Route path='/mutuelle/loan-list' element={<LoanList />} />
          <Route path='/mutuelle/event/list' element={<EventList />} />

          {/* Routes administration */}
          <Route path="/members" element={<AddMember />} />
          <Route path="/repayment" element={<AddRepayment />} />
          <Route path='/loans/repayment-history' element={<RepaymentList />} />
          <Route path="/loans/list" element={<LoanList />} />
          <Route path="/events/list" element={<EventList />} />
          <Route path="/contribution-period" element={<AddContributionPeriod />} />

          <Route path="/treasurer/loans" element={
            <RoleProtectedRoute allowedRoles={['TREASURER', 'ADMIN']}>
              <TreasurerLoanDashboard />
            </RoleProtectedRoute>
          } />

          <Route path="/edit-member/:id" element={<EditMember />} />
          <Route path="/members/add" element={<AddMember />} />
          <Route path="/members/edit/:id" element={<EditMember />} />
          <Route path="/members/list" element={<ViewMember />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/email-handler" element={<EmailHandler />} />

          {/* Route 404 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>

      {/* Footer - sera masqué automatiquement sur /login et /register */}
      <Footer />

      {/* Container pour les toasts */}
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
    </div>
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