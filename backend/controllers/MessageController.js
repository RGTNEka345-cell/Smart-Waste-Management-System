const db = require("../config/database");
const { conversationRoom, getIo, userRoom } = require("../utils/socket");

let tablesReady = false;

const normalizeRole = (role) => String(role || "").toUpperCase();
const validRoles = new Set(["CITIZEN", "COLLECTOR", "ADMIN"]);

const ensureTables = async () => {
  if (tablesReady) return;

  await db.execute(`
    CREATE TABLE IF NOT EXISTS message_conversations (
      conversation_id INT AUTO_INCREMENT PRIMARY KEY,
      subject VARCHAR(180) NOT NULL DEFAULT 'Direct Message',
      created_by_role ENUM('CITIZEN','COLLECTOR','ADMIN') NOT NULL,
      created_by_id INT NOT NULL,
      last_message TEXT NULL,
      last_message_at DATETIME NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_mc_updated (updated_at),
      INDEX idx_mc_creator (created_by_role, created_by_id)
    ) ENGINE=InnoDB
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS message_participants (
      participant_id INT AUTO_INCREMENT PRIMARY KEY,
      conversation_id INT NOT NULL,
      user_role ENUM('CITIZEN','COLLECTOR','ADMIN') NOT NULL,
      user_id INT NOT NULL,
      last_read_at DATETIME NULL,
      joined_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY uq_mp_user_conversation (conversation_id, user_role, user_id),
      INDEX idx_mp_user (user_role, user_id),
      CONSTRAINT fk_mp_conversation
        FOREIGN KEY (conversation_id) REFERENCES message_conversations(conversation_id)
        ON DELETE CASCADE
    ) ENGINE=InnoDB
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS messages (
      message_id INT AUTO_INCREMENT PRIMARY KEY,
      conversation_id INT NOT NULL,
      sender_role ENUM('CITIZEN','COLLECTOR','ADMIN') NOT NULL,
      sender_id INT NOT NULL,
      body TEXT NOT NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_m_conversation (conversation_id, created_at),
      CONSTRAINT fk_m_conversation
        FOREIGN KEY (conversation_id) REFERENCES message_conversations(conversation_id)
        ON DELETE CASCADE
    ) ENGINE=InnoDB
  `);

  tablesReady = true;
};

const assertParticipant = async (conversationId, actor) => {
  const [[row]] = await db.execute(
    `SELECT participant_id
     FROM message_participants
     WHERE conversation_id = ? AND user_role = ? AND user_id = ?`,
    [conversationId, actor.role, actor.id]
  );
  return Boolean(row);
};

const userSelects = {
  CITIZEN: `
    SELECT 'CITIZEN' AS role, id AS user_id, full_name AS name, email
    FROM citizens
    WHERE id <> ?
  `,
  COLLECTOR: `
    SELECT 'COLLECTOR' AS role, collector_id AS user_id, full_name AS name, email
    FROM Collectors
    WHERE collector_id <> ? AND status = 'APPROVED'
  `,
  ADMIN: `
    SELECT 'ADMIN' AS role, admin_id AS user_id, fullname AS name, email
    FROM admins
    WHERE admin_id <> ?
  `
};

const getDisplayName = async (role, id) => {
  if (role === "CITIZEN") {
    const [[row]] = await db.execute("SELECT full_name AS name FROM citizens WHERE id = ?", [id]);
    return row?.name || "Citizen";
  }
  if (role === "COLLECTOR") {
    const [[row]] = await db.execute("SELECT full_name AS name FROM Collectors WHERE collector_id = ?", [id]);
    return row?.name || "Collector";
  }
  const [[row]] = await db.execute("SELECT fullname AS name FROM admins WHERE admin_id = ?", [id]);
  return row?.name || "Admin";
};

exports.listUsers = async (req, res) => {
  try {
    await ensureTables();
    const actor = req.messageActor;
    const [citizens] = await db.execute(userSelects.CITIZEN, [actor.role === "CITIZEN" ? actor.id : 0]);
    const [collectors] = await db.execute(userSelects.COLLECTOR, [actor.role === "COLLECTOR" ? actor.id : 0]);
    const [admins] = await db.execute(userSelects.ADMIN, [actor.role === "ADMIN" ? actor.id : 0]);

    return res.json([...admins, ...collectors, ...citizens]);
  } catch (err) {
    console.error("List message users error:", err.message);
    return res.status(500).json({ message: "Failed to load users" });
  }
};

