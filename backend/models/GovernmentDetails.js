const db = require("../config/database");

const GovernmentDetails = {
  createGovernment: async (data) => {
    const sql = `
      INSERT INTO Government_Details 
      (collector_id, service_number, department_name, working_area_name,
       working_area_latitude, working_area_longitude, designation)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    
    try {
      const [result] = await db.execute(sql, data);
      return result.insertId;
    } catch (error) {
      console.error('Error in createGovernment:', error);
      throw error;
    }
  }
};

module.exports = GovernmentDetails;