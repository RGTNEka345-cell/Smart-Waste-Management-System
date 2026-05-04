import React, { useEffect, useMemo, useState } from "react";
import CitizenNavbar from "../../../components/Citizen/CitizenNavbar";
import axios from "axios";
import { useParams, Link } from "react-router-dom";
import "./PickupRequestDetails.css";

const API = "http://localhost:5000/api";
const HOST = "http://localhost:5000";

const steps = [
  { key: "PENDING_ADMIN", label: "Pending Admin" },
  { key: "APPROVED_ADMIN", label: "Approved" },
  { key: "ASSIGNING", label: "Offering to Collector" },
  { key: "ACCEPTED_BY_COLLECTOR", label: "Accepted" },
  { key: "IN_PROGRESS", label: "In Progress" },
  { key: "COMPLETED", label: "Completed" }
];

const stepIndex = (status) => {
  const idx = steps.findIndex(s => s.key === status);
  return idx === -1 ? 0 : idx;
};

const PickupRequestDetails = () => {
  const { requestId } = useParams();
  const token = localStorage.getItem("citizenToken");
  const citizen = JSON.parse(localStorage.getItem("citizen") || "null");
  const citizenId = citizen?.id;

  const [data, setData] = useState(null); // {request, items, photos, collector?}
  const [loading, setLoading] = useState(true);
  const [cancelLoading, setCancelLoading] = useState(false);

  const status = data?.request?.status;
  const canCancel = useMemo(() => {
    // only before accepted
    return status === "PENDING_ADMIN" || status === "APPROVED_ADMIN" || status === "ASSIGNING";
  }, [status]);

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        setLoading(true);

        // Expected response:
        // { request, items, photos, collector? }
        const res = await axios.get(`${API}/pickup-requests/${requestId}`, {
          params: citizenId ? { citizen_id: citizenId } : {},
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        });

        setData(res.data);
      } catch (e) {
        setData(null);
      } finally {
        setLoading(false);
      }
    };
    fetchDetails();
  }, [requestId, token, citizenId]);

  const handleCancel = async () => {
    if (!canCancel) return;

    const ok = window.confirm("Cancel this pickup request?");
    if (!ok) return;

    try {
      setCancelLoading(true);
      await axios.patch(`${API}/pickup-requests/${requestId}/cancel`, {}, {
        params: citizenId ? { citizen_id: citizenId } : {},
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });

      // re-fetch
      const res = await axios.get(`${API}/pickup-requests/${requestId}`, {
        params: citizenId ? { citizen_id: citizenId } : {},
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      setData(res.data);
      alert("Request cancelled");
    } catch (e) {
      alert("Cancel failed");
    } finally {
      setCancelLoading(false);
    }
  };

  if (loading) {
    return (
      <>
        <CitizenNavbar setActiveTab={() => {}} />
        <div className="prd-wrap"><div className="prd-card">Loading...</div></div>
      </>
    );
  }

  if (!data?.request) {
    return (
      <>
        <CitizenNavbar setActiveTab={() => {}} />
        <div className="prd-wrap">
          <div className="prd-card">
            Request not found. 
            <Link to="/citizen/pickup/requests">Back</Link>
          </div>
        </div>
      </>
    );
  }

  const activeIdx = stepIndex(status);
  const photos = data.photos || [];
  const items = data.items || [];

  const afterPhotos = photos.filter(p => p.photo_type === "AFTER");
  const beforePhotos = photos.filter(p => p.photo_type === "BEFORE");
  const otherPhotos = photos.filter(p => p.photo_type !== "AFTER" && p.photo_type !== "BEFORE");

  return (
    <>
      <CitizenNavbar setActiveTab={() => {}} />
      <div className="prd-wrap">
        <div className="prd-top">
          <h2>Pickup Request #{data.request.request_id}</h2>
          <Link className="prd-back" to="/citizen/pickup/requests">← Back</Link>
        </div>

      {/* Status timeline */}
      <div className="prd-card">
        <h3>Status Timeline</h3>
        <div className="timeline">
          {steps.map((s, idx) => (
            <div
              key={s.key}
              className={`step ${idx <= activeIdx ? "done" : ""}`}
            >
              <div className="dot" />
              <div className="label">{s.label}</div>
            </div>
          ))}
           </div>

        <div className="prd-meta">
          <div><strong>Type:</strong> {data.request.request_type}</div>
          <div><strong>Status:</strong> {data.request.status}</div>
          <div><strong>Requested:</strong> {data.request.requested_at ? new Date(data.request.requested_at).toLocaleString() : "-"}</div>
        </div>

        {canCancel && (
          <button
            className="cancel-btn"
            type="button"
            onClick={handleCancel}
            disabled={cancelLoading}
          >
            {cancelLoading ? "Cancelling..." : "Cancel Request"}
          </button>
        )}
        {!canCancel && (
          <p className="hint">
            Cancel is disabled after a collector accepts the request.
          </p>
        )}
      </div>

      {/* Assigned / accepted collector info (optional) */}
      <div className="prd-card">
        <h3>Collector</h3>
        {data.collector ? (
          <div className="collector-box">
            <div><strong>Name:</strong> {data.collector.full_name}</div>
            <div><strong>Phone:</strong> {data.collector.phone_number || "-"}</div>
            <div><strong>Vehicle:</strong> {data.collector.vehicle_number || "-"}</div>
          </div>
        ) : (
          <div className="collector-box empty">
            {status === "ASSIGNING" || status === "APPROVED_ADMIN"
              ? "Assigning... (nearest collectors will receive notifications)"
              : "No collector assigned yet."}
          </div>
        )}
      </div>

      {/* Waste items (Special only) */}
      <div className="prd-card">
        <h3>Waste Items</h3>
        {items.length === 0 ? (
          <p className="muted">No waste items (Normal request).</p>
        ) : (
          <ul className="items">
            {items.map(it => (
              <li key={it.item_id}>
                <strong>{it.wastetype_name || it.wastetype_id}</strong>
                <span className="qty">
                  {it.quantity ? `${it.quantity} ${it.unit}` : `- ${it.unit}`}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Proof images */}
      <div className="prd-card">
        <h3>Photos</h3>

        {(beforePhotos.length + afterPhotos.length + otherPhotos.length) === 0 ? (
          <p className="muted">No photos uploaded.</p>
        ) : (
          <>
            {beforePhotos.length > 0 && (
              <>
                <h4 className="sub">BEFORE</h4>
                <div className="grid">
                  {beforePhotos.map(p => (
                    <a
                      key={p.photo_id}
                      href={`${HOST}${p.photo_url}`}
                      target="_blank"
                      rel="noreferrer"
                      className="img-card"
                    >
                      <img src={`${HOST}${p.photo_url}`} alt="before" />
                    </a>
                  ))}
                </div>
              </>
            )}

            {afterPhotos.length > 0 && (
              <>
                <h4 className="sub">AFTER</h4>
                <div className="grid">
                  {afterPhotos.map(p => (
                    <a
                      key={p.photo_id}
                      href={`${HOST}${p.photo_url}`}
                      target="_blank"
                      rel="noreferrer"
                      className="img-card"
                    >
                      <img src={`${HOST}${p.photo_url}`} alt="after" />
                    </a>
                  ))}
                </div>
              </>
            )}

            {otherPhotos.length > 0 && (
              <>
                <h4 className="sub">OTHER</h4>
                <div className="grid">
                  {otherPhotos.map(p => (
                    <a
                      key={p.photo_id}
                      href={`${HOST}${p.photo_url}`}
                      target="_blank"
                      rel="noreferrer"
                      className="img-card"
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
      </div>
    </>
  );
};

export default PickupRequestDetails;
