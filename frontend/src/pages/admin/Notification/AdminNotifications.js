import React, { useEffect, useState } from "react";
import axios from "axios";
import "./AdminNotifications.css";

const API = "http://localhost:5000/api";

const AdminNotifications = () => {
  const token = localStorage.getItem("adminToken");
  const [list, setList] = useState([]);
  const [unread, setUnread] = useState(0);

  const fetchNotifications = async () => {
    try {
      const res = await axios.get(`${API}/notifications`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      setList(res.data || []);
      setUnread((res.data || []).filter(n => !n.is_read).length);
    } catch {
      setList([]);
      setUnread(0);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const t = setInterval(fetchNotifications, 10000);
    return () => clearInterval(t);
  }, []);

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
