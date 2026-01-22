import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./CitizenNavbar.css";
import { 
  FaBars,
  FaTimes,
  FaUser,
  FaSignOutAlt,
  FaHome,
  FaTrashAlt,
  FaMapMarkerAlt,
  FaHistory,
  FaLeaf
} from "react-icons/fa";

const CitizenNavbar = ({ setActiveTab }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [citizen, setCitizen] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const citizenData = JSON.parse(localStorage.getItem("citizen"));
    setCitizen(citizenData);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("citizen");
    localStorage.removeItem("citizenToken");
    navigate("/about");
  };

  const profileImage = citizen?.photo_url
    ? `http://localhost:5000${citizen.photo_url}`
    : "/default-user.png";

   /* ================= Navigation Items ================= */
  const navItems = [
    {
      id: "dashboard",
      label: "Dashboard",
      icon: <FaHome />
    },
    {
      id: "request",
      label: "Pickup Request",
      icon: <FaTrashAlt />
    },
    {
      id: "dumping",
      label: "Report Illegal Dumping",
      icon: <FaMapMarkerAlt />
    },
    {
      id: "tips",
      label: "Eco Tips",
      icon: <FaLeaf />
    },
    {
      id: "history",
      label: "History",
      icon: <FaHistory />
    }
  ];


  return (
    <nav className="citizen-navbar">
      {/* Logo Section */}
      <div className="nav-logo">
        <div className="logo-icon">🗑️</div>
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

      {/* Navigation Links */}
      <div className={`nav-links ${isMenuOpen ? "active" : ""}`}>
        {navItems.map((item) => (
          <button
            key={item.id}
            className="nav-link"
            onClick={() => {
              setActiveTab(item.id);
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
              {citizen?.full_name?.split(" ")[0] || "User"}
            </span>
            <span className="profile-role">Citizen</span>
          </div>
          <div className="profile-avatar">
            <img 
              src={profileImage} 
              alt="Profile" 
              className="avatar-img"
              onError={(e) => {
                e.target.src = "/default-user.png";
              }}
            />
          </div>
        </div>

        {/* Dropdown Menu */}
        {isDropdownOpen && (
          <div className="dropdown-card">
            <div className="dropdown-header">
              <div className="dropdown-avatar">
                <img 
                  src={profileImage} 
                  alt="Profile" 
                  className="dropdown-avatar-img"
                  onError={(e) => {
                    e.target.src = "/default-user.png";
                  }}
                />
              </div>
              <div className="dropdown-user-info">
                <h4>{citizen?.full_name || "User"}</h4>
                <p>{citizen?.email || "citizen@email.com"}</p>
              </div>
            </div>

            <div className="dropdown-divider"></div>

            <div className="dropdown-items">
              <Link 
                to="/citizen/profile/update" 
                className="dropdown-item"
                onClick={() => setIsDropdownOpen(false)}
              >
                <FaUser className="dropdown-icon" />
                <span>My Profile</span>
              </Link>
              
              
            </div>

            <div className="dropdown-divider"></div>

            <button 
              className="dropdown-item logout-btn"
              onClick={handleLogout}
            >
              <FaSignOutAlt className="dropdown-icon" />
              <span>Logout</span>
            </button>
          </div>
        )}
      </div>

      {/* Backdrop for mobile menu */}
      {isMenuOpen && (
        <div 
          className="menu-backdrop"
          onClick={() => setIsMenuOpen(false)}
        />
      )}
    </nav>
  );
};

export default CitizenNavbar;