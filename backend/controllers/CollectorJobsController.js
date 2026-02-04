const db = require("../config/database");

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
