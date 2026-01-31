const db = require("../config/database");

exports.listCitizens = async (req, res) => {
  try {
    const q = (req.query.search || "").trim();
    const like = `%${q}%`;

    const [rows] = await db.execute(
      `SELECT id, full_name, email, phone, address, is_verified, photo_url
       FROM citizens
       WHERE full_name LIKE ? OR email LIKE ? OR phone LIKE ?
       ORDER BY created_at DESC`,
      [like, like, like]
    );

    res.json(rows);
  } catch (err) {
    console.error("List citizens error:", err.message);
    res.status(500).json({ message: "Failed to load citizens" });
  }
};

exports.getCitizenDetails = async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (!Number.isInteger(id)) {
      return res.status(400).json({ message: "Invalid citizen id" });
    }

    const [[citizen]] = await db.execute(
      `SELECT *
       FROM citizens
       WHERE id = ?`,
      [id]
    );

    if (!citizen) {
      return res.status(404).json({ message: "Citizen not found" });
    }

    res.json(citizen);
  } catch (err) {
    console.error("Get citizen details error:", err.message);
    res.status(500).json({ message: "Failed to load citizen details" });
  }
};
