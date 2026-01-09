module.exports = (req, res, next) => {
  const adminId = req.headers["x-admin-id"];

  if (!adminId) {
    return res.status(401).json({ message: "Unauthorized admin access" });
  }

  next();
};
