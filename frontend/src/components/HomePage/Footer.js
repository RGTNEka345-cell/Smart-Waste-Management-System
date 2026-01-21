// frontend/src/components/HomePage/Footer.js
import React from 'react';
import { Link } from 'react-router-dom';
import { 
  FaRecycle, 
  FaFacebook, 
  FaTwitter, 
  FaLinkedin, 
  FaInstagram,
  FaMapMarkerAlt,
  FaPhone,
  FaEnvelope,
  FaShieldAlt,
  FaLeaf
} from 'react-icons/fa';
import './Footer.css';

function Footer() {
  return (
    <footer className="footer">
      <div className="footer-main">
        {/* Company Info */}
        <div className="footer-section company-info">
          <div className="footer-logo">
            <FaRecycle className="footer-logo-icon" />
            <div>
              <h3 className="footer-logo-text">WasteWise</h3>
              <p className="footer-tagline">Smart Waste Management System</p>
            </div>
          </div>
          <p className="company-description">
            Transforming waste management in Sri Lanka through technology, 
            innovation, and community engagement for cleaner, greener cities.
          </p>
          
          <div className="certifications">
            <FaShieldAlt className="cert-icon" />
            <span>ISO 14001 Certified</span>
            <FaLeaf className="cert-icon" />
            <span>Green Initiative Partner</span>
          </div>
        </div>

        {/* Quick Links */}
        <div className="footer-section">
          <h4 className="footer-heading">Quick Links</h4>
          <ul className="footer-links">
            <li><Link to="/">Home</Link></li>
            <li><Link to="/about">About Us</Link></li>
            <li><Link to="/features">Features</Link></li>
            <li><Link to="/how-it-works">How It Works</Link></li>
            <li><Link to="/pricing">Pricing</Link></li>
            <li><Link to="/faq">FAQ</Link></li>
          </ul>
        </div>

        {/* Services */}
        <div className="footer-section">
          <h4 className="footer-heading">Our Services</h4>
          <ul className="footer-links">
            <li><Link to="/services/waste-collection">Waste Collection</Link></li>
            <li><Link to="/services/recycling">Recycling Programs</Link></li>
            <li><Link to="/services/illegal-dumping">Illegal Dumping Report</Link></li>
            <li><Link to="/services/analytics">Waste Analytics</Link></li>
            <li><Link to="/services/consulting">Consulting</Link></li>
            <li><Link to="/services/training">Training Programs</Link></li>
          </ul>
        </div>

        {/* Contact Info */}
        <div className="footer-section contact-info">
          <h4 className="footer-heading">Contact Us</h4>
          <div className="contact-item">
            <FaMapMarkerAlt className="contact-icon" />
            <div>
              <p>123 Green Tech Park</p>
              <p>Colombo 05, Sri Lanka</p>
            </div>
          </div>
          <div className="contact-item">
            <FaPhone className="contact-icon" />
            <p>+94 11 234 5678</p>
          </div>
          <div className="contact-item">
            <FaEnvelope className="contact-icon" />
            <p>support@wastewise.lk</p>
          </div>
          
          <div className="social-links">
            <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="social-link">
              <FaFacebook />
            </a>
            <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="social-link">
              <FaTwitter />
            </a>
            <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="social-link">
              <FaLinkedin />
            </a>
            <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="social-link">
              <FaInstagram />
            </a>
          </div>
        </div>
      </div>

      {/* Footer Bottom */}
      <div className="footer-bottom">
        <div className="footer-bottom-content">
          <p>&copy; {new Date().getFullYear()} WasteWise. All rights reserved.</p>
          <div className="legal-links">
            <Link to="/privacy">Privacy Policy</Link>
            <Link to="/terms">Terms of Service</Link>
            <Link to="/cookies">Cookie Policy</Link>
          </div>
          <p className="version">Version 3.2.1 • Last updated: {new Date().toLocaleDateString()}</p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;