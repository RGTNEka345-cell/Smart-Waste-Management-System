const db = require("../config/database");

const VALID_REQUEST_TYPES = new Set(["NORMAL", "SPECIAL"]);
const VALID_TARGET_TYPES = new Set(["government", "factory"]);
const VALID_UNITS = new Set(["kg", "bag", "piece", "other"]);

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
         AND status IN ('PENDING_ADMIN','APPROVED_ADMIN','ASSIGNING','ACCEPTED_BY_COLLECTOR','IN_PROGRESS')
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
