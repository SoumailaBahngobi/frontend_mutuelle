// src/components/LoadingSpinner.js
import React from 'react';

const LoadingSpinner = ({ message = 'Chargement...' }) => {
  return (
    <div className="d-flex justify-content-center align-items-center min-vh-100">
      <div className="text-center">
        <div className="spinner-border text-primary mb-3" role="status">
          <span className="visually-hidden">Chargement...</span>
        </div>
        <p className="text-muted">{message}</p>
      </div>
    </div>
  );
};

export default LoadingSpinner;