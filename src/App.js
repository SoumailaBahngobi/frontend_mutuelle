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

function App() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/register" element={<AddMember />} />
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path='/mut/contribution/individual' element={<AddIndividualContribution />} />
        <Route path='/mut/contribution/group' element={<AddGroupContribution />} />
        <Route path="/contribution-history" element={<ContributionHistory />} />
        <Route path="/mut/contribution/individual/my-contributions" element={<ContributionHistory />} />
        
        {/* Routes pour la gestion des prêts */}
        <Route path="/loans/request" element={<AddLoanRequest />} />
        <Route path="/loans/create" element={<AddLoan />} />
        <Route path="/loans/repayment" element={<AddRepayment />} />
        <Route path="/loans/approval" element={<LoanApproval />} />
        <Route path="/loans/requests" element={<MyLoanRequests />} />
      </Routes>
    </>
  );
}

export default App;
