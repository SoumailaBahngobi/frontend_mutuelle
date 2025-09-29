import './App.css';
import "../node_modules/bootstrap/dist/css/bootstrap.min.css";
import Navbar from './layout/NavBar.js';  
import AddMember from './members/AddMember.js';
import { Routes, Route } from 'react-router-dom';
import Login from './pages/Login.js';
import Dashboard from './pages/Dashboard.js';
import AddIndividualContribution from './contributions/AddIndividualContribution.js';
import AddGroupContribution from './contributions/AddGroupContribution.js';
import EditMember from './members/EditMember.js';
import ViewMember from './members/ViewMember.js';
import Home from './pages/Home.js';
import ContributionHistory from './contributions/ContributionHistory.js';
import React from 'react';
import { useEffect } from 'react';
import axios from 'axios';
import { useState } from 'react';



function App() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/register" element={<AddMember />} />
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path='/mut/contribution/individual' element={<AddIndividualContribution/>}/>
        <Route path='/mut/contribution/group' element={<AddGroupContribution/>}/>
        <Route path="/contribution-history" element={<ContributionHistory />} />
        {/* autres routes ici si besoin */}
      </Routes>
    </>
  );
}

export default App;
