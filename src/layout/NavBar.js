import React from 'react'
import Home from '../pages/Home.js';
import AddMember from '../members/AddMember.js';


export default function NavBar() {
  return (
    <div>

      <nav className="navbar navbar-expand-lg navbar-dark bg-primary">
        <div className="container-fluid">
          <a className="navbar-brand" href="#">Mutuelle de Solidarité</a>
          <button className="navbar-toggler" type="button" data-bs-toggle="collapse"
            data-bs-target="#navbarSupportedContent" aria-controls="navbarSupportedContent"
            aria-expanded="false" aria-label="Toggle navigation">
            <span className="navbar-toggler-icon">
            </span>
          </button>

          <div className='container'>
            <div className="collapse navbar-collapse" id="navbarSupportedContent">
              <ul className="navbar-nav me-auto mb-2 mb-lg-0">
                <li className="nav-item">
                  <a className="nav-link active" aria-current="page" href="/">Accueil</a>
                </li>
                <li className="nav-item">
                  <a className="nav-link" href="/register">S'inscrire</a>
                </li>
                <li className="nav-item">
                  <a className="nav-link" href="/login">Se connecter</a>
                </li>
                <li className="nav-item">
                  <a className="nav-link" href="/dashboard">Tableau de bord</a>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </nav>
    </div>
  )
}
