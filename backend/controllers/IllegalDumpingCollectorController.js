const db = require("../config/database");

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

const hasColumn = async (conn, tableName, columnName) => {
  const [rows] = await conn.execute(
    `SELECT 1
     FROM information_schema.columns
     WHERE table_schema = DATABASE()
       AND table_name = ?
       AND column_name = ?
     LIMIT 1`,
    [tableName, columnName]
  );
  return rows.length > 0;
};

const distanceSql = (latCol, lngCol) => `(
  6371 * 2 * ASIN(
    SQRT(
      POWER(SIN((? - ${latCol}) * PI() / 180 / 2), 2) +
      COS(? * PI() / 180) * COS(${latCol} * PI() / 180) *
      POWER(SIN((? - ${lngCol}) * PI() / 180 / 2), 2)
    )
  )
)`;

const addHistory = async (conn, historyTable, reportId, status, note, collectorId) => {
  if (!historyTable) return;
  await conn.execute(
    `INSERT INTO ${historyTable}
     (report_id, status, note, changed_by_role, changed_by_id)
     VALUES (?, ?, ?, 'COLLECTOR', ?)`,
    [reportId, status, note || null, collectorId]
  );
};

const offerNextCollector = async (conn, reportTable, offersTable, reportId) => {
  const [reportRows] = await conn.execute(
    `SELECT report_id, latitude, longitude
     FROM ${reportTable}
     WHERE report_id = ?`,
    [reportId]
  );
  if (reportRows.length === 0) return false;

  const r = reportRows[0];
  const lat = Number(r.latitude);
  const lng = Number(r.longitude);

  const [nextRows] = await conn.execute(
    `SELECT c.collector_id,
            ${distanceSql("gd.working_area_latitude", "gd.working_area_longitude")} AS distance_km
     FROM Government_Details gd
     JOIN Collectors c ON c.collector_id = gd.collector_id
     WHERE c.status = 'APPROVED'
       AND c.collection_type = 'government'
       AND gd.working_area_latitude IS NOT NULL
       AND gd.working_area_longitude IS NOT NULL
       AND c.collector_id NOT IN (
         SELECT collector_id FROM ${offersTable} WHERE report_id = ?
       )
     ORDER BY distance_km ASC
     LIMIT 1`,
    [lat, lat, lng, reportId]
  );

  if (nextRows.length === 0) return false;

  const n = nextRows[0];
  await conn.execute(
    `INSERT INTO ${offersTable}
     (report_id, collector_id, offer_status, distance_km, offered_at, offer_expires_at)
     VALUES (?, ?, 'OFFERED', ?, NOW(), NULL)`,
    [reportId, n.collector_id, n.distance_km]
  );
  await conn.execute(
    `INSERT INTO notifications (recipient_role, recipient_id, title, message)
     VALUES ('COLLECTOR', ?, ?, ?)`,
    [n.collector_id, "New dumping cleanup offer", `Illegal dumping report #${reportId} is available.`]
  );
  return true;
};

exports.listOffers = async (req, res) => {
  try {
    const collectorId = req.collectorId;
    const offersTable = await pickTable(db, ["illegal_dumping_offers"]);
    const reportTable = await pickTable(db, ["illegal_dumping_reports", "illegal_dumping_report"]);
    if (!offersTable || !reportTable) {
      return res.status(500).json({ message: "Illegal dumping tables not found" });
    }

    const [rows] = await db.execute(
      `SELECT o.offer_id, o.report_id, o.offer_status, o.distance_km, o.offered_at,
              r.severity, r.latitude, r.longitude, r.address
       FROM ${offersTable} o
       JOIN ${reportTable} r ON r.report_id = o.report_id
       WHERE o.collector_id = ?
         AND o.offer_status = 'OFFERED'
         AND r.status = 'OFFERING'
       ORDER BY o.offered_at ASC`,
      [collectorId]
    );
    return res.json(rows);
  } catch (err) {
    console.error("Illegal dumping offers list error:", err.message);
    return res.status(500).json({ message: "Failed to load offers" });
  }
};

