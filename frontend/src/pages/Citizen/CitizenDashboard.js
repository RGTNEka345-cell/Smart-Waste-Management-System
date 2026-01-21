import React, { useState, useEffect } from "react";
import CitizenNavbar from "../../components/Citizen/CitizenNavbar"; // ✅ navbar import
import "./CitizenDashboard.css";

const CitizenDashboard = () => {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [user, setUser] = useState(null);

  // Load logged-in citizen data from localStorage
  useEffect(() => {
    const storedCitizen = localStorage.getItem("citizen");
    if (storedCitizen) {
      setUser(JSON.parse(storedCitizen));
    }
  }, []);

  if (!user) {
    return <p style={{ padding: "20px" }}>Loading citizen data...</p>;
  }

  return (
    <>
      {/* ✅ TOP NAVIGATION BAR */}
      <CitizenNavbar setActiveTab={setActiveTab} />

      <div className="citizen-container">
        <main className="citizen-main">

          {/* Top bar */}
          <div className="top-bar">
            <div>
              <h1>Hello, {user.full_name} 👋</h1>
              <p>{user.address || "-"}</p>
            </div>
            <div className="points">
              🌱 Eco Points: <strong>{user.points || 0}</strong>
            </div>
          </div>

          {/* ================= CONTENT ================= */}

          {activeTab === "dashboard" && (
            <div className="cards">
              <div className="card">
                <h3>Next Collection</h3>
                <p>{user.next_collection || "Not scheduled"}</p>
              </div>

              <div className="card">
                <h3>Total Points</h3>
                <p>{user.points || 0} pts</p>
              </div>

              <div className="card">
                <h3>Status</h3>
                <p>Active Citizen</p>
              </div>
            </div>
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
