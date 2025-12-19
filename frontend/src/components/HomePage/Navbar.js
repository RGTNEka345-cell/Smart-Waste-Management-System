// Navbar.jsx - Professional Version
import React, { useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

import { 
  FiHome as Home,
  FiUserPlus as UserPlus,
  FiLogIn as LogIn,
  FiInfo as Info,
  FiMenu as Menu,
  FiX as X,
  FiChevronDown as ChevronDown,
  FiUser as User,
  FiTruck as Truck,
  FiShield as Shield,
  FiBell as Bell,
  FiLogOut as LogOut
} from 'react-icons/fi';
import { FaRecycle as Recycle } from 'react-icons/fa';
import "./Navbar.css";

function Navbar() {
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const dropdownRef = useRef(null);

  // Simulated auth state - replace with your actual auth logic
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user] = useState({ 
    name: "John Doe", 
    type: "citizen",
    avatar: null 
  });

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setActiveDropdown(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleDropdown = (dropdown) => {
    setActiveDropdown(activeDropdown === dropdown ? null : dropdown);
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeAll = () => {
    setActiveDropdown(null);
    setIsMobileMenuOpen(false);
  };

  const handleLogin = () => {
    // Replace with actual login logic
    setIsLoggedIn(true);
    closeAll();
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    closeAll();
    navigate("/");
  };

  const isActive = (path) => {
    return location.pathname === path;
  };

  const registrationOptions = [
    { 
      path: "/register/citizen", 
      label: "Citizen", 
      description: "Join as a citizen member",
      icon: <User size={18} />,
      color: "#10B981"
    },
    { 
      path: "/register/collector", 
      label: "Collector", 
      description: "Register as waste collector",
      icon: <Truck size={18} />,
      color: "#3B82F6"
    }
  ];

  const loginOptions = [
    { 
      path: "/login/citizen", 
      label: "Citizen Login", 
      description: "Access citizen dashboard",
      icon: <User size={16} />
    },
    { 
      path: "/login/collector", 
      label: "Collector Login", 
      description: "Access collector portal",
      icon: <Truck size={16} />
    },
    { 
      path: "/login/admin", 
      label: "Admin Login", 
      description: "Access admin panel",
      icon: <Shield size={16} />
    }
  ];

  return (
    <nav className={`navbar ${isScrolled ? 'scrolled' : ''}`}>
      <div className="navbar-container">
        {/* Logo Section */}
        <div className="logo-section">
          <Link to="/" className="logo-link" onClick={closeAll}>
            <div className="logo-icon">
              <Recycle size={28} />
            </div>
            <div className="logo-text">
              <span className="logo-main">WasteWise</span>
              <span className="logo-tagline">Smart Waste Management</span>
            </div>
          </Link>
        </div>

        {/* Desktop Navigation */}
        <div className="desktop-nav">
          <ul className="nav-menu">
            <li className="nav-item">
              <Link 
                to="/" 
                className={`nav-link ${isActive('/') ? 'active' : ''}`}
                onClick={closeAll}
              >
                <Home size={18} />
                <span>Home</span>
              </Link>
            </li>

            {/* Registration Dropdown */}
            <li 
              className={`nav-item dropdown ${activeDropdown === 'register' ? 'active' : ''}`}
              ref={dropdownRef}
            >
              <button 
                className="nav-link dropdown-toggle"
                onClick={() => toggleDropdown('register')}
              >
                <UserPlus size={18} />
                <span>Register</span>
                <ChevronDown size={14} className="dropdown-chevron" />
              </button>
              
              <div className="dropdown-menu register-dropdown">
                <div className="dropdown-header">
                  <h4>Join Our Platform</h4>
                  <p>Choose your role to get started</p>
                </div>
                
                <div className="registration-options">
                  {registrationOptions.map((option, index) => (
                    <Link 
                      key={index}
                      to={option.path}
                      className="registration-option"
                      onClick={closeAll}
                      style={{ '--option-color': option.color }}
                    >
                      <div className="option-icon" style={{ backgroundColor: `${option.color}15` }}>
                        {option.icon}
                      </div>
                      <div className="option-content">
                        <h5>{option.label}</h5>
                        <p>{option.description}</p>
                      </div>
                      <div className="option-arrow">
                        →
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </li>

            {/* Login Dropdown */}
            <li 
              className={`nav-item dropdown ${activeDropdown === 'login' ? 'active' : ''}`}
              ref={dropdownRef}
            >
              <button 
                className="nav-link dropdown-toggle"
                onClick={() => toggleDropdown('login')}
              >
                <LogIn size={18} />
                <span>Login</span>
                <ChevronDown size={14} className="dropdown-chevron" />
              </button>
              
              <div className="dropdown-menu login-dropdown">
                <div className="dropdown-header">
                  <h4>Access Your Account</h4>
                  <p>Select your account type</p>
                </div>
                
                <div className="login-options">
                  {loginOptions.map((option, index) => (
                    <Link 
                      key={index}
                      to={option.path}
                      className="login-option"
                      onClick={() => {
                        closeAll();
                        handleLogin();
                      }}
                    >
                      <div className="login-icon">
                        {option.icon}
                      </div>
                      <div className="login-content">
                        <h5>{option.label}</h5>
                        <p>{option.description}</p>
                      </div>
                    </Link>
                  ))}
                </div>
                
                <div className="dropdown-footer">
                  <p>Need help? <Link to="/contact">Contact Support</Link></p>
                </div>
              </div>
            </li>

            <li className="nav-item">
              <Link 
                to="/about" 
                className={`nav-link ${isActive('/about') ? 'active' : ''}`}
                onClick={closeAll}
              >
                <Info size={18} />
                <span>About</span>
              </Link>
            </li>
          </ul>
        </div>

        {/* User Actions */}
        <div className="user-actions">
          {isLoggedIn ? (
            <>
              <button className="notification-btn" aria-label="Notifications">
                <Bell size={20} />
                <span className="notification-badge">3</span>
              </button>
              
              <div className="user-profile">
                <div className="user-avatar">
                  {user.avatar ? (
                    <img src={user.avatar} alt={user.name} />
                  ) : (
                    <span>{user.name.charAt(0)}</span>
                  )}
                </div>
                <div className="user-info">
                  <span className="user-name">{user.name}</span>
                  <span className="user-role capitalize">{user.type}</span>
                </div>
                <button 
                  className="logout-btn"
                  onClick={handleLogout}
                  aria-label="Logout"
                >
                  <LogOut size={18} />
                </button>
              </div>
            </>
          ) : (
            <div className="auth-buttons">
              <Link 
                to="/register/citizen" 
                className="btn btn-primary"
                onClick={closeAll}
              >
                <User size={18} />
                <span>Get Started</span>
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button 
          className="mobile-menu-toggle"
          onClick={toggleMobileMenu}
          aria-label="Toggle menu"
        >
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu */}
      <div className={`mobile-menu ${isMobileMenuOpen ? 'active' : ''}`}>
        <div className="mobile-menu-header">
          <h3>Navigation</h3>
          <button 
            className="close-menu"
            onClick={closeAll}
            aria-label="Close menu"
          >
            <X size={24} />
          </button>
        </div>

        <div className="mobile-menu-content">
          <Link 
            to="/" 
            className={`mobile-nav-link ${isActive('/') ? 'active' : ''}`}
            onClick={closeAll}
          >
            <Home size={20} />
            <span>Home</span>
          </Link>

          <div className="mobile-section">
            <h4>Registration</h4>
            {registrationOptions.map((option, index) => (
              <Link 
                key={index}
                to={option.path}
                className="mobile-option"
                onClick={closeAll}
              >
                <div className="mobile-option-icon">
                  {option.icon}
                </div>
                <div className="mobile-option-content">
                  <h5>{option.label}</h5>
                  <p>{option.description}</p>
                </div>
              </Link>
            ))}
          </div>

          <div className="mobile-section">
            <h4>Login</h4>
            {loginOptions.map((option, index) => (
              <Link 
                key={index}
                to={option.path}
                className="mobile-option"
                onClick={() => {
                  closeAll();
                  handleLogin();
                }}
              >
                <div className="mobile-option-icon">
                  {option.icon}
                </div>
                <div className="mobile-option-content">
                  <h5>{option.label}</h5>
                  <p>{option.description}</p>
                </div>
              </Link>
            ))}
          </div>

          <Link 
            to="/about" 
            className={`mobile-nav-link ${isActive('/about') ? 'active' : ''}`}
            onClick={closeAll}
          >
            <Info size={20} />
            <span>About Us</span>
          </Link>

          {isLoggedIn && (
            <div className="mobile-user-section">
              <div className="mobile-user-info">
                <div className="mobile-user-avatar">
                  {user.avatar ? (
                    <img src={user.avatar} alt={user.name} />
                  ) : (
                    <span>{user.name.charAt(0)}</span>
                  )}
                </div>
                <div>
                  <h4>{user.name}</h4>
                  <p className="capitalize">{user.type}</p>
                </div>
              </div>
              <button 
                className="btn btn-outline"
                onClick={handleLogout}
              >
                <LogOut size={18} />
                <span>Logout</span>
              </button>
            </div>
          )}
        </div>

        {!isLoggedIn && (
          <div className="mobile-auth-actions">
            <Link 
              to="/register/citizen" 
              className="btn btn-primary btn-block"
              onClick={closeAll}
            >
              <UserPlus size={20} />
              <span>Start Free Trial</span>
            </Link>
          </div>
        )}
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="mobile-menu-overlay" onClick={closeAll} />
      )}
    </nav>
  );
}

export default Navbar;