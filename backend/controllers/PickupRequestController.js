const db = require("../config/database");

const VALID_REQUEST_TYPES = new Set(["NORMAL", "SPECIAL"]);
const VALID_TARGET_TYPES = new Set(["government", "factory"]);
const VALID_UNITS = new Set(["kg", "bag", "piece", "other"]);

const getCitizenIdFromRequest = (req) => {
  const queryId = req.query?.citizen_id;
  const headerId = req.headers["x-citizen-id"];
  const auth = req.headers.authorization || "";
  const bearer = auth.startsWith("Bearer ") ? auth.slice(7).trim() : "";

  const pick = queryId || headerId || bearer;
  const id = parseInt(pick, 10);
  return Number.isInteger(id) ? id : null;
};

const parsePayload = (req) => {
  if (req.body && req.body.data) {
    return JSON.parse(req.body.data);
  }
  return req.body || {};
};

exports.createPickupRequest = async (req, res) => {
  let payload = {};

  try {
    payload = parsePayload(req);
  } catch (err) {
    return res.status(400).json({ message: "Invalid payload data" });
  }

  const citizenId = parseInt(payload.citizen_id, 10);
  const requestType = payload.request_type;
  const targetCollectionType = payload.target_collection_type;
  const pickupLatitude = Number(payload.pickup_latitude);
  const pickupLongitude = Number(payload.pickup_longitude);
  const pickupAddress = payload.pickup_address || null;
  const note = payload.note || null;
  const items = Array.isArray(payload.items) ? payload.items : [];

  if (!Number.isInteger(citizenId)) {
    return res.status(400).json({ message: "citizen_id is required" });
  }
  if (!VALID_REQUEST_TYPES.has(requestType)) {
    return res.status(400).json({ message: "Invalid request_type" });
  }
  if (!VALID_TARGET_TYPES.has(targetCollectionType)) {
    return res.status(400).json({ message: "Invalid target_collection_type" });
  }
  if (!Number.isFinite(pickupLatitude) || !Number.isFinite(pickupLongitude)) {
    return res.status(400).json({ message: "pickup latitude/longitude required" });
  }

  const isSpecial = requestType === "SPECIAL";
  if (isSpecial) {
    if (!items[0] || !items[0].wastetype_id) {
      return res.status(400).json({ message: "Special request must include one waste type" });
    }
  }

  const files = Array.isArray(req.files) ? req.files : [];

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const [activeRows] = await conn.execute(
      `SELECT request_id, status
       FROM pickup_requests
       WHERE citizen_id = ? AND request_type = ?
         AND status IN ('PENDING_ADMIN','APPROVED_ADMIN','ASSIGNING','FAILED_TO_ASSIGN','ACCEPTED_BY_COLLECTOR','IN_PROGRESS')
       LIMIT 1`,
      [citizenId, requestType]
    );

    if (activeRows.length > 0) {
      await conn.rollback();
      return res.status(409).json({
        message: "You already have an active pickup request for this type. Please wait until it is completed."
      });
    }

    const [requestResult] = await conn.execute(
      `INSERT INTO pickup_requests
        (citizen_id, request_type, target_collection_type, pickup_latitude, pickup_longitude, pickup_address, note)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        citizenId,
        requestType,
        targetCollectionType,
        pickupLatitude,
        pickupLongitude,
        pickupAddress,
        note
      ]
    );

    const requestId = requestResult.insertId;

    if (isSpecial) {
      const item = items[0];
      const wastetypeId = parseInt(item.wastetype_id, 10);
      const quantity = item.quantity === "" || item.quantity === null || item.quantity === undefined
        ? null
        : Number(item.quantity);
      const unit = VALID_UNITS.has(item.unit) ? item.unit : "other";

      if (!Number.isInteger(wastetypeId)) {
        throw new Error("Invalid wastetype_id");
      }
      if (quantity !== null && !Number.isFinite(quantity)) {
        throw new Error("Invalid quantity");
      }

      await conn.execute(
        `INSERT INTO pickup_request_items (request_id, wastetype_id, quantity, unit)
         VALUES (?, ?, ?, ?)`,
        [requestId, wastetypeId, quantity, unit]
      );
    }

    if (files.length > 0) {
      for (const file of files) {
        const photoUrl = `/uploads/pickup_requests/${file.filename}`;
        await conn.execute(
          `INSERT INTO pickup_request_photos (request_id, photo_url)
           VALUES (?, ?)`,
          [requestId, photoUrl]
        );
      }
    }

    const [admins] = await conn.execute(`SELECT admin_id FROM admins`);
    if (admins.length > 0) {
      const title = "New pickup request";
      const message = `Citizen ${citizenId} submitted a ${requestType} pickup request.`;
      const values = admins.map((a) => [
        "ADMIN",
        a.admin_id,
        requestId,
        title,
        message
      ]);

      await conn.query(
        `INSERT INTO notifications (recipient_role, recipient_id, request_id, title, message)
         VALUES ?`,
        [values]
      );
    }

    await conn.commit();

    return res.status(201).json({
      success: true,
      request_id: requestId,
      photos_saved: files.length
    });
  } catch (err) {
    await conn.rollback();
    console.error("Create pickup request error:", err.message);
    return res.status(500).json({ message: "Failed to create pickup request" });
  } finally {
    conn.release();
  }
};

exports.getMyPickupRequests = async (req, res) => {
  try {
    const citizenId = getCitizenIdFromRequest(req);
    if (!citizenId) {
      return res.status(400).json({ message: "citizen_id is required" });
    }

    const [rows] = await db.execute(
      `SELECT request_id, request_type, status, requested_at
       FROM pickup_requests
       WHERE citizen_id = ?
       ORDER BY requested_at DESC`,
      [citizenId]
    );

    return res.json(rows);
  } catch (err) {
    console.error("Get my pickup requests error:", err.message);
    return res.status(500).json({ message: "Failed to load pickup requests" });
  }
};

exports.getPickupRequestDetails = async (req, res) => {
  try {
    const requestId = parseInt(req.params.id, 10);
    if (!Number.isInteger(requestId)) {
      return res.status(400).json({ message: "Invalid request id" });
    }

    const citizenId = getCitizenIdFromRequest(req);

    const [reqRows] = await db.execute(
      `SELECT *
       FROM pickup_requests
       WHERE request_id = ?`,
      [requestId]
    );

    if (reqRows.length === 0) {
      return res.status(404).json({ message: "Request not found" });
    }

    const request = reqRows[0];
    if (citizenId && request.citizen_id !== citizenId) {
      return res.status(403).json({ message: "Not authorized" });
    }

    const [items] = await db.execute(
      `SELECT pri.item_id, pri.wastetype_id, wt.name AS wastetype_name, pri.quantity, pri.unit
       FROM pickup_request_items pri
       LEFT JOIN wastetypes wt ON wt.id = pri.wastetype_id
       WHERE pri.request_id = ?`,
      [requestId]
    );

    const [photos] = await db.execute(
      `SELECT photo_id, photo_url, photo_type, uploaded_at
       FROM pickup_request_photos
       WHERE request_id = ?
       ORDER BY uploaded_at ASC`,
      [requestId]
    );

    return res.json({
      request,
      items,
      photos,
      collector: null
    });
  } catch (err) {
    console.error("Get pickup request details error:", err.message);
    return res.status(500).json({ message: "Failed to load pickup request" });
  }
};

exports.cancelPickupRequest = async (req, res) => {
  try {
    const requestId = parseInt(req.params.id, 10);
    if (!Number.isInteger(requestId)) {
      return res.status(400).json({ message: "Invalid request id" });
    }

    const citizenId = getCitizenIdFromRequest(req);

    const [rows] = await db.execute(
      `SELECT request_id, citizen_id, status
       FROM pickup_requests
       WHERE request_id = ?`,
      [requestId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "Request not found" });
    }

    const request = rows[0];
    if (citizenId && request.citizen_id !== citizenId) {
      return res.status(403).json({ message: "Not authorized" });
    }

    const cancellable = new Set([
      "PENDING_ADMIN",
      "APPROVED_ADMIN",
      "ASSIGNING",
      "FAILED_TO_ASSIGN"
    ]);

    if (!cancellable.has(request.status)) {
      return res.status(400).json({ message: "Request cannot be cancelled now" });
    }

    await db.execute(
      `UPDATE pickup_requests
       SET status = 'CANCELLED_BY_CITIZEN', cancelled_at = NOW()
       WHERE request_id = ?`,
      [requestId]
    );

    return res.json({ success: true });
  } catch (err) {
    console.error("Cancel pickup request error:", err.message);
    return res.status(500).json({ message: "Failed to cancel pickup request" });
  }
};
