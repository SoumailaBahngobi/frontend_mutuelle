import React from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import { useNavigate } from 'react-router-dom';

function SideBar() {
  const navigate = useNavigate();
  return (
    <div>
      <h2>Sidebar</h2>
      <ul>
        <li>Home</li>
        <li>About</li>
        <li>Contact</li>
      </ul>
      
    </div>
  );
}
export default SideBar;