import React, { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { FaBell } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import "./CollectorNotifications.css";

const API = "http://localhost:5000/api";

const CollectorNotifications = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem("collectorToken");
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);

  const unreadCount = useMemo(
    () => notifications.filter((item) => !item.is_read).length,
    [notifications]
  );

  const authHeaders = useMemo(
    () => (token ? { Authorization: `Bearer ${token}` } : {}),
    [token]
  );

  const fetchNotifications = useCallback(async () => {
    if (!token) {
      setNotifications([]);
      return;
    }

    try {
      const res = await axios.get(`${API}/notifications`, {
        headers: authHeaders
      });
      setNotifications(Array.isArray(res.data) ? res.data : []);
    } catch {
      setNotifications([]);
    }
  }, [authHeaders, token]);

  useEffect(() => {
    fetchNotifications();
    const timer = setInterval(fetchNotifications, 10000);
    return () => clearInterval(timer);
  }, [fetchNotifications]);

  const markRead = async (notificationId) => {
    await axios.patch(
      `${API}/notifications/${notificationId}/read`,
      {},
      { headers: authHeaders }
    );
    fetchNotifications();
  };

  const markAllRead = async () => {
    await axios.patch(
      `${API}/notifications/read-all`,
      {},
      { headers: authHeaders }
    );
    fetchNotifications();
  };

  const getTargetPath = (notification) => {
    const text = `${notification.title || ""} ${notification.message || ""}`.toLowerCase();
    if (text.includes("dumping")) return "/collector/illegal-dumping/offers";
    if (notification.request_id || text.includes("pickup")) return "/collector/offers";
    return "/collector/dashboard";
  };

  const openNotification = async (notification) => {
    try {
      if (!notification.is_read) {
        await markRead(notification.notification_id);
      }
    } finally {
      setIsOpen(false);
      navigate(getTargetPath(notification));
    }
  };

  return (
    <div className="collector-notifications">
      <button
        type="button"
        className="collector-notification-trigger"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label="Notifications"
        title="Notifications"
      >
        <FaBell />
        {unreadCount > 0 && (
          <span className="collector-notification-badge">{unreadCount}</span>
        )}
      </button>

      {isOpen && (
        <div className="collector-notification-menu">
          <div className="collector-notification-head">
            <strong>Notifications</strong>
            {unreadCount > 0 && (
              <button type="button" onClick={markAllRead}>
                Mark all read
              </button>
            )}
          </div>

          <div className="collector-notification-list">
            {notifications.length === 0 ? (
              <div className="collector-notification-empty">No notifications</div>
            ) : (
              notifications.slice(0, 10).map((notification) => (
                <button
                  type="button"
                  key={notification.notification_id}
                  className={`collector-notification-item ${
                    notification.is_read ? "" : "unread"
                  }`}
                  onClick={() => openNotification(notification)}
                >
                  <span className="collector-notification-title">
                    {notification.title}
                  </span>
                  <span className="collector-notification-message">
                    {notification.message}
                  </span>
                  <span className="collector-notification-time">
                    {new Date(notification.created_at).toLocaleString()}
                  </span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CollectorNotifications;
