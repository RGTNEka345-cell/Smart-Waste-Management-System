import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AdminNavbar from "../../components/Admin/AdminNavbar";
import "./AdminDashboard.css";

const AdminDashboard = () => {
  const [admin, setAdmin] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const storedAdmin = localStorage.getItem("admin");
    if (storedAdmin) {
      setAdmin(JSON.parse(storedAdmin));
    }
  }, []);

  if (!admin) {
    return (
      <div className="unauthorized">
        <h2>Unauthorized Access</h2>
        <p>Please login as an administrator.</p>
      </div>
    );
  }

  return (
    <>
      <AdminNavbar />

      <div className="admin-dashboard">
        <div className="admin-hero">
          <div>
            <p className="hero-kicker">Admin Overview</p>
            <h1>Welcome back, {admin.fullname}</h1>
            <p className="hero-sub">
              Monitor pickup flow, approvals, and system status at a glance.
            </p>
          </div>
          <div className="hero-actions">
            <button
              className="btn-primary"
              onClick={() => navigate("/admin/pickup-queue")}
            >
              Open Pickup Queue
            </button>
            <button
              className="btn-secondary"
              onClick={() => navigate("/admin/collector-approvals")}
            >
              Collector Approvals
            </button>
          </div>
        </div>

        <div className="stat-grid">
          <div className="stat-card">
            <span className="stat-label">Admin ID</span>
            <span className="stat-value">{admin.admin_id}</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">Role</span>
            <span className="stat-value">{admin.role}</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">System Status</span>
            <span className="stat-value status-active">Active</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">Last Login</span>
            <span className="stat-value">{new Date().toLocaleDateString()}</span>
          </div>
        </div>

        <div className="admin-actions">
          <Link className="action-card" to="/admin/pickup-queue">
            <h3>Pickup Requests</h3>
            <p>Review and approve new pickup requests.</p>
          </Link>
          <Link className="action-card" to="/admin/collector-approvals">
            <h3>Collector Approvals</h3>
            <p>Approve or reject new collectors.</p>
          </Link>
          <Link className="action-card" to="/admin/waste-types">
            <h3>Waste Types</h3>
            <p>Manage categories used in requests.</p>
          </Link>
          <Link className="action-card" to="/admin/notifications">
            <h3>Notifications</h3>
            <p>View recent system notifications.</p>
          </Link>
        </div>
      </div>
    </>
  );
};

export default AdminDashboard;
