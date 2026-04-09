import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  FiGrid,
  FiUsers,
  FiTrash2,
  FiTruck,
  FiBarChart2,
  FiBell,
  FiUser,
  FiUserPlus,
  FiLogOut,
  FiBookOpen,
  FiAlertTriangle,
  FiMenu,
  FiX,
  FiChevronDown,
  FiSettings,
} from "react-icons/fi";
import useSiteLogo from "../../hooks/useSiteLogo";
import "./AdminNavbar.css";

const AdminNavbar = () => {
  const location = useLocation();
  const [admin, setAdmin] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [pickupOpen, setPickupOpen] = useState(false);
  const [collectorsOpen, setCollectorsOpen] = useState(false);
  const [citizensOpen, setCitizensOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [avatarFailed, setAvatarFailed] = useState(false);
  const siteLogo = useSiteLogo();

  useEffect(() => {
    const stored = localStorage.getItem("admin");
    setAdmin(stored ? JSON.parse(stored) : null);
  }, []);

  useEffect(() => {
    document.body.classList.add("admin-body");
    return () => {
      document.body.classList.remove("admin-body");
    };
  }, []);

  const closeAllDropdowns = () => {
    setPickupOpen(false);
    setCollectorsOpen(false);
    setCitizensOpen(false);
    setProfileOpen(false);
  };

  const isActive = (path) => location.pathname.startsWith(path);

  const logout = () => {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("admin");
    localStorage.removeItem("adminId");
    localStorage.removeItem("adminSession");
    window.location.href = "/login/admin";
  };

  const resolveAdminImage = (photo) => {
    if (!photo) return "/default-user.png";
    const value = String(photo).trim();
    if (!value) return "/default-user.png";
    if (/^https?:\/\//i.test(value)) return value;
    if (value.startsWith("/uploads/")) return `http://localhost:5000${value}`;
    if (value.startsWith("uploads/")) return `http://localhost:5000/${value}`;
    return `http://localhost:5000/uploads/admins/${value}`;
  };

  const adminImage = resolveAdminImage(admin?.photo);
  const adminInitial = (admin?.fullname || "A").trim().charAt(0).toUpperCase();

  useEffect(() => {
    setAvatarFailed(false);
  }, [adminImage]);

  return (
    <nav className="admin-navbar">
      <div className="admin-navbar-left">
        <button className="admin-menu-toggle" onClick={() => setMenuOpen(!menuOpen)}>
          {menuOpen ? <FiX /> : <FiMenu />}
        </button>

        <Link to="/admin/dashboard" className="admin-logo">
          {siteLogo ? (
            <img className="admin-logo-image" src={siteLogo} alt="Website Logo" />
          ) : (
            <span className="admin-logo-mark">WW</span>
          )}
          <span className="admin-logo-text">WasteWise</span>
          <span className="admin-logo-role">Admin</span>
        </Link>
      </div>

      <div className="admin-nav-top">
        <div className="online-status" title="Online">
          <span className="online-dot" />
          <span className="online-text">Online</span>
        </div>

        <Link className="icon-btn" to="/admin/notifications" aria-label="Notifications">
          <FiBell />
        </Link>

        <div className="admin-profile">
          <button
            className="admin-profile-trigger"
            onClick={() => {
              setProfileOpen(!profileOpen);
              setPickupOpen(false);
              setCollectorsOpen(false);
              setCitizensOpen(false);
            }}
            type="button"
          >
            {avatarFailed ? (
              <span className="admin-avatar-fallback">{adminInitial}</span>
            ) : (
              <img
                src={adminImage}
                alt="Admin"
                className="admin-avatar"
                onError={() => setAvatarFailed(true)}
              />
            )}
            <span className="admin-name">{admin?.fullname || "Admin"}</span>
            <FiChevronDown className="caret" />
          </button>

          {profileOpen && (
            <div className="admin-profile-menu">
              <Link
                to="/admin/profile/update"
                onClick={() => {
                  setProfileOpen(false);
                  closeAllDropdowns();
                }}
              >
                <FiUser /> Admin Profile Update
              </Link>
              {admin?.role === "main_admin" && (
                <Link
                  to="/admin/sub-admins/create"
                  onClick={() => {
                    setProfileOpen(false);
                    closeAllDropdowns();
                  }}
                >
                  <FiUserPlus /> Create Sub Admin
                </Link>
              )}
              <button type="button" onClick={logout}>
                <FiLogOut /> Logout
              </button>
            </div>
          )}
        </div>
      </div>

      <ul className={`admin-nav-links ${menuOpen ? "open" : ""}`}>
        <li>
          <Link className={isActive("/admin/dashboard") ? "active" : ""} to="/admin/dashboard">
            <FiGrid /> Dashboard
          </Link>
        </li>

        <li className={`citizens-dropdown ${citizensOpen ? "open" : ""}`}>
          <button
            className="citizens-trigger"
            onClick={() => {
              setCitizensOpen(!citizensOpen);
              setCollectorsOpen(false);
              setPickupOpen(false);
              setProfileOpen(false);
            }}
            type="button"
          >
            <span className="nav-icon"><FiUsers /></span>
            <span>Citizens</span>
            <FiChevronDown className="caret" />
          </button>

          <div className="citizens-menu">
            <Link
              to="/admin/citizens"
              onClick={() => {
                setCitizensOpen(false);
                closeAllDropdowns();
              }}
            >
              Citizen Details
            </Link>
          </div>
        </li>

        <li>
          <Link className={isActive("/admin/waste-types") ? "active" : ""} to="/admin/waste-types">
            <FiTrash2 /> Waste Types
          </Link>
        </li>

        <li className={`collectors-dropdown ${collectorsOpen ? "open" : ""}`}>
          <button
            className="collectors-trigger"
            onClick={() => {
              setCollectorsOpen(!collectorsOpen);
              setCitizensOpen(false);
              setPickupOpen(false);
              setProfileOpen(false);
            }}
            type="button"
          >
            <span className="nav-icon"><FiTruck /></span>
            <span>Collectors</span>
            <FiChevronDown className="caret" />
          </button>

          <div className="collectors-menu">
            <Link
              to="/admin/collector-approvals"
              onClick={() => {
                setCollectorsOpen(false);
                closeAllDropdowns();
              }}
            >
              Collector Approvals
            </Link>
            <Link
              to="/admin/approval-history"
              onClick={() => {
                setCollectorsOpen(false);
                closeAllDropdowns();
              }}
            >
              Approval History
            </Link>
          </div>
        </li>

        <li className={`pickup-dropdown ${pickupOpen ? "open" : ""}`}>
          <button
            className="pickup-trigger"
            onClick={() => {
              setPickupOpen(!pickupOpen);
              setCitizensOpen(false);
              setCollectorsOpen(false);
              setProfileOpen(false);
            }}
            type="button"
          >
            <span className="nav-icon"><FiTrash2 /></span>
            <span>Pickup Requests</span>
            <FiChevronDown className="caret" />
          </button>

          <div className="pickup-menu">
            <Link
              to="/admin/pickup-queue"
              onClick={() => {
                setPickupOpen(false);
                closeAllDropdowns();
              }}
            >
              Pickup Queue
            </Link>
            <Link
              to="/admin/pickup-requests"
              onClick={() => {
                setPickupOpen(false);
                closeAllDropdowns();
              }}
            >
              Pickup Request Details
            </Link>
          </div>
        </li>

        <li>
          <Link className={isActive("/admin/reports") ? "active" : ""} to="/admin/reports">
            <FiBarChart2 /> Reports
          </Link>
        </li>

        <li>
          <Link className={isActive("/admin/eco-tips") ? "active" : ""} to="/admin/eco-tips/add">
            <FiBookOpen /> Eco Tips
          </Link>
        </li>

        <li>
          <Link className={isActive("/admin/illegal-dumping") ? "active" : ""} to="/admin/illegal-dumping">
            <FiAlertTriangle /> Illegal Dumping
          </Link>
        </li>

        <li>
          <Link className={isActive("/admin/website-settings") ? "active" : ""} to="/admin/website-settings">
            <FiSettings /> Website Setting
          </Link>
        </li>
      </ul>

    </nav>
  );
};

export default AdminNavbar;
