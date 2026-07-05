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

const buildDistanceSql = (latCol, lngCol) => {
  return `(
    6371 * 2 * ASIN(
      SQRT(
        POWER(SIN((? - ${latCol}) * PI() / 180 / 2), 2) +
        COS(? * PI() / 180) * COS(${latCol} * PI() / 180) *
        POWER(SIN((? - ${lngCol}) * PI() / 180 / 2), 2)
      )
    )
  )`;
};

const insertHistory = async (conn, historyTable, reportId, status, note, adminId) => {
  if (!historyTable) return;
  await conn.execute(
    `INSERT INTO ${historyTable}
     (report_id, status, note, changed_by_role, changed_by_id)
     VALUES (?, ?, ?, 'ADMIN', ?)`,
    [reportId, status, note || null, adminId]
  );
};

exports.getQueue = async (req, res) => {
  try {
    const status = String(req.query?.status || "PENDING_ADMIN").toUpperCase();
    const reportTable = await pickTable(db, [
      "illegal_dumping_reports",
      "illegal_dumping_report"
    ]);
    const photosTable = await pickTable(db, [
      "illegal_dumping_photos",
      "illegal_dumping_photo"
    ]);

    if (!reportTable) {
      return res.status(500).json({ message: "Illegal dumping report table not found" });
    }

    const [rows] = await db.execute(
      `SELECT r.report_id, r.reported_by_citizen_id, r.title, r.description, r.severity, r.status,
              r.latitude, r.longitude, r.address, r.admin_remarks, r.created_at,
              c.full_name AS citizen_name, c.phone AS citizen_phone
       FROM ${reportTable} r
       JOIN citizens c ON c.id = r.reported_by_citizen_id
       WHERE r.status = ?
       ORDER BY r.created_at ASC`,
      [status]
    );

    if (!photosTable || rows.length === 0) {
      return res.json(rows.map((r) => ({ ...r, photos: [] })));
    }

    const ids = rows.map((r) => r.report_id);
    const placeholders = ids.map(() => "?").join(",");

    const [photos] = await db.execute(
      `SELECT photo_id, report_id, photo_url, photo_type, uploaded_at
       FROM ${photosTable}
       WHERE report_id IN (${placeholders})
       ORDER BY uploaded_at ASC`,
      ids
    );

    const photosByReport = new Map();
    for (const photo of photos) {
      if (!photosByReport.has(photo.report_id)) {
        photosByReport.set(photo.report_id, []);
      }
      photosByReport.get(photo.report_id).push(photo);
    }

    return res.json(
      rows.map((r) => ({
        ...r,
        photos: photosByReport.get(r.report_id) || []
      }))
    );
  } catch (err) {
    console.error("Illegal dumping queue error:", err.message);
    return res.status(500).json({ message: "Failed to load illegal dumping queue" });
  }
};

