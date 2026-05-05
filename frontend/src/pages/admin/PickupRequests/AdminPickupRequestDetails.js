import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Link, useParams } from "react-router-dom";
import AdminNavbar from "../../../components/Admin/AdminNavbar";
import "./AdminPickupRequestDetails.css";

const API = "http://localhost:5000/api";
const HOST = "http://localhost:5000";

const statusLabel = (s) => {
  const map = {
    PENDING_ADMIN: "Pending Admin",
    REJECTED_ADMIN: "Rejected by Admin",
    APPROVED_ADMIN: "Approved",
    ASSIGNING: "Assigning",
    ACCEPTED_BY_COLLECTOR: "Accepted by Collector",
    IN_PROGRESS: "In Progress",
    COMPLETED: "Completed",
    CANCELLED_BY_CITIZEN: "Cancelled by Citizen",
    FAILED_TO_ASSIGN: "Failed to Assign"
  };
  return map[s] || s || "-";
};

const badgeClass = (s) => {
  if (!s) return "badge";
  if (s === "PENDING_ADMIN") return "badge pending";
  if (s === "APPROVED_ADMIN" || s === "ASSIGNING") return "badge approved";
  if (s === "ACCEPTED_BY_COLLECTOR" || s === "IN_PROGRESS") return "badge progress";
  if (s === "COMPLETED") return "badge done";
  if (s === "REJECTED_ADMIN" || s === "CANCELLED_BY_CITIZEN" || s === "FAILED_TO_ASSIGN")
    return "badge danger";
  return "badge";
};

