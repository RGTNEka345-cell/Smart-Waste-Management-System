const ACTION_POINTS = {
  PICKUP_REQUEST: 10,
  ILLEGAL_DUMP_REPORT: 15,
  PICKUP_COMPLETED: 20,
  ILLEGAL_DUMP_CLEANUP_COMPLETED: 25,
  ECO_ACTIVITY: 5
};

const normalizeOwner = ({ citizenId, collectorId }) => {
  const ctz = Number.isInteger(Number(citizenId)) ? Number(citizenId) : null;
  const col = Number.isInteger(Number(collectorId)) ? Number(collectorId) : null;
  if ((ctz && col) || (!ctz && !col)) {
    throw new Error("Exactly one owner is required (citizenId or collectorId)");
  }
  return { citizenId: ctz, collectorId: col };
};

const resolvePoints = (actionType, explicitPoints) => {
  if (Number.isFinite(Number(explicitPoints))) return Number(explicitPoints);
  return ACTION_POINTS[actionType] || 0;
};

const addEcoPoints = async (executor, payload) => {
  const { citizenId, collectorId } = normalizeOwner(payload);
  const points = resolvePoints(payload.actionType, payload.points);
  if (!points) return { total_delta: 0 };

  let updateResult;
  if (citizenId) {
    [updateResult] = await executor.execute(
      `UPDATE eco_points
       SET total_points = total_points + ?, last_updated = NOW()
       WHERE citizen_id = ?`,
      [points, citizenId]
    );
    if (!updateResult.affectedRows) {
      await executor.execute(
        `INSERT INTO eco_points (citizen_id, collector_id, total_points)
         VALUES (?, NULL, ?)`,
        [citizenId, points]
      );
    }
  } else {
    [updateResult] = await executor.execute(
      `UPDATE eco_points
       SET total_points = total_points + ?, last_updated = NOW()
       WHERE collector_id = ?`,
      [points, collectorId]
    );
    if (!updateResult.affectedRows) {
      await executor.execute(
        `INSERT INTO eco_points (citizen_id, collector_id, total_points)
         VALUES (NULL, ?, ?)`,
        [collectorId, points]
      );
    }
  }

  await executor.execute(
    `INSERT INTO eco_points_history
     (citizen_id, collector_id, admin_id, points, action_type, reference_id, description)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      citizenId,
      collectorId,
      payload.adminId || null,
      points,
      payload.actionType,
      payload.referenceId || null,
      payload.description || null
    ]
  );

  return { total_delta: points };
};

const getEcoPointsSummary = async (executor, payload) => {
  const { citizenId, collectorId } = normalizeOwner(payload);

  const where = citizenId ? "citizen_id = ?" : "collector_id = ?";
  const ownerId = citizenId || collectorId;

  const [[row]] = await executor.execute(
    `SELECT COALESCE(total_points, 0) AS total_points
     FROM eco_points
     WHERE ${where}
     LIMIT 1`,
    [ownerId]
  );

  const [recent] = await executor.execute(
    `SELECT history_id, points, action_type, reference_id, description, created_at
     FROM eco_points_history
     WHERE ${where}
     ORDER BY created_at DESC
     LIMIT 10`,
    [ownerId]
  );

  return {
    total_points: Number(row?.total_points || 0),
    recent
  };
};

module.exports = {
  ACTION_POINTS,
  addEcoPoints,
  getEcoPointsSummary
};