exports.getHistory = async (req, res) => {
  try {
    const reportTable = await pickTable(db, [
      "illegal_dumping_reports",
      "illegal_dumping_report"
    ]);
    const photosTable = await pickTable(db, [
      "illegal_dumping_photos",
      "illegal_dumping_photo"
    ]);
    const offersTable = await pickTable(db, ["illegal_dumping_offers"]);
    const historyTable = await pickTable(db, ["illegal_dumping_status_history"]);

    if (!reportTable) {
      return res.status(500).json({ message: "Illegal dumping report table not found" });
    }

    const status = String(req.query?.status || "").trim().toUpperCase();
    const allowedStatuses = new Set([
      "REJECTED_ADMIN",
      "APPROVED_ADMIN",
      "OFFERING",
      "ACCEPTED_BY_COLLECTOR",
      "IN_PROGRESS",
      "CLEANED",
      "COMPLETED"
    ]);

    const statusWhere = allowedStatuses.has(status)
      ? "r.status = ?"
      : "r.status <> 'PENDING_ADMIN'";
    const params = allowedStatuses.has(status) ? [status] : [];

    const photoCounts = photosTable
      ? `(
          SELECT COUNT(*)
          FROM ${photosTable} p
          WHERE p.report_id = r.report_id
            AND p.photo_type = 'BEFORE'
        ) AS before_photo_count,
        (
          SELECT COUNT(*)
          FROM ${photosTable} p
          WHERE p.report_id = r.report_id
            AND p.photo_type = 'AFTER'
        ) AS after_photo_count`
      : "0 AS before_photo_count, 0 AS after_photo_count";

    const offerJoin = offersTable
      ? `LEFT JOIN ${offersTable} o
           ON o.report_id = r.report_id
          AND o.offer_status = 'ACCEPTED'
         LEFT JOIN Collectors col ON col.collector_id = o.collector_id`
      : "";

    const offerSelect = offersTable
      ? `o.collector_id,
         col.full_name AS collector_name,
         o.distance_km,
         o.responded_at AS accepted_at`
      : `NULL AS collector_id,
         NULL AS collector_name,
         NULL AS distance_km,
         NULL AS accepted_at`;

    const historyJoin = historyTable
      ? `LEFT JOIN ${historyTable} h ON h.report_id = r.report_id`
      : "";

    const historySelect = historyTable
      ? `MAX(CASE WHEN h.status = 'IN_PROGRESS' THEN h.changed_at END) AS started_at,
         MAX(CASE WHEN h.status IN ('CLEANED', 'COMPLETED') THEN h.changed_at END) AS completed_at`
      : "NULL AS started_at, NULL AS completed_at";

    const groupByOffer = offersTable
      ? ", o.collector_id, col.full_name, o.distance_km, o.responded_at"
      : "";

    const orderDate = historyTable
      ? `COALESCE(
          MAX(CASE WHEN h.status IN ('CLEANED', 'COMPLETED') THEN h.changed_at END),
          r.rejected_at,
          r.approved_at,
          r.updated_at
        )`
      : "COALESCE(r.rejected_at, r.approved_at, r.updated_at)";

    const [rows] = await db.execute(
      `SELECT r.report_id, r.reported_by_citizen_id, r.title, r.description, r.severity,
              r.status, r.latitude, r.longitude, r.address, r.admin_remarks,
              r.approved_at, r.rejected_at, r.created_at, r.updated_at,
              c.full_name AS citizen_name, c.phone AS citizen_phone,
              ${offerSelect},
              ${photoCounts},
              ${historySelect}
       FROM ${reportTable} r
       JOIN citizens c ON c.id = r.reported_by_citizen_id
       ${offerJoin}
       ${historyJoin}
       WHERE ${statusWhere}
       GROUP BY r.report_id, r.reported_by_citizen_id, r.title, r.description, r.severity,
                r.status, r.latitude, r.longitude, r.address, r.admin_remarks,
                r.approved_at, r.rejected_at, r.created_at, r.updated_at,
                c.full_name, c.phone${groupByOffer}
       ORDER BY ${orderDate} DESC`,
      params
    );

    return res.json(rows);
  } catch (err) {
    console.error("Illegal dumping history error:", err.message);
    return res.status(500).json({ message: "Failed to load illegal dumping history" });
  }
};

