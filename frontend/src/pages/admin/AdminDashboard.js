import { useEffect, useState } from "react";
import AdminNavbar from "../../components/Admin/AdminNavbar";
import "./AdminDashboard.css";

const AdminDashboard = () => {
  const [admin, setAdmin] = useState(null);

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
        <div className="dashboard-header">
          <h2>Welcome, {admin.fullname} 👋</h2>
          <p>Manage the WasteWise Smart Waste Management System</p>
        </div>

        <div className="dashboard-cards">
          <div className="dashboard-card">
            <h4>Admin ID</h4>
            <p>{admin.admin_id}</p>
          </div>

          <div className="dashboard-card">
            <h4>Role</h4>
            <p>{admin.role}</p>
          </div>

          <div className="dashboard-card">
            <h4>System Status</h4>
            <p className="status-active">Active</p>
          </div>

          <div className="dashboard-card">
            <h4>Last Login</h4>
            <p>{new Date().toLocaleDateString()}</p>
          </div>
        </div>
      </div>
    </>
  );
};

export default AdminDashboard;
