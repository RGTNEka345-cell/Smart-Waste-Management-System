const SessionManager = require("../utils/SessionManager");

module.exports = (req, res, next) => {
  const auth = req.headers.authorization || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7).trim() : "";

  let collectorId = null;
  let collectionType = null;

  if (token) {
    const session = SessionManager.getSession(token);
    if (session) {
      collectorId = session.collectorId || session.collector_id || null;
      collectionType = session.collectionType || session.collection_type || null;
    } else {
      const numeric = parseInt(token, 10);
      if (Number.isInteger(numeric)) {
        collectorId = numeric;
      }
    }
  }

  if (!collectorId) {
    const headerId = req.headers["x-collector-id"];
    const numeric = parseInt(headerId, 10);
    if (Number.isInteger(numeric)) {
      collectorId = numeric;
    }
  }

  if (!collectorId) {
    return res.status(401).json({ message: "Unauthorized collector access" });
  }

  req.collectorId = collectorId;
  req.collectionType = collectionType;
  next();
};
