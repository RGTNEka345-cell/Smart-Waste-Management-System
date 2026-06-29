import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./CollectorNavbar.css";
import useSiteLogo from "../../hooks/useSiteLogo";
import CollectorNotifications from "./CollectorNotifications";
import {
  FaBars,
  FaTimes,
  FaUser,
  FaSignOutAlt,
  FaHome,
  FaInbox,
  FaTruck,
  FaHistory,
  FaLeaf,
  FaExclamationTriangle,
  FaChevronDown
} from "react-icons/fa";

const CollectorNavbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isDumpingMenuOpen, setIsDumpingMenuOpen] = useState(false);
  const [collector, setCollector] = useState(null);
  const navigate = useNavigate();
  const siteLogo = useSiteLogo();

  useEffect(() => {
    try {
      const stored =
        localStorage.getItem("collector") ||
        localStorage.getItem("collectorData");
      const data = stored ? JSON.parse(stored) : null;
      setCollector(data);
    } catch {
      setCollector(null);
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("collector");
    localStorage.removeItem("collectorData");
    localStorage.removeItem("collectorToken");
    localStorage.removeItem("collectorSession");
    navigate("/login/collector", { replace: true });
  };

  const resolveVehicleImage = (photo) => {
    if (!photo) return "/default-user.png";

    const value = String(photo).trim();
    if (!value) return "/default-user.png";
    if (/^https?:\/\//i.test(value)) return value;
    if (value.startsWith("/uploads/")) return `http://localhost:5000${value}`;
    if (value.startsWith("uploads/")) return `http://localhost:5000/${value}`;

    return `http://localhost:5000/uploads/collectors/${value}`;
  };

  const vehicleImage = resolveVehicleImage(collector?.vehicle_photo);
  const isGovernmentCollector =
    String(collector?.collection_type || "").toLowerCase() === "government";

  const navItems = [
    { label: "Dashboard", icon: <FaHome />, path: "/collector/dashboard" },
    { label: "Pickup Offers", icon: <FaInbox />, path: "/collector/offers" },
    { label: "Active Job", icon: <FaTruck />, path: "/collector/job" },
    { label: "Eco Tips", icon: <FaLeaf />, path: "/collector/eco-tips" },
    { label: "Pickup History", icon: <FaHistory />, path: "/collector/history" }
  ];

  return (
    <nav className="collector-navbar">
      {/* Logo */}
      <div className="nav-logo" onClick={() => navigate("/collector/dashboard")}>
        {siteLogo ? (
          <img className="logo-image" src={siteLogo} alt="Website Logo" />
        ) : (
          <div className="logo-icon">WW</div>
        )}
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
              setIsDumpingMenuOpen(false);
              setIsMenuOpen(false);
            }}
          >
            <span className="nav-icon">{item.icon}</span>
            <span className="nav-label">{item.label}</span>
          </button>
        ))}

        {isGovernmentCollector && (
        <div className={`nav-submenu ${isDumpingMenuOpen ? "open" : ""}`}>
          <button
            className="nav-link nav-submenu-trigger"
            onClick={() => setIsDumpingMenuOpen((prev) => !prev)}
          >
            <span className="nav-icon"><FaExclamationTriangle /></span>
            <span className="nav-label">Illegal Dumping</span>
            <FaChevronDown className="nav-submenu-arrow" />
          </button>

          <div className="nav-submenu-items">
            <button
              className="nav-sublink"
              onClick={() => {
                navigate("/collector/illegal-dumping/offers");
                setIsDumpingMenuOpen(false);
                setIsMenuOpen(false);
              }}
            >
              Dumping Offers
            </button>
            <button
              className="nav-sublink"
              onClick={() => {
                navigate("/collector/illegal-dumping/active");
                setIsDumpingMenuOpen(false);
                setIsMenuOpen(false);
              }}
            >
              Dumping Active
            </button>
            <button
              className="nav-sublink"
              onClick={() => {
                navigate("/collector/illegal-dumping/history");
                setIsDumpingMenuOpen(false);
                setIsMenuOpen(false);
              }}
            >
              Dumping History
            </button>
          </div>
        </div>
        )}
      </div>

      {/* Profile Dropdown */}
      <div className="profile-section">
        <CollectorNotifications />

        <div className="online-status" title="Online">
          <span className="online-dot" />
        </div>

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