exports.approve = async (req, res) => {
  const reportId = parseInt(req.params.id, 10);
  if (!Number.isInteger(reportId)) {
    return res.status(400).json({ message: "Invalid report id" });
  }

  const adminId = req.adminId;
  const remarks = req.body?.remarks ? String(req.body.remarks).trim() : null;
  const conn = await db.getConnection();

  try {
    await conn.beginTransaction();

    const reportTable = await pickTable(conn, [
      "illegal_dumping_reports",
      "illegal_dumping_report"
    ]);
    const offersTable = await pickTable(conn, ["illegal_dumping_offers"]);
    const historyTable = await pickTable(conn, ["illegal_dumping_status_history"]);

    if (!reportTable || !offersTable) {
      throw new Error("Illegal dumping tables not found");
    }

    const [reportRows] = await conn.execute(
      `SELECT report_id, reported_by_citizen_id, status, latitude, longitude
       FROM ${reportTable}
       WHERE report_id = ?`,
      [reportId]
    );

    if (reportRows.length === 0) {
      await conn.rollback();
      return res.status(404).json({ message: "Report not found" });
    }

    const report = reportRows[0];
    if (report.status !== "PENDING_ADMIN") {
      await conn.rollback();
      return res.status(400).json({ message: "Report is not pending admin approval" });
    }

    await conn.execute(
      `UPDATE ${reportTable}
       SET status = 'APPROVED_ADMIN',
           admin_id = ?,
           admin_remarks = ?,
           approved_at = NOW()
       WHERE report_id = ?`,
      [adminId, remarks, reportId]
    );
    await insertHistory(conn, historyTable, reportId, "APPROVED_ADMIN", remarks, adminId);

    const lat = Number(report.latitude);
    const lng = Number(report.longitude);

    const [collectors] = await conn.execute(
      `SELECT c.collector_id,
              ${buildDistanceSql("gd.working_area_latitude", "gd.working_area_longitude")} AS distance_km
       FROM Government_Details gd
       JOIN Collectors c ON c.collector_id = gd.collector_id
       WHERE c.status = 'APPROVED'
         AND c.collection_type = 'government'
         AND gd.working_area_latitude IS NOT NULL
         AND gd.working_area_longitude IS NOT NULL
       ORDER BY distance_km ASC
       LIMIT 1`,
      [lat, lat, lng]
    );

    if (collectors.length > 0) {
      const selected = collectors[0];
      await conn.execute(
        `INSERT INTO ${offersTable}
         (report_id, collector_id, offer_status, distance_km, offered_at, offer_expires_at)
         VALUES (?, ?, 'OFFERED', ?, NOW(), NULL)`,
        [reportId, selected.collector_id, selected.distance_km]
      );

      await conn.execute(
        `UPDATE ${reportTable}
         SET status = 'OFFERING'
         WHERE report_id = ?`,
        [reportId]
      );
      await insertHistory(
        conn,
        historyTable,
        reportId,
        "OFFERING",
        "Offered to nearest government collector",
        adminId
      );

      await conn.execute(
        `INSERT INTO notifications (recipient_role, recipient_id, title, message)
         VALUES ('COLLECTOR', ?, ?, ?)`,
        [
          selected.collector_id,
          "New dumping cleanup offer",
          `Illegal dumping report #${reportId} has been assigned for your response.`
        ]
      );
    }

    await conn.execute(
      `INSERT INTO notifications (recipient_role, recipient_id, title, message)
       VALUES ('CITIZEN', ?, ?, ?)`,
      [
        report.reported_by_citizen_id,
        "Dumping report approved",
        `Your illegal dumping report #${reportId} was approved by admin.`
      ]
    );

    await conn.commit();
    return res.json({ success: true });
  } catch (err) {
    await conn.rollback();
    console.error("Approve illegal dumping report error:", err.message);
    return res.status(500).json({ message: "Failed to approve report" });
  } finally {
    conn.release();
  }
};

exports.reject = async (req, res) => {
  const reportId = parseInt(req.params.id, 10);
  if (!Number.isInteger(reportId)) {
    return res.status(400).json({ message: "Invalid report id" });
  }

  const adminId = req.adminId;
  const remarks = req.body?.remarks ? String(req.body.remarks).trim() : "";
  const conn = await db.getConnection();

  try {
    await conn.beginTransaction();

    const reportTable = await pickTable(conn, [
      "illegal_dumping_reports",
      "illegal_dumping_report"
    ]);
    const historyTable = await pickTable(conn, ["illegal_dumping_status_history"]);
    if (!reportTable) throw new Error("Illegal dumping report table not found");

    const [reportRows] = await conn.execute(
      `SELECT report_id, reported_by_citizen_id, status
       FROM ${reportTable}
       WHERE report_id = ?`,
      [reportId]
    );

    if (reportRows.length === 0) {
      await conn.rollback();
      return res.status(404).json({ message: "Report not found" });
    }

    const report = reportRows[0];
    if (report.status !== "PENDING_ADMIN") {
      await conn.rollback();
      return res.status(400).json({ message: "Report is not pending admin approval" });
    }

    await conn.execute(
      `UPDATE ${reportTable}
       SET status = 'REJECTED_ADMIN',
           admin_id = ?,
           admin_remarks = ?,
           rejected_at = NOW(),
           is_open = 0
       WHERE report_id = ?`,
      [adminId, remarks || null, reportId]
    );
    await insertHistory(conn, historyTable, reportId, "REJECTED_ADMIN", remarks, adminId);

    await conn.execute(
      `INSERT INTO notifications (recipient_role, recipient_id, title, message)
       VALUES ('CITIZEN', ?, ?, ?)`,
      [
        report.reported_by_citizen_id,
        "Dumping report rejected",
        `Your illegal dumping report #${reportId} was rejected.${remarks ? ` Reason: ${remarks}` : ""}`
      ]
    );

    await conn.commit();
    return res.json({ success: true });
  } catch (err) {
    await conn.rollback();
    console.error("Reject illegal dumping report error:", err.message);
    return res.status(500).json({ message: "Failed to reject report" });
  } finally {
    conn.release();
  }
};
