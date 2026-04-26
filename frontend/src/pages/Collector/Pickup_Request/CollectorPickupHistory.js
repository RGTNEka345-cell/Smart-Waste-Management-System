import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import CollectorNavbar from "../../../components/Collector/CollectorNavbar";
import "./CollectorPickupHistory.css";

const API = "http://localhost:5000/api";

const CollectorPickupHistory = () => {
  const token = localStorage.getItem("collectorToken");
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [sortBy, setSortBy] = useState("NEWEST");
  const [expanded, setExpanded] = useState({});

  useEffect(() => {
    const load = async () => {
      if (!token) {
        setError("Unauthorized");
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        setError("");
        const res = await axios.get(`${API}/collector/pickup/history`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setRows(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        setError(err?.response?.data?.message || "Failed to load pickup history");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [token]);

  const filteredRows = useMemo(() => {
    const q = query.trim().toLowerCase();

    const base = rows.filter((r) => {
      const typeOk = typeFilter === "ALL" || r.request_type === typeFilter;
      if (!typeOk) return false;

      if (!q) return true;

      const hay = [
        r.request_id,
        r.citizen_name,
        r.citizen_phone,
        r.citizen_email,
        r.pickup_address,
        r.request_type,
        r.target_collection_type,
        r.job_status
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return hay.includes(q);
    });

    base.sort((a, b) => {
      const ta = new Date(a.completed_at || a.request_completed_at || 0).getTime();
      const tb = new Date(b.completed_at || b.request_completed_at || 0).getTime();
      if (sortBy === "OLDEST") return ta - tb;
      if (sortBy === "POINTS") return (b.earned_points || 0) - (a.earned_points || 0);
      return tb - ta;
    });

    return base;
  }, [rows, query, typeFilter, sortBy]);

  const totals = useMemo(() => {
    const completedCount = filteredRows.length;
    const totalPhotos = filteredRows.reduce((sum, r) => sum + Number(r.photo_count || 0), 0);
    const totalPoints = filteredRows.reduce((sum, r) => sum + Number(r.earned_points || 0), 0);
    return { completedCount, totalPhotos, totalPoints };
  }, [filteredRows]);

  const fmt = (value) => (value ? new Date(value).toLocaleString() : "-");
  const toImageUrl = (path) => {
    if (!path) return "";
    if (/^https?:\/\//i.test(path)) return path;
    if (path.startsWith("/")) return `http://localhost:5000${path}`;
    return `http://localhost:5000/${path}`;
  };

  const toggleExpanded = (requestId) => {
    setExpanded((prev) => ({ ...prev, [requestId]: !prev[requestId] }));
  };

  return (
    <>
      <CollectorNavbar />
      <div className="collector-pickup-history">
        <div className="cph-card">
          <div className="cph-top">
            <h2>Pickup History</h2>
            <p>Completed pickup jobs assigned to you with full details</p>
          </div>

          <div className="cph-toolbar">
            <input
              className="cph-input"
              type="text"
              placeholder="Search by request id, citizen, address..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <select
              className="cph-select"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              <option value="ALL">All Types</option>
              <option value="NORMAL">Normal</option>
              <option value="SPECIAL">Special</option>
            </select>
            <select
              className="cph-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="NEWEST">Newest First</option>
              <option value="OLDEST">Oldest First</option>
              <option value="POINTS">Highest Points</option>
            </select>
          </div>

          <div className="cph-summary">
            <div className="cph-summary-card">
              <span>Completed Jobs</span>
              <strong>{totals.completedCount}</strong>
            </div>
            <div className="cph-summary-card">
              <span>Total Photos</span>
              <strong>{totals.totalPhotos}</strong>
            </div>
            <div className="cph-summary-card">
              <span>Earned Points</span>
              <strong>{totals.totalPoints}</strong>
            </div>
          </div>

          {loading && <p className="cph-muted">Loading history...</p>}
          {!loading && error && <p className="cph-error">{error}</p>}
          {!loading && !error && filteredRows.length === 0 && (
            <p className="cph-muted">No matching pickup history found.</p>
          )}

          {!loading && !error && filteredRows.length > 0 && (
            <div className="cph-list">
              {filteredRows.map((r) => (
                <div className="cph-row" key={`${r.job_id || "nojob"}-${r.request_id}`}>
                  <div className="cph-row-main">
                    <div className="cph-left">
                      <div className="cph-title">
                        Request #{r.request_id} <span className="cph-pill">{r.request_type}</span>
                        <span className="cph-pill secondary">{r.target_collection_type}</span>
                      </div>
                      <div className="cph-sub">{r.pickup_address || "-"}</div>
                      <div className="cph-sub">Citizen: {r.citizen_name || "Unknown"}</div>
                    </div>
                    <div className="cph-right">
                      <div>Completed: {fmt(r.completed_at || r.request_completed_at)}</div>
                      <div>Photos: {r.photo_count || 0}</div>
                      <div>Points: +{r.earned_points || 0}</div>
                      <div>Status: {r.job_status}</div>
                    </div>
                  </div>

                  <div className="cph-row-actions">
                    <button
                      className="cph-btn"
                      onClick={() => toggleExpanded(r.request_id)}
                    >
                      {expanded[r.request_id] ? "Hide Details" : "View Details"}
                    </button>
                    {r.pickup_latitude && r.pickup_longitude && (
                      <button
                        className="cph-btn secondary"
                        onClick={() =>
                          window.open(
                            `https://www.google.com/maps/dir/?api=1&destination=${r.pickup_latitude},${r.pickup_longitude}`,
                            "_blank"
                          )
                        }
                      >
                        Open Map
                      </button>
                    )}
                  </div>

                  {expanded[r.request_id] && (
                    <div className="cph-details">
                      <div className="cph-detail-grid">
                        <div>
                          <h4>Timeline</h4>
                          <p>Requested: {fmt(r.requested_at)}</p>
                          <p>Accepted: {fmt(r.accepted_at || r.offer_responded_at)}</p>
                          <p>Started: {fmt(r.started_at || r.request_started_at)}</p>
                          <p>Completed: {fmt(r.completed_at || r.request_completed_at)}</p>
                        </div>
                        <div>
                          <h4>Citizen Contact</h4>
                          <p>Name: {r.citizen_name || "-"}</p>
                          <p>Phone: {r.citizen_phone || "-"}</p>
                          <p>Email: {r.citizen_email || "-"}</p>
                        </div>
                        <div>
                          <h4>Job Info</h4>
                          <p>Distance: {r.distance_km != null ? `${r.distance_km} km` : "-"}</p>
                          <p>Request Note: {r.request_note || "-"}</p>
                          <p>Collector Note: {r.collector_notes || "-"}</p>
                        </div>
                      </div>

                      <div className="cph-detail-block">
                        <h4>Waste Items</h4>
                        {Array.isArray(r.items) && r.items.length > 0 ? (
                          <ul className="cph-items">
                            {r.items.map((item) => (
                              <li key={item.item_id}>
                                {item.wastetype_name || `Waste #${item.wastetype_id}`}
                                {item.quantity != null ? ` - ${item.quantity}` : ""}
                                {item.unit ? ` ${item.unit}` : ""}
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="cph-muted">No special item details.</p>
                        )}
                      </div>

                      <div className="cph-detail-block">
                        <h4>Completion Photos</h4>
                        {Array.isArray(r.photos) && r.photos.length > 0 ? (
                          <div className="cph-photo-grid">
                            {r.photos.map((photo) => (
                              <button
                                type="button"
                                key={photo.image_id}
                                className="cph-photo-btn"
                                onClick={() => window.open(toImageUrl(photo.image_url), "_blank")}
                              >
                                <img src={toImageUrl(photo.image_url)} alt={`Pickup ${r.request_id}`} />
                              </button>
                            ))}
                          </div>
                        ) : (
                          <p className="cph-muted">No photos uploaded.</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default CollectorPickupHistory;
