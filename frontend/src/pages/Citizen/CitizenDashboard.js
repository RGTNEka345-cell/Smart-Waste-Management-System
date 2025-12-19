import React, { useState, useEffect } from "react";
import "./CitizenDashboard.css";

// Icons as React components for better control
const DashboardIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="3" width="7" height="9" rx="1"/>
    <rect x="14" y="3" width="7" height="5" rx="1"/>
    <rect x="14" y="12" width="7" height="9" rx="1"/>
    <rect x="3" y="16" width="7" height="5" rx="1"/>
  </svg>
);

const RecycleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M3 6h5M9 6v12a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2V6M10 11v5M14 11v5M19 6l-1 5M21 9l-2.5 12a2 2 0 0 1-2 2h-7a2 2 0 0 1-2-2L5 9"/>
  </svg>
);

const CalendarIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
    <line x1="16" y1="2" x2="16" y2="6"/>
    <line x1="8" y1="2" x2="8" y2="6"/>
    <line x1="3" y1="10" x2="21" y2="10"/>
  </svg>
);

const RewardIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="8" r="7"/>
    <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/>
  </svg>
);

const AlertIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
    <line x1="12" y1="9" x2="12" y2="13"/>
    <line x1="12" y1="17" x2="12.01" y2="17"/>
  </svg>
);

const SettingsIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="3"/>
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
  </svg>
);