const AdminPickupRequestDetails = () => {
  const { id } = useParams();
  const token = localStorage.getItem("adminToken");

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [requestList, setRequestList] = useState([]);
  const [listLoading, setListLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [activeRequestId, setActiveRequestId] = useState(id ? Number(id) : null);
  // expected:
  // {
  //   request: {...},
  //   citizen: {...},
  //   items: [...],
  //   photos: [...],
  //   history: [...],
  //   admin_decision: { status, remarks, decided_at } | null
  // }

  const fetchDetails = async (requestId) => {
    try {
      setLoading(true);
      const res = await axios.get(`${API}/admin/pickup-requests/${requestId}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      setData(res.data || null);
    } catch (e) {
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  const fetchRequestList = async (q = "") => {
    try {
      setListLoading(true);
      const res = await axios.get(`${API}/admin/pickup-requests`, {
        params: q ? { q: q.trim() } : {},
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      const rows = Array.isArray(res.data) ? res.data : [];
      setRequestList(rows);

      if (rows.length === 0) {
        setData(null);
        setActiveRequestId(null);
        return;
      }

      const selectedId = activeRequestId && rows.some((r) => Number(r.request_id) === Number(activeRequestId))
        ? Number(activeRequestId)
        : Number(rows[0].request_id);

      setActiveRequestId(selectedId);
      await fetchDetails(selectedId);
    } catch (e) {
      setRequestList([]);
      setData(null);
      setActiveRequestId(null);
    } finally {
      setListLoading(false);
    }
  };

  useEffect(() => {
    const load = async () => {
      await fetchRequestList();
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleSearch = async () => {
    await fetchRequestList(search);
  };

  const request = data?.request;
  const citizen = data?.citizen;
  const items = data?.items || [];
  const history = data?.history || [];
  const adminDecision = data?.admin_decision;

  const photos = useMemo(() => data?.photos || [], [data?.photos]);

  const photosByType = useMemo(() => {
    // If your photos table doesn't have BEFORE/AFTER, they will go into OTHER.
    const before = photos.filter(p => p.photo_type === "BEFORE");
    const after = photos.filter(p => p.photo_type === "AFTER");
    const other = photos.filter(p => p.photo_type !== "BEFORE" && p.photo_type !== "AFTER");
    return { before, after, other };
  }, [photos]);

  if (loading) {
    return (
      <>
        <AdminNavbar />
        <div className="ard-wrap">
          <div className="ard-card">Loading...</div>
        </div>
      </>
    );
  }

  if (!request) {
    return (
      <>
        <AdminNavbar />
        <div className="ard-wrap">
          <div className="ard-card">
            Request not found. <Link to="/admin/pickup-queue">Back</Link>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <AdminNavbar />
      <div className="ard-wrap">
        <div className="ard-top">
          <div>
            <h2>Pickup Request #{request.request_id}</h2>
            <p className="muted">
              {request.request_type} • {request.target_collection_type} •{" "}
              <span className={badgeClass(request.status)}>{statusLabel(request.status)}</span>
            </p>
          </div>

          <div className="ard-top-actions">
            <div className="search-box">
              <input
                type="text"
                placeholder="Search by citizen name or email"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <button className="btn small" onClick={handleSearch} disabled={listLoading}>
                {listLoading ? "Searching..." : "Search"}
              </button>
              <button className="btn secondary small" onClick={() => { setSearch(""); fetchRequestList(""); }} disabled={listLoading}>
                Reset
              </button>
            </div>
          </div>
        </div>

      <div className="ard-card">
        <h3>All Pickup Requests (Latest First)</h3>
        {requestList.length === 0 ? (
          <p className="muted">No pickup requests found.</p>
        ) : (
          <div className="request-list">
            {requestList.map((r) => (
              <button
                key={r.request_id}
                type="button"
                className={`request-row ${Number(activeRequestId) === Number(r.request_id) ? "active" : ""}`}
                onClick={() => {
                  setActiveRequestId(Number(r.request_id));
                  fetchDetails(r.request_id);
                }}
              >
                <div><strong>#{r.request_id}</strong> {r.citizen_name || "-"}</div>
                <div>{r.citizen_email || "-"}</div>
                <div>{r.requested_at ? new Date(r.requested_at).toLocaleString() : "-"}</div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Citizen details */}
      <div className="ard-card">
        <h3>Citizen Details</h3>
        <div className="grid2">
          <div><strong>Name:</strong> {citizen?.full_name || "-"}</div>
          <div><strong>Email:</strong> {citizen?.email || "-"}</div>
          <div>
            <strong>Phone:</strong>{" "}
            {citizen?.phone || citizen?.phone_number || "-"}
          </div>
          <div><strong>Address:</strong> {citizen?.address || "-"}</div>
        </div>
      </div>

      {/* Pickup location */}
      <div className="ard-card">
        <h3>Pickup Location</h3>
        <div className="grid2">
          <div><strong>Address:</strong> {request.pickup_address || "-"}</div>
          <div>
            <strong>Coordinates:</strong>{" "}
            {request.pickup_latitude && request.pickup_longitude
              ? `${request.pickup_latitude}, ${request.pickup_longitude}`
              : "-"}
          </div>
          <div className="mapBox">
            <div className="mapPlaceholder">Map Preview</div>
            <button
              className="btn small"
              onClick={() => {
                if (!request.pickup_latitude || !request.pickup_longitude) return;
                window.open(
                  `https://www.google.com/maps?q=${request.pickup_latitude},${request.pickup_longitude}`,
                  "_blank"
                );
              }}
              disabled={!request.pickup_latitude || !request.pickup_longitude}
            >
              Open in Maps
            </button>
          </div>
        </div>
      </div>

      {/* Waste items */}
      <div className="ard-card">
        <h3>Waste Items</h3>
        {items.length === 0 ? (
          <p className="muted">Normal request (No waste types)</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Waste Type</th>
                <th>Quantity</th>
                <th>Unit</th>
              </tr>
            </thead>
            <tbody>
              {items.map((it) => (
                <tr key={it.item_id}>
                  <td>{it.wastetype_name || it.wastetype_id}</td>
                  <td>{it.quantity ?? "-"}</td>
                  <td>{it.unit || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Uploaded photos */}
      <div className="ard-card">
        <h3>Uploaded Photos</h3>

        {photos.length === 0 ? (
          <p className="muted">No photos uploaded</p>
        ) : (
          <>
            {photosByType.before.length > 0 && (
              <>
                <h4 className="sub">BEFORE</h4>
                <div className="imgGrid">
                  {photosByType.before.map((p) => (
                    <a
                      key={p.photo_id}
                      className="imgCard"
                      href={`${HOST}${p.photo_url}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <img src={`${HOST}${p.photo_url}`} alt="before" />
                    </a>
                  ))}
                </div>
              </>
            )}

            {photosByType.after.length > 0 && (
              <>
                <h4 className="sub">AFTER</h4>
                <div className="imgGrid">
                  {photosByType.after.map((p) => (
                    <a
                      key={p.photo_id}
                      className="imgCard"
                      href={`${HOST}${p.photo_url}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <img src={`${HOST}${p.photo_url}`} alt="after" />
                    </a>
                  ))}
                </div>
              </>
            )}

            {photosByType.other.length > 0 && (
              <>
                <h4 className="sub">PHOTOS</h4>
                <div className="imgGrid">
                  {photosByType.other.map((p) => (
                    <a
                      key={p.photo_id}
                      className="imgCard"
                      href={`${HOST}${p.photo_url}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <img src={`${HOST}${p.photo_url}`} alt="pickup" />
                    </a>
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </div>

      {/* Status + history */}
      <div className="ard-card">
        <h3>Status</h3>
        <div className="grid2">
          <div><strong>Current:</strong> {statusLabel(request.status)}</div>
          <div><strong>Requested At:</strong> {request.requested_at ? new Date(request.requested_at).toLocaleString() : "-"}</div>
        </div>

        <h4 className="sub">History</h4>
        {history.length === 0 ? (
          <p className="muted">No history available</p>
        ) : (
          <ul className="history">
            {history.map((h) => (
              <li key={h.history_id || `${h.status}-${h.changed_at}`}>
                <span className="hStatus">{statusLabel(h.status)}</span>
                <span className="hTime">
                  {h.changed_at ? new Date(h.changed_at).toLocaleString() : "-"}
                </span>
                {h.note ? <span className="hNote">{h.note}</span> : null}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Admin decision remarks */}
      <div className="ard-card">
        <h3>Admin Decision</h3>
        {!adminDecision ? (
          <p className="muted">No decision record</p>
        ) : (
          <div className="grid2">
            <div><strong>Decision:</strong> {adminDecision.status}</div>
            <div><strong>Decided At:</strong> {adminDecision.decided_at ? new Date(adminDecision.decided_at).toLocaleString() : "-"}</div>
            <div className="full">
              <strong>Remarks:</strong>
              <p className="remarks">{adminDecision.remarks || "-"}</p>
            </div>
          </div>
        )}
      </div>
      </div>
    </>
  );
};

export default AdminPickupRequestDetails;
