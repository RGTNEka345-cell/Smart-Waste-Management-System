import React, { useCallback, useEffect, useState } from "react";
import axios from "axios";
import "./AdminDumpingQueue.css";

const API = "http://localhost:5000/api";
const HOST = "http://localhost:5000";

export default function AdminDumpingQueue() {
  const token = localStorage.getItem("adminToken");
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [remarks, setRemarks] = useState({});

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API}/admin/illegal-dumping?status=PENDING_ADMIN`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      setRows(Array.isArray(res.data) ? res.data : []);
    } catch {
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  const approve = async (id) => {
    try {
      await axios.post(
        `${API}/admin/illegal-dumping/${id}/approve`,
        { remarks: remarks[id] || "" },
        { headers: token ? { Authorization: `Bearer ${token}` } : {} }
      );
      load();
    } catch {
      alert("Approve failed");
    }
  };

  const reject = async (id) => {
    try {
      await axios.post(
        `${API}/admin/illegal-dumping/${id}/reject`,
        { remarks: remarks[id] || "" },
        { headers: token ? { Authorization: `Bearer ${token}` } : {} }
      );
      load();
    } catch {
      alert("Reject failed");
    }
  };

  return (
    <div className="admin-dq">
      <div className="adq-top">
        <div className="adq-heading">
          <h2>Illegal Dumping Queue</h2>
          <p>Pending admin approvals</p>
        </div>
        <button className="adq-btn adq-btn-secondary adq-refresh" onClick={load} disabled={loading}>
          {loading ? "Loading..." : "Refresh"}
        </button>
      </div>

      <div className="adq-card">
        {loading ? (
          <div className="adq-muted">Loading...</div>
        ) : rows.length === 0 ? (
          <div className="adq-muted">No pending reports.</div>
        ) : (
          <div className="adq-list">
            {rows.map((r) => (
              <div className="adq-row" key={r.report_id}>
                <div className="adq-left">
                  <div className="adq-title">Report #{r.report_id} - {r.severity}</div>
                  <div className="adq-sub">Citizen: {r.citizen_name} ({r.citizen_phone || "-"})</div>
                  <div className="adq-sub">Title: {r.title || "-"}</div>
                  <div className="adq-sub">Description: {r.description || "-"}</div>
                  <div className="adq-sub">Address: {r.address || "-"}</div>
                  <div className="adq-sub">Coordinates: {r.latitude}, {r.longitude}</div>
                  <div className="adq-sub">Created: {r.created_at ? new Date(r.created_at).toLocaleString() : "-"}</div>

                  {Array.isArray(r.photos) && r.photos.length > 0 && (
                    <div className="adq-photos">
                      <div className="adq-photos-title">Citizen Photos</div>
                      <div className="adq-preview-grid">
                        {r.photos.map((p) => (
                          <a key={p.photo_id} href={`${HOST}${p.photo_url}`} target="_blank" rel="noreferrer">
                            <div className="adq-img-box">
                              <img src={`${HOST}${p.photo_url}`} alt="dumping" />
                            </div>
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="adq-right">
                  <input
                    className="adq-remark-input"
                    placeholder="Remarks (optional)"
                    value={remarks[r.report_id] || ""}
                    onChange={(e) => setRemarks({ ...remarks, [r.report_id]: e.target.value })}
                  />
                  <div className="adq-actions">
                    <button className="adq-btn adq-btn-success" onClick={() => approve(r.report_id)}>Approve</button>
                    <button className="adq-btn adq-btn-danger" onClick={() => reject(r.report_id)}>Reject</button>
                    <button
                      className="adq-btn adq-btn-secondary"
                      onClick={() => window.open(`https://www.google.com/maps?q=${r.latitude},${r.longitude}`, "_blank")}
                    >
                      Map
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
