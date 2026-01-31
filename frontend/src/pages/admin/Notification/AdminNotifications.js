import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import "./AdminNotifications.css";

const API = "http://localhost:5000/api";

const AdminNotifications = () => {
  const token = localStorage.getItem("adminToken");
  const [list, setList] = useState([]);
  // unread count can be added later if needed

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/notifications`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      setList(res.data || []);
    } catch {
      setList([]);
    }
  }, [token]);

  useEffect(() => {
    fetchNotifications();
    const t = setInterval(fetchNotifications, 10000);
    return () => clearInterval(t);
  }, [fetchNotifications]);

  const markRead = async (id) => {
    await axios.patch(`${API}/notifications/${id}/read`, {}, {
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    });
    fetchNotifications();
  };

  return (
    <div className="an-wrap">
      <h2>Notifications</h2>

      {list.length === 0 ? (
        <div className="an-card">No notifications</div>
      ) : (
        list.map(n => (
          <div
            key={n.notification_id}
            className={`an-card ${n.is_read ? "" : "unread"}`}
            onClick={() => markRead(n.notification_id)}
          >
            <strong>{n.title}</strong>
            <p>{n.message}</p>
            <span>{new Date(n.created_at).toLocaleString()}</span>
          </div>
        ))
      )}
    </div>
  );
};

export default AdminNotifications;
