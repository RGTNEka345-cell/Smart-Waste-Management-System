import React, { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import { io } from "socket.io-client";
import { FaPaperPlane, FaSearch, FaSyncAlt, FaUserCircle } from "react-icons/fa";
import AdminNavbar from "../../../components/Admin/AdminNavbar";
import CitizenNavbar from "../../../components/Citizen/CitizenNavbar";
import CollectorNavbar from "../../../components/Collector/CollectorNavbar";
import { getMessageHeaders, getMessageSession } from "../../../utils/messageSession";
import "./RealtimeMessages.css";

const API = "http://localhost:5000/api";
const SOCKET_URL = "http://localhost:5000";

const roleLabels = {
  ADMIN: "Admin",
  COLLECTOR: "Collector",
  CITIZEN: "Citizen"
};

const RealtimeMessages = ({ role }) => {
  const [users, setUsers] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);

  const session = useMemo(() => getMessageSession(role), [role]);
  const headers = useMemo(() => getMessageHeaders(role), [role]);

  const Navbar = role === "admin" ? AdminNavbar : role === "collector" ? CollectorNavbar : CitizenNavbar;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const loadConversations = async () => {
    const res = await axios.get(`${API}/messages/conversations`, { headers });
    setConversations(Array.isArray(res.data) ? res.data : []);
  };

  const loadUsers = async () => {
    const res = await axios.get(`${API}/messages/users`, { headers });
    setUsers(Array.isArray(res.data) ? res.data : []);
  };

  useEffect(() => {
    const loadInitial = async () => {
      try {
        setLoading(true);
        setError("");
        await Promise.all([loadUsers(), loadConversations()]);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load messages.");
      } finally {
        setLoading(false);
      }
    };

    loadInitial();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role]);

  useEffect(() => {
    if (!session.userId) return undefined;

    const socket = io(SOCKET_URL, {
      auth: {
        token: session.token,
        role: session.role,
        userId: session.userId
      }
    });

    socketRef.current = socket;

    socket.on("message:new", (message) => {
      setMessages((current) => {
        if (current.some((item) => item.message_id === message.message_id)) {
          return current;
        }
        if (Number(message.conversation_id) !== Number(activeConversation?.conversation_id)) {
          return current;
        }
        return [...current, message];
      });
    });

    socket.on("conversation:updated", () => {
      loadConversations().catch(() => {});
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session.role, session.userId, session.token, activeConversation?.conversation_id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const openConversation = async (conversation) => {
    try {
      setError("");
      if (activeConversation?.conversation_id) {
        socketRef.current?.emit("leave_conversation", activeConversation.conversation_id);
      }
      setActiveConversation(conversation);
      socketRef.current?.emit("join_conversation", conversation.conversation_id);

      const res = await axios.get(
        `${API}/messages/conversations/${conversation.conversation_id}`,
        { headers }
      );
      setMessages(Array.isArray(res.data) ? res.data : []);
      await axios.patch(
        `${API}/messages/conversations/${conversation.conversation_id}/read`,
        {},
        { headers }
      );
      loadConversations().catch(() => {});
    } catch (err) {
      setError(err.response?.data?.message || "Failed to open conversation.");
    }
  };

  const startConversation = async (user) => {
    try {
      setError("");
      const res = await axios.post(
        `${API}/messages/conversations`,
        {
          recipient_role: user.role,
          recipient_id: user.user_id,
          subject: `${roleLabels[session.role]} to ${roleLabels[user.role]}`
        },
        { headers }
      );

      await loadConversations();
      const nextConversation = {
        conversation_id: res.data.conversation_id,
        other_role: user.role,
        other_id: user.user_id,
        other_name: user.name,
        subject: "Direct Message",
        unread_count: 0
      };
      await openConversation(nextConversation);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to start conversation.");
    }
  };

  const sendMessage = async (event) => {
    event.preventDefault();
    const body = messageText.trim();
    if (!body || !activeConversation || sending) return;

    try {
      setSending(true);
      setError("");
      setMessageText("");
      const res = await axios.post(
        `${API}/messages/conversations/${activeConversation.conversation_id}`,
        { body },
        { headers }
      );
      setMessages((current) => {
        if (current.some((item) => item.message_id === res.data.message_id)) return current;
        return [...current, res.data];
      });
      await loadConversations();
    } catch (err) {
      setMessageText(body);
      setError(err.response?.data?.message || "Failed to send message.");
    } finally {
      setSending(false);
    }
  };

  const filteredUsers = users.filter((user) => {
    const query = search.trim().toLowerCase();
    if (!query) return true;
    return `${user.name} ${user.email} ${user.role}`.toLowerCase().includes(query);
  });

  const groupedUsers = filteredUsers.reduce((groups, user) => {
    groups[user.role] = groups[user.role] || [];
    groups[user.role].push(user);
    return groups;
  }, {});

  return (
    <>
      <Navbar />
      <main className="messages-page">
        <section className="messages-shell">
          <aside className="messages-sidebar">
            <div className="messages-sidebar-header">
              <div>
                <h2>Messages</h2>
                <p>{roleLabels[session.role]} inbox</p>
              </div>
              <button className="message-icon-button" type="button" onClick={loadConversations}>
                <FaSyncAlt />
              </button>
            </div>

            {error && <div className="messages-alert">{error}</div>}

            <div className="conversation-list">
              {loading ? (
                <div className="empty-message">Loading...</div>
              ) : conversations.length === 0 ? (
                <div className="empty-message">No conversations yet.</div>
              ) : (
                conversations.map((conversation) => (
                  <button
                    key={conversation.conversation_id}
                    type="button"
                    className={`conversation-item ${
                      activeConversation?.conversation_id === conversation.conversation_id ? "active" : ""
                    }`}
                    onClick={() => openConversation(conversation)}
                  >
                    <span className="conversation-avatar"><FaUserCircle /></span>
                    <span className="conversation-main">
                      <span className="conversation-name">
                        {conversation.other_name || roleLabels[conversation.other_role] || "User"}
                      </span>
                      <span className="conversation-preview">
                        {conversation.last_message || "Start messaging"}
                      </span>
                    </span>
                    {Number(conversation.unread_count) > 0 && (
                      <span className="unread-badge">{conversation.unread_count}</span>
                    )}
                  </button>
                ))
              )}
            </div>
          </aside>

          <section className="messages-panel">
            <div className="messages-panel-header">
              <div>
                <h3>
                  {activeConversation
                    ? activeConversation.other_name || roleLabels[activeConversation.other_role] || "Conversation"
                    : "Select a conversation"}
                </h3>
                <p>
                  {activeConversation
                    ? roleLabels[activeConversation.other_role] || activeConversation.other_role
                    : "Choose an existing chat or start a new one"}
                </p>
              </div>
            </div>

            <div className="message-thread">
              {!activeConversation ? (
                <div className="thread-placeholder">No conversation selected.</div>
              ) : messages.length === 0 ? (
                <div className="thread-placeholder">Send the first message.</div>
              ) : (
                messages.map((message) => {
                  const mine =
                    message.sender_role === session.role &&
                    Number(message.sender_id) === Number(session.userId);
                  return (
                    <div key={message.message_id} className={`message-row ${mine ? "mine" : "theirs"}`}>
                      <div className="message-bubble">
                        <p>{message.body}</p>
                        <span>
                          {new Date(message.created_at).toLocaleString([], {
                            month: "short",
                            day: "2-digit",
                            hour: "2-digit",
                            minute: "2-digit"
                          })}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            <form className="message-compose" onSubmit={sendMessage}>
              <input
                value={messageText}
                onChange={(event) => setMessageText(event.target.value)}
                placeholder={activeConversation ? "Type a message" : "Select a conversation first"}
                disabled={!activeConversation || sending}
                maxLength={2000}
              />
              <button type="submit" disabled={!messageText.trim() || !activeConversation || sending}>
                <FaPaperPlane />
                <span>Send</span>
              </button>
            </form>
          </section>

          <aside className="messages-users">
            <div className="user-search">
              <FaSearch />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search users"
              />
            </div>

            <div className="user-list">
              {Object.keys(groupedUsers).map((group) => (
                <div className="user-group" key={group}>
                  <h4>{roleLabels[group]}</h4>
                  {groupedUsers[group].map((user) => (
                    <button
                      type="button"
                      key={`${user.role}-${user.user_id}`}
                      className="user-item"
                      onClick={() => startConversation(user)}
                    >
                      <span className="user-avatar"><FaUserCircle /></span>
                      <span>
                        <strong>{user.name}</strong>
                        <small>{user.email}</small>
                      </span>
                    </button>
                  ))}
                </div>
              ))}
            </div>
          </aside>
        </section>
      </main>
    </>
  );
};

export default RealtimeMessages;
