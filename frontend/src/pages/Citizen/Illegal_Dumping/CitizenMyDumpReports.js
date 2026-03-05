import React, { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./CitizenMyDumpReports.css";

const API = "http://localhost:5000/api";

export default function CitizenMyDumpReports() {
  const token = localStorage.getItem("citizenToken");
  const citizen = JSON.parse(localStorage.getItem("citizen") || "null");
  const nav = useNavigate();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API}/illegal-dumping/my`, {
        params: citizen?.id ? { citizen_id: citizen.id } : {},
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      setRows(Array.isArray(res.data) ? res.data : []);
    } catch {
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [citizen?.id, token]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="citizen-dump-list">
      <div className="cmr-top">
        <div className="cmr-heading">
          <h2>My Dumping Reports</h2>
          <p>Track admin approval and cleanup status.</p>
        </div>
        <button className="cmr-btn cmr-btn-secondary" onClick={load} disabled={loading}>
          {loading ? "Loading..." : "Refresh"}
        </button>
      </div>

      <div className="cmr-card">
        {loading ? (
          <div className="cmr-muted">Loading...</div>
        ) : rows.length === 0 ? (
          <div className="cmr-muted">No reports yet.</div>
        ) : (
          <div className="cmr-list">
            {rows.map((r) => (
              <div className="cmr-row" key={r.report_id}>
                <div className="cmr-left">
                  <div className="cmr-title">Report #{r.report_id} - {r.severity}</div>
                  <div className="cmr-sub">{r.address || `${r.latitude}, ${r.longitude}`}</div>
                  <div className="cmr-sub">Status: {r.status} - {new Date(r.created_at).toLocaleString()}</div>
                </div>
                <div className="cmr-actions">
                  <button className="cmr-btn cmr-btn-primary" onClick={() => nav(`/citizen/dumping/${r.report_id}`)}>
                    View
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
