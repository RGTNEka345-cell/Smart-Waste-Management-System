const db = require("../config/database");

const FactoryDetails = {
  createFactory: async (data) => {
    const sql = `
      INSERT INTO Factory_Details 
      (collector_id, factory_name, factory_licence_no, operating_hours,
       waste_types_accepted, factory_address, factory_contact,
       factory_latitude, factory_longitude)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    try {
      const [result] = await db.execute(sql, data);
      return result.insertId;
    } catch (error) {
      console.error('Error in createFactory:', error);
      throw error;
    }
  }
};

module.exports = FactoryDetails;