import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  FiGrid,
  FiUsers,
  FiTrash2,
  FiTruck,
  FiBarChart2,
  FiBell,
  FiLogOut,
  FiMenu,
  FiX,
  FiChevronDown,
} from "react-icons/fi";
import "./AdminNavbar.css";

const AdminNavbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [pickupOpen, setPickupOpen] = useState(false);

  const isActive = (path) => location.pathname.startsWith(path);

  const logout = () => {
    // 🔐 Clear token here
    navigate("/login/admin");
  };

  return (
    <nav className="admin-navbar">
      <div className="admin-navbar-left">
        <button className="admin-menu-toggle" onClick={() => setMenuOpen(!menuOpen)}>
          {menuOpen ? <FiX /> : <FiMenu />}
        </button>

        <Link to="/admin/dashboard" className="admin-logo">
          WasteWise <span>Admin</span>
        </Link>
      </div>

      <ul className={`admin-nav-links ${menuOpen ? "open" : ""}`}>
        <li>
          <Link className={isActive("/admin/dashboard") ? "active" : ""} to="/admin/dashboard">
            <FiGrid /> Dashboard
          </Link>
        </li>

        <li>
          <Link className={isActive("/admin/users") ? "active" : ""} to="/admin/users">
            <FiUsers /> Users
          </Link>
        </li>

        <li>
          <Link className={isActive("/admin/waste-types") ? "active" : ""} to="/admin/waste-types">
            <FiTrash2 /> Waste Types
          </Link>
        </li>

        <li>
          <Link className={isActive("/admin/collector-approvals") ? "active" : ""} to="/admin/collector-approvals">
            <FiTruck /> Collector Approvals
          </Link>
        </li>

        <li className={`pickup-dropdown ${pickupOpen ? "open" : ""}`}>
          <button
            className="pickup-trigger"
            onClick={() => setPickupOpen(!pickupOpen)}
            type="button"
          >
            <span className="nav-icon"><FiTrash2 /></span>
            <span>Pickup Requests</span>
            <FiChevronDown className="caret" />
          </button>

          <div className="pickup-menu">
            <Link to="/admin/pickup-queue" onClick={() => setPickupOpen(false)}>
              Pickup Queue
            </Link>
            <Link to="/admin/pickup-requests" onClick={() => setPickupOpen(false)}>
              Pickup Request Details
            </Link>
          </div>
        </li>

        <li>
          <Link className={isActive("/admin/approval-history") ? "active" : ""} to="/admin/approval-history">
            <FiBarChart2 /> Approval History
          </Link>
        </li>

        <li>
          <Link className={isActive("/admin/reports") ? "active" : ""} to="/admin/reports">
            <FiBarChart2 /> Reports
          </Link>
        </li>
      </ul>

      <div className="admin-navbar-right">
        <Link className="icon-btn" to="/admin/notifications" aria-label="Notifications">
          <FiBell />
        </Link>

        <div className="admin-profile">
          <span className="admin-name">Admin</span>
          <button className="icon-btn" onClick={logout}>
            <FiLogOut />
          </button>
        </div>
      </div>
    </nav>
  );
};

export default AdminNavbar;
