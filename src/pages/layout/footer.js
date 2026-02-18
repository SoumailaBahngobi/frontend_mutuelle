// src/layout/Footer.js
import React from 'react';
import { useLocation } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
    faFacebookF, 
    faInstagram, 
    faTwitter, 
    faLinkedinIn,
    faWhatsapp,
    faMeta
} from '@fortawesome/free-brands-svg-icons';
import { 
    faHandHoldingHeart, 
    faCogs, 
    faHeadset, 
    faAddressBook,
    faPhone,
    faEnvelope,
    faMapMarkerAlt,
    faClock,
    faQuestionCircle,
    faComments,
    faGraduationCap,
    faShieldAlt,
    faFileContract,
    faCookie,
    faHandHoldingUsd,
    faCoins,
    faPiggyBank,
    faCalendarAlt
} from '@fortawesome/free-solid-svg-icons';

export default function Footer() {
    const location = useLocation();
    
    // Masquer le footer sur certaines pages
    const hideFooterPaths = ['/login', '/register', '/reset-password'];
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
                                <FontAwesomeIcon icon={faHandHoldingHeart} className="logo-icon" />
                                <span className="logo-text">Mutuelle App</span>
                            </div>
                            <p className="footer-description">
                                Votre partenaire de confiance pour la gestion mutualiste.
                            </p>
                            <div className="social-links">
                                {/* Meta (Facebook) */}
                                <a 
                                    href="https://facebook.com" 
                                    className="social-link meta" 
                                    aria-label="Facebook Meta"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    <FontAwesomeIcon icon={faMeta} className="social-icon" />
                                </a>
                                
                                {/* Instagram */}
                                <a 
                                    href="https://instagram.com" 
                                    className="social-link instagram" 
                                    aria-label="Instagram"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    <FontAwesomeIcon icon={faInstagram} className="social-icon" />
                                </a>
                                
                                {/* Twitter */}
                                <a 
                                    href="https://twitter.com" 
                                    className="social-link twitter" 
                                    aria-label="Twitter"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    <FontAwesomeIcon icon={faTwitter} className="social-icon" />
                                </a>
                                
                                {/* LinkedIn */}
                                <a 
                                    href="https://linkedin.com" 
                                    className="social-link linkedin" 
                                    aria-label="LinkedIn"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    <FontAwesomeIcon icon={faLinkedinIn} className="social-icon" />
                                </a>
                                
                                {/* WhatsApp */}
                                <a 
                                    href="https://wa.me/2290164605614" 
                                    className="social-link whatsapp" 
                                    aria-label="WhatsApp"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    <FontAwesomeIcon icon={faWhatsapp} className="social-icon" />
                                </a>
                            </div>
                        </div>

                        {/* Colonne 2 - Services */}
                        <div className="footer-column">
                            <h4 className="footer-title">
                                <FontAwesomeIcon icon={faCogs} className="icon" />
                                Services
                            </h4>
                            <ul className="footer-links">
                                <li>
                                    <a href="/loans/request" className="footer-link">
                                        <FontAwesomeIcon icon={faHandHoldingUsd} className="link-icon" />
                                        Prêts Mutuels
                                    </a>
                                </li>
                                <li>
                                    <a href="/mutuelle/contribution/individual" className="footer-link">
                                        <FontAwesomeIcon icon={faCoins} className="link-icon" />
                                        Cotisations
                                    </a>
                                </li>
                               
                                <li>
                                    <a href="/mutuelle/event/list" className="footer-link">
                                        <FontAwesomeIcon icon={faCalendarAlt} className="link-icon" />
                                        Événements
                                    </a>
                                </li>
                            </ul>
                        </div>

                        {/* Colonne 3 - Support */}
                        <div className="footer-column">
                            <h4 className="footer-title">
                                <FontAwesomeIcon icon={faHeadset} className="icon" />
                                Support
                            </h4>
                            <ul className="footer-links">
                                <li>
                                    <a href="/help" className="footer-link">
                                        <FontAwesomeIcon icon={faQuestionCircle} className="link-icon" />
                                        Centre d'Aide
                                    </a>
                                </li>
                                <li>
                                    <a href="/contact" className="footer-link">
                                        <FontAwesomeIcon icon={faEnvelope} className="link-icon" />
                                        Contact
                                    </a>
                                </li>
                                <li>
                                    <a href="/faq" className="footer-link">
                                        <FontAwesomeIcon icon={faComments} className="link-icon" />
                                        FAQ
                                    </a>
                                </li>
        
                            </ul>
                        </div>

                        {/* Colonne 4 - Contact */}
                        <div className="footer-column">
                            <h4 className="footer-title">
                                <FontAwesomeIcon icon={faAddressBook} className="icon" />
                                Contact
                            </h4>
                            <div className="contact-info">
                                <div className="contact-item">
                                    <FontAwesomeIcon icon={faPhone} className="contact-icon" />
                                    <span>+229 01 64 60 56 14</span>
                                </div>
                                <div className="contact-item">
                                    <FontAwesomeIcon icon={faEnvelope} className="contact-icon" />
                                    <span>ismailbahngobi@gmail.com</span>
                                </div>
                                <div className="contact-item">
                                    <FontAwesomeIcon icon={faMapMarkerAlt} className="contact-icon" />
                                    <span>Cotonou, Bénin</span>
                                </div>
                                <div className="contact-item">
                                    <FontAwesomeIcon icon={faClock} className="contact-icon" />
                                    <span>Lun - Dim: 24h/24h</span>
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
                                <span className="copyright-icon">©</span>
                                {currentYear} Mutuelle App. Tous droits réservés.
                            </div>
                            <div className="legal-links">
                                <a href="/privacy" className="legal-link">
                                    <FontAwesomeIcon icon={faShieldAlt} className="legal-icon" />
                                    Confidentialité
                                </a>
                                <a href="/terms" className="legal-link">
                                    <FontAwesomeIcon icon={faFileContract} className="legal-icon" />
                                    Conditions
                                </a>
                                <a href="/cookies" className="legal-link">
                                    <FontAwesomeIcon icon={faCookie} className="legal-icon" />
                                    Cookies
                                </a>
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
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                }

                .footer-container {
                    max-width: 1200px;
                    margin: 0 auto;
                    padding: 0 20px;
                }

                /* Section principale */
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

                /* Logo */
                .footer-logo {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    margin-bottom: 15px;
                }

                .logo-icon {
                    font-size: 1.8rem;
                    color: #3498db;
                    background: rgba(52, 152, 219, 0.1);
                    padding: 10px;
                    border-radius: 50%;
                    width: 24px;
                    height: 24px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
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

                /* Liens sociaux */
                .social-links {
                    display: flex;
                    gap: 10px;
                    flex-wrap: wrap;
                }

                .social-link {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    width: 40px;
                    height: 40px;
                    background: rgba(255, 255, 255, 0.1);
                    color: #ecf0f1;
                    border-radius: 50%;
                    text-decoration: none;
                    transition: all 0.3s ease;
                    border: 2px solid transparent;
                }

                .social-icon {
                    font-size: 1.1rem;
                    width: 16px;
                    height: 16px;
                }

                /* Couleurs au survol */
                .social-link.meta:hover {
                    background: #1877F2;
                    border-color: #1877F2;
                    transform: translateY(-3px);
                }

                .social-link.instagram:hover {
                    background: linear-gradient(45deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888);
                    border-color: #dc2743;
                    transform: translateY(-3px);
                }

                .social-link.twitter:hover {
                    background: #1DA1F2;
                    border-color: #1DA1F2;
                    transform: translateY(-3px);
                }

                .social-link.linkedin:hover {
                    background: #0077B5;
                    border-color: #0077B5;
                    transform: translateY(-3px);
                }

                .social-link.whatsapp:hover {
                    background: #25D366;
                    border-color: #25D366;
                    transform: translateY(-3px);
                }

                .social-link:hover {
                    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.3);
                }

                /* Titres des colonnes */
                .footer-title {
                    color: #3498db;
                    font-size: 1rem;
                    margin-bottom: 15px;
                    font-weight: 600;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }

                .footer-title .icon {
                    font-size: 1rem;
                    width: 16px;
                    height: 16px;
                }

                /* Liens */
                .footer-links {
                    list-style: none;
                    padding: 0;
                    margin: 0;
                }

                .footer-links li {
                    margin-bottom: 10px;
                }

                .footer-link {
                    color: #bdc3c7;
                    text-decoration: none;
                    transition: all 0.3s ease;
                    font-size: 0.85rem;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    padding: 4px 0;
                }

                .footer-link:hover {
                    color: #3498db;
                    transform: translateX(5px);
                }

                .link-icon {
                    font-size: 0.9rem;
                    width: 14px;
                    height: 14px;
                }

                /* Contact */
                .contact-info {
                    margin-bottom: 0;
                }

                .contact-item {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    margin-bottom: 12px;
                    color: #bdc3c7;
                    font-size: 0.85rem;
                }

                .contact-icon {
                    font-size: 0.9rem;
                    width: 14px;
                    height: 14px;
                    color: #3498db;
                }

                /* Section basse */
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
                    display: flex;
                    align-items: center;
                    gap: 5px;
                }

                .copyright-icon {
                    font-size: 0.9rem;
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
                    display: flex;
                    align-items: center;
                    gap: 5px;
                }

                .legal-link:hover {
                    color: #3498db;
                }

                .legal-icon {
                    font-size: 0.7rem;
                    width: 12px;
                    height: 12px;
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
                        gap: 15px;
                    }

                    .social-links {
                        justify-content: center;
                    }
                    
                    .footer-logo {
                        justify-content: center;
                        text-align: center;
                    }

                    .copyright, .legal-link {
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
                        font-size: 1.5rem;
                        padding: 8px;
                    }

                    .social-links {
                        gap: 8px;
                    }

                    .social-link {
                        width: 35px;
                        height: 35px;
                    }

                    .social-icon {
                        font-size: 1rem;
                        width: 14px;
                        height: 14px;
                    }

                    .legal-links {
                        gap: 10px;
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