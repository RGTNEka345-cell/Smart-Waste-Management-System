const db = require("../config/database");
const { addEcoPoints, getEcoPointsSummary } = require("../utils/ecoPoints");

exports.getDashboardStats = async (req, res) => {
  const collectorId = req.collectorId;

  try {
    const [[summary]] = await db.execute(
      `SELECT
          SUM(CASE WHEN (pj.job_status = 'COMPLETED' OR pr.status = 'COMPLETED') THEN 1 ELSE 0 END) AS completed_jobs,
          SUM(CASE WHEN pr.status IN ('ACCEPTED_BY_COLLECTOR', 'IN_PROGRESS') THEN 1 ELSE 0 END) AS active_jobs,
          SUM(CASE WHEN pj.job_status = 'NOT_STARTED' THEN 1 ELSE 0 END) AS pending_jobs
       FROM pickup_offers po
       JOIN pickup_requests pr ON pr.request_id = po.request_id
       LEFT JOIN pickup_jobs pj ON pj.request_id = pr.request_id AND pj.offer_id = po.offer_id
       WHERE po.collector_id = ?
         AND po.offer_status = 'ACCEPTED'`,
      [collectorId]
    );

    const [monthlyRows] = await db.execute(
      `SELECT
          DATE_FORMAT(pj.completed_at, '%Y-%m') AS ym,
          COUNT(*) AS total
       FROM pickup_jobs pj
       JOIN pickup_offers po ON po.offer_id = pj.offer_id
       WHERE po.collector_id = ?
         AND pj.job_status = 'COMPLETED'
         AND pj.completed_at IS NOT NULL
         AND pj.completed_at >= DATE_SUB(CURDATE(), INTERVAL 5 MONTH)
       GROUP BY DATE_FORMAT(pj.completed_at, '%Y-%m')
       ORDER BY ym ASC`,
      [collectorId]
    );

    const [recentRows] = await db.execute(
      `SELECT
          pr.request_id,
          pr.request_type,
          pr.pickup_address,
          COALESCE(pj.completed_at, pr.completed_at) AS completed_at
       FROM pickup_offers po
       JOIN pickup_requests pr ON pr.request_id = po.request_id
       LEFT JOIN pickup_jobs pj ON pj.request_id = pr.request_id AND pj.offer_id = po.offer_id
       WHERE po.collector_id = ?
         AND po.offer_status = 'ACCEPTED'
         AND (pj.job_status = 'COMPLETED' OR pr.status = 'COMPLETED')
       ORDER BY COALESCE(pj.completed_at, pr.completed_at) DESC
       LIMIT 5`,
      [collectorId]
    );

    const eco = await getEcoPointsSummary(db, { collectorId });

    return res.json({
      completed_jobs: Number(summary?.completed_jobs || 0),
      active_jobs: Number(summary?.active_jobs || 0),
      pending_jobs: Number(summary?.pending_jobs || 0),
      eco_points: eco.total_points,
      monthly_completed: monthlyRows.map((r) => ({
        ym: r.ym,
        total: Number(r.total || 0)
      })),
      recent_completed: recentRows,
      recent_eco_points: eco.recent
    });
  } catch (err) {
    console.error("Collector dashboard stats error:", err.message);
    return res.status(500).json({ message: "Failed to load collector dashboard stats" });
  }
};

exports.startJob = async (req, res) => {
  const requestId = parseInt(req.params.id, 10);
  if (!Number.isInteger(requestId)) {
    return res.status(400).json({ message: "Invalid request id" });
  }

  const collectorId = req.collectorId;
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const [rows] = await conn.execute(
      `SELECT pj.job_id, pj.job_status, po.collector_id, po.request_id
       FROM pickup_jobs pj
       JOIN pickup_offers po ON po.offer_id = pj.offer_id
       WHERE pj.request_id = ?`,
      [requestId]
    );

    if (rows.length === 0) {
      await conn.rollback();
      return res.status(404).json({ message: "Job not found" });
    }

    const job = rows[0];
    if (job.collector_id !== collectorId) {
      await conn.rollback();
      return res.status(403).json({ message: "Not authorized" });
    }

    if (job.job_status !== "NOT_STARTED") {
      await conn.rollback();
      return res.status(400).json({ message: "Job already started" });
    }

    await conn.execute(
      `UPDATE pickup_jobs
       SET job_status = 'STARTED', started_at = NOW()
       WHERE job_id = ?`,
      [job.job_id]
    );

    await conn.execute(
      `UPDATE pickup_requests
       SET status = 'IN_PROGRESS', started_at = NOW()
       WHERE request_id = ?`,
      [job.request_id]
    );

    const [[reqRow]] = await conn.execute(
      `SELECT citizen_id FROM pickup_requests WHERE request_id = ?`,
      [job.request_id]
    );
    if (reqRow?.citizen_id) {
      await conn.execute(
        `INSERT INTO notifications (recipient_role, recipient_id, request_id, job_id, title, message)
         VALUES ('CITIZEN', ?, ?, ?, ?, ?)`,
        [
          reqRow.citizen_id,
          job.request_id,
          job.job_id,
          "Collector started",
          `Collector has started pickup for request #${job.request_id}.`
        ]
      );
    }

    await conn.commit();
    return res.json({ success: true });
  } catch (err) {
    await conn.rollback();
    console.error("Start job error:", err.message);
    return res.status(500).json({ message: "Failed to start job" });
  } finally {
    conn.release();
  }
};

