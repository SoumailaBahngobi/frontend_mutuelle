import React from 'react';
import { useNavigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min';


export default function Home() {
  // const navigate = useNavigate();
  return (
    <div className="container">
      <div className="container mt-4">
        <div className="jumbotron">
          <h1 className="display-4">Bienvenue à la Mutuelle</h1></div>
        <p className="lead">Votre partenaire de confiance pour la gestion financière communautaire.</p>
        <hr className="my-4" />
        <p>Rejoignez-nous pour bénéficier de services de contribution et de prêt adaptés à vos besoins.</p>
        <a className="btn btn-primary btn-lg" href="/register" role="button">Commencer</a>
      </div>
    </div>

  );
}
