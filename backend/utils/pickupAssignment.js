const db = require("../config/database");

const pickBaseType = (targetCollectionType) => {
  return targetCollectionType === "government" ? "GOVERNMENT" : "FACTORY";
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

const assignNextCollector = async (requestId, conn) => {
  const [reqRows] = await conn.execute(
    `SELECT request_id, target_collection_type, pickup_latitude, pickup_longitude,
            current_attempt, max_attempts
     FROM pickup_requests
     WHERE request_id = ?`,
    [requestId]
  );

  if (reqRows.length === 0) {
    return { ok: false, reason: "Request not found" };
  }

  const reqRow = reqRows[0];
  const lat = Number(reqRow.pickup_latitude);
  const lng = Number(reqRow.pickup_longitude);

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    await conn.execute(
      `UPDATE pickup_requests
       SET status = 'FAILED_TO_ASSIGN'
       WHERE request_id = ?`,
      [requestId]
    );
    const [admins] = await conn.execute(`SELECT admin_id FROM admins`);
    if (admins.length > 0) {
      const values = admins.map((a) => [
        "ADMIN",
        a.admin_id,
        requestId,
        "Request failed to assign",
        `Pickup request #${requestId} failed to assign (missing coordinates).`
      ]);
      await conn.query(
        `INSERT INTO notifications (recipient_role, recipient_id, request_id, title, message)
         VALUES ?`,
        [values]
      );
    }
    return { ok: false, reason: "Missing coordinates" };
  }

  const currentAttempt = Number(reqRow.current_attempt) || 0;
  const maxAttempts = Number(reqRow.max_attempts) || 0;

  if (maxAttempts > 0 && currentAttempt >= maxAttempts) {
    await conn.execute(
      `UPDATE pickup_requests
       SET status = 'FAILED_TO_ASSIGN'
       WHERE request_id = ?`,
      [requestId]
    );
    const [admins] = await conn.execute(`SELECT admin_id FROM admins`);
    if (admins.length > 0) {
      const values = admins.map((a) => [
        "ADMIN",
        a.admin_id,
        requestId,
        "Request failed to assign",
        `Pickup request #${requestId} failed to assign (max attempts reached).`
      ]);
      await conn.query(
        `INSERT INTO notifications (recipient_role, recipient_id, request_id, title, message)
         VALUES ?`,
        [values]
      );
    }
    return { ok: false, reason: "Max attempts reached" };
  }

  const baseType = pickBaseType(reqRow.target_collection_type);
  const attemptNo = currentAttempt + 1;

  let candidateSql = "";
  let params = [];

  if (baseType === "GOVERNMENT") {
    candidateSql = `
      SELECT c.collector_id, gd.government_id,
             ${buildDistanceSql("gd.working_area_latitude", "gd.working_area_longitude")} AS distance_km
      FROM Government_Details gd
      JOIN Collectors c ON c.collector_id = gd.collector_id
      WHERE c.status = 'APPROVED'
        AND c.collection_type = 'government'
        AND gd.working_area_latitude IS NOT NULL
        AND gd.working_area_longitude IS NOT NULL
        AND c.collector_id NOT IN (
          SELECT collector_id FROM pickup_offers WHERE request_id = ?
        )
      ORDER BY distance_km ASC
      LIMIT 1
    `;
    params = [lat, lat, lng, requestId];
  } else {
    candidateSql = `
      SELECT c.collector_id, fd.factory_id,
             ${buildDistanceSql("fd.factory_latitude", "fd.factory_longitude")} AS distance_km
      FROM Factory_Details fd
      JOIN Collectors c ON c.collector_id = fd.collector_id
      WHERE c.status = 'APPROVED'
        AND c.collection_type = 'factory'
        AND fd.factory_latitude IS NOT NULL
        AND fd.factory_longitude IS NOT NULL
        AND c.collector_id NOT IN (
          SELECT collector_id FROM pickup_offers WHERE request_id = ?
        )
      ORDER BY distance_km ASC
      LIMIT 1
    `;
    params = [lat, lat, lng, requestId];
  }

  const [candidates] = await conn.execute(candidateSql, params);
  if (candidates.length === 0) {
    await conn.execute(
      `UPDATE pickup_requests
       SET status = 'FAILED_TO_ASSIGN'
       WHERE request_id = ?`,
      [requestId]
    );
    const [admins] = await conn.execute(`SELECT admin_id FROM admins`);
    if (admins.length > 0) {
      const values = admins.map((a) => [
        "ADMIN",
        a.admin_id,
        requestId,
        "Request failed to assign",
        `Pickup request #${requestId} failed to assign (no collectors available).`
      ]);
      await conn.query(
        `INSERT INTO notifications (recipient_role, recipient_id, request_id, title, message)
         VALUES ?`,
        [values]
      );
    }
    return { ok: false, reason: "No collectors available" };
  }

  const candidate = candidates[0];
  // Keep offers open until collector responds (no short auto-expiry).
  const offerExpiresAt = new Date(Date.now() + 10 * 365 * 24 * 60 * 60 * 1000);

  const [offerResult] = await conn.execute(
    `INSERT INTO pickup_offers
      (request_id, collector_id, attempt_no, offer_status, offered_at, offer_expires_at,
       base_type, government_id, factory_id, distance_km)
     VALUES (?, ?, ?, 'OFFERED', NOW(), ?, ?, ?, ?, ?)`,
    [
      requestId,
      candidate.collector_id,
      attemptNo,
      offerExpiresAt,
      baseType,
      baseType === "GOVERNMENT" ? candidate.government_id : null,
      baseType === "FACTORY" ? candidate.factory_id : null,
      candidate.distance_km
    ]
  );

  await conn.execute(
    `UPDATE pickup_requests
     SET status = 'ASSIGNING', current_attempt = ?
     WHERE request_id = ?`,
    [attemptNo, requestId]
  );

  await conn.execute(
    `INSERT INTO notifications (recipient_role, recipient_id, request_id, title, message)
     VALUES ('COLLECTOR', ?, ?, ?, ?)`,
    [
      candidate.collector_id,
      requestId,
      "New pickup offer",
      `A new pickup request (#${requestId}) is available for you.`
    ]
  );

  return {
    ok: true,
    offer_id: offerResult.insertId,
    collector_id: candidate.collector_id,
    distance_km: candidate.distance_km,
    base_type: baseType
  };
};

module.exports = { assignNextCollector };
