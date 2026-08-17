const jwt = require("jsonwebtoken");
const db = require("../config/database");
const { addEcoPoints } = require("../utils/ecoPoints");

const VALID_SEVERITY = new Set(["LOW", "MEDIUM", "HIGH"]);
const NEARBY_BLOCK_METERS = 120;

const resolveCitizenId = (req) => {
  const bodyId = req.body?.citizen_id;
  const queryId = req.query?.citizen_id;
  const headerId = req.headers["x-citizen-id"];
  const auth = req.headers.authorization || "";
  const bearer = auth.startsWith("Bearer ") ? auth.slice(7).trim() : "";

  const directId = parseInt(bodyId || queryId || headerId, 10);
  if (Number.isInteger(directId)) return directId;

  if (!bearer) return null;

  const tokenNumeric = parseInt(bearer, 10);
  if (Number.isInteger(tokenNumeric)) return tokenNumeric;

  try {
    const payload = jwt.verify(
      bearer,
      process.env.JWT_SECRET || "wastewise-secret-key-123"
    );
    const jwtId = parseInt(payload?.userId || payload?.id, 10);
    return Number.isInteger(jwtId) ? jwtId : null;
  } catch {
    return null;
  }
};

const pickTable = async (conn, candidates) => {
  const placeholders = candidates.map(() => "?").join(",");
  const [rows] = await conn.execute(
    `SELECT table_name
     FROM information_schema.tables
     WHERE table_schema = DATABASE()
       AND table_name IN (${placeholders})
     ORDER BY FIELD(table_name, ${placeholders})
     LIMIT 1`,
    [...candidates, ...candidates]
  );
  return rows[0]?.table_name || null;
};

exports.createReport = async (req, res) => {
  const citizenId = resolveCitizenId(req);
  const title = req.body?.title ? String(req.body.title).trim() : null;
  const description = req.body?.description ? String(req.body.description).trim() : "";
  const severity = String(req.body?.severity || "MEDIUM").toUpperCase();
  const latitude = Number(req.body?.latitude);
  const longitude = Number(req.body?.longitude);
  const address = req.body?.address ? String(req.body.address).trim() : null;
  const files = Array.isArray(req.files) ? req.files : [];

  if (!Number.isInteger(citizenId)) {
    return res.status(400).json({ message: "citizen_id is required" });
  }
  if (!description) {
    return res.status(400).json({ message: "Description is required" });
  }
  if (!VALID_SEVERITY.has(severity)) {
    return res.status(400).json({ message: "Invalid severity" });
  }
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return res.status(400).json({ message: "Latitude/Longitude required" });
  }
  if (files.length === 0) {
    return res.status(400).json({ message: "Upload at least 1 photo" });
  }

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const reportTable = await pickTable(conn, [
      "illegal_dumping_reports",
      "illegal_dumping_report"
    ]);
    if (!reportTable) {
      throw new Error("illegal_dumping_report(s) table not found");
    }

    const photosTable = await pickTable(conn, [
      "illegal_dumping_photos",
      "illegal_dumping_photo"
    ]);
    if (!photosTable) {
      throw new Error("illegal_dumping_photos table not found");
    }

    const historyTable = await pickTable(conn, [
      "illegal_dumping_status_history"
    ]);

    // Block duplicate/nearby open reports (same place or very close).
    const [nearbyRows] = await conn.execute(
      `SELECT report_id,
              (
                6371000 * 2 * ASIN(
                  SQRT(
                    POWER(SIN((? - latitude) * PI() / 180 / 2), 2) +
                    COS(? * PI() / 180) * COS(latitude * PI() / 180) *
                    POWER(SIN((? - longitude) * PI() / 180 / 2), 2)
                  )
                )
              ) AS distance_m
       FROM ${reportTable}
       WHERE COALESCE(is_open, 1) = 1
       HAVING distance_m <= ?
       ORDER BY distance_m ASC
       LIMIT 1`,
      [latitude, latitude, longitude, NEARBY_BLOCK_METERS]
    );

    if (nearbyRows.length > 0) {
      await conn.rollback();
      const nearest = nearbyRows[0];
      return res.status(409).json({
        message: `A report already exists within ${NEARBY_BLOCK_METERS}m of this location (Report #${nearest.report_id}).`
      });
    }

    const [insertResult] = await conn.execute(
      `INSERT INTO ${reportTable}
       (reported_by_citizen_id, title, description, severity, latitude, longitude, address, status, is_open)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'PENDING_ADMIN', 1)`,
      [citizenId, title, description, severity, latitude, longitude, address]
    );

    const reportId = insertResult.insertId;

    for (const file of files) {
      const photoUrl = `/uploads/illegal_dumping/${file.filename}`;
      await conn.execute(
        `INSERT INTO ${photosTable}
         (report_id, photo_url, photo_type, uploaded_by_role, uploaded_by_id)
         VALUES (?, ?, 'BEFORE', 'CITIZEN', ?)`,
        [reportId, photoUrl, citizenId]
      );
    }

    if (historyTable) {
      await conn.execute(
        `INSERT INTO ${historyTable}
         (report_id, status, note, changed_by_role, changed_by_id)
         VALUES (?, 'PENDING_ADMIN', ?, 'CITIZEN', ?)`,
        [reportId, "Report submitted", citizenId]
      );
    }

    const [admins] = await conn.execute(`SELECT admin_id FROM admins`);
    if (admins.length > 0) {
      const values = admins.map((a) => [
        "ADMIN",
        a.admin_id,
        "New illegal dumping report",
        `Citizen submitted report #${reportId}.`
      ]);
      await conn.query(
        `INSERT INTO notifications (recipient_role, recipient_id, title, message)
         VALUES ?`,
        [values]
      );
    }

    await conn.execute(
      `INSERT INTO notifications (recipient_role, recipient_id, title, message)
       VALUES ('CITIZEN', ?, ?, ?)`,
      [citizenId, "Report submitted", `Your illegal dumping report #${reportId} has been submitted.`]
    );

    await addEcoPoints(conn, {
      citizenId,
      actionType: "ILLEGAL_DUMP_REPORT",
      referenceId: reportId,
      description: `Illegal dumping report #${reportId} submitted`
    });

    await conn.commit();
    return res.status(201).json({
      success: true,
      report_id: reportId,
      photos_saved: files.length
    });
  } catch (err) {
    await conn.rollback();
    if (err?.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        message: "An open report already exists for this location."
      });
    }
    console.error("Create illegal dumping report error:", err.message);
    return res.status(500).json({ message: "Failed to submit report" });
  } finally {
    conn.release();
  }
};

