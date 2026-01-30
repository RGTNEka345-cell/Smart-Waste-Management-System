import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import "./CollectorOffersInbox.css";

const API = "http://localhost:5000/api";

const formatTimeLeft = (ms) => {
  if (ms <= 0) return "Expired";
  const totalSeconds = Math.floor(ms / 1000);
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}m ${s}s`;
};

const CollectorOffersInbox = () => {
  const token = localStorage.getItem("collectorToken");

  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);

  // reject reason per offer
  const [reasons, setReasons] = useState({});
  // simple tick for countdown updates
  const [tick, setTick] = useState(0);

  // Refresh countdown every 1 second
  useEffect(() => {
    const t = setInterval(() => setTick((x) => x + 1), 1000);
    return () => clearInterval(t);
  }, []);

  const fetchOffers = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API}/collector/offers?status=OFFERED`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });

      // Expected data shape example:
      // [
      //   {
      //     offer_id, request_id, requested_at, offer_expires_at,
      //     distance_km,
      //     pickup_address, pickup_latitude, pickup_longitude,
      //     request_type, target_collection_type
      //   }
      // ]
      const list = Array.isArray(res.data) ? res.data : [];
      setOffers(list);
    } catch (e) {
      setOffers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOffers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // older first
  const sortedOffers = useMemo(() => {
    return [...offers].sort((a, b) => {
      const ta = new Date(a.requested_at).getTime();
      const tb = new Date(b.requested_at).getTime();
      return ta - tb;
    });
  }, [offers]);

  const acceptOffer = async (offerId) => {
    const ok = window.confirm("Accept this pickup offer?");
    if (!ok) return;

    try {
      await axios.post(
        `${API}/collector/offers/${offerId}/accept`,
        {},
        { headers: token ? { Authorization: `Bearer ${token}` } : {} }
      );
      alert("Offer accepted");
      fetchOffers();
    } catch (e) {
      alert("Accept failed");
    }
  };

  const rejectOffer = async (offerId) => {
    const reason = reasons[offerId];
    if (!reason || reason.trim() === "") {
      alert("Please enter reject reason");
      return;
    }

    const ok = window.confirm("Reject this pickup offer?");
    if (!ok) return;

    try {
      await axios.post(
        `${API}/collector/offers/${offerId}/reject`,
        { reason },
        { headers: token ? { Authorization: `Bearer ${token}` } : {} }
      );
      alert("Offer rejected");
      fetchOffers();
    } catch (e) {
      alert("Reject failed");
    }
  };

  const openMap = (lat, lng) => {
    if (!lat || !lng) return;
    const url = `https://www.google.com/maps?q=${lat},${lng}`;
    window.open(url, "_blank");
  };

  if (loading) {
    return (
      <div className="coi-wrap">
        <div className="coi-card">Loading offers...</div>
      </div>
    );
  }

  return (
    <div className="coi-wrap">
      <div className="coi-head">
        <h2>Incoming Pickup Offers</h2>
        <button className="coi-refresh" onClick={fetchOffers}>
          Refresh
        </button>
      </div>

      {sortedOffers.length === 0 ? (
        <div className="coi-card empty">No new offers right now.</div>
      ) : (
        <div className="coi-grid">
          {sortedOffers.map((o) => {
            const expiresAt = o.offer_expires_at ? new Date(o.offer_expires_at).getTime() : 0;
            const now = Date.now();
            const timeLeft = expiresAt - now;
            const expired = timeLeft <= 0;

            return (
              <div className="offer-card" key={o.offer_id}>
                <div className="offer-top">
                  <div>
                    <h3>Offer #{o.offer_id}</h3>
                    <p className="muted">
                      Request #{o.request_id} • {o.request_type || "-"} •{" "}
                      {o.target_collection_type || "-"}
                    </p>
                  </div>

                  <div className={`timer ${expired ? "expired" : ""}`}>
                    {formatTimeLeft(timeLeft)}
                  </div>
                </div>

                <div className="offer-body">
                  <div className="row">
                    <div>
                      <strong>Requested At</strong>
                      <div>{o.requested_at ? new Date(o.requested_at).toLocaleString() : "-"}</div>
                    </div>
                    <div>
                      <strong>Distance</strong>
                      <div>{o.distance_km != null ? `${o.distance_km} km` : "-"}</div>
                    </div>
                  </div>

                  <div className="location">
                    <strong>Pickup Location</strong>
                    <div className="loc-text">{o.pickup_address || "Address not available"}</div>

                    <div className="map-preview">
                      <button
                        type="button"
                        className="map-btn"
                        onClick={() => openMap(o.pickup_latitude, o.pickup_longitude)}
                        disabled={!o.pickup_latitude || !o.pickup_longitude}
                      >
                        Open in Maps
                      </button>
                      <span className="coords">
                        {o.pickup_latitude && o.pickup_longitude
                          ? `${o.pickup_latitude}, ${o.pickup_longitude}`
                          : "No coordinates"}
                      </span>
                    </div>
                  </div>

                  <div className="actions">
                    <button
                      className="accept"
                      type="button"
                      onClick={() => acceptOffer(o.offer_id)}
                      disabled={expired}
                      title={expired ? "Offer expired" : "Accept"}
                    >
                      Accept
                    </button>

                    <div className="reject-box">
                      <textarea
                        placeholder="Reject reason (required)"
                        value={reasons[o.offer_id] || ""}
                        onChange={(e) =>
                          setReasons({ ...reasons, [o.offer_id]: e.target.value })
                        }
                        disabled={expired}
                      />
                      <button
                        className="reject"
                        type="button"
                        onClick={() => rejectOffer(o.offer_id)}
                        disabled={expired}
                        title={expired ? "Offer expired" : "Reject"}
                      >
                        Reject
                      </button>
                    </div>
                  </div>

                  {expired && (
                    <div className="expired-note">
                      This offer has expired. Refresh to get the latest offers.
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* tick is used to re-render countdown */}
      <span style={{ display: "none" }}>{tick}</span>
    </div>
  );
};

export default CollectorOffersInbox;
