const db = require("../config/database");

exports.findByEmail = async (email) => {
  const [rows] = await db.execute(
    "SELECT * FROM admins WHERE email = ?",
    [email]
  );
  return rows[0];
};
