import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import "./CitizenNotifications.css";

const API = "http://localhost:5000/api";

const CitizenNotifications = () => {
  const token = localStorage.getItem("citizenToken");
  const [open, setOpen] = useState(false);
  const [list, setList] = useState([]);
  const [unread, setUnread] = useState(0);

  const fetchNotifications = useCallback(async () => {
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
  }, [token]);

  useEffect(() => {
    fetchNotifications();
    const t = setInterval(fetchNotifications, 10000); // polling
    return () => clearInterval(t);
  }, [fetchNotifications]);

  const markRead = async (id) => {
    await axios.patch(`${API}/notifications/${id}/read`, {}, {
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    });
    fetchNotifications();
  };

  const markAllRead = async () => {
    await axios.patch(`${API}/notifications/read-all`, {}, {
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    });
    fetchNotifications();
  };

  return (
    <div className="cn-wrap">
      <button className="cn-bell" onClick={() => setOpen(!open)}>
        🔔
        {unread > 0 && <span className="cn-badge">{unread}</span>}
      </button>

      {open && (
        <div className="cn-dropdown">
          <div className="cn-head">
            <strong>Notifications</strong>
            {unread > 0 && (
              <button onClick={markAllRead}>Mark all read</button>
            )}
          </div>

          {list.length === 0 ? (
            <div className="cn-empty">No notifications</div>
          ) : (
            list.slice(0, 10).map(n => (
              <div
                key={n.notification_id}
                className={`cn-item ${n.is_read ? "" : "unread"}`}
                onClick={() => markRead(n.notification_id)}
              >
                <strong>{n.title}</strong>
                <p>{n.message}</p>
                <span className="time">
                  {new Date(n.created_at).toLocaleString()}
                </span>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default CitizenNotifications;
