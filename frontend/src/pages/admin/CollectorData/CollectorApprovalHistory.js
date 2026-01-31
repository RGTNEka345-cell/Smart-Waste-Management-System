import React, { useEffect, useState } from "react";
import axios from "axios";
import AdminNavbar from "../../../components/Admin/AdminNavbar";
import "./CollectorApprovalHistory.css";

const CollectorApprovalHistory = () => {
  const [approvedCollectors, setApprovedCollectors] = useState([]);
  const [rejectedCollectors, setRejectedCollectors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("approved");
  const [selectedCollector, setSelectedCollector] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");

  useEffect(() => {
    fetchApprovalHistory();
  }, []);

  const fetchApprovalHistory = async () => {
    try {
      const adminId = localStorage.getItem("adminId");
      const headers = { "x-admin-id": adminId || "1" };

      const [approvedRes, rejectedRes] = await Promise.all([
        axios.get("http://localhost:5000/api/admin/collectors/approved", { headers }),
        axios.get("http://localhost:5000/api/admin/collectors/rejected", { headers })
      ]);

      setApprovedCollectors(approvedRes.data);
      setRejectedCollectors(rejectedRes.data);
      setLoading(false);
    } catch (err) {
      console.error("Error loading history:", err);
      setLoading(false);
    }
  };

  const viewDetails = (collector) => {
    setSelectedCollector(collector);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedCollector(null);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  if (loading) {
    return (
      <>
        <AdminNavbar />
        <p className="loading">Loading history...</p>
      </>
    );
  }

  const currentData = activeTab === "approved" ? approvedCollectors : rejectedCollectors;

  const filtered = currentData.filter((c) => {
    const matchesType =
      typeFilter === "ALL" || c.collection_type?.toLowerCase() === typeFilter;

    const q = search.trim().toLowerCase();
    if (!q) return matchesType;

    const hay = [
      c.full_name,
      c.email,
      c.phone_number,
      c.vehicle_number,
      c.home_address
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return matchesType && hay.includes(q);
  });

  return (
    <>
      <AdminNavbar />
      <div className="history-container">
        <h2>Collector Approval History</h2>

      <div className="tab-buttons">
        <button
          className={`tab-btn ${activeTab === "approved" ? "active" : ""}`}
          onClick={() => setActiveTab("approved")}
        >
          ✅ Approved ({approvedCollectors.length})
        </button>
        <button
          className={`tab-btn ${activeTab === "rejected" ? "active" : ""}`}
          onClick={() => setActiveTab("rejected")}
        >
          ❌ Rejected ({rejectedCollectors.length})
        </button>
      </div>

      <div className="filters">
        <input
          className="filter-input"
          placeholder="Search name, email, phone, vehicle, address..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          className="filter-select"
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
        >
          <option value="ALL">All Types</option>
          <option value="government">Government</option>
          <option value="factory">Factory</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <p className="no-data">
          No {activeTab} collectors found
        </p>
      ) : (
        <div className="table-wrapper">
          <table className="history-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Type</th>
                <th>Vehicle</th>
                <th>Latitude</th>
                <th>Longitude</th>
                <th>Place</th>
                <th>Status</th>
                {activeTab === "approved" && <th>Radius (KM)</th>}
                <th>Decision Date</th>
                <th>Approved By</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((collector) => (
                <tr key={collector.approval_id}>
                  <td className="name-cell">{collector.full_name}</td>
                  <td>{collector.email}</td>
                  <td>{collector.phone_number}</td>
                  <td>
                    <span className="type-badge">
                      {collector.collection_type.toUpperCase()}
                    </span>
                  </td>
                  <td>{collector.vehicle_number}</td>
                  <td>{collector.latitude ?? "-"}</td>
                  <td>{collector.longitude ?? "-"}</td>
                  <td>{collector.home_address ? collector.home_address.substring(0, 60) : "-"}</td>
                  <td>
                    <span className={`status-badge ${collector.approval_status.toLowerCase()}`}>
                      {collector.approval_status}
                    </span>
                  </td>
                  {activeTab === "approved" && (
                    <td className="radius-cell">
                      {collector.assigned_radius_km || "N/A"}
                    </td>
                  )}
                  <td className="date-cell">{formatDate(collector.approved_at)}</td>
                  <td>{collector.admin_name || "Admin"}</td>
                  <td className="action-cell">
                    <button
                      className="view-btn"
                      onClick={() => viewDetails(collector)}
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && selectedCollector && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="close-btn" onClick={closeModal}>×</button>
            <h2>Collector Details</h2>

            <div className="details-grid">
              <div className="detail-section">
                <h3>Personal Information</h3>
                <div className="detail-item">
                  <span className="label">Name:</span>
                  <span className="value">{selectedCollector.full_name}</span>
                </div>
                <div className="detail-item">
                  <span className="label">Email:</span>
                  <span className="value">{selectedCollector.email}</span>
                </div>
                <div className="detail-item">
                  <span className="label">Phone:</span>
                  <span className="value">{selectedCollector.phone_number}</span>
                </div>
                <div className="detail-item">
                  <span className="label">Gender:</span>
                  <span className="value">{selectedCollector.gender}</span>
                </div>
                <div className="detail-item">
                  <span className="label">Address:</span>
                  <span className="value">{selectedCollector.home_address}</span>
                </div>
              </div>

              <div className="detail-section">
                <h3>Collection Information</h3>
                <div className="detail-item">
                  <span className="label">Type:</span>
                  <span className="value">{selectedCollector.collection_type.toUpperCase()}</span>
                </div>
                <div className="detail-item">
                  <span className="label">Vehicle Number:</span>
                  <span className="value">{selectedCollector.vehicle_number}</span>
                </div>
                {selectedCollector.assigned_radius_km && (
                  <div className="detail-item">
                    <span className="label">Service Radius:</span>
                    <span className="value">{selectedCollector.assigned_radius_km} KM</span>
                  </div>
                )}
                {selectedCollector.latitude && selectedCollector.longitude && (
                  <div className="detail-item">
                    <span className="label">Coordinates:</span>
                    <span className="value">{selectedCollector.latitude}, {selectedCollector.longitude}</span>
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${selectedCollector.latitude},${selectedCollector.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ display: 'inline-block', marginTop: 8, color: '#1976d2' }}
                    >
                      View on Google Maps
                    </a>
                  </div>
                )}
                <div className="detail-item">
                  <span className="label">Status:</span>
                  <span className={`status-badge ${selectedCollector.approval_status.toLowerCase()}`}>
                    {selectedCollector.approval_status}
                  </span>
                </div>
              </div>

              <div className="detail-section">
                <h3>Approval Information</h3>
                <div className="detail-item">
                  <span className="label">Approved By:</span>
                  <span className="value">{selectedCollector.admin_name || "Admin"}</span>
                </div>
                <div className="detail-item">
                  <span className="label">Decision Date:</span>
                  <span className="value">{formatDate(selectedCollector.approved_at)}</span>
                </div>
                {selectedCollector.remarks && (
                  <div className="detail-item full-width">
                    <span className="label">Remarks/Reason:</span>
                    <span className="value">{selectedCollector.remarks}</span>
                  </div>
                )}
              </div>

              {selectedCollector.vehicle_photo && (
                <div className="detail-section full-width">
                  <h3>Vehicle Photo</h3>
                  <img
                    src={`http://localhost:5000/uploads/collectors/${selectedCollector.vehicle_photo}`}
                    alt="Vehicle"
                    className="vehicle-photo-modal"
                    onError={(e) => {
                      e.target.src = "https://via.placeholder.com/400?text=No+Image";
                    }}
                  />
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button className="close-modal-btn" onClick={closeModal}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </>
  );
};

export default CollectorApprovalHistory;