exports.acceptOffer = async (req, res) => {
  const offerId = parseInt(req.params.id, 10);
  if (!Number.isInteger(offerId)) return res.status(400).json({ message: "Invalid offer id" });

  const collectorId = req.collectorId;
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    const offersTable = await pickTable(conn, ["illegal_dumping_offers"]);
    const reportTable = await pickTable(conn, ["illegal_dumping_reports", "illegal_dumping_report"]);
    const historyTable = await pickTable(conn, ["illegal_dumping_status_history"]);
    if (!offersTable || !reportTable) throw new Error("Illegal dumping tables not found");

    const [offerRows] = await conn.execute(
      `SELECT offer_id, report_id, offer_status
       FROM ${offersTable}
       WHERE offer_id = ? AND collector_id = ?`,
      [offerId, collectorId]
    );
    if (offerRows.length === 0) {
      await conn.rollback();
      return res.status(404).json({ message: "Offer not found" });
    }

    const offer = offerRows[0];
    if (offer.offer_status !== "OFFERED") {
      await conn.rollback();
      return res.status(400).json({ message: "Offer not available" });
    }

    await conn.execute(
      `UPDATE ${offersTable}
       SET offer_status = 'ACCEPTED', responded_at = NOW()
       WHERE offer_id = ?`,
      [offerId]
    );
    await conn.execute(
      `UPDATE ${offersTable}
       SET offer_status = 'REJECTED', responded_at = NOW(), reject_reason = 'Taken by another collector'
       WHERE report_id = ? AND offer_id <> ? AND offer_status = 'OFFERED'`,
      [offer.report_id, offerId]
    );
    await conn.execute(
      `UPDATE ${reportTable}
       SET status = 'ACCEPTED_BY_COLLECTOR'
       WHERE report_id = ?`,
      [offer.report_id]
    );
    await addHistory(conn, historyTable, offer.report_id, "ACCEPTED_BY_COLLECTOR", "Offer accepted", collectorId);

    const [[citizen]] = await conn.execute(
      `SELECT reported_by_citizen_id FROM ${reportTable} WHERE report_id = ?`,
      [offer.report_id]
    );
    if (citizen?.reported_by_citizen_id) {
      await conn.execute(
        `INSERT INTO notifications (recipient_role, recipient_id, title, message)
         VALUES ('CITIZEN', ?, ?, ?)`,
        [citizen.reported_by_citizen_id, "Collector assigned", `A collector accepted report #${offer.report_id}.`]
      );
    }

    await conn.commit();
    return res.json({ success: true });
  } catch (err) {
    await conn.rollback();
    console.error("Illegal dumping accept offer error:", err.message);
    return res.status(500).json({ message: "Failed to accept offer" });
  } finally {
    conn.release();
  }
};

exports.rejectOffer = async (req, res) => {
  const offerId = parseInt(req.params.id, 10);
  if (!Number.isInteger(offerId)) return res.status(400).json({ message: "Invalid offer id" });

  const collectorId = req.collectorId;
  const reason = (req.body?.reason || "").toString().trim() || null;
  const conn = await db.getConnection();

  try {
    await conn.beginTransaction();
    const offersTable = await pickTable(conn, ["illegal_dumping_offers"]);
    const reportTable = await pickTable(conn, ["illegal_dumping_reports", "illegal_dumping_report"]);
    if (!offersTable || !reportTable) throw new Error("Illegal dumping tables not found");

    const [offerRows] = await conn.execute(
      `SELECT offer_id, report_id, offer_status
       FROM ${offersTable}
       WHERE offer_id = ? AND collector_id = ?`,
      [offerId, collectorId]
    );
    if (offerRows.length === 0) {
      await conn.rollback();
      return res.status(404).json({ message: "Offer not found" });
    }
    const offer = offerRows[0];
    if (offer.offer_status !== "OFFERED") {
      await conn.rollback();
      return res.status(400).json({ message: "Offer not available" });
    }

    await conn.execute(
      `UPDATE ${offersTable}
       SET offer_status = 'REJECTED', reject_reason = ?, responded_at = NOW()
       WHERE offer_id = ?`,
      [reason, offerId]
    );

    const hasNext = await offerNextCollector(conn, reportTable, offersTable, offer.report_id);
    if (!hasNext) {
      await conn.execute(
        `UPDATE ${reportTable}
         SET status = 'APPROVED_ADMIN'
         WHERE report_id = ?`,
        [offer.report_id]
      );
      const [admins] = await conn.execute(`SELECT admin_id FROM admins`);
      if (admins.length > 0) {
        const values = admins.map((a) => [
          "ADMIN",
          a.admin_id,
          "No collector accepted",
          `All offered collectors rejected illegal dumping report #${offer.report_id}.`
        ]);
        await conn.query(
          `INSERT INTO notifications (recipient_role, recipient_id, title, message)
           VALUES ?`,
          [values]
        );
      }
    }

    await conn.commit();
    return res.json({ success: true });
  } catch (err) {
    await conn.rollback();
    console.error("Illegal dumping reject offer error:", err.message);
    return res.status(500).json({ message: "Failed to reject offer" });
  } finally {
    conn.release();
  }
};

