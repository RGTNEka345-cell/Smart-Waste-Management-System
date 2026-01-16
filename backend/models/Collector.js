const db = require("../config/database");

const Collector = {
  // Create new collector
  createCollector: async (data) => {
    const sql = `
      INSERT INTO Collectors 
      (full_name, email, gender, password, phone_number, home_address,
       collection_type, vehicle_photo, vehicle_number, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'PENDING')
    `;
    
    try {
      const [result] = await db.execute(sql, data);
      return result.insertId;
    } catch (error) {
      console.error('Error in createCollector:', error);
      throw error;
    }
  },

  // Find collector by email
  findByEmail: async (email) => {
    try {
      const sql = `
        SELECT c.*, ca.approval_status
        FROM Collectors c
        LEFT JOIN Collector_Approvals ca 
          ON c.collector_id = ca.collector_id
        WHERE c.email = ?
        ORDER BY ca.approved_at DESC
        LIMIT 1
      `;
      
      const [rows] = await db.execute(sql, [email]);
      return rows[0] || null;
    } catch (error) {
      console.error('Error in findByEmail:', error);
      throw error;
    }
  }
};

module.exports = Collector;