exports.completeJob = async (req, res) => {
  const requestId = parseInt(req.params.id, 10);
  if (!Number.isInteger(requestId)) {
    return res.status(400).json({ message: "Invalid request id" });
  }

  const collectorId = req.collectorId;
  const images = req.files || [];
  const notes = req.body?.notes || null;

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const [rows] = await conn.execute(
      `SELECT pj.job_id, pj.job_status, po.collector_id, po.request_id
       FROM pickup_jobs pj
       JOIN pickup_offers po ON po.offer_id = pj.offer_id
       WHERE pj.request_id = ?`,
      [requestId]
    );

    if (rows.length === 0) {
      await conn.rollback();
      return res.status(404).json({ message: "Job not found" });
    }

    const job = rows[0];
    if (job.collector_id !== collectorId) {
      await conn.rollback();
      return res.status(403).json({ message: "Not authorized" });
    }

    if (job.job_status === "COMPLETED") {
      await conn.rollback();
      return res.status(400).json({ message: "Job already completed" });
    }

    await conn.execute(
      `UPDATE pickup_jobs
       SET job_status = 'COMPLETED', completed_at = NOW(), collector_notes = ?
       WHERE job_id = ?`,
      [notes, job.job_id]
    );

    await conn.execute(
      `UPDATE pickup_requests
       SET status = 'COMPLETED', completed_at = NOW()
       WHERE request_id = ?`,
      [job.request_id]
    );

    if (images.length > 0) {
      for (const file of images) {
        const imageUrl = `/uploads/pickup_jobs/${file.filename}`;
        await conn.execute(
          `INSERT INTO pickup_job_images (job_id, image_url, image_type)
           VALUES (?, ?, 'OTHER')`,
          [job.job_id, imageUrl]
        );
      }
    }

    const [[reqRow]] = await conn.execute(
      `SELECT citizen_id FROM pickup_requests WHERE request_id = ?`,
      [job.request_id]
    );
    if (reqRow?.citizen_id) {
      await conn.execute(
        `INSERT INTO notifications (recipient_role, recipient_id, request_id, job_id, title, message)
         VALUES ('CITIZEN', ?, ?, ?, ?, ?)`,
        [
          reqRow.citizen_id,
          job.request_id,
          job.job_id,
          "Request completed",
          `Your pickup request #${job.request_id} has been completed.`
        ]
      );
    }

    const [admins] = await conn.execute(`SELECT admin_id FROM admins`);
    if (admins.length > 0) {
      const values = admins.map((a) => [
        "ADMIN",
        a.admin_id,
        job.request_id,
        job.job_id,
        "Pickup completed",
        `Pickup request #${job.request_id} was completed.`
      ]);
      await conn.query(
        `INSERT INTO notifications (recipient_role, recipient_id, request_id, job_id, title, message)
         VALUES ?`,
        [values]
      );
    }

    await addEcoPoints(conn, {
      collectorId,
      actionType: "PICKUP_COMPLETED",
      referenceId: job.request_id,
      description: `Completed pickup request #${job.request_id}`
    });

    await conn.commit();
    return res.json({ success: true });
  } catch (err) {
    await conn.rollback();
    console.error("Complete job error:", err);
    return res.status(500).json({
      message: err?.message || "Failed to complete job"
    });
  } finally {
    conn.release();
  }
};

exports.arriveJob = async (req, res) => {
  const requestId = parseInt(req.params.id, 10);
  if (!Number.isInteger(requestId)) {
    return res.status(400).json({ message: "Invalid request id" });
  }

  const collectorId = req.collectorId;
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const [rows] = await conn.execute(
      `SELECT pj.job_id, pj.job_status, po.collector_id, po.request_id
       FROM pickup_jobs pj
       JOIN pickup_offers po ON po.offer_id = pj.offer_id
       WHERE pj.request_id = ?`,
      [requestId]
    );

    if (rows.length === 0) {
      await conn.rollback();
      return res.status(404).json({ message: "Job not found" });
    }

    const job = rows[0];
    if (job.collector_id !== collectorId) {
      await conn.rollback();
      return res.status(403).json({ message: "Not authorized" });
    }

    if (job.job_status !== "STARTED" && job.job_status !== "NOT_STARTED") {
      await conn.rollback();
      return res.status(400).json({ message: "Job cannot be marked arrived now" });
    }

    await conn.execute(
      `UPDATE pickup_jobs
       SET job_status = 'ARRIVED', arrived_at = NOW()
       WHERE job_id = ?`,
      [job.job_id]
    );

    await conn.commit();
    return res.json({ success: true });
  } catch (err) {
    await conn.rollback();
    console.error("Arrive job error:", err.message);
    return res.status(500).json({ message: "Failed to mark arrived" });
  } finally {
    conn.release();
  }
};

