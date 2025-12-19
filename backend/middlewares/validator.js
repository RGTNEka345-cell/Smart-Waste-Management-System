exports.registerValidator = (req, res, next) => {
  const body = req.body || {};
  const { full_name, email, phone } = body;

  if (!full_name || !email || !phone) {
    return res.status(400).json({ message: "Required fields missing" });
  }

  next();
};