exports.listConversations = async (req, res) => {
  try {
    await ensureTables();
    const actor = req.messageActor;
    const [rows] = await db.execute(
      `SELECT
         c.conversation_id,
         c.subject,
         c.last_message,
         c.last_message_at,
         c.updated_at,
         other.user_role AS other_role,
         other.user_id AS other_id,
         CASE
           WHEN other.user_role = 'CITIZEN' THEN ci.full_name
           WHEN other.user_role = 'COLLECTOR' THEN co.full_name
           WHEN other.user_role = 'ADMIN' THEN ad.fullname
         END AS other_name,
         (
           SELECT COUNT(*)
           FROM messages m
           WHERE m.conversation_id = c.conversation_id
             AND NOT (m.sender_role = ? AND m.sender_id = ?)
             AND (mine.last_read_at IS NULL OR m.created_at > mine.last_read_at)
         ) AS unread_count
       FROM message_participants mine
       JOIN message_conversations c ON c.conversation_id = mine.conversation_id
       LEFT JOIN message_participants other
         ON other.conversation_id = c.conversation_id
        AND NOT (other.user_role = mine.user_role AND other.user_id = mine.user_id)
       LEFT JOIN citizens ci ON other.user_role = 'CITIZEN' AND ci.id = other.user_id
       LEFT JOIN Collectors co ON other.user_role = 'COLLECTOR' AND co.collector_id = other.user_id
       LEFT JOIN admins ad ON other.user_role = 'ADMIN' AND ad.admin_id = other.user_id
       WHERE mine.user_role = ? AND mine.user_id = ?
       ORDER BY COALESCE(c.last_message_at, c.updated_at) DESC`,
      [actor.role, actor.id, actor.role, actor.id]
    );

    return res.json(rows);
  } catch (err) {
    console.error("List conversations error:", err.message);
    return res.status(500).json({ message: "Failed to load conversations" });
  }
};

exports.createConversation = async (req, res) => {
  const connection = await db.getConnection();
  try {
    await ensureTables();
    const actor = req.messageActor;
    const recipientRole = normalizeRole(req.body.recipient_role);
    const recipientId = parseInt(req.body.recipient_id, 10);
    const subject = String(req.body.subject || "Direct Message").trim().slice(0, 180);

    if (!validRoles.has(recipientRole) || !Number.isInteger(recipientId) || recipientId <= 0) {
      return res.status(400).json({ message: "Invalid recipient" });
    }
    if (recipientRole === actor.role && recipientId === actor.id) {
      return res.status(400).json({ message: "Cannot message yourself" });
    }

    await connection.beginTransaction();

    const [existing] = await connection.execute(
      `SELECT mine.conversation_id
       FROM message_participants mine
       JOIN message_participants other ON other.conversation_id = mine.conversation_id
       WHERE mine.user_role = ? AND mine.user_id = ?
         AND other.user_role = ? AND other.user_id = ?
       LIMIT 1`,
      [actor.role, actor.id, recipientRole, recipientId]
    );

    if (existing.length > 0) {
      await connection.commit();
      return res.status(200).json({ conversation_id: existing[0].conversation_id });
    }

    const [created] = await connection.execute(
      `INSERT INTO message_conversations (subject, created_by_role, created_by_id)
       VALUES (?, ?, ?)`,
      [subject || "Direct Message", actor.role, actor.id]
    );

    const conversationId = created.insertId;
    await connection.execute(
      `INSERT INTO message_participants (conversation_id, user_role, user_id)
       VALUES (?, ?, ?), (?, ?, ?)`,
      [conversationId, actor.role, actor.id, conversationId, recipientRole, recipientId]
    );

    await connection.commit();
    return res.status(201).json({ conversation_id: conversationId });
  } catch (err) {
    await connection.rollback();
    console.error("Create conversation error:", err.message);
    return res.status(500).json({ message: "Failed to create conversation" });
  } finally {
    connection.release();
  }
};