exports.listPickupHistory = async (req, res) => {
  const collectorId = req.collectorId;

  try {
    const [rows] = await db.execute(
      `SELECT
          pj.job_id,
          pj.request_id,
          COALESCE(pj.job_status, pr.status) AS job_status,
          pr.status AS request_status,
          pj.started_at,
          pj.arrived_at,
          COALESCE(pj.completed_at, pr.completed_at) AS completed_at,
          pj.collector_notes,
          pr.request_type,
          pr.target_collection_type,
          pr.pickup_address,
          pr.pickup_latitude,
          pr.pickup_longitude,
          pr.note AS request_note,
          pr.requested_at,
          pr.accepted_at,
          pr.started_at AS request_started_at,
          pr.completed_at AS request_completed_at,
          c.id AS citizen_id,
          c.full_name AS citizen_name,
          c.phone AS citizen_phone,
          c.email AS citizen_email,
          po.distance_km,
          po.offered_at,
          po.responded_at AS offer_responded_at,
          (
            SELECT COALESCE(SUM(eph.points), 0)
            FROM eco_points_history eph
            WHERE eph.collector_id = ?
              AND eph.action_type = 'PICKUP_COMPLETED'
              AND eph.reference_id = pr.request_id
          ) AS earned_points,
          (
            SELECT COUNT(*)
            FROM pickup_job_images pji
            WHERE pji.job_id = pj.job_id
          ) AS photo_count
       FROM pickup_offers po
       JOIN pickup_requests pr ON pr.request_id = po.request_id
       LEFT JOIN pickup_jobs pj ON pj.request_id = pr.request_id AND pj.offer_id = po.offer_id
       LEFT JOIN citizens c ON c.id = pr.citizen_id
       WHERE po.collector_id = ?
         AND po.offer_status = 'ACCEPTED'
         AND (pj.job_status = 'COMPLETED' OR pr.status = 'COMPLETED')
       ORDER BY COALESCE(pj.completed_at, pr.completed_at) DESC, pr.request_id DESC`,
      [collectorId, collectorId]
    );

    if (rows.length === 0) {
      return res.json([]);
    }

    const requestIds = rows
      .map((r) => Number(r.request_id))
      .filter((id) => Number.isInteger(id));
    const jobIds = rows
      .map((r) => Number(r.job_id))
      .filter((id) => Number.isInteger(id));

    const requestPlaceholders = requestIds.map(() => "?").join(",");
    const jobPlaceholders = jobIds.map(() => "?").join(",");

    const [itemRows] = requestIds.length
      ? await db.execute(
          `SELECT
              pri.request_id,
              pri.item_id,
              pri.wastetype_id,
              wt.name AS wastetype_name,
              pri.quantity,
              pri.unit
           FROM pickup_request_items pri
           LEFT JOIN wastetypes wt ON wt.id = pri.wastetype_id
           WHERE pri.request_id IN (${requestPlaceholders})
           ORDER BY pri.item_id ASC`,
          requestIds
        )
      : [[]];

    const [imageRows] = jobIds.length
      ? await db.execute(
          `SELECT
              pji.job_id,
              pji.image_id,
              pji.image_url,
              pji.image_type,
              pji.uploaded_at
           FROM pickup_job_images pji
           WHERE pji.job_id IN (${jobPlaceholders})
           ORDER BY pji.uploaded_at ASC`,
          jobIds
        )
      : [[]];

    const itemsByRequest = itemRows.reduce((acc, row) => {
      if (!acc[row.request_id]) acc[row.request_id] = [];
      acc[row.request_id].push(row);
      return acc;
    }, {});

    const imagesByJob = imageRows.reduce((acc, row) => {
      if (!acc[row.job_id]) acc[row.job_id] = [];
      acc[row.job_id].push(row);
      return acc;
    }, {});

    return res.json(
      rows.map((r) => ({
        ...r,
        photo_count: Number(r.photo_count || 0),
        earned_points: Number(r.earned_points || 0),
        distance_km: r.distance_km == null ? null : Number(r.distance_km),
        items: itemsByRequest[r.request_id] || [],
        photos: r.job_id ? imagesByJob[r.job_id] || [] : []
      }))
    );
  } catch (err) {
    console.error("Collector pickup history error:", err.message);
    return res.status(500).json({ message: "Failed to load pickup history" });
  }
};
