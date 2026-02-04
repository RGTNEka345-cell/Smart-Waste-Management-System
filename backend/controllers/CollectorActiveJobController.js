const db = require("../config/database");

exports.getActiveJob = async (req, res) => {
  try {
    const collectorId = req.collectorId;

    const [rows] = await db.execute(
      `SELECT pr.request_id,
              pr.request_type,
              pr.target_collection_type,
              pr.pickup_address,
              pr.pickup_latitude,
              pr.pickup_longitude,
              pr.status,
              pr.requested_at,
              c.full_name AS citizen_name,
              c.phone AS citizen_phone,
              po.distance_km
       FROM pickup_jobs pj
       JOIN pickup_offers po ON po.offer_id = pj.offer_id
       JOIN pickup_requests pr ON pr.request_id = pj.request_id
       JOIN citizens c ON c.id = pr.citizen_id
       WHERE po.collector_id = ?
         AND pr.status IN ('ACCEPTED_BY_COLLECTOR','IN_PROGRESS')
       ORDER BY pr.requested_at DESC
       LIMIT 1`,
      [collectorId]
    );

    if (rows.length === 0) {
      return res.json(null);
    }

    return res.json(rows[0]);
  } catch (err) {
    console.error("Get active job error:", err.message);
    return res.status(500).json({ message: "Failed to load active job" });
  }

};
