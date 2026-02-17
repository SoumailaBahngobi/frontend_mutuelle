import React from "react";
import { useNavigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min";

export default function Home() {
  const navigate = useNavigate();

  return (
    <div className="container mt-5">
      <div className="card shadow-lg p-5 text-center">
        <h1 className="display-4 mb-3">
          Bienvenue à la Mutuelle
        </h1>

        <p className="lead">
          Votre partenaire de confiance pour la gestion financière communautaire.
        </p>

        <hr className="my-4" />

        <p>
          Rejoignez-nous pour bénéficier de services de contribution et de prêt adaptés à vos besoins.
        </p>

        <div className="d-flex justify-content-center gap-3 mt-4 flex-wrap">
          <button
            className="btn btn-primary btn-lg"
            onClick={() => navigate("/register")}
          >
            S'inscrire
          </button>

          <button
            className="btn btn-secondary btn-lg"
            onClick={() => navigate("/login")}
          >
            Se connecter
          </button>

          <button
            className="btn btn-success btn-lg"
            onClick={() => navigate("/services")}
          >
            Nos services
          </button>

          <button
            className="btn btn-danger btn-lg"
            onClick={() => navigate("/contact")}
          >
            Contactez-nous
          </button>
        </div>
      </div>
    </div>
  );
}
