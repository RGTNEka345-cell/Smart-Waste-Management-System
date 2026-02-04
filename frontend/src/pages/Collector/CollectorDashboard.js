// src/pages/collector/CollectorDashboard.js
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import CollectorNavbar from "../../components/Collector/CollectorNavbar";
import "./CollectorDashboard.css";


const CollectorDashboard = () => {
  const navigate = useNavigate();
  const [collectorData, setCollectorData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if collector is logged in
    const token = localStorage.getItem("collectorToken");
    const storedData = localStorage.getItem("collectorData");
    
    if (!token || !storedData) {
      navigate("/login/collector");
      return;
    }

    try {
      const data = JSON.parse(storedData);
      setCollectorData(data);
    } catch (error) {
      console.error("Error parsing collector data:", error);
      navigate("/login/collector");
    } finally {
      setLoading(false);
    }
  }, [navigate]);


  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading dashboard...</p>
      </div>
    );
  }

  return (
    <>
      <CollectorNavbar />
      <div className="collector-dashboard">
        <main className="dashboard-main">
          <div className="dashboard-hero">
            <div>
              <p className="hero-kicker">Collector Dashboard</p>
              <h1>Welcome back, {collectorData?.full_name}</h1>
              <p className="hero-sub">
                Track offers, manage jobs, and keep pickups moving smoothly.
              </p>
            </div>
            <div className="hero-actions">
              <button
                className="primary-btn"
                onClick={() => navigate("/collector/offers")}
              >
                View Pickup Offers
              </button>
              <button className="secondary-btn" type="button"
              onClick={() => navigate("/collector/job")}>
                Active Job
              </button>
            </div>
          </div>

          <div className="stats-cards">
            <div className="stat-card">
              <h3>Collection Type</h3>
              <p className="stat-value">{collectorData?.collection_type}</p>
            </div>
            <div className="stat-card">
              <h3>Status</h3>
              <p className="stat-value">{collectorData?.status}</p>
            </div>
            <div className="stat-card">
              <h3>Vehicle Number</h3>
              <p className="stat-value">{collectorData?.vehicle_number}</p>
            </div>
          </div>

          <div className="dashboard-content">
            <div className="content-card">
              <h2>Account Information</h2>
              <div className="info-grid">
                <div className="info-item">
                  <label>Full Name:</label>
                  <span>{collectorData?.full_name}</span>
                </div>
                <div className="info-item">
                  <label>Email:</label>
                  <span>{collectorData?.email}</span>
                </div>
                <div className="info-item">
                  <label>Phone:</label>
                  <span>{collectorData?.phone_number}</span>
                </div>
                <div className="info-item">
                  <label>Gender:</label>
                  <span>{collectorData?.gender}</span>
                </div>
                <div className="info-item">
                  <label>Address:</label>
                  <span>{collectorData?.home_address}</span>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  );
};

export default CollectorDashboard;
