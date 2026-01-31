const db = require("../config/database");

exports.startJob = async (req, res) => {
  const jobId = parseInt(req.params.id, 10);
  if (!Number.isInteger(jobId)) {
    return res.status(400).json({ message: "Invalid job id" });
  }

  const collectorId = req.collectorId;
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const [rows] = await conn.execute(
      `SELECT pj.job_id, pj.job_status, po.collector_id, po.request_id
       FROM pickup_jobs pj
       JOIN pickup_offers po ON po.offer_id = pj.offer_id
       WHERE pj.job_id = ?`,
      [jobId]
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
      [jobId]
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
          jobId,
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
  const jobId = parseInt(req.params.id, 10);
  if (!Number.isInteger(jobId)) {
    return res.status(400).json({ message: "Invalid job id" });
  }

  const collectorId = req.collectorId;
  const files = Array.isArray(req.files) ? req.files : [];

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const [rows] = await conn.execute(
      `SELECT pj.job_id, pj.job_status, po.collector_id, po.request_id
       FROM pickup_jobs pj
       JOIN pickup_offers po ON po.offer_id = pj.offer_id
       WHERE pj.job_id = ?`,
      [jobId]
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
       SET job_status = 'COMPLETED', completed_at = NOW()
       WHERE job_id = ?`,
      [jobId]
    );

    await conn.execute(
      `UPDATE pickup_requests
       SET status = 'COMPLETED', completed_at = NOW()
       WHERE request_id = ?`,
      [job.request_id]
    );

    if (files.length > 0) {
      for (const file of files) {
        const imageUrl = `/uploads/pickup_jobs/${file.filename}`;
        await conn.execute(
          `INSERT INTO pickup_job_images (job_id, image_url, image_type)
           VALUES (?, ?, 'AFTER')`,
          [jobId, imageUrl]
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
          jobId,
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
        jobId,
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
    console.error("Complete job error:", err.message);
    return res.status(500).json({ message: "Failed to complete job" });
  } finally {
    conn.release();
  }
};