exports.getMyReports = async (req, res) => {
  const citizenId = resolveCitizenId(req);
  if (!Number.isInteger(citizenId)) {
    return res.status(400).json({ message: "citizen_id is required" });
  }

  try {
    const reportTable = await pickTable(db, [
      "illegal_dumping_reports",
      "illegal_dumping_report"
    ]);
    if (!reportTable) {
      throw new Error("illegal_dumping_report(s) table not found");
    }

    const [rows] = await db.execute(
      `SELECT report_id, severity, status, latitude, longitude, address, created_at
       FROM ${reportTable}
       WHERE reported_by_citizen_id = ?
       ORDER BY created_at DESC`,
      [citizenId]
    );
    return res.json(rows);
  } catch (err) {
    console.error("Get my illegal dumping reports error:", err.message);
    return res.status(500).json({ message: "Failed to load reports" });
  }
};

exports.getMyReportDetails = async (req, res) => {
  const citizenId = resolveCitizenId(req);
  const reportId = parseInt(req.params?.id, 10);

  if (!Number.isInteger(citizenId)) {
    return res.status(400).json({ message: "citizen_id is required" });
  }
  if (!Number.isInteger(reportId)) {
    return res.status(400).json({ message: "Invalid report id" });
  }

  try {
    const reportTable = await pickTable(db, [
      "illegal_dumping_reports",
      "illegal_dumping_report"
    ]);
    if (!reportTable) {
      throw new Error("illegal_dumping_report(s) table not found");
    }

    const photosTable = await pickTable(db, [
      "illegal_dumping_photos",
      "illegal_dumping_photo"
    ]);
    const offersTable = await pickTable(db, ["illegal_dumping_offers"]);
    const historyTable = await pickTable(db, ["illegal_dumping_status_history"]);

    const [reportRows] = await db.execute(
      `SELECT report_id, reported_by_citizen_id, title, description, severity,
              latitude, longitude, address, status, admin_id, admin_remarks,
              approved_at, rejected_at, created_at, updated_at
       FROM ${reportTable}
       WHERE report_id = ? AND reported_by_citizen_id = ?
       LIMIT 1`,
      [reportId, citizenId]
    );

    if (reportRows.length === 0) {
      return res.status(404).json({ message: "Report not found" });
    }

    const [photos] = photosTable
      ? await db.execute(
          `SELECT photo_id, report_id, photo_url, photo_type, uploaded_by_role,
                  uploaded_by_id, uploaded_at
           FROM ${photosTable}
           WHERE report_id = ?
           ORDER BY photo_type ASC, uploaded_at ASC`,
          [reportId]
        )
      : [[]];

    const [offers] = offersTable
      ? await db.execute(
          `SELECT o.offer_id, o.report_id, o.collector_id, o.offer_status,
                  o.distance_km, o.offered_at, o.offer_expires_at,
                  o.responded_at, o.reject_reason,
                  c.full_name AS collector_name,
                  c.phone_number AS collector_phone,
                  c.vehicle_number,
                  c.collection_type
           FROM ${offersTable} o
           LEFT JOIN Collectors c ON c.collector_id = o.collector_id
           WHERE o.report_id = ?
           ORDER BY o.offered_at DESC, o.offer_id DESC`,
          [reportId]
        )
      : [[]];

    const [history] = historyTable
      ? await db.execute(
          `SELECT history_id, report_id, status, note, changed_by_role,
                  changed_by_id, changed_at
           FROM ${historyTable}
           WHERE report_id = ?
           ORDER BY changed_at ASC, history_id ASC`,
          [reportId]
        )
      : [[]];

    const acceptedOffer = offers.find((offer) => offer.offer_status === "ACCEPTED") || null;

    return res.json({
      report: reportRows[0],
      photos,
      offers,
      history,
      collector: acceptedOffer
        ? {
            collector_id: acceptedOffer.collector_id,
            full_name: acceptedOffer.collector_name,
            phone_number: acceptedOffer.collector_phone,
            vehicle_number: acceptedOffer.vehicle_number,
            collection_type: acceptedOffer.collection_type,
            distance_km: acceptedOffer.distance_km,
            accepted_at: acceptedOffer.responded_at
          }
        : null
    });
  } catch (err) {
    console.error("Get illegal dumping report details error:", err.message);
    return res.status(500).json({ message: "Failed to load report details" });
  }
};
