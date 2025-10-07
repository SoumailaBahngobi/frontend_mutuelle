import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Navbar from '../Navbar/Navbar';
import Footer from '../Footer/Footer';
import Dashboard from '../Dashboard/Dashboard';
import Sidebar from '../Sidebar/Sidebar.js ';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';


const Layout = () => {
  return (
    <div id="wrapper">
      <Sidebar />
      
      <div id="content-wrapper" className="d-flex flex-column">
        <div id="content">
          <Navbar />
          <div className="container-fluid">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/dashboard" element={<Dashboard />} />
              {/* Ajoutez vos autres routes ici */}
            </Routes>
          </div>
        </div>
        <Footer />
      </div>
    </div>
  );
};

export default Layout;