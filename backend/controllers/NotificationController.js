const jwt = require("jsonwebtoken");
const db = require("../config/database");
const SessionManager = require("../utils/SessionManager");

const resolveRecipient = (req) => {
  const roleParam = req.query?.role;
  const idParam = req.query?.recipient_id;
  if (roleParam && idParam) {
    const rid = parseInt(idParam, 10);
    if (Number.isInteger(rid)) {
      return { role: roleParam.toUpperCase(), id: rid };
    }
  }

  const headerCitizen = parseInt(req.headers["x-citizen-id"], 10);
  if (Number.isInteger(headerCitizen)) return { role: "CITIZEN", id: headerCitizen };

  const headerAdmin = parseInt(req.headers["x-admin-id"], 10);
  if (Number.isInteger(headerAdmin)) return { role: "ADMIN", id: headerAdmin };

  const headerCollector = parseInt(req.headers["x-collector-id"], 10);
  if (Number.isInteger(headerCollector)) return { role: "COLLECTOR", id: headerCollector };

  const auth = req.headers.authorization || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7).trim() : "";
  if (!token) return null;

  // Admin JWT
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || "secret123");
    if (payload?.admin_id) {
      return { role: "ADMIN", id: payload.admin_id };
    }
  } catch (_) {
    // ignore
  }

  // Collector session token
  const session = SessionManager.getSession(token);
  if (session?.collectorId) {
    return { role: "COLLECTOR", id: session.collectorId };
  }

  // Citizen fallback (numeric token)
  const numeric = parseInt(token, 10);
  if (Number.isInteger(numeric)) {
    return { role: "CITIZEN", id: numeric };
  }

  return null;
};

exports.listNotifications = async (req, res) => {
  try {
    const recipient = resolveRecipient(req);
    if (!recipient) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const [rows] = await db.execute(
      `SELECT *
       FROM notifications
       WHERE recipient_role = ? AND recipient_id = ?
       ORDER BY created_at DESC`,
      [recipient.role, recipient.id]
    );

    return res.json(rows);
  } catch (err) {
    console.error("List notifications error:", err.message);
    return res.status(500).json({ message: "Failed to load notifications" });
  }
};

exports.markRead = async (req, res) => {
  try {
    const recipient = resolveRecipient(req);
    if (!recipient) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const id = parseInt(req.params.id, 10);
    if (!Number.isInteger(id)) {
      return res.status(400).json({ message: "Invalid notification id" });
    }

    await db.execute(
      `UPDATE notifications
       SET is_read = TRUE, read_at = NOW()
       WHERE notification_id = ?
         AND recipient_role = ?
         AND recipient_id = ?`,
      [id, recipient.role, recipient.id]
    );

    return res.json({ success: true });
  } catch (err) {
    console.error("Mark read error:", err.message);
    return res.status(500).json({ message: "Failed to mark read" });
  }
};

exports.markAllRead = async (req, res) => {
  try {
    const recipient = resolveRecipient(req);
    if (!recipient) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    await db.execute(
      `UPDATE notifications
       SET is_read = TRUE, read_at = NOW()
       WHERE recipient_role = ?
         AND recipient_id = ?
         AND is_read = FALSE`,
      [recipient.role, recipient.id]
    );

    return res.json({ success: true });
  } catch (err) {
    console.error("Mark all read error:", err.message);
    return res.status(500).json({ message: "Failed to mark all read" });
  }
};
