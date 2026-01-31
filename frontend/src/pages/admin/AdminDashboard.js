import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AdminNavbar from "../../components/Admin/AdminNavbar";
import "./AdminDashboard.css";

const AdminDashboard = () => {
  const [admin, setAdmin] = useState(null);
  const [stats, setStats] = useState({ citizens: 0, collectors: 0 });
  const [loadingStats, setLoadingStats] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const storedAdmin = localStorage.getItem("admin");
    if (storedAdmin) {
      setAdmin(JSON.parse(storedAdmin));
    }
  }, []);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoadingStats(true);
        const token = localStorage.getItem("adminToken");
        const res = await fetch("http://localhost:5000/api/admin/stats", {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
        const data = await res.json();
        setStats({
          citizens: data?.citizens || 0,
          collectors: data?.collectors || 0
        });
      } catch (_) {
        setStats({ citizens: 0, collectors: 0 });
      } finally {
        setLoadingStats(false);
      }
    };
    fetchStats();
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

        <div className="admin-stats">
          <div className="stats-head">
            <h3>Live Counts</h3>
            {loadingStats && <span className="muted">Updating...</span>}
          </div>

          <div className="count-grid">
            <div className="count-card">
              <span className="count-label">Citizens</span>
              <span className="count-value">{stats.citizens}</span>
              <div className="mini-bar">
                <div
                  className="bar-fill blue"
                  style={{
                    width: `${Math.min(100, (stats.citizens / (stats.citizens + stats.collectors || 1)) * 100)}%`
                  }}
                />
              </div>
            </div>

            <div className="count-card">
              <span className="count-label">Collectors</span>
              <span className="count-value">{stats.collectors}</span>
              <div className="mini-bar">
                <div
                  className="bar-fill green"
                  style={{
                    width: `${Math.min(100, (stats.collectors / (stats.citizens + stats.collectors || 1)) * 100)}%`
                  }}
                />
              </div>
            </div>
          </div>

          <div className="bar-chart">
            <div className="bar-row">
              <span>Citizens</span>
              <div className="bar-track">
                <div
                  className="bar-fill blue"
                  style={{
                    width: `${Math.min(100, (stats.citizens / (Math.max(stats.citizens, stats.collectors) || 1)) * 100)}%`
                  }}
                />
              </div>
              <span className="bar-value">{stats.citizens}</span>
            </div>

            <div className="bar-row">
              <span>Collectors</span>
              <div className="bar-track">
                <div
                  className="bar-fill green"
                  style={{
                    width: `${Math.min(100, (stats.collectors / (Math.max(stats.citizens, stats.collectors) || 1)) * 100)}%`
                  }}
                />
              </div>
              <span className="bar-value">{stats.collectors}</span>
            </div>
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
