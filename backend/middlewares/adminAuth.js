const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
  let adminId = req.headers["x-admin-id"];

  if (!adminId) {
    const auth = req.headers.authorization || "";
    const token = auth.startsWith("Bearer ") ? auth.slice(7).trim() : "";

    if (token) {
      try {
        const payload = jwt.verify(token, process.env.JWT_SECRET || "secret123");
        adminId = payload?.admin_id || payload?.id || null;
      } catch (err){
        const numeric = parseInt(token, 10);
        if (Number.isInteger(numeric)) {
          adminId = numeric;
        }
      }
    }
  }

  if (!adminId) {
    return res.status(401).json({ message: "Unauthorized admin access" });
  }

  req.adminId = parseInt(adminId, 10);
  next();
};
