const jwt = require("jsonwebtoken");
const SessionManager = require("./SessionManager");

const parsePositiveInt = (value) => {
  const parsed = parseInt(value, 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
};

const verifyJwtWithFallbacks = (token) => {
  const secrets = [
    process.env.JWT_SECRET,
    "wastewise-secret-key-123",
    "secret123"
  ].filter(Boolean);

  for (const secret of secrets) {
    try {
      return jwt.verify(token, secret);
    } catch (_) {
      // Try the next known project secret.
    }
  }
  return null;
};

const resolveActor = (req) => {
  const headerCitizen = parsePositiveInt(req.headers["x-citizen-id"]);
  if (headerCitizen) return { role: "CITIZEN", id: headerCitizen };

  const headerCollector = parsePositiveInt(req.headers["x-collector-id"]);
  if (headerCollector) return { role: "COLLECTOR", id: headerCollector };

  const headerAdmin = parsePositiveInt(req.headers["x-admin-id"]);
  if (headerAdmin) return { role: "ADMIN", id: headerAdmin };

  const role = String(req.headers["x-user-role"] || "").toUpperCase();
  const userId = parsePositiveInt(req.headers["x-user-id"]);
  if (["CITIZEN", "COLLECTOR", "ADMIN"].includes(role) && userId) {
    return { role, id: userId };
  }

  const auth = req.headers.authorization || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7).trim() : "";
  if (!token) return null;

  const session = SessionManager.getSession(token);
  if (session?.collectorId || session?.collector_id) {
    return { role: "COLLECTOR", id: session.collectorId || session.collector_id };
  }

  const payload = verifyJwtWithFallbacks(token);
  if (payload?.admin_id || payload?.adminId) {
    return { role: "ADMIN", id: payload.admin_id || payload.adminId };
  }
  if (payload?.userId || payload?.id) {
    return { role: "CITIZEN", id: payload.userId || payload.id };
  }

  const numeric = parsePositiveInt(token);
  return numeric ? { role: "CITIZEN", id: numeric } : null;
};

const requireMessageActor = (req, res, next) => {
  const actor = resolveActor(req);
  if (!actor) {
    return res.status(401).json({ message: "Unauthorized messaging access" });
  }

  req.messageActor = actor;
  next();
};

module.exports = {
  resolveActor,
  requireMessageActor
};
