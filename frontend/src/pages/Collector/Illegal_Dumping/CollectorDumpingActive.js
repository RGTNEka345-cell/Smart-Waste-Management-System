import React, { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import "./CollectorDumpingActive.css";

const API = "http://localhost:5000/api";

export default function CollectorDumpingActive() {
  const token = localStorage.getItem("collectorToken");
  const collectorData = JSON.parse(localStorage.getItem("collectorData") || "null");
  const collectorId = collectorData?.collector_id;
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);

  const [notes, setNotes] = useState("");
  const [afterPhotos, setAfterPhotos] = useState([]);
  const [saving, setSaving] = useState(false);

  const previews = useMemo(
    () => afterPhotos.map((f) => ({ f, url: URL.createObjectURL(f) })),
    [afterPhotos]
  );

  const load = useCallback(async () => {
    const authHeaders = {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(collectorId ? { "x-collector-id": collectorId } : {})
    };
    try {
      setLoading(true);
      const res = await axios.get(`${API}/collector/illegal-dumping/active`, {
        params: collectorId ? { collector_id: collectorId } : {},
        headers: authHeaders
      });
      setJob(res.data || null);
    } catch {
      setJob(null);
    } finally {
      setLoading(false);
    }
  }, [collectorId, token]);

  useEffect(() => {
    load();
  }, [load]);

  const start = async () => {
    if (!job) return;
    const authHeaders = {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(collectorId ? { "x-collector-id": collectorId } : {})
    };
    try {
      await axios.post(`${API}/collector/illegal-dumping/${job.report_id}/start`, {
        collector_id: collectorId || undefined
      }, {
        params: collectorId ? { collector_id: collectorId } : {},
        headers: authHeaders
      });
      alert("Started");
      load();
    } catch (err) {
      alert(err?.response?.data?.message || "Start failed");
    }
  };

  const pickAfter = (files) => {
    const arr = Array.from(files || []).slice(0, 3);
    setAfterPhotos(arr);
  };

  const remove = (idx) => setAfterPhotos(afterPhotos.filter((_, i) => i !== idx));

  const complete = async () => {
    if (!job) return;
    if (afterPhotos.length === 0) return alert("Upload at least 1 AFTER photo");
    const authHeaders = {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(collectorId ? { "x-collector-id": collectorId } : {})
    };

    const ok = window.confirm("Confirm cleanup completed?");
    if (!ok) return;

    try {
      setSaving(true);
      const fd = new FormData();
      fd.append("notes", notes);
      if (collectorId) fd.append("collector_id", collectorId);
      afterPhotos.forEach((f) => fd.append("after_photos", f));

      await axios.post(`${API}/collector/illegal-dumping/${job.report_id}/complete`, fd, {
        params: collectorId ? { collector_id: collectorId } : {},
        headers: {
          ...authHeaders,
          "Content-Type": "multipart/form-data"
        }
      });

      alert("Completed ✅");
      setNotes("");
      setAfterPhotos([]);
      load();
    } catch (err) {
      alert(err?.response?.data?.message || "Complete failed");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="id-wrap collector-dump-active">
        <div className="card">Loading...</div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="id-wrap collector-dump-active">
        <div className="card">
          <div className="muted">No active dumping job.</div>
        </div>
      </div>
    );
  }

  return (
    <div className="id-wrap collector-dump-active">
      <div className="id-top">
        <div>
          <h2>Active Dumping Job</h2>
          <p className="muted">Report #{job.report_id}</p>
        </div>
        <div className="pills">
          <span className="pill warn">{job.severity}</span>
          <span className="pill">{job.status}</span>
        </div>
      </div>

      <div className="card">
        <div className="row" style={{ border: "none", padding: 0 }}>
          <div className="left">
            <div className="title">{job.address || `${job.latitude}, ${job.longitude}`}</div>
            <div className="sub">{job.description}</div>
            <div className="sub">Distance: {job.distance_km != null ? `${job.distance_km} km` : "-"}</div>
          </div>
          <div className="actions">
            <button className="btn secondary"
              onClick={() => window.open(`https://www.google.com/maps?q=${job.latitude},${job.longitude}`, "_blank")}>
              Map
            </button>
          </div>
        </div>

        <div className="mapBox">Route / Location Preview</div>

        {job.status === "ACCEPTED_BY_COLLECTOR" && (
          <button className="btn primary" onClick={start}>Start</button>
        )}

        {job.status === "IN_PROGRESS" && (
          <>
            <div className="field" style={{ marginTop: 14 }}>
              <label>AFTER Photos (max 3) *</label>
              <input type="file" accept="image/*" multiple onChange={(e) => pickAfter(e.target.files)} />
            </div>

            {previews.length > 0 && (
              <div className="previewGrid" style={{ marginTop: 12 }}>
                {previews.map((p, idx) => (
                  <div className="imgBox" key={idx}>
                    <img src={p.url} alt="after" />
                    <button type="button" className="rm" onClick={() => remove(idx)}>✕</button>
                  </div>
                ))}
              </div>
            )}

            <div className="field" style={{ marginTop: 12 }}>
              <label>Notes (optional)</label>
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>

            <button className="btn success" onClick={complete} disabled={saving}>
              {saving ? "Completing..." : "Complete Task"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
