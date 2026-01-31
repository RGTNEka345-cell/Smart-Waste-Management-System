import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import AdminNavbar from "../../../components/Admin/AdminNavbar";
import "./AdminCitizens.css";

const API = "http://localhost:5000/api";
const HOST = "http://localhost:5000";

const AdminCitizens = () => {
  const token = localStorage.getItem("adminToken");

  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState([]);
  const [selected, setSelected] = useState(null); // details
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [previewImg, setPreviewImg] = useState(null);

  const fetchCitizens = async (q = "") => {
    try {
      setLoading(true);
      const res = await axios.get(`${API}/admin/citizens?search=${encodeURIComponent(q)}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      setRows(Array.isArray(res.data) ? res.data : []);
    } catch {
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchCitizenDetails = async (id) => {
    try {
      setDetailsLoading(true);
      const res = await axios.get(`${API}/admin/citizens/${id}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      setSelected(res.data || null);
    } catch {
      setSelected(null);
      alert("Failed to load citizen details");
    } finally {
      setDetailsLoading(false);
    }
  };

  useEffect(() => {
    fetchCitizens("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // simple debounce for search
  useEffect(() => {
    const t = setTimeout(() => fetchCitizens(search), 400);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const total = useMemo(() => rows.length, [rows]);

  return (
    <>
      <AdminNavbar />
      <div className="ac-wrap">
        <div className="ac-top">
          <div>
            <h2>Citizens</h2>
            <p className="muted">Find citizens by name, email or phone.</p>
          </div>

          <div className="ac-search">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name / email / phone..."
            />
            <span className="count">{total}</span>
          </div>
        </div>

        <div className="ac-grid">
          {/* LEFT: list */}
          <div className="card">
            <div className="card-head">
              <strong>Citizen List</strong>
              
            </div>

            {loading ? (
              <div className="empty">Loading...</div>
            ) : rows.length === 0 ? (
              <div className="empty">No citizens found.</div>
            ) : (
              <div className="list">
                {rows.map((c) => {
                  const img = c.photo_url ? `${HOST}${c.photo_url}` : "/default-user.png";
                  return (
                    <button
                      key={c.id}
                      className={`row ${selected?.id === c.id ? "active" : ""}`}
                      onClick={() => fetchCitizenDetails(c.id)}
                      type="button"
                    >
                      <div className="avatar">
                      <img
                        src={img}
                        alt="citizen"
                        onError={(e) => (e.target.src = "/default-user.png")}
                        onClick={(e) => {
                          e.stopPropagation();
                          setPreviewImg(img);
                        }}
                      />
                      </div>
                      <div className="info">
                        <div className="name">{c.full_name}</div>
                        <div className="sub">{c.email}</div>
                        <div className="sub">{c.phone || "-"}</div>
                      </div>
                      <div className={`ver ${c.is_verified ? "yes" : "no"}`}>
                        {c.is_verified ? "Verified" : "Not Verified"}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* RIGHT: details */}
          <div className="card">
            <div className="card-head">
              <strong>Citizen Details</strong>
              {selected && (
                <button className="btn danger" onClick={() => setSelected(null)}>
                  Close
                </button>
              )}
            </div>

            {!selected ? (
              <div className="empty">Select a citizen to view full details.</div>
            ) : detailsLoading ? (
              <div className="empty">Loading details...</div>
            ) : (
              <div className="details">
                <div className="profile">
                  <div className="big-avatar">
                    <img
                      src={selected.photo_url ? `${HOST}${selected.photo_url}` : "/default-user.png"}
                      alt="citizen"
                      onError={(e) => (e.target.src = "/default-user.png")}
                      onClick={() =>
                        setPreviewImg(
                          selected.photo_url ? `${HOST}${selected.photo_url}` : "/default-user.png"
                        )
                      }
                    />
                  </div>
                  <div>
                    <h3>{selected.full_name}</h3>
                    <p className="muted">{selected.email}</p>
                  </div>
                </div>

                <div className="kv">
                  <div><strong>Phone:</strong> {selected.phone || "-"}</div>
                  <div><strong>Gender:</strong> {selected.gender || "-"}</div>
                  <div><strong>DOB:</strong> {selected.date_of_birth ? selected.date_of_birth.split("T")[0] : "-"}</div>
                  <div><strong>Address:</strong> {selected.address || "-"}</div>
                  <div>
                    <strong>Verified:</strong>{" "}
                    <span className={`pill ${selected.is_verified ? "ok" : "bad"}`}>
                      {selected.is_verified ? "Yes" : "No"}
                    </span>
                  </div>
                  <div><strong>Created:</strong> {selected.created_at ? new Date(selected.created_at).toLocaleString() : "-"}</div>
                </div>

                <div className="mapbox">
                  <strong>Location</strong>
                  <div className="coords">
                    {selected.latitude && selected.longitude
                      ? `${selected.latitude}, ${selected.longitude}`
                      : "No coordinates"}
                  </div>

                  

                  <button
                    className="btn"
                    type="button"
                    disabled={!selected.latitude || !selected.longitude}
                    onClick={() =>
                      window.open(`https://www.google.com/maps?q=${selected.latitude},${selected.longitude}`, "_blank")
                    }
                  >
                    Open in Maps
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {previewImg && (
        <div className="img-modal" onClick={() => setPreviewImg(null)}>
          <div className="img-modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="img-close" onClick={() => setPreviewImg(null)}>
              ×
            </button>
            <img src={previewImg} alt="citizen preview" />
          </div>
        </div>
      )}
    </>
  );
};

export default AdminCitizens;
