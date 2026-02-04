import React, { useMemo, useState } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import "./CollectorCompletePickup.css";

const API = "http://localhost:5000/api";

const CollectorCompletePickup = () => {
  const { requestId } = useParams();
  const navigate = useNavigate();
  const token = localStorage.getItem("collectorToken");
  const collectorData = JSON.parse(localStorage.getItem("collectorData") || "null");
  const collectorId = collectorData?.collector_id;

  const [notes, setNotes] = useState("");
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(false);

  const previews = useMemo(
    () => photos.map((f) => ({ file: f, url: URL.createObjectURL(f) })),
    [photos]
  );

  const pickFiles = (files) => {
    const arr = Array.from(files || []);
    const limited = arr.slice(0, 6);
    setPhotos(limited);
  };

  const removeFile = (index) => {
    setPhotos(photos.filter((_, i) => i !== index));
  };

  const validate = () => {
    if (photos.length === 0) {
      return "Please upload at least one photo.";
    }
    if (photos.length > 6) {
      return "Maximum 6 photos allowed.";
    }
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const msg = validate();
    if (msg) {
      alert(msg);
      return;
    }

    const ok = window.confirm("Confirm complete this pickup?");
    if (!ok) return;

    try {
      setLoading(true);

      const form = new FormData();
      form.append("notes", notes);

      photos.forEach((file) => form.append("images", file));

      await axios.post(`${API}/collector/jobs/${requestId}/complete`, form, {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...(collectorId ? { "x-collector-id": collectorId } : {}),
          "Content-Type": "multipart/form-data"
        }
      });

      alert("Pickup marked as completed.");
      navigate("/collector/dashboard");
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Complete failed";
      alert(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ccp-wrap">
      <div className="ccp-top">
        <h2>Complete Pickup</h2>
        <span className="rid">Request #{requestId}</span>
      </div>

      <form className="ccp-card" onSubmit={handleSubmit}>
        <div className="section">
          <div className="sec-head">
            <h3>Photos</h3>
            <span className="hint">Max 6</span>
          </div>

          <input
            type="file"
            accept="image/*"
            multiple
            onChange={(e) => pickFiles(e.target.files)}
          />

          {previews.length > 0 && (
            <div className="grid">
              {previews.map((p, idx) => (
                <div className="imgBox" key={idx}>
                  <img src={p.url} alt="pickup" />
                  <button
                    type="button"
                    className="remove"
                    onClick={() => removeFile(idx)}
                  >
                    x
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* NOTES */}
        <div className="section">
          <div className="sec-head">
            <h3>Notes</h3>
            <span className="hint">Optional</span>
          </div>

          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add any note about the pickup (optional)"
          />
        </div>

        <button className="submit" type="submit" disabled={loading}>
          {loading ? "Completing..." : "Confirm Complete"}
        </button>
      </form>
    </div>
  );
};

export default CollectorCompletePickup;
