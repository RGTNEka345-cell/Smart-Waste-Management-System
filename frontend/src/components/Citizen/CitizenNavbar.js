import React, { useState, useEffect } from "react";
import axios from "axios";
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
  FaLeaf,
  FaBell,
  FaChevronDown
} from "react-icons/fa";

const CitizenNavbar = ({ setActiveTab }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isPickupOpen, setIsPickupOpen] = useState(false);
  const [isDumpOpen, setIsDumpOpen] = useState(false);
  const [citizen, setCitizen] = useState(null);
  const [latestLoading, setLatestLoading] = useState(false);
  const navigate = useNavigate();
  const token = localStorage.getItem("citizenToken");
  const API = "http://localhost:5000/api";

  useEffect(() => {
    const citizenData = JSON.parse(localStorage.getItem("citizen"));
    setCitizen(citizenData);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("citizen");
    localStorage.removeItem("citizenToken");
    localStorage.removeItem("citizenSession");
    navigate("/login/citizen", { replace: true });
  };

  const handleGoLatestRequest = async () => {
    if (latestLoading) return;
    try {
      setLatestLoading(true);
      const citizenId = citizen?.id;
      const res = await axios.get(`${API}/pickup-requests/my`, {
        params: citizenId ? { citizen_id: citizenId } : {},
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      const rows = Array.isArray(res.data) ? res.data : [];
      if (rows.length === 0) {
        alert("No pickup requests found.");
        return;
      }
      const latest = rows
        .slice()
        .sort((a, b) => new Date(b.requested_at) - new Date(a.requested_at))[0];
      if (!latest?.request_id) {
        alert("Latest request not found.");
        return;
      }
      navigate(`/citizen/pickup/${latest.request_id}`);
    } catch (err) {
      alert("Failed to load latest request.");
    } finally {
      setLatestLoading(false);
      setIsMenuOpen(false);
      setIsPickupOpen(false);
      setIsDumpOpen(false);
    }
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
      id: "tips",
      label: "Eco Tips",
      icon: <FaLeaf />,
      path: "/citizen/eco-tips"
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
      {/* ✅ Navigation Links (works for both tab + route) */}
<div className={`nav-links ${isMenuOpen ? "active" : ""}`}>
  {navItems.map((item) => (
    <button
      key={item.id}
      className="nav-link"
      onClick={() => {
        if (item.path) {
          navigate(item.path);
        } else {
          setActiveTab(item.id);
        }
        setIsMenuOpen(false);
        setIsPickupOpen(false);
        setIsDumpOpen(false);
      }}
    >
      <span className="nav-icon">{item.icon}</span>
      <span className="nav-label">{item.label}</span>
    </button>
  ))}

  <div className={`nav-dropdown ${isPickupOpen ? "open" : ""}`}>
    <button
      className="nav-link dropdown-trigger"
      onClick={() => {
        setIsPickupOpen(!isPickupOpen);
        setIsDumpOpen(false);
      }}
      aria-expanded={isPickupOpen}
    >
      <span className="nav-icon"><FaTrashAlt /></span>
      <span className="nav-label">Pickup Requests</span>
      <span className="nav-caret"><FaChevronDown /></span>
    </button>

          <div className="dropdown-menu">
            <button
              className="dropdown-link"
              onClick={() => {
                navigate("/citizen/pickup-request/create");
                setIsMenuOpen(false);
                setIsPickupOpen(false);
              }}
            >
              Create Request
            </button>
            <button
              className="dropdown-link"
              onClick={() => {
                navigate("/citizen/pickup/requests");
                setIsMenuOpen(false);
                setIsPickupOpen(false);
              }}
            >
              My Requests
            </button>
            <button
              className="dropdown-link"
              onClick={handleGoLatestRequest}
              disabled={latestLoading}
            >
              {latestLoading ? "Loading..." : "Latest Request"}
            </button>
          </div>
        </div>

        <div className={`nav-dropdown ${isDumpOpen ? "open" : ""}`}>
          <button
            className="nav-link dropdown-trigger"
            onClick={() => {
              setIsDumpOpen(!isDumpOpen);
              setIsPickupOpen(false);
            }}
            aria-expanded={isDumpOpen}
          >
            <span className="nav-icon"><FaMapMarkerAlt /></span>
            <span className="nav-label">Illegal Dumping</span>
            <span className="nav-caret"><FaChevronDown /></span>
          </button>

          <div className="dropdown-menu">
            <button
              className="dropdown-link"
              onClick={() => {
                navigate("/citizen/illegal-dumping/create");
                setIsMenuOpen(false);
                setIsPickupOpen(false);
                setIsDumpOpen(false);
              }}
            >
              Create Report
            </button>
            <button
              className="dropdown-link"
              onClick={() => {
                navigate("/citizen/illegal-dumping/my");
                setIsMenuOpen(false);
                setIsPickupOpen(false);
                setIsDumpOpen(false);
              }}
            >
              My Reports
            </button>
          </div>
        </div>
      </div>

      {/* Profile Dropdown */}
      <div className="profile-section">
        <div className="online-status" title="Online">
          <span className="online-dot" />
        </div>

        <Link
          to="/citizen/notifications"
          className="icon-btn"
          onClick={() => {
            setIsMenuOpen(false);
            setIsPickupOpen(false);
            setIsDumpOpen(false);
          }}
          aria-label="Notifications"
        >
          <FaBell />
        </Link>
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
          onClick={() => {
            setIsMenuOpen(false);
            setIsPickupOpen(false);
            setIsDumpOpen(false);
          }}
        />
      )}
    </nav>
  );
};

export default CitizenNavbar;