exports.getActiveJob = async (req, res) => {
  try {
    const collectorId = req.collectorId;
    const offersTable = await pickTable(db, ["illegal_dumping_offers"]);
    const reportTable = await pickTable(db, ["illegal_dumping_reports", "illegal_dumping_report"]);
    if (!offersTable || !reportTable) {
      return res.status(500).json({ message: "Illegal dumping tables not found" });
    }

    const [rows] = await db.execute(
      `SELECT r.report_id, r.status, r.severity, r.description, r.latitude, r.longitude, r.address, o.distance_km
       FROM ${reportTable} r
       JOIN ${offersTable} o ON o.report_id = r.report_id
       WHERE o.collector_id = ?
         AND o.offer_status = 'ACCEPTED'
         AND r.status IN ('ACCEPTED_BY_COLLECTOR', 'IN_PROGRESS')
       ORDER BY o.responded_at DESC
       LIMIT 1`,
      [collectorId]
    );

    return res.json(rows[0] || null);
  } catch (err) {
    console.error("Illegal dumping active job error:", err.message);
    return res.status(500).json({ message: "Failed to load active job" });
  }
};

exports.startJob = async (req, res) => {
  const reportId = parseInt(req.params.id, 10);
  if (!Number.isInteger(reportId)) return res.status(400).json({ message: "Invalid report id" });

  const collectorId = req.collectorId;
  const conn = await db.getConnection();

  try {
    await conn.beginTransaction();
    const offersTable = await pickTable(conn, ["illegal_dumping_offers"]);
    const reportTable = await pickTable(conn, ["illegal_dumping_reports", "illegal_dumping_report"]);
    const historyTable = await pickTable(conn, ["illegal_dumping_status_history"]);
    if (!offersTable || !reportTable) throw new Error("Illegal dumping tables not found");

    const [rows] = await conn.execute(
      `SELECT o.offer_id, o.offer_status, r.status, r.reported_by_citizen_id
       FROM ${offersTable} o
       JOIN ${reportTable} r ON r.report_id = o.report_id
       WHERE o.report_id = ? AND o.collector_id = ?
       ORDER BY o.offer_id DESC
       LIMIT 1`,
      [reportId, collectorId]
    );
    if (rows.length === 0 || rows[0].offer_status !== "ACCEPTED") {
      await conn.rollback();
      return res.status(403).json({ message: "Unauthorized collector access" });
    }
    if (rows[0].status === "IN_PROGRESS") {
      await conn.commit();
      return res.json({ success: true, message: "Cleanup already started" });
    }
    if (rows[0].status !== "ACCEPTED_BY_COLLECTOR") {
      await conn.rollback();
      return res.status(400).json({ message: `Cannot start this report now (status: ${rows[0].status})` });
    }

    await conn.execute(`UPDATE ${reportTable} SET status = 'IN_PROGRESS' WHERE report_id = ?`, [reportId]);
    await addHistory(conn, historyTable, reportId, "IN_PROGRESS", "Collector started cleanup", collectorId);

    await conn.execute(
      `INSERT INTO notifications (recipient_role, recipient_id, title, message)
       VALUES ('CITIZEN', ?, ?, ?)`,
      [rows[0].reported_by_citizen_id, "Cleanup started", `Collector started cleanup for report #${reportId}.`]
    );

    await conn.commit();
    return res.json({ success: true });
  } catch (err) {
    await conn.rollback();
    console.error("Illegal dumping start job error:", err.message);
    return res.status(500).json({ message: "Failed to start cleanup" });
  } finally {
    conn.release();
  }
};

