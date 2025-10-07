import React from 'react';
import { Routes, Route } from 'react-router-dom';
import PublicNavbar from '../Navbar/PublicNavbar';
import Home from '../pages/Home';
import Login from '../pages/Login';
import Register from '../pages/Register';


const PublicLayout = () => {
  return (
    <div>
      <PublicNavbar />
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          {/* Ajoutez d'autres routes publiques ici */}
        </Routes>
      </main>
    </div>
  );
};

export default PublicLayout;