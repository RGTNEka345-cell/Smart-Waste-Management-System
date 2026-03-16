import React, { useCallback, useEffect, useState } from "react";
import axios from "axios";
import CollectorNavbar from "../../../components/Collector/CollectorNavbar";
import "./CollectorDumpingOffers.css";

const API = "http://localhost:5000/api";

export default function CollectorDumpingOffers() {
  const token = localStorage.getItem("collectorToken");
  const collectorData = JSON.parse(localStorage.getItem("collectorData") || "null");
  const collectorId = collectorData?.collector_id;
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rejectReason, setRejectReason] = useState({}); // offer_id -> reason

  const load = useCallback(async () => {
    const authHeaders = {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(collectorId ? { "x-collector-id": collectorId } : {})
    };
    try {
      setLoading(true);
      const res = await axios.get(`${API}/collector/illegal-dumping/offers`, {
        params: collectorId ? { collector_id: collectorId } : {},
        headers: authHeaders
      });
      setOffers(Array.isArray(res.data) ? res.data : []);
    } catch {
      setOffers([]);
    } finally {
      setLoading(false);
    }
  }, [collectorId, token]);

  useEffect(() => {
    load();
  }, [load]);

  const accept = async (offerId) => {
    const authHeaders = {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(collectorId ? { "x-collector-id": collectorId } : {})
    };
    try {
      await axios.post(`${API}/collector/illegal-dumping/offers/${offerId}/accept`, {}, {
        params: collectorId ? { collector_id: collectorId } : {},
        headers: authHeaders
      });
      alert("Accepted ✅");
      load();
    } catch {
      alert("Accept failed");
    }
  };

  const reject = async (offerId) => {
    const authHeaders = {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(collectorId ? { "x-collector-id": collectorId } : {})
    };
    try {
      await axios.post(`${API}/collector/illegal-dumping/offers/${offerId}/reject`,
        { reason: rejectReason[offerId] || "", collector_id: collectorId || undefined },
        { headers: authHeaders }
      );
      load();
    } catch {
      alert("Reject failed");
    }
  };

  return (
    <>
      <CollectorNavbar />
      <div className="id-wrap collector-dump-offers">
        <div className="id-top">
          <div>
            <h2>Dumping Offers</h2>
            <p className="muted">Government collectors only</p>
          </div>
          <button className="btn secondary" onClick={load} disabled={loading}>
            {loading ? "Loading..." : "Refresh"}
          </button>
        </div>
 

        <div className="card">
        {loading ? (
          <div className="muted">Loading...</div>
        ) : offers.length === 0 ? (
          <div className="muted">No offers.</div>
        ) : (
          <div className="rowList">
            {offers.map((o) => (
              <div className="row" key={o.offer_id}>
                <div className="left">
                  <div className="title">Offer #{o.offer_id} — Report #{o.report_id}</div>
                  <div className="sub">{o.address || `${o.latitude}, ${o.longitude}`}</div>
                  <div className="pills">
                    <span className="pill warn">{o.severity}</span>
                    <span className="pill">{o.distance_km != null ? `${o.distance_km} km` : "-"}</span>
                  </div>
                </div>

                <div style={{ minWidth: 280 }}>
                  <input
                    style={{ width: "100%", padding: 10, borderRadius: 12, border: "1px solid #ddd" }}
                    placeholder="Reject reason (optional)"
                    value={rejectReason[o.offer_id] || ""}
                    onChange={(e) => setRejectReason({ ...rejectReason, [o.offer_id]: e.target.value })}
                  />
                  <div className="actions" style={{ marginTop: 8 }}>
                    <button className="btn success" onClick={() => accept(o.offer_id)}>Accept</button>
                    <button className="btn danger" onClick={() => reject(o.offer_id)}>Reject</button>
                    <button
                      className="btn secondary"
                      onClick={() => window.open(`https://www.google.com/maps?q=${o.latitude},${o.longitude}`, "_blank")}
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
    </>
  );
}
