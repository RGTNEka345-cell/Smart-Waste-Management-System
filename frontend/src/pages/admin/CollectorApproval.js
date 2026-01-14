import React, { useEffect, useState } from "react";
import axios from "axios";
import "./CollectorApproval.css";

const AdminCollectorApproval = () => {
  const [collectors, setCollectors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCollector, setSelectedCollector] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetchPendingCollectors();
  }, []);

  const fetchPendingCollectors = async () => {
    try {
      const adminId = localStorage.getItem("adminId");
      const res = await axios.get(
        "http://localhost:5000/api/admin/collectors/pending",
        {
          headers: {
            "x-admin-id": adminId || "1"
          }
        }
      );
      setCollectors(res.data);
      setLoading(false);
    } catch (err) {
      console.error(err);
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

  const handleAction = async (collector_id, status) => {
    const radius = status === "APPROVED"
      ? prompt("Assign service radius (in KM):")
      : null;

    const remarks = prompt("Remarks (optional):");

    if (status === "APPROVED" && !radius) {
      alert("Please provide service radius");
      return;
    }

    try {
      const adminId = localStorage.getItem("adminId");
      await axios.post(
        "http://localhost:5000/api/admin/collectors/approve",
        {
          collector_id,
          approval_status: status,
          assigned_radius_km: radius,
          remarks
        },
        {
          headers: {
            "x-admin-id": adminId || "1"
          }
        }
      );

      alert(`Collector ${status}`);
      closeModal();
      fetchPendingCollectors();
    } catch (err) {
      console.error("Error:", err.response?.data || err.message);
      alert(err.response?.data?.message || "Action failed");
    }
  };

  if (loading) return <p className="loading">Loading collectors...</p>;

  return (
    <div className="approval-container">
      <h2>Collector Approvals</h2>

      {collectors.length === 0 ? (
        <p className="no-collectors">No pending collectors</p>
      ) : (
        <div className="collectors-grid">
          {collectors.map((c) => (
            <div key={c.collector_id} className="collector-card">
              <div className="card-header">
                <h3>{c.full_name}</h3>
                <span className="collection-type">{c.collection_type}</span>
              </div>

              <div className="card-body">
                <div className="info-group">
                  <label>Email:</label>
                  <p>{c.email}</p>
                </div>

                <div className="info-group">
                  <label>Phone:</label>
                  <p>{c.phone_number}</p>
                </div>

                <div className="info-group">
                  <label>Gender:</label>
                  <p>{c.gender}</p>
                </div>

                <div className="info-group">
                  <label>Vehicle Number:</label>
                  <p>{c.vehicle_number}</p>
                </div>

                <div className="info-group">
                  <label>Address:</label>
                  <p>{c.home_address}</p>
                </div>

                <div className="vehicle-photo">
                  <img
                    src={`http://localhost:5000/uploads/vehicles/${c.vehicle_photo}`}
                    alt="Vehicle"
                    onError={(e) => {
                      e.target.src = "https://via.placeholder.com/200?text=No+Image";
                    }}
                  />
                </div>
              </div>

              <div className="card-actions">
                <button
                  className="details-btn"
                  onClick={() => viewDetails(c)}
                >
                  View Details
                </button>
                <button
                  className="approve-btn"
                  onClick={() => handleAction(c.collector_id, "APPROVED")}
                >
                  Approve
                </button>
                <button
                  className="reject-btn"
                  onClick={() => handleAction(c.collector_id, "REJECTED")}
                >
                  Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && selectedCollector && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="close-btn" onClick={closeModal}>×</button>
            <h2>Collector Full Details</h2>

            <div className="detail-section">
              <h3>Basic Information</h3>
              <div className="detail-grid">
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
                <div className="detail-item">
                  <span className="label">Type:</span>
                  <span className="value">{selectedCollector.collection_type}</span>
                </div>
              </div>
            </div>

            <div className="detail-section">
              <h3>Vehicle Information</h3>
              <div className="detail-grid">
                <div className="detail-item">
                  <span className="label">Vehicle Number:</span>
                  <span className="value">{selectedCollector.vehicle_number}</span>
                </div>
                <div className="detail-item full-width">
                  <span className="label">Vehicle Photo:</span>
                  <img
                    src={`http://localhost:5000/uploads/vehicles/${selectedCollector.vehicle_photo}`}
                    alt="Vehicle"
                    className="modal-vehicle-photo"
                    onError={(e) => {
                      e.target.src = "https://via.placeholder.com/300?text=No+Image";
                    }}
                  />
                </div>
              </div>
            </div>

            <div className="modal-actions">
              <button
                className="approve-btn-lg"
                onClick={() => handleAction(selectedCollector.collector_id, "APPROVED")}
              >
                Approve
              </button>
              <button
                className="reject-btn-lg"
                onClick={() => handleAction(selectedCollector.collector_id, "REJECTED")}
              >
                Reject
              </button>
              <button className="cancel-btn" onClick={closeModal}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCollectorApproval;