exports.completeJob = async (req, res) => {
  const reportId = parseInt(req.params.id, 10);
  if (!Number.isInteger(reportId)) return res.status(400).json({ message: "Invalid report id" });

  const collectorId = req.collectorId;
  const notes = (req.body?.notes || "").toString().trim() || null;
  const files = Array.isArray(req.files) ? req.files : [];
  if (files.length === 0) return res.status(400).json({ message: "Upload at least 1 AFTER photo" });

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    const offersTable = await pickTable(conn, ["illegal_dumping_offers"]);
    const reportTable = await pickTable(conn, ["illegal_dumping_reports", "illegal_dumping_report"]);
    const photosTable = await pickTable(conn, ["illegal_dumping_photos", "illegal_dumping_photo"]);
    const historyTable = await pickTable(conn, ["illegal_dumping_status_history"]);
    if (!offersTable || !reportTable || !photosTable) throw new Error("Illegal dumping tables not found");

    const [rows] = await conn.execute(
      `SELECT o.offer_id, o.offer_status, r.status, r.reported_by_citizen_id
       FROM ${offersTable} o
       JOIN ${reportTable} r ON r.report_id = o.report_id
       WHERE o.report_id = ? AND o.collector_id = ?
       ORDER BY o.offer_id DESC
       LIMIT 1`,
      [reportId, collectorId]
    );
    if (rows.length === 0 || rows[0].offer_status !== "ACCEPTED") {
      await conn.rollback();
      return res.status(403).json({ message: "Unauthorized collector access" });
    }
    // Allow complete directly after accept if start step was skipped.
    if (rows[0].status === "ACCEPTED_BY_COLLECTOR") {
      await conn.execute(
        `UPDATE ${reportTable}
         SET status = 'IN_PROGRESS'
         WHERE report_id = ?`,
        [reportId]
      );
      await addHistory(conn, historyTable, reportId, "IN_PROGRESS", "Auto-start before completion", collectorId);
    } else if (rows[0].status !== "IN_PROGRESS") {
      await conn.rollback();
      return res.status(400).json({ message: `Cleanup cannot be completed now (status: ${rows[0].status})` });
    }

    const hasIsOpen = await hasColumn(conn, reportTable, "is_open");
    let cleanedSet = false;
    const updateCleanedSql = hasIsOpen
      ? `UPDATE ${reportTable} SET status = ?, is_open = 0 WHERE report_id = ?`
      : `UPDATE ${reportTable} SET status = ? WHERE report_id = ?`;

    try {
      await conn.execute(updateCleanedSql, ["CLEANED", reportId]);
      cleanedSet = true;
    } catch {
      // Some schemas use COMPLETED instead of CLEANED.
      await conn.execute(updateCleanedSql, ["COMPLETED", reportId]);
      cleanedSet = true;
    }

    if (!cleanedSet) {
      throw new Error("Failed to set cleaned/completed status");
    }
    await addHistory(conn, historyTable, reportId, "CLEANED", notes || "Cleanup completed", collectorId);

    for (const f of files) {
      await conn.execute(
        `INSERT INTO ${photosTable}
         (report_id, photo_url, photo_type, uploaded_by_role, uploaded_by_id)
         VALUES (?, ?, 'AFTER', 'COLLECTOR', ?)`,
        [reportId, `/uploads/illegal_dumping/${f.filename}`, collectorId]
      );
    }

    await conn.execute(
      `INSERT INTO notifications (recipient_role, recipient_id, title, message)
       VALUES ('CITIZEN', ?, ?, ?)`,
      [rows[0].reported_by_citizen_id, "Area cleaned", `Illegal dumping report #${reportId} has been cleaned.`]
    );

    const [admins] = await conn.execute(`SELECT admin_id FROM admins`);
    if (admins.length > 0) {
      const values = admins.map((a) => [
        "ADMIN",
        a.admin_id,
        "Dumping cleanup completed",
        `Collector completed illegal dumping report #${reportId}.`
      ]);
      await conn.query(
        `INSERT INTO notifications (recipient_role, recipient_id, title, message)
         VALUES ?`,
        [values]
      );
    }

    await conn.commit();
    return res.json({ success: true });
  } catch (err) {
    await conn.rollback();
    console.error("Illegal dumping complete job error:", err.message);
    return res.status(500).json({ message: err?.message || "Failed to complete cleanup" });
  } finally {
    conn.release();
  }
};

