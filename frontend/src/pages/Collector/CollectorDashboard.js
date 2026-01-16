// src/pages/collector/CollectorDashboard.js
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
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

  const handleLogout = () => {
    localStorage.removeItem("collectorToken");
    localStorage.removeItem("collectorData");
    localStorage.removeItem("collectorSession");
    navigate("/login/collector");
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="collector-dashboard">
      <header className="dashboard-header">
        <div className="header-content">
          <h1>♻️ Collector Dashboard</h1>
          <div className="user-info">
            <span>Welcome, {collectorData?.full_name}</span>
            <button onClick={handleLogout} className="logout-btn">
              Logout
            </button>
          </div>
        </div>
      </header>
      
      <main className="dashboard-main">
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
  );
};

export default CollectorDashboard;