exports.listMessages = async (req, res) => {
  try {
    await ensureTables();
    const actor = req.messageActor;
    const conversationId = parseInt(req.params.conversationId, 10);
    if (!Number.isInteger(conversationId)) {
      return res.status(400).json({ message: "Invalid conversation" });
    }
    if (!(await assertParticipant(conversationId, actor))) {
      return res.status(403).json({ message: "Conversation access denied" });
    }

    const [rows] = await db.execute(
      `SELECT message_id, conversation_id, sender_role, sender_id, body, created_at
       FROM messages
       WHERE conversation_id = ?
       ORDER BY created_at ASC`,
      [conversationId]
    );

    await db.execute(
      `UPDATE message_participants
       SET last_read_at = NOW()
       WHERE conversation_id = ? AND user_role = ? AND user_id = ?`,
      [conversationId, actor.role, actor.id]
    );

    return res.json(rows);
  } catch (err) {
    console.error("List messages error:", err.message);
    return res.status(500).json({ message: "Failed to load messages" });
  }
};

exports.sendMessage = async (req, res) => {
  try {
    await ensureTables();
    const actor = req.messageActor;
    const conversationId = parseInt(req.params.conversationId, 10);
    const body = String(req.body.body || "").trim();

    if (!Number.isInteger(conversationId)) {
      return res.status(400).json({ message: "Invalid conversation" });
    }
    if (!body) {
      return res.status(400).json({ message: "Message is required" });
    }
    if (!(await assertParticipant(conversationId, actor))) {
      return res.status(403).json({ message: "Conversation access denied" });
    }

    const [result] = await db.execute(
      `INSERT INTO messages (conversation_id, sender_role, sender_id, body)
       VALUES (?, ?, ?, ?)`,
      [conversationId, actor.role, actor.id, body.slice(0, 2000)]
    );

    await db.execute(
      `UPDATE message_conversations
       SET last_message = ?, last_message_at = NOW()
       WHERE conversation_id = ?`,
      [body.slice(0, 2000), conversationId]
    );

    await db.execute(
      `UPDATE message_participants
       SET last_read_at = NOW()
       WHERE conversation_id = ? AND user_role = ? AND user_id = ?`,
      [conversationId, actor.role, actor.id]
    );

    const [[message]] = await db.execute(
      `SELECT message_id, conversation_id, sender_role, sender_id, body, created_at
       FROM messages
       WHERE message_id = ?`,
      [result.insertId]
    );
    message.sender_name = await getDisplayName(actor.role, actor.id);

    const [participants] = await db.execute(
      `SELECT user_role, user_id
       FROM message_participants
       WHERE conversation_id = ?`,
      [conversationId]
    );

    const io = getIo();
    if (io) {
      io.to(conversationRoom(conversationId)).emit("message:new", message);
      participants.forEach((participant) => {
        io.to(userRoom(participant.user_role, participant.user_id)).emit("conversation:updated", {
          conversation_id: conversationId,
          last_message: body.slice(0, 2000),
          last_message_at: message.created_at,
          sender_role: actor.role,
          sender_id: actor.id
        });
      });
    }

    return res.status(201).json(message);
  } catch (err) {
    console.error("Send message error:", err.message);
    return res.status(500).json({ message: "Failed to send message" });
  }
};

exports.markRead = async (req, res) => {
  try {
    await ensureTables();
    const actor = req.messageActor;
    const conversationId = parseInt(req.params.conversationId, 10);
    if (!Number.isInteger(conversationId)) {
      return res.status(400).json({ message: "Invalid conversation" });
    }

    await db.execute(
      `UPDATE message_participants
       SET last_read_at = NOW()
       WHERE conversation_id = ? AND user_role = ? AND user_id = ?`,
      [conversationId, actor.role, actor.id]
    );

    return res.json({ success: true });
  } catch (err) {
    console.error("Mark messages read error:", err.message);
    return res.status(500).json({ message: "Failed to mark messages read" });
  }
};
