import React, { useEffect, useState, useCallback, useMemo } from "react";
import axios from "axios";
import AdminNavbar from "../../../components/Admin/AdminNavbar";
import "./AdminPickupQueue.css";

// ✅ Use .env (fallback to localhost)
const API = process.env.REACT_APP_API_URL || "http://localhost:5000/api";
const BASE_URL = API.replace("/api", ""); // => http://localhost:5000

const AdminPickupQueue = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rejectRemarks, setRejectRemarks] = useState({});
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const adminToken = localStorage.getItem("adminToken");

  const authHeaders = useMemo(() => {
    return adminToken ? { Authorization: `Bearer ${adminToken}` } : {};
  }, [adminToken]);

  const fetchPending = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API}/admin/pickup-requests/pending`, {
        headers: authHeaders
      });
      setRequests(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("fetchPending error:", err?.response?.data || err.message);
      setRequests([]);
    } finally {
      setLoading(false);
    }
  }, [authHeaders]);

  /* ================= FETCH PENDING REQUESTS ================= */
  useEffect(() => {
    fetchPending();
  }, [fetchPending]);

  /* ================= APPROVE ================= */
  const approveRequest = async (requestId) => {
    const ok = window.confirm("Approve this pickup request?");
    if (!ok) return;

    try {
      await axios.post(
        `${API}/admin/pickup-requests/${requestId}/approve`,
        {},
        { headers: authHeaders }
      );
      fetchPending();
    } catch (err) {
      console.error("approve error:", err?.response?.data || err.message);
      alert("Approve failed");
    }
  };

  /* ================= REJECT ================= */
  const rejectRequest = async (requestId) => {
    const remarks = rejectRemarks[requestId];
    if (!remarks || remarks.trim() === "") {
      alert("Please enter reject remarks");
      return;
    }

    const ok = window.confirm("Reject this pickup request?");
    if (!ok) return;

    try {
      await axios.post(
        `${API}/admin/pickup-requests/${requestId}/reject`,
        { remarks },
        { headers: authHeaders }
      );
      fetchPending();
    } catch (err) {
      console.error("reject error:", err?.response?.data || err.message);
      alert("Reject failed");
    }
  };

  /* ================= FILTER ================= */
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();

    return requests.filter((r) => {
      const matchType = typeFilter === "ALL" || r.request_type === typeFilter;

      if (!q) return matchType;

      const hay = [
        r.request_id,
        r.request_type,
        r.citizen_name,
        r.citizen_email,
        r.pickup_address
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return matchType && hay.includes(q);
    });
  }, [requests, search, typeFilter]);

  if (loading) {
    return (
      <>
        <AdminNavbar />
        <div className="apq-container">Loading...</div>
      </>
    );
  }

  return (
    <>
      <AdminNavbar />
      <div className="apq-container">
        <div className="apq-top">
          <h2>Pickup Requests Queue</h2>

        <div className="apq-filters">
          <input
            className="apq-search"
            placeholder="Search by ID, citizen, email, address..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <select
            className="apq-select"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          >
            <option value="ALL">All Types</option>
            <option value="NORMAL">Normal</option>
            <option value="SPECIAL">Special</option>
          </select>

        </div>

        {/* Map preview removed for now; open in Google Maps link used */}
      </div>

        {filtered.length === 0 ? (
          <div className="apq-empty">No pending pickup requests</div>
        ) : (
          <div className="apq-list">
            {filtered.map((r) => {
              const lat = Number(r.pickup_latitude);
              const lng = Number(r.pickup_longitude);
              const hasCoords = Number.isFinite(lat) && Number.isFinite(lng);

              return (
                <div className="apq-card" key={r.request_id}>
                <div className="apq-header">
                  <h3>Request #{r.request_id}</h3>
                  <span className={`badge ${r.request_type}`}>
                    {r.request_type}
                  </span>
                </div>

                <div className="apq-grid">
                  <div>
                    <strong>Citizen</strong>
                    <p>{r.citizen_name}</p>
                    <small>{r.citizen_email}</small>
                  </div>

                  <div>
                    <strong>Requested At</strong>
                    <p>{new Date(r.requested_at).toLocaleString()}</p>
                  </div>

                  <div>
                    <strong>Pickup Location</strong>
                    <p>{r.pickup_address || "Location via map"}</p>

                    <div className="coords">
                      {hasCoords ? `${lat}, ${lng}` : "Coordinates not available"}
                    </div>

                    <div className="map-preview">
                      {!hasCoords ? (
                        <span className="muted">Coordinates not available</span>
                      ) : (
                        <a
                          className="map-link"
                          href={`https://www.google.com/maps?q=${lat},${lng}`}
                          target="_blank"
                          rel="noreferrer"
                        >
                          Open in Google Maps
                        </a>
                      )}
                    </div>
                  </div>

                  <div>
                    <strong>Waste Summary</strong>
                    {r.items && r.items.length > 0 ? (
                      r.items.map((it) => (
                        <p key={it.item_id}>
                          {it.wastetype_name} ({it.quantity || "-"} {it.unit})
                        </p>
                      ))
                    ) : (
                      <p>Normal request (No waste types)</p>
                    )}
                  </div>
                </div>

                <div className="apq-photos">
                  <strong>Uploaded Photos</strong>
                  {r.photos && r.photos.length > 0 ? (
                    <div className="photo-grid">
                      {r.photos.map((p) => (
                        <a
                          key={p.photo_id}
                          href={`${BASE_URL}${p.photo_url}`}
                          target="_blank"
                          rel="noreferrer"
                          className="photo-card"
                        >
                          <img
                            src={`${BASE_URL}${p.photo_url}`}
                            alt="pickup"
                            loading="lazy"
                          />
                        </a>
                      ))}
                    </div>
                  ) : (
                    <p className="muted">No photos uploaded.</p>
                  )}
                </div>

                <div className="apq-actions">
                  <button
                    className="approve-btn"
                    onClick={() => approveRequest(r.request_id)}
                    type="button"
                  >
                    Approve
                  </button>

                  <textarea
                    placeholder="Reject remarks"
                    value={rejectRemarks[r.request_id] || ""}
                    onChange={(e) =>
                      setRejectRemarks((prev) => ({
                        ...prev,
                        [r.request_id]: e.target.value
                      }))
                    }
                  />

                  <button
                    className="reject-btn"
                    onClick={() => rejectRequest(r.request_id)}
                    type="button"
                  >
                    Reject
                  </button>
                </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
};

export default AdminPickupQueue;
