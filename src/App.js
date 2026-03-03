// src/App.js
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

import { useEffect, useState } from "react";
///mutuelle/member/profile/update

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


          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/change-password" element={
            <ProtectedRoute>
              <ChangePassword />
            </ProtectedRoute>
          } />
          <Route path="/reset-password" element={<ResetPassword />} />

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
