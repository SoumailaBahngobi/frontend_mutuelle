import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function Home() {
  const navigate = useNavigate();
  return (
    <div className="container">
      <button className="btn btn-primary" onClick={() => navigate('/register')}>s'inscrire</button>
      <button className="btn btn-secondary" onClick={() => navigate('/login')}>se connecter</button>
      <button className="btn btn-success">Nos services</button>
      <button className="btn btn-danger">Contactez-nous</button>
    </div>
  );
}
