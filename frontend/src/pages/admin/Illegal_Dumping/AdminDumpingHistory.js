import React, { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import AdminNavbar from "../../../components/Admin/AdminNavbar";
import "./AdminDumpingHistory.css";

const API = "http://localhost:5000/api";

const statusLabels = {
  REJECTED_ADMIN: "Rejected",
  APPROVED_ADMIN: "Approved",
  OFFERING: "Offering",
  ACCEPTED_BY_COLLECTOR: "Accepted",
  IN_PROGRESS: "In Progress",
  CLEANED: "Cleaned",
  COMPLETED: "Completed"
};

const statusOptions = [
  { value: "", label: "All processed" },
  { value: "REJECTED_ADMIN", label: "Rejected" },
  { value: "APPROVED_ADMIN", label: "Approved" },
  { value: "OFFERING", label: "Offering" },
  { value: "ACCEPTED_BY_COLLECTOR", label: "Accepted" },
  { value: "IN_PROGRESS", label: "In Progress" },
  { value: "CLEANED", label: "Cleaned" }
];

const formatDate = (value) => (value ? new Date(value).toLocaleString() : "-");

export default function AdminDumpingHistory() {
  const token = localStorage.getItem("adminToken");
  const [rows, setRows] = useState([]);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const res = await axios.get(`${API}/admin/illegal-dumping/history`, {
        params: status ? { status } : {},
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      setRows(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      setRows([]);
      setError(err?.response?.data?.message || "Failed to load illegal dumping history");
    } finally {
      setLoading(false);
    }
  }, [status, token]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <>
      <AdminNavbar />
      <div className="admin-dh">
        <div className="adh-top">
          <div className="adh-heading">
            <h2>Illegal Dumping History</h2>
            <p>Admin processed illegal dumping reports</p>
          </div>
          <div className="adh-actions">
            <select
              className="adh-filter"
              value={status}
              onChange={(event) => setStatus(event.target.value)}
            >
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <button className="adh-btn adh-secondary" onClick={load} disabled={loading}>
              {loading ? "Loading..." : "Refresh"}
            </button>
            <Link className="adh-btn adh-primary" to="/admin/illegal-dumping">
              Queue
            </Link>
          </div>
        </div>

        <div className="adh-card">
          {error && <div className="adh-error">{error}</div>}
          {loading ? (
            <div className="adh-muted">Loading...</div>
          ) : rows.length === 0 ? (
            <div className="adh-muted">No illegal dumping history found.</div>
          ) : (
            <div className="adh-list">
              {rows.map((row) => (
                <div className="adh-row" key={row.report_id}>
                  <div className="adh-main">
                    <div className="adh-title">
                      Report #{row.report_id} - {row.title || row.severity}
                    </div>
                    <div className="adh-sub">Citizen: {row.citizen_name} ({row.citizen_phone || "-"})</div>
                    <div className="adh-sub">Description: {row.description || "-"}</div>
                    <div className="adh-sub">Address: {row.address || "-"}</div>
                    <div className="adh-sub">Coordinates: {row.latitude}, {row.longitude}</div>
                    <div className="adh-sub">Collector: {row.collector_name || "-"}</div>
                    <div className="adh-sub">Admin Remarks: {row.admin_remarks || "-"}</div>
                    <div className="adh-dates">
                      <span>Created: {formatDate(row.created_at)}</span>
                      <span>Approved: {formatDate(row.approved_at)}</span>
                      <span>Rejected: {formatDate(row.rejected_at)}</span>
                      <span>Completed: {formatDate(row.completed_at)}</span>
                    </div>
                  </div>

                  <div className="adh-side">
                    <span className={`adh-status adh-status-${String(row.status).toLowerCase()}`}>
                      {statusLabels[row.status] || row.status}
                    </span>
                    <span className="adh-pill">Before Photos: {row.before_photo_count ?? 0}</span>
                    <span className="adh-pill">After Photos: {row.after_photo_count ?? 0}</span>
                    <span className="adh-pill">
                      Distance: {row.distance_km != null ? `${row.distance_km} km` : "-"}
                    </span>
                    <button
                      className="adh-btn adh-map"
                      onClick={() => window.open(`https://www.google.com/maps?q=${row.latitude},${row.longitude}`, "_blank")}
                    >
                      Map
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
