// src/pages/collector/CollectorDashboard.js
import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import CollectorNavbar from "../../components/Collector/CollectorNavbar";
import "./CollectorDashboard.css";

const API = "http://localhost:5000/api";

const CollectorDashboard = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem("collectorToken");
  const [collectorData, setCollectorData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dashboardStats, setDashboardStats] = useState({
    completed_jobs: 0,
    active_jobs: 0,
    pending_jobs: 0,
    eco_points: 0,
    monthly_completed: [],
    recent_completed: []
  });
  const [statsLoading, setStatsLoading] = useState(false);

  useEffect(() => {
    // Check if collector is logged in
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

  useEffect(() => {
    const fetchDashboardStats = async () => {
      if (!token) return;

      try {
        setStatsLoading(true);
        const res = await axios.get(`${API}/collector/dashboard/stats`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setDashboardStats({
          completed_jobs: Number(res.data?.completed_jobs || 0),
          active_jobs: Number(res.data?.active_jobs || 0),
          pending_jobs: Number(res.data?.pending_jobs || 0),
          eco_points: Number(res.data?.eco_points || 0),
          monthly_completed: Array.isArray(res.data?.monthly_completed) ? res.data.monthly_completed : [],
          recent_completed: Array.isArray(res.data?.recent_completed) ? res.data.recent_completed : []
        });
      } catch {
        setDashboardStats({
          completed_jobs: 0,
          active_jobs: 0,
          pending_jobs: 0,
          eco_points: 0,
          monthly_completed: [],
          recent_completed: []
        });
      } finally {
        setStatsLoading(false);
      }
    };

    fetchDashboardStats();
  }, [token]);

  const chartMax = Math.max(1, ...dashboardStats.monthly_completed.map((item) => item.total));

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
              <h3>Current Active Jobs</h3>
              <p className="stat-value">{dashboardStats.active_jobs}</p>
            </div>
            <div className="stat-card">
              <h3>Completed Pickups</h3>
              <p className="stat-value">{dashboardStats.completed_jobs}</p>
            </div>
            <div className="stat-card">
              <h3>Pending to Start</h3>
              <p className="stat-value">{dashboardStats.pending_jobs}</p>
            </div>
            <div className="stat-card">
              <h3>Eco Points</h3>
              <p className="stat-value">{dashboardStats.eco_points}</p>
            </div>
          </div>

          <div className="dashboard-content chart-panel">
            <div className="content-card">
              <h2>Pickup Activity (Last 6 Months)</h2>
              {statsLoading ? (
                <p className="muted-line">Loading activity...</p>
              ) : dashboardStats.monthly_completed.length === 0 ? (
                <p className="muted-line">No completed pickups in recent months.</p>
              ) : (
                <div className="mini-chart">
                  {dashboardStats.monthly_completed.map((item) => (
                    <div className="mini-bar-col" key={item.ym}>
                      <div className="mini-bar-wrap">
                        <div
                          className="mini-bar"
                          style={{ height: `${Math.max(12, Math.round((item.total / chartMax) * 120))}px` }}
                          title={`${item.ym}: ${item.total}`}
                        />
                      </div>
                      <small className="bar-label">{item.ym}</small>
                      <small className="bar-value">{item.total}</small>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="dashboard-content recent-panel">
            <div className="content-card">
              <h2>Recent Pickup History</h2>
              {dashboardStats.recent_completed.length === 0 ? (
                <p className="muted-line">No completed pickups yet.</p>
              ) : (
                <div className="recent-list">
                  {dashboardStats.recent_completed.map((item) => (
                    <div className="recent-item" key={`${item.request_id}-${item.completed_at}`}>
                      <div>
                        <strong>Request #{item.request_id}</strong>
                        <p>{item.pickup_address || "-"}</p>
                      </div>
                      <div className="recent-meta">
                        <span>{item.request_type}</span>
                        <small>{item.completed_at ? new Date(item.completed_at).toLocaleString() : "-"}</small>
                      </div>
                    </div>
                  ))}
                </div>
              )}
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
                  <label>Status:</label>
                  <span>{collectorData?.status}</span>
                </div>
                <div className="info-item">
                  <label>Vehicle Number:</label>
                  <span>{collectorData?.vehicle_number}</span>
                </div>
                <div className="info-item">
                  <label>Address:</label>
                  <span>{collectorData?.home_address || "-"}</span>
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
