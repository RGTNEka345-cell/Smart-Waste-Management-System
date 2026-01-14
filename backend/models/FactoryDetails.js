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
    return await db.execute(sql, data);
  }
};

module.exports = FactoryDetails;
