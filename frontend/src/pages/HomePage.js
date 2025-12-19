// HomePage.jsx - Premium Version
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "./HomePage.css";
import Navbar from "../components/HomePage/Navbar";
import { 
  FaSignInAlt, 
  FaUserPlus, 
  FaUsers, 
  FaTruck, 
  FaMapMarkerAlt,
  FaChartLine,
  FaBell,
  FaRecycle,
  FaLeaf,
  FaFacebook,
  FaTwitter,
  FaLinkedin,
  FaInstagram,
  FaChevronDown,
  FaTruckLoading,
  FaCheckCircle,
  FaMap,
  FaDatabase
} from "react-icons/fa";

function HomePage() {
  const [particles, setParticles] = useState([]);
  const [stats, setStats] = useState({
    users: 12500,
    requests: 8500,
    collectors: 320,
    cities: 45
  });

  // Create particles
  useEffect(() => {
    const newParticles = [];
    for (let i = 0; i < 50; i++) {
      newParticles.push({
        id: i,
        size: Math.random() * 5 + 2,
        left: Math.random() * 100,
        animationDuration: Math.random() * 20 + 10
      });
    }
    setParticles(newParticles);
  }, []);

  // Animate stats
  useEffect(() => {
    const interval = setInterval(() => {
      setStats(prev => ({
        users: prev.users + Math.floor(Math.random() * 10),
        requests: prev.requests + Math.floor(Math.random() * 5),
        collectors: prev.collectors,
        cities: prev.cities
      }));
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="home-container">
      <Navbar />
      {/* Background Video */}
      <div className="video-background">
        <video autoPlay muted loop playsInline>
          <source src="https://assets.mixkit.co/videos/preview/mixkit-cleaning-a-beach-with-a-tractor-38732-large.mp4" type="video/mp4" />
          {/* Fallback image if video doesn't load */}
          <div style={{
            background: 'linear-gradient(135deg, #00b894, #0984e3)',
            width: '100%',
            height: '100%'
          }} />
        </video>
      </div>

      {/* Gradient Overlay */}
      <div className="overlay" />

      {/* Animated Particles */}
      <div className="particles">
        {particles.map(particle => (
          <div
            key={particle.id}
            className="particle"
            style={{
              width: `${particle.size}px`,
              height: `${particle.size}px`,
              left: `${particle.left}%`,
              animationDuration: `${particle.animationDuration}s`,
              animationDelay: `${Math.random() * 5}s`
            }}
          />
        ))}
      </div>

      {/* Live Notification */}
      

      {/* Main Header */}
      <header className="header">
        <div className="logo">
          <FaRecycle />
        </div>
        <h1 className="title">Smart Waste Management System</h1>
        <p className="subtitle">Real-time tracking • Automated scheduling • Sustainable cities</p>

        {/* Live Stats */}
        <div className="stats-ticker">
          <div className="stat-item">
            <span className="stat-number">{stats.users.toLocaleString()}+</span>
            <span className="stat-label">Active Users</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">{stats.requests.toLocaleString()}+</span>
            <span className="stat-label">Requests Handled</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">{stats.collectors}</span>
            <span className="stat-label">Collectors</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">{stats.cities}</span>
            <span className="stat-label">Cities</span>
          </div>
        </div>

        {/* Call to Action */}
        <div className="button-section">
          <Link className="main-btn" to="/login">
            <FaSignInAlt /> Access Dashboard
          </Link>
          <Link className="sec-btn" to="/register/citizen">
            <FaUserPlus /> Join as Citizen
          </Link>
        </div>

        {/* Scroll Indicator */}
        <div className="scroll-indicator">
          <FaChevronDown size={30} />
        </div>
      </header>

      {/* Live Map Preview */}
      <div className="map-preview">
        <div className="map-overlay">
          <FaMap size={60} style={{ marginBottom: '20px', color: 'var(--primary)' }} />
          <h3>Live Waste Collection Map</h3>
          <p>Real-time tracking of collection vehicles across the city</p>
          <Link 
            to="/track" 
            className="main-btn" 
            style={{ marginTop: '30px', width: 'auto', padding: '15px 40px' }}
          >
            <FaMapMarkerAlt /> View Live Map
          </Link>
        </div>
      </div>

      {/* Features Section */}
      <section className="features">
        <h2>What You Can Do</h2>

        <div className="feature-grid">
          <div className="feature-card">
            <div className="icon-container">
              <FaUsers />
            </div>
            <h3>Citizens</h3>
            <p>Request pickups, report illegal dumping, track schedules with real-time notifications and live tracking.</p>
            <div style={{ marginTop: '30px' }}>
              <Link 
                to="/register/citizen" 
                style={{
                  display: 'inline-block',
                  background: 'rgba(255,255,255,0.1)',
                  padding: '12px 30px',
                  borderRadius: '25px',
                  color: 'var(--primary)',
                  textDecoration: 'none',
                  fontWeight: '600',
                  transition: 'all 0.3s'
                }}
              >
                Login →
              </Link>
            </div>
          </div>

          <div className="feature-card">
            <div className="icon-container">
              <FaTruckLoading />
            </div>
            <h3>Collectors</h3>
            <p>View assigned requests, update job status in real-time, upload completion images, optimize routes.</p>
            <div style={{ marginTop: '30px' }}>
              <Link 
                to="/register/collector" 
                style={{
                  display: 'inline-block',
                  background: 'rgba(255,255,255,0.1)',
                  padding: '12px 30px',
                  borderRadius: '25px',
                  color: 'var(--primary)',
                  textDecoration: 'none',
                  fontWeight: '600',
                  transition: 'all 0.3s'
                }}
              >
                Login →
              </Link>
            </div>
          </div>

          <div className="feature-card">
            <div className="icon-container">
              <FaDatabase />
            </div>
            <h3>Admin</h3>
            <p>Manage users, approve requests, monitor system analytics, generate reports, and oversee operations.</p>
            <div style={{ marginTop: '30px' }}>
              <Link 
                to="/login" 
                style={{
                  display: 'inline-block',
                  background: 'rgba(255,255,255,0.1)',
                  padding: '12px 30px',
                  borderRadius: '25px',
                  color: 'var(--primary)',
                  textDecoration: 'none',
                  fontWeight: '600',
                  transition: 'all 0.3s'
                }}
              >
                Login →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* System Highlights */}
      <div style={{
        padding: '80px 20px',
        textAlign: 'center',
        background: 'rgba(0, 0, 0, 0.6)',
        backdropFilter: 'blur(10px)',
        borderTop: '1px solid rgba(255,255,255,0.1)',
        borderBottom: '1px solid rgba(255,255,255,0.1)'
      }}>
        <h2 style={{ fontSize: '2.5rem', marginBottom: '50px' }}>
          <FaChartLine style={{ marginRight: '15px' }} />
          System Highlights
        </h2>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '30px',
          maxWidth: '1200px',
          margin: '0 auto'
        }}>
          <div>
            <FaCheckCircle size={40} color="var(--primary)" />
            <h3 style={{ margin: '20px 0' }}>95% Efficiency</h3>
            <p>Collection rate improved by 40%</p>
          </div>
          <div>
            <FaLeaf size={40} color="var(--primary)" />
            <h3 style={{ margin: '20px 0' }}>30% Reduction</h3>
            <p>In landfill waste through recycling</p>
          </div>
          <div>
            <FaBell size={40} color="var(--primary)" />
            <h3 style={{ margin: '20px 0' }}>24/7 Support</h3>
            <p>Real-time notifications & alerts</p>
          </div>
          <div>
            <FaTruck size={40} color="var(--primary)" />
            <h3 style={{ margin: '20px 0' }}>Optimized Routes</h3>
            <p>AI-powered collection scheduling</p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-content">
          <div className="social-icons">
            <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="social-icon">
              <FaFacebook />
            </a>
            <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="social-icon">
              <FaTwitter />
            </a>
            <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="social-icon">
              <FaLinkedin />
            </a>
            <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="social-icon">
              <FaInstagram />
            </a>
          </div>
          
          <div className="footer-links">
            <Link to="/about">About Us</Link>
            <Link to="/contact">Contact</Link>
            <Link to="/privacy">Privacy Policy</Link>
            <Link to="/terms">Terms of Service</Link>
            <Link to="/careers">Careers</Link>
            <Link to="/blog">Blog</Link>
          </div>

          <p style={{ marginTop: '30px', opacity: 0.7 }}>
            © {new Date().getFullYear()} Smart Waste Management System v2.0
            <br />
            Revolutionizing urban waste management through technology
          </p>
        </div>
      </footer>
    </div>
  );
}

export default HomePage;