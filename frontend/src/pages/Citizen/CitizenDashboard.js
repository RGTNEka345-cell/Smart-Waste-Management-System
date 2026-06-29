import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import CitizenNavbar from "../../components/Citizen/CitizenNavbar";
import "./CitizenDashboard.css";

const CitizenDashboard = () => {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  // Load logged-in citizen data from localStorage
  useEffect(() => {
    const storedCitizen = localStorage.getItem("citizen");
    if (storedCitizen) {
      setUser(JSON.parse(storedCitizen));
    }
  }, []);

  const profileCompletion = useMemo(() => {
    if (!user) return 0;
    const fields = [
      user.full_name,
      user.email,
      user.phone,
      user.address,
      user.date_of_birth,
      user.gender,
      user.latitude,
      user.longitude
    ];
    const filled = fields.filter(Boolean).length;
    return Math.round((filled / fields.length) * 100);
  }, [user]);

  if (!user) {
    return <p style={{ padding: "20px" }}>Loading citizen data...</p>;
  }

  return (
    <>
      {/*  TOP NAVIGATION BAR */}
      <CitizenNavbar setActiveTab={setActiveTab} />

      <div className="citizen-container">
        <main className="citizen-main">

          {/* Hero */}
          <div className="hero">
            <div className="hero-left">
              <p className="hero-kicker">Citizen Dashboard</p>
              <h1>Hi {user.full_name?.split(" ")[0] || "there"}, keep your city clean.</h1>
              <p className="hero-sub">
                Your pickup activity, rewards, and profile progress in one place.
              </p>

              <div className="hero-chips">
                <span className="chip">📍 {user.address || "Address not set"}</span>
                <span className="chip">✅ Active Citizen</span>
                <span className="chip">🕒 Next: {user.next_collection || "Not scheduled"}</span>
              </div>
            </div>

            <div className="hero-right">
              <div className="points-card">
                <div className="points-title">Eco Points</div>
                <div className="points-value">{user.points || 0}</div>
                <div className="points-meta">Earn points by completing pickups</div>
                <button
                  className="ghost-btn"
                  type="button"
                  onClick={() => navigate("/citizen/pickup/requests")}
                >
                  View My Requests →
                </button>
              </div>
            </div>
          </div>

          {/* ================= CONTENT ================= */}

          {activeTab === "dashboard" && (
            <>
              <div className="quick-actions">
                <button
                  className="primary-btn"
                  onClick={() => navigate("/citizen/pickup-request/create")}
                >
                  + Create Pickup Request
                </button>
                <button
                  className="secondary-btn"
                  onClick={() => navigate("/citizen/pickup/requests")}
                >
                  My Pickup Requests
                </button>
                <button
                  className="secondary-btn"
                  onClick={() => navigate("/citizen/profile/update")}
                >
                  Update Profile
                </button>
              </div>

              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-label">Next Collection</div>
                  <div className="stat-value">{user.next_collection || "Not scheduled"}</div>
                  <div className="stat-note">We’ll notify you when scheduled</div>
                </div>

                <div className="stat-card">
                  <div className="stat-label">Citizen Status</div>
                  <div className="stat-value">Active</div>
                  <div className="stat-note">Account verified</div>
                </div>

                <div className="stat-card">
                  <div className="stat-label">Total Points</div>
                  <div className="stat-value">{user.points || 0} pts</div>
                  <div className="stat-note">Redeemable rewards</div>
                </div>
              </div>

              <div className="info-grid">
                <div className="info-card">
                  <h3>Profile Completion</h3>
                  <div className="progress">
                    <div className="progress-bar" style={{ width: `${profileCompletion}%` }} />
                  </div>
                  <p>{profileCompletion}% complete</p>
                  <button
                    className="link-btn"
                    type="button"
                    onClick={() => navigate("/citizen/profile/update")}
                  >
                    Complete Profile →
                  </button>
                </div>

                <div className="info-card highlight">
                  <h3>Quick Tips</h3>
                  <ul className="tips">
                    <li>Sort waste by type before pickup.</li>
                    <li>Upload clear photos for faster approval.</li>
                    <li>Schedule when you’re at home.</li>
                  </ul>
                </div>
              </div>
            </>
          )}

          {activeTab === "request" && (
            <div className="content-box">
              <h2>Request Waste Collection</h2>
              <button className="primary-btn">Request Pickup</button>
            </div>
          )}

          {activeTab === "track" && (
            <div className="content-box">
              <h2>Track Collection</h2>
              <p>No active requests</p>
            </div>
          )}

          {activeTab === "history" && (
            <div className="content-box">
              <h2>Collection History</h2>
              <p>Previous collections will appear here</p>
            </div>
          )}

          {activeTab === "profile" && (
            <div className="content-box">
              <h2>My Profile</h2>
              <table className="profile-table">
                <tbody>
                  <tr><th>Full Name</th><td>{user.full_name}</td></tr>
                  <tr><th>Email</th><td>{user.email}</td></tr>
                  <tr><th>Phone</th><td>{user.phone || "-"}</td></tr>
                  <tr><th>Address</th><td>{user.address || "-"}</td></tr>
                  <tr><th>Date of Birth</th><td>{user.date_of_birth || "-"}</td></tr>
                  <tr><th>Gender</th><td>{user.gender || "-"}</td></tr>
                  <tr><th>Latitude</th><td>{user.latitude || "-"}</td></tr>
                  <tr><th>Longitude</th><td>{user.longitude || "-"}</td></tr>
                  <tr>
                    <th>Photo</th>
                    <td>
                      {user.photo_url ? (
                        <img
                          src={user.photo_url}
                          alt="Profile"
                          style={{ width: "80px", borderRadius: "8px" }}
                        />
                      ) : "-"
                      }
                    </td>
                  </tr>
                  
                  <tr><th>Next Collection</th><td>{user.next_collection || "Not scheduled"}</td></tr>
                  <tr><th>Eco Points</th><td>{user.points || 0} pts</td></tr>
                </tbody>
              </table>
            </div>
          )}

        </main>
      </div>
    </>
  );
};

export default CitizenDashboard;
