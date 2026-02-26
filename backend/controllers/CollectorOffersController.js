const db = require("../config/database");
const { assignNextCollector } = require("../utils/pickupAssignment");

exports.listOffers = async (req, res) => {
  try {
    const collectorId = req.collectorId;
    const status = req.query.status || "OFFERED";

    const [rows] = await db.execute(
      `SELECT po.offer_id, po.request_id, po.offer_status, po.offer_expires_at,
              po.distance_km, po.offered_at,
              pr.requested_at, pr.request_type, pr.target_collection_type,
              pr.pickup_address, pr.pickup_latitude, pr.pickup_longitude
       FROM pickup_offers po
       JOIN pickup_requests pr ON pr.request_id = po.request_id
       WHERE po.collector_id = ? AND po.offer_status = ?
       ORDER BY po.offered_at ASC`,
      [collectorId, status]
    );

    return res.json(rows);
  } catch (err) {
    console.error("List offers error:", err.message);
    return res.status(500).json({ message: "Failed to load offers" });
  }
};

exports.acceptOffer = async (req, res) => {
  const offerId = parseInt(req.params.id, 10);
  if (!Number.isInteger(offerId)) {
    return res.status(400).json({ message: "Invalid offer id" });
  }

  const collectorId = req.collectorId;
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const [rows] = await conn.execute(
      `SELECT offer_id, request_id, offer_status, offer_expires_at
       FROM pickup_offers
       WHERE offer_id = ? AND collector_id = ?`,
      [offerId, collectorId]
    );

    if (rows.length === 0) {
      await conn.rollback();
      return res.status(404).json({ message: "Offer not found" });
    }

    const offer = rows[0];
    if (offer.offer_status !== "OFFERED") {
      await conn.rollback();
      return res.status(400).json({ message: "Offer not available" });
    }

    await conn.execute(
      `UPDATE pickup_offers
       SET offer_status = 'ACCEPTED', responded_at = NOW()
       WHERE offer_id = ?`,
      [offerId]
    );

    await conn.execute(
      `UPDATE pickup_requests
       SET status = 'ACCEPTED_BY_COLLECTOR', accepted_at = NOW()
       WHERE request_id = ?`,
      [offer.request_id]
    );

    await conn.execute(
      `INSERT INTO pickup_jobs (request_id, offer_id)
       VALUES (?, ?)`,
      [offer.request_id, offerId]
    );

    await conn.execute(
      `UPDATE pickup_offers
       SET offer_status = 'CANCELLED', responded_at = NOW()
       WHERE request_id = ? AND offer_id <> ? AND offer_status = 'OFFERED'`,
      [offer.request_id, offerId]
    );

    const [[reqRow]] = await conn.execute(
      `SELECT citizen_id FROM pickup_requests WHERE request_id = ?`,
      [offer.request_id]
    );
    if (reqRow?.citizen_id) {
      await conn.execute(
        `INSERT INTO notifications (recipient_role, recipient_id, request_id, title, message)
         VALUES ('CITIZEN', ?, ?, ?, ?)`,
        [
          reqRow.citizen_id,
          offer.request_id,
          "Pickup request accepted",
          `Your pickup request #${offer.request_id} was accepted by a collector.`
        ]
      );
    }

    await conn.commit();
    return res.json({ success: true });
  } catch (err) {
    await conn.rollback();
    console.error("Accept offer error:", err.message);
    return res.status(500).json({ message: "Failed to accept offer" });
  } finally {
    conn.release();
  }
};

exports.rejectOffer = async (req, res) => {
  const offerId = parseInt(req.params.id, 10);
  if (!Number.isInteger(offerId)) {
    return res.status(400).json({ message: "Invalid offer id" });
  }

  const collectorId = req.collectorId;
  const reason = req.body?.reason;
  if (!reason || String(reason).trim() === "") {
    return res.status(400).json({ message: "Reject reason required" });
  }

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const [rows] = await conn.execute(
      `SELECT offer_id, request_id, offer_status
       FROM pickup_offers
       WHERE offer_id = ? AND collector_id = ?`,
      [offerId, collectorId]
    );

    if (rows.length === 0) {
      await conn.rollback();
      return res.status(404).json({ message: "Offer not found" });
    }

    const offer = rows[0];
    if (offer.offer_status !== "OFFERED") {
      await conn.rollback();
      return res.status(400).json({ message: "Offer not available" });
    }

    await conn.execute(
      `UPDATE pickup_offers
       SET offer_status = 'REJECTED', reject_reason = ?, responded_at = NOW()
       WHERE offer_id = ?`,
      [reason, offerId]
    );

    await assignNextCollector(offer.request_id, conn);

    await conn.commit();
    return res.json({ success: true });
  } catch (err) {
    await conn.rollback();
    console.error("Reject offer error:", err.message);
    return res.status(500).json({ message: "Failed to reject offer" });
  } finally {
    conn.release();
  }
};
