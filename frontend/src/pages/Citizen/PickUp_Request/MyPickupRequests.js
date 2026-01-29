import React, { useEffect, useMemo, useState } from "react";
import CitizenNavbar from "../../../components/Citizen/CitizenNavbar";
import axios from "axios";
import { Link } from "react-router-dom";
import "./MyPickupRequests.css";

const API = "http://localhost:5000/api";

const statusLabel = (s) => {
  if (!s) return "-";
  const map = {
    PENDING_ADMIN: "Pending",
    APPROVED_ADMIN: "Approved",
    ASSIGNING: "Assigning",
    ACCEPTED_BY_COLLECTOR: "Accepted",
    IN_PROGRESS: "In Progress",
    COMPLETED: "Completed",
    REJECTED_ADMIN: "Rejected",
    CANCELLED_BY_CITIZEN: "Cancelled"
  };
  return map[s] || s;
};

const statusBadgeClass = (s) => {
  if (!s) return "badge";
  if (s === "PENDING_ADMIN") return "badge pending";
  if (s === "APPROVED_ADMIN" || s === "ASSIGNING") return "badge approved";
  if (s === "IN_PROGRESS" || s === "ACCEPTED_BY_COLLECTOR") return "badge progress";
  if (s === "COMPLETED") return "badge done";
  if (s === "REJECTED_ADMIN" || s === "CANCELLED_BY_CITIZEN") return "badge danger";
  return "badge";
};

const MyPickupRequests = () => {
  const [rows, setRows] = useState([]);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [loading, setLoading] = useState(true);

  const token = localStorage.getItem("citizenToken");
  const citizen = JSON.parse(localStorage.getItem("citizen") || "null");
  const citizenId = citizen?.id;

  const filtered = useMemo(() => {
    if (statusFilter === "ALL") return rows;
    if (statusFilter === "PENDING") return rows.filter(r => r.status === "PENDING_ADMIN");
    if (statusFilter === "APPROVED") return rows.filter(r => r.status === "APPROVED_ADMIN" || r.status === "ASSIGNING");
    if (statusFilter === "IN_PROGRESS") return rows.filter(r => r.status === "ACCEPTED_BY_COLLECTOR" || r.status === "IN_PROGRESS");
    if (statusFilter === "COMPLETED") return rows.filter(r => r.status === "COMPLETED");
    return rows;
  }, [rows, statusFilter]);

  useEffect(() => {
    const fetchMy = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`${API}/pickup-requests/my`, {
          params: citizenId ? { citizen_id: citizenId } : {},
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
        setRows(res.data || []);
      } catch (e) {
        setRows([]);
      } finally {
        setLoading(false);
      }
    };
    fetchMy();
  }, [token, citizenId]);

  return (
    <>
      <CitizenNavbar setActiveTab={() => {}} />
      <div className="mpr-wrap">
        <div className="mpr-head">
          <h2>My Pickup Requests</h2>

          <div className="mpr-filter">
            <label>Status</label>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="ALL">All</option>
              <option value="PENDING">Pending</option>
              <option value="APPROVED">Approved</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="COMPLETED">Completed</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="mpr-card">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="mpr-card">No pickup requests found.</div>
        ) : (
          <div className="mpr-table-card">
            <table className="mpr-table">
              <thead>
                <tr>
                  <th>Request ID</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Requested At</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr key={r.request_id}>
                    <td>#{r.request_id}</td>
                    <td>{r.request_type}</td>
                    <td>
                      <span className={statusBadgeClass(r.status)}>
                        {statusLabel(r.status)}
                      </span>
                    </td>
                    <td>{r.requested_at ? new Date(r.requested_at).toLocaleString() : "-"}</td>
                    <td className="mpr-actions">
                      <Link className="mpr-view" to={`/citizen/pickup/${r.request_id}`}>
                        View Details
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
};

export default MyPickupRequests;
