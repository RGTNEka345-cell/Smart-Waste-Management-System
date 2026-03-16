import React, { useCallback, useEffect, useState } from "react";
import axios from "axios";
import CollectorNavbar from "../../../components/Collector/CollectorNavbar";
import "./DumpingHistory.css";

const API = "http://localhost:5000/api";

export default function DumpingHistory() {
  const token = localStorage.getItem("collectorToken");
  const collectorData = JSON.parse(localStorage.getItem("collectorData") || "null");
  const collectorId = collectorData?.collector_id;

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const authHeaders = {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(collectorId ? { "x-collector-id": collectorId } : {})
    };

    try {
      setLoading(true);
      setError("");
      const res = await axios.get(`${API}/collector/illegal-dumping/history`, {
        params: collectorId ? { collector_id: collectorId } : {},
        headers: authHeaders
      });
      setRows(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load dumping history");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [collectorId, token]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <>
      <CollectorNavbar />
      <div className="dump-history">
        <div className="dh-top">
          <div>
            <h2>Dumping History</h2>
            <p className="dh-muted">Completed illegal dumping cleanups</p>
          </div>
          <button className="dh-btn dh-secondary" onClick={load} disabled={loading}>
            {loading ? "Loading..." : "Refresh"}
          </button>
        </div>

        <div className="dh-card">
          {error && <div className="dh-error">{error}</div>}
          {loading ? (
            <div className="dh-muted">Loading...</div>
          ) : rows.length === 0 ? (
            <div className="dh-muted">No completed dumping jobs yet.</div>
          ) : (
            <div className="dh-list">
              {rows.map((r) => (
                <div className="dh-row" key={r.report_id}>
                  <div className="dh-left">
                    <div className="dh-title">Report #{r.report_id} - {r.severity}</div>
                    <div className="dh-sub">{r.address || `${r.latitude}, ${r.longitude}`}</div>
                    <div className="dh-sub">
                      Accepted: {r.accepted_at ? new Date(r.accepted_at).toLocaleString() : "-"}
                    </div>
                    <div className="dh-sub">
                      Completed: {r.completed_at ? new Date(r.completed_at).toLocaleString() : new Date(r.updated_at).toLocaleString()}
                    </div>
                  </div>

                  <div className="dh-right">
                    <div className="dh-pill">Distance: {r.distance_km != null ? `${r.distance_km} km` : "-"}</div>
                    <div className="dh-pill">After Photos: {r.after_photo_count ?? 0}</div>
                    <button
                      className="dh-btn dh-map"
                      onClick={() => window.open(`https://www.google.com/maps?q=${r.latitude},${r.longitude}`, "_blank")}
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
