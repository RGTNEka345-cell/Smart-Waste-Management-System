import React, { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  FiHome,
  FiUserPlus,
  FiLogIn,
  FiInfo,
  FiMenu,
  FiX,
  FiChevronDown,
  FiUser,
  FiTruck,
  FiShield,
  FiChevronRight,
} from "react-icons/fi";
import { FaRecycle } from "react-icons/fa";
import "./Navbar.css";

const Navbar = () => {
  const location = useLocation();

  const [activeDropdown, setActiveDropdown] = useState(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  const dropdownRef = useRef(null);
  const mobileMenuRef = useRef(null);

  /* ================= Scroll Effect ================= */
  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  /* ================= Outside Click ================= */
  useEffect(() => {
    const handleClickOutside = (e) => {
      // Close dropdowns when clicking outside
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setActiveDropdown(null);
      }
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(e.target) && 
          !e.target.closest('.mobile-menu-toggle')) {
        setIsMobileMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const closeAll = () => {
    setActiveDropdown(null);
    setIsMobileMenuOpen(false);
  };

  const isActive = (path) => location.pathname === path;

  const registrationOptions = [
    {
      path: "/register/citizen",
      label: "Citizen",
      description: "Join as a citizen member",
      icon: <FiUser />,
      color: "#10B981",
    },
    {
      path: "/register/collector",
      label: "Collector",
      description: "Register as waste collector",
      icon: <FiTruck />,
      color: "#3B82F6",
    },
  ];

  const loginOptions = [
    {
      path: "/login/citizen",
      label: "Citizen",
      icon: <FiUser />,
      color: "#10B981",
    },
    {
      path: "/login/collector",
      label: "Collector",
      icon: <FiTruck />,
      color: "#3B82F6",
    },
    {
      path: "/login/admin",
      label: "Admin",
      icon: <FiShield />,
      color: "#8B5CF6",
    },
  ];

  return (
    <>
      {/* Navigation Bar */}
      <nav className={`navbar ${isScrolled ? "scrolled" : ""}`}>
        <div className="navbar-container">
          {/* Logo Section */}
          <div className="logo-section">
            <Link to="/" className="logo-link" onClick={closeAll}>
              <div className="logo-icon-wrapper">
                <FaRecycle size={28} className="logo-icon" />
              </div>
              <div className="logo-text">
                <span className="logo-main">WasteWise</span>
                <span className="logo-tagline">Smart Waste Management</span>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="desktop-navigation" ref={dropdownRef}>
            <ul className="nav-menu">
              <li className="nav-item">
                <Link 
                  className={`nav-link ${isActive("/") && "active"}`} 
                  to="/"
                  onClick={closeAll}
                >
                  <FiHome className="nav-icon" />
                  <span>Home</span>
                </Link>
              </li>

              {/* Register Dropdown */}
              <li className="nav-item dropdown-wrapper">
                <button
                  className={`nav-link dropdown-btn ${activeDropdown === "register" && "active"}`}
                  onClick={() => setActiveDropdown(activeDropdown === "register" ? null : "register")}
                >
                  <FiUserPlus className="nav-icon" />
                  <span>Register</span>
                  <FiChevronDown className={`dropdown-arrow ${activeDropdown === "register" ? "rotate" : ""}`} />
                </button>

                {activeDropdown === "register" && (
                  <div className="dropdown-menu register-dropdown">
                    <div className="dropdown-header">
                      <h4>Join WasteWise</h4>
                      <p>Select your role to get started</p>
                    </div>
                    <div className="registration-options">
                      {registrationOptions.map((option) => (
                        <Link
                          key={option.path}
                          to={option.path}
                          className="registration-option"
                          onClick={closeAll}
                          style={{ "--option-color": option.color }}
                        >
                          <div className="option-icon-wrapper">
                            <div className="option-icon" style={{ color: option.color }}>
                              {option.icon}
                            </div>
                          </div>
                          <div className="option-content">
                            <h5>{option.label}</h5>
                            <p>{option.description}</p>
                          </div>
                          <FiChevronRight className="option-arrow" />
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </li>

              {/* Login Dropdown */}
              <li className="nav-item dropdown-wrapper">
                <button
                  className={`nav-link dropdown-btn ${activeDropdown === "login" && "active"}`}
                  onClick={() => setActiveDropdown(activeDropdown === "login" ? null : "login")}
                >
                  <FiLogIn className="nav-icon" />
                  <span>Login</span>
                  <FiChevronDown className={`dropdown-arrow ${activeDropdown === "login" ? "rotate" : ""}`} />
                </button>

                {activeDropdown === "login" && (
                  <div className="dropdown-menu login-dropdown">
                    <div className="dropdown-header">
                      <h4>Welcome Back</h4>
                      <p>Sign in to your account</p>
                    </div>
                    <div className="login-options">
                      {loginOptions.map((option) => (
                        <Link
                          key={option.path}
                          to={option.path}
                          className="login-option"
                          onClick={closeAll}
                          style={{ "--option-color": option.color }}
                        >
                          <div className="login-option-icon" style={{ color: option.color }}>
                            {option.icon}
                          </div>
                          <span>{option.label} Login</span>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </li>

              <li className="nav-item">
                <Link 
                  className={`nav-link ${isActive("/about") && "active"}`} 
                  to="/about"
                  onClick={closeAll}
                >
                  <FiInfo className="nav-icon" />
                  <span>About</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Call to Action Button */}
          <div className="cta-section">
            <Link 
              to="/register/citizen" 
              className="btn btn-cta"
              onClick={closeAll}
            >
              <FiUserPlus />
              <span>Start Recycling</span>
            </Link>
          </div>

          {/* Mobile Menu Toggle */}
          <button 
            className="mobile-menu-toggle" 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <FiX size={24} /> : <FiMenu size={24} />}
          </button>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="mobile-menu-overlay">
          <div className="mobile-menu-container" ref={mobileMenuRef}>
            {/* Mobile Menu Header */}
            <div className="mobile-menu-header">
              <div className="mobile-logo">
                <FaRecycle size={24} />
                <span>WasteWise</span>
              </div>
              <button 
                className="mobile-menu-close"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <FiX size={24} />
              </button>
            </div>

            {/* Mobile Menu Items */}
            <div className="mobile-menu-items">
              <Link 
                to="/" 
                className="mobile-menu-item"
                onClick={closeAll}
              >
                <FiHome />
                <span>Home</span>
              </Link>

              {/* Register Section */}
              <div className="mobile-menu-section">
                <div className="mobile-section-title">
                  <FiUserPlus />
                  <span>Register</span>
                </div>
                {registrationOptions.map((option) => (
                  <Link
                    key={option.path}
                    to={option.path}
                    className="mobile-submenu-item"
                    onClick={closeAll}
                  >
                    <div className="mobile-option-icon" style={{ color: option.color }}>
                      {option.icon}
                    </div>
                    <div className="mobile-option-content">
                      <span className="mobile-option-title">{option.label}</span>
                      <span className="mobile-option-desc">{option.description}</span>
                    </div>
                  </Link>
                ))}
              </div>

              {/* Login Section */}
              <div className="mobile-menu-section">
                <div className="mobile-section-title">
                  <FiLogIn />
                  <span>Login</span>
                </div>
                {loginOptions.map((option) => (
                  <Link
                    key={option.path}
                    to={option.path}
                    className="mobile-submenu-item"
                    onClick={closeAll}
                  >
                    <div className="mobile-option-icon" style={{ color: option.color }}>
                      {option.icon}
                    </div>
                    <span>{option.label} Login</span>
                  </Link>
                ))}
              </div>

              <Link 
                to="/about" 
                className="mobile-menu-item"
                onClick={closeAll}
              >
                <FiInfo />
                <span>About</span>
              </Link>
            </div>

            {/* Mobile Call to Action */}
            <div className="mobile-cta-section">
              <Link 
                to="/register/citizen" 
                className="btn btn-cta btn-block"
                onClick={closeAll}
              >
                <FiUserPlus />
                <span>Start Recycling Now</span>
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Navbar;