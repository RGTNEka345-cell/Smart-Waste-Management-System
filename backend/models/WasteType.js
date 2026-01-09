const db = require("../config/database");

const WasteType = {
  create: (name, description) => {
    const sql = `INSERT INTO wastetypes (name, description) VALUES (?, ?)`;
    return db.execute(sql, [name, description]);
  },

  getAll: () => {
    const sql = `SELECT * FROM wastetypes ORDER BY created_at DESC`;
    return db.execute(sql);
  },

  deleteById: (id) => {
    const sql = `DELETE FROM wastetypes WHERE id = ?`;
    return db.execute(sql, [id]);
  }
};

module.exports = WasteType;
