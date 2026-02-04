import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./CollectorNavbar.css";
import {
  FaBars,
  FaTimes,
  FaUser,
  FaSignOutAlt,
  FaHome,
  FaInbox,
  FaTruck,
  FaHistory
} from "react-icons/fa";

const CollectorNavbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [collector, setCollector] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const stored =
      localStorage.getItem("collector") ||
      localStorage.getItem("collectorData");
    const data = stored ? JSON.parse(stored) : null;
    setCollector(data);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("collector");
    localStorage.removeItem("collectorData");
    localStorage.removeItem("collectorToken");
    localStorage.removeItem("collectorSession");
    navigate("/login/collector");
  };

  const vehicleImage = collector?.vehicle_photo
    ? `http://localhost:5000/uploads/collectors/${collector.vehicle_photo}`
    : "/default-user.png";

  const navItems = [
    { label: "Dashboard", icon: <FaHome />, path: "/collector/dashboard" },
    { label: "Pickup Offers", icon: <FaInbox />, path: "/collector/offers" },
    { label: "Active Job", icon: <FaTruck />, path: "/collector/job" },
    { label: "History", icon: <FaHistory />, path: "/collector/history" }
  ];

  return (
    <nav className="collector-navbar">
      {/* Logo */}
      <div className="nav-logo" onClick={() => navigate("/collector/dashboard")}>
        <div className="logo-icon">🚛</div>
        <h1 className="logo-text">
          <span className="logo-primary">Waste</span>
          <span className="logo-secondary">Wise</span>
        </h1>
      </div>

      {/* Mobile Menu Toggle */}
      <button
        className="mobile-menu-toggle"
        onClick={() => setIsMenuOpen(!isMenuOpen)}
        aria-label="Toggle menu"
      >
        {isMenuOpen ? <FaTimes /> : <FaBars />}
      </button>

      {/* Links */}
      <div className={`nav-links ${isMenuOpen ? "active" : ""}`}>
        {navItems.map((item, idx) => (
          <button
            key={idx}
            className="nav-link"
            onClick={() => {
              navigate(item.path);
              setIsMenuOpen(false);
            }}
          >
            <span className="nav-icon">{item.icon}</span>
            <span className="nav-label">{item.label}</span>
          </button>
        ))}
      </div>

      {/* Profile Dropdown */}
      <div className="profile-section">
        <div
          className="profile-trigger"
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        >
          <div className="profile-info">
            <span className="profile-name">
              {collector?.full_name?.split(" ")[0] || "Collector"}
            </span>
            <span className="profile-role">Collector</span>
          </div>

          <div className="profile-avatar">
            <img
              src={vehicleImage}
              alt="Vehicle"
              className="avatar-img"
              onError={(e) => (e.target.src = "/default-user.png")}
            />
          </div>
        </div>

        {isDropdownOpen && (
          <div className="dropdown-card">
            <div className="dropdown-header">
              <div className="dropdown-avatar">
                <img
                  src={vehicleImage}
                  alt="Vehicle"
                  className="dropdown-avatar-img"
                  onError={(e) => (e.target.src = "/default-user.png")}
                />
              </div>
              <div className="dropdown-user-info">
                <h4>{collector?.full_name || "Collector"}</h4>
                <p>{collector?.email || "collector@email.com"}</p>
              </div>
            </div>

            <div className="dropdown-divider"></div>

            <div className="dropdown-items">
              <Link
                to="/collector/profile/update"
                className="dropdown-item"
                onClick={() => setIsDropdownOpen(false)}
              >
                <FaUser className="dropdown-icon" />
                <span>My Profile</span>
              </Link>

              <button
                className="dropdown-item logout-btn"
                onClick={handleLogout}
              >
                <FaSignOutAlt className="dropdown-icon" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Backdrop */}
      {isMenuOpen && (
        <div className="menu-backdrop" onClick={() => setIsMenuOpen(false)} />
      )}
    </nav>
  );
};

export default CollectorNavbar;