const CitizenDashboard = () => {
  const [activeTab, setActiveTab] = useState("overview");
  const [userPoints, setUserPoints] = useState(1250);
  const [nextCollection, setNextCollection] = useState("Tomorrow, 9:00 AM");
  const [recentActivity, setRecentActivity] = useState([
    { id: 1, type: "recycle", description: "Plastic bottles recycled", points: 50, time: "2 hours ago" },
    { id: 2, type: "collection", description: "Waste collection completed", points: 30, time: "Yesterday" },
    { id: 3, type: "reward", description: "Monthly recycling bonus", points: 100, time: "3 days ago" },
    { id: 4, type: "report", description: "Reported full bin", points: 20, time: "1 week ago" },
  ]);

  const [wasteStats, setWasteStats] = useState({
    plastic: 65,
    paper: 45,
    glass: 30,
    organic: 80,
    metal: 25
  });

  const [notifications, setNotifications] = useState([
    { id: 1, title: "Collection Reminder", message: "Waste collection scheduled for tomorrow", time: "2 hours ago", read: false },
    { id: 2, title: "Reward Unlocked", message: "You've earned 50 points for proper segregation", time: "1 day ago", read: true },
    { id: 3, title: "Schedule Change", message: "Collection time changed to 10:00 AM", time: "2 days ago", read: true },
  ]);

  // Simulate fetching user data
  useEffect(() => {
    // In a real app, you would fetch from API
    const userData = {
      name: "John Doe",
      address: "123 Green Street, Eco City",
      memberSince: "January 2023",
      wasteCategory: "Premium Recycler"
    };
    setUserData(userData);
  }, []);

  const [userData, setUserData] = useState({
    name: "",
    address: "",
    memberSince: "",
    wasteCategory: ""
  });

  const markNotificationAsRead = (id) => {
    setNotifications(notifications.map(notif => 
      notif.id === id ? {...notif, read: true} : notif
    ));
  };

  const scheduleCollection = () => {
    alert("Collection scheduled successfully! Our team will contact you soon.");
  };

  const reportIssue = () => {
    const issueType = prompt("Enter issue type (Full Bin, Missed Collection, Damaged Bin, Other):");
    if (issueType) {
      alert(`Issue "${issueType}" reported successfully. Our team will address it within 24 hours.`);
    }
  };

  const redeemPoints = () => {
    if (userPoints < 500) {
      alert("You need at least 500 points to redeem rewards.");
      return;
    }
    
    const reward = prompt("Enter reward to redeem (Gift Card, Voucher, Donation):");
    if (reward) {
      const newPoints = userPoints - 500;
      setUserPoints(newPoints);
      alert(`Successfully redeemed ${reward} for 500 points! Remaining points: ${newPoints}`);
    }
  };

  return (
    <div className="dashboard-container">
      {/* Sidebar */}
      <div className="dashboard-sidebar">
        <div className="sidebar-header">
          <div className="logo">
            <div className="logo-icon">♻️</div>
            <h2>WasteWise</h2>
          </div>
          <p className="tagline">Smart Waste Management</p>
        </div>

        <div className="user-profile">
          <div className="avatar">
            {userData.name ? userData.name.charAt(0) : "U"}
          </div>
          <div className="user-info">
            <h3>{userData.name || "Citizen User"}</h3>
            <p>{userData.address || "Loading..."}</p>
            <span className="user-badge">{userData.wasteCategory || "Member"}</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          <button 
            className={`nav-item ${activeTab === "overview" ? "active" : ""}`}
            onClick={() => setActiveTab("overview")}
          >
            <DashboardIcon />
            <span>Dashboard</span>
          </button>
          
          <button 
            className={`nav-item ${activeTab === "schedule" ? "active" : ""}`}
            onClick={() => setActiveTab("schedule")}
          >
            <CalendarIcon />
            <span>Collection Schedule</span>
          </button>
          
          <button 
            className={`nav-item ${activeTab === "recycling" ? "active" : ""}`}
            onClick={() => setActiveTab("recycling")}
          >
            <RecycleIcon />
            <span>Recycling Tracker</span>
          </button>
          
          <button 
            className={`nav-item ${activeTab === "rewards" ? "active" : ""}`}
            onClick={() => setActiveTab("rewards")}
          >
            <RewardIcon />
            <span>Rewards & Points</span>
          </button>
          
          <button 
            className={`nav-item ${activeTab === "alerts" ? "active" : ""}`}
            onClick={() => setActiveTab("alerts")}
          >
            <AlertIcon />
            <span>Notifications</span>
            {notifications.filter(n => !n.read).length > 0 && (
              <span className="notification-badge">
                {notifications.filter(n => !n.read).length}
              </span>
            )}
          </button>
          
          <button 
            className={`nav-item ${activeTab === "settings" ? "active" : ""}`}
            onClick={() => setActiveTab("settings")}
          >
            <SettingsIcon />
            <span>Settings</span>
          </button>
        </nav>

        <div className="sidebar-footer">
          <div className="points-display">
            <div className="points-label">Your Eco Points</div>
            <div className="points-value">{userPoints} pts</div>
          </div>
          <button className="redeem-btn" onClick={redeemPoints}>
            Redeem Rewards
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="dashboard-main">
        {/* Top Bar */}
        <div className="dashboard-topbar">
          <div className="topbar-left">
            <h1>Citizen Dashboard</h1>
            <p className="welcome-text">Welcome back, {userData.name || "Citizen"}! 🌱</p>
          </div>
          <div className="topbar-right">
            <button className="action-btn report-btn" onClick={reportIssue}>
              Report Issue
            </button>
            <button className="action-btn schedule-btn" onClick={scheduleCollection}>
              Schedule Pickup
            </button>
            <div className="date-display">
              {new Date().toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </div>
          </div>
        </div>

        {/* Dashboard Content */}
        <div className="dashboard-content">
          {activeTab === "overview" && (
            <>
              {/* Stats Cards */}
              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-icon" style={{background: "#4caf50"}}>♻️</div>
                  <div className="stat-content">
                    <h3>Next Collection</h3>
                    <p className="stat-value">{nextCollection}</p>
                    <p className="stat-desc">Regular pickup</p>
                  </div>
                </div>
                
                <div className="stat-card">
                  <div className="stat-icon" style={{background: "#2196f3"}}>🏆</div>
                  <div className="stat-content">
                    <h3>Eco Points</h3>
                    <p className="stat-value">{userPoints} points</p>
                    <p className="stat-desc">Top 15% in your area</p>
                  </div>
                </div>
                
                <div className="stat-card">
                  <div className="stat-icon" style={{background: "#ff9800"}}>📊</div>
                  <div className="stat-content">
                    <h3>Recycling Rate</h3>
                    <p className="stat-value">78%</p>
                    <p className="stat-desc">+5% from last month</p>
                  </div>
                </div>
                
                <div className="stat-card">
                  <div className="stat-icon" style={{background: "#9c27b0"}}>🌍</div>
                  <div className="stat-content">
                    <h3>CO₂ Reduced</h3>
                    <p className="stat-value">245 kg</p>
                    <p className="stat-desc">Equivalent to 10 trees</p>
                  </div>
                </div>
              </div>

              {/* Waste Composition Chart */}
              <div className="chart-container">
                <div className="chart-header">
                  <h2>Waste Composition</h2>
                  <span className="chart-update">This month</span>
                </div>
                <div className="waste-chart">
                  {Object.entries(wasteStats).map(([type, percentage]) => (
                    <div key={type} className="chart-bar">
                      <div className="bar-label">
                        <span className="bar-color" style={{
                          backgroundColor: 
                            type === 'plastic' ? '#4caf50' :
                            type === 'paper' ? '#2196f3' :
                            type === 'glass' ? '#ff9800' :
                            type === 'organic' ? '#795548' :
                            '#9e9e9e'
                        }}></span>
                        <span className="bar-type">{type.charAt(0).toUpperCase() + type.slice(1)}</span>
                      </div>
                      <div className="bar-container">
                        <div 
                          className="bar-fill"
                          style={{
                            width: `${percentage}%`,
                            backgroundColor: 
                              type === 'plastic' ? '#4caf50' :
                              type === 'paper' ? '#2196f3' :
                              type === 'glass' ? '#ff9800' :
                              type === 'organic' ? '#795548' :
                              '#9e9e9e'
                          }}
                        ></div>
                        <span className="bar-percentage">{percentage}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent Activity & Notifications */}
              <div className="content-grid">
                <div className="activity-card">
                  <div className="card-header">
                    <h3>Recent Activity</h3>
                    <a href="/activity" className="view-all">View All →</a>
                  </div>
                  <div className="activity-list">
                    {recentActivity.map(activity => (
                      <div key={activity.id} className="activity-item">
                        <div className="activity-icon">
                          {activity.type === 'recycle' && '♻️'}
                          {activity.type === 'collection' && '🗑️'}
                          {activity.type === 'reward' && '🏆'}
                          {activity.type === 'report' && '📋'}
                        </div>
                        <div className="activity-details">
                          <p className="activity-desc">{activity.description}</p>
                          <span className="activity-time">{activity.time}</span>
                        </div>
                        <div className="activity-points">+{activity.points} pts</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="notifications-card">
                  <div className="card-header">
                    <h3>Notifications</h3>
                    <button 
                      className="mark-read"
                      onClick={() => setNotifications(notifications.map(n => ({...n, read: true})))}
                    >
                      Mark all read
                    </button>
                  </div>
                  <div className="notifications-list">
                    {notifications.map(notification => (
                      <div 
                        key={notification.id} 
                        className={`notification-item ${!notification.read ? 'unread' : ''}`}
                        onClick={() => markNotificationAsRead(notification.id)}
                      >
                        <div className="notification-icon">
                          <AlertIcon />
                        </div>
                        <div className="notification-content">
                          <h4>{notification.title}</h4>
                          <p>{notification.message}</p>
                          <span className="notification-time">{notification.time}</span>
                        </div>
                        {!notification.read && <div className="unread-dot"></div>}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="quick-actions">
                <h3>Quick Actions</h3>
                <div className="actions-grid">
                  <button className="action-card" onClick={() => setActiveTab("schedule")}>
                    <div className="action-icon">📅</div>
                    <span>View Full Schedule</span>
                  </button>
                  <button className="action-card" onClick={reportIssue}>
                    <div className="action-icon">⚠️</div>
                    <span>Report Bin Issue</span>
                  </button>
                  <button className="action-card" onClick={() => setActiveTab("rewards")}>
                    <div className="action-icon">🎁</div>
                    <span>Browse Rewards</span>
                  </button>
                  <button className="action-card" onClick={() => window.open('/guide', '_blank')}>
                    <div className="action-icon">📚</div>
                    <span>Recycling Guide</span>
                  </button>
                </div>
              </div>
            </>
          )}

          {activeTab === "schedule" && (
            <div className="tab-content">
              <h2>Collection Schedule</h2>
              <p>Manage your waste collection schedule</p>
              {/* Schedule content would go here */}
            </div>
          )}

          {activeTab === "rewards" && (
            <div className="tab-content">
              <h2>Rewards & Points</h2>
              <p>Redeem your eco points for rewards</p>
              {/* Rewards content would go here */}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CitizenDashboard;