// src/layout/Footer.js
import React from 'react';
import { useLocation } from 'react-router-dom';

export default function Footer() {
    const location = useLocation();
    
    // Masquer le footer sur certaines pages
    const hideFooterPaths = ['/login', '/register'];
    if (hideFooterPaths.includes(location.pathname)) {
        return null;
    }

    const currentYear = new Date().getFullYear();

    return (
        <>
            <footer className="footer-complete">
                {/* Section principale */}
                <div className="footer-main">
                    <div className="footer-container">
                        {/* Colonne 1 - Présentation */}
                        <div className="footer-column">
                            <div className="footer-logo">
                                <i className="fas fa-hand-holding-heart logo-icon"></i>
                                <span className="logo-text">Mutuelle App</span>
                            </div>
                            <p className="footer-description">
                                Votre partenaire de confiance pour la gestion mutualiste.
                            </p>
                            <div className="social-links">
                                <a href="#" className="social-link" aria-label="Facebook">
                                    <i className="fab fa-facebook-f"></i>
                                </a>
                                <a href="#" className="social-link" aria-label="Twitter">
                                    <i className="fab fa-twitter"></i>
                                </a>
                                <a href="#" className="social-link" aria-label="LinkedIn">
                                    <i className="fab fa-linkedin-in"></i>
                                </a>
                            </div>
                        </div>

                        {/* Colonne 2 - Services */}
                        <div className="footer-column">
                            <h4 className="footer-title">Services</h4>
                            <ul className="footer-links">
                                <li><a href="/loans" className="footer-link">Prêts Mutuels</a></li>
                                <li><a href="/contributions" className="footer-link">Cotisations</a></li>
                                <li><a href="/savings" className="footer-link">Épargne</a></li>
                                <li><a href="/events" className="footer-link">Événements</a></li>
                            </ul>
                        </div>

                        {/* Colonne 3 - Support */}
                        <div className="footer-column">
                            <h4 className="footer-title">Support</h4>
                            <ul className="footer-links">
                                <li><a href="/help" className="footer-link">Centre d'Aide</a></li>
                                <li><a href="/contact" className="footer-link">Contact</a></li>
                                <li><a href="/faq" className="footer-link">FAQ</a></li>
                                <li><a href="/tutorials" className="footer-link">Tutoriels</a></li>
                            </ul>
                        </div>

                        {/* Colonne 4 - Contact */}
                        <div className="footer-column">
                            <h4 className="footer-title">Contact</h4>
                            <div className="contact-info">
                                <div className="contact-item">
                                    <i className="fas fa-phone contact-icon"></i>
                                    <span>+229 0164605614</span>
                                </div>
                                <div className="contact-item">
                                    <i className="fas fa-envelope contact-icon"></i>
                                    <span>ismailbahngobi@gmail.com</span>
                                </div>
                                <div className="contact-item">
                                    <i className="fas fa-map-marker-alt contact-icon"></i>
                                    <span>Cotonou, Bénin</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Section basse */}
                <div className="footer-bottom">
                    <div className="footer-container">
                        <div className="footer-bottom-content">
                            <div className="copyright">
                                © {currentYear} Mutuelle App. Tous droits réservés.
                            </div>
                            <div className="legal-links">
                                <a href="/privacy" className="legal-link">Confidentialité</a>
                                <a href="/terms" className="legal-link">Conditions</a>
                                <a href="/cookies" className="legal-link">Cookies</a>
                            </div>
                        </div>
                    </div>
                </div>
            </footer>

            <style jsx>{`
                .footer-complete {
                    background: linear-gradient(135deg, #2c3e50 0%, #34495e 100%);
                    color: #ecf0f1;
                    margin-top: auto;
                    font-size: 0.85rem;
                }

                .footer-container {
                    max-width: 1200px;
                    margin: 0 auto;
                    padding: 0 20px;
                }

                /* Section principale - HAUTEUR RÉDUITE */
                .footer-main {
                    padding: 30px 0 20px;
                    background: rgba(0, 0, 0, 0.1);
                }

                .footer-main .footer-container {
                    display: grid;
                    grid-template-columns: 1.5fr 1fr 1fr 1fr;
                    gap: 30px;
                    align-items: start;
                }

                /* Logo compact */
                .footer-logo {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    margin-bottom: 15px;
                }

                .logo-icon {
                    font-size: 1.5rem;
                    color: #3498db;
                    background: rgba(52, 152, 219, 0.1);
                    padding: 8px;
                    border-radius: 50%;
                }

                .logo-text {
                    font-size: 1.2rem;
                    font-weight: bold;
                    color: #3498db;
                }

                .footer-description {
                    color: #bdc3c7;
                    line-height: 1.5;
                    margin-bottom: 15px;
                    font-size: 0.8rem;
                }

                /* Liens sociaux compacts */
                .social-links {
                    display: flex;
                    gap: 8px;
                }

                .social-link {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    width: 32px;
                    height: 32px;
                    background: rgba(255, 255, 255, 0.1);
                    color: #ecf0f1;
                    border-radius: 50%;
                    text-decoration: none;
                    transition: all 0.3s ease;
                    font-size: 0.8rem;
                }

                .social-link:hover {
                    background: #3498db;
                    transform: translateY(-2px);
                }

                /* Titres des colonnes */
                .footer-title {
                    color: #3498db;
                    font-size: 0.95rem;
                    margin-bottom: 15px;
                    font-weight: 600;
                }

                /* Liens compacts */
                .footer-links {
                    list-style: none;
                    padding: 0;
                    margin: 0;
                }

                .footer-links li {
                    margin-bottom: 8px;
                }

                .footer-link {
                    color: #bdc3c7;
                    text-decoration: none;
                    transition: all 0.3s ease;
                    font-size: 0.8rem;
                }

                .footer-link:hover {
                    color: #3498db;
                    padding-left: 5px;
                }

                /* Contact compact */
                .contact-info {
                    margin-bottom: 0;
                }

                .contact-item {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    margin-bottom: 10px;
                    color: #bdc3c7;
                    font-size: 0.8rem;
                }

                .contact-icon {
                    color: #3498db;
                    width: 14px;
                    font-size: 0.8rem;
                }

                /* Section basse compacte */
                .footer-bottom {
                    background: rgba(0, 0, 0, 0.2);
                    padding: 15px 0;
                    border-top: 1px solid rgba(255, 255, 255, 0.1);
                }

                .footer-bottom-content {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }

                .copyright {
                    color: #95a5a6;
                    font-size: 0.8rem;
                }

                .legal-links {
                    display: flex;
                    gap: 20px;
                }

                .legal-link {
                    color: #95a5a6;
                    text-decoration: none;
                    font-size: 0.75rem;
                    transition: color 0.3s ease;
                }

                .legal-link:hover {
                    color: #3498db;
                }

                /* Responsive */
                @media (max-width: 1024px) {
                    .footer-main .footer-container {
                        grid-template-columns: 1fr 1fr;
                        gap: 25px;
                    }
                    
                    .footer-main {
                        padding: 25px 0 15px;
                    }
                }

                @media (max-width: 768px) {
                    .footer-main {
                        padding: 20px 0 15px;
                    }

                    .footer-main .footer-container {
                        grid-template-columns: 1fr;
                        gap: 25px;
                    }

                    .footer-bottom-content {
                        flex-direction: column;
                        gap: 10px;
                        text-align: center;
                    }

                    .legal-links {
                        flex-wrap: wrap;
                        justify-content: center;
                        gap: 12px;
                    }

                    .social-links {
                        justify-content: center;
                    }
                    
                    .footer-logo {
                        justify-content: center;
                    }
                }

                @media (max-width: 480px) {
                    .footer-container {
                        padding: 0 15px;
                    }

                    .footer-main {
                        padding: 15px 0 10px;
                    }
                    
                    .footer-bottom {
                        padding: 12px 0;
                    }
                    
                    .logo-text {
                        font-size: 1.1rem;
                    }
                    
                    .logo-icon {
                        font-size: 1.3rem;
                        padding: 6px;
                    }
                }

                /* Hauteur totale réduite */
                @media (min-width: 769px) {
                    .footer-complete {
                        min-height: 220px;
                    }
                }
                
                @media (max-width: 768px) {
                    .footer-complete {
                        min-height: auto;
                    }
                }
            `}</style>
        </>
    );
}