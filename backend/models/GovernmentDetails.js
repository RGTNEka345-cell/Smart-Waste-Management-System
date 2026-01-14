const db = require("../config/database");

exports.createGovernment = async (data) => {
  const sql = `
    INSERT INTO Government_Details
    (collector_id, service_number, department_name,
     working_area_name, working_area_latitude, working_area_longitude, designation)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `;
  await db.execute(sql, data);
};
