const db = require("../config/database");

exports.createCollector = async (data) => {
  const sql = `
    INSERT INTO Collectors
    (full_name, email, gender, password, phone_number, home_address,
     collection_type, vehicle_photo, vehicle_number, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'PENDING')
  `;
  const [result] = await db.execute(sql, data);
  return result.insertId;
};