exports.listHistory = async (req, res) => {
  try {
    const collectorId = req.collectorId;
    const offersTable = await pickTable(db, ["illegal_dumping_offers"]);
    const reportTable = await pickTable(db, ["illegal_dumping_reports", "illegal_dumping_report"]);
    const photosTable = await pickTable(db, ["illegal_dumping_photos", "illegal_dumping_photo"]);
    const historyTable = await pickTable(db, ["illegal_dumping_status_history"]);
    if (!offersTable || !reportTable) {
      return res.status(500).json({ message: "Illegal dumping tables not found" });
    }

    const withPhotos = photosTable
      ? `(
          SELECT COUNT(*)
          FROM ${photosTable} p
          WHERE p.report_id = r.report_id
            AND p.photo_type = 'AFTER'
        ) AS after_photo_count`
      : "0 AS after_photo_count";

    const withHistory = historyTable
      ? `MAX(CASE WHEN h.status = 'IN_PROGRESS' THEN h.changed_at END) AS started_at,
         MAX(CASE WHEN h.status IN ('CLEANED', 'COMPLETED') THEN h.changed_at END) AS completed_at`
      : "NULL AS started_at, NULL AS completed_at";

    const historyJoin = historyTable
      ? `LEFT JOIN ${historyTable} h ON h.report_id = r.report_id`
      : "";

    const orderCompletedAt = historyTable
      ? `MAX(CASE WHEN h.status IN ('CLEANED', 'COMPLETED') THEN h.changed_at END)`
      : "r.updated_at";

    const completedWhere = historyTable
      ? `(r.status IN ('CLEANED', 'COMPLETED')
          OR EXISTS (
            SELECT 1
            FROM ${historyTable} hx
            WHERE hx.report_id = r.report_id
              AND hx.status IN ('CLEANED', 'COMPLETED')
          ))`
      : `r.status IN ('CLEANED', 'COMPLETED')`;

    const [rows] = await db.execute(
      `SELECT r.report_id, r.title, r.description, r.severity, r.status, r.address, r.latitude, r.longitude,
              r.created_at, r.updated_at, o.distance_km, o.responded_at AS accepted_at,
              ${withPhotos},
              ${withHistory}
       FROM ${offersTable} o
       JOIN ${reportTable} r ON r.report_id = o.report_id
       ${historyJoin}
       WHERE o.collector_id = ?
         AND o.offer_status = 'ACCEPTED'
         AND ${completedWhere}
       GROUP BY r.report_id, r.title, r.description, r.severity, r.status, r.address, r.latitude, r.longitude,
                r.created_at, r.updated_at, o.distance_km, o.responded_at
       ORDER BY COALESCE(${orderCompletedAt}, r.updated_at) DESC`
      ,
      [collectorId]
    );

    return res.json(rows);
  } catch (err) {
    console.error("Illegal dumping history list error:", err.message);
    return res.status(500).json({ message: "Failed to load dumping history" });
  }
